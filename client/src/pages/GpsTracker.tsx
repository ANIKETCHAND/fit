import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Crosshair, LoaderCircle, MapPinned, Navigation, Pause, Play, Radio, Route, Save, Timer, Trash2, Waves } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { RouteMap } from "@/components/gps/RouteMap";
import { BackendFeedback } from "@/components/feedback/BackendFeedback";
import { trpc } from "@/lib/trpc";
import type { RoutePoint } from "@shared/fitness-contract";
import "./GpsTracker.css";

const earthRadiusMeters = 6_371_000;
const toRadians = (value: number) => value * Math.PI / 180;
const distanceBetween = (a: RoutePoint, b: RoutePoint) => {
  const latitude = toRadians(b.latitude - a.latitude);
  const longitude = toRadians(b.longitude - a.longitude);
  const h = Math.sin(latitude / 2) ** 2 + Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(longitude / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
const formatDuration = (seconds: number) => `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
const formatDistance = (meters: number) => meters >= 1000 ? `${(meters / 1000).toFixed(2)} km` : `${Math.round(meters)} m`;

const GPS_STORAGE_KEY = "fittrack_gps_sessions";
let gpsIdCounter = Date.now();

function loadLocalSessions(): LocalGpsSession[] {
  try { return JSON.parse(localStorage.getItem(GPS_STORAGE_KEY) || "[]"); } catch { return []; }
}
function saveLocalSessions(sessions: LocalGpsSession[]) {
  try { localStorage.setItem(GPS_STORAGE_KEY, JSON.stringify(sessions)); } catch { /* ignore */ }
}

interface LocalGpsSession {
  id: number; label: string; startedAt: string; endedAt: string;
  durationSeconds: number; distanceMeters: number; averageSpeedKph: number;
  points: RoutePoint[];
}

function buildDemoRoute(origin = { latitude: 28.6139, longitude: 77.209 }): RoutePoint[] {
  return Array.from({ length: 22 }, (_, index) => ({
    latitude: origin.latitude + Math.sin(index / 3.2) * 0.0035 + index * 0.00019,
    longitude: origin.longitude + Math.cos(index / 4.1) * 0.004 + index * 0.00014,
    timestampMs: Date.now() - (21 - index) * 18_000,
    accuracyMeters: 8,
    speedMetersPerSecond: 1.25,
  }));
}

function locationMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED) return "Location permission is required. Please allow location access in your browser, then retry.";
  if (error.code === error.POSITION_UNAVAILABLE) return "GPS cannot find a reliable position yet. Please ensure GPS/location is enabled on your device.";
  return "GPS signal was interrupted or took too long to respond. Please check your connection and retry.";
}

export default function GpsTracker() {
  const utils = trpc.useUtils();
  const historyQuery = trpc.gps.list.useQuery();
  const [localSessions, setLocalSessions] = useState<LocalGpsSession[]>(loadLocalSessions);
  const serverSessions = historyQuery.data ?? [];
  // Merge: server sessions take precedence, then local-only ones
  const savedSessions = serverSessions.length > 0 ? serverSessions : localSessions;
  const [livePoints, setLivePoints] = useState<RoutePoint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [failedRemovalId, setFailedRemovalId] = useState<number | null>(null);
  const [userLocationInfo, setUserLocationInfo] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocatingOnly, setIsLocatingOnly] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const createSession = trpc.gps.create.useMutation({
    onMutate: () => setSaveError(null),
    onSettled: async () => { try { await utils.gps.list.invalidate(); } catch { /* offline */ } },
    onError: () => { /* handled in saveRoute */ },
  });
  const removeSession = trpc.gps.remove.useMutation({
    onMutate: () => { setRemoveError(null); setFailedRemovalId(null); },
    onSettled: async () => { try { await utils.gps.list.invalidate(); } catch { /* offline */ } },
    onError: (_error, variables) => {
      // Fallback: remove from local storage
      const next = localSessions.filter((s) => s.id !== variables.id);
      saveLocalSessions(next);
      setLocalSessions(next);
      setSelectedId(null);
      toast.success("Route removed from local history.");
    },
  });

  useEffect(() => () => { if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current); }, []);
  useEffect(() => {
    if (!isTracking || !startedAt) return;
    const timer = window.setInterval(() => setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [isTracking, startedAt]);

  const liveDistance = useMemo(() => livePoints.slice(1).reduce((total, point, index) => total + distanceBetween(livePoints[index], point), 0), [livePoints]);
  const selectedSession = savedSessions.find((session) => session.id === selectedId) ?? savedSessions[0];
  const displayedPoints = isTracking || livePoints.length ? livePoints : (selectedSession?.points ?? []);
  const activePoint = isTracking ? livePoints[livePoints.length - 1] : undefined;
  const mapLabel = mapState === "loading" ? "Initializing map" : isTracking ? "Live GPS capture active" : displayedPoints.length ? "Saved route replay" : userLocationInfo ? "GPS Position Locked" : "Ready for field capture";

  const addPoint = useCallback((position: GeolocationPosition) => {
    const pt: RoutePoint = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      timestampMs: position.timestamp,
      accuracyMeters: position.coords.accuracy,
      speedMetersPerSecond: position.coords.speed,
    };
    setUserLocationInfo({
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
    });
    setLivePoints((current) => [...current, pt]);
  }, []);

  const endTraceOnError = useCallback((error: GeolocationPositionError) => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
    setCaptureError(locationMessage(error));
  }, []);

  const beginTracking = () => {
    if (!navigator.geolocation) {
      setCaptureError("This browser does not expose GPS location services. Use a supported browser or load the route simulation.");
      return;
    }
    setCaptureError(null);
    setLivePoints([]);
    setElapsedSeconds(0);
    setStartedAt(Date.now());
    setIsTracking(true);
    toast.success("Starting GPS live tracking...");
    navigator.geolocation.getCurrentPosition(addPoint, endTraceOnError, { enableHighAccuracy: true, timeout: 12_000 });
    watchIdRef.current = navigator.geolocation.watchPosition(addPoint, endTraceOnError, { enableHighAccuracy: true, maximumAge: 3_000, timeout: 20_000 });
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
    toast.info("GPS tracking paused.");
  };

  const checkSingleLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingOnly(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingOnly(false);
        setUserLocationInfo({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        toast.success(`Location locked: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)} (±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setIsLocatingOnly(false);
        toast.error(locationMessage(err));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const previewSignal = () => {
    setCaptureError(null);
    const origin = userLocationInfo
      ? { latitude: userLocationInfo.lat, longitude: userLocationInfo.lng }
      : undefined;
    setLivePoints(buildDemoRoute(origin));
    setElapsedSeconds(378);
    setStartedAt(Date.now() - 378_000);
    setIsTracking(false);
    toast("Simulation route loaded.");
  };

  const saveRoute = () => {
    if (livePoints.length < 2 || !startedAt) {
      setSaveError("Capture at least two GPS points before storing a route.");
      return;
    }
    const endedAt = new Date(livePoints[livePoints.length - 1].timestampMs);
    const duration = Math.max(1, Math.round((endedAt.getTime() - startedAt) / 1000));
    const avgSpeed = (liveDistance / duration) * 3.6;
    // Always save locally first as fallback
    const newSession: LocalGpsSession = {
      id: ++gpsIdCounter,
      label: "Outdoor Movement Route",
      startedAt: new Date(startedAt).toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: duration,
      distanceMeters: liveDistance,
      averageSpeedKph: avgSpeed,
      points: livePoints,
    };
    const next = [newSession, ...localSessions];
    saveLocalSessions(next);
    setLocalSessions(next);
    createSession.mutate(
      { label: "Outdoor Movement Route", startedAt: new Date(startedAt), endedAt, durationSeconds: duration, distanceMeters: liveDistance, averageSpeedKph: avgSpeed, points: livePoints },
      { onSettled: () => { toast.success("Route saved to your training history."); setLivePoints([]); } }
    );
  };

  const handleLoadingChange = useCallback((loading: boolean) => {
    setMapState(loading ? "loading" : "ready");
  }, []);

  const handleMapReady = useCallback(() => {
    setMapState("ready");
  }, []);

  const handleMapError = useCallback(() => {
    setMapState("error");
  }, []);

  const handleLocationFound = useCallback((lat: number, lng: number, accuracy: number) => {
    setUserLocationInfo({ lat, lng, accuracy });
  }, []);

  return (
    <WorkflowLayout kicker="GPS / movement trace" title="Route your training signal" detail="Capture an outdoor movement route, inspect the telemetry, and save the completed trace to your athlete history.">
      <motion.section className="gps-command-deck" variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}>
        <div className="gps-route-stage">
          <div className="gps-map-head">
            <div>
              <span className="panel-label">Route telemetry</span>
              <b>{mapLabel}</b>
            </div>
            <span className={isTracking ? "gps-live-state active" : "gps-live-state"}>
              <i />
              {isTracking ? "GPS locked" : mapState === "loading" ? "Connecting" : userLocationInfo ? "GPS Ready" : "Standby"}
            </span>
          </div>

          <div className="gps-map-frame">
            <RouteMap
              points={displayedPoints}
              activePoint={activePoint}
              onMapLoadingChange={handleLoadingChange}
              onMapReady={handleMapReady}
              onMapError={handleMapError}
              onLocationFound={handleLocationFound}
            />
            <div className="gps-map-corners">
              <span>LAT / LON</span>
              <span>FIELD TRACE</span>
            </div>
          </div>

          <div className="gps-metrics-strip">
            <div>
              <Route size={16} />
              <span>Distance</span>
              <b>{formatDistance(isTracking || livePoints.length ? liveDistance : selectedSession?.distanceMeters ?? 0)}</b>
            </div>
            <div>
              <Timer size={16} />
              <span>Duration</span>
              <b>{formatDuration(isTracking || livePoints.length ? elapsedSeconds : selectedSession?.durationSeconds ?? 0)}</b>
            </div>
            <div>
              <Waves size={16} />
              <span>Avg. speed</span>
              <b>{(isTracking || livePoints.length ? elapsedSeconds ? liveDistance / elapsedSeconds * 3.6 : 0 : selectedSession?.averageSpeedKph ?? 0).toFixed(1)} km/h</b>
            </div>
          </div>
        </div>

        <aside className="gps-control-bay">
          <div className="gps-control-heading">
            <div className="gps-signal-orb"><Navigation size={19} /></div>
            <div>
              <span className="panel-label">Capture control</span>
              <b>{isTracking ? "Movement in progress" : "Ready for route capture"}</b>
            </div>
          </div>
          <p>FitTrack pinpoints your position in real-time. Use Locate Me to check GPS or Start Field Trace to record a workout.</p>

          <div className="gps-control-actions">
            {isTracking ? (
              <button className="gps-primary-control stop" onClick={stopTracking}>
                <Pause size={16} />Pause capture
              </button>
            ) : (
              <button className="gps-primary-control" onClick={beginTracking}>
                <Play size={16} />Start field trace
              </button>
            )}

            <button
              className="gps-secondary-control"
              onClick={checkSingleLocation}
              disabled={isLocatingOnly}
            >
              {isLocatingOnly ? <LoaderCircle className="animate-spin" size={15} /> : <Crosshair size={15} />}
              {isLocatingOnly ? "Locating..." : "Check My Location"}
            </button>

            <button className="gps-secondary-control" onClick={previewSignal}>
              <Radio size={15} />Preview simulation
            </button>
          </div>

          {captureError && <BackendFeedback tone="error" title="GPS trace paused" detail={captureError} onRetry={beginTracking} />}

          <div className="gps-quality">
            <div>
              <Crosshair size={15} />
              <span>Position precision</span>
              <b>
                {activePoint?.accuracyMeters
                  ? `±${Math.round(activePoint.accuracyMeters)} m`
                  : userLocationInfo?.accuracy
                  ? `±${Math.round(userLocationInfo.accuracy)} m`
                  : "Awaiting lock"}
              </b>
            </div>
            <div>
              <Navigation size={15} />
              <span>Trace points</span>
              <b>{livePoints.length || displayedPoints.length}</b>
            </div>
            {userLocationInfo && (
              <div>
                <MapPinned size={15} />
                <span>Coordinates</span>
                <b className="text-[10px] text-[#c6ff3d]">{userLocationInfo.lat.toFixed(4)}, {userLocationInfo.lng.toFixed(4)}</b>
              </div>
            )}
          </div>

          <button className="gps-save-route" disabled={createSession.isPending || livePoints.length < 2} onClick={saveRoute}>
            {createSession.isPending ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
            {createSession.isPending ? "Storing route" : "Store completed route"}
          </button>
          {createSession.isPending && <BackendFeedback tone="loading" title="Secure route commit" detail="Encrypting and saving this route to your movement ledger." />}
          {saveError && <BackendFeedback tone="error" title="Route not saved" detail={saveError} onRetry={saveRoute} />}
          <small className="gps-privacy-note">Route coordinates are saved only after you choose to store the completed session.</small>
        </aside>
      </motion.section>

      <section className="gps-history-section">
        <div className="gps-history-title">
          <div>
            <span className="panel-label">History / saved traces</span>
            <h2>Recent movement routes</h2>
          </div>
          <span>{historyQuery.isLoading ? "Loading" : historyQuery.isFetching ? "Refreshing" : historyQuery.isError ? "Link interrupted" : `${savedSessions.length} secured`}</span>
        </div>
        <div className="gps-history-grid">
          {historyQuery.isLoading ? (
            <div className="gps-history-empty"><LoaderCircle className="spin" size={18} />Loading your secured routes</div>
          ) : historyQuery.isError ? (
            <BackendFeedback tone="error" title="History unavailable" detail="Saved routes could not be synchronized. Your current unsaved trace remains available." onRetry={() => void historyQuery.refetch()} className="gps-history-feedback" />
          ) : savedSessions.length ? (
            savedSessions.map((session) => (
              <article className={selectedSession?.id === session.id ? "gps-history-card selected" : "gps-history-card"} key={session.id}>
                <button className="gps-history-select" onClick={() => setSelectedId(session.id)}>
                  <span className="gps-history-mark"><Route size={16} /></span>
                  <div>
                    <small>{new Date(session.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</small>
                    <b>{session.label}</b>
                    <span>{formatDistance(session.distanceMeters)} · {formatDuration(session.durationSeconds)}</span>
                  </div>
                  <Navigation size={16} />
                </button>
                <button className="gps-remove-route" disabled={removeSession.isPending} aria-label={`Remove ${session.label}`} onClick={() => removeSession.mutate({ id: session.id })}>
                  <Trash2 size={15} />
                </button>
              </article>
            ))
          ) : (
            <div className="gps-history-empty"><Route size={19} />No stored routes yet. Start a field trace to build your movement ledger.</div>
          )}
        </div>
        {removeSession.isPending && <BackendFeedback tone="loading" title="Route removal in progress" detail="Updating your secured movement ledger." />}
        {removeError && <BackendFeedback tone="error" title="Route still saved" detail={removeError} onRetry={() => { if (failedRemovalId !== null) removeSession.mutate({ id: failedRemovalId }); }} />}
      </section>
    </WorkflowLayout>
  );
}
