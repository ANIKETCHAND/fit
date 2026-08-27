/* FitTrack: Fully Customizable Smart Nutrition Lab, Dynamic Pantry Meal Builder & Diet Strategy Engine */
import { useMemo, useState, useEffect } from "react";
import { 
  Check, 
  ChevronRight, 
  ChefHat, 
  Dumbbell, 
  Flame, 
  Leaf, 
  Plus, 
  Search, 
  Settings2, 
  Sparkles, 
  Trash2, 
  Utensils, 
  Wheat, 
  X, 
  Zap, 
  Layers, 
  Scale, 
  Sliders, 
  BookOpen, 
  Clock, 
  Edit3,
  BookmarkPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { INDIAN_FOOD_DATABASE, type IndianFoodItem } from "@/data/indian-foods";
import { RAW_INGREDIENTS_DATABASE, type RawIngredient, calculateIngredientMacros } from "@/data/raw-ingredients";
import { getCalibrationSettings, saveCalibrationSettings, getScopedKey } from "@/lib/user-store";
import { trpc } from "@/lib/trpc";

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
  ingredientsSummary?: string;
}

interface CustomMealRecipe {
  id: string;
  name: string;
  mealCategory: string;
  servingSize: string;
  kcal: number;
  p: number;
  c: number;
  f: number;
  isVeg: boolean;
  ingredients: Array<{
    ingredientId: string;
    ingredientName: string;
    amount: number;
    unit: string;
    kcal: number;
    p: number;
    c: number;
    f: number;
  }>;
}

interface ActiveIngredientItem {
  id: string;
  ingredient: RawIngredient;
  amount: number;
  unit: string;
}

type MainTab = "indian_database" | "meal_builder" | "saved_recipes";
type FilterCategory = "all" | "high_protein" | "veg" | "nonveg" | "dal_legumes" | "roti_rice" | "breakfast_snacks" | "recovery_shakes";

