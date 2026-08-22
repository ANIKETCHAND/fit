/** Kinetic Anatomy Lab: asymmetric training dashboard centered on the interactive anatomy stage. */
/* Kinetic Anatomy Lab: the overview is a sparse daily-status instrument, while detailed tools live in the sidebar. */
import { lazy, Suspense, useState } from "react";
import { Bell, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";
import { MuscleInfo } from "@/components/3d/MuscleInfo";
import { VitalStrip } from "@/components/dashboard/WeeklyProgress";
import { DailyStreak } from "@/components/dashboard/DailyStreak";
import { muscleLibrary, type MuscleId } from "@/lib/fitness-data";

const BodyScene = lazy(async () => {
  const module = await import("@/components/3d/BodyScene");
  return { default: module.BodyScene };
});

export default function Home() {
  const [selected, setSelected] = useState<MuscleId>("chest");
  const [, setLocation] = useLocation();
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="dashboard-main">
        <header className="topbar"><div className="topbar-left"><div className="header-wordmark"><img src="/manus-storage/fittrack-signal-mark_e3117665.png" alt="" /><strong>FIT<span>TRACK</span></strong></div><div className="topbar-greeting"><h1>Read the signal, <em>Jordan.</em></h1></div></div><div className="topbar-actions"><div className="fitness-score"><span>Fitness score</span><strong>84<small>/100</small></strong><i /></div><button className="icon-button" aria-label="Notifications" onClick={() => setLocation("/notifications")}><Bell size={19} /><b /></button><button className="avatar-button" aria-label="Open profile analytics" onClick={() => setLocation("/profile")}>JM<ChevronDown size={14} /></button></div></header>
        <motion.section className="dashboard-grid" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>
          <motion.div className="overview-column overview-column-focused" variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}><VitalStrip /><DailyStreak /></motion.div>
          <motion.div className="body-column" variants={{ hidden: { opacity: 0, scale: 0.985 }, visible: { opacity: 1, scale: 1 } }}><Suspense fallback={<div className="body-stage anatomy-loading"><span>Calibrating anatomy map</span></div>}><BodyScene selected={selected} onSelected={setSelected} /></Suspense></motion.div>
          <motion.div className="diagnostic-column" variants={{ hidden: { opacity: 0, x: 12 }, visible: { opacity: 1, x: 0 } }}><MuscleInfo muscle={muscleLibrary[selected]} /></motion.div><motion.div className="dashboard-scan-line" aria-hidden="true" initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: [0, .8, 0], scaleX: [0, 1, 1] }} transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 2.4 }} />
        </motion.section>
      </main>
    </div>
  );
}
