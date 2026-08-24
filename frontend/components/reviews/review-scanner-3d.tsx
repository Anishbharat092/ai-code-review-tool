"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshTransmissionMaterial, Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";

export function ScannerMesh({ isWorking }: { isWorking: boolean }) {
  const crystalCoreRef = useRef<THREE.Mesh>(null);
  const glowShieldRef = useRef<THREE.Mesh>(null);
  const scanPlaneRef = useRef<THREE.Group>(null);
  const ambientGridRef = useRef<THREE.GridHelper>(null);

  useFrame((state, delta) => {
    const speed = isWorking ? 1.5 : 0.4;
    const time = state.clock.elapsedTime;

    // Smooth, multi-axis organic rotation for the main crystal
    if (crystalCoreRef.current) {
      crystalCoreRef.current.rotation.y += delta * 0.25 * speed;
      crystalCoreRef.current.rotation.x = Math.sin(time * 0.35) * 0.2;
      crystalCoreRef.current.rotation.z = Math.cos(time * 0.45) * 0.1;
    }

    // Counter-rotating outer wireframe for a layered technical look
    if (glowShieldRef.current) {
      glowShieldRef.current.rotation.y -= delta * 0.12 * speed;
      glowShieldRef.current.rotation.z = Math.sin(time * 0.5) * 0.15;
    }

    // Sweeping high-intensity laser line passing smoothly up and down
    if (scanPlaneRef.current) {
      scanPlaneRef.current.position.y = Math.sin(time * (isWorking ? 2.2 : 0.9)) * 0.95;
    }
  });

  // Balanced tech palette colors
  const coreLaserColor = isWorking ? "#34d399" : "#10b981";
  const glowColor = isWorking ? "#6ee7b7" : "#059669";

  return (
    <group position={[0, 0, 0]}>
      {/* 1. BACKGROUND MATRIX GRID (Essential to see the frosted glass distortion) */}
      <gridHelper 
        ref={ambientGridRef}
        args={[8, 16, "#1e293b", "#090d16"]} 
        rotation={[Math.PI / 2.1, 0, 0]} 
        position={[0, 0, -1.5]}
      />

      {/* 2. INNER GLOWING ENERGY NUCLEUS */}
      <mesh position={[0, 0, 0]}>
        <octahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>

      {/* 3. SOLID FROSTED GLASS CRYSTAL CORE */}
      <mesh ref={crystalCoreRef}>
        <icosahedronGeometry args={[0.72, 0]} />
        <MeshTransmissionMaterial
          backside={true}                 // MUST be true to compute inside thickness refraction
          samples={16}                    // Raycasting sample density
          thickness={0.8}                 // Wall thickness of the acrylic chunk
          roughness={0.12}                // Frosted finish blur setting
          chromaticAberration={0.08}      // Rainbow color splitting on the shard edges
          anisotropy={0.4}                // Preserves details at wide camera viewing angles
          distortion={0.3}                // Distorts the background grid passing behind it
          distortionScale={0.15}
          temporalDistortion={0.0}
          color="#ffffff"                 // True crystal base white tint
          attenuationDistance={0.5}       // Light absorption distance
          attenuationColor={coreLaserColor}
        />
      </mesh>

      {/* 4. SECONDARY OUTER TECH WIREFRAME LAYER */}
      <mesh ref={glowShieldRef}>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshBasicMaterial
          color={coreLaserColor}
          wireframe
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 5. VOLUMETRIC LASER SLICE WITH SOFT GLOW HALO */}
      <group ref={scanPlaneRef}>
        {/* Crisp intense core laser cut line */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.5, 0.03]} />
          <meshBasicMaterial
            color="#ffffff"
            side={THREE.DoubleSide}
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Soft volumetric glow aura surrounding the edge line */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.5, 0.22]} />
          <meshBasicMaterial
            color={glowColor}
            side={THREE.DoubleSide}
            transparent
            opacity={0.25}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export function ReviewScanner3D({ isWorking }: { isWorking: boolean }) {
  return (
    <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-zinc-950 border border-white/5 shadow-[inset_0_0_30px_rgba(16,185,129,0.02)]">
      
      {/* Background tint accent glow directly behind canvas space */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.04),transparent_65%)]" />

      <Canvas
        camera={{ position: [0, 0, 4.6], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        {/* High-intensity multi-source light values to give the glass structure something to reflect */}
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={2.5} color="#ffffff" />
        <pointLight position={[-5, -5, 3]} intensity={1.5} color={isWorking ? "#34d399" : "#10b981"} />
        <directionalLight position={[0, 8, -2]} intensity={1.0} color="#818cf8" />

        <Float speed={isWorking ? 1.8 : 0.8} rotationIntensity={0.3} floatIntensity={0.4}>
          <ScannerMesh isWorking={isWorking} />
        </Float>

        <Sparkles
          count={isWorking ? 45 : 15}
          scale={4}
          size={isWorking ? 1.8 : 1.2}
          speed={isWorking ? 0.4 : 0.15}
          color={isWorking ? "#34d399" : "#a7f3d0"}
          opacity={0.4}
        />
      </Canvas>

      {/* Status Overlay HUD */}
      <div className="absolute top-4 left-4 flex items-center gap-2 font-mono text-xs">
        <span
          className={`h-2 w-2 rounded-full ${
            isWorking
              ? "bg-amber-400 animate-pulse"
              : "bg-emerald-400 shadow-[0_0_10px_#10b981]"
          }`}
        />
        <span className="text-zinc-300 uppercase tracking-wider font-semibold text-[11px]">
          {isWorking ? "Neural AST Scanning Active" : "Analysis Complete"}
        </span>
      </div>

      <div className="absolute bottom-3 right-4 font-mono text-[10px] text-zinc-500 uppercase tracking-wide">
        {isWorking ? "Streaming AST Diffs" : "Cached In-Memory"}
      </div>
    </div>
  );
}
