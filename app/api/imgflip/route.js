export const runtime = 'nodejs';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();
const CACHE_TTL = 30 * 24 * 60 * 60; // 30 days — imgflip URLs are permanent

// Popular 2-text meme templates
const TEMPLATES = [
  181913649, // Drake Hotline Bling
  87743020,  // Two Buttons
  112126428, // Distracted Boyfriend
  55311130,  // This Is Fine
  129242436, // Change My Mind
  27813981,  // Hide the Pain Harold
  131087935, // Running Away Balloon
  61579,     // One Does Not Simply
  100777631, // Is This a Pigeon?
  438680,    // Batman Slapping Robin
];

function templateForId(id) {
  let h = 5381;
  for (let i = 0; i < id.length; i++) h = ((h << 5) + h + id.charCodeAt(i)) & 0xffffffff;
  return TEMPLATES[Math.abs(h) % TEMPLATES.length];
}

function splitText(raw) {
  const text = (raw || '').trim().slice(0, 300);
  for (const sep of ['...', ' / ', '\n', ' — ', ' - ']) {
    const idx = text.indexOf(sep);
    if (idx > 8 && idx < text.length - 4) {
      return [
        text.slice(0, idx + sep.length).trim().slice(0, 100),
        text.slice(idx + sep.length).trim().slice(0, 100),
      ];
    }
  }
  const words = text.split(' ');
  const mid = Math.ceil(words.length / 2);
  return [
    words.slice(0, mid).join(' ').slice(0, 100),
    words.slice(mid).join(' ').slice(0, 100),
  ];
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const text = searchParams.get('text');

  if (!id || !text) {
    return Response.json({ error: 'Missing id or text' }, { status: 400 });
  }

  const cacheKey = `imgflip:v1:${id}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) return Response.json({ url: cached });

    const [text0, text1] = splitText(text);
    const body = new URLSearchParams({
      template_id: String(templateForId(id)),
      username: process.env.IMGFLIP_USERNAME,
      password: process.env.IMGFLIP_PASSWORD,
      text0,
      text1,
    });

    const r = await fetch('https://api.imgflip.com/caption_image', { method: 'POST', body });
    const data = await r.json();
    if (!data.success) return Response.json({ error: data.error_message }, { status: 400 });

    const url = data.data.url;
    await redis.set(cacheKey, url, { ex: CACHE_TTL });
    return Response.json({ url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
