/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback } from "react";
import { Crosshair, Loader2, Navigation, AlertCircle, Compass, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
    L?: any;
    __mapsScriptLoading?: Promise<void>;
    __leafletScriptLoading?: Promise<void>;
  }
}

export type MapEngine = "google" | "leaflet";

export interface UnifiedMapInstance {
  engine: MapEngine;
  googleMap?: google.maps.Map;
  leafletMap?: any;
  setCenter: (lat: number, lng: number, zoom?: number) => void;
  setRoute: (points: { lat: number; lng: number }[], activePoint?: { lat: number; lng: number }) => void;
  setUserLocation: (lat: number, lng: number, accuracy?: number) => void;
  clearLocation: () => void;
  invalidateSize: () => void;
}

export interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  onMapReady?: (mapInstance: UnifiedMapInstance) => void;
  onMapError?: (error?: string) => void;
  onMapLoadingChange?: (isLoading: boolean) => void;
  showMyLocation?: boolean;
  onLocationFound?: (lat: number, lng: number, accuracy: number) => void;
}

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (!GOOGLE_API_KEY) return Promise.reject(new Error("No Google Maps API Key configured"));
  if (window.__mapsScriptLoading) return window.__mapsScriptLoading;

  window.__mapsScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&v=weekly&libraries=marker,places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      window.__mapsScriptLoading = undefined;
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });

  return window.__mapsScriptLoading;
}

function loadLeaflet(): Promise<void> {
  if (window.L) return Promise.resolve();
  if (window.__leafletScriptLoading) return window.__leafletScriptLoading;

  window.__leafletScriptLoading = new Promise((resolve, reject) => {
    // Load Leaflet JS
    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      window.__leafletScriptLoading = undefined;
      reject(new Error("Failed to load Leaflet cartography engine"));
    };
    document.head.appendChild(script);
  });

  return window.__leafletScriptLoading;
}

