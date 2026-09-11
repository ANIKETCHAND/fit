/**
 * Kinetic Anatomy Lab: 3D Body Scene & Anatomy Visualization
 * Consolidates BodyScene, HumanBody, Muscle, and BodyControls into an integrated Three.js module.
 */
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Sparkles, Edges, Html, useGLTF } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect, Suspense } from "react";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import { Maximize2, RotateCcw, Rotate3D, ScanFace, ScanLine, ScanSearch } from "lucide-react";
import { type MuscleId, muscleLibrary, getRecoveryStatus } from "@/lib/fitness-data";
import { useIsMobile } from "@/hooks/useMobile";

// =============================================================================
// 1. BODY CONTROLS
// =============================================================================

export type BodyView = "front" | "back" | "side";

type BodyControlsProps = {
  view: BodyView;
  autoRotate: boolean;
  onView: (view: BodyView) => void;
  onReset: () => void;
  onToggleRotate: () => void;
};

export function BodyControls({ view, autoRotate, onView, onReset, onToggleRotate }: BodyControlsProps) {
  return (
    <div className="body-controls" aria-label="Body viewer controls">
      <div className="view-picker" role="group" aria-label="Camera view">
        <button className={view === "front" ? "active" : ""} onClick={() => onView("front")} aria-pressed={view === "front"}>
          <ScanFace size={15} /><span>Front</span>
        </button>
        <button className={view === "back" ? "active" : ""} onClick={() => onView("back")} aria-pressed={view === "back"}>
          <ScanLine size={15} /><span>Back</span>
        </button>
        <button className={view === "side" ? "active" : ""} onClick={() => onView("side")} aria-pressed={view === "side"}>
          <ScanSearch size={15} /><span>Side</span>
        </button>
      </div>
      <div className="view-actions">
        <button className={autoRotate ? "active-icon" : ""} onClick={onToggleRotate} aria-label="Toggle automatic rotation" aria-pressed={autoRotate}>
          <Rotate3D size={17} />
        </button>
        <button onClick={onReset} aria-label="Reset body rotation">
          <RotateCcw size={17} />
        </button>
        <button className="desktop-only" onClick={() => document.documentElement.requestFullscreen?.()} aria-label="Enter fullscreen">
          <Maximize2 size={16} />
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// 2. ANATOMICAL MUSCLE SHAPES & GEOMETRIES
// =============================================================================

export type MuscleShape = "sphere" | "capsule" | "box";

export type MuscleProps = {
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

// 1. PECTORALIS MAJOR (CHEST)
function createPecShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.04, 0.44);
  s.bezierCurveTo(0.24, 0.46, 0.52, 0.42, 0.74, 0.28);
  s.bezierCurveTo(0.82, 0.12, 0.78, -0.10, 0.68, -0.24);
  s.bezierCurveTo(0.48, -0.34, 0.20, -0.32, 0.04, -0.24);
  s.lineTo(0.04, 0.44);
  return s;
}

// 2. RECTUS ABDOMINIS SEGMENT (CORE 6-PACK)
function createAbBlockShape(w = 0.25, h = 0.21, r = 0.04): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// 3. LOWER ABDOMEN V-PLATE (CORE)
function createLowerAbShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.25, 0.14);
  s.lineTo(0.25, 0.14);
  s.bezierCurveTo(0.20, -0.08, 0.12, -0.26, 0.0, -0.42);
  s.bezierCurveTo(-0.12, -0.26, -0.20, -0.08, -0.25, 0.14);
  return s;
}

// 4. EXTERNAL OBLIQUE (CORE)
function createObliqueShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.02, 0.55);
  s.bezierCurveTo(0.20, 0.42, 0.26, 0.15, 0.22, -0.20);
  s.bezierCurveTo(0.18, -0.44, 0.06, -0.60, -0.08, -0.66);
  s.bezierCurveTo(-0.02, -0.38, 0.02, -0.08, -0.08, 0.24);
  s.bezierCurveTo(-0.06, 0.42, -0.02, 0.52, 0.02, 0.55);
  return s;
}

// 5. DELTOID CAP (SHOULDERS)
function createDeltoidShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.46);
  s.bezierCurveTo(0.36, 0.40, 0.48, 0.14, 0.40, -0.16);
  s.bezierCurveTo(0.30, -0.38, 0.14, -0.52, 0, -0.60);
  s.bezierCurveTo(-0.14, -0.52, -0.30, -0.38, -0.40, -0.16);
  s.bezierCurveTo(-0.48, 0.14, -0.36, 0.40, 0, 0.46);
  return s;
}

// 6. BICEPS BRACHII (BICEPS)
function createBicepShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.60);
  s.bezierCurveTo(0.18, 0.44, 0.22, 0.10, 0.18, -0.32);
  s.bezierCurveTo(0.13, -0.54, 0.05, -0.64, 0, -0.68);
  s.bezierCurveTo(-0.05, -0.64, -0.13, -0.54, -0.18, -0.32);
  s.bezierCurveTo(-0.22, 0.10, -0.18, 0.44, 0, 0.60);
  return s;
}

