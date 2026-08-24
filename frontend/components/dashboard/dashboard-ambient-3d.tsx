"use client";

import { useRef, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function FloatingDashboardOrb({
  mousePos,
}: {
  mousePos: React.MutableRefObject<{ x: number; y: number }>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth subtle mouse parallax
    const targetX = mousePos.current.x * 0.6;
    const targetY = mousePos.current.y * 0.4;
    groupRef.current.position.x += (targetX - groupRef.current.position.x) * 0.04;
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.04;

    groupRef.current.rotation.y += delta * 0.2;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.15;

    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.3;
    }
  });

  return (
    <group ref={groupRef} position={[2.5, 0.5, -2]}>
      {/* Outer Rotating Cyber Ring */}
      <mesh ref={ringRef}>
        <torusGeometry args={[2.0, 0.03, 16, 64]} />
        <meshStandardMaterial
          color="#6366f1"
          emissive="#4f46e5"
          emissiveIntensity={0.6}
          wireframe
        />
      </mesh>

      {/* Holographic Wireframe Core */}
      <mesh>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#0284c7"
          emissiveIntensity={0.5}
          wireframe
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Inner Energy Spark */}
      <mesh>
        <octahedronGeometry args={[0.5, 0]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={0.9}
        />
      </mesh>
    </group>
  );
}

export function DashboardAmbient3D() {
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-60">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#6366f1" />
        <pointLight position={[-10, -10, -10]} intensity={0.8} color="#06b6d4" />

        <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.4}>
          <FloatingDashboardOrb mousePos={mousePos} />
        </Float>

        <Sparkles
          count={50}
          scale={8}
          size={1.5}
          speed={0.3}
          color="#818cf8"
          opacity={0.3}
        />
      </Canvas>
    </div>
  );
}