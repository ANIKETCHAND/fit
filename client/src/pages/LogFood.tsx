/* Kinetic Anatomy Lab food-log screen: high-density nutrition controls arranged like an athlete fuel calibration panel. */
import { useMemo, useState } from "react";
import { Check, ChevronRight, Flame, Plus, Search, Sparkles, Trash2, Utensils, X } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { trpc } from "@/lib/trpc";
import { BackendFeedback } from "@/components/feedback/BackendFeedback";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { getScopedKey } from "@/lib/user-store";

interface FoodItem {
  name: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  custom?: boolean;
}

const defaultFoods: FoodItem[] = [
  { name: "Greek yogurt + berries", kcal: 238, p: 24, c: 26, f: 4, custom: false },
  { name: "Citrus chicken grain bowl", kcal: 468, p: 42, c: 54, f: 11, custom: false },
  { name: "Salted almond recovery shake", kcal: 324, p: 31, c: 32, f: 9, custom: false },
  { name: "Whole Eggs (2 Large)", kcal: 156, p: 13, c: 1, f: 11, custom: false },
  { name: "Grilled Chicken Breast (200g)", kcal: 330, p: 62, c: 0, f: 7, custom: false },
  { name: "Salmon Fillet with Jasmine Rice", kcal: 540, p: 40, c: 52, f: 18, custom: false },
  { name: "Overnight Protein Oats", kcal: 390, p: 28, c: 54, f: 8, custom: false },
  { name: "Avocado Toast on Sourdough", kcal: 280, p: 8, c: 30, f: 14, custom: false },
];