// 7. TRICEPS BRACHII (TRICEPS)
function createTricepShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.60);
  s.bezierCurveTo(0.24, 0.46, 0.26, 0.12, 0.20, -0.26);
  s.bezierCurveTo(0.14, -0.54, 0.05, -0.66, 0, -0.70);
  s.bezierCurveTo(-0.05, -0.66, -0.14, -0.54, -0.20, -0.26);
  s.bezierCurveTo(-0.26, 0.12, -0.24, 0.46, 0, 0.60);
  return s;
}

// 8. TRAPEZIUS (BACK)
function createTrapeziusShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.54);
  s.bezierCurveTo(0.28, 0.50, 0.60, 0.38, 0.78, 0.22);
  s.bezierCurveTo(0.52, -0.06, 0.28, -0.32, 0, -0.54);
  s.bezierCurveTo(-0.28, -0.32, -0.52, -0.06, -0.78, 0.22);
  s.bezierCurveTo(-0.60, 0.38, -0.28, 0.50, 0, 0.54);
  return s;
}

// 9. LATISSIMUS DORSI (BACK)
function createLatissimusShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.05, 0.66);
  s.bezierCurveTo(0.32, 0.70, 0.64, 0.60, 0.80, 0.38);
  s.bezierCurveTo(0.70, 0.05, 0.52, -0.34, 0.26, -0.64);
  s.bezierCurveTo(0.14, -0.68, 0.08, -0.60, 0.05, -0.50);
  s.lineTo(0.05, 0.66);
  return s;
}

// 10. GLUTEUS MAXIMUS (GLUTES)
function createGluteShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.04, 0.44);
  s.bezierCurveTo(0.30, 0.48, 0.58, 0.36, 0.60, 0.08);
  s.bezierCurveTo(0.62, -0.28, 0.42, -0.50, 0.15, -0.48);
  s.bezierCurveTo(0.04, -0.46, 0.03, -0.16, 0.04, 0.44);
  return s;
}

// 11. RECTUS FEMORIS (QUADS)
function createQuadRectusShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.72);
  s.bezierCurveTo(0.19, 0.54, 0.21, 0.12, 0.17, -0.34);
  s.bezierCurveTo(0.13, -0.60, 0.06, -0.74, 0, -0.78);
  s.bezierCurveTo(-0.06, -0.74, -0.13, -0.60, -0.17, -0.34);
  s.bezierCurveTo(-0.21, 0.12, -0.19, 0.54, 0, 0.72);
  return s;
}

// 12. VASTUS LATERALIS (QUADS)
function createVastusLateralisShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.02, 0.66);
  s.bezierCurveTo(0.28, 0.52, 0.36, 0.14, 0.30, -0.28);
  s.bezierCurveTo(0.24, -0.56, 0.08, -0.70, -0.04, -0.72);
  s.bezierCurveTo(0.02, -0.46, 0.05, 0.12, 0.02, 0.66);
  return s;
}

// 13. VASTUS MEDIALIS (QUADS - TEARDROP)
function createVastusMedialisShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.0, 0.34);
  s.bezierCurveTo(0.20, 0.24, 0.24, -0.05, 0.16, -0.30);
  s.bezierCurveTo(0.08, -0.44, -0.02, -0.44, -0.09, -0.34);
  s.bezierCurveTo(-0.13, -0.16, -0.09, 0.19, 0.0, 0.34);
  return s;
}

// 14. HAMSTRINGS
function createHamstringShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.19, 0.70);
  s.bezierCurveTo(0.0, 0.74, 0.19, 0.70, 0.23, 0.66);
  s.bezierCurveTo(0.28, 0.26, 0.25, -0.28, 0.17, -0.68);
  s.bezierCurveTo(0.0, -0.74, -0.13, -0.72, -0.17, -0.68);
  s.bezierCurveTo(-0.25, -0.28, -0.27, 0.26, -0.19, 0.70);
  return s;
}

// 15. GASTROCNEMIUS (CALVES - REAR TWIN-HEAD)
function createGastrocnemiusShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.56);
  s.bezierCurveTo(0.30, 0.50, 0.38, 0.24, 0.30, -0.10);
  s.bezierCurveTo(0.20, -0.38, 0.09, -0.62, 0.03, -0.72);
  s.bezierCurveTo(-0.03, -0.72, -0.20, -0.38, -0.30, -0.10);
  s.bezierCurveTo(-0.38, 0.24, -0.30, 0.50, 0, 0.56);
  return s;
}

