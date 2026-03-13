export const runtime = 'nodejs';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const FETCH_INTERVAL = 24 * 60 * 60 * 1000;
const ARCHIVE_KEY = 'chaosdesk:archive';
const SENTINEL_KEY = 'chaosdesk:sentinel';
const LAST_FETCH_KEY = 'chaosdesk:last_fetch';
const VIBE_KEY = 'chaosdesk:vibe';

// ── Prompts ───────────────────────────────────────────────

const BASIC_PROMPT = `You are CHAOSDESK. Dark humor, equal-opportunity roasting of ALL sides, no racial slurs.
Return ONLY valid JSON, no markdown, no backticks, no extra text.
SCHEMA (be concise, max 2 sentences per text field):
{"vibe_check":"one brutal sentence","conflicts":[{"id":"slug","name":"official name","meme_title":"ALL CAPS MEME NAME","region":"Europe|Middle East|Africa|Asia|Americas|Pacific","lat":number,"lng":number,"status":"active_combat|escalating|ceasefire|negotiations|frozen","intensity":"low|medium|high|critical","tldr":"latest situation 1-2 sentences","vibe":"emoji + one-liner","hot_take":"equal roast of all sides","sides_roasted":{"Side1":"roast","Side2":"roast","Side3":"roast"}}]}`;

const DETAIL_PROMPT = `You are CHAOSDESK. For each conflict ID provided, return latest news updates and viral memes.
For memes, use classic meme template format with top/bottom text.
Return ONLY valid JSON, no markdown, no backticks, no extra text.
SCHEMA:
{"details":[{"id":"slug","latest_updates":[{"date":"Mon DD","headline":"what happened","detail":"1 sentence"}],"memes":[{"format":"meme template name e.g. Disaster Girl, Drake Hotline, This Is Fine","text":"full meme text","text_top":"TOP TEXT FOR MEME IMAGE","text_bottom":"BOTTOM TEXT FOR MEME IMAGE","source":"Twitter/X|Reddit|TikTok"}],"hypocrisy_flags":["flag"],"historical_parallel":"brief parallel","data_points":{"label":"value"}}]}`;

const ST_PROMPT = `You are SENTINEL — neutral facts only, no humor. For each conflict return verified intel.
Return ONLY valid JSON, no markdown, no backticks.
SCHEMA:
{"conflicts":[{"id":"slug","verified_summary":"neutral 1-2 sentences","updates":[{"headline":"short","body":"2 sentences","sources":["Source"],"utc_hint":"Mon DD"}],"data_points":{"label":"value"}}]}`;

// ── JSON Parser ───────────────────────────────────────────
function parseJ(text) {
  let clean = text
    .replace(/\[\d+\]/g, '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  const start = clean.indexOf('{');
  if (start === -1) throw new Error('No JSON found');

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

  if (end !== -1) return JSON.parse(clean.slice(start, end + 1));
  throw new Error('Could not find end of JSON');
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
    for (const d of details.details) detailMap[d.id] = d;
  }

  for (const c of newConflicts) {
    if (!c.id) continue;
    const det = detailMap[c.id] || {};
    const enriched = { ...c, ...det };

    if (archive[c.id]) {
      const old = archive[c.id];
      const allUpdates = [...(enriched.latest_updates || []), ...(old.latest_updates || [])];
      const seen = new Set();
      enriched.latest_updates = allUpdates.filter(u => {
        if (seen.has(u.headline)) return false;
        seen.add(u.headline);
        return true;
      }).slice(0, 6);
      enriched.memes = [...(enriched.memes || []), ...(old.memes || [])].slice(0, 4);
      // Preserve sides_roasted from new data, fallback to old
      enriched.sides_roasted = enriched.sides_roasted || old.sides_roasted;
      archive[c.id] = { ...old, ...enriched };
    } else {
      archive[c.id] = enriched;
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
    `Today is ${today}. Find 8 most active global armed conflicts and military escalations RIGHT NOW. Must include Ukraine, Gaza, Sudan, Iran-Israel situation. Return ONLY JSON.`,
    2000
  );

  const conflicts = basic.conflicts || [];
  if (conflicts.length === 0) throw new Error('No conflicts returned');

  console.log('Call 2: fetching details + memes...');
  const ids = conflicts.map(c => c.id).join(', ');
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

  const newArchive = enrichArchive({ ...existingArchive }, conflicts, details);
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

    const archive = archiveRaw
      ? (typeof archiveRaw === 'string' ? JSON.parse(archiveRaw) : archiveRaw)
      : {};
    const lastFetch = lastFetchRaw ? parseInt(String(lastFetchRaw)) : 0;
    const sentinel = sentinelRaw
      ? (typeof sentinelRaw === 'string' ? JSON.parse(sentinelRaw) : sentinelRaw)
      : { conflicts: [] };
    const hasArchive = Object.keys(archive).length > 0;

    if (!force && hasArchive && (now - lastFetch) < FETCH_INTERVAL) {
      console.log(`Redis hit — ${Object.keys(archive).length} events, age: ${Math.round((now - lastFetch) / 3600000)}h`);
      const conflicts = sortConflicts(archive);
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
