'use client';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

// ── Color system ───────────────────────────────────────────────
const RED    = '#ff2020';
const ORANGE = '#ff6a00';
const CYAN   = '#00ffcc';
const BG     = '#080d14';
const BORDER = '#1e3a5f';
const SURFACE = '#0d1520';
const TEXT   = '#c8d8e8';
const DIM    = '#3a5a6a';

// ── Helpers ────────────────────────────────────────────────────

function timeAgo(str) {
  if (!str) return '';
  let d;
  if (/^\d{8}T\d{6}Z$/.test(str)) {
    d = new Date(str.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
  } else {
    d = new Date(str);
  }
  if (isNaN(d)) return '';
  const s = (Date.now() - d) / 1000;
  if (s < 60)    return 'μόλις τώρα';
  if (s < 3600)  return `${Math.floor(s / 60)}λ πριν`;
  if (s < 86400) return `${Math.floor(s / 3600)}ω πριν`;
  return `${Math.floor(s / 86400)}μ πριν`;
}

function circlePolygon(lng, lat, r = 0.9, steps = 32) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * 2 * Math.PI;
    pts.push([lng + r * Math.cos(a), lat + r * 0.72 * Math.sin(a)]);
  }
  return pts;
}

function badgeStyle(source) {
  if (source === 'GDELT')  return { bg: `${CYAN}1a`, border: `${CYAN}55`, color: CYAN };
  if (source === 'WHO')    return { bg: '#ffaa0018', border: '#ffaa0055', color: '#ffaa00' };
  return { bg: `${CYAN}0d`, border: `${CYAN}28`, color: `${CYAN}77` };
}

// ── Top bar ────────────────────────────────────────────────────

function TopBar({ news, datetime }) {
  const ticker = news.map(n => n.description || '').filter(Boolean).join('   ·   ') || 'Αναμονή δεδομένων…';
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 48, zIndex: 200,
      background: `${BG}f0`, borderBottom: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center',
    }}>
      {/* Logo */}
      <div style={{
        flexShrink: 0, padding: '0 18px', height: '100%',
        borderRight: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 15, letterSpacing: '0.2em', color: RED, fontWeight: 700 }}>
          HANTAMAP
        </span>
        <span style={{
          width: 7, height: 7, borderRadius: '50%', background: RED, flexShrink: 0,
          boxShadow: `0 0 8px ${RED}`, animation: 'liveDot 1.4s ease-in-out infinite',
        }} />
      </div>

      {/* Ticker */}
      <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
        <span style={{
          display: 'inline-block', whiteSpace: 'nowrap',
          animation: 'tickerScroll 80s linear infinite',
          fontFamily: 'Share Tech Mono, monospace', fontSize: 12, color: DIM, letterSpacing: '0.04em',
        }}>
          {ticker}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ticker}
        </span>
      </div>

      {/* Clock */}
      <div style={{
        flexShrink: 0, padding: '0 18px', height: '100%',
        borderLeft: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: DIM,
      }}>
        {datetime}
      </div>
    </div>
  );
}

// ── Left panel ─────────────────────────────────────────────────