// 16. ANTERIOR TIBIALIS (CALVES - FRONT SHIN)
function createAnteriorCalfShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0.54);
  s.bezierCurveTo(0.20, 0.46, 0.24, 0.12, 0.16, -0.26);
  s.bezierCurveTo(0.10, -0.52, 0.04, -0.68, 0, -0.72);
  s.bezierCurveTo(-0.04, -0.72, -0.10, -0.52, -0.16, -0.26);
  s.bezierCurveTo(-0.24, 0.12, -0.20, 0.46, 0, 0.54);
  return s;
}

// Extrusion Settings
const STANDARD_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.08,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.024,
  bevelThickness: 0.035,
};

const THICK_EXTRUDE: THREE.ExtrudeGeometryOptions = {
  depth: 0.12,
  bevelEnabled: true,
  bevelSegments: 4,
  steps: 1,
  bevelSize: 0.03,
  bevelThickness: 0.045,
};

function useAnatomyGeometries() {
  return useMemo(() => {
    return {
      pec: new THREE.ExtrudeGeometry(createPecShape(), THICK_EXTRUDE),
      abBlock: new THREE.ExtrudeGeometry(createAbBlockShape(0.25, 0.21, 0.04), STANDARD_EXTRUDE),
      lowerAb: new THREE.ExtrudeGeometry(createLowerAbShape(), STANDARD_EXTRUDE),
      oblique: new THREE.ExtrudeGeometry(createObliqueShape(), STANDARD_EXTRUDE),
      deltoid: new THREE.ExtrudeGeometry(createDeltoidShape(), THICK_EXTRUDE),
      bicep: new THREE.ExtrudeGeometry(createBicepShape(), THICK_EXTRUDE),
      tricep: new THREE.ExtrudeGeometry(createTricepShape(), THICK_EXTRUDE),
      trapezius: new THREE.ExtrudeGeometry(createTrapeziusShape(), STANDARD_EXTRUDE),
      lat: new THREE.ExtrudeGeometry(createLatissimusShape(), THICK_EXTRUDE),
      glute: new THREE.ExtrudeGeometry(createGluteShape(), THICK_EXTRUDE),
      quadRectus: new THREE.ExtrudeGeometry(createQuadRectusShape(), THICK_EXTRUDE),
      vastusLat: new THREE.ExtrudeGeometry(createVastusLateralisShape(), THICK_EXTRUDE),
      vastusMed: new THREE.ExtrudeGeometry(createVastusMedialisShape(), THICK_EXTRUDE),
      hamstring: new THREE.ExtrudeGeometry(createHamstringShape(), THICK_EXTRUDE),
      gastrocnemius: new THREE.ExtrudeGeometry(createGastrocnemiusShape(), THICK_EXTRUDE),
      anteriorCalf: new THREE.ExtrudeGeometry(createAnteriorCalfShape(), STANDARD_EXTRUDE),
    };
  }, []);
}

type AnatomicalPlateProps = {
  id: MuscleId;
  geometry: THREE.BufferGeometry;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  active: boolean;
  baseColor: string;
  emissiveColor: string;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
};

function AnatomicalPlate({
  id,
  geometry,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  active,
  baseColor,
  emissiveColor,
  onHover,
  onSelect,
}: AnatomicalPlateProps) {
  const enter = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    onHover(id);
  };

  const leave = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "auto";
    onHover(null);
  };

  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(id);
  };

  return (
    <mesh
      geometry={geometry}
      position={position}
      rotation={rotation}
      scale={scale}
      onPointerOver={enter}
      onPointerOut={leave}
      onClick={click}
      renderOrder={2}
      castShadow
    >
      <meshStandardMaterial
        color={baseColor}
        emissive={emissiveColor}
        emissiveIntensity={active ? 0.95 : 0.46}
        roughness={0.34}
        metalness={0.16}
        transparent
        opacity={active ? 0.98 : 0.88}
      />
      <Edges
        scale={1.012}
        color={active ? "#ffffff" : "#0d1410"}
        threshold={15}
        transparent
        opacity={active ? 0.96 : 0.60}
      />
    </mesh>
  );
}

type AnatomicalMuscleGroupProps = {
  id: MuscleId;
  hovered: boolean;
  selected: boolean;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
  children: (props: {
    active: boolean;
    baseColor: string;
    emissiveColor: string;
    plateProps: {
      id: MuscleId;
      active: boolean;
      baseColor: string;
      emissiveColor: string;
      onHover: (id: MuscleId | null) => void;
      onSelect: (id: MuscleId) => void;
    };
  }) => React.ReactNode;
};

function AnatomicalMuscleGroup({
  id,
  hovered,
  selected,
  onHover,
  onSelect,
  children,
}: AnatomicalMuscleGroupProps) {
  const active = hovered || selected;
  const groupRef = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const muscleData = muscleLibrary[id];
  const score = muscleData?.score ?? 100;
  const recovery = getRecoveryStatus(score);

  useFrame(({ clock }) => {
    if (!groupRef.current || reduceMotion) return;
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 3.8) * 0.028 : 1;
    groupRef.current.scale.set(pulse, pulse, pulse);
  });

  const baseColor = recovery.color;
  const emissiveColor = active ? recovery.color : recovery.emissive;

  const plateProps = {
    id,
    active,
    baseColor,
    emissiveColor,
    onHover,
    onSelect,
  };

  return <group ref={groupRef}>{children({ active, baseColor, emissiveColor, plateProps })}</group>;
}

