import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { type MuscleId, muscleLibrary } from "@/lib/fitness-data";

interface CyberHumanBodyProps {
  selected: MuscleId;
  hovered: MuscleId | null;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
}

export function CyberHumanBody({ selected, hovered, onHover, onSelect }: CyberHumanBodyProps) {
  const root = useRef<THREE.Group>(null);
  const reduceMotion = useReducedMotion() ?? false;

  // Gentle anatomical breathing animation
  useFrame(({ clock }) => {
    if (!root.current || reduceMotion) return;
    const t = clock.elapsedTime;
    const breathe = Math.sin(t * 1.4);
    root.current.position.y = 0.08 + breathe * 0.015;
  });

  return (
    <group ref={root} position={[0, 0.08, 0]}>
      {/* 1. CYBERNETIC GROUND PEDESTAL & CONCENTRIC GLOW RINGS */}
      <CyberPedestal />

      {/* 2. BASE ANATOMICAL WIREFRAME SILHOUETTE (HEAD, TORSO, LIMBS) */}
      <HologramBase />

      {/* 3. INTERACTIVE MUSCLE GROUPS (QUADS, CHEST, SHOULDERS, ABS, ETC.) */}
      <InteractiveMuscles
        selected={selected}
        hovered={hovered}
        onHover={onHover}
        onSelect={onSelect}
      />
    </group>
  );
}

// ─── CYBERNETIC PEDESTAL ───
function CyberPedestal() {
  const ringsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ringsRef.current) {
      ringsRef.current.rotation.z = clock.elapsedTime * 0.12;
    }
  });

  return (
    <group position={[0, -3.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer faint floor grid disc */}
      <mesh position={[0, 0, -0.05]}>
        <circleGeometry args={[3.2, 48]} />
        <meshBasicMaterial color="#0b1712" transparent opacity={0.7} />
      </mesh>

      {/* Matrix grid circular rings */}
      <group ref={ringsRef}>
        <mesh>
          <ringGeometry args={[2.0, 2.03, 64]} />
          <meshBasicMaterial color="#baff57" transparent opacity={0.25} />
        </mesh>
        <mesh>
          <ringGeometry args={[2.4, 2.415, 64]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} />
        </mesh>
        <mesh>
          <ringGeometry args={[1.5, 1.52, 48]} />
          <meshBasicMaterial color="#baff57" transparent opacity={0.35} />
        </mesh>
        {/* Concentric spoke ticks */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const x1 = Math.cos(rad) * 1.95;
          const y1 = Math.sin(rad) * 1.95;
          const x2 = Math.cos(rad) * 2.45;
          const y2 = Math.sin(rad) * 2.45;
          return (
            <line key={deg}>
              <bufferGeometry
                attach="geometry"
                onUpdate={(self) => {
                  const pts = new Float32Array([x1, y1, 0, x2, y2, 0]);
                  self.setAttribute("position", new THREE.BufferAttribute(pts, 3));
                }}
              />
              <lineBasicMaterial attach="material" color="#baff57" transparent opacity={0.22} />
            </line>
          );
        })}
      </group>

      {/* Inner glowing platform disc */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[1.48, 48]} />
        <meshBasicMaterial color="#baff57" transparent opacity={0.06} />
      </mesh>
    </group>
  );
}