export function MapView({
  className,
  initialCenter = { lat: 28.6139, lng: 77.209 },
  initialZoom = 14,
  onMapReady,
  onMapError,
  onMapLoadingChange,
  showMyLocation = true,
  onLocationFound,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<UnifiedMapInstance | null>(null);

  // Google references
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleLocMarkerRef = useRef<google.maps.Marker | null>(null);
  const googleLocCircleRef = useRef<google.maps.Circle | null>(null);
  const googleRouteLineRef = useRef<google.maps.Polyline | null>(null);
  const googleRouteHaloRef = useRef<google.maps.Polyline | null>(null);
  const googleMarkersRef = useRef<google.maps.Marker[]>([]);

  // Leaflet references
  const leafletMapRef = useRef<any>(null);
  const leafletLocMarkerRef = useRef<any>(null);
  const leafletLocCircleRef = useRef<any>(null);
  const leafletRouteLineRef = useRef<any>(null);
  const leafletRouteHaloRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);

  const [engine, setEngine] = useState<MapEngine>("leaflet");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [mapStyle, setMapStyle] = useState<"dark" | "satellite">("dark");

  const initGoogleMap = useCallback((container: HTMLDivElement) => {
    const maps = window.google!.maps;
    const gmap = new maps.Map(container, {
      zoom: initialZoom,
      center: initialCenter,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      gestureHandling: "greedy",
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0d1310" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#0d1310" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8b9c8a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1b2620" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#121b16" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#081014" }] },
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
      ],
    });
    googleMapRef.current = gmap;

    const instance: UnifiedMapInstance = {
      engine: "google",
      googleMap: gmap,
      setCenter: (lat, lng, zoom) => {
        gmap.setCenter({ lat, lng });
        if (zoom) gmap.setZoom(zoom);
      },
      setUserLocation: (lat, lng, accuracy) => {
        if (googleLocMarkerRef.current) googleLocMarkerRef.current.setMap(null);
        if (googleLocCircleRef.current) googleLocCircleRef.current.setMap(null);

        googleLocMarkerRef.current = new maps.Marker({
          position: { lat, lng },
          map: gmap,
          title: "Your Location",
          zIndex: 1000,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            fillColor: "#c6ff3d",
            fillOpacity: 1,
            strokeColor: "#080c0a",
            strokeWeight: 3,
            scale: 9,
          },
        });

        if (accuracy && accuracy < 5000) {
          googleLocCircleRef.current = new maps.Circle({
            map: gmap,
            center: { lat, lng },
            radius: accuracy,
            fillColor: "#c6ff3d",
            fillOpacity: 0.15,
            strokeColor: "#c6ff3d",
            strokeOpacity: 0.5,
            strokeWeight: 1.5,
          });
        }
      },
      clearLocation: () => {
        if (googleLocMarkerRef.current) googleLocMarkerRef.current.setMap(null);
        if (googleLocCircleRef.current) googleLocCircleRef.current.setMap(null);
      },
      invalidateSize: () => {
        maps.event.trigger(gmap, "resize");
      },
      setRoute: (points, activePoint) => {
        if (googleRouteLineRef.current) googleRouteLineRef.current.setMap(null);
        if (googleRouteHaloRef.current) googleRouteHaloRef.current.setMap(null);
        googleMarkersRef.current.forEach((m) => m.setMap(null));
        googleMarkersRef.current = [];

        if (!points.length) return;

        const path = points.map((p) => ({ lat: p.lat, lng: p.lng }));

        if (path.length > 1) {
          googleRouteHaloRef.current = new maps.Polyline({
            path,
            strokeColor: "#a6d9ff",
            strokeOpacity: 0.3,
            strokeWeight: 8,
            map: gmap,
          });

          googleRouteLineRef.current = new maps.Polyline({
            path,
            strokeColor: "#c6ff3d",
            strokeOpacity: 0.98,
            strokeWeight: 4,
            map: gmap,
          });

          const bounds = new maps.LatLngBounds();
          path.forEach((pos) => bounds.extend(pos));
          gmap.fitBounds(bounds, 50);
        } else {
          gmap.setCenter(path[0]);
          gmap.setZoom(16);
        }

        // Start marker
        const startMarker = new maps.Marker({
          position: path[0],
          map: gmap,
          label: { text: "S", color: "#080a09", fontWeight: "700" },
          icon: {
            path: maps.SymbolPath.CIRCLE,
            fillColor: "#c6ff3d",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 1.5,
            scale: 8,
          },
        });
        googleMarkersRef.current.push(startMarker);

        // End marker
        if (path.length > 1) {
          const endMarker = new maps.Marker({
            position: path[path.length - 1],
            map: gmap,
            label: { text: "E", color: "#071116", fontWeight: "700" },
            icon: {
              path: maps.SymbolPath.CIRCLE,
              fillColor: "#a6d9ff",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 1.5,
              scale: 8,
            },
          });
          googleMarkersRef.current.push(endMarker);
        }

        // Active point
        if (activePoint) {
          const activeMarker = new maps.Marker({
            position: { lat: activePoint.lat, lng: activePoint.lng },
            map: gmap,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              fillColor: "#c6ff3d",
              fillOpacity: 1,
              strokeColor: "#080c0a",
              strokeWeight: 4,
              scale: 11,
            },
          });
          googleMarkersRef.current.push(activeMarker);
        }
      },
    };

    mapInstanceRef.current = instance;
    onMapReady?.(instance);
  }, [initialCenter, initialZoom, onMapReady]);

  const initLeafletMap = useCallback((container: HTMLDivElement) => {
    const L = window.L!;
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.remove();
      } catch (_) {}
      leafletMapRef.current = null;
    }

    const lmap = L.map(container, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    // Dark-themed tiles with fallback to standard OSM
    const darkTileLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      subdomains: "abcd",
      errorTileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    }).addTo(lmap);

    leafletMapRef.current = lmap;

    // Trigger resize recalculation to prevent gray tiles
    setTimeout(() => {
      lmap.invalidateSize();
    }, 150);
    setTimeout(() => {
      lmap.invalidateSize();
    }, 600);

    const instance: UnifiedMapInstance = {
      engine: "leaflet",
      leafletMap: lmap,
      invalidateSize: () => {
        lmap.invalidateSize();
      },
      setCenter: (lat, lng, zoom) => {
        lmap.setView([lat, lng], zoom || lmap.getZoom(), { animate: true });
        lmap.invalidateSize();
      },
      setUserLocation: (lat, lng, accuracy) => {
        if (leafletLocMarkerRef.current) lmap.removeLayer(leafletLocMarkerRef.current);
        if (leafletLocCircleRef.current) lmap.removeLayer(leafletLocCircleRef.current);

        const customIcon = L.divIcon({
          className: "gps-user-loc-beacon",
          html: `<div style="position:relative;width:22px;height:22px;">
            <div style="position:absolute;inset:0;background:rgba(198,255,61,0.4);border-radius:50%;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;top:3px;left:3px;width:16px;height:16px;background:#c6ff3d;border:3px solid #080c0a;border-radius:50%;box-shadow:0 0 16px #c6ff3d;"></div>
          </div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });

        leafletLocMarkerRef.current = L.marker([lat, lng], { icon: customIcon, zIndexOffset: 1000 }).addTo(lmap);

        if (accuracy && accuracy < 5000) {
          leafletLocCircleRef.current = L.circle([lat, lng], {
            radius: accuracy,
            color: "#c6ff3d",
            weight: 1.5,
            fillColor: "#c6ff3d",
            fillOpacity: 0.15,
          }).addTo(lmap);
        }

        lmap.invalidateSize();
      },
      clearLocation: () => {
        if (leafletLocMarkerRef.current) lmap.removeLayer(leafletLocMarkerRef.current);
        if (leafletLocCircleRef.current) lmap.removeLayer(leafletLocCircleRef.current);
      },
      setRoute: (points, activePoint) => {
        if (leafletRouteLineRef.current) lmap.removeLayer(leafletRouteLineRef.current);
        if (leafletRouteHaloRef.current) lmap.removeLayer(leafletRouteHaloRef.current);
        leafletMarkersRef.current.forEach((m) => lmap.removeLayer(m));
        leafletMarkersRef.current = [];

        if (!points.length) return;

        const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

        if (latlngs.length > 1) {
          leafletRouteHaloRef.current = L.polyline(latlngs, {
            color: "#a6d9ff",
            weight: 8,
            opacity: 0.3,
          }).addTo(lmap);

          leafletRouteLineRef.current = L.polyline(latlngs, {
            color: "#c6ff3d",
            weight: 4,
            opacity: 0.98,
          }).addTo(lmap);

          lmap.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
        } else {
          lmap.setView(latlngs[0], 16);
        }

        // Start Icon
        const startIcon = L.divIcon({
          className: "gps-start-node",
          html: `<div style="width:22px;height:22px;background:#c6ff3d;color:#080c0a;font-weight:700;font-size:11px;line-height:22px;text-align:center;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 10px rgba(0,0,0,0.5);">S</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const startMarker = L.marker(latlngs[0], { icon: startIcon }).addTo(lmap);
        leafletMarkersRef.current.push(startMarker);

        // End Icon
        if (latlngs.length > 1) {
          const endIcon = L.divIcon({
            className: "gps-end-node",
            html: `<div style="width:22px;height:22px;background:#a6d9ff;color:#080c0a;font-weight:700;font-size:11px;line-height:22px;text-align:center;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 10px rgba(0,0,0,0.5);">E</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          const endMarker = L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(lmap);
          leafletMarkersRef.current.push(endMarker);
        }

        // Active Icon
        if (activePoint) {
          const activeIcon = L.divIcon({
            className: "gps-active-node",
            html: `<div style="width:24px;height:24px;background:#c6ff3d;border:4px solid #080c0a;border-radius:50%;box-shadow:0 0 18px #c6ff3d;"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          const activeMarker = L.marker([activePoint.lat, activePoint.lng], { icon: activeIcon, zIndexOffset: 500 }).addTo(lmap);
          leafletMarkersRef.current.push(activeMarker);
        }

        lmap.invalidateSize();
      },
    };

    mapInstanceRef.current = instance;
    onMapReady?.(instance);
  }, [initialCenter, initialZoom, onMapReady]);

  // Load Map Engine
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    onMapLoadingChange?.(true);

    async function setup() {
      if (!containerRef.current) return;

      // Try Google Maps if API key is provided
      if (GOOGLE_API_KEY) {
        try {
          await loadGoogleMaps();
          if (isMounted && containerRef.current) {
            setEngine("google");
            initGoogleMap(containerRef.current);
            setIsLoading(false);
            onMapLoadingChange?.(false);
            return;
          }
        } catch (e) {
          console.warn("Google Maps failed to load, falling back to Leaflet:", e);
        }
      }

      // Fallback: Leaflet + Dark Cartography Tiles
      try {
        await loadLeaflet();
        if (isMounted && containerRef.current) {
          setEngine("leaflet");
          initLeafletMap(containerRef.current);
          setIsLoading(false);
          onMapLoadingChange?.(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || "Failed to initialize map");
          setIsLoading(false);
          onMapLoadingChange?.(false);
          onMapError?.(err.message);
        }
      }
    }

    setup();

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (_) {}
        leafletMapRef.current = null;
      }
    };
  }, [initGoogleMap, initLeafletMap, onMapError, onMapLoadingChange]);

  // Handle Location Detection
  const handleLocateMe = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        setCurrentCoords({ lat, lng, accuracy });
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setCenter(lat, lng, 16);
          mapInstanceRef.current.setUserLocation(lat, lng, accuracy);
        }

        onLocationFound?.(lat, lng, accuracy);
      },
      (err) => {
        setIsLocating(false);
        let msg = "Could not retrieve GPS location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS request timed out. Please try again.";
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, [onLocationFound]);

  // Auto-locate once on first load
  useEffect(() => {
    if (showMyLocation && !isLoading && !errorMessage) {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          setCurrentCoords({ lat, lng, accuracy });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            mapInstanceRef.current.setCenter(lat, lng, 15);
            mapInstanceRef.current.setUserLocation(lat, lng, accuracy);
          }
          onLocationFound?.(lat, lng, accuracy);
        },
        () => {}, // ignore silent failure
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [isLoading, errorMessage, showMyLocation, onLocationFound]);

  return (
    <div className={cn("relative w-full h-[460px] overflow-hidden bg-[#080c0a]", className)}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-[1]" />

      {/* Floating My Location Button & Radar */}
      {showMyLocation && !isLoading && !errorMessage && (
        <div className="absolute bottom-4 right-4 z-[20] flex flex-col items-end gap-2">
          {currentCoords && (
            <div className="bg-[#080c0a]/95 border border-[#c6ff3d]/40 px-3 py-1.5 rounded-md text-[11px] font-mono text-[#c6ff3d] shadow-2xl backdrop-blur-md">
              <span className="text-[#a6d9ff] font-bold">GPS: </span>
              {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
              <span className="text-[#9eab9c] text-[10px] ml-1.5">(±{Math.round(currentCoords.accuracy)}m)</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-2 bg-[#c6ff3d] hover:bg-[#d8ff6b] active:scale-95 text-[#080c0a] font-bold font-mono text-xs px-4 py-2.5 rounded-md shadow-[0_0_20px_rgba(198,255,61,0.45)] transition-all cursor-pointer disabled:opacity-60"
            title="Check and pinpoint your exact GPS location on map"
          >
            {isLocating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#080c0a]" />
                <span>Locating GPS...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-4 h-4 text-[#080c0a]" />
                <span>Check My Location</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Map Badge */}
      {!isLoading && !errorMessage && (
        <div className="absolute top-3 left-3 z-[20] bg-[#080c0a]/90 border border-[#a6d9ff]/30 px-3 py-1.5 rounded-md text-[10px] font-mono text-[#a6d9ff] uppercase tracking-wider backdrop-blur-md pointer-events-none flex items-center gap-1.5 shadow-lg">
          <Compass className="w-3.5 h-3.5 text-[#c6ff3d]" />
          <span>{engine === "google" ? "Google Maps" : "Interactive GPS Field Map"}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-[30] grid place-items-center bg-[#080c0a]/95 text-center px-6">
          <div className="max-w-xs border border-[#a6d9ff]/25 bg-[#0d1511]/90 p-5 shadow-[0_0_42px_rgba(166,217,255,0.08)]">
            <div className="flex justify-center mb-3">
              <Navigation className="w-6 h-6 text-[#a6d9ff] animate-pulse" />
            </div>
            <span className="font-mono text-[10px] tracking-widest text-[#a6d9ff] block mb-2">CALIBRATING MAP LINK</span>
            <strong className="block text-sm text-[#edf4e9] mb-1">Loading Interactive Map</strong>
            <p className="text-xs text-[#9eab9c]">Connecting GPS telemetry and cartographic tiles...</p>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 z-[30] grid place-items-center bg-[#080c0a] text-center px-6">
          <div className="max-w-sm border border-[#ff6b6b]/30 bg-[#140d0d] p-5 shadow-lg">
            <div className="flex justify-center mb-3 text-[#ff6b6b]">
              <AlertCircle className="w-7 h-7" />
            </div>
            <strong className="block text-sm text-[#edf4e9] mb-1">Map Loading Issue</strong>
            <p className="text-xs text-[#ff9e9e] mb-4">{errorMessage}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="border border-[#c6ff3d]/40 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#c6ff3d] hover:bg-[#c6ff3d]/10 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
