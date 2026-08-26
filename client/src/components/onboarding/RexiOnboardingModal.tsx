/* FitTrack: Rexi AI Onboarding Modal (Step 1: 3D Rexi Introduction -> Step 2: Experience Selection -> Step 3: Gym Rat Popup / Beginner Tour) */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, Dumbbell, Flame, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Rexi3DCanvas } from "./Rexi3DCanvas";
import { getAthleteProfile, saveExperienceMode, getScopedKey } from "@/lib/user-store";

export function RexiOnboardingModal() {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [stage, setStage] = useState<"greeting" | "ask_level" | "gym_rat_popup">("greeting");
  const [selectedLevel, setSelectedLevel] = useState<"beginner" | "intermediate" | "advanced" | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const profile = getAthleteProfile() || { name: "Athlete" };
  const rawName = (profile?.name && typeof profile.name === "string" ? profile.name : "Athlete").trim();
  const firstName = rawName.split(" ")[0] || "Athlete";

  useEffect(() => {
    const checkAndOpen = () => {
      try {
        const trigger = localStorage.getItem("fittrack_trigger_rexi_welcome");
        const welcomed = sessionStorage.getItem("fittrack_rexi_welcomed");
        if (trigger === "true" || !welcomed) {
          localStorage.removeItem("fittrack_trigger_rexi_welcome");
          setStage("greeting");
          setIsTransitioning(false);
          setSelectedLevel(null);
          setIsOpen(true);
        }
      } catch {
        setIsOpen(true);
      }
    };

    const timer = setTimeout(checkAndOpen, 200);

    const handleOpen = () => {
      setStage("greeting");
      setIsTransitioning(false);
      setSelectedLevel(null);
      setIsOpen(true);
    };

    window.addEventListener("fittrack_open_rexi_onboarding", handleOpen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("fittrack_open_rexi_onboarding", handleOpen);
    };
  }, [location]);

  const handleSelectLevel = (level: "beginner" | "intermediate" | "advanced") => {
    setSelectedLevel(level);

    try {
      saveExperienceMode(level === "beginner" ? "beginner" : "advanced");
      sessionStorage.setItem("fittrack_rexi_welcomed", "true");
      localStorage.setItem("fittrack_just_onboarded", "true");
    } catch {}

    if (level === "beginner") {
      setIsTransitioning(true);
      toast.success("Beginner Mode activated! Launching Rexi Guided Tour...");
      setTimeout(() => {
        setIsOpen(false);
        window.dispatchEvent(new CustomEvent("fittrack_start_beginner_tour"));
      }, 1200);
    } else {
      // Open dedicated "Welcome Gym rat" popup box!
      setStage("gym_rat_popup");
    }
  };

  const handleProceedToSettings = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsOpen(false);
      setLocation("/settings");
    }, 400);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          key={stage}
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className={`w-full ${
            stage === "greeting" ? "max-w-md" : stage === "gym_rat_popup" ? "max-w-md" : "max-w-lg"
          } bg-[#0c120e] border border-[#c6ff3d]/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_60px_rgba(198,255,61,0.22)] text-white relative overflow-hidden transition-all duration-300`}
        >
          {/* Ambient Glows */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#c6ff3d]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none" />

          {stage === "greeting" ? (
            /* STAGE 1: FIRST ONLY 3D REXI COMES JUMPING & GREETING */
            <div className="flex flex-col items-center text-center">
              <div className="w-full relative flex items-center justify-center -mt-2">
                <Rexi3DCanvas step="greeting" />
                <span className="absolute top-2 right-4 bg-[#c6ff3d] text-black text-[9px] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md pointer-events-none">
                  3D AI Guide
                </span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2 space-y-2"
              >
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Hello, <span className="text-[#c6ff3d]">{firstName}</span>! 👋
                </h2>

                <p className="text-sm text-[#b8cbb5] max-w-xs mx-auto leading-relaxed">
                  I'm <strong className="text-white">Rexi</strong>, your personal 3D AI fitness companion.
                </p>

                <p className="text-xs text-[#718270] font-mono">
                  Let's calibrate your training protocol in 2 quick steps.
                </p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => setStage("ask_level")}
                className="w-full mt-6 py-3.5 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(198,255,61,0.35)] transition-all flex items-center justify-center gap-2"
              >
                <span>Let's Get Started</span>
                <ArrowRight size={15} />
              </motion.button>
            </div>
          ) : stage === "gym_rat_popup" ? (
            /* STAGE 3 (GYM RAT POPUP): DEDICATED NEW BOX FOR INTERMEDIATE & PRO */
            <div className="flex flex-col items-center text-center">
              <div className="w-full relative flex items-center justify-center -mt-2">
                <Rexi3DCanvas step="greeting" isCelebrating={true} />
                <span className="absolute top-2 right-4 bg-amber-400 text-black text-[9px] font-bold font-mono px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md pointer-events-none flex items-center gap-1">
                  <span>🐀🔥</span> Gym Rat Mode
                </span>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-3 space-y-2.5"
              >
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#c6ff3d]/10 border border-[#c6ff3d]/30 rounded-full text-[#c6ff3d] text-[11px] font-mono font-bold uppercase tracking-wider">
                  <Dumbbell size={13} />
                  <span>{selectedLevel === "advanced" ? "Pro Athlete" : "Intermediate"} Unlocked</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome, <span className="text-[#c6ff3d]">Gym Rat! 🐀🔥</span>
                </h2>

                <p className="text-xs sm:text-sm text-[#b8cbb5] max-w-xs mx-auto leading-relaxed">
                  You already know the iron game! Full 3D muscle telemetry, progressive overload tracking, and hypertrophy diagnostics are primed for you.
                </p>

                <p className="text-[11px] text-[#718270] font-mono bg-black/40 p-2.5 rounded-xl border border-white/5">
                  ⚡ Next: Calibrate your body mass (kg), height & target load in Settings.
                </p>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={handleProceedToSettings}
                disabled={isTransitioning}
                className="w-full mt-5 py-3.5 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl shadow-[0_0_25px_rgba(198,255,61,0.35)] transition-all flex items-center justify-center gap-2"
              >
                <span>Calibrate Body Mass in Settings</span>
                <ArrowRight size={15} />
              </motion.button>
            </div>
          ) : (
            /* STAGE 2: THEN REXI ASKS YOUR TRAINING LEVEL */
            <div className="flex flex-col items-center text-center">
              <div className="w-full h-[160px] relative flex items-center justify-center -mt-2 mb-2">
                <Rexi3DCanvas step="ask_level" isCelebrating={isTransitioning} />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                What is your training experience level?
              </h3>
              <p className="text-xs text-[#8b9c8a] mt-0.5 mb-4 font-mono">
                Step 1 of 2 • Tailors weight load & form guidance
              </p>

              {/* 3 Experience Level Cards */}
              <div className="w-full space-y-2.5">
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
                      className={`w-full p-3.5 rounded-2xl text-left border transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-[#c6ff3d] bg-[#c6ff3d]/20 shadow-[0_0_25px_rgba(198,255,61,0.25)]"
                          : `border-white/10 bg-white/[0.03] ${item.border} hover:bg-white/[0.06]`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${item.bg} ${item.color}`}>
                          <Icon size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                            {item.title}
                            {isSelected && <Check size={14} className="text-[#c6ff3d]" />}
                          </div>
                          <div className="text-[10px] sm:text-[11px] text-[#8b9c8a] mt-0.5">{item.desc}</div>
                        </div>
                      </div>

                      <ArrowRight size={15} className="text-[#8b9c8a] flex-shrink-0 ml-2" />
                    </motion.button>
                  );
                })}
              </div>

              {/* Transition Indicator */}
              <div className="mt-4 text-center">
                {isTransitioning ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-mono text-[#c6ff3d] flex items-center justify-center gap-2"
                  >
                    <Sparkles size={14} className="animate-spin" />
                    <span>Calibrating... Launching Guided Tour</span>
                  </motion.div>
                ) : (
                  <p className="text-[10px] font-mono text-[#5a6b58]">
                    Next step: Calibrate body mass (kg), height & daily targets
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
