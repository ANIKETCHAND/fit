import { createExpressMiddleware } from "@trpc/server/adapters/express";
import express, { type Request, type Response, type NextFunction } from "express";
import { appRouter } from "../server/routers";
import { createContext } from "../server/_core/context";

const app = express();

// 1. Disable x-powered-by header to avoid information disclosure
app.disable("x-powered-by");

// 2. Prevent DoS via payload memory exhaustion: restrict payload limit to 1MB
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

// 3. Reject insecure HTTP methods (TRACE, TRACK)
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === "TRACE" || req.method === "TRACK") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  next();
});

// 4. tRPC API Route
app.use(
  "/api/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

// 5. Health check endpoint (explicitly typed)
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "fittrack-api", timestamp: new Date().toISOString() });
});

// 6. Global error handler: prevent stack trace exposure in responses
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: "Internal Server Error",
    code: "SERVER_ERROR",
  });
});

export default app;
