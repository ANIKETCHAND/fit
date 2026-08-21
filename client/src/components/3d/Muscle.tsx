/** Kinetic Anatomy Lab: interactive muscle geometry uses segmented, clinical materials instead of flat mannequin fills. */
/* Carbon Command Deck: active muscle surfaces keep physical shading but gain explicit contour edges for rapid scan readability. */
import { Edges } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useRef } from "react";
import * as THREE from "three";
import type { MuscleId } from "@/lib/fitness-data";

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

export function Muscle({ id, position, rotation = [0, 0, 0], scale, shape = "sphere", hovered, selected, onHover, onSelect }: MuscleProps) {
  const active = hovered || selected;
  const mesh = useRef<THREE.Mesh>(null);
  const reduceMotion = useReducedMotion() ?? false;
  useFrame(({ clock }) => {
    if (!mesh.current || reduceMotion) return;
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 3.1) * 0.025 : 1;
    mesh.current.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2] * pulse);
  });
  const enter = (event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onHover(id); };
  const leave = (event: ThreeEvent<PointerEvent>) => { event.stopPropagation(); onHover(null); };
  const click = (event: ThreeEvent<MouseEvent>) => { event.stopPropagation(); onSelect(id); };
  const tone = active ? "#9dbb4e" : "#376f48";

  return (
    <mesh ref={mesh} position={position} rotation={rotation} scale={scale} onPointerOver={enter} onPointerOut={leave} onClick={click} renderOrder={2} castShadow>
      {shape === "sphere" && <sphereGeometry args={[1, 32, 24]} />}
      {shape === "capsule" && <capsuleGeometry args={[0.68, 1.45, 12, 24]} />}
      {shape === "box" && <boxGeometry args={[1, 1, 1, 8, 7, 7]} />}
      <meshStandardMaterial color={tone} emissive={active ? "#80ad28" : "#194a2c"} emissiveIntensity={active ? 0.62 : 0.42} roughness={0.46} metalness={0.17} transparent opacity={active ? 0.96 : 0.87} />
      <Edges scale={1.013} color={active ? "#d8ff79" : "#8eb9a8"} threshold={13} transparent opacity={active ? 0.74 : 0.28} />
    </mesh>
  );
}
