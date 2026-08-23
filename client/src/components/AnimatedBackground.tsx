import { useEffect, useRef, useState } from "react";

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [motionIntensity, setMotionIntensity] = useState<"subtle" | "active">("subtle");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Particle nodes definition
    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      baseAlpha: number;
      pulseSpeed: number;
    }

    const particleCount = Math.min(65, Math.floor((width * height) / 28000));
    const particles: Particle[] = [];

    const colors = [
      "198, 255, 61",  // Neon Lime (#c6ff3d)
      "166, 217, 255", // Electric Cyan (#a6d9ff)
      "140, 215, 144", // Soft Mint (#8cd790)
    ];

    for (let i = 0; i < particleCount; i++) {
      const isLime = Math.random() > 0.45;
      const col = isLime ? colors[0] : Math.random() > 0.5 ? colors[1] : colors[2];
      const baseA = Math.random() * 0.35 + 0.1;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: Math.random() * 2.2 + 0.8,
        color: col,
        alpha: baseA,
        baseAlpha: baseA,
        pulseSpeed: Math.random() * 0.02 + 0.008,
      });
    }

    // Grid nodes
    let time = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Main 60fps render loop
    const render = () => {
      time += 0.006;

      // 1. Base gradient background (Deep obsidian cybernetic space)
      const bgGrad = ctx.createRadialGradient(
        width * 0.5,
        height * 0.4,
        width * 0.1,
        width * 0.5,
        height * 0.5,
        width * 0.85
      );
      bgGrad.addColorStop(0, "#0e1611");
      bgGrad.addColorStop(0.5, "#080c0a");
      bgGrad.addColorStop(1, "#040605");

      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Animated Glowing Ambient Flow Waves (Minimal 4K fluid curves)
      ctx.save();
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        const waveOffset = w * 1.8;
        const baseY = height * (0.35 + w * 0.22);
        ctx.moveTo(0, baseY);

        for (let x = 0; x <= width; x += 30) {
          const sin1 = Math.sin(x * 0.0018 + time + waveOffset) * 45;
          const sin2 = Math.sin(x * 0.0035 - time * 0.8 + waveOffset) * 22;
          const cos1 = Math.cos(x * 0.001 + time * 0.5) * 15;
          const y = baseY + sin1 + sin2 + cos1;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, baseY - 60, width, baseY + 120);
        if (w === 0) {
          grad.addColorStop(0, "rgba(198, 255, 61, 0.025)");
          grad.addColorStop(0.5, "rgba(166, 217, 255, 0.015)");
          grad.addColorStop(1, "rgba(8, 12, 10, 0)");
        } else if (w === 1) {
          grad.addColorStop(0, "rgba(166, 217, 255, 0.02)");
          grad.addColorStop(0.6, "rgba(198, 255, 61, 0.018)");
          grad.addColorStop(1, "rgba(8, 12, 10, 0)");
        } else {
          grad.addColorStop(0, "rgba(198, 255, 61, 0.015)");
          grad.addColorStop(1, "rgba(8, 12, 10, 0)");
        }

        ctx.fillStyle = grad;
        ctx.fill();

        // Wave crest highlight line
        ctx.beginPath();
        for (let x = 0; x <= width; x += 30) {
          const sin1 = Math.sin(x * 0.0018 + time + waveOffset) * 45;
          const sin2 = Math.sin(x * 0.0035 - time * 0.8 + waveOffset) * 22;
          const cos1 = Math.cos(x * 0.001 + time * 0.5) * 15;
          const y = baseY + sin1 + sin2 + cos1;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = w === 0 ? "rgba(198, 255, 61, 0.08)" : "rgba(166, 217, 255, 0.06)";
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();

      // 3. Cybernetic Particle Constellation Network
      ctx.save();
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = width;
        else if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        else if (p.y > height) p.y = 0;

        // Pulse alpha
        p.alpha = p.baseAlpha + Math.sin(time * 3 + i) * 0.12;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${Math.max(0.04, p.alpha)})`;
        ctx.shadowColor = `rgba(${p.color}, 0.8)`;
        ctx.shadowBlur = 8;
        ctx.fill();

        // Connect nearby particles with subtle laser filaments
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * 0.08;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(198, 255, 61, ${lineAlpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 4. Subtle Digital Grid Telemetry Overlay
      ctx.save();
      ctx.strokeStyle = "rgba(166, 217, 255, 0.015)";
      ctx.lineWidth = 1;
      const gridSize = 64;
      const offsetX = (time * 12) % gridSize;
      const offsetY = (time * 6) % gridSize;

      for (let x = -gridSize + offsetX; x < width + gridSize; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      for (let y = -gridSize + offsetY; y < height + gridSize; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Cinematic Vignette (darkens screen perimeter for ultimate focus)
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.45,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
      vignette.addColorStop(1, "rgba(4, 6, 5, 0.75)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden select-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{
          filter: "contrast(1.05) brightness(1.02)",
        }}
      />
    </div>
  );
}
