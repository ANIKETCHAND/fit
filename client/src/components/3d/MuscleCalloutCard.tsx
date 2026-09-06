import { motion } from "framer-motion";
import { type MuscleInfo } from "@/lib/fitness-data";

interface MuscleCalloutCardProps {
  muscle: MuscleInfo;
  className?: string;
}

export function MuscleCalloutCard({ muscle, className = "" }: MuscleCalloutCardProps) {
  const displayName = muscle.anatomicalName || muscle.label;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 select-none ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(20, 28, 24, 0.88) 0%, rgba(10, 16, 13, 0.94) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        boxShadow: "0 16px 36px rgba(0, 0, 0, 0.7), 0 0 20px rgba(186, 255, 87, 0.12)",
      }}
    >
      {/* Speech-Bubble Pointer Arrow pointing left towards the muscle */}
      <div
        className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
        style={{
          borderTop: "7px solid transparent",
          borderBottom: "7px solid transparent",
          borderRight: "8px solid rgba(20, 28, 24, 0.92)",
          filter: "drop-shadow(-2px 0 2px rgba(0, 0, 0, 0.5))",
        }}
      />

      {/* 3D Anatomical Muscle Belly Illustration */}
      <div className="relative w-11 h-14 flex-shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 60 90"
          className="w-full h-full filter drop-shadow(0 2px 8px rgba(239, 68, 68, 0.35))"
          style={{ overflow: "visible" }}
        >
          <defs>
            {/* Realistic Red/Coral Muscle Fiber Gradient */}
            <linearGradient id="muscleFiberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f87171" />
              <stop offset="25%" stopColor="#ef4444" />
              <stop offset="60%" stopColor="#dc2626" />
              <stop offset="90%" stopColor="#991b1b" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            {/* White Tendon Gradient */}
            <linearGradient id="tendonGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="60%" stopColor="#e2e8f0" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#cbd5e1" stopOpacity="0.2" />
            </linearGradient>
            {/* Specular highlight */}
            <linearGradient id="specularGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Muscle Main Belly (Fusiform Shape) */}
          <path
            d="M 30,5 C 38,18 48,32 48,48 C 48,64 38,76 30,85 C 22,76 12,64 12,48 C 12,32 22,18 30,5 Z"
            fill="url(#muscleFiberGrad)"
            stroke="rgba(254, 202, 202, 0.4)"
            strokeWidth="0.8"
          />

          {/* Muscle Striations / Longitudinal Fascicle Lines */}
          <path
            d="M 28,12 C 34,26 42,38 42,50 C 42,62 34,72 29,80"
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M 25,18 C 22,30 20,44 20,54 C 20,64 24,72 27,78"
            fill="none"
            stroke="rgba(254, 226, 226, 0.4)"
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <path
            d="M 30,10 C 31,30 31,56 30,82"
            fill="none"
            stroke="rgba(255, 255, 255, 0.45)"
            strokeWidth="1.1"
            strokeLinecap="round"
          />

          {/* Top Tendon Anchor */}
          <path
            d="M 27,2 C 29,0 31,0 33,2 L 34,14 C 31,16 29,16 26,14 Z"
            fill="url(#tendonGrad)"
          />

          {/* Bottom Tendon Anchor */}
          <path
            d="M 26,78 C 29,76 31,76 34,78 L 33,89 C 31,90 29,90 27,89 Z"
            fill="url(#tendonGrad)"
          />

          {/* Specular 3D highlight sheath */}
          <ellipse cx="25" cy="45" rx="7" ry="24" fill="url(#specularGlow)" />
        </svg>
      </div>

      {/* Right Column: Title + Glowing Mini-Graph */}
      <div className="flex flex-col justify-center min-w-[110px]">
        {/* Muscle Title */}
        <h4 className="text-[13px] font-bold text-white tracking-wide font-sans leading-tight">
          {displayName}
        </h4>

        {/* Mini-Graph Waveform (SVG Area Sparkline) */}
        <div className="relative mt-1.5 w-28 h-8 flex flex-col justify-end">
          <svg viewBox="0 0 100 35" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="waveFillGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#baff57" stopOpacity="0.55" />
                <stop offset="60%" stopColor="#84cc16" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#84cc16" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Area Fill */}
            <path
              d="M 0,32 C 8,28 12,18 16,14 C 20,9 26,18 32,21 C 38,24 45,28 54,29 C 64,30 76,31 88,32 C 94,32 98,33 100,33 L 100,35 L 0,35 Z"
              fill="url(#waveFillGrad)"
            />

            {/* Glowing Wave Stroke */}
            <path
              d="M 0,32 C 8,28 12,18 16,14 C 20,9 26,18 32,21 C 38,24 45,28 54,29 C 64,30 76,31 88,32 C 94,32 98,33 100,33"
              fill="none"
              stroke="#baff57"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: "drop-shadow(0 0 4px rgba(186, 255, 87, 0.8))" }}
            />
          </svg>

          {/* Subtext */}
          <span className="text-[8.5px] font-mono font-medium text-[#8ea588] tracking-wider mt-0.5 block uppercase">
            Mini-graph
          </span>
        </div>
      </div>
    </motion.div>
  );
}
