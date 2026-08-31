import { useState, useEffect } from "react";
import { ArrowUpRight, Flame, Plus, Sparkles, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { getCalibrationSettings, getScopedKey } from "@/lib/user-store";

interface LoggedMealEntry {
  kcal: number;
  p: number;
  c: number;
  f: number;
}

export function DailyNutritionWidget() {
  const [, setLocation] = useLocation();
  const [calibration] = useState(() => getCalibrationSettings());
  const [loggedNutrition, setLoggedNutrition] = useState<{ kcal: number; p: number; c: number; f: number }>({
    kcal: 0,
    p: 0,
    c: 0,
    f: 0,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(getScopedKey("fittrack_logged_nutrition_today"));
      if (saved) {
        const parsed: LoggedMealEntry[] = JSON.parse(saved);
        const totals = parsed.reduce(
          (acc, item) => ({
            kcal: acc.kcal + (item.kcal || 0),
            p: acc.p + (item.p || 0),
            c: acc.c + (item.c || 0),
            f: acc.f + (item.f || 0),
          }),
          { kcal: 0, p: 0, c: 0, f: 0 }
        );
        setLoggedNutrition(totals);
      }
    } catch {}
  }, []);

  const goalKcal = calibration.goalKcal || 2200;
  const goalProtein = calibration.goalProtein || 160;
  const goalCarbs = calibration.goalCarbs || 220;
  const goalFat = calibration.goalFat || 65;

  const currentKcal = Math.round(loggedNutrition.kcal);
  const currentProtein = Math.round(loggedNutrition.p);
  const currentCarbs = Math.round(loggedNutrition.c);
  const currentFat = Math.round(loggedNutrition.f);

  const kcalPercent = Math.min(100, Math.round((currentKcal / goalKcal) * 100)) || 0;
  const pPercent = Math.min(100, Math.round((currentProtein / goalProtein) * 100)) || 0;
  const cPercent = Math.min(100, Math.round((currentCarbs / goalCarbs) * 100)) || 0;
  const fPercent = Math.min(100, Math.round((currentFat / goalFat) * 100)) || 0;

  return (
    <section className="bg-gradient-to-br from-[#121a14] to-[#0b100d] border border-white/10 rounded-2xl p-5 mb-5 shadow-xl relative overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c6ff3d]/10 border border-[#c6ff3d]/30 flex items-center justify-center text-[#c6ff3d]">
            <Utensils size={19} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#8b9c8a] flex items-center gap-1">
                <Sparkles size={11} className="text-[#c6ff3d]" /> Daily Nutrition Targets
              </span>
              <span className="text-[10px] font-mono text-[#c6ff3d] bg-[#c6ff3d]/10 px-2 py-0.2 rounded border border-[#c6ff3d]/30">
                {kcalPercent}% Fuel Met
              </span>
            </div>
            <h2 className="text-xl font-bold text-white uppercase font-sans tracking-wide mt-0.5">
              Today's Calorie & Macro Target
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation("/log-food")}
            className="py-2.5 px-4 bg-[#c6ff3d] hover:bg-[#b8f52e] text-[#0a100c] rounded-xl font-bold text-xs uppercase font-sans tracking-wider flex items-center gap-1.5 transition-transform active:scale-[0.98] shadow-lg shadow-[#c6ff3d]/15"
          >
            <Plus size={14} />
            <span>Log Meal</span>
          </button>
          <button
            onClick={() => setLocation("/log-food")}
            className="py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-mono transition-colors flex items-center gap-1"
          >
            <span>Details</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
      </div>

      {/* Calories & Macros Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
        {/* Calories Card */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider">Energy</span>
            <Flame size={14} className="text-amber-400" />
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-white">{currentKcal}</span>
              <span className="text-xs font-mono text-[#8b9c8a]">/ {goalKcal} kcal</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-amber-400 to-[#c6ff3d] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${kcalPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Protein Card */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider">Protein</span>
            <span className="text-[10px] font-mono text-[#c6ff3d] font-bold">{pPercent}%</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-[#c6ff3d]">{currentProtein}g</span>
              <span className="text-xs font-mono text-[#8b9c8a]">/ {goalProtein}g</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#c6ff3d] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Carbs Card */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider">Carbs</span>
            <span className="text-[10px] font-mono text-sky-400 font-bold">{cPercent}%</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-sky-400">{currentCarbs}g</span>
              <span className="text-xs font-mono text-[#8b9c8a]">/ {goalCarbs}g</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-sky-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${cPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        {/* Fat Card */}
        <div className="bg-black/40 border border-white/5 rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider">Fats</span>
            <span className="text-[10px] font-mono text-purple-400 font-bold">{fPercent}%</span>
          </div>
          <div className="my-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold font-mono text-purple-400">{currentFat}g</span>
              <span className="text-xs font-mono text-[#8b9c8a]">/ {goalFat}g</span>
            </div>
          </div>
          <div>
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-purple-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${fPercent}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
