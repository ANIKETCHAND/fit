import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useReducedMotion, AnimatePresence } from "framer-motion";
import { BodyControls, type BodyView } from "./BodyControls";
import { CyberHumanBody } from "./CyberHumanBody";
import { SketchfabBodyViewer } from "./SketchfabBodyViewer";
import { FloatingBadges } from "./FloatingBadges";
import { MuscleCalloutCard } from "./MuscleCalloutCard";
import { DietLedgerCard } from "./DietLedgerCard";
import { type MuscleId, muscleLibrary } from "@/lib/fitness-data";
import { useIsMobile } from "@/hooks/useMobile";
import { Box, Eye } from "lucide-react";

type SceneInnerProps = {
  view: BodyView;
  autoRotate: boolean;
  reduceMotion: boolean;
  selected: MuscleId;
  hovered: MuscleId | null;
  onSelected: (id: MuscleId) => void;
  onHover: (id: MuscleId | null) => void;
  isMobile: boolean;
};

function SceneInner({
  view,
  autoRotate,
  reduceMotion,
  selected,
  hovered,
  onSelected,
  onHover,
  isMobile,
}: SceneInnerProps) {
  const controls = useRef<any>(null);
  const isTransitioning = useRef<boolean>(false);
  const prevView = useRef<BodyView>(view);

  const getTargetPosition = (v: BodyView) => {
    const distance = isMobile ? 12.0 : 8.4;
    if (v === "back") return new THREE.Vector3(0, 0.25, -distance);
    if (v === "side") return new THREE.Vector3(distance - 0.2, 0.25, 0.15);
    return new THREE.Vector3(0, 0.25, distance);
  };

  const targetLookAt = useMemo(() => new THREE.Vector3(0, -0.1, 0), []);

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
      <color attach="background" args={["#050806"]} />
      <fog attach="fog" args={["#050806", 5.5, isMobile ? 16.0 : 13.0]} />

      <ambientLight intensity={1.5} color="#d1fae5" />
      <directionalLight
        position={[3.5, 6, 4.5]}
        intensity={4.5}
        color="#f0fdf4"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight position={[-4, 1.8, 3.5]} intensity={6.0} distance={9} color="#84cc16" />
      <pointLight position={[3.5, -1.8, 3]} intensity={4.5} distance={8} color="#38bdf8" />
      <pointLight position={[0, 4.5, -3.5]} intensity={3.0} distance={7} color="#a3e635" />

      <CyberHumanBody
        selected={selected}
        hovered={hovered}
        onHover={onHover}
        onSelect={onSelected}
      />

      {!reduceMotion && (
        <Sparkles
          count={36}
          scale={[5.5, 8.5, 4.5]}
          size={1.3}
          speed={0.25}
          color="#baff57"
          opacity={0.3}
        />
      )}

      <OrbitControls
        ref={controls}
        enablePan={false}
        enableZoom
        minDistance={4.5}
        maxDistance={13.5}
        autoRotate={!reduceMotion && autoRotate}
        autoRotateSpeed={0.9}
        enableDamping
        dampingFactor={0.06}
        rotateSpeed={1.0}
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI - 0.1}
        onStart={() => {
          isTransitioning.current = false;
        }}
      />
    </>
  );
}

// Coordinate mappings for the callout card
const CALLOUT_POSITIONS: Record<MuscleId, { top: string; left: string }> = {
  quads: { top: "43%", left: "52%" },
  hamstrings: { top: "43%", left: "52%" },
  chest: { top: "22%", left: "53%" },
  shoulders: { top: "18%", left: "56%" },
  biceps: { top: "30%", left: "60%" },
  triceps: { top: "30%", left: "60%" },
  core: { top: "33%", left: "53%" },
  back: { top: "25%", left: "53%" },
  glutes: { top: "38%", left: "53%" },
  calves: { top: "56%", left: "53%" },
};

type BodySceneProps = {
  selected: MuscleId;
  onSelected: (id: MuscleId) => void;
};

