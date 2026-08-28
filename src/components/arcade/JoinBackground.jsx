import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PINK = new THREE.Color("#FF007F");
const CYAN = new THREE.Color("#00E5FF");
const GREEN = new THREE.Color("#39FF88");

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ═══════════════════════════════════════════════
   PERSPECTIVE GRID FLOOR
   ═══════════════════════════════════════════════ */
function PerspectiveGrid() {
  const ref = useRef();
  useFrame((st) => {
    if (ref.current) {
      ref.current.uniforms.uTime.value = st.clock.elapsedTime;
    }
  });

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
  }), []);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]}>
      <planeGeometry args={[120, 120, 1, 1]} />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying float vDist;
          void main(){
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position,1.0);
            vDist = length(wp.xz);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }`}
        fragmentShader={`
          uniform float uTime;
          varying vec2 vUv;
          varying float vDist;
          void main(){
            vec2 g = abs(fract(vUv*60.0-0.5)-0.5)/fwidth(vUv*60.0);
            float line = min(g.x,g.y);
            float ga = 1.0-min(line,1.0);
            float fade = exp(-vDist*0.028);
            float pulse = 0.55+0.45*sin(uTime*0.2+vDist*0.03);
            float a = ga*fade*pulse*0.12;
            gl_FragColor = vec4(0.0, 0.9, 1.0, a);
          }`}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   FLOATING PARTICLES
   ═══════════════════════════════════════════════ */
function FloatingParticles({ count = 100 }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const p = useMemo(() => {
    const r = seededRandom(42);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 60,
      y: r() * 25 - 4,
      z: -r() * 50 - 5,
      s: r() * 0.04 + 0.008,
      sp: r() * 0.25 + 0.05,
      o: r() * 6.28,
      pk: r() > 0.75,
      gr: r() > 0.92,
    }));
  }, [count]);

  useFrame((st) => {
    if (!ref.current) return;
    const t = st.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const q = p[i];
      dummy.position.set(
        q.x + Math.sin(t * q.sp + q.o) * 0.15,
        q.y + Math.sin(t * q.sp * 0.6 + q.o) * 0.25,
        q.z
      );
      dummy.scale.setScalar(q.s * (0.7 + 0.3 * Math.sin(t * 0.3 + q.o)));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const col = p[i].gr ? GREEN : p[i].pk ? PINK : CYAN;
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;
    }
    return c;
  }, [count, p]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.45} vertexColors>
        <instancedBufferAttribute attach="geometry-attributes-color" args={[colors, 3]} />
      </meshBasicMaterial>
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════
   WIREFRAME OBJECTS — cubes, octahedrons, etc.
   ═══════════════════════════════════════════════ */
function WireframeObjects() {
  const g = useRef();

  const d = useMemo(() => [
    { p: [-10, 4, -16], g: "b", s: [1.2], c: PINK, v: 0.15 },
    { p: [12, 6, -20], g: "o", s: [0.9], c: CYAN, v: 0.11 },
    { p: [-15, 8, -24], g: "b", s: [0.8], c: CYAN, v: 0.18 },
    { p: [8, 3, -12], g: "o", s: [0.6], c: PINK, v: 0.13 },
    { p: [-6, 10, -28], g: "b", s: [1.5], c: GREEN, v: 0.08 },
    { p: [18, 5, -30], g: "o", s: [1.1], c: PINK, v: 0.16 },
    { p: [-20, 7, -14], g: "b", s: [0.7], c: CYAN, v: 0.22 },
    { p: [5, 11, -32], g: "o", s: [0.5], c: GREEN, v: 0.12 },
    { p: [0, 9, -38], g: "b", s: [1.8], c: CYAN, v: 0.06 },
    { p: [-9, 5, -10], g: "o", s: [0.4], c: PINK, v: 0.2 },
    { p: [14, 12, -26], g: "b", s: [0.6], c: CYAN, v: 0.14 },
    { p: [-12, 2, -18], g: "o", s: [0.7], c: PINK, v: 0.17 },
  ], []);

  useFrame((st) => {
    if (!g.current) return;
    const t = st.clock.elapsedTime;
    g.current.children.forEach((ch, i) => {
      const o = d[i];
      ch.rotation.x = t * o.v * 0.3;
      ch.rotation.y = t * o.v * 0.5;
      ch.position.y = o.p[1] + Math.sin(t * o.v + i) * 0.35;
    });
  });

  return (
    <group ref={g}>
      {d.map((o, i) => (
        <mesh key={i} position={o.p}>
          {o.g === "b"
            ? <boxGeometry args={o.s} />
            : <octahedronGeometry args={[o.s[0]]} />}
          <meshBasicMaterial color={o.c} wireframe transparent opacity={0.08} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   GLOW MARKERS — distant neon dots
   ═══════════════════════════════════════════════ */
function GlowMarkers() {
  const g = useRef();

  const d = useMemo(() => [
    { p: [-8, 2, -18], c: PINK, s: 0.08 },
    { p: [10, 4, -22], c: CYAN, s: 0.06 },
    { p: [-14, 6, -26], c: GREEN, s: 0.05 },
    { p: [16, 2.5, -16], c: PINK, s: 0.07 },
    { p: [2, 7, -30], c: CYAN, s: 0.04 },
    { p: [-18, 4.5, -22], c: PINK, s: 0.06 },
    { p: [7, 9, -34], c: GREEN, s: 0.05 },
    { p: [-4, 1, -14], c: CYAN, s: 0.04 },
    { p: [20, 3, -28], c: PINK, s: 0.05 },
  ], []);

  useFrame((st) => {
    if (!g.current) return;
    const t = st.clock.elapsedTime;
    g.current.children.forEach((ch, i) => {
      ch.material.opacity = 0.2 + 0.15 * Math.sin(t * 0.6 + i * 1.3);
      ch.scale.setScalar(d[i].s * (1 + 0.1 * Math.sin(t * 0.4 + i)));
    });
  });

  return (
    <group ref={g}>
      {d.map((n, i) => (
        <mesh key={i} position={n.p}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={n.c} transparent opacity={0.2} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   ORBITAL RINGS — faint rotating rings
   ═══════════════════════════════════════════════ */
function OrbitalRings() {
  const r1 = useRef();
  const r2 = useRef();
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (r1.current) r1.current.rotation.z = t * 0.04;
    if (r2.current) r2.current.rotation.z = -t * 0.03;
  });
  return (
    <>
      <mesh ref={r1} position={[0, 2, -10]} rotation={[1.2, 0.3, 0]}>
        <torusGeometry args={[6, 0.005, 8, 80]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.04} />
      </mesh>
      <mesh ref={r2} position={[0, 4, -20]} rotation={[0.8, -0.2, 0]}>
        <torusGeometry args={[8, 0.004, 8, 80]} />
        <meshBasicMaterial color={PINK} transparent opacity={0.03} />
      </mesh>
    </>
  );
}

/* ═══════════════════════════════════════════════
   HORIZON LINE — faint glow at the horizon
   ═══════════════════════════════════════════════ */
function HorizonGlow() {
  return (
    <mesh position={[0, -1.5, -30]} rotation={[0, 0, 0]}>
      <planeGeometry args={[120, 3]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.015} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   CAMERA RIG — subtle mouse parallax
   ═══════════════════════════════════════════════ */
function CameraRig({ mouseRef }) {
  const { camera } = useThree();
  const tPos = useRef(new THREE.Vector3(0, 3, 12));

  useFrame(() => {
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    tPos.current.set(mx * 0.4, 3 + my * 0.2, 12);
    camera.position.lerp(tPos.current, 0.02);
    camera.lookAt(0, 1, -5);
  });

  return null;
}

/* ═══════════════════════════════════════════════
   SCENE COMPOSITION
   ═══════════════════════════════════════════════ */
function World({ mouseRef }) {
  return (
    <>
      <color attach="background" args={["#02050A"]} />
      <fog attach="fog" args={["#02050A", 12, 48]} />
      <ambientLight intensity={0.05} />
      <pointLight position={[0, 8, 0]} intensity={0.15} color="#FF007F" />
      <pointLight position={[-8, 5, -10]} intensity={0.1} color="#00E5FF" />
      <CameraRig mouseRef={mouseRef} />
      <PerspectiveGrid />
      <FloatingParticles count={100} />
      <WireframeObjects />
      <GlowMarkers />
      <OrbitalRings />
      <HorizonGlow />
    </>
  );
}

/* ═══════════════════════════════════════════════
   EXPORTED CANVAS
   ═══════════════════════════════════════════════ */
export default function JoinBackground() {
  const mouseRef = useRef({ x: 0, y: 0 });
  const [prefersReduced, setPrefersReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;
    const handleMouse = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouse, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouse);
  }, [prefersReduced]);

  if (prefersReduced) {
    return (
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{ background: "#02050A" }}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: "#02050A" }}
    >
      <Canvas
        camera={{ position: [0, 3, 12], fov: 50, near: 0.1, far: 60 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1}
        frameloop="always"
        style={{ background: "#02050A" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <World mouseRef={mouseRef} />
      </Canvas>
    </div>
  );
}
