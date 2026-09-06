import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const ACCENT_MAP = {
  pink: "#FF007F",
  cyan: "#00E5FF",
  green: "#4CFF4C",
};

/* ═══════════════════════════════════════════════════════════════
   FLAT 2D HOLOGRAM — PLAYER ROBOT
   Painted in the same visual language as the holographic Earth on
   the About page: a flat 2D figure built from layered translucent
   cyan/teal polygon facets, contour wireframe lines, horizontal
   scanlines, selective bright highlights, dark translucent
   interiors, subtle glow, drifting fragments and circular
   holographic projection rings. Depth comes entirely from
   overlapping flat shapes + additive light — not a solid 3D model.
   ═══════════════════════════════════════════════════════════════ */

const SCAN_TIME = { value: 0 };

/* ── flat shape helpers (XY plane, facing +Z) ── */
function shapeGeom(pts) {
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
  s.closePath();
  return new THREE.ShapeGeometry(s);
}

function loopGeom(pts) {
  const arr = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    arr.push(a[0], a[1], 0, b[0], b[1], 0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return g;
}

function strutGeom(pts, zF, zB) {
  const arr = [];
  let xMin = Infinity;
  let xMax = -Infinity;
  for (const p of pts) { xMin = Math.min(xMin, p[0]); xMax = Math.max(xMax, p[0]); }
  const seen = new Set();
  for (const p of pts) {
    if (p[0] !== xMin && p[0] !== xMax) continue;
    const k = `${p[0].toFixed(4)}_${p[1].toFixed(4)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    arr.push(p[0], p[1], zF, p[0], p[1], zB);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return g;
}

function polylineGeom(segs) {
  const arr = [];
  for (const [a, b] of segs) arr.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(arr, 3));
  return g;
}

function rrectShape(cx, cy, w, h, r) {
  const s = new THREE.Shape();
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const y0 = cy - h / 2, y1 = cy + h / 2;
  const rr = Math.min(Math.max(r, 0), w / 2, h / 2);
  s.moveTo(x0, y0 + rr);
  s.lineTo(x0, y1 - rr);
  s.quadraticCurveTo(x0, y1, x0 + rr, y1);
  s.lineTo(x1 - rr, y1);
  s.quadraticCurveTo(x1, y1, x1, y1 - rr);
  s.lineTo(x1, y0 + rr);
  s.quadraticCurveTo(x1, y0, x1 - rr, y0);
  s.lineTo(x0 + rr, y0);
  s.quadraticCurveTo(x0, y0, x0, y0 + rr);
  s.closePath();
  return s;
}

function cshape(cx, cy, rx, ry = rx) {
  const s = new THREE.Shape();
  s.absellipse(cx, cy, rx, ry, 0, Math.PI * 2, false, 0);
  s.closePath();
  return s;
}

const mirrorShape = (sh) => {
  const pts = sh.getPoints(80);
  const s = new THREE.Shape();
  s.moveTo(-pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) s.lineTo(-pts[i].x, pts[i].y);
  s.closePath();
  return s;
};

/* ── holographic scanline shader facets ── */
function scanFacet(color, base) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: SCAN_TIME,
      uColor: { value: new THREE.Color(color) },
      uBase: { value: base },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uBase;
      varying vec2 vUv;
      void main() {
        float v = fract(vUv.y * 26.0 - uTime * 1.5);
        float dn = abs(v - 0.5);
        float hi = smoothstep(0.05, 0.0, dn);
        float fill = smoothstep(0.02, 0.45, dn);
        float flick = 0.9 + 0.1 * sin(uTime * 7.0 + vUv.x * 55.0 + vUv.y * 80.0);
        float lum = uBase * (0.34 + 0.62 * fill + 1.6 * hi) * flick;
        float a = uBase * (0.34 + 0.6 * fill) + 0.5 * hi;
        gl_FragColor = vec4(uColor * lum, a);
      }`,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    renderOrder: 4,
  });
}

/* ── shared palette materials (accent-independent) ── */
const MAINS = [
  scanFacet("#2fd8ec", 0.7),
  scanFacet("#1ED7E8", 0.5),
  scanFacet("#7df1ff", 0.85),
];

