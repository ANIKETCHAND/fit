/** Kinetic Anatomy Lab: performant React Three Fiber stage with smooth camera positions and muscle selection. */
/* Carbon Command Deck: the 3D body is a layered muscle instrument with scan paths, fiber cues, and direct interaction. */
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sparkles } from "@react-three/drei";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useReducedMotion } from "framer-motion";
import { BodyControls, type BodyView } from "./BodyControls";
import { HumanBody } from "./HumanBody";
import type { MuscleId } from "@/lib/fitness-data";
import { useIsMobile } from "@/hooks/useMobile";

type SceneInnerProps = { view: BodyView; autoRotate: boolean; reduceMotion: boolean; selected: MuscleId; onSelected: (id: MuscleId) => void; isMobile: boolean; };

function SceneInner({ view, autoRotate, reduceMotion, selected, onSelected, isMobile }: SceneInnerProps) {
  const controls = useRef<any>(null);
  const [hovered, setHovered] = useState<MuscleId | null>(null);
  const targetPosition = useMemo(() => {
    const distance = isMobile ? 13.2 : 9.5;
    if (view === "back") return new THREE.Vector3(0, 0.35, -distance);
    if (view === "side") return new THREE.Vector3(distance - .2, 0.35, 0.15);
    return new THREE.Vector3(0, 0.35, distance);
  }, [isMobile, view]);
  const targetLookAt = useMemo(() => new THREE.Vector3(0, 0.15, 0), []);

  useFrame(({ camera }, delta) => {
    const lerp = 1 - Math.exp(-delta * 5.6);
    camera.position.lerp(targetPosition, lerp);
    controls.current?.target.lerp(targetLookAt, lerp);
    controls.current?.update();
  });

  return <>
    <color attach="background" args={["#070908"]} />
    <fog attach="fog" args={["#070908", 5.8, isMobile ? 17.5 : 10.5]} />
    <ambientLight intensity={1.8} color="#d5e8d8" />
    <directionalLight position={[3.8, 5.2, 4]} intensity={4.8} color="#e9ffd9" castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
    <directionalLight position={[-3, 3.5, -4]} intensity={3.6} color="#a6d9ff" />
    <pointLight position={[-4, 1.5, 3]} intensity={5.2} distance={8} color="#76c44e" />
    <pointLight position={[3, -2.4, 3]} intensity={3.2} distance={6} color="#8ec4dd" />
    <group><HumanBody selected={selected} hovered={hovered} onHover={setHovered} onSelect={onSelected} /></group>
    {!reduceMotion && <Sparkles count={32} scale={[5.7, 8.7, 4.2]} size={1.25} speed={0.22} color="#c6ff3d" opacity={0.24} />}
    <mesh position={[0, -4.2, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[2.8, 48]} /><meshBasicMaterial color="#baff57" transparent opacity={0.055} /></mesh>
    <OrbitControls ref={controls} enablePan={false} enableZoom minDistance={6.6} maxDistance={11.8} autoRotate={!reduceMotion && autoRotate} autoRotateSpeed={0.8} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 1.75} minPolarAngle={Math.PI / 3.2} />
  </>;
}

type BodySceneProps = { selected: MuscleId; onSelected: (id: MuscleId) => void; };

export function BodyScene({ selected, onSelected }: BodySceneProps) {
  const [view, setView] = useState<BodyView>("front");
  const [autoRotate, setAutoRotate] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;
  const isMobile = useIsMobile();
  const reset = () => { setView("front"); setAutoRotate(false); };
  return <section className="body-stage" aria-label="Interactive 3D anatomy explorer">
    <div className="stage-topline"><span><i />Anatomy map</span><span className="stage-coordinate">X 31.5 / Y 14.2 / Z 08.7</span></div>
    <div className="scan-grid" aria-hidden="true" /><div className={`anatomy-fiber-map focus-${selected}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /></div><div className="anatomy-ruler ruler-vertical" aria-hidden="true"><i /><i /><i /><i /><i /></div><div className="anatomy-ruler ruler-horizontal" aria-hidden="true"><i /><i /><i /><i /><i /></div><div className="body-crosshair crosshair-x" aria-hidden="true" /><div className="body-crosshair crosshair-y" aria-hidden="true" />
    <div className="body-halo halo-one" aria-hidden="true" /><div className="body-halo halo-two" aria-hidden="true" />
    <div className="anatomy-callout callout-chest" aria-hidden="true"><span>01</span><b>PECTORAL<br />SIGNAL</b><i /></div>
    <div className="anatomy-callout callout-core" aria-hidden="true"><span>02</span><b>CORE<br />LOAD</b><i /></div><div className="anatomy-coordinate-tag tag-one" aria-hidden="true">F-18.03</div><div className="anatomy-coordinate-tag tag-two" aria-hidden="true">T-06.21</div>
    <Canvas dpr={[1, 1.45]} shadows camera={{ position: [0, 0.35, isMobile ? 13.2 : 9.5], fov: isMobile ? 45 : 36 }} gl={{ antialias: true, powerPreference: "high-performance" }}>
      <SceneInner view={view} autoRotate={autoRotate} reduceMotion={reduceMotion} selected={selected} onSelected={onSelected} isMobile={isMobile} />
    </Canvas>
    <BodyControls view={view} autoRotate={autoRotate} onView={setView} onReset={reset} onToggleRotate={() => setAutoRotate((state) => !state)} />
  </section>;
}
