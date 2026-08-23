export type ExercisePreference = { favorite?: boolean; hidden?: boolean; viewedAt?: string };
export type NotificationRecord = { id: string; title: string; detail: string; kind: "milestone" | "reminder" | "system"; createdAt: string; read: boolean };
export type ReminderSettings = { enabled: boolean; time: string; days: string[] };
export type StreakData = { count: number; lastCompletedDate: string };
export type DailyStreak = StreakData;
export type AthleteProfile = { name: string; email: string; location: string; focus: string; photoDataUrl?: string };
export type ConnectedDevice = { id: string; name: string; detail: string; kind: "band" | "watch" | "log" };
export type ExerciseTarget = { sets: string; reps: string; completed: boolean; completedAt?: string };
export type ExerciseProgress = Record<string, ExerciseTarget>;
export type CalibrationSettings = { name: string; age: number; heightCm: number; weightKg: number; sex: "male" | "female"; activityLevel: "light" | "moderate" | "active" | "very_active"; goalKcal: number; goalProtein: number; goalCarbs: number; goalFat: number };

export const getActiveUserEmail = (): string => {
  try {
    const directEmail = localStorage.getItem("fittrack_user_email");
    if (directEmail && directEmail.trim()) return directEmail.toLowerCase().trim();
    const runtimeUser = localStorage.getItem("manus-runtime-user-info");
    if (runtimeUser) {
      const parsed = JSON.parse(runtimeUser);
      if (parsed?.email && typeof parsed.email === "string") return parsed.email.toLowerCase().trim();
    }
  } catch {}
  return "default_athlete";
};

export const getScopedKey = (baseKey: string): string => {
  const user = getActiveUserEmail();
  const cleanScope = user.replace(/[^a-z0-9]/gi, "_");
  return `${baseKey}__${cleanScope}`;
};

const preferenceKey = "fittrack-exercise-preferences";
const notificationKey = "fittrack-notifications";
const reminderKey = "fittrack-workout-reminders";
const streakKey = "fittrack-daily-streak";
const athleteProfileKey = "fittrack-athlete-profile";
const connectedDevicesKey = "fittrack-connected-devices";
const exerciseProgressKey = "fittrack-exercise-progress";
const calibrationSettingsKey = "fittrack-calibration-settings";

const defaultNotifications: NotificationRecord[] = [];

const getDefaultAthleteProfile = (): AthleteProfile => {
  const email = getActiveUserEmail();
  if (email && email !== "default_athlete") {
    const usernamePart = email.split("@")[0] || "Athlete";
    const cleanName = usernamePart
      .split(/[\._\-]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
    return { name: cleanName, email: email, location: "New York, USA", focus: "Hypertrophy & Strength" };
  }
  return { name: "Athlete", email: "athlete@fittrack.training", location: "New York, USA", focus: "Hypertrophy & Strength" };
};
const defaultConnectedDevices: ConnectedDevice[] = [];
const defaultCalibrationSettings = (): CalibrationSettings => {
  const profile = getDefaultAthleteProfile();
  return { name: profile.name, age: 26, heightCm: 175, weightKg: 70, sex: "male", activityLevel: "moderate", goalKcal: 2400, goalProtein: 150, goalCarbs: 270, goalFat: 65 };
};

const safeRead = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(getScopedKey(key));
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
};
const write = <T,>(key: string, value: T) => localStorage.setItem(getScopedKey(key), JSON.stringify(value));
export const getExercisePreferences = () => safeRead<Record<string, ExercisePreference>>(preferenceKey, {});
export const saveExercisePreferences = (value: Record<string, ExercisePreference>) => write(preferenceKey, value);
export const getNotifications = () => safeRead<NotificationRecord[]>(notificationKey, defaultNotifications);
export const saveNotifications = (value: NotificationRecord[]) => write(notificationKey, value);
export const pushMilestoneNotification = (title: string, detail: string) => { const notifications = getNotifications(); const id = `milestone-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; if (!notifications.some((item) => item.id === id)) saveNotifications([{ id, title, detail, kind: "milestone", createdAt: new Date().toISOString(), read: false }, ...notifications]); };
export const getReminderSettings = () => safeRead<ReminderSettings>(reminderKey, { enabled: true, time: "18:30", days: ["Mon", "Wed", "Fri"] });
export const saveReminderSettings = (value: ReminderSettings) => write(reminderKey, value);
export const getAthleteProfile = () => safeRead<AthleteProfile>(athleteProfileKey, getDefaultAthleteProfile());
export const saveAthleteProfile = (value: AthleteProfile) => write(athleteProfileKey, value);
export const getConnectedDevices = () => safeRead<ConnectedDevice[]>(connectedDevicesKey, defaultConnectedDevices);
export const saveConnectedDevices = (value: ConnectedDevice[]) => write(connectedDevicesKey, value);
export const getExerciseProgress = (): ExerciseProgress => {
  const raw = safeRead<ExerciseProgress>(exerciseProgressKey, {});
  const now = Date.now();
  let changed = false;
  const cleaned: ExerciseProgress = {};

  Object.entries(raw).forEach(([id, target]) => {
    if (target.completed) {
      if (target.completedAt) {
        const completedTime = new Date(target.completedAt).getTime();
        const is24hPassed = now - completedTime >= 24 * 60 * 60 * 1000;
        const isPreviousDay = new Date(target.completedAt).toDateString() !== new Date().toDateString();
        if (is24hPassed || isPreviousDay) {
          cleaned[id] = { ...target, completed: false, completedAt: undefined };
          changed = true;
          return;
        }
      } else {
        cleaned[id] = { ...target, completed: false, completedAt: undefined };
        changed = true;
        return;
      }
    }
    cleaned[id] = target;
  });

  if (changed) {
    write(exerciseProgressKey, cleaned);
  }
  return cleaned;
};
export const saveExerciseProgress = (value: ExerciseProgress) => write(exerciseProgressKey, value);
export const getCalibrationSettings = () => safeRead<CalibrationSettings>(calibrationSettingsKey, defaultCalibrationSettings());
export const saveCalibrationSettings = (value: CalibrationSettings) => write(calibrationSettingsKey, value);
export const resetCalibrationSettings = () => { localStorage.removeItem(calibrationSettingsKey); return defaultCalibrationSettings(); };
const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dayDifference = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00`) - Date.parse(`${from}T00:00:00`)) / 86400000);
const defaultStreak = (): StreakData => ({ count: 0, lastCompletedDate: "" });
export const getStreak = () => safeRead<StreakData>(streakKey, defaultStreak());
export const getDailyStreak = getStreak;
export const saveStreak = (value: StreakData) => write(streakKey, value);
export const saveDailyStreak = saveStreak;
export const advanceStreak = () => { const current = getStreak(); const today = dateKey(); if (current.lastCompletedDate === today) return { streak: current, advanced: false, alreadyRecorded: true }; const difference = current.lastCompletedDate ? dayDifference(current.lastCompletedDate, today) : 99; const next: StreakData = { count: difference === 1 ? current.count + 1 : 1, lastCompletedDate: today }; saveStreak(next); return { streak: next, advanced: true, alreadyRecorded: false }; };
export const recordDailyWorkout = advanceStreak;
