/** Kinetic Anatomy Lab: replaceable human-body architecture with a segmented clinical-performance fallback. */
/* Carbon Command Deck: procedural muscle groups expose contour bands and fiber paths so anatomy reads as a real instrument. */
import { Html, useGLTF } from "@react-three/drei";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { Muscle } from "./Muscle";
import { muscleLibrary, type MuscleId } from "@/lib/fitness-data";

export const BODY_MODEL_PATH = "/models/body.glb";

type HumanBodyProps = { selected: MuscleId; hovered: MuscleId | null; onHover: (id: MuscleId | null) => void; onSelect: (id: MuscleId) => void; modelUrl?: string; useDetailedModel?: boolean; };

function DetailedModel({ modelUrl }: { modelUrl: string }) {
  const { scene } = useGLTF(modelUrl);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={clonedScene} position={[0, -2.72, 0]} scale={2.35} />;
}

function ContourRings() {
  return <group>
    {[1.66, 1.32, 0.96, 0.58].map((y, index) => <mesh key={y} position={[0, y, 0.505]} scale={[1.05 - index * .08, .7, 1]}><torusGeometry args={[0.84 - index * .06, 0.012, 5, 48]} /><meshBasicMaterial color="#9bcf86" transparent opacity={0.12} /></mesh>)}
    {[-.65, -.98, -1.33, -1.72, -2.13].map((y) => <mesh key={y} position={[0, y, 0.46]} scale={[.64, .72, 1]}><torusGeometry args={[0.72, 0.01, 5, 36]} /><meshBasicMaterial color="#7dab70" transparent opacity={0.1} /></mesh>)}
    <mesh position={[0, .42, -0.51]} scale={[.08, 2.16, .06]}><capsuleGeometry args={[.42, 3.35, 8, 12]} /><meshBasicMaterial color="#b4dca1" transparent opacity={0.16} /></mesh>
  </group>;
}

function MuscleFiberDetail({ selected }: { selected: MuscleId }) {
  const strip = (key: string, position: [number, number, number], scale: [number, number, number], rotation = 0, region: MuscleId = "chest", opacity = .2) => <mesh key={key} position={position} rotation={[0, 0, rotation]} scale={scale}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={selected === region ? "#dfffa8" : "#a6d9ff"} transparent opacity={selected === region ? Math.min(opacity + .16, .42) : opacity * .72} /></mesh>;
  return <group>
    {[-.64, -.51, -.38, -.25].map((x, index) => strip(`l-pec-${x}`, [x, 1.42 + index * .035, .81], [.42, .022, .018], -.22 + index * .08, "chest", .25))}
    {[.64, .51, .38, .25].map((x, index) => strip(`r-pec-${x}`, [x, 1.42 + index * .035, .81], [.42, .022, .018], .22 - index * .08, "chest", .25))}
    {[-.26, .26].map((x) => [-.02, -.24, -.46].map((y, index) => strip(`core-${x}-${y}`, [x, y, .59], [.19, .016, .018], 0, "core", .22 - index * .025)))}
    {[-1, 1].map((side) => [-.14, .05, .22].map((offset, index) => strip(`shoulder-${side}-${index}`, [side * 1.08, 1.65 + offset, .39], [.25, .018, .017], side * (.4 - index * .12), "shoulders", .2)))}
    {[-1, 1].map((side) => [-.36, -.05, .26].map((offset, index) => strip(`arm-${side}-${index}`, [side * 1.28, .83 + offset, .49], [.022, .27, .017], side * .1, "biceps", .17)))}
    {[-.45, .45].map((x) => [-1.28, -1.6, -1.92, -2.24].map((y, index) => strip(`quad-${x}-${y}`, [x, y, .52], [.05, .27, .017], x < 0 ? -.14 : .14, "quads", .18 - index * .015)))}
    {[-.43, .43].map((x) => [-2.72, -3.02].map((y, index) => strip(`calf-${x}-${y}`, [x, y, .47], [.04, .19, .017], x < 0 ? -.1 : .1, "calves", .14 - index * .01)))}
    <mesh position={[0, 1.42, .825]} scale={[.018, .49, .018]}><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#dffabf" transparent opacity={.38} /></mesh>
  </group>;
}

