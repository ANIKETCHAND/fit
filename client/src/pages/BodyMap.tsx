import { useState } from "react";
import { ArrowLeft, RotateCcw, Sparkles, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BodyScene } from "@/components/3d/BodyScene";
import { MuscleInfo } from "@/components/3d/MuscleInfo";
import { muscleLibrary, type MuscleId } from "@/lib/fitness-data";

export default function BodyMap() {
  // Default to "quads" to match the user's reference image with highlighted quadriceps!
  const [selected, setSelected] = useState<MuscleId>("quads");
  const [showDetails, setShowDetails] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="dashboard-main flex flex-col flex-1 pb-10">
        {/* Top Header Bar */}
        <header className="topbar mb-4">
          <div className="topbar-left">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/overview")}
                className="icon-button flex items-center justify-center rounded-xl"
                aria-label="Back to Overview"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <span className="eyebrow flex items-center gap-1">
                  <Sparkles size={11} className="text-[#c6ff3d]" /> 3D Holographic Studio
                </span>
                <h1 className="text-xl sm:text-2xl font-bold uppercase font-sans text-white tracking-wide">
                  Cyber Anatomy & Muscle Map
                </h1>
              </div>
            </div>
          </div>
          <div className="topbar-actions flex items-center gap-2">
            {/* Toggle Detailed Diagnostics Panel */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-[#a3b899] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Layers size={13} className={showDetails ? "text-[#baff57]" : ""} />
              <span>{showDetails ? "Hide Diagnostics" : "Diagnostic Ledger"}</span>
            </button>
            <button
              onClick={() => setSelected("quads")}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-[#8b9c8a] hover:text-white transition-colors flex items-center gap-1.5"
              title="Reset focus to Quadriceps"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </header>

        {/* Holographic 3D Stage + Diagnostic Drawer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch min-h-[720px] flex-1">
          {/* Main 3D Holographic Canvas Stage (Matches screenshot!) */}
          <motion.div
            className={`${
              showDetails ? "lg:col-span-8" : "lg:col-span-12"
            } bg-[#050806] border border-white/10 rounded-2xl overflow-hidden relative min-h-[640px] flex flex-col shadow-2xl transition-all duration-300`}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <BodyScene selected={selected} onSelected={setSelected} />
          </motion.div>

          {/* Expandable Diagnostic Sidebar Panel */}
          <AnimatePresence>
            {showDetails && (
              <motion.div
                className="lg:col-span-4 flex flex-col"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.28 }}
              >
                <MuscleInfo muscle={muscleLibrary[selected]} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