function LeftPanel({ news }) {
  return (
    <div style={{
      position: 'absolute', top: 48, left: 0, width: 210, bottom: 88,
      background: `${BG}e8`, borderRight: `1px solid ${BORDER}`,
      zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        padding: '9px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
        fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: '0.18em', color: DIM,
      }}>
        ΑΝΑΦΟΡΕΣ LIVE
      </div>

      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {!news.length && (
          <div style={{ padding: '16px 14px', fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: DIM }}>
            Φόρτωση…
          </div>
        )}
        {news.map((item, i) => {
          const b = badgeStyle(item.source);
          return (
            <div
              key={item.id || i}
              onClick={() => item.source_url && window.open(item.source_url, '_blank')}
              style={{
                padding: '9px 14px', borderBottom: `1px solid ${BORDER}1a`,
                cursor: item.source_url ? 'pointer' : 'default',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{
                  padding: '2px 6px', background: b.bg,
                  border: `1px solid ${b.border}`, borderRadius: 2,
                  fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                  letterSpacing: '0.08em', color: b.color,
                }}>{item.source}</span>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: DIM }}>
                  {timeAgo(item.date_reported)}
                </span>
              </div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: TEXT,
                lineHeight: 1.35, wordBreak: 'break-word',
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {item.description || item.source_url || '—'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Right panel — MV Hondius ────────────────────────────────────

function RightPanel() {
  return (
    <div style={{
      position: 'absolute', top: 48, right: 0, width: 190, zIndex: 200,
      background: `${BG}e8`, borderLeft: `1px solid ${BORDER}`,
    }}>
      {/* Header */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: `${RED}0d` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0,
            animation: 'liveDot 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: '0.18em', color: RED }}>
            ΕΚΤΑΚΤΟ
          </span>
        </div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 15, color: TEXT, fontWeight: 600, letterSpacing: '0.04em' }}>
          MV HONDIUS
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: DIM, marginTop: 2 }}>
          Κρουαζιερόπλοιο · Andes Virus
        </div>
      </div>

      {[
        { label: 'ΝΕΚΡΟΙ',   value: '3',   color: RED },
        { label: 'ΚΡΟΥΣΜΑΤΑ', value: '8',  color: ORANGE },
        { label: 'ΕΠΙΒΑTΕΣ', value: '147', color: DIM },
      ].map(s => (
        <div key={s.label} style={{
          padding: '9px 14px', borderBottom: `1px solid ${BORDER}1a`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: DIM }}>{s.label}</span>
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 20, color: s.color, fontWeight: 700 }}>{s.value}</span>
        </div>
      ))}

      <div style={{ padding: '9px 14px', borderBottom: `1px solid ${BORDER}1a` }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: DIM, marginBottom: 4 }}>ETA TENERIFE</div>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: ORANGE, fontWeight: 600 }}>
          11 Μαΐου 2026
        </div>
      </div>

      <div style={{ padding: '9px 14px' }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: DIM, marginBottom: 5 }}>ΣΤΕΛΕΧΟΣ</div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: CYAN }}>
          Andes orthohantavirus
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: DIM, marginTop: 5, lineHeight: 1.5 }}>
          Μόνο είδος με ανθρωπογενή μετάδοση
        </div>
      </div>
    </div>
  );
}

// ── Bottom HUD ─────────────────────────────────────────────────

