import { COOKIE_NAME } from "@shared/const";
import { metricEntryInput, gpsSessionInput, nutritionEntryInput, routePointSchema, workoutEntryInput } from "../shared/fitness-contract";
import { createGpsSession, createMetricEntry, createNutritionEntry, createWorkoutEntry, deleteGpsSession, listGpsSessions, listMetricEntries, listNutritionEntries, listWorkoutEntries } from "./db";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";

function parseStoredRoute(routeJson: string) {
  const parsed = z.array(routePointSchema).safeParse(JSON.parse(routeJson));
  return parsed.success ? parsed.data : [];
}

export const appRouter = router({
  system: systemRouter,
  health: publicProcedure.query(() => ({ ok: true, service: "fittrack-api" as const, checkedAt: new Date() })),
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      if (typeof (ctx.res as any)?.clearCookie === "function") {
        (ctx.res as any).clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      }
      return { success: true } as const;
    }),
  }),
  nutrition: router({
    list: protectedProcedure.query(({ ctx }) => listNutritionEntries(ctx.user.id)),
    create: protectedProcedure.input(nutritionEntryInput).mutation(async ({ ctx, input }) => {
      await createNutritionEntry(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  metrics: router({
    list: protectedProcedure.query(({ ctx }) => listMetricEntries(ctx.user.id)),
    create: protectedProcedure.input(metricEntryInput).mutation(async ({ ctx, input }) => {
      await createMetricEntry(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  workouts: router({
    list: protectedProcedure.query(({ ctx }) => listWorkoutEntries(ctx.user.id)),
    create: protectedProcedure.input(workoutEntryInput).mutation(async ({ ctx, input }) => {
      await createWorkoutEntry(ctx.user.id, input);
      return { success: true } as const;
    }),
  }),
  gps: router({
    list: protectedProcedure.query(async ({ ctx }) => (await listGpsSessions(ctx.user.id)).map((session) => ({
      ...session,
      distanceMeters: Number(session.distanceMeters),
      averageSpeedKph: Number(session.averageSpeedKph),
      points: parseStoredRoute(session.routeJson),
    }))),
    create: protectedProcedure.input(gpsSessionInput).mutation(async ({ ctx, input }) => {
      await createGpsSession(ctx.user.id, input);
      return { success: true } as const;
    }),
    remove: protectedProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await deleteGpsSession(ctx.user.id, input.id);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