function BaseMaterial() {
  return <meshStandardMaterial color="#2c5435" emissive="#245132" emissiveIntensity={0.75} roughness={0.42} metalness={0.17} />;
}

function BodyBase() {
  return <group>
    <mesh position={[0, 2.78, 0]} castShadow><sphereGeometry args={[0.53, 30, 30]} /><meshStandardMaterial color="#2e5637" emissive="#17361f" emissiveIntensity={0.48} roughness={0.5} metalness={0.12} /></mesh>
    <mesh position={[0, 2.12, 0]} scale={[0.34, 0.4, 0.34]} castShadow><sphereGeometry args={[1, 22, 22]} /><BaseMaterial /></mesh>
    <mesh position={[0, 1.22, -0.02]} scale={[1.06, 1.18, 0.49]} castShadow><sphereGeometry args={[1, 36, 28]} /><BaseMaterial /></mesh>
    <mesh position={[0, 1.22, -0.015]} scale={[1.075, 1.195, 0.5]}><sphereGeometry args={[1, 24, 18]} /><meshBasicMaterial color="#c6ff3d" wireframe transparent opacity={0.085} /></mesh>
    <mesh position={[0, -0.1, 0]} scale={[0.72, 0.63, 0.42]} castShadow><sphereGeometry args={[1, 32, 24]} /><BaseMaterial /></mesh>
    <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.78, 0.012, 5, 52]} /><meshBasicMaterial color="#c6ff3d" transparent opacity={0.3} /></mesh>
    {[-1, 1].map((side) => <group key={side}>
      <mesh position={[side * 1.16, 1.08, 0]} rotation={[0, 0, -side * 0.16]} scale={[0.26, 0.95, 0.26]} castShadow><capsuleGeometry args={[0.65, 1.55, 12, 22]} /><BaseMaterial /></mesh>
      <mesh position={[side * 1.55, -0.18, 0]} rotation={[0, 0, side * 0.08]} scale={[0.2, 0.82, 0.22]} castShadow><capsuleGeometry args={[0.65, 1.45, 12, 22]} /><BaseMaterial /></mesh>
      <mesh position={[side * 1.7, -1.1, 0.02]} scale={[0.22, 0.32, 0.16]} castShadow><sphereGeometry args={[1, 20, 20]} /><BaseMaterial /></mesh>
      <mesh position={[side * 0.43, -1.38, 0]} scale={[0.43, 1.2, 0.44]} castShadow><capsuleGeometry args={[0.74, 1.8, 12, 22]} /><BaseMaterial /></mesh>
      <mesh position={[side * 0.42, -2.78, 0]} scale={[0.3, 1.1, 0.31]} castShadow><capsuleGeometry args={[0.62, 1.8, 12, 22]} /><BaseMaterial /></mesh>
      <mesh position={[side * 0.43, -3.85, 0.23]} scale={[0.43, 0.16, 0.78]} castShadow><sphereGeometry args={[1, 20, 20]} /><BaseMaterial /></mesh>
    </group>)}
    <ContourRings />
  </group>;
}

