import { useRef, useMemo, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const CYAN  = new THREE.Color("#1ED7E8");
const PINK  = new THREE.Color("#FF1687");
const DARK  = new THREE.Color("#1a1e2c");
const SHELL = new THREE.Color("#dce1ec");

function latLongToVec3(lat, lon, r) {
  const phi   = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

/* ── Globe base sphere ── */
function GlobeBase() {
  return (
    <mesh>
      <sphereGeometry args={[1, 64, 64]} />
      <meshStandardMaterial color="#060a14" transparent opacity={0.88} roughness={0.15} metalness={0.25} />
    </mesh>
  );
}

/* ── Wireframe grid overlay ── */
function GlobeGrid() {
  return (
    <mesh>
      <sphereGeometry args={[1.004, 40, 28]} />
      <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.06} />
    </mesh>
  );
}

/* ── Latitude rings ── */
function LatitudeRings({ time }) {
  const g = useRef();
  useFrame(() => { if (g.current) g.current.rotation.y = time.current * 0.015; });
  const lats = [0, 23.4, -23.4, 45, -45, 66.5, -66.5];
  return (
    <group ref={g}>
      {lats.map((lat, i) => {
        const cr = Math.cos(lat * Math.PI / 180);
        const y  = Math.sin(lat * Math.PI / 180);
        const R  = 1.008;
        return (
          <mesh key={i} position={[0, y * R, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[cr * R - 0.002, cr * R + 0.002, 80]} />
            <meshBasicMaterial color={CYAN} transparent opacity={lat === 0 ? 0.18 : 0.06} side={THREE.DoubleSide} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ── Continent land-mass dots ── */
function ContinentDots({ time }) {
  const ref = useRef();
  const data = useMemo(() => {
    const d = [];
    const push = (lat, lon, sz) => d.push({ lat, lon, sz: sz || 0.013 });

    // North America
    [[55,-110],[50,-100],[48,-90],[45,-80],[42,-75],[38,-95],[35,-100],[32,-105],[30,-100],[28,-96],[40,-120],[35,-115],[45,-115],[50,-125],[55,-100],[60,-95],[48,-68],[44,-65]].forEach(a => push(...a));

    // South America
    [[-5,-55],[-10,-50],[-15,-48],[-20,-43],[-25,-48],[-30,-52],[-35,-58],[-40,-62],[-8,-63],[-12,-68],[-18,-63],[-22,-42],[-28,-50],[-33,-55],[-38,-60],[-2,-60],[5,-68],[2,-72]].forEach(a => push(...a, 0.011));

    // Europe
    [[48,8],[50,12],[52,5],[55,10],[58,15],[50,0],[47,-3],[53,-6],[56,12],[51,25],[49,20],[46,15],[44,12],[42,18],[55,20],[58,25],[60,18],[57,8],[48,22]].forEach(a => push(...a, 0.009));

    // Africa
    [[10,20],[5,15],[0,18],[-5,22],[-10,28],[-15,32],[-20,28],[-25,23],[-30,20],[15,25],[20,18],[25,12],[30,8],[35,5],[8,30],[2,32],[-8,35],[-12,38],[-18,33],[-28,28]].forEach(a => push(...a, 0.011));

    // Asia
    [[35,70],[38,68],[42,75],[45,82],[48,90],[52,100],[55,108],[50,115],[45,120],[42,130],[38,128],[35,118],[30,110],[25,105],[20,100],[15,102],[10,98],[35,60],[40,52],[45,58],[50,68],[55,78],[30,78],[28,85],[22,88],[18,80],[8,80],[3,105]].forEach(a => push(...a, 0.011));

    // Australia
    [[-20,132],[-24,135],[-28,138],[-32,142],[-35,148],[-28,152],[-22,148],[-18,128],[-15,125],[-30,145],[-34,152],[-26,155],[-22,150],[-18,142]].forEach(a => push(...a, 0.009));

    return d;
  }, []);

  const N = data.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!ref.current) return;
    const t = time.current;
    for (let i = 0; i < N; i++) {
      const p = data[i];
      const v = latLongToVec3(p.lat, p.lon, 1.012);
      dummy.position.copy(v);
      dummy.lookAt(0, 0, 0);
      dummy.rotateY(Math.PI);
      const pulse = 0.85 + Math.sin(t * 1.2 + i * 0.4) * 0.15;
      dummy.scale.setScalar(p.sz * pulse);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.55} />
    </instancedMesh>
  );
}

/* ── Pulsing data nodes at major cities ── */
function DataNodes({ time }) {
  const ref = useRef();
  const nodes = useMemo(() => [
    { lat: 40.7,  lon: -74 },
    { lat: 51.5,  lon: -0.1 },
    { lat: 35.7,  lon: 139.7 },
    { lat: -33.9, lon: 151.2 },
    { lat: 1.3,   lon: 103.8 },
    { lat: 55.8,  lon: 37.6 },
    { lat: -23.5, lon: -46.6 },
    { lat: 28.6,  lon: 77.2 },
    { lat: 37.6,  lon: 127 },
    { lat: 48.9,  lon: 2.35 },
    { lat: 34.1,  lon: -118.2 },
    { lat: -1.3,  lon: 36.8 },
  ], []);

  const N = nodes.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!ref.current) return;
    const t = time.current;
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      const v = latLongToVec3(n.lat, n.lon, 1.018);
      dummy.position.copy(v);
      dummy.lookAt(0, 0, 0);
      const s = 0.018 + Math.sin(t * 2.5 + i * 1.1) * 0.006;
      dummy.scale.setScalar(s / 0.018);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <sphereGeometry args={[0.018, 8, 8]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.95} />
    </instancedMesh>
  );
}

/* ── Glowing halos around data nodes ── */
function NodeHalos({ time }) {
  const ref = useRef();
  const nodes = useMemo(() => [
    { lat: 40.7,  lon: -74 },
    { lat: 51.5,  lon: -0.1 },
    { lat: 35.7,  lon: 139.7 },
    { lat: -33.9, lon: 151.2 },
    { lat: 1.3,   lon: 103.8 },
    { lat: 28.6,  lon: 77.2 },
    { lat: 37.6,  lon: 127 },
    { lat: 34.1,  lon: -118.2 },
  ], []);

  const N = nodes.length;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!ref.current) return;
    const t = time.current;
    for (let i = 0; i < N; i++) {
      const n = nodes[i];
      const v = latLongToVec3(n.lat, n.lon, 1.02);
      dummy.position.copy(v);
      dummy.lookAt(0, 0, 0);
      const pulse = 0.7 + Math.sin(t * 1.8 + i * 0.9) * 0.3;
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, N]}>
      <sphereGeometry args={[0.04, 8, 8]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.08} />
    </instancedMesh>
  );
}

/* ── Connection arcs between cities ── */
function ConnectionArcs({ time }) {
  const g = useRef();
  const arcs = useMemo(() => {
    const pairs = [
      [[40.7,-74],[51.5,-0.1]],
      [[51.5,-0.1],[35.7,139.7]],
      [[35.7,139.7],[-33.9,151.2]],
      [[1.3,103.8],[28.6,77.2]],
      [[40.7,-74],[-23.5,-46.6]],
      [[51.5,-0.1],[55.8,37.6]],
      [[28.6,77.2],[37.6,127]],
      [[34.1,-118.2],[35.7,139.7]],
      [[1.3,103.8],[-1.3,36.8]],
      [[51.5,-0.1],[48.9,2.35]],
    ];
    const R = 1.02;
    return pairs.map(([a, b]) => {
      const s = latLongToVec3(a[0], a[1], R);
      const e = latLongToVec3(b[0], b[1], R);
      const mid = s.clone().add(e).multiplyScalar(0.5).normalize().multiplyScalar(1.18);
      const pts = new THREE.QuadraticBezierCurve3(s, mid, e).getPoints(40);
      return new THREE.BufferGeometry().setFromPoints(pts);
    });
  }, []);

  useFrame(() => { if (g.current) g.current.rotation.y = time.current * 0.015; });

  return (
    <group ref={g}>
      {arcs.map((geom, i) => (
        <line key={i} geometry={geom}>
          <lineBasicMaterial color={CYAN} transparent opacity={0.18} />
        </line>
      ))}
    </group>
  );
}

/* ── Animated scan sweep across globe surface ── */
function ScanSweep({ time }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const t = time.current;
    ref.current.rotation.x = Math.sin(t * 0.2) * 0.4;
    ref.current.rotation.z = t * 0.08;
    ref.current.material.opacity = 0.04 + Math.sin(t * 0.6) * 0.015;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.3, 1.02, 64, 1, 0, 0.15]} />
      <meshBasicMaterial color={CYAN} transparent opacity={0.04} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ── Orbital rings ── */
