/* FitTrack: Minimalist, Gamified Achievements Cabinet */
import { useMemo, useState } from "react";
import { 
  ArrowUpRight, 
  Award, 
  Check, 
  ChevronRight, 
  Flame, 
  Lock, 
  Share2, 
  Sparkles, 
  Star, 
  Trophy, 
  Zap,
  Info,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { BadgeShareSheet } from "@/components/achievements/BadgeShareSheet";
import { BadgeUnlockOverlay } from "@/components/achievements/BadgeUnlockOverlay";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { achievementStorageKey, achievements, type Achievement, type AchievementCategory } from "@/lib/rewards-data";
import { getExercisePreferences, getScopedKey, getStreak, pushMilestoneNotification } from "@/lib/user-store";

export default function Achievements() {
  const [activeTab, setActiveTab] = useState<"all" | "in_progress" | "daily" | "monthly" | "unlocked">("all");
  const [claimed, setClaimed] = useState<string[]>(() =>
    achievements
      .filter((item) => localStorage.getItem(achievementStorageKey(item.id)) === "unlocked")
      .map((item) => item.id)
  );
  const [sharing, setSharing] = useState<Achievement | null>(null);
  const [celebrating, setCelebrating] = useState<Achievement | null>(null);
  const [selectedBadgeModal, setSelectedBadgeModal] = useState<Achievement | null>(null);

  // Real dynamic user progress calculation per user account
  const userProgressMap = useMemo(() => {
    const workouts = (() => {
      try { return JSON.parse(localStorage.getItem(getScopedKey("fittrack_workout_logs")) || "[]"); } catch { return []; }
    })();
    const gps = (() => {
      try { return JSON.parse(localStorage.getItem(getScopedKey("fittrack_gps_sessions")) || "[]"); } catch { return []; }
    })();
    const food = (() => {
      try { return JSON.parse(localStorage.getItem(getScopedKey("fittrack_nutrition_logs")) || "[]"); } catch { return []; }
    })();
    const prefs = getExercisePreferences();
    const streak = getStreak();
    const today = new Date().toISOString().split("T")[0];
    const thisMonth = today.slice(0, 7);

    // Today's workouts
    const workoutsToday = workouts.filter((w: any) => (w.completedAt || w.startedAt || "").startsWith(today)).length;
    // Today's food meals
    const mealsToday = food.filter((f: any) => (f.consumedAt || "").startsWith(today)).length;
    // Today's GPS km
    const gpsKmToday = gps
      .filter((g: any) => (g.startedAt || g.createdAt || "").startsWith(today))
      .reduce((sum: number, g: any) => sum + (Number(g.distanceMeters) ? Number(g.distanceMeters) / 1000 : Number(g.distanceKm) || 0), 0);
    // Viewed cues count
    const cuesViewed = Object.values(prefs).filter((p: any) => p?.viewedAt).length;

    // Monthly volume
    const monthlyVolumeKg = workouts
      .filter((w: any) => (w.completedAt || w.startedAt || "").startsWith(thisMonth))
      .reduce((sum: number, w: any) => sum + (Number(w.volumeKg) || 0), 0);

    // Monthly GPS km
    const monthlyGpsKm = gps
      .filter((g: any) => (g.startedAt || g.createdAt || "").startsWith(thisMonth))
      .reduce((sum: number, g: any) => sum + (Number(g.distanceMeters) ? Number(g.distanceMeters) / 1000 : Number(g.distanceKm) || 0), 0);

    // Distinct muscles trained this month
    const distinctMuscles = new Set(
      workouts
        .filter((w: any) => (w.completedAt || w.startedAt || "").startsWith(thisMonth))
        .map((w: any) => w.focus)
        .filter(Boolean)
    ).size;

    return {
      "daily-workout": workoutsToday,
      "daily-weight": 0,
      "daily-nutrition": mealsToday,
      "daily-gps": Number(gpsKmToday.toFixed(1)),
      "daily-cues": cuesViewed,
      "monthly-streak-20": streak.count,
      "monthly-volume-100k": monthlyVolumeKg,
      "monthly-century-100km": Number(monthlyGpsKm.toFixed(1)),
      "monthly-pr-breaker": 0,
      "monthly-full-spectrum": distinctMuscles,
    };
  }, []);

  const all = useMemo(
    () =>
      achievements.map((achievement) => {
        const liveProgress = userProgressMap[achievement.id as keyof typeof userProgressMap] ?? 0;
        const isManuallyUnlocked = localStorage.getItem(achievementStorageKey(achievement.id)) === "unlocked" || claimed.includes(achievement.id);
        const isAutoUnlocked = liveProgress >= achievement.target;
        return {
          ...achievement,
          progress: liveProgress,
          unlocked: isManuallyUnlocked || isAutoUnlocked,
        };
      }),
    [userProgressMap, claimed]
  );

  const streak = getStreak();
  const unlockedBadges = all.filter((item) => item.unlocked);
  const unlockedCount = unlockedBadges.length;
  const totalScore = unlockedCount * 150 + streak.count * 25;

  // Featured / In-Progress highlights (top 2-3 active badges closest to completion or ready to claim)
  const inProgressBadges = useMemo(() => {
    const list = all
      .filter((item) => !item.unlocked)
      .sort((a, b) => (b.progress / b.target) - (a.progress / a.target));
    return list.slice(0, 3);
  }, [all]);

  const unlock = (achievement: Achievement, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (achievement.unlocked || claimed.includes(achievement.id)) {
      return setSharing(achievement);
    }
    localStorage.setItem(achievementStorageKey(achievement.id), "unlocked");
    pushMilestoneNotification(`${achievement.title} unlocked`, achievement.description);
    setClaimed((items) => [...items, achievement.id]);
    setCelebrating({ ...achievement, unlocked: true });
  };

  // Filtered badges for the main list
  const filteredBadges = useMemo(() => {
    if (activeTab === "daily") return all.filter((i) => i.category === "daily");
    if (activeTab === "monthly") return all.filter((i) => i.category === "monthly");
    if (activeTab === "unlocked") return all.filter((i) => i.unlocked);
    if (activeTab === "in_progress") return all.filter((i) => !i.unlocked);
    return all;
  }, [all, activeTab]);

  return (
    <>
      <WorkflowLayout title="Achievements">
        <div className="w-full space-y-6">
          {/* 1. MINIMALIST METRICS HEADER BAR */}
          <div className="grid grid-cols-3 gap-3 bg-[#0b110d] border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl">
            {/* Unlocked Badges */}
            <div className="text-center sm:text-left flex flex-col sm:flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#c6ff3d]/10 border border-[#c6ff3d]/20 text-[#c6ff3d] flex items-center justify-center flex-shrink-0">
                <Trophy size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8b9c8a] uppercase block">Unlocked</span>
                <b className="text-base sm:text-xl font-bold text-white font-mono">
                  {unlockedCount} <span className="text-xs text-[#5a6b58]">/ {all.length}</span>
                </b>
              </div>
            </div>

            {/* Streak */}
            <div className="text-center sm:text-left flex flex-col sm:flex-row items-center gap-3 border-x border-white/5 px-2">
              <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                <Flame size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8b9c8a] uppercase block">Streak</span>
                <b className="text-base sm:text-xl font-bold text-white font-mono">
                  {streak.count} <span className="text-xs text-[#5a6b58]">Days</span>
                </b>
              </div>
            </div>

            {/* Total Points */}
            <div className="text-center sm:text-left flex flex-col sm:flex-row items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-400/10 border border-sky-400/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                <Star size={18} />
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#8b9c8a] uppercase block">Score</span>
                <b className="text-base sm:text-xl font-bold text-white font-mono">
                  {totalScore} <span className="text-xs text-[#5a6b58]">pts</span>
                </b>
              </div>
            </div>
          </div>

          {/* 2. FEATURED / IN-PROGRESS HIGHLIGHT SECTION */}
          {inProgressBadges.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-bold text-[#c6ff3d] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap size={13} />
                  <span>In Progress</span>
                </span>
                <span className="text-[11px] font-mono text-[#8b9c8a]">
                  Nearest Milestones
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {inProgressBadges.map((badge) => {
                  const pct = Math.min(100, Math.round((badge.progress / badge.target) * 100));
                  const isReadyToClaim = badge.progress >= badge.target;

                  return (
                    <div
                      key={badge.id}
                      onClick={() => setSelectedBadgeModal(badge)}
                      className="bg-[#0b110d] border border-white/10 hover:border-[#c6ff3d]/40 rounded-2xl p-4 transition-all cursor-pointer space-y-3 relative overflow-hidden group shadow-lg"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#c6ff3d] group-hover:scale-105 transition-all">
                            <Award size={16} />
                          </div>
                          <div>
                            <b className="text-xs text-white block truncate max-w-[130px] sm:max-w-[150px]">
                              {badge.title}
                            </b>
                            <span className="text-[10px] font-mono text-[#8b9c8a]">
                              {badge.category === "daily" ? "Daily" : "Monthly"}
                            </span>
                          </div>
                        </div>

                        {isReadyToClaim ? (
                          <button
                            type="button"
                            onClick={(e) => unlock(badge, e)}
                            className="px-2.5 py-1 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-[10px] rounded-lg uppercase tracking-wider transition-all flex items-center gap-1 shadow-[0_0_10px_rgba(198,255,61,0.3)]"
                          >
                            <Sparkles size={11} />
                            <span>Claim</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-[#c6ff3d] font-bold">
                            {pct}%
                          </span>
                        )}
                      </div>

                      {/* Clean Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#8b9c8a]">
                          <span>Progress</span>
                          <span>
                            {badge.progress} / {badge.target}
                          </span>
                        </div>
                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#c6ff3d] h-full rounded-full transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. CLEAN FILTER TABS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-white/10 scrollbar-none">
            {[
              { id: "all" as const, label: `All (${all.length})` },
              { id: "in_progress" as const, label: `In Progress (${all.length - unlockedCount})` },
              { id: "unlocked" as const, label: `Unlocked (${unlockedCount})` },
              { id: "daily" as const, label: "Daily" },
              { id: "monthly" as const, label: "Monthly" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all whitespace-nowrap border ${
                  activeTab === tab.id
                    ? "bg-[#c6ff3d] text-black font-bold border-[#c6ff3d]"
                    : "bg-white/[0.02] border-white/10 text-[#8b9c8a] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 4. STREAMLINED BADGE GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredBadges.map((badge) => {
              const pct = Math.min(100, Math.round((badge.progress / badge.target) * 100));

              return (
                <div
                  key={badge.id}
                  onClick={() => setSelectedBadgeModal(badge)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                    badge.unlocked
                      ? "bg-[#0b110d] border-[#c6ff3d]/30 hover:border-[#c6ff3d]"
                      : "bg-[#0b110d] border-white/5 hover:border-white/20 opacity-85"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center border ${
                          badge.unlocked
                            ? "bg-[#c6ff3d]/15 border-[#c6ff3d]/40 text-[#c6ff3d]"
                            : "bg-white/5 border-white/10 text-[#5a6b58]"
                        }`}
                      >
                        {badge.unlocked ? <CheckCircle2 size={16} /> : <Lock size={14} />}
                      </div>
                      <div>
                        <b className="text-xs text-white block truncate max-w-[140px]">
                          {badge.title}
                        </b>
                        <span className="text-[10px] font-mono text-[#8b9c8a]">
                          {badge.reward}
                        </span>
                      </div>
                    </div>

                    {badge.unlocked ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSharing(badge);
                        }}
                        className="p-1.5 bg-white/5 hover:bg-[#c6ff3d]/20 text-[#8b9c8a] hover:text-[#c6ff3d] rounded-lg transition-all"
                        title="Share badge"
                      >
                        <Share2 size={13} />
                      </button>
                    ) : badge.progress >= badge.target ? (
                      <button
                        type="button"
                        onClick={(e) => unlock(badge, e)}
                        className="px-2 py-1 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-[10px] rounded-lg uppercase"
                      >
                        Claim
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-[#5a6b58]">
                        {pct}%
                      </span>
                    )}
                  </div>

                  {/* Simple Progress Strip */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-mono text-[#8b9c8a]">
                      <span>{badge.unlocked ? "Completed" : "Progress"}</span>
                      <span>
                        {badge.unlocked ? "100%" : `${badge.progress} / ${badge.target}`}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          badge.unlocked ? "bg-[#c6ff3d]" : "bg-[#c6ff3d]/60"
                        }`}
                        style={{ width: `${badge.unlocked ? 100 : pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </WorkflowLayout>

      {/* --- BADGE DETAIL MODAL (CLEAN & NON-INTRUSIVE) --- */}
      <Dialog open={Boolean(selectedBadgeModal)} onOpenChange={(open) => !open && setSelectedBadgeModal(null)}>
        <DialogContent className="max-w-sm bg-[#0c120e] border border-[#c6ff3d]/30 text-white rounded-3xl p-5 shadow-2xl">
          {selectedBadgeModal && (
            <div className="space-y-4 text-center">
              <div className="w-14 h-14 mx-auto rounded-3xl bg-[#c6ff3d]/15 border border-[#c6ff3d]/40 flex items-center justify-center text-[#c6ff3d] shadow-[0_0_20px_rgba(198,255,61,0.2)]">
                {selectedBadgeModal.unlocked ? <Trophy size={28} /> : <Award size={28} />}
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#8b9c8a] uppercase tracking-wider block">
                  {selectedBadgeModal.category === "daily" ? "Daily Challenge" : "Monthly Milestone"}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{selectedBadgeModal.title}</h3>
                <span className="text-xs font-mono text-[#c6ff3d] font-semibold">{selectedBadgeModal.reward}</span>
              </div>

              <p className="text-xs text-[#b0bfad] bg-black/40 p-3 rounded-2xl border border-white/5 leading-relaxed">
                {selectedBadgeModal.description}
              </p>

              <div className="space-y-1 text-left bg-black/30 p-2.5 rounded-xl border border-white/5">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#8b9c8a]">
                  <span>Signal Progress</span>
                  <span className="text-white font-bold">
                    {selectedBadgeModal.unlocked ? "Completed" : `${selectedBadgeModal.progress} / ${selectedBadgeModal.target}`}
                  </span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#c6ff3d] h-full rounded-full"
                    style={{
                      width: `${selectedBadgeModal.unlocked ? 100 : Math.min(100, Math.round((selectedBadgeModal.progress / selectedBadgeModal.target) * 100))}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {selectedBadgeModal.unlocked ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSharing(selectedBadgeModal);
                      setSelectedBadgeModal(null);
                    }}
                    className="w-full py-2.5 bg-[#c6ff3d] hover:bg-[#b0f028] text-black font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Share2 size={13} />
                    <span>Share Badge</span>
                  </button>
                ) : selectedBadgeModal.progress >= selectedBadgeModal.target ? (
                  <button
                    type="button"
                    onClick={() => {
                      unlock(selectedBadgeModal);
                      setSelectedBadgeModal(null);
                    }}
                    className="w-full py-2.5 bg-[#c6ff3d] text-black font-mono font-bold text-xs uppercase rounded-xl flex items-center justify-center gap-1.5"
                  >
                    <Sparkles size={13} />
                    <span>Claim Badge</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedBadgeModal(null)}
                    className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono text-xs rounded-xl"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Unlock Animation Overlay */}
      {celebrating && (
        <BadgeUnlockOverlay
          achievement={celebrating}
          onClose={() => setCelebrating(null)}
          onShare={() => {
            setSharing(celebrating);
            setCelebrating(null);
          }}
        />
      )}

      {/* Share Sheet */}
      {sharing && (
        <BadgeShareSheet
          achievement={sharing}
          onClose={() => setSharing(null)}
        />
      )}
    </>
  );
}
