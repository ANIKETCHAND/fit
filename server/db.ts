import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  athleteProfiles,
  customIndianFoods,
  gpsSessions,
  metricEntries,
  nutritionEntries,
  streakRecords,
  userFavorites,
  users,
  workoutEntries,
  workoutSets,
  type InsertUser,
} from "../drizzle/schema";
import type { GpsSessionInput } from "../shared/fitness-contract";
import { ENV } from "./_core/env";
import { getSupabaseServerClient, isSupabaseConfigured } from "./supabase";

let _db: ReturnType<typeof drizzle> | null = null;

// In-memory fallback cache when no database is actively reachable
const _memoryNutrition: any[] = [];
const _memoryWorkouts: any[] = [];
const _memoryMetrics: any[] = [];
const _memoryGps: any[] = [];

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

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from("users").upsert(
        {
          open_id: user.openId,
          name: user.name || "Athlete",
          email: user.email || `${user.openId}@fittrack.local`,
          login_method: user.loginMethod || "custom",
          experience_level: user.experienceLevel || "beginner",
          role: user.role || (user.openId === ENV.ownerOpenId ? "admin" : "user"),
          last_signed_in: user.lastSignedIn ? new Date(user.lastSignedIn).toISOString() : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "open_id" }
      );
      return;
    } catch (err) {
      console.warn("[Supabase] upsertUser error:", err);
    }
  }

  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  (["name", "email", "loginMethod"] as const).forEach((field) => {
    if (user[field] !== undefined) {
      values[field] = user[field] ?? null;
      updateSet[field] = user[field] ?? null;
    }
  });
  if (user.experienceLevel !== undefined) {
    values.experienceLevel = user.experienceLevel;
    updateSet.experienceLevel = user.experienceLevel;
  }
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
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from("users").select("*").eq("open_id", openId).maybeSingle();
      if (data && !error) {
        return {
          id: Number(data.id),
          openId: data.open_id,
          name: data.name,
          email: data.email,
          loginMethod: data.login_method,
          experienceLevel: data.experience_level,
          role: data.role,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at),
          lastSignedIn: new Date(data.last_signed_in),
        } as any;
      }
    } catch (err) {
      console.warn("[Supabase] getUserByOpenId error:", err);
    }
  }

  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// Nutrition & Indian Foods
export async function listNutritionEntries(userId: number) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("nutrition_entries")
        .select("*")
        .order("consumed_at", { ascending: false })
        .limit(100);
      if (data && !error) {
        return data.map((d: any) => ({
          id: Number(d.id),
          userId,
          mealType: d.meal_type,
          label: d.label,
          hindiName: d.hindi_name,
          portionMultiplier: d.portion_multiplier ? String(d.portion_multiplier) : "1.00",
          servingSize: d.serving_size || "1 serving",
          calories: Number(d.calories),
          proteinGrams: String(d.protein_grams),
          carbGrams: String(d.carb_grams),
          fatGrams: String(d.fat_grams),
          isVeg: d.is_veg ? 1 : 0,
          consumedAt: new Date(d.consumed_at),
          createdAt: new Date(d.created_at),
        }));
      }
    } catch (err) {
      console.warn("[Supabase] listNutritionEntries error:", err);
    }
  }

  const db = await getDb();
  if (db) {
    return db.select().from(nutritionEntries).where(eq(nutritionEntries.userId, userId)).orderBy(desc(nutritionEntries.consumedAt)).limit(100);
  }
  return _memoryNutrition.filter((n) => n.userId === userId);
}

