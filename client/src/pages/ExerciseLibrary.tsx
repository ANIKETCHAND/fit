/** Kinetic Pixel Fitness library: animated movement cards flip to reveal cue-led coaching before staging a training movement. */
import { useMemo, useState } from "react";
import { Filter, Search, SlidersHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { ExerciseFlipCard } from "@/components/exercises/ExerciseFlipCard";
import { libraryExercises, type LibraryExercise } from "@/lib/rewards-data";
import {
  getExercisePreferences,
  getExerciseProgress,
  saveExercisePreferences,
  saveExerciseProgress,
  type ExercisePreference,
  type ExerciseProgress,
  type ExerciseTarget,
} from "@/lib/user-store";

const muscleAliases: Record<string, string[]> = {
  Pectorals: ["pec", "chest", "bench", "press", "fly", "dip"],
  Lats: ["lat", "back", "pull", "row", "chin"],
  Deltoids: ["shoulder", "delt", "overhead", "press", "lateral", "raise", "face pull"],
  Biceps: ["bicep", "arm", "curl", "preacher", "hammer"],
  Triceps: ["tricep", "arm", "pushdown", "skull", "dip", "extension"],
  Quadriceps: ["quad", "leg", "squat", "press", "lunge", "split"],
  Hamstrings: ["hamstring", "leg", "deadlift", "rdl", "curl"],
  Core: ["core", "ab", "plank", "raise", "woodchopper", "rollout"],
};

const filterTabs = [
  "All signals",
  "Favorites",
  "Coached",
  "Pectorals",
  "Lats",
  "Deltoids",
  "Biceps",
  "Triceps",
  "Quadriceps",
  "Hamstrings",
  "Core",
];

export default function ExerciseLibrary() {
  const [, setLocation] = useLocation();
  const [focus, setFocus] = useState("All signals");
  const [query, setQuery] = useState("");
  const [preferences, setPreferences] = useState<Record<string, ExercisePreference>>(getExercisePreferences);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress>(getExerciseProgress);

  const persist = (next: Record<string, ExercisePreference>) => {
    setPreferences(next);
    saveExercisePreferences(next);
  };

  const persistProgress = (next: ExerciseProgress) => {
    setExerciseProgress(next);
    saveExerciseProgress(next);
  };

  const preferenceFor = (id: string) => preferences[id] ?? {};

  const targetFor = (exercise: LibraryExercise): ExerciseTarget => {
    const [defaultSets = "3", defaultReps = "8–10"] = exercise.sets.split("×").map((part) => part.trim());
    return exerciseProgress[exercise.id] ?? { sets: defaultSets, reps: defaultReps, completed: false };
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return libraryExercises.filter((exercise) => {
      const preference = preferenceFor(exercise.id);
      if (preference.hidden) return false;

      // Filter by tab
      let matchesTab = false;
      if (focus === "All signals") {
        matchesTab = true;
      } else if (focus === "Favorites") {
        matchesTab = Boolean(preference.favorite);
      } else if (focus === "Coached") {
        matchesTab = Boolean(preference.viewedAt);
      } else {
        const aliases = muscleAliases[focus] || [focus.toLowerCase()];
        const exFocus = exercise.focus.toLowerCase();
        const exName = exercise.name.toLowerCase();
        matchesTab =
          exFocus.includes(focus.toLowerCase()) ||
          aliases.some((alias) => exFocus.includes(alias) || exName.includes(alias));
      }

      if (!matchesTab) return false;

      // Search query matching
      if (!q) return true;
      const nameMatch = exercise.name.toLowerCase().includes(q);
      const focusMatch = exercise.focus.toLowerCase().includes(q);
      const equipMatch = exercise.equipment.toLowerCase().includes(q);
      const levelMatch = exercise.level.toLowerCase().includes(q);

      const matchesQueryAlias = Object.entries(muscleAliases).some(([group, aliases]) => {
        if (group.toLowerCase().includes(q) || aliases.some((a) => a.includes(q))) {
          return exercise.focus.toLowerCase().includes(group.toLowerCase());
        }
        return false;
      });

      return nameMatch || focusMatch || equipMatch || levelMatch || matchesQueryAlias;
    });
  }, [focus, query, preferences]);

  const stage = (exercise: LibraryExercise) => {
    localStorage.setItem("fittrack-staged-exercise", exercise.name);
    toast(`${exercise.name} staged in your active protocol`);
    setLocation("/log-workout");
  };

  const toggleFavorite = (id: string) => {
    const current = preferenceFor(id);
    persist({ ...preferences, [id]: { ...current, favorite: !current.favorite } });
  };

  const hideExercise = (id: string) => {
    const current = preferenceFor(id);
    persist({ ...preferences, [id]: { ...current, hidden: true } });
    toast("Movement hidden from this device library");
  };

  const markViewed = (id: string) => {
    const current = preferenceFor(id);
    if (!current.viewedAt) persist({ ...preferences, [id]: { ...current, viewedAt: new Date().toISOString() } });
  };

  const updateTarget = (exercise: LibraryExercise, target: Pick<ExerciseTarget, "sets" | "reps">) =>
    persistProgress({ ...exerciseProgress, [exercise.id]: { ...targetFor(exercise), ...target } });

  const setCompleted = (exercise: LibraryExercise, completed: boolean) => {
    persistProgress({
      ...exerciseProgress,
      [exercise.id]: { ...targetFor(exercise), completed, completedAt: completed ? new Date().toISOString() : undefined },
    });
    toast(completed ? `${exercise.name} marked complete` : `${exercise.name} returned to active protocol`);
  };

  return (
    <WorkflowLayout title="Study the pattern">
      <section className="library-toolbar">
        <div className="library-search">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movement, muscle, or equipment (e.g. bench, quads, pull)"
          />
          {query && (
            <button
              className="search-clear-btn"
              onClick={() => setQuery("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="library-filters">
          <Filter size={14} />
          {filterTabs.map((item) => (
            <button
              key={item}
              className={focus === item ? "selected" : ""}
              onClick={() => setFocus(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          className="library-tune"
          onClick={() => {
            setFocus("All signals");
            setQuery("");
            toast("Showing all movement library exercises");
          }}
        >
          <SlidersHorizontal size={16} />
          Reset filters
        </button>
      </section>

      <section className="library-scan-anchor" aria-label="Movement scan reference">
        <div className="anchor-body">
          <i className="anchor-head" onClick={() => setFocus("Deltoids")} title="Select Shoulders / Deltoids" style={{ cursor: "pointer" }} />
          <i className="anchor-torso" onClick={() => setFocus("Lats")} title="Select Back / Lats" style={{ cursor: "pointer" }} />
          <i className="anchor-pec left" onClick={() => setFocus("Pectorals")} title="Select Chest / Pectorals" style={{ cursor: "pointer" }} />
          <i className="anchor-pec right" onClick={() => setFocus("Pectorals")} title="Select Chest / Pectorals" style={{ cursor: "pointer" }} />
          <i className="anchor-core" onClick={() => setFocus("Core")} title="Select Core / Abs" style={{ cursor: "pointer" }} />
        </div>
        <div>
          <span className="panel-label">Target muscle</span>
          <b>
            <em>
              {focus === "All signals"
                ? "All Muscle Groups"
                : focus === "Favorites"
                ? "Saved Favorites"
                : focus === "Coached"
                ? "Reviewed Movements"
                : focus}
            </em>
          </b>
        </div>
        <div className="anchor-readouts">
          <span><i />{filtered.length} Exercises found</span>
          <span><i />Joint line stable</span>
          <span><i />Load ready</span>
        </div>
      </section>

      <section className="exercise-library-grid">
        {filtered.map((exercise, index) => (
          <ExerciseFlipCard
            key={exercise.id}
            exercise={exercise}
            index={index}
            onStage={stage}
            favorite={Boolean(preferenceFor(exercise.id).favorite)}
            viewed={Boolean(preferenceFor(exercise.id).viewedAt)}
            target={targetFor(exercise)}
            onTargetChange={(target) => updateTarget(exercise, target)}
            onCompletionChange={(completed) => setCompleted(exercise, completed)}
            onFavorite={() => toggleFavorite(exercise.id)}
            onHide={() => hideExercise(exercise.id)}
            onViewed={() => markViewed(exercise.id)}
          />
        ))}
      </section>

      {filtered.length === 0 && (
        <div className="library-empty" style={{ textAlign: "center", padding: "40px 20px" }}>
          <p style={{ marginBottom: "14px", color: "#8fa18f" }}>
            No exercises match "{query || focus}".
          </p>
          <button
            className="inline-add-custom-btn"
            onClick={() => {
              setFocus("All signals");
              setQuery("");
            }}
          >
            Show All Movements ({libraryExercises.length} available)
          </button>
        </div>
      )}
    </WorkflowLayout>
  );
}