function OrbitalRings({ time }) {
  const r1 = useRef();
  const r2 = useRef();
  const r3 = useRef();
  useFrame(() => {
    const t = time.current;
    if (r1.current) r1.current.rotation.z = t * 0.12;
    if (r2.current) r2.current.rotation.z = -t * 0.08;
    if (r3.current) r3.current.rotation.z = t * 0.06;
  });
  return (
    <>
      <mesh ref={r1} rotation={[1.05, 0.2, 0]}>
        <torusGeometry args={[1.35, 0.003, 8, 80]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.14} />
      </mesh>
      <mesh ref={r2} rotation={[1.5, 0.4, 0]}>
        <torusGeometry args={[1.5, 0.002, 8, 80]} />
        <meshBasicMaterial color={PINK} transparent opacity={0.07} />
      </mesh>
      <mesh ref={r3} rotation={[0.7, -0.3, 0]}>
        <torusGeometry args={[1.65, 0.002, 8, 80]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.05} />
      </mesh>
    </>
  );
}

/* ── FHC core insignia at centre ── */
function FhcCore({ time }) {
  const ref = useRef();
  useFrame(() => {
    if (!ref.current) return;
    const t = time.current;
    ref.current.rotation.y = t * 0.4;
    ref.current.rotation.x = Math.sin(t * 0.3) * 0.15;
    ref.current.material.emissiveIntensity = 0.6 + Math.sin(t * 1.4) * 0.3;
  });
  return (
    <group>
      <mesh ref={ref}>
        <octahedronGeometry args={[0.07, 0]} />
        <meshStandardMaterial color={CYAN} emissive={CYAN} emissiveIntensity={0.8} transparent opacity={0.9} roughness={0.08} metalness={0.5} />
      </mesh>
      <mesh>
        <octahedronGeometry args={[0.12, 0]} />
        <meshBasicMaterial color={CYAN} transparent opacity={0.04} wireframe />
      </mesh>
    </group>
  );
}

