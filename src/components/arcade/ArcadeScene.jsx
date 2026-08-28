import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PINK = new THREE.Color("#FF1687");
const CYAN = new THREE.Color("#1ED7E8");
const GREEN = new THREE.Color("#36D65A");

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ═══════════════════════════════════════════════
   GRID — perspective floor with GLSL shader
   ═══════════════════════════════════════════════ */
function Grid({ scroll }) {
  const ref = useRef();
  const u = useMemo(() => ({
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uColor: { value: CYAN.clone() },
  }), []);

  useFrame((st) => {
    if (!ref.current) return;
    ref.current.uniforms.uTime.value = st.clock.elapsedTime;
    ref.current.uniforms.uScroll.value = scroll.current;
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
      <planeGeometry args={[120, 120, 1, 1]} />
      <shaderMaterial
        ref={ref}
        uniforms={u}
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
          uniform float uScroll;
          uniform vec3 uColor;
          varying vec2 vUv;
          varying float vDist;
          void main(){
            vec2 g = abs(fract(vUv*50.0-0.5)-0.5)/fwidth(vUv*50.0);
            float line = min(g.x,g.y);
            float ga = 1.0-min(line,1.0);
            float fade = exp(-vDist*0.035);
            float sc = uScroll*0.0004;
            float pulse = 0.65+0.35*sin(uTime*0.25+vDist*0.04+sc);
            float a = ga*fade*pulse*0.15;
            float sweep = smoothstep(0.0,10.0,abs(vUv.x-0.5)*50.0);
            a *= mix(0.2,1.0,sweep);
            gl_FragColor = vec4(uColor,a);
          }`}
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   PARTICLES — instanced floating pixel dust
   ═══════════════════════════════════════════════ */
function Particles({ count = 80, scroll }) {
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const p = useMemo(() => {
    const r = seededRandom(77);
    return Array.from({ length: count }, () => ({
      x: (r() - 0.5) * 50,
      y: r() * 20 - 3,
      z: -r() * 40 - 5,
      s: r() * 0.035 + 0.01,
      sp: r() * 0.3 + 0.08,
      o: r() * 6.28,
      pk: r() > 0.7,
    }));
  }, [count]);

  useFrame((st) => {
    if (!ref.current) return;
    const t = st.clock.elapsedTime;
    const sy = scroll.current * 0.0008;
    for (let i = 0; i < count; i++) {
      const q = p[i];
      dummy.position.set(
        q.x,
        q.y + Math.sin(t * q.sp + q.o) * 0.35 - sy * 0.15,
        q.z
      );
      dummy.scale.setScalar(q.s * (0.8 + 0.2 * Math.sin(t * 0.4 + q.o)));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  const colors = useMemo(() => {
    const c = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const col = p[i].pk ? PINK : CYAN;
      c[i * 3] = col.r;
      c[i * 3 + 1] = col.g;
      c[i * 3 + 2] = col.b;
    }
    return c;
  }, [count, p]);

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial transparent opacity={0.55} vertexColors>
        <instancedBufferAttribute attach="geometry-attributes-color" args={[colors, 3]} />
      </meshBasicMaterial>
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════
   WIREFRAME OBJECTS — layered at different depths
   ═══════════════════════════════════════════════ */
function Wireframes() {
  const g = useRef();

  const d = useMemo(() => [
    { p: [-9, 3.5, -14], g: "b", s: [1.3], c: PINK, v: 0.18 },
    { p: [11, 5.5, -18], g: "o", s: [1.0], c: CYAN, v: 0.13 },
    { p: [-14, 7, -22], g: "b", s: [0.9], c: CYAN, v: 0.22 },
    { p: [7, 2.5, -10], g: "o", s: [0.7], c: PINK, v: 0.16 },
    { p: [-5, 9, -26], g: "b", s: [1.6], c: GREEN, v: 0.10 },
    { p: [16, 4.5, -28], g: "o", s: [1.2], c: PINK, v: 0.20 },
    { p: [-18, 6, -12], g: "b", s: [0.8], c: CYAN, v: 0.28 },
    { p: [4, 10, -30], g: "o", s: [0.6], c: GREEN, v: 0.15 },
    { p: [0, 8, -35], g: "b", s: [2.0], c: CYAN, v: 0.08 },
    { p: [-8, 4, -8], g: "o", s: [0.5], c: PINK, v: 0.25 },
  ], []);

  useFrame((st) => {
    if (!g.current) return;
    const t = st.clock.elapsedTime;
    g.current.children.forEach((ch, i) => {
      const o = d[i];
      ch.rotation.x = t * o.v * 0.3;
      ch.rotation.y = t * o.v * 0.5;
      ch.position.y = o.p[1] + Math.sin(t * o.v + i) * 0.4;
    });
  });

  return (
    <group ref={g}>
      {d.map((o, i) => (
        <mesh key={i} position={o.p}>
          {o.g === "b"
            ? <boxGeometry args={o.s} />
            : <octahedronGeometry args={[o.s[0]]} />}
          <meshBasicMaterial color={o.c} wireframe transparent opacity={0.1} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   GLOW NODES — distant neon markers
   ═══════════════════════════════════════════════ */
function GlowNodes() {
  const g = useRef();

  const d = useMemo(() => [
    { p: [-7, 1.5, -16], c: PINK, s: 0.09 },
    { p: [9, 3.5, -20], c: CYAN, s: 0.07 },
    { p: [-12, 5.5, -24], c: GREEN, s: 0.06 },
    { p: [14, 2, -14], c: PINK, s: 0.08 },
    { p: [1, 6.5, -28], c: CYAN, s: 0.05 },
    { p: [-16, 4, -20], c: PINK, s: 0.07 },
    { p: [6, 8, -32], c: GREEN, s: 0.06 },
  ], []);

  useFrame((st) => {
    if (!g.current) return;
    const t = st.clock.elapsedTime;
    g.current.children.forEach((ch, i) => {
      ch.material.opacity = 0.25 + 0.2 * Math.sin(t * 0.7 + i * 1.4);
      ch.scale.setScalar(d[i].s * (1 + 0.12 * Math.sin(t * 0.5 + i)));
    });
  });

  return (
    <group ref={g}>
      {d.map((n, i) => (
        <mesh key={i} position={n.p}>
          <sphereGeometry args={[1, 6, 6]} />
          <meshBasicMaterial color={n.c} transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
}

/* ═══════════════════════════════════════════════
   CAMERA RIG — scroll + mouse parallax
   ═══════════════════════════════════════════════ */
function CameraRig({ mouse, scroll }) {
  const { camera } = useThree();
  const tPos = useRef(new THREE.Vector3(0, 2.5, 10));
  const tLook = useRef(new THREE.Vector3(0, 1, 0));

  useFrame(() => {
    const mx = mouse.current.x;
    const my = mouse.current.y;
    const sy = scroll.current;

    const progress = Math.min(sy / 6000, 1);

    tPos.current.set(
      mx * 0.6,
      2.5 - progress * 3.5 + my * 0.3,
      10 - progress * 3
    );
    tLook.current.set(
      mx * 0.15,
      1 - progress * 1.5,
      -8
    );

    camera.position.lerp(tPos.current, 0.035);
    camera.lookAt(
      camera.position.x + (tLook.current.x - camera.position.x) * 0.02,
      camera.position.y + (tLook.current.y - camera.position.y) * 0.02 - 1.5,
      tLook.current.z
    );
  });

  return null;
}

/* ═══════════════════════════════════════════════
   SCENE COMPOSITION
   ═══════════════════════════════════════════════ */
function World({ mouse, scroll }) {
  return (
    <>
      <color attach="background" args={["#050810"]} />
      <fog attach="fog" args={["#050810", 10, 42]} />
      <ambientLight intensity={0.08} />
      <pointLight position={[0, 6, 0]} intensity={0.25} color="#FF1687" />
      <pointLight position={[-6, 4, -8]} intensity={0.18} color="#1ED7E8" />
      <CameraRig mouse={mouse} scroll={scroll} />
      <Grid scroll={scroll} />
      <Particles count={80} scroll={scroll} />
      <Wireframes />
      <GlowNodes />
    </>
  );
}

/* ═══════════════════════════════════════════════
   EXPORTED CANVAS
   ═══════════════════════════════════════════════ */
export default function ArcadeScene({ mouse, scroll }) {
  return (
    <div
      className="arcade-canvas-wrap"
      style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
    >
      <Canvas
        camera={{ position: [0, 2.5, 10], fov: 55, near: 0.1, far: 60 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 1.5) : 1}
        frameloop="always"
        style={{ background: "#050810" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
        }}
      >
        <World mouse={mouse} scroll={scroll} />
      </Canvas>
    </div>
  );
}