// Fallback generic Muscle component for backwards-compatibility
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
  const score = muscleData?.score ?? 100;
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

// =============================================================================
// 3. HUMAN BODY ARCHITECTURE & ATHLETIC MANNEQUIN BASE
// =============================================================================

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

function ContourRings() {
  return (
    <group>
      {[1.66, 1.32, 0.96, 0.58].map((y, index) => (
        <mesh key={y} position={[0, y, 0.505]} scale={[1.05 - index * 0.08, 0.7, 1]}>
          <torusGeometry args={[0.84 - index * 0.06, 0.012, 5, 48]} />
          <meshBasicMaterial color="#9bcf86" transparent opacity={0.08} />
        </mesh>
      ))}
      {[-0.65, -0.98, -1.33, -1.72, -2.13].map((y) => (
        <mesh key={y} position={[0, y, 0.46]} scale={[0.64, 0.72, 1]}>
          <torusGeometry args={[0.72, 0.01, 5, 36]} />
          <meshBasicMaterial color="#7dab70" transparent opacity={0.06} />
        </mesh>
      ))}
    </group>
  );
}

function MuscleFiberDetail({ selected }: { selected: MuscleId }) {
  const strip = (key: string, position: [number, number, number], scale: [number, number, number], rotation = 0, region: MuscleId = "chest", opacity = 0.2) => (
    <mesh key={key} position={position} rotation={[0, 0, rotation]} scale={scale}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color={selected === region ? "#dfffa8" : "#a6d9ff"} transparent opacity={selected === region ? Math.min(opacity + 0.16, 0.42) : opacity * 0.72} />
    </mesh>
  );
  return (
    <group>
      {[-0.64, -0.51, -0.38, -0.25].map((x, index) => strip(`l-pec-${x}`, [x, 1.42 + index * 0.035, 0.62], [0.38, 0.018, 0.014], -0.22 + index * 0.08, "chest", 0.25))}
      {[0.64, 0.51, 0.38, 0.25].map((x, index) => strip(`r-pec-${x}`, [x, 1.42 + index * 0.035, 0.62], [0.38, 0.018, 0.014], 0.22 - index * 0.08, "chest", 0.25))}
      {[-0.15, 0.15].map((x) => [0.70, 0.45, 0.20].map((y, index) => strip(`core-${x}-${y}`, [x, y, 0.62], [0.18, 0.014, 0.014], 0, "core", 0.22 - index * 0.025)))}
      {[-1, 1].map((side) => [-0.14, 0.05, 0.22].map((offset, index) => strip(`shoulder-${side}-${index}`, [side * 1.08, 1.62 + offset, 0.35], [0.22, 0.016, 0.014], side * (0.35 - index * 0.12), "shoulders", 0.2)))}
      {[-1, 1].map((side) => [-0.36, -0.05, 0.26].map((offset, index) => strip(`arm-${side}-${index}`, [side * 1.24, 0.86 + offset, 0.38], [0.018, 0.24, 0.014], side * 0.1, "biceps", 0.17)))}
      {[-0.44, 0.44].map((x) => [-1.28, -1.55, -1.82].map((y, index) => strip(`quad-${x}-${y}`, [x, y, 0.46], [0.045, 0.22, 0.014], x < 0 ? -0.12 : 0.12, "quads", 0.18 - index * 0.015)))}
      {[-0.43, 0.43].map((x) => [-2.70, -2.95].map((y, index) => strip(`calf-${x}-${y}`, [x, y, 0.32], [0.035, 0.18, 0.014], x < 0 ? -0.08 : 0.08, "calves", 0.14 - index * 0.01)))}
    </group>
  );
}

function MannequinMaterial() {
  return (
    <meshStandardMaterial
      color="#121714"
      emissive="#090d0a"
      emissiveIntensity={0.35}
      roughness={0.62}
      metalness={0.22}
    />
  );
}

