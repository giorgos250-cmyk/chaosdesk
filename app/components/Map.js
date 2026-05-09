'use client';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

const RED    = '#ff2020';
const ORANGE = '#ff6a00';
const CYAN   = '#00d4ff';
const BG     = '#080d14';
const BORDER = '#2a4a6a';
const TEXT   = '#e8f4ff';
const DIM    = '#7ab0d0';
const LABEL  = '#5a8aaa';

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
  if (source === 'GDELT') return { bg: `${CYAN}20`, border: `${CYAN}60`, color: CYAN };
  if (source === 'WHO')   return { bg: '#ffaa0020', border: '#ffaa0060', color: '#ffaa00' };
  return { bg: `${CYAN}12`, border: `${CYAN}35`, color: DIM };
}

// ── News Modal ─────────────────────────────────────────────────

function NewsModal({ item, onClose }) {
  if (!item) return null;
  const b = badgeStyle(item.source);
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(8,13,20,0.98)', border: `1px solid ${BORDER}`,
          maxWidth: 480, width: '90%', position: 'relative', padding: 24,
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 14,
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Share Tech Mono, monospace', fontSize: 16, color: DIM,
          }}
        >✕</button>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
          <span style={{
            padding: '2px 8px', background: b.bg,
            border: `1px solid ${b.border}`,
            fontFamily: 'Share Tech Mono, monospace', fontSize: 10,
            letterSpacing: '0.08em', color: b.color,
          }}>{item.source}</span>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: LABEL }}>
            {timeAgo(item.date_reported)}
          </span>
        </div>

        <div style={{
          fontFamily: 'Rajdhani, sans-serif', fontSize: 15, color: TEXT,
          lineHeight: 1.55, marginBottom: 20, fontWeight: 500,
        }}>
          {item.description || item.source_url || '—'}
        </div>

        {item.source_url && (
          <button
            onClick={() => window.open(item.source_url, '_blank')}
            style={{
              fontFamily: 'Share Tech Mono, monospace', fontSize: 12,
              letterSpacing: '0.06em', padding: '8px 18px',
              background: 'transparent', border: `1px solid ${CYAN}`,
              color: CYAN, cursor: 'pointer',
            }}
          >
            Άνοιγμα πηγής ↗
          </button>
        )}
      </div>
    </div>
  );
}

// ── Top bar ────────────────────────────────────────────────────

function TopBar({ news, datetime }) {
  const ticker = news.map(n => n.description || '').filter(Boolean).join('   ·   ') || 'Αναμονή δεδομένων…';
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 48, zIndex: 200,
      background: 'rgba(8,13,20,0.92)', borderBottom: `1px solid ${BORDER}`,
      display: 'flex', alignItems: 'center',
    }}>
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

      <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
        <span style={{
          display: 'inline-block', whiteSpace: 'nowrap',
          animation: 'tickerScroll 80s linear infinite',
          fontFamily: 'Share Tech Mono, monospace', fontSize: 12,
          color: CYAN, letterSpacing: '0.04em', fontWeight: 500,
        }}>
          {ticker}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{ticker}
        </span>
      </div>

      <div style={{
        flexShrink: 0, padding: '0 18px', height: '100%',
        borderLeft: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: DIM, fontWeight: 500,
      }}>
        {datetime}
      </div>
    </div>
  );
}

// ── Left panel ─────────────────────────────────────────────────

