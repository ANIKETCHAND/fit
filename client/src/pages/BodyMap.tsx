import { useState } from "react";
import { Activity, ArrowLeft, RotateCcw, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";
import { BodyScene } from "@/components/3d/BodyScene";
import { MuscleInfo } from "@/components/3d/MuscleInfo";
import { muscleLibrary, type MuscleId } from "@/lib/fitness-data";

export default function BodyMap() {
  const [selected, setSelected] = useState<MuscleId>("chest");
  const [, setLocation] = useLocation();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="dashboard-main">
        <header className="topbar">
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
                  <Sparkles size={11} className="text-[#c6ff3d]" /> 3D Muscle Studio
                </span>
                <h1 className="text-2xl font-bold uppercase font-sans text-white tracking-wide">
                  Anatomy & Recovery Map
                </h1>
              </div>
            </div>
          </div>
          <div className="topbar-actions flex items-center gap-2">
            <button
              onClick={() => setSelected("chest")}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono text-[#8b9c8a] hover:text-white transition-colors flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Reset Focus</span>
            </button>
          </div>
        </header>

        {/* 3D Anatomy Stage + Diagnostic Sidebar Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-[680px]">
          {/* Main 3D Interactive Canvas */}
          <motion.div
            className="lg:col-span-8 bg-[#070908] border border-white/10 rounded-2xl overflow-hidden relative min-h-[580px] flex flex-col"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <BodyScene selected={selected} onSelected={setSelected} />
          </motion.div>

          {/* Diagnostic Sidebar Panel */}
          <motion.div
            className="lg:col-span-4 flex flex-col"
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
          >
            <MuscleInfo muscle={muscleLibrary[selected]} />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
