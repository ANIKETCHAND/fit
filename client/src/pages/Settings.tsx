/* Carbon Command Deck: calibration is a realistic athlete setup surface with one decisive form and a compact intelligence rail. */
import { Activity, Calculator, Check, Gauge, RotateCcw, Save, Scale, Target, UserRound } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { getCalibrationSettings, resetCalibrationSettings, saveCalibrationSettings, type CalibrationSettings } from "@/lib/user-store";
import "./CommandDeck.css";

const activityOptions: { value: CalibrationSettings["activityLevel"]; label: string; detail: string; multiplier: number }[] = [
  { value: "light", label: "Light rhythm", detail: "1–3 sessions / week", multiplier: 1.375 },
  { value: "moderate", label: "Structured", detail: "3–5 sessions / week", multiplier: 1.55 },
  { value: "active", label: "High output", detail: "6–7 sessions / week", multiplier: 1.725 },
  { value: "very_active", label: "Double sessions", detail: "Athlete workload", multiplier: 1.9 },
];

const calcBmr = (settings: CalibrationSettings) => Math.round(10 * settings.weightKg + 6.25 * settings.heightCm - 5 * settings.age + (settings.sex === "male" ? 5 : -161));
const calcTdee = (settings: CalibrationSettings) => Math.round(calcBmr(settings) * (activityOptions.find((item) => item.value === settings.activityLevel)?.multiplier ?? 1.55));

export default function Settings() {
  const [form, setForm] = useState<CalibrationSettings>(() => getCalibrationSettings());
  const [saved, setSaved] = useState(false);
  const update = <Key extends keyof CalibrationSettings>(key: Key, value: CalibrationSettings[Key]) => { setSaved(false); setForm((current) => ({ ...current, [key]: value })); };
  const bmr = calcBmr(form);
  const tdee = calcTdee(form);
  const autoSetTargets = () => {
    const protein = Math.round(form.weightKg * 2.2);
    const fat = Math.round((tdee * 0.25) / 9);
    update("goalKcal", tdee); update("goalProtein", protein); update("goalFat", fat); update("goalCarbs", Math.max(0, Math.round((tdee - protein * 4 - fat * 9) / 4)));
    toast("Targets calibrated from your current baseline");
  };
  const save = () => { saveCalibrationSettings(form); setSaved(true); toast("Calibration saved locally"); };
  const reset = () => { setForm(resetCalibrationSettings()); setSaved(false); toast("Calibration restored to its baseline"); };

  return <WorkflowLayout kicker="System / calibration" title="Calibrate your engine" detail="Set the biometric baseline, workload profile, and nutrition targets that shape every training signal.">
    <motion.section className="settings-deck" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, ease: [0.23, 1, 0.32, 1] }}>
      <form className="settings-command" onSubmit={(event) => { event.preventDefault(); save(); }}>
        <div className="command-deck-head"><div><span className="deck-kicker"><i /> Athlete calibration</span><h2>Baseline parameters</h2><p>Use your current measurements. These values stay in this browser and power your daily energy targets.</p></div><div className={`deck-status ${saved ? "is-saved" : ""}`}><i />{saved ? "Stored locally" : "Draft active"}</div></div>
        <section className="settings-section"><div className="section-marker"><UserRound size={16} /><div><span>01 / athlete</span><b>Identity & biometrics</b></div></div><div className="settings-field-grid identity-grid"><label className="deck-field wide"><span>Display name</span><input value={form.name} onChange={(event) => update("name", event.target.value)} placeholder="Athlete name" /></label><label className="deck-field"><span>Age</span><input type="number" min="14" max="99" value={form.age} onChange={(event) => update("age", Number(event.target.value))} /></label><label className="deck-field"><span>Height <em>cm</em></span><input type="number" min="120" max="250" value={form.heightCm} onChange={(event) => update("heightCm", Number(event.target.value))} /></label><label className="deck-field"><span>Mass <em>kg</em></span><input type="number" min="35" max="300" step="0.1" value={form.weightKg} onChange={(event) => update("weightKg", Number(event.target.value))} /></label></div><div className="sex-control" aria-label="Biological sex"><span>Biological sex</span><div><button type="button" className={form.sex === "male" ? "selected" : ""} onClick={() => update("sex", "male")}>Male</button><button type="button" className={form.sex === "female" ? "selected" : ""} onClick={() => update("sex", "female")}>Female</button></div></div></section>
        <section className="settings-section workload-section"><div className="section-marker"><Activity size={16} /><div><span>02 / workload</span><b>Training rhythm</b></div></div><div className="activity-matrix">{activityOptions.map((option, index) => <button type="button" key={option.value} className={form.activityLevel === option.value ? "activity-choice selected" : "activity-choice"} onClick={() => update("activityLevel", option.value)}><span>0{index + 1}</span><b>{option.label}</b><small>{option.detail}</small><i /></button>)}</div></section>
        <section className="settings-section target-section"><div className="section-marker"><Target size={16} /><div><span>03 / nutrition</span><b>Daily targets</b></div><button type="button" className="recalculate-button" onClick={autoSetTargets}><Calculator size={14} />Auto-calibrate</button></div><div className="settings-field-grid targets-grid"><label className="deck-field"><span>Energy <em>kcal</em></span><input type="number" min="1000" max="6000" value={form.goalKcal} onChange={(event) => update("goalKcal", Number(event.target.value))} /></label><label className="deck-field"><span>Protein <em>g</em></span><input type="number" min="40" max="450" value={form.goalProtein} onChange={(event) => update("goalProtein", Number(event.target.value))} /></label><label className="deck-field"><span>Carbohydrate <em>g</em></span><input type="number" min="0" max="800" value={form.goalCarbs} onChange={(event) => update("goalCarbs", Number(event.target.value))} /></label><label className="deck-field"><span>Fat <em>g</em></span><input type="number" min="20" max="300" value={form.goalFat} onChange={(event) => update("goalFat", Number(event.target.value))} /></label></div></section>
        <div className="settings-actions"><button type="button" className="reset-calibration" onClick={reset}><RotateCcw size={15} />Restore baseline</button><button type="submit" className="save-calibration"><Save size={16} />Save calibration <span>↗</span></button></div>
      </form>
      <aside className="calibration-rail"><div className="rail-panel metabolism-panel"><div className="rail-head"><span><Gauge size={15} />Metabolic signal</span><small>ACTIVE MODEL</small></div><div className="metabolism-readout"><div><span>Resting output</span><strong>{bmr}<small>kcal</small></strong><em>BMR</em></div><div><span>Daily expenditure</span><strong>{tdee}<small>kcal</small></strong><em>TDEE</em></div></div><div className="energy-rail"><i /><i /><i /><b style={{ left: `${Math.min(88, Math.max(12, ((tdee - 1700) / 2200) * 100))}%` }} /></div><p><i />Projected from your current body mass, age, biological sex, and weekly training rhythm.</p></div><div className="rail-panel target-stack"><div className="rail-head"><span><Scale size={15} />Target composition</span><small>24H</small></div>{[{ label: "Protein", value: form.goalProtein, unit: "g", color: "lime" }, { label: "Carbohydrate", value: form.goalCarbs, unit: "g", color: "blue" }, { label: "Fat", value: form.goalFat, unit: "g", color: "ember" }].map((item) => <div className="target-readout" key={item.label}><span>{item.label}</span><b>{item.value}<small>{item.unit}</small></b><i className={item.color} /></div>)}</div><div className="rail-note"><Check size={15} /><p><b>Calibration note</b>Update your mass after a meaningful change in body weight or workload.</p></div></aside>
    </motion.section>
  </WorkflowLayout>;
}
