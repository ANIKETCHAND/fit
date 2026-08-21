/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState, useCallback } from "react";
import { Crosshair, Loader2, Navigation, AlertCircle, Compass, Layers, KeyRound, Check } from "lucide-react";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
    L?: any;
    __mapsScriptLoading?: Promise<void>;
  }
}

export type MapEngine = "google" | "leaflet";
export type TileStyle = "dark" | "streets" | "satellite";

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

const ENV_GOOGLE_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

function loadGoogleMapsScript(key: string): Promise<void> {
  if (window.google?.maps) return Promise.resolve();
  if (window.__mapsScriptLoading) return window.__mapsScriptLoading;

  window.__mapsScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&v=weekly&libraries=marker,places,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      script.remove();
      window.__mapsScriptLoading = undefined;
      reject(new Error("Failed to load Google Maps API"));
    };
    document.head.appendChild(script);
  });

  return window.__mapsScriptLoading;
}

function ensureLeaflet(): Promise<any> {
  if (window.L) return Promise.resolve(window.L);

  return new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-script")) {
      const script = document.createElement("script");
      script.id = "leaflet-script";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.crossOrigin = "";
      script.onload = () => resolve(window.L);
      script.onerror = () => reject(new Error("Failed to load map engine"));
      document.head.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.L) {
          clearInterval(interval);
          resolve(window.L);
        }
      }, 50);
      setTimeout(() => {
        clearInterval(interval);
        if (window.L) resolve(window.L);
        else reject(new Error("Map script timeout"));
      }, 5000);
    }
  });
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

  // Store callbacks in refs to completely avoid re-render loops and flickering
  const callbacksRef = useRef({
    onMapReady,
    onMapError,
    onMapLoadingChange,
    onLocationFound,
  });
  useEffect(() => {
    callbacksRef.current = {
      onMapReady,
      onMapError,
      onMapLoadingChange,
      onLocationFound,
    };
  });

  // Google Map elements
  const googleMapRef = useRef<google.maps.Map | null>(null);
  const googleLocMarkerRef = useRef<google.maps.Marker | null>(null);
  const googleLocCircleRef = useRef<google.maps.Circle | null>(null);
  const googleRouteLineRef = useRef<google.maps.Polyline | null>(null);
  const googleRouteHaloRef = useRef<google.maps.Polyline | null>(null);
  const googleMarkersRef = useRef<google.maps.Marker[]>([]);

  // Leaflet elements
  const leafletMapRef = useRef<any>(null);
  const leafletTileLayerRef = useRef<any>(null);
  const leafletLocMarkerRef = useRef<any>(null);
  const leafletLocCircleRef = useRef<any>(null);
  const leafletRouteLineRef = useRef<any>(null);
  const leafletRouteHaloRef = useRef<any>(null);
  const leafletMarkersRef = useRef<any[]>([]);

  const [activeEngine, setActiveEngine] = useState<MapEngine>("leaflet");
  const [tileStyle, setTileStyle] = useState<TileStyle>("dark");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customApiKey, setCustomApiKey] = useState(localStorage.getItem("fittrack_google_maps_key") || "");
  const [keySaved, setKeySaved] = useState(false);

  // Initialize Leaflet
  const setupLeaflet = useCallback((container: HTMLDivElement, L: any) => {
    if (leafletMapRef.current) return;

    const map = L.map(container, {
      center: [initialCenter.lat, initialCenter.lng],
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: false,
    });

    const tileUrls: Record<TileStyle, string> = {
      dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      streets: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    };

    const tileLayer = L.tileLayer(tileUrls["dark"], {
      maxZoom: 19,
      subdomains: "abcd",
    }).addTo(map);

    leafletTileLayerRef.current = tileLayer;
    leafletMapRef.current = map;

    setTimeout(() => map.invalidateSize(), 150);
    setTimeout(() => map.invalidateSize(), 500);

    const instance: UnifiedMapInstance = {
      engine: "leaflet",
      leafletMap: map,
      invalidateSize: () => map.invalidateSize(),
      setCenter: (lat, lng, zoom) => {
        map.setView([lat, lng], zoom || map.getZoom(), { animate: true });
        map.invalidateSize();
      },
      setUserLocation: (lat, lng, accuracy) => {
        if (leafletLocMarkerRef.current) map.removeLayer(leafletLocMarkerRef.current);
        if (leafletLocCircleRef.current) map.removeLayer(leafletLocCircleRef.current);

        const customIcon = L.divIcon({
          className: "gps-user-beacon",
          html: `<div style="position:relative;width:24px;height:24px;">
            <div style="position:absolute;inset:0;background:rgba(198,255,61,0.5);border-radius:50%;animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></div>
            <div style="position:absolute;top:4px;left:4px;width:16px;height:16px;background:#c6ff3d;border:3px solid #080c0a;border-radius:50%;box-shadow:0 0 16px #c6ff3d;"></div>
          </div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        leafletLocMarkerRef.current = L.marker([lat, lng], { icon: customIcon, zIndexOffset: 1000 }).addTo(map);

        if (accuracy && accuracy < 5000) {
          leafletLocCircleRef.current = L.circle([lat, lng], {
            radius: accuracy,
            color: "#c6ff3d",
            weight: 1.5,
            fillColor: "#c6ff3d",
            fillOpacity: 0.15,
          }).addTo(map);
        }

        map.invalidateSize();
      },
      clearLocation: () => {
        if (leafletLocMarkerRef.current) map.removeLayer(leafletLocMarkerRef.current);
        if (leafletLocCircleRef.current) map.removeLayer(leafletLocCircleRef.current);
      },
      setRoute: (points, activePoint) => {
        if (leafletRouteLineRef.current) map.removeLayer(leafletRouteLineRef.current);
        if (leafletRouteHaloRef.current) map.removeLayer(leafletRouteHaloRef.current);
        leafletMarkersRef.current.forEach((m) => map.removeLayer(m));
        leafletMarkersRef.current = [];

        if (!points.length) return;

        const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);

        if (latlngs.length > 1) {
          leafletRouteHaloRef.current = L.polyline(latlngs, {
            color: "#a6d9ff",
            weight: 8,
            opacity: 0.3,
          }).addTo(map);

          leafletRouteLineRef.current = L.polyline(latlngs, {
            color: "#c6ff3d",
            weight: 4,
            opacity: 0.98,
          }).addTo(map);

          map.fitBounds(L.latLngBounds(latlngs), { padding: [40, 40] });
        } else {
          map.setView(latlngs[0], 16);
        }

        const startIcon = L.divIcon({
          className: "gps-start-node",
          html: `<div style="width:22px;height:22px;background:#c6ff3d;color:#080c0a;font-weight:700;font-size:11px;line-height:22px;text-align:center;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 10px rgba(0,0,0,0.5);">S</div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        const startMarker = L.marker(latlngs[0], { icon: startIcon }).addTo(map);
        leafletMarkersRef.current.push(startMarker);

        if (latlngs.length > 1) {
          const endIcon = L.divIcon({
            className: "gps-end-node",
            html: `<div style="width:22px;height:22px;background:#a6d9ff;color:#080c0a;font-weight:700;font-size:11px;line-height:22px;text-align:center;border-radius:50%;border:2px solid #ffffff;box-shadow:0 0 10px rgba(0,0,0,0.5);">E</div>`,
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });
          const endMarker = L.marker(latlngs[latlngs.length - 1], { icon: endIcon }).addTo(map);
          leafletMarkersRef.current.push(endMarker);
        }

        if (activePoint) {
          const activeIcon = L.divIcon({
            className: "gps-active-node",
            html: `<div style="width:24px;height:24px;background:#c6ff3d;border:4px solid #080c0a;border-radius:50%;box-shadow:0 0 18px #c6ff3d;"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          });
          const activeMarker = L.marker([activePoint.lat, activePoint.lng], { icon: activeIcon, zIndexOffset: 500 }).addTo(map);
          leafletMarkersRef.current.push(activeMarker);
        }

        map.invalidateSize();
      },
    };

    mapInstanceRef.current = instance;
    callbacksRef.current.onMapReady?.(instance);
  }, [initialCenter, initialZoom]);

  // Initialize Google Maps
  const setupGoogleMap = useCallback((container: HTMLDivElement) => {
    if (googleMapRef.current) return;

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
    callbacksRef.current.onMapReady?.(instance);
  }, [initialCenter, initialZoom]);

  // Load Map ONCE on mount
  useEffect(() => {
    let active = true;

    async function initialize() {
      if (!containerRef.current) return;

      setIsLoading(true);
      setErrorMessage(null);
      callbacksRef.current.onMapLoadingChange?.(true);

      const activeKey = customApiKey || ENV_GOOGLE_KEY;

      if (activeKey) {
        try {
          await loadGoogleMapsScript(activeKey);
          if (active && containerRef.current) {
            setActiveEngine("google");
            setupGoogleMap(containerRef.current);
            setIsLoading(false);
            callbacksRef.current.onMapLoadingChange?.(false);
            return;
          }
        } catch (err: any) {
          console.warn("Google Maps load failed, switching to default engine:", err.message);
        }
      }

      // Default engine
      try {
        const L = await ensureLeaflet();
        if (active && containerRef.current) {
          setActiveEngine("leaflet");
          setupLeaflet(containerRef.current, L);
          setIsLoading(false);
          callbacksRef.current.onMapLoadingChange?.(false);
        }
      } catch (err: any) {
        if (active) {
          setErrorMessage(err.message || "Failed to load map");
          setIsLoading(false);
          callbacksRef.current.onMapLoadingChange?.(false);
          callbacksRef.current.onMapError?.(err.message);
        }
      }
    }

    initialize();

    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      active = false;
      window.removeEventListener("resize", handleResize);
    };
  }, [customApiKey, setupGoogleMap, setupLeaflet]);

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
        setCoords({ lat, lng, accuracy });
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          mapInstanceRef.current.setCenter(lat, lng, 16);
          mapInstanceRef.current.setUserLocation(lat, lng, accuracy);
        }

        callbacksRef.current.onLocationFound?.(lat, lng, accuracy);
      },
      (err) => {
        setIsLocating(false);
        let msg = "Could not retrieve GPS location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please enable location access in your browser.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS request timed out. Please try again.";
        }
        alert(msg);
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }, []);

  // Initial Auto-Location (runs once without re-triggering)
  const initialLocateDone = useRef(false);
  useEffect(() => {
    if (showMyLocation && !isLoading && !errorMessage && !initialLocateDone.current) {
      initialLocateDone.current = true;
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng, accuracy } = pos.coords;
          setCoords({ lat, lng, accuracy });
          if (mapInstanceRef.current) {
            mapInstanceRef.current.invalidateSize();
            mapInstanceRef.current.setCenter(lat, lng, 15);
            mapInstanceRef.current.setUserLocation(lat, lng, accuracy);
          }
          callbacksRef.current.onLocationFound?.(lat, lng, accuracy);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, [isLoading, errorMessage, showMyLocation]);

  // Change Tile Style smoothly
  const changeTile = (style: TileStyle) => {
    setTileStyle(style);
    if (activeEngine === "leaflet" && leafletMapRef.current && window.L) {
      const tileUrls: Record<TileStyle, string> = {
        dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        streets: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        satellite: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      };
      if (leafletTileLayerRef.current) {
        leafletMapRef.current.removeLayer(leafletTileLayerRef.current);
      }
      leafletTileLayerRef.current = window.L.tileLayer(tileUrls[style], {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(leafletMapRef.current);
    }
  };

  const handleSaveApiKey = () => {
    if (customApiKey.trim()) {
      localStorage.setItem("fittrack_google_maps_key", customApiKey.trim());
    } else {
      localStorage.removeItem("fittrack_google_maps_key");
    }
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowKeyModal(false);
      window.location.reload();
    }, 600);
  };

  return (
    <div className={cn("relative w-full h-[480px] overflow-hidden bg-[#080c0a] rounded-lg select-none", className)}>
      <div ref={containerRef} className="absolute inset-0 w-full h-full z-[1]" />

      {/* Top Map Controls */}
      {!isLoading && !errorMessage && (
        <div className="absolute top-3 left-3 right-3 z-[20] flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="bg-[#080c0a]/90 border border-[#a6d9ff]/30 px-3 py-1.5 rounded-md text-[10px] font-mono text-[#a6d9ff] uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 shadow-lg">
              <Compass className="w-3.5 h-3.5 text-[#c6ff3d]" />
              <span>{activeEngine === "google" ? "Google Maps" : "Interactive Field Map"}</span>
            </div>

            {/* Tile Layer Selector */}
            {activeEngine === "leaflet" && (
              <div className="flex bg-[#080c0a]/90 border border-white/10 rounded-md p-0.5 backdrop-blur-md">
                {(["dark", "streets", "satellite"] as TileStyle[]).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => changeTile(style)}
                    className={cn(
                      "px-2 py-1 text-[9px] font-mono uppercase tracking-wider rounded transition-all cursor-pointer",
                      tileStyle === style ? "bg-[#c6ff3d] text-[#080c0a] font-bold" : "text-[#9eab9c] hover:text-white"
                    )}
                  >
                    {style}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Google Maps Key Config Button */}
          <button
            type="button"
            onClick={() => setShowKeyModal(true)}
            className="pointer-events-auto bg-[#080c0a]/90 hover:bg-[#121a14] border border-white/15 px-2.5 py-1.5 rounded-md text-[10px] font-mono text-[#9eab9c] hover:text-[#c6ff3d] flex items-center gap-1.5 transition backdrop-blur-md shadow-lg cursor-pointer"
            title="Configure Google Maps API Key"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#c6ff3d]" />
            <span>Maps Key</span>
          </button>
        </div>
      )}

      {/* Floating My Location Button & Radar */}
      {showMyLocation && !isLoading && !errorMessage && (
        <div className="absolute bottom-4 right-4 z-[20] flex flex-col items-end gap-2 pointer-events-auto">
          {coords && (
            <div className="bg-[#080c0a]/95 border border-[#c6ff3d]/40 px-3.5 py-1.5 rounded-md text-[11px] font-mono text-[#c6ff3d] shadow-2xl backdrop-blur-md">
              <span className="text-[#a6d9ff] font-bold">LIVE GPS: </span>
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              <span className="text-[#9eab9c] text-[10px] ml-1.5">(±{Math.round(coords.accuracy)}m)</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleLocateMe}
            disabled={isLocating}
            className="flex items-center gap-2 bg-[#c6ff3d] hover:bg-[#d8ff6b] active:scale-95 text-[#080c0a] font-bold font-mono text-xs px-4 py-2.5 rounded-md shadow-[0_0_24px_rgba(198,255,61,0.5)] transition-all cursor-pointer disabled:opacity-60"
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

      {/* Google Maps API Key Modal */}
      {showKeyModal && (
        <div className="absolute inset-0 z-[40] bg-[#080c0a]/90 backdrop-blur-sm grid place-items-center p-6">
          <div className="bg-[#0f1712] border border-[#c6ff3d]/30 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2 text-[#c6ff3d] font-mono font-bold text-sm">
                <KeyRound className="w-4 h-4" />
                <span>Google Maps Configuration</span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-[#9eab9c] hover:text-white text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <p className="text-xs text-[#9eab9c] mb-4 leading-relaxed">
              OpenStreetMap / Leaflet is currently active and works out of the box with zero keys. To switch to official Google Maps, paste your Google Maps API Key below:
            </p>
            <div className="mb-4">
              <label className="block text-[10px] font-mono text-[#a6d9ff] uppercase tracking-wider mb-1.5">
                Google Maps API Key (Browser)
              </label>
              <input
                type="text"
                value={customApiKey}
                onChange={(e) => setCustomApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-[#080c0a] border border-white/20 rounded px-3 py-2 text-xs font-mono text-white placeholder:text-white/30 focus:outline-none focus:border-[#c6ff3d]"
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setCustomApiKey("");
                  localStorage.removeItem("fittrack_google_maps_key");
                  setShowKeyModal(false);
                  window.location.reload();
                }}
                className="text-[11px] font-mono text-red-400 hover:underline cursor-pointer"
              >
                Reset to OpenStreetMap
              </button>
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="flex items-center gap-1.5 bg-[#c6ff3d] hover:bg-[#d8ff6b] text-[#080c0a] font-mono font-bold text-xs px-4 py-2 rounded transition cursor-pointer"
              >
                {keySaved ? <Check className="w-3.5 h-3.5" /> : null}
                <span>{keySaved ? "Saved!" : "Save & Reload"}</span>
              </button>
            </div>
          </div>
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
              className="border border-[#c6ff3d]/40 px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-[#c6ff3d] hover:bg-[#c6ff3d]/10 transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
