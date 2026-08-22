/** Kinetic Pixel Fitness library: animated movement cards flip to reveal cue-led coaching before staging a training movement. */
import { useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { ExerciseFlipCard } from "@/components/exercises/ExerciseFlipCard";
import { libraryExercises, type LibraryExercise } from "@/lib/rewards-data";
import { getExercisePreferences, getExerciseProgress, saveExercisePreferences, saveExerciseProgress, type ExercisePreference, type ExerciseProgress, type ExerciseTarget } from "@/lib/user-store";

export default function ExerciseLibrary() {
  const [, setLocation] = useLocation();
  const [focus, setFocus] = useState("All signals");
  const [query, setQuery] = useState("");
  const [preferences, setPreferences] = useState<Record<string, ExercisePreference>>(getExercisePreferences);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress>(getExerciseProgress);
  const persist = (next: Record<string, ExercisePreference>) => { setPreferences(next); saveExercisePreferences(next); };
  const persistProgress = (next: ExerciseProgress) => { setExerciseProgress(next); saveExerciseProgress(next); };
  const preferenceFor = (id: string) => preferences[id] ?? {};
  const targetFor = (exercise: LibraryExercise): ExerciseTarget => {
    const [defaultSets = "3", defaultReps = "8–10"] = exercise.sets.split("×").map((part) => part.trim());
    return exerciseProgress[exercise.id] ?? { sets: defaultSets, reps: defaultReps, completed: false };
  };
  const filtered = useMemo(() => libraryExercises.filter((exercise) => { const preference = preferenceFor(exercise.id); const filteredBySignal = focus === "All signals" || (focus === "Favorites" ? preference.favorite : focus === "Coached" ? Boolean(preference.viewedAt) : exercise.focus.toLowerCase().includes(focus.toLowerCase())); return !preference.hidden && filteredBySignal && exercise.name.toLowerCase().includes(query.toLowerCase()); }), [focus, query, preferences]);
  const stage = (exercise: LibraryExercise) => { localStorage.setItem("fittrack-staged-exercise", exercise.name); toast(`${exercise.name} staged in your active protocol`); setLocation("/log-workout"); };
  const toggleFavorite = (id: string) => { const current = preferenceFor(id); persist({ ...preferences, [id]: { ...current, favorite: !current.favorite } }); };
  const hideExercise = (id: string) => { const current = preferenceFor(id); persist({ ...preferences, [id]: { ...current, hidden: true } }); toast("Movement hidden from this device library"); };
  const markViewed = (id: string) => { const current = preferenceFor(id); if (!current.viewedAt) persist({ ...preferences, [id]: { ...current, viewedAt: new Date().toISOString() } }); };
  const updateTarget = (exercise: LibraryExercise, target: Pick<ExerciseTarget, "sets" | "reps">) => persistProgress({ ...exerciseProgress, [exercise.id]: { ...targetFor(exercise), ...target } });
  const setCompleted = (exercise: LibraryExercise, completed: boolean) => {
    persistProgress({ ...exerciseProgress, [exercise.id]: { ...targetFor(exercise), completed, completedAt: completed ? new Date().toISOString() : undefined } });
    toast(completed ? `${exercise.name} marked complete` : `${exercise.name} returned to active protocol`);
  };
  return <WorkflowLayout title="Study the pattern"><section className="library-toolbar"><div className="library-search"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movement, focus, or equipment" /></div><div className="library-filters"><Filter size={14} />{["All signals", "Favorites", "Coached", "Pectorals", "Quadriceps", "Biceps", "Lats"].map((item) => <button key={item} className={focus === item ? "selected" : ""} onClick={() => setFocus(item)}>{item}</button>)}</div><button className="library-tune" onClick={() => toast("Movement filters calibrated for equipment and training block")}><SlidersHorizontal size={16} />Tune library</button></section><section className="library-scan-anchor" aria-label="Movement scan reference"><div className="anchor-body"><i className="anchor-head" /><i className="anchor-torso" /><i className="anchor-pec left" /><i className="anchor-pec right" /><i className="anchor-core" /></div><div><span className="panel-label">Movement scan</span><b>Selected pattern routes through <em>pectoral / triceps</em> signal path.</b></div><div className="anchor-readouts"><span><i />Joint line stable</span><span><i />Range 86%</span><span><i />Load ready</span></div></section><section className="exercise-library-grid">{filtered.map((exercise, index) => <ExerciseFlipCard key={exercise.id} exercise={exercise} index={index} onStage={stage} favorite={Boolean(preferenceFor(exercise.id).favorite)} viewed={Boolean(preferenceFor(exercise.id).viewedAt)} target={targetFor(exercise)} onTargetChange={(target) => updateTarget(exercise, target)} onCompletionChange={(completed) => setCompleted(exercise, completed)} onFavorite={() => toggleFavorite(exercise.id)} onHide={() => hideExercise(exercise.id)} onViewed={() => markViewed(exercise.id)} />)}</section>{filtered.length === 0 && <div className="library-empty">No movement signal matches this filter. Reset the scan or broaden the search.</div>}</WorkflowLayout>;
}