export function BodyScene({ selected, onSelected }: BodySceneProps) {
  // Mode toggle: "sketchfab" (Human Body - Ripped Male embed) vs "cyber" (Holographic Wireframe)
  const [renderMode, setRenderMode] = useState<"sketchfab" | "cyber">("sketchfab");
  const [view, setView] = useState<BodyView>("front");
  const [autoRotate, setAutoRotate] = useState(false);
  const [hovered, setHovered] = useState<MuscleId | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const isMobile = useIsMobile();

  const reset = () => {
    setView("front");
    setAutoRotate(false);
  };

  const activeMuscleId = hovered || selected;
  const currentMuscle = muscleLibrary[activeMuscleId] || muscleLibrary.quads;
  const calloutPos = CALLOUT_POSITIONS[activeMuscleId] || CALLOUT_POSITIONS.quads;

  const quickMuscles: { id: MuscleId; label: string }[] = [
    { id: "quads", label: "Quads" },
    { id: "chest", label: "Chest" },
    { id: "core", label: "Core" },
    { id: "biceps", label: "Biceps" },
    { id: "shoulders", label: "Delts" },
    { id: "back", label: "Back" },
  ];

  return (
    <section
      className="relative w-full h-full min-h-[640px] flex flex-col justify-between overflow-hidden select-none"
      style={{
        backgroundColor: "#050806",
        backgroundImage:
          "linear-gradient(rgba(186, 255, 87, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(186, 255, 87, 0.04) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
      aria-label="Interactive 3D anatomy explorer"
    >
      {/* ─── 1. MODE SELECTOR (SKETCHFAB 3D RIPPED MALE vs CYBER WIREFRAME) ─── */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-1 bg-[#09110d]/85 backdrop-blur-md border border-white/10 rounded-xl p-1 shadow-xl">
        <button
          onClick={() => setRenderMode("sketchfab")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            renderMode === "sketchfab"
              ? "bg-[#baff57] text-[#050806] shadow-md shadow-[#baff57]/20"
              : "text-[#8b9c8a] hover:text-white hover:bg-white/5"
          }`}
        >
          <Box size={13} />
          <span>3D Ripped Male</span>
        </button>
        <button
          onClick={() => setRenderMode("cyber")}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-1.5 ${
            renderMode === "cyber"
              ? "bg-[#baff57] text-[#050806] shadow-md shadow-[#baff57]/20"
              : "text-[#8b9c8a] hover:text-white hover:bg-white/5"
          }`}
        >
          <Eye size={13} />
          <span>Cyber Wireframe</span>
        </button>
      </div>

      {/* ─── 2. FLOATING 3D BADGES (KETTLEBELL, STOPWATCH, SUPPLEMENT JAR) ─── */}
      <FloatingBadges />

      {/* ─── 3. QUICK MUSCLE SELECTOR CHIPS ─── */}
      <div className="absolute top-16 left-6 z-20 pointer-events-auto hidden md:flex items-center gap-1.5 bg-[#09110d]/75 backdrop-blur-md border border-white/10 rounded-xl px-2 py-1.5 shadow-lg">
        {quickMuscles.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onSelected(id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-all ${
              selected === id
                ? "bg-[#baff57]/20 border border-[#baff57]/40 text-[#baff57] font-bold"
                : "text-[#8b9c8a] hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ─── 4. INTERACTIVE 3D MUSCLE CALLOUT CARD (ATTACHED TO SELECTED MUSCLE) ─── */}
      <div
        className="absolute z-30 pointer-events-none hidden sm:block transition-all duration-300 ease-out"
        style={{
          top: calloutPos.top,
          left: calloutPos.left,
        }}
      >
        <AnimatePresence mode="wait">
          <MuscleCalloutCard key={currentMuscle.id} muscle={currentMuscle} />
        </AnimatePresence>
      </div>

      {/* Mobile-optimized callout card */}
      <div className="absolute top-20 left-4 z-30 pointer-events-none sm:hidden">
        <AnimatePresence mode="wait">
          <MuscleCalloutCard key={currentMuscle.id} muscle={currentMuscle} />
        </AnimatePresence>
      </div>

      {/* ─── 5. 3D MODEL CANVAS OR SKETCHFAB 3D EMBED ─── */}
      <div className="absolute inset-0 z-0">
        {renderMode === "sketchfab" ? (
          <SketchfabBodyViewer />
        ) : (
          <Canvas
            dpr={[1, 1.5]}
            shadows
            camera={{ position: [0, 0.25, isMobile ? 12.0 : 8.4], fov: isMobile ? 46 : 38 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <SceneInner
              view={view}
              autoRotate={autoRotate}
              reduceMotion={reduceMotion}
              selected={selected}
              hovered={hovered}
              onSelected={onSelected}
              onHover={setHovered}
              isMobile={isMobile}
            />
          </Canvas>
        )}
      </div>

      {/* ─── 6. BOTTOM HUD: FROSTED GLASS DIET LEDGER CARD ─── */}
      <div className="relative z-20 w-full max-w-sm sm:max-w-md p-4 sm:p-5 mt-auto">
        <DietLedgerCard />
      </div>

      {/* ─── 7. CAMERA CONTROLS (AVAILABLE IN CYBER MODE) ─── */}
      {renderMode === "cyber" && (
        <div className="absolute bottom-4 right-4 z-20">
          <BodyControls
            view={view}
            autoRotate={autoRotate}
            onView={setView}
            onReset={reset}
            onToggleRotate={() => setAutoRotate((state) => !state)}
          />
        </div>
      )}
    </section>
  );
}
