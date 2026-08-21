/** Kinetic Pixel Fitness data: achievement conditions, social-ready reward details, and movement coaching cues. */
export type AchievementKind = "streak" | "record" | "volume" | "recovery" | "explorer";
export type Achievement = { id: string; title: string; description: string; kind: AchievementKind; progress: number; target: number; reward: string; unlocked: boolean };
export type ExerciseVariant = "bench" | "squat" | "curl" | "row" | "fly" | "press";
export type LibraryExercise = { id: string; name: string; focus: string; equipment: string; tempo: string; sets: string; variant: ExerciseVariant; level: "Foundation" | "Build" | "Peak"; coaching: { setup: string; cue: string; tip: string } };

export const achievements: Achievement[] = [
  { id: "first-signal", title: "First Signal", description: "Logged your first performance session.", kind: "explorer", progress: 1, target: 1, reward: "Profile signal", unlocked: true },
  { id: "streak-3", title: "Signal Streak", description: "Train on three consecutive scheduled days.", kind: "streak", progress: 3, target: 3, reward: "+3 day chain", unlocked: true },
  { id: "bench-breaker", title: "Bench Breaker", description: "Complete a chest protocol with a new bench press personal record.", kind: "record", progress: 82.5, target: 85, reward: "PR chip", unlocked: false },
  { id: "volume-10k", title: "Ten Thousand", description: "Accumulate 10,000 kg of focused weekly volume.", kind: "volume", progress: 5740, target: 10000, reward: "Volume crest", unlocked: false },
  { id: "recovery-keeper", title: "Recovery Keeper", description: "Hold a readiness score of 80+ for four weeks.", kind: "recovery", progress: 3, target: 4, reward: "Recovery shell", unlocked: false },
];

export const libraryExercises: LibraryExercise[] = [
  { id: "bench-press", name: "Barbell Bench Press", focus: "Pectorals · triceps", equipment: "Barbell", tempo: "3–1–1", sets: "4 × 6–8", variant: "bench", level: "Peak", coaching: { setup: "Pin the shoulder blades down and back before you unrack.", cue: "Drive the bar toward the upper chest, then press through the bench.", tip: "Keep both feet heavy. If the wrists drift back, reduce the load." } },
  { id: "front-squat", name: "Front Squat", focus: "Quadriceps · core", equipment: "Barbell", tempo: "3–0–1", sets: "4 × 5–7", variant: "squat", level: "Build", coaching: { setup: "Set elbows high and create a stable three-point foot.", cue: "Let the knees travel as the torso stays tall through the bottom.", tip: "Use a heel wedge if ankle range limits depth or balance." } },
  { id: "chest-row", name: "Chest Supported Row", focus: "Lats · rhomboids", equipment: "Machine", tempo: "2–1–2", sets: "3 × 8–10", variant: "row", level: "Build", coaching: { setup: "Set the bench so the chest stays firmly connected throughout.", cue: "Pull elbows toward your back pockets, then pause without shrugging.", tip: "Keep the neck long; do not chase range by lifting the chest." } },
  { id: "incline-curl", name: "Incline Dumbbell Curl", focus: "Biceps · forearms", equipment: "Dumbbells", tempo: "2–1–2", sets: "3 × 10–12", variant: "curl", level: "Foundation", coaching: { setup: "Lock the upper arms slightly behind the torso on the incline pad.", cue: "Turn the palm as the dumbbell rises; squeeze without the shoulder rolling forward.", tip: "Stop one rep before form turns into a shoulder swing." } },
  { id: "cable-fly", name: "Cable Fly", focus: "Pectorals", equipment: "Cable", tempo: "2–1–2", sets: "3 × 12–15", variant: "fly", level: "Foundation", coaching: { setup: "Stagger the stance and set the handles at chest height.", cue: "Bring the biceps toward each other, not the hands toward the floor.", tip: "Keep a soft elbow bend; end the set if the shoulder pulls forward." } },
  { id: "seated-press", name: "Seated Press", focus: "Deltoids · triceps", equipment: "Dumbbells", tempo: "2–0–2", sets: "3 × 8–10", variant: "press", level: "Build", coaching: { setup: "Set the bench upright and brace ribs down before the first press.", cue: "Press slightly back so the load finishes over the shoulder line.", tip: "Use a neutral grip if front-shoulder comfort is limited." } },
];

export const achievementStorageKey = (id: string) => `fittrack-achievement-${id}`;
