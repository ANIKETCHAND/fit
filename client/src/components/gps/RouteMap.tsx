import { useEffect, useRef } from "react";
import { MapView, UnifiedMapInstance } from "@/components/Map";
import type { RoutePoint } from "@shared/fitness-contract";

type RouteMapProps = {
  points: RoutePoint[];
  activePoint?: RoutePoint;
  onMapReady?: () => void;
  onMapError?: (error?: string) => void;
  onMapLoadingChange?: (isLoading: boolean) => void;
  onLocationFound?: (lat: number, lng: number, accuracy: number) => void;
};

export function RouteMap({
  points,
  activePoint,
  onMapReady,
  onMapError,
  onMapLoadingChange,
  onLocationFound,
}: RouteMapProps) {
  const mapInstanceRef = useRef<UnifiedMapInstance | null>(null);

  // Sync route whenever points or activePoint changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const formattedPoints = points.map((p) => ({
      lat: p.latitude,
      lng: p.longitude,
    }));

    const formattedActive = activePoint
      ? { lat: activePoint.latitude, lng: activePoint.longitude }
      : undefined;

    mapInstanceRef.current.setRoute(formattedPoints, formattedActive);
  }, [points, activePoint]);

  return (
    <MapView
      className="gps-google-map"
      initialCenter={{ lat: 28.6139, lng: 77.209 }}
      initialZoom={14}
      showMyLocation={true}
      onLocationFound={onLocationFound}
      onMapLoadingChange={onMapLoadingChange}
      onMapError={onMapError}
      onMapReady={(instance) => {
        mapInstanceRef.current = instance;

        if (points.length) {
          const formattedPoints = points.map((p) => ({
            lat: p.latitude,
            lng: p.longitude,
          }));
          const formattedActive = activePoint
            ? { lat: activePoint.latitude, lng: activePoint.longitude }
            : undefined;
          instance.setRoute(formattedPoints, formattedActive);
        }

        onMapReady?.();
      }}
    />
  );
}
