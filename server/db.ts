import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { gpsSessions, metricEntries, nutritionEntries, users, workoutEntries, type InsertUser } from "../drizzle/schema";
import type { GpsSessionInput } from "../shared/fitness-contract";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("FitTrack storage is unavailable. Please try again shortly.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (['name', 'email', 'loginMethod'] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  values.lastSignedIn = user.lastSignedIn ?? new Date();
  updateSet.lastSignedIn = values.lastSignedIn;
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function listNutritionEntries(userId: number) {
  const db = await requireDb();
  return db.select().from(nutritionEntries).where(eq(nutritionEntries.userId, userId)).orderBy(desc(nutritionEntries.consumedAt)).limit(60);
}

export async function createNutritionEntry(userId: number, entry: {
  mealType: string; label: string; calories: number; proteinGrams: number; carbGrams: number; fatGrams: number; consumedAt: Date;
}) {
  const db = await requireDb();
  await db.insert(nutritionEntries).values({ ...entry, userId, proteinGrams: entry.proteinGrams.toFixed(2), carbGrams: entry.carbGrams.toFixed(2), fatGrams: entry.fatGrams.toFixed(2) });
}

export async function listMetricEntries(userId: number) {
  const db = await requireDb();
  return db.select().from(metricEntries).where(eq(metricEntries.userId, userId)).orderBy(desc(metricEntries.capturedAt)).limit(90);
}

export async function createMetricEntry(userId: number, entry: { weightKg: number; capturedAt: Date }) {
  const db = await requireDb();
  await db.insert(metricEntries).values({ ...entry, userId, weightKg: entry.weightKg.toFixed(2) });
}

export async function listWorkoutEntries(userId: number) {
  const db = await requireDb();
  return db.select().from(workoutEntries).where(eq(workoutEntries.userId, userId)).orderBy(desc(workoutEntries.completedAt)).limit(60);
}

export async function createWorkoutEntry(userId: number, entry: { title: string; focus: string; movementCount: number; volumeKg: number; completedAt: Date }) {
  const db = await requireDb();
  await db.insert(workoutEntries).values({ ...entry, userId, volumeKg: entry.volumeKg.toFixed(2) });
}

export async function listGpsSessions(userId: number) {
  const db = await requireDb();
  return db.select().from(gpsSessions).where(eq(gpsSessions.userId, userId)).orderBy(desc(gpsSessions.startedAt)).limit(40);
}

export async function createGpsSession(userId: number, session: GpsSessionInput) {
  const db = await requireDb();
  await db.insert(gpsSessions).values({
    userId,
    label: session.label,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    durationSeconds: session.durationSeconds,
    distanceMeters: session.distanceMeters.toFixed(2),
    averageSpeedKph: session.averageSpeedKph.toFixed(2),
    routeJson: JSON.stringify(session.points),
  });
}

export async function deleteGpsSession(userId: number, sessionId: number) {
  const db = await requireDb();
  await db.delete(gpsSessions).where(and(eq(gpsSessions.id, sessionId), eq(gpsSessions.userId, userId)));
}