const DARK = new THREE.MeshBasicMaterial({
  color: "#04131c", transparent: true, opacity: 0.6, depthWrite: false,
  side: THREE.DoubleSide, renderOrder: 1, toneMapped: false,
});
const DIM = new THREE.MeshBasicMaterial({
  color: "#0e8499", transparent: true, opacity: 0.32, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide, renderOrder: 2, toneMapped: false,
});
const HIGHLIGHT = new THREE.MeshBasicMaterial({
  color: "#aef7ff", transparent: true, opacity: 0.8, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide, renderOrder: 7, toneMapped: false,
});
const MAGENTA = new THREE.MeshBasicMaterial({
  color: "#FF1687", transparent: true, opacity: 0.5, depthWrite: false,
  blending: THREE.AdditiveBlending, side: THREE.DoubleSide, renderOrder: 8, toneMapped: false,
});

const EDGE_FRONT = new THREE.LineBasicMaterial({
  color: "#46e8ff", transparent: true, opacity: 0.55, depthWrite: false,
  blending: THREE.AdditiveBlending, renderOrder: 6, toneMapped: false,
});
const EDGE_BACK = new THREE.LineBasicMaterial({
  color: "#1ED7E8", transparent: true, opacity: 0.16, depthWrite: false,
  blending: THREE.AdditiveBlending, renderOrder: 2, toneMapped: false,
});
const EDGE_STRUT = new THREE.LineBasicMaterial({
  color: "#37d9ff", transparent: true, opacity: 0.13, depthWrite: false,
  blending: THREE.AdditiveBlending, renderOrder: 3, toneMapped: false,
});

const VISOR_MAT = new THREE.MeshBasicMaterial({
  color: "#041019", transparent: true, opacity: 0.82, depthWrite: false,
  side: THREE.DoubleSide, renderOrder: 5, toneMapped: false,
});

/* ── cute rounded robot blueprint — flat front-view shapes (y up, feet ~0) ── */
const HEAD = cshape(0, 1.56, 0.38, 0.36);                    /* big round head */
const VISOR = rrectShape(0, 1.54, 0.46, 0.22, 0.11);          /* smooth dark face */
const NECK = rrectShape(0, 1.22, 0.16, 0.14, 0.07);
const TORSO = rrectShape(0, 0.88, 0.60, 0.52, 0.24);          /* rounded pear body */
const BELLY = cshape(0, 0.84, 0.20, 0.15);
const CHEST = rrectShape(0, 1.00, 0.34, 0.30, 0.14);
const CORE = cshape(0, 0.96, 0.07);
const SHLD_R = cshape(0.40, 1.06, 0.13);
const SHLD_L = mirrorShape(SHLD_R);
const UARM_R = rrectShape(0.40, 0.90, 0.16, 0.30, 0.08);
const UARM_L = mirrorShape(UARM_R);
const ELBOW_R = cshape(0.40, 0.72, 0.09);
const ELBOW_L = mirrorShape(ELBOW_R);
const FOREARM_R = rrectShape(0.40, 0.60, 0.14, 0.24, 0.07);
const FOREARM_L = mirrorShape(FOREARM_R);
const HAND_R = cshape(0.40, 0.40, 0.11);
const HAND_L = mirrorShape(HAND_R);
const THIGH_R = rrectShape(0.16, 0.50, 0.20, 0.26, 0.09);
const THIGH_L = mirrorShape(THIGH_R);
const KNEE_R = cshape(0.17, 0.35, 0.08);
const KNEE_L = mirrorShape(KNEE_R);
const SHIN_R = rrectShape(0.17, 0.24, 0.16, 0.22, 0.07);
const SHIN_L = mirrorShape(SHIN_R);
const FOOT_R = rrectShape(0.18, 0.11, 0.28, 0.12, 0.05);
const FOOT_L = mirrorShape(FOOT_R);
const SOLE_R = rrectShape(0.18, 0.055, 0.28, 0.02, 0.008);
const SOLE_L = mirrorShape(SOLE_R);
const EAR_R = cshape(0.40, 1.52, 0.08);
const EAR_L = mirrorShape(EAR_R);
const ANT_R = rrectShape(0.09, 2.00, 0.03, 0.14, 0.015);
const ANT_L = mirrorShape(ANT_R);
const ANT_TIP_R = cshape(0.09, 2.08, 0.04);
const ANT_TIP_L = mirrorShape(ANT_TIP_R);

