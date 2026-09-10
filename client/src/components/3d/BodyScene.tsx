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
// 2. MUSCLE COMPONENT
// =============================================================================

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
// 3. HUMAN BODY ARCHITECTURE
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
          <meshBasicMaterial color="#9bcf86" transparent opacity={0.12} />
        </mesh>
      ))}
      {[-0.65, -0.98, -1.33, -1.72, -2.13].map((y) => (
        <mesh key={y} position={[0, y, 0.46]} scale={[0.64, 0.72, 1]}>
          <torusGeometry args={[0.72, 0.01, 5, 36]} />
          <meshBasicMaterial color="#7dab70" transparent opacity={0.1} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, -0.51]} scale={[0.08, 2.16, 0.06]}>
        <capsuleGeometry args={[0.42, 3.35, 8, 12]} />
        <meshBasicMaterial color="#b4dca1" transparent opacity={0.16} />
      </mesh>
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
      {[-0.64, -0.51, -0.38, -0.25].map((x, index) => strip(`l-pec-${x}`, [x, 1.42 + index * 0.035, 0.81], [0.42, 0.022, 0.018], -0.22 + index * 0.08, "chest", 0.25))}
      {[0.64, 0.51, 0.38, 0.25].map((x, index) => strip(`r-pec-${x}`, [x, 1.42 + index * 0.035, 0.81], [0.42, 0.022, 0.018], 0.22 - index * 0.08, "chest", 0.25))}
      {[-0.26, 0.26].map((x) => [-0.02, -0.24, -0.46].map((y, index) => strip(`core-${x}-${y}`, [x, y, 0.59], [0.19, 0.016, 0.018], 0, "core", 0.22 - index * 0.025)))}
      {[-1, 1].map((side) => [-0.14, 0.05, 0.22].map((offset, index) => strip(`shoulder-${side}-${index}`, [side * 1.08, 1.65 + offset, 0.39], [0.25, 0.018, 0.017], side * (0.4 - index * 0.12), "shoulders", 0.2)))}
      {[-1, 1].map((side) => [-0.36, -0.05, 0.26].map((offset, index) => strip(`arm-${side}-${index}`, [side * 1.28, 0.83 + offset, 0.49], [0.022, 0.27, 0.017], side * 0.1, "biceps", 0.17)))}
      {[-0.45, 0.45].map((x) => [-1.28, -1.6, -1.92, -2.24].map((y, index) => strip(`quad-${x}-${y}`, [x, y, 0.52], [0.05, 0.27, 0.017], x < 0 ? -0.14 : 0.14, "quads", 0.18 - index * 0.015)))}
      {[-0.43, 0.43].map((x) => [-2.72, -3.02].map((y, index) => strip(`calf-${x}-${y}`, [x, y, 0.47], [0.04, 0.19, 0.017], x < 0 ? -0.1 : 0.1, "calves", 0.14 - index * 0.01)))}
      <mesh position={[0, 1.42, 0.825]} scale={[0.018, 0.49, 0.018]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color="#dffabf" transparent opacity={0.38} />
      </mesh>
    </group>
  );
}

function BaseMaterial() {
  return <meshStandardMaterial color="#2c5435" emissive="#245132" emissiveIntensity={0.75} roughness={0.42} metalness={0.17} />;
}

function BodyBase() {
  return (
    <group>
      <mesh position={[0, 2.78, 0]} castShadow><sphereGeometry args={[0.53, 30, 30]} /><meshStandardMaterial color="#2e5637" emissive="#17361f" emissiveIntensity={0.48} roughness={0.5} metalness={0.12} /></mesh>
      <mesh position={[0, 2.12, 0]} scale={[0.34, 0.4, 0.34]} castShadow><sphereGeometry args={[1, 22, 22]} /><BaseMaterial /></mesh>
      <mesh position={[0, 1.22, -0.02]} scale={[1.06, 1.18, 0.49]} castShadow><sphereGeometry args={[1, 36, 28]} /><BaseMaterial /></mesh>
      <mesh position={[0, 1.22, -0.015]} scale={[1.075, 1.195, 0.5]}><sphereGeometry args={[1, 24, 18]} /><meshBasicMaterial color="#c6ff3d" wireframe transparent opacity={0.085} /></mesh>
      <mesh position={[0, -0.1, 0]} scale={[0.72, 0.63, 0.42]} castShadow><sphereGeometry args={[1, 32, 24]} /><BaseMaterial /></mesh>
      <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.78, 0.012, 5, 52]} /><meshBasicMaterial color="#c6ff3d" transparent opacity={0.3} /></mesh>
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh position={[side * 1.16, 1.08, 0]} rotation={[0, 0, -side * 0.16]} scale={[0.26, 0.95, 0.26]} castShadow><capsuleGeometry args={[0.65, 1.55, 12, 22]} /><BaseMaterial /></mesh>
          <mesh position={[side * 1.55, -0.18, 0]} rotation={[0, 0, side * 0.08]} scale={[0.2, 0.82, 0.22]} castShadow><capsuleGeometry args={[0.65, 1.45, 12, 22]} /><BaseMaterial /></mesh>
          <mesh position={[side * 1.7, -1.1, 0.02]} scale={[0.22, 0.32, 0.16]} castShadow><sphereGeometry args={[1, 20, 20]} /><BaseMaterial /></mesh>
          <mesh position={[side * 0.43, -1.38, 0]} scale={[0.43, 1.2, 0.44]} castShadow><capsuleGeometry args={[0.74, 1.8, 12, 22]} /><BaseMaterial /></mesh>
          <mesh position={[side * 0.42, -2.78, 0]} scale={[0.3, 1.1, 0.31]} castShadow><capsuleGeometry args={[0.62, 1.8, 12, 22]} /><BaseMaterial /></mesh>
          <mesh position={[side * 0.43, -3.85, 0.23]} scale={[0.43, 0.16, 0.78]} castShadow><sphereGeometry args={[1, 20, 20]} /><BaseMaterial /></mesh>
        </group>
      ))}
      <ContourRings />
    </group>
  );
}

