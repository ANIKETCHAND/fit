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
          <div className="summary-orbit">
            <Flame size={22} />
            <span>Added fuel</span>
            <strong>{picked.kcal}</strong>
            <small>kcal</small>
          </div>
          <div className="macro-stack">
            <div>
              <span>Protein</span>
              <b>{picked.p}g</b>
              <i style={{ width: `${Math.min(picked.p * 2.2, 100)}%` }} />
            </div>
            <div>
              <span>Carbs</span>
              <b>{picked.c}g</b>
              <i style={{ width: `${Math.min(picked.c * 1.4, 100)}%` }} />
            </div>
            <div>
              <span>Fats</span>
              <b>{picked.f}g</b>
              <i style={{ width: `${Math.min(picked.f * 4, 100)}%` }} />
            </div>
          </div>
          <div className="summary-note">
            <i />
            Target pace remains on track
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