function BodyBase() {
  return (
    <group>
      {/* Head: athletic cranium and jawline */}
      <mesh position={[0, 2.78, 0]} castShadow>
        <sphereGeometry args={[0.50, 32, 32]} />
        <MannequinMaterial />
        <Edges scale={1.008} color="#1c251f" threshold={20} />
      </mesh>
      {/* Jaw / chin taper */}
      <mesh position={[0, 2.46, 0.10]} scale={[0.34, 0.28, 0.32]} castShadow>
        <sphereGeometry args={[1, 24, 24]} />
        <MannequinMaterial />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 2.12, 0]} scale={[0.32, 0.42, 0.32]} castShadow>
        <cylinderGeometry args={[0.9, 1.0, 1, 24]} />
        <MannequinMaterial />
      </mesh>
      {/* Torso core underlay (shows behind sternum, linea alba, spine furrow) */}
      <mesh position={[0, 1.18, -0.01]} scale={[0.98, 1.15, 0.46]} castShadow>
        <cylinderGeometry args={[0.92, 0.80, 1, 32]} />
        <MannequinMaterial />
      </mesh>
      {/* Pelvic / groin notch (athletic dark brief contour matching the reference image) */}
      <mesh position={[0, -0.28, 0.02]} scale={[0.70, 0.58, 0.40]} castShadow>
        <cylinderGeometry args={[0.82, 0.65, 1, 28]} />
        <MannequinMaterial />
      </mesh>
      {/* Bilateral limbs underlay */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {/* Shoulder joint notch */}
          <mesh position={[side * 1.02, 1.62, 0]} scale={[0.26, 0.26, 0.26]}>
            <sphereGeometry args={[1, 18, 18]} />
            <MannequinMaterial />
          </mesh>
          {/* Upper arm bone core */}
          <mesh position={[side * 1.22, 0.85, 0]} rotation={[0, 0, -side * 0.14]} scale={[0.22, 0.72, 0.22]}>
            <cylinderGeometry args={[0.7, 0.65, 1, 20]} />
            <MannequinMaterial />
          </mesh>
          {/* Elbow joint notch */}
          <mesh position={[side * 1.34, 0.32, 0]} scale={[0.20, 0.20, 0.20]}>
            <sphereGeometry args={[1, 16, 16]} />
            <MannequinMaterial />
          </mesh>
          {/* Forearms extending down */}
          <mesh position={[side * 1.50, -0.20, 0.02]} rotation={[0, 0, side * 0.12]} scale={[0.18, 0.85, 0.20]} castShadow>
            <cylinderGeometry args={[0.75, 0.55, 1, 20]} />
            <MannequinMaterial />
          </mesh>
          {/* Wrist & Sculpted Hand */}
          <mesh position={[side * 1.68, -1.02, 0.03]} rotation={[0, 0, side * 0.15]} scale={[0.16, 0.36, 0.12]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <MannequinMaterial />
          </mesh>
          {/* Femur / Thigh core */}
          <mesh position={[side * 0.44, -1.45, 0]} scale={[0.36, 1.15, 0.38]}>
            <cylinderGeometry args={[0.85, 0.70, 1, 24]} />
            <MannequinMaterial />
          </mesh>
          {/* Knee joint notch (Patellar notch in front, Popliteal fossa in rear) */}
          <mesh position={[side * 0.43, -2.12, 0.02]} scale={[0.30, 0.18, 0.32]}>
            <cylinderGeometry args={[0.82, 0.78, 1, 24]} />
            <MannequinMaterial />
            <Edges scale={1.01} color="#1c251f" threshold={15} />
          </mesh>
          {/* Shin & calf bone core */}
          <mesh position={[side * 0.43, -2.78, 0]} scale={[0.26, 1.05, 0.26]}>
            <cylinderGeometry args={[0.75, 0.60, 1, 20]} />
            <MannequinMaterial />
          </mesh>
          {/* Ankle joint */}
          <mesh position={[side * 0.43, -3.48, 0.02]} scale={[0.22, 0.14, 0.24]}>
            <cylinderGeometry args={[0.7, 0.65, 1, 16]} />
            <MannequinMaterial />
          </mesh>
          {/* Athletic foot extending forward */}
          <mesh position={[side * 0.43, -3.82, 0.22]} scale={[0.36, 0.16, 0.76]} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <MannequinMaterial />
            <Edges scale={1.01} color="#1c251f" threshold={20} />
          </mesh>
        </group>
      ))}
      <ContourRings />
    </group>
  );
}

