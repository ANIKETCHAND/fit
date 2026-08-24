import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Play, Pause, RotateCcw, Sparkles, Volume2, VolumeX, X, Zap, Gauge } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface ExerciseVideoTarget {
  id?: string;
  name: string;
  focus?: string;
  equipment?: string;
  coaching?: {
    setup?: string;
    cue?: string;
    tip?: string;
  };
}

interface ExerciseVideoModalProps {
  exercise: ExerciseVideoTarget | null;
  open: boolean;
  onClose: () => void;
}

// Map exercise IDs or titles to local downloaded video files in /videos/
const exerciseVideoMap: Record<string, string> = {
  "bench-press": "/videos/bench-press.mp4",
  "barbell-bench-press": "/videos/bench-press.mp4",
  "incline-db-press": "/videos/incline-db-press.mp4",
  "incline-dumbbell-press": "/videos/incline-db-press.mp4",
  "cable-fly": "/videos/cable-fly.mp4",
  "cable-chest-fly": "/videos/cable-fly.mp4",
  "lat-pulldown": "/videos/lat-pulldown.mp4",
  "chest-row": "/videos/lat-pulldown.mp4",
  "barbell-row": "/videos/lat-pulldown.mp4",
  "pull-ups": "/videos/lat-pulldown.mp4",
  "overhead-press": "/videos/overhead-press.mp4",
  "standing-overhead-press": "/videos/overhead-press.mp4",
  "seated-press": "/videos/overhead-press.mp4",
  "lateral-raise": "/videos/lateral-raise.mp4",
  "dumbbell-lateral-raise": "/videos/lateral-raise.mp4",
  "incline-curl": "/videos/incline-curl.mp4",
  "ez-bar-curl": "/videos/incline-curl.mp4",
  "hammer-curl": "/videos/hammer-curl.mp4",
  "cross-body-hammer-curl": "/videos/hammer-curl.mp4",
  "tricep-pushdown": "/videos/tricep-pushdown.mp4",
  "rope-tricep-pushdown": "/videos/tricep-pushdown.mp4",
  "close-grip-press": "/videos/tricep-pushdown.mp4",
  "skull-crushers": "/videos/skull-crushers.mp4",
  "barbell-back-squat": "/videos/barbell-back-squat.mp4",
  "front-squat": "/videos/barbell-back-squat.mp4",
  "leg-press": "/videos/barbell-back-squat.mp4",
  "bulgarian-split-squat": "/videos/barbell-back-squat.mp4",
  "romanian-deadlift": "/videos/barbell-back-squat.mp4",
  "hanging-leg-raise": "/videos/hanging-leg-raise.mp4",
  "cable-woodchopper": "/videos/hanging-leg-raise.mp4",
  "ab-wheel-rollout": "/videos/hanging-leg-raise.mp4",
};

export function ExerciseVideoModal({ exercise, open, onClose }: ExerciseVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState<1 | 0.75 | 0.5>(1);
  const [videoError, setVideoError] = useState(false);

  // Normalize exercise ID or name to find video file
  const videoSrc = exercise
    ? exerciseVideoMap[exercise.id || ""] ||
      exerciseVideoMap[exercise.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")] ||
      "/videos/bench-press.mp4"
    : null;

  useEffect(() => {
    if (open && videoRef.current) {
      setVideoError(false);
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [open, videoSrc, playbackRate]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const cycleSpeed = () => {
    const nextRate = playbackRate === 1 ? 0.75 : playbackRate === 0.75 ? 0.5 : 1;
    setPlaybackRate(nextRate);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
  };

  if (!exercise) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl p-0 bg-[#080d0a] border border-[#c6ff3d]/30 text-[#edf4e9] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
        <DialogHeader className="p-4 pb-2 border-b border-[rgba(237,244,233,0.08)] flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c6ff3d] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c6ff3d]"></span>
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-[#a6d9ff]">
                Form Biomechanics Lab
              </span>
            </div>
            <DialogTitle className="font-sans text-lg font-bold text-[#edf4e9] tracking-tight">
              {exercise.name}
            </DialogTitle>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8b9c8a] hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </DialogHeader>

        {/* Video Player Display */}
        <div className="relative aspect-[9/16] sm:aspect-video w-full max-h-[380px] bg-[#000000] flex items-center justify-center overflow-hidden">
          {videoSrc && !videoError ? (
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              onError={() => setVideoError(true)}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-6 gap-2">
              <Zap className="w-10 h-10 text-[#c6ff3d] animate-pulse" />
              <strong className="text-sm text-[#edf4e9]">Kinetic Form Telemetry</strong>
              <p className="text-xs text-[#8b9c8a] max-w-xs">
                Visual demonstration stream calibrated. Check coaching cues below.
              </p>
            </div>
          )}

          {/* Floating Controls Bar */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-[#080d0a]/85 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 z-10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-md bg-[#c6ff3d] hover:bg-[#d8ff6b] flex items-center justify-center text-[#080c0a] font-bold cursor-pointer transition-all active:scale-95"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
              </button>

              <button
                type="button"
                onClick={cycleSpeed}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/15 text-xs font-mono text-[#a6d9ff] flex items-center gap-1 cursor-pointer transition-all"
                title="Toggle playback speed for slow-mo form check"
              >
                <Gauge size={12} />
                <span>{playbackRate}x</span>
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-md hover:bg-white/10 text-[#8b9c8a] hover:text-white cursor-pointer transition-colors"
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#c6ff3d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#c6ff3d] animate-pulse"></span>
              <span>LOOPING</span>
            </div>
          </div>
        </div>

        {/* Coaching Technique Telemetry */}
        <div className="p-4 pt-3 bg-[#0a110d] border-t border-[rgba(237,244,233,0.08)]">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#0e1712] border border-[#c6ff3d]/20 rounded-md p-2.5">
              <span className="text-[8px] font-mono uppercase tracking-wider text-[#c6ff3d] block mb-1">
                01 / Setup
              </span>
              <p className="text-[11px] text-[#edf4e9] leading-snug font-sans">
                {exercise.coaching?.setup || "Pin shoulder blades down & brace core before unracking load."}
              </p>
            </div>
            <div className="bg-[#0e1712] border border-[#a6d9ff]/20 rounded-md p-2.5">
              <span className="text-[8px] font-mono uppercase tracking-wider text-[#a6d9ff] block mb-1">
                02 / Execution Cue
              </span>
              <p className="text-[11px] text-[#edf4e9] leading-snug font-sans">
                {exercise.coaching?.cue || "Control eccentric 2-3s, explode through contraction arc."}
              </p>
            </div>
            <div className="bg-[#0e1712] border border-[#ffd998]/20 rounded-md p-2.5">
              <span className="text-[8px] font-mono uppercase tracking-wider text-[#ffd998] block mb-1">
                03 / Pro Tip
              </span>
              <p className="text-[11px] text-[#edf4e9] leading-snug font-sans">
                {exercise.coaching?.tip || "Keep joints aligned; avoid momentum swing."}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
