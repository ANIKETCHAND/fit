import { decimal, index, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const nutritionEntries = mysqlTable("nutrition_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealType: varchar("mealType", { length: 32 }).notNull(),
  label: varchar("label", { length: 180 }).notNull(),
  calories: int("calories").notNull(),
  proteinGrams: decimal("proteinGrams", { precision: 7, scale: 2 }).notNull(),
  carbGrams: decimal("carbGrams", { precision: 7, scale: 2 }).notNull(),
  fatGrams: decimal("fatGrams", { precision: 7, scale: 2 }).notNull(),
  consumedAt: timestamp("consumedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("nutrition_entries_user_date_idx").on(table.userId, table.consumedAt)]);

export const metricEntries = mysqlTable("metric_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  weightKg: decimal("weightKg", { precision: 6, scale: 2 }).notNull(),
  capturedAt: timestamp("capturedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("metric_entries_user_date_idx").on(table.userId, table.capturedAt)]);

export const workoutEntries = mysqlTable("workout_entries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 180 }).notNull(),
  focus: varchar("focus", { length: 120 }).notNull(),
  movementCount: int("movementCount").notNull(),
  volumeKg: decimal("volumeKg", { precision: 11, scale: 2 }).notNull(),
  completedAt: timestamp("completedAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("workout_entries_user_date_idx").on(table.userId, table.completedAt)]);

export const gpsSessions = mysqlTable("gps_sessions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 180 }).notNull(),
  startedAt: timestamp("startedAt").notNull(),
  endedAt: timestamp("endedAt").notNull(),
  durationSeconds: int("durationSeconds").notNull(),
  distanceMeters: decimal("distanceMeters", { precision: 12, scale: 2 }).notNull(),
  averageSpeedKph: decimal("averageSpeedKph", { precision: 7, scale: 2 }).notNull(),
  routeJson: text("routeJson").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => [index("gps_sessions_user_date_idx").on(table.userId, table.startedAt)]);
