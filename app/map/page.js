'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('../components/Map'), { ssr: false });

export default function MapPage() {
  const [chaos, setChaos] = useState(null);
  const [sentinel, setSentinel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    fetch('/api/conflicts')
      .then(r => r.json())
      .then(d => {
        setChaos(d.chaos);
        setSentinel(d.sentinel);
        setLoading(false);
      })
      .catch(e => {
        setErr(e.message);
        setLoading(false);
      });
  }, []);

  // Handle RAW INTEL button click
  function handleIntel(conflictId) {
    // Future: navigate to /conflict/[id]/intel or open sentinel overlay
    console.log('RAW INTEL requested for:', conflictId);
    // For now, find sentinel data and alert
    const sData = sentinel?.conflicts?.find(c => c.id === conflictId);
    if (sData) {
      alert(`SENTINEL INTEL: ${sData.verified_summary || 'No verified data available.'}`);
    } else {
      alert('SENTINEL data not available for this conflict.');
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#e8e4dd',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{
          fontFamily: "'Oswald',sans-serif",
          fontSize: 32, letterSpacing: '0.15em', color: '#1c1a17',
        }}>CHAOSDESK</div>
        <div style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 12, letterSpacing: '0.1em', color: '#9e9890',
        }}>LOADING CONFLICT DATA...</div>
        <style>{`
          .loader{width:40px;height:4px;background:#c4bfb6;position:relative;overflow:hidden;}
          .loader::after{content:'';position:absolute;left:-50%;width:50%;height:100%;background:#d4163c;animation:load 1s ease-in-out infinite;}
          @keyframes load{0%{left:-50%;}100%{left:100%;}}
        `}</style>
        <div className="loader" />
      </div>
    );
  }

  if (err) {
    return (
      <div style={{
        minHeight: '100vh', background: '#e8e4dd',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{
          fontFamily: "'Oswald',sans-serif",
          fontSize: 32, letterSpacing: '0.15em', color: '#d4163c',
        }}>ERROR</div>
        <div style={{
          fontFamily: "'IBM Plex Mono',monospace",
          fontSize: 13, color: '#6b6660', textAlign: 'center', maxWidth: 400,
        }}>⚠ {err}</div>
        <button onClick={() => window.location.reload()} style={{
          fontFamily: "'Oswald',sans-serif",
          fontSize: 16, letterSpacing: '0.12em',
          padding: '10px 24px', border: '2px solid #d4163c',
          background: 'transparent', color: '#d4163c',
          cursor: 'pointer',
        }}>RETRY</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <MapView
        conflicts={chaos?.conflicts || []}
        vibeCheck={chaos?.vibe_check}
        onIntel={handleIntel}
      />
    </div>
  );
}
