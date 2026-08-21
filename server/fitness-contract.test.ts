import { describe, expect, it } from "vitest";
import { gpsSessionInput, nutritionEntryInput } from "../shared/fitness-contract";

describe("FitTrack activity contracts", () => {
  it("accepts a completed GPS route with valid ordered telemetry", () => {
    const startedAt = new Date("2026-08-21T06:00:00.000Z");
    const result = gpsSessionInput.safeParse({
      label: "Morning calibration walk",
      startedAt,
      endedAt: new Date("2026-08-21T06:18:00.000Z"),
      durationSeconds: 1080,
      distanceMeters: 1420.5,
      averageSpeedKph: 4.7,
      points: [
        { latitude: 28.6139, longitude: 77.209, timestampMs: startedAt.getTime() },
        { latitude: 28.6141, longitude: 77.2095, timestampMs: startedAt.getTime() + 30_000 },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid macro totals and routes that finish before they begin", () => {
    expect(nutritionEntryInput.safeParse({
      mealType: "Lunch", label: "Fuel", calories: 400, proteinGrams: -2, carbGrams: 50, fatGrams: 10, consumedAt: new Date(),
    }).success).toBe(false);

    expect(gpsSessionInput.safeParse({
      label: "Invalid route", startedAt: new Date("2026-08-21T08:00:00.000Z"), endedAt: new Date("2026-08-21T07:00:00.000Z"),
      durationSeconds: 600, distanceMeters: 700, averageSpeedKph: 4.2,
      points: [
        { latitude: 28.61, longitude: 77.2, timestampMs: 1 },
        { latitude: 28.62, longitude: 77.21, timestampMs: 2 },
      ],
    }).success).toBe(false);
  });
});
