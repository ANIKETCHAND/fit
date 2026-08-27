/* FitTrack: 'What Should I Do Today?' Primary Action & Beginner Guidance Card */
import React, { useState } from "react";
import { 
  Play, 
  Sparkles, 
  ChevronRight, 
  Flame, 
  Dumbbell, 
  Heart, 
  HelpCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Droplets, 
  BookOpen,
  ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { getAthleteProfile, getExperienceTier, saveExperienceTier, type ExperienceTier, getCalibrationSettings } from "@/lib/user-store";
import { GlossaryTooltip, BeginnerGlossaryModal } from "@/components/tooltips/FitnessGlossaryTooltip";

export function WhatShouldIDoTodayCard() {
  const [, setLocation] = useLocation();
  const [glossaryModalOpen, setGlossaryModalOpen] = useState(false);
  const profile = getAthleteProfile();
  const calibration = getCalibrationSettings();
  const [experienceTier, setExperienceTierState] = useState<ExperienceTier>(() => getExperienceTier());

  const isBeginnerTier = experienceTier === "complete_beginner" || experienceTier === "beginner";

  // Deterministic daily workout recommendation based on experience & profile
  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

  const getDayPlan = () => {
    switch (dayOfWeek) {
      case "Monday":
        return {
          title: "Upper Body Hypertrophy & Chest Focus",
          focus: "Chest, Shoulders & Triceps",
          starterExercises: [
            { name: "Dumbbell Bench Press", sets: 3, reps: "8-10", rpe: 7, rest: "90s" },
            { name: "Seated Overhead Shoulder Press", sets: 3, reps: "10-12", rpe: 7, rest: "60s" },
            { name: "Tricep Rope Pushdown", sets: 3, reps: "12-15", rpe: 8, rest: "60s" },
          ],
          warmUp: "5m dynamic shoulder circles & arm swings + 1 light feeder set",
          nutritionTip: `Target ${calibration.goalProtein || 150}g protein today to optimize muscle protein synthesis.`,
        };
      case "Tuesday":
        return {
          title: "Lower Body Foundation & Quad Development",
          focus: "Quads, Hamstrings & Calves",
          starterExercises: [
            { name: "Goblet Squats / Leg Press", sets: 3, reps: "10-12", rpe: 7, rest: "90s" },
            { name: "Romanian Deadlift (RDL)", sets: 3, reps: "8-10", rpe: 7, rest: "90s" },
            { name: "Standing Calf Raises", sets: 3, reps: "15", rpe: 8, rest: "45s" },
          ],
          warmUp: "3m bodyweight squats + hip openers + dynamic leg swings",
          nutritionTip: "Consume adequate complex carbs before training for optimal glycogen availability.",
        };
      case "Wednesday":
        return {
          title: "Active Recovery & Core Stability",
          focus: "Abs, Mobility & Cardio Conditioning",
          starterExercises: [
            { name: "Plank Hold", sets: 3, reps: "45s", rpe: 7, rest: "45s" },
            { name: "Hanging Knee / Leg Raises", sets: 3, reps: "12-15", rpe: 7, rest: "60s" },
            { name: "Outdoor 3km Zone 2 Run / Walk", sets: 1, reps: "25m", rpe: 6, rest: "N/A" },
          ],
          warmUp: "Cat-cow stretches & world's greatest stretch (5 reps each side)",
          nutritionTip: "Drink 3.5L to 4L of water to accelerate lactic acid clearance and tissue recovery.",
        };
      case "Thursday":
        return {
          title: "Back Width & Bicep Peak Volume",
          focus: "Lats, Upper Back & Biceps",
          starterExercises: [
            { name: "Lat Pulldown / Assisted Pull-up", sets: 3, reps: "10-12", rpe: 7, rest: "90s" },
            { name: "Seated Cable Row", sets: 3, reps: "10-12", rpe: 8, rest: "60s" },
            { name: "Incline Dumbbell Bicep Curls", sets: 3, reps: "12", rpe: 8, rest: "60s" },
          ],
          warmUp: "Dead hangs (30s) + band pull-aparts + light rowing warm-up",
          nutritionTip: "Ensure post-workout protein intake within 2 hours of completing the session.",
        };
      case "Friday":
        return {
          title: "Full Body Athletic Conditioning",
          focus: "Compound Movements & Core Power",
          starterExercises: [
            { name: "Dumbbell Romanian Deadlift", sets: 3, reps: "10", rpe: 7, rest: "90s" },
            { name: "Incline Dumbbell Press", sets: 3, reps: "10", rpe: 8, rest: "90s" },
            { name: "Dumbbell Lateral Raises", sets: 3, reps: "15", rpe: 8, rest: "45s" },
          ],
          warmUp: "5m brisk walk + dynamic joint rotations",
          nutritionTip: "Fuel with healthy fats and lean protein for sustained weekend recovery.",
        };
      default:
        return {
          title: "Weekend Reset & Active Mobility",
          focus: "Full Body Mobility & Outdoor Cardio",
          starterExercises: [
            { name: "Brisk Outdoor Walk / Jog (GPS)", sets: 1, reps: "30 mins", rpe: 6, rest: "N/A" },
            { name: "Full Body Yoga & Foam Rolling", sets: 1, reps: "15 mins", rpe: 5, rest: "N/A" },
          ],
          warmUp: "Gentle spinal twists & thoracic spine openers",
          nutritionTip: "Prioritize 8+ hours of deep restorative sleep tonight.",
        };
    }
  };

  const plan = getDayPlan();

  const handleTierChange = (newTier: ExperienceTier) => {
    saveExperienceTier(newTier);
    setExperienceTierState(newTier);
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full bg-[#0c120e] border border-[#c6ff3d]/30 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden mb-6"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#c6ff3d]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Tag & Tier Selection Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#c6ff3d]/15 border border-[#c6ff3d]/40 text-[#c6ff3d] text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_15px_rgba(198,255,61,0.2)]">
              <Sparkles size={13} />
              <span>WHAT SHOULD I DO TODAY?</span>
            </span>
            <span className="text-xs font-mono text-[#8b9c8a] hidden sm:inline">
              • {dayOfWeek} Protocol
            </span>
          </div>

          {/* 4-Tier Mode Selector Pills */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/5 overflow-x-auto scrollbar-none">
            {[
              { id: "complete_beginner" as const, label: "🌱 Beginner" },
              { id: "beginner" as const, label: "🚀 Standard" },
              { id: "intermediate" as const, label: "⚡ Intermed" },
              { id: "advanced" as const, label: "🔥 Gym Rat" },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => handleTierChange(tier.id)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-mono transition-all whitespace-nowrap ${
                  experienceTier === tier.id
                    ? "bg-[#c6ff3d] text-black font-bold shadow-[0_0_10px_rgba(198,255,61,0.3)]"
                    : "text-[#8b9c8a] hover:text-white"
                }`}
              >
                {tier.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 items-center">
          {/* Left Column: Recommendation Details (7 Cols) */}
          <div className="lg:col-span-7 space-y-3.5">
            <div>
              <div className="text-[11px] font-mono text-[#8b9c8a] flex items-center gap-2">
                <span>Recommended Session:</span>
                <span className="text-[#c6ff3d] font-bold">{plan.focus}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                {plan.title}
              </h2>
            </div>

            {/* Beginner Guided Breakdown */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[#8b9c8a] font-mono text-[11px] pb-1 border-b border-white/5">
                <span>EXERCISE BLUEPRINT</span>
                <span>
                  Target: 3 <GlossaryTooltip termKey="set">Sets</GlossaryTooltip> × 8-12 <GlossaryTooltip termKey="rep">Reps</GlossaryTooltip>
                </span>
              </div>

              <div className="space-y-1.5">
                {plan.starterExercises.map((ex, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#c6ff3d]/20 text-[#c6ff3d] font-mono text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-white font-medium">{ex.name}</span>
                    </div>
                    <div className="text-[11px] font-mono text-[#8b9c8a]">
                      <span className="text-[#c6ff3d] font-bold">{ex.sets}</span> sets × <span className="text-white font-bold">{ex.reps}</span> reps
                      <span className="text-[#5a6b58] ml-2">(@ <GlossaryTooltip termKey="rpe">RPE {ex.rpe}</GlossaryTooltip>)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warm-Up & Recovery Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl flex items-start gap-2">
                <Flame size={14} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <b className="text-amber-400 block font-mono text-[10px] uppercase">
                    <GlossaryTooltip termKey="warm-up">Warm-Up Protocol</GlossaryTooltip>
                  </b>
                  <span className="text-[#8b9c8a]">{plan.warmUp}</span>
                </div>
              </div>

              <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl flex items-start gap-2">
                <Droplets size={14} className="text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <b className="text-sky-400 block font-mono text-[10px] uppercase">Daily Nutrition Target</b>
                  <span className="text-[#8b9c8a]">{plan.nutritionTip}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: CTA Buttons & Glossary Launcher (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-3 bg-black/50 p-4 sm:p-5 rounded-2xl border border-white/10">
            <div className="text-center sm:text-left">
              <span className="text-[10px] font-mono text-[#c6ff3d] uppercase tracking-wider block">
                {isBeginnerTier ? "Guided Session Mode" : "High-Performance Mode"}
              </span>
              <p className="text-xs text-[#b0bfad] mt-0.5">
                {isBeginnerTier 
                  ? "Form cues, rest timers, and weights calibrated for progressive overload."
                  : "Live tonnage telemetry, RPE tracking, and 1RM calculation active."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLocation("/start-session")}
              className="w-full py-3.5 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(198,255,61,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play size={16} fill="black" />
              <span>Start Today's Workout</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setLocation("/log-food")}
                className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <span>Log Nutrition</span>
                <ArrowRight size={12} />
              </button>

              <button
                type="button"
                onClick={() => setGlossaryModalOpen(true)}
                className="py-2.5 bg-[#c6ff3d]/10 hover:bg-[#c6ff3d]/20 border border-[#c6ff3d]/30 text-[#c6ff3d] rounded-xl text-xs font-mono font-medium transition-all flex items-center justify-center gap-1.5"
              >
                <BookOpen size={13} />
                <span>Explain Terms</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Beginner Glossary Modal */}
      <BeginnerGlossaryModal 
        open={glossaryModalOpen} 
        onOpenChange={setGlossaryModalOpen} 
      />
    </>
  );
}
