'use client';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

const NEON = { critical:'#ff006e', high:'#ff4d00', medium:'#ffff00', low:'#00f5ff' };
const SLABEL = { active_combat:'💥 ACTIVE', escalating:'📈 ESCALATING', ceasefire:'🤝 CEASEFIRE', negotiations:'🗣️ TALKS', frozen:'🧊 FROZEN' };

function ConflictCard({ c, onIntel }) {
  const [exp, setExp] = useState(false);
  const [memeImg, setMemeImg] = useState(null);
  const col = NEON[c.intensity] || '#00f5ff';

  useEffect(() => {
    const text = c.memes?.find(m => m.format === 'meme')?.text || c.memes?.[0]?.text;
    if (!text) return;
    fetch(`/api/imgflip?id=${encodeURIComponent(c.id)}&text=${encodeURIComponent(text)}`)
      .then(r => r.json())
      .then(d => { if (d.url) setMemeImg(d.url); })
      .catch(() => {});
  }, [c.id]);

  return (
    <div style={{background:'#0a0a0f',border:`1px solid ${col}44`,marginBottom:12,display:'flex',flexDirection:'column',boxShadow:`0 0 20px ${col}15`}}>
      <div style={{height:2,background:`linear-gradient(90deg,${col},transparent)`}}/>

      {/* Always-visible header — click anywhere here to expand/collapse */}
      <div onClick={() => setExp(e => !e)} style={{cursor:'pointer',padding:'10px 13px 10px',userSelect:'none'}}>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6,flexWrap:'wrap'}}>
          <span style={{fontFamily:'VT323,monospace',fontSize:13,color:col,border:`1px solid ${col}66`,padding:'1px 8px',letterSpacing:'0.12em'}}>{c.intensity?.toUpperCase()}</span>
          <span style={{fontFamily:'VT323,monospace',fontSize:12,color:'#3a3a5a'}}>{SLABEL[c.status]||c.status}</span>
          <span style={{fontFamily:'VT323,monospace',fontSize:11,color:'#222232',marginLeft:'auto'}}>{c.region}</span>
          <span style={{fontFamily:'VT323,monospace',fontSize:12,color:'#2a2a4a',marginLeft:6}}>{exp ? '▲' : '▼'}</span>
        </div>
        <div style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontSize:'clamp(18px,2.2vw,24px)',letterSpacing:'0.04em',lineHeight:1.1,color:'#f0ece3'}}>{c.meme_title}</div>
        <div style={{fontFamily:'VT323,monospace',fontSize:11,color:'#333350',letterSpacing:'0.08em',marginTop:2}}>{c.name}</div>
      </div>

      {/* Expanded content */}
      {exp && <>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#7a7875',padding:'0 13px 10px',lineHeight:1.65,borderBottom:'1px solid #14141e'}}>{c.tldr}</div>

        {c.latest_updates?.length > 0 && (
          <div style={{padding:'10px 13px',borderBottom:'1px solid #14141e'}}>
            <div style={{fontFamily:'VT323,monospace',fontSize:12,color:'#39ff14',letterSpacing:'0.15em',marginBottom:7}}>📡 LATEST UPDATES</div>
            {c.latest_updates.map((u, i) => (
              <div key={i} style={{marginBottom:8,paddingBottom:8,borderBottom: i < c.latest_updates.length-1 ? '1px solid #0e0e18' : 'none'}}>
                <div style={{display:'flex',gap:8,alignItems:'baseline',marginBottom:3}}>
                  <span style={{fontFamily:'VT323,monospace',fontSize:11,color:col,letterSpacing:'0.1em',flexShrink:0}}>{u.date}</span>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#c0bcb8',fontWeight:'bold',lineHeight:1.4}}>{u.headline}</span>
                </div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#6a6865',lineHeight:1.6,paddingLeft:4}}>{u.detail}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{fontFamily:'VT323,monospace',fontSize:16,padding:'9px 13px 3px',color:col}}>{c.vibe}</div>
        <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#9a9895',padding:'0 13px 12px',lineHeight:1.7,fontStyle:'italic'}}>{c.hot_take}</div>

        {(c.memes?.length > 0 || memeImg) && (
          <div style={{padding:'10px 13px',borderTop:'1px solid #14141e',background:'#07070e'}}>
            <div style={{fontFamily:'VT323,monospace',fontSize:12,color:'#ffff00',letterSpacing:'0.15em',marginBottom:8}}>🐸 INTERNET REACTS</div>
            {memeImg && (
              <a href={memeImg} target="_blank" rel="noopener noreferrer" style={{display:'block',marginBottom:10}}>
                <img src={memeImg} alt="meme" style={{width:'100%',display:'block',border:`1px solid ${col}44`,opacity:0.92}} />
              </a>
            )}
            {c.memes?.map((m, i) => (
              <div key={i} style={{marginBottom:8,padding:'8px 10px',background:'#0d0d18',border:'1px solid #1a1a2a',borderLeft:`3px solid ${col}`}}>
                <div style={{display:'flex',gap:6,marginBottom:4,alignItems:'center'}}>
                  <span style={{fontFamily:'VT323,monospace',fontSize:10,color:'#333355',letterSpacing:'0.1em',textTransform:'uppercase'}}>{m.format}</span>
                  <span style={{fontFamily:'VT323,monospace',fontSize:10,color:'#252530',marginLeft:'auto'}}>{m.source}</span>
                </div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#b8b4b0',lineHeight:1.6,fontStyle:'italic'}}>"{m.text}"</div>
              </div>
            ))}
          </div>
        )}

        {c.sides_roasted&&Object.keys(c.sides_roasted).length>0&&<div style={{padding:'10px 13px',borderTop:'1px solid #14141e'}}>
          <div style={{fontFamily:'VT323,monospace',fontSize:13,color:col,marginBottom:5,letterSpacing:'0.1em'}}>🔥 SIDES ROASTED</div>
          {Object.entries(c.sides_roasted).map(([s,r])=><div key={s} style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#6a6865',marginBottom:4,lineHeight:1.55}}><span style={{color:col,marginRight:6}}>{s}:</span>{r}</div>)}
        </div>}
        {c.historical_parallel&&<div style={{padding:'10px 13px',borderTop:'1px solid #14141e'}}>
          <div style={{fontFamily:'VT323,monospace',fontSize:13,color:col,marginBottom:5,letterSpacing:'0.1em'}}>📚 HISTORICAL PARALLEL</div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#6a6865',lineHeight:1.65,fontStyle:'italic'}}>{c.historical_parallel}</div>
        </div>}
        {c.hypocrisy_flags?.length>0&&<div style={{padding:'10px 13px',borderTop:'1px solid #14141e'}}>
          <div style={{fontFamily:'VT323,monospace',fontSize:13,color:'#ff006e',marginBottom:5,letterSpacing:'0.1em'}}>🚩 HYPOCRISY FLAGS</div>
          {c.hypocrisy_flags.map((f,i)=><div key={i} style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#ff006e',marginBottom:3,opacity:.85,lineHeight:1.5}}>🚩 {f}</div>)}
        </div>}
        {c.data_points&&Object.keys(c.data_points).length>0&&<div style={{padding:'10px 13px',borderTop:'1px solid #14141e'}}>
          <div style={{fontFamily:'VT323,monospace',fontSize:13,color:col,marginBottom:5,letterSpacing:'0.1em'}}>📊 NUMBERS</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3}}>
            {Object.entries(c.data_points).map(([k,v])=><div key={k} style={{background:'#07070e',padding:'6px 8px'}}>
              <div style={{fontFamily:'VT323,monospace',fontSize:10,color:'#252535',letterSpacing:'0.12em',marginBottom:2,textTransform:'uppercase'}}>{k}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#686462'}}>{v}</div>
            </div>)}
          </div>
        </div>}
      </>}

      {/* Buttons */}
      <div style={{display:'flex',borderTop:'1px solid #14141e',marginTop:'auto'}}>
        <button onClick={() => setExp(e => !e)} style={{flex:1,background:'none',border:'none',borderRight:'1px solid #14141e',padding:'12px',fontFamily:'VT323,monospace',fontSize:13,letterSpacing:'0.1em',cursor:'pointer',color:'#333355',transition:'color .15s'}} onMouseEnter={e=>e.target.style.color='#39ff14'} onMouseLeave={e=>e.target.style.color='#333355'}>{exp?'▲ LESS':'▼ MORE CHAOS'}</button>
        <button onClick={onIntel} style={{flex:1,background:'none',border:'none',padding:'12px',fontFamily:'VT323,monospace',fontSize:13,letterSpacing:'0.1em',cursor:'pointer',color:'#00f5ff',transition:'background .15s'}} onMouseEnter={e=>e.target.style.background='rgba(0,245,255,0.06)'} onMouseLeave={e=>e.target.style.background='none'}>🔍 RAW INTEL</button>
      </div>
    </div>
  );
}

export default function MapView({ conflicts, vibeCheck, onIntel }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const conflictsRef = useRef(conflicts);
  const mlRef = useRef(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeConflict, setActiveConflict] = useState(null);

  useEffect(() => { conflictsRef.current = conflicts; }, [conflicts]);

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return;
    initMap();
  }, []);

  useEffect(() => {
    if (mapRef.current?.loaded() && conflicts?.length > 0) {
      addMarkersToMap(mapRef.current);
    }
  }, [conflicts]);

  async function initMap() {
    const ml = await import('maplibre-gl');
    mlRef.current = ml.default;

    const map = new ml.default.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          countries: {
            type: 'geojson',
            data: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson',
            generateId: true
          }
        },
        layers: [
          {
            id: 'background',
            type: 'background',
            paint: { 'background-color': '#060810' }
          },
          {
            id: 'countries-fill',
            type: 'fill',
            source: 'countries',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#152515',
                '#0b0e18'
              ],
              'fill-opacity': 1
            }
          },
          {
            id: 'countries-border',
            type: 'line',
            source: 'countries',
            paint: {
              'line-color': '#1e3a2a',
              'line-width': 0.8,
              'line-opacity': 1
            }
          },
          {
            id: 'countries-border-glow',
            type: 'line',
            source: 'countries',
            paint: {
              'line-color': '#39ff14',
              'line-width': 1.5,
              'line-opacity': 0.08,
              'line-blur': 3
            }
          }
        ]
      },
      center: [20, 15],
      zoom: 2,
      minZoom: 1.5,
      maxZoom: 12,
    });

    // Hover
    let hoveredId = null;
    map.on('mousemove', 'countries-fill', (e) => {
      if (e.features.length > 0) {
        if (hoveredId !== null) map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false });
        hoveredId = e.features[0].id;
        map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: true });
        map.getCanvas().style.cursor = 'crosshair';
      }
    });
    map.on('mouseleave', 'countries-fill', () => {
      if (hoveredId !== null) map.setFeatureState({ source: 'countries', id: hoveredId }, { hover: false });
      hoveredId = null;
      map.getCanvas().style.cursor = '';
    });

    map.on('load', () => {
      mapRef.current = map;
      addCountryLabels(map);
      if (conflictsRef.current?.length > 0) addMarkersToMap(map);
    });
  }

  function addCountryLabels(map) {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r => r.json())
      .then(data => {
        const centroids = {
          type: 'FeatureCollection',
          features: data.features.map(f => {
            try {
              const coords = f.geometry.type === 'Polygon'
                ? f.geometry.coordinates[0]
                : f.geometry.coordinates[0][0];
              const lngs = coords.map(c => c[0]);
              const lats = coords.map(c => c[1]);
              return {
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [(Math.min(...lngs)+Math.max(...lngs))/2, (Math.min(...lats)+Math.max(...lats))/2] },
                properties: { name: f.properties.ADMIN || f.properties.name || '' }
              };
            } catch { return null; }
          }).filter(Boolean)
        };
        map.addSource('labels', { type: 'geojson', data: centroids });
        map.addLayer({
          id: 'country-labels',
          type: 'symbol',
          source: 'labels',
          layout: {
            'text-field': ['get', 'name'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 4, 13, 6, 16],
            'text-max-width': 8,
            'text-anchor': 'center',
            'text-allow-overlap': false,
            'text-ignore-placement': false,
          },
          paint: {
            'text-color': '#5a8a6a',
            'text-halo-color': '#060810',
            'text-halo-width': 2,
            'text-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 3, 0.9]
          }
        });
      }).catch(() => {});
  }

  function addMarkersToMap(map) {
    const ML = mlRef.current;
    if (!ML) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    conflictsRef.current?.forEach(c => {
      if (c.lat == null || c.lng == null) return;
      const col = NEON[c.intensity] || '#00f5ff';
      const size = c.intensity === 'critical' ? 18 : c.intensity === 'high' ? 14 : 10;
      const dur = c.intensity === 'critical' ? '1.2s' : '2s';

      // Zero-size wrapper: offsetWidth/offsetHeight = 0, so anchor:'center' places the
      // wrapper's origin pixel exactly on the coordinate with zero offset arithmetic.
      // All children use position:absolute + translate(-50%,-50%) to center on that origin.
      // overflow:visible lets them paint freely without affecting the measured element size.
      const wrapper = document.createElement('div');
      wrapper.style.cssText = `width:0;height:0;overflow:visible;position:relative;cursor:pointer;`;

      const ring1 = document.createElement('div');
      ring1.style.cssText = `position:absolute;width:${size+16}px;height:${size+16}px;border-radius:50%;border:1.5px solid ${col};transform:translate(-50%,-50%);animation:pinRing ${dur} ease-out infinite;pointer-events:none;`;

      const ring2 = document.createElement('div');
      ring2.style.cssText = `position:absolute;width:${size+8}px;height:${size+8}px;border-radius:50%;border:1px solid ${col};transform:translate(-50%,-50%);animation:pinRing ${dur} ease-out infinite;animation-delay:0.4s;pointer-events:none;`;

      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${col};border:2px solid #060810;box-shadow:0 0 ${size*1.5}px ${col},0 0 ${size*3}px ${col}66;transform:translate(-50%,-50%);transition:transform .2s;`;

      wrapper.appendChild(ring1);
      wrapper.appendChild(ring2);
      wrapper.appendChild(dot);

      // Tooltip: translate up by dot-radius + gap so it clears the dot
      const tooltip = document.createElement('div');
      tooltip.style.cssText = `position:absolute;left:0;transform:translate(-50%,calc(-${Math.ceil(size/2)}px - 100% - 6px));background:#0a0a0f;border:1px solid ${col}66;padding:4px 8px;white-space:nowrap;font-family:VT323,monospace;font-size:12px;color:${col};letter-spacing:0.1em;pointer-events:none;opacity:0;transition:opacity .2s;z-index:10;`;
      tooltip.textContent = c.meme_title || c.name;
      wrapper.appendChild(tooltip);

      // Preserve translate(-50%,-50%) in the dot transform when scaling on hover
      wrapper.addEventListener('mouseenter', () => { dot.style.transform = 'translate(-50%,-50%) scale(1.3)'; tooltip.style.opacity = '1'; });
      wrapper.addEventListener('mouseleave', () => { dot.style.transform = 'translate(-50%,-50%)'; tooltip.style.opacity = '0'; });

      // anchor:'center' on a zero-size element → offset [0,0] → the wrapper origin sits
      // exactly on the projected coordinate pixel every frame during pan and zoom.
      const marker = new ML.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat([c.lng, c.lat])
        .addTo(map);

      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        map.flyTo({ center: [c.lng, c.lat], zoom: 5, duration: 1400, essential: true });
        setActiveConflict(c);
        setDrawerOpen(true);
      });

      markersRef.current.push(marker);
    });
  }

  return (
    <div style={{position:'relative',width:'100%',height:'100%'}}>
      <style>{`
        @keyframes pinRing {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2); opacity: 0; }
        }
        .maplibregl-ctrl-bottom-right { opacity: 0.2 !important; }
        .maplibregl-ctrl-top-right { display: none !important; }
      `}</style>

      <div ref={mapContainer} style={{width:'100%',height:'100%'}}/>

      {/* Top HUD — overlaid on the map */}
      <div style={{
        position:'absolute', top:0, left:0, right:0, zIndex:100,
        background:'linear-gradient(180deg,rgba(6,6,10,0.88) 0%,rgba(6,6,10,0) 100%)',
        padding:'10px 16px 28px',
        display:'flex', alignItems:'center', gap:12, flexWrap:'wrap',
        pointerEvents:'none',
      }}>
        <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:20,letterSpacing:'0.18em',color:'#39ff14',textShadow:'0 0 14px #39ff1466'}}>CHAOSDESK</div>
        <div style={{fontFamily:'VT323,monospace',fontSize:12,color:'#1e3a1e',letterSpacing:'0.12em'}}>
          {conflicts?.length || 0} CONFLICTS ACTIVE
        </div>
        {vibeCheck && (
          <div style={{fontFamily:'VT323,monospace',fontSize:11,color:'#1a2a1a',letterSpacing:'0.08em',marginLeft:'auto',maxWidth:'45%',textAlign:'right',lineHeight:1.4}}>
            {vibeCheck}
          </div>
        )}
      </div>

      {/* Drawer toggle */}
      <button onClick={() => setDrawerOpen(o => !o)} style={{
        position:'absolute', top:52, left: drawerOpen ? 'calc(33vw + 12px)' : 12,
        zIndex:200, background:'#08080c', border:'1px solid #39ff1466',
        color:'#39ff14', fontFamily:'VT323,monospace', fontSize:15,
        letterSpacing:'0.15em', padding:'10px 18px', cursor:'pointer',
        transition:'left .35s cubic-bezier(.16,1,.3,1)',
        boxShadow:'0 0 20px rgba(57,255,20,0.15)'
      }}>
        {drawerOpen ? '◀ CLOSE' : '▶ ALL CONFLICTS'}
      </button>

      {/* Drawer */}
      <div style={{
        position:'absolute', top:0, left:0, bottom:0,
        width:'33vw', minWidth:340, maxWidth:540,
        background:'rgba(6,6,10,0.98)',
        borderRight:'1px solid #39ff1422',
        transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition:'transform .35s cubic-bezier(.16,1,.3,1)',
        zIndex:150, display:'flex', flexDirection:'column',
        backdropFilter:'blur(12px)',
      }}>
        {/* Drawer header */}
        <div style={{padding:'16px 18px', borderBottom:'1px solid #14141e', flexShrink:0, background:'#08080c'}}>
          <div style={{fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:'0.15em', color:'#39ff14', textShadow:'0 0 12px #39ff1455', marginBottom:2}}>CHAOSDESK</div>
          <div style={{fontFamily:'VT323,monospace', fontSize:12, color:'#252535', letterSpacing:'0.1em'}}>
            {conflicts?.length || 0} ACTIVE CONFLICTS · TAP PIN TO FOCUS
          </div>
          {vibeCheck && (
            <div style={{fontFamily:'VT323,monospace', fontSize:11, color:'#1e2e1e', letterSpacing:'0.08em', marginTop:4, lineHeight:1.4}}>
              {vibeCheck}
            </div>
          )}
        </div>

        {/* Conflict list */}
        <div style={{flex:1, overflowY:'auto', padding:'12px 14px'}}>
          {activeConflict && (
            <div style={{marginBottom:16}}>
              <div style={{fontFamily:'VT323,monospace', fontSize:12, color:'#ff006e', letterSpacing:'0.15em', marginBottom:8}}>📍 SELECTED CONFLICT</div>
              <ConflictCard c={activeConflict} onIntel={() => onIntel(activeConflict.id)}/>
              <div style={{fontFamily:'VT323,monospace', fontSize:11, color:'#252535', letterSpacing:'0.12em', margin:'16px 0 10px', borderTop:'1px solid #14141e', paddingTop:12}}>OTHER CONFLICTS</div>
            </div>
          )}
          {conflicts?.filter(c => c.id !== activeConflict?.id).map((c) => (
            <div key={c.id} style={{cursor:'pointer'}} onClick={() => {
              mapRef.current?.flyTo({center:[c.lng,c.lat], zoom:5, duration:1400});
              setActiveConflict(c);
            }}>
              <ConflictCard c={c} onIntel={() => onIntel(c.id)}/>
            </div>
          ))}
        </div>
      </div>

      {!drawerOpen && (
        <div style={{position:'absolute', bottom:24, left:16, fontFamily:'VT323,monospace', fontSize:12, color:'#1a1a2a', letterSpacing:'0.12em'}}>
          TAP PIN → ZOOM + OPEN FEED
        </div>
      )}
    </div>
  );
}
