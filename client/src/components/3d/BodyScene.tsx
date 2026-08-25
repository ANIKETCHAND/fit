/** Kinetic Anatomy Lab: High-Definition 3D Male Anatomy Simulation Integration */
/* Clean 3D anatomical viewer with all external redirect badges/watermarks removed and centered full-body framing */
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

// Centered Full-Body Framing: Z=1.65, Distance=3.85
const FIXED_CENTER_TARGET: [number, number, number] = [0, 0, 1.65];

const viewPositions: Record<BodyView, { eye: [number, number, number]; target: [number, number, number] }> = {
  front: { eye: [0, -3.85, 1.65], target: FIXED_CENTER_TARGET },
  back: { eye: [0, 3.85, 1.65], target: FIXED_CENTER_TARGET },
  side: { eye: [3.85, 0, 1.65], target: FIXED_CENTER_TARGET },
};

const musclePositions: Record<string, { eye: [number, number, number]; target: [number, number, number] }> = {
  chest: { eye: [0, -2.8, 1.75], target: [0, 0, 1.75] },
  back: { eye: [0, 2.8, 1.75], target: [0, 0, 1.75] },
  shoulders: { eye: [1.7, -2.2, 1.85], target: [0, 0, 1.85] },
  biceps: { eye: [2.1, -1.6, 1.65], target: [0.3, 0, 1.65] },
  triceps: { eye: [2.1, 1.6, 1.65], target: [0.3, 0, 1.65] },
  core: { eye: [0, -2.7, 1.45], target: [0, 0, 1.45] },
  glutes: { eye: [0, 2.9, 1.25], target: [0, 0, 1.25] },
  quads: { eye: [0, -3.1, 0.95], target: [0, 0, 0.95] },
  hamstrings: { eye: [0, 3.1, 0.95], target: [0, 0, 0.95] },
  calves: { eye: [0, -3.1, 0.55], target: [0, 0, 0.55] },
};

