import { useCallback, useEffect, useRef } from "react";
import { MapView } from "@/components/Map";
import type { RoutePoint } from "@shared/fitness-contract";

type RouteMapProps = {
  points: RoutePoint[];
  activePoint?: RoutePoint;
  onMapReady?: () => void;
  onMapError?: () => void;
  onMapLoadingChange?: (isLoading: boolean) => void;
};

const graphiteMapStyle: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#0a0d0c" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0d0c" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#829080" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1c2521" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#101614" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#071116" }] },
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

export function RouteMap({ points, activePoint, onMapReady, onMapError, onMapLoadingChange }: RouteMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const routeRef = useRef<google.maps.Polyline | null>(null);
  const haloRef = useRef<google.maps.Polyline | null>(null);
  const startRef = useRef<google.maps.Marker | null>(null);
  const endRef = useRef<google.maps.Marker | null>(null);
  const activeRef = useRef<google.maps.Marker | null>(null);

  const renderRoute = useCallback(() => {
    const map = mapRef.current;
    const maps = window.google?.maps;
    if (!map || !maps) return;

    const path = points.map((point) => ({ lat: point.latitude, lng: point.longitude }));
    routeRef.current?.setMap(null);
    haloRef.current?.setMap(null);
    startRef.current?.setMap(null);
    endRef.current?.setMap(null);
    activeRef.current?.setMap(null);
    if (!path.length) return;

    if (path.length > 1) {
      haloRef.current = new maps.Polyline({ path, strokeColor: "#7dccff", strokeOpacity: 0.22, strokeWeight: 10, map });
      routeRef.current = new maps.Polyline({ path, strokeColor: "#C6FF3D", strokeOpacity: 0.96, strokeWeight: 4, map });
      const bounds = new maps.LatLngBounds();
      path.forEach((position) => bounds.extend(position));
      map.fitBounds(bounds, 72);
    } else {
      map.setCenter(path[0]);
      map.setZoom(16);
    }

    startRef.current = new maps.Marker({ position: path[0], map, label: { text: "S", color: "#080a09", fontWeight: "700" }, icon: {
      path: maps.SymbolPath.CIRCLE, fillColor: "#C6FF3D", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 1.5, scale: 8,
    } });
    if (path.length > 1) {
      endRef.current = new maps.Marker({ position: path[path.length - 1], map, label: { text: "E", color: "#071116", fontWeight: "700" }, icon: {
        path: maps.SymbolPath.CIRCLE, fillColor: "#a6d9ff", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 1.5, scale: 8,
      } });
    }
    if (activePoint) {
      activeRef.current = new maps.Marker({ position: { lat: activePoint.latitude, lng: activePoint.longitude }, map, icon: {
        path: maps.SymbolPath.CIRCLE, fillColor: "#C6FF3D", fillOpacity: 1, strokeColor: "#0c1210", strokeWeight: 4, scale: 11,
      } });
    }
  }, [activePoint, points]);

  useEffect(() => { renderRoute(); }, [renderRoute]);

  return <MapView className="gps-google-map" initialCenter={{ lat: 28.6139, lng: 77.209 }} initialZoom={13} onMapLoadingChange={onMapLoadingChange} onMapError={onMapError} onMapReady={(map) => {
    mapRef.current = map;
    map.setOptions({ styles: graphiteMapStyle, disableDefaultUI: true, zoomControl: true, gestureHandling: "greedy" });
    renderRoute();
    onMapReady?.();
  }} />;
}
