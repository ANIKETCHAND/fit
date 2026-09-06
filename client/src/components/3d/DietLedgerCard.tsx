import { useState, useEffect } from "react";
import { getScopedKey } from "@/lib/user-store";

interface DietLedgerCardProps {
  className?: string;
}

export function DietLedgerCard({ className = "" }: DietLedgerCardProps) {
  // Calibration targets matching user's screenshot: 2,400 kcal, 150g protein, 370g carbs, 65g fats
  const targets = {
    energy: 2400,
    protein: 150,
    carbs: 370,
    fats: 65,
  };

  const [current, setCurrent] = useState({
    energy: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  // Sync with live logged nutrition if available
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(getScopedKey("fittrack_logged_nutrition_today")) ||
        localStorage.getItem("fittrack_logged_nutrition_today");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const totalEnergy = parsed.reduce((sum: number, item: any) => sum + (Number(item.kcal) || 0), 0);
          const totalProtein = parsed.reduce((sum: number, item: any) => sum + (Number(item.p) || 0), 0);
          const totalCarbs = parsed.reduce((sum: number, item: any) => sum + (Number(item.c) || 0), 0);
          const totalFats = parsed.reduce((sum: number, item: any) => sum + (Number(item.f) || 0), 0);
          setCurrent({
            energy: Math.round(totalEnergy),
            protein: Math.round(totalProtein),
            carbs: Math.round(totalCarbs),
            fats: Math.round(totalFats),
          });
        }
      }
    } catch {}
  }, []);

  const getPercent = (val: number, max: number) => {
    if (!max || max <= 0) return 0;
    return Math.min(100, Math.round((val / max) * 100));
  };

  return (
    <div
      className={`relative rounded-2xl p-3.5 sm:p-4 select-none ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(16, 24, 20, 0.88) 0%, rgba(8, 14, 11, 0.94) 100%)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15)",
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between mb-2.5 pb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] sm:text-[11px] font-mono font-bold tracking-[0.2em] text-[#a3b899] uppercase"
            style={{ textShadow: "0 0 12px rgba(186, 255, 87, 0.25)" }}
          >
            TOTAL / DIET LEDGER
          </span>
        </div>
        <div className="flex items-center gap-1 text-[#8b9c8a] opacity-70">
          <span className="font-mono text-[10px] font-semibold tracking-wider">M</span>
        </div>
      </div>

      {/* 4 Glowing Macro Sliders */}
      <div className="flex flex-col gap-2.5">
        {/* 1. Energy Slider */}
        <MacroSliderRow
          label="Energy"
          current={current.energy}
          target={targets.energy}
          unit="kcal"
          color="#a3e635"
          glowColor="rgba(163, 230, 53, 0.55)"
          trackGradient="linear-gradient(90deg, #65a30d, #a3e635)"
          percent={getPercent(current.energy, targets.energy)}
        />

        {/* 2. Protein Slider */}
        <MacroSliderRow
          label="Protein"
          current={current.protein}
          target={targets.protein}
          unit="g"
          color="#38bdf8"
          glowColor="rgba(56, 189, 248, 0.55)"
          trackGradient="linear-gradient(90deg, #0284c7, #38bdf8)"
          percent={getPercent(current.protein, targets.protein)}
        />

        {/* 3. Carbs Slider */}
        <MacroSliderRow
          label="Carbs"
          current={current.carbs}
          target={targets.carbs}
          unit="g"
          color="#fbbf24"
          glowColor="rgba(251, 191, 36, 0.55)"
          trackGradient="linear-gradient(90deg, #d97706, #fbbf24)"
          percent={getPercent(current.carbs, targets.carbs)}
        />

        {/* 4. Fats Slider */}
        <MacroSliderRow
          label="Fats"
          current={current.fats}
          target={targets.fats}
          unit="g"
          color="#f97316"
          glowColor="rgba(249, 115, 22, 0.55)"
          trackGradient="linear-gradient(90deg, #ea580c, #fb923c)"
          percent={getPercent(current.fats, targets.fats)}
        />
      </div>
    </div>
  );
}

interface MacroSliderRowProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
  glowColor: string;
  trackGradient: string;
  percent: number;
}

function MacroSliderRow({
  label,
  current,
  target,
  unit,
  color,
  glowColor,
  trackGradient,
  percent,
}: MacroSliderRowProps) {
  const visualPercent = Math.max(percent > 0 ? percent : 2, 2);

  return (
    <div className="flex flex-col gap-0.5">
      {/* Label and Numbers */}
      <div className="flex items-center justify-between text-[11px] font-mono">
        <span className="text-[#f0f5ed] font-medium tracking-wide">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className="text-[#dbe6d6] font-mono tracking-tight font-semibold text-[10.5px]">
            {current.toLocaleString()} / {target.toLocaleString()} {unit}
          </span>
          <span
            className="font-mono font-bold text-[10.5px]"
            style={{ color: percent > 0 ? color : "#6b7280" }}
          >
            {percent}%
          </span>
        </div>
      </div>

      {/* Glowing Track with Pill Thumb */}
      <div
        className="relative h-2.5 w-full rounded-full overflow-visible flex items-center"
        style={{
          background: "rgba(255, 255, 255, 0.08)",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.6)",
        }}
      >
        {/* Filled Gradient Bar */}
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{
            width: `${visualPercent}%`,
            background: trackGradient,
            boxShadow: `0 0 14px ${glowColor}, inset 0 1px 1px rgba(255, 255, 255, 0.4)`,
          }}
        >
          {/* Glowing Slider Thumb Orb/Pill */}
          <div
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3.5 h-3.5 rounded-full border border-white/60 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
            style={{
              background: "radial-gradient(circle at 35% 35%, #ffffff 0%, rgba(255,255,255,0.7) 40%, #888888 100%)",
              boxShadow: `0 0 10px ${glowColor}, 0 2px 5px rgba(0,0,0,0.6)`,
            }}
          >
            <div className="w-1 h-1 rounded-full" style={{ background: color }} />
          </div>
        </div>
      </div>
    </div>
  );
}