// ─── HOLOGRAPHIC ANATOMICAL BASE MESH (TRANSLUCENT + WIREFRAME OVERLAY) ───
function HologramBase() {
  return (
    <group>
      {/* HEAD & CRANIUM WITH FACIAL CONTOUR MESH */}
      <group position={[0, 2.82, 0]}>
        {/* Core cranium */}
        <mesh castShadow>
          <sphereGeometry args={[0.48, 28, 24]} />
          <meshStandardMaterial
            color="#0f1d16"
            emissive="#0a1610"
            emissiveIntensity={0.6}
            roughness={0.25}
            metalness={0.7}
            transparent
            opacity={0.88}
          />
        </mesh>
        {/* Glowing cyber wireframe grid */}
        <mesh scale={1.018}>
          <sphereGeometry args={[0.48, 20, 16]} />
          <meshBasicMaterial color="#baff57" wireframe transparent opacity={0.22} />
        </mesh>
        {/* Jawline & facial plane contour */}
        <mesh position={[0, -0.22, 0.16]} scale={[0.34, 0.32, 0.32]}>
          <sphereGeometry args={[0.6, 16, 12]} />
          <meshBasicMaterial color="#9ff0a8" wireframe transparent opacity={0.18} />
        </mesh>
      </group>

      {/* CERVICAL SPINE / NECK */}
      <group position={[0, 2.18, 0]}>
        <mesh scale={[0.3, 0.38, 0.3]}>
          <cylinderGeometry args={[0.7, 0.85, 1, 18, 5]} />
          <meshStandardMaterial color="#0f1d16" transparent opacity={0.85} roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh scale={[0.305, 0.385, 0.305]}>
          <cylinderGeometry args={[0.7, 0.85, 1, 14, 4]} />
          <meshBasicMaterial color="#baff57" wireframe transparent opacity={0.2} />
        </mesh>
      </group>

      {/* THORACIC CAGE / RIBS / BACK WALL */}
      <group position={[0, 1.25, -0.02]}>
        {/* Core ribcage volume */}
        <mesh scale={[0.96, 1.15, 0.52]}>
          <sphereGeometry args={[1, 32, 26]} />
          <meshStandardMaterial
            color="#0c1712"
            emissive="#06120b"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={0.75}
            transparent
            opacity={0.88}
          />
        </mesh>
        {/* Wireframe grid overlay */}
        <mesh scale={[0.975, 1.165, 0.535]}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshBasicMaterial color="#86efac" wireframe transparent opacity={0.16} />
        </mesh>
      </group>

      {/* CONTOUR RINGS AROUND TORSO */}
      <group>
        {[1.7, 1.35, 1.0, 0.65, 0.3].map((y, idx) => (
          <mesh key={y} position={[0, y, 0.04]} rotation={[Math.PI / 2, 0, 0]} scale={[1 - idx * 0.04, 0.54, 1]}>
            <torusGeometry args={[0.92 - idx * 0.03, 0.009, 4, 44]} />
            <meshBasicMaterial color="#baff57" transparent opacity={0.22 - idx * 0.03} />
          </mesh>
        ))}
      </group>

      {/* PELVIC GIRDLE & HIPS */}
      <group position={[0, -0.22, 0]}>
        <mesh scale={[0.78, 0.62, 0.44]}>
          <sphereGeometry args={[1, 26, 20]} />
          <meshStandardMaterial color="#0f1d16" transparent opacity={0.88} roughness={0.3} metalness={0.6} />
        </mesh>
        <mesh scale={[0.795, 0.635, 0.455]}>
          <sphereGeometry args={[1, 20, 14]} />
          <meshBasicMaterial color="#86efac" wireframe transparent opacity={0.18} />
        </mesh>
      </group>

      {/* FOREARMS (WITH GLOWING AMBER/ORANGE ACCENT WIREFRAME AS IN SCREENSHOT) */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.62, 0.15, 0.08]} rotation={[0, 0, side * 0.09]}>
          {/* Forearm core */}
          <mesh scale={[0.22, 0.85, 0.22]}>
            <capsuleGeometry args={[0.55, 1.35, 12, 20]} />
            <meshStandardMaterial color="#0f1d16" transparent opacity={0.88} roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Glowing amber/orange wireframe lines (visible in screenshot!) */}
          <mesh scale={[0.235, 0.865, 0.235]}>
            <capsuleGeometry args={[0.55, 1.35, 12, 16]} />
            <meshBasicMaterial color="#f97316" wireframe transparent opacity={0.45} />
          </mesh>
          {/* Outer flexor striations */}
          <mesh position={[side * 0.06, 0, 0.11]} scale={[0.08, 0.72, 0.02]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#fb923c" transparent opacity={0.6} />
          </mesh>
          {/* Hand & knuckles */}
          <mesh position={[side * 0.04, -0.92, 0]} scale={[0.16, 0.28, 0.12]}>
            <sphereGeometry args={[1, 16, 14]} />
            <meshStandardMaterial color="#0f1d16" transparent opacity={0.85} />
          </mesh>
          <mesh position={[side * 0.04, -0.92, 0]} scale={[0.17, 0.29, 0.13]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#86efac" wireframe transparent opacity={0.16} />
          </mesh>
        </group>
      ))}

      {/* KNEE JOINTS & PATELLA */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.44, -2.15, 0.18]}>
          <mesh scale={[0.22, 0.24, 0.18]}>
            <sphereGeometry args={[0.7, 16, 14]} />
            <meshStandardMaterial color="#0f1d16" transparent opacity={0.88} />
          </mesh>
          <mesh scale={[0.23, 0.25, 0.19]}>
            <sphereGeometry args={[0.7, 12, 10]} />
            <meshBasicMaterial color="#baff57" wireframe transparent opacity={0.25} />
          </mesh>
        </group>
      ))}

      {/* CALVES & SHINS (GASTROCNEMIUS TEARDROPS + TIBIALIS) */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.44, -2.85, 0.06]}>
          {/* Calf body */}
          <mesh scale={[0.29, 0.95, 0.3]}>
            <capsuleGeometry args={[0.62, 1.45, 12, 20]} />
            <meshStandardMaterial color="#0f1d16" transparent opacity={0.88} roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Calf wireframe grid */}
          <mesh scale={[0.3, 0.965, 0.31]}>
            <capsuleGeometry args={[0.62, 1.45, 14, 14]} />
            <meshBasicMaterial color="#86efac" wireframe transparent opacity={0.2} />
          </mesh>
          {/* Anterior tibial ridge line */}
          <mesh position={[0, 0, 0.24]} scale={[0.015, 1.1, 0.015]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#baff57" transparent opacity={0.35} />
          </mesh>
          {/* Foot standing on the cyber pedestal */}
          <mesh position={[0, -1.02, 0.24]} scale={[0.34, 0.14, 0.72]}>
            <sphereGeometry args={[1, 16, 14]} />
            <meshStandardMaterial color="#0f1d16" transparent opacity={0.9} />
          </mesh>
          <mesh position={[0, -1.02, 0.24]} scale={[0.35, 0.15, 0.73]}>
            <sphereGeometry args={[1, 12, 10]} />
            <meshBasicMaterial color="#baff57" wireframe transparent opacity={0.22} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── INTERACTIVE MUSCLE HIGHLIGHTS (QUADS GLOWING AS IN SCREENSHOT) ───
interface InteractiveMusclesProps {
  selected: MuscleId;
  hovered: MuscleId | null;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
}

function InteractiveMuscles({ selected, hovered, onHover, onSelect }: InteractiveMusclesProps) {
  return (
    <group>
      {/* ─── QUADRICEPS (HIGHLIGHTED HERO MUSCLE AS IN SCREENSHOT) ─── */}
      <QuadricepsGroup
        active={selected === "quads" || hovered === "quads"}
        onHover={onHover}
        onSelect={onSelect}
      />

      {/* ─── CHEST / PECTORALIS MAJOR ─── */}
      <ChestGroup
        active={selected === "chest" || hovered === "chest"}
        onHover={onHover}
        onSelect={onSelect}
      />

      {/* ─── DELTOIDS / SHOULDERS ─── */}
      <ShouldersGroup
        active={selected === "shoulders" || hovered === "shoulders"}
        onHover={onHover}
        onSelect={onSelect}
      />

      {/* ─── BICEPS ─── */}
      <BicepsGroup
        active={selected === "biceps" || hovered === "biceps"}
        onHover={onHover}
        onSelect={onSelect}
      />

      {/* ─── CORE / ABDOMINALS (6-PACK GRID) ─── */}
      <CoreGroup
        active={selected === "core" || hovered === "core"}
        onHover={onHover}
        onSelect={onSelect}
      />
    </group>
  );
}

// ─── QUADRICEPS: EXACT REPLICA OF SCREENSHOT'S GLOWING NEON/AMBER TEARDROPS ───
function QuadricepsGroup({
  active,
  onHover,
  onSelect,
}: {
  active: boolean;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
}) {
  const meshRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && active) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 3.2) * 0.02;
      meshRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  const onPointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    onHover("quads");
  };

  const onPointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    document.body.style.cursor = "auto";
    onHover(null);
  };

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect("quads");
  };

  return (
    <group
      ref={meshRef}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.45, -1.26, 0.22]}>
          {/* 1. Rectus Femoris (Central teardrop belly) */}
          <mesh position={[0, -0.05, 0.16]} scale={[0.26, 0.74, 0.24]}>
            <capsuleGeometry args={[0.55, 1.25, 14, 24]} />
            <meshStandardMaterial
              color={active ? "#84cc16" : "#2e5637"}
              emissive={active ? "#a3e635" : "#17361f"}
              emissiveIntensity={active ? 1.4 : 0.45}
              roughness={0.2}
              metalness={0.3}
              transparent
              opacity={active ? 0.94 : 0.7}
            />
          </mesh>

          {/* 2. Vastus Lateralis (Outer quad sweep) */}
          <mesh
            position={[side * 0.16, 0.05, 0.08]}
            rotation={[0, 0, side * -0.14]}
            scale={[0.24, 0.76, 0.24]}
          >
            <capsuleGeometry args={[0.55, 1.25, 14, 24]} />
            <meshStandardMaterial
              color={active ? "#eab308" : "#2e5637"}
              emissive={active ? "#f59e0b" : "#17361f"}
              emissiveIntensity={active ? 1.45 : 0.4}
              roughness={0.2}
              metalness={0.3}
              transparent
              opacity={active ? 0.94 : 0.7}
            />
          </mesh>

          {/* 3. Vastus Medialis (Inner quad teardrop above knee) */}
          <mesh
            position={[side * -0.12, -0.26, 0.14]}
            rotation={[0, 0, side * 0.18]}
            scale={[0.22, 0.44, 0.22]}
          >
            <sphereGeometry args={[0.62, 18, 16]} />
            <meshStandardMaterial
              color={active ? "#84cc16" : "#2e5637"}
              emissive={active ? "#baff57" : "#17361f"}
              emissiveIntensity={active ? 1.5 : 0.4}
              roughness={0.2}
              metalness={0.3}
              transparent
              opacity={active ? 0.95 : 0.7}
            />
          </mesh>

          {/* 4. Glowing Dual-Tone Outer Ribbon Contours (Neon Lime + Golden Amber) */}
          {active && (
            <>
              {/* Outer Amber Rim */}
              <mesh position={[side * 0.16, 0.05, 0.16]} rotation={[0, 0, side * -0.14]} scale={[0.27, 0.8, 0.27]}>
                <capsuleGeometry args={[0.55, 1.25, 8, 14]} />
                <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.88} />
              </mesh>

              {/* Inner Lime Contour */}
              <mesh position={[0, -0.05, 0.22]} scale={[0.28, 0.78, 0.26]}>
                <capsuleGeometry args={[0.55, 1.25, 8, 14]} />
                <meshBasicMaterial color="#baff57" wireframe transparent opacity={0.92} />
              </mesh>

              {/* Glowing vertical muscle fiber striations */}
              {[-0.12, -0.04, 0.04, 0.12].map((xOffset, idx) => (
                <mesh
                  key={idx}
                  position={[xOffset, -0.05, 0.29]}
                  scale={[0.012, 0.65, 0.012]}
                >
                  <boxGeometry args={[1, 1, 1]} />
                  <meshBasicMaterial color={idx % 2 === 0 ? "#ffffff" : "#baff57"} transparent opacity={0.9} />
                </mesh>
              ))}
            </>
          )}
        </group>
      ))}
    </group>
  );
}

