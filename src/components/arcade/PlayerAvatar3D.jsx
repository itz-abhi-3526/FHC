import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const ACCENT_MAP = {
  pink: "#FF007F",
  cyan: "#00E5FF",
  green: "#4CFF4C",
};

function Mascot({ variant, accent, onGroupRef }) {
  const headRef = useRef();
  const coreRef = useRef();
  const coreGlowRef = useRef();
  const groupRef = useRef();
  const ac = ACCENT_MAP[accent] || ACCENT_MAP.cyan;
  const t = useRef(0);

  useEffect(() => {
    if (onGroupRef && groupRef.current) onGroupRef(groupRef.current);
  });

  /* ── FHC premium material set ── */
  // Structural armor — near-black graphite with soft metallic sheen
  const graphite = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#1a1d24", roughness: 0.42, metalness: 0.72,
  }), []);

  // Darker inner / joint graphite
  const graphiteDeep = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#0f1116", roughness: 0.5, metalness: 0.6,
  }), []);

  // Brushed metallic silver — smooth outer panels
  const silver = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#c6cad3", roughness: 0.28, metalness: 0.85,
  }), []);

  // Mid-grey mechanical trim
  const gunmetal = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#6f7480", roughness: 0.35, metalness: 0.8,
  }), []);

  // Panel interior — deep recessed
  const recess = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#0a0c10", roughness: 0.6, metalness: 0.1,
  }), []);

  // Cyan illuminated interface
  const cyanGlow = useMemo(() => new THREE.MeshStandardMaterial({
    color: ac, emissive: ac, emissiveIntensity: 1.6,
    roughness: 0.2, metalness: 0.2,
  }), [ac]);

  // FHC magenta identification accent (restrained)
  const magenta = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#FF007F", emissive: "#FF007F", emissiveIntensity: 1.1,
    roughness: 0.25, metalness: 0.3,
  }), []);

  // Soft accent rim (dim, translucent)
  const acDim = useMemo(() => new THREE.MeshStandardMaterial({
    color: ac, emissive: ac, emissiveIntensity: 0.35,
    roughness: 0.3, metalness: 0.3, transparent: true, opacity: 0.7,
  }), [ac]);

  // Core reactor — dedicated animatable glow material
  const coreMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: "#ffffff", emissive: ac, emissiveIntensity: 2.0,
    roughness: 0.2, metalness: 0.1,
  }), [ac]);

  // Halo core glow — dedicated translucent billboard
  const coreHaloMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: ac, transparent: true, opacity: 0.14, depthWrite: false,
  }), [ac]);

  useFrame((_, dt) => {
    t.current += dt;
    if (headRef.current) {
      headRef.current.position.y = 1.05 + Math.sin(t.current * 1.3) * 0.02;
      headRef.current.rotation.z = Math.sin(t.current * 0.8) * 0.03;
    }
    if (headRef.current && headRef.current.rotation.y !== undefined) {
      // subtle lateral sway
      headRef.current.rotation.y = Math.sin(t.current * 0.5) * 0.05;
    }
    if (coreRef.current) coreRef.current.material.emissiveIntensity = 1.6 + Math.sin(t.current * 2.0) * 0.7;
    if (coreGlowRef.current) {
      coreGlowRef.current.material.opacity = 0.10 + Math.sin(t.current * 1.6) * 0.06;
      coreGlowRef.current.scale.setScalar(1.0 + Math.sin(t.current * 1.4) * 0.12);
    }
  });

  useFrame((_, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.12;
  });

  const v = variant || 0;

  return (
    <group ref={groupRef} position={[-0.10, -0.65, 0]}>
      {/* ═══════════════════════════════════════════
          HEAD — sleek angular FHC helmet with single visor
          ═══════════════════════════════════════════ */}
      <group ref={headRef} position={[0, 1.05, 0]}>
        {/* Helmet shell — low, rounded-trapezoid (scaled sphere) */}
        <mesh material={silver} scale={[0.82, 0.78, 0.9]}>
          <sphereGeometry args={[0.30, 40, 32]} />
        </mesh>
        {/* Rear crown — graphite counterweight */}
        <mesh material={graphite} position={[0, 0.02, -0.18]} scale={[0.78, 0.7, 0.7]}>
          <sphereGeometry args={[0.22, 32, 24]} />
        </mesh>
        {/* Cheek / side armor plates */}
        <mesh material={graphiteDeep} position={[-0.20, -0.06, 0.02]} rotation={[0, 0.18, 0.08]}>
          <boxGeometry args={[0.09, 0.16, 0.20]} />
        </mesh>
        <mesh material={graphiteDeep} position={[0.20, -0.06, 0.02]} rotation={[0, -0.18, -0.08]}>
          <boxGeometry args={[0.09, 0.16, 0.20]} />
        </mesh>

        {/* Single sophisticated visor — curved band */}
        <mesh material={graphiteDeep} position={[0, 0.0, 0.16]} scale={[0.78, 0.34, 0.5]}>
          <sphereGeometry args={[0.27, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
        </mesh>
        {/* Visor glow surface */}
        <mesh material={cyanGlow} position={[0, 0.0, 0.19]} scale={[0.7, 0.26, 0.32]}>
          <sphereGeometry args={[0.27, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.72]} />
        </mesh>
        {/* Visor horizontal accent line */}
        <mesh material={acDim} position={[0, -0.005, 0.205]} scale={[0.66, 0.02, 0.28]}>
          <sphereGeometry args={[0.27, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.8]} />
        </mesh>
        {/* Small cyan interface dots on brow */}
        <mesh material={cyanGlow} position={[-0.10, 0.10, 0.24]}>
          <boxGeometry args={[0.025, 0.025, 0.025]} />
        </mesh>
        <mesh material={cyanGlow} position={[0.10, 0.10, 0.24]}>
          <boxGeometry args={[0.025, 0.025, 0.025]} />
        </mesh>

        {/* Geometric FHC chevron on forehead */}
        <mesh material={magenta} position={[0, 0.16, 0.20]}>
          <coneGeometry args={[0.045, 0.05, 4]} />
        </mesh>
        <mesh material={cyanGlow} position={[0, 0.10, 0.10]}>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
        </mesh>

        {/* Emitter fin / crest */}
        <mesh material={graphiteDeep} position={[0, 0.24, 0.06]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.04, 0.09, 0.26]} />
        </mesh>
        <mesh material={acDim} position={[0, 0.20, 0.19]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.03, 0.03, 0.03]} />
        </mesh>

        {/* Jaw guard */}
        <mesh material={silver} position={[0, -0.16, 0.13]} scale={[0.5, 0.16, 0.3]}>
          <sphereGeometry args={[0.20, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>
        <mesh material={cyanGlow} position={[0, -0.165, 0.22]}>
          <boxGeometry args={[0.06, 0.012, 0.012]} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════
          TORSO — refined engineered core
          ═══════════════════════════════════════════ */}
      <group position={[0, 0.40, 0]}>
        {/* Main torso — graphite carapace */}
        <mesh material={graphite} position={[0, 0.06, 0]} scale={[1.3, 1.05, 0.86]}>
          <capsuleGeometry args={[0.24, 0.28, 16, 28]} />
        </mesh>
        {/* Chest plate — metallic silver armor */}
        <mesh material={silver} position={[0, 0.12, 0.12]} scale={[1.05, 0.9, 0.5]}>
          <sphereGeometry args={[0.21, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.62]} />
        </mesh>
        {/* Upper torso panel lines */}
        <mesh material={gunmetal} position={[0, 0.22, 0.17]}>
          <boxGeometry args={[0.34, 0.012, 0.02]} />
        </mesh>
        <mesh material={gunmetal} position={[0, 0.12, 0.17]}>
          <boxGeometry args={[0.30, 0.012, 0.02]} />
        </mesh>

        {/* Central reactor core — cyan interface */}
        <mesh material={recess} position={[0, 0.10, 0.195]}>
          <circleGeometry args={[0.16, 28]} />
        </mesh>
        <mesh material={coreMat} position={[0, 0.10, 0.205]} ref={coreRef}>
          <octahedronGeometry args={[0.075, 0]} />
        </mesh>
        <mesh material={cyanGlow} position={[0, 0.10, 0.22]}>
          <torusGeometry args={[0.09, 0.008, 8, 24]} />
        </mesh>
        <mesh material={coreHaloMat} position={[0, 0.10, 0.20]} ref={coreGlowRef}>
          <sphereGeometry args={[0.15, 20, 16]} />
        </mesh>

        {/* Access panel — side of torso (left) */}
        <mesh material={recess} position={[-0.19, 0.02, 0.03]} rotation={[0, 0.2, 0]}>
          <boxGeometry args={[0.06, 0.16, 0.05]} />
        </mesh>
        <mesh material={cyanGlow} position={[-0.20, 0.02, 0.055]}>
          <boxGeometry args={[0.03, 0.03, 0.01]} />
        </mesh>
        {/* Access panel — right */}
        <mesh material={recess} position={[0.19, 0.02, 0.03]} rotation={[0, -0.2, 0]}>
          <boxGeometry args={[0.06, 0.16, 0.05]} />
        </mesh>

        {/* Shoulder modules — sculpted pauldrons */}
        <group position={[-0.26, 0.30, 0]}>
          <mesh material={silver} scale={[1, 1.1, 0.8]}>
            <sphereGeometry args={[0.10, 28, 20]} />
          </mesh>
          <mesh material={graphiteDeep} position={[0, 0.02, 0.06]}>
            <boxGeometry args={[0.12, 0.04, 0.07]} />
          </mesh>
        </group>
        <group position={[0.26, 0.30, 0]}>
          <mesh material={silver} scale={[1, 1.1, 0.8]}>
            <sphereGeometry args={[0.10, 28, 20]} />
          </mesh>
          <mesh material={graphiteDeep} position={[0, 0.02, 0.06]}>
            <boxGeometry args={[0.12, 0.04, 0.07]} />
          </mesh>
        </group>

        {/* FHC insignia — magenta id stripe on chest */}
        <mesh material={magenta} position={[0, 0.02, 0.19]}>
          <boxGeometry args={[0.05, 0.016, 0.01]} />
        </mesh>
        <mesh material={magenta} position={[0, -0.01, 0.19]}>
          <boxGeometry args={[0.03, 0.016, 0.01]} />
        </mesh>

        {/* Waist ring — cyan trim */}
        <mesh material={acDim} position={[0, -0.20, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.20, 0.012, 8, 28]} />
        </mesh>
        {/* Hip block */}
        <mesh material={graphiteDeep} position={[0, -0.17, 0]}>
          <boxGeometry args={[0.26, 0.10, 0.20]} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════
          LEFT ARM — articulated builder arm
          ═══════════════════════════════════════════ */}
      <group position={[-0.31, 0.58, 0]}>
        {/* Shoulder joint */}
        <mesh material={gunmetal}>
          <sphereGeometry args={[0.05, 16, 12]} />
        </mesh>
        {/* Upper arm */}
        <mesh material={silver} position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.045, 0.16, 10, 16]} />
        </mesh>
        {/* Elbow joint ring */}
        <mesh material={acDim} position={[0, -0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.048, 0.008, 8, 16]} />
        </mesh>
        {/* Forearm */}
        <mesh material={graphite} position={[0, -0.36, 0]}>
          <capsuleGeometry args={[0.038, 0.16, 8, 14]} />
        </mesh>
        {/* Wrist */}
        <mesh material={gunmetal} position={[0, -0.46, 0]}>
          <sphereGeometry args={[0.032, 12, 8]} />
        </mesh>
        {/* Hand — subtle two-tine tooling claw */}
        <mesh material={silver} position={[0, -0.49, 0]}>
          <boxGeometry args={[0.06, 0.03, 0.09]} />
        </mesh>
        <mesh material={graphiteDeep} position={[0, -0.47, -0.05]}>
          <boxGeometry args={[0.04, 0.02, 0.05]} />
        </mesh>
        <mesh material={cyanGlow} position={[0, -0.49, 0.05]}>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════
          RIGHT ARM — articulated builder arm
          ═══════════════════════════════════════════ */}
      <group position={[0.31, 0.58, 0]}>
        <mesh material={gunmetal}>
          <sphereGeometry args={[0.05, 16, 12]} />
        </mesh>
        <mesh material={silver} position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.045, 0.16, 10, 16]} />
        </mesh>
        <mesh material={acDim} position={[0, -0.24, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.048, 0.008, 8, 16]} />
        </mesh>
        <mesh material={graphite} position={[0, -0.36, 0]}>
          <capsuleGeometry args={[0.038, 0.16, 8, 14]} />
        </mesh>
        <mesh material={gunmetal} position={[0, -0.46, 0]}>
          <sphereGeometry args={[0.032, 12, 8]} />
        </mesh>
        <mesh material={silver} position={[0, -0.49, 0]}>
          <boxGeometry args={[0.06, 0.03, 0.09]} />
        </mesh>
        <mesh material={graphiteDeep} position={[0, -0.47, -0.05]}>
          <boxGeometry args={[0.04, 0.02, 0.05]} />
        </mesh>
        <mesh material={cyanGlow} position={[0, -0.49, 0.05]}>
          <boxGeometry args={[0.02, 0.02, 0.02]} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════
          LEFT LEG — articulated explorer leg
          ═══════════════════════════════════════════ */}
      <group position={[-0.10, 0.14, 0]}>
        {/* Hip joint */}
        <mesh material={gunmetal}>
          <sphereGeometry args={[0.045, 14, 10]} />
        </mesh>
        {/* Thigh */}
        <mesh material={graphite} position={[0, -0.10, 0]}>
          <capsuleGeometry args={[0.05, 0.10, 10, 14]} />
        </mesh>
        {/* Knee joint ring */}
        <mesh material={acDim} position={[0, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.008, 8, 16]} />
        </mesh>
        {/* Shin */}
        <mesh material={silver} position={[0, -0.26, 0]}>
          <capsuleGeometry args={[0.042, 0.14, 8, 14]} />
        </mesh>
        {/* Foot */}
        <mesh material={graphiteDeep} position={[0, -0.36, 0.03]}>
          <boxGeometry args={[0.09, 0.06, 0.16]} />
        </mesh>
        <mesh material={cyanGlow} position={[0, -0.34, 0.10]}>
          <boxGeometry args={[0.03, 0.02, 0.02]} />
        </mesh>
        <mesh material={silver} position={[0, -0.38, 0.05]}>
          <boxGeometry args={[0.08, 0.02, 0.13]} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════
          RIGHT LEG — articulated explorer leg
          ═══════════════════════════════════════════ */}
      <group position={[0.10, 0.14, 0]}>
        <mesh material={gunmetal}>
          <sphereGeometry args={[0.045, 14, 10]} />
        </mesh>
        <mesh material={graphite} position={[0, -0.10, 0]}>
          <capsuleGeometry args={[0.05, 0.10, 10, 14]} />
        </mesh>
        <mesh material={acDim} position={[0, -0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.05, 0.008, 8, 16]} />
        </mesh>
        <mesh material={silver} position={[0, -0.26, 0]}>
          <capsuleGeometry args={[0.042, 0.14, 8, 14]} />
        </mesh>
        <mesh material={graphiteDeep} position={[0, -0.36, 0.03]}>
          <boxGeometry args={[0.09, 0.06, 0.16]} />
        </mesh>
        <mesh material={cyanGlow} position={[0, -0.34, 0.10]}>
          <boxGeometry args={[0.03, 0.02, 0.02]} />
        </mesh>
        <mesh material={silver} position={[0, -0.38, 0.05]}>
          <boxGeometry args={[0.08, 0.02, 0.13]} />
        </mesh>
      </group>

      {/* ═══ CLASS VARIANT DETAILS — subtle FHC role markers ═══ */}
      {v === 0 && (
        /* BUILDER — tool clamp module on the back */
        <group position={[0, 0.42, -0.20]}>
          <mesh material={graphiteDeep}>
            <boxGeometry args={[0.16, 0.20, 0.08]} />
          </mesh>
          <mesh material={gunmetal} position={[0, 0.06, -0.045]}>
            <boxGeometry args={[0.10, 0.04, 0.02]} />
          </mesh>
          <mesh material={cyanGlow} position={[0, -0.05, -0.045]}>
            <boxGeometry args={[0.06, 0.05, 0.02]} />
          </mesh>
          <mesh material={magenta} position={[0.05, -0.10, -0.045]}>
            <boxGeometry args={[0.03, 0.03, 0.02]} />
          </mesh>
        </group>
      )}
      {v === 1 && (
        /* EXPLORER — comms mast antenna */
        <group position={[0, 1.55, 0]}>
          <mesh material={gunmetal}>
            <capsuleGeometry args={[0.010, 0.12, 4, 8]} />
          </mesh>
          <mesh material={acDim} position={[0, 0.10, 0]}>
            <sphereGeometry args={[0.020, 10, 8]} />
          </mesh>
          <mesh material={cyanGlow} position={[0, 0.10, 0]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
          </mesh>
        </group>
      )}
      {v === 2 && (
        /* CYBER — dual uplink micro-panels beside the visor */
        <>
          <mesh material={graphiteDeep} position={[-0.165, 1.12, 0.10]} rotation={[0.1, 0.5, 0]}>
            <boxGeometry args={[0.05, 0.03, 0.03]} />
          </mesh>
          <mesh material={cyanGlow} position={[-0.165, 1.12, 0.115]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
          </mesh>
          <mesh material={graphiteDeep} position={[0.165, 1.12, 0.10]} rotation={[0.1, -0.5, 0]}>
            <boxGeometry args={[0.05, 0.03, 0.03]} />
          </mesh>
          <mesh material={cyanGlow} position={[0.165, 1.12, 0.115]}>
            <boxGeometry args={[0.02, 0.02, 0.02]} />
          </mesh>
        </>
      )}
    </group>
  );
}

function GroundShadow() {
  return (
    <mesh position={[0, -0.67, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.36, 32]} />
      <meshBasicMaterial color="#000000" transparent opacity={0.30} depthWrite={false} />
    </mesh>
  );
}

function PlatformRing() {
  return (
    <group position={[0, -0.66, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.40, 0.42, 48]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.52, 0.53, 48]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.06} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function PlayerAvatar3D({ variant = 0, accent = "cyan", resetKey = 0 }) {
  const controlsRef = useRef();
  const mascotGroupRef = useRef(null);
  const cameraDataRef = useRef({ center: new THREE.Vector3(0, 0.1, 0), distance: 2.4 });
  const resetRef = useRef(null);

  const handleMascotRef = useCallback((group) => {
    mascotGroupRef.current = group;
  }, []);

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

      <Mascot variant={variant} accent={accent} onGroupRef={handleMascotRef} />
      <GroundShadow />
      <PlatformRing />

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
