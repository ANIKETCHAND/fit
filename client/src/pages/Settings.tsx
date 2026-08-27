import { useState, useEffect } from "react";
import { Activity, Calculator, Check, Database, Download, FileSpreadsheet, Gauge, HardDrive, Save, Scale, Sparkles, Target, UserRound, Zap, Flame, ShieldCheck, Dumbbell } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { 
  getCalibrationSettings, 
  resetCalibrationSettings, 
  saveCalibrationSettings, 
  type CalibrationSettings, 
  getExperienceTier, 
  saveExperienceTier, 
  type ExperienceTier 
} from "@/lib/user-store";
import { getDatabaseTelemetry, exportDatabaseJson, exportWorkoutHistoryCsv } from "@/lib/database-sync";
import "./CommandDeck.css";

const activityOptions = [
  { value: "light" as const, label: "Light", detail: "1-2 sessions / week" },
  { value: "moderate" as const, label: "Moderate", detail: "3-4 sessions / week" },
  { value: "active" as const, label: "Active", detail: "5-6 sessions / week" },
  { value: "very_active" as const, label: "Very Active", detail: "Daily / double sessions" },
];

const experienceTierOptions = [
  { id: "complete_beginner" as const, label: "Complete Beginner", desc: "0–6 Months • Guided form & simple mode", icon: ShieldCheck, color: "text-emerald-400" },
  { id: "beginner" as const, label: "Beginner", desc: "6–12 Months • Basic compound lifts", icon: Dumbbell, color: "text-teal-400" },
  { id: "intermediate" as const, label: "Intermediate", desc: "1–3 Years • Progressive overload & volume", icon: Zap, color: "text-[#c6ff3d]" },
  { id: "advanced" as const, label: "Advanced / Gym Rat", desc: "3+ Years • Periodization & deep telemetry", icon: Flame, color: "text-amber-400" },
];

function calcBmr(settings: CalibrationSettings) {
  const { weightKg, heightCm, age, sex } = settings;
  if (!weightKg || !heightCm || !age) return 1750;
  if (sex === "female") {
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
  }
  return Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
}

