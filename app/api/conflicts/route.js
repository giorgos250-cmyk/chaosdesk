export const runtime = 'nodejs';
import { Redis } from '@upstash/redis';
import { XMLParser } from 'fast-xml-parser';

const redis = Redis.fromEnv();
const xmlParser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@_' });

const KEYS = {
  confirmed: 'hantamap:confirmed',
  suspected: 'hantamap:suspected',
  news: 'hantamap:news',
  global: 'hantamap:global',
};

const TTL = {
  confirmed: 86400,
  suspected: 21600,
  news: 21600,
  global: 86400,
};

const RISK_AREAS = [
  { name: 'Θεσσαλία',              lat: 39.5, lng: 22.0, risk_level: 5, country: 'GR' },
  { name: 'Ήπειρος',               lat: 39.5, lng: 20.7, risk_level: 4, country: 'GR' },
  { name: 'Δυτική Μακεδονία',      lat: 40.3, lng: 21.8, risk_level: 4, country: 'GR' },
  { name: 'Βόρεια Ελλάδα (δάση)',  lat: 41.0, lng: 24.0, risk_level: 3, country: 'GR' },
  { name: 'Πελοπόννησος (αγροτική)', lat: 37.5, lng: 22.3, risk_level: 2, country: 'GR' },
];

// ── Helpers ───────────────────────────────────────────────────

function makeId(source, ...parts) {
  return `${source}-${parts.join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48)}`;
}

function isHanta(str) {
  return /hantavirus|hantavir|hanta\b/i.test(str);
}

function isGRCY(str) {
  return /greece|cyprus|greek|cypriot|ελλάδ|κύπρ|ελληνικ/i.test(str);
}

function stripTags(str) {
  return String(str || '').replace(/<[^>]+>/g, '').trim();
}

async function getCached(key) {
  const raw = await redis.get(key);
  if (!raw) return null;
  try { return typeof raw === 'string' ? JSON.parse(raw) : raw; } catch { return null; }
}

async function setCached(key, value, ttl) {
  await redis.set(key, JSON.stringify(value), { ex: ttl });
}

