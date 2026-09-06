import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import { BodyControls, type BodyView } from "./BodyControls";
import { HumanBody } from "./HumanBody";
import { type MuscleId, muscleLibrary, getRecoveryStatus } from "@/lib/fitness-data";
import { useIsMobile } from "@/hooks/useMobile";

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

      {/* Floating Active Target Badge */}
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

      {/* Recovery State Color Legend */}
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
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
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
