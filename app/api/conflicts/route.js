export const runtime = 'nodejs';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const FETCH_INTERVAL = 24 * 60 * 60 * 1000;
const ARCHIVE_KEY = 'chaosdesk:archive';
const SENTINEL_KEY = 'chaosdesk:sentinel';
const LAST_FETCH_KEY = 'chaosdesk:last_fetch';
const VIBE_KEY = 'chaosdesk:vibe';

// ── ID Normalization & Dedup ──────────────────────────────

// Canonical conflict keys — map variant slugs to a single canonical ID
const CANONICAL_MAP = {
  'ukraine': 'ukraine-russia',
  'russia-ukraine': 'ukraine-russia',
  'russia-ukraine-war': 'ukraine-russia',
  'ukraine-war': 'ukraine-russia',
  'ukraine-russia-war': 'ukraine-russia',
  'gaza': 'gaza-israel-hamas',
  'gaza-war': 'gaza-israel-hamas',
  'israel-gaza': 'gaza-israel-hamas',
  'israel-hamas': 'gaza-israel-hamas',
  'israel-hamas-war': 'gaza-israel-hamas',
  'israel-palestine': 'gaza-israel-hamas',
  'gaza-strip': 'gaza-israel-hamas',
  'gaza-strip-conflict': 'gaza-israel-hamas',
  'gaza-israel-hamas-war': 'gaza-israel-hamas',
  'sudan': 'sudan-civil-war',
  'sudan-war': 'sudan-civil-war',
  'sudan-conflict': 'sudan-civil-war',
  'myanmar': 'myanmar-civil-war',
  'myanmar-war': 'myanmar-civil-war',
  'myanmar-conflict': 'myanmar-civil-war',
  'iran-israel': 'iran-israel-shadow-war',
  'iran-israel-conflict': 'iran-israel-shadow-war',
  'iran-israel-war': 'iran-israel-shadow-war',
  'venezuela': 'venezuela-us',
  'us-venezuela': 'venezuela-us',
  'venezuela-crisis': 'venezuela-us',
  'sahel': 'sahel-insurgency',
  'sahel-expansion': 'sahel-insurgency',
  'sahel-militant': 'sahel-insurgency',
  'sahel-militant-expansion': 'sahel-insurgency',
  'sahel-jihadist': 'sahel-insurgency',
  'sahel-jihadist-insurgency': 'sahel-insurgency',
  'congo': 'drc-m23',
  'drc': 'drc-m23',
  'congo-rwanda': 'drc-m23',
  'drc-rwanda': 'drc-m23',
  'drc-rwanda-m23': 'drc-m23',
  'dr-congo-rwanda-m23': 'drc-m23',
  'west-bank': 'west-bank-clashes',
  'west-bank-israeli-palestinian': 'west-bank-clashes',
  'haiti': 'haiti-gang-wars',
  'haiti-gangs': 'haiti-gang-wars',
  'haiti-crisis': 'haiti-gang-wars',
  'mexico': 'mexico-cartel-wars',
  'mexico-cartels': 'mexico-cartel-wars',
  'cambodia-thailand': 'cambodia-thailand-border',
  'cambodia': 'cambodia-thailand-border',
};

function normalizeId(id) {
  if (!id) return 'unknown';
  const slug = id.toLowerCase().trim().replace(/\s+/g, '-');
  return CANONICAL_MAP[slug] || slug;
}

// Additional similarity check by name keywords
function areSameConflict(a, b) {
  if (!a.name || !b.name) return false;
  const nameA = a.name.toLowerCase();
  const nameB = b.name.toLowerCase();
  
  // Extract significant keywords (3+ chars)
  const wordsA = nameA.split(/[\s\-–—,]+/).filter(w => w.length > 2);
  const wordsB = nameB.split(/[\s\-–—,]+/).filter(w => w.length > 2);
  
  // If 2+ significant words overlap, likely same conflict
  const overlap = wordsA.filter(w => wordsB.some(wb => wb.includes(w) || w.includes(wb)));
  return overlap.length >= 2;
}