// ─── CHEST / PECTORALS ───
function ChestGroup({
  active,
  onHover,
  onSelect,
}: {
  active: boolean;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
}) {
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover("chest");
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("chest");
      }}
    >
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.46, 1.48, 0.44]} rotation={[0, 0, side * -0.08]}>
          <mesh scale={[0.44, 0.28, 0.18]}>
            <sphereGeometry args={[1, 24, 20]} />
            <meshStandardMaterial
              color={active ? "#84cc16" : "#1f3b25"}
              emissive={active ? "#baff57" : "#0d2113"}
              emissiveIntensity={active ? 1.3 : 0.35}
              roughness={0.25}
              metalness={0.4}
              transparent
              opacity={active ? 0.95 : 0.65}
            />
          </mesh>
          <mesh scale={[0.45, 0.29, 0.19]}>
            <sphereGeometry args={[1, 16, 12]} />
            <meshBasicMaterial
              color={active ? "#ffffff" : "#baff57"}
              wireframe
              transparent
              opacity={active ? 0.85 : 0.25}
            />
          </mesh>
          {/* Fan-shaped pectoral striations */}
          {active &&
            [0.08, 0, -0.08].map((yOff, i) => (
              <mesh key={i} position={[side * 0.02, yOff, 0.18]} rotation={[0, 0, side * (0.2 - i * 0.15)]} scale={[0.34, 0.015, 0.015]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="#baff57" transparent opacity={0.8} />
              </mesh>
            ))}
        </group>
      ))}
    </group>
  );
}