async function fetchRSS(url) {
  const r = await fetch(url, {
    headers: { 'User-Agent': 'HantaMap/1.0 hantavirus-surveillance-GR-CY' },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${url}`);
  const text = await r.text();
  const parsed = xmlParser.parse(text);
  const channel = parsed?.rss?.channel || parsed?.feed;
  const items = channel?.item || channel?.entry || [];
  return Array.isArray(items) ? items : [items];
}

// ── ECDC ──────────────────────────────────────────────────────

async function fetchECDC() {
  const url = 'https://opendata.ecdc.europa.eu/hantavirus/hantavirusannualdata/json/';
  const r = await fetch(url);
  if (!r.ok) throw new Error(`ECDC ${r.status}`);
  const json = await r.json();
  const records = Array.isArray(json) ? json : (json.records || json.data || []);

  const confirmed = [];
  const suspected = [];

  for (const rec of records) {
    const cc = String(rec.CountryCode || rec.ReportingCountry || rec.country_code || '').toUpperCase();
    if (cc !== 'GR' && cc !== 'CY') continue;

    const isGR = cc === 'GR';
    const cases = parseInt(rec.NumberOfCases || rec.cases || 0, 10) || 0;
    const deaths = parseInt(rec.NumberOfDeaths || rec.deaths || 0, 10) || 0;

    const obj = {
      id: makeId('ecdc', cc, String(rec.Year || rec.year || '')),
      type: 'confirmed',
      location: {
        country: isGR ? 'Greece' : 'Cyprus',
        region: rec.Region || null,
        prefecture: rec.Province || null,
        lat: isGR ? 39.0 : 35.1,
        lng: isGR ? 22.0 : 33.4,
      },
      cases,
      deaths,
      hospitalized: parseInt(rec.Hospitalized || 0, 10) || null,
      date_reported: String(rec.Year || rec.year || ''),
      source: 'ECDC',
      source_url: 'https://www.ecdc.europa.eu/en/hantavirus-infection',
      description: null,
      severity: deaths > 0 ? 'high' : cases > 5 ? 'medium' : 'low',
      virus_strain: rec.SerotypeName || rec.PathogenType || null,
    };

    (cases > 0 ? confirmed : suspected).push(obj);
  }

  return { confirmed, suspected };
}

// ── ProMED ────────────────────────────────────────────────────

async function fetchProMED() {
  const items = await fetchRSS('https://promedmail.org/feed/');
  const news = [];

  for (const item of items) {
    const title = String(item.title || '');
    const desc = stripTags(item.description || item.summary || '');
    if (!isHanta(`${title} ${desc}`) || !isGRCY(`${title} ${desc}`)) continue;

    const isCY = /κύπρ|cyprus|cypriot/i.test(`${title} ${desc}`);

    news.push({
      id: makeId('promed', title.slice(0, 30), String(item.pubDate || Date.now())),
      type: 'news',
      location: {
        country: isCY ? 'Cyprus' : 'Greece',
        region: null,
        prefecture: null,
        lat: isCY ? 35.1 : 39.0,
        lng: isCY ? 33.4 : 22.0,
      },
      cases: null,
      deaths: null,
      hospitalized: null,
      date_reported: item.pubDate || null,
      source: 'ProMED',
      source_url: String(item.link || 'https://promedmail.org'),
      description: desc.slice(0, 400) || null,
      severity: null,
      virus_strain: null,
    });
  }

  return news;
}

// ── Google News ───────────────────────────────────────────────

async function fetchGoogleNews() {
  // Greek characters pre-encoded for reliability
  // ελλάδα → %CE%B5%CE%BB%CE%BB%CE%AC%CE%B4%CE%B1
  // κύπρος → %CE%BA%CF%8D%CF%80%CF%81%CE%BF%CF%82
  const feeds = [
    {
      url: 'https://news.google.com/rss/search?q=hantavirus+%CE%B5%CE%BB%CE%BB%CE%AC%CE%B4%CE%B1&hl=el&gl=GR&ceid=GR:el',
      country: 'Greece', lat: 39.0, lng: 22.0,
    },
    {
      url: 'https://news.google.com/rss/search?q=hantavirus+%CE%BA%CF%8D%CF%80%CF%81%CE%BF%CF%82&hl=el&gl=CY&ceid=CY:el',
      country: 'Cyprus', lat: 35.1, lng: 33.4,
    },
  ];

  const news = [];

  for (const feed of feeds) {
    try {
      const items = await fetchRSS(feed.url);
      for (const item of items) {
        const title = String(item.title || '');
        const desc = stripTags(item.description || '');
        if (!isHanta(`${title} ${desc}`)) continue;

        news.push({
          id: makeId('gnews', feed.country, title.slice(0, 30), String(item.pubDate || Date.now())),
          type: 'news',
          location: {
            country: feed.country,
            region: null,
            prefecture: null,
            lat: feed.lat,
            lng: feed.lng,
          },
          cases: null,
          deaths: null,
          hospitalized: null,
          date_reported: item.pubDate || null,
          source: 'Google News',
          source_url: String(item.link || ''),
          description: desc.slice(0, 300) || null,
          severity: null,
          virus_strain: null,
        });
      }
    } catch (e) {
      console.warn(`Google News (${feed.country}) failed:`, e.message);
    }
  }

  return news;
}

// ── WHO global stats panel ─────────────────────────────────────

async function fetchWHO() {
  const items = await fetchRSS('https://www.who.int/feeds/entity/csr/don/en/rss.xml');
  const alerts = [];

  for (const item of items) {
    const title = String(item.title || '');
    const desc = stripTags(item.description || '');
    if (!isHanta(`${title} ${desc}`)) continue;

    alerts.push({
      title,
      date: item.pubDate || null,
      url: String(item.link || ''),
      summary: desc.slice(0, 300),
    });
  }

  return {
    source: 'WHO',
    last_updated: new Date().toISOString(),
    alerts,
    total_alerts: alerts.length,
  };
}

// ── Route handler ─────────────────────────────────────────────

export async function GET(request) {
  try {
    const force = new URL(request.url).searchParams.get('force') === 'true';

    const [cachedConfirmed, cachedSuspected, cachedNews, cachedGlobal] = await Promise.all([
      getCached(KEYS.confirmed),
      getCached(KEYS.suspected),
      getCached(KEYS.news),
      getCached(KEYS.global),
    ]);

    const needsEcdc = force || !cachedConfirmed || !cachedSuspected;
    const needsNews  = force || !cachedNews;
    const needsWho   = force || !cachedGlobal;

    if (!needsEcdc && !needsNews && !needsWho) {
      return Response.json(
        { confirmed: cachedConfirmed, suspected: cachedSuspected, news: cachedNews, globalStats: cachedGlobal, riskAreas: RISK_AREAS },
        { headers: { 'Cache-Control': 's-maxage=21600, stale-while-revalidate=3600' } }
      );
    }

    let confirmed  = cachedConfirmed || [];
    let suspected  = cachedSuspected || [];
    let news       = cachedNews      || [];
    let globalStats = cachedGlobal   || { source: 'WHO', alerts: [], total_alerts: 0 };

    const tasks = [];

    if (needsEcdc) {
      tasks.push(
        fetchECDC()
          .then(({ confirmed: c, suspected: s }) => {
            if (c.length) confirmed = c;
            if (s.length) suspected = s;
          })
          .catch(e => console.warn('ECDC failed:', e.message))
      );
    }

    if (needsNews) {
      tasks.push(
        Promise.allSettled([fetchProMED(), fetchGoogleNews()])
          .then(results => {
            const fresh = [];
            for (const r of results) {
              if (r.status === 'fulfilled') fresh.push(...r.value);
              else console.warn('News source failed:', r.reason?.message);
            }
            if (fresh.length) news = fresh;
          })
      );
    }

    if (needsWho) {
      tasks.push(
        fetchWHO()
          .then(stats => { globalStats = stats; })
          .catch(e => console.warn('WHO failed:', e.message))
      );
    }

    await Promise.all(tasks);

    await Promise.all([
      needsEcdc && setCached(KEYS.confirmed, confirmed, TTL.confirmed),
      needsEcdc && setCached(KEYS.suspected, suspected, TTL.suspected),
      needsNews && setCached(KEYS.news, news, TTL.news),
      needsWho  && setCached(KEYS.global, globalStats, TTL.global),
    ].filter(Boolean));

    return Response.json(
      { confirmed, suspected, news, globalStats, riskAreas: RISK_AREAS },
      { headers: { 'Cache-Control': 's-maxage=21600, stale-while-revalidate=3600' } }
    );

  } catch (err) {
    console.error('HantaMap error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
