import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createNutritionEntry: vi.fn(),
  createMetricEntry: vi.fn(),
  createWorkoutEntry: vi.fn(),
  createGpsSession: vi.fn(),
  deleteGpsSession: vi.fn(),
  listNutritionEntries: vi.fn(() => []),
  listMetricEntries: vi.fn(() => []),
  listWorkoutEntries: vi.fn(() => []),
  listGpsSessions: vi.fn(() => []),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

const user = {
  id: 42,
  openId: "fittrack-test-athlete",
  email: "athlete@example.com",
  name: "Test Athlete",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createContext(): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("FitTrack activity router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("persists nutrition, biometric, and workout signals under the authenticated athlete", async () => {
    const caller = appRouter.createCaller(createContext());
    const capturedAt = new Date("2026-08-21T06:00:00.000Z");

    await caller.nutrition.create({ mealType: "Lunch", label: "Calibration bowl", calories: 520, proteinGrams: 37, carbGrams: 58, fatGrams: 14, consumedAt: capturedAt });
    await caller.metrics.create({ weightKg: 74.8, capturedAt });
    await caller.workouts.create({ title: "Chest protocol", focus: "Pectorals", movementCount: 3, volumeKg: 1240, completedAt: capturedAt });

    expect(dbMocks.createNutritionEntry).toHaveBeenCalledWith(user.id, expect.objectContaining({ label: "Calibration bowl" }));
    expect(dbMocks.createMetricEntry).toHaveBeenCalledWith(user.id, expect.objectContaining({ weightKg: 74.8 }));
    expect(dbMocks.createWorkoutEntry).toHaveBeenCalledWith(user.id, expect.objectContaining({ title: "Chest protocol" }));
  });

  it("creates, lists, and athlete-scopes a completed GPS route", async () => {
    const caller = appRouter.createCaller(createContext());
    const startedAt = new Date("2026-08-21T06:00:00.000Z");
    const route = {
      label: "Morning calibration route",
      startedAt,
      endedAt: new Date("2026-08-21T06:15:00.000Z"),
      durationSeconds: 900,
      distanceMeters: 1210,
      averageSpeedKph: 4.8,
      points: [
        { latitude: 28.6139, longitude: 77.209, timestampMs: startedAt.getTime() },
        { latitude: 28.6145, longitude: 77.2098, timestampMs: startedAt.getTime() + 45_000 },
      ],
    };

    await caller.gps.create(route);
    await caller.gps.remove({ id: 7 });

    expect(dbMocks.createGpsSession).toHaveBeenCalledWith(user.id, expect.objectContaining({ label: route.label, points: route.points }));
    expect(dbMocks.deleteGpsSession).toHaveBeenCalledWith(user.id, 7);
  });
});