function AnatomyFallback({ selected, hovered, onHover, onSelect }: Omit<HumanBodyProps, "modelUrl" | "useDetailedModel">) {
  const geoms = useAnatomyGeometries();

  return (
    <>
      <BodyBase />
      <MuscleFiberDetail selected={selected} />

      {/* 1. CHEST (Pectoralis Major) */}
      <AnatomicalMuscleGroup id="chest" hovered={hovered === "chest"} selected={selected === "chest"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.pec}
              position={[0, 1.42, 0.48]}
              rotation={[0.05, 0.12, -0.03]}
              scale={[1, 1, 1]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.pec}
              position={[0, 1.42, 0.48]}
              rotation={[0.05, -0.12, 0.03]}
              scale={[-1, 1, 1]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 2. CORE (Rectus Abdominis 6-Pack, Lower V-Plate & External Obliques) */}
      <AnatomicalMuscleGroup id="core" hovered={hovered === "core"} selected={selected === "core"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            <AnatomicalPlate {...plateProps} geometry={geoms.abBlock} position={[-0.15, 0.70, 0.52]} />
            <AnatomicalPlate {...plateProps} geometry={geoms.abBlock} position={[0.15, 0.70, 0.52]} />
            <AnatomicalPlate {...plateProps} geometry={geoms.abBlock} position={[-0.15, 0.45, 0.52]} />
            <AnatomicalPlate {...plateProps} geometry={geoms.abBlock} position={[0.15, 0.45, 0.52]} />
            <AnatomicalPlate {...plateProps} geometry={geoms.abBlock} position={[-0.15, 0.20, 0.51]} />
            <AnatomicalPlate {...plateProps} geometry={geoms.abBlock} position={[0.15, 0.20, 0.51]} />
            <AnatomicalPlate {...plateProps} geometry={geoms.lowerAb} position={[0, -0.02, 0.48]} />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.oblique}
              position={[-0.50, 0.35, 0.36]}
              rotation={[0.05, -0.38, -0.08]}
              scale={[-1, 1, 1]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.oblique}
              position={[0.50, 0.35, 0.36]}
              rotation={[0.05, 0.38, 0.08]}
              scale={[1, 1, 1]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 3. SHOULDERS (Deltoids - Anterior & Posterior Heads) */}
      <AnatomicalMuscleGroup id="shoulders" hovered={hovered === "shoulders"} selected={selected === "shoulders"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.deltoid}
              position={[-1.08, 1.62, 0.06]}
              rotation={[0.10, -0.22, 0.18]}
              scale={[0.85, 0.85, 0.85]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.deltoid}
              position={[1.08, 1.62, 0.06]}
              rotation={[0.10, 0.22, -0.18]}
              scale={[0.85, 0.85, 0.85]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.deltoid}
              position={[-1.05, 1.62, -0.12]}
              rotation={[-0.10, 0.22, 0.18]}
              scale={[0.82, 0.82, 0.82]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.deltoid}
              position={[1.05, 1.62, -0.12]}
              rotation={[-0.10, -0.22, -0.18]}
              scale={[0.82, 0.82, 0.82]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 4. BICEPS (Biceps Brachii) */}
      <AnatomicalMuscleGroup id="biceps" hovered={hovered === "biceps"} selected={selected === "biceps"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.bicep}
              position={[-1.24, 0.86, 0.16]}
              rotation={[-0.08, 0, -0.14]}
              scale={[0.85, 0.95, 0.85]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.bicep}
              position={[1.24, 0.86, 0.16]}
              rotation={[-0.08, 0, 0.14]}
              scale={[0.85, 0.95, 0.85]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 5. TRICEPS (Triceps Brachii) */}
      <AnatomicalMuscleGroup id="triceps" hovered={hovered === "triceps"} selected={selected === "triceps"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.tricep}
              position={[-1.24, 0.84, -0.16]}
              rotation={[0.08, 0, -0.14]}
              scale={[0.88, 0.95, 0.88]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.tricep}
              position={[1.24, 0.84, -0.16]}
              rotation={[0.08, 0, 0.14]}
              scale={[0.88, 0.95, 0.88]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 6. BACK (Trapezius & Latissimus Dorsi V-Taper Wings) */}
      <AnatomicalMuscleGroup id="back" hovered={hovered === "back"} selected={selected === "back"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.trapezius}
              position={[0, 1.70, -0.38]}
              rotation={[-0.06, 0, 0]}
              scale={[0.88, 0.88, 0.88]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.lat}
              position={[0, 0.95, -0.36]}
              rotation={[-0.04, -0.08, 0]}
              scale={[1, 1, 1]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.lat}
              position={[0, 0.95, -0.36]}
              rotation={[-0.04, 0.08, 0]}
              scale={[-1, 1, 1]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 7. GLUTES (Gluteus Maximus Butterfly Cheeks) */}
      <AnatomicalMuscleGroup id="glutes" hovered={hovered === "glutes"} selected={selected === "glutes"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.glute}
              position={[0, -0.34, -0.38]}
              rotation={[-0.08, 0.12, 0.04]}
              scale={[-1, 1, 1]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.glute}
              position={[0, -0.34, -0.38]}
              rotation={[-0.08, -0.12, -0.04]}
              scale={[1, 1, 1]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 8. QUADS (Quadriceps Femoris - Rectus, Vastus Lat, Vastus Med Teardrop) */}
      <AnatomicalMuscleGroup id="quads" hovered={hovered === "quads"} selected={selected === "quads"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            {/* Left Thigh */}
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.quadRectus}
              position={[-0.44, -1.45, 0.35]}
              rotation={[0.04, 0, 0.03]}
              scale={[0.9, 0.9, 0.9]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.vastusLat}
              position={[-0.44, -1.45, 0.33]}
              rotation={[0.04, -0.15, 0.03]}
              scale={[-0.9, 0.9, 0.9]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.vastusMed}
              position={[-0.32, -1.75, 0.36]}
              rotation={[0.04, 0.20, -0.04]}
              scale={[-0.9, 0.9, 0.9]}
            />
            {/* Right Thigh */}
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.quadRectus}
              position={[0.44, -1.45, 0.35]}
              rotation={[0.04, 0, -0.03]}
              scale={[0.9, 0.9, 0.9]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.vastusLat}
              position={[0.44, -1.45, 0.33]}
              rotation={[0.04, 0.15, -0.03]}
              scale={[0.9, 0.9, 0.9]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.vastusMed}
              position={[0.32, -1.75, 0.36]}
              rotation={[0.04, -0.20, 0.04]}
              scale={[0.9, 0.9, 0.9]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 9. HAMSTRINGS (Biceps Femoris & Posterior Thigh Columns) */}
      <AnatomicalMuscleGroup id="hamstrings" hovered={hovered === "hamstrings"} selected={selected === "hamstrings"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.hamstring}
              position={[-0.44, -1.45, -0.34]}
              rotation={[0.04, 0.06, 0.02]}
              scale={[0.92, 0.92, 0.92]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.hamstring}
              position={[0.44, -1.45, -0.34]}
              rotation={[0.04, -0.06, -0.02]}
              scale={[0.92, 0.92, 0.92]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>

      {/* 10. CALVES (Gastrocnemius Twin-Heads Rear & Anterior Tibialis Front) */}
      <AnatomicalMuscleGroup id="calves" hovered={hovered === "calves"} selected={selected === "calves"} onHover={onHover} onSelect={onSelect}>
        {({ plateProps }) => (
          <>
            {/* Anterior Front Calves */}
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.anteriorCalf}
              position={[-0.43, -2.80, 0.20]}
              rotation={[0.04, 0, 0]}
              scale={[0.85, 0.85, 0.85]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.anteriorCalf}
              position={[0.43, -2.80, 0.20]}
              rotation={[0.04, 0, 0]}
              scale={[0.85, 0.85, 0.85]}
            />
            {/* Posterior Twin-Head Gastrocnemius */}
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.gastrocnemius}
              position={[-0.43, -2.75, -0.22]}
              rotation={[-0.04, 0.04, 0]}
              scale={[0.88, 0.88, 0.88]}
            />
            <AnatomicalPlate
              {...plateProps}
              geometry={geoms.gastrocnemius}
              position={[0.43, -2.75, -0.22]}
              rotation={[-0.04, -0.04, 0]}
              scale={[0.88, 0.88, 0.88]}
            />
          </>
        )}
      </AnatomicalMuscleGroup>
    </>
  );
}

