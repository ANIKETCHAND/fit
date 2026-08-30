import { Edges } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useRef, useEffect } from "react";
import * as THREE from "three";
import { type MuscleId, muscleLibrary, getRecoveryStatus } from "@/lib/fitness-data";

export type MuscleShape = "sphere" | "capsule" | "box";

type MuscleProps = {
  id: MuscleId;
  position: [number, number, number];
  rotation?: [number, number, number];
  scale: [number, number, number];
  shape?: MuscleShape;
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
  shape = "sphere",
  hovered,
  selected,
  onHover,
  onSelect,
}: MuscleProps) {
  const active = hovered || selected;
  const mesh = useRef<THREE.Mesh>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const muscleData = muscleLibrary[id];
  const score = muscleData?.score ?? 80;
  const recovery = getRecoveryStatus(score);

  useFrame(({ clock }) => {
    if (!mesh.current || reduceMotion) return;
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 3.8) * 0.035 : 1;
    mesh.current.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2] * pulse);
  });

  const enter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "pointer";
    onHover(id);
  };

  const leave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    document.body.style.cursor = "auto";
    onHover(null);
  };

  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(id);
  };

  useEffect(() => {
    return () => {
      document.body.style.cursor = "auto";
    };
  }, []);

  // Dynamic recovery color mapping:
  // Green (#22c55e) = Fully Recovered
  // Yellow (#f59e0b) = Recovering
  // Red (#ef4444) = Needs Rest
  const baseColor = recovery.color;
  const emissiveColor = active ? recovery.color : recovery.emissive;

  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={enter}
      onPointerOut={leave}
      onClick={click}
      renderOrder={2}
      castShadow
    >
      {shape === "sphere" && <sphereGeometry args={[1, 32, 24]} />}
      {shape === "capsule" && <capsuleGeometry args={[0.68, 1.45, 12, 24]} />}
      {shape === "box" && <boxGeometry args={[1, 1, 1, 8, 7, 7]} />}
      <meshStandardMaterial
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={active ? 0.9 : 0.45}
        roughness={0.4}
        metalness={0.18}
        transparent
        opacity={active ? 0.98 : 0.88}
      />
      <Edges
        scale={1.018}
        color={active ? "#ffffff" : baseColor}
        threshold={12}
        transparent
        opacity={active ? 0.95 : 0.45}
      />
    </mesh>
  );
}
