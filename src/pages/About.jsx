import { useRef, useState, useEffect, useCallback, Suspense, useMemo } from "react";
import { Link } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32 } from "../lib/random";
import ArcadeScene from "../components/arcade/ArcadeScene";
import Footer from "../components/Footer";
import PageFrame from "../components/PageFrame";

/* ═══════════════════════════════════════════
   DATA — FHC HORIZON SYSTEM
   ═══════════════════════════════════════════ */

const PRINCIPLES = [
  { num: "01", title: "INNOVATION", tag: "BUILD WHAT'S NEXT", desc: "We build ideas, challenge limits and create what doesn't exist." },
  { num: "02", title: "COLLABORATION", tag: "BUILD TOGETHER", desc: "We grow together, share knowledge and build as one community." },
  { num: "03", title: "IMPACT", tag: "BUILD FOR SOMETHING", desc: "We use technology to solve real problems and make a difference." },
];

const NUMBERS = [
  { value: "25+", label: "EVENTS CONDUCTED" },
  { value: "300+", label: "ACTIVE MEMBERS" },
  { value: "15+", label: "PROJECTS BUILT" },
  { value: "5+", label: "YEARS OF IMPACT" },
];

const WHAT_WE_DO = [
  { num: "01", title: "PROJECTS", tag: "FROM IDEA TO PROTOTYPE", accent: "#FF1687" },
  { num: "02", title: "EVENTS", tag: "LEARN. COMPETE. CONNECT.", accent: "#1ED7E8" },
  { num: "03", title: "WORKSHOPS", tag: "KNOWLEDGE IN MOTION", accent: "#36D65A" },
  { num: "04", title: "COMMUNITY", tag: "PEOPLE WHO BUILD TOGETHER", accent: "#FFD21A" },
];

const BOOT_SEQ = [
  "INITIALIZING WORLD...",
  "LOADING CORE MODULES...",
  "SIGNAL DETECTED.",
  "HORIZON SYSTEM ONLINE.",
];

/* ═══════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════ */

function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setV(true);
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, v];
}

function useCountUp(target, active, dur = 1400) {
  const [n, setN] = useState(0);
  const num = parseInt(target.replace(/\D/g, ""), 10);
  const sfx = target.replace(/[0-9]/g, "");
  useEffect(() => {
    if (!active) return;
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      setN(Math.floor((1 - Math.pow(1 - p, 3)) * num));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, num, dur]);
  return `${n}${sfx}`;
}

/* ═══════════════════════════════════════════
   MICRO-UI PRIMITIVES
   ═══════════════════════════════════════════ */

function Cursor() {
  return <span className="inline-block animate-[blink_1s_steps(1)_infinite] text-[#1ED7E8]">█</span>;
}

function Led({ on = true, color = "#36D65A" }) {
  return (
    <span
      className="inline-block w-[5px] h-[5px] rounded-full"
      style={{
        background: on ? color : "rgba(255,255,255,0.1)",
        boxShadow: on ? `0 0 4px ${color}` : "none",
      }}
    />
  );
}

