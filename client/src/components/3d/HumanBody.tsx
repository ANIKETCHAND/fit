import { Html, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Muscle } from "./Muscle";
import { muscleLibrary, type MuscleId } from "@/lib/fitness-data";

export const BODY_MODEL_PATH = "/models/body.glb";

// Preload the GLB model
useGLTF.preload(BODY_MODEL_PATH);

type HumanBodyProps = {
  selected: MuscleId;
  hovered: MuscleId | null;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
};

// 1. Realistic 3D Human Mesh Component loaded from GLB
function Realistic3DHumanMesh() {
  const { scene } = useGLTF(BODY_MODEL_PATH);

  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        // Anatomical clinical muscle shading
        mesh.material = new THREE.MeshStandardMaterial({
          color: "#2a5237",
          emissive: "#152f1e",
          emissiveIntensity: 0.48,
          roughness: 0.35,
          metalness: 0.22,
          wireframe: false,
        });
      }
    });
    return clone;
  }, [scene]);

  return (
    <primitive
      object={clonedScene}
      position={[0, -3.2, 0]}
      scale={3.65}
      rotation={[0, 0, 0]}
    />
  );
}

// 2. Interactive 3D Muscle Highlight Overlays for Raycast Selection
function InteractiveMuscleZones({
  selected,
  hovered,
  onHover,
  onSelect,
}: HumanBodyProps) {
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
    <group position={[0, -0.1, 0]}>
      {/* CHEST (Pectoralis Major) */}
      {muscle("chest", [-0.42, 1.22, 0.32], [0.55, 0.42, 0.28], "box", [0.08, 0, 0.05])}
      {muscle("chest", [0.42, 1.22, 0.32], [0.55, 0.42, 0.28], "box", [0.08, 0, -0.05])}

      {/* SHOULDERS (Deltoids) */}
      {muscle("shoulders", [-1.02, 1.48, 0.05], [0.45, 0.52, 0.42], "capsule", [0, 0, 0.2])}
      {muscle("shoulders", [1.02, 1.48, 0.05], [0.45, 0.52, 0.42], "capsule", [0, 0, -0.2])}

      {/* BICEPS (Biceps Brachii) */}
      {muscle("biceps", [-1.25, 0.72, 0.12], [0.32, 0.58, 0.26], "capsule", [-0.1, 0.1, -0.12])}
      {muscle("biceps", [1.25, 0.72, 0.12], [0.32, 0.58, 0.26], "capsule", [-0.1, -0.1, 0.12])}

      {/* TRICEPS (Triceps Brachii) */}
      {muscle("triceps", [-1.25, 0.72, -0.14], [0.32, 0.62, 0.26], "capsule", [0.08, -0.1, -0.12])}
      {muscle("triceps", [1.25, 0.72, -0.14], [0.32, 0.62, 0.26], "capsule", [0.08, 0.1, 0.12])}

      {/* CORE / ABS (Rectus Abdominis & Obliques) */}
      {muscle("core", [0, 0.35, 0.26], [0.72, 1.05, 0.28], "box")}

      {/* BACK (Latissimus Dorsi & Trapezius) */}
      {muscle("back", [0, 1.62, -0.18], [0.95, 0.65, 0.28], "box")}
      {muscle("back", [-0.55, 0.88, -0.22], [0.55, 0.88, 0.28], "box", [0, 0, -0.14])}
      {muscle("back", [0.55, 0.88, -0.22], [0.55, 0.88, 0.28], "box", [0, 0, 0.14])}

      {/* GLUTES (Gluteus Maximus) */}
      {muscle("glutes", [-0.38, -0.38, -0.24], [0.48, 0.52, 0.38], "sphere")}
      {muscle("glutes", [0.38, -0.38, -0.24], [0.48, 0.52, 0.38], "sphere")}

      {/* QUADRICEPS (Rectus Femoris & Vastus Lateralis/Medialis) */}
      {muscle("quads", [-0.44, -1.25, 0.16], [0.46, 1.15, 0.36], "capsule", [0.04, 0, 0.02])}
      {muscle("quads", [0.44, -1.25, 0.16], [0.46, 1.15, 0.36], "capsule", [0.04, 0, -0.02])}

      {/* HAMSTRINGS (Biceps Femoris & Semitendinosus) */}
      {muscle("hamstrings", [-0.44, -1.25, -0.18], [0.46, 1.15, 0.36], "capsule", [-0.04, 0, 0.02])}
      {muscle("hamstrings", [0.44, -1.25, -0.18], [0.46, 1.15, 0.36], "capsule", [-0.04, 0, -0.02])}

      {/* CALVES (Gastrocnemius & Soleus) */}
      {muscle("calves", [-0.42, -2.52, -0.04], [0.38, 0.88, 0.36], "capsule", [0.02, 0, 0.03])}
      {muscle("calves", [0.42, -2.52, -0.04], [0.38, 0.88, 0.36], "capsule", [0.02, 0, -0.03])}
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
    root.current.position.y = 0.15 + breath * 0.015;
  });

  return (
    <group ref={root} position={[0, 0.15, 0]}>
      {/* 3D Polygonal Mesh Body */}
      <Suspense fallback={null}>
        <Realistic3DHumanMesh />
      </Suspense>

      {/* Interactive Muscle Layers */}
      <InteractiveMuscleZones
        selected={selected}
        hovered={hovered}
        onHover={onHover}
        onSelect={onSelect}
      />

      {/* Floating 3D Telemetry Label */}
      {label && (
        <Html position={[0, 3.25, 0]} center style={{ pointerEvents: "none" }}>
          <div className="body-float-label">
            <span className="pulse-dot" />
            {muscleLibrary[label].anatomicalName}
          </div>
        </Html>
      )}
    </group>
  );
}
