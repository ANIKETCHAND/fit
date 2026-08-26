/* FitTrack: Rexi AI Interactive App Tour for Beginners */
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { RexiMascotIcon } from "@/components/ai/EchoAssistant";

export interface TourStep {
  stepIndex: number;
  title: string;
  path: string;
  pageName: string;
  speechText: string;
  quickHighlight: string;
}

export const tourSteps: TourStep[] = [
  {
    stepIndex: 0,
    title: "Step 1: Calibration & Body Mass",
    path: "/settings",
    pageName: "Calibration Deck",
    speechText:
      "First, let's look at your Calibration Deck! Here you set your body mass (kg), height, and training frequency so I can auto-calculate your daily energy and protein targets.",
    quickHighlight: "💡 Set your weight & height to personalize your metabolism.",
  },
  {
    stepIndex: 1,
    title: "Step 2: 3D Body Command Center",
    path: "/overview",
    pageName: "Command Deck",
    speechText:
      "This is your 3D Command Center! Click on any muscle on the 3D human body to see which exercises target it and check your readiness.",
    quickHighlight: "💡 Rotate & tap any muscle group to view targeting movements.",
  },
  {
    stepIndex: 2,
    title: "Step 3: Movement Library",
    path: "/exercise-library",
    pageName: "Exercise Library",
    speechText:
      "Welcome to the Movement Library! Browse form guides with 3D animation videos, search exercises, or tap the heart icon to save your favorites.",
    quickHighlight: "💡 Watch video form guides and filter by favorites.",
  },
  {
    stepIndex: 3,
    title: "Step 4: Smart Indian Nutrition Lab",
    path: "/log-food",
    pageName: "Fuel & Nutrition Lab",
    speechText:
      "Here is your Fuel Lab! Search 50+ Indian staples (Paneer, Roti, Dal, Sattu, Chicken), select portions (0.5x, 1x, 2x), and track your daily macros.",
    quickHighlight: "💡 Search Indian dishes and track daily calorie & protein rings.",
  },
  {
    stepIndex: 4,
    title: "Step 5: Active Workout Session",
    path: "/log-workout",
    pageName: "Workout Logger",
    speechText:
      "Ready to train? Log your sets, reps, and weights here. In Beginner Mode, I'll provide form safety cues, warm-up checklists, and starter weight recommendations!",
    quickHighlight: "💡 Log exercises with built-in beginner warm-up guidance.",
  },
];

export function RexiGuidedTour() {
  const [location, setLocation] = useLocation();
  const [isActive, setIsActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Check if tour should be active
    try {
      const activeFlag = sessionStorage.getItem("fittrack_beginner_tour_active");
      if (activeFlag === "true") {
        setIsActive(true);
        const savedIndex = Number(sessionStorage.getItem("fittrack_beginner_tour_step")) || 0;
        setCurrentStepIndex(savedIndex);
      }
    } catch {}

    const handleStartTour = () => {
      sessionStorage.setItem("fittrack_beginner_tour_active", "true");
      sessionStorage.setItem("fittrack_beginner_tour_step", "0");
      setCurrentStepIndex(0);
      setIsActive(true);
      setLocation(tourSteps[0].path);
    };

    window.addEventListener("fittrack_start_beginner_tour", handleStartTour);
    return () => window.removeEventListener("fittrack_start_beginner_tour", handleStartTour);
  }, []);

  const currentStep = tourSteps[currentStepIndex] || tourSteps[0];

  const goToStep = (index: number) => {
    if (index < 0 || index >= tourSteps.length) return;
    setCurrentStepIndex(index);
    sessionStorage.setItem("fittrack_beginner_tour_step", String(index));
    setLocation(tourSteps[index].path);
  };

  const handleNext = () => {
    if (currentStepIndex < tourSteps.length - 1) {
      goToStep(currentStepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      goToStep(currentStepIndex - 1);
    }
  };

  const handleFinish = () => {
    setIsActive(false);
    sessionStorage.removeItem("fittrack_beginner_tour_active");
    sessionStorage.removeItem("fittrack_beginner_tour_step");
    toast.success("Tour complete! You're ready to start your training protocol.", {
      icon: "🎉",
    });
    setLocation("/overview");
  };

  if (!isActive) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ duration: 0.32, ease: [0.23, 1, 0.32, 1] }}
        className="fixed bottom-5 right-5 sm:right-8 z-[99999] max-w-md w-[calc(100vw-40px)] sm:w-[440px] bg-[#0c130e]/95 border border-[#c6ff3d]/40 rounded-3xl p-5 shadow-[0_10px_50px_rgba(0,0,0,0.8),0_0_35px_rgba(198,255,61,0.25)] text-white backdrop-blur-2xl"
      >
        {/* Top Tour Step Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="bg-[#c6ff3d] text-black text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              Rexi Guided Tour
            </span>
            <span className="text-xs font-mono text-[#8b9c8a]">
              {currentStepIndex + 1} of {tourSteps.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleFinish}
            className="p-1 rounded-lg text-[#8b9c8a] hover:text-white hover:bg-white/10 transition-colors"
            title="Exit Tour"
          >
            <X size={16} />
          </button>
        </div>

        {/* Rexi Character + Speech Area */}
        <div className="flex items-start gap-3.5 mb-4">
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="flex-shrink-0 mt-0.5"
          >
            <RexiMascotIcon size={46} animated />
          </motion.div>

          <div className="flex-1">
            <div className="font-bold text-sm text-white flex items-center gap-1.5">
              <span>{currentStep.pageName}</span>
              <span className="text-[10px] font-normal font-mono text-[#c6ff3d] bg-[#c6ff3d]/10 px-1.5 py-0.5 rounded border border-[#c6ff3d]/30">
                {currentStep.path}
              </span>
            </div>

            <p className="text-xs text-[#d1e0cf] mt-1.5 leading-relaxed">
              {currentStep.speechText}
            </p>

            <div className="mt-2 text-[11px] font-mono text-[#8b9c8a] bg-black/40 p-2 rounded-xl border border-white/5">
              {currentStep.quickHighlight}
            </div>
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1.5">
            {tourSteps.map((step, idx) => (
              <button
                key={step.stepIndex}
                type="button"
                onClick={() => goToStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStepIndex
                    ? "w-6 bg-[#c6ff3d]"
                    : idx < currentStepIndex
                    ? "w-2 bg-[#38bdf8]"
                    : "w-2 bg-white/20"
                }`}
                title={`Jump to ${step.pageName}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1"
              >
                <ArrowLeft size={13} /> Back
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 bg-[#c6ff3d] hover:bg-[#b0f028] text-black rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 shadow-[0_0_15px_rgba(198,255,61,0.3)]"
            >
              {currentStepIndex === tourSteps.length - 1 ? (
                <>
                  <span>Finish Tour</span>
                  <Check size={13} />
                </>
              ) : (
                <>
                  <span>Next Page</span>
                  <ArrowRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
