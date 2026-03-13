'use client';
import { useEffect, useRef, useState } from 'react';
import 'maplibre-gl/dist/maplibre-gl.css';

/* ═══════════════════════════════════════════════════════
   CHAOSDESK v4 — Light theme, overlay windows on map
   Different window chrome per intensity level
   ═══════════════════════════════════════════════════════ */

const C = {
  bg: '#e8e4dd', bgWarm: '#ddd8cf', bgCool: '#d4d0ca',
  surface: '#f2efe9', surfaceHover: '#eae6df',
  mapBg: '#cec9c0', mapGrid: '#b8b3a9', mapLand: '#d8d4cb',
  critical: '#d4163c', high: '#c94600', medium: '#8a7000', low: '#0077a8',
  accent: '#1a8a3e',
  ink: '#1c1a17', inkMid: '#3d3a35', inkLight: '#6b6660', inkFaint: '#9e9890',
  border: '#c4bfb6', borderDark: '#a8a39a',
  darkPanel: '#1c1a17', darkText: '#e8e4dd', darkTextDim: '#e8e4dd88',
};

const INTENSITY = {
  critical: { color: C.critical, label: 'CRITICAL', windowStyle: 'torn' },
  high:     { color: C.high,     label: 'HIGH',     windowStyle: 'blackboard' },
  medium:   { color: C.medium,   label: 'MEDIUM',   windowStyle: 'notebook' },
  low:      { color: C.low,      label: 'LOW',      windowStyle: 'clipboard' },
};

const STATUS = {
  active_combat: 'ACTIVE COMBAT', escalating: 'ESCALATING',
  ceasefire: 'CEASEFIRE', negotiations: 'NEGOTIATIONS', frozen: 'FROZEN',
};

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

/* CRITICAL — Torn urgent dispatch */
function TornWindow({ conflict, onClose, children }) {
  const g = useGlitch(true);
  const cfg = INTENSITY.critical;
  return (
    <div style={{
      background: C.surface,
      border: `2px solid ${cfg.color}`,
      boxShadow: `6px 6px 0 ${cfg.color}30, 0 8px 40px rgba(0,0,0,0.2)`,
      position: 'relative', overflow: 'hidden',
      transform: g ? `translate(${(Math.random()-0.5)*3}px, ${(Math.random()-0.5)*2}px)` : 'none',
    }}>
      <div style={{
        background: cfg.color, padding: '10px 18px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: '0.15em', color: '#fff' }}>⚠ CRITICAL ALERT</span>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: '#ffffff90' }}>{conflict.id?.toUpperCase()}</span>
        </div>
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff',
          fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: '0.1em',
          padding: '4px 12px', cursor: 'pointer',
        }}>CLOSE ✕</button>
      </div>
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
      <div style={{ padding: '22px 24px 26px' }}>{children}</div>
    </div>
  );
}

/* HIGH — Blackboard / dark contrast panel */
function BlackboardWindow({ conflict, onClose, children }) {
  const cfg = INTENSITY.high;
  return (
    <div style={{
      background: C.darkPanel, border: `1px solid ${C.borderDark}`,
      boxShadow: '0 8px 40px rgba(0,0,0,0.3), 0 2px 0 rgba(255,255,255,0.05) inset',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ height: 3, background: cfg.color }} />
      <div style={{
        padding: '10px 18px', borderBottom: `1px solid ${cfg.color}30`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'VT323',monospace", fontSize: 18, color: cfg.color }}>█</span>
          <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 12, color: C.darkTextDim, letterSpacing: '0.05em' }}>
            chaosdesk://intel/{conflict.id}
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: `1px solid ${cfg.color}40`, color: cfg.color,
          fontFamily: "'VT323',monospace", fontSize: 16, padding: '2px 10px', cursor: 'pointer',
        }}>[×]</button>
      </div>
      <div style={{
        padding: '6px 18px', borderBottom: '1px solid #ffffff10',
        fontFamily: "'Share Tech Mono',monospace", fontSize: 11, color: C.darkTextDim,
      }}>
        <span style={{ color: cfg.color }}>❯</span> fetch --conflict {conflict.id} --priority high
      </div>
      <div style={{ padding: '22px 24px 26px' }}>{children}</div>
    </div>
  );
}