function BottomHUD({ confirmed, suspected, news, globalStats, riskAreas }) {
  const totalCases  = confirmed.reduce((s, c) => s + (c.cases  || 0), 0);
  const totalDeaths = confirmed.reduce((s, c) => s + (c.deaths || 0), 0);
  const countries   = new Set(
    [...confirmed, ...suspected].map(c => c.location?.country).filter(Boolean)
  ).size;
  const alerts = globalStats?.alerts || [];

  const RISK_COLORS = { 5: RED, 4: ORANGE, 3: '#ffaa00', 2: '#88bb00', 1: '#007799' };

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 210, right: 190, height: 88,
      background: `${BG}f0`, borderTop: `1px solid ${BORDER}`,
      zIndex: 200, display: 'flex', alignItems: 'stretch',
    }}>
      {/* Big counter */}
      <div style={{
        padding: '0 22px', borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
      }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: DIM, letterSpacing: '0.2em' }}>
          ΚΡΟΥΣΜΑΤΑ
        </div>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 34, color: RED, fontWeight: 700, lineHeight: 1 }}>
          {totalCases}
        </div>
      </div>

      {/* Stats + risk bars */}
      <div style={{ flex: 1, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '3px 22px' }}>
          {[
            { label: 'ΝΕΚΡΟΙ',   value: totalDeaths,    color: RED },
            { label: 'ΥΠΟΠΤΑ',   value: suspected.length, color: ORANGE },
            { label: 'ΑΝΑΦΟΡΕΣ', value: news.length,    color: CYAN },
            { label: 'ΧΩΡΕΣ',    value: countries || 0, color: DIM },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: DIM, letterSpacing: '0.15em' }}>
                {s.label}
              </div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 17, color: s.color, fontWeight: 700 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ borderLeft: `1px solid ${BORDER}`, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: DIM, letterSpacing: '0.15em', marginBottom: 2 }}>
            ΖΩΝΕΣ ΚΙΝΔΥΝΟΥ
          </div>
          {(riskAreas || []).map(r => (
            <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: r.risk_level * 11, height: 3, borderRadius: 2,
                background: RISK_COLORS[r.risk_level] || DIM, opacity: 0.85,
              }} />
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 10, color: DIM }}>
                {r.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* WHO alerts */}
      <div style={{
        width: 220, borderLeft: `1px solid ${BORDER}`,
        padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
      }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: DIM, letterSpacing: '0.15em', marginBottom: 3 }}>
          WHO ΕΙΔΟΠΟΙΗΣΕΙΣ
        </div>
        {!alerts.length && (
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: DIM }}>Καμία ειδοποίηση</div>
        )}
        {alerts.slice(0, 3).map((a, i) => (
          <div key={i} style={{
            fontFamily: 'Rajdhani, sans-serif', fontSize: 11, lineHeight: 1.25,
            color: i === 0 ? ORANGE : DIM,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {a.title}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Map ────────────────────────────────────────────────────────

export default function MapView() {
  const [data, setData] = useState({
    confirmed: [], suspected: [], news: [], globalStats: {}, riskAreas: [],
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [datetime, setDatetime] = useState('');
  const mapContainer = useRef(null);
  const mapRef       = useRef(null);
  const animRef      = useRef(null);

  // Fetch data
  useEffect(() => {
    fetch('/api/conflicts').then(r => r.json()).then(setData).catch(console.error);
  }, []);

  // Clock
  useEffect(() => {
    const tick = () =>
      setDatetime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // Init map (once)
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    let cancelled = false;
    (async () => {
      const ml = (await import('maplibre-gl')).default;
      if (cancelled) return;
      const map = new ml.Map({
        container: mapContainer.current,
        style: {
          version: 8,
          sources: {
            carto: {
              type: 'raster',
              tiles: [
                'https://a.basemaps.cartocdn.com/dark_matter_all/{z}/{x}/{y}.png',
                'https://b.basemaps.cartocdn.com/dark_matter_all/{z}/{x}/{y}.png',
                'https://c.basemaps.cartocdn.com/dark_matter_all/{z}/{x}/{y}.png',
                'https://d.basemaps.cartocdn.com/dark_matter_all/{z}/{x}/{y}.png',
              ],
              tileSize: 256,
            },
          },
          layers: [{ id: 'carto-bg', type: 'raster', source: 'carto' }],
        },
        center: [23.7, 38.0],
        zoom: 6,
        minZoom: 4,
        maxZoom: 14,
        attributionControl: false,
      });
      mapRef.current = map;
      map.on('load', () => setMapLoaded(true));
    })();
    return () => {
      cancelled = true;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // Add / refresh layers whenever data arrives and map is ready
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const { confirmed, suspected, riskAreas } = data;

    // Build GeoJSON
    const casesGJ = {
      type: 'FeatureCollection',
      features: [
        ...confirmed.map(c => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] },
          properties: { kind: 'confirmed', severity: c.severity || 'medium', cases: c.cases || 0, w: 1.0 },
        })),
        ...suspected.map(c => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] },
          properties: { kind: 'suspected', severity: c.severity || 'low', cases: c.cases || 0, w: 0.4 },
        })),
      ].filter(f => f.geometry.coordinates[0] != null && f.geometry.coordinates[1] != null),
    };

    const riskGJ = {
      type: 'FeatureCollection',
      features: (riskAreas || []).map(r => ({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [circlePolygon(r.lng, r.lat, 0.9)] },
        properties: { name: r.name, fillOpacity: 0.03 + r.risk_level * 0.018 },
      })),
    };

    // Remove stale layers/sources
    const layerIds = ['case-pins', 'case-pins-pulse', 'infection-heat', 'risk-fill'];
    const srcIds   = ['cases', 'risk-areas'];
    layerIds.forEach(id => { try { if (map.getLayer(id)) map.removeLayer(id); } catch (_) {} });
    srcIds.forEach(id => { try { if (map.getSource(id)) map.removeSource(id); } catch (_) {} });

    // 1. Risk area fills
    map.addSource('risk-areas', { type: 'geojson', data: riskGJ });
    map.addLayer({
      id: 'risk-fill', type: 'fill', source: 'risk-areas',
      paint: { 'fill-color': RED, 'fill-opacity': ['get', 'fillOpacity'] },
    });

    // 2. Cases source
    map.addSource('cases', { type: 'geojson', data: casesGJ });

    // 3. Heatmap
    map.addLayer({
      id: 'infection-heat', type: 'heatmap', source: 'cases',
      paint: {
        'heatmap-weight': ['get', 'w'],
        'heatmap-intensity': 0.9,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0,   'rgba(0,0,0,0)',
          0.1, '#080000',
          0.3, '#2a0000',
          0.55,'#7a0000',
          0.8, '#cc1010',
          1.0, '#ff7700',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 5, 40, 10, 80],
        'heatmap-opacity': 0.85,
      },
    });

    // 4. Pulsing ring (animated via rAF)
    map.addLayer({
      id: 'case-pins-pulse', type: 'circle', source: 'cases',
      paint: {
        'circle-radius': 8,
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-width': 2,
        'circle-stroke-color': ['match', ['get', 'kind'], 'confirmed', RED, ORANGE],
        'circle-stroke-opacity': 0.9,
      },
    });

    // 5. Solid pins
    map.addLayer({
      id: 'case-pins', type: 'circle', source: 'cases',
      paint: {
        'circle-radius': ['match', ['get', 'kind'], 'confirmed', 8, 6],
        'circle-color':  ['match', ['get', 'kind'], 'confirmed', RED, ORANGE],
        'circle-stroke-width': ['match', ['get', 'kind'], 'confirmed', 2, 1.5],
        'circle-stroke-color': '#ffffff',
      },
    });

    // Animation loop
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const t0 = performance.now();
    function frame(now) {
      const t = (now - t0) / 1000;
      // Heatmap pulse: 0.6 → 1.2 over 3s
      try { map.setPaintProperty('infection-heat', 'heatmap-intensity', 0.9 + 0.3 * Math.sin((t / 3) * 2 * Math.PI)); } catch (_) {}
      // Ring pulse: radius 8→20, opacity 1→0 over 2s cycle
      const phase = (t % 2) / 2;
      try {
        map.setPaintProperty('case-pins-pulse', 'circle-radius', 8 + 12 * phase);
        map.setPaintProperty('case-pins-pulse', 'circle-stroke-opacity', 1 - phase);
      } catch (_) {}
      animRef.current = requestAnimationFrame(frame);
    }
    animRef.current = requestAnimationFrame(frame);
  }, [data, mapLoaded]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: BG, overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&family=Rajdhani:wght@400;600&display=swap');
        @keyframes liveDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.25; }
        }
        @keyframes tickerScroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .maplibregl-ctrl-bottom-left,
        .maplibregl-ctrl-bottom-right { display: none !important; }
      `}</style>

      {/* Map */}
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />

      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.035) 2px, rgba(0,0,0,0.035) 4px)',
      }} />

      {/* HUD overlays */}
      <TopBar   news={data.news} datetime={datetime} />
      <LeftPanel news={data.news} />
      <RightPanel />
      <BottomHUD
        confirmed={data.confirmed}
        suspected={data.suspected}
        news={data.news}
        globalStats={data.globalStats}
        riskAreas={data.riskAreas}
      />
    </div>
  );
}
