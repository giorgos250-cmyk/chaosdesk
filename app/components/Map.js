'use client';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

const RED      = '#ff2020';
const ORANGE   = '#ff6a00';
const CYAN     = '#00d4ff';
const BG       = '#060d15';
const BORDER   = '#2a4a6a';
const TEXT     = '#e8f4ff';
const DIM      = '#7ab0d0';
const LABEL    = '#5a8aaa';
const CARDTEXT = '#d0e8f8';

const RISK_COLORS = { 5: '#ff2020', 4: '#ff6a00', 3: '#ffaa00', 2: '#88bb00', 1: '#007799' };

// ── Helpers ────────────────────────────────────────────────────

function cleanText(str) {
  return String(str || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

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

function cardBorderColor(type) {
  if (type === 'confirmed') return RED;
  if (type === 'suspected') return ORANGE;
  return CYAN;
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
            padding: '2px 8px', background: b.bg, border: `1px solid ${b.border}`,
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
          {cleanText(item.description) || item.source_url || '—'}
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
  const raw    = news.map(n => cleanText(n.description || '')).filter(Boolean).join('   ·   ');
  const ticker = raw || 'Αναμονή δεδομένων…';
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 48, zIndex: 200,
      background: 'rgba(6,13,21,0.92)', borderBottom: `1px solid ${BORDER}`,
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
          animation: 'tickerScroll 120s linear infinite',
          fontFamily: 'Share Tech Mono, monospace', fontSize: 12,
          color: CYAN, letterSpacing: '0.04em', fontWeight: 500,
        }}>
          {ticker}{'        '}{ticker}
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
  const [hoveredId, setHoveredId] = useState(null);
  return (
    <div style={{
      position: 'absolute', top: 48, left: 0, width: 210, bottom: 88,
      background: 'rgba(6,13,21,0.92)', borderRight: `1px solid ${BORDER}`,
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
          const key     = item.id || i;
          const hovered = hoveredId === key;
          const bColor  = cardBorderColor(item.type);
          const b       = badgeStyle(item.source);
          return (
            <div
              key={key}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setHoveredId(key)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                padding: '9px 11px 9px 11px',
                borderBottom: `1px solid ${BORDER}30`,
                borderLeft: `3px solid ${bColor}`,
                cursor: 'pointer',
                background: hovered ? 'rgba(255,32,32,0.05)' : 'transparent',
                boxShadow: hovered ? `inset 2px 0 12px rgba(255,32,32,0.06)` : 'none',
                transition: 'background 0.15s, box-shadow 0.15s',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <span style={{
                  padding: '2px 6px', background: b.bg, border: `1px solid ${b.border}`,
                  fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                  letterSpacing: '0.08em', color: b.color, borderRadius: 2,
                }}>{item.source}</span>
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: LABEL }}>
                  {timeAgo(item.date_reported)}
                </span>
              </div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: CARDTEXT, fontWeight: 500,
                lineHeight: 1.4, wordBreak: 'break-word',
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {cleanText(item.description) || item.source_url || '—'}
              </div>
              {hovered && (
                <div style={{
                  marginTop: 5, fontFamily: 'Share Tech Mono, monospace', fontSize: 9,
                  color: bColor, opacity: 0.8,
                }}>
                  → κλικ για λεπτομέρειες
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Right panel — Global Situation ─────────────────────────────

function GlobalPanel({ confirmed, suspected, news }) {
  const deaths        = 3;
  const confirmedVal  = confirmed.length + 8;
  const suspectedVal  = suspected.length + news.filter(n => n.type === 'suspected').length;
  const reportsVal    = news.length;

  const stats = [
    { label: 'ΝΕΚΡΟΙ',        value: deaths,        note: 'MV Hondius',       color: RED },
    { label: 'ΕΠΙΒΕΒΑΙΩΜΕΝΑ', value: confirmedVal,  note: 'MV Hondius + GR',  color: ORANGE },
    { label: 'ΥΠΟΠΤΑ',        value: suspectedVal,  note: 'GR + νέα',         color: '#ffaa00' },
    { label: 'ΑΝΑΦΟΡΕΣ',      value: reportsVal,    note: '24ω παρακολούθηση', color: DIM },
  ];

  return (
    <div style={{
      position: 'absolute', top: 48, right: 0, width: 190, zIndex: 200,
      background: 'rgba(6,13,21,0.92)', borderLeft: `1px solid ${BORDER}`,
    }}>
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, background: `${RED}10` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: RED, flexShrink: 0,
            animation: 'liveDot 1.4s ease-in-out infinite',
          }} />
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 9, letterSpacing: '0.18em', color: RED, fontWeight: 700 }}>
            ΠΑΓΚΟΣΜΙΑ ΕΙΚΟΝΑ
          </span>
        </div>
      </div>

      {stats.map(s => (
        <div key={s.label} style={{
          padding: '8px 14px', borderBottom: `1px solid ${BORDER}25`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 9, color: LABEL, fontWeight: 500 }}>{s.label}</div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: `${LABEL}88`, marginTop: 1 }}>{s.note}</div>
          </div>
          <span style={{ fontFamily: 'Orbitron, monospace', fontSize: 20, color: s.color, fontWeight: 700 }}>
            {s.value || '—'}
          </span>
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
      background: 'rgba(6,13,21,0.92)', borderTop: `1px solid ${BORDER}`,
      zIndex: 200, display: 'flex', alignItems: 'stretch',
    }}>
      <div style={{
        padding: '0 22px', borderRight: `1px solid ${BORDER}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3,
      }}>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 8, color: LABEL, letterSpacing: '0.2em', fontWeight: 500 }}>
          ΚΡΟΥΣΜΑΤΑ
        </div>
        <div style={{ fontFamily: 'Orbitron, monospace', fontSize: 34, color: RED, fontWeight: 700, lineHeight: 1 }}>
          {totalCases || '—'}
        </div>
      </div>

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
                {s.value || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

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

// ── Custom map style (Plague Inc palette) ──────────────────────

const PLAGUE_STYLE = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#060d15' },
    },
    {
      id: 'base-tiles',
      type: 'raster',
      source: 'carto-dark',
      paint: {
        'raster-opacity': 1,
        'raster-brightness-min': 0,
        'raster-saturation': -0.3,
        'raster-hue-rotate': 160,
        'raster-contrast': 0.1,
      },
    },
  ],
};

// ── Map ────────────────────────────────────────────────────────

export default function MapView() {
  const [data, setData] = useState({
    confirmed: [], suspected: [], news: [], globalStats: {}, riskAreas: [],
  });
  const [mapLoaded, setMapLoaded]       = useState(false);
  const [datetime, setDatetime]         = useState('');
  const [selectedNews, setSelectedNews] = useState(null);
  const mapContainer       = useRef(null);
  const mapRef             = useRef(null);
  const mlRef              = useRef(null);
  const animRef            = useRef(null);
  const popupRef           = useRef(null);
  const clickHandlerRef    = useRef(null);
  const mapClickHandlerRef = useRef(null);
  const riskAreasRef       = useRef([]);

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
        style: PLAGUE_STYLE,
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

  // Layers — real API data only
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const map = mapRef.current;
    const ml  = mlRef.current;
    const { confirmed, suspected, riskAreas } = data;

    riskAreasRef.current = riskAreas || [];

    const caseFeatures = [
      ...confirmed.map(c => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [c.location.lng, c.location.lat] },
        properties: {
          type: 'confirmed', weight: 1.0,
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
          type: 'suspected', weight: 0.4,
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
        properties: {
          name: r.name,
          risk_level: r.risk_level,
          fillOpacity: 0.03 + r.risk_level * 0.018,
        },
      })),
    };

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

    // Cases source
    map.addSource('cases', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: caseFeatures },
    });

    // Heatmap — more spread, Plague Inc intensity
    map.addLayer({
      id: 'infection-heat',
      type: 'heatmap',
      source: 'cases',
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
        'heatmap-intensity': 1.5,
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0,    'rgba(0,0,0,0)',
          0.1,  'rgba(40,0,0,0.3)',
          0.3,  'rgba(100,0,0,0.6)',
          0.6,  'rgba(180,10,10,0.8)',
          0.85, 'rgba(230,20,0,0.9)',
          1,    'rgba(255,80,0,1)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 60, 6, 120, 9, 200],
        'heatmap-opacity': 0.9,
      },
    });

    // Circles on top
    map.addLayer({
      id: 'case-circles',
      type: 'circle',
      source: 'cases',
      paint: {
        'circle-radius': ['case', ['==', ['get', 'type'], 'confirmed'], 9, 6],
        'circle-color':  ['case', ['==', ['get', 'type'], 'confirmed'], '#ff2020', '#ff6a00'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.95,
      },
    });

    // Circle click popup
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
        <div style="font-family:'Share Tech Mono',monospace;background:#060d15;border:1px solid #2a4a6a;padding:14px;min-width:180px;">
          <div style="display:inline-block;padding:2px 8px;border:1px solid ${typeColor}55;color:${typeColor};font-size:10px;letter-spacing:0.1em;margin-bottom:8px;">${typeLabel}</div>
          ${p.region   ? `<div style="color:#e8f4ff;font-size:13px;margin-bottom:6px;font-family:'Rajdhani',sans-serif;font-weight:600;">${p.region}</div>` : ''}
          ${p.cases    ? `<div style="color:#7ab0d0;font-size:10px;margin-bottom:4px;">Κρούσματα: <span style="color:#fff">${p.cases}</span></div>` : ''}
          ${p.date_reported ? `<div style="color:#5a8aaa;font-size:9px;margin-bottom:4px;">${p.date_reported}</div>` : ''}
          ${p.source   ? `<div style="color:#5a8aaa;font-size:9px;">${p.source}</div>` : ''}
        </div>`;
      popupRef.current = new ml.Popup({ closeButton: false, maxWidth: '260px' })
        .setLngLat(e.lngLat).setHTML(html).addTo(map);
    };
    map.on('click', 'case-circles', clickHandlerRef.current);
    map.on('mouseenter', 'case-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'case-circles', () => { map.getCanvas().style.cursor = ''; });

    // General click — risk zone popup
    if (mapClickHandlerRef.current) {
      map.off('click', mapClickHandlerRef.current);
    }
    mapClickHandlerRef.current = (e) => {
      if (!ml) return;
      const circles = map.queryRenderedFeatures(e.point, { layers: ['case-circles'] });
      if (circles.length > 0) return;

      const riskFeats = map.queryRenderedFeatures(e.point, { layers: ['risk-fill'] });
      if (!riskFeats.length) return;

      const p = riskFeats[0].properties;
      if (popupRef.current) popupRef.current.remove();

      const lvl   = p.risk_level || 1;
      const bars  = '█'.repeat(lvl) + '░'.repeat(5 - lvl);
      const rc    = RISK_COLORS[lvl] || DIM;
      const label = lvl >= 4 ? 'ΥΨΗΛΟΥ' : lvl >= 3 ? 'ΜΕΣΑΙΟΥ' : 'ΧΑΜΗΛΟΥ';

      const html = `
        <div style="font-family:'Share Tech Mono',monospace;background:#060d15;border:1px solid #2a4a6a;padding:14px;min-width:200px;">
          <div style="color:#e8f4ff;font-size:12px;font-family:'Rajdhani',sans-serif;font-weight:600;margin-bottom:8px;letter-spacing:0.05em;">
            ${(p.name || '').toUpperCase()} — ΖΩΝΗ ${label} ΚΙΝΔΥΝΟΥ
          </div>
          <div style="color:${rc};font-size:15px;letter-spacing:0.12em;margin-bottom:8px;">${bars}</div>
          <div style="color:#5a8aaa;font-size:9px;">Βασίζεται σε ιστορικά δεδομένα ECDC</div>
        </div>`;

      popupRef.current = new ml.Popup({ closeButton: false, maxWidth: '290px' })
        .setLngLat(e.lngLat).setHTML(html).addTo(map);
    };
    map.on('click', mapClickHandlerRef.current);

    // Sine-wave heatmap animation
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
        .maplibregl-ctrl-bottom-left,.maplibregl-ctrl-bottom-right{display:none!important;}
        .maplibregl-popup-content{background:transparent!important;padding:0!important;box-shadow:none!important;border-radius:0!important;}
        .maplibregl-popup-tip{display:none!important;}
      `}</style>

      <div ref={mapContainer} style={{ position: 'absolute', inset: 0 }} />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.03) 2px,rgba(0,0,0,0.03) 4px)',
      }} />

      <TopBar   news={data.news} datetime={datetime} />
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
