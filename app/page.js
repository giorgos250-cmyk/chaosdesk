'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const MapView = dynamic(() => import('./components/Map'), { ssr: false });

const NEON = { critical:'#ff006e', high:'#ff4d00', medium:'#ffff00', low:'#00f5ff' };
const SLABEL = { active_combat:'💥 ACTIVE', escalating:'📈 ESCALATING', ceasefire:'🤝 CEASEFIRE', negotiations:'🗣️ TALKS', frozen:'🧊 FROZEN' };
const BOOT = [
  ["> CHAOSDESK v2.0 — INITIALIZING...", "#39ff14"],
  ["> LOADING EQUAL OPPORTUNITY CHAOS ENGINE... [OK]", "#00f5ff"],
  ["> CONNECTING TO GLOBAL NEWS SOURCES... [OK]", "#39ff14"],
  ["> CALIBRATING HYPOCRISY DETECTOR (all sides)...", "#ffff00"],
  ["> LOADING HISTORICAL PARALLEL DATABASE... [OK]", "#00f5ff"],
  ["> WARNING: NO SIDE IS SAFE FROM THE ROAST", "#ff006e"],
  ["> WE ARE SO COOKED. STANDING BY.", "#39ff14"],
];

function Card({ c, i, onIntel }) {
  const [exp, setExp] = useState(false);
  const [memeImg, setMemeImg] = useState(null);
  const col = NEON[c.intensity] || '#00f5ff';
  const tilt = ((i % 7) - 3) * 0.4;

  useEffect(() => {
    const text = c.memes?.find(m => m.format === 'meme')?.text || c.memes?.[0]?.text;
    if (!text) return;
    fetch(`/api/imgflip?id=${encodeURIComponent(c.id)}&text=${encodeURIComponent(text)}`)
      .then(r => r.json())
      .then(d => { if (d.url) setMemeImg(d.url); })
      .catch(() => {});
  }, [c.id]);
  return (
    <div id={`c-${c.id}`} style={{background:'#0a0a0f',border:`1px solid ${col}44`,boxShadow:`0 0 20px ${col}15`,transform:`rotate(${tilt}deg)`,display:'flex',flexDirection:'column',transition:'transform .2s',animation:`cin .5s ease ${i*60}ms both`,position:'relative',overflow:'hidden'}}
      onMouseEnter={e=>e.currentTarget.style.transform='rotate(0) translateY(-3px) scale(1.01)'}
      onMouseLeave={e=>e.currentTarget.style.transform=`rotate(${tilt}deg)`}>
      <div style={{height:2,background:`linear-gradient(90deg,${col},transparent)`}}/>
      <div style={{display:'flex',gap:8,padding:'10px 13px 0',flexWrap:'wrap',alignItems:'center'}}>
        <span style={{fontFamily:'VT323,monospace',fontSize:11,color:col,border:`1px solid ${col}66`,padding:'1px 7px',letterSpacing:'0.12em'}}>{c.intensity?.toUpperCase()}</span>
        <span style={{fontFamily:'VT323,monospace',fontSize:10,color:'#3a3a5a'}}>{SLABEL[c.status]||c.status}</span>
        <span style={{fontFamily:'VT323,monospace',fontSize:9,color:'#222232',marginLeft:'auto'}}>{c.region}</span>
      </div>
      <div style={{fontFamily:"'Bebas Neue',Impact,sans-serif",fontSize:'clamp(20px,3.5vw,28px)',letterSpacing:'0.04em',padding:'7px 13px 2px',lineHeight:1.1,color:'#f0ece3'}}>{c.meme_title}</div>
      <div style={{fontFamily:'VT323,monospace',fontSize:10,color:'#333350',padding:'0 13px 8px',letterSpacing:'0.08em'}}>{c.name}</div>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#7a7875',padding:'0 13px 10px',lineHeight:1.65,borderBottom:'1px solid #14141e'}}>{c.tldr}</div>
      <div style={{fontFamily:'VT323,monospace',fontSize:15,padding:'9px 13px 3px',color:col}}>{c.vibe}</div>
      <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:'#9a9895',padding:'0 13px 12px',lineHeight:1.7,fontStyle:'italic',flex:1}}>{c.hot_take}</div>
      {memeImg && (
        <a href={memeImg} target="_blank" rel="noopener noreferrer" style={{display:'block',padding:'0 13px 12px'}}>
          <img src={memeImg} alt="meme" style={{width:'100%',display:'block',border:`1px solid ${col}33`,opacity:0.9}} />
        </a>
      )}
      {exp && <>
        {c.sides_roasted&&Object.keys(c.sides_roasted).length>0&&<div style={{padding:'10px 13px',borderTop:'1px solid #14141e'}}>
          <div style={{fontFamily:'VT323,monospace',fontSize:11,color:col,marginBottom:5,letterSpacing:'0.1em'}}>🔥 SIDES ROASTED</div>
          {Object.entries(c.sides_roasted).map(([s,r])=><div key={s} style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#6a6865',marginBottom:4,lineHeight:1.55}}><span style={{color:col,marginRight:6}}>{s}:</span>{r}</div>)}
        </div>}
        {c.historical_parallel&&<div style={{padding:'10px 13px',borderTop:'1px solid #14141e'}}>
          <div style={{fontFamily:'VT323,monospace',fontSize:11,color:col,marginBottom:5,letterSpacing:'0.1em'}}>📚 HISTORICAL PARALLEL</div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#6a6865',lineHeight:1.65,fontStyle:'italic'}}>{c.historical_parallel}</div>
        </div>}
        {c.hypocrisy_flags?.length>0&&<div style={{padding:'10px 13px',borderTop:'1px solid #14141e'}}>
          <div style={{fontFamily:'VT323,monospace',fontSize:11,color:'#ff006e',marginBottom:5,letterSpacing:'0.1em'}}>🚩 HYPOCRISY FLAGS</div>
          {c.hypocrisy_flags.map((f,i)=><div key={i} style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#ff006e',marginBottom:3,opacity:.85,lineHeight:1.5}}>🚩 {f}</div>)}
        </div>}
        {c.data_points&&Object.keys(c.data_points).length>0&&<div style={{padding:'10px 13px',borderTop:'1px solid #14141e'}}>
          <div style={{fontFamily:'VT323,monospace',fontSize:11,color:col,marginBottom:5,letterSpacing:'0.1em'}}>📊 NUMBERS</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:3}}>
            {Object.entries(c.data_points).map(([k,v])=><div key={k} style={{background:'#07070e',padding:'6px 8px'}}>
              <div style={{fontFamily:'VT323,monospace',fontSize:8,color:'#252535',letterSpacing:'0.12em',marginBottom:2,textTransform:'uppercase'}}>{k}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:'#686462'}}>{v}</div>
            </div>)}
          </div>
        </div>}
      </>}
      <div style={{display:'flex',borderTop:'1px solid #14141e',marginTop:'auto'}}>
        <button onClick={()=>setExp(e=>!e)} style={{flex:1,background:'none',border:'none',borderRight:'1px solid #14141e',padding:'10px',fontFamily:'VT323,monospace',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',color:'#333355'}} onMouseEnter={e=>e.target.style.color='#39ff14'} onMouseLeave={e=>e.target.style.color='#333355'}>{exp?'▲ LESS':'▼ MORE CHAOS'}</button>
        <button onClick={onIntel} style={{flex:1,background:'none',border:'none',padding:'10px',fontFamily:'VT323,monospace',fontSize:12,letterSpacing:'0.1em',cursor:'pointer',color:'#00f5ff'}} onMouseEnter={e=>e.target.style.background='rgba(0,245,255,0.06)'} onMouseLeave={e=>e.target.style.background='none'}>🔍 RAW INTEL</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [bi, setBi] = useState(0);
  const [phase, setPhase] = useState('boot');
  const [ready, setReady] = useState(false);
  const [chaos, setChaos] = useState(null);
  const [sent, setSent] = useState(null);
  const [ov, setOv] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(()=>{
    if(bi<BOOT.length-1){ const t=setTimeout(()=>setBi(i=>i+1),200+Math.random()*120); return()=>clearTimeout(t); }
  },[bi]);

  useEffect(()=>{ if(bi>=BOOT.length-1&&ready) setPhase('ready'); },[bi,ready]);

  useEffect(()=>{
    fetch('/api/conflicts')
      .then(r=>r.json())
      .then(d=>{ setChaos(d.chaos); setSent(d.sentinel); setReady(true); })
      .catch(e=>{ setErr(e.message); setReady(true); });
  },[]);

  const activeC = chaos?.conflicts?.find(c=>c.id===ov);
  const sentFor = id => sent?.conflicts?.find(c=>c.id===id);

  return (
    <div style={{minHeight:'100vh',background:'#06060a',color:'#e0dcd4',fontFamily:"'Share Tech Mono',monospace",overflowX:'hidden'}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=VT323&family=Share+Tech+Mono&family=IBM+Plex+Mono&family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html{scroll-behavior:smooth;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-track{background:#06060a;}::-webkit-scrollbar-thumb{background:#39ff1433;}
        .sl{position:fixed;inset:0;pointer-events:none;z-index:9999;background-image:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.13) 2px,rgba(0,0,0,0.13) 4px);}
        .bl{font-family:'Bebas Neue',Impact,sans-serif;font-size:clamp(52px,13vw,120px);letter-spacing:0.12em;color:#39ff14;text-shadow:0 0 40px #39ff1455,0 0 80px #39ff1420;line-height:1;animation:fl 6s ease-in-out infinite;}
        @keyframes fl{0%,89%,91%,94%,96%,100%{opacity:1;}90%{opacity:.8;}95%{opacity:.9;}}
        .lh{font-family:'Bebas Neue',sans-serif;font-size:24px;letter-spacing:0.15em;color:#39ff14;text-shadow:0 0 12px #39ff1455;}
        .cur{animation:bk .7s step-end infinite;color:#39ff14;}
        @keyframes bk{0%,100%{opacity:1;}50%{opacity:0;}}
        .el::after{content:'';animation:dt 1.4s steps(4,end) infinite;}
        @keyframes dt{0%{content:'';}25%{content:'.';}50%{content:'..';}75%{content:'...';}100%{content:'';}}
        .ib{font-family:'Bebas Neue',sans-serif;font-size:clamp(14px,3.5vw,20px);letter-spacing:0.22em;background:transparent;border:2px solid #1a2a1a;color:#1a2a1a;padding:14px 36px;cursor:not-allowed;transition:all .3s;min-width:240px;}
        .ir{border-color:#39ff14!important;color:#39ff14!important;cursor:pointer!important;text-shadow:0 0 20px #39ff1466;animation:rg 2s ease-in-out infinite;}
        .ir:hover{background:#39ff14!important;color:#06060a!important;transform:scale(1.02);}
        @keyframes rg{0%,100%{box-shadow:0 0 20px #39ff1422;}50%{box-shadow:0 0 50px #39ff1455;}}
        @keyframes cin{from{opacity:0;transform:translateY(16px);}to{opacity:1;}}
        .ob{position:fixed;inset:0;background:rgba(0,0,0,0.9);z-index:8000;display:flex;justify-content:flex-end;}
        .sp{width:min(680px,100vw);background:#f5f0e8;color:#1a1a1a;display:flex;flex-direction:column;overflow:hidden;animation:sr .35s cubic-bezier(.16,1,.3,1);}
        @keyframes sr{from{transform:translateX(100%);}to{transform:translateX(0);}}
        .mi{animation:mi2 .4s ease both;}
        @keyframes mi2{from{opacity:0;}to{opacity:1;}}
        @media(max-width:480px){.sp{width:100vw;}.ib{min-width:200px;padding:12px 20px;}}
      `}</style>
      <div className="sl"/>

      {phase!=='on'&&(
        <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'24px 16px',gap:24,background:'radial-gradient(ellipse at 50% 60%,#0d1a0d,#06060a)'}}>
          <div className="bl">CHAOSDESK</div>
          <div style={{fontFamily:'VT323,monospace',fontSize:'clamp(8px,2vw,11px)',color:'#2a3a2a',letterSpacing:'0.18em',textAlign:'center'}}>GLOBAL CONFLICT INTELLIGENCE · EQUAL OPPORTUNITY CHAOS · NO SIDES SPARED</div>
          <div style={{background:'#08090c',border:'1px solid #141a14',padding:2,maxWidth:520,width:'100%'}}>
            <div style={{padding:'14px 18px',maxHeight:200,overflowY:'auto',display:'flex',flexDirection:'column',gap:2}}>
              {BOOT.slice(0,bi+1).map(([t,c],i)=>(
                <div key={i} style={{fontFamily:'VT323,monospace',fontSize:13,letterSpacing:'0.04em',lineHeight:1.6,color:c,opacity:i<bi?0.4:1}}>
                  {t}{i===bi&&<span className="cur">█</span>}
                </div>
              ))}
            </div>
          </div>
          <button className={`ib${phase==='ready'?' ir':''}`} onClick={()=>phase==='ready'&&setPhase('on')} disabled={phase!=='ready'}>
            {phase!=='ready'?<span style={{color:'#00f5ff'}}>SCANNING GLOBAL CHAOS<span className="el"/></span>:<span>⚡ INITIALIZE CHAOSDESK ⚡</span>}
          </button>
          {err&&<div style={{fontFamily:'VT323,monospace',fontSize:11,color:'#ff006e',textAlign:'center',maxWidth:480}}>⚠ ERROR: {err}</div>}
        </div>
      )}

      {phase==='on'&&(
  <div className="mi" style={{position:'fixed',inset:0}}>
    <MapView conflicts={chaos?.conflicts||[]} vibeCheck={chaos?.vibe_check} onIntel={(id)=>setOv(id)}/>

          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 18px',borderBottom:'1px solid #12121a',flexWrap:'wrap',gap:6}}>
            <span style={{fontFamily:'VT323,monospace',fontSize:13,color:'#39ff14',letterSpacing:'0.15em'}}>📡 LIVE FEED</span>
            <span style={{fontFamily:'VT323,monospace',fontSize:9,color:'#252535'}}>{chaos?.generated_at?new Date(chaos.generated_at).toUTCString():''}</span>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(min(300px,100%),1fr))',gap:18,padding:'18px 14px'}}>
            {chaos?.conflicts?.map((c,i)=><Card key={c.id} c={c} i={i} onIntel={()=>setOv(c.id)}/>)}
          </div>
          <div style={{fontFamily:'VT323,monospace',fontSize:9,color:'#14142a',letterSpacing:'0.12em',textAlign:'center',padding:'16px 16px 28px'}}>CHAOSDESK · EQUAL OPPORTUNITY CHAOS · ALL SIDES ROASTED · FACTS STILL MATTER</div>
        </div>
      )}

      {ov&&(
        <div className="ob" onClick={e=>e.target===e.currentTarget&&setOv(null)}>
          <div className="sp">
            <div style={{padding:'18px 22px',borderBottom:'3px solid #1a1a1a',background:'#ece8e0',flexShrink:0}}>
              <button style={{background:'none',border:'1px solid #1a1a1a',padding:'5px 14px',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,letterSpacing:'0.1em',cursor:'pointer',marginBottom:12,color:'#1a1a1a',display:'block'}} onClick={()=>setOv(null)}>← BACK TO CHAOS</button>
              <div style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(16px,3vw,23px)',fontWeight:700,color:'#0a0a0a',marginBottom:4}}>SENTINEL INTELLIGENCE BRIEF</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#888',letterSpacing:'0.1em'}}>⚠ VERIFIED FACTS ONLY — ZERO HUMOR — ZERO OPINION</div>
            </div>
            <div style={{padding:'20px 22px',overflowY:'auto',flex:1,background:'#f5f0e8'}}>
              <h2 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:'clamp(18px,3vw,28px)',color:'#0a0a0a',marginBottom:14,borderBottom:'2px solid #1a1a1a',paddingBottom:10,lineHeight:1.2}}>{activeC?.name}</h2>
              {(()=>{
                const s=sentFor(ov);
                if(!s) return <p style={{fontFamily:'Georgia,serif',fontSize:13,color:'#888',fontStyle:'italic'}}>{sent?'No data.':'Loading intel...'}</p>;
                return <>
                  <p style={{fontFamily:'Georgia,serif',fontSize:13.5,color:'#333',lineHeight:1.85,marginBottom:22,fontStyle:'italic',borderLeft:'3px solid #1a1a1a',paddingLeft:12}}>{s.verified_summary}</p>
                  {s.updates?.map((u,i)=>(
                    <div key={i} style={{marginBottom:20,paddingBottom:20,borderBottom:'1px solid #ddd8ce'}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#888',letterSpacing:'0.1em',marginBottom:6}}>{u.utc_hint} · {u.sources?.join(' · ')}</div>
                      <div style={{fontFamily:'Georgia,serif',fontSize:15,fontWeight:700,color:'#0a0a0a',marginBottom:7,lineHeight:1.3}}>{u.headline}</div>
                      <div style={{fontFamily:'Georgia,serif',fontSize:13,color:'#444',lineHeight:1.8}}>{u.body}</div>
                    </div>
                  ))}
                  {s.data_points&&Object.keys(s.data_points).length>0&&(
                    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))',gap:1,background:'#ccc',marginBottom:20}}>
                      {Object.entries(s.data_points).map(([k,v])=>(
                        <div key={k} style={{background:'#f5f0e8',padding:'9px 11px'}}>
                          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'#888',letterSpacing:'0.15em',textTransform:'uppercase',marginBottom:3}}>{k}</div>
                          <div style={{fontFamily:'Georgia,serif',fontSize:12,color:'#333',lineHeight:1.45}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {s.conflicting_reports?.length>0&&(
                    <div style={{background:'#fff8ee',border:'1px solid #ddc090',padding:'12px 14px'}}>
                      <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#b06000',letterSpacing:'0.15em',marginBottom:8}}>⚠ CONFLICTING REPORTS</div>
                      {s.conflicting_reports.map((r,i)=><div key={i} style={{fontFamily:'Georgia,serif',fontSize:12,color:'#555',padding:'4px 0',borderBottom:'1px solid #eedcb8',lineHeight:1.6}}>{r}</div>)}
                    </div>
                  )}
                </>;
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