// Merge two conflict objects, preferring newer data
function mergeConflicts(older, newer) {
  const merged = { ...older, ...newer };
  
  // Merge updates (dedup by headline)
  const allUpdates = [...(newer.latest_updates || []), ...(older.latest_updates || [])];
  const seenHeadlines = new Set();
  merged.latest_updates = allUpdates.filter(u => {
    if (!u.headline || seenHeadlines.has(u.headline)) return false;
    seenHeadlines.add(u.headline);
    return true;
  }).slice(0, 6);
  
  // Merge memes (dedup by text)
  const allMemes = [...(newer.memes || []), ...(older.memes || [])];
  const seenMemes = new Set();
  merged.memes = allMemes.filter(m => {
    const key = (m.text || m.text_top || '').toLowerCase();
    if (seenMemes.has(key)) return false;
    seenMemes.add(key);
    return true;
  }).slice(0, 4);
  
  // Prefer newer fields
  merged.sides_roasted = newer.sides_roasted || older.sides_roasted;
  merged.data_points = { ...(older.data_points || {}), ...(newer.data_points || {}) };
  
  return merged;
}

// Deduplicate entire archive
function deduplicateArchive(archive) {
  const entries = Object.entries(archive);
  const canonical = {};
  
  for (const [id, conflict] of entries) {
    const normId = normalizeId(id);
    
    if (canonical[normId]) {
      // Merge with existing canonical entry
      canonical[normId] = mergeConflicts(canonical[normId], { ...conflict, id: normId });
    } else {
      // Check name similarity with existing entries
      let merged = false;
      for (const [cId, cConflict] of Object.entries(canonical)) {
        if (areSameConflict(conflict, cConflict)) {
          canonical[cId] = mergeConflicts(cConflict, { ...conflict, id: cId });
          merged = true;
          break;
        }
      }
      if (!merged) {
        canonical[normId] = { ...conflict, id: normId };
      }
    }
  }
  
  return canonical;
}

// ── Prompts ───────────────────────────────────────────────

const BASIC_PROMPT = `You are CHAOSDESK — the internet's most unhinged conflict tracker. Gen Z dark humor, equal-opportunity roasting of ALL sides (nobody is safe), zero political correctness but also zero racial/ethnic slurs. You write like a shitposter who has a PhD in geopolitics. Every meme_title should be an ALL CAPS banger that could trend on Twitter. Every hot_take should be brutally funny and roast EVERY side equally. Every vibe should hit like a group chat message.
IMPORTANT: Use consistent, simple slug IDs. Examples: "ukraine-russia", "gaza-israel-hamas", "sudan-civil-war", "myanmar-civil-war". Never use different IDs for the same conflict.
Return ONLY valid JSON, no markdown, no backticks, no extra text.
SCHEMA (be concise, max 2 sentences per text field):
{"vibe_check":"one brutal sentence","conflicts":[{"id":"slug","name":"official name","meme_title":"ALL CAPS meme title that could trend on Twitter","region":"Europe|Middle East|Africa|Asia|Americas|Pacific","lat":number,"lng":number,"status":"active_combat|escalating|ceasefire|negotiations|frozen","intensity":"low|medium|high|critical","tldr":"1-2 sentences explaining it like you're texting a friend","vibe":"emoji + one-liner — must hit like a meme","hot_take":"savage take — roast ALL sides equally","sides_roasted":{"Side1":"short savage roast"}}]}
RULES: meme_title must be absurdly funny ALL CAPS. vibe must start with an emoji. hot_take must roast minimum 2 sides. sides_roasted must have minimum 3 entries and each roast must be savage but fair.`;

const DETAIL_PROMPT = `You are CHAOSDESK. Your memes should be peak internet humor — actually funny, not corporate. Reference real meme templates that exist on Imgflip. text_top and text_bottom should be punchy, ALL CAPS, classic meme format. For each conflict ID provided, return latest news updates and viral memes.
For memes, use classic meme template format with top/bottom text.
Return ONLY valid JSON, no markdown, no backticks, no extra text.
SCHEMA:
{"details":[{"id":"slug","latest_updates":[{"date":"Mon DD","headline":"what happened","detail":"1 sentence"}],"memes":[{"format":"meme template name e.g. Disaster Girl, Drake Hotline, This Is Fine","text":"full meme text","text_top":"TOP TEXT FOR MEME IMAGE","text_bottom":"BOTTOM TEXT FOR MEME IMAGE","source":"Twitter/X|Reddit|TikTok"}],"hypocrisy_flags":["flag"],"historical_parallel":"brief parallel","data_points":{"label":"value"}}]}`;

