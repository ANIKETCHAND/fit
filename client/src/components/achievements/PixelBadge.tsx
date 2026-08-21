/** Kinetic Pixel Fitness badge: 8-bit reward emblem that keeps a clinical training-console tone. */
import type { Achievement } from "@/lib/rewards-data";

export function PixelBadge({ achievement, unlocked = achievement.unlocked, compact = false }: { achievement: Achievement; unlocked?: boolean; compact?: boolean }) {
  const progress = Math.min(100, Math.round((achievement.progress / achievement.target) * 100));
  return <article className={`achievement-badge ${unlocked ? "unlocked" : "locked"} ${compact ? "compact" : ""}`}><div className="badge-emblem" data-kind={achievement.kind}><i /><i /><i /><i /><b /></div><div className="badge-copy"><span>{unlocked ? "Unlocked" : `${progress}% signal`}</span><h3>{achievement.title}</h3>{!compact && <p>{achievement.description}</p>}{!compact && <div className="badge-progress"><i><b style={{ width: `${progress}%` }} /></i><small>{achievement.progress.toLocaleString()} / {achievement.target.toLocaleString()}</small></div>}</div>{!compact && <em>{achievement.reward}</em>}</article>;
}
