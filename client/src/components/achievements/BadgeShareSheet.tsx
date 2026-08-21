/** Kinetic Pixel Fitness sharing: user-controlled share copy with native-social and clipboard fallbacks. */
import { useEffect, useState } from "react";
import { Check, Copy, Download, ExternalLink, Send, Share2, X } from "lucide-react";
import { toast } from "sonner";
import type { Achievement } from "@/lib/rewards-data";
import { PixelBadge } from "./PixelBadge";
import { exportBadgeCertificate } from "@/lib/badge-certificate";

type BadgeShareSheetProps = { achievement: Achievement; onClose: () => void };
const makeMessage = (achievement: Achievement) => `I unlocked the ${achievement.title} badge in FitTrack. ${achievement.description} Train the system. See the signal. #FitTrack #TrainTheSignal`;

export function BadgeShareSheet({ achievement, onClose }: BadgeShareSheetProps) {
  const [message, setMessage] = useState(() => makeMessage(achievement));
  const [copied, setCopied] = useState(false);
  useEffect(() => { setMessage(makeMessage(achievement)); setCopied(false); }, [achievement]);
  const copy = async () => { await navigator.clipboard?.writeText(message); setCopied(true); toast("Achievement message copied — ready to post"); };
  const nativeShare = async () => { if (navigator.share) { try { await navigator.share({ title: `${achievement.title} — FitTrack`, text: message }); } catch { /* User cancellation needs no error state. */ } } else await copy(); };
  const shareToX = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer,width=650,height=520");
  const certificate = () => { exportBadgeCertificate(achievement); toast("Visual certificate exported as a PNG card"); };
  return <div className="share-backdrop" role="presentation" onMouseDown={onClose}><section className="badge-share-sheet" role="dialog" aria-modal="true" aria-labelledby="share-title" onMouseDown={(event) => event.stopPropagation()}><button className="sheet-close" onClick={onClose} aria-label="Close sharing panel"><X size={18} /></button><div className="share-sheet-grid"><PixelBadge achievement={achievement} unlocked /><div><span className="eyebrow">Share achievement</span><h2 id="share-title">Broadcast the work</h2><p>Personalize the message, then share the unlocked signal from your device or preferred social channel.</p><label className="share-message"><span>Custom message</span><textarea value={message} maxLength={240} onChange={(event) => setMessage(event.target.value)} /><small>{message.length}/240</small></label><div className="share-actions"><button className="native-share" onClick={nativeShare}><Share2 size={16} />Share with device</button><button onClick={shareToX}><Send size={15} />Post to X</button><button onClick={copy}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy message"}</button></div><button className="certificate-export" onClick={certificate}><Download size={15} />Export visual certificate <span>PNG</span></button><a className="share-note" href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Ffittrack.manus.space" target="_blank" rel="noreferrer"><ExternalLink size={13} />Open LinkedIn share</a></div></div></section></div>;
}
