export const runtime = 'nodejs';

// ── Template ID mapping + search fallback ──────────────────
const TEMPLATE_MAP = {
  'drake hotline': 178591752, 'drake': 178591752, 'drake hotline bling': 178591752,
  'distracted boyfriend': 112126428, 'disaster girl': 97984,
  'change my mind': 129242436, 'two buttons': 87743020,
  'this is fine': 55311130, 'surprised pikachu': 155067746,
  'modern problems': 187102311, 'boardroom meeting': 148909805,
  'boardroom meeting suggestion': 148909805,
  'expanding brain': 93895088, 'galaxy brain': 93895088,
  'roll safe': 89370399, 'one does not simply': 61579,
  'batman slapping robin': 438680, 'is this a pigeon': 100777631,
  'left exit 12': 124822590, 'woman yelling at cat': 188390779,
  'always has been': 252600902, 'trade offer': 309868304,
  'anakin padme': 322841258, 'bernie i am once again': 91545132,
  'buff doge vs cheems': 247375501, 'clown applying makeup': 252758727,
  'gru plan': 131940431, 'grus plan': 131940431,
  'hide the pain harold': 27813981, 'laughing leo': 259237855,
  'monkey puppet': 110163934, 'panik kalm panik': 226297822,
  'spider-man pointing': 110163934, 'stonks': 52223610,
  'waiting skeleton': 4087833, 'uno draw 25': 217743513,
  'they dont know': 284929871, 'sad pablo escobar': 119139145,
  'ill just wait here': 89655, 'say the line bart': 255928224,
  'think mark think': 341570952, 'chad yes': 291258563,
  'squidward window': 101288,
  'tweet': 370867422, 'reaction': 155067746, 'meme': 181913649,
};

const DEFAULT_TEMPLATE = 181913649;

// Search cache to avoid repeated API calls
let memeSearchCache = null;
let cacheTime = 0;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

async function getPopularMemes() {
  if (memeSearchCache && Date.now() - cacheTime < CACHE_DURATION) {
    return memeSearchCache;
  }
  try {
    const r = await fetch('https://api.imgflip.com/get_memes');
    const data = await r.json();
    if (data.success) {
      memeSearchCache = data.data.memes;
      cacheTime = Date.now();
      return memeSearchCache;
    }
  } catch (e) {
    console.error('Failed to fetch meme list:', e.message);
  }
  return [];
}

async function findTemplateId(format) {
  if (!format) return DEFAULT_TEMPLATE;
  const key = format.toLowerCase().trim();

  // 1. Exact match
  if (TEMPLATE_MAP[key]) return TEMPLATE_MAP[key];

  // 2. Partial match in our map
  for (const [name, id] of Object.entries(TEMPLATE_MAP)) {
    if (key.includes(name) || name.includes(key)) return id;
  }

  // 3. Search Imgflip's popular memes list (fallback)
  const memes = await getPopularMemes();
  if (memes.length > 0) {
    const words = key.split(/\s+/);
    // Try to find a meme whose name contains all words
    const match = memes.find(m => {
      const mname = m.name.toLowerCase();
      return words.every(w => mname.includes(w));
    });
    if (match) return parseInt(match.id);

    // Try partial — any word matches
    const partial = memes.find(m => {
      const mname = m.name.toLowerCase();
      return words.some(w => w.length > 3 && mname.includes(w));
    });
    if (partial) return parseInt(partial.id);
  }

  return DEFAULT_TEMPLATE;
}

// ── Route Handler ─────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const conflictId = searchParams.get('id');
    const text = searchParams.get('text') || '';
    const format = searchParams.get('format') || '';
    const textTop = searchParams.get('text0') || searchParams.get('text_top') || '';
    const textBottom = searchParams.get('text1') || searchParams.get('text_bottom') || '';

    if (!conflictId) {
      return Response.json({ error: 'Missing id parameter' }, { status: 400 });
    }

    const username = process.env.IMGFLIP_USERNAME;
    const password = process.env.IMGFLIP_PASSWORD;
    if (!username || !password) {
      return Response.json({ error: 'Imgflip credentials not configured' }, { status: 500 });
    }

    const templateId = await findTemplateId(format);

    let t0 = textTop;
    let t1 = textBottom;
    if (!t0 && !t1 && text) {
      const parts = text.split(/[/|]/).map(s => s.trim()).filter(Boolean);
      if (parts.length >= 2) { t0 = parts[0]; t1 = parts.slice(1).join(' / '); }
      else { t0 = text; t1 = ''; }
    }

    const formData = new URLSearchParams({
      template_id: templateId.toString(),
      username, password,
      text0: t0, text1: t1,
    });

    const response = await fetch('https://api.imgflip.com/caption_image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    const data = await response.json();
    if (data.success) {
      return Response.json({
        url: data.data.url, page_url: data.data.page_url,
        template_id: templateId, conflict_id: conflictId,
      }, { headers: { 'Cache-Control': 's-maxage=86400, stale-while-revalidate=3600' } });
    } else {
      return Response.json({ error: data.error_message || 'Imgflip API error' }, { status: 500 });
    }
  } catch (err) {
    console.error('Imgflip route error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
