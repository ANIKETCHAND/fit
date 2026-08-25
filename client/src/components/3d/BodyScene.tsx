/** Kinetic Anatomy Lab: High-Definition 3D Male Anatomy Simulation Integration */
/* Interactive 3D anatomical viewer with programmatic camera viewpoint controls, muscle-tab movement, and clean UI */
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { BodyControls, type BodyView } from "./BodyControls";
import type { MuscleId } from "@/lib/fitness-data";
import { muscleLibrary } from "@/lib/fitness-data";
import { Zap } from "lucide-react";

type BodySceneProps = {
  selected: MuscleId;
  onSelected: (id: MuscleId) => void;
};

// Sketchfab Male Anatomy Study Model ID: 8b6b4d5daad74da8bd821eef5a0a8511
const MODEL_UID = "8b6b4d5daad74da8bd821eef5a0a8511";

// Camera viewpoints mapping for Front, Back, Side, and specific muscle regions
const viewPositions: Record<BodyView, { eye: [number, number, number]; target: [number, number, number] }> = {
  front: { eye: [0, -2.3, 0.35], target: [0, 0, 0.35] },
  back: { eye: [0, 2.3, 0.35], target: [0, 0, 0.35] },
  side: { eye: [2.3, 0, 0.35], target: [0, 0, 0.35] },
};

const musclePositions: Record<string, { eye: [number, number, number]; target: [number, number, number] }> = {
  chest: { eye: [0, -2.0, 0.45], target: [0, 0, 0.45] },
  back: { eye: [0, 2.0, 0.45], target: [0, 0, 0.45] },
  shoulders: { eye: [1.3, -1.7, 0.6], target: [0, 0, 0.55] },
  biceps: { eye: [1.6, -1.4, 0.4], target: [0.3, 0, 0.35] },
  triceps: { eye: [1.6, 1.4, 0.4], target: [0.3, 0, 0.35] },
  quads: { eye: [0, -2.4, -0.3], target: [0, 0, -0.3] },
  hamstrings: { eye: [0, 2.4, -0.3], target: [0, 0, -0.3] },
  glutes: { eye: [0, 2.1, 0.0], target: [0, 0, 0.0] },
  core: { eye: [0, -1.9, 0.15], target: [0, 0, 0.15] },
  calves: { eye: [0, -2.3, -0.7], target: [0, 0, -0.7] },
};

export function BodyScene({ selected, onSelected }: BodySceneProps) {
  const [view, setView] = useState<BodyView>("front");
  const [autoRotate, setAutoRotate] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const apiRef = useRef<any>(null);

  const currentMuscle = muscleLibrary[selected] || muscleLibrary["chest"];

  // Helper to move 3D camera smoothly
  const moveCamera = useCallback((eye: [number, number, number], target: [number, number, number], duration = 1.0) => {
    if (apiRef.current && typeof apiRef.current.setCameraLookAt === "function") {
      try {
        apiRef.current.setCameraLookAt(eye, target, duration, () => {});
      } catch {
        /* ignore camera error */
      }
    }
  }, []);

  // Handle Front / Back / Side button clicks
  const handleViewChange = (newView: BodyView) => {
    setView(newView);
    setAutoRotate(false);
    if (apiRef.current?.setAutospin) {
      apiRef.current.setAutospin(0);
    }
    const preset = viewPositions[newView];
    if (preset) {
      moveCamera(preset.eye, preset.target, 1.2);
    }
  };

  const handleReset = () => {
    setView("front");
    setAutoRotate(false);
    if (apiRef.current?.setAutospin) {
      apiRef.current.setAutospin(0);
    }
    const frontPreset = viewPositions.front;
    moveCamera(frontPreset.eye, frontPreset.target, 1.0);
  };

  const handleToggleRotate = () => {
    const nextRotate = !autoRotate;
    setAutoRotate(nextRotate);
    if (apiRef.current?.setAutospin) {
      apiRef.current.setAutospin(nextRotate ? 0.25 : 0);
    }
  };

  // Initialize Sketchfab Viewer API with dark theme (#070908) and smooth controls
  useEffect(() => {
    if (!iframeRef.current) return;

    let isMounted = true;

    const initViewer = () => {
      if (!(window as any).Sketchfab) {
        setTimeout(initViewer, 200);
        return;
      }

      try {
        const client = new (window as any).Sketchfab(iframeRef.current);
        client.init(MODEL_UID, {
          success: (api: any) => {
            if (!isMounted) return;
            apiRef.current = api;
            api.start();
            api.addEventListener("viewerready", () => {
              if (!isMounted) return;
              setViewerReady(true);
              // Set background to dark carbon theme #070908
              api.setBackground({ color: [0.027, 0.035, 0.031], transparent: true }, () => {});
              // Initial front camera setup
              const front = viewPositions.front;
              api.setCameraLookAt(front.eye, front.target, 0.1, () => {});
            });
          },
          error: () => {},
          autostart: 1,
          transparent: 1,
          ui_theme: "dark",
          ui_infos: 0,
          ui_watermark: 0,
          ui_color: "c6ff3d",
          ui_stop: 0,
          ui_controls: 1,
          scrollwheel: 1,
          autospin: 0,
        });
      } catch {
        /* fallback to native iframe */
      }
    };

    initViewer();

    return () => {
      isMounted = false;
    };
  }, []);

  // When selected muscle tab changes (Chest, Back, Legs, Shoulders, etc.), smoothly move 3D camera to focus on it
  useEffect(() => {
    if (!viewerReady) return;
    const targetPose = musclePositions[selected] || musclePositions.chest;
    if (targetPose) {
      moveCamera(targetPose.eye, targetPose.target, 1.2);
    }
  }, [selected, viewerReady, moveCamera]);

  // Construct fallback embed URL
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      autostart: "1",
      internal: "1",
      tracking: "0",
      ui_infos: "0",
      ui_snapshots: "0",
      ui_stop: "0",
      ui_watermark: "0",
      ui_color: "c6ff3d",
      ui_theme: "dark",
      transparent: "1",
      scrollwheel: "1",
      autospin: "0",
    });
    return `https://sketchfab.com/models/${MODEL_UID}/embed?${params.toString()}`;
  }, []);

  return (
    <section
      className="body-stage"
      aria-label="Interactive 3D anatomy explorer"
      style={{ background: "#070908", overflow: "hidden", position: "relative" }}
    >
      {/* Topline Clean Coordinate Readout */}
      <div className="stage-topline" style={{ zIndex: 10 }}>
        <span className="flex items-center gap-1.5">
          <i className="w-1.5 h-1.5 rounded-full bg-[#c6ff3d] animate-pulse" />
          3D Anatomy Simulation
        </span>
        <span className="stage-coordinate font-mono text-[10px] text-[#8b9c8a]">
          360° Rotatable
        </span>
      </div>

      {/* Clean 3D Anatomy Simulation Viewport — Unobstructed by lines or grid markings */}
      <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] bg-[#070908] flex items-center justify-center overflow-hidden z-[2]">
        <iframe
          ref={iframeRef}
          id="sketchfab-frame"
          title="Male Anatomy Study 3D Simulation"
          src={iframeSrc}
          className="w-full h-full border-0 absolute inset-0 pointer-events-auto"
          allow="autoplay; fullscreen; xr-spatial-tracking"
          allowFullScreen
          style={{ background: "#070908" }}
        />

        {/* Floating Active Target Badge */}
        <div className="absolute top-12 left-4 z-10 pointer-events-none bg-[#080d0a]/85 backdrop-blur-md border border-[#c6ff3d]/30 rounded px-2.5 py-1 flex items-center gap-2 shadow-lg">
          <Zap size={11} className="text-[#c6ff3d] animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#edf4e9]">
            Active Region: <b className="text-[#c6ff3d]">{currentMuscle.commonName}</b>
          </span>
        </div>
      </div>

      {/* Interactive Controls & View Angle Switcher */}
      <BodyControls
        view={view}
        autoRotate={autoRotate}
        onView={handleViewChange}
        onReset={handleReset}
        onToggleRotate={handleToggleRotate}
      />
    </section>
  );
}