export async function createNutritionEntry(
  userId: number,
  entry: {
    mealType: string;
    label: string;
    hindiName?: string;
    portionMultiplier?: number;
    calories: number;
    proteinGrams: number;
    carbGrams: number;
    fatGrams: number;
    isVeg?: boolean;
    consumedAt: Date;
  }
) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from("nutrition_entries").insert({
        user_email: `user_${userId}@fittrack.local`,
        meal_type: entry.mealType,
        label: entry.label,
        hindi_name: entry.hindiName || null,
        portion_multiplier: entry.portionMultiplier || 1.0,
        serving_size: "1 serving",
        calories: entry.calories,
        protein_grams: entry.proteinGrams,
        carb_grams: entry.carbGrams,
        fat_grams: entry.fatGrams,
        is_veg: entry.isVeg !== false,
        consumed_at: entry.consumedAt.toISOString(),
      });
      return;
    } catch (err) {
      console.warn("[Supabase] createNutritionEntry error:", err);
    }
  }

  const db = await getDb();
  if (db) {
    await db.insert(nutritionEntries).values({
      userId,
      mealType: entry.mealType,
      label: entry.label,
      hindiName: entry.hindiName || null,
      portionMultiplier: (entry.portionMultiplier || 1.0).toFixed(2),
      calories: entry.calories,
      proteinGrams: entry.proteinGrams.toFixed(2),
      carbGrams: entry.carbGrams.toFixed(2),
      fatGrams: entry.fatGrams.toFixed(2),
      isVeg: entry.isVeg !== false ? 1 : 0,
      consumedAt: entry.consumedAt,
    });
  } else {
    _memoryNutrition.unshift({ id: Date.now(), userId, ...entry, createdAt: new Date() });
  }
}

export async function listCustomIndianFoods(userId: number) {
  const db = await getDb();
  if (db) {
    return db.select().from(customIndianFoods).where(eq(customIndianFoods.userId, userId)).orderBy(desc(customIndianFoods.createdAt));
  }
  return [];
}

// Workouts & Sets
export async function listWorkoutEntries(userId: number) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("workout_entries")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(60);
      if (data && !error) {
        return data.map((d: any) => ({
          id: Number(d.id),
          userId,
          title: d.title,
          focus: d.focus,
          movementCount: Number(d.movement_count),
          volumeKg: String(d.volume_kg),
          durationMinutes: Number(d.duration_minutes),
          completedAt: new Date(d.completed_at),
          createdAt: new Date(d.created_at),
        }));
      }
    } catch (err) {
      console.warn("[Supabase] listWorkoutEntries error:", err);
    }
  }

  const db = await getDb();
  if (db) {
    return db.select().from(workoutEntries).where(eq(workoutEntries.userId, userId)).orderBy(desc(workoutEntries.completedAt)).limit(60);
  }
  return _memoryWorkouts.filter((w) => w.userId === userId);
}

export async function createWorkoutEntry(
  userId: number,
  entry: {
    title: string;
    focus: string;
    movementCount: number;
    volumeKg: number;
    durationMinutes?: number;
    completedAt: Date;
  }
) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from("workout_entries").insert({
        user_email: `user_${userId}@fittrack.local`,
        title: entry.title,
        focus: entry.focus,
        movement_count: entry.movementCount,
        volume_kg: entry.volumeKg,
        duration_minutes: entry.durationMinutes || 45,
        completed_at: entry.completedAt.toISOString(),
      });
      return { success: true };
    } catch (err) {
      console.warn("[Supabase] createWorkoutEntry error:", err);
    }
  }

  const db = await getDb();
  if (db) {
    const res = await db.insert(workoutEntries).values({
      userId,
      title: entry.title,
      focus: entry.focus,
      movementCount: entry.movementCount,
      volumeKg: entry.volumeKg.toFixed(2),
      durationMinutes: entry.durationMinutes || 45,
      completedAt: entry.completedAt,
    });
    return res;
  }
  _memoryWorkouts.unshift({ id: Date.now(), userId, ...entry, createdAt: new Date() });
  return { success: true };
}