const ST_PROMPT = `You are SENTINEL — neutral facts only, no humor. For each conflict return verified intel.
Return ONLY valid JSON, no markdown, no backticks.
SCHEMA:
{"conflicts":[{"id":"slug","verified_summary":"neutral 1-2 sentences","updates":[{"headline":"short","body":"2 sentences","sources":["Source"],"utc_hint":"Mon DD"}],"data_points":{"label":"value"}}]}`;

// ── JSON Parser ───────────────────────────────────────────

// Escape unescaped control chars inside JSON string values
function sanitizeJsonStrings(str) {
  let out = '', inStr = false, esc = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (esc) { esc = false; out += ch; continue; }
    if (ch === '\\' && inStr) { esc = true; out += ch; continue; }
    if (ch === '"') { inStr = !inStr; out += ch; continue; }
    if (inStr && ch.charCodeAt(0) < 0x20) {
      const map = { '\n': '\\n', '\r': '\\r', '\t': '\\t', '\b': '\\b', '\f': '\\f' };
      out += map[ch] || `\\u${ch.charCodeAt(0).toString(16).padStart(4,'0')}`;
      continue;
    }
    out += ch;
  }
  return out;
}

function parseJ(text) {
  let clean = text
    .replace(/\[\d+\]/g, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = clean.indexOf('{');
  if (start === -1) throw new Error('No JSON found');

  // Find matching closing brace
  let depth = 0, end = -1, inStr = false, esc = false;
  for (let i = start; i < clean.length; i++) {
    const ch = clean[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
  }

  const slice = end !== -1 ? clean.slice(start, end + 1) : clean.slice(start);

  // Try direct parse after sanitizing control chars
  try { return JSON.parse(sanitizeJsonStrings(slice)); } catch (_) {}

  // Recovery: strip trailing incomplete field, close open structures
  let attempt = sanitizeJsonStrings(slice)
    .replace(/,\s*"[^"]*"\s*:\s*"[^"]*$/, '')
    .replace(/,\s*"[^"]*"\s*:\s*[^,}\]]*$/, '')
    .replace(/,\s*"[^"]*$/, '');

  const opens = [];
  inStr = false; esc = false;
  for (const ch of attempt) {
    if (esc) { esc = false; continue; }
    if (ch === '\\' && inStr) { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') opens.push('}');
    else if (ch === '[') opens.push(']');
    else if (ch === '}' || ch === ']') opens.pop();
  }
  attempt += opens.reverse().join('');

  try { return JSON.parse(attempt); } catch (e) {
    throw new Error(`JSON parse failed: ${e.message}`);
  }
}

async function callPerplexity(systemPrompt, userMsg, maxTokens = 2000) {
  const r = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`
    },
    body: JSON.stringify({
      model: 'sonar-pro',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMsg }
      ],
      temperature: 0.6,
      max_tokens: maxTokens
    })
  });
  if (!r.ok) throw new Error(`Perplexity ${r.status}: ${await r.text()}`);
  const d = await r.json();
  const content = d.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from Perplexity');
  return parseJ(content);
}

// ── Archive helpers ───────────────────────────────────────
function enrichArchive(archive, newConflicts, details) {
  const detailMap = {};
  if (details?.details) {
    for (const d of details.details) {
      const normId = normalizeId(d.id);
      detailMap[normId] = d;
    }
  }

  for (const c of newConflicts) {
    if (!c.id) continue;
    const normId = normalizeId(c.id);
    const det = detailMap[normId] || {};
    const enriched = { ...c, ...det, id: normId };

    if (archive[normId]) {
      archive[normId] = mergeConflicts(archive[normId], enriched);
    } else {
      archive[normId] = enriched;
    }
  }
  return archive;
}

function sortConflicts(archive) {
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return Object.values(archive).sort((a, b) =>
    (order[a.intensity] ?? 4) - (order[b.intensity] ?? 4)
  );
}

// ── Main fetch ────────────────────────────────────────────
async function fetchFreshData(existingArchive) {
  const today = new Date().toDateString();

  console.log('Call 1: fetching basic conflicts...');
  const basic = await callPerplexity(
    BASIC_PROMPT,
    `Today is ${today}. Find 8 most active global armed conflicts and military escalations RIGHT NOW. Include Ukraine, Gaza, Sudan, Iran-Israel. Make it unhinged but factual. The vibe_check should be one devastating sentence that would get 100K likes on Twitter. Use simple consistent slug IDs. Return ONLY JSON.`,
    2000
  );

  const conflicts = basic.conflicts || [];
  if (conflicts.length === 0) throw new Error('No conflicts returned');

  console.log('Call 2: fetching details + memes...');
  const ids = conflicts.map(c => normalizeId(c.id)).join(', ');
  let details = { details: [] };
  try {
    details = await callPerplexity(
      DETAIL_PROMPT,
      `Today is ${today}. For these conflicts: ${ids}. Find latest news (last 48h) and viral memes/reactions for each. Use classic meme templates with top/bottom text. Return ONLY JSON.`,
      2500
    );
  } catch (e) {
    console.log('Details call failed, continuing without:', e.message);
  }

  // Enrich then deduplicate
  let newArchive = enrichArchive({ ...existingArchive }, conflicts, details);
  newArchive = deduplicateArchive(newArchive);
  
  const sorted = sortConflicts(newArchive);

  await Promise.all([
    redis.set(ARCHIVE_KEY, JSON.stringify(newArchive)),
    redis.set(VIBE_KEY, basic.vibe_check || '2026: peak chaos, zero chill'),
    redis.set(LAST_FETCH_KEY, Date.now().toString())
  ]);

  let sentinel = { conflicts: [] };
  try {
    console.log('Call 3: fetching sentinel...');
    sentinel = await callPerplexity(
      ST_PROMPT,
      `For these conflicts: ${JSON.stringify(sorted.slice(0, 8).map(c => ({ id: c.id, name: c.name })))}. Return verified intel. ONLY JSON.`,
      2000
    );
    await redis.set(SENTINEL_KEY, JSON.stringify(sentinel));
  } catch (e) {
    console.log('Sentinel call failed, continuing:', e.message);
  }

  return {
    chaos: {
      generated_at: new Date().toISOString(),
      vibe_check: basic.vibe_check || '2026: peak chaos, zero chill',
      total_active_conflicts: sorted.length,
      conflicts: sorted
    },
    sentinel
  };
}

// ── Route Handler ─────────────────────────────────────────
export async function GET(request) {
  try {
    const now = Date.now();
    const force = new URL(request.url).searchParams.get('force') === 'true';

    const [archiveRaw, lastFetchRaw, sentinelRaw, vibe] = await Promise.all([
      redis.get(ARCHIVE_KEY),
      redis.get(LAST_FETCH_KEY),
      redis.get(SENTINEL_KEY),
      redis.get(VIBE_KEY)
    ]);

    let archive = archiveRaw
      ? (typeof archiveRaw === 'string' ? JSON.parse(archiveRaw) : archiveRaw)
      : {};
    const lastFetch = lastFetchRaw ? parseInt(String(lastFetchRaw)) : 0;
    const sentinel = sentinelRaw
      ? (typeof sentinelRaw === 'string' ? JSON.parse(sentinelRaw) : sentinelRaw)
      : { conflicts: [] };
    const hasArchive = Object.keys(archive).length > 0;

    // Always dedup on read (cleans up legacy data)
    if (hasArchive) {
      archive = deduplicateArchive(archive);
    }

    if (!force && hasArchive && (now - lastFetch) < FETCH_INTERVAL) {
      console.log(`Redis hit — ${Object.keys(archive).length} events, age: ${Math.round((now - lastFetch) / 3600000)}h`);
      const conflicts = sortConflicts(archive);
      
      // Save cleaned archive back
      await redis.set(ARCHIVE_KEY, JSON.stringify(archive));
      
      return Response.json({
        chaos: {
          generated_at: new Date().toISOString(),
          vibe_check: typeof vibe === 'string' ? vibe : '2026: peak chaos, zero chill',
          total_active_conflicts: conflicts.length,
          conflicts
        },
        sentinel
      }, { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' } });
    }

    console.log('Redis miss — fetching fresh data...');
    const data = await fetchFreshData(archive);
    return Response.json(data, {
      headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' }
    });

  } catch (err) {
    console.error('CHAOSDESK ERROR:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
