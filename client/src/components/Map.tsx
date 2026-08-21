/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

function loadMapScript(): Promise<void> {
  if (window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${MAPS_PROXY_URL}/maps/api/js?key=${API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry`;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      script.remove();
      reject(new Error("Google Maps could not be loaded"));
    };
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  onMapReady?: (map: google.maps.Map) => void;
  onMapError?: () => void;
  onMapLoadingChange?: (isLoading: boolean) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  onMapReady,
  onMapError,
  onMapLoadingChange,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [mapError, setMapError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const init = usePersistFn(async () => {
    setMapError(false);
    setIsLoading(true);
    onMapLoadingChange?.(true);
    let didFail = false;
    try {
      await loadMapScript();
      if (!mapContainer.current || !window.google?.maps) {
        throw new Error("Map container or Maps SDK was unavailable");
      }
      map.current = new window.google.maps.Map(mapContainer.current, {
        zoom: initialZoom,
        center: initialCenter,
        mapTypeControl: true,
        fullscreenControl: true,
        zoomControl: true,
        streetViewControl: true,
        mapId: "DEMO_MAP_ID",
      });
      onMapReady?.(map.current);
    } catch {
      didFail = true;
      setMapError(true);
      onMapError?.();
    } finally {
      setIsLoading(false);
      if (!didFail) onMapLoadingChange?.(false);
    }
  });

  useEffect(() => {
    init();
  }, [init]);

  return <div ref={mapContainer} className={cn("relative w-full h-[500px] overflow-hidden", className)}>
    {!mapError && isLoading && <div className="map-service-loading absolute inset-0 z-10 grid place-items-center bg-[#090d0b]/96 px-6 text-center text-[#edf4e9]" role="status" aria-live="polite">
      <div className="max-w-xs border border-[#a6d9ff]/25 bg-[#0d1511]/90 px-6 py-5 shadow-[0_0_42px_rgba(166,217,255,0.08)]">
        <span className="mb-3 inline-block font-mono text-[10px] tracking-[0.22em] text-[#a6d9ff]">MAP LINK / INITIALIZING</span>
        <div className="mx-auto mb-3 flex w-16 gap-1.5" aria-hidden="true"><i className="h-1 flex-1 animate-pulse bg-[#a6d9ff]" /><i className="h-1 flex-1 animate-pulse bg-[#a6d9ff] [animation-delay:120ms]" /><i className="h-1 flex-1 animate-pulse bg-[#a6d9ff] [animation-delay:240ms]" /></div>
        <strong className="block font-semibold tracking-wide">Calibrating field telemetry</strong>
        <p className="mt-2 text-sm leading-6 text-[#9eab9c]">Secure map tiles and route controls are being prepared.</p>
      </div>
    </div>}
    {mapError && <div className="map-service-unavailable absolute inset-0 z-10 grid place-items-center bg-[#090d0b] px-6 text-center text-[#edf4e9]">
      <div className="max-w-xs border border-[#c6ff3d]/25 bg-[#0d1511]/90 px-6 py-5 shadow-[0_0_42px_rgba(198,255,61,0.08)]">
        <span className="mb-3 inline-block font-mono text-[10px] tracking-[0.22em] text-[#c6ff3d]">MAP SIGNAL / DEGRADED</span>
        <strong className="block font-semibold tracking-wide">Route telemetry remains available</strong>
        <p className="mt-2 text-sm leading-6 text-[#9eab9c]">The live map layer is temporarily unavailable. Your capture controls and saved route telemetry remain intact.</p>
        <button type="button" onClick={() => void init()} className="mt-4 border border-[#c6ff3d]/35 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#c6ff3d] transition hover:bg-[#c6ff3d]/10 active:scale-[0.97]">Retry map link</button>
      </div>
    </div>}
  </div>;
}