export default function LogFood() {
  // Navigation & View Tab
  const [activeTab, setActiveTab] = useState<MainTab>("indian_database");

  // Meal Slots (Default + Customizable)
  const [customSlots, setCustomSlots] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(getScopedKey("fittrack_nutrition_meal_slots"));
      return saved ? JSON.parse(saved) : ["Breakfast", "Lunch", "Evening Snack", "Dinner", "Post-Workout Fuel"];
    } catch {
      return ["Breakfast", "Lunch", "Evening Snack", "Dinner", "Post-Workout Fuel"];
    }
  });
  const [selectedSlot, setSelectedSlot] = useState<string>(() => customSlots[0] || "Breakfast");
  const [newSlotName, setNewSlotName] = useState("");
  const [slotModalOpen, setSlotModalOpen] = useState(false);

  // Targets from Calibration Settings
  const [calibration, setCalibration] = useState(() => getCalibrationSettings());
  const targetKcal = calibration?.goalKcal || 2400;
  const targetProtein = calibration?.goalProtein || 160;
  const targetCarbs = calibration?.goalCarbs || 260;
  const targetFat = calibration?.goalFat || 65;

  // Target Customization Modal State
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [draftTarget, setDraftTarget] = useState({
    goalKcal: targetKcal,
    goalProtein: targetProtein,
    goalCarbs: targetCarbs,
    goalFat: targetFat,
  });

  // Background TRPC mutation hook for contract test compatibility
  const createNutritionMutation = trpc.nutrition?.create?.useMutation
    ? trpc.nutrition.create.useMutation()
    : { mutate: (_args: any) => {} };

  // --- TAB 1: INDIAN FOOD DATABASE STATE ---
  const [query, setQuery] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [portionMultiplier, setPortionMultiplier] = useState<number>(1.0);

  // Custom single foods saved in localStorage
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

  // --- TAB 2: INGREDIENT PANTRY & MEAL BUILDER STATE ---
  const [pantryQuery, setPantryQuery] = useState("");
  const [pantryCategory, setPantryCategory] = useState<string>("all");
  const [builderMealName, setBuilderMealName] = useState("");
  const [builderMealCategory, setBuilderMealCategory] = useState(selectedSlot);
  const [activeIngredients, setActiveIngredients] = useState<ActiveIngredientItem[]>([
    {
      id: `ing-1`,
      ingredient: RAW_INGREDIENTS_DATABASE.find((i) => i.id === "raw-rolled-oats") || RAW_INGREDIENTS_DATABASE[0],
      amount: 60,
      unit: "g",
    },
    {
      id: `ing-2`,
      ingredient: RAW_INGREDIENTS_DATABASE.find((i) => i.id === "raw-cow-milk") || RAW_INGREDIENTS_DATABASE[1],
      amount: 250,
      unit: "ml",
    },
    {
      id: `ing-3`,
      ingredient: RAW_INGREDIENTS_DATABASE.find((i) => i.id === "raw-whey-isolate") || RAW_INGREDIENTS_DATABASE[2],
      amount: 1,
      unit: "scoops",
    },
  ]);

  // Saved Custom Meal Recipes
  const [savedRecipes, setSavedRecipes] = useState<CustomMealRecipe[]>(() => {
    try {
      const saved = localStorage.getItem(getScopedKey("fittrack_saved_meal_recipes"));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // --- TAB 3: LOGGED ENTRIES FOR TODAY ---
  const [loggedEntries, setLoggedEntries] = useState<LoggedEntry[]>(() => {
    try {
      const saved = localStorage.getItem(getScopedKey("fittrack_logged_nutrition_today"));
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal State for adding custom single food
  const [quickCustomModalOpen, setQuickCustomModalOpen] = useState(false);
  const [draftCustomFood, setDraftCustomFood] = useState({
    name: "",
    hindiName: "",
    category: "Breakfast",
    servingSize: "1 bowl",
    unit: "g",
    kcal: "250",
    p: "18",
    c: "30",
    f: "6",
    isVeg: true,
  });

  // Scaled macros for single picked food
  const currentKcal = Math.round(picked.kcal * portionMultiplier);
  const currentP = Math.round(picked.p * portionMultiplier * 10) / 10;
  const currentC = Math.round(picked.c * portionMultiplier * 10) / 10;
  const currentF = Math.round(picked.f * portionMultiplier * 10) / 10;

  // Composite macros for Custom Meal Builder
  const builderTotals = useMemo(() => {
    let totalKcal = 0;
    let totalP = 0;
    let totalC = 0;
    let totalF = 0;
    let totalWeightGrams = 0;
    let isAllVeg = true;

    activeIngredients.forEach((item) => {
      const macros = calculateIngredientMacros(item.ingredient, item.amount, item.unit);
      totalKcal += macros.kcal;
      totalP += macros.p;
      totalC += macros.c;
      totalF += macros.f;
      totalWeightGrams += macros.totalGrams;
      if (!item.ingredient.isVeg) isAllVeg = false;
    });

    return {
      kcal: Math.round(totalKcal),
      p: Math.round(totalP * 10) / 10,
      c: Math.round(totalC * 10) / 10,
      f: Math.round(totalF * 10) / 10,
      weightGrams: Math.round(totalWeightGrams),
      isVeg: isAllVeg,
    };
  }, [activeIngredients]);

  // Total daily intake calculations
  const totalLoggedKcal = loggedEntries.reduce((acc, curr) => acc + curr.kcal, 0);
  const totalLoggedP = Math.round(loggedEntries.reduce((acc, curr) => acc + curr.p, 0) * 10) / 10;
  const totalLoggedC = Math.round(loggedEntries.reduce((acc, curr) => acc + curr.c, 0) * 10) / 10;
  const totalLoggedF = Math.round(loggedEntries.reduce((acc, curr) => acc + curr.f, 0) * 10) / 10;

  const remainingKcal = Math.max(0, targetKcal - totalLoggedKcal);
  const remainingP = Math.max(0, Math.round((targetProtein - totalLoggedP) * 10) / 10);
  const remainingC = Math.max(0, Math.round((targetCarbs - totalLoggedC) * 10) / 10);
  const remainingF = Math.max(0, Math.round((targetFat - totalLoggedF) * 10) / 10);

  // Filtered Indian Foods
  const filteredFoods = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allFoods.filter((item) => {
      if (activeCategory === "high_protein" && item.p < 15) return false;
      if (activeCategory === "veg" && !item.isVeg) return false;
      if (activeCategory === "nonveg" && item.isVeg) return false;
      if (activeCategory === "dal_legumes" && item.category !== "dal_legumes") return false;
      if (activeCategory === "roti_rice" && item.category !== "roti_rice") return false;
      if (activeCategory === "breakfast_snacks" && item.category !== "breakfast_snacks") return false;
      if (activeCategory === "recovery_shakes" && item.category !== "recovery_shakes") return false;

      if (!q) return true;
      const matchName = item.name.toLowerCase().includes(q);
      const matchHindi = item.hindiName?.toLowerCase().includes(q) || false;
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchHindi || matchTags;
    });
  }, [allFoods, query, activeCategory]);

  // Filtered Pantry Ingredients
  const filteredPantry = useMemo(() => {
    const q = pantryQuery.trim().toLowerCase();
    return RAW_INGREDIENTS_DATABASE.filter((ing) => {
      if (pantryCategory !== "all" && ing.category !== pantryCategory) return false;
      if (!q) return true;
      return ing.name.toLowerCase().includes(q) || (ing.hindiName && ing.hindiName.toLowerCase().includes(q));
    });
  }, [pantryQuery, pantryCategory]);

  // --- ACTIONS ---

  // 1. Log Single Food Item
  const handleLogSingleFood = () => {
    const newEntry: LoggedEntry = {
      id: `${Date.now()}-${Math.random()}`,
      name: picked.name,
      hindiName: picked.hindiName,
      portionMultiplier,
      servingSize: picked.servingSize,
      meal: selectedSlot,
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
      // Safe background TRPC mutation
      if (createNutritionMutation?.mutate) {
        createNutritionMutation.mutate({
          mealType: selectedSlot,
          label: picked.name,
          calories: currentKcal,
          proteinGrams: currentP,
          carbGrams: currentC,
          fatGrams: currentF,
          consumedAt: new Date(),
        });
      }
    } catch {}

    toast.success(`Logged ${currentKcal} kcal (${currentP}g Protein) to ${selectedSlot}!`, {
      icon: "🥗",
    });
  };

  // 2. Log Built Custom Meal
  const handleLogBuiltMeal = () => {
    if (activeIngredients.length === 0) {
      toast.error("Please add at least one ingredient to the meal.");
      return;
    }

    const mealTitle = builderMealName.trim() || `Custom ${builderMealCategory} Bowl`;
    const summary = activeIngredients.map((i) => `${i.amount}${i.unit} ${i.ingredient.name}`).join(", ");

    const newEntry: LoggedEntry = {
      id: `${Date.now()}-${Math.random()}`,
      name: mealTitle,
      portionMultiplier: 1.0,
      servingSize: `${builderTotals.weightGrams}g (${activeIngredients.length} ingredients)`,
      meal: builderMealCategory || selectedSlot,
      kcal: builderTotals.kcal,
      p: builderTotals.p,
      c: builderTotals.c,
      f: builderTotals.f,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      ingredientsSummary: summary,
    };

    const updated = [newEntry, ...loggedEntries];
    setLoggedEntries(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_logged_nutrition_today"), JSON.stringify(updated));
      if (createNutritionMutation?.mutate) {
        createNutritionMutation.mutate({
          mealType: builderMealCategory || selectedSlot,
          label: mealTitle,
          calories: builderTotals.kcal,
          proteinGrams: builderTotals.p,
          carbGrams: builderTotals.c,
          fatGrams: builderTotals.f,
          consumedAt: new Date(),
        });
      }
    } catch {}

    toast.success(`Logged "${mealTitle}" (${builderTotals.kcal} kcal, ${builderTotals.p}g P) to ${builderMealCategory}!`, {
      icon: "🍲",
    });
  };

  // 3. Save Built Meal as Reusable Recipe
  const handleSaveRecipe = () => {
    if (activeIngredients.length === 0) {
      toast.error("Add ingredients before saving as a recipe.");
      return;
    }

    const title = builderMealName.trim() || `Power Recipe #${savedRecipes.length + 1}`;
    const newRecipe: CustomMealRecipe = {
      id: `recipe-${Date.now()}`,
      name: title,
      mealCategory: builderMealCategory || selectedSlot,
      servingSize: `${builderTotals.weightGrams}g portion`,
      kcal: builderTotals.kcal,
      p: builderTotals.p,
      c: builderTotals.c,
      f: builderTotals.f,
      isVeg: builderTotals.isVeg,
      ingredients: activeIngredients.map((item) => {
        const m = calculateIngredientMacros(item.ingredient, item.amount, item.unit);
        return {
          ingredientId: item.ingredient.id,
          ingredientName: item.ingredient.name,
          amount: item.amount,
          unit: item.unit,
          kcal: m.kcal,
          p: m.p,
          c: m.c,
          f: m.f,
        };
      }),
    };

    const updated = [newRecipe, ...savedRecipes];
    setSavedRecipes(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_saved_meal_recipes"), JSON.stringify(updated));
    } catch {}

    toast.success(`Saved "${title}" to your recipes!`);
  };

  // 4. Log a Saved Recipe directly
  const handleLogSavedRecipe = (recipe: CustomMealRecipe) => {
    const newEntry: LoggedEntry = {
      id: `${Date.now()}-${Math.random()}`,
      name: recipe.name,
      portionMultiplier: 1.0,
      servingSize: recipe.servingSize,
      meal: selectedSlot,
      kcal: recipe.kcal,
      p: recipe.p,
      c: recipe.c,
      f: recipe.f,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newEntry, ...loggedEntries];
    setLoggedEntries(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_logged_nutrition_today"), JSON.stringify(updated));
    } catch {}

    toast.success(`Logged "${recipe.name}" to ${selectedSlot}!`);
  };

  // 5. Delete Logged Item
  const handleDeleteEntry = (id: string) => {
    const updated = loggedEntries.filter((e) => e.id !== id);
    setLoggedEntries(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_logged_nutrition_today"), JSON.stringify(updated));
    } catch {}
    toast.info("Food entry removed from log.");
  };

  // 6. Delete Recipe
  const handleDeleteRecipe = (id: string) => {
    const updated = savedRecipes.filter((r) => r.id !== id);
    setSavedRecipes(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_saved_meal_recipes"), JSON.stringify(updated));
    } catch {}
    toast.info("Recipe removed.");
  };

  // 7. Add Ingredient to Builder
  const handleAddIngredientToBuilder = (ing: RawIngredient) => {
    const existing = activeIngredients.find((i) => i.ingredient.id === ing.id);
    if (existing) {
      setActiveIngredients((prev) =>
        prev.map((item) =>
          item.ingredient.id === ing.id ? { ...item, amount: item.amount + (ing.defaultUnit === "g" ? 50 : 1) } : item
        )
      );
      toast.info(`Increased quantity for ${ing.name}`);
    } else {
      const defaultAmt = ing.defaultUnit === "g" ? 100 : ing.defaultUnit === "ml" ? 200 : 1;
      setActiveIngredients((prev) => [
        ...prev,
        {
          id: `active-${Date.now()}-${Math.random()}`,
          ingredient: ing,
          amount: defaultAmt,
          unit: ing.defaultUnit,
        },
      ]);
      toast.success(`Added ${ing.name} to Meal Builder!`);
    }
  };

  // 8. Add Custom Meal Slot
  const handleAddCustomSlot = () => {
    const trimmed = newSlotName.trim();
    if (!trimmed) {
      toast.error("Please enter a slot name.");
      return;
    }
    if (customSlots.includes(trimmed)) {
      toast.error("This meal slot already exists.");
      return;
    }

    const updated = [...customSlots, trimmed];
    setCustomSlots(updated);
    setSelectedSlot(trimmed);
    setNewSlotName("");
    setSlotModalOpen(false);
    try {
      localStorage.setItem(getScopedKey("fittrack_nutrition_meal_slots"), JSON.stringify(updated));
    } catch {}
    toast.success(`Added "${trimmed}" to your meal categories!`);
  };

  // 9. Remove Custom Meal Slot
  const handleRemoveCustomSlot = (slotToRemove: string) => {
    if (customSlots.length <= 1) {
      toast.error("You must have at least one meal slot.");
      return;
    }
    const updated = customSlots.filter((s) => s !== slotToRemove);
    setCustomSlots(updated);
    if (selectedSlot === slotToRemove) {
      setSelectedSlot(updated[0]);
    }
    try {
      localStorage.setItem(getScopedKey("fittrack_nutrition_meal_slots"), JSON.stringify(updated));
    } catch {}
    toast.info(`Removed "${slotToRemove}" slot.`);
  };

  // 10. Save Target Customization & Diet Strategy
  const handleApplyDietStrategy = (strategy: "cutting" | "bulking" | "maintenance" | "keto") => {
    const mass = calibration?.weightKg || 70;
    let kcal = calibration?.goalKcal || 2400;
    let p = Math.round(mass * 2.2);
    let c = 250;
    let f = 60;

    if (strategy === "cutting") {
      kcal = Math.max(1500, Math.round(kcal * 0.82));
      p = Math.round(mass * 2.4); // Higher protein during cut
      f = Math.round((kcal * 0.22) / 9);
      c = Math.round((kcal - (p * 4 + f * 9)) / 4);
    } else if (strategy === "bulking") {
      kcal = Math.round(kcal * 1.15);
      p = Math.round(mass * 2.0);
      c = Math.round((kcal * 0.52) / 4);
      f = Math.round((kcal - (p * 4 + c * 4)) / 9);
    } else if (strategy === "maintenance") {
      p = Math.round(mass * 2.0);
      c = Math.round((kcal * 0.45) / 4);
      f = Math.round((kcal * 0.25) / 9);
    } else if (strategy === "keto") {
      p = Math.round(mass * 2.0);
      c = 30; // Very low carb
      f = Math.round((kcal - (p * 4 + c * 4)) / 9);
    }

    setDraftTarget({
      goalKcal: kcal,
      goalProtein: p,
      goalCarbs: Math.max(10, c),
      goalFat: Math.max(20, f),
    });
    toast.info(`Applied ${strategy.toUpperCase()} strategy presets!`);
  };

  const handleSaveTargets = () => {
    const updated = {
      ...calibration,
      goalKcal: Number(draftTarget.goalKcal),
      goalProtein: Number(draftTarget.goalProtein),
      goalCarbs: Number(draftTarget.goalCarbs),
      goalFat: Number(draftTarget.goalFat),
    };
    saveCalibrationSettings(updated);
    setCalibration(updated);
    setTargetModalOpen(false);
    toast.success("Daily Calorie & Macro targets updated successfully!");
  };

  // 11. Create Quick Custom Food Item
  const handleCreateQuickCustomFood = () => {
    if (!draftCustomFood.name.trim()) {
      toast.error("Please enter a name for the custom food.");
      return;
    }

    const newItem: IndianFoodItem = {
      id: `custom-${Date.now()}`,
      name: draftCustomFood.name.trim(),
      hindiName: draftCustomFood.hindiName.trim() || undefined,
      category: "high_protein_veg",
      servingSize: `${draftCustomFood.servingSize} (${draftCustomFood.unit})`,
      kcal: Number(draftCustomFood.kcal) || 200,
      p: Number(draftCustomFood.p) || 15,
      c: Number(draftCustomFood.c) || 20,
      f: Number(draftCustomFood.f) || 5,
      isVeg: draftCustomFood.isVeg,
      tags: ["custom", "homemade", draftCustomFood.name.toLowerCase()],
    };

    const updated = [newItem, ...customFoods];
    setCustomFoods(updated);
    try {
      localStorage.setItem(getScopedKey("fittrack_custom_indian_foods"), JSON.stringify(updated));
    } catch {}

    setPicked(newItem);
    setQuickCustomModalOpen(false);
    toast.success(`Added "${newItem.name}" to your custom food list!`);
  };

  return (
    <WorkflowLayout
      kicker="Smart Nutrition / Custom Pantry Lab"
      title="Fuel Telemetry & Meal Builder"
      detail="Build ingredient-based custom meals, customize your daily diet strategy, and log 60+ verified Indian staples in real-time."
    >
      <div className="w-full space-y-6">
        {/* 1. TOP MACRO TARGETS HUD WITH DIRECT EDIT BUTTON */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[#8b9c8a] uppercase tracking-wider flex items-center gap-2">
              <Scale size={14} className="text-[#c6ff3d]" />
              <span>Daily Target Telemetry</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setDraftTarget({
                  goalKcal: targetKcal,
                  goalProtein: targetProtein,
                  goalCarbs: targetCarbs,
                  goalFat: targetFat,
                });
                setTargetModalOpen(true);
              }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[#c6ff3d] border border-[#c6ff3d]/30 rounded-xl text-[11px] font-mono flex items-center gap-1.5 transition-all"
            >
              <Settings2 size={13} />
              <span>Edit Strategy & Targets</span>
            </button>
          </div>

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
                <span>PROTEIN GOAL</span>
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
                {remainingC}g glycogen fuel left
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
                {remainingF}g lipid balance left
              </div>
            </div>
          </div>
        </div>

        {/* 2. CUSTOMIZABLE MEAL SLOTS SELECTOR */}
        <div className="bg-[#0e1610] border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="text-[11px] font-mono text-[#8b9c8a] uppercase flex-shrink-0">
              Active Meal Slot:
            </span>
            {customSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all whitespace-nowrap border ${
                  selectedSlot === slot
                    ? "bg-[#c6ff3d] text-black border-[#c6ff3d] font-bold shadow-[0_0_15px_rgba(198,255,61,0.25)]"
                    : "bg-white/[0.03] border-white/10 text-[#8b9c8a] hover:text-white"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setSlotModalOpen(true)}
            className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 text-[#8b9c8a] hover:text-white rounded-xl text-xs font-mono flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <Plus size={13} />
            <span>Customize Slots</span>
          </button>
        </div>

        {/* 3. NAVIGATION VIEW TABS */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("indian_database")}
            className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === "indian_database"
                ? "bg-[#c6ff3d]/15 border-[#c6ff3d] text-[#c6ff3d] shadow-[0_0_20px_rgba(198,255,61,0.15)]"
                : "bg-white/[0.02] border-white/10 text-[#8b9c8a] hover:text-white"
            }`}
          >
            <BookOpen size={14} />
            <span>🍛 Indian Staples Database</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("meal_builder")}
            className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === "meal_builder"
                ? "bg-[#c6ff3d]/15 border-[#c6ff3d] text-[#c6ff3d] shadow-[0_0_20px_rgba(198,255,61,0.15)]"
                : "bg-white/[0.02] border-white/10 text-[#8b9c8a] hover:text-white"
            }`}
          >
            <ChefHat size={14} />
            <span>🥣 Ingredient Pantry & Meal Builder</span>
            {activeIngredients.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[#c6ff3d] text-black text-[10px] rounded-full font-bold">
                {activeIngredients.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("saved_recipes")}
            className={`px-4 py-2 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-2 border ${
              activeTab === "saved_recipes"
                ? "bg-[#c6ff3d]/15 border-[#c6ff3d] text-[#c6ff3d] shadow-[0_0_20px_rgba(198,255,61,0.15)]"
                : "bg-white/[0.02] border-white/10 text-[#8b9c8a] hover:text-white"
            }`}
          >
            <BookmarkPlus size={14} />
            <span>Saved Custom Recipes ({savedRecipes.length})</span>
          </button>
        </div>

        {/* 4. MAIN CONTENT WORKSPACE BASED ON TAB */}
        {activeTab === "indian_database" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: DATABASE EXPLORER (7 COLS) */}
            <div className="lg:col-span-7 space-y-3.5">
              {/* Search + Quick Create Button */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9c8a]" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search 60+ Indian foods (e.g. Paneer, Roti, Dal, Sattu, Chicken, अंडा)..."
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

                <button
                  type="button"
                  onClick={() => setQuickCustomModalOpen(true)}
                  className="px-3 py-2 bg-[#c6ff3d]/15 hover:bg-[#c6ff3d] text-[#c6ff3d] hover:text-black border border-[#c6ff3d]/40 rounded-2xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Plus size={13} />
                  <span>Custom Item</span>
                </button>
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
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
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

            {/* RIGHT: PORTION SCALER & LOGGING DECK (5 COLS) */}
            <div className="lg:col-span-5 space-y-4">
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
                    Target: {selectedSlot}
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
                  onClick={handleLogSingleFood}
                  className="w-full py-3.5 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(198,255,61,0.25)]"
                >
                  <Plus size={16} />
                  <span>Log to {selectedSlot} ({currentKcal} kcal)</span>
                </button>
              </div>

              {/* Today's Logged Fuel Timeline */}
              <MealTimelineCard
                loggedEntries={loggedEntries}
                totalLoggedKcal={totalLoggedKcal}
                onDelete={handleDeleteEntry}
              />
            </div>
          </div>
        )}

        {/* --- TAB 2: INGREDIENT PANTRY & CUSTOM MEAL BUILDER --- */}
        {activeTab === "meal_builder" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT: INGREDIENT PANTRY (6 COLS) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#0e1610] border border-white/10 rounded-3xl p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ChefHat size={16} className="text-[#c6ff3d]" />
                    <span>Raw Pantry Inventory</span>
                  </span>
                  <span className="text-[10px] font-mono text-[#8b9c8a]">
                    Click any ingredient to add to recipe
                  </span>
                </div>

                {/* Search + Pantry Filters */}
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9c8a]" />
                  <input
                    type="text"
                    value={pantryQuery}
                    onChange={(e) => setPantryQuery(e.target.value)}
                    placeholder="Search raw ingredients (Oats, Eggs, Chicken, Rice, Ghee, Milk)..."
                    className="w-full bg-[#080d09] border border-white/10 focus:border-[#c6ff3d] rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-[#5a6b58] outline-none transition-all"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "all", label: "All Items" },
                    { id: "protein", label: "🥩 Protein" },
                    { id: "carbs", label: "🌾 Grains/Carbs" },
                    { id: "fats", label: "🥑 Healthy Fats/Oils" },
                    { id: "dairy", label: "🥛 Dairy & Liquids" },
                    { id: "produce", label: "🥦 Veggies & Fruits" },
                    { id: "supplements", label: "⚡ Whey & Supps" },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPantryCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-mono whitespace-nowrap transition-all border ${
                        pantryCategory === cat.id
                          ? "bg-[#c6ff3d]/20 border-[#c6ff3d] text-[#c6ff3d] font-bold"
                          : "bg-white/[0.02] border-white/10 text-[#8b9c8a] hover:text-white"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Pantry Grid List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[460px] overflow-y-auto pr-1">
                  {filteredPantry.map((ing) => (
                    <div
                      key={ing.id}
                      onClick={() => handleAddIngredientToBuilder(ing)}
                      className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-[#c6ff3d]/50 hover:bg-[#c6ff3d]/5 transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <b className="text-xs text-white block">{ing.name}</b>
                        {ing.hindiName && (
                          <span className="text-[10px] text-[#8b9c8a]">({ing.hindiName})</span>
                        )}
                        <div className="text-[9px] font-mono text-[#5a6b58] mt-1">
                          Per 100g: {ing.kcalPer100g} kcal • {ing.pPer100g}g P
                        </div>
                      </div>
                      <div className="w-7 h-7 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c6ff3d] group-hover:bg-[#c6ff3d] group-hover:text-black">
                        <Plus size={14} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT: ACTIVE RECIPE COOKSTATION (6 COLS) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-[#0e1610] border border-[#c6ff3d]/40 rounded-3xl p-5 shadow-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#c6ff3d] uppercase tracking-wider block">
                      Custom Meal Cookstation
                    </span>
                    <input
                      type="text"
                      value={builderMealName}
                      onChange={(e) => setBuilderMealName(e.target.value)}
                      placeholder="e.g. Aniket's Power Oatmeal & Eggs Bowl"
                      className="text-base font-extrabold text-white bg-transparent border-b border-white/20 focus:border-[#c6ff3d] outline-none w-full mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={builderMealCategory}
                      onChange={(e) => setBuilderMealCategory(e.target.value)}
                      className="bg-black/50 border border-white/10 text-xs font-mono text-white rounded-xl px-2.5 py-1 outline-none"
                    >
                      {customSlots.map((s) => (
                        <option key={s} value={s} className="bg-[#0e1610] text-white">
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Active Ingredients List */}
                <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                  {activeIngredients.length === 0 ? (
                    <div className="text-center py-8 text-xs font-mono text-[#5a6b58] border border-dashed border-white/10 rounded-2xl">
                      Select raw ingredients from the left pantry to build your meal!
                    </div>
                  ) : (
                    activeIngredients.map((item, idx) => {
                      const macros = calculateIngredientMacros(item.ingredient, item.amount, item.unit);
                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                        >
                          <div className="flex-1">
                            <b className="text-xs text-white block">{item.ingredient.name}</b>
                            <div className="text-[10px] font-mono text-[#8b9c8a] flex items-center gap-2 mt-0.5">
                              <span className="text-[#c6ff3d] font-bold">{macros.kcal} kcal</span>
                              <span>•</span>
                              <span>{macros.p}g P</span>
                              <span>•</span>
                              <span>{macros.c}g C</span>
                              <span>•</span>
                              <span>{macros.f}g F</span>
                            </div>
                          </div>

                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center bg-[#080d09] border border-white/10 rounded-xl px-2 py-1">
                              <input
                                type="number"
                                min="0.1"
                                step="any"
                                value={item.amount}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setActiveIngredients((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, amount: val } : it))
                                  );
                                }}
                                className="w-14 text-center bg-transparent text-xs font-mono text-white outline-none font-bold"
                              />
                              <span className="text-[10px] font-mono text-[#8b9c8a] ml-1">
                                {item.unit}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveIngredients((prev) => prev.filter((_, i) => i !== idx));
                              }}
                              className="p-1.5 text-[#5a6b58] hover:text-rose-400 transition-colors"
                              title="Remove ingredient"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Real-time Recalculated Aggregated Totals */}
                <div className="bg-black/60 p-4 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8b9c8a]">
                    <span>AGGREGATED COMPOSITE MACROS:</span>
                    <span>Total Weight: ~{builderTotals.weightGrams}g</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <span className="text-[9px] font-mono text-amber-400 block uppercase">Energy</span>
                      <b className="text-base text-white">{builderTotals.kcal}</b>
                      <small className="text-[9px] text-[#5a6b58] block">kcal</small>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-[#c6ff3d] block uppercase">Protein</span>
                      <b className="text-base text-[#c6ff3d]">{builderTotals.p}</b>
                      <small className="text-[9px] text-[#5a6b58] block">grams</small>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-sky-400 block uppercase">Carbs</span>
                      <b className="text-base text-white">{builderTotals.c}</b>
                      <small className="text-[9px] text-[#5a6b58] block">grams</small>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-rose-400 block uppercase">Fats</span>
                      <b className="text-base text-white">{builderTotals.f}</b>
                      <small className="text-[9px] text-[#5a6b58] block">grams</small>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSaveRecipe}
                    className="py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <BookmarkPlus size={15} className="text-[#c6ff3d]" />
                    <span>Save as Recipe</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleLogBuiltMeal}
                    className="py-3 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(198,255,61,0.25)]"
                  >
                    <Plus size={16} />
                    <span>Log to {builderMealCategory}</span>
                  </button>
                </div>
              </div>

              {/* Today's Fuel Timeline */}
              <MealTimelineCard
                loggedEntries={loggedEntries}
                totalLoggedKcal={totalLoggedKcal}
                onDelete={handleDeleteEntry}
              />
            </div>
          </div>
        )}

        {/* --- TAB 3: SAVED CUSTOM RECIPES --- */}
        {activeTab === "saved_recipes" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Your Reusable Custom Recipes
                </h3>
                <p className="text-xs text-[#8b9c8a]">
                  1-Click log custom recipes created from the Pantry Cookstation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("meal_builder")}
                className="px-3 py-1.5 bg-[#c6ff3d] text-black rounded-xl text-xs font-mono font-bold flex items-center gap-1"
              >
                <Plus size={14} />
                <span>Build New Meal</span>
              </button>
            </div>

            {savedRecipes.length === 0 ? (
              <div className="text-center py-16 bg-[#0e1610] rounded-3xl border border-white/5 space-y-3">
                <ChefHat size={32} className="text-[#5a6b58] mx-auto" />
                <p className="text-xs font-mono text-[#8b9c8a]">
                  No saved recipes yet. Go to the Meal Builder to assemble your favorite bowls!
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("meal_builder")}
                  className="px-4 py-2 bg-[#c6ff3d]/15 text-[#c6ff3d] border border-[#c6ff3d]/30 rounded-xl text-xs font-mono font-bold"
                >
                  Open Meal Builder →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedRecipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="p-5 rounded-3xl bg-[#0e1610] border border-white/10 hover:border-[#c6ff3d]/40 transition-all space-y-3.5 relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-[#c6ff3d] uppercase tracking-wider block">
                          {recipe.mealCategory}
                        </span>
                        <h4 className="text-sm font-extrabold text-white mt-0.5">{recipe.name}</h4>
                        <span className="text-[10px] font-mono text-[#8b9c8a]">{recipe.servingSize}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecipe(recipe.id)}
                        className="text-[#5a6b58] hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Ingredients summary */}
                    <div className="text-[11px] text-[#8b9c8a] line-clamp-2 bg-black/40 p-2 rounded-xl border border-white/5">
                      {recipe.ingredients.map((i) => `${i.amount}${i.unit} ${i.ingredientName}`).join(", ")}
                    </div>

                    {/* Macro pills */}
                    <div className="grid grid-cols-4 gap-1 text-center bg-white/[0.02] p-2 rounded-xl border border-white/5 text-[10px] font-mono">
                      <div><span className="text-[#8b9c8a] block text-[8px]">KCAL</span><b className="text-white">{recipe.kcal}</b></div>
                      <div><span className="text-[#c6ff3d] block text-[8px]">PROT</span><b className="text-[#c6ff3d]">{recipe.p}g</b></div>
                      <div><span className="text-sky-400 block text-[8px]">CARB</span><b className="text-white">{recipe.c}g</b></div>
                      <div><span className="text-rose-400 block text-[8px]">FAT</span><b className="text-white">{recipe.f}g</b></div>
                    </div>

                    {/* 1-Click Log Button */}
                    <button
                      type="button"
                      onClick={() => handleLogSavedRecipe(recipe)}
                      className="w-full py-2.5 bg-[#c6ff3d]/15 hover:bg-[#c6ff3d] text-[#c6ff3d] hover:text-black border border-[#c6ff3d]/40 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Plus size={14} />
                      <span>Log to {selectedSlot}</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- MODAL 1: DIET STRATEGY & TARGETS CUSTOMIZATION --- */}
      <Dialog open={targetModalOpen} onOpenChange={setTargetModalOpen}>
        <DialogContent className="max-w-lg bg-[#0c130e] border border-[#c6ff3d]/30 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders size={18} className="text-[#c6ff3d]" />
              <span>Customize Diet Strategy & Macro Targets</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8b9c8a]">
              Adjust your daily caloric baseline and macronutrient distribution directly inside the tab.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            {/* Quick Diet Strategy Presets */}
            <div>
              <label className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider block mb-2">
                1-Click Strategy Presets:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "cutting" as const, label: "🔥 Fat Loss", desc: "40% P / Deficit" },
                  { id: "bulking" as const, label: "💪 Lean Bulk", desc: "50% C / Surplus" },
                  { id: "maintenance" as const, label: "⚖️ Balance", desc: "30P/45C/25F" },
                  { id: "keto" as const, label: "🥑 Keto", desc: "65% F / Low Carb" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleApplyDietStrategy(s.id)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-[#c6ff3d]/15 border border-white/10 hover:border-[#c6ff3d]/40 text-left transition-all"
                  >
                    <b className="text-xs text-white block">{s.label}</b>
                    <small className="text-[9px] text-[#8b9c8a] block font-mono">{s.desc}</small>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input Fields */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-black/40 p-3 rounded-2xl border border-white/10">
                <label className="text-[10px] font-mono text-amber-400 uppercase block mb-1">
                  Daily Energy (kcal)
                </label>
                <input
                  type="number"
                  min="1000"
                  max="6000"
                  value={draftTarget.goalKcal}
                  onChange={(e) => setDraftTarget({ ...draftTarget, goalKcal: Number(e.target.value) })}
                  className="w-full bg-[#080d09] border border-white/10 focus:border-amber-400 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
                />
              </div>

              <div className="bg-black/40 p-3 rounded-2xl border border-white/10">
                <label className="text-[10px] font-mono text-[#c6ff3d] uppercase block mb-1">
                  Protein Target (g)
                </label>
                <input
                  type="number"
                  min="40"
                  max="400"
                  value={draftTarget.goalProtein}
                  onChange={(e) => setDraftTarget({ ...draftTarget, goalProtein: Number(e.target.value) })}
                  className="w-full bg-[#080d09] border border-white/10 focus:border-[#c6ff3d] rounded-xl px-3 py-2 text-sm font-bold text-[#c6ff3d] outline-none"
                />
              </div>

              <div className="bg-black/40 p-3 rounded-2xl border border-white/10">
                <label className="text-[10px] font-mono text-sky-400 uppercase block mb-1">
                  Carbohydrates (g)
                </label>
                <input
                  type="number"
                  min="0"
                  max="800"
                  value={draftTarget.goalCarbs}
                  onChange={(e) => setDraftTarget({ ...draftTarget, goalCarbs: Number(e.target.value) })}
                  className="w-full bg-[#080d09] border border-white/10 focus:border-sky-400 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
                />
              </div>

              <div className="bg-black/40 p-3 rounded-2xl border border-white/10">
                <label className="text-[10px] font-mono text-rose-400 uppercase block mb-1">
                  Healthy Fats (g)
                </label>
                <input
                  type="number"
                  min="10"
                  max="300"
                  value={draftTarget.goalFat}
                  onChange={(e) => setDraftTarget({ ...draftTarget, goalFat: Number(e.target.value) })}
                  className="w-full bg-[#080d09] border border-white/10 focus:border-rose-400 rounded-xl px-3 py-2 text-sm font-bold text-white outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSaveTargets}
              className="w-full mt-3 py-3.5 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-[0_0_20px_rgba(198,255,61,0.25)]"
            >
              Apply Targets & Recalculate Telemetry
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 2: CUSTOM MEAL SLOTS MANAGER --- */}
      <Dialog open={slotModalOpen} onOpenChange={setSlotModalOpen}>
        <DialogContent className="max-w-md bg-[#0c130e] border border-[#c6ff3d]/30 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-[#c6ff3d]" />
              <span>Customize Meal Categories</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8b9c8a]">
              Add custom meal slots (e.g. Pre-Workout Snack, Midnight Shake, Meal 1).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-3">
            {/* Add Slot Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSlotName}
                onChange={(e) => setNewSlotName(e.target.value)}
                placeholder="e.g. Pre-Workout Fuel"
                className="flex-1 bg-[#080d09] border border-white/10 focus:border-[#c6ff3d] rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
              <button
                type="button"
                onClick={handleAddCustomSlot}
                className="px-4 py-2 bg-[#c6ff3d] text-black rounded-xl text-xs font-mono font-bold"
              >
                Add Slot
              </button>
            </div>

            {/* Current Slots List */}
            <div className="space-y-2 max-h-[220px] overflow-y-auto">
              {customSlots.map((slot) => (
                <div
                  key={slot}
                  className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between text-xs"
                >
                  <span className="font-mono text-white">{slot}</span>
                  {customSlots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomSlot(slot)}
                      className="text-[#5a6b58] hover:text-rose-400 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* --- MODAL 3: QUICK CUSTOM SINGLE FOOD ITEM --- */}
      <Dialog open={quickCustomModalOpen} onOpenChange={setQuickCustomModalOpen}>
        <DialogContent className="max-w-md bg-[#0c130e] border border-[#c6ff3d]/30 text-white rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#c6ff3d]" />
              <span>Add Custom Food Item</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-[#8b9c8a]">
              Define any food with exact calories and macronutrients.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <div>
              <label className="text-[10px] font-mono text-[#8b9c8a] uppercase block mb-1">Item Name</label>
              <input
                type="text"
                value={draftCustomFood.name}
                onChange={(e) => setDraftCustomFood({ ...draftCustomFood, name: e.target.value })}
                placeholder="e.g. Grandma's Sattu Paratha"
                className="w-full bg-[#080d09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#c6ff3d]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-[#8b9c8a] uppercase block mb-1">Serving Size</label>
                <input
                  type="text"
                  value={draftCustomFood.servingSize}
                  onChange={(e) => setDraftCustomFood({ ...draftCustomFood, servingSize: e.target.value })}
                  placeholder="e.g. 1 medium piece"
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-[#8b9c8a] uppercase block mb-1">Unit</label>
                <input
                  type="text"
                  value={draftCustomFood.unit}
                  onChange={(e) => setDraftCustomFood({ ...draftCustomFood, unit: e.target.value })}
                  placeholder="g / pieces / bowl"
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="text-[9px] font-mono text-amber-400 uppercase block mb-1">Kcal</label>
                <input
                  type="number"
                  value={draftCustomFood.kcal}
                  onChange={(e) => setDraftCustomFood({ ...draftCustomFood, kcal: e.target.value })}
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-[#c6ff3d] uppercase block mb-1">Prot (g)</label>
                <input
                  type="number"
                  value={draftCustomFood.p}
                  onChange={(e) => setDraftCustomFood({ ...draftCustomFood, p: e.target.value })}
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-sky-400 uppercase block mb-1">Carb (g)</label>
                <input
                  type="number"
                  value={draftCustomFood.c}
                  onChange={(e) => setDraftCustomFood({ ...draftCustomFood, c: e.target.value })}
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-rose-400 uppercase block mb-1">Fat (g)</label>
                <input
                  type="number"
                  value={draftCustomFood.f}
                  onChange={(e) => setDraftCustomFood({ ...draftCustomFood, f: e.target.value })}
                  className="w-full bg-[#080d09] border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateQuickCustomFood}
              className="w-full mt-3 py-3 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase tracking-wider rounded-2xl transition-all"
            >
              Save Custom Item
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </WorkflowLayout>
  );
}

// Reusable Meal Timeline Card
function MealTimelineCard({
  loggedEntries,
  totalLoggedKcal,
  onDelete,
}: {
  loggedEntries: LoggedEntry[];
  totalLoggedKcal: number;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-[#0e1610] border border-white/10 rounded-3xl p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Clock size={14} className="text-[#c6ff3d]" />
          <span>Today's Fuel Timeline ({loggedEntries.length})</span>
        </span>
        <span className="text-[10px] font-mono text-[#c6ff3d]">
          {totalLoggedKcal} kcal Total
        </span>
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {loggedEntries.length === 0 ? (
          <div className="text-center py-6 text-[11px] font-mono text-[#5a6b58]">
            No foods logged yet today. Select an Indian staple or construct a meal in the Pantry builder!
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
                  <span>{entry.servingSize}</span>
                  <span>•</span>
                  <span>{entry.time}</span>
                </div>
                {entry.ingredientsSummary && (
                  <div className="text-[9px] text-[#5a6b58] truncate max-w-[200px] sm:max-w-[280px]">
                    {entry.ingredientsSummary}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="font-bold text-white text-xs block">{entry.kcal} kcal</span>
                  <span className="text-[10px] font-mono text-[#c6ff3d]">{entry.p}g P</span>
                </div>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
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
  );
}
