import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const readSource = (relativePath: string) => readFileSync(resolve(projectRoot, relativePath), "utf8");

describe("FitTrack navigation and activity frontend contracts", () => {
  it("keeps every sidebar destination available after full-stack upgrades", () => {
    const sidebar = readSource("client/src/components/navigation/Sidebar.tsx");
    ["/", "/exercise-library", "/log-food", "/log-weight", "/gps", "/achievements", "/notifications", "/profile", "/settings", "/support"].forEach((path) => {
      expect(sidebar).toContain(`"${path}"`);
    });
  });

  it("preserves the typed mutation and GPS-resilience affordances in the visible workflows", () => {
    const nutrition = readSource("client/src/pages/LogFood.tsx");
    const metrics = readSource("client/src/pages/LogWeight.tsx");
    const workout = readSource("client/src/pages/LogWorkout.tsx");
    const gps = readSource("client/src/pages/GpsTracker.tsx");
    const map = readSource("client/src/components/Map.tsx");

    expect(nutrition).toContain("trpc.nutrition.create.useMutation");
    expect(metrics).toContain("trpc.metrics.create.useMutation");
    expect(workout).toContain("trpc.workouts.create.useMutation");
    expect(gps).toContain("trpc.gps.create.useMutation");
    expect(gps).toContain("navigator.geolocation.getCurrentPosition");
    expect(gps).toContain("Location permission is required to begin a live trace.");
    expect(gps).toContain("GPS signal was interrupted.");
    expect(gps).toContain("No stored routes yet.");
    expect(gps).toContain("The route could not be saved.");
    expect(gps).toContain("The saved route could not be removed.");
    expect(map).toContain("map-service-unavailable");
  });
});