const BACKPACK = rrectShape(0, 0.94, 0.30, 0.40, 0.14);
const FIN_R = rrectShape(0.44, 1.62, 0.06, 0.24, 0.03);
const FIN_L = mirrorShape(FIN_R);
const ANT_MID = rrectShape(0, 2.10, 0.035, 0.26, 0.016);
const ANT_ORB = cshape(0, 2.30, 0.05);

const ARM_R = { shld: SHLD_R, uparm: UARM_R, elbow: ELBOW_R, forearm: FOREARM_R, hand: HAND_R, sx: 1 };
const ARM_L = { shld: SHLD_L, uparm: UARM_L, elbow: ELBOW_L, forearm: FOREARM_L, hand: HAND_L, sx: -1 };
const ARM = [ARM_L, ARM_R];
const LEG_R = { thigh: THIGH_R, knee: KNEE_R, shin: SHIN_R, foot: FOOT_R, sole: SOLE_R, sx: 1 };
const LEG_L = { thigh: THIGH_L, knee: KNEE_L, shin: SHIN_L, foot: FOOT_L, sole: SOLE_L, sx: -1 };
const LEG = [LEG_L, LEG_R];

/* hologram glitch slivers (broken edges) + smile */
const GLITCH_1 = [[0.37, 1.26],[0.46, 1.28],[0.39, 1.36]];
const GLITCH_2 = [[-0.32, 1.80],[-0.25, 1.84],[-0.29, 1.88]];
const MOUTH = polylineGeom([[[-0.04, 1.40, 0.096],[0, 1.385, 0.096],[0.04, 1.40, 0.096]]]);

/* torso + head internal brace wires */
const BRACES = polylineGeom([
  [[-0.24, 1.14, 0.052],[0.24, 0.66, 0.052]],
  [[0.24, 1.14, 0.052],[-0.24, 0.66, 0.052]],
  [[-0.24, 0.66, 0.052],[-0.01, 0.72, 0.052]],
  [[-0.12, 1.70, 0.052],[0.12, 1.52, 0.052]],
]);

/* horizontal hologram shelf-lines + central data spine (follow body) */
const SHELFS = polylineGeom([
  [[-0.20, 0.22, 0.078],[0.20, 0.22, 0.078]],
  [[-0.26, 0.62, 0.078],[0.26, 0.62, 0.078]],
  [[-0.30, 0.98, 0.078],[0.30, 0.98, 0.078]],
  [[-0.34, 1.34, 0.078],[0.34, 1.34, 0.078]],
  [[-0.30, 1.78, 0.078],[0.30, 1.78, 0.078]],
  [[0, 0.10, 0.082],[0, 1.90, 0.082]],
]);
const SHELF_MAT = new THREE.LineBasicMaterial({
  color: "#1ED7E8", transparent: true, opacity: 0.09, depthWrite: false,
  blending: THREE.AdditiveBlending, renderOrder: 6, toneMapped: false,
});

/* ── one flat facet stack: dark interior + translucent fills +
      front/back contours + connecting corner struts ── */
function shapeToPts(shape, n = 96) {
  return shape.getPoints(n).map((p) => [p.x, p.y]);
}

function FacetPart({ shape, pts, zF = 0.05, zB = -0.05, front, back, edgeF, edgeB, strut = false, rot = 0 }) {
  const fg = useMemo(() => (shape ? new THREE.ShapeGeometry(shape, 12) : shapeGeom(pts)), [shape, pts]);
  const out = useMemo(() => (shape ? shapeToPts(shape, 88) : pts), [shape, pts]);
  const lg = useMemo(() => loopGeom(out), [out]);
  const sg = useMemo(() => (strut ? strutGeom(out, zF, zB) : null), [out, zF, zB]);
  return (
    <group rotation={[0, 0, rot]}>
      {back && <mesh geometry={fg} material={back} position={[0, 0, zB]} />}
      {front && <mesh geometry={fg} material={front} position={[0, 0, zF]} />}
      {edgeF && <lineSegments geometry={lg} material={EDGE_FRONT} position={[0, 0, zF + 0.003]} />}
      {edgeB && <lineSegments geometry={lg} material={EDGE_BACK} position={[0, 0, zB]} />}
      {strut && sg && <lineSegments geometry={sg} material={EDGE_STRUT} />}
    </group>
  );
}

