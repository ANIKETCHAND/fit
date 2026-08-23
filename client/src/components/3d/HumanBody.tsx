import { Html, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Muscle, type MuscleShape } from "./Muscle";
import { muscleLibrary, type MuscleId } from "@/lib/fitness-data";

export const BODY_MODEL_PATH = "/models/body.glb";

type HumanBodyProps = {
  selected: MuscleId;
  hovered: MuscleId | null;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
  modelUrl?: string;
  useDetailedModel?: boolean;
};

function DetailedModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clonedScene} position={[0, -2.72, 0]} scale={2.35} />;
}

// Athletic Base Material
function BaseMaterial({ opacity = 0.92 }: { opacity?: number }) {
  return (
    <meshStandardMaterial
      color="#1e3826"
      emissive="#122418"
      emissiveIntensity={0.42}
      roughness={0.42}
      metalness={0.16}
      transparent
      opacity={opacity}
    />
  );
}

// Bone / Fascia Structural Elements (Clavicles, Sternum, Patella)
function SkeletalFascia() {
  return (
    <group>
      {/* Clavicle Collarbones */}
      <mesh position={[-0.48, 1.84, 0.28]} rotation={[0, 0, -0.1]} castShadow>
        <capsuleGeometry args={[0.045, 0.72, 8, 16]} />
        <meshStandardMaterial color="#477353" roughness={0.3} metalness={0.2} emissive="#1f3b25" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[0.48, 1.84, 0.28]} rotation={[0, 0, 0.1]} castShadow>
        <capsuleGeometry args={[0.045, 0.72, 8, 16]} />
        <meshStandardMaterial color="#477353" roughness={0.3} metalness={0.2} emissive="#1f3b25" emissiveIntensity={0.5} />
      </mesh>

      {/* Sternal Midline Ridge */}
      <mesh position={[0, 1.42, 0.36]} scale={[0.035, 0.65, 0.04]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#bdf542" transparent opacity={0.35} />
      </mesh>

      {/* Linea Alba (Abdominal Center Seam) */}
      <mesh position={[0, 0.45, 0.38]} scale={[0.022, 1.25, 0.03]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#a6d9ff" transparent opacity={0.25} />
      </mesh>

      {/* Left & Right Knee Patellas */}
      <mesh position={[-0.44, -2.18, 0.42]} scale={[0.16, 0.18, 0.14]} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#40694a" roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh position={[0.44, -2.18, 0.42]} scale={[0.16, 0.18, 0.14]} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#40694a" roughness={0.35} metalness={0.2} />
      </mesh>
    </group>
  );
}

// Aesthetic Athletic Head, Neck, Torso Core, & Limbs Frame
function AthleticBodyFrame() {
  return (
    <group>
      {/* 1. Sculpted Athletic Head (Cranium + Defined Jawline & Chin) */}
      <mesh position={[0, 2.82, 0]} scale={[0.42, 0.52, 0.46]} castShadow>
        <sphereGeometry args={[1, 28, 28]} />
        <BaseMaterial />
      </mesh>
      {/* Jawline & Chin */}
      <mesh position={[0, 2.52, 0.14]} rotation={[0.4, 0, 0]} scale={[0.26, 0.28, 0.28]} castShadow>
        <boxGeometry args={[1, 1, 1, 4, 4, 4]} />
        <BaseMaterial />
      </mesh>

      {/* 2. Muscular Neck (Traps + Sternocleidomastoid) */}
      <mesh position={[0, 2.2, 0]} scale={[0.3, 0.44, 0.32]} castShadow>
        <capsuleGeometry args={[0.7, 0.6, 12, 20]} />
        <BaseMaterial />
      </mesh>

      {/* 3. Deep Ribcage / Thoracic Core (V-Taper Foundation) */}
      <mesh position={[0, 1.34, 0.02]} scale={[0.88, 1.05, 0.52]} castShadow>
        <sphereGeometry args={[1, 28, 24]} />
        <BaseMaterial opacity={0.85} />
      </mesh>

      {/* 4. Tapered Lumbar Waist & Pelvic Core */}
      <mesh position={[0, 0.22, 0.02]} scale={[0.62, 0.82, 0.44]} castShadow>
        <sphereGeometry args={[1, 24, 20]} />
        <BaseMaterial opacity={0.88} />
      </mesh>

      {/* 5. Pelvis / Hips Structure */}
      <mesh position={[0, -0.42, 0]} scale={[0.74, 0.48, 0.46]} castShadow>
        <sphereGeometry args={[1, 24, 20]} />
        <BaseMaterial />
      </mesh>

      {/* 6. Left & Right Forearms (Brachioradialis / Flexors taper to Wrists) */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Forearm */}
          <mesh
            position={[side * 1.58, 0.18, 0.08]}
            rotation={[0, 0, side * 0.1]}
            scale={[0.24, 0.85, 0.24]}
            castShadow
          >
            <capsuleGeometry args={[0.55, 1.35, 12, 20]} />
            <BaseMaterial />
          </mesh>
          {/* Wrist Joint */}
          <mesh position={[side * 1.72, -0.62, 0.08]} scale={[0.16, 0.18, 0.14]} castShadow>
            <sphereGeometry args={[1, 16, 16]} />
            <BaseMaterial />
          </mesh>
          {/* Hand */}
          <mesh position={[side * 1.8, -0.98, 0.08]} scale={[0.18, 0.34, 0.14]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <BaseMaterial />
          </mesh>

          {/* Lower Leg Shin (Tibialis Anterior / Bone shaft) */}
          <mesh position={[side * 0.44, -3.1, 0.08]} scale={[0.26, 1.15, 0.28]} castShadow>
            <capsuleGeometry args={[0.52, 1.6, 12, 20]} />
            <BaseMaterial />
          </mesh>

          {/* Ankle Joint */}
          <mesh position={[side * 0.44, -3.95, 0.05]} scale={[0.22, 0.16, 0.24]} castShadow>
            <sphereGeometry args={[1, 16, 16]} />
            <BaseMaterial />
          </mesh>

          {/* Athletic Foot */}
          <mesh position={[side * 0.44, -4.15, 0.24]} scale={[0.28, 0.16, 0.65]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <BaseMaterial />
          </mesh>
        </group>
      ))}

      {/* Skeletal Fascia highlights */}
      <SkeletalFascia />
    </group>
  );
}