function LeftPanel({ news, onSelect }) {
  return (
    <div style={{
      position: 'absolute', top: 48, left: 0, width: 210, bottom: 88,
      background: 'rgba(8,13,20,0.92)', borderRight: `1px solid ${BORDER}`,
      zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{
        padding: '9px 14px', borderBottom: `1px solid ${BORDER}`, flexShrink: 0,
        fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: '0.18em', color: DIM, fontWeight: 500,
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
              onClick={() => onSelect(item)}
              style={{
                padding: '9px 14px', borderBottom: `1px solid ${BORDER}30`,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{
                  padding: '2px 6px', background: b.bg,
                  border: `1px solid ${b.border}`,
                  fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                  letterSpacing: '0.08em', color: b.color,
                }}>{item.source}</span>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: LABEL }}>
                  {timeAgo(item.date_reported)}
                </span>
              </div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: TEXT, fontWeight: 500,
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

// ── Right panel — Global Situation ─────────────────────────────

function GlobalPanel({ confirmed, suspected, news }) {
  const totalDeaths = confirmed.reduce((s, c) => s + (c.deaths || 0), 0);
  return (
    <div style={{
      position: 'absolute', top: 48, right: 0, width: 190, zIndex: 200,
      background: 'rgba(8,13,20,0.92)', borderLeft: `1px solid ${BORDER}`,
    }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: `${RED}10` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0,
            animation: 'liveDot 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: '0.18em', color: RED, fontWeight: 700 }}>
            ΠΑΓΚΟΣΜΙΑ ΕΙΚΟΝΑ
          </span>
        </div>
      </div>

      {[
        { label: 'ΝΕΚΡΟΙ',        value: totalDeaths,      color: RED },
        { label: 'ΕΠΙΒΕΒΑΙΩΜΕΝΑ', value: confirmed.length, color: ORANGE },
        { label: 'ΥΠΟΠΤΑ',        value: suspected.length, color: '#ffaa00' },
        { label: 'ΑΝΑΦΟΡΕΣ',      value: news.length,      color: DIM },
      ].map(s => (
        <div key={s.label} style={{
          padding: '9px 14px', borderBottom: `1px solid ${BORDER}25`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: LABEL, fontWeight: 500 }}>{s.label}</span>
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 20, color: s.color, fontWeight: 700 }}>{s.value}</span>
        </div>
      ))}

      <div style={{ margin: '10px', padding: '8px 10px', background: `${RED}10`, border: `1px solid ${RED}40` }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9.5, color: ORANGE, lineHeight: 1.6, fontWeight: 500 }}>
          ⛴ MV HONDIUS · 3† · 8 κρούσματα · → Τενερίφη
        </div>
      </div>
    </div>
  );
}

// ── Bottom HUD ─────────────────────────────────────────────────

function BottomHUD({ confirmed, suspected, news, globalStats }) {
  const totalCases  = confirmed.reduce((s, c) => s + (c.cases  || 0), 0);
  const totalDeaths = confirmed.reduce((s, c) => s + (c.deaths || 0), 0);
  const countries   = new Set(
    [...confirmed, ...suspected].map(c => c.location?.country).filter(Boolean)
  ).size;
  const alerts = globalStats?.alerts || [];

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 210, right: 190, height: 88,
      background: 'rgba(8,13,20,0.92)', borderTop: `1px solid ${BORDER}`,
      zIndex: 200, display: 'flex', alignItems: 'stretch',
    }}>
      {/* Big counter */}
      <div style={{
        padding: '0 22px', borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
      }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: LABEL, letterSpacing: '0.2em', fontWeight: 500 }}>
          ΚΡΟΥΣΜΑΤΑ
        </div>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 34, color: RED, fontWeight: 700, lineHeight: 1 }}>
          {totalCases}
        </div>
      </div>

      {/* 4 stat boxes */}
      <div style={{ flex: 1, padding: '10px 18px', display: 'flex', alignItems: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: '3px 22px' }}>
          {[
            { label: 'ΝΕΚΡΟΙ',   value: totalDeaths },
            { label: 'ΥΠΟΠΤΑ',   value: suspected.length },
            { label: 'ΑΝΑΦΟΡΕΣ', value: news.length },
            { label: 'ΧΩΡΕΣ',    value: countries || 0 },
          ].map(s => (
            <div key={s.label}>
              <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: LABEL, letterSpacing: '0.15em', fontWeight: 500 }}>
                {s.label}
              </div>
              <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 17, color: '#ffffff', fontWeight: 700 }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* WHO alerts */}
      <div style={{
        width: 220, borderLeft: `1px solid ${BORDER}`,
        padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
      }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: LABEL, letterSpacing: '0.15em', marginBottom: 3, fontWeight: 500 }}>
          WHO ΕΙΔΟΠΟΙΗΣΕΙΣ
        </div>
        {!alerts.length && (
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 10, color: DIM }}>Καμία ειδοποίηση</div>
        )}
        {alerts.slice(0, 3).map((a, i) => (
          <div key={i} style={{
            fontFamily: 'Rajdhani, sans-serif', fontSize: 11, lineHeight: 1.25, fontWeight: 500,
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
  const [mapLoaded, setMapLoaded]     = useState(false);
  const [datetime, setDatetime]       = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const mapContainer    = useRef(null);
  const mapRef          = useRef(null);
  const mlRef           = useRef(null);
  const animRef         = useRef(null);
  const popupRef        = useRef(null);
  const clickHandlerRef = useRef(null);

  useEffect(() => {
    fetch('/api/conflicts').then(r => r.json()).then(setData).catch(console.error);
  }, []);

  useEffect(() => {
    const tick = () =>
      setDatetime(new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // Init map once
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    let cancelled = false;
    (async () => {
      const ml = (await import('maplibre-gl')).default;
      if (cancelled) return;
      mlRef.current = ml;
      const map = new ml.Map({
        container: mapContainer.current,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [23.7, 38.0],
        zoom: 5.5,
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

  // Layers — real API data only, no static points
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const ml  = mlRef.current;
    const { confirmed, suspected, riskAreas } = data;

    const caseFeatures = [
      ...confirmed.map(c => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] },
        properties: {
          type: 'confirmed',
          weight: 1.0,
          region: c.location.region || c.location.country || '',
          cases: c.cases || 0,
          date_reported: c.date_reported || '',
          source: c.source || '',
        },
      })),
      ...suspected.map(c => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] },
        properties: {
          type: 'suspected',
          weight: 0.4,
          region: c.location.region || c.location.country || '',
          cases: c.cases || 0,
          date_reported: c.date_reported || '',
          source: c.source || '',
        },
      })),
    ].filter(f => f.geometry.coordinates[0] != null && f.geometry.coordinates[1] != null);

    const riskGJ = {
      type: 'FeatureCollection',
      features: (riskAreas || []).map(r => ({
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [circlePolygon(r.lng, r.lat, 0.9)] },
        properties: { name: r.name, fillOpacity: 0.03 + r.risk_level * 0.018 },
      })),
    };

    // Remove stale layers / sources
    ['case-circles', 'infection-heat', 'risk-fill'].forEach(id => {
      try { if (map.getLayer(id)) map.removeLayer(id); } catch (_) {}
    });
    ['cases', 'risk-areas'].forEach(id => {
      try { if (map.getSource(id)) map.removeSource(id); } catch (_) {}
    });

    // Risk area fills
    map.addSource('risk-areas', { type: 'geojson', data: riskGJ });
    map.addLayer({
      id: 'risk-fill', type: 'fill', source: 'risk-areas',
      paint: { 'fill-color': RED, 'fill-opacity': ['get', 'fillOpacity'] },
    });

    // Cases: heatmap + circles
    map.addSource('cases', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: caseFeatures },
    });

    map.addLayer({
      id: 'infection-heat',
      type: 'heatmap',
      source: 'cases',
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
        'heatmap-intensity': 1.5,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0,   'rgba(0,0,0,0)',
          0.2, 'rgba(80,0,0,0.4)',
          0.5, 'rgba(160,10,10,0.7)',
          0.8, 'rgba(220,20,20,0.85)',
          1,   'rgba(255,60,0,1)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 30, 8, 80],
        'heatmap-opacity': 0.85,
      },
    });

    map.addLayer({
      id: 'case-circles',
      type: 'circle',
      source: 'cases',
      paint: {
        'circle-radius': ['case', ['==', ['get', 'type'], 'confirmed'], 9, 6],
        'circle-color': ['case', ['==', ['get', 'type'], 'confirmed'], '#ff2020', '#ff6a00'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.95,
      },
    });

    // Popup on click — swap handler each data refresh
    if (clickHandlerRef.current) {
      map.off('click', 'case-circles', clickHandlerRef.current);
    }
    clickHandlerRef.current = (e) => {
      if (!e.features.length || !ml) return;
      const p = e.features[0].properties;
      if (popupRef.current) popupRef.current.remove();
      const typeLabel = p.type === 'confirmed' ? 'ΕΠΙΒΕΒΑΙΩΜΕΝΟ' : 'ΥΠΟΠΤΟ';
      const typeColor = p.type === 'confirmed' ? '#ff2020' : '#ff6a00';
      const html = `
        <div style="font-family:'Share Tech Mono',monospace;background:#080d14;border:1px solid #2a4a6a;padding:14px;min-width:180px;">
          <div style="display:inline-block;padding:2px 8px;border:1px solid ${typeColor}55;color:${typeColor};font-size:10px;letter-spacing:0.1em;margin-bottom:8px;">${typeLabel}</div>
          ${p.region ? `<div style="color:#e8f4ff;font-size:13px;margin-bottom:6px;font-family:'Rajdhani',sans-serif;font-weight:600;">${p.region}</div>` : ''}
          ${p.cases ? `<div style="color:#7ab0d0;font-size:10px;margin-bottom:4px;">Κρούσματα: <span style="color:#ffffff">${p.cases}</span></div>` : ''}
          ${p.date_reported ? `<div style="color:#5a8aaa;font-size:9px;margin-bottom:4px;">${p.date_reported}</div>` : ''}
          ${p.source ? `<div style="color:#5a8aaa;font-size:9px;">${p.source}</div>` : ''}
        </div>`;
      popupRef.current = new ml.Popup({ closeButton: false, maxWidth: '260px' })
        .setLngLat(e.lngLat)
        .setHTML(html)
        .addTo(map);
    };
    map.on('click', 'case-circles', clickHandlerRef.current);
    map.on('mouseenter', 'case-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'case-circles', () => { map.getCanvas().style.cursor = ''; });

    // Sine-wave heatmap intensity animation
    if (animRef.current) cancelAnimationFrame(animRef.current);
    let start = null;
    function animateHeat(ts) {
      if (!start) start = ts;
      const intensity = 1.2 + Math.sin(((ts - start) / 3000) * Math.PI * 2) * 0.5;
      if (map.getLayer('infection-heat')) {
        map.setPaintProperty('infection-heat', 'heatmap-intensity', intensity);
      }
      animRef.current = requestAnimationFrame(animateHeat);
    }
    animRef.current = requestAnimationFrame(animateHeat);
  }, [data, mapLoaded]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: BG, overflow: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700&family=Rajdhani:wght@400;500;600&display=swap');
        @keyframes liveDot { 0%,100%{opacity:1;} 50%{opacity:0.25;} }
        @keyframes tickerScroll { 0%{transform:translateX(0);} 100%{transform:translateX(-50%);} }
        .maplibregl-ctrl-bottom-left, .maplibregl-ctrl-bottom-right { display:none!important; }
        .maplibregl-popup-content { background:transparent!important; padding:0!important; box-shadow:none!important; border-radius:0!important; }
        .maplibregl-popup-tip { display:none!important; }
      `}</style>

      <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />

      {/* Scanline overlay */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.035) 2px,rgba(0,0,0,0.035) 4px)',
      }} />

      <TopBar news={data.news} datetime={datetime} />
      <LeftPanel news={data.news} onSelect={setSelectedNews} />
      <GlobalPanel confirmed={data.confirmed} suspected={data.suspected} news={data.news} />
      <BottomHUD
        confirmed={data.confirmed}
        suspected={data.suspected}
        news={data.news}
        globalStats={data.globalStats}
      />
      <NewsModal item={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  );
}