/* ── soft additive halo behind the hologram ── */
const GLOW_TEX = (() => {
  if (typeof document === "undefined") return null;
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 128);
  g.addColorStop(0, "rgba(48,232,244,0.5)");
  g.addColorStop(0.38, "rgba(26,193,220,0.16)");
  g.addColorStop(1, "rgba(20,150,180,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
})();

/* ── flat radial reticle rings behind the hologram (Earth-style
      graticule, purely 2D, framed with the robot) ── */
const RETICLE_X = polylineGeom([[[-0.96, 0, 0], [0.96, 0, 0]]]);
const RETICLE_Y = polylineGeom([[[0, -0.96, 0], [0, 0.96, 0]]]);
const RETICLE_MAT = new THREE.LineBasicMaterial({
  color: "#1ED7E8", transparent: true, opacity: 0.08, depthWrite: false,
  blending: THREE.AdditiveBlending, renderOrder: 0, toneMapped: false,
});

function BackReticle() {
  const rings = useMemo(() =>
    [0.13, 0.1, 0.07, 0.05].map((o) => new THREE.MeshBasicMaterial({
      color: "#26E4FF", transparent: true, opacity: o, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, renderOrder: 0, toneMapped: false,
    })), []);
  return (
    <group position={[-0.10, 0.36, -0.14]}>
      {rings.map((m, i) => (
        <mesh key={i} material={m}>
          <ringGeometry args={[0.62 + i * 0.12 - 0.004, 0.62 + i * 0.12 + 0.004, 96]} />
        </mesh>
      ))}
      <lineSegments geometry={RETICLE_X} material={RETICLE_MAT} />
      <lineSegments geometry={RETICLE_Y} material={RETICLE_MAT} />
    </group>
  );
}