function AnatomyFallback({ selected, hovered, onHover, onSelect }: Omit<HumanBodyProps, "modelUrl" | "useDetailedModel">) {
  const muscle = (id: MuscleId, position: [number, number, number], scale: [number, number, number], rotation?: [number, number, number], shape?: "sphere" | "capsule" | "box") => <Muscle key={`${id}-${position.join("-")}`} id={id} position={position} scale={scale} rotation={rotation} shape={shape} selected={selected === id} hovered={hovered === id} onHover={onHover} onSelect={onSelect} />;
  return <><BodyBase /><MuscleFiberDetail selected={selected} />
    {muscle("chest", [-0.47, 1.66, 0.58], [0.46, 0.2, 0.17], [0.04, 0, .16])}{muscle("chest", [0.47, 1.66, 0.58], [0.46, 0.2, 0.17], [0.04, 0, -.16])}
    {muscle("chest", [-0.49, 1.4, 0.62], [0.49, 0.24, 0.19], [0.04, 0, .1])}{muscle("chest", [0.49, 1.4, 0.62], [0.49, 0.24, 0.19], [0.04, 0, -.1])}
    {muscle("chest", [-0.38, 1.14, 0.59], [0.4, 0.18, 0.16], [0.05, 0, .05])}{muscle("chest", [0.38, 1.14, 0.59], [0.4, 0.18, 0.16], [0.05, 0, -.05])}
    {muscle("shoulders", [-1.05, 1.67, 0.03], [0.43, 0.46, 0.39])}{muscle("shoulders", [1.05, 1.67, 0.03], [0.43, 0.46, 0.39])}
    {muscle("biceps", [-1.26, 0.86, 0.28], [0.25, 0.63, 0.22], [-0.1, 0, -0.12], "capsule")}{muscle("biceps", [1.26, 0.86, 0.28], [0.25, 0.63, 0.22], [-0.1, 0, 0.12], "capsule")}
    {muscle("triceps", [-1.27, 0.83, -0.27], [0.27, 0.65, 0.21], [0.08, 0, -0.12], "capsule")}{muscle("triceps", [1.27, 0.83, -0.27], [0.27, 0.65, 0.21], [0.08, 0, 0.12], "capsule")}
    {[-0.3, 0.3].map((x) => [-0.4, 0.2, 0.76].map((y) => muscle("core", [x, y, 0.48], [0.24, 0.25, 0.18], [0, 0, x * -0.12]))) }
    {muscle("back", [-0.62, 1.01, -0.44], [0.61, 0.87, 0.17], [0, 0, -0.12])}{muscle("back", [0.62, 1.01, -0.44], [0.61, 0.87, 0.17], [0, 0, 0.12])}
    {muscle("glutes", [-0.44, -0.3, -0.42], [0.48, 0.47, 0.22])}{muscle("glutes", [0.44, -0.3, -0.42], [0.48, 0.47, 0.22])}
    {muscle("quads", [-0.43, -1.5, 0.42], [0.38, 0.84, 0.26], [0.04, 0, 0.04], "capsule")}{muscle("quads", [0.43, -1.5, 0.42], [0.38, 0.84, 0.26], [0.04, 0, -0.04], "capsule")}
    {muscle("hamstrings", [-0.43, -1.5, -0.4], [0.37, 0.85, 0.23], [0.04, 0, 0.04], "capsule")}{muscle("hamstrings", [0.43, -1.5, -0.4], [0.37, 0.85, 0.23], [0.04, 0, -0.04], "capsule")}
    {muscle("calves", [-0.43, -2.9, 0.22], [0.28, 0.68, 0.2], [-0.05, 0, 0.03], "capsule")}{muscle("calves", [0.43, -2.9, 0.22], [0.28, 0.68, 0.2], [-0.05, 0, -0.03], "capsule")}
  </>;
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
  return <group ref={root} position={[0, 0.45, 0]}>{useDetailedModel ? <Suspense fallback={<AnatomyFallback selected={selected} hovered={hovered} onHover={onHover} onSelect={onSelect} />}><DetailedModel modelUrl={modelUrl} /></Suspense> : <AnatomyFallback selected={selected} hovered={hovered} onHover={onHover} onSelect={onSelect} />}{label && <Html position={[0, 3.86, 0]} center style={{ pointerEvents: "none" }}><div className="body-float-label"><span className="pulse-dot" />{muscleLibrary[label].anatomicalName}</div></Html>}</group>;
}