function calcTdee(settings: CalibrationSettings) {
  const bmr = calcBmr(settings);
  const multipliers = { light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
  return Math.round(bmr * (multipliers[settings.activityLevel] || 1.55));
}

function computeTargets(settings: CalibrationSettings) {
  const tdee = calcTdee(settings);
  const goalProtein = Math.round(settings.weightKg * 2.0);
  const goalFat = Math.round((tdee * 0.25) / 9);
  const goalCarbs = Math.round((tdee - (goalProtein * 4 + goalFat * 9)) / 4);
  return { goalKcal: tdee, goalProtein, goalCarbs: Math.max(0, goalCarbs), goalFat: Math.max(0, goalFat) };
}

export default function Settings() {
  const [form, setForm] = useState<CalibrationSettings>(() => getCalibrationSettings());
  const [saved, setSaved] = useState(true);
  const [experienceTier, setExperienceTierState] = useState<ExperienceTier>(() => getExperienceTier());
  const [dbStats, setDbStats] = useState(() => getDatabaseTelemetry());

  useEffect(() => {
    setDbStats(getDatabaseTelemetry());
  }, []);

  const exportAthleteDatabase = () => {
    exportDatabaseJson();
    toast.success("Downloaded FitTrack offline database backup (JSON).");
  };

  const exportWorkoutCsv = () => {
    exportWorkoutHistoryCsv();
    toast.success("Downloaded workout history spreadsheet (CSV).");
  };

  const updateBiometric = <Key extends keyof CalibrationSettings>(key: Key, value: CalibrationSettings[Key]) => {
    setSaved(false);
    setForm((current) => {
      const next = { ...current, [key]: value };
      const targets = computeTargets(next);
      return { ...next, ...targets };
    });
  };

  const handleSelectTier = (tier: ExperienceTier) => {
    setSaved(false);
    setExperienceTierState(tier);
    saveExperienceTier(tier);
    toast.info(`Experience level updated to ${tier.replace("_", " ").toUpperCase()}`);
  };

  const update = <Key extends keyof CalibrationSettings>(key: Key, value: CalibrationSettings[Key]) => {
    setSaved(false);
    setForm((current) => ({ ...current, [key]: value }));
  };

  const bmr = calcBmr(form);
  const tdee = calcTdee(form);

  const autoSetTargets = () => {
    const targets = computeTargets(form);
    setForm((current) => ({ ...current, ...targets }));
    toast.success("Targets calibrated from your current height, weight & workload");
  };

  const save = () => { 
    saveCalibrationSettings(form); 
    saveExperienceTier(experienceTier);
    setSaved(true); 
    toast.success("Calibration and daily targets saved locally"); 
  };

  return (
    <WorkflowLayout kicker="System / calibration" title="Calibrate your engine" detail="Set the biometric baseline, workload profile, and nutrition targets that shape every training signal.">
      <motion.section className="settings-deck" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}>
        <form className="settings-command" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <div className="command-deck-head">
            <div>
              <span className="deck-kicker"><i /> Athlete calibration</span>
              <h2>Baseline parameters</h2>
              <p>Use your current measurements. These values stay in this browser and dynamically power your daily protein and energy targets.</p>
            </div>
            <div className={`deck-status ${saved ? "is-saved" : ""}`}><i />{saved ? "Stored locally" : "Draft active"}</div>
          </div>

          {/* 01 / Identity & Biometrics */}
          <section className="settings-section">
            <div className="section-marker"><UserRound size={16} /><div><span>01 / athlete</span><b>Identity & biometrics</b></div></div>
            <div className="settings-field-grid identity-grid">
              <label className="deck-field wide"><span>Display name</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Athlete name" /></label>
              <label className="deck-field"><span>Age</span><input type="number" min="14" max="99" value={form.age} onChange={(event) => updateBiometric("age", Number(event.target.value))} /></label>
              <label className="deck-field"><span>Height <em>cm</em></span><input type="number" min="120" max="250" value={form.heightCm} onChange={(event) => updateBiometric("heightCm", Number(event.target.value))} /></label>
              <label className="deck-field"><span>Mass <em>kg</em></span><input type="number" min="35" max="300" step="0.1" value={form.weightKg} onChange={(event) => updateBiometric("weightKg", Number(event.target.value))} /></label>
            </div>
            <div className="sex-control" aria-label="Biological sex">
              <span>Biological sex</span>
              <div>
                <button type="button" className={form.sex === "male" ? "selected" : ""} onClick={() => updateBiometric("sex", "male")}>Male</button>
                <button type="button" className={form.sex === "female" ? "selected" : ""} onClick={() => updateBiometric("sex", "female")}>Female</button>
              </div>
            </div>
          </section>

          {/* 02 / Experience Tier */}
          <section className="settings-section">
            <div className="section-marker"><Sparkles size={16} /><div><span>02 / experience</span><b>Training Experience Level</b></div></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {experienceTierOptions.map((opt) => {
                const isSelected = experienceTier === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectTier(opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? "bg-[#c6ff3d]/15 border-[#c6ff3d] shadow-[0_0_20px_rgba(198,255,61,0.15)]"
                        : "bg-[#0e1610] border-white/10 hover:border-white/20"
                    }`}
                  >
                    <div className={`p-2 rounded-xl bg-white/5 ${opt.color} flex-shrink-0 mt-0.5`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <b className="text-xs text-white block">{opt.label}</b>
                      <span className="text-[11px] text-[#8b9c8a] block mt-0.5">{opt.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 03 / Workload Rhythm */}
          <section className="settings-section workload-section">
            <div className="section-marker"><Activity size={16} /><div><span>03 / workload</span><b>Training rhythm</b></div></div>
            <div className="activity-matrix">
              {activityOptions.map((option, index) => (
                <button type="button" key={option.value} className={form.activityLevel === option.value ? "activity-choice selected" : "activity-choice"} onClick={() => updateBiometric("activityLevel", option.value)}>
                  <span>0{index + 1}</span>
                  <b>{option.label}</b>
                  <small>{option.detail}</small>
                  <i />
                </button>
              ))}
            </div>
          </section>

          {/* 04 / Daily Targets */}
          <section className="settings-section target-section">
            <div className="section-marker">
              <Target size={16} />
              <div><span>04 / nutrition</span><b>Daily targets</b></div>
              <button type="button" className="recalculate-button" onClick={autoSetTargets}><Calculator size={14} />Auto-calibrate</button>
            </div>
            <div className="settings-field-grid targets-grid">
              <label className="deck-field"><span>Energy <em>kcal</em></span><input type="number" min="1000" max="6000" value={form.goalKcal} onChange={(event) => update("goalKcal", Number(event.target.value))} /></label>
              <label className="deck-field"><span>Protein <em>g</em></span><input type="number" min="40" max="450" value={form.goalProtein} onChange={(event) => update("goalProtein", Number(event.target.value))} /></label>
              <label className="deck-field"><span>Carbohydrate <em>g</em></span><input type="number" min="0" max="800" value={form.goalCarbs} onChange={(event) => update("goalCarbs", Number(event.target.value))} /></label>
              <label className="deck-field"><span>Fat <em>g</em></span><input type="number" min="20" max="300" value={form.goalFat} onChange={(event) => update("goalFat", Number(event.target.value))} /></label>
            </div>
          </section>
          
          {/* 05 / Database Engine & Backup */}
          <section className="settings-section">
            <div className="section-marker">
              <Database size={16} />
              <div>
                <span>05 / database</span>
                <b>Engine & Data Backup</b>
              </div>
            </div>
            <div className="bg-[#0e1610] border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8b9c8a] flex items-center gap-2">
                  <HardDrive size={14} className="text-[#c6ff3d]" />
                  <span>Storage Footprint: {dbStats.storageUsageKb} KB</span>
                </span>
                <span className="text-[#c6ff3d] bg-[#c6ff3d]/10 px-2 py-0.5 rounded border border-[#c6ff3d]/30 uppercase text-[10px] font-bold">
                  ● Engine Online
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center bg-black/40 p-2.5 rounded-xl border border-white/5 text-[11px] font-mono">
                <div><span className="text-[#8b9c8a] block text-[9px]">MEALS</span><b className="text-white">{dbStats.totalLoggedMeals}</b></div>
                <div><span className="text-[#8b9c8a] block text-[9px]">WORKOUTS</span><b className="text-white">{dbStats.totalWorkouts}</b></div>
                <div><span className="text-[#8b9c8a] block text-[9px]">FAVORITES</span><b className="text-white">{dbStats.totalFavorites}</b></div>
                <div><span className="text-[#8b9c8a] block text-[9px]">CUSTOM FOODS</span><b className="text-white">{dbStats.totalCustomFoods}</b></div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <button
                  type="button"
                  onClick={exportAthleteDatabase}
                  className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono font-medium text-white transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} className="text-[#c6ff3d]" />
                  <span>Export JSON Backup</span>
                </button>
                <button
                  type="button"
                  onClick={exportWorkoutCsv}
                  className="flex-1 py-2.5 px-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-mono font-medium text-white transition-all flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet size={14} className="text-sky-400" />
                  <span>Export Workouts (CSV)</span>
                </button>
              </div>
            </div>
          </section>

          <div className="settings-actions">
            <button type="submit" className="save-calibration">
              <Save size={16} />
              Save calibration <span>↗</span>
            </button>
          </div>
        </form>

        <aside className="calibration-rail">
          <div className="rail-panel metabolism-panel">
            <div className="rail-head"><span><Gauge size={15} />Metabolic signal</span><small>ACTIVE MODEL</small></div>
            <div className="metabolism-readout">
              <div><span>Resting output</span><strong>{bmr}<small>kcal</small></strong><em>BMR</em></div>
              <div><span>Daily expenditure</span><strong>{tdee}<small>kcal</small></strong><em>TDEE</em></div>
            </div>
            <div className="energy-rail"><i /><i /><i /><b style={{ left: `${Math.min(88, Math.max(12, ((tdee - 1700) / 2200) * 100))}%` }} /></div>
            <p><i />Projected from your current body mass, age, biological sex, and weekly training rhythm.</p>
          </div>
          <div className="rail-panel target-stack">
            <div className="rail-head"><span><Scale size={15} />Target composition</span><small>24H</small></div>
            {[{ label: "Protein", value: form.goalProtein, unit: "g", color: "lime" }, { label: "Carbohydrate", value: form.goalCarbs, unit: "g", color: "blue" }, { label: "Fat", value: form.goalFat, unit: "g", color: "ember" }].map((item) => (
              <div className="target-readout" key={item.label}>
                <span>{item.label}</span>
                <b>{item.value}<small>{item.unit}</small></b>
                <i className={item.color} />
              </div>
            ))}
          </div>
          <div className="rail-note">
            <Check size={15} />
            <p><b>Calibration note</b>Update your mass after a meaningful change in body weight or workload.</p>
          </div>
        </aside>
      </motion.section>
    </WorkflowLayout>
  );
}
