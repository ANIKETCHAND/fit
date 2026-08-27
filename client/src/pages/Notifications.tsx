/** FitTrack Notification & Reminder Center with Customizable Hydration Alarm System */
import { useMemo, useState, useEffect } from "react";
import { 
  Bell, 
  CalendarClock, 
  CheckCheck, 
  Clock3, 
  Droplets, 
  Medal, 
  Plus, 
  Settings2, 
  SlidersHorizontal, 
  Volume2, 
  VolumeX, 
  Sparkles,
  Play,
  RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { 
  getNotifications, 
  getReminderSettings, 
  saveNotifications, 
  saveReminderSettings, 
  getHydrationReminderSettings, 
  saveHydrationReminderSettings, 
  playHydrationChime, 
  getTodayHydrationMl, 
  addHydrationMl,
  type NotificationRecord, 
  type ReminderSettings, 
  type HydrationReminderSettings 
} from "@/lib/user-store";

function formatNotificationTime(createdAt: string): string {
  if (!createdAt.includes("T")) return createdAt;
  const date = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `Today · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffHours < 48) return `Yesterday · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const intervalOptions = [
  { value: 30, label: "Every 30 min" },
  { value: 45, label: "Every 45 min" },
  { value: 60, label: "Every 1 hour" },
  { value: 90, label: "Every 1.5 hours" },
  { value: 120, label: "Every 2 hours" },
];

export default function Notifications() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>(getNotifications);
  const [workoutReminder, setWorkoutReminder] = useState<ReminderSettings>(getReminderSettings);
  const [hydrationReminder, setHydrationReminder] = useState<HydrationReminderSettings>(getHydrationReminderSettings);
  const [todayWaterMl, setTodayWaterMl] = useState<number>(getTodayHydrationMl);

  const unread = notifications.filter((item) => !item.read).length;

  const saveWorkout = (next: ReminderSettings) => {
    setWorkoutReminder(next);
    saveReminderSettings(next);
  };

  const saveHydration = (next: HydrationReminderSettings) => {
    setHydrationReminder(next);
    saveHydrationReminderSettings(next);
  };

  const markAll = () => {
    const next = notifications.map((item) => ({ ...item, read: true }));
    setNotifications(next);
    saveNotifications(next);
    toast.success("Notification archive marked as reviewed");
  };

  const toggleDay = (day: string) => {
    const nextDays = workoutReminder.days.includes(day)
      ? workoutReminder.days.filter((item) => item !== day)
      : [...workoutReminder.days, day];
    saveWorkout({ ...workoutReminder, days: nextDays });
  };

  const handleAddWater = (ml: number) => {
    const next = addHydrationMl(ml);
    setTodayWaterMl(next);
    if (hydrationReminder.alarmSoundEnabled) {
      playHydrationChime(hydrationReminder.soundType);
    }
    toast.success(`Logged +${ml}ml water! (${(next / 1000).toFixed(2)}L today)`);
  };

  const handleTestChime = () => {
    playHydrationChime(hydrationReminder.soundType);
    toast.info(`Playing "${hydrationReminder.soundType.replace("_", " ")}" alert sound`);
  };

  // Background ticker for hydration reminder interval
  useEffect(() => {
    if (!hydrationReminder.enabled) return;

    const intervalTimer = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const currentTimeStr = `${String(currentHours).padStart(2, "0")}:${String(currentMins).padStart(2, "0")}`;

      if (currentTimeStr >= hydrationReminder.startTime && currentTimeStr <= hydrationReminder.endTime) {
        // Send a hydration alert notification
        if (hydrationReminder.alarmSoundEnabled) {
          playHydrationChime(hydrationReminder.soundType);
        }
        toast.info("💧 Hydration Reminder: Time to drink a glass of water!");
      }
    }, hydrationReminder.intervalMinutes * 60 * 1000);

    return () => clearInterval(intervalTimer);
  }, [hydrationReminder]);

  const targetMl = Math.round(hydrationReminder.targetDailyLiters * 1000);
  const hydrationPct = Math.min(100, Math.round((todayWaterMl / targetMl) * 100));

  const grouped = useMemo(
    () => ({
      new: notifications.filter((item) => !item.read),
      archive: notifications.filter((item) => item.read),
    }),
    [notifications]
  );

  return (
    <WorkflowLayout title="Notifications">
      <section className="notification-layout">
        {/* Left Column: Notification Stream */}
        <div className="notification-stream">
          <div className="inbox-topline">
            <div>
              <span className="panel-label">Signal inbox</span>
              <h2>{unread ? `${unread} update${unread > 1 ? "s" : ""}` : "Archive clear"}</h2>
            </div>
            <button type="button" onClick={markAll}>
              <CheckCheck size={15} />
              <span>Mark all read</span>
            </button>
          </div>

          {grouped.new.length > 0 && (
            <>
              <span className="inbox-divider">Active signals</span>
              {grouped.new.map((item) => (
                <NotificationItem
                  key={item.id}
                  item={item}
                  onRead={() => {
                    const next = notifications.map((value) =>
                      value.id === item.id ? { ...value, read: true } : value
                    );
                    setNotifications(next);
                    saveNotifications(next);
                  }}
                />
              ))}
            </>
          )}

          <span className="inbox-divider">Archived signals</span>
          {grouped.archive.length === 0 && grouped.new.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#819084" }}>
              <p style={{ margin: "0 0 8px 0", font: "600 14px 'DM Sans'", color: "#d6ded6" }}>
                No notifications in your inbox
              </p>
              <span style={{ fontSize: "12px" }}>
                Hydration reminders and workout milestone alerts will appear here.
              </span>
            </div>
          ) : (
            grouped.archive.map((item) => <NotificationItem key={item.id} item={item} />)
          )}
        </div>

        {/* Right Column: Reminders Console */}
        <aside className="space-y-4">
          {/* --- HYDRATION REMINDER & ALARM CONSOLE --- */}
          <div className="reminder-console bg-[#0b110d] border border-[#c6ff3d]/30 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="reminder-head flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-400/10 border border-sky-400/20 text-sky-400 flex items-center justify-center">
                  <Droplets size={16} />
                </div>
                <div>
                  <span className="panel-label text-sky-400">Hydration Alarm</span>
                  <h2 className="text-base font-bold text-white">Drink Water Reminder</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestChime}
                className="px-2.5 py-1 bg-white/5 hover:bg-sky-400/20 text-sky-400 border border-sky-400/30 rounded-xl text-[11px] font-mono flex items-center gap-1 transition-all"
                title="Test Alarm Sound"
              >
                <Play size={11} />
                <span>Test</span>
              </button>
            </div>

            {/* Master Toggle */}
            <div className="reminder-switch flex items-center justify-between">
              <div>
                <b className="text-xs text-white block">Hydration Reminders</b>
                <span className="text-[11px] text-[#8b9c8a]">Plays audio chime & pushes alerts</span>
              </div>
              <button
                type="button"
                className={hydrationReminder.enabled ? "toggle-on" : ""}
                aria-pressed={hydrationReminder.enabled}
                onClick={() => saveHydration({ ...hydrationReminder, enabled: !hydrationReminder.enabled })}
              >
                <i />
              </button>
            </div>

            {/* Live Hydration Progress Strip */}
            <div className="bg-black/40 p-3 rounded-2xl border border-white/5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8b9c8a]">Today's Intake:</span>
                <span className="text-sky-400 font-bold">
                  {(todayWaterMl / 1000).toFixed(2)}L / {hydrationReminder.targetDailyLiters}L ({hydrationPct}%)
                </span>
              </div>
              <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                  style={{ width: `${hydrationPct}%` }}
                />
              </div>

              {/* Quick Water Log Buttons */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleAddWater(250)}
                  className="py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-400/20 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                >
                  <Plus size={11} />
                  <span>250 ml</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddWater(500)}
                  className="py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-400/20 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                >
                  <Plus size={11} />
                  <span>500 ml</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAddWater(1000)}
                  className="py-1.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-400/20 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1"
                >
                  <Plus size={11} />
                  <span>1.0 L</span>
                </button>
              </div>
            </div>

            {/* Interval Setting */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-[#8b9c8a] block">
                <Clock3 size={13} className="inline mr-1 text-sky-400" />
                Reminder Frequency
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {intervalOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!hydrationReminder.enabled}
                    onClick={() => saveHydration({ ...hydrationReminder, intervalMinutes: opt.value })}
                    className={`py-1.5 px-2 rounded-xl text-[10px] font-mono text-center transition-all border ${
                      hydrationReminder.intervalMinutes === opt.value
                        ? "bg-sky-400 text-black font-bold border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                        : "bg-white/[0.03] border-white/10 text-[#8b9c8a] hover:text-white"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Window Inputs */}
            <div className="grid grid-cols-2 gap-2">
              <label className="reminder-time">
                <span className="text-[10px] font-mono text-[#8b9c8a]">Active From</span>
                <input
                  type="time"
                  value={hydrationReminder.startTime}
                  disabled={!hydrationReminder.enabled}
                  onChange={(e) => saveHydration({ ...hydrationReminder, startTime: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-white"
                />
              </label>
              <label className="reminder-time">
                <span className="text-[10px] font-mono text-[#8b9c8a]">Active Until</span>
                <input
                  type="time"
                  value={hydrationReminder.endTime}
                  disabled={!hydrationReminder.enabled}
                  onChange={(e) => saveHydration({ ...hydrationReminder, endTime: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-white"
                />
              </label>
            </div>

            {/* Sound Selector & Target Goal */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-mono text-[#8b9c8a] block mb-1">Alarm Sound</label>
                <select
                  value={hydrationReminder.soundType}
                  disabled={!hydrationReminder.enabled}
                  onChange={(e) => saveHydration({ ...hydrationReminder, soundType: e.target.value as any })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1.5 text-xs text-white outline-none font-mono"
                >
                  <option value="water_droplet">Water Droplet</option>
                  <option value="gentle_bell">Gentle Bell</option>
                  <option value="digital_beep">Digital Beep</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#8b9c8a] block mb-1">Daily Target (L)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  max="8.0"
                  value={hydrationReminder.targetDailyLiters}
                  disabled={!hydrationReminder.enabled}
                  onChange={(e) => saveHydration({ ...hydrationReminder, targetDailyLiters: Number(e.target.value) || 3.0 })}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-white font-mono"
                />
              </div>
            </div>

            <button
              type="button"
              className="w-full py-2.5 bg-sky-400 hover:bg-sky-300 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(56,189,248,0.3)]"
              onClick={() => toast.success("Hydration reminder settings saved locally!")}
            >
              Save Hydration Alarm
            </button>
          </div>

          {/* --- WORKOUT REMINDER CONSOLE --- */}
          <div className="reminder-console bg-[#0b110d] border border-white/10 rounded-3xl p-5 space-y-3.5 shadow-xl">
            <div className="reminder-head flex items-center justify-between pb-2 border-b border-white/5">
              <div>
                <span className="panel-label">Workout reminder</span>
                <h2 className="text-base font-bold text-white">Set the window</h2>
              </div>
              <Settings2 size={18} className="text-[#c6ff3d]" />
            </div>

            <div className="reminder-switch flex items-center justify-between">
              <div>
                <b className="text-xs text-white block">Reminder active</b>
                <span className="text-[11px] text-[#8b9c8a]">Local device preference</span>
              </div>
              <button
                type="button"
                className={workoutReminder.enabled ? "toggle-on" : ""}
                aria-pressed={workoutReminder.enabled}
                onClick={() => saveWorkout({ ...workoutReminder, enabled: !workoutReminder.enabled })}
              >
                <i />
              </button>
            </div>

            <label className="reminder-time block">
              <span className="text-[11px] font-mono text-[#8b9c8a] block mb-1">
                <Clock3 size={13} className="inline mr-1 text-[#c6ff3d]" />
                Preferred time
              </span>
              <input
                type="time"
                value={workoutReminder.time}
                disabled={!workoutReminder.enabled}
                onChange={(event) => saveWorkout({ ...workoutReminder, time: event.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-2 py-1 text-xs text-white"
              />
            </label>

            <div className="reminder-days space-y-1">
              <span className="text-[11px] font-mono text-[#8b9c8a] block">
                <CalendarClock size={13} className="inline mr-1 text-[#c6ff3d]" />
                Training days
              </span>
              <div className="flex flex-wrap gap-1">
                {days.map((day) => (
                  <button
                    key={day}
                    type="button"
                    disabled={!workoutReminder.enabled}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono transition-all ${
                      workoutReminder.days.includes(day)
                        ? "bg-[#c6ff3d] text-black font-bold"
                        : "bg-white/5 text-[#8b9c8a] hover:text-white"
                    }`}
                    onClick={() => toggleDay(day)}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="save-reminder w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-mono border border-white/10 transition-all flex items-center justify-center gap-1.5 mt-2"
              onClick={() => toast.success("Workout reminder settings saved to this device")}
            >
              <SlidersHorizontal size={14} />
              <span>Save workout protocol</span>
            </button>
          </div>
        </aside>
      </section>
    </WorkflowLayout>
  );
}

function NotificationItem({ item, onRead }: { item: NotificationRecord; onRead?: () => void }) {
  const Icon = item.kind === "milestone" ? Medal : item.kind === "reminder" ? CalendarClock : Bell;
  return (
    <article className={`notification-item ${item.read ? "read" : "unread"}`} onClick={onRead}>
      <div className="notification-icon">
        <Icon size={17} />
      </div>
      <div>
        <span>
          {item.kind === "milestone"
            ? "Performance milestone"
            : item.kind === "reminder"
            ? "Workout reminder"
            : "System signal"}{" "}
          · {formatNotificationTime(item.createdAt)}
        </span>
        <h3>{item.title}</h3>
        <p>{item.detail}</p>
      </div>
      {!item.read && <i />}
    </article>
  );
}
