/** Kinetic Pixel Fitness achievement cabinet: unlock, celebrate, and share real training milestones with user-authored copy. */
import { useMemo, useState } from "react";
import { ArrowUpRight, Award, LockKeyhole, Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { PixelBadge } from "@/components/achievements/PixelBadge";
import { BadgeShareSheet } from "@/components/achievements/BadgeShareSheet";
import { BadgeUnlockOverlay } from "@/components/achievements/BadgeUnlockOverlay";
import { achievementStorageKey, achievements, type Achievement } from "@/lib/rewards-data";
import { pushMilestoneNotification } from "@/lib/user-store";

export default function Achievements() {
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

  const unlock = (achievement: Achievement) => {
    if (achievement.unlocked || claimed.includes(achievement.id))
      return setSharing(achievement);
    localStorage.setItem(achievementStorageKey(achievement.id), "unlocked");
    pushMilestoneNotification(`${achievement.title} unlocked`, achievement.description);
    setClaimed((items) => [...items, achievement.id]);
    setCelebrating({ ...achievement, unlocked: true });
  };

  const unlocked = all.filter((item) => item.unlocked).length;

  return (
    <>
      <WorkflowLayout
        kicker="Progress / achievement cabinet"
        title="Earn the signal"
        detail="Training consistency and personal records unlock durable markers of the work. Every badge maps to a measurable performance condition."
      >
        <section className="achievement-hero-readout">
          <div>
            <span className="panel-label">Achievement archive</span>
            <strong>
              {unlocked}
              <small>/{all.length}</small>
            </strong>
            <p>Signals secured this block</p>
          </div>
          <div className="achievement-chain">
            <span>Current streak</span>
            <b>
              03 <small>days</small>
            </b>
            <i>
              <b style={{ width: "43%" }} />
            </i>
          </div>
          <div className="achievement-pr">
            <Award size={20} />
            <span>Next personal record</span>
            <b>Bench press · +2.5 kg</b>
          </div>
        </section>

        <section className="achievement-cabinet">
          {all.map((achievement) => (
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
                      onClick={() =>
                        achievement.id === "bench-breaker"
                          ? unlock(achievement)
                          : toast(
                              `${achievement.title} advances through your next live training signal`
                            )
                      }
                    >
                      {achievement.id === "bench-breaker" ? (
                        <>
                          <Sparkles size={13} />
                          <span>Claim simulated PR</span>
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
          ))}
        </section>
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
