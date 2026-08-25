/* FitTrack: Rexi AI Welcome & Experience Level Calibration Modal */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Bot, Check, Flame, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Rexi3DCanvas } from "./Rexi3DCanvas";
import { getAthleteProfile, saveExperienceMode, getScopedKey } from "@/lib/user-store";

export function RexiOnboardingModal() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<"beginner" | "intermediate" | "advanced" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const profile = getAthleteProfile() || { name: "Athlete" };
  const rawName = (profile?.name && typeof profile.name === "string" ? profile.name : "Athlete").trim();
  const firstName = rawName.split(" ")[0] || "Athlete";

  useEffect(() => {
    // Check if onboarding has been completed
    try {
      const completed = localStorage.getItem(getScopedKey("fittrack_onboarding_completed"));
      if (!completed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const handleSelectLevel = (level: "beginner" | "intermediate" | "advanced") => {
    setSelectedLevel(level);
    setIsTransitioning(true);

    try {
      saveExperienceMode(level === "beginner" ? "beginner" : "advanced");
      localStorage.setItem(getScopedKey("fittrack_onboarding_completed"), "true");
      localStorage.setItem("fittrack_just_onboarded", "true");
    } catch {}

    const levelTitle = level === "beginner" ? "Beginner" : level === "intermediate" ? "Intermediate" : "Pro";
    toast.success(`Experience level set to ${levelTitle}!`);

    // Redirect to Settings page after celebratory jump animation
    setTimeout(() => {
      setIsOpen(false);
      setLocation("/settings");
    }, 1400);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="w-full max-w-lg bg-[#0c120e] border border-[#c6ff3d]/30 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(198,255,61,0.2)] text-white relative overflow-hidden"
        >
          {/* Background Ambient Glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#c6ff3d]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none" />

          {/* 3D Animated Jumping Rexi Mascot */}
          <div className="flex flex-col items-center text-center -mt-2 mb-4">
            <div className="w-full h-[190px] relative flex items-center justify-center">
              <Rexi3DCanvas isCelebrating={isTransitioning} />
              <span className="absolute bottom-1 right-6 bg-[#c6ff3d] text-black text-[9px] font-bold font-mono px-2 py-0.5 rounded-full uppercase tracking-wider shadow-md pointer-events-none">
                3D AI Guide
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-1">
              Hello, <span className="text-[#c6ff3d]">{firstName}</span>! 👋
            </h2>

            <p className="text-xs sm:text-sm text-[#a2b59f] mt-1 max-w-sm">
              I'm <strong className="text-white">Rexi</strong>! What is your training experience level?
            </p>
          </div>

          {/* 3 Experience Level Cards */}
          <div className="space-y-2.5">
            {[
              {
                id: "beginner" as const,
                title: "Beginner",
                desc: "New to training • Need form guidance & starter weights",
                icon: ShieldCheck,
                color: "text-emerald-400",
                border: "hover:border-emerald-400/50",
                bg: "bg-emerald-500/10",
              },
              {
                id: "intermediate" as const,
                title: "Intermediate",
                desc: "Consistent training • Progressive overload & hypertrophy",
                icon: Zap,
                color: "text-[#c6ff3d]",
                border: "hover:border-[#c6ff3d]/50",
                bg: "bg-[#c6ff3d]/10",
              },
              {
                id: "advanced" as const,
                title: "Pro Athlete",
                desc: "Experienced lifter • High volume, intensity & telemetry",
                icon: Flame,
                color: "text-amber-400",
                border: "hover:border-amber-400/50",
                bg: "bg-amber-500/10",
              },
            ].map((item) => {
              const isSelected = selectedLevel === item.id;
              const Icon = item.icon;

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleSelectLevel(item.id)}
                  disabled={isTransitioning}
                  className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? "border-[#c6ff3d] bg-[#c6ff3d]/20 shadow-[0_0_25px_rgba(198,255,61,0.25)]"
                      : `border-white/10 bg-white/[0.03] ${item.border} hover:bg-white/[0.06]`
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        {item.title}
                        {isSelected && <Check size={14} className="text-[#c6ff3d]" />}
                      </div>
                      <div className="text-[11px] text-[#8b9c8a] mt-0.5">{item.desc}</div>
                    </div>
                  </div>

                  <ArrowRight size={16} className="text-[#8b9c8a] flex-shrink-0 ml-2" />
                </motion.button>
              );
            })}
          </div>

          {/* Bottom Progress State */}
          <div className="mt-5 text-center">
            {isTransitioning ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-mono text-[#c6ff3d] flex items-center justify-center gap-2"
              >
                <Sparkles size={14} className="animate-spin" />
                Calibrating protocol... Redirecting to Settings for body weight
              </motion.div>
            ) : (
              <p className="text-[10px] font-mono text-[#5a6b58]">
                Next: Calibrate body mass (kg), height & daily targets in Settings
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
