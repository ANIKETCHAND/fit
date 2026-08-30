import { useState } from "react";
import { ArrowUpRight, CalendarDays, Dumbbell, Flame, Info, Play, Sparkles, Video, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { type MuscleInfo as MuscleInfoType, getRecoveryStatus } from "@/lib/fitness-data";
import { useLocation } from "wouter";
import { ExerciseVideoModal } from "@/components/video/ExerciseVideoModal";

export function MuscleInfo({ muscle }: { muscle: MuscleInfoType }) {
  const [, setLocation] = useLocation();
  const [selectedVideo, setSelectedVideo] = useState<{ name: string; focus?: string } | null>(null);

  // Compute dynamic recovery metrics
  const score = muscle.score || 80;
  const recovery = getRecoveryStatus(score);
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
      {/* Header with Dynamic Recovery Status Pill */}
      <div className="panel-kicker">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: recovery.color }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{ background: recovery.color }}
            />
          </span>
          <span className="panel-label">Recovery Telemetry</span>
        </div>
        <span
          className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border"
          style={{
            background: `${recovery.color}15`,
            color: recovery.color,
            borderColor: `${recovery.color}40`,
          }}
        >
          {recovery.label}
        </span>
      </div>

      <div className="muscle-heading" style={{ marginBottom: "12px" }}>
        <p className="flex items-center gap-1.5 text-xs text-[#a6d9ff]">
          <Sparkles size={13} style={{ color: recovery.color }} />
          {muscle.label}
        </p>
        <h2>{muscle.anatomicalName}</h2>
      </div>

      {/* Recovery Circular Gauge & Last Trained Readouts */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Recovery Circular Gauge */}
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
                className="fill-none"
                stroke={recovery.color}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 6px ${recovery.color}99)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold font-mono text-[#edf4e9] leading-none">{score}%</span>
            </div>
          </div>
          <div>
            <span className="text-[8px] uppercase tracking-wider text-[#8b9c8a] font-mono block">Recovery</span>
            <strong className="text-[11px] font-mono leading-tight" style={{ color: recovery.color }}>
              {recovery.label}
            </strong>
          </div>
        </div>

        {/* Last Trained Date Chip */}
        <div className="bg-[#0b120e] border border-[rgba(237,244,233,0.08)] rounded-lg p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[8px] uppercase tracking-wider text-[#8b9c8a] font-mono">Last Trained</span>
            <CalendarDays size={12} className="text-[#a6d9ff]" />
          </div>
          <div className="my-0.5">
            <strong className="text-xs text-[#edf4e9] font-mono">{muscle.lastTrained}</strong>
          </div>
          <span className="text-[8px] text-[#8b9c8a] font-mono">Volume: {muscle.weeklyVolume}</span>
        </div>
      </div>

      {/* Recommended Action Card */}
      <div
        className="rounded-lg p-2.5 mb-3 border text-xs font-mono"
        style={{
          background: `${recovery.color}0c`,
          borderColor: `${recovery.color}30`,
        }}
      >
        <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: recovery.color }}>
          <Activity size={12} />
          <span className="text-[10px] uppercase tracking-wider">Recommended Action</span>
        </div>
        <p className="text-[11px] text-[#d5e4d3] leading-relaxed">
          {recovery.action}
        </p>
      </div>

      {/* Recommended Protocol Header */}
      <div className="exercise-title">
        <span className="panel-label flex items-center gap-1">
          <Zap size={11} style={{ color: recovery.color }} /> Focus Movements
        </span>
        <button aria-label={`View all ${muscle.label} exercises`} onClick={() => setLocation("/exercise-library")}>
          View all <ArrowUpRight size={13} />
        </button>
      </div>

      {/* Interactive Micro Exercise Cards */}
      <div className="exercise-list">
        {muscle.exercises.map((exercise, index) => (
          <motion.div
            className="exercise-row group hover:border-[#c6ff3d]/40 transition-colors cursor-pointer"
            key={exercise.name}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06 }}
            onClick={() => setSelectedVideo({ name: exercise.name, focus: muscle.label })}
            title={`Watch video demonstration for ${exercise.name}`}
          >
            <span className="exercise-index text-[#c6ff3d] font-mono">0{index + 1}</span>
            <div className="exercise-details flex-1">
              <strong className="group-hover:text-[#c6ff3d] transition-colors flex items-center justify-between">
                <span>{exercise.name}</span>
                <span className="text-[9px] font-mono text-[#c6ff3d] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  <Play size={10} fill="currentColor" /> Watch Form
                </span>
              </strong>
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

      {/* Video Demonstration Modal */}
      <ExerciseVideoModal
        exercise={selectedVideo}
        open={Boolean(selectedVideo)}
        onClose={() => setSelectedVideo(null)}
      />
    </motion.aside>
  );
}