function AnatomyFallback({ selected, hovered, onHover, onSelect }: Omit<HumanBodyProps, "modelUrl" | "useDetailedModel">) {
  const muscle = (id: MuscleId, position: [number, number, number], scale: [number, number, number], rotation?: [number, number, number], shape?: "sphere" | "capsule" | "box") => (
    <Muscle key={`${id}-${position.join("-")}`} id={id} position={position} scale={scale} rotation={rotation} shape={shape} selected={selected === id} hovered={hovered === id} onHover={onHover} onSelect={onSelect} />
  );
  return (
    <>
      <BodyBase />
      <MuscleFiberDetail selected={selected} />
      {muscle("chest", [-0.47, 1.66, 0.58], [0.46, 0.2, 0.17], [0.04, 0, 0.16])}
      {muscle("chest", [0.47, 1.66, 0.58], [0.46, 0.2, 0.17], [0.04, 0, -0.16])}
      {muscle("chest", [-0.49, 1.4, 0.62], [0.49, 0.24, 0.19], [0.04, 0, 0.1])}
      {muscle("chest", [0.49, 1.4, 0.62], [0.49, 0.24, 0.19], [0.04, 0, -0.1])}
      {muscle("chest", [-0.38, 1.14, 0.59], [0.4, 0.18, 0.16], [0.05, 0, 0.05])}
      {muscle("chest", [0.38, 1.14, 0.59], [0.4, 0.18, 0.16], [0.05, 0, -0.05])}
      {muscle("shoulders", [-1.05, 1.67, 0.03], [0.43, 0.46, 0.39])}
      {muscle("shoulders", [1.05, 1.67, 0.03], [0.43, 0.46, 0.39])}
      {muscle("biceps", [-1.26, 0.86, 0.28], [0.25, 0.63, 0.22], [-0.1, 0, -0.12], "capsule")}
      {muscle("biceps", [1.26, 0.86, 0.28], [0.25, 0.63, 0.22], [-0.1, 0, 0.12], "capsule")}
      {muscle("triceps", [-1.27, 0.83, -0.27], [0.27, 0.65, 0.21], [0.08, 0, -0.12], "capsule")}
      {muscle("triceps", [1.27, 0.83, -0.27], [0.27, 0.65, 0.21], [0.08, 0, 0.12], "capsule")}
      {[-0.3, 0.3].map((x) => [-0.4, 0.2, 0.76].map((y) => muscle("core", [x, y, 0.48], [0.24, 0.25, 0.18], [0, 0, x * -0.12])))}
      {muscle("back", [-0.62, 1.01, -0.44], [0.61, 0.87, 0.17], [0, 0, -0.12])}
      {muscle("back", [0.62, 1.01, -0.44], [0.61, 0.87, 0.17], [0, 0, 0.12])}
      {muscle("glutes", [-0.44, -0.3, -0.42], [0.48, 0.47, 0.22])}
      {muscle("glutes", [0.44, -0.3, -0.42], [0.48, 0.47, 0.22])}
      {muscle("quads", [-0.43, -1.5, 0.42], [0.38, 0.84, 0.26], [0.04, 0, 0.04], "capsule")}
      {muscle("quads", [0.43, -1.5, 0.42], [0.38, 0.84, 0.26], [0.04, 0, -0.04], "capsule")}
      {muscle("hamstrings", [-0.43, -1.5, -0.4], [0.37, 0.85, 0.23], [0.04, 0, 0.04], "capsule")}
      {muscle("hamstrings", [0.43, -1.5, -0.4], [0.37, 0.85, 0.23], [0.04, 0, -0.04], "capsule")}
      {muscle("calves", [-0.43, -2.9, 0.22], [0.28, 0.68, 0.2], [-0.05, 0, 0.03], "capsule")}
      {muscle("calves", [0.43, -2.9, 0.22], [0.28, 0.68, 0.2], [-0.05, 0, -0.03], "capsule")}
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
};

function SceneInner({ view, autoRotate, reduceMotion, selected, onSelected, isMobile }: SceneInnerProps) {
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
        <HumanBody selected={selected} hovered={hovered} onHover={setHovered} onSelect={onSelected} />
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
  const reduceMotion = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
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
