import { Activity, Bell, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/navigation/Sidebar";
import { DailyNutritionWidget } from "@/components/dashboard/DailyNutritionWidget";
import { WhatShouldIDoTodayCard } from "@/components/dashboard/WhatShouldIDoTodayCard";
import { MuscleRecoveryOverviewCard } from "@/components/dashboard/MuscleRecoveryOverviewCard";
import { DailyStreak } from "@/components/dashboard/DailyStreak";
import { VitalStrip, WeeklyProgress } from "@/components/dashboard/WeeklyProgress";
import { getAthleteProfile } from "@/lib/user-store";

export default function Home() {
  const [, setLocation] = useLocation();
  const profile = getAthleteProfile();
  const firstName = profile.name.split(" ")[0].toUpperCase();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="dashboard-main">
        {/* Top Header */}
        <header className="topbar">
          <div className="topbar-left">
            <div className="header-wordmark">
              <div className="brand-logo-icon" style={{ width: 26, height: 26, marginRight: 6 }}>
                <Activity size={15} />
              </div>
              <strong>FIT<span>TRACK</span></strong>
            </div>
            <div className="topbar-greeting">
              <h1 className="hero-greeting">
                READ THE SIGNAL, <span className="athlete-glow-name">{firstName}.</span>
              </h1>
            </div>
          </div>
          <div className="topbar-actions flex items-center gap-2">
            <button className="icon-button" aria-label="Notifications" onClick={() => setLocation("/notifications")}>
              <Bell size={19} />
              <b />
            </button>
            <button className="avatar-button" aria-label="Open profile analytics" onClick={() => setLocation("/profile")}>
              {profile.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              <ChevronDown size={14} />
            </button>
          </div>
        </header>

        {/* 1. Prominent Daily Nutrition Target Widget */}
        <DailyNutritionWidget />

        {/* 2. Primary Guidance: What Should I Do Today? Card */}
        <WhatShouldIDoTodayCard />

        {/* 3. Core Telemetry & Studio Grid */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
        >
          {/* Left Column: Weekly Load & Vitals */}
          <motion.div
            className="lg:col-span-7 flex flex-col gap-4"
            variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          >
            <WeeklyProgress />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DailyStreak />
              <VitalStrip />
            </div>
          </motion.div>

          {/* Right Column: 3D Muscle Readiness Studio Card */}
          <motion.div
            className="lg:col-span-5 flex flex-col"
            variants={{ hidden: { opacity: 0, x: 12 }, visible: { opacity: 1, x: 0 } }}
          >
            <MuscleRecoveryOverviewCard />
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
