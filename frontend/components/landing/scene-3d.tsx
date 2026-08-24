"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

function InteractiveParticleField({
  scrollY,
  mousePos,
}: {
  scrollY: React.MutableRefObject<number>;
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1500;

  const [positions, originalPositions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const orig = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 3.5 + Math.random() * 5.0;
      const theta = THREE.MathUtils.randFloatSpread(360);
      const phi = THREE.MathUtils.randFloatSpread(360);

      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta) - 1.0;

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      orig[i * 3] = x;
      orig[i * 3 + 1] = y;
      orig[i * 3 + 2] = z;

      vel[i * 3] = 0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = 0;
    }
    return [pos, orig, vel];
  }, [count]);

  const { viewport } = useThree();

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const s = scrollY.current;
    const targetMouseX = (mousePos.current.x * viewport.width) / 2;
    const targetMouseY = (mousePos.current.y * viewport.height) / 2;

    const posAttr = pointsRef.current.geometry.attributes.position;
    const array = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      let px = array[i3];
      let py = array[i3 + 1];

      const ox = originalPositions[i3];
      const oy = originalPositions[i3 + 1];
      const oz = originalPositions[i3 + 2];

      const wave = Math.sin(state.clock.elapsedTime * 1.5 + ox * 1.5) * 0.1;
      const dx = px - targetMouseX;
      const dy = py - targetMouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = 2.8;

      // Mouse repulsion force
      if (dist < maxDist && dist > 0.01) {
        const force = (1 - dist / maxDist) * 8.0;
        velocities[i3] += (dx / dist) * force * delta;
        velocities[i3 + 1] += (dy / dist) * force * delta;
      }

      // Spring back to base position
      const scrollExpand = 1 + s * 1.2;
      const targetX = ox * scrollExpand + wave;
      const targetY = oy * scrollExpand - s * 4 + wave;

      velocities[i3] += (targetX - px) * 3.2 * delta;
      velocities[i3 + 1] += (targetY - py) * 3.2 * delta;
      velocities[i3 + 2] += (oz - array[i3 + 2]) * 3.2 * delta;

      // Dampening
      velocities[i3] *= 0.87;
      velocities[i3 + 1] *= 0.87;
      velocities[i3 + 2] *= 0.87;

      array[i3] += velocities[i3];
      array[i3 + 1] += velocities[i3 + 1];
      array[i3 + 2] += velocities[i3 + 2];
    }

    posAttr.needsUpdate = true;
    pointsRef.current.rotation.y += delta * 0.08 + s * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        color="#818cf8"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export function Scene3D({ scrollY }: { scrollY: React.MutableRefObject<number> }) {
  const mousePos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 bg-[#030712] w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#818cf8" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#06b6d4" />

        <InteractiveParticleField scrollY={scrollY} mousePos={mousePos} />

        <Sparkles count={140} scale={14} size={2} speed={0.4} color="#38bdf8" opacity={0.35} />
      </Canvas>
    </div>
  );
}