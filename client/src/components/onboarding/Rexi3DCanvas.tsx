/* FitTrack: 3D Animated Rexi Mascot in Three.js */
import { useEffect, useRef } from "react";
import * as THREE from "three";

interface Rexi3DCanvasProps {
  isCelebrating?: boolean;
  step?: "greeting" | "ask_level";
}

export function Rexi3DCanvas({ isCelebrating = false, step = "greeting" }: Rexi3DCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || (step === "greeting" ? 260 : 180);

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.3, 4.0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x1a331a, 2.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xc6ff3d, 3.5);
    keyLight.position.set(3, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 4.0, 10);
    rimLight.position.set(-3, 2, -2);
    scene.add(rimLight);

    const bottomGlow = new THREE.PointLight(0xbaff57, 3.2, 8);
    bottomGlow.position.set(0, -1.0, 1.5);
    scene.add(bottomGlow);

    // 3. Materials
    const bodyMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa8f53a,
      emissive: 0x225511,
      emissiveIntensity: 0.3,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1,
      sheen: 0.7,
      sheenColor: new THREE.Color(0xd9f99d),
    });

    const eyeMaterial = new THREE.MeshStandardMaterial({
      color: 0x050a06,
      roughness: 0.1,
      metalness: 0.8,
    });

    const eyeHighlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });

    const cheekMaterial = new THREE.MeshStandardMaterial({
      color: 0x4d7c0f,
      roughness: 0.3,
      transparent: true,
      opacity: 0.6,
    });

    // 4. Construct Rexi Character Hierarchy
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // Character container
    const character = new THREE.Group();
    rootGroup.add(character);

    // Cute Pear-shaped Body
    const bodyGeometry = new THREE.SphereGeometry(0.85, 36, 36);
    const posAttr = bodyGeometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      let y = posAttr.getY(i);
      let factor = y < 0 ? 1.08 - y * 0.12 : 0.96 + y * 0.04;
      posAttr.setX(i, posAttr.getX(i) * factor);
      posAttr.setZ(i, posAttr.getZ(i) * factor);
    }
    bodyGeometry.computeVertexNormals();

    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = 0.8;
    character.add(bodyMesh);

    // Curled Horn / Cap on Head
    const hornCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(-0.15, 1.75, -0.05),
      new THREE.Vector3(-0.35, 1.95, -0.1),
      new THREE.Vector3(-0.25, 2.1, -0.05),
      new THREE.Vector3(-0.05, 2.15, 0),
    ]);
    const hornGeometry = new THREE.TubeGeometry(hornCurve, 24, 0.12, 12, false);
    const hornMesh = new THREE.Mesh(hornGeometry, bodyMaterial);
    character.add(hornMesh);

    // Horn Glowing Tip
    const tipGeometry = new THREE.SphereGeometry(0.12, 16, 16);
    const tipMaterial = new THREE.MeshBasicMaterial({ color: 0xc6ff3d });
    const tipMesh = new THREE.Mesh(tipGeometry, tipMaterial);
    tipMesh.position.set(-0.05, 2.15, 0);
    character.add(tipMesh);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.13, 24, 24);
    eyeGeometry.scale(1, 1.45, 0.6);

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.3, 0.95, 0.72);
    leftEye.rotation.y = -0.15;
    character.add(leftEye);

    const highlightGeo = new THREE.SphereGeometry(0.04, 12, 12);
    const leftHigh = new THREE.Mesh(highlightGeo, eyeHighlightMaterial);
    leftHigh.position.set(-0.28, 1.02, 0.8);
    character.add(leftHigh);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.3, 0.95, 0.72);
    rightEye.rotation.y = 0.15;
    character.add(rightEye);

    const rightHigh = new THREE.Mesh(highlightGeo, eyeHighlightMaterial);
    rightHigh.position.set(0.32, 1.02, 0.8);
    character.add(rightHigh);

    // Cheeks
    const cheekGeo = new THREE.SphereGeometry(0.09, 16, 16);
    cheekGeo.scale(1.2, 0.7, 0.5);
    const leftCheek = new THREE.Mesh(cheekGeo, cheekMaterial);
    leftCheek.position.set(-0.48, 0.76, 0.64);
    character.add(leftCheek);

    const rightCheek = new THREE.Mesh(cheekGeo, cheekMaterial);
    rightCheek.position.set(0.48, 0.76, 0.64);
    character.add(rightCheek);

    // Floating Paws
    const handGeo = new THREE.SphereGeometry(0.18, 20, 20);
    handGeo.scale(1, 0.85, 1.2);

    const leftHand = new THREE.Mesh(handGeo, bodyMaterial);
    leftHand.position.set(-0.85, 0.65, 0.35);
    character.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, bodyMaterial);
    rightHand.position.set(0.85, 0.65, 0.35);
    character.add(rightHand);

    // Ground Shadow Blob
    const shadowGeo = new THREE.PlaneGeometry(1.6, 1.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = -0.42;
    rootGroup.add(shadowMesh);

    // Energy Ring Particle Halo
    const ringGeo = new THREE.RingGeometry(1.1, 1.18, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc6ff3d,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.35,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.y = -0.38;
    rootGroup.add(ringMesh);

    // Mouse Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.targetX = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.targetY = -(((e.clientY - rect.top) / height) * 2 - 1);
    };
    window.addEventListener("mousemove", handleMouseMove);

    // 5. Animation Loop
    let clock = new THREE.Clock();
    let animId: number;
    let entranceProgress = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Mouse smoothing
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      // Entrance Drop-in
      if (entranceProgress < 1) {
        entranceProgress = Math.min(1, entranceProgress + delta * 2.4);
        const ease = Math.sin((entranceProgress * Math.PI) / 2);
        rootGroup.position.y = (1 - ease) * 3;
        rootGroup.rotation.y = (1 - ease) * Math.PI * 2;
      }

      // Continuous Joyful Jumping Physics (Sine bounce with squash & stretch)
      const jumpSpeed = 4.2;
      const jumpPhase = (time * jumpSpeed) % Math.PI;
      const rawJump = Math.sin(jumpPhase);
      const jumpHeight = isCelebrating ? 1.6 : 0.65;
      const currentJumpY = rawJump * jumpHeight;

      character.position.y = currentJumpY;

      // Squash and Stretch:
      if (rawJump < 0.2) {
        const squash = (1 - rawJump / 0.2) * 0.18;
        character.scale.set(1 + squash, 1 - squash * 1.3, 1 + squash);
      } else {
        const stretch = ((rawJump - 0.2) / 0.8) * 0.14;
        character.scale.set(1 - stretch * 0.6, 1 + stretch, 1 - stretch * 0.6);
      }

      // Shadow scaling
      const shadowScale = Math.max(0.4, 1 - rawJump * 0.55);
      shadowMesh.scale.set(shadowScale, shadowScale, 1);
      shadowMat.opacity = Math.max(0.15, 0.5 - rawJump * 0.35);

      // Energy Ring
      ringMesh.rotation.z = time * 1.5;
      ringMat.opacity = 0.25 + Math.sin(time * 3) * 0.15;

      // Waving Paws
      leftHand.position.y = 0.65 + Math.sin(time * 6) * 0.12;
      leftHand.position.x = -0.85 + Math.cos(time * 3) * 0.05;
      rightHand.position.y = 0.65 + Math.cos(time * 6) * 0.12;
      rightHand.position.x = 0.85 - Math.cos(time * 3) * 0.05;

      // Horn Wiggle
      hornMesh.rotation.z = Math.sin(time * 5) * 0.08;

      // If Celebrating: Joyful Backflip
      if (isCelebrating) {
        character.rotation.x = time * 8;
        character.rotation.y = time * 4;
      } else {
        character.rotation.y = mouse.x * 0.45;
        character.rotation.x = -mouse.y * 0.25;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("mousemove", handleMouseMove);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isCelebrating, step]);

  return (
    <div
      ref={mountRef}
      className={`w-full flex items-center justify-center relative cursor-grab active:cursor-grabbing ${
        step === "greeting" ? "h-[250px]" : "h-[180px]"
      }`}
    />
  );
}
