import { useEffect, useRef } from "react";
import * as THREE from "three";

export function Landing3DScene() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = window.innerWidth;
    let height = window.innerHeight;

    // 1. Three.js Scene, Camera & Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080a09, 0.035);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 14);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 2. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x18241b, 1.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xc6ff3d, 2.8);
    dirLight.position.set(5, 8, 7);
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0xa6d9ff, 3.5, 30);
    blueLight.position.set(-6, -2, 5);
    scene.add(blueLight);

    const limeLight = new THREE.PointLight(0xc6ff3d, 4.0, 25);
    limeLight.position.set(4, 3, 6);
    scene.add(limeLight);

    // 3. Central 3D Muscular Back Anatomy Plane & Wireframe
    const group = new THREE.Group();
    scene.add(group);

    const textureLoader = new THREE.TextureLoader();
    const backTexture = textureLoader.load("/assets/muscular-back-anatomy.png");
    backTexture.colorSpace = THREE.SRGBColorSpace;

    // Muscular back plane geometry
    const planeGeo = new THREE.PlaneGeometry(8.2, 5.2, 32, 32);
    const planeMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      transparent: true,
      opacity: 0.88,
      roughness: 0.35,
      metalness: 0.25,
      emissive: 0x07150a,
      emissiveIntensity: 0.4,
      side: THREE.DoubleSide,
    });
    const backMesh = new THREE.Mesh(planeGeo, planeMat);
    backMesh.position.set(0, 0.2, 0);
    group.add(backMesh);

    // Holographic Cybernetic Wireframe Cage around the back anatomy
    const wireGeo = new THREE.PlaneGeometry(8.4, 5.4, 16, 16);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xc6ff3d,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    wireMesh.position.set(0, 0.2, 0.08);
    group.add(wireMesh);

    // 4. Concentric HUD Targeting Rings
    const createHudRing = (radius: number, color: number, opacity: number, dashSegments = 64) => {
      const ringGeo = new THREE.RingGeometry(radius - 0.02, radius, dashSegments);
      const ringMat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
      });
      return new THREE.Mesh(ringGeo, ringMat);
    };

    const ring1 = createHudRing(4.8, 0xc6ff3d, 0.28, 48);
    const ring2 = createHudRing(5.6, 0xa6d9ff, 0.22, 64);
    const ring3 = createHudRing(6.5, 0x1f4427, 0.4, 32);
    ring1.position.set(0, 0.2, -0.2);
    ring2.position.set(0, 0.2, -0.3);
    ring3.position.set(0, 0.2, -0.4);
    group.add(ring1);
    group.add(ring2);
    group.add(ring3);

    // 5. 3D Floating Particle Constellation
    const particleCount = 750;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    const cLime = new THREE.Color(0xc6ff3d);
    const cCyan = new THREE.Color(0xa6d9ff);
    const cMint = new THREE.Color(0x73c280);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      particlePositions[i3] = (Math.random() - 0.5) * 32;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 22;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 20;

      const pick = Math.random();
      const col = pick > 0.6 ? cLime : pick > 0.3 ? cCyan : cMint;
      particleColors[i3] = col.r;
      particleColors[i3 + 1] = col.g;
      particleColors[i3 + 2] = col.b;

      particleScales[i] = Math.random() * 2.5 + 0.5;
    }

    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    // Particle Material
    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 6. Perspective Ground Coordinate Grid
    const gridHelper = new THREE.GridHelper(36, 36, 0xc6ff3d, 0x14281a);
    gridHelper.position.set(0, -4.5, 0);
    if (Array.isArray(gridHelper.material)) {
      gridHelper.material.forEach((m) => {
        m.transparent = true;
        m.opacity = 0.22;
      });
    } else {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.22;
    }
    scene.add(gridHelper);

    // 7. Mouse Interactivity / Parallax Tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Window resize handler
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // 8. 60 FPS Render Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Smooth camera / object parallax lerp
      targetX += (mouseX * 0.45 - targetX) * 0.04;
      targetY += (mouseY * 0.35 - targetY) * 0.04;

      group.rotation.y = targetX * 0.6 + Math.sin(elapsed * 0.35) * 0.06;
      group.rotation.x = -targetY * 0.4 + Math.cos(elapsed * 0.25) * 0.04;
      group.position.y = Math.sin(elapsed * 0.7) * 0.12;

      // Breathing scale motion for back mesh
      const breath = 1 + Math.sin(elapsed * 0.9) * 0.015;
      backMesh.scale.set(breath, breath, 1);

      // HUD Ring dynamic rotation
      ring1.rotation.z = elapsed * 0.25;
      ring2.rotation.z = -elapsed * 0.15;
      ring3.rotation.z = elapsed * 0.08;

      // Pulse lighting orbits
      limeLight.position.x = Math.sin(elapsed * 0.8) * 5;
      limeLight.position.y = Math.cos(elapsed * 0.6) * 3 + 1;
      blueLight.position.x = -Math.sin(elapsed * 0.7) * 6;
      blueLight.position.y = -Math.cos(elapsed * 0.5) * 3;

      // Particle subtle drift
      particles.rotation.y = elapsed * 0.02;
      particles.rotation.x = Math.sin(elapsed * 0.01) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div className="landing-canvas-wrapper" ref={mountRef} aria-hidden="true" />
  );
}
