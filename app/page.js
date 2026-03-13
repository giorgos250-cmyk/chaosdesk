'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./components/Map'), { ssr: false });

const BOOT = [
  ["> CHAOSDESK v4.0 — INITIALIZING...", "#1c1a17"],
  ["> LOADING EQUAL OPPORTUNITY CHAOS ENGINE... [OK]", "#0077a8"],
  ["> CONNECTING TO GLOBAL NEWS SOURCES... [OK]", "#1c1a17"],
  ["> CALIBRATING HYPOCRISY DETECTOR (all sides)...", "#8a7000"],
  ["> LOADING HISTORICAL PARALLEL DATABASE... [OK]", "#0077a8"],
  ["> WARNING: NO SIDE IS SAFE FROM THE ROAST", "#d4163c"],
  ["> WE ARE SO COOKED. STANDING BY.", "#1c1a17"],
];

export default function Home() {
  const [bi, setBi] = useState(0);
  const [phase, setPhase] = useState('boot');
  const [ready, setReady] = useState(false);
  const [chaos, setChaos] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (bi < BOOT.length - 1) {
      const t = setTimeout(() => setBi(i => i + 1), 200 + Math.random() * 120);
      return () => clearTimeout(t);
    }
  }, [bi]);

  useEffect(() => { if (bi >= BOOT.length - 1 && ready) setPhase('ready'); }, [bi, ready]);

  useEffect(() => {
    fetch('/api/conflicts')
      .then(r => r.json())
      .then(d => { setChaos(d.chaos); setReady(true); })
      .catch(e => { setErr(e.message); setReady(true); });
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#e8e4dd', color: '#1c1a17', fontFamily: "'IBM Plex Mono',monospace" }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .cur{animation:bk .7s step-end infinite;color:#d4163c;}
        @keyframes bk{0%,100%{opacity:1;}50%{opacity:0;}}
        .el::after{content:'';animation:dt 1.4s steps(4,end) infinite;}
        @keyframes dt{0%{content:'';}25%{content:'.';}50%{content:'..';}75%{content:'...';}100%{content:'';}}
        .ib{font-family:'Bebas Neue',sans-serif;font-size:clamp(14px,3.5vw,20px);letter-spacing:0.22em;background:transparent;border:2px solid #c4bfb6;color:#c4bfb6;padding:14px 36px;cursor:not-allowed;transition:all .3s;min-width:240px;}
        .ir{border-color:#d4163c!important;color:#d4163c!important;cursor:pointer!important;}
        .ir:hover{background:#d4163c!important;color:#f2efe9!important;transform:scale(1.02);}
        .mi{animation:mi2 .4s ease both;}
        @keyframes mi2{from{opacity:0;}to{opacity:1;}}
      `}</style>

      {phase !== 'on' && (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', gap: 24, background: '#e8e4dd' }}>
          <div style={{ fontFamily: "'Bebas Neue',Impact,sans-serif", fontSize: 'clamp(52px,13vw,120px)', letterSpacing: '0.12em', color: '#1c1a17', lineHeight: 1 }}>CHAOSDESK</div>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 'clamp(8px,2vw,11px)', color: '#9a9691', letterSpacing: '0.18em', textAlign: 'center' }}>GLOBAL CONFLICT INTELLIGENCE · EQUAL OPPORTUNITY CHAOS · NO SIDES SPARED</div>
          <div style={{ background: '#f2efe9', border: '1px solid #c4bfb6', padding: 2, maxWidth: 520, width: '100%' }}>
            <div style={{ padding: '14px 18px', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {BOOT.slice(0, bi + 1).map(([t, c], i) => (
                <div key={i} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, letterSpacing: '0.04em', lineHeight: 1.6, color: c, opacity: i < bi ? 0.4 : 1 }}>
                  {t}{i === bi && <span className="cur">█</span>}
                </div>
              ))}
            </div>
          </div>
          <button className={`ib${phase === 'ready' ? ' ir' : ''}`} onClick={() => phase === 'ready' && setPhase('on')} disabled={phase !== 'ready'}>
            {phase !== 'ready' ? <span>SCANNING GLOBAL CHAOS<span className="el" /></span> : <span>⚡ INITIALIZE CHAOSDESK ⚡</span>}
          </button>
          {err && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#d4163c', textAlign: 'center', maxWidth: 480 }}>⚠ ERROR: {err}</div>}
        </div>
      )}

      {phase === 'on' && (
        <div className="mi" style={{ position: 'fixed', inset: 0 }}>
          <MapView conflicts={chaos?.conflicts || []} vibeCheck={chaos?.vibe_check} />
        </div>
      )}
    </div>
  );
}