// Full Anatomical Musculature Model
function RealisticAnatomyModel({
  selected,
  hovered,
  onHover,
  onSelect,
}: Omit<HumanBodyProps, "modelUrl" | "useDetailedModel">) {
  const muscle = (
    id: MuscleId,
    position: [number, number, number],
    scale: [number, number, number],
    rotation: [number, number, number] = [0, 0, 0],
    shape: MuscleShape = "sphere"
  ) => (
    <Muscle
      key={`${id}-${position.join("-")}`}
      id={id}
      position={position}
      scale={scale}
      rotation={rotation}
      shape={shape}
      selected={selected === id}
      hovered={hovered === id}
      onHover={onHover}
      onSelect={onSelect}
    />
  );

  return (
    <>
      <AthleticBodyFrame />

      {/* 1. CHEST (Pectoralis Major - Clavicular, Sternal, & Lower fold fan plates) */}
      {/* Left Pec */}
      {muscle("chest", [-0.44, 1.48, 0.36], [0.52, 0.44, 0.42], [0.08, 0.12, -0.06], "pec")}
      {/* Right Pec */}
      {muscle("chest", [0.44, 1.48, 0.36], [0.52, 0.44, 0.42], [0.08, -0.12, 0.06], "pec")}

      {/* 2. SHOULDERS (Deltoids - 3-Headed Rounded Caps Wrapping Socket) */}
      {/* Left Anterior/Lateral Deltoid */}
      {muscle("shoulders", [-1.08, 1.68, 0.06], [0.46, 0.54, 0.48], [0.05, 0, 0.22], "deltoid")}
      {/* Right Anterior/Lateral Deltoid */}
      {muscle("shoulders", [1.08, 1.68, 0.06], [0.46, 0.54, 0.48], [0.05, 0, -0.22], "deltoid")}

      {/* 3. BICEPS (Biceps Brachii - Sculpted Muscle Belly) */}
      {/* Left Bicep */}
      {muscle("biceps", [-1.34, 0.92, 0.16], [0.28, 0.62, 0.26], [-0.08, 0.15, -0.12], "capsule")}
      {/* Right Bicep */}
      {muscle("biceps", [1.34, 0.92, 0.16], [0.28, 0.62, 0.26], [-0.08, -0.15, 0.12], "capsule")}

      {/* 4. TRICEPS (Triceps Brachii - Posterior Lateral/Long Head Horseshoe) */}
      {/* Left Tricep */}
      {muscle("triceps", [-1.36, 0.88, -0.22], [0.3, 0.64, 0.28], [0.08, -0.12, -0.12], "capsule")}
      {/* Right Tricep */}
      {muscle("triceps", [1.36, 0.88, -0.22], [0.3, 0.64, 0.28], [0.08, 0.12, 0.12], "capsule")}

      {/* 5. CORE / ABS (Rectus Abdominis 6-Pack Bricks + External Obliques) */}
      {/* Upper Abs (Pair 1) */}
      {muscle("core", [-0.22, 0.92, 0.38], [0.26, 0.22, 0.22], [0, 0, 0.04], "ab-block")}
      {muscle("core", [0.22, 0.92, 0.38], [0.26, 0.22, 0.22], [0, 0, -0.04], "ab-block")}
      {/* Mid Abs (Pair 2) */}
      {muscle("core", [-0.22, 0.56, 0.4], [0.26, 0.22, 0.22], [0, 0, 0.02], "ab-block")}
      {muscle("core", [0.22, 0.56, 0.4], [0.26, 0.22, 0.22], [0, 0, -0.02], "ab-block")}
      {/* Lower Abs (Pair 3) */}
      {muscle("core", [-0.22, 0.2, 0.38], [0.26, 0.22, 0.22], [0, 0, 0.02], "ab-block")}
      {muscle("core", [0.22, 0.2, 0.38], [0.26, 0.22, 0.22], [0, 0, -0.02], "ab-block")}
      {/* External Obliques / Serratus Flanks */}
      {muscle("core", [-0.58, 0.46, 0.2], [0.28, 0.56, 0.32], [0, 0.2, 0.14], "capsule")}
      {muscle("core", [0.58, 0.46, 0.2], [0.28, 0.56, 0.32], [0, -0.2, -0.14], "capsule")}

      {/* 6. BACK (Latissimus Dorsi V-Taper Wings + Trapezius Diamond) */}
      {/* Trapezius (Diamond Collar) */}
      {muscle("back", [0, 1.95, -0.22], [0.78, 0.62, 0.36], [-0.15, 0, 0], "pec")}
      {/* Left Lat Wing */}
      {muscle("back", [-0.64, 1.12, -0.26], [0.54, 0.78, 0.38], [0, -0.12, -0.14], "lat")}
      {/* Right Lat Wing */}
      {muscle("back", [0.64, 1.12, -0.26], [0.54, 0.78, 0.38], [0, 0.12, 0.14], "lat")}

      {/* 7. GLUTES (Gluteus Maximus - Muscular Posterior Curves) */}
      {/* Left Glute */}
      {muscle("glutes", [-0.38, -0.38, -0.32], [0.46, 0.44, 0.38], [0.1, -0.1, 0.08], "sphere")}
      {/* Right Glute */}
      {muscle("glutes", [0.38, -0.38, -0.32], [0.46, 0.44, 0.38], [0.1, 0.1, -0.08], "sphere")}

      {/* 8. QUADRICEPS (3-Head Architecture: Rectus Femoris + Vastus Lateralis + Vastus Medialis) */}
      {/* Left Quad - Central Rectus Femoris */}
      {muscle("quads", [-0.44, -1.35, 0.32], [0.34, 0.85, 0.32], [0.04, 0, 0.02], "capsule")}
      {/* Left Quad - Outer Vastus Lateralis Sweep */}
      {muscle("quads", [-0.64, -1.3, 0.18], [0.32, 0.78, 0.34], [0, 0.15, 0.14], "quad-outer")}
      {/* Left Quad - Inner Vastus Medialis Teardrop */}
      {muscle("quads", [-0.34, -1.82, 0.36], [0.28, 0.38, 0.28], [0.1, -0.1, -0.08], "quad-inner")}

      {/* Right Quad - Central Rectus Femoris */}
      {muscle("quads", [0.44, -1.35, 0.32], [0.34, 0.85, 0.32], [0.04, 0, -0.02], "capsule")}
      {/* Right Quad - Outer Vastus Lateralis Sweep */}
      {muscle("quads", [0.64, -1.3, 0.18], [0.32, 0.78, 0.34], [0, -0.15, -0.14], "quad-outer")}
      {/* Right Quad - Inner Vastus Medialis Teardrop */}
      {muscle("quads", [0.34, -1.82, 0.36], [0.28, 0.38, 0.28], [0.1, 0.1, 0.08], "quad-inner")}

      {/* 9. HAMSTRINGS (Biceps Femoris & Semitendinosus - Posterior Cords) */}
      {/* Left Hamstring */}
      {muscle("hamstrings", [-0.44, -1.35, -0.28], [0.36, 0.88, 0.32], [-0.04, 0, 0.02], "capsule")}
      {/* Right Hamstring */}
      {muscle("hamstrings", [0.44, -1.35, -0.28], [0.36, 0.88, 0.32], [-0.04, 0, -0.02], "capsule")}

      {/* 10. CALVES (Gastrocnemius - Medial & Lateral Diamond Bellies) */}
      {/* Left Calf */}
      {muscle("calves", [-0.44, -2.85, -0.06], [0.34, 0.75, 0.34], [0.05, 0, 0.04], "calf")}
      {/* Right Calf */}
      {muscle("calves", [0.44, -2.85, -0.06], [0.34, 0.75, 0.34], [0.05, 0, -0.04], "calf")}
    </>
  );
}

