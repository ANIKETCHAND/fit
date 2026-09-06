import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useReducedMotion, AnimatePresence } from "framer-motion";
import { BodyControls, type BodyView } from "./BodyControls";
import { CyberHumanBody } from "./CyberHumanBody";
import { FloatingBadges } from "./FloatingBadges";
import { MuscleCalloutCard } from "./MuscleCalloutCard";
import { DietLedgerCard } from "./DietLedgerCard";
import { type MuscleId, muscleLibrary } from "@/lib/fitness-data";
import { useIsMobile } from "@/hooks/useMobile";

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
      
      {/* Cinematic Cyber Lighting */}
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

      {/* Cybernetic Human Body Model */}
      <CyberHumanBody
        selected={selected}
        hovered={hovered}
        onHover={onHover}
        onSelect={onSelected}
      />

      {/* Ambient Neon Floating Sparkles */}
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

      {/* Camera Controls */}
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

// Coordinate mappings for the dynamic speech-bubble callout card
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

  return (
    <section
      className="relative w-full h-full min-h-[640px] flex flex-col justify-between overflow-hidden select-none"
      style={{
        backgroundColor: "#050806",
        backgroundImage:
          "linear-gradient(rgba(186, 255, 87, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(186, 255, 87, 0.04) 1px, transparent 1px)",
        backgroundSize: "36px 36px",
      }}
      aria-label="Interactive 3D anatomy holographic explorer"
    >
      {/* ─── 1. FLOATING 3D BADGES (KETTLEBELL TOP-LEFT, STOPWATCH TOP-RIGHT, SUPPLEMENT LOWER-RIGHT) ─── */}
      <FloatingBadges />

      {/* ─── 2. INTERACTIVE 3D MUSCLE CALLOUT CARD (ATTACHED TO SELECTED MUSCLE) ─── */}
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

      {/* Mobile-optimized callout position */}
      <div className="absolute top-18 left-4 z-30 pointer-events-none sm:hidden">
        <AnimatePresence mode="wait">
          <MuscleCalloutCard key={currentMuscle.id} muscle={currentMuscle} />
        </AnimatePresence>
      </div>

      {/* ─── 3. THREE.JS 3D CANVAS (CYBER HUMAN BODY + PLATFORM + LIGHTING) ─── */}
      <div className="absolute inset-0 z-0">
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
      </div>

      {/* ─── 4. BOTTOM HUD: FROSTED GLASS DIET LEDGER CARD (ENERGY, PROTEIN, CARBS, FATS) ─── */}
      <div className="relative z-20 w-full max-w-sm sm:max-w-md p-4 sm:p-5 mt-auto">
        <DietLedgerCard />
      </div>

      {/* ─── 5. CAMERA CONTROLS (FRONT / BACK / SIDE / ROTATE) ─── */}
      <div className="absolute bottom-4 right-4 z-20">
        <BodyControls
          view={view}
          autoRotate={autoRotate}
          onView={setView}
          onReset={reset}
          onToggleRotate={() => setAutoRotate((state) => !state)}
        />
      </div>
    </section>
  );
}
