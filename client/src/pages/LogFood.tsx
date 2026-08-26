/* FitTrack: Smart Nutrition Lab & Comprehensive Indian Food Database */
import { useMemo, useState } from "react";
import { 
  Check, 
  ChevronRight, 
  Dumbbell, 
  Flame, 
  Leaf, 
  Plus, 
  Search, 
  Sparkles, 
  Trash2, 
  Utensils, 
  Wheat, 
  X,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { INDIAN_FOOD_DATABASE, type IndianFoodItem } from "@/data/indian-foods";
import { getCalibrationSettings, getScopedKey } from "@/lib/user-store";

interface LoggedEntry {
  id: string;
  name: string;
  hindiName?: string;
  portionMultiplier: number;
  servingSize: string;
  meal: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  time: string;
}

type FilterCategory = "all" | "high_protein" | "veg" | "nonveg" | "dal_legumes" | "roti_rice" | "breakfast_snacks" | "recovery_shakes";

export default function LogFood() {
  const [meal, setMeal] = useState<string>("Lunch");
  const [query, setQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);

  // Targets from Calibration Settings
  const calibration = getCalibrationSettings();
  const targetKcal = calibration?.goalKcal || 2400;
  const targetProtein = calibration?.goalProtein || 160;
  const targetCarbs = calibration?.goalCarbs || 260;
  const targetFat = calibration?.goalFat || 65;

  // Custom foods saved in localStorage
  const [customFoods, setCustomFoods] = useState<IndianFoodItem[]>(() => {
    try {
      const saved = localStorage.getItem(getScopedKey("fittrack_custom_indian_foods"));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allFoods = useMemo(() => {
    return [...customFoods, ...INDIAN_FOOD_DATABASE];
  }, [customFoods]);

  const [picked, setPicked] = useState<IndianFoodItem>(() => allFoods[0]);

  // Logged items for today
  const [loggedEntries, setLoggedEntries] = useState<LoggedEntry[]>(() => {
    try {
      const saved = localStorage.getItem(getScopedKey("fittrack_logged_nutrition_today"));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filtered Food List
  const filteredFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFoods.filter((item) => {
      // Category Match
      if (activeCategory === "high_protein" && item.p < 15) return false;
      if (activeCategory === "veg" && !item.isVeg) return false;
      if (activeCategory === "nonveg" && item.isVeg) return false;
      if (activeCategory === "dal_legumes" && item.category !== "dal_legumes") return false;
      if (activeCategory === "roti_rice" && item.category !== "roti_rice") return false;
      if (activeCategory === "breakfast_snacks" && item.category !== "breakfast_snacks") return false;
      if (activeCategory === "recovery_shakes" && item.category !== "recovery_shakes") return false;

      // Text query match
      if (!q) return true;
      const matchName = item.name.toLowerCase().includes(q);
      const matchHindi = item.hindiName?.toLowerCase().includes(q) || false;
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchHindi || matchTags;
    });
  }, [allFoods, query, activeCategory]);

  // Modal State for adding custom food
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    hindiName: "",
    servingSize: "1 medium bowl (150g)",
    kcal: "220",
    p: "14",
    c: "25",
    f: "6",
    isVeg: true,
  });

  // Calculate scaled macros for selected item
  const currentKcal = Math.round(picked.kcal * portionMultiplier);
  const currentP = Math.round(picked.p * portionMultiplier * 10) / 10;
  const currentC = Math.round(picked.c * portionMultiplier * 10) / 10;
  const currentF = Math.round(picked.f * portionMultiplier * 10) / 10;

  // Total daily intake calculations
  const totalLoggedKcal = loggedEntries.reduce((acc, curr) => acc + curr.kcal, 0);
  const totalLoggedP = Math.round(loggedEntries.reduce((acc, curr) => acc + curr.p, 0) * 10) / 10;
  const totalLoggedC = Math.round(loggedEntries.reduce((acc, curr) => acc + curr.c, 0) * 10) / 10;
  const totalLoggedF = Math.round(loggedEntries.reduce((acc, curr) => acc + curr.f, 0) * 10) / 10;

  const remainingKcal = Math.max(0, targetKcal - totalLoggedKcal);
  const remainingP = Math.max(0, Math.round((targetProtein - totalLoggedP) * 10) / 10);

  // Save new logged meal item
  const handleLogFood = () => {
    const newEntry: LoggedEntry = {
      id: `${Date.now()}-${Math.random()}`,
      name: picked.name,
      hindiName: picked.hindiName,
      portionMultiplier,
      servingSize: picked.servingSize,
      meal,
      kcal: currentKcal,
      p: currentP,
      c: currentC,
      f: currentF,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newEntry, ...loggedEntries];
    setLoggedEntries(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_logged_nutrition_today"), JSON.stringify(updated));
    } catch {}

    toast.success(`Logged ${currentKcal} kcal (${currentP}g Protein) to ${meal}!`, {
      icon: "🥗",
    });
  };

  // Delete logged entry
  const handleDeleteEntry = (id: string) => {
    const updated = loggedEntries.filter((e) => e.id !== id);
    setLoggedEntries(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_logged_nutrition_today"), JSON.stringify(updated));
    } catch {}
    toast.info("Food entry removed from log.");
  };

  // Create custom dish
  const handleCreateCustom = () => {
    if (!draft.name.trim()) {
      toast.error("Please provide a name for the dish.");
      return;
    }

    const newItem: IndianFoodItem = {
      id: `custom-${Date.now()}`,
      name: draft.name.trim(),
      hindiName: draft.hindiName.trim() || undefined,
      category: "high_protein_veg",
      servingSize: draft.servingSize.trim() || "1 serving",
      kcal: Number(draft.kcal) || 200,
      p: Number(draft.p) || 10,
      c: Number(draft.c) || 20,
      f: Number(draft.f) || 5,
      isVeg: draft.isVeg,
      tags: ["custom", "homemade", draft.name.toLowerCase()],
    };

    const updated = [newItem, ...customFoods];
    setCustomFoods(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_custom_indian_foods"), JSON.stringify(updated));
    } catch {}

    setPicked(newItem);
    setModalOpen(false);
    toast.success(`Added "${newItem.name}" to your custom Indian food database!`);
  };

  return (
    <WorkflowLayout
      kicker="Smart Nutrition / Indian Food Lab"
      title="Fuel & Macro Telemetry"
      detail="Log 60+ verified Indian staples, track daily protein synthesis targets, and monitor energy reserves in real-time."
    >
      <div className="w-full space-y-6">
        {/* 1. TOP MACRO TARGETS HUD */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Calories */}
          <div className="bg-[#0e1610] border border-white/10 rounded-2xl p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-[#8b9c8a] mb-1">
              <span>DAILY ENERGY</span>
              <Flame size={14} className="text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {totalLoggedKcal} <span className="text-xs font-mono text-[#8b9c8a]">/ {targetKcal} kcal</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalLoggedKcal / targetKcal) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-[#8b9c8a] mt-1.5">
              {remainingKcal} kcal remaining
            </div>
          </div>

          {/* Protein */}
          <div className="bg-[#0e1610] border border-[#c6ff3d]/30 rounded-2xl p-4 relative overflow-hidden shadow-lg shadow-[#c6ff3d]/5">
            <div className="flex items-center justify-between text-xs font-mono text-[#c6ff3d] mb-1">
              <span>PROTEIN TARGET</span>
              <Zap size={14} />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {totalLoggedP}g <span className="text-xs font-mono text-[#8b9c8a]">/ {targetProtein}g</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#c6ff3d] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalLoggedP / targetProtein) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-[#8b9c8a] mt-1.5">
              {remainingP}g remaining for synthesis
            </div>
          </div>

          {/* Carbs */}
          <div className="bg-[#0e1610] border border-white/10 rounded-2xl p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-[#8b9c8a] mb-1">
              <span>CARBOHYDRATES</span>
              <Wheat size={14} className="text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {totalLoggedC}g <span className="text-xs font-mono text-[#8b9c8a]">/ {targetCarbs}g</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-sky-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalLoggedC / targetCarbs) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-[#8b9c8a] mt-1.5">
              Glycogen & stamina fuel
            </div>
          </div>

          {/* Fats */}
          <div className="bg-[#0e1610] border border-white/10 rounded-2xl p-4 relative overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-xs font-mono text-[#8b9c8a] mb-1">
              <span>HEALTHY FATS</span>
              <Utensils size={14} className="text-rose-400" />
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-white">
              {totalLoggedF}g <span className="text-xs font-mono text-[#8b9c8a]">/ {targetFat}g</span>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-rose-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (totalLoggedF / targetFat) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-[#8b9c8a] mt-1.5">
              Hormone baseline support
            </div>
          </div>
        </div>

        {/* 2. REXI AI NUTRITION ADVISOR STRIP */}
        <div className="bg-[#121c15] border border-[#c6ff3d]/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(198,255,61,0.1)]">
          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">🦖</span>
            <p className="text-xs text-[#d1e0cf] leading-relaxed">
              <strong className="text-white">Rexi's Macro Advice:</strong>{" "}
              {remainingP > 0
                ? `You still need ${remainingP}g more protein today to hit your goal! Adding 100g Paneer, 1 scoop Whey, or 150g Chicken will get you there.`
                : "🎉 Great job! You have reached your protein target for optimal muscle recovery today."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-3 py-1.5 bg-[#c6ff3d]/15 hover:bg-[#c6ff3d] text-[#c6ff3d] hover:text-black border border-[#c6ff3d]/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={13} />
            <span>Add Custom Dish</span>
          </button>
        </div>

        {/* 3. MAIN LOGGING GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT: INDIAN FOOD DATABASE EXPLORER (7 COLS) */}
          <div className="lg:col-span-7 space-y-3.5">
            {/* Search + Meal Picker */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9c8a]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search Indian foods (e.g. Paneer, Roti, Dal, Sattu, Chicken, अंडा)..."
                  className="w-full bg-[#0e1610] border border-white/10 focus:border-[#c6ff3d] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-[#5a6b58] outline-none transition-all"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9c8a] hover:text-white"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Meal Slot Select */}
              <div className="flex gap-1 bg-[#0e1610] border border-white/10 p-1 rounded-2xl">
                {["Breakfast", "Lunch", "Snack", "Dinner"].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMeal(m)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-medium transition-all ${
                      meal === m ? "bg-[#c6ff3d] text-black font-bold" : "text-[#8b9c8a] hover:text-white"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "all" as const, label: "All Staples" },
                { id: "high_protein" as const, label: "🔥 High Protein (15g+)" },
                { id: "veg" as const, label: "🌱 Pure Veg" },
                { id: "nonveg" as const, label: "🍗 Non-Veg" },
                { id: "dal_legumes" as const, label: "🥣 Dal & Chana" },
                { id: "roti_rice" as const, label: "🌾 Roti & Rice" },
                { id: "breakfast_snacks" as const, label: "🍳 Breakfast" },
                { id: "recovery_shakes" as const, label: "🥤 Whey & Shakes" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveCategory(chip.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-mono whitespace-nowrap transition-all border ${
                    activeCategory === chip.id
                      ? "bg-[#c6ff3d]/20 border-[#c6ff3d] text-[#c6ff3d] font-bold shadow-[0_0_15px_rgba(198,255,61,0.15)]"
                      : "bg-white/[0.03] border-white/10 text-[#8b9c8a] hover:text-white hover:bg-white/[0.06]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Food Items List */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredFoods.length === 0 ? (
                <div className="text-center py-12 bg-[#0e1610] rounded-2xl border border-white/5 text-[#5a6b58] text-xs font-mono">
                  No Indian food items found matching "{query}".
                </div>
              ) : (
                filteredFoods.map((item) => {
                  const isSelected = picked.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPicked(item)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? "bg-[#c6ff3d]/15 border-[#c6ff3d] shadow-[0_0_25px_rgba(198,255,61,0.15)]"
                          : "bg-[#0e1610] border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                            item.isVeg ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          }`}
                          title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                        >
                          {item.isVeg ? "🌱" : "🍗"}
                        </div>
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                            {item.name}
                            {item.hindiName && (
                              <span className="text-[11px] font-normal text-[#8b9c8a]">
                                ({item.hindiName})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-[#5a6b58] mt-0.5">
                            {item.servingSize}
                          </div>
                        </div>
                      </div>

                      {/* Macro Pills */}
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <span className="font-extrabold text-xs text-white block">
                            {item.kcal} <small className="text-[10px] font-mono text-[#8b9c8a]">kcal</small>
                          </span>
                          <span className="text-[10px] font-mono font-bold text-[#c6ff3d]">
                            {item.p}g Protein
                          </span>
                        </div>
                        <ChevronRight size={15} className="text-[#8b9c8a]" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: PORTION SCALER & FOOD ENTRY (5 COLS) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Selected Food Card */}
            <div className="bg-[#0e1610] border border-[#c6ff3d]/30 rounded-3xl p-5 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
                <div>
                  <span className="text-[10px] font-mono text-[#c6ff3d] uppercase tracking-wider block">
                    Portion Scaler & Log
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-0.5">
                    {picked.name}
                  </h3>
                  {picked.hindiName && (
                    <span className="text-xs text-[#8b9c8a]">({picked.hindiName})</span>
                  )}
                </div>
                <span className="text-xs font-mono text-[#8b9c8a] bg-black/40 px-2.5 py-1 rounded-xl border border-white/5">
                  {meal}
                </span>
              </div>

              {/* Portion Multiplier Chips */}
              <div className="space-y-2 mb-4">
                <label className="text-[11px] font-mono text-[#8b9c8a] uppercase tracking-wider block">
                  Select Serving Multiplier:
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { mult: 0.5, label: "0.5x (Half)" },
                    { mult: 1.0, label: "1.0x (Std)" },
                    { mult: 1.5, label: "1.5x (Large)" },
                    { mult: 2.0, label: "2.0x (Double)" },
                    { mult: 3.0, label: "3.0x (Triple)" },
                  ].map((p) => (
                    <button
                      key={p.mult}
                      type="button"
                      onClick={() => setPortionMultiplier(p.mult)}
                      className={`py-2 rounded-xl text-[10px] sm:text-xs font-mono font-bold transition-all border ${
                        portionMultiplier === p.mult
                          ? "bg-[#c6ff3d] text-black border-[#c6ff3d] shadow-[0_0_15px_rgba(198,255,61,0.3)]"
                          : "bg-white/5 text-[#8b9c8a] border-white/10 hover:text-white"
                      }`}
                    >
                      {p.mult}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Scaled Macro Matrix */}
              <div className="grid grid-cols-4 gap-2 bg-black/40 p-3 rounded-2xl border border-white/5 mb-5 text-center">
                <div>
                  <span className="text-[9px] font-mono text-amber-400 block uppercase">Energy</span>
                  <b className="text-sm sm:text-base text-white">{currentKcal}</b>
                  <small className="text-[9px] text-[#5a6b58] block">kcal</small>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-[#c6ff3d] block uppercase">Protein</span>
                  <b className="text-sm sm:text-base text-[#c6ff3d]">{currentP}</b>
                  <small className="text-[9px] text-[#5a6b58] block">grams</small>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-sky-400 block uppercase">Carbs</span>
                  <b className="text-sm sm:text-base text-white">{currentC}</b>
                  <small className="text-[9px] text-[#5a6b58] block">grams</small>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-rose-400 block uppercase">Fats</span>
                  <b className="text-sm sm:text-base text-white">{currentF}</b>
                  <small className="text-[9px] text-[#5a6b58] block">grams</small>
                </div>
              </div>

              {/* Log Button */}
              <button
                type="button"
                onClick={handleLogFood}
                className="w-full py-3.5 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(198,255,61,0.25)]"
              >
                <Plus size={16} />
                <span>Log to {meal} ({currentKcal} kcal)</span>
              </button>
            </div>

            {/* Today's Logged Entries History */}
            <div className="bg-[#0e1610] border border-white/10 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Utensils size={14} className="text-[#c6ff3d]" />
                  <span>Today's Fuel Log ({loggedEntries.length})</span>
                </span>
                <span className="text-[10px] font-mono text-[#c6ff3d]">
                  {totalLoggedKcal} kcal Total
                </span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {loggedEntries.length === 0 ? (
                  <div className="text-center py-6 text-[11px] font-mono text-[#5a6b58]">
                    No foods logged yet today. Select an Indian staple above and tap Log!
                  </div>
                ) : (
                  loggedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div>
                        <b className="text-white text-xs block">{entry.name}</b>
                        <div className="text-[10px] font-mono text-[#8b9c8a] flex items-center gap-1.5 mt-0.5">
                          <span className="text-[#c6ff3d]">{entry.meal}</span>
                          <span>•</span>
                          <span>{entry.portionMultiplier}x portion</span>
                          <span>•</span>
                          <span>{entry.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-bold text-white text-xs block">{entry.kcal} kcal</span>
                          <span className="text-[10px] font-mono text-[#c6ff3d]">{entry.p}g P</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="p-1 text-[#5a6b58] hover:text-rose-400 transition-colors"
                          title="Remove entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. MODAL: ADD CUSTOM INDIAN DISH */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md bg-[#0c130e] border border-[#c6ff3d]/30 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#c6ff3d]" />
              <span>Add Custom Homemade Dish</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8b9c8a]">
              Save your family recipes or custom fitness meals to your local database.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 mt-3">
            <div>
              <label className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider block mb-1">
                Dish Name
              </label>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Mom's Paneer Bhurji / Sattu Paratha"
                className="w-full bg-[#080d09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#c6ff3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider block mb-1">
                Hindi Name (Optional)
              </label>
              <input
                type="text"
                value={draft.hindiName}
                onChange={(e) => setDraft({ ...draft, hindiName: e.target.value })}
                placeholder="e.g. पनीर भुर्जी"
                className="w-full bg-[#080d09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#c6ff3d]"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider block mb-1">
                Serving Size Description
              </label>
              <input
                type="text"
                value={draft.servingSize}
                onChange={(e) => setDraft({ ...draft, servingSize: e.target.value })}
                placeholder="e.g. 1 medium bowl (150g)"
                className="w-full bg-[#080d09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#c6ff3d]"
              />
            </div>

            {/* Macro Inputs */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] font-mono text-amber-400 uppercase block mb-1">Kcal</label>
                <input
                  type="number"
                  value={draft.kcal}
                  onChange={(e) => setDraft({ ...draft, kcal: e.target.value })}
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-[#c6ff3d] uppercase block mb-1">Protein (g)</label>
                <input
                  type="number"
                  value={draft.p}
                  onChange={(e) => setDraft({ ...draft, p: e.target.value })}
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-sky-400 uppercase block mb-1">Carbs (g)</label>
                <input
                  type="number"
                  value={draft.c}
                  onChange={(e) => setDraft({ ...draft, c: e.target.value })}
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-rose-400 uppercase block mb-1">Fats (g)</label>
                <input
                  type="number"
                  value={draft.f}
                  onChange={(e) => setDraft({ ...draft, f: e.target.value })}
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Veg / Non-Veg toggle */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-mono text-[#8b9c8a]">Type:</span>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, isVeg: true })}
                className={`px-3 py-1 rounded-xl text-xs font-mono ${
                  draft.isVeg ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "text-[#5a6b58]"
                }`}
              >
                🌱 Vegetarian
              </button>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, isVeg: false })}
                className={`px-3 py-1 rounded-xl text-xs font-mono ${
                  !draft.isVeg ? "bg-rose-500/20 text-rose-400 border border-rose-500/40" : "text-[#5a6b58]"
                }`}
              >
                🍗 Non-Veg
              </button>
            </div>

            <button
              type="button"
              onClick={handleCreateCustom}
              className="w-full mt-4 py-3 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
            >
              Save to Database
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </WorkflowLayout>
  );
}
