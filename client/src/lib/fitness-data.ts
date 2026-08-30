/** Kinetic Anatomy Lab data layer: structured muscle and training data powers the body and diagnostic UI. */
export type MuscleId =
  | "chest"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "core"
  | "back"
  | "glutes"
  | "quads"
  | "hamstrings"
  | "calves";

export type MuscleInfo = {
  id: MuscleId;
  label: string;
  anatomicalName: string;
  status: "Ready" | "Recovered" | "Building";
  lastTrained: string;
  weeklyVolume: string;
  score: number;
  intensity: string;
  exercises: { name: string; sets: number; reps: string; load: string; volume: string }[];
  accent: string;
};

export type RecoveryStatus = "recovered" | "recovering" | "rest";

export type RecoveryDetail = {
  status: RecoveryStatus;
  label: string;
  color: string;
  emissive: string;
  action: string;
};

export function getRecoveryStatus(score: number): RecoveryDetail {
  if (score >= 80) {
    return {
      status: "recovered",
      label: "Fully Recovered",
      color: "#22c55e",
      emissive: "#15803d",
      action: "Fully recovered and primed for heavy compound progression and maximum load.",
    };
  }
  if (score >= 65) {
    return {
      status: "recovering",
      label: "Recovering",
      color: "#f59e0b",
      emissive: "#b45309",
      action: "Moderate recovery. Optimal for accessory work, higher volume, or mobility flow.",
    };
  }
  return {
    status: "rest",
    label: "Needs Rest",
    color: "#ef4444",
    emissive: "#991b1b",
    action: "High residual fatigue detected. Prioritize sleep and recovery before heavy loading.",
  };
}

