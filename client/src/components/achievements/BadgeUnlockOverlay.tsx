/** Kinetic Pixel Fitness celebration: full-focus achievement moment with pixel confetti and an explicit next action. */
import { Award, ArrowRight, Share2 } from "lucide-react";
import type { Achievement } from "@/lib/rewards-data";
import { PixelBadge } from "./PixelBadge";

type BadgeUnlockOverlayProps = { achievement: Achievement; onClose: () => void; onShare: () => void };
export function BadgeUnlockOverlay({ achievement, onClose, onShare }: BadgeUnlockOverlayProps) {
  return <div className="unlock-overlay" role="dialog" aria-modal="true" aria-labelledby="unlock-title"><div className="pixel-confetti" aria-hidden="true">{Array.from({ length: 18 }, (_, index) => <i key={index} style={{ "--piece": index } as React.CSSProperties} />)}</div><section className="unlock-console"><div className="unlock-topline"><span><i />Achievement signal captured</span><span>REW / 01</span></div><Award className="unlock-mark" size={31} /><span className="eyebrow">New badge unlocked</span><h2 id="unlock-title">{achievement.title}</h2><p>{achievement.description}</p><PixelBadge achievement={achievement} unlocked /><div className="unlock-actions"><button className="unlock-share" onClick={onShare}><Share2 size={16} />Share the signal</button><button onClick={onClose}>Continue <ArrowRight size={16} /></button></div></section></div>;
}
