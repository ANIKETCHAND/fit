import { useState } from "react";

interface SketchfabBodyViewerProps {
  className?: string;
}

export function SketchfabBodyViewer({ className = "" }: SketchfabBodyViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  // Sketchfab embed URL with optimal parameters: autostart, dark theme, no watermarks, transparent background
  const embedUrl =
    "https://sketchfab.com/models/d69709e13a564808a6936995e07b12b1/embed?autostart=1&ui_theme=dark&ui_hint=0&ui_infos=0&ui_watermark=0&ui_controls=1&transparent=1";

  return (
    <div className={`relative w-full h-full min-h-[580px] flex items-center justify-center overflow-hidden ${className}`}>
      {/* Loading Skeleton Indicator */}
      {!isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050806] z-10">
          <div className="w-12 h-12 rounded-full border-2 border-[#baff57] border-t-transparent animate-spin mb-3" />
          <span className="font-mono text-xs text-[#a3b899] uppercase tracking-widest animate-pulse">
            Loading 3D Ripped Anatomy Model...
          </span>
        </div>
      )}

      {/* Sketchfab 3D Iframe */}
      <iframe
        title="Human Body - Ripped Male"
        src={embedUrl}
        className="w-full h-full border-0 absolute inset-0 z-0"
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        onLoad={() => setIsLoaded(true)}
        style={{
          background: "transparent",
          pointerEvents: "auto",
        }}
      />

      {/* Model Credit Badge (Subtle dark glass link) */}
      <div className="absolute bottom-3 right-4 z-20 pointer-events-auto bg-[#0a100d]/80 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1 text-[10px] font-mono text-[#8b9c8a] flex items-center gap-1.5 shadow-lg">
        <span>3D Model:</span>
        <a
          href="https://sketchfab.com/3d-models/human-body-ripped-male-d69709e13a564808a6936995e07b12b1"
          target="_blank"
          rel="noreferrer noopener"
          className="text-[#baff57] hover:underline font-semibold"
        >
          Ripped Male by GoVi
        </a>
      </div>
    </div>
  );
}
