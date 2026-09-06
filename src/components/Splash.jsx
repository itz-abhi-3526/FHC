import { useEffect, useState, useMemo } from "react";

const BOOT_PHASES = [
  { at: 0, text: "POWERING SYSTEM..." },
  { at: 15, text: "LOADING FHC CORE..." },
  { at: 30, text: "INITIALIZING NETWORK..." },
  { at: 45, text: "LOADING TECHNOLOGY MODULES..." },
  { at: 60, text: "CALIBRATING EXPERIENCE..." },
  { at: 75, text: "CONNECTING FHC NETWORK..." },
  { at: 90, text: "SYSTEM READY" },
];

const TERMINAL_LINES = [
  { at: 10, text: "CONNECTING TO FHC NETWORK.....", ok: true },
  { at: 30, text: "LOADING RESOURCES.............", ok: true },
  { at: 50, text: "PREPARING EXPERIENCE..........", ok: true },
  { at: 70, text: "WELCOME TO FISAT HORIZON CLUB!", ok: false },
];

const MODULES = [
  { label: "CODE", color: "#5ab8ff", img: "/assets/fhc-loader/module-laptop.png" },
  { label: "INNOVATE", color: "#39ff6a", img: "/assets/fhc-loader/microchip.png" },
  { label: "LEARN", color: "#ffd400", img: "/assets/fhc-loader/lightbulb.png" },
  { label: "COLLABORATE", color: "#a96eff", img: "/assets/fhc-loader/collaboration.png" },
  { label: "IMPACT", color: "#ff2e8c", img: "/assets/fhc-loader/rocket.png" },
];

function makeNoise(seed, count) {
  const px = [];
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const cols = ["#ff2e8c","#5ab8ff","#ffd400","#39ff6a","#a96eff","#ffffff"];
  for (let i = 0; i < count; i++) {
    px.push({ x: r()*100, y: r()*100, c: cols[Math.floor(r()*cols.length)], s: r()>0.8?3:2, d: r()*5, du: 2+r()*4 });
  }
  return px;
}

function ArcadeFrame() {
  return (
    <div className="fixed inset-0 z-[110] pointer-events-none">
      <div className="absolute inset-[14px] border-[4px] border-pink"/>
      <div className="absolute inset-[20px] border border-pink/20"/>
      {[["top-[10px] left-[10px]",""],["top-[10px] right-[10px]",""],["bottom-[10px] left-[10px]",""],["bottom-[10px] right-[10px]",""]].map(([pos],i)=>(
        <div key={i} className={`absolute ${pos} w-3 h-3 bg-pink`}/>
      ))}
      {[["top-[10px] left-[14px]",""],["top-[14px] left-[10px]",""],["top-[10px] right-[14px]",""],["top-[14px] right-[10px]",""],
        ["bottom-[10px] left-[14px]",""],["bottom-[14px] left-[10px]",""],["bottom-[10px] right-[14px]",""],["bottom-[14px] right-[10px]",""]
      ].map(([pos],i)=>(
        <div key={`s${i}`} className={`absolute ${pos} w-2 h-2 bg-pink`}/>
      ))}
      <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-pink/30"/>
      <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 w-10 h-[2px] bg-pink/30"/>
      <div className="absolute left-[10px] top-1/2 -translate-y-1/2 w-[2px] h-10 bg-pink/30"/>
      <div className="absolute right-[10px] top-1/2 -translate-y-1/2 w-[2px] h-10 bg-pink/30"/>
    </div>
  );
}

function CRT() {
  return (
    <>
      <div className="fixed inset-0 z-[120] pointer-events-none" style={{background:"repeating-linear-gradient(to bottom,rgba(0,0,0,0.08) 0px,rgba(0,0,0,0.08) 1px,transparent 1px,transparent 3px)",mixBlendMode:"multiply"}}/>
      <div className="fixed inset-0 z-[119] pointer-events-none" style={{background:"radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,0.5) 100%)"}}/>
    </>
  );
}

function BgNoise() {
  const px = useMemo(() => makeNoise(42, 50), []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {px.map((p,i) => (
        <span key={i} className="absolute animate-twinkle" style={{left:p.x+"%",top:p.y+"%",width:p.s,height:p.s,backgroundColor:p.c,animationDelay:p.d+"s",animationDuration:p.du+"s",opacity:0.3}}/>
      ))}
      {[{x:"12%",y:"18%",c:"#ff2e8c"},{x:"88%",y:"12%",c:"#5ab8ff"},{x:"8%",y:"72%",c:"#ffd400"},{x:"92%",y:"68%",c:"#39ff6a"},{x:"50%",y:"4%",c:"#a96eff"},{x:"25%",y:"88%",c:"#fff"},{x:"75%",y:"82%",c:"#ff2e8c"}].map((s,i)=>(
        <div key={`x${i}`} className="absolute" style={{left:s.x,top:s.y}}>
          <div style={{width:2,height:6,backgroundColor:s.c,position:"absolute",transform:"translate(-1px,-3px)"}}/>
          <div style={{width:6,height:2,backgroundColor:s.c,position:"absolute",transform:"translate(-3px,-1px)"}}/>
        </div>
      ))}
    </div>
  );
}

