import { useState } from "react";
import { ArrowUpRight, CalendarDays, Dumbbell, Play, Sparkles, Zap, Activity } from "lucide-react";
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

  return (
    <motion.aside
      className="muscle-panel bg-[#0b120e] border border-white/10 rounded-2xl p-4 flex flex-col justify-between"
      key={muscle.id}
      initial={{ opacity: 0, x: 18 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.26 }}
      aria-label={`${muscle.label} training details`}
    >
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#8b9c8a] uppercase tracking-wider">
            <Sparkles size={13} style={{ color: recovery.color }} />
            <span>Target Region</span>
          </div>
          <span
            className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border flex items-center gap-1"
            style={{
              background: `${recovery.color}15`,
              color: recovery.color,
              borderColor: `${recovery.color}40`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: recovery.color }} />
            {recovery.label}
          </span>
        </div>

        {/* Clean Muscle Title */}
        <div className="my-3">
          <h2 className="text-2xl font-bold text-white tracking-wide uppercase font-sans">{muscle.label}</h2>
          <p className="text-xs text-[#8b9c8a] italic font-mono mt-0.5">{muscle.anatomicalName}</p>
        </div>

        {/* 2-Column Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Recovery Score Card */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[9px] uppercase tracking-wider text-[#8b9c8a] font-mono block">Recovery</span>
            <div className="flex items-baseline gap-1 my-1">
              <span className="text-2xl font-bold font-mono" style={{ color: recovery.color }}>
                {score}%
              </span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${score}%`, background: recovery.color }}
              />
            </div>
          </div>

          {/* Last Trained Card */}
          <div className="bg-black/40 border border-white/5 rounded-xl p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[#8b9c8a]">
              <span className="text-[9px] uppercase tracking-wider font-mono">Last Trained</span>
              <CalendarDays size={12} className="text-[#a6d9ff]" />
            </div>
            <div className="my-1">
              <strong className="text-xs text-white font-medium block">{muscle.lastTrained}</strong>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-[#8b9c8a] font-mono">
              <Dumbbell size={11} className="text-[#c6ff3d]" />
              <span>{muscle.weeklyVolume}</span>
            </div>
          </div>
        </div>

        {/* Recommended Action Card */}
        <div
          className="rounded-xl p-3 mb-3 border text-xs"
          style={{
            background: `${recovery.color}0a`,
            borderColor: `${recovery.color}30`,
          }}
        >
          <div className="flex items-center gap-1.5 font-bold mb-1" style={{ color: recovery.color }}>
            <Activity size={13} />
            <span className="text-[10px] uppercase font-mono tracking-wider">Recommended Action</span>
          </div>
          <p className="text-[11px] text-[#d5e4d3] leading-relaxed">
            {recovery.action}
          </p>
        </div>

        {/* Recommended Protocol Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8b9c8a] flex items-center gap-1">
            <Zap size={12} style={{ color: recovery.color }} /> Focus Movements
          </span>
          <button
            className="text-[10px] font-mono text-[#c6ff3d] hover:underline flex items-center gap-0.5"
            onClick={() => setLocation("/exercise-library")}
          >
            View all <ArrowUpRight size={11} />
          </button>
        </div>

        {/* Micro Exercise Cards */}
        <div className="space-y-1.5 mb-3">
          {muscle.exercises.map((exercise, index) => (
            <div
              key={exercise.name}
              onClick={() => setSelectedVideo({ name: exercise.name, focus: muscle.label })}
              className="bg-black/30 hover:bg-white/5 border border-white/5 hover:border-white/15 rounded-xl p-2.5 flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-[#8b9c8a] w-4">0{index + 1}</span>
                <div>
                  <strong className="text-xs text-white group-hover:text-[#c6ff3d] transition-colors block">
                    {exercise.name}
                  </strong>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] font-mono bg-white/5 text-[#8b9c8a] px-1.5 py-0.2 rounded">
                      {exercise.sets} sets
                    </span>
                    <span className="text-[9px] font-mono bg-white/5 text-[#8b9c8a] px-1.5 py-0.2 rounded">
                      {exercise.reps} reps
                    </span>
                    <span className="text-[9px] font-mono text-[#8b9c8a]">{exercise.load}</span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-[#c6ff3d] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <Play size={10} fill="currentColor" /> Form
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Start Workout Button */}
      <button
        onClick={() => setLocation("/log-workout")}
        className="w-full py-3 px-4 bg-[#c6ff3d] hover:bg-[#b8f52e] text-[#0a100c] rounded-xl font-bold font-sans text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-lg shadow-[#c6ff3d]/10"
      >
        <Play size={14} fill="currentColor" />
        <span>Launch {muscle.label} Routine</span>
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