export const muscleLibrary: Record<MuscleId, MuscleInfo> = {
  chest: {
    id: "chest", label: "Chest", anatomicalName: "Pectoralis Major", status: "Ready", lastTrained: "3 days ago", weeklyVolume: "5,740 kg", score: 85, intensity: "Fully Recovered",
    exercises: [
      { name: "Bench Press", sets: 4, reps: "6–8", load: "82.5 kg", volume: "2,310 kg" },
      { name: "Incline Dumbbell Press", sets: 3, reps: "10", load: "30 kg", volume: "1,800 kg" },
      { name: "Cable Fly", sets: 3, reps: "12", load: "27.5 kg", volume: "990 kg" },
    ], accent: "#22c55e",
  },
  shoulders: {
    id: "shoulders", label: "Shoulders", anatomicalName: "Deltoids", status: "Recovered", lastTrained: "4 days ago", weeklyVolume: "3,980 kg", score: 76, intensity: "Recovering",
    exercises: [{ name: "Seated Press", sets: 4, reps: "8", load: "42.5 kg", volume: "1,360 kg" }, { name: "Lateral Raise", sets: 4, reps: "12", load: "10 kg", volume: "960 kg" }, { name: "Rear Delt Fly", sets: 3, reps: "15", load: "25 kg", volume: "1,125 kg" }], accent: "#f59e0b",
  },
  biceps: {
    id: "biceps", label: "Biceps", anatomicalName: "Biceps Brachii", status: "Ready", lastTrained: "4 days ago", weeklyVolume: "2,420 kg", score: 88, intensity: "Fully Recovered",
    exercises: [{ name: "EZ Bar Curl", sets: 3, reps: "10", load: "32.5 kg", volume: "975 kg" }, { name: "Incline Curl", sets: 3, reps: "12", load: "12 kg", volume: "864 kg" }, { name: "Hammer Curl", sets: 3, reps: "10", load: "16 kg", volume: "480 kg" }], accent: "#22c55e",
  },
  triceps: {
    id: "triceps", label: "Triceps", anatomicalName: "Triceps Brachii", status: "Building", lastTrained: "Yesterday", weeklyVolume: "2,860 kg", score: 48, intensity: "Needs Rest",
    exercises: [{ name: "Close Grip Press", sets: 3, reps: "8", load: "60 kg", volume: "1,440 kg" }, { name: "Rope Pushdown", sets: 3, reps: "12", load: "30 kg", volume: "1,080 kg" }, { name: "Overhead Extension", sets: 2, reps: "12", load: "14 kg", volume: "336 kg" }], accent: "#ef4444",
  },
  core: {
    id: "core", label: "Core", anatomicalName: "Rectus Abdominis", status: "Recovered", lastTrained: "3 days ago", weeklyVolume: "540 reps", score: 92, intensity: "Fully Recovered",
    exercises: [{ name: "Hanging Leg Raise", sets: 4, reps: "12", load: "Bodyweight", volume: "48 reps" }, { name: "Cable Crunch", sets: 4, reps: "15", load: "45 kg", volume: "2,700 kg" }, { name: "Pallof Press", sets: 3, reps: "12", load: "22.5 kg", volume: "810 kg" }], accent: "#22c55e",
  },
  back: {
    id: "back", label: "Back", anatomicalName: "Latissimus Dorsi", status: "Ready", lastTrained: "4 days ago", weeklyVolume: "6,180 kg", score: 82, intensity: "Fully Recovered",
    exercises: [{ name: "Weighted Pull-up", sets: 4, reps: "6", load: "+15 kg", volume: "360 kg" }, { name: "Chest Supported Row", sets: 4, reps: "10", load: "62.5 kg", volume: "2,500 kg" }, { name: "Lat Pulldown", sets: 3, reps: "12", load: "55 kg", volume: "1,980 kg" }], accent: "#22c55e",
  },
  glutes: {
    id: "glutes", label: "Glutes", anatomicalName: "Gluteus Maximus", status: "Recovered", lastTrained: "5 days ago", weeklyVolume: "5,960 kg", score: 74, intensity: "Recovering",
    exercises: [{ name: "Barbell Hip Thrust", sets: 4, reps: "8", load: "105 kg", volume: "3,360 kg" }, { name: "Bulgarian Split Squat", sets: 3, reps: "10", load: "22 kg", volume: "1,320 kg" }, { name: "Cable Kickback", sets: 3, reps: "15", load: "18 kg", volume: "810 kg" }], accent: "#f59e0b",
  },
  quads: {
    id: "quads", label: "Quads", anatomicalName: "Quadriceps", status: "Building", lastTrained: "Yesterday", weeklyVolume: "7,820 kg", score: 42, intensity: "Needs Rest",
    exercises: [{ name: "Front Squat", sets: 4, reps: "6", load: "90 kg", volume: "2,160 kg" }, { name: "Leg Press", sets: 4, reps: "10", load: "160 kg", volume: "6,400 kg" }, { name: "Leg Extension", sets: 3, reps: "12", load: "45 kg", volume: "1,620 kg" }], accent: "#ef4444",
  },
  hamstrings: {
    id: "hamstrings", label: "Hamstrings", anatomicalName: "Hamstrings", status: "Recovered", lastTrained: "5 days ago", weeklyVolume: "4,680 kg", score: 70, intensity: "Recovering",
    exercises: [{ name: "Romanian Deadlift", sets: 4, reps: "8", load: "90 kg", volume: "2,880 kg" }, { name: "Lying Leg Curl", sets: 4, reps: "12", load: "47.5 kg", volume: "2,280 kg" }, { name: "Nordic Curl", sets: 3, reps: "6", load: "Bodyweight", volume: "18 reps" }], accent: "#f59e0b",
  },
  calves: {
    id: "calves", label: "Calves", anatomicalName: "Gastrocnemius", status: "Ready", lastTrained: "2 days ago", weeklyVolume: "3,120 kg", score: 86, intensity: "Fully Recovered",
    exercises: [{ name: "Standing Calf Raise", sets: 4, reps: "12", load: "75 kg", volume: "3,600 kg" }, { name: "Seated Calf Raise", sets: 3, reps: "15", load: "45 kg", volume: "2,025 kg" }, { name: "Tibialis Raise", sets: 3, reps: "15", load: "20 kg", volume: "900 kg" }], accent: "#22c55e",
  },
};

export const macroData = [
  { label: "Protein", value: 142, goal: 180, unit: "g", color: "#C6FF3D" },
  { label: "Carbs", value: 214, goal: 280, unit: "g", color: "#A6D9FF" },
  { label: "Fat", value: 58, goal: 72, unit: "g", color: "#E7C6FF" },
];

export const weeklySessions = [
  { day: "M", value: 88, label: "Upper" }, { day: "T", value: 56, label: "Run" }, { day: "W", value: 94, label: "Lower" }, { day: "T", value: 21, label: "Rest" }, { day: "F", value: 74, label: "Push" }, { day: "S", value: 41, label: "Zone 2" }, { day: "S", value: 0, label: "Today" },
];