/* ── drifting flat shards (cyan + sparse magenta interference) ── */
function HoloFragments({ time }) {
  const cyanRef = useRef();
  const magRef = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const cyan = useMemo(() => {
    const a = [];
    let s = 9871;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < 26; i++) {
      a.push({
        x: (rnd() - 0.5) * 1.15, y: 0.12 + rnd() * 1.72, z: (rnd() - 0.5) * 0.5,
        sp: 0.1 + rnd() * 0.24, off: rnd() * 6.28, sc: 0.02 + rnd() * 0.035, rz: rnd() * 6.28,
      });
    }
    return a;
  }, []);
  const mags = useMemo(() => {
    const a = [];
    let s = 4417;
    const rnd = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < 8; i++) {
      a.push({
        x: (rnd() - 0.5) * 1.0, y: 0.2 + rnd() * 1.5, z: (rnd() - 0.5) * 0.45,
        sp: 0.14 + rnd() * 0.3, off: rnd() * 6.28, sc: 0.016 + rnd() * 0.024, rz: rnd() * 6.28,
      });
    }
    return a;
  }, []);

  useFrame(() => {
    const t = time.current;
    if (cyanRef.current) {
      for (let i = 0; i < cyan.length; i++) {
        const p = cyan[i];
        dummy.position.set(
          p.x + Math.sin(t * p.sp * 0.6 + p.off) * 0.07,
          p.y + Math.sin(t * p.sp + p.off) * 0.08,
          p.z + Math.cos(t * p.sp * 0.7 + p.off) * 0.06,
        );
        dummy.rotation.set(t * p.sp * 0.5 + p.off, 0, p.rz + t * p.sp * 0.7);
        dummy.scale.setScalar(p.sc * (0.6 + Math.sin(t * 1.5 + p.off) * 0.4));
        dummy.updateMatrix();
        cyanRef.current.setMatrixAt(i, dummy.matrix);
      }
      cyanRef.current.instanceMatrix.needsUpdate = true;
    }
    if (magRef.current) {
      for (let i = 0; i < mags.length; i++) {
        const p = mags[i];
        dummy.position.set(
          p.x + Math.sin(t * p.sp * 0.7 + p.off) * 0.09,
          p.y + Math.sin(t * p.sp * 0.8 + p.off) * 0.09,
          p.z + Math.cos(t * p.sp * 0.6 + p.off) * 0.05,
        );
        dummy.rotation.set(t * p.sp * 0.6 + p.off, 0, p.rz - t * p.sp * 0.8);
        dummy.scale.setScalar(p.sc * (0.5 + Math.sin(t * 1.9 + p.off) * 0.5));
        dummy.updateMatrix();
        magRef.current.setMatrixAt(i, dummy.matrix);
      }
      magRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      <instancedMesh ref={cyanRef} args={[undefined, undefined, 26]}>
        <planeGeometry args={[0.05, 0.05]} />
        <meshBasicMaterial
          color="#52e9ff" transparent opacity={0.4} depthWrite={false}
          blending={THREE.AdditiveBlending} side={THREE.DoubleSide} renderOrder={8} toneMapped={false}
        />
      </instancedMesh>
      <instancedMesh ref={magRef} args={[undefined, undefined, 8]}>
        <planeGeometry args={[0.035, 0.035]} />
        <meshBasicMaterial
          color="#FF1687" transparent opacity={0.4} depthWrite={false}
          blending={THREE.AdditiveBlending} side={THREE.DoubleSide} renderOrder={8} toneMapped={false}
        />
      </instancedMesh>
    </group>
  );
}

/* ── flat circular holographic projection rings on the floor + sweep ── */
function ProjectionFloor({ time }) {
  const sweep = useRef();
  const halo = useRef();
  const ringMats = useMemo(() => [0.2, 0.13, 0.09].map((o) => new THREE.MeshBasicMaterial({
    color: "#1ED7E8", transparent: true, opacity: o, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, renderOrder: 0, toneMapped: false,
  })), []);

  useFrame((_, dt) => {
    if (sweep.current) sweep.current.rotation.y += dt * 0.7;
    if (halo.current) {
      const t = time.current;
      halo.current.material.opacity = 0.7 + Math.sin(t * 2.2) * 0.25;
      halo.current.scale.setScalar(1 + Math.sin(t * 1.4) * 0.04);
    }
  });

  return (
    <group position={[0, 0.032, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {[0.56, 0.65, 0.74].map((r, i) => (
        <mesh key={i} material={ringMats[i]}>
          <ringGeometry args={[r - 0.004, r + 0.004, 64]} />
        </mesh>
      ))}
      <mesh ref={sweep} material={ringMats[0]}>
        <ringGeometry args={[0.56, 0.575, 48, 1, 0, 1.25]} />
      </mesh>
      <mesh ref={halo}>
        <circleGeometry args={[0.58, 48]} />
        <meshBasicMaterial
          color="#0fd0e6" transparent opacity={0.7} depthWrite={false}
          blending={THREE.AdditiveBlending} side={THREE.DoubleSide} renderOrder={0} toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ── the flat layered holographic robot ── */
function HoloRobot({ variant = 0, accent = "cyan", time }) {
  const gRef = useRef();
  const coreRef = useRef();
  const ac = ACCENT_MAP[accent] || ACCENT_MAP.cyan;

  const acc = useMemo(() => ({
    scan: scanFacet(ac, 0.55),
    bright: new THREE.MeshBasicMaterial({
      color: ac, transparent: true, opacity: 0.9, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, renderOrder: 7, toneMapped: false,
    }),
    halo: new THREE.MeshBasicMaterial({
      color: ac, transparent: true, opacity: 0.22, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide, renderOrder: 7, toneMapped: false,
    }),
    edge: new THREE.LineBasicMaterial({
      color: ac, transparent: true, opacity: 0.6, depthWrite: false,
      blending: THREE.AdditiveBlending, renderOrder: 8, toneMapped: false,
    }),
  }), [ac]);

  useFrame(() => {
    const t = time.current;
    if (gRef.current) {
      gRef.current.rotation.y = Math.sin(t * 0.32) * 0.22;
      gRef.current.rotation.x = Math.sin(t * 0.2) * 0.03;
    }
    if (coreRef.current) {
      coreRef.current.scale.setScalar(1 + Math.sin(t * 1.8) * 0.2);
    }
    SHELF_MAT.opacity = 0.07 + Math.sin(t * 0.8) * 0.03;
  });

  return (
    <group ref={gRef} position={[-0.10, -0.72, 0]}>
      {/* ── internal braces + horizontal hologram shelves ── */}
      <lineSegments geometry={BRACES} material={EDGE_STRUT} renderOrder={5} />
      <lineSegments geometry={SHELFS} material={SHELF_MAT} renderOrder={6} />

      {/* ── variant accents drawn behind the body ── */}
      {variant === 0 && (
        <group>
          <FacetPart shape={BACKPACK} zF={-0.012} zB={-0.085} front={DIM} back={DARK} edgeB />
          <mesh position={[0, 0.94, -0.02]} material={MAGENTA}>
            <circleGeometry args={[0.045, 20]} />
          </mesh>
        </group>
      )}

      {/* ── neck & rounded torso ── */}
      <FacetPart shape={NECK} zF={0.045} zB={-0.04} front={MAINS[1]} back={DARK} edgeF edgeB />
      <FacetPart shape={TORSO} zF={0.06} zB={-0.05} front={MAINS[0]} back={DARK} edgeF edgeB strut />
      <FacetPart shape={BELLY} zF={0.075} zB={-0.02} front={MAINS[2]} back={DIM} edgeF edgeB />
      <FacetPart shape={CHEST} zF={0.085} zB={-0.01} front={MAINS[1]} back={DIM} edgeF edgeB />

      {/* ── reactor core + FHC magenta insignia ── */}
      <FacetPart shape={CORE} zF={0.1} zB={0.02} front={acc.scan} edgeF={acc.edge} />
      <mesh ref={coreRef} position={[0, 0.96, 0.11]} material={acc.bright} renderOrder={8}>
        <circleGeometry args={[0.05, 24]} />
      </mesh>
      <mesh position={[0, 1.16, 0.02]} material={MAGENTA}>
        <planeGeometry args={[0.04, 0.026]} />
      </mesh>

      {/* ── arms (compact, rounded) ── */}
      {ARM.map((a) => (
        <group key={a.sx}>
          <FacetPart shape={a.shld} zF={0.02} zB={-0.045} front={MAINS[1]} back={DARK} edgeF />
          <FacetPart shape={a.uparm} zF={0.05} zB={-0.04} front={MAINS[0]} back={DARK} edgeF edgeB strut />
          <FacetPart shape={a.elbow} zF={0.062} zB={-0.02} front={acc.scan} edgeF={acc.edge} />
          <FacetPart shape={a.forearm} zF={0.05} zB={-0.04} front={MAINS[1]} back={DARK} edgeF edgeB strut />
          <FacetPart shape={a.hand} zF={0.056} zB={-0.03} front={MAINS[2]} back={DARK} edgeF edgeB />
          <mesh position={[a.sx * 0.40, 1.06, 0.03]} material={acc.bright}>
            <circleGeometry args={[0.035, 20]} />
          </mesh>
        </group>
      ))}

      {/* ── legs (rounded, chunky feet) ── */}
      {LEG.map((l) => (
        <group key={l.sx}>
          <FacetPart shape={l.thigh} zF={0.05} zB={-0.04} front={MAINS[0]} back={DARK} edgeF edgeB strut />
          <FacetPart shape={l.knee} zF={0.062} zB={-0.02} front={acc.scan} edgeF={acc.edge} />
          <FacetPart shape={l.shin} zF={0.05} zB={-0.04} front={MAINS[1]} back={DARK} edgeF edgeB strut />
          <FacetPart shape={l.foot} zF={0.052} zB={-0.03} front={MAINS[0]} back={DARK} edgeF edgeB strut />
          <FacetPart shape={l.sole} zF={0.058} zB={-0.02} front={acc.bright} />
        </group>
      ))}

      {/* ── rounded head ── */}
      <FacetPart shape={HEAD} zF={0.05} zB={-0.05} front={MAINS[0]} back={DARK} edgeF edgeB strut />
      <FacetPart shape={EAR_L} zF={0.058} zB={-0.02} front={MAINS[1]} back={DARK} edgeF />
      <FacetPart shape={EAR_R} zF={0.058} zB={-0.02} front={MAINS[1]} back={DARK} edgeF />

      {/* ── small antennae (always on) ── */}
      <FacetPart shape={ANT_L} zF={0.04} zB={-0.02} front={MAINS[1]} back={DARK} edgeF />
      <FacetPart shape={ANT_R} zF={0.04} zB={-0.02} front={MAINS[1]} back={DARK} edgeF />
      <FacetPart shape={ANT_TIP_L} zF={0.055} front={acc.bright} />
      <FacetPart shape={ANT_TIP_R} zF={0.055} front={acc.bright} />

      {/* ── dark visor face + glowing eyes + smile ── */}
      <FacetPart shape={VISOR} zF={0.082} front={VISOR_MAT} edgeF={acc.edge} />
      <mesh position={[-0.13, 1.55, 0.088]} material={acc.halo}>
        <circleGeometry args={[0.07, 20]} />
      </mesh>
      <mesh position={[0.13, 1.55, 0.088]} material={acc.halo}>
        <circleGeometry args={[0.07, 20]} />
      </mesh>
      <mesh position={[-0.13, 1.55, 0.09]} material={acc.bright}>
        <circleGeometry args={[0.045, 20]} />
      </mesh>
      <mesh position={[0.13, 1.55, 0.09]} material={acc.bright}>
        <circleGeometry args={[0.045, 20]} />
      </mesh>
      <mesh position={[-0.115, 1.565, 0.1]} material={HIGHLIGHT}>
        <circleGeometry args={[0.012, 12]} />
      </mesh>
      <mesh position={[0.115, 1.565, 0.1]} material={HIGHLIGHT}>
        <circleGeometry args={[0.012, 12]} />
      </mesh>
      <lineSegments geometry={MOUTH} material={acc.edge} />

      {/* ── variant accents on / near the head ── */}
      {variant === 1 && (
        <group>
          <FacetPart shape={ANT_MID} zF={0.05} zB={-0.02} front={MAINS[1]} back={DARK} edgeF />
          <FacetPart shape={ANT_ORB} zF={0.062} front={acc.bright} />
          <mesh position={[0, 2.3, 0.07]} material={acc.bright}>
            <circleGeometry args={[0.02, 16]} />
          </mesh>
        </group>
      )}
      {variant === 2 && (
        <group>
          <FacetPart shape={FIN_L} zF={0.06} zB={-0.02} front={MAINS[1]} back={DARK} edgeF />
          <FacetPart shape={FIN_R} zF={0.06} zB={-0.02} front={MAINS[1]} back={DARK} edgeF />
          <mesh position={[-0.48, 1.72, 0.07]} material={acc.bright}>
            <circleGeometry args={[0.02, 16]} />
          </mesh>
          <mesh position={[0.48, 1.72, 0.07]} material={acc.bright}>
            <circleGeometry args={[0.02, 16]} />
          </mesh>
        </group>
      )}

      {/* ── hologram glitch slivers ── */}
      <FacetPart pts={GLITCH_1} zF={0.06} front={HIGHLIGHT} rot={0.2} />
      <FacetPart pts={GLITCH_2} zF={0.06} front={HIGHLIGHT} rot={-0.25} />

      {/* ── floating shards + floor projection ── */}
      <HoloFragments time={time} />
      <ProjectionFloor time={time} />
    </group>
  );
}

/* ── soft additive halo behind the hologram (static, out of the
      camera-fit group so it never inflates the framing) ── */
function BackGlow() {
  return (
    <mesh position={[0, 0.28, -0.6]} renderOrder={0}>
      <planeGeometry args={[1.7, 2.3]} />
      <meshBasicMaterial
        map={GLOW_TEX} transparent depthWrite={false} toneMapped={false}
        blending={THREE.AdditiveBlending} renderOrder={0}
      />
    </mesh>
  );
}

/* ── tilted orbit rings framing the projection (hologram base) ── */
function OrbitalHoloRings() {
  const refs = useRef([]);
  const cfg = [
    { r: 0.92, tiltX: 1.15, tiltZ: 0.12, o: 0.16 },
    { r: 1.02, tiltX: -1.25, tiltZ: 0.9, o: 0.1 },
    { r: 1.12, tiltX: 0.5, tiltZ: 1.45, o: 0.06 },
  ];
  useFrame((_, dt) => {
    refs.current.forEach((g, i) => {
      if (g) g.rotation.z += dt * (0.05 + i * 0.02) * (i % 2 === 0 ? 1 : -1);
    });
  });
  return (
    <group position={[0, 0.32, 0]}>
      {cfg.map((c, i) => (
        <group key={i} ref={(el) => (refs.current[i] = el)} rotation={[c.tiltX, 0, c.tiltZ]}>
          <mesh>
            <torusGeometry args={[c.r, 0.0035, 8, 120]} />
            <meshBasicMaterial
              color="#1ED7E8" transparent opacity={c.o} depthWrite={false}
              blending={THREE.AdditiveBlending} renderOrder={0} toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function GroundShadow() {
  return (
    <mesh position={[0, -0.67, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.36, 32]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.3} depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function PlatformRing() {
  return (
    <group position={[0, -0.66, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.42, 48]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.15} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.52, 0.53, 48]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.06} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function PlayerAvatar3D({ variant = 0, accent = "cyan", resetKey = 0 }) {
  const controlsRef = useRef();
  const mascotGroupRef = useRef(null);
  const time = useRef(0);
  const cameraDataRef = useRef({ center: new THREE.Vector3(0, 0.1, 0), distance: 2.4 });
  const resetRef = useRef(null);

  useFrame((_, dt) => {
    time.current += dt;
    SCAN_TIME.value = time.current;
  });

  useEffect(() => {
    const group = mascotGroupRef.current;
    if (!group) return;
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = (maxDim / 2) / Math.tan((34 * Math.PI / 180) / 2) * 1.08;
    const hOffset = -0.10;
    cameraDataRef.current = { center, distance: dist, hOffset };
    if (controlsRef.current) {
      controlsRef.current.target.set(center.x + hOffset, center.y, center.z);
      controlsRef.current.object.position.set(center.x + hOffset, center.y + 0.15, center.z + dist);
      controlsRef.current.update();
    }
  }, [variant]);

  const resetCamera = useCallback(() => {
    if (!controlsRef.current) return;
    const c = controlsRef.current;
    const { center, distance, hOffset = 0 } = cameraDataRef.current;
    const startPos = c.object.position.clone();
    const startTarget = c.target.clone();
    const endPos = new THREE.Vector3(center.x + hOffset, center.y + 0.15, center.z + distance);
    const endTarget = new THREE.Vector3(center.x + hOffset, center.y, center.z);
    let progress = 0;
    if (resetRef.current) cancelAnimationFrame(resetRef.current);
    const animate = () => {
      progress = Math.min(progress + 0.04, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      c.object.position.lerpVectors(startPos, endPos, ease);
      c.target.lerpVectors(startTarget, endTarget, ease);
      c.update();
      if (progress < 1) resetRef.current = requestAnimationFrame(animate);
    };
    resetRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (resetKey > 0) resetCamera();
  }, [resetKey, resetCamera]);

  useEffect(() => {
    return () => { if (resetRef.current) cancelAnimationFrame(resetRef.current); };
  }, []);

  useEffect(() => {
    const canvas = document.querySelector(".fhc-mascot-canvas canvas");
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (w > 0 && h > 0) {
        canvas.style.width = w + "px";
        canvas.style.height = h + "px";
      }
    });
    ro.observe(parent);
    return () => ro.disconnect();
  }, []);

  return (
    <group className="fhc-mascot-canvas">
      <ambientLight intensity={0.7} />
      <directionalLight position={[3, 5, 4]} intensity={1.0} color="#f0f0ff" />
      <directionalLight position={[-3, 3, -2]} intensity={0.5} color="#c0c8e0" />
      <directionalLight position={[0, -1, 4]} intensity={0.25} color="#ffffff" />
      <pointLight position={[-2.5, 1.5, 2.5]} intensity={0.6} color="#00E5FF" distance={7} />
      <pointLight position={[2.5, 1.0, -1.5]} intensity={0.4} color="#FF007F" distance={7} />
      <pointLight position={[0, -1, 3]} intensity={0.15} color="#ffffff" distance={5} />
      <hemisphereLight skyColor="#1e2848" groundColor="#0a0a14" intensity={0.35} />

      <group ref={mascotGroupRef}>
        <HoloRobot variant={variant} accent={accent} time={time} />
        <BackReticle />
      </group>
      <BackGlow />
      <GroundShadow />
      <PlatformRing />
      <OrbitalHoloRings />

      <OrbitControls
        ref={controlsRef}
        enableZoom={true}
        minDistance={1.2}
        maxDistance={5.0}
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 1.4}
        rotateSpeed={0.5}
        dampingFactor={0.08}
        enableDamping
        makeDefault
      />
    </group>
  );
}