export function HumanBody({ selected, hovered, onHover, onSelect, modelUrl = BODY_MODEL_PATH, useDetailedModel = false }: HumanBodyProps) {
  const label = hovered ?? selected;
  const root = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion() ?? false;
  useFrame(({ clock }) => {
    if (!root.current || reduceMotion) return;
    const breath = Math.sin(clock.elapsedTime * 1.2);
    root.current.position.y = 0.45 + breath * 0.022;
    root.current.scale.setScalar(1 + breath * 0.006);
  });
  return (
    <group ref={root} position={[0, 0.45, 0]}>
      {useDetailedModel ? (
        <Suspense fallback={<AnatomyFallback selected={selected} hovered={hovered} onHover={onHover} onSelect={onSelect} />}>
          <DetailedModel modelUrl={modelUrl} />
        </Suspense>
      ) : (
        <AnatomyFallback selected={selected} hovered={hovered} onHover={onHover} onSelect={onSelect} />
      )}
      {label && (
        <Html position={[0, 3.86, 0]} center style={{ pointerEvents: "none" }}>
          <div className="body-float-label"><span className="pulse-dot" />{muscleLibrary[label].anatomicalName}</div>
        </Html>
      )}
    </group>
  );
}

// =============================================================================
// 4. MAIN BODY SCENE
// =============================================================================

type SceneInnerProps = {
  view: BodyView;
  autoRotate: boolean;
  reduceMotion: boolean;
  selected: MuscleId;
  onSelected: (id: MuscleId) => void;
  isMobile: boolean;
  recoveryTick?: number;
};

