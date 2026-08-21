/** Kinetic Pixel Fitness dashboard panel: visible reward progress ties training streaks and PRs to the command center. */
import { ArrowUpRight, Trophy } from "lucide-react";
import { useLocation } from "wouter";
import { achievements } from "@/lib/rewards-data";
import { PixelBadge } from "./PixelBadge";

export function AchievementPanel() {
  const [, setLocation] = useLocation();
  return <section className="achievement-panel"><div className="card-header"><div><span className="eyebrow">Reward protocol</span><h3>Signal cabinet</h3></div><button className="outline-action" onClick={() => setLocation("/achievements")}><Trophy size={14} />View all</button></div><div className="achievement-mini-list">{achievements.slice(0, 3).map((achievement) => <PixelBadge key={achievement.id} achievement={achievement} compact />)}</div><button className="achievement-foot" onClick={() => setLocation("/achievements")}><span><i />2 unlocked · 3 in progress</span><ArrowUpRight size={14} /></button></section>;
}