export function HumanBody({
  selected,
  hovered,
  onHover,
  onSelect,
  modelUrl = BODY_MODEL_PATH,
  useDetailedModel = false,
}: HumanBodyProps) {
  const label = hovered ?? selected;
  const root = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion() ?? false;

  useFrame(({ clock }) => {
    if (!root.current || reduceMotion) return;
    const breath = Math.sin(clock.elapsedTime * 1.2);
    root.current.position.y = 0.42 + breath * 0.018;
    root.current.scale.setScalar(1 + breath * 0.005);
  });

  return (
    <group ref={root} position={[0, 0.42, 0]}>
      {useDetailedModel ? (
        <Suspense
          fallback={
            <RealisticAnatomyModel
              selected={selected}
              hovered={hovered}
              onHover={onHover}
              onSelect={onSelect}
            />
          }
        >
          <DetailedModel modelUrl={modelUrl} />
        </Suspense>
      ) : (
        <RealisticAnatomyModel
          selected={selected}
          hovered={hovered}
          onHover={onHover}
          onSelect={onSelect}
        />
      )}

      {label && (
        <Html position={[0, 3.82, 0]} center style={{ pointerEvents: "none" }}>
          <div className="body-float-label">
            <span className="pulse-dot" />
            {muscleLibrary[label].anatomicalName}
          </div>
        </Html>
      )}
    </group>
  );
}
