import { ArrowRight, Utensils } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { getScopedKey } from "@/lib/user-store";

interface NutritionTarget {
  energy: { current: number; target: number; unit: string };
  protein: { current: number; target: number; unit: string };
  carbs: { current: number; target: number; unit: string };
  fats: { current: number; target: number; unit: string };
}

export function NutritionLedgerCard() {
  const [, setLocation] = useLocation();
  const [data, setData] = useState<NutritionTarget>({
    energy: { current: 0, target: 2400, unit: "kcal" },
    protein: { current: 0, target: 150, unit: "g" },
    carbs: { current: 0, target: 270, unit: "g" },
    fats: { current: 0, target: 65, unit: "g" },
  });

  useEffect(() => {
    try {
      const todayKey = new Date().toISOString().split("T")[0];
      const scopedToday = localStorage.getItem(getScopedKey("fittrack_logged_nutrition_today"));
      const legacyToday = localStorage.getItem("fittrack_logged_nutrition_today");
      const rawLogs = localStorage.getItem(getScopedKey("fittrack_nutrition_logs")) || localStorage.getItem("fittrack_nutrition_logs");

      let currentCals = 0;
      let currentProtein = 0;
      let currentCarbs = 0;
      let currentFats = 0;

      if (scopedToday || legacyToday) {
        const parsed = JSON.parse(scopedToday || legacyToday || "{}");
        currentCals = parsed.calories || 0;
        currentProtein = parsed.protein || 0;
        currentCarbs = parsed.carbs || 0;
        currentFats = parsed.fats || 0;
      } else if (rawLogs) {
        const list = JSON.parse(rawLogs);
        if (Array.isArray(list)) {
          const todayMeals = list.filter((m: any) => m.date === todayKey || m.consumedAt?.startsWith(todayKey));
          todayMeals.forEach((m: any) => {
            currentCals += Number(m.calories || 0);
            currentProtein += Number(m.protein || 0);
            currentCarbs += Number(m.carbs || 0);
            currentFats += Number(m.fats || 0);
          });
        }
      }

      setData({
        energy: { current: Math.round(currentCals), target: 2400, unit: "kcal" },
        protein: { current: Math.round(currentProtein), target: 150, unit: "g" },
        carbs: { current: Math.round(currentCarbs), target: 270, unit: "g" },
        fats: { current: Math.round(currentFats), target: 65, unit: "g" },
      });
    } catch {
      // fallback
    }
  }, []);

  const items = [
    { label: "Energy", ...data.energy },
    { label: "Protein", ...data.protein },
    { label: "Carbs", ...data.carbs },
    { label: "Fats", ...data.fats },
  ];

  return (
    <div className="editorial-card nutrition-card">
      <div className="card-topline flex items-center justify-between">
        <span className="card-label">NUTRITION LEDGER</span>
        <Utensils size={14} className="text-muted-foreground opacity-60" />
      </div>

      <div className="nutrition-ledger-rows">
        {items.map((item) => {
          const pct = Math.min(100, Math.round((item.current / item.target) * 100));
          return (
            <div key={item.label} className="nutrition-ledger-item">
              <div className="nutrition-item-meta">
                <span className="nutrition-label">{item.label}</span>
                <span className="nutrition-values">
                  {item.current.toLocaleString()} / {item.target.toLocaleString()} {item.unit}
                  <span className="nutrition-pct">{pct}%</span>
                </span>
              </div>
              <div className="nutrition-track">
                <div className="nutrition-bar" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <button
        className="card-footer-link"
        onClick={() => setLocation("/log-food")}
      >
        <span>View nutrition details</span>
        <ArrowRight size={14} />
      </button>
    </div>
  );
}
