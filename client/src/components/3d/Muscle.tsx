import { Edges } from "@react-three/drei";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useReducedMotion } from "framer-motion";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { MuscleId } from "@/lib/fitness-data";

export type MuscleShape =
  | "sphere"
  | "capsule"
  | "box"
  | "pec"
  | "deltoid"
  | "bicep"
  | "tricep"
  | "ab-block"
  | "oblique"
  | "lat"
  | "trap"
  | "glute"
  | "quad-center"
  | "quad-outer"
  | "quad-inner"
  | "hamstring"
  | "calf";

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
  side?: "left" | "right" | "center";
};

// Procedural muscle fiber texture
function createFiberTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, 256, 256);
    ctx.lineWidth = 1.2;
    for (let y = 0; y < 256; y += 3) {
      const alpha = 0.25 + Math.random() * 0.45;
      ctx.strokeStyle = Math.random() > 0.5 ? `rgba(255, 255, 255, ${alpha})` : `rgba(0, 0, 0, ${alpha})`;
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 2);
      ctx.bezierCurveTo(
        85, y + (Math.random() - 0.5) * 4,
        170, y + (Math.random() - 0.5) * 4,
        256, y + (Math.random() - 0.5) * 2
      );
      ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 6);
  return texture;
}

let fiberMap: THREE.CanvasTexture | null = null;
if (typeof window !== "undefined") {
  fiberMap = createFiberTexture();
}

// 1. Contoured Pectoralis Major Fan Plate
function createPecGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.42);
  shape.bezierCurveTo(0.4, 0.46, 0.82, 0.36, 0.98, 0.08); // clavicular to axilla
  shape.bezierCurveTo(1.02, -0.22, 0.78, -0.48, 0.38, -0.52); // lower pectoral fold
  shape.bezierCurveTo(0.08, -0.52, -0.04, -0.28, 0, 0.42); // sternal midline
  
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.16,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// 2. Sculpted Abdominal 6-Pack Block with Tendinous Cuts
function createAbBlockGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const w = 0.36, h = 0.24, r = 0.08;
  shape.moveTo(-w + r, -h);
  shape.lineTo(w - r, -h);
  shape.quadraticCurveTo(w, -h, w, -h + r);
  shape.lineTo(w, h - r);
  shape.quadraticCurveTo(w, h, w - r, h);
  shape.lineTo(-w + r, h);
  shape.quadraticCurveTo(-w, h, -w, h - r);
  shape.lineTo(-w, -h + r);
  shape.quadraticCurveTo(-w, -h, -w + r, -h);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.16,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.06,
    bevelThickness: 0.09,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// 3. Anatomical Deltoid Cap
function createDeltoidGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.58);
  shape.bezierCurveTo(0.44, 0.52, 0.58, 0.18, 0.38, -0.38);
  shape.bezierCurveTo(0.18, -0.65, -0.18, -0.65, -0.38, -0.38);
  shape.bezierCurveTo(-0.58, 0.18, -0.44, 0.52, 0, 0.58);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.34,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.12,
    bevelThickness: 0.16,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// 4. Latissimus Dorsi V-Taper Wing
function createLatGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0.08, 0.78);
  shape.bezierCurveTo(0.58, 0.62, 0.82, 0.18, 0.68, -0.58);
  shape.bezierCurveTo(0.38, -0.88, 0.12, -0.98, 0.04, -0.98);
  shape.bezierCurveTo(0.0, -0.28, 0.0, 0.38, 0.08, 0.78);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: 0.1,
    bevelThickness: 0.14,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// 5. Quadriceps Vastus Medialis (Teardrop)
function createTeardropGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.45);
  shape.bezierCurveTo(0.35, 0.3, 0.42, -0.1, 0.22, -0.4);
  shape.bezierCurveTo(0.08, -0.55, -0.08, -0.55, -0.22, -0.4);
  shape.bezierCurveTo(-0.42, -0.1, -0.35, 0.3, 0, 0.45);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.22,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.08,
    bevelThickness: 0.12,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

// 6. Gastrocnemius (Calf Bellies)
function createCalfGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0.62);
  shape.bezierCurveTo(0.38, 0.5, 0.46, 0.1, 0.22, -0.48);
  shape.bezierCurveTo(0.1, -0.75, -0.1, -0.75, -0.22, -0.48);
  shape.bezierCurveTo(-0.46, 0.1, -0.38, 0.5, 0, 0.62);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.26,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.09,
    bevelThickness: 0.13,
  });
  geo.center();
  geo.computeVertexNormals();
  return geo;
}

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

  const customGeometry = useMemo(() => {
    switch (shape) {
      case "pec":
        return createPecGeometry();
      case "ab-block":
        return createAbBlockGeometry();
      case "deltoid":
        return createDeltoidGeometry();
      case "lat":
        return createLatGeometry();
      case "quad-inner":
      case "quad-outer":
        return createTeardropGeometry();
      case "calf":
        return createCalfGeometry();
      default:
        return null;
    }
  }, [shape]);

  useFrame(({ clock }) => {
    if (!mesh.current || reduceMotion) return;
    const pulse = active ? 1 + Math.sin(clock.elapsedTime * 3.2) * 0.02 : 1;
    mesh.current.scale.set(scale[0] * pulse, scale[1] * pulse, scale[2] * pulse);
  });

  const enter = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(id);
  };
  const leave = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover(null);
  };
  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    onSelect(id);
  };

  // High-fidelity anatomical muscle shading
  const tone = active ? "#b8f83e" : "#325c3c";
  const emissiveColor = active ? "#8ec426" : "#173b22";

  return (
    <mesh
      ref={mesh}
      position={position}
      rotation={rotation}
      scale={scale}
      geometry={customGeometry || undefined}
      onPointerOver={enter}
      onPointerOut={leave}
      onClick={click}
      renderOrder={2}
      castShadow
    >
      {!customGeometry && shape === "sphere" && <sphereGeometry args={[1, 32, 24]} />}
      {!customGeometry && shape === "capsule" && <capsuleGeometry args={[0.62, 1.45, 12, 24]} />}
      {!customGeometry && shape === "box" && <boxGeometry args={[1, 1, 1, 8, 7, 7]} />}

      <meshStandardMaterial
        color={tone}
        emissive={emissiveColor}
        emissiveIntensity={active ? 0.68 : 0.38}
        roughness={0.38}
        metalness={0.14}
        bumpMap={fiberMap || undefined}
        bumpScale={0.035}
        transparent
        opacity={active ? 0.98 : 0.9}
      />
      <Edges
        scale={1.01}
        color={active ? "#d8ff79" : "#7aa38f"}
        threshold={18}
        transparent
        opacity={active ? 0.75 : 0.22}
      />
    </mesh>
  );
}
