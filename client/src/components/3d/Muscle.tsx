import { Edges } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";
import * as THREE from "three";
import type { MuscleId } from "@/lib/fitness-data";

type MuscleZoneProps = {
  id: MuscleId;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  shape?: "capsule" | "box" | "sphere";
  hovered: boolean;
  selected: boolean;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
};

export function Muscle({
  id,
  position,
  rotation = [0, 0, 0],
  scale,
  shape = "box",
  hovered,
  selected,
  onHover,
  onSelect,
}: MuscleZoneProps) {
  const active = hovered || selected;
  const meshRef = useRef<THREE.Mesh>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useFrame(({ clock }) => {
    if (!meshRef.current || reduceMotion) return;
    if (active) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 4.0) * 0.04;
      meshRef.current.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2] * pulse);
    } else {
      meshRef.current.scale.set(scale[0], scale[1], scale[2]);
    }
  });

  const enter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(id);
  };
  const leave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(null);
  };
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(id);
  };

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={enter}
      onPointerOut={leave}
      onClick={click}
      renderOrder={3}
    >
      {shape === "capsule" && <capsuleGeometry args={[0.5, 1.2, 12, 20]} />}
      {shape === "sphere" && <sphereGeometry args={[0.6, 20, 20]} />}
      {shape === "box" && <boxGeometry args={[1, 1, 1]} />}

      {/* Holographic Diagnostic Highlight Material */}
      <meshStandardMaterial
        color={active ? "#c6ff3d" : "#284a32"}
        emissive={active ? "#a4f024" : "#132b1c"}
        emissiveIntensity={active ? 0.85 : 0.0}
        transparent
        opacity={active ? 0.42 : 0.001}
        roughness={0.2}
        metalness={0.1}
        depthWrite={false}
      />
      {active && (
        <Edges
          scale={1.03}
          color="#d8ff79"
          threshold={15}
          transparent
          opacity={0.85}
        />
      )}
    </mesh>
  );
}
