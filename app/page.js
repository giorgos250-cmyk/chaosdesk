'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const BOOT = [
  ["> CHAOSDESK v4.1 — INITIALIZING...", "#1c1a17"],
  ["> LOADING EQUAL OPPORTUNITY CHAOS ENGINE... [OK]", "#0077a8"],
  ["> CONNECTING TO GLOBAL NEWS SOURCES... [OK]", "#1c1a17"],
  ["> CALIBRATING HYPOCRISY DETECTOR (all sides)...", "#8a7000"],
  ["> LOADING HISTORICAL PARALLEL DATABASE... [OK]", "#0077a8"],
  ["> ACTIVATING SUS METER... [OK]", "#d4163c"],
  ["> WARNING: NO SIDE IS SAFE FROM THE ROAST", "#d4163c"],
  ["> WE ARE SO COOKED. STANDING BY.", "#1c1a17"],
];

export default function BootPage() {
  const router = useRouter();
  const [bi, setBi] = useState(0);
  const [phase, setPhase] = useState('boot'); // boot | ready | launching
  const [apiReady, setApiReady] = useState(false);
  const [err, setErr] = useState(null);

  // Boot text animation
  useEffect(() => {
    if (bi < BOOT.length - 1) {
      const t = setTimeout(() => setBi(i => i + 1), 200 + Math.random() * 120);
      return () => clearTimeout(t);
    }
  }, [bi]);

  // When boot text done + API ready → show button
  useEffect(() => {
    if (bi >= BOOT.length - 1 && apiReady) setPhase('ready');
  }, [bi, apiReady]);

  // Prefetch API data (warm the cache)
  useEffect(() => {
    fetch('/api/conflicts')
      .then(r => r.json())
      .then(() => setApiReady(true))
      .catch(e => { setErr(e.message); setApiReady(true); });
  }, []);

  function handleLaunch() {
    if (phase !== 'ready') return;
    setPhase('launching');
    // Short delay for transition feel
    setTimeout(() => router.push('/map'), 300);
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#e8e4dd', color: '#1c1a17',
      fontFamily: "'IBM Plex Mono',monospace",
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', gap: 24,
    }}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .cur{animation:bk .7s step-end infinite;color:#d4163c;}
        @keyframes bk{0%,100%{opacity:1;}50%{opacity:0;}}
        .el::after{content:'';animation:dt 1.4s steps(4,end) infinite;}
        @keyframes dt{0%{content:'';}25%{content:'.';}50%{content:'..';}75%{content:'...';}100%{content:'';}}
        .ib{font-family:'Bebas Neue',sans-serif;font-size:clamp(14px,3.5vw,20px);letter-spacing:0.22em;background:transparent;border:2px solid #c4bfb6;color:#c4bfb6;padding:14px 36px;cursor:not-allowed;transition:all .3s;min-width:240px;}
        .ir{border-color:#d4163c!important;color:#d4163c!important;cursor:pointer!important;}
        .ir:hover{background:#d4163c!important;color:#f2efe9!important;transform:scale(1.02);}
        .launching{opacity:0;transform:scale(1.05);transition:all .3s ease-out;}
      `}</style>

      <div className={phase === 'launching' ? 'launching' : ''}>
        {/* Logo */}
        <div style={{
          fontFamily: "'Bebas Neue',Impact,sans-serif",
          fontSize: 'clamp(52px,13vw,120px)',
          letterSpacing: '0.12em', color: '#1c1a17',
          lineHeight: 1, textAlign: 'center',
        }}>CHAOSDESK</div>

        {/* Subtitle */}
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 'clamp(8px,2vw,11px)', color: '#9a9691',
          letterSpacing: '0.18em', textAlign: 'center', marginTop: 8, marginBottom: 20,
        }}>GLOBAL CONFLICT INTELLIGENCE · EQUAL OPPORTUNITY CHAOS · NO SIDES SPARED</div>

        {/* Boot terminal */}
        <div style={{
          background: '#f2efe9', border: '1px solid #c4bfb6',
          padding: 2, maxWidth: 520, width: '100%', margin: '0 auto',
        }}>
          <div style={{
            padding: '14px 18px', maxHeight: 200, overflowY: 'auto',
            display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            {BOOT.slice(0, bi + 1).map(([t, c], i) => (
              <div key={i} style={{
                fontFamily: "'IBM Plex Mono',monospace",
                fontSize: 13, letterSpacing: '0.04em',
                lineHeight: 1.6, color: c,
                opacity: i < bi ? 0.4 : 1,
              }}>
                {t}{i === bi && <span className="cur">█</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Launch button */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            className={`ib${phase === 'ready' ? ' ir' : ''}`}
            onClick={handleLaunch}
            disabled={phase !== 'ready'}
          >
            {phase === 'launching'
              ? <span>LAUNCHING<span className="el" /></span>
              : phase !== 'ready'
                ? <span>SCANNING GLOBAL CHAOS<span className="el" /></span>
                : <span>⚡ INITIALIZE CHAOSDESK ⚡</span>
            }
          </button>
        </div>

        {/* Error display */}
        {err && (
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 11,
            color: '#d4163c', textAlign: 'center', maxWidth: 480,
            margin: '12px auto 0',
          }}>⚠ ERROR: {err}</div>
        )}
      </div>
    </div>
  );
}
