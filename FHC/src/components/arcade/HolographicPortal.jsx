import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

const CYAN = new THREE.Color("#00E5FF");
const PINK = new THREE.Color("#FF007F");

const graphite = new THREE.MeshStandardMaterial({
  color: "#14171d",
  roughness: 0.35,
  metalness: 0.8,
  transparent: true,
  opacity: 0.82,
  depthWrite: false,
});
const silverTrim = new THREE.MeshStandardMaterial({
  color: "#8b9099",
  roughness: 0.3,
  metalness: 0.85,
});
const coreMat = new THREE.MeshStandardMaterial({
  color: "#eafcff",
  emissive: CYAN,
  emissiveIntensity: 1.6,
  roughness: 0.2,
  metalness: 0.2,
});
const cyanLine = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.75 });
const cyanLineSoft = new THREE.MeshBasicMaterial({ color: CYAN, transparent: true, opacity: 0.32 });
const pinkDot = new THREE.MeshBasicMaterial({ color: PINK, transparent: true, opacity: 0.6 });

function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ═══════════════════════════════════════════════
   HORIZON CORE — the central FHC technological artifact
   A faceted graphite housing containing a contained
   cyan reactor essence, bound by a luminous containment band.
   ═══════════════════════════════════════════════ */
function HorizonCore({ spinRef }) {
  const housingRef = useRef();
  const essenceRef = useRef();
  const bandRef = useRef();
  const innerRef = useRef();

  useFrame(() => {
    // Slow, weighty axial rotation of the artifact
    if (housingRef.current) housingRef.current.rotation.y += 0.0022;
    // Inner crystal counter-spin
    if (innerRef.current) innerRef.current.rotation.y -= 0.004;
    // Gentle energy surge
    if (essenceRef.current) essenceRef.current.material.emissiveIntensity = 1.7 + Math.sin(spinRef.current * 1.6) * 0.55;
    if (bandRef.current) bandRef.current.material.opacity = 0.68 + Math.sin(spinRef.current * 2.2 + 1) * 0.2;
  });

  return (
    <group ref={housingRef} rotation={[0.25, 0, 0.08]}>
      {/* Faceted graphite housing — outer shell */}
      <mesh material={graphite}>
        <icosahedronGeometry args={[0.34, 0]} />
      </mesh>

      {/* Contained cyan reactor essence — glows through shell */}
      <mesh ref={essenceRef} material={coreMat} scale={0.56}>
        <octahedronGeometry args={[0.34, 0]} />
      </mesh>
      {/* delicate inner lattice frame */}
      <mesh ref={innerRef} material={silverTrim} scale={0.66}>
        <icosahedronGeometry args={[0.34, 0]} />
      </mesh>

      {/* Luminous containment band wrapped around the core */}
      <mesh ref={bandRef} rotation={[Math.PI / 2.4, 0.35, 0]}>
        <torusGeometry args={[0.39, 0.012, 12, 48]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.5} />
      </mesh>
      {/* Second faint band */}
      <mesh rotation={[Math.PI / 1.9, -0.5, 0.2]}>
        <torusGeometry args={[0.44, 0.006, 10, 48]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.28} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════
   ORBIT ASSEMBLY — engineered precision ring structures
   carrying tiny data-node markers.
   ═══════════════════════════════════════════════ */
function OrbitAssembly({ spinRef }) {
  const g1 = useRef();
  const g2 = useRef();
  const g3 = useRef();
  const node1 = useRef();
  const node2 = useRef();
  const node3 = useRef();

  useFrame(() => {
    const t = spinRef.current;
    if (g1.current) g1.current.rotation.z = -t * 0.16;
    if (g2.current) g2.current.rotation.z = t * 0.11;
    if (g3.current) g3.current.rotation.z = -t * 0.07;
    const a1 = t * 0.6, a2 = t * 0.45 + 1.7, a3 = t * 0.35 + 3.1;
    if (node1.current) node1.current.position.set(Math.cos(a1) * 0.52, Math.sin(a1) * 0.52, 0);
    if (node2.current) node2.current.position.set(Math.cos(a2) * 0.66, Math.sin(a2) * 0.66, 0);
    if (node3.current) node3.current.position.set(Math.cos(a3) * 0.78, Math.sin(a3) * 0.78, 0);
  });

  return (
    <>
      {/* Ring 1 — graphite structural + cyan tracer */}
      <group ref={g1} rotation={[Math.PI / 2.3, 0.35, 0]}>
        <mesh material={silverTrim}><torusGeometry args={[0.52, 0.008, 8, 80]} /></mesh>
        <group ref={node1}><mesh material={cyanLine}><sphereGeometry args={[0.016, 8, 6]} /></mesh></group>
      </group>

      {/* Ring 2 — wider, faint, magenta data marker */}
      <group ref={g2} rotation={[Math.PI / 1.7, -0.42, 0]}>
        <mesh material={cyanLineSoft}><torusGeometry args={[0.66, 0.005, 6, 72]} /></mesh>
        <group ref={node2}><mesh material={pinkDot}><sphereGeometry args={[0.02, 8, 6]} /></mesh></group>
      </group>

      {/* Ring 3 — outermost structural ring */}
      <group ref={g3} rotation={[Math.PI / 2, 0.15, 0.6]}>
        <mesh material={graphite}><torusGeometry args={[0.78, 0.012, 8, 96]} /></mesh>
        <mesh material={cyanLineSoft} scale={1.02}><torusGeometry args={[0.78, 0.004, 6, 96]} /></mesh>
        <group ref={node3}><mesh material={cyanLine}><sphereGeometry args={[0.018, 8, 6]} /></mesh></group>
      </group>
    </>
  );
}

/* ═══════════════════════════════════════════════
   FINE HOLOGRAPHIC LATTICE — faint containment shell
   Crafted as fine engineering detail, not a planet mesh.
   ═══════════════════════════════════════════════ */
function HoloLattice({ spinRef }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y = spinRef.current * 0.05;
      ref.current.rotation.z = Math.sin(spinRef.current * 0.15) * 0.12;
      ref.current.material.opacity = 0.09 + Math.sin(spinRef.current * 0.8) * 0.03;
    }
  });
  return (
    <mesh ref={ref} scale={1.05}>
      <icosahedronGeometry args={[0.5, 1]} />
      <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.09} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   DATA NODES — sparse drifting markers pulled toward core
   ═══════════════════════════════════════════════ */
