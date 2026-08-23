/* Kinetic Anatomy Lab: athlete identity remains personal and editable while analytics read as calibrated training instruments. */
import { Activity, ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, CircleCheck, Clock3, Dumbbell, Footprints, Layers3, LoaderCircle, MapPin, Pencil, Smartphone, Sparkles, Timer, Upload, Watch } from "lucide-react";
import { motion } from "framer-motion";
import { type ChangeEvent, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Sidebar } from "@/components/navigation/Sidebar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { type AthleteProfile, type ConnectedDevice, getAthleteProfile, getConnectedDevices, saveAthleteProfile, saveConnectedDevices } from "@/lib/user-store";
import { GithubContributionGraph } from "@/components/profile/GithubContributionGraph";
import "./ProfileInteractions.css";

function getWorkoutLogs(): { completedAt: string; focus: string }[] {
  try { return JSON.parse(localStorage.getItem("fittrack_workout_logs") || "[]"); } catch { return []; }
}
function getGpsSessions(): { startedAt: string; distanceMeters: number; durationSeconds: number }[] {
  try { return JSON.parse(localStorage.getItem("fittrack_gps_sessions") || "[]"); } catch { return []; }
}
function getSessions(): { completedAt?: string; startedAt?: string; durationSeconds?: number }[] {
  try { return JSON.parse(localStorage.getItem("fittrack_sessions") || "[]"); } catch { return []; }
}

const rangeOptions = {
  "12m": { label: "Last 12 months", period: "Aug 2025 — Aug 2026", weeks: 52, sessions: 43, continuous: 11 },
  "6m": { label: "Last 6 months", period: "Mar 2026 — Aug 2026", weeks: 26, sessions: 27, continuous: 7 },
  "90d": { label: "Last 90 days", period: "May 2026 — Aug 2026", weeks: 13, sessions: 18, continuous: 4 },
  "30d": { label: "Last 30 days", period: "Jul 2026 — Aug 2026", weeks: 5, sessions: 9, continuous: 2 },
} as const;
type RangeKey = keyof typeof rangeOptions;

// Activity type distribution varies by range
const activityByRange: Record<RangeKey, { label: string; value: number; color: string }[]> = {
  "12m": [{ label: "Strength", value: 38, color: "#c6ff3d" }, { label: "Conditioning", value: 24, color: "#a6d9ff" }, { label: "Walking", value: 19, color: "#6a879b" }, { label: "Mobility", value: 12, color: "#c8d2c5" }, { label: "Recovery", value: 7, color: "#536b78" }],
  "6m": [{ label: "Strength", value: 42, color: "#c6ff3d" }, { label: "Conditioning", value: 27, color: "#a6d9ff" }, { label: "Walking", value: 15, color: "#6a879b" }, { label: "Mobility", value: 10, color: "#c8d2c5" }, { label: "Recovery", value: 6, color: "#536b78" }],
  "90d": [{ label: "Strength", value: 50, color: "#c6ff3d" }, { label: "Conditioning", value: 22, color: "#a6d9ff" }, { label: "Walking", value: 14, color: "#6a879b" }, { label: "Mobility", value: 9, color: "#c8d2c5" }, { label: "Recovery", value: 5, color: "#536b78" }],
  "30d": [{ label: "Strength", value: 55, color: "#c6ff3d" }, { label: "Conditioning", value: 20, color: "#a6d9ff" }, { label: "Walking", value: 12, color: "#6a879b" }, { label: "Mobility", value: 8, color: "#c8d2c5" }, { label: "Recovery", value: 5, color: "#536b78" }],
};

const deviceCandidates: ConnectedDevice[] = [
  { id: "tempo-watch-s", name: "Tempo Watch S", detail: "GPS · recovery · activity capture", kind: "watch" },
  { id: "stride-sense-mini", name: "Stride Sense Mini", detail: "Pace · distance · cadence", kind: "band" },
  { id: "core-hr-strap", name: "Core HR Strap", detail: "Heart rate · training zones", kind: "band" },
];

const contributionLevel = (week: number, day: number, range: RangeKey) => {
  const rangeOffset = { "12m": 2, "6m": 5, "90d": 8, "30d": 11 }[range];
  const signal = (week * 11 + day * 7 + (week % 5) * 3 + rangeOffset) % 17;
  if (signal > 13) return "high";
  if (signal > 9) return "mid";
  if (signal > 6) return "low";
  return "zero";
};

const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "FT";
const deviceIcon = (kind: ConnectedDevice["kind"]) => kind === "watch" ? Watch : kind === "log" ? Dumbbell : Smartphone;