function Header({ progress }) {
  const dots = 8;
  const on = Math.floor((progress / 100) * dots);
  return (
    <div className="flex items-center justify-between pl-[28px] pr-[28px] pt-[24px] pb-2 z-20 relative">
      <div className="flex items-center gap-3">
        <span className="font-pixel text-[11px] text-pink">FHC v2.6</span>
        <span className="font-pixel text-[6px] text-[#555] hidden md:inline">ARCADE OS</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-pixel text-[8px] text-cream">INITIALIZING SYSTEM...</span>
        <div className="flex gap-1">
          {Array.from({length:dots}).map((_,i)=>(
            <span key={i} style={{width:8,height:8,backgroundColor:i<on?"#ff2e8c":"#222",display:"inline-block",boxShadow:i<on?"0 0 6px #ff2e8c":"none",transition:"background-color 0.3s"}}/>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ progress }) {
  const segs = 30;
  const filled = Math.round((progress / 100) * segs);
  const phase = BOOT_PHASES.filter(p => progress >= p.at).pop()?.text || "POWERING SYSTEM...";
  return (
    <div className="relative">
      <div className="flex justify-between mb-1">
        <span className="font-pixel text-[7px] text-cream">{phase}</span>
        <span className="font-pixel text-[7px] text-cream/40">{Math.round(progress)}%</span>
      </div>
      <div className="relative border-[3px] border-cream bg-black p-[3px]" style={{borderRadius:"3px"}}>
        <div className="flex gap-[3px] splash-pbar" style={{height:28}}>
          {Array.from({length:segs}).map((_,i)=>(
            <div key={i} className="flex-1" style={{backgroundColor:i<filled?"#ff2e8c":"#1a1a1a",boxShadow:i<filled?"inset 0 -2px 0 #c4106a, inset 0 1px 0 #ff7eb3":"none",transition:"background-color 0.1s"}}/>
          ))}
        </div>
      </div>
      <p className="text-center font-pixel text-[12px] text-pink mt-2 splash-percent">{Math.round(progress)}%</p>
    </div>
  );
}

function ModulePanel() {
  return (
    <div className="border-2 border-cream bg-black" style={{borderRadius:"3px"}}>
      <div className="grid grid-cols-5 divide-x divide-cream/15">
        {MODULES.map(({label,color,img}) => (
          <div key={label} className="flex flex-col items-center gap-1 py-2 px-1">
            <img src={img} alt="" className="splash-mod-img" style={{width:48,height:48,imageRendering:"pixelated",objectFit:"contain"}}/>
            <span className="font-pixel text-[5px] md:text-[7px]" style={{color}}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Terminal({ progress }) {
  const lines = TERMINAL_LINES.filter(l => progress >= l.at);
  return (
    <div className="border-2 border-green bg-black relative splash-terminal" style={{borderRadius:"3px"}}>
      <div className="flex items-center justify-between px-3 py-1 border-b border-green/30">
        <span className="font-pixel text-[6px] text-green/70">SYS://FHC/CORE</span>
        <div className="flex gap-3">
          <span className="font-pixel text-[5px] text-green/50">NODE: FHC-01</span>
          <span className="font-pixel text-[5px] text-green/50">MEM: 64K</span>
        </div>
      </div>
      <div className="flex">
        <div className="flex-1 p-3 min-h-[100px] font-mono text-sm text-green leading-relaxed">
          {lines.map((l,i) => (
            <p key={i} className="mb-0.5">
              <span>&gt;</span> {l.text}{l.ok && <span className="font-bold ml-1">[OK]</span>}
            </p>
          ))}
          <span className="inline-block w-2 h-4 bg-green animate-blink align-middle ml-1"/>
        </div>
        <div className="hidden md:flex items-end p-3">
          <img src="/assets/fhc-loader/earth.png" alt="" style={{width:80,height:80,imageRendering:"pixelated"}} className="block opacity-80"/>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-1 border-t border-green/30">
        <span className="font-pixel text-[5px] text-green/40">STATUS: ONLINE</span>
        <span className="font-pixel text-[5px] text-green/40">BUILD: 2.6</span>
      </div>
    </div>
  );
}

function SplashScene({ progress }) {
  const show = progress > 2;
  const fade = (d=0) => ({opacity:show?1:0,transition:`opacity 0.8s ease ${d}s`});

  return (
    <div className="relative z-10 w-full h-full flex flex-col splash-scene" style={{maxHeight:"100vh"}}>
      <Header progress={progress}/>

      <div className="relative flex flex-col items-center splash-hero" style={{flex:"0 0 auto",paddingTop:4,paddingBottom:4}}>
        {/* Laptop centered above FHC */}
        <div style={{...fade(0.2)}}>
          <img src="/assets/fhc-loader/hero-laptop.png" alt="" className="block mx-auto splash-laptop" style={{width:120,imageRendering:"pixelated"}}/>
        </div>

        {/* Robot left, FHC center, Satellite right */}
        <div className="w-full max-w-3xl mx-auto flex items-end justify-between px-4 md:px-8" style={{marginTop:-8}}>
          {/* Robot */}
          <div className="flex flex-col items-center" style={{...fade(0.4)}}>
            <img src="/assets/fhc-loader/hero-robot.png" alt="" className="block splash-mascot" style={{height:110,imageRendering:"pixelated"}}/>
          </div>

          {/* FHC Logo */}
          <div className="flex flex-col items-center" style={{...fade(0.1)}}>
            <h1 className="font-pixel text-pink leading-none" style={{fontSize:"clamp(44px, 7vw, 88px)",WebkitTextStroke:"4px #fff",paintOrder:"stroke fill",filter:"drop-shadow(3px 3px 0 #0c0c0f) drop-shadow(6px 6px 0 #8B0000)"}}>
              FHC
            </h1>
          </div>

          {/* Satellite */}
          <div className="flex flex-col items-center" style={{...fade(0.5)}}>
            <div style={{height:50}}/>
            <img src="/assets/fhc-loader/satellite-dish.png" alt="" className="block splash-mascot" style={{height:110,imageRendering:"pixelated"}}/>
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-center mt-1" style={{...fade(0.1)}}>
          <p className="font-pixel text-[10px] md:text-[13px] text-cream tracking-[0.15em]">
            FISAT HORIZON CLUB
          </p>
        </div>
      </div>

      {/* TAGLINE */}
      <div className="flex justify-center py-1" style={{...fade(0.1)}}>
        <div className="border-2 border-blue px-1 py-0.5">
          <div className="border border-blue/50 px-4 py-1">
            <span className="font-pixel text-[8px] md:text-[10px] text-pink tracking-wider">
              BUILDING FUTURE. TOGETHER.
            </span>
          </div>
        </div>
      </div>

      {/* LOADING SECTION */}
      <div className="flex flex-col items-center py-1" style={{...fade(0.1)}}>
        <p className="font-pixel text-[9px] text-cream mb-1">LOADING...</p>
        <p className="font-pixel text-[6px] text-cream/50 mb-2">INITIALIZING TECHNOLOGY MODULES...</p>
        <div style={{width:"min(560px, 78vw)"}}>
          <ProgressBar progress={progress}/>
        </div>
      </div>

      {/* MODULES */}
      <div className="flex justify-center py-1" style={{...fade(0.1)}}>
        <div style={{width:"min(700px, 88vw)"}}>
          <ModulePanel/>
        </div>
      </div>

      {/* TERMINAL */}
      <div className="flex justify-center py-1" style={{...fade(0.1)}}>
        <div style={{width:"min(760px, 90vw)"}}>
          <Terminal progress={progress}/>
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex items-center justify-center gap-2 pb-[22px] pt-2 splash-footer" style={{...fade(0.1),flex:"0 0 auto"}}>
        <img src="/assets/fhc-loader/pixel-heart.png" alt="" style={{width:12,height:12,imageRendering:"pixelated"}} className="block"/>
        <span className="font-pixel text-[7px] text-cream/70">MADE WITH 8-BIT LOVE</span>
        <img src="/assets/fhc-loader/pixel-heart.png" alt="" style={{width:12,height:12,imageRendering:"pixelated"}} className="block"/>
      </div>
    </div>
  );
}

export default function Splash({ onComplete }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(id); return 100; }
        if (p < 15) return Math.min(100, p + 1);
        if (p < 45) return Math.min(100, p + 1.5);
        if (p < 75) return Math.min(100, p + 1.2);
        if (p < 95) return Math.min(100, p + 2);
        return Math.min(100, p + 0.5);
      });
    }, 50);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [progress, onComplete]);

  return (
    <div className="fixed inset-0 z-[100] bg-black overflow-hidden">
      <CRT/>
      <ArcadeFrame/>
      <BgNoise/>
      <SplashScene progress={progress}/>
    </div>
  );
}