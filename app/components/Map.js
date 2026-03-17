'use client';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

/* ═══════════════════════════════════════════════════════
   CHAOSDESK v4.1 — Light theme + Among Us dynamics
   Crew figures, SUS badges, Emergency Meeting headers
   Bigger fonts, 2-col max, word-break, RAW INTEL
   ═══════════════════════════════════════════════════════ */

const C = {
  bg: '#e8e4dd', bgWarm: '#ddd8cf', bgCool: '#d4d0ca',
  surface: '#f2efe9', surfaceHover: '#eae6df',
  mapBg: '#cec9c0', mapGrid: '#b8b3a9', mapLand: '#d8d4cb',
  critical: '#d4163c', high: '#c94600', medium: '#8a7000', low: '#0077a8',
  accent: '#1a8a3e', sus: '#d4163c',
  ink: '#1c1a17', inkMid: '#3d3a35', inkLight: '#6b6660', inkFaint: '#9e9890',
  border: '#c4bfb6', borderDark: '#a8a39a',
  darkPanel: '#1c1a17', darkText: '#e8e4dd', darkTextDim: '#e8e4dd88',
};

const INTENSITY = {
  critical: { color: C.critical, label: 'ΚΡΙΣΙΜΟ',  windowStyle: 'torn' },
  high:     { color: C.high,     label: 'ΥΨΗΛΟ',    windowStyle: 'blackboard' },
  medium:   { color: C.medium,   label: 'ΜΕΤΡΙΟ',   windowStyle: 'notebook' },
  low:      { color: C.low,      label: 'ΧΑΜΗΛΟ',   windowStyle: 'clipboard' },
};

const STATUS = {
  active_combat: 'ACTIVE COMBAT', escalating: 'ESCALATING',
  ceasefire: 'CEASEFIRE', negotiations: 'NEGOTIATIONS', frozen: 'FROZEN',
};

/* ─── Crew Figure SVG ─── */
function CrewFigure({ color = '#d4163c', size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" style={{ flexShrink: 0 }}>
      <rect x="8" y="12" width="24" height="22" rx="8" fill={color} />
      <ellipse cx="20" cy="14" rx="12" ry="10" fill={color} />
      <ellipse cx="24" cy="13" rx="7" ry="5" fill="#a8e6ff" opacity="0.85" />
      <ellipse cx="25" cy="12" rx="3" ry="2" fill="#fff" opacity="0.35" />
      <rect x="2" y="16" width="7" height="14" rx="3.5" fill={color} opacity="0.75" />
      <rect x="17" y="30" width="6" height="8" fill={C.surface} />
    </svg>
  );
}

/* ─── SUS Badge ─── */
function SusBadge() {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px',
      background: `${C.sus}12`, border: `2px solid ${C.sus}`,
      borderRadius: 3, fontFamily: "'Barlow Condensed',sans-serif",
      fontSize: 13, letterSpacing: '0.15em', color: C.sus,
      transform: 'rotate(-2deg)', flexShrink: 0,
    }}>⚠ SUS</span>
  );
}

/* ─── Glitch hook ─── */
function useGlitch(active = true) {
  const [g, setG] = useState(false);
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      if (Math.random() < 0.07) {
        setG(true);
        setTimeout(() => setG(false), 80);
      }
    }, 200);
    return () => clearInterval(iv);
  }, [active]);
  return g;
}

/* ═══════════════════════════════════════════
   WINDOW CHROME — 4 styles per intensity
   ═══════════════════════════════════════════ */