export function BodyScene({ selected }: BodySceneProps) {
  const [view, setView] = useState<BodyView>("front");
  const [autoRotate, setAutoRotate] = useState(false);
  const [viewerReady, setViewerReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const apiRef = useRef<any>(null);

  const currentMuscle = muscleLibrary[selected] || muscleLibrary["chest"];

  // Helper to move 3D camera smoothly around the fixed central axis
  const moveCamera = useCallback((eye: [number, number, number], target: [number, number, number], duration = 1.0) => {
    if (apiRef.current && typeof apiRef.current.setCameraLookAt === "function") {
      try {
        apiRef.current.setCameraLookAt(eye, target, duration, () => {});
      } catch {
        /* ignore camera error */
      }
    }
  }, []);

  // Handle Front / Back / Side button clicks with locked center axis
  const handleViewChange = (newView: BodyView) => {
    setView(newView);
    setAutoRotate(false);
    if (apiRef.current?.setAutospin) {
      apiRef.current.setAutospin(0);
    }
    const preset = viewPositions[newView];
    if (preset) {
      moveCamera(preset.eye, preset.target, 1.0);
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

  // Initialize Sketchfab Viewer API with dark theme (#070908) and zero UI badges/redirects
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

              // Set background to dark carbon theme #070908
              api.setBackground({ color: [0.027, 0.035, 0.031], transparent: true }, () => {});

              // Lock pan constraint to keep body centered on axis
              if (typeof api.setCameraConstraints === "function") {
                try {
                  api.setCameraConstraints({ pan: false });
                } catch {
                  /* ignore constraint error */
                }
              }

              // Set balanced center camera framing at [0, -3.85, 1.65] looking at [0, 0, 1.65]
              const front = viewPositions.front;
              api.setCameraLookAt(front.eye, front.target, 0.1, () => {
                setTimeout(() => {
                  if (isMounted) setViewerReady(true);
                }, 300);
              });
            });
          },
          error: () => {
            if (isMounted) setViewerReady(true);
          },
          autostart: 1,
          transparent: 1,
          ui_theme: "dark",
          ui_infos: 0, // Suppress model info badge
          ui_watermark: 0, // Suppress Sketchfab watermark
          ui_loading: 0, // Suppress white loading screen
          ui_controls: 0, // Suppress default controls
          ui_general_controls: 0,
          ui_help: 0,
          ui_settings: 0,
          ui_vr: 0,
          ui_ar: 0,
          ui_annotations: 0,
          ui_color: "c6ff3d",
          ui_stop: 0,
          scrollwheel: 1,
          autospin: 0,
          double_click: 0,
          orbit_constraint_pan: 1,
        });
      } catch {
        if (isMounted) setViewerReady(true);
      }
    };

    initViewer();

    return () => {
      isMounted = false;
    };
  }, []);

  // When selected muscle tab changes (Chest, Back, Legs, Shoulders, etc.), smoothly orbit 360° to that muscle
  useEffect(() => {
    if (!viewerReady) return;
    const targetPose = musclePositions[selected] || musclePositions.chest;
    if (targetPose) {
      moveCamera(targetPose.eye, targetPose.target, 1.2);
    }
  }, [selected, viewerReady, moveCamera]);

  // Construct iframe fallback URL
  const iframeSrc = useMemo(() => {
    const params = new URLSearchParams({
      autostart: "1",
      internal: "1",
      tracking: "0",
      ui_infos: "0",
      ui_snapshots: "0",
      ui_stop: "0",
      ui_watermark: "0",
      ui_loading: "0",
      ui_controls: "0",
      ui_general_controls: "0",
      ui_help: "0",
      ui_settings: "0",
      ui_color: "c6ff3d",
      ui_theme: "dark",
      transparent: "1",
      scrollwheel: "1",
      double_click: "0",
      orbit_constraint_pan: "1",
      autospin: "0",
    });
    return `https://sketchfab.com/models/${MODEL_UID}/embed?${params.toString()}`;
  }, []);

  return (
    <section
      className="body-stage"
      aria-label="Interactive 3D anatomy explorer"
      style={{
        background: "#070908",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Topline Clean Coordinate Readout */}
      <div className="stage-topline" style={{ zIndex: 10 }}>
        <span className="flex items-center gap-1.5">
          <i className="w-1.5 h-1.5 rounded-full bg-[#c6ff3d] animate-pulse" />
          3D Anatomy Simulation
        </span>
        <span className="stage-coordinate font-mono text-[10px] text-[#8b9c8a]">
          360° Fixed Axis Orbit
        </span>
      </div>

      {/* Clean 3D Anatomy Simulation Viewport */}
      <div className="relative w-full h-full min-h-[460px] sm:min-h-[520px] bg-[#070908] flex items-center justify-center overflow-hidden z-[2]">
        {/* Dark Carbon Theme Loading Mask */}
        <div
          className={`absolute inset-0 bg-[#070908] z-30 flex flex-col items-center justify-center transition-opacity duration-700 ${
            viewerReady ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          style={{ background: "#070908" }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#c6ff3d]/20 border-t-[#c6ff3d] animate-spin" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-[#8b9c8a]">
              Calibrating 3D Anatomy...
            </span>
          </div>
        </div>

        {/* Mask out top-left author badge & redirect link */}
        <div
          className="absolute top-0 left-0 w-48 h-12 z-20 pointer-events-none"
          style={{ background: "#070908" }}
        />

        {/* Mask out top-right share & external links */}
        <div
          className="absolute top-0 right-0 w-36 h-12 z-20 pointer-events-none"
          style={{ background: "#070908" }}
        />

        {/* Mask out bottom-left Sketchfab blue cube button & watermark */}
        <div
          className="absolute bottom-0 left-0 w-16 h-14 z-20 pointer-events-none"
          style={{ background: "#070908" }}
        />

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
