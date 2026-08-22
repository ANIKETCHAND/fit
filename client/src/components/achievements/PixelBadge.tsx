/** Kinetic Pixel Fitness badge: 8-bit reward emblem that keeps a clinical training-console tone. */
import type { ReactNode } from "react";
import type { Achievement } from "@/lib/rewards-data";

type PixelBadgeProps = {
  achievement: Achievement;
  unlocked?: boolean;
  compact?: boolean;
  action?: ReactNode;
};

export function PixelBadge({
  achievement,
  unlocked = achievement.unlocked,
  compact = false,
  action,
}: PixelBadgeProps) {
  const progress = Math.min(
    100,
    Math.round((achievement.progress / achievement.target) * 100)
  );

  return (
    <article
      className={`achievement-badge ${unlocked ? "unlocked" : "locked"} ${
        compact ? "compact" : ""
      }`}
    >
      <div className="badge-emblem" data-kind={achievement.kind}>
        <i />
        <i />
        <i />
        <i />
        <b />
      </div>
      <div className="badge-copy">
        <div className="badge-topline">
          <span>{unlocked ? "Unlocked" : `${progress}% signal`}</span>
          {!compact && <em>{achievement.reward}</em>}
        </div>
        <h3>{achievement.title}</h3>
        {!compact && <p>{achievement.description}</p>}
        {!compact && (
          <div className="badge-footer-row">
            <div className="badge-progress">
              <i>
                <b style={{ width: `${progress}%` }} />
              </i>
              <small>
                {achievement.progress.toLocaleString()} /{" "}
                {achievement.target.toLocaleString()}
              </small>
            </div>
            {action && <div className="badge-action-slot">{action}</div>}
          </div>
        )}
      </div>
    </article>
  );
}