/* CRITICAL — Emergency Meeting with flashing bars */
function TornWindow({ conflict, onClose, children }) {
  const g = useGlitch(true);
  const cfg = INTENSITY.critical;
  const [flash, setFlash] = useState(true);
  useEffect(() => {
    const iv = setInterval(() => setFlash(f => !f), 600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div style={{
      background: C.surface,
      border: `2px solid ${cfg.color}`,
      boxShadow: `6px 6px 0 ${cfg.color}30, 0 8px 40px rgba(0,0,0,0.2)`,
      position: 'relative', overflow: 'hidden',
      transform: g ? `translate(${(Math.random()-0.5)*3}px, ${(Math.random()-0.5)*2}px)` : 'none',
    }}>
      <div style={{
        height: 4,
        background: flash
          ? 'repeating-linear-gradient(90deg, #fff 0px, #fff 12px, transparent 12px, transparent 24px)'
          : 'repeating-linear-gradient(90deg, transparent 0px, transparent 12px, #fff 12px, #fff 24px)',
      }} />
      <div style={{
        background: cfg.color, padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 24,
            letterSpacing: '0.12em', color: '#fff',
            textShadow: '2px 2px 0 rgba(0,0,0,0.3)',
          }}>🚨 EMERGENCY ALERT</span>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(0,0,0,0.25)', border: '2px solid rgba(255,255,255,0.4)',
          color: '#fff', fontFamily: "'Barlow Condensed',sans-serif",
          fontSize: 15, letterSpacing: '0.1em', borderRadius: 4,
          padding: '5px 14px', cursor: 'pointer',
        }}>DISMISS ✕</button>
      </div>
      <div style={{
        height: 4,
        background: !flash
          ? 'repeating-linear-gradient(90deg, #fff 0px, #fff 12px, transparent 12px, transparent 24px)'
          : 'repeating-linear-gradient(90deg, transparent 0px, transparent 12px, #fff 12px, #fff 24px)',
      }} />
      <div style={{
        height: 6,
        background: `linear-gradient(135deg, ${cfg.color} 33.33%, transparent 33.33%) 0 0, linear-gradient(225deg, ${cfg.color} 33.33%, transparent 33.33%) 0 0`,
        backgroundSize: '12px 6px', backgroundRepeat: 'repeat-x',
      }} />
      {g && <div style={{
        position: 'absolute', left: 0, right: 0,
        top: `${40 + Math.random() * 50}%`,
        height: 2, background: cfg.color, opacity: 0.4, zIndex: 5,
      }} />}
      <div style={{ padding: '24px 26px 28px' }}>{children}</div>
    </div>
  );
}

/* HIGH — Blackboard dark panel */
function BlackboardWindow({ conflict, onClose, children }) {
  const cfg = INTENSITY.high;
  return (
    <div style={{
      background: C.darkPanel, border: `1px solid ${C.borderDark}`,
      boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: cfg.color }} />
      <div style={{
        padding: '12px 20px', borderBottom: `1px solid ${cfg.color}30`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 20, color: cfg.color }}>▓</span>
          <span style={{
            fontFamily: "'Roboto Mono',monospace", fontSize: 12,
            color: C.darkTextDim, letterSpacing: '0.05em',
          }}>chaosdesk://intel/{conflict.id}</span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: `1px solid ${cfg.color}40`, color: cfg.color,
          fontFamily: "'Courier Prime',monospace", fontSize: 18, padding: '2px 12px',
          cursor: 'pointer', borderRadius: 3,
        }}>[×]</button>
      </div>
      <div style={{ padding: '24px 26px 28px' }}>{children}</div>
    </div>
  );
}

/* MEDIUM — Notebook ruled paper */
function NotebookWindow({ conflict, onClose, children }) {
  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`,
      boxShadow: '0 4px 30px rgba(0,0,0,0.12), -3px 0 0 #c94640, -6px 0 0 #c9464020',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 44, width: 1, background: '#c9464030', zIndex: 1 }} />
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'repeating-linear-gradient(transparent, transparent 31px, #c4bfb680 31px, #c4bfb680 32px)',
        backgroundPosition: '0 56px',
      }} />
      <div style={{
        padding: '14px 20px 14px 56px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, letterSpacing: '0.12em', color: C.inkMid }}>
          FIELD REPORT — {conflict.id?.toUpperCase()}
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontFamily: "'Barlow Condensed',sans-serif",
          fontSize: 20, color: C.inkLight, cursor: 'pointer',
        }}>✕</button>
      </div>
      <div style={{ padding: '24px 26px 28px 56px', position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}

/* LOW — Clipboard */
function ClipboardWindow({ conflict, onClose, children }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)',
        width: 80, height: 16, background: C.borderDark, borderRadius: '4px 4px 0 0', zIndex: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ width: 30, height: 8, borderRadius: 4, border: `2px solid ${C.inkFaint}`, background: C.bgWarm }} />
      </div>
      <div style={{
        background: C.surface, border: `1px solid ${C.border}`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.1)', overflow: 'hidden', paddingTop: 8,
      }}>
        <div style={{
          padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.low, opacity: 0.7 }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: C.inkMid }}>
              {conflict.name}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${C.border}`, color: C.inkLight,
            fontSize: 13, fontFamily: "'IBM Plex Mono',monospace", padding: '3px 12px',
            cursor: 'pointer', borderRadius: 3,
          }}>Close</button>
        </div>
        <div style={{ padding: '24px 26px 28px' }}>{children}</div>
      </div>
    </div>
  );
}