/* MEDIUM — Notebook / field notes */
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
        padding: '12px 18px 12px 56px', borderBottom: `1px solid ${C.border}`,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: '0.12em', color: C.inkMid }}>
          FIELD REPORT — {conflict.id?.toUpperCase()}
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 18, color: C.inkLight, cursor: 'pointer',
        }}>✕</button>
      </div>
      <div style={{ padding: '22px 24px 26px 56px', position: 'relative', zIndex: 2 }}>{children}</div>
    </div>
  );
}

/* LOW — Clean clipboard */
function ClipboardWindow({ conflict, onClose, children }) {
  const cfg = INTENSITY.low;
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
          padding: '10px 18px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, opacity: 0.7 }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: C.inkMid, letterSpacing: '0.05em' }}>
              {conflict.id?.toUpperCase()} — {conflict.name}
            </span>
          </div>
          <button onClick={onClose} style={{
            background: 'none', border: `1px solid ${C.border}`, color: C.inkLight,
            fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", padding: '3px 10px',
            cursor: 'pointer', borderRadius: 2,
          }}>Close</button>
        </div>
        <div style={{ padding: '22px 24px 26px' }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Window picker ─── */
const WINDOWS = { torn: TornWindow, blackboard: BlackboardWindow, notebook: NotebookWindow, clipboard: ClipboardWindow };

/* ═══════════════════════════════════════════
   CARD CONTENT — shared across window styles
   ═══════════════════════════════════════════ */
function SectionHead({ text, color }) {
  return (
    <div style={{
      fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: '0.15em',
      color, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span style={{ width: 18, height: 2, background: color, display: 'inline-block' }} />
      {text}
    </div>
  );
}

function CardContent({ conflict, dark = false }) {
  const cfg = INTENSITY[conflict.intensity] || INTENSITY.low;
  const txt = dark ? C.darkText : C.ink;
  const txtMid = dark ? C.darkTextDim : C.inkMid;
  const txtLight = dark ? '#ffffff55' : C.inkLight;
  const txtFaint = dark ? '#ffffff33' : C.inkFaint;
  const borderC = dark ? '#ffffff15' : C.border;
  const surfaceC = dark ? '#ffffff08' : `${C.ink}06`;

  const [memeImg, setMemeImg] = useState(null);

  // Imgflip fetch
  useEffect(() => {
    const text = conflict.memes?.find(m => m.format === 'meme')?.text || conflict.memes?.[0]?.text;
    if (!text) return;
    fetch(`/api/imgflip?id=${encodeURIComponent(conflict.id)}&text=${encodeURIComponent(text)}`)
      .then(r => r.json())
      .then(d => { if (d.url) setMemeImg(d.url); })
      .catch(() => {});
  }, [conflict.id]);

  return (
    <div>
      {/* Title */}
      <h2 style={{
        fontFamily: "'Bebas Neue',sans-serif", fontSize: 40, letterSpacing: '0.1em',
        color: txt, margin: '0 0 6px 0', lineHeight: 1.05,
        wordBreak: 'break-word', overflowWrap: 'break-word',
      }}>{conflict.name}</h2>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <span style={{
          padding: '3px 12px', background: `${cfg.color}15`, border: `1.5px solid ${cfg.color}80`,
          fontFamily: "'Share Tech Mono',monospace", fontSize: 11, letterSpacing: '0.1em', color: cfg.color,
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }} />
          {cfg.label}
        </span>
        <span style={{
          padding: '3px 10px', border: `1px solid ${borderC}`,
          fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: '0.08em', color: txtLight,
        }}>{STATUS[conflict.status] || conflict.status?.toUpperCase()}</span>
        <span style={{
          fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: '0.08em', color: txtFaint,
        }}>{conflict.region?.toUpperCase()}</span>
      </div>

      {/* Meme title */}
      <div style={{
        fontFamily: "'VT323',monospace", fontSize: 17, color: cfg.color, marginBottom: 14,
        wordBreak: 'break-word',
      }}>{'// '}{conflict.meme_title}</div>

      {/* TLDR */}
      <p style={{
        fontFamily: "'IBM Plex Mono',monospace", fontSize: 14, color: txtMid,
        lineHeight: 1.75, margin: '0 0 20px 0',
        wordBreak: 'break-word',
      }}>{conflict.tldr}</p>

      {/* Vibe */}
      <div style={{
        padding: '12px 16px', background: surfaceC, borderLeft: `3px solid ${cfg.color}`,
        marginBottom: 24, fontFamily: "'VT323',monospace", fontSize: 18, color: txt, lineHeight: 1.5,
      }}>{conflict.vibe}</div>

      {/* ── MEME INTEL section ── */}
      {(conflict.memes?.length > 0 || memeImg) && (
        <div style={{ marginBottom: 24 }}>
          <SectionHead text="MEME INTEL" color={cfg.color} />
          {/* Imgflip generated image */}
          {memeImg && (
            <a href={memeImg} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: 12 }}>
              <img src={memeImg} alt="meme" style={{
                width: '100%', display: 'block', border: `1px solid ${borderC}`,
              }} />
            </a>
          )}
          {/* Meme cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {conflict.memes?.map((meme, i) => (
              <div key={i} style={{
                border: `1px solid ${borderC}`, overflow: 'hidden',
                background: dark ? '#ffffff06' : `${C.ink}04`,
              }}>
                {/* Meme image placeholder */}
                <div style={{
                  width: '100%', height: 160,
                  background: dark
                    ? `linear-gradient(135deg, #1a1a2e, #16162a)`
                    : `linear-gradient(135deg, ${C.bgCool}, ${C.bgWarm})`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    fontFamily: "'Bebas Neue',sans-serif", fontSize: 18,
                    color: dark ? '#fff' : C.ink, textAlign: 'center',
                    textShadow: dark ? '2px 2px 0 #000, -1px -1px 0 #000' : '1px 1px 0 rgba(255,255,255,0.8)',
                    letterSpacing: '0.08em', padding: '0 16px', lineHeight: 1.2,
                    position: 'absolute', top: 14,
                  }}>{meme.text_top || ''}</div>
                  <div style={{
                    padding: '5px 12px', border: `1.5px dashed ${cfg.color}60`,
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
                    letterSpacing: '0.1em', color: cfg.color, opacity: 0.7,
                  }}>[{(meme.format || 'MEME').toUpperCase()}]</div>
                  <div style={{
                    fontFamily: "'Bebas Neue',sans-serif", fontSize: 16,
                    color: dark ? '#fff' : C.ink, textAlign: 'center',
                    textShadow: dark ? '2px 2px 0 #000, -1px -1px 0 #000' : '1px 1px 0 rgba(255,255,255,0.8)',
                    letterSpacing: '0.06em', padding: '0 16px', lineHeight: 1.2,
                    position: 'absolute', bottom: 14,
                  }}>{meme.text_bottom || ''}</div>
                  <div style={{
                    position: 'absolute', bottom: 3, right: 6,
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                    letterSpacing: '0.05em', color: dark ? '#ffffff25' : `${C.ink}25`,
                  }}>IMGFLIP PENDING</div>
                </div>
                {/* Source bar */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '6px 12px', borderTop: `1px solid ${borderC}`,
                }}>
                  <span style={{ fontFamily: "'VT323',monospace", fontSize: 14, color: cfg.color }}>
                    {meme.format || 'meme'}
                  </span>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: '0.05em', color: txtFaint,
                  }}>via {meme.source || 'unknown'}</span>
                </div>
                {/* Full meme text fallback if no top/bottom */}
                {!meme.text_top && meme.text && (
                  <div style={{
                    padding: '8px 12px', borderTop: `1px solid ${borderC}`,
                    fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: txtMid,
                    lineHeight: 1.5, fontStyle: 'italic',
                  }}>"{meme.text}"</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data points */}
      {conflict.data_points && Object.keys(conflict.data_points).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHead text="INTEL DATA" color={cfg.color} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8 }}>
            {Object.entries(conflict.data_points).map(([k, v]) => (
              <div key={k} style={{ padding: '10px 14px', background: surfaceC, border: `1px solid ${borderC}` }}>
                <div style={{
                  fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: '0.1em',
                  color: txtFaint, textTransform: 'uppercase', marginBottom: 4,
                }}>{k}</div>
                <div style={{
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, color: cfg.color, letterSpacing: '0.04em',
                }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Latest updates */}
      {conflict.latest_updates?.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHead text="LATEST UPDATES" color={cfg.color} />
          {conflict.latest_updates.map((u, i) => (
            <div key={i} style={{
              display: 'flex', gap: 14, padding: '12px 0', borderBottom: `1px solid ${borderC}`,
            }}>
              <div style={{
                fontFamily: "'VT323',monospace", fontSize: 16,
                color: i === 0 ? cfg.color : txtFaint, minWidth: 56, whiteSpace: 'nowrap',
              }}>{u.date}</div>
              <div>
                <div style={{
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: '0.04em',
                  color: txt, marginBottom: 3,
                }}>{u.headline}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: txtMid, lineHeight: 1.6,
                }}>{u.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hot take */}
      {conflict.hot_take && (
        <div style={{ marginBottom: 24 }}>
          <SectionHead text="HOT TAKE" color={cfg.color} />
          <div style={{
            padding: '16px 20px', background: `${cfg.color}08`, borderLeft: `4px solid ${cfg.color}`,
          }}>
            <p style={{
              fontFamily: "'IBM Plex Mono',monospace", fontSize: 15, color: txt,
              lineHeight: 1.7, margin: 0, fontWeight: 500,
            }}>{conflict.hot_take}</p>
          </div>
        </div>
      )}

      {/* Sides roasted */}
      {conflict.sides_roasted && Object.keys(conflict.sides_roasted).length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <SectionHead text="EQUAL OPPORTUNITY ROAST" color={cfg.color} />
          {Object.entries(conflict.sides_roasted).map(([side, roast], i) => {
            const sc = [C.critical, C.high, C.low, C.medium, C.accent][i % 5];
            return (
              <div key={side} style={{ padding: '12px 0', borderBottom: `1px solid ${borderC}` }}>
                <div style={{
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: '0.1em',
                  color: sc, marginBottom: 4,
                }}>▸ {side.toUpperCase()}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: txtMid,
                  lineHeight: 1.6, paddingLeft: 16,
                }}>{roast}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Historical parallel */}
      {conflict.historical_parallel && (
        <div style={{ marginBottom: 24 }}>
          <SectionHead text="HISTORICAL PARALLEL" color={cfg.color} />
          <div style={{
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: txtMid,
            lineHeight: 1.6, fontStyle: 'italic',
          }}>{conflict.historical_parallel}</div>
        </div>
      )}

      {/* Hypocrisy flags */}
      {conflict.hypocrisy_flags?.length > 0 && (
        <div>
          <SectionHead text="HYPOCRISY FLAGS" color={C.critical} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {conflict.hypocrisy_flags.map((f, i) => (
              <span key={i} style={{
                fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: C.critical,
                padding: '4px 10px', border: `1px solid ${C.critical}40`, background: `${C.critical}08`,
              }}>⚠ {f}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   OVERLAY WINDOW — wraps chrome + content
   ═══════════════════════════════════════════ */
function OverlayWindow({ conflict, onClose }) {
  const cfg = INTENSITY[conflict.intensity] || INTENSITY.low;
  const Comp = WINDOWS[cfg.windowStyle] || ClipboardWindow;
  const isDark = cfg.windowStyle === 'blackboard';

  return (
    <div style={{
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'min(92vw, 520px)', maxHeight: '82vh',
      overflowY: 'auto', overflowX: 'hidden', zIndex: 500,
      animation: 'windowIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      <Comp conflict={conflict} onClose={onClose}>
        <CardContent conflict={conflict} dark={isDark} />
      </Comp>
    </div>
  );
}

/* ═══════════════════════════════════════════
   COLLAPSIBLE INDEX SIDEBAR
   ═══════════════════════════════════════════ */
function IndexSidebar({ conflicts, vibeCheck, selectedId, onSelect, isOpen, onToggle }) {
  return (
    <>
      {/* Toggle button */}
      <button onClick={onToggle} style={{
        position: 'absolute', top: 16,
        left: isOpen ? 268 : 16,
        zIndex: 600, background: C.surface,
        border: `1px solid ${C.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        color: C.ink, fontFamily: "'Bebas Neue',sans-serif",
        fontSize: 13, letterSpacing: '0.12em', padding: '8px 14px', cursor: 'pointer',
        transition: 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{
          display: 'inline-block',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s',
        }}>◀</span>
        {isOpen ? '' : 'INDEX'}
      </button>

      {/* Panel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: 264, background: C.surface, borderRight: `1px solid ${C.border}`,
        boxShadow: '4px 0 20px rgba(0,0,0,0.08)', zIndex: 550,
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{
            fontFamily: "'Bebas Neue',sans-serif", fontSize: 26, letterSpacing: '0.2em', color: C.ink,
          }}>CHAOSDESK</div>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: '0.1em',
            color: C.accent, marginTop: 2,
          }}>{conflicts?.length || 0} ACTIVE CONFLICTS</div>
          {vibeCheck && (
            <div style={{
              fontFamily: "'VT323',monospace", fontSize: 13, color: C.inkLight,
              marginTop: 6, lineHeight: 1.4,
            }}>{vibeCheck}</div>
          )}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conflicts?.map((c) => {
            const cfg = INTENSITY[c.intensity] || INTENSITY.low;
            const sel = selectedId === c.id;
            return (
              <div key={c.id} onClick={() => onSelect(c)} style={{
                padding: '14px 20px', cursor: 'pointer',
                borderLeft: `3px solid ${sel ? cfg.color : 'transparent'}`,
                background: sel ? `${cfg.color}10` : 'transparent',
                borderBottom: `1px solid ${C.border}`,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.inkFaint, letterSpacing: '0.05em',
                  }}>{c.id?.toUpperCase()}</span>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 9, letterSpacing: '0.08em', color: cfg.color,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
                    {cfg.label}
                  </span>
                </div>
                <div style={{
                  fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: '0.08em',
                  color: C.ink, marginBottom: 2, lineHeight: 1.1,
                }}>{c.name}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: C.inkLight,
                }}>{c.region}</div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '10px 20px', borderTop: `1px solid ${C.border}`,
          fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: C.inkFaint, letterSpacing: '0.05em',
          display: 'flex', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <span>SONAR-PRO</span>
          <span style={{ color: C.accent }}>● LIVE</span>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   MAIN MAP COMPONENT
   ═══════════════════════════════════════════ */
export default function MapView({ conflicts, vibeCheck, onIntel }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const conflictsRef = useRef(conflicts);
  const mlRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
            paint: { 'background-color': '#cec9c0' }
          },
          {
            id: 'countries-fill',
            type: 'fill',
            source: 'countries',
            paint: {
              'fill-color': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                '#c4bfb6',
                '#d8d4cb'
              ],
              'fill-opacity': 1
            }
          },
          {
            id: 'countries-border',
            type: 'line',
            source: 'countries',
            paint: {
              'line-color': '#a8a39a',
              'line-width': 0.8,
              'line-opacity': 1
            }
          },
          {
            id: 'countries-border-glow',
            type: 'line',
            source: 'countries',
            paint: {
              'line-color': '#1a8a3e',
              'line-width': 1.5,
              'line-opacity': 0.06,
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
            'text-color': '#8a8578',
            'text-halo-color': '#d8d4cb',
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
      const col = INTENSITY[c.intensity]?.color || C.low;
      const size = c.intensity === 'critical' ? 18 : c.intensity === 'high' ? 14 : 10;
      const dur = c.intensity === 'critical' ? '1.2s' : '2s';

      const wrapper = document.createElement('div');
      wrapper.style.cssText = `width:0;height:0;overflow:visible;position:relative;cursor:pointer;`;

      const ring1 = document.createElement('div');
      ring1.style.cssText = `position:absolute;width:${size+16}px;height:${size+16}px;border-radius:50%;border:1.5px solid ${col};transform:translate(-50%,-50%);animation:pinRing ${dur} ease-out infinite;pointer-events:none;`;

      const ring2 = document.createElement('div');
      ring2.style.cssText = `position:absolute;width:${size+8}px;height:${size+8}px;border-radius:50%;border:1px solid ${col};transform:translate(-50%,-50%);animation:pinRing ${dur} ease-out infinite;animation-delay:0.4s;pointer-events:none;`;

      const dot = document.createElement('div');
      dot.style.cssText = `position:absolute;width:${size}px;height:${size}px;border-radius:50%;background:${col};border:2.5px solid ${C.surface};box-shadow:0 0 ${size*1.5}px ${col}50,0 2px 8px rgba(0,0,0,0.3);transform:translate(-50%,-50%);transition:transform .2s;`;

      wrapper.appendChild(ring1);
      wrapper.appendChild(ring2);
      wrapper.appendChild(dot);

      const tooltip = document.createElement('div');
      tooltip.style.cssText = `position:absolute;left:0;transform:translate(-50%,calc(-${Math.ceil(size/2)}px - 100% - 6px));background:${C.surface};border:1px solid ${col}66;padding:4px 8px;white-space:nowrap;font-family:'Bebas Neue',sans-serif;font-size:13px;color:${col};letter-spacing:0.1em;pointer-events:none;opacity:0;transition:opacity .2s;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,0.15);`;
      tooltip.textContent = c.meme_title || c.name;
      wrapper.appendChild(tooltip);

      wrapper.addEventListener('mouseenter', () => { dot.style.transform = 'translate(-50%,-50%) scale(1.3)'; tooltip.style.opacity = '1'; });
      wrapper.addEventListener('mouseleave', () => { dot.style.transform = 'translate(-50%,-50%)'; tooltip.style.opacity = '0'; });

      const marker = new ML.Marker({ element: wrapper, anchor: 'center' })
        .setLngLat([c.lng, c.lat])
        .addTo(map);

      wrapper.addEventListener('click', (e) => {
        e.stopPropagation();
        map.flyTo({ center: [c.lng, c.lat], zoom: 5, duration: 1400, essential: true });
        setActiveConflict(c);
      });

      markersRef.current.push(marker);
    });
  }

  function handleSelectFromIndex(c) {
    mapRef.current?.flyTo({ center: [c.lng, c.lat], zoom: 5, duration: 1400, essential: true });
    setActiveConflict(c);
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <style>{`
        @keyframes pinRing {
          0% { transform: translate(-50%,-50%) scale(0.6); opacity: 0.8; }
          100% { transform: translate(-50%,-50%) scale(2); opacity: 0; }
        }
        @keyframes windowIn {
          from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>

      <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />

      {/* Top right timestamp */}
      <TimeStamp />

      {/* Collapsible index sidebar */}
      <IndexSidebar
        conflicts={conflicts}
        vibeCheck={vibeCheck}
        selectedId={activeConflict?.id}
        onSelect={handleSelectFromIndex}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Overlay window — one at a time */}
      {activeConflict && (
        <OverlayWindow
          conflict={activeConflict}
          onClose={() => setActiveConflict(null)}
        />
      )}

      {/* Bottom status bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '10px 20px',
        background: `linear-gradient(0deg, ${C.bg}ee, transparent)`,
        display: 'flex', justifyContent: 'center', gap: 20,
        fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
        letterSpacing: '0.08em', color: C.inkLight, zIndex: 50,
      }}>
        {Object.entries(INTENSITY).map(([key, cfg]) => (
          <span key={key}>
            <span style={{ color: cfg.color }}>●</span>{' '}
            {conflicts?.filter(c => c.intensity === key).length || 0} {cfg.label}
          </span>
        ))}
        <span style={{ color: C.accent }}>● LIVE</span>
      </div>
    </div>
  );
}

/* ─── Timestamp ─── */
function TimeStamp() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => setT(new Date().toISOString().replace('T', '  ').slice(0, 21) + ' UTC');
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);
  return (
    <div style={{
      position: 'absolute', top: 16, right: 20, zIndex: 600,
      fontFamily: "'Share Tech Mono',monospace", fontSize: 10,
      letterSpacing: '0.08em', color: C.inkFaint,
      background: `${C.surface}cc`, padding: '6px 12px',
      border: `1px solid ${C.border}`,
    }}>{t}</div>
  );
}
