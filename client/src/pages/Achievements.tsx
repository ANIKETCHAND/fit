import { useMemo, useState } from "react";
import { ArrowUpRight, Award, Calendar, Flame, LockKeyhole, Share2, Sparkles, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { PixelBadge } from "@/components/achievements/PixelBadge";
import { BadgeShareSheet } from "@/components/achievements/BadgeShareSheet";
import { BadgeUnlockOverlay } from "@/components/achievements/BadgeUnlockOverlay";
import { achievementStorageKey, achievements, type Achievement, type AchievementCategory } from "@/lib/rewards-data";
import { pushMilestoneNotification, getStreak } from "@/lib/user-store";

export default function Achievements() {
  const [activeTab, setActiveTab] = useState<"all" | "daily" | "monthly">("all");
  const [claimed, setClaimed] = useState<string[]>(() =>
    achievements
      .filter((item) => localStorage.getItem(achievementStorageKey(item.id)) === "unlocked")
      .map((item) => item.id)
  );
  const [sharing, setSharing] = useState<Achievement | null>(null);
  const [celebrating, setCelebrating] = useState<Achievement | null>(null);

  const all = useMemo(
    () =>
      achievements.map((achievement) => ({
        ...achievement,
        unlocked: achievement.unlocked || claimed.includes(achievement.id),
      })),
    [claimed]
  );

  const dailyAchievements = useMemo(
    () => all.filter((item) => item.category === "daily"),
    [all]
  );

  const monthlyAchievements = useMemo(
    () => all.filter((item) => item.category === "monthly"),
    [all]
  );

  const unlock = (achievement: Achievement) => {
    if (achievement.unlocked || claimed.includes(achievement.id))
      return setSharing(achievement);
    localStorage.setItem(achievementStorageKey(achievement.id), "unlocked");
    pushMilestoneNotification(`${achievement.title} unlocked`, achievement.description);
    setClaimed((items) => [...items, achievement.id]);
    setCelebrating({ ...achievement, unlocked: true });
  };

  const unlockedCount = all.filter((item) => item.unlocked).length;
  const unlockedDailyCount = dailyAchievements.filter((item) => item.unlocked).length;
  const unlockedMonthlyCount = monthlyAchievements.filter((item) => item.unlocked).length;

  const renderBadge = (achievement: Achievement) => (
    <div key={achievement.id} className="achievement-entry">
      <PixelBadge
        achievement={achievement}
        unlocked={achievement.unlocked}
        action={
          achievement.unlocked ? (
            <button
              className="achievement-btn badge-share-button"
              onClick={() => setSharing(achievement)}
            >
              <Share2 size={13} />
              <span>Share badge</span>
            </button>
          ) : (
            <button
              className="achievement-btn achievement-action"
              onClick={() => {
                if (achievement.id === "monthly-pr-breaker" || achievement.id === "daily-nutrition" || achievement.id === "daily-gps") {
                  unlock(achievement);
                } else {
                  toast(`${achievement.title} advances through your next training signal`);
                }
              }}
            >
              {achievement.id === "monthly-pr-breaker" || achievement.id === "daily-nutrition" || achievement.id === "daily-gps" ? (
                <>
                  <Sparkles size={13} />
                  <span>Claim milestone</span>
                </>
              ) : (
                <>
                  <LockKeyhole size={13} />
                  <span>View criteria</span>
                </>
              )}
              <ArrowUpRight size={13} />
            </button>
          )
        }
      />
    </div>
  );

  return (
    <>
      <WorkflowLayout
        kicker="Achievement cabinet"
        title="Earn the signal"
        detail="Training consistency and personal records unlock durable markers of the work. Partitioned into daily consistency challenges and epic monthly milestones."
      >
        {/* Top Hero Telemetry Strip */}
        <section className="achievement-hero-readout">
          <div>
            <span className="panel-label">Archive Progress</span>
            <strong>
              {unlockedCount}
              <small>/{all.length}</small>
            </strong>
            <p>Signals secured this cycle</p>
          </div>
          <div className="achievement-chain">
            <span>Current streak</span>
            <b>
              {String(getStreak().count).padStart(2, "0")} <small>days</small>
            </b>
            <i>
              <b style={{ width: `${Math.min(100, (getStreak().count / 7) * 100)}%` }} />
            </i>
          </div>
          <div className="achievement-pr">
            <Award size={20} />
            <span>Next personal record</span>
            <b>Bench press · +2.5 kg</b>
          </div>
        </section>

        {/* Section Tabs (All / Daily / Monthly) */}
        <div style={{ display: "flex", gap: "8px", margin: "24px 0 20px" }}>
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            style={{
              padding: "7px 14px",
              background: activeTab === "all" ? "#c6ff3d" : "rgba(16, 22, 17, 0.7)",
              color: activeTab === "all" ? "#10160e" : "#8fa18f",
              border: "1px solid rgba(226, 245, 225, 0.12)",
              borderRadius: "2px",
              fontSize: "11px",
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            All Milestones ({all.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("daily")}
            style={{
              padding: "7px 14px",
              background: activeTab === "daily" ? "#c6ff3d" : "rgba(16, 22, 17, 0.7)",
              color: activeTab === "daily" ? "#10160e" : "#8fa18f",
              border: "1px solid rgba(226, 245, 225, 0.12)",
              borderRadius: "2px",
              fontSize: "11px",
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            ⚡ Daily Tasks ({unlockedDailyCount}/{dailyAchievements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("monthly")}
            style={{
              padding: "7px 14px",
              background: activeTab === "monthly" ? "#c6ff3d" : "rgba(16, 22, 17, 0.7)",
              color: activeTab === "monthly" ? "#10160e" : "#8fa18f",
              border: "1px solid rgba(226, 245, 225, 0.12)",
              borderRadius: "2px",
              fontSize: "11px",
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            🏆 Monthly Milestones ({unlockedMonthlyCount}/{monthlyAchievements.length})
          </button>
        </div>

        {/* PART 1: DAILY TASK ACHIEVEMENTS */}
        {(activeTab === "all" || activeTab === "daily") && (
          <div style={{ marginBottom: "34px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid rgba(198, 255, 61, 0.2)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={16} color="#c6ff3d" />
                <h3 style={{ margin: 0, font: "700 18px 'Chakra Petch', sans-serif", textTransform: "uppercase", color: "#edf4e9", letterSpacing: "0.04em" }}>
                  Daily Tasks <span style={{ fontSize: "11px", color: "#c6ff3d", fontFamily: "'Space Mono', monospace", marginLeft: "6px" }}>({unlockedDailyCount}/{dailyAchievements.length} Completed)</span>
                </h3>
              </div>
              <span style={{ fontSize: "10px", color: "#79897a", fontFamily: "'Space Mono', monospace", textTransform: "uppercase" }}>
                24-Hour Micro Challenges
              </span>
            </div>
            <section className="achievement-cabinet" style={{ marginBottom: "12px" }}>
              {dailyAchievements.map(renderBadge)}
            </section>
          </div>
        )}

        {/* PART 2: MONTHLY MILESTONES */}
        {(activeTab === "all" || activeTab === "monthly") && (
          <div style={{ marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid rgba(166, 217, 255, 0.2)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Trophy size={16} color="#a6d9ff" />
                <h3 style={{ margin: 0, font: "700 18px 'Chakra Petch', sans-serif", textTransform: "uppercase", color: "#edf4e9", letterSpacing: "0.04em" }}>
                  Monthly Milestones <span style={{ fontSize: "11px", color: "#a6d9ff", fontFamily: "'Space Mono', monospace", marginLeft: "6px" }}>({unlockedMonthlyCount}/{monthlyAchievements.length} Completed)</span>
                </h3>
              </div>
              <span style={{ fontSize: "10px", color: "#79897a", fontFamily: "'Space Mono', monospace", textTransform: "uppercase" }}>
                High-Load Monthly Targets
              </span>
            </div>
            <section className="achievement-cabinet">
              {monthlyAchievements.map(renderBadge)}
            </section>
          </div>
        )}
      </WorkflowLayout>

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

      {sharing && (
        <BadgeShareSheet
          achievement={sharing}
          onClose={() => setSharing(null)}
        />
      )}
    </>
  );
}
