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

const preferenceKey = "fittrack-exercise-preferences";
const notificationKey = "fittrack-notifications";
const reminderKey = "fittrack-workout-reminders";
const streakKey = "fittrack-daily-streak";
const athleteProfileKey = "fittrack-athlete-profile";
const connectedDevicesKey = "fittrack-connected-devices";
const exerciseProgressKey = "fittrack-exercise-progress";
const calibrationSettingsKey = "fittrack-calibration-settings";

const defaultNotifications: NotificationRecord[] = [
  { id: "system-coaching", title: "Coaching console ready", detail: "Movement cards now retain the cues you have reviewed.", kind: "system", createdAt: "Today · 08:10", read: false },
  { id: "reminder-preload", title: "Training window opens", detail: "Chest protocol is scheduled for your preferred evening window.", kind: "reminder", createdAt: "Today · 18:30", read: false },
  { id: "milestone-streak", title: "Signal Streak secured", detail: "Three scheduled training days completed in sequence.", kind: "milestone", createdAt: "Yesterday · 20:18", read: true },
];

const defaultAthleteProfile: AthleteProfile = { name: "Jordan Mercer", email: "jordan@fittrack.training", location: "Brooklyn, NY", focus: "Focused strength protocol" };
const defaultConnectedDevices: ConnectedDevice[] = [];
const defaultCalibrationSettings = (): CalibrationSettings => ({ name: "Jordan Mercer", age: 31, heightCm: 180, weightKg: 78, sex: "male", activityLevel: "moderate", goalKcal: 2840, goalProtein: 172, goalCarbs: 328, goalFat: 79 });

const safeRead = <T,>(key: string, fallback: T): T => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } };
const write = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));
export const getExercisePreferences = () => safeRead<Record<string, ExercisePreference>>(preferenceKey, {});
export const saveExercisePreferences = (value: Record<string, ExercisePreference>) => write(preferenceKey, value);
export const getNotifications = () => safeRead<NotificationRecord[]>(notificationKey, defaultNotifications);
export const saveNotifications = (value: NotificationRecord[]) => write(notificationKey, value);
export const pushMilestoneNotification = (title: string, detail: string) => { const notifications = getNotifications(); const id = `milestone-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`; if (!notifications.some((item) => item.id === id)) saveNotifications([{ id, title, detail, kind: "milestone", createdAt: new Date().toISOString(), read: false }, ...notifications]); };
export const getReminderSettings = () => safeRead<ReminderSettings>(reminderKey, { enabled: true, time: "18:30", days: ["Mon", "Wed", "Fri"] });
export const saveReminderSettings = (value: ReminderSettings) => write(reminderKey, value);
export const getAthleteProfile = () => safeRead<AthleteProfile>(athleteProfileKey, defaultAthleteProfile);
export const saveAthleteProfile = (value: AthleteProfile) => write(athleteProfileKey, value);
export const getConnectedDevices = () => safeRead<ConnectedDevice[]>(connectedDevicesKey, defaultConnectedDevices);
export const saveConnectedDevices = (value: ConnectedDevice[]) => write(connectedDevicesKey, value);
export const getExerciseProgress = () => safeRead<ExerciseProgress>(exerciseProgressKey, {});
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