export default function LogFood() {
  const [, setLocation] = useLocation();
  const [meal, setMeal] = useState("Lunch");
  const [query, setQuery] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  // Custom foods saved in localStorage
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem(getScopedKey("fittrack_custom_foods"));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const allFoods = useMemo(() => {
    return [...customFoods, ...defaultFoods];
  }, [customFoods]);

  const [picked, setPicked] = useState<FoodItem>(() => allFoods[0] || defaultFoods[0]);

  // Modal State for adding custom food
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState({
    name: "",
    kcal: "250",
    p: "20",
    c: "25",
    f: "8",
  });

  const saveEntry = trpc.nutrition.create.useMutation({
    onMutate: () => setSaveError(null),
    onSuccess: () => {
      // Handled in save
    },
    onError: () => {
      // Graceful offline fallback handled in save
    },
  });

  const save = () => {
    try {
      const existingEntries = JSON.parse(localStorage.getItem(getScopedKey("fittrack_nutrition_logs")) || "[]");
      const newEntry = {
        id: `food-${Date.now()}`,
        mealType: meal,
        label: picked.name,
        calories: picked.kcal,
        proteinGrams: picked.p,
        carbGrams: picked.c,
        fatGrams: picked.f,
        consumedAt: new Date().toISOString(),
      };
      localStorage.setItem(getScopedKey("fittrack_nutrition_logs"), JSON.stringify([newEntry, ...existingEntries]));
    } catch {
      // ignore
    }

    saveEntry.mutate(
      {
        mealType: meal,
        label: picked.name,
        calories: picked.kcal,
        proteinGrams: picked.p,
        carbGrams: picked.c,
        fatGrams: picked.f,
        consumedAt: new Date(),
      },
      {
        onSettled: () => {
          toast.success(`${meal} recorded: ${picked.name} (${picked.kcal} kcal)`);
          setLocation("/overview");
        },
      }
    );
  };

  const openCustomModal = (initialName?: string) => {
    setDraft({
      name: initialName !== undefined ? initialName : query.trim(),
      kcal: "250",
      p: "20",
      c: "25",
      f: "8",
    });
    setModalOpen(true);
  };

  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = draft.name.trim();
    if (!cleanName) {
      toast.error("Please enter a food name");
      return;
    }

    const newFood: FoodItem = {
      name: cleanName,
      kcal: Math.max(0, parseInt(draft.kcal, 10) || 0),
      p: Math.max(0, parseInt(draft.p, 10) || 0),
      c: Math.max(0, parseInt(draft.c, 10) || 0),
      f: Math.max(0, parseInt(draft.f, 10) || 0),
      custom: true,
    };

    const nextCustom = [newFood, ...customFoods.filter((f) => f.name.toLowerCase() !== cleanName.toLowerCase())];
    setCustomFoods(nextCustom);
    try {
      localStorage.setItem("fittrack_custom_foods", JSON.stringify(nextCustom));
    } catch {
      // ignore
    }

    setPicked(newFood);
    setQuery("");
    setModalOpen(false);
    toast.success(`Custom food "${newFood.name}" added and selected!`);
  };

  const handleDeleteCustom = (foodName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCustom = customFoods.filter((f) => f.name !== foodName);
    setCustomFoods(nextCustom);
    try {
      localStorage.setItem("fittrack_custom_foods", JSON.stringify(nextCustom));
    } catch {
      // ignore
    }
    if (picked.name === foodName) {
      setPicked(defaultFoods[0]);
    }
    toast.success(`"${foodName}" removed from your custom foods`);
  };

  const filteredFoods = allFoods.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <WorkflowLayout
      title="Log your fuel"
      detail="Track daily caloric and macronutrient intake for optimal recovery."
    >
      <motion.section
        className="workflow-grid food-grid"
        variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
      >
        <div className="workflow-panel meal-picker">
          <span className="panel-label">Meal window</span>
          <div className="segment-control">
            {["Breakfast", "Lunch", "Dinner", "Recovery"].map((item) => (
              <button
                key={item}
                className={meal === item ? "selected" : ""}
                onClick={() => setMeal(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <label className="search-field">
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search foods or custom entries (e.g. eggs, shake)"
            />
            {query && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </label>

          <div className="food-options">
            {filteredFoods.length > 0 ? (
              filteredFoods.map((item) => (
                <button
                  className={picked.name === item.name ? "food-option selected" : "food-option"}
                  onClick={() => setPicked(item)}
                  key={item.name}
                >
                  <span className="food-icon">
                    {item.custom ? <Sparkles size={15} style={{ color: "#c6ff3d" }} /> : <Utensils size={16} />}
                  </span>
                  <span>
                    <b>
                      {item.name}
                      {item.custom && <em className="custom-pill">CUSTOM</em>}
                    </b>
                    <small>
                      {item.kcal} kcal · {item.p}g P · {item.c}g C · {item.f}g F
                    </small>
                  </span>
                  <div className="food-option-actions">
                    {item.custom && (
                      <button
                        type="button"
                        className="delete-custom-btn"
                        onClick={(e) => handleDeleteCustom(item.name, e)}
                        title="Delete custom food"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    {picked.name === item.name ? <Check size={16} /> : <ChevronRight size={16} />}
                  </div>
                </button>
              ))
            ) : (
              <div className="empty-food-state">
                <p>No matching foods found for "{query}".</p>
                <button
                  type="button"
                  className="inline-add-custom-btn"
                  onClick={() => openCustomModal(query)}
                >
                  <Plus size={14} /> Create custom food "{query}"
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            className="text-action"
            onClick={() => openCustomModal()}
          >
            <Plus size={15} />
            Add a custom food
          </button>
        </div>

        <aside className="workflow-panel fuel-summary">
          {/* Animated Multi-Segment Macro Radial Gauge */}
          <div className="relative w-full flex flex-col items-center justify-center p-4 bg-[#0a100c] border border-[rgba(237,244,233,0.08)] rounded-xl mb-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-36 h-36 -rotate-90 transform" viewBox="0 0 120 120">
                {/* Background tracks */}
                <circle cx="60" cy="60" r="48" className="stroke-[rgba(255,255,255,0.06)] fill-none" strokeWidth="6" />
                <circle cx="60" cy="60" r="38" className="stroke-[rgba(255,255,255,0.06)] fill-none" strokeWidth="6" />
                <circle cx="60" cy="60" r="28" className="stroke-[rgba(255,255,255,0.06)] fill-none" strokeWidth="6" />

                {/* Protein Arc (Green) */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="48"
                  className="stroke-[#c6ff3d] fill-none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 48}
                  initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 48) - (Math.min(picked.p / 60, 1) * (2 * Math.PI * 48)) }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(198,255,61,0.6))" }}
                />

                {/* Carbs Arc (Cyan) */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="38"
                  className="stroke-[#a6d9ff] fill-none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 38}
                  initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 38) - (Math.min(picked.c / 80, 1) * (2 * Math.PI * 38)) }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(166,217,255,0.6))" }}
                />

                {/* Fats Arc (Amber) */}
                <motion.circle
                  cx="60"
                  cy="60"
                  r="28"
                  className="stroke-[#ffd998] fill-none"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 28}
                  initial={{ strokeDashoffset: 2 * Math.PI * 28 }}
                  animate={{ strokeDashoffset: (2 * Math.PI * 28) - (Math.min(picked.f / 30, 1) * (2 * Math.PI * 28)) }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                  style={{ filter: "drop-shadow(0 0 6px rgba(255,217,152,0.6))" }}
                />
              </svg>

              {/* Center Calorie Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <Flame size={18} className="text-[#c6ff3d] animate-pulse mb-0.5" />
                <strong className="text-xl font-bold font-mono text-[#edf4e9] leading-none">{picked.kcal}</strong>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#8b9c8a] mt-0.5">kcal</span>
              </div>
            </div>

            {/* Macro Legend Pills */}
            <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-[rgba(237,244,233,0.06)] text-center">
              <div className="bg-[#0e1611] py-1.5 px-2 rounded border border-[#c6ff3d]/20">
                <span className="text-[8px] uppercase tracking-wider text-[#c6ff3d] font-mono block">Protein</span>
                <strong className="text-xs font-mono text-[#edf4e9]">{picked.p}g</strong>
              </div>
              <div className="bg-[#0e1611] py-1.5 px-2 rounded border border-[#a6d9ff]/20">
                <span className="text-[8px] uppercase tracking-wider text-[#a6d9ff] font-mono block">Carbs</span>
                <strong className="text-xs font-mono text-[#edf4e9]">{picked.c}g</strong>
              </div>
              <div className="bg-[#0e1611] py-1.5 px-2 rounded border border-[#ffd998]/20">
                <span className="text-[8px] uppercase tracking-wider text-[#ffd998] font-mono block">Fats</span>
                <strong className="text-xs font-mono text-[#edf4e9]">{picked.f}g</strong>
              </div>
            </div>
          </div>

          {/* Visual Metabolic Telemetry Badges */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-[#0d1410] border border-[rgba(237,244,233,0.07)] rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6ff3d] animate-pulse"></span>
              <span className="text-[9px] font-mono text-[#edf4e9]">Anabolic Synthesis</span>
            </div>
            <div className="bg-[#0d1410] border border-[rgba(237,244,233,0.07)] rounded-md px-2.5 py-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#a6d9ff]"></span>
              <span className="text-[9px] font-mono text-[#edf4e9]">Glycogen Refuel</span>
            </div>
          </div>

          <button
            className="commit-button"
            disabled={saveEntry.isPending}
            onClick={save}
          >
            {saveEntry.isPending ? "Saving entry" : `Commit ${meal.toLowerCase()}`}{" "}
            <span>↗</span>
          </button>
          {saveEntry.isPending && (
            <BackendFeedback
              tone="loading"
              title="Secure data link"
              detail="Saving this fuel entry to your athlete ledger."
            />
          )}
          {saveError && (
            <BackendFeedback
              tone="error"
              title="Fuel entry not saved"
              detail={saveError}
              onRetry={save}
            />
          )}
        </aside>
      </motion.section>

      {/* Custom Food Creation Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="profile-dialog" showCloseButton>
          <DialogHeader>
            <span className="panel-label">Nutrition Console</span>
            <DialogTitle>Add Custom Food</DialogTitle>
            <DialogDescription>
              Create your own customized food item with calibrated calories and macro split.
            </DialogDescription>
          </DialogHeader>

          <form className="profile-form" onSubmit={handleAddCustomFood}>
            <div className="profile-form-grid" style={{ gridTemplateColumns: "1fr" }}>
              <label>
                Food Name / Description
                <input
                  type="text"
                  placeholder="e.g. Scrambled Whole Eggs, Protein Pancakes"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  required
                  autoFocus
                />
              </label>
            </div>

            <div className="profile-form-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
              <label>
                Calories (kcal)
                <input
                  type="number"
                  min="0"
                  max="5000"
                  value={draft.kcal}
                  onChange={(e) => setDraft({ ...draft, kcal: e.target.value })}
                  required
                />
              </label>
              <label>
                Protein (g)
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={draft.p}
                  onChange={(e) => setDraft({ ...draft, p: e.target.value })}
                  required
                />
              </label>
              <label>
                Carbs (g)
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={draft.c}
                  onChange={(e) => setDraft({ ...draft, c: e.target.value })}
                  required
                />
              </label>
              <label>
                Fats (g)
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={draft.f}
                  onChange={(e) => setDraft({ ...draft, f: e.target.value })}
                  required
                />
              </label>
            </div>

            <div className="profile-dialog-actions" style={{ marginTop: "12px" }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  background: "#c6ff3d",
                  color: "#10160e",
                  borderColor: "#c6ff3d",
                  fontWeight: 700,
                }}
              >
                Save & Select Food <Check size={14} />
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </WorkflowLayout>
  );
}
