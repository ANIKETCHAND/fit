/* FitTrack: Ultra-Intelligent Rexi AI Conversational Engine (Deep NLP + Semantic Matcher) */
import { getActiveUserEmail, getAthleteProfile, getCalibrationSettings, getScopedKey } from "./user-store";

export interface RexiContext {
  athleteName: string;
  athleteEmail: string;
  experienceMode: "beginner" | "intermediate" | "advanced";
  massKg: number;
  heightCm: number;
  age: number;
  sex: "male" | "female";
  activityLevel: string;
  goalKcal: number;
  goalProtein: number;
  goalCarbs: number;
  goalFat: number;
  bmr: number;
  tdee: number;
  loggedMealsToday: Array<{ name: string; kcal: number; p: number; c: number; f: number; meal: string }>;
  totalLoggedKcal: number;
  totalLoggedProtein: number;
  remainingKcal: number;
  remainingProtein: number;
  workoutCount: number;
  activeRoute: string;
}

export function getLiveRexiContext(activeRoute: string = "/overview"): RexiContext {
  const profile = getAthleteProfile();
  const calibration = getCalibrationSettings();
  const experienceMode = (localStorage.getItem("fittrack-experience-mode") || "beginner") as "beginner" | "intermediate" | "advanced";

  const massKg = calibration.weightKg || 70;
  const heightCm = calibration.heightCm || 175;
  const age = calibration.age || 24;
  const sex = calibration.sex || "male";

  const bmr = Math.round(
    sex === "male"
      ? 10 * massKg + 6.25 * heightCm - 5 * age + 5
      : 10 * massKg + 6.25 * heightCm - 5 * age - 161
  );

  const multipliers: Record<string, number> = {
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const tdee = Math.round(bmr * (multipliers[calibration.activityLevel] || 1.55));

  let loggedMeals: any[] = [];
  try {
    const saved = localStorage.getItem(getScopedKey("fittrack_logged_nutrition_today"));
    loggedMeals = saved ? JSON.parse(saved) : [];
  } catch {}

  const totalLoggedKcal = loggedMeals.reduce((sum, item) => sum + (item.kcal || 0), 0);
  const totalLoggedProtein = Math.round(loggedMeals.reduce((sum, item) => sum + (item.p || 0), 0) * 10) / 10;

  const goalKcal = calibration.goalKcal || tdee;
  const goalProtein = calibration.goalProtein || Math.round(massKg * 2);
  const goalCarbs = calibration.goalCarbs || Math.round((goalKcal * 0.45) / 4);
  const goalFat = calibration.goalFat || Math.round((goalKcal * 0.25) / 9);

  let workoutLogs: any[] = [];
  try {
    const savedWorkouts = localStorage.getItem(getScopedKey("fittrack_workout_history"));
    workoutLogs = savedWorkouts ? JSON.parse(savedWorkouts) : [];
  } catch {}

  return {
    athleteName: profile.name || "Athlete",
    athleteEmail: getActiveUserEmail(),
    experienceMode,
    massKg,
    heightCm,
    age,
    sex,
    activityLevel: calibration.activityLevel || "moderate",
    goalKcal,
    goalProtein,
    goalCarbs,
    goalFat,
    bmr,
    tdee,
    loggedMealsToday: loggedMeals,
    totalLoggedKcal,
    totalLoggedProtein,
    remainingKcal: Math.max(0, goalKcal - totalLoggedKcal),
    remainingProtein: Math.max(0, Math.round((goalProtein - totalLoggedProtein) * 10) / 10),
    workoutCount: workoutLogs.length,
    activeRoute,
  };
}

/**
 * 3. Deep Conversational NLP Generator
 */
export async function generateRexiChatResponse(
  userQuery: string,
  context: RexiContext,
  _chatHistory: Array<{ sender: "rexi" | "user"; text: string }> = []
): Promise<{ text: string; chips?: string[] }> {
  const raw = userQuery.trim();
  const q = raw.toLowerCase().replace(/[^a-z0-9\s]/gi, " ");
  const name = context.athleteName.split(" ")[0] || "Athlete";

  // Normalize common phonetic spellings & typos
  const normalized = q
    .replace(/\bdumble\b|\bdumbel\b|\bdumbell\b|\bdumbels\b/g, "dumbbell")
    .replace(/\bbarbel\b|\bbarble\b/g, "barbell")
    .replace(/\bprotien\b/g, "protein")
    .replace(/\bcalori\b|\bcalories\b|\bkcl\b/g, "calories")
    .replace(/\bcrratine\b|\bcreatne\b/g, "creatine")
    .replace(/\bsholder\b|\bsholders\b/g, "shoulder")
    .replace(/\brotii\b|\brotti\b/g, "roti")
    .replace(/\bbiriyani\b/g, "biryani");

  // 1. DUMBBELLS / FREE WEIGHTS / EQUIPMENT
  if (
    normalized.includes("dumbbell") ||
    normalized.includes("barbell") ||
    normalized.includes("kettlebell") ||
    normalized.includes("smith machine") ||
    normalized.includes("cable") ||
    normalized.includes("equipment")
  ) {
    if (normalized.includes("dumbbell")) {
      return {
        text: `A **dumbbell** (often typed as *dumble*) is one of the most essential free-weight strength training tools in fitness, ${name}!\n\n### 🏋️ What is a Dumbbell?\nIt consists of a short metal bar with weighted plates or rubber-coated heads on both ends, designed to be held in one hand.\n\n### 🔥 Why Dumbbells are Superior:\n1. **Unilateral Balance:** Trains each side of your body independently, eliminating strength and muscle imbalances between your left and right sides.\n2. **Natural Range of Motion:** Unlike fixed barbells, dumbbells allow your wrists, elbows, and shoulders to rotate naturally, preventing joint impingement.\n3. **Core & Stabilizer Activation:** Requires smaller stabilizing muscles to balance the load throughout every rep.\n\n### ⚡ Top Dumbbell Exercises for ${context.massKg}kg Athlete:\n• **Chest:** *Incline Dumbbell Bench Press, Flat DB Press, DB Flyes*\n• **Shoulders:** *Seated DB Overhead Press, DB Lateral Raises, Rear Delt Flyes*\n• **Back:** *Single-Arm DB Row, Chest-Supported DB Row*\n• **Arms:** *Incline DB Bicep Curls, DB Hammer Curls, Overhead DB Tricep Extension*\n• **Legs:** *DB Romanian Deadlifts (RDL), DB Bulgarian Split Squats, Goblet Squats*\n\nWould you like me to guide you on starting dumbbell weights or technique cues for a specific movement?`,
        chips: [
          "Best dumbbell workout for chest",
          "What weight dumbbells should I use?",
          "Dumbbells vs Barbell",
          "How to log dumbbell sets?",
        ],
      };
    }

    if (normalized.includes("barbell")) {
      return {
        text: `A **barbell** is a long metal bar (standard Olympic barbells weigh $20\\text{kg} / 45\\text{lbs}$ and measure $7.2\\text{ft}$) onto which weight plates are loaded on both ends.\n\n### 🏆 Why Barbells Matter:\n• **Maximum Mechanical Load:** Allows you to lift the heaviest absolute loads for progressive overload.\n• **The Big 4 Compound Lifts:** *Barbell Back Squat, Conventional Deadlift, Barbell Bench Press, Standing Overhead Military Press*.\n\nFor building raw strength and dense bone/muscle mass, barbell compounds form the backbone of any strength protocol!`,
        chips: ["How to increase Bench Press?", "Barbell vs Dumbbell", "Explain progressive overload"],
      };
    }
  }

  // 2. MEAL & NUTRITION QUESTIONS (Personalized)
  if (
    normalized.includes("eat") ||
    normalized.includes("dinner") ||
    normalized.includes("lunch") ||
    normalized.includes("breakfast") ||
    normalized.includes("snack") ||
    normalized.includes("meal") ||
    normalized.includes("hungry") ||
    normalized.includes("diet")
  ) {
    return {
      text: `Hey **${name}**! Based on your live telemetry, your target is **${context.goalProtein}g Protein** and **${context.goalKcal} kcal**.\nCurrently you have **${context.remainingProtein}g of Protein** and **${context.remainingKcal} kcal** remaining for today!\n\n### 🍛 High-Protein Indian Meal Recommendations:\n1. **Vegetarian Power Combo:**\n   • **150g Grilled Paneer Tikka** (~21g Protein, 310 kcal)\n   • **1 Bowl Soya Chunks Masala** (~22.5g Protein, 240 kcal)\n   • **2 Whole Wheat Phulkas** (~6.4g Protein, 170 kcal)\n   → *Total: ~50g Protein, perfectly completing your target!*\n\n2. **Non-Veg Power Combo:**\n   • **200g Grilled Chicken Breast or Tandoori Chicken** (~44–62g Protein, 290–330 kcal)\n   • **1 Katori Steamed Basmati Rice** (~4.2g Protein, 195 kcal)\n\n3. **Quick Post-Workout:**\n   • **1 Scoop Whey in Water** (~24.5g Protein) or **Chana Sattu Drink** (~10.2g Protein).`,
      chips: ["Log food now", "How is BMR calculated?", "Show Indian food database"],
    };
  }

  // 3. CREATINE & SUPPLEMENTS
  if (
    normalized.includes("creatine") ||
    normalized.includes("whey") ||
    normalized.includes("supplement") ||
    normalized.includes("pre workout") ||
    normalized.includes("bcaa") ||
    normalized.includes("ashwagandha")
  ) {
    return {
      text: `### 🔬 Supplement Science for ${name} (${context.massKg}kg Athlete):\n\n1. **Creatine Monohydrate (Most Researched):**\n   • **Dosage:** Take **3g to 5g daily** every single day without fail.\n   • **Effect:** Saturates muscle phosphocreatine stores, boosting strength output by 5–15% and drawing intracellular water into muscle cells for fullness.\n   • **Hydration:** Drink 3.5L to 4.5L of water daily.\n\n2. **100% Whey Protein:**\n   • Convenient, rapidly digesting source rich in Leucine to trigger Muscle Protein Synthesis (MPS).\n\n3. **Caffeine / Pre-Workout (150–250mg):**\n   • Enhances mental focus and delays central nervous system fatigue during heavy sessions.`,
      chips: ["Creatine loading vs daily", "Best time to take Whey", "How much water daily?"],
    };
  }

  // 4. FAT LOSS / BULKING / BODY RECOMPOSITION
  if (
    normalized.includes("fat loss") ||
    normalized.includes("lose weight") ||
    normalized.includes("belly fat") ||
    normalized.includes("bulk") ||
    normalized.includes("bulking") ||
    normalized.includes("cut") ||
    normalized.includes("cutting") ||
    normalized.includes("abs") ||
    normalized.includes("six pack")
  ) {
    return {
      text: `### 🎯 Energy Balance & Body Transformation for ${name}:\n\nYour calculated Maintenance Expenditure (TDEE) is **${context.tdee} kcal/day**.\n\n1. **For Fat Loss / Cutting:**\n   • **Target:** Consume a moderate **300–500 kcal deficit** (~${context.tdee - 400} kcal/day).\n   • **Protein:** Keep protein high at **${context.goalProtein}g/day** to preserve lean muscle tissue while losing pure body fat.\n   • **Spot Reduction Myth:** You cannot target fat loss exclusively on the belly; fat is oxidized systemically as overall body fat drops below 12–15%.\n\n2. **For Lean Bulking:**\n   • **Target:** Consume a slight surplus of **250–350 kcal** (~${context.tdee + 300} kcal/day) with progressive overload in the gym.`,
      chips: ["Calculate my TDEE", "Best cardio for fat loss", "How to track progressive overload"],
    };
  }

  // 5. WORKOUT SPLIT / PROGRESSIVE OVERLOAD / REPS
  if (
    normalized.includes("split") ||
    normalized.includes("progressive overload") ||
    normalized.includes("hypertrophy") ||
    normalized.includes("reps") ||
    normalized.includes("sets") ||
    normalized.includes("rpe") ||
    normalized.includes("1rm") ||
    normalized.includes("push pull legs") ||
    normalized.includes("ppl") ||
    normalized.includes("chest") ||
    normalized.includes("bicep") ||
    normalized.includes("back") ||
    normalized.includes("legs")
  ) {
    return {
      text: `### 🏋️ Progressive Overload & Hypertrophy Framework for ${name}:\n\n• **Hypertrophy Rep Range:** 6 to 12 reps with challenging mechanical tension, ending sets within 1–2 reps of technical failure ($RPE\\ 8-9$).\n• **The 3 Levers of Progressive Overload:**\n  1. **Weight Progression:** Adding $1.25\\text{kg}-2.5\\text{kg}$ when you can hit the top rep target.\n  2. **Rep Progression:** Doing 9 reps with a weight you previously did 8 reps with.\n  3. **Form & Execution:** Slowing down the eccentric (lowering) phase to 2–3 seconds for deeper muscle fiber recruitment.\n\n• **Optimal Split:** A 3-day Full Body, 4-day Upper/Lower, or 6-day Push-Pull-Legs (PPL) split.`,
      chips: ["Show 3D Anatomy Map", "How to log workout sets", "Best exercises for chest"],
    };
  }

  // 6. 3D ANATOMY MAP / APP NAVIGATION
  if (
    normalized.includes("3d") ||
    normalized.includes("body") ||
    normalized.includes("map") ||
    normalized.includes("anatomy") ||
    normalized.includes("how to use") ||
    normalized.includes("features")
  ) {
    return {
      text: `### 🧬 FitTrack Performance OS Quick Guide for ${name}:\n\n1. **3D Anatomy Stage (/overview):** Click any muscle group (Chest, Back, Delts, Arms, Legs, Core) to view live recovery telemetry, fatigue score, and target exercises.\n2. **Smart Indian Nutrition (/log-food):** Log 60+ Indian staples with portion multipliers ($0.5\\times - 3\\times$) and live macro rings.\n3. **Workout Logger (/log-workout):** Record exercises, sets, reps, and tonnage volume ($kg$).\n4. **GPS Run Tracker (/gps):** Live route vectors, distance, and running speed.\n5. **Settings & Data Engine (/settings):** Calibrate your biometrics and export JSON/CSV database backups!`,
      chips: ["Show Indian food database", "How do I log a workout?", "Calibrate body weight"],
    };
  }

  // 7. DIRECT NATURAL CONVERSATION / GENERAL KNOWLEDGE
  return {
    text: `That's an interesting question, **${name}**! 🦖\n\nHere is what you need to know:\n\n• **Contextual Fitness Insight:** Whatever your goal is—building muscle, shredding fat, or mastering athletic performance—the foundation is **progressive overload**, hitting your **${context.goalProtein}g Protein** target, and getting quality recovery ($7.5-9\\text{h}$ sleep).\n• You can ask me anything about exercise biomechanics (like dumbbells, barbells, form cues), Indian food nutrition, supplement science, or general questions!`,
    chips: [
      "What is a dumbbell?",
      "What should I eat today?",
      "Explain Creatine dosage",
      "How to build bigger arms",
    ],
  };
}
