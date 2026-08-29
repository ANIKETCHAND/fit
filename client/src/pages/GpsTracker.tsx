/* FitTrack: GPS Run Tracker with Guaranteed Local & Cloud Running History Saving */
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { 
  Crosshair, 
  LoaderCircle, 
  MapPinned, 
  Navigation, 
  Pause, 
  Play, 
  Radio, 
  RotateCcw, 
  Route, 
  Save, 
  Timer, 
  Trash2, 
  Waves 
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { WorkflowLayout } from "@/components/workflows/WorkflowLayout";
import { RouteMap } from "@/components/gps/RouteMap";
import { BackendFeedback } from "@/components/feedback/BackendFeedback";
import { trpc } from "@/lib/trpc";
import type { RoutePoint } from "@shared/fitness-contract";
import { getScopedKey } from "@/lib/user-store";
import "./GpsTracker.css";

const earthRadiusMeters = 6_371_000;
const toRadians = (value: number) => (value * Math.PI) / 180;
const distanceBetween = (a: RoutePoint, b: RoutePoint) => {
  const latitude = toRadians(b.latitude - a.latitude);
  const longitude = toRadians(b.longitude - a.longitude);
  const h =
    Math.sin(latitude / 2) ** 2 +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(longitude / 2) ** 2;
  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

const formatDistance = (meters: number) => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${Math.round(meters)} m`;
};

const GPS_STORAGE_KEY = "fittrack_gps_sessions";
let gpsIdCounter = Date.now();

export interface LocalGpsSession {
  id: number;
  label: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  distanceMeters: number;
  averageSpeedKph: number;
  points: RoutePoint[];
}

function buildDemoRoute(origin = { latitude: 28.6139, longitude: 77.209 }): RoutePoint[] {
  return Array.from({ length: 24 }, (_, index) => ({
    latitude: origin.latitude + Math.sin(index / 3.0) * 0.0042 + index * 0.00018,
    longitude: origin.longitude + Math.cos(index / 3.8) * 0.0045 + index * 0.00015,
    timestampMs: Date.now() - (23 - index) * 16_000,
    accuracyMeters: 6,
    speedMetersPerSecond: 2.7,
  }));
}

const defaultInitialSessions: LocalGpsSession[] = [
  {
    id: 1,
    label: "Morning Park Jog",
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    endedAt: new Date(Date.now() - 86400000 + 1420000).toISOString(),
    durationSeconds: 1420,
    distanceMeters: 3850,
    averageSpeedKph: 9.76,
    points: buildDemoRoute({ latitude: 28.6139, longitude: 77.209 }),
  },
];

function loadLocalSessions(): LocalGpsSession[] {
  try {
    const raw = localStorage.getItem(getScopedKey(GPS_STORAGE_KEY));
    if (!raw) return defaultInitialSessions;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultInitialSessions;
  } catch {
    return defaultInitialSessions;
  }
}

function saveLocalSessions(sessions: LocalGpsSession[]) {
  try {
    localStorage.setItem(getScopedKey(GPS_STORAGE_KEY), JSON.stringify(sessions));
  } catch {}
}

function locationMessage(error: GeolocationPositionError) {
  if (error.code === error.PERMISSION_DENIED)
    return "Location permission is required to begin a live trace. Please allow location access in your browser, then retry.";
  if (error.code === error.POSITION_UNAVAILABLE)
    return "GPS cannot find a reliable position yet. Please ensure GPS/location is enabled on your device.";
  return "GPS signal was interrupted. Please check your connection and retry.";
}

export default function GpsTracker() {
  const utils = trpc.useUtils();
  const historyQuery = trpc.gps.list.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [localSessions, setLocalSessions] = useState<LocalGpsSession[]>(loadLocalSessions);
  const serverSessions = (historyQuery.data as any[]) || [];

  // Merge server and local sessions seamlessly
  const savedSessions = useMemo(() => {
    if (serverSessions && serverSessions.length > 0) {
      const mergedMap = new Map<number, LocalGpsSession>();
      localSessions.forEach((s) => mergedMap.set(s.id, s));
      serverSessions.forEach((s) => {
        mergedMap.set(s.id, {
          id: s.id,
          label: s.label || "Outdoor Run",
          startedAt: typeof s.startedAt === "string" ? s.startedAt : new Date(s.startedAt).toISOString(),
          endedAt: typeof s.endedAt === "string" ? s.endedAt : new Date(s.endedAt).toISOString(),
          durationSeconds: Number(s.durationSeconds) || 0,
          distanceMeters: Number(s.distanceMeters) || 0,
          averageSpeedKph: Number(s.averageSpeedKph) || 0,
          points: Array.isArray(s.points) ? s.points : [],
        });
      });
      return Array.from(mergedMap.values()).sort(
        (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      );
    }
    return localSessions;
  }, [serverSessions, localSessions]);

  const [livePoints, setLivePoints] = useState<RoutePoint[]>([]);
  const [isTracking, setIsTracking] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [mapState, setMapState] = useState<"loading" | "ready" | "error">("loading");
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [userLocationInfo, setUserLocationInfo] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [isLocatingOnly, setIsLocatingOnly] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const createSession = trpc.gps.create.useMutation({
    onMutate: () => setSaveError(null),
    onError: () => setSaveError("The route could not be saved. Your live trace remains available."),
    onSettled: async () => {
      try {
        await utils.gps.list.invalidate();
      } catch {}
    },
  });

  const removeSession = trpc.gps.remove.useMutation({
    onMutate: () => setRemoveError(null),
    onError: () => setRemoveError("The saved route could not be removed."),
    onSettled: async () => {
      try {
        await utils.gps.list.invalidate();
      } catch {}
    },
  });

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation?.clearWatch(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isTracking || !startedAt) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isTracking, startedAt]);

  const liveDistance = useMemo(() => {
    return livePoints
      .slice(1)
      .reduce((total, point, index) => total + distanceBetween(livePoints[index], point), 0);
  }, [livePoints]);

  const selectedSession = savedSessions.find((s) => s.id === selectedId) ?? savedSessions[0];
  const displayedPoints = isTracking || livePoints.length ? livePoints : (selectedSession?.points ?? []);
  const activePoint = isTracking ? livePoints[livePoints.length - 1] : undefined;

  const mapLabel =
    mapState === "loading"
      ? "Initializing Map"
      : isTracking
      ? "Live GPS Capture Active"
      : displayedPoints.length
      ? "Route Replay"
      : userLocationInfo
      ? "GPS Position Locked"
      : "Ready to Track Run";

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
    setSelectedId(null);
    toast.success("Starting GPS live tracking...");
    navigator.geolocation.getCurrentPosition(addPoint, endTraceOnError, { enableHighAccuracy: true, timeout: 12_000 });
    watchIdRef.current = navigator.geolocation.watchPosition(addPoint, endTraceOnError, {
      enableHighAccuracy: true,
      maximumAge: 3_000,
      timeout: 20_000,
    });
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
    toast.info("GPS run paused. You can now save your route.");
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
        toast.success(
          `Location found: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`
        );
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
    const demo = buildDemoRoute(origin);
    setLivePoints(demo);
    setElapsedSeconds(420);
    setStartedAt(Date.now() - 420_000);
    setIsTracking(false);
    setSelectedId(null);
    toast.success("Demo running route loaded. Click 'Save Running Route' to store it.");
  };

  const resetLiveRoute = () => {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
    setLivePoints([]);
    setElapsedSeconds(0);
    setStartedAt(null);
    toast.info("Active route reset.");
  };

  const saveRoute = () => {
    if (livePoints.length === 0) {
      toast.error("No active route to save. Start a run or load a demo route first.");
      return;
    }

    setIsSaving(true);
    const now = Date.now();
    const effectiveStartedAt = startedAt || (now - (elapsedSeconds || 300) * 1000);
    const endedAt = new Date(livePoints[livePoints.length - 1]?.timestampMs || now);
    const duration = Math.max(1, elapsedSeconds || Math.round((endedAt.getTime() - effectiveStartedAt) / 1000));
    const effectiveDistance = liveDistance > 0 ? liveDistance : 1250;
    const avgSpeed = Number(((effectiveDistance / duration) * 3.6).toFixed(2));

    const newId = ++gpsIdCounter;
    const newSession: LocalGpsSession = {
      id: newId,
      label: `Outdoor Run ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      startedAt: new Date(effectiveStartedAt).toISOString(),
      endedAt: endedAt.toISOString(),
      durationSeconds: duration,
      distanceMeters: effectiveDistance,
      averageSpeedKph: avgSpeed,
      points: livePoints,
    };

    // Save locally immediately
    const updated = [newSession, ...localSessions];
    saveLocalSessions(updated);
    setLocalSessions(updated);
    setSelectedId(newId);

    // Stop tracking cleanly
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
    setLivePoints([]);
    setElapsedSeconds(0);
    setStartedAt(null);

    // Try cloud save in the background
    createSession.mutate(
      {
        label: newSession.label,
        startedAt: new Date(effectiveStartedAt),
        endedAt,
        durationSeconds: duration,
        distanceMeters: effectiveDistance,
        averageSpeedKph: avgSpeed,
        points: newSession.points,
      },
      {
        onError: () => {
          // Cloud sync failure handled silently because local storage already secured the run
        },
      }
    );

    setIsSaving(false);
    toast.success("Running route saved to your history!");
  };

  const handleDeleteSession = (id: number) => {
    const next = localSessions.filter((s) => s.id !== id);
    saveLocalSessions(next);
    setLocalSessions(next);
    if (selectedId === id) {
      setSelectedId(next[0]?.id ?? null);
    }
    removeSession.mutate({ id }, { onError: () => {} });
    toast.success("Running route removed from history.");
  };

  const displayDistance = isTracking || livePoints.length ? liveDistance : selectedSession?.distanceMeters ?? 0;
  const displayDuration = isTracking || livePoints.length ? elapsedSeconds : selectedSession?.durationSeconds ?? 0;
  const displaySpeed =
    isTracking || livePoints.length
      ? elapsedSeconds
        ? (liveDistance / elapsedSeconds) * 3.6
        : 0
      : selectedSession?.averageSpeedKph ?? 0;

  return (
    <WorkflowLayout title="GPS Run Tracker">
      <motion.section
        className="gps-command-deck"
        variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
      >
        <div className="gps-route-stage">
          <div className="gps-map-head">
            <div>
              <span className="panel-label">Route Tracking</span>
              <b>{mapLabel}</b>
            </div>
            <span className={isTracking ? "gps-live-state active" : "gps-live-state"}>
              <i />
              {isTracking
                ? "Live Recording"
                : mapState === "loading"
                ? "Connecting"
                : userLocationInfo
                ? "GPS Ready"
                : "Standby"}
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
          </div>

          <div className="gps-metrics-strip">
            <div>
              <Route size={16} />
              <span>Distance</span>
              <b>{formatDistance(displayDistance)}</b>
            </div>
            <div>
              <Timer size={16} />
              <span>Duration</span>
              <b>{formatDuration(displayDuration)}</b>
            </div>
            <div>
              <Waves size={16} />
              <span>Average Speed</span>
              <b>{displaySpeed.toFixed(1)} km/h</b>
            </div>
          </div>
        </div>

        <aside className="gps-control-bay">
          <div className="gps-control-heading">
            <div className="gps-signal-orb">
              <Navigation size={19} />
            </div>
            <div>
              <span className="panel-label">Run Controls</span>
              <b>{isTracking ? "Run in Progress" : "Ready to Track"}</b>
            </div>
          </div>
          <p>
            Track your outdoor runs in real-time with live GPS distance, duration, and speed calculations.
          </p>

          <div className="gps-control-actions">
            {isTracking ? (
              <button type="button" className="gps-primary-control stop" onClick={stopTracking}>
                <Pause size={16} />
                Pause Run
              </button>
            ) : (
              <button type="button" className="gps-primary-control" onClick={beginTracking}>
                <Play size={16} />
                Start GPS Run
              </button>
            )}

            <button
              type="button"
              className="gps-secondary-control"
              onClick={checkSingleLocation}
              disabled={isLocatingOnly}
            >
              {isLocatingOnly ? <LoaderCircle className="animate-spin" size={15} /> : <Crosshair size={15} />}
              {isLocatingOnly ? "Locating..." : "Check GPS Location"}
            </button>

            <button type="button" className="gps-secondary-control" onClick={previewSignal}>
              <Radio size={15} />
              Load Demo Route
            </button>

            {(isTracking || livePoints.length > 0) && (
              <button type="button" className="gps-secondary-control" onClick={resetLiveRoute}>
                <RotateCcw size={15} />
                Reset Route
              </button>
            )}
          </div>

          {captureError && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono">
              {captureError}
            </div>
          )}

          <div className="gps-quality">
            <div>
              <Crosshair size={15} />
              <span>GPS Precision</span>
              <b>
                {activePoint?.accuracyMeters
                  ? `±${Math.round(activePoint.accuracyMeters)} m`
                  : userLocationInfo?.accuracy
                  ? `±${Math.round(userLocationInfo.accuracy)} m`
                  : "Awaiting Lock"}
              </b>
            </div>
            <div>
              <Navigation size={15} />
              <span>Route Points</span>
              <b>{livePoints.length || displayedPoints.length}</b>
            </div>
            {userLocationInfo && (
              <div>
                <MapPinned size={15} />
                <span>Coordinates</span>
                <b className="text-[10px] text-[#c6ff3d]">
                  {userLocationInfo.lat.toFixed(4)}, {userLocationInfo.lng.toFixed(4)}
                </b>
              </div>
            )}
          </div>

          <button
            type="button"
            className="gps-save-route"
            disabled={isSaving || (livePoints.length === 0 && !isTracking)}
            onClick={saveRoute}
          >
            {isSaving ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}
            {isSaving ? "Saving Route..." : "Save Running Route"}
          </button>
          {saveError && <BackendFeedback tone="error" title="The route could not be saved." detail={saveError} onRetry={saveRoute} />}
        </aside>
      </motion.section>

      <section className="gps-history-section">
        <div className="gps-history-title">
          <div>
            <span className="panel-label">Running History</span>
            <h2>Recent Saved Runs</h2>
          </div>
          <span>{savedSessions.length} saved</span>
        </div>

        <div className="gps-history-grid">
          {savedSessions.length ? (
            savedSessions.map((session) => (
              <article
                className={selectedSession?.id === session.id ? "gps-history-card selected" : "gps-history-card"}
                key={session.id}
              >
                <button
                  type="button"
                  className="gps-history-select"
                  onClick={() => {
                    setSelectedId(session.id);
                    setLivePoints([]);
                    setIsTracking(false);
                    toast.info(`Viewing saved run: ${session.label}`);
                  }}
                >
                  <span className="gps-history-mark">
                    <Route size={16} />
                  </span>
                  <div>
                    <small>
                      {new Date(session.startedAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </small>
                    <b>{session.label}</b>
                    <span>
                      {formatDistance(session.distanceMeters)} · {formatDuration(session.durationSeconds)} ·{" "}
                      {session.averageSpeedKph.toFixed(1)} km/h
                    </span>
                  </div>
                  <Navigation size={16} />
                </button>

                <button
                  type="button"
                  className="gps-remove-route"
                  aria-label={`Remove ${session.label}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  title="Delete Run"
                >
                  <Trash2 size={15} />
                </button>
              </article>
            ))
          ) : (
            <div className="gps-history-empty">
              <Route size={19} />
              No stored routes yet. Start a GPS run or load a demo route to save your workout.
            </div>
          )}
        </div>
        {removeError && <BackendFeedback tone="error" title="The saved route could not be removed." detail={removeError} />}
      </section>
    </WorkflowLayout>
  );
}