function DataNodes({ spinRef }) {
  const count = 26;
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const r = seededRandom(31);
    const a = [];
    for (let i = 0; i < count; i++) {
      const ang = (i / count) * Math.PI * 2;
      const rad = 0.55 + r() * 0.5;
      a.push({
        baseX: Math.cos(ang) * rad,
        baseY: Math.sin(ang) * rad,
        baseZ: (r() - 0.5) * 0.35,
        sp: 0.18 + r() * 0.3,
        off: r() * 6.28,
        sc: 0.006 + r() * 0.006,
      });
    }
    return a;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const t = spinRef.current;
    for (let i = 0; i < count; i++) {
      const p = data[i];
      const angle = t * p.sp + p.off;
      const pull = 0.92 + Math.sin(t * 0.4 + p.off) * 0.06;
      dummy.position.set(
        p.baseX * pull + Math.sin(angle) * 0.03,
        p.baseY * pull + Math.cos(angle) * 0.03,
        p.baseZ + Math.sin(t * 0.25 + p.off) * 0.06
      );
      dummy.scale.setScalar(p.sc * (0.7 + Math.sin(t + p.off) * 0.3));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.35} />
    </instancedMesh>
  );
}

/* ═══════════════════════════════════════════════
   ENERGY BEAM — fine vertical containment emission
   ═══════════════════════════════════════════════ */
function EnergyBeam({ spinRef }) {
  const ref = useRef();
  useFrame(() => {
    if (ref.current) {
      ref.current.material.opacity = 0.05 + Math.sin(spinRef.current * 1.4) * 0.03;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} rotation={[0.2, 0, 0]}>
      <cylinderGeometry args={[0.004, 0.004, 2.6, 8]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.05} />
    </mesh>
  );
}

/* ═══════════════════════════════════════════════
   SCENE — FHC HORIZON CORE
   ═══════════════════════════════════════════════ */
function PortalScene({ timeRef }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[2, 3, 4]} intensity={1.1} color="#eaf2ff" />
      <directionalLight position={[-3, 1, -2]} intensity={0.4} color="#27303f" />
      <pointLight position={[0, 2, 3]} intensity={0.5} color="#00E5FF" distance={6} />
      <pointLight position={[2, -1, 2]} intensity={0.3} color="#FF007F" distance={5} />
      <pointLight position={[-2, 1, 2]} intensity={0.2} color="#00E5FF" distance={4} />

      <group rotation={[0.15, 0, 0]}>
        <HorizonCore spinRef={timeRef} />
        <OrbitAssembly spinRef={timeRef} />
        <HoloLattice spinRef={timeRef} />
        <EnergyBeam spinRef={timeRef} />
      </group>
      <DataNodes spinRef={timeRef} />
    </>
  );
}

/* ═══════════════════════════════════════════════
   EXPORTED
   ═══════════════════════════════════════════════ */
export default function HolographicPortal() {
  const timeRef = useRef(0);

  return (
    <div className="relative" style={{ width: "100%", height: 220, overflow: "hidden", clipPath: "ellipse(46% 40% at 50% 50%)" }}>
      <Canvas
        camera={{ position: [0, 0, 2.8], fov: 40, near: 0.1, far: 20 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", stencil: false }}
        dpr={typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1}
        style={{ background: "transparent" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.2;
        }}
      >
        <PortalSceneWrapper timeRef={timeRef} />
      </Canvas>

      {/* HUD overlay labels */}
      <div className="absolute inset-0 pointer-events-none">
        <span className="absolute font-pixel" style={{ top: 8, left: 12, fontSize: 5, color: "#00E5FF", opacity: 0.25, letterSpacing: "0.15em" }}>
          PLAYER ENTRY
        </span>
        <span className="absolute font-pixel" style={{ bottom: 8, right: 12, fontSize: 5, color: "#FF007F", opacity: 0.2, letterSpacing: "0.15em" }}>
          HORIZON CORE
        </span>
        {/* Targeting brackets */}
        <div className="absolute" style={{ top: 20, left: 20, width: 12, height: 12, borderTop: "1px solid rgba(0,229,255,0.2)", borderLeft: "1px solid rgba(0,229,255,0.2)" }} />
        <div className="absolute" style={{ top: 20, right: 20, width: 12, height: 12, borderTop: "1px solid rgba(255,0,127,0.2)", borderRight: "1px solid rgba(255,0,127,0.2)" }} />
        <div className="absolute" style={{ bottom: 20, left: 20, width: 12, height: 12, borderBottom: "1px solid rgba(255,0,127,0.2)", borderLeft: "1px solid rgba(255,0,127,0.2)" }} />
        <div className="absolute" style={{ bottom: 20, right: 20, width: 12, height: 12, borderBottom: "1px solid rgba(0,229,255,0.2)", borderRight: "1px solid rgba(255,0,127,0.2)" }} />
      </div>
    </div>
  );
}

/* Wrapper to use useFrame inside Canvas */
function PortalSceneWrapper({ timeRef }) {
  useFrame((_, dt) => { timeRef.current += dt; });
  return <PortalScene timeRef={timeRef} />;
}
