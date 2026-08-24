/** Kinetic Anatomy Lab: highly visual diagnostic panel featuring animated fuel gauges, LED strain meters, and fiber telemetry. */
import { ArrowUpRight, CalendarDays, Dumbbell, Flame, Play, Sparkles, Zap } from "lucide-react";
import { motion } from "framer-motion";
import type { MuscleInfo } from "@/lib/fitness-data";
import { useLocation } from "wouter";

export function MuscleInfo({ muscle }: { muscle: MuscleInfo }) {
  const [, setLocation] = useLocation();

  // Compute visual telemetry metrics
  const score = muscle.score || 80;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  // Strain capacity segments (1 to 5)
  const strainBars = Math.min(5, Math.max(1, Math.round(score / 20)));

  return (
    <motion.aside
      className="muscle-panel"
      key={muscle.id}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26 }}
      aria-label={`${muscle.label} training details`}
    >
      {/* Header with Visual Status Badge */}
      <div className="panel-kicker">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c6ff3d] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c6ff3d]"></span>
          </span>
          <span className="panel-label">Telemetry Feed</span>
        </div>
        <span className={`status-pill ${muscle.status.toLowerCase()}`}>{muscle.status}</span>
      </div>

      <div className="muscle-heading" style={{ marginBottom: "14px" }}>
        <p className="flex items-center gap-1.5 text-xs text-[#a6d9ff]">
          <Sparkles size={13} className="text-[#c6ff3d]" />
          {muscle.label}
        </p>
        <h2>{muscle.anatomicalName}</h2>
      </div>

      {/* Visual Telemetry Dial & Strain Meter Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Readiness Circular Fuel Gauge */}
        <div className="bg-[#0b120e] border border-[rgba(237,244,233,0.08)] rounded-lg p-2.5 flex items-center gap-2.5">
          <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90 transform" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r={radius}
                className="stroke-[rgba(255,255,255,0.08)] fill-none"
                strokeWidth="5"
              />
              <motion.circle
                cx="30"
                cy="30"
                r={radius}
                className="stroke-[#c6ff3d] fill-none"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ filter: "drop-shadow(0 0 6px rgba(198,255,61,0.6))" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold font-mono text-[#edf4e9] leading-none">{score}%</span>
            </div>
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-wider text-[#8b9c8a] font-mono block">Readiness</span>
            <strong className="text-[11px] text-[#c6ff3d] font-mono leading-tight">{muscle.intensity}</strong>
          </div>
        </div>

        {/* LED Strain & Power Bar */}
        <div className="bg-[#0b120e] border border-[rgba(237,244,233,0.08)] rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-wider text-[#8b9c8a] font-mono">Load Tier</span>
            <Zap size={12} className="text-[#a6d9ff]" />
          </div>
          <div className="flex gap-1 my-1">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <motion.div
                key={lvl}
                className="h-2.5 flex-1 rounded-sm transition-all"
                style={{
                  background: lvl <= strainBars ? (lvl > 3 ? "#c6ff3d" : "#a6d9ff") : "rgba(255,255,255,0.08)",
                  boxShadow: lvl <= strainBars ? `0 0 6px ${lvl > 3 ? "rgba(198,255,61,0.5)" : "rgba(166,217,255,0.4)"}` : "none",
                }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: lvl * 0.05 }}
              />
            ))}
          </div>
          <span className="text-[9px] text-[#edf4e9] font-mono">Tier {strainBars}/5 Active</span>
        </div>
      </div>

      {/* Fiber Ratio Animated Split Bar */}
      <div className="bg-[#0b120e] border border-[rgba(237,244,233,0.08)] rounded-lg px-3 py-2 mb-3">
        <div className="flex justify-between items-center text-[8px] uppercase font-mono text-[#8b9c8a] mb-1">
          <span className="text-[#c6ff3d] flex items-center gap-1">
            <Flame size={9} /> Fast-Twitch (Power) 65%
          </span>
          <span className="text-[#a6d9ff]">35% Slow (Endurance)</span>
        </div>
        <div className="w-full h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden flex">
          <motion.div
            className="h-full bg-[#c6ff3d]"
            initial={{ width: 0 }}
            animate={{ width: "65%" }}
            transition={{ duration: 0.6 }}
            style={{ boxShadow: "0 0 8px rgba(198,255,61,0.8)" }}
          />
          <motion.div
            className="h-full bg-[#a6d9ff]"
            initial={{ width: 0 }}
            animate={{ width: "35%" }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>

      {/* Compact Telemetry Chips */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-[#0e1611] border border-[rgba(237,244,233,0.07)] rounded-md px-2.5 py-1.5 flex items-center gap-2">
          <CalendarDays size={13} className="text-[#a6d9ff]" />
          <div>
            <span className="text-[8px] uppercase tracking-wider text-[#8b9c8a] font-mono block">Cooldown</span>
            <strong className="text-[11px] text-[#edf4e9] font-mono">{muscle.lastTrained}</strong>
          </div>
        </div>
        <div className="bg-[#0e1611] border border-[rgba(237,244,233,0.07)] rounded-md px-2.5 py-1.5 flex items-center gap-2">
          <Dumbbell size={13} className="text-[#c6ff3d]" />
          <div>
            <span className="text-[8px] uppercase tracking-wider text-[#8b9c8a] font-mono block">Volume</span>
            <strong className="text-[11px] text-[#edf4e9] font-mono">{muscle.weeklyVolume}</strong>
          </div>
        </div>
      </div>

      {/* Recommended Protocol Header */}
      <div className="exercise-title">
        <span className="panel-label flex items-center gap-1">
          <Zap size={11} className="text-[#c6ff3d]" /> Focus Movements
        </span>
        <button aria-label={`View all ${muscle.label} exercises`} onClick={() => setLocation("/exercise-library")}>
          View all <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Interactive Micro Exercise Cards */}
      <div className="exercise-list">
        {muscle.exercises.map((exercise, index) => (
          <motion.div
            className="exercise-row group hover:border-[#c6ff3d]/40 transition-colors"
            key={exercise.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
          >
            <span className="exercise-index text-[#c6ff3d] font-mono">0{index + 1}</span>
            <div className="exercise-details flex-1">
              <strong className="group-hover:text-[#c6ff3d] transition-colors">{exercise.name}</strong>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="inline-block bg-[rgba(198,255,61,0.1)] text-[#c6ff3d] px-1.5 py-0.5 rounded text-[8px] font-mono">
                  {exercise.sets} sets
                </span>
                <span className="inline-block bg-[rgba(166,217,255,0.1)] text-[#a6d9ff] px-1.5 py-0.5 rounded text-[8px] font-mono">
                  {exercise.reps} reps
                </span>
                <span className="text-[9px] text-[#8b9c8a] font-mono">{exercise.load}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Start Workout Button */}
      <button className="start-workout group" onClick={() => setLocation("/log-workout")}>
        <div className="start-workout-label">
          <Play size={14} fill="currentColor" className="group-hover:scale-110 transition-transform" />
          <span>Launch {muscle.label} Routine</span>
        </div>
        <span className="workout-time">45 min</span>
      </button>
    </motion.aside>
  );
}