// Biometrics
export async function listMetricEntries(userId: number) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("metric_entries")
        .select("*")
        .order("captured_at", { ascending: false })
        .limit(90);
      if (data && !error) {
        return data.map((d: any) => ({
          id: Number(d.id),
          userId,
          weightKg: String(d.weight_kg),
          bodyFatPercent: d.body_fat_percent ? String(d.body_fat_percent) : null,
          notes: d.notes,
          capturedAt: new Date(d.captured_at),
          createdAt: new Date(d.created_at),
        }));
      }
    } catch (err) {
      console.warn("[Supabase] listMetricEntries error:", err);
    }
  }

  const db = await getDb();
  if (db) {
    return db.select().from(metricEntries).where(eq(metricEntries.userId, userId)).orderBy(desc(metricEntries.capturedAt)).limit(90);
  }
  return _memoryMetrics.filter((m) => m.userId === userId);
}

export async function createMetricEntry(userId: number, entry: { weightKg: number; bodyFatPercent?: number; notes?: string; capturedAt: Date }) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from("metric_entries").insert({
        user_email: `user_${userId}@fittrack.local`,
        weight_kg: entry.weightKg,
        body_fat_percent: entry.bodyFatPercent || null,
        notes: entry.notes || null,
        captured_at: entry.capturedAt.toISOString(),
      });
      return;
    } catch (err) {
      console.warn("[Supabase] createMetricEntry error:", err);
    }
  }

  const db = await getDb();
  if (db) {
    await db.insert(metricEntries).values({
      userId,
      weightKg: entry.weightKg.toFixed(2),
      bodyFatPercent: entry.bodyFatPercent ? entry.bodyFatPercent.toFixed(1) : null,
      notes: entry.notes || null,
      capturedAt: entry.capturedAt,
    });
  } else {
    _memoryMetrics.unshift({ id: Date.now(), userId, ...entry, createdAt: new Date() });
  }
}

// GPS Sessions
export async function listGpsSessions(userId: number) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("gps_sessions")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(40);
      if (data && !error) {
        return data.map((d: any) => ({
          id: Number(d.id),
          userId,
          label: d.label,
          startedAt: new Date(d.started_at),
          endedAt: new Date(d.ended_at),
          durationSeconds: Number(d.duration_seconds),
          distanceMeters: String(d.distance_meters),
          averageSpeedKph: String(d.average_speed_kph),
          routeJson: typeof d.route_json === "string" ? d.route_json : JSON.stringify(d.route_json),
          createdAt: new Date(d.created_at),
        }));
      }
    } catch (err) {
      console.warn("[Supabase] listGpsSessions error:", err);
    }
  }

  const db = await getDb();
  if (db) {
    return db.select().from(gpsSessions).where(eq(gpsSessions.userId, userId)).orderBy(desc(gpsSessions.startedAt)).limit(40);
  }
  return _memoryGps.filter((g) => g.userId === userId);
}

export async function createGpsSession(userId: number, session: GpsSessionInput) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from("gps_sessions").insert({
        user_email: `user_${userId}@fittrack.local`,
        label: session.label,
        started_at: session.startedAt.toISOString(),
        ended_at: session.endedAt.toISOString(),
        duration_seconds: session.durationSeconds,
        distance_meters: session.distanceMeters,
        average_speed_kph: session.averageSpeedKph,
        route_json: session.points,
      });
      return;
    } catch (err) {
      console.warn("[Supabase] createGpsSession error:", err);
    }
  }

  const db = await getDb();
  if (db) {
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
  } else {
    _memoryGps.unshift({ id: Date.now(), userId, ...session, createdAt: new Date() });
  }
}

export async function deleteGpsSession(userId: number, sessionId: number) {
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      await supabase.from("gps_sessions").delete().eq("id", sessionId);
      return;
    } catch (err) {
      console.warn("[Supabase] deleteGpsSession error:", err);
    }
  }

  const db = await getDb();
  if (db) {
    await db.delete(gpsSessions).where(and(eq(gpsSessions.id, sessionId), eq(gpsSessions.userId, userId)));
  } else {
    const idx = _memoryGps.findIndex((g) => g.id === sessionId && g.userId === userId);
    if (idx !== -1) _memoryGps.splice(idx, 1);
  }
}
