import { motion } from "framer-motion";

export function FloatingBadges() {
  return (
    <>
      {/* 1. TOP-LEFT: Floating Kettlebell Badge */}
      <motion.div
        className="absolute top-6 left-6 z-20 pointer-events-auto cursor-pointer"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{
          y: { repeat: Infinity, duration: 4.2, ease: "easeInOut" },
          opacity: { duration: 0.5 },
        }}
        title="Strength & Load Metrics"
      >
        <div
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center p-2.5 transition-transform hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(28, 36, 32, 0.85) 0%, rgba(14, 20, 17, 0.92) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Metallic 3D Kettlebell Icon */}
          <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow(0 2px 5px rgba(0, 0, 0, 0.7))">
            <defs>
              <linearGradient id="kettlebellMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="30%" stopColor="#94a3b8" />
                <stop offset="70%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e293b" />
              </linearGradient>
              <linearGradient id="kettlebellSheen" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#64748b" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            {/* Handle */}
            <path
              d="M 22,24 C 22,12 42,12 42,24"
              fill="none"
              stroke="url(#kettlebellMetal)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Solid Cast Body */}
            <circle cx="32" cy="40" r="18" fill="url(#kettlebellMetal)" />
            {/* Metallic Sheen Highlight */}
            <ellipse cx="28" cy="35" rx="7" ry="11" fill="url(#kettlebellSheen)" />
            {/* Center Indent */}
            <circle cx="32" cy="40" r="5" fill="#1e293b" opacity="0.4" />
          </svg>
        </div>
      </motion.div>

      {/* 2. TOP-RIGHT: Floating Stopwatch / Chronometer Badge */}
      <motion.div
        className="absolute top-6 right-6 z-20 pointer-events-auto cursor-pointer"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: [0, -5, 0] }}
        transition={{
          y: { repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.6 },
          opacity: { duration: 0.5 },
        }}
        title="Training Rhythm & Pacing"
      >
        <div
          className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center p-2.5 transition-transform hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(28, 36, 32, 0.85) 0%, rgba(14, 20, 17, 0.92) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Luminous 3D Stopwatch Icon */}
          <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow(0 2px 6px rgba(186, 255, 87, 0.3))">
            <defs>
              <linearGradient id="timerChrome" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="40%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            </defs>
            {/* Top Button / Crown */}
            <rect x="29" y="8" width="6" height="5" rx="1.5" fill="url(#timerChrome)" />
            <rect x="26" y="6" width="12" height="3" rx="1" fill="#e2e8f0" />
            {/* Main Dial Outer Ring */}
            <circle cx="32" cy="37" r="20" fill="none" stroke="url(#timerChrome)" strokeWidth="4.5" />
            {/* Inner Face */}
            <circle cx="32" cy="37" r="16" fill="#0f172a" />
            {/* Dial Ticks */}
            <line x1="32" y1="23" x2="32" y2="26" stroke="#baff57" strokeWidth="2" strokeLinecap="round" />
            <line x1="46" y1="37" x2="43" y2="37" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="32" y1="51" x2="32" y2="48" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="18" y1="37" x2="21" y2="37" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
            {/* Glowing Hands */}
            <line
              x1="32"
              y1="37"
              x2="32"
              y2="27"
              stroke="#baff57"
              strokeWidth="2"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 3px #baff57)" }}
            />
            <line x1="32" y1="37" x2="40" y2="34" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
            {/* Center Pivot */}
            <circle cx="32" cy="37" r="2.2" fill="#baff57" />
          </svg>
        </div>
      </motion.div>

      {/* 3. MID/LOWER-RIGHT: Floating Supplement Jar / Pill Bottle Badge */}
      <motion.div
        className="absolute top-[52%] right-6 sm:right-8 z-20 pointer-events-auto cursor-pointer"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, y: [0, -6, 0] }}
        transition={{
          y: { repeat: Infinity, duration: 5.2, ease: "easeInOut", delay: 1.2 },
          opacity: { duration: 0.5 },
        }}
        title="Nutrition & Supplement Ledger"
      >
        <div
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center p-2 transition-transform hover:scale-110 active:scale-95"
          style={{
            background: "linear-gradient(135deg, rgba(28, 36, 32, 0.85) 0%, rgba(14, 20, 17, 0.92) 100%)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* 3D Supplement Bottle Icon */}
          <svg viewBox="0 0 64 64" className="w-full h-full filter drop-shadow(0 2px 6px rgba(186, 255, 87, 0.4))">
            <defs>
              <linearGradient id="bottleBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="35%" stopColor="#94a3b8" />
                <stop offset="70%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
              </linearGradient>
              <linearGradient id="greenLabel" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#84cc16" />
                <stop offset="50%" stopColor="#baff57" />
                <stop offset="100%" stopColor="#65a30d" />
              </linearGradient>
            </defs>
            {/* Cap */}
            <rect x="22" y="10" width="20" height="7" rx="2" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            <rect x="20" y="16" width="24" height="4" rx="1" fill="#94a3b8" />
            {/* Main Jar Cylinder */}
            <rect x="18" y="20" width="28" height="34" rx="5" fill="url(#bottleBody)" />
            {/* Glowing Green Label Band */}
            <rect
              x="18"
              y="28"
              width="28"
              height="15"
              fill="url(#greenLabel)"
              style={{ filter: "drop-shadow(0 0 4px rgba(186, 255, 87, 0.5))" }}
            />
            <rect x="24" y="34" width="16" height="3" rx="1.5" fill="#ffffff" opacity="0.8" />
          </svg>
        </div>
      </motion.div>
    </>
  );
}