function SceneInner({ view, autoRotate, reduceMotion, selected, onSelected, isMobile, recoveryTick }: SceneInnerProps) {
  const controls = useRef<any>(null);
  const [hovered, setHovered] = useState<MuscleId | null>(null);
  const isTransitioning = useRef<boolean>(false);
  const prevView = useRef<BodyView>(view);

  const getTargetPosition = (v: BodyView) => {
    const distance = isMobile ? 12.0 : 8.5;
    if (v === "back") return new THREE.Vector3(0, 0.35, -distance);
    if (v === "side") return new THREE.Vector3(distance - 0.2, 0.35, 0.15);
    return new THREE.Vector3(0, 0.35, distance);
  };

  const targetLookAt = useMemo(() => new THREE.Vector3(0, 0.15, 0), []);

  useEffect(() => {
    if (prevView.current !== view) {
      prevView.current = view;
      isTransitioning.current = true;
    }
  }, [view]);

  useFrame(({ camera }, delta) => {
    if (isTransitioning.current) {
      const targetPos = getTargetPosition(view);
      const lerp = 1 - Math.exp(-delta * 6.5);
      camera.position.lerp(targetPos, lerp);
      controls.current?.target.lerp(targetLookAt, lerp);
      controls.current?.update();

      if (camera.position.distanceTo(targetPos) < 0.05) {
        camera.position.copy(targetPos);
        isTransitioning.current = false;
      }
    }
  });

  return (
    <>
      <color attach="background" args={["#070908"]} />
      <fog attach="fog" args={["#070908", 6.0, isMobile ? 18.0 : 12.0]} />
      <ambientLight intensity={1.8} color="#d5e8d8" />
      <directionalLight
        position={[3.8, 5.2, 4]}
        intensity={5.2}
        color="#e9ffd9"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, 1.5, 3]} intensity={7.2} distance={8} color="#76c44e" />
      <pointLight position={[3, -2.4, 3]} intensity={3.2} distance={6} color="#8ec4dd" />
      <group>
        <HumanBody key={recoveryTick} selected={selected} hovered={hovered} onHover={setHovered} onSelect={onSelected} />
      </group>
      {!reduceMotion && (
        <Sparkles count={28} scale={[5.7, 8.7, 4.2]} size={1.2} speed={0.22} color="#c6ff3d" opacity={0.22} />
      )}
      <mesh position={[0, -3.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.38, 48]} />
        <meshBasicMaterial color="#baff57" transparent opacity={0.055} />
      </mesh>
      <OrbitControls
        ref={controls}
        enablePan={false}
        enableZoom
        minDistance={4.5}
        maxDistance={14.0}
        autoRotate={!reduceMotion && autoRotate}
        autoRotateSpeed={1.0}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={1.1}
        minPolarAngle={0.08}
        maxPolarAngle={Math.PI - 0.08}
        onStart={() => {
          isTransitioning.current = false;
        }}
      />
    </>
  );
}

type BodySceneProps = {
  selected: MuscleId;
  onSelected: (id: MuscleId) => void;
};

export function BodyScene({ selected, onSelected }: BodySceneProps) {
  const [view, setView] = useState<BodyView>("front");
  const [autoRotate, setAutoRotate] = useState(false);
  const [recoveryTick, setRecoveryTick] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleUpdate = () => setRecoveryTick((t) => t + 1);
    window.addEventListener("fittrack:recovery-update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("fittrack:recovery-update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const reset = () => {
    setView("front");
    setAutoRotate(false);
  };

  const currentMuscle = muscleLibrary[selected] || muscleLibrary.chest;
  const recovery = getRecoveryStatus(currentMuscle.score);

  return (
    <section className="body-stage" aria-label="Interactive 3D anatomy explorer">
      <div className="stage-topline">
        <span>
          <i />
          3D Muscle Recovery Map
        </span>
        <span className="stage-coordinate font-mono text-[10px] text-[#8b9c8a]">
          360° Anatomical Simulation
        </span>
      </div>

      <div className="absolute top-12 left-4 z-10 pointer-events-none bg-[#080d0a]/90 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-2 shadow-lg">
        <span
          className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
          style={{ background: recovery.color, boxShadow: `0 0 8px ${recovery.color}` }}
        />
        <div className="flex flex-col">
          <span className="font-mono text-[10px] text-[#edf4e9] font-bold uppercase tracking-wider flex items-center gap-1.5">
            {currentMuscle.label}
            <span
              className="text-[9px] px-1.5 py-0.2 rounded font-mono font-semibold"
              style={{ background: `${recovery.color}20`, color: recovery.color, border: `1px solid ${recovery.color}40` }}
            >
              {currentMuscle.score}% {recovery.label}
            </span>
          </span>
        </div>
      </div>

      <div className="absolute top-12 right-4 z-10 hidden sm:flex items-center gap-3 bg-[#080d0a]/85 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-[#8b9c8a] shadow-lg">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" /> Ready
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Recovering
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[#ef4444]" /> Rest
        </span>
      </div>

      <div className="scan-grid" aria-hidden="true" />
      <div className={`anatomy-fiber-map focus-${selected}`} aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>
      <Canvas
        dpr={[1, 1.45]}
        shadows
        camera={{ position: [0, 0.35, isMobile ? 12.5 : 8.8], fov: isMobile ? 45 : 36 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <SceneInner
          view={view}
          autoRotate={autoRotate}
          reduceMotion={reduceMotion}
          selected={selected}
          onSelected={onSelected}
          isMobile={isMobile}
          recoveryTick={recoveryTick}
        />
      </Canvas>
      <BodyControls
        view={view}
        autoRotate={autoRotate}
        onView={setView}
        onReset={reset}
        onToggleRotate={() => setAutoRotate((state) => !state)}
      />
    </section>
  );
}
