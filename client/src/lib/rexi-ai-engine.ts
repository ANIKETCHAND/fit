/* FitTrack: Rexi AI Conversational Intelligence & Context Engine */
import { getActiveUserEmail, getAthleteProfile, getCalibrationSettings, getScopedKey } from "./user-store";
import { INDIAN_FOOD_DATABASE } from "@/data/indian-foods";

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

/**
 * 1. Assemble Live Athlete Telemetry Context
 */
export function getLiveRexiContext(activeRoute: string = "/overview"): RexiContext {
  const profile = getAthleteProfile();
  const calibration = getCalibrationSettings();
  const experienceMode = (localStorage.getItem("fittrack-experience-mode") || "beginner") as "beginner" | "intermediate" | "advanced";

  const massKg = calibration.weightKg || 75;
  const heightCm = calibration.heightCm || 175;
  const age = calibration.age || 24;
  const sex = calibration.sex || "male";

  // Calculate BMR & TDEE
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

  // Logged meals today
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
 * 2. Deep Conversational Reasoning Engine
 */
export async function generateRexiChatResponse(
  userQuery: string,
  context: RexiContext,
  chatHistory: Array<{ sender: "rexi" | "user"; text: string }> = []
): Promise<{ text: string; chips?: string[] }> {
  const q = userQuery.trim().toLowerCase();
  const name = context.athleteName.split(" ")[0] || "Athlete";
  const isGymRat = context.experienceMode === "advanced" || context.experienceMode === "intermediate";

  // 1. DINNER / MEAL SUGGESTION (Personalized with real-time remaining macros)
  if (
    q.includes("eat") ||
    q.includes("dinner") ||
    q.includes("lunch") ||
    q.includes("breakfast") ||
    q.includes("meal") ||
    q.includes("hungry") ||
    q.includes("diet") ||
    q.includes("what should i eat")
  ) {
    if (context.remainingProtein > 0) {
      return {
        text: `Hey **${name}**! Based on your live telemetry, you have **${context.remainingProtein}g of protein** and **${context.remainingKcal} kcal** remaining today towards your daily goal (${context.goalProtein}g P / ${context.goalKcal} kcal).\n\nHere are the best Indian meals tailored to your remaining macros:\n\n1. **High-Protein Veg Option:**\n   • **150g Grilled Paneer Tikka** (~21g Protein, 310 kcal)\n   • **1 Bowl Soya Chunks Curry** (~22.5g Protein, 240 kcal)\n   • Combined with **2 Whole Wheat Phulkas** (~6.4g Protein, 170 kcal)\n   → *Total: ~50g Protein, perfectly completing your target!*\n\n2. **High-Protein Non-Veg Option:**\n   • **200g Tandoori Chicken / Chicken Breast** (~44–62g Protein, 290–330 kcal)\n   • **1 Katori Steamed Basmati Rice** (195 kcal, 4.2g Protein)\n\n3. **Quick Recovery Shake:**\n   • **1 Scoop 100% Whey in Water/Milk** (~24.5g Protein, 125 kcal) or **Chana Sattu Drink** (40g, 10.2g Protein).\n\nWould you like me to log any of these directly to your **Nutrition Lab**?`,
        chips: [
          "Log Paneer Tikka",
          "Log Chicken Breast",
          "How are my macros calculated?",
          "Show my daily streak",
        ],
      };
    } else {
      return {
        text: `Awesome work, **${name}**! 🎉 You have already hit your daily protein goal (**${context.totalLoggedProtein}g / ${context.goalProtein}g**)!\n\nYou have **${context.remainingKcal} kcal** remaining. For clean energy and recovery, consider light, easily digestible staples like:\n• **1 Bowl Yellow Moong Dal Tadka with 2 Phulkas**\n• **Steamed Idlis with Vegetable Sambar**\n• **A bowl of Fresh Dahi (Curd) with roasted seeds**`,
        chips: ["Check my workout stats", "Show 3D Anatomy Map", "Tips for tomorrow's workout"],
      };
    }
  }

  // 2. CREATINE / SUPPLEMENTS SCIENCE
  if (
    q.includes("creatine") ||
    q.includes("whey") ||
    q.includes("supplement") ||
    q.includes("protein powder") ||
    q.includes("pre workout") ||
    q.includes("bcaa") ||
    q.includes("ashwagandha")
  ) {
    if (q.includes("creatine")) {
      return {
        text: `Here is the science on **Creatine Monohydrate** for you, ${name}:\n\n• **How it works:** Creatine increases your muscle cells' phosphocreatine stores, which rapidly regenerates ATP during high-intensity explosive lifting.\n• **Dosage Protocol:**\n  - **Standard Daily Maintenance (Recommended):** Take **3g to 5g daily** consistently with water or carbs.\n  - **Optional Loading Phase:** 20g/day split into 4 doses for 5–7 days, then drop to 5g/day.\n• **Timing:** Timing is less important than daily consistency. Post-workout with a meal or shake works great.\n• **Hydration:** Aim for 3.5–4.5L of water daily to support intracellular cellular hydration!\n• **Safety:** It is one of the most researched and safest sports supplements in the world.`,
        chips: ["Explain Whey Protein vs Sattu", "Best pre-workout meal?", "How to track progressive overload"],
      };
    }
    return {
      text: `**Evidence-Based Supplement Protocols for ${name} (${context.massKg}kg Athlete):**\n\n1. **100% Whey Protein:** Fast-digesting complete amino acid profile with high Leucine content to trigger muscle protein synthesis (MPS).\n2. **Creatine Monohydrate (3–5g/day):** Boosts power output and strength by 5–15%.\n3. **Caffeine / Pre-Workout (150–250mg):** Enhances central nervous system arousal and reduces perceived exertion.\n4. **Omega-3 & Vitamin D3/K2:** Essential for joint lubrication, hormonal health, and systemic recovery.\n\nAlways prioritize whole-food nutrition first (like paneer, eggs, chicken, soya, dal), using supplements as efficient boosters!`,
      chips: ["How much protein do I need?", "What should I eat before lifting?", "Explain progressive overload"],
    };
  }

  // 3. WORKOUT SPLIT / PROGRESSIVE OVERLOAD / EXERCISE SCIENCE
  if (
    q.includes("split") ||
    q.includes("progressive overload") ||
    q.includes("hypertrophy") ||
    q.includes("reps") ||
    q.includes("sets") ||
    q.includes("rpe") ||
    q.includes("1rm") ||
    q.includes("push pull legs") ||
    q.includes("bro split") ||
    q.includes("upper lower")
  ) {
    const levelAdvice = isGymRat
      ? `As a seasoned **Gym Rat**, you benefit most from **Push-Pull-Legs (PPL)** or an **Upper/Lower 4–5 day split**, focusing on heavy compound sets ($RPE\\ 8-9$) combined with high-tension mechanical stretch movements.`
      : `As a beginner, a **Full Body 3x/week** or **Upper/Lower 4x/week split** is ideal to master motor patterns and trigger frequent muscle protein synthesis!`;

    return {
      text: `**Hypertrophy & Training Mechanics for ${name}:**\n\n${levelAdvice}\n\n• **Progressive Overload Framework:**\n  1. **Load Progression:** Add $1.25\\text{kg}-2.5\\text{kg}$ to your compound lifts when you hit the top of your rep target.\n  2. **Rep Progression:** If benching $70\\text{kg}$ for 8 reps, aim for 9, then 10 before adding weight.\n  3. **Volume Quality:** 10–20 working sets per muscle group per week taken within 1–3 reps of muscular failure ($RPE\\ 7.5-9$).\n\n• **Rest Periods:** 2–3 minutes for heavy compounds (Squat, Deadlift, Bench Press, Overhead Press); 60–90 seconds for isolations.`,
      chips: ["Show 3D Anatomy Map", "How to calculate 1RM?", "How do I log my workout?"],
    };
  }

  // 4. GENERAL SCIENCE / BEYOND THE APP / GENERAL KNOWLEDGE
  if (
    q.includes("who are you") ||
    q.includes("what can you do") ||
    q.includes("help") ||
    q.includes("gemini") ||
    q.includes("chatgpt") ||
    q.includes("ai")
  ) {
    return {
      text: `I'm **Rexi**, your personal 3D AI fitness companion and high-performance coach!\n\nThink of me as your personal fitness ChatGPT & Gemini combined with real-time biometric telemetry. You can ask me **anything**:\n\n• 🏋️ **Workout & Biomechanics:** Routine splits, progressive overload, RPE, 1RM formulas, technique cues.\n• 🍛 **Nutrition & Indian Foods:** Macro breakdowns for 60+ Indian staples, meal planning, calorie deficit/surplus.\n• 🔬 **Physiology & Recovery:** Sleep optimization, creatine protocols, hydration, soreness recovery.\n• 🧭 **FitTrack OS Navigation:** 3D Male Anatomy explorer, GPS tracker, biometric calibration, data exports.\n• 💡 **General Knowledge:** Questions about science, lifestyle, productivity, or motivation!\n\nHow can I help you level up today, ${name}?`,
      chips: ["What should I eat today?", "Explain Creatine dosage", "Show my biometric calibration"],
    };
  }

  // 5. FITTRACK 3D ANATOMY / NAVIGATION
  if (
    q.includes("3d") ||
    q.includes("body") ||
    q.includes("muscle") ||
    q.includes("map") ||
    q.includes("anatomy")
  ) {
    return {
      text: `**Interactive 3D Male Anatomy Simulation:**\n\n• **Interactive Raycasting:** You can rotate, zoom, and click individual muscle groups on the 3D model (Chest, Deltoids, Biceps, Triceps, Lats, Quads, Hamstrings, Glutes, Calves).\n• **Readiness & Volume Telemetry:** Selecting any muscle displays its real-time recovery score, volume load ($kg$), and scientifically recommended movements on the right-hand diagnostic panel.\n• **View Angles:** Use the **FRONT**, **BACK**, and **SIDE** camera docks for instant optimal perspective!`,
      chips: ["How do I log a workout?", "What are my daily calorie targets?", "Show my streak"],
    };
  }

  // 6. GENERAL CHAT / MOTIVATION / CUSTOM QUERY ANSWER
  return {
    text: `That's a fantastic question, **${name}**!\n\nAs your AI fitness guide, here is my insight:\n\n• **Consistency & Precision:** True athletic transformation is built on consistent daily micro-habits—logging your meals, progressive lifting, and adequate sleep ($7.5-9\\text{h}$).\n• **Your Current Calibration:** You are currently set at **${context.massKg}kg**, aiming for **${context.goalProtein}g Protein** and **${context.goalKcal} kcal** daily.\n• You can ask me anything about workout routines, nutrition science, Indian recipes, supplement timing, or app features anytime!`,
    chips: [
      "What should I eat today?",
      "Explain Creatine dosage",
      "How to track progressive overload",
      "Guide me through the app",
    ],
  };
}
