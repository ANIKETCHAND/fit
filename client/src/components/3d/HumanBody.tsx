import { Html, useTexture } from "@react-three/drei";
import { Suspense, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Muscle } from "./Muscle";
import { muscleLibrary, type MuscleId } from "@/lib/fitness-data";

export const BODY_MODEL_PATH = "/models/body.glb";

type HumanBodyProps = {
  selected: MuscleId;
  hovered: MuscleId | null;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
};

// Realistic Anatomical Human Musculature Figure
function AnatomicalFigure({
  selected,
  hovered,
  onHover,
  onSelect,
}: HumanBodyProps) {
  // Load high-resolution anatomical texture plates
  const [frontTex, backTex, sideTex, threeQTex] = useTexture([
    "/assets/anatomy-front.png",
    "/assets/anatomy-back.png",
    "/assets/anatomy-side.png",
    "/assets/anatomy-three_quarter.png",
  ]);

  frontTex.colorSpace = THREE.SRGBColorSpace;
  backTex.colorSpace = THREE.SRGBColorSpace;
  sideTex.colorSpace = THREE.SRGBColorSpace;
  threeQTex.colorSpace = THREE.SRGBColorSpace;

  const muscle = (
    id: MuscleId,
    position: [number, number, number],
    scale: [number, number, number],
    shape: "capsule" | "box" | "sphere" = "box",
    rotation: [number, number, number] = [0, 0, 0]
  ) => (
    <Muscle
      key={`${id}-${position.join("-")}`}
      id={id}
      position={position}
      scale={scale}
      shape={shape}
      rotation={rotation}
      selected={selected === id}
      hovered={hovered === id}
      onHover={onHover}
      onSelect={onSelect}
    />
  );

  return (
    <group position={[0, -0.15, 0]}>
      {/* 1. FRONT ANATOMICAL PLANE (Exposure of Pectorals, 6-Pack Abs, Quads, Biceps, Deltoids) */}
      <mesh position={[0, 0, 0.05]} castShadow>
        <planeGeometry args={[3.2, 6.64, 32, 32]} />
        <meshStandardMaterial
          map={frontTex}
          transparent
          opacity={0.96}
          roughness={0.32}
          metalness={0.15}
          emissive="#0d1f14"
          emissiveIntensity={0.35}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 2. BACK ANATOMICAL PLANE (Trapezius, Lats V-Taper, Gluteus, Hamstrings, Calves) */}
      <mesh position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]} castShadow>
        <planeGeometry args={[3.3, 6.64, 32, 32]} />
        <meshStandardMaterial
          map={backTex}
          transparent
          opacity={0.96}
          roughness={0.32}
          metalness={0.15}
          emissive="#0d1f14"
          emissiveIntensity={0.35}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* 3. SIDE 3/4 DEPTH PLANES (Gives 3D volumetric silhouette from any angle) */}
      <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 4, 0]}>
        <planeGeometry args={[3.0, 6.64]} />
        <meshStandardMaterial
          map={threeQTex}
          transparent
          opacity={0.35}
          roughness={0.4}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, -Math.PI / 4, 0]}>
        <planeGeometry args={[3.0, 6.64]} />
        <meshStandardMaterial
          map={threeQTex}
          transparent
          opacity={0.35}
          roughness={0.4}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Volumetric Subtle Depth Core */}
      <mesh position={[0, 0.8, 0]} scale={[0.85, 1.25, 0.35]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial
          color="#15261a"
          emissive="#0c1710"
          emissiveIntensity={0.3}
          roughness={0.5}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* 4. INTERACTIVE 3D ANATOMICAL MUSCLE HIT-ZONES (FRONT & BACK) */}

      {/* A. CHEST (Pectoralis Major) */}
      {muscle("chest", [-0.38, 1.35, 0.12], [0.55, 0.44, 0.22], "box", [0, 0, 0.05])}
      {muscle("chest", [0.38, 1.35, 0.12], [0.55, 0.44, 0.22], "box", [0, 0, -0.05])}

      {/* B. SHOULDERS (Deltoids - Front, Lateral & Rear Caps) */}
      {muscle("shoulders", [-1.02, 1.58, 0.06], [0.42, 0.52, 0.38], "capsule", [0, 0, 0.18])}
      {muscle("shoulders", [1.02, 1.58, 0.06], [0.42, 0.52, 0.38], "capsule", [0, 0, -0.18])}
      {muscle("shoulders", [-1.02, 1.58, -0.06], [0.42, 0.52, 0.38], "capsule", [0, 0, 0.18])}
      {muscle("shoulders", [1.02, 1.58, -0.06], [0.42, 0.52, 0.38], "capsule", [0, 0, -0.18])}

      {/* C. BICEPS (Biceps Brachii - Front Arm) */}
      {muscle("biceps", [-1.22, 0.82, 0.1], [0.32, 0.58, 0.24], "capsule", [-0.1, 0.1, -0.12])}
      {muscle("biceps", [1.22, 0.82, 0.1], [0.32, 0.58, 0.24], "capsule", [-0.1, -0.1, 0.12])}

      {/* D. TRICEPS (Triceps Brachii - Rear Arm) */}
      {muscle("triceps", [-1.22, 0.82, -0.12], [0.32, 0.62, 0.26], "capsule", [0.08, -0.1, -0.12])}
      {muscle("triceps", [1.22, 0.82, -0.12], [0.32, 0.62, 0.26], "capsule", [0.08, 0.1, 0.12])}

      {/* E. CORE / ABS (Rectus Abdominis 6-Pack & Obliques) */}
      {muscle("core", [0, 0.58, 0.12], [0.68, 0.95, 0.22], "box")}

      {/* F. BACK (Latissimus Dorsi V-Taper Wings & Trapezius) */}
      {muscle("back", [0, 1.88, -0.12], [0.92, 0.68, 0.24], "box")}
      {muscle("back", [-0.52, 1.05, -0.12], [0.55, 0.82, 0.24], "box", [0, 0, -0.12])}
      {muscle("back", [0.52, 1.05, -0.12], [0.55, 0.82, 0.24], "box", [0, 0, 0.12])}

      {/* G. GLUTES (Gluteus Maximus - Rear Pelvis) */}
      {muscle("glutes", [-0.36, -0.22, -0.14], [0.48, 0.52, 0.32], "sphere")}
      {muscle("glutes", [0.36, -0.22, -0.14], [0.48, 0.52, 0.32], "sphere")}

      {/* H. QUADRICEPS (Rectus Femoris & Vastus Lateralis / Medialis) */}
      {muscle("quads", [-0.44, -1.18, 0.12], [0.46, 1.15, 0.32], "capsule", [0.04, 0, 0.02])}
      {muscle("quads", [0.44, -1.18, 0.12], [0.46, 1.15, 0.32], "capsule", [0.04, 0, -0.02])}

      {/* I. HAMSTRINGS (Biceps Femoris & Semitendinosus - Rear Thighs) */}
      {muscle("hamstrings", [-0.44, -1.18, -0.14], [0.46, 1.15, 0.32], "capsule", [-0.04, 0, 0.02])}
      {muscle("hamstrings", [0.44, -1.18, -0.14], [0.46, 1.15, 0.32], "capsule", [-0.04, 0, -0.02])}

      {/* J. CALVES (Gastrocnemius - Medial & Lateral Heads) */}
      {muscle("calves", [-0.42, -2.48, 0.0], [0.38, 0.88, 0.32], "capsule", [0.02, 0, 0.03])}
      {muscle("calves", [0.42, -2.48, 0.0], [0.38, 0.88, 0.32], "capsule", [0.02, 0, -0.03])}
    </group>
  );
}

export function HumanBody({
  selected,
  hovered,
  onHover,
  onSelect,
}: HumanBodyProps) {
  const label = hovered ?? selected;
  const root = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useFrame(({ clock }) => {
    if (!root.current || reduceMotion) return;
    const breath = Math.sin(clock.elapsedTime * 1.2);
    root.current.position.y = 0.25 + breath * 0.015;
    root.current.scale.setScalar(1 + breath * 0.004);
  });

  return (
    <group ref={root} position={[0, 0.25, 0]}>
      <Suspense fallback={null}>
        <AnatomicalFigure
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
        />
      </Suspense>

      {label && (
        <Html position={[0, 3.45, 0]} center style={{ pointerEvents: "none" }}>
          <div className="body-float-label">
            <span className="pulse-dot" />
            {muscleLibrary[label].anatomicalName}
          </div>
        </Html>
      )}
    </group>
  );
}
