/** Kinetic Anatomy Lab: High-Definition 3D Male Anatomy Simulation Integration */
/* Interactive 3D anatomical viewer with dark carbon theme background, viewpoint controls, and live telemetry HUD */
import { useState, useMemo, useEffect, useRef } from "react";
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

export function BodyScene({ selected }: BodySceneProps) {
  const [view, setView] = useState<BodyView>("front");
  const [autoRotate, setAutoRotate] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const apiRef = useRef<any>(null);

  const currentMuscle = muscleLibrary[selected] || muscleLibrary["chest"];

  const reset = () => {
    setView("front");
    setAutoRotate(false);
    if (apiRef.current?.recenterCamera) {
      apiRef.current.recenterCamera();
    }
  };

  // Initialize Sketchfab Viewer API to enforce dark carbon background (#070908)
  useEffect(() => {
    if (!iframeRef.current) return;

    let isMounted = true;

    const initViewer = () => {
      if (!(window as any).Sketchfab) {
        // Retry if script is still loading
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
              // #070908 normalized RGB: [7/255, 9/255, 8/255] = [0.027, 0.035, 0.031]
              api.setBackground({ color: [0.027, 0.035, 0.031], transparent: true }, () => {});
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
          autospin: autoRotate ? 0.2 : 0,
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

  // Update autospin when autoRotate state changes
  useEffect(() => {
    if (apiRef.current?.setAutospin) {
      apiRef.current.setAutospin(autoRotate ? 0.2 : 0);
    }
  }, [autoRotate]);

  // Construct iframe fallback URL with dark theme parameters
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
      autospin: autoRotate ? "0.2" : "0",
    });
    return `https://sketchfab.com/models/${MODEL_UID}/embed?${params.toString()}`;
  }, [autoRotate]);

  return (
    <section className="body-stage" aria-label="Interactive 3D anatomy explorer" style={{ background: "#070908" }}>
      {/* Topline Coordinate Readout */}
      <div className="stage-topline">
        <span className="flex items-center gap-1.5">
          <i className="w-1.5 h-1.5 rounded-full bg-[#c6ff3d] animate-pulse" />
          3D Anatomy Simulation
        </span>
        <span className="stage-coordinate font-mono text-[10px] text-[#8b9c8a]">
          X 31.5 / Y 14.2 / Z 08.7
        </span>
      </div>

      {/* Kinetic Scan Grids & Crosshairs */}
      <div className="scan-grid" aria-hidden="true" />
      <div className={`anatomy-fiber-map focus-${selected}`} aria-hidden="true">
        <i /><i /><i /><i /><i /><i /><i /><i />
      </div>
      <div className="anatomy-ruler ruler-vertical" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>
      <div className="anatomy-ruler ruler-horizontal" aria-hidden="true">
        <i /><i /><i /><i /><i />
      </div>
      <div className="body-crosshair crosshair-x" aria-hidden="true" />
      <div className="body-crosshair crosshair-y" aria-hidden="true" />
      <div className="body-halo halo-one" aria-hidden="true" />
      <div className="body-halo halo-two" aria-hidden="true" />

      {/* Dynamic Anatomy Telemetry HUD Overlays */}
      <div className="anatomy-callout callout-chest" aria-hidden="true">
        <span>01</span>
        <b>
          {currentMuscle.anatomicalName.toUpperCase()}
          <br />
          ACTIVE SIGNAL
        </b>
        <i />
      </div>
      <div className="anatomy-callout callout-core" aria-hidden="true">
        <span>02</span>
        <b>
          LOAD INDEX
          <br />
          {currentMuscle.relativeMass}% MASS
        </b>
        <i />
      </div>

      <div className="anatomy-coordinate-tag tag-one" aria-hidden="true">
        SIM-8B6B
      </div>
      <div className="anatomy-coordinate-tag tag-two" aria-hidden="true">
        T-06.21
      </div>

      {/* Interactive 3D Anatomy Simulation Viewport with dark carbon backdrop */}
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
        <div className="absolute top-12 left-4 z-10 pointer-events-none bg-[#080d0a]/85 backdrop-blur-md border border-[#c6ff3d]/30 rounded px-2.5 py-1 flex items-center gap-2">
          <Zap size={11} className="text-[#c6ff3d] animate-pulse" />
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#edf4e9]">
            Focus: <b className="text-[#c6ff3d]">{currentMuscle.commonName}</b>
          </span>
        </div>
      </div>

      {/* Interactive Controls & View Angle Switcher */}
      <BodyControls
        view={view}
        autoRotate={autoRotate}
        onView={setView}
        onReset={reset}
        onToggleRotate={() => setAutoRotate((state) => !state)}
      />
    </section>
  );
}