const WINDOWS = { torn: TornWindow, blackboard: BlackboardWindow, notebook: NotebookWindow, clipboard: ClipboardWindow };

/* ═══════════════════════════════════════════
   SECTION HEAD
   ═══════════════════════════════════════════ */
function SectionHead({ text, color }) {
  return (
    <div style={{
      fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, letterSpacing: '0.15em',
      color, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ width: 22, height: 3, background: color, borderRadius: 1, display: 'inline-block' }} />
      {text}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CARD CONTENT
   ═══════════════════════════════════════════ */
function CardContent({ conflict, dark = false, onIntel }) {
  const mobile = useIsMobile();
  const cfg = INTENSITY[conflict.intensity] || INTENSITY.low;
  const txt = dark ? C.darkText : C.ink;
  const txtMid = dark ? C.darkTextDim : C.inkMid;
  const txtFaint = dark ? '#ffffff33' : C.inkFaint;
  const borderC = dark ? '#ffffff15' : C.border;
  const surfaceC = dark ? '#ffffff08' : `${C.ink}06`;

  const [memeImgs, setMemeImgs] = useState({});
  useEffect(() => {
    if (!conflict.memes?.length) return;
    conflict.memes.forEach((meme, i) => {
      const params = new URLSearchParams({
        id: conflict.id || '', text: meme.text || '',
        format: meme.format || '',
        text_top: meme.text_top || '', text_bottom: meme.text_bottom || '',
      });
      fetch(`/api/imgflip?${params}`)
        .then(r => r.json())
        .then(d => { if (d.url) setMemeImgs(prev => ({ ...prev, [i]: d.url })); })
        .catch(() => {});
    });
  }, [conflict.id]);

  return (
    <div>
      {/* Title */}
      <h2 style={{
        fontFamily: "'Barlow Condensed',sans-serif", fontSize: 'clamp(28px, 7vw, 44px)', letterSpacing: '0.08em',
        color: txt, margin: '0 0 8px 0', lineHeight: 1.05,
        wordBreak: 'break-word', overflowWrap: 'break-word',
      }}>{conflict.name}</h2>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        <span style={{
          padding: '4px 14px', background: `${cfg.color}12`,
          border: `2px solid ${cfg.color}`, borderRadius: 4,
          fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15,
          letterSpacing: '0.12em', color: cfg.color,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }} />
          {cfg.label}
        </span>
        <span style={{
          padding: '4px 12px', border: `1px solid ${borderC}`, borderRadius: 3,
          fontFamily: "'Roboto Mono',monospace", fontSize: 12, color: dark ? '#ffffff55' : C.inkLight,
        }}>{STATUS[conflict.status] || conflict.status?.toUpperCase()}</span>
      </div>

      {/* Meme title */}
      <div style={{
        fontFamily: "'Courier Prime',monospace", fontSize: 'clamp(16px, 4vw, 22px)', color: cfg.color,
        marginBottom: 16, lineHeight: 1.2, wordBreak: 'break-word',
      }}>{'// '}{conflict.meme_title}</div>

      {/* TLDR */}
      <p style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 'clamp(14px, 3.5vw, 16px)', color: txtMid,
        lineHeight: 1.8, margin: '0 0 22px 0', wordBreak: 'break-word',
      }}>{conflict.tldr}</p>

      {/* Vibe */}
      <div style={{
        padding: '14px 18px', background: surfaceC,
        borderLeft: `4px solid ${cfg.color}`, borderRadius: '0 6px 6px 0',
        marginBottom: 28, fontFamily: "'Courier Prime',monospace",
        fontSize: 22, color: txt, lineHeight: 1.4,
      }}>{conflict.vibe}</div>

      {/* MEME INTEL */}
      {conflict.memes?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead text="MEME INTEL" color={cfg.color} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conflict.memes.map((meme, i) => (
              <div key={i} style={{
                border: `1px solid ${borderC}`, borderRadius: 6, overflow: 'hidden',
                background: dark ? '#ffffff06' : `${C.ink}04`,
              }}>
                {memeImgs[i] ? (
                  <a href={memeImgs[i]} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
                    <img src={memeImgs[i]} alt={meme.format} style={{ width: '100%', display: 'block' }} />
                  </a>
                ) : (
                  <div style={{
                    width: '100%', height: 170, padding: '18px 20px',
                    background: dark ? 'linear-gradient(135deg, #1a1a2e, #16162a)' : `linear-gradient(135deg, ${C.bgCool}, ${C.bgWarm})`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 22, color: dark ? '#fff' : C.ink, textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.2 }}>{meme.text_top || ''}</div>
                    <div style={{ padding: '4px 14px', border: `2px dashed ${cfg.color}50`, borderRadius: 4, fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: cfg.color, opacity: 0.6 }}>[{(meme.format || 'MEME').toUpperCase()}]</div>
                    <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, color: dark ? '#fff' : C.ink, textAlign: 'center', letterSpacing: '0.06em', lineHeight: 1.2 }}>{meme.text_bottom || ''}</div>
                  </div>
                )}
                <div style={{ padding: '8px 14px', borderTop: `1px solid ${borderC}`, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'Courier Prime',monospace", fontSize: 16, color: cfg.color }}>{meme.format}</span>
                  <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: txtFaint }}>via {meme.source || 'unknown'}</span>
                </div>
                {!meme.text_top && meme.text && (
                  <div style={{ padding: '8px 14px', borderTop: `1px solid ${borderC}`, fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, color: txtMid, fontStyle: 'italic', wordBreak: 'break-word' }}>"{meme.text}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DATA — responsive grid */}
      {conflict.data_points && Object.keys(conflict.data_points).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead text="INTEL DATA" color={cfg.color} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            {Object.entries(conflict.data_points).map(([k, v]) => (
              <div key={k} style={{ padding: '12px 16px', background: surfaceC, border: `1px solid ${borderC}`, borderRadius: 4 }}>
                <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, letterSpacing: '0.12em', color: txtFaint, textTransform: 'uppercase', marginBottom: 4 }}>{k}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 'clamp(20px, 5vw, 28px)', color: cfg.color }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* UPDATES */}
      {conflict.latest_updates?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead text="LATEST UPDATES" color={cfg.color} />
          {conflict.latest_updates.map((u, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: `1px solid ${borderC}` }}>
              <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: 18, color: i === 0 ? cfg.color : txtFaint, minWidth: 58, whiteSpace: 'nowrap' }}>{u.date}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, color: txt, marginBottom: 4, wordBreak: 'break-word' }}>{u.headline}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, color: txtMid, lineHeight: 1.6, wordBreak: 'break-word' }}>{u.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HOT TAKE */}
      {conflict.hot_take && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead text="HOT TAKE" color={cfg.color} />
          <div style={{ padding: '18px 20px', background: `${cfg.color}08`, borderLeft: `4px solid ${cfg.color}`, borderRadius: '0 6px 6px 0' }}>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 'clamp(14px, 3.5vw, 16px)', color: txt, lineHeight: 1.7, margin: 0, wordBreak: 'break-word' }}>{conflict.hot_take}</p>
          </div>
        </div>
      )}

      {/* ROASTS — responsive grid with crew figures */}
      {conflict.sides_roasted && Object.keys(conflict.sides_roasted).length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead text="EQUAL OPPORTUNITY ROAST" color={cfg.color} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            {Object.entries(conflict.sides_roasted).map(([side, roast], i) => {
              const colors = [C.critical, C.high, C.low, C.medium, C.accent, '#9c27b0', '#ff9100'];
              const sc = colors[i % colors.length];
              return (
                <div key={side} style={{
                  padding: '16px', background: surfaceC,
                  border: `1px solid ${borderC}`, borderRadius: 6,
                  borderTop: `3px solid ${sc}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <CrewFigure color={sc} size={26} />
                    <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 17, letterSpacing: '0.1em', color: sc }}>{side.toUpperCase()}</span>
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, color: txtMid, lineHeight: 1.6, wordBreak: 'break-word' }}>{roast}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* HISTORICAL PARALLEL */}
      {conflict.historical_parallel && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead text="HISTORICAL PARALLEL" color={cfg.color} />
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, color: txtMid, lineHeight: 1.6, fontStyle: 'italic', wordBreak: 'break-word' }}>{conflict.historical_parallel}</div>
        </div>
      )}

      {/* SUS METER */}
      {conflict.hypocrisy_flags?.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <SectionHead text="SUS METER" color={C.sus} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {conflict.hypocrisy_flags.map((f, i) => (
              <div key={i} style={{
                padding: '12px 16px', background: `${C.sus}06`,
                border: `1px solid ${C.sus}25`, borderRadius: 4,
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <SusBadge />
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, color: C.sus, lineHeight: 1.4, wordBreak: 'break-word' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUTTONS */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => onIntel && onIntel(conflict.id)} style={{
          flex: 1, padding: '14px', background: surfaceC,
          border: `1px solid ${cfg.color}40`, borderRadius: 4,
          fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16,
          letterSpacing: '0.12em', color: cfg.color, cursor: 'pointer',
        }}>🔍 RAW INTEL</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY WINDOW
   ═══════════════════════════════════════════ */
function OverlayWindow({ conflict, onClose, onIntel }) {
  const mobile = useIsMobile();
  const cfg = INTENSITY[conflict.intensity] || INTENSITY.low;
  const Comp = WINDOWS[cfg.windowStyle] || ClipboardWindow;
  const isDark = cfg.windowStyle === 'blackboard';
  const mobileStyle = {
    position: 'fixed', inset: 0,
    width: '100%', maxHeight: '100vh',
    overflowY: 'auto', zIndex: 500,
    animation: 'windowIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  };
  const desktopStyle = {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'min(92%, 540px)', maxHeight: '84vh',
    overflowY: 'auto', zIndex: 500,
    animation: 'windowIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
  };
  return (
    <div style={mobile ? mobileStyle : desktopStyle}>
      <Comp conflict={conflict} onClose={onClose}>
        <CardContent conflict={conflict} dark={isDark} onIntel={onIntel} />
      </Comp>
    </div>
  );
}

/* ═══════════════════════════════════════════
   COLLAPSIBLE INDEX SIDEBAR
   ═══════════════════════════════════════════ */
function IndexSidebar({ conflicts, vibeCheck, selectedId, onSelect, isOpen, onToggle }) {
  const mobile = useIsMobile();
  const sidebarWidth = mobile ? '100%' : 264;
  const toggleLeft = isOpen ? (mobile ? 'calc(100% - 52px)' : 268) : 16;
  return (
    <>
      <button onClick={onToggle} style={{
        position: 'absolute', top: 16, left: toggleLeft,
        zIndex: 600, background: C.surface,
        border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        color: C.ink, fontFamily: "'Barlow Condensed',sans-serif",
        fontSize: mobile ? 15 : 14, letterSpacing: '0.12em',
        padding: mobile ? '10px 18px' : '8px 14px',
        cursor: 'pointer', borderRadius: 4,
        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }}>◀</span>
        {isOpen ? '' : 'INDEX'}
      </button>

      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: sidebarWidth, background: C.surface, borderRight: `1px solid ${C.border}`,
        boxShadow: '4px 0 20px rgba(0,0,0,0.08)', zIndex: 550,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 28, letterSpacing: '0.2em', color: C.ink }}>CHAOSDESK</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
            <div style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 11, letterSpacing: '0.1em', color: C.accent }}>{conflicts?.length || 0} ΕΝΕΡΓΕΣ ΣΥΓΚΡΟΥΣΕΙΣ</div>
            {/* TODO: language toggle — refetch /api/conflicts?lang=el|en */}
            <div style={{ display: 'inline-flex', gap: 4 }}>
              {['ΕΛ', 'EN'].map((lng, i) => (
                <button key={lng} style={{
                  fontFamily: "'Roboto Mono',monospace", fontSize: 10,
                  padding: '2px 8px', border: `1px solid ${i === 0 ? C.accent : C.border}`,
                  color: i === 0 ? C.accent : C.inkFaint,
                  background: 'transparent', cursor: 'pointer', borderRadius: 2,
                }}>{lng}</button>
              ))}
            </div>
          </div>
          {vibeCheck && <div style={{ fontFamily: "'Courier Prime',monospace", fontSize: 14, color: C.inkLight, marginTop: 6, lineHeight: 1.4 }}>{vibeCheck}</div>}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conflicts?.map((c) => {
            const icfg = INTENSITY[c.intensity] || INTENSITY.low;
            const sel = selectedId === c.id;
            return (
              <div key={c.id} onClick={() => onSelect(c)} style={{
                padding: '14px 20px', cursor: 'pointer',
                borderLeft: `3px solid ${sel ? icfg.color : 'transparent'}`,
                background: sel ? `${icfg.color}10` : 'transparent',
                borderBottom: `1px solid ${C.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: C.inkFaint }}>{c.id?.toUpperCase()}</span>
                  <span style={{ fontFamily: "'Roboto Mono',monospace", fontSize: 10, color: icfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: icfg.color }} />{icfg.label}
                  </span>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 20, color: C.ink, lineHeight: 1.1 }}>{c.name}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: C.inkLight, marginTop: 2 }}>{c.region}</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.border}`, fontFamily: "'Roboto Mono',monospace", fontSize: 9, color: C.inkFaint, display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
          <span>SONAR-PRO</span><span style={{ color: C.accent }}>● LIVE</span>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   MAIN MAP COMPONENT
   ═══════════════════════════════════════════ */
export default function MapView({ conflicts, vibeCheck, onIntel }) {
  const mobile = useIsMobile();
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const mapLoadedRef = useRef(false);
  const markersRef = useRef([]);
  const conflictsRef = useRef(conflicts);
  const mlRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [activeConflict, setActiveConflict] = useState(null);

  // Keep ref in sync with prop
  useEffect(() => {
    conflictsRef.current = conflicts;
    // If map already loaded, update markers immediately
    if (mapLoadedRef.current && mapRef.current && conflicts?.length > 0) {
      addMarkersToMap(mapRef.current);
    }
  }, [conflicts]);

  // Init map once on mount
  useEffect(() => { if (mapRef.current || !mapContainer.current) return; initMap(); }, []);

  async function initMap() {
    const ml = await import('maplibre-gl');
    mlRef.current = ml.default;
    const map = new ml.default.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: { countries: { type: 'geojson', data: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson', generateId: true } },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#cec9c0' } },
          { id: 'countries-fill', type: 'fill', source: 'countries', paint: { 'fill-color': ['case', ['boolean', ['feature-state', 'hover'], false], '#c4bfb6', '#d8d4cb'], 'fill-opacity': 1 } },
          { id: 'countries-border', type: 'line', source: 'countries', paint: { 'line-color': '#a8a39a', 'line-width': 0.8 } },
          { id: 'countries-border-glow', type: 'line', source: 'countries', paint: { 'line-color': '#1a8a3e', 'line-width': 1.5, 'line-opacity': 0.06, 'line-blur': 3 } }
        ]
      },
      center: [20, 15], zoom: 2, minZoom: 1.5, maxZoom: 12,
    });
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
      hoveredId = null; map.getCanvas().style.cursor = '';
    });
    map.on('load', () => {
      mapRef.current = map;
      mapLoadedRef.current = true;
      addCountryLabels(map);
      if (conflictsRef.current?.length > 0) addMarkersToMap(map);
    });
  }

  function addCountryLabels(map) {
    fetch('https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson')
      .then(r => r.json()).then(data => {
        const centroids = { type: 'FeatureCollection', features: data.features.map(f => {
          try {
            const coords = f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0];
            const lngs = coords.map(c => c[0]), lats = coords.map(c => c[1]);
            return { type: 'Feature', geometry: { type: 'Point', coordinates: [(Math.min(...lngs)+Math.max(...lngs))/2, (Math.min(...lats)+Math.max(...lats))/2] }, properties: { name: f.properties.ADMIN || f.properties.name || '' } };
          } catch { return null; }
        }).filter(Boolean) };
        map.addSource('labels', { type: 'geojson', data: centroids });
        map.addLayer({
          id: 'country-labels', type: 'symbol', source: 'labels',
          layout: { 'text-field': ['get', 'name'], 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 4, 13, 6, 16], 'text-max-width': 8, 'text-anchor': 'center', 'text-allow-overlap': false },
          paint: { 'text-color': '#8a8578', 'text-halo-color': '#d8d4cb', 'text-halo-width': 2, 'text-opacity': ['interpolate', ['linear'], ['zoom'], 2, 0.6, 3, 0.9] }
        });
      }).catch(() => {});
  }

  function addMarkersToMap(map) {
    const ML = mlRef.current; if (!ML) return;
    markersRef.current.forEach(m => m.remove()); markersRef.current = [];
    conflictsRef.current?.forEach(c => {
      if (c.lat == null || c.lng == null) return;
      const col = INTENSITY[c.intensity]?.color || C.low;
      const size = c.intensity === 'critical' ? 18 : c.intensity === 'high' ? 14 : 10;
      const dur = c.intensity === 'critical' ? '1.2s' : '2s';
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'width:0;height:0;overflow:visible;position:relative;cursor:pointer;';
      const ring1 = document.createElement('div');
      ring1.style.cssText = `position:absolute;width:${size+16}px;height:${size+16}px;border-radius:50%;border:1.5px solid ${col};transform:translate(-50%,-50%);animation:pinRing ${dur} ease-out infinite;pointer-events:none;`;
      const ring2 = document.createElement('div');
      ring2.style.cssText = `position:absolute;width:${size+8}px;height:${size+8}px;border-radius:50%;border:1px solid ${col};transform:translate(-50%,-50%);animation:pinRing ${dur} ease-out infinite;animation-delay:0.4s;pointer-events:none;`;
      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${col};border:2.5px solid ${C.surface};box-shadow:0 0 ${size*1.5}px ${col}50,0 2px 8px rgba(0,0,0,0.3);transform:translate(-50%,-50%);transition:transform .2s;`;
      wrapper.appendChild(ring1); wrapper.appendChild(ring2); wrapper.appendChild(dot);
      const tooltip = document.createElement('div');
      tooltip.style.cssText = `position:absolute;left:0;transform:translate(-50%,calc(-${Math.ceil(size/2)}px - 100% - 6px));background:${C.surface};border:1px solid ${col}66;padding:4px 10px;white-space:nowrap;font-family:'Barlow Condensed',sans-serif;font-size:14px;color:${col};letter-spacing:0.1em;pointer-events:none;opacity:0;transition:opacity .2s;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,0.15);border-radius:3px;`;
      tooltip.textContent = c.meme_title || c.name;
      wrapper.appendChild(tooltip);
      wrapper.addEventListener('mouseenter', () => { dot.style.transform = 'translate(-50%,-50%) scale(1.3)'; tooltip.style.opacity = '1'; });
      wrapper.addEventListener('mouseleave', () => { dot.style.transform = 'translate(-50%,-50%)'; tooltip.style.opacity = '0'; });
      const marker = new ML.Marker({ element: wrapper, anchor: 'center' }).setLngLat([c.lng, c.lat]).addTo(map);
      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        map.flyTo({ center: [c.lng, c.lat], zoom: 5, duration: 1400, essential: true });
        setActiveConflict(c);
      });
      markersRef.current.push(marker);
    });
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        @keyframes pinRing { 0% { transform: translate(-50%,-50%) scale(0.6); opacity: 0.8; } 100% { transform: translate(-50%,-50%) scale(2); opacity: 0; } }
        @keyframes windowIn { from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
      `}</style>
      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
      <TimeStamp />
      <IndexSidebar conflicts={conflicts} vibeCheck={vibeCheck} selectedId={activeConflict?.id} onSelect={(c) => { mapRef.current?.flyTo({ center: [c.lng, c.lat], zoom: 5, duration: 1400 }); setActiveConflict(c); }} isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      {activeConflict && <OverlayWindow conflict={activeConflict} onClose={() => setActiveConflict(null)} onIntel={onIntel} />}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 20px',
        background: `linear-gradient(0deg, ${C.bg}ee, transparent)`,
        display: 'flex', justifyContent: 'center', gap: 20,
        fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: C.inkLight, zIndex: 50,
      }}>
        {mobile ? (
          <span><span style={{ color: C.accent }}>●</span> {conflicts?.length || 0} CONFLICTS · LIVE</span>
        ) : (
          <>
            {Object.entries(INTENSITY).map(([key, icfg]) => (
              <span key={key}><span style={{ color: icfg.color }}>●</span> {conflicts?.filter(c => c.intensity === key).length || 0} {icfg.label}</span>
            ))}
            <span style={{ color: C.accent }}>● LIVE</span>
          </>
        )}
      </div>
    </div>
  );
}

function TimeStamp() {
  const [t, setT] = useState('');
  useEffect(() => { const tick = () => setT(new Date().toISOString().replace('T', '  ').slice(0, 21) + ' UTC'); tick(); const i = setInterval(tick, 1000); return () => clearInterval(i); }, []);
  return <div style={{ position: 'absolute', top: 16, right: 20, zIndex: 600, fontFamily: "'Roboto Mono',monospace", fontSize: 11, color: C.inkFaint, background: `${C.surface}cc`, padding: '6px 14px', border: `1px solid ${C.border}`, borderRadius: 3 }}>{t}</div>;
}