// ─── DELTOIDS / SHOULDERS ───
function ShouldersGroup({
  active,
  onHover,
  onSelect,
}: {
  active: boolean;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
}) {
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover("shoulders");
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("shoulders");
      }}
    >
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.08, 1.62, 0.02]}>
          <mesh scale={[0.36, 0.44, 0.36]}>
            <sphereGeometry args={[1, 22, 18]} />
            <meshStandardMaterial
              color={active ? "#84cc16" : "#1f3b25"}
              emissive={active ? "#baff57" : "#0d2113"}
              emissiveIntensity={active ? 1.3 : 0.35}
              roughness={0.25}
              metalness={0.4}
              transparent
              opacity={active ? 0.95 : 0.65}
            />
          </mesh>
          <mesh scale={[0.375, 0.455, 0.375]}>
            <sphereGeometry args={[1, 14, 12]} />
            <meshBasicMaterial
              color={active ? "#ffffff" : "#baff57"}
              wireframe
              transparent
              opacity={active ? 0.85 : 0.25}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── BICEPS ───
function BicepsGroup({
  active,
  onHover,
  onSelect,
}: {
  active: boolean;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
}) {
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover("biceps");
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("biceps");
      }}
    >
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 1.25, 0.88, 0.16]} rotation={[-0.08, 0, side * -0.1]}>
          <mesh scale={[0.22, 0.58, 0.22]}>
            <capsuleGeometry args={[0.55, 1.1, 12, 20]} />
            <meshStandardMaterial
              color={active ? "#84cc16" : "#1f3b25"}
              emissive={active ? "#baff57" : "#0d2113"}
              emissiveIntensity={active ? 1.3 : 0.35}
              roughness={0.25}
              metalness={0.4}
              transparent
              opacity={active ? 0.95 : 0.65}
            />
          </mesh>
          <mesh scale={[0.235, 0.595, 0.235]}>
            <capsuleGeometry args={[0.55, 1.1, 10, 12]} />
            <meshBasicMaterial
              color={active ? "#ffffff" : "#baff57"}
              wireframe
              transparent
              opacity={active ? 0.85 : 0.25}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── CORE / ABDOMINALS (6-PACK SEGMENTATION) ───
function CoreGroup({
  active,
  onHover,
  onSelect,
}: {
  active: boolean;
  onHover: (id: MuscleId | null) => void;
  onSelect: (id: MuscleId) => void;
}) {
  return (
    <group
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "pointer";
        onHover("core");
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = "auto";
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect("core");
      }}
    >
      {[-0.24, 0.24].map((x) =>
        [0.82, 0.52, 0.22].map((y, idx) => (
          <mesh key={`${x}-${y}`} position={[x, y, 0.44]} scale={[0.19, 0.12, 0.08]}>
            <sphereGeometry args={[1, 16, 14]} />
            <meshStandardMaterial
              color={active ? "#84cc16" : "#1f3b25"}
              emissive={active ? "#baff57" : "#0d2113"}
              emissiveIntensity={active ? 1.25 : 0.35}
              roughness={0.25}
              metalness={0.4}
              transparent
              opacity={active ? 0.95 : 0.65}
            />
          </mesh>
        ))
      )}
      {/* Linea Alba central division line */}
      <mesh position={[0, 0.52, 0.45]} scale={[0.018, 0.74, 0.018]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial color={active ? "#ffffff" : "#baff57"} transparent opacity={active ? 0.85 : 0.3} />
      </mesh>
    </group>
  );
}