export default function Profile() {
  const [, setLocation] = useLocation();
  const [range, setRange] = useState<RangeKey>("12m");
  const [athlete, setAthlete] = useState<AthleteProfile>(() => getAthleteProfile());
  const [draft, setDraft] = useState<AthleteProfile>(() => getAthleteProfile());
  const [devices, setDevices] = useState<ConnectedDevice[]>(() => getConnectedDevices());
  const [profileOpen, setProfileOpen] = useState(false);
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const rangeData = rangeOptions[range];
  const activityTypes = activityByRange[range];
  const availableDevices = useMemo(() => deviceCandidates.filter((candidate) => !devices.some((device) => device.id === candidate.id)), [devices]);

  // Real session logs from localStorage
  const realWorkoutLogs = useMemo(() => getWorkoutLogs(), []);
  const realGpsSessions = useMemo(() => getGpsSessions(), []);
  const realSessions = useMemo(() => getSessions(), []);

  const totalSessionCount = realWorkoutLogs.length + realGpsSessions.length + realSessions.length;

  const totalDistanceKm = useMemo(() => {
    const meters = realGpsSessions.reduce((sum, g) => sum + (g.distanceMeters || 0), 0);
    return (meters / 1000).toFixed(1);
  }, [realGpsSessions]);

  const totalTimeUnderLoad = useMemo(() => {
    let totalSec = 0;
    realGpsSessions.forEach((g) => { totalSec += g.durationSeconds || 0; });
    realSessions.forEach((s) => { totalSec += s.durationSeconds || 0; });
    realWorkoutLogs.forEach(() => { totalSec += 2400; });
    if (totalSec === 0) return "0h 00m";
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }, [realWorkoutLogs, realGpsSessions, realSessions]);

  const movementClassesCount = useMemo(() => {
    const classes = new Set<string>();
    realWorkoutLogs.forEach((w) => { if (w.focus) classes.add(w.focus); });
    if (realGpsSessions.length > 0) classes.add("Cardio / GPS");
    return classes.size;
  }, [realWorkoutLogs, realGpsSessions]);

  const avgDistancePerEntry = useMemo(() => {
    if (realGpsSessions.length === 0) return "0.0";
    const meters = realGpsSessions.reduce((sum, g) => sum + (g.distanceMeters || 0), 0);
    return (meters / 1000 / realGpsSessions.length).toFixed(1);
  }, [realGpsSessions]);

  const avgSessionCadence = useMemo(() => {
    if (totalSessionCount === 0) return "0m";
    let totalSec = 0;
    realGpsSessions.forEach((g) => { totalSec += g.durationSeconds || 0; });
    realSessions.forEach((s) => { totalSec += s.durationSeconds || 0; });
    realWorkoutLogs.forEach(() => { totalSec += 2400; });
    const avgMin = Math.round(totalSec / 60 / totalSessionCount);
    return `${avgMin}m`;
  }, [totalSessionCount, realWorkoutLogs, realGpsSessions, realSessions]);

  const summaryMetrics = useMemo(() => [
    { label: "Logged sessions", value: String(totalSessionCount), detail: "entries in the ledger", icon: Activity, tone: "lime", size: "standard" },
    { label: "Distance captured", value: totalDistanceKm, unit: "km", detail: "ground covered", icon: MapPin, tone: "blue", size: "standard" },
    { label: "Time under load", value: totalTimeUnderLoad, detail: "clocked in motion", icon: Clock3, tone: "bone", size: "standard" },
    { label: "Movement classes", value: String(movementClassesCount), detail: "disciplines detected", icon: Layers3, tone: "bone", size: "standard" },
    { label: "Distance per entry", value: avgDistancePerEntry, unit: "km", detail: "rolling average", icon: Footprints, tone: "blue", size: "standard" },
    { label: "Session cadence", value: avgSessionCadence, detail: "average load window", icon: Timer, tone: "lime", size: "standard" },
    { label: "Active sources", value: String(devices.length), detail: "synchronised inputs", icon: Smartphone, tone: "bone", size: "narrow" },
  ], [totalSessionCount, totalDistanceKm, totalTimeUnderLoad, movementClassesCount, avgDistancePerEntry, avgSessionCadence, devices]);

  let offset = 0;

  const openProfileEditor = () => { setDraft(athlete); setProfileOpen(true); };
  const saveProfile = () => { const trimmedName = draft.name.trim(); if (!trimmedName) { toast.error("Add an athlete name before saving the record."); return; } const next = { ...draft, name: trimmedName, email: draft.email.trim(), location: draft.location.trim(), focus: draft.focus.trim() || "Focused strength protocol" }; saveAthleteProfile(next); setAthlete(next); setProfileOpen(false); toast.success("Athlete record updated on this device."); };
  const updatePhoto = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (!file) return; if (!file.type.startsWith("image/")) { toast.error("Choose an image file for the profile photo."); return; } if (file.size > 1_500_000) { toast.error("Choose an image below 1.5 MB for local device storage."); return; } const reader = new FileReader(); reader.onload = () => setDraft((current) => ({ ...current, photoDataUrl: String(reader.result) })); reader.readAsDataURL(file); };
  const simulateConnection = (candidate: ConnectedDevice) => { setConnecting(candidate.id); window.setTimeout(() => { const next = [...devices, candidate]; saveConnectedDevices(next); setDevices(next); setConnecting(null); setDeviceOpen(false); toast.success(`${candidate.name} connected to this FitTrack profile.`); }, 900); };

  return <div className="app-shell profile-shell">
    <Sidebar />
    <main className="profile-main">
      <header className="profile-topbar">
        <div className="profile-heading"><div className="header-wordmark"><div className="brand-logo-icon" style={{ width: 26, height: 26, marginRight: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={15} /></div><strong>FIT<span>TRACK</span></strong></div><div><span className="eyebrow">Athlete identity / analytics</span><h1>{athlete.name.split(" ")[0]}'s <em>training profile.</em></h1></div></div>
        <div className="profile-top-actions"><button className="icon-button" aria-label="Notifications" onClick={() => setLocation("/notifications")}><Bell size={19} /><b /></button><button className="avatar-button profile-avatar" aria-label="Edit athlete profile" onClick={openProfileEditor}>{athlete.photoDataUrl ? <img src={athlete.photoDataUrl} alt="" /> : initials(athlete.name)}<ChevronDown size={14} /></button></div>
      </header>

      <motion.section className="profile-identity-bar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .32 }}>
        <div className="identity-athlete"><div className={`profile-orb ${athlete.photoDataUrl ? "has-photo" : ""}`}>{athlete.photoDataUrl ? <img src={athlete.photoDataUrl} alt={`${athlete.name} profile`} /> : initials(athlete.name)}</div><div><span className="panel-label">Athlete record</span><strong>{athlete.name}</strong><p>{athlete.location || "Local profile"} · <b>{athlete.focus}</b></p></div><button className="profile-edit-action" onClick={openProfileEditor}><Pencil size={13} /> Edit profile</button></div><div className="profile-mark-stamp" aria-hidden="true"><Activity size={16} /><span>Signal / identity</span></div>
        <label className="profile-range profile-range-control"><CalendarDays size={14} /><span className="sr-only">Contribution ledger period</span><select aria-label="Contribution ledger period" value={range} onChange={(event) => setRange(event.target.value as RangeKey)}>{Object.entries(rangeOptions).map(([key, option]) => <option key={key} value={key}>{option.label}</option>)}</select><ChevronDown size={13} /></label>
      </motion.section>

      <motion.section className="profile-metric-grid" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: .035 } } }}>{summaryMetrics.map(({ label, value, unit, detail, icon: Icon, tone, size }) => <motion.article key={label} className={`profile-metric metric-${tone} metric-${size}`} variants={{ hidden: { opacity: 0, y: 9 }, visible: { opacity: 1, y: 0 } }}><Icon size={16} /><span>{label}</span><strong>{value}{unit && <small>{unit}</small>}</strong><p>{detail}</p></motion.article>)}</motion.section>

      <motion.section className="profile-contribution-wrapper" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }}>
        <GithubContributionGraph />
      </motion.section>

      <section className="profile-analysis-grid">
        <motion.article className="profile-panel types-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .18 }}>
          <div className="profile-panel-head"><div><span className="panel-label">Movement mix</span><h2>Activity types</h2></div><Sparkles size={16} /></div>
          {totalSessionCount === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "#819084" }}>
              <p style={{ margin: "0 0 8px 0", font: "600 14px 'DM Sans'", color: "#d6ded6" }}>No activities recorded yet</p>
              <span style={{ fontSize: "12px" }}>Complete a workout or GPS session to generate activity breakdown telemetry.</span>
            </div>
          ) : (
            <>
              <div className="activity-donut"><svg viewBox="0 0 42 42" role="img" aria-label="Activity type breakdown">{activityTypes.map((type) => { const currentOffset = offset; offset += type.value; return <circle key={type.label} cx="21" cy="21" r="15.9155" fill="transparent" stroke={type.color} strokeWidth="5" strokeDasharray={`${type.value} ${100 - type.value}`} strokeDashoffset={-currentOffset} />; })}</svg><div><strong>{totalSessionCount}</strong><span>activities</span></div></div>
              <div className="type-legend">{activityTypes.map((type) => <div key={type.label}><i style={{ background: type.color }} /><span>{type.label}</span><b>{type.value}%</b></div>)}</div>
            </>
          )}
        </motion.article>

        <motion.article className="profile-panel device-panel" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .22 }}>
          <div className="profile-panel-head"><div><span className="panel-label">Input sources</span><h2>Device sync</h2></div><button onClick={() => setDeviceOpen(true)}><ArrowUpRight size={15} /> Manage</button></div>
          {devices.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", color: "#819084" }}>
              <p style={{ margin: "0 0 6px 0", font: "600 13px 'DM Sans'", color: "#d6ded6" }}>No hardware devices connected</p>
              <span style={{ fontSize: "11px" }}>Click Manage to pair a smartwatch, fitness band, or activity tracker.</span>
            </div>
          ) : (
            devices.map((device) => { const Icon = deviceIcon(device.kind); return <div className="device-row" key={device.id}><div className="device-symbol"><Icon size={18} /></div><div><strong>{device.name}</strong><span>{device.detail}</span></div><b><i /> {device.kind === "log" ? "synced" : "active"}</b></div>; })
          )}
        </motion.article>
      </section>

      <section className="profile-bottom-grid">
        <article className="profile-panel profile-guidance"><span className="panel-label">Next analysis</span><h2>{totalSessionCount === 0 ? "Ready to begin your training protocol" : "Strength volume is your dominant signal."}</h2><p>{totalSessionCount === 0 ? "Your profile is active. Start logging exercises or GPS sessions to build your personal biomechanical telemetry ledger." : "Strength leads the ledger. Hold the current loading pattern for four sessions, then recalibrate against recovery signal and session cadence."}</p><button onClick={() => setLocation("/start-session")}>Open next protocol <ArrowUpRight size={15} /></button></article>
      </section>
    </main>

    <Dialog open={profileOpen} onOpenChange={setProfileOpen}><DialogContent className="profile-dialog" showCloseButton><DialogHeader><span className="panel-label">Identity console</span><DialogTitle>Edit athlete record</DialogTitle><DialogDescription>These values and your profile photo are saved only in this browser.</DialogDescription></DialogHeader><form className="profile-form" onSubmit={(event) => { event.preventDefault(); saveProfile(); }}><label className="profile-photo-upload"><span className={`profile-photo-preview ${draft.photoDataUrl ? "has-photo" : ""}`}>{draft.photoDataUrl ? <img src={draft.photoDataUrl} alt="Selected profile preview" /> : initials(draft.name)}</span><span><b><Upload size={14} /> Update profile photo</b><small>PNG or JPG · up to 1.5 MB</small></span><input type="file" accept="image/png,image/jpeg,image/webp" onChange={updatePhoto} /></label><div className="profile-form-grid"><label>Full name<input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required /></label><label>Email address<input type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} /></label><label>Location<input value={draft.location} onChange={(event) => setDraft({ ...draft, location: event.target.value })} /></label><label>Training focus<input value={draft.focus} onChange={(event) => setDraft({ ...draft, focus: event.target.value })} /></label></div><div className="profile-dialog-actions"><button type="button" onClick={() => setProfileOpen(false)}>Cancel</button><button type="submit">Save profile <Check size={14} /></button></div></form></DialogContent></Dialog>

    <Dialog open={deviceOpen} onOpenChange={setDeviceOpen}><DialogContent className="profile-dialog device-dialog" showCloseButton><DialogHeader><span className="panel-label">Input source console</span><DialogTitle>Connect a device</DialogTitle><DialogDescription>Choose a device to simulate a local FitTrack connection. No real pairing is performed.</DialogDescription></DialogHeader><div className="device-chooser">{availableDevices.length ? availableDevices.map((candidate) => { const Icon = deviceIcon(candidate.kind); const isConnecting = connecting === candidate.id; return <button key={candidate.id} className="device-choice" disabled={Boolean(connecting)} onClick={() => simulateConnection(candidate)}><span className="device-choice-icon"><Icon size={19} /></span><span><b>{candidate.name}</b><small>{candidate.detail}</small></span>{isConnecting ? <LoaderCircle className="device-loader" size={17} /> : <span className="device-connect">Connect <ArrowUpRight size={14} /></span>}</button>; }) : <div className="device-empty"><Check size={18} /><p>All available simulated sources are connected.</p></div>}</div></DialogContent></Dialog>
  </div>;
}