/* ── Floating particles ── */
function GlobeParticles({ time }) {
  const count = 28;
  const ref = useRef();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(() => {
    const a = [];
    let s = 73;
    const r = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < count; i++) {
      const ang = r() * Math.PI * 2;
      const d = 1.2 + r() * 0.9;
      a.push({
        x: Math.cos(ang) * d, y: r() * 1.8 - 0.9, z: Math.sin(ang) * d,
        sp: 0.08 + r() * 0.25, off: r() * 6.28, sc: 0.003 + r() * 0.005,
      });
    }
    return a;
  }, []);

  useFrame(() => {
    if (!ref.current) return;
    const t = time.current;
    for (let i = 0; i < count; i++) {
      const p = data[i];
      dummy.position.set(
        p.x + Math.sin(t * p.sp + p.off) * 0.06,
        p.y + Math.sin(t * p.sp * 0.5 + p.off) * 0.08,
        p.z + Math.cos(t * p.sp + p.off) * 0.06,
      );
      dummy.scale.setScalar(p.sc * (0.8 + Math.sin(t * 0.35 + p.off) * 0.2));
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.28} color={CYAN} />
    </instancedMesh>
  );
}

/* ── Assembled globe ── */
function Globe({ time }) {
  const ref = useRef();
  useFrame(() => { if (ref.current) ref.current.rotation.y = time.current * 0.04; });
  return (
    <group ref={ref}>
      <GlobeBase />
      <GlobeGrid />
      <LatitudeRings time={time} />
      <ContinentDots time={time} />
      <DataNodes time={time} />
      <NodeHalos time={time} />
      <ConnectionArcs time={time} />
      <ScanSweep time={time} />
      <FhcCore time={time} />
    </group>
  );
}

/* ═══════════════════════════════════════════
   SCENE EXPORT (name kept for ArcadeViewport)
   ═══════════════════════════════════════════ */
export default function RobotScene() {
  const time = useRef(0);
  const ctrl = useRef();
  useFrame((_, dt) => { time.current += dt; });

  const onDown = useCallback((e) => { e.stopPropagation(); }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const c = ctrl.current;
      if (!c) return;
      c.object.position.set(0, 0.45, 2.6);
      c.target.set(0, 0, 0);
      c.update();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <ambientLight intensity={0.28} />
      <directionalLight position={[3, 5, 4]} intensity={0.5} color="#e8ecf4" />
      <pointLight position={[-3, 1, 3]} intensity={0.5} color="#1ED7E8" distance={8} />
      <pointLight position={[3, 1, -2]} intensity={0.3} color="#FF1687" distance={8} />
      <pointLight position={[0, -1, 3]} intensity={0.1} color="#1ED7E8" distance={6} />
      <spotLight position={[0, 4, 0]} angle={0.45} penumbra={0.9} intensity={0.2} color="#e4e8f0" />

      <group onPointerDown={onDown}>
        <Globe time={time} />
        <OrbitalRings time={time} />
      </group>

      <GlobeParticles time={time} />

      <OrbitControls
        ref={ctrl}
        enableZoom
        minDistance={1.8}
        maxDistance={5.5}
        enablePan={false}
        minPolarAngle={Math.PI / 5}
        maxPolarAngle={Math.PI / 1.6}
        rotateSpeed={0.45}
        dampingFactor={0.06}
        enableDamping
        target={[0, 0, 0]}
        makeDefault
      />
    </>
  );
}