function Scanlines({ className = "" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[2] ${className}`}
      style={{
        background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 2px, transparent 2px, transparent 4px)",
      }}
    />
  );
}

function Brackets({ size = 14, color = "#FF1687" }) {
  const s = (pos) => ({
    position: "absolute",
    width: size,
    height: size,
    pointerEvents: "none",
    zIndex: 5,
    ...pos,
  });
  return (
    <>
      <span style={s({ top: -1, left: -1, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` })} />
      <span style={s({ top: -1, right: -1, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` })} />
      <span style={s({ bottom: -1, left: -1, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` })} />
      <span style={s({ bottom: -1, right: -1, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` })} />
    </>
  );
}

function Tag({ children, color = "#1ED7E8" }) {
  return (
    <span
      className="inline-flex items-center gap-2 border px-3 py-1 font-pixel text-[7px] tracking-[0.2em]"
      style={{ borderColor: `${color}30`, color: `${color}b0` }}
    >
      <Led color={color} />
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════
   3D — HORIZON CORE ARTIFACT (bespoke, scoped)
   ═══════════════════════════════════════════ */

/* ═══════════════════════════════════════════
   HOLOGRAPHIC WORLD GLOBE
   Procedural Earth — fine cyan wireframe geography,
   atmosphere, data nodes, orbital rings. Pure Three.js.
   ═══════════════════════════════════════════ */

/* latitude/longitude → 3D position on a sphere */
function ll(lat, lon, r) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
}

/* Simplified but recognizable continent outlines [lat, lon].
   Each is a closed ring; start/end points are adjacent so the closing
   seam stays short and reads as coastline. */
const CONTINENTS = [
  // North America
  [[70,-140],[60,-140],[52,-128],[46,-124],[40,-124],[34,-120],[30,-117],[24,-110],[20,-106],[16,-99],[14,-94],[12,-87],[10,-83],[9,-79],[12,-75],[18,-84],[22,-82],[26,-80],[29,-81],[30,-81],[28,-93],[30,-97],[34,-119],[38,-123],[44,-124],[50,-126],[56,-132],[64,-138],[72,-140]],
  // South America (short closing seam across the Caribbean coast)
  [[12,-71],[8,-77],[5,-80],[0,-81],[-5,-81],[-9,-79],[-12,-77],[-16,-72],[-20,-70],[-23,-70],[-28,-71],[-33,-71],[-38,-74],[-43,-65],[-47,-65],[-50,-69],[-54,-70],[-56,-67],[-52,-67],[-47,-65],[-40,-62],[-34,-58],[-30,-51],[-24,-46],[-15,-39],[-9,-35],[-4,-36],[0,-44],[4,-51],[8,-59],[12,-68],[12,-71]],
  // Eurasia (Europe + Asia, closed ring starting/ending at the Strait of Gibraltar)
  [[36,-6],[43,-9],[48,-5],[50,1],[52,4],[55,8],[58,5],[62,6],[68,14],[71,24],[70,44],[66,60],[60,69],[55,72],[50,77],[48,88],[52,96],[55,101],[60,98],[64,114],[62,124],[60,142],[64,162],[57,168],[52,159],[48,152],[45,144],[42,150],[38,137],[35,133],[33,126],[30,121],[25,119],[20,111],[13,105],[8,102],[4,103],[0,105],[-3,109],[0,111],[-5,113],[-8,117],[-3,111],[8,112],[11,120],[16,122],[20,120],[28,119],[32,117],[28,113],[21,109],[17,107],[13,100],[10,98],[7,98],[4,101],[1,104],[4,104],[8,98],[12,92],[15,83],[18,73],[18,78],[13,78],[8,77],[4,73],[9,76],[13,73],[19,70],[24,66],[22,60],[20,58],[16,54],[13,47],[15,42],[19,39],[24,37],[28,35],[33,35],[37,34],[40,28],[38,21],[37,19],[40,19],[43,12],[45,15],[44,8],[42,2],[40,-1],[36,-6]],
  // Africa
  [[37,10],[33,12],[31,20],[31,32],[28,34],[24,36],[18,38],[12,43],[10,51],[4,43],[0,42],[-4,40],[-10,40],[-16,36],[-25,33],[-30,31],[-34,20],[-33,18],[-28,16],[-20,13],[-12,13],[-6,12],[0,9],[4,2],[8,-5],[6,-8],[10,-14],[15,-16],[17,-16],[21,-16],[28,-12],[32,-9],[35,-6],[37,-3],[37,10]],
  // Australia
  [[-12,130],[-14,127],[-17,122],[-20,119],[-24,114],[-26,113],[-31,115],[-34,116],[-35,118],[-36,127],[-38,140],[-35,145],[-33,150],[-35,152],[-37,150],[-39,146],[-36,144],[-32,140],[-28,138],[-25,138],[-22,137],[-18,138],[-15,134],[-12,130]],
  // Greenland
  [[84,-32],[80,-22],[77,-18],[72,-24],[68,-32],[65,-40],[61,-44],[60,-50],[66,-55],[72,-60],[78,-68],[84,-56],[86,-42],[84,-32]],
  // Antarctica (partial southern rim)
  [[-83,-110],[-78,-90],[-74,-76],[-70,-60],[-68,-45],[-70,-30],[-75,-14],[-80,-4],[-84,-30],[-84,-80],[-83,-110]],
].map((poly) => poly);

function buildContinentLines(r) {
  const pts = [];
  for (let p = 0; p < CONTINENTS.length; p++) {
    const poly = CONTINENTS[p];
    for (let i = 0; i < poly.length; i++) {
      const a = ll(poly[i][0], poly[i][1], r);
      const b = ll(poly[(i + 1) % poly.length][0], poly[(i + 1) % poly.length][1], r);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/* Raised 3D continental relief — each outline becomes a plateau that
   protrudes from the recessed ocean sphere to the globe silhouette.
   Top face (fan) at rTop plus side walls down to rBase gives real
   spherical depth / embossed relief so continents read as raised land. */
function buildContinentRelief(rTop, rBase) {
  const array = [];
  const tris = [];
  let vertCount = 0;
  for (let p = 0; p < CONTINENTS.length; p++) {
    const poly = CONTINENTS[p];
    const ringTop = poly.map(([la, lo]) => ll(la, lo, rTop));
    const ringBase = ringTop.map((v) => v.clone().multiplyScalar(rBase / rTop));
    let cx = 0;
    let cy = 0;
    let cz = 0;
    for (const v of ringTop) { cx += v.x; cy += v.y; cz += v.z; }
    const L = Math.hypot(cx, cy, cz) || 1;
    const topStart = vertCount;
    const centerIdx = vertCount;
    const k = rTop / L;
    array.push(cx * k, cy * k, cz * k);
    vertCount++;
    for (const v of ringTop) { array.push(v.x, v.y, v.z); vertCount++; }
    for (let i = 0; i < poly.length; i++) {
      tris.push(centerIdx, topStart + 1 + i, topStart + 1 + ((i + 1) % poly.length));
    }
    const wallBase = vertCount;
    for (const v of ringBase) { array.push(v.x, v.y, v.z); vertCount++; }
    for (let i = 0; i < poly.length; i++) {
      const a = topStart + 1 + i;
      const b = topStart + 1 + ((i + 1) % poly.length);
      const c = wallBase + i;
      const d = wallBase + ((i + 1) % poly.length);
      tris.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(array, 3));
  g.setIndex(tris);
  g.computeVertexNormals();
  return g;
}

function buildGraticule(r) {
  const pts = [];
  for (let lat = -80; lat <= 80; lat += 12) {
    for (let lon = 0; lon < 360; lon += 4) {
      const a = ll(lat, lon, r);
      const b = ll(lat, lon + 4, r);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  for (let lon = -180; lon < 180; lon += 18) {
    for (let lat = -80; lat < 80; lat += 4) {
      const a = ll(lat, lon, r);
      const b = ll(lat + 4, lon, r);
      pts.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/* predefined data-node / signal coordinates (major world regions) */
const DATA_NODE_COORDS = [
  [40.7,-74.0],[34.1,-118.2],[19.4,-99.1],[-23.5,-46.6],[-33.8,151.2],
  [51.5,-0.1],[48.8,2.3],[52.5,13.4],[-1.3,36.8],[28.6,77.2],
  [19.0,72.8],[31.2,121.5],[39.9,116.4],[35.6,139.7],[25.0,121.5],
  [1.3,103.8],[-6.2,106.8],[-33.9,18.4],[6.5,3.4],[55.7,37.6],
  [60.2,24.9],[37.5,127.0],[-37.8,145.0],[53.6,10.0],[41.0,28.9],
];

/* pick the farthest-apart few as magenta "signal" points */
const SIGNAL_INDEXES = [0, 8, 11, 15, 19];

function buildDataNodes(r) {
  const nodes = DATA_NODE_COORDS.map(([la, lo], i) => ({
    pos: ll(la, lo, r),
    sig: SIGNAL_INDEXES.includes(i),
  }));
  return nodes;
}

/* ── Depth-shaded holographic wireframe ─────────────────────────────
   Front hemisphere of the sphere renders brighter, the rear hemisphere
   falls back, and a faint rim highlights the limb. Because the shade is
   computed in view space it tracks the globe's rotation + mouse tilt,
   which is what sells the "real 3D object" depth. */
function depthLineMaterial(color, baseOpacity) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uAlpha: { value: baseOpacity },
    },
    vertexShader: `
      varying float vFade;
      void main(){
        vec3 mv = (modelViewMatrix * vec4(position, 1.0)).xyz;
        vec3 radial = normalize(mv);
        float s = dot(radial, vec3(0.0, 0.0, 1.0));
        float bright = 0.34 + 0.66 * clamp(s * 1.4, 0.0, 1.0);
        float rim = pow(clamp(1.0 - abs(s), 0.0, 1.0), 2.0) * clamp(s * 3.0, 0.0, 1.0);
        vFade = bright + 0.4 * rim;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vFade;
      void main(){
        gl_FragColor = vec4(uColor * vFade, uAlpha * vFade);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/* ── Fine digital/data particle cloud forming the globe surface ─── */
function buildParticles(r, count, seed = 1337) {
  const rand = mulberry32(seed);
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    /* slightly random radius so particles read as a soft digital shell */
    const rad = r * (0.965 + rand() * 0.07);
    const lat = (rand() * 2 - 1) * 82;
    const lon = rand() * 360;
    const v = ll(lat, lon, rad);
    pos[i * 3] = v.x;
    pos[i * 3 + 1] = v.y;
    pos[i * 3 + 2] = v.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  return g;
}

function particleMaterial(color) {
  const dpr = typeof window !== "undefined" && window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 1;
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uSize: { value: 1.6 * dpr },
      uAlpha: { value: 0.9 },
    },
    vertexShader: `
      uniform float uSize;
      varying float vFade;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 radial = normalize(mv.xyz);
        float front = clamp(dot(radial, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
        vFade = 0.08 + 0.92 * front;
        gl_PointSize = uSize;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uAlpha;
      varying float vFade;
      void main(){
        vec2 c = gl_PointCoord - 0.5;
        float d = length(c);
        float a = smoothstep(0.5, 0.06, d) * vFade;
        gl_FragColor = vec4(uColor, uAlpha * a) * vFade;
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/* ── light-trace scanning arc (radar-style sweep over the surface) ─ */
function buildScanArc(r, a0, a1) {
  const pts = [];
  const segs = 90;
  for (let i = 0; i <= segs; i++) {
    const a = a0 + ((a1 - a0) * i) / segs;
    pts.push(r * Math.cos(a), r * Math.sin(a), 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/* Soft additive rim glow with controlled radial falloff around the limb. */
function atmosphereMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vNormal;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      varying vec3 vNormal;
      void main(){
        float rim = 1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0));
        float intensity = pow(clamp(rim, 0.0, 1.0), 3.5);
        gl_FragColor = vec4(uColor, intensity * 0.4);
      }`,
    uniforms: { uColor: { value: new THREE.Color("#1ED7E8") } },
    side: THREE.FrontSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

/* ── Dark glass planet surface ──────────────────────────────────────
   Recessed ocean sphere: transparent deep-navy "glass" with a subtle
   cyan fresnel rim and soft internal holographic teal illumination. */
function planetBodyMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      uRim: { value: new THREE.Color("#0e7f92") },
      uInner: { value: new THREE.Color("#06202b") },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vView;
      void main(){
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uRim;
      uniform vec3 uInner;
      varying vec3 vNormal;
      varying vec3 vView;
      void main(){
        float fres = pow(1.0 - abs(dot(vNormal, vView)), 2.5);
        vec3 col = mix(uInner, uRim, fres);
        float a = 0.10 + 0.42 * fres;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

/* ── Raised holographic continental relief ─────────────────────────
   Continents are lit by a soft internal cyan light fist (object space)
   plus a cyan fresnel along their rims, giving embossed 3D depth. */
function continentReliefMaterial() {
  const l = new THREE.Vector3(0.45, 0.7, 0.85).normalize();
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color("#17c9dd") },
      uInner: { value: new THREE.Color("#0a5d70") },
      uLight: { value: l },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vNormalView;
      varying vec3 vView;
      void main(){
        vNormal = normalize(normal);            // object-space → internal light
        vNormalView = normalize(normalMatrix * normal);
        vView = normalize(-(modelViewMatrix * vec4(position, 1.0)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform vec3 uInner;
      uniform vec3 uLight;
      varying vec3 vNormal;
      varying vec3 vNormalView;
      varying vec3 vView;
      void main(){
        float facing = clamp(dot(vNormal, uLight), 0.0, 1.0);
        float fres = pow(1.0 - abs(dot(vNormalView, vView)), 2.5);
        vec3 col = uInner + uColor * (0.18 + 0.95 * facing) + uColor * fres * 0.7;
        float a = 0.4 + 0.4 * fres;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

function HorizonCoreGroup({ hp, mouse }) {
  const spin = useRef();
  const rings = useRef([]);
  const nodesRef = useRef([]);
  const scanRef = useRef();
  const time = useRef(0);

  /* Globe occupies ~74% of box height; camera half-height ≈ 1.27,
     so keep everything comfortably inside to avoid any clipping. */
  const TOP_R = 0.94;            /* continent tops / globe silhouette */
  const OCEAN_R = 0.875;         /* recessed dark glass ocean */

  const continentReliefGeo = useMemo(() => buildContinentRelief(TOP_R, OCEAN_R), []);
  const continentGeo = useMemo(() => buildContinentLines(TOP_R * 1.0015), []);
  const gratGeo = useMemo(() => buildGraticule(OCEAN_R * 1.002), []);
  const dataNodes = useMemo(() => buildDataNodes(TOP_R), []);
  const atmoMat = useMemo(() => atmosphereMaterial(), []);
  const bodyMat = useMemo(() => planetBodyMaterial(), []);
  const reliefMat = useMemo(() => continentReliefMaterial(), []);
  const particlesGeo = useMemo(() => buildParticles(TOP_R, 4600, 1337), []);
  const scanHead = useMemo(() => buildScanArc(TOP_R * 1.03, 0, 1.1), []);
  const scanTail = useMemo(() => buildScanArc(TOP_R * 1.03, 1.1, 4.9), []);

  /* depth-shaded holographic passes — continents are the dominant feature */
  const lineCyan = useMemo(() => depthLineMaterial("#2fe3f4", 0.95), []);
  const lineTeal = useMemo(() => depthLineMaterial("#6ff0ff", 0.3), []);
  const gratMain = useMemo(() => depthLineMaterial("#1ED7E8", 0.035), []);
  const gratFine = useMemo(() => depthLineMaterial("#38cfe0", 0.02), []);
  const particlesMat = useMemo(() => particleMaterial("#2bd4e6"), []);

  const scanHeadMat = useMemo(() => {
    const m = depthLineMaterial("#7df1ff", 0.55);
    return m;
  }, []);
  const scanTailMat = useMemo(() => {
    const m = depthLineMaterial("#1ED7E8", 0.10);
    return m;
  }, []);

  useFrame((state, dt) => {
    time.current += dt;
    const t = time.current;
    const sp = spin.current;
    if (sp) {
      sp.rotation.y += dt * 0.1;
      sp.rotation.x = THREE.MathUtils.lerp(sp.rotation.x, (mouse ? mouse.current.y : 0) * 0.26, 0.04);
      sp.rotation.z = THREE.MathUtils.lerp(sp.rotation.z, (mouse ? mouse.current.x : 0) * 0.1, 0.04);
    }
    rings.current.forEach((g, i) => {
      if (g) g.rotation.z += dt * (0.03 + i * 0.015) * (i % 2 === 0 ? 1 : -1);
    });
    if (scanRef.current) scanRef.current.rotation.z += dt * 0.85;
    nodesRef.current.forEach((n) => {
      if (!n) return;
      const phase = n.userData.phase;
      const pulse = 0.5 + 0.5 * Math.sin(t * 1.2 + phase);
      n.scale.setScalar(0.85 + pulse * 0.35);
      if (n.userData.sig) {
        n.material.opacity = 0.2 + pulse * 0.5;
        n.material.emissiveIntensity = 0.35 + pulse * 0.6;
      }
    });
  });

  /* ultra-thin elegant orbitals, all comfortably inside the frame (≤ 1.18) */
  const ringsArr = [
    { r: 1.06, tiltX: 1.15, tiltZ: 0.15, s: 0.0035 },
    { r: 1.13, tiltX: -1.3, tiltZ: 0.85, s: 0.0028 },
    { r: 1.18, tiltX: 0.35, tiltZ: 1.5, s: 0.0022 },
  ];

  return (
    <group ref={hp}>
      <hemisphereLight skyColor="#0c1526" groundColor="#05060a" intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={0.5} color="#aef3ff" />

      {/* ── spinning holographic world core ── */}
      <group ref={spin}>
        {/* recessed dark glass ocean sphere — subtle cyan fresnel rim */}
        <mesh material={bodyMat}>
          <sphereGeometry args={[OCEAN_R, 48, 48]} />
        </mesh>

        {/* raised embossed continents over the dark ocean — real relief */}
        <mesh geometry={continentReliefGeo} material={reliefMat} />

        {/* fine latitude / longitude lattice on the ocean surface (two depth-shaded tonal passes) */}
        <lineSegments geometry={gratGeo} material={gratMain} />
        <lineSegments geometry={gratGeo} material={gratFine} />

        {/* illuminated continent contours — the dominant wireframe feature */}
        <lineSegments geometry={continentGeo} material={lineCyan} />
        <lineSegments geometry={continentGeo} material={lineTeal} />

        {/* thousands of fine digital particles forming the globe shell */}
        <points geometry={particlesGeo} material={particlesMat} />

        {/* sparse network nodes (cyan) + restrained magenta signals */}
        {dataNodes.map((n, i) => (
          <mesh
            key={i}
            ref={(el) => (nodesRef.current[i] = el)}
            position={n.pos}
            userData={{ phase: i * 1.3, sig: n.sig }}
          >
            <icosahedronGeometry args={[0.016, 0]} />
            <meshStandardMaterial
              color={n.sig ? "#FF1687" : "#1ED7E8"}
              emissive={n.sig ? "#FF1687" : "#1ED7E8"}
              emissiveIntensity={n.sig ? 0.85 : 0.45}
              transparent
              opacity={n.sig ? 0.65 : 0.55}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* ── light-trace scanning sweep across the surface ── */}
      <group ref={scanRef} rotation={[1.15, 0, 0.4]}>
        <line geometry={scanHead} material={scanHeadMat} />
        <line geometry={scanTail} material={scanTailMat} />
      </group>

      {/* ── volumetric atmosphere glow (two soft additive shells) ── */}
      <mesh material={atmoMat}>
        <sphereGeometry args={[TOP_R * 1.1, 48, 48]} />
      </mesh>
      <mesh material={atmoMat}>
        <sphereGeometry args={[TOP_R * 1.2, 48, 48]} />
      </mesh>

      {/* ── ultra-thin orbital rings ── */}
      {ringsArr.map((ring, i) => (
        <group key={i} ref={(el) => (rings.current[i] = el)} rotation={[ring.tiltX, 0, ring.tiltZ]}>
          <mesh>
            <torusGeometry args={[ring.r, ring.s, 8, 220]} />
            <meshBasicMaterial color="#1ED7E8" transparent opacity={0.5 - i * 0.08} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      ))}

      {/* a few faint ambient motes for spatial depth */}
      <group>
        {[...Array(4)].map((_, i) => (
          <mesh key={`hud${i}`} position={[(i - 1.5) * 0.5, 1.3 + Math.sin(i + 1) * 0.08, 0.35]}>
            <sphereGeometry args={[0.005, 6, 6]} />
            <meshBasicMaterial color="#1ED7E8" transparent opacity={0.35} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* Inner rig — parallax + pointer, rendered INSIDE the Canvas */
function CoreRig({ mouse }) {
  const groupRef = useRef(null);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.x = mouse.current.x * 0.06;
      groupRef.current.position.y = mouse.current.y * 0.06;
    }
  });

  return (
    <group ref={groupRef}>
      <HorizonCoreGroup hp={groupRef} mouse={mouse} />
    </group>
  );
}

function HorizonCore({ mouse }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 3.5], fov: 40, near: 0.1, far: 20 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
      dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
      style={{ background: "transparent" }}
    >
      <CoreRig mouse={mouse} />
    </Canvas>
  );
}

/* ═══════════════════════════════════════════
   SECTION 01 — BOOT / HERO
   ═══════════════════════════════════════════ */

function BootOverlay({ booted }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (booted) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setIdx(Math.min(i, BOOT_SEQ.length - 1));
      if (i >= BOOT_SEQ.length) clearInterval(iv);
    }, 520);
    return () => clearInterval(iv);
  }, [booted]);

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#04050a] transition-opacity duration-500 pointer-events-none"
      style={{ opacity: booted ? 0 : 1 }}
    >
      <div className="text-center px-6">
        <p className="font-pixel text-[9px] sm:text-[11px] text-[#1ED7E8] tracking-[0.3em] mb-3 animate-pulse">
          FHC HORIZON SYSTEM
        </p>
        <div className="w-48 sm:w-64 h-[3px] mx-auto bg-[#060a14] relative overflow-hidden mb-5">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF1687] to-[#1ED7E8]"
            style={{ width: `${booted ? 100 : Math.min((idx / BOOT_SEQ.length) * 100, 92)}%`, transition: "width 0.5s ease" }}
          />
        </div>
        <p className="font-mono text-xs text-[#FFF7E5]/50">
          {BOOT_SEQ[idx]}
          <span className="animate-[blink_1s_steps(1)_infinite] text-[#1ED7E8]">█</span>
        </p>
      </div>
    </div>
  );
}

function HeroSection({ mouse }) {
  const [vis, setVis] = useState(false);
  /* loader bypassed: booted starts true so the boot overlay never shows */
  const [booted, setBooted] = useState(true);
  const ref = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVis(true), 1200);
    const t2 = setTimeout(() => setBooted(true), 2400);
    return () => [t, t2].forEach(clearTimeout);
  }, []);

  return (
    <section ref={ref} className="relative min-h-[92vh] flex items-center px-4 sm:px-6 lg:px-8 pt-16 pb-12 overflow-x-clip fhc-hero-pad">
      <BootOverlay booted={booted} />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto">
        {/* BOOT — system header */}
        <div className="flex items-center justify-between mb-8 font-pixel text-[7px] sm:text-[8px] text-[#1ED7E8]/40 tracking-wider max-md:hidden">
          <span className="flex items-center gap-2">
            <Led color="#FF1687" />
            FHC // HORIZON SYSTEM
          </span>
          <span className="hidden sm:flex items-center gap-2">
            <Led />
            <span className="text-[#36D65A]/60">ARCHIVE ENTRY 01 // ONLINE</span>
          </span>
          <span className="flex items-center gap-2 text-[#FF1687]/60">
            <span className="text-[#FF1687] animate-pulse">●</span>
            SIGNAL DETECTED
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-12 items-center">
          {/* LEFT — cinematic copy */}
          <div className={`transition-all duration-1000 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
            <div className="flex items-center gap-2 mb-5 max-md:hidden">
              <span className="font-pixel text-[7px] text-[#FFF7E5]/30 tracking-wider hidden sm:inline">
                WORLD_01 // PREPARED
              </span>
            </div>

            <h1 className="mb-6">
              <span
                className="block font-pixel text-[22px] sm:text-[28px] md:text-[36px] lg:text-[42px] text-[#FFF7E5] leading-[1.25]"
                style={{ textShadow: "2px 2px 0 rgba(8,9,11,0.8)" }}
              >
                WE DON&apos;T JUST
              </span>
              <span
                className="block font-pixel text-[22px] sm:text-[28px] md:text-[36px] lg:text-[42px] text-[#FFF7E5] leading-[1.25]"
                style={{ textShadow: "2px 2px 0 rgba(8,9,11,0.8)" }}
              >
                LEARN TECHNOLOGY.
              </span>
              <span
                className="block font-pixel text-[26px] sm:text-[34px] md:text-[44px] lg:text-[52px] text-[#FF1687] leading-[1.25] mt-2"
                style={{ textShadow: "0 0 40px rgba(255,22,135,0.25), 2px 2px 0 rgba(8,9,11,0.8)" }}
              >
                WE BUILD WITH IT<Cursor />
              </span>
            </h1>

            <p className="text-base md:text-lg text-[#FFF7E5]/70 font-mono max-w-[560px] leading-relaxed mb-3">
              FHC (FISAT Horizon Club) is the official technology club of the Computer Science Department at FISAT.
            </p>
            <p className="text-base md:text-lg text-[#FFF7E5]/70 font-mono max-w-[560px] leading-relaxed mb-8">
              A community of curious minds and passionate builders, driven by innovation, collaboration and the desire to create impact through technology.
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-3 border border-[#FF1687]/40 px-6 py-3 bg-[#080b12] hover:bg-[#FF1687]/5 hover:border-[#FF1687]/60 transition-all duration-300 group"
            >
              <span className="text-[#FF1687] group-hover:translate-x-0.5 transition-transform">▶</span>
              <span className="font-pixel text-[10px] text-[#FFF7E5] tracking-wider">INITIALIZE WORLD</span>
              <span className="text-[#FF1687]/60 text-xs group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          {/* RIGHT — HORIZON CORE artifact */}
          <div className="relative">
            <div
              className="relative mx-auto w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px] aspect-square bg-[#05070d] border border-[#1ED7E8]/15 overflow-hidden"
              style={{ opacity: vis ? 1 : 0, transition: "opacity 1.2s ease 0.5s" }}
            >
              <Brackets size={16} color="#1ED7E8" />
              <Scanlines />
              {/* central label */}
              <div className="absolute top-3 inset-x-0 z-20 flex justify-center pointer-events-none max-md:hidden">
                <span className="font-pixel text-[6px] text-[#36D65A]/50 tracking-[0.3em]">HORIZON CORE // ACTIVE</span>
              </div>
              <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center pointer-events-none gap-3 max-md:hidden">
                <span className="flex items-center gap-1 font-pixel text-[6px] text-[#1ED7E8]/40"><Led color="#1ED7E8" />SYNC</span>
                <span className="flex items-center gap-1 font-pixel text-[6px] text-[#FF1687]/40"><Led color="#FF1687" />POWER</span>
              </div>
              <div className="absolute inset-0">
                <Suspense fallback={null}>
                  <HorizonCore mouse={mouse} />
                </Suspense>
              </div>
            </div>
            <div className="mt-3 text-center font-pixel text-[7px] text-[#1ED7E8]/35 tracking-[0.3em] max-md:hidden">
              MODULE 01 // BOOT
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 02 — DISCOVER / WHO WE ARE
   ═══════════════════════════════════════════ */

function DiscoverBeat() {
  const [ref, vis] = useInView(0.3);
  return (
    <section ref={ref} className="relative py-16 px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 w-full max-w-[900px] mx-auto text-center">
        <div className={`transition-all duration-1000 ${vis ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="h-px w-10 bg-[#FF1687]/30" />
            <span className="font-pixel text-[8px] text-[#FF1687]/60 tracking-[0.3em]">DISCOVER</span>
            <span className="h-px w-10 bg-[#FF1687]/30" />
          </div>
          <h2
            className="font-pixel text-[20px] sm:text-[26px] md:text-[34px] lg:text-[40px] text-[#FFF7E5] leading-[1.35]"
            style={{ textShadow: "2px 2px 0 rgba(8,9,11,0.8)" }}
          >
            FHC IS WHERE <span className="text-[#FF1687]">CURIOUS MINDS</span> BECOME <span className="text-[#1ED7E8]">BUILDERS.</span>
          </h2>
          <div className="mt-6 flex justify-center gap-3 flex-wrap">
            {["INNOVATION", "COLLABORATION", "IMPACT"].map((item) => (
              <Tag key={item} color="#36D65A">{item}</Tag>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 03 — ENTER / CORE PRINCIPLES
   ═══════════════════════════════════════════ */

function PrinciplesSection() {
  const [ref, vis] = useInView(0.1);
  return (
    <section ref={ref} className="relative py-16 px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 w-full max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[9px] text-[#FF1687]/60 tracking-[0.2em]">ENTER //</span>
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#1ED7E8]/70 tracking-[0.2em] uppercase">CORE MODULES</span>
          </div>
          <span className="font-pixel text-[7px] text-[#FFF7E5]/25 tracking-wider hidden sm:inline">LOADED // 03</span>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PRINCIPLES.map((p, i) => (
            <div
              key={p.title}
              className={`bg-[#060a14] border border-[#FFF7E5]/6 p-5 md:p-7 h-full hover:border-[#1ED7E8]/25 transition-all duration-300 group relative overflow-hidden ${
                vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <Brackets size={10} color="#FF1687" />
              <Scanlines />
              <span className="font-pixel text-[8px] text-[#FF1687]/60 tracking-[0.2em] block mb-4 max-md:hidden">{p.num} // MODULE</span>
              <span className="font-pixel text-[42px] sm:text-[52px] text-[#FF1687]/10 block leading-none mb-4">{p.num}</span>
              <h3 className="font-pixel text-[12px] sm:text-[13px] text-[#FFF7E5] mb-2">{p.title}</h3>
              <p className="font-pixel text-[8px] text-[#1ED7E8]/70 tracking-wider mb-3">{p.tag}</p>
              <p className="text-sm text-[#FFF7E5]/45 leading-snug font-mono mb-5">{p.desc}</p>
              <div className="flex items-center gap-2 max-md:hidden">
                <Led color="#36D65A" />
                <span className="font-pixel text-[6px] text-[#FFF7E5]/25 tracking-wider group-hover:text-[#FFF7E5]/45 transition-colors">MODULE ACTIVE</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 04 — UNDERSTAND / DIRECTION
   ═══════════════════════════════════════════ */

function DirectionSection() {
  const [ref, vis] = useInView(0.15);
  return (
    <section ref={ref} className="relative py-16 px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 w-full max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[9px] text-[#FF1687]/60 tracking-[0.2em]">UNDERSTAND //</span>
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#1ED7E8]/70 tracking-[0.2em] uppercase">CORE DIRECTIVE</span>
          </div>
          <span className="font-pixel text-[7px] text-[#FFF7E5]/25 tracking-wider hidden sm:inline">TRAJECTORY // LOCKED</span>
        </div>

        <div
          className={`grid md:grid-cols-[1fr_auto_1fr] gap-6 items-stretch transition-all duration-700 ${
            vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          {/* CURRENT STATE — MISSION */}
          <div className="relative bg-[#060a14] border border-[#FF1687]/15 p-5 md:p-7 overflow-hidden">
            <Brackets size={12} color="#FF1687" />
            <Scanlines />
            <div className="relative z-10 flex items-center gap-2 mb-4">
              <span className="text-[#FF1687] text-base">▸</span>
              <span className="font-pixel text-[7px] text-[#FF1687]/70 tracking-[0.2em]">CURRENT STATE</span>
            </div>
            <h3 className="font-pixel text-[11px] sm:text-[12px] text-[#FFF7E5] mb-1 mt-4">MISSION</h3>
            <p className="font-pixel text-[7px] text-[#FF1687]/50 tracking-wider mb-4">CORE DIRECTIVE // ACTIVE</p>
            <p className="text-sm md:text-base leading-relaxed text-[#FFF7E5]/60 font-mono">
              &quot;To empower CS students by providing platforms to learn, build, explore and innovate. We organize events, build projects and share knowledge to help every member grow and succeed.&quot;
            </p>
          </div>

          {/* FHC CORE — connector node */}
          <div className="hidden md:flex flex-col items-center justify-center gap-2 px-3">
            <div className="w-px h-8 bg-gradient-to-b from-[#FF1687]/20 to-transparent" />
            <div
              className="relative w-16 h-16 rounded-full border border-[#1ED7E8]/25 flex items-center justify-center"
              style={{ animation: "spin 10s linear infinite" }}
            >
              <div className="absolute left-1/2 top-1/2 w-[40px] h-[40px] rounded-full border border-[#FF1687]/15 -translate-x-1/2 -translate-y-1/2" style={{ animation: "spin 6s linear infinite reverse" }} />
              <span className="font-pixel text-[8px] text-[#1ED7E8]">FHC</span>
            </div>
            <div className="w-px h-8 bg-gradient-to-b from-transparent to-[#1ED7E8]/20" />
            <span className="font-pixel text-[6px] text-[#1ED7E8]/40 tracking-wider text-center">CORE</span>
          </div>

          {/* FUTURE STATE — VISION */}
          <div className="relative bg-[#060a14] border border-[#1ED7E8]/15 p-5 md:p-7 overflow-hidden">
            <Brackets size={12} color="#1ED7E8" />
            <Scanlines />
            <div className="relative z-10 flex items-center gap-2 mb-4">
              <span className="text-[#1ED7E8] text-base">◇</span>
              <span className="font-pixel text-[7px] text-[#1ED7E8]/70 tracking-[0.2em]">FUTURE STATE</span>
            </div>
            <h3 className="font-pixel text-[11px] sm:text-[12px] text-[#FFF7E5] mb-1 mt-4">VISION</h3>
            <p className="font-pixel text-[7px] text-[#1ED7E8]/50 tracking-wider mb-4">FUTURE STATE // UNLOCKED</p>
            <p className="text-sm md:text-base leading-relaxed text-[#FFF7E5]/60 font-mono">
              &quot;To be a leading technology community that inspires students to solve real-world problems and shape the future. We envision a network of innovators making a positive impact on society.&quot;
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 05 — EXPLORE / SCOREBOARD
   ═══════════════════════════════════════════ */

function ScoreCard({ value, label, active, delay }) {
  const display = useCountUp(value, active, 1400);
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (active) {
      const t = setTimeout(() => setShow(true), delay);
      return () => clearTimeout(t);
    }
  }, [active, delay]);
  return (
    <div className={`text-center transition-all duration-500 ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <p className="font-pixel text-3xl sm:text-4xl md:text-5xl text-[#FF1687] mb-2" style={{ textShadow: "0 0 30px rgba(255,22,135,0.3)" }}>
        {display}
      </p>
      <p className="font-pixel text-[7px] sm:text-[8px] text-[#FFF7E5]/40 tracking-wider uppercase">{label}</p>
      <div className="mt-3 h-px bg-gradient-to-r from-transparent via-[#FF1687]/20 to-transparent" />
    </div>
  );
}

function ScoreboardSection() {
  const [ref, vis] = useInView(0.2);
  return (
    <section ref={ref} className="relative py-16 px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 w-full max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[9px] text-[#FF1687]/60 tracking-[0.2em]">EXPLORE //</span>
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#1ED7E8]/70 tracking-[0.2em] uppercase">SYSTEM STATS</span>
          </div>
          <span className="font-pixel text-[7px] text-[#FFF7E5]/25 tracking-wider hidden sm:inline">DATA // VERIFIED</span>
        </div>

        <div className={`transition-all duration-700 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="relative bg-[#060a14] border border-[#FFF7E5]/6 p-6 md:p-8 overflow-hidden">
            <Brackets size={14} color="#FF1687" />
            <Scanlines />
            <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: "repeating-linear-gradient(0deg, rgba(30,215,232,0.03) 0px, rgba(30,215,232,0.03) 1px, transparent 1px, transparent 24px), repeating-linear-gradient(90deg, rgba(30,215,232,0.03) 0px, rgba(30,215,232,0.03) 1px, transparent 1px, transparent 24px)" }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#FFF7E5]/6">
                <span className="font-pixel text-[9px] text-[#FF1687] tracking-[0.15em]">SCOREBOARD</span>
                <div className="flex items-center gap-3">
                  <span className="font-pixel text-[6px] text-[#1ED7E8]/30 hidden sm:inline">FHC HORIZON SYSTEM</span>
                  <Led color="#FF1687" />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
                {NUMBERS.map((n, i) => (
                  <ScoreCard key={n.label} value={n.value} label={n.label} active={vis} delay={i * 120} />
                ))}
              </div>

              <div className="mt-6 pt-3 border-t border-[#FFF7E5]/6 max-md:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-pixel text-[6px] text-[#1ED7E8]/25">TERMINAL_01</span>
                  <div className="flex-1 h-px bg-[#1ED7E8]/10 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-[#1ED7E8]/30" style={{ animation: "sweep 3s ease-in-out infinite" }} />
                  </div>
                  <span className="font-pixel text-[6px] text-[#36D65A]/45">SYNCED</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 06 — CONNECT / SECTOR MAP
   ═══════════════════════════════════════════ */

function SectorMap() {
  const [ref, vis] = useInView(0.1);
  return (
    <section ref={ref} className="relative py-16 px-4 sm:px-6 lg:px-8">
      <div className="relative z-10 w-full max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[9px] text-[#FF1687]/60 tracking-[0.2em]">CONNECT //</span>
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#1ED7E8]/70 tracking-[0.2em] uppercase">SECTOR MAP</span>
          </div>
          <span className="font-pixel text-[7px] text-[#FFF7E5]/25 tracking-wider hidden sm:inline">NODES // 04</span>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {WHAT_WE_DO.map((item, i) => (
            <div
              key={item.title}
              className={`group relative transition-all duration-700 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="relative bg-[#060a14] border border-[#FFF7E5]/6 p-5 h-full hover:border-[var(--accent)]/25 transition-all duration-300 overflow-hidden" style={{ ["--accent"]: item.accent }}>
                <Brackets size={8} color={item.accent} />
                <Scanlines />
                <div className="relative z-10">
                  <span className="font-pixel text-[8px] tracking-[0.2em] block mb-1" style={{ color: `${item.accent}90` }}>
                    SECTOR {item.num}
                  </span>
                  <div className="h-[2px] w-10 mb-4" style={{ background: item.accent }} />
                  <h3 className="font-pixel text-[11px] text-[#FFF7E5] mb-2">{item.title}</h3>
                  <p className="font-pixel text-[7px] tracking-wider" style={{ color: `${item.accent}80` }}>{item.tag}</p>
                  <div className="mt-5 flex items-center gap-2 group-hover:gap-3 transition-all duration-300">
                    <span className="font-pixel text-[7px] text-[#FFF7E5]/30 group-hover:text-[#FFF7E5]/50 transition-colors">LINK</span>
                    <span className="text-[var(--accent)] text-xs group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent group-hover:from-[var(--accent)]/[0.02] group-hover:to-transparent transition-all duration-500 pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 07 — SEE THE FUTURE / TERMINAL
   ═══════════════════════════════════════════ */

function TerminalSection() {
  const [ref, vis] = useInView(0.2);
  const [line, setLine] = useState(-1);
  const [sec, setSec] = useState(0);

  const LINES = [
    { t: "connecting to fhc core...", c: "#1ED7E8" },
    { t: "building future...", c: "#36D65A" },
    { t: "innovating together...", c: "#36D65A" },
    { t: "impacting the world...", c: "#36D65A" },
    { t: "identity confirmed.", c: "#FFF7E5" },
    { t: "fhc system online.", c: "#FF1687" },
    { t: "we are fhc", c: "#FFF7E5" },
  ];
  const TOTAL = LINES.length;
  const shown = Math.min(Math.max(line + 1, 0), TOTAL);
  const pct = Math.round((shown / TOTAL) * 100);

  useEffect(() => {
    if (!vis) return;
    let i = -1;
    const iv = setInterval(() => {
      i++;
      setLine(i);
      if (i >= TOTAL) clearInterval(iv);
    }, 720);
    return () => clearInterval(iv);
  }, [vis, TOTAL]);

  useEffect(() => {
    if (!vis) return;
    const tv = setInterval(() => setSec((s) => s + 1), 1000);
    return () => clearInterval(tv);
  }, [vis]);

  const ts = `T+00:${String(Math.min(Math.floor(sec / 60) + 0, 99)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  const bars = 12;
  const filled = Math.round((pct / 100) * bars);

  return (
    <section ref={ref} className="relative py-16 px-4 sm:px-6 lg:px-8">
      <style>{`
        .hc-cursor-blink{animation:hcCursor 0.9s steps(1) infinite}
        @keyframes hcCursor{50%{opacity:0}}
        .hc-type{white-space:nowrap;overflow:hidden;display:inline-block;vertical-align:bottom;max-width:100%;animation:hcType 0.55s steps(26,end) forwards}
        @keyframes hcType{from{max-width:0}to{max-width:100%}}
        .hc-scan{animation:hcScan 7s linear infinite}
        @keyframes hcScan{0%{top:-2%}100%{top:100%}}
        .hc-noise{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E");animation:hcNoise 1.2s steps(6) infinite}
        @keyframes hcNoise{0%{background-position:0 0}25%{background-position:-20px 12px}50%{background-position:14px -8px}75%{background-position:-6px 22px}100%{background-position:0 0}}
        .hc-flicker{animation:hcFlicker 7s steps(1) infinite}
        @keyframes hcFlicker{0%,91%,100%{opacity:1}92%{opacity:0.86}94%{opacity:0.96}96%{opacity:0.9}}
        .hc-pulse{animation:hcPulse 2.1s ease-in-out infinite}
        @keyframes hcPulse{0%,100%{opacity:1;box-shadow:0 0 5px currentColor}50%{opacity:0.45;box-shadow:0 0 12px currentColor}}
        @keyframes hcBlink{0%,100%{opacity:1}50%{opacity:0.25}}
      `}</style>

      <div className="relative z-10 w-full max-w-[700px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="font-pixel text-[9px] text-[#FF1687]/60 tracking-[0.2em]">SEE THE FUTURE //</span>
            <span className="font-pixel text-[10px] sm:text-[11px] text-[#1ED7E8]/70 tracking-[0.2em] uppercase">LIVE UPLINK</span>
          </div>
          <span className="font-pixel text-[7px] text-[#FFF7E5]/25 tracking-wider hidden sm:inline">STREAMING</span>
        </div>

        <div className={`transition-all duration-700 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div
            className="hc-flicker relative overflow-hidden rounded-[3px] border border-[#1ED7E8]/20 bg-[#04060c]/82"
            style={{
              boxShadow:
                "0 0 0 1px rgba(0,0,0,0.6), 0 24px 70px rgba(0,0,0,0.65), 0 0 46px rgba(30,215,232,0.07), inset 0 0 24px rgba(30,215,232,0.05)",
            }}
          >
            <Brackets size={15} color="#1ED7E8" />

            {/* dimensional glass layers */}
            <div className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "radial-gradient(120% 90% at 50% 8%, rgba(30,215,232,0.07), rgba(5,8,16,0) 45%)" }} />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px z-[3] bg-gradient-to-r from-transparent via-[#1ED7E8]/35 to-transparent" />
            <div className="pointer-events-none absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.5), transparent 12%, transparent 88%, rgba(0,0,0,0.55))" }} />

            {/* faint structural grid */}
            <div
              className="pointer-events-none absolute inset-0 z-[1] opacity-[0.13]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(30,215,232,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(30,215,232,0.16) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
                maskImage: "linear-gradient(180deg, transparent, black 16%, black 84%, transparent)",
                WebkitMaskImage: "linear-gradient(180deg, transparent, black 16%, black 84%, transparent)",
              }}
            />

            {/* scanlines + traveling scan + faint noise */}
            <Scanlines />
            <div className="hc-scan pointer-events-none absolute left-0 right-0 h-[3px] z-[2]" style={{ background: "linear-gradient(180deg, transparent, rgba(30,215,232,0.10), transparent)" }} />
            <div className="hc-noise pointer-events-none absolute inset-0 z-[2] opacity-[0.05] mix-blend-screen" />

            {/* header bar */}
            <div className="relative z-[4] flex items-center gap-2 px-4 pt-3 pb-2 border-b border-[#1ED7E8]/10 bg-black/20 backdrop-blur-[1px]">
              <span className="w-2 h-2 rounded-full bg-[#FF5F56]" />
              <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
              <span className="w-2 h-2 rounded-full bg-[#27C93F]" />
              <span className="font-pixel text-[8px] text-[#FFF7E5]/45 ml-2" style={{ textShadow: "0 0 6px rgba(30,215,232,0.35)" }}>FHC_CORE // UPLINK</span>
              <span className="flex-1" />
              <span className="font-pixel text-[6px] text-[#36D65A]/55 hidden sm:inline">HORIZON SYSTEM</span>
              <span className="flex items-center gap-1.5 border border-[#36D65A]/25 bg-[#36D65A]/5 px-2 py-0.5 max-md:hidden">
                <span className="hc-pulse inline-block w-[5px] h-[5px] rounded-full text-[#36D65A]" style={{ background: "currentColor" }} />
                <span className="font-pixel text-[6px] text-[#36D65A]/70">CONNECTION: STABLE</span>
              </span>
            </div>

            {/* body */}
            <div className="relative z-[4] px-5 pt-4 pb-5 min-h-[260px]">
              {/* meta strip */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#1ED7E8]/8 font-pixel text-[6px] tracking-[0.18em] text-[#1ED7E8]/40">
                <span className="text-[#FF1687]/60" style={{ textShadow: "0 0 6px rgba(255,22,135,0.35)" }}>▚ HORIZON SYSTEM</span>
                <span className="hidden sm:inline">CH:0x07 · UK:PUBLIC</span>
                <span className="tabular-nums" style={{ animation: "hcBlink 3s steps(1) infinite" }}>{ts}</span>
              </div>

              {/* boot sequence */}
              <div className="space-y-[10px]">
                {LINES.map((l, i) => {
                  const on = i <= line;
                  const isCursor = i === Math.min(line, TOTAL - 1);
                  return (
                    <p
                      key={i}
                      className="font-mono text-[15px] sm:text-[17px] leading-snug transition-all duration-300"
                      style={{
                        opacity: on ? 1 : 0,
                        transform: on ? "translateX(0)" : "translateX(-6px)",
                        color: l.c,
                        textShadow: on ? "0 0 10px rgba(30,215,232,0.18)" : "none",
                      }}
                    >
                      <span className="text-[#FF1687]/75 mr-2">&gt;</span>
                      {on ? <span className="hc-type" style={{ color: l.c }}>{l.t}</span> : <span>&nbsp;</span>}
                      {on && isCursor && <span className="hc-cursor-blink text-[#1ED7E8]">█</span>}
                    </p>
                  );
                })}
              </div>

              {/* restrained sync / progress indicator */}
              <div className="mt-5 pt-3 border-t border-[#1ED7E8]/8">
                <div className="flex items-center justify-between font-pixel text-[6px] tracking-[0.18em] text-[#1ED7E8]/45 mb-1.5">
                  <span className="text-[#36D65A]/60">SYNC: {pct}%</span>
                  <span className="text-[#FFF7E5]/25">UPLINK STREAM</span>
                </div>
                <div className="h-[5px] w-full bg-[#1ED7E8]/8 relative overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 h-full bg-gradient-to-r from-[#1ED7E8]/25 via-[#1ED7E8] to-[#FF1687]"
                    style={{
                      width: `${pct}%`,
                      transition: "width 0.6s ease",
                      boxShadow: "0 0 10px rgba(30,215,232,0.7)",
                    }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1.5 font-pixel text-[6px] tracking-[0.18em] opacity-60">
                  <span className="text-[#1ED7E8]/50">{`[${"#".repeat(filled).padEnd(bars, "-")}]`}</span>
                  <span className="text-[#FF1687]/50">FHC CORE CONFIRMED</span>
                </div>
              </div>
            </div>

            {/* bottom beacon glow */}
            <div className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 h-3 w-2/3 z-[2]" style={{ background: "radial-gradient(50% 100% at 50% 100%, rgba(30,215,232,0.22), transparent 70%)" }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   SECTION 08 — BECOME PART OF FHC
   ═══════════════════════════════════════════ */

function BecomeSection() {
  const [ref, vis] = useInView(0.2);
  return (
    <section ref={ref} className="relative py-20 px-4 sm:px-6 lg:px-8 mb-8">
      <div className="relative z-10 w-full max-w-[900px] mx-auto text-center">
        <div className={`transition-all duration-1000 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          <div className="mb-6">
            <span className="font-pixel text-[8px] text-[#1ED7E8]/50 tracking-[0.3em] block mb-3">
              ═════════ BECOME PART OF FHC ═════════
            </span>
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="w-2 h-2 bg-[#FF1687]" style={{ animation: "led-blink 1.2s ease-in-out infinite", animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>

          <h2 className="font-pixel text-lg sm:text-xl md:text-2xl text-[#FFF7E5] mb-4" style={{ textShadow: "0 0 30px rgba(255,22,135,0.12)" }}>
            FHC ISN&apos;T JUST A CLUB.
          </h2>

          <div className="space-y-2 mb-10">
            <p className="font-pixel text-sm sm:text-base text-[#FF1687]">IT&apos;S A COMMUNITY.</p>
            <p className="font-pixel text-sm sm:text-base text-[#1ED7E8]">IT&apos;S A MOVEMENT.</p>
            <p className="font-pixel text-sm sm:text-base text-[#FFF7E5]/80">IT&apos;S OUR HORIZON.</p>
          </div>

          <Link
            to="/join"
            className="inline-flex items-center gap-3 border-2 border-[#FF1687] px-8 py-4 bg-[#08090B] hover:bg-[#FF1687]/10 hover:border-[#FF1687] hover:shadow-[0_0_20px_rgba(255,22,135,0.2)] transition-all duration-300"
            style={{ clipPath: "polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px))" }}
          >
            <span className="text-[#FF1687] text-lg">▶</span>
            <span className="font-pixel text-[11px] text-[#FFF7E5] tracking-wider">Join the Horizon</span>
          </Link>

          <div className="mt-10 flex items-center justify-center gap-3 font-pixel text-[7px] text-[#1ED7E8]/25 max-md:hidden">
            <span>ARCHIVE COMPLETE</span>
            <span className="w-1 h-1 bg-[#FF1687]/30 inline-block" />
            <span>HORIZON SYSTEM ONLINE</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */

export default function About() {
  const mouse = useRef({ x: 0, y: 0 });
  const scroll = useRef(0);

  const onMove = useCallback((e) => {
    mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    const onScroll = () => {
      scroll.current = window.scrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <PageFrame bg="#050810">
      <div className="relative overflow-x-clip" onMouseMove={onMove}>
        <Suspense fallback={null}>
          <ArcadeScene mouse={mouse} scroll={scroll} />
        </Suspense>

        {/* CRT overlays */}
        <div
          className="pointer-events-none fixed inset-0 z-[9998]"
          style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)" }}
        />
        <div
          className="pointer-events-none fixed inset-0 z-[9997]"
          style={{ background: "repeating-linear-gradient(to bottom, rgba(0,0,0,0.05) 0px, rgba(0,0,0,0.05) 1px, transparent 1px, transparent 3px)" }}
        />

        <div className="relative z-10">
          <HeroSection mouse={mouse} />
          <DiscoverBeat />
          <PrinciplesSection />
          <DirectionSection />
          <ScoreboardSection />
          <SectorMap />
          <TerminalSection />
          <BecomeSection />
        </div>

        <Footer />
      </div>
    </PageFrame>
  );
}
