import type { CleanupScheduler, GroceryService } from "@onehouse/app-grocery/server";
import { createGroceryRoutes } from "@onehouse/app-grocery/server";
import { type Auth, createRequireSession } from "@onehouse/core/server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";

const isValidationError = (err: unknown): boolean =>
  err instanceof Error && err.name === "ValiError";

export type ComposeOptions = {
  auth: Auth;
  baseURL: string;
  grocery: {
    service: GroceryService;
    cleanup: CleanupScheduler;
  };
};

export const createApp = ({ auth, baseURL, grocery }: ComposeOptions) =>
  new Hono()
    .use("*", logger())
    .use("*", secureHeaders())
    .use("/api/*", cors({ origin: baseURL, credentials: true }))
    .get("/healthz", (c) => c.json({ ok: true }))
    .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
    .use("/api/*", createRequireSession(auth))
    .get("/api/me", (c) => c.json({ user: c.get("user") }))
    .route("/api/grocery", createGroceryRoutes(grocery))
    .onError((err, c) => {
      if (isValidationError(err)) {
        return c.json({ kind: "invalid_input", message: "Invalid input" }, 400);
      }
      console.error("unhandled route error", err);
      return c.json({ kind: "internal_error" }, 500);
    });

export type AppType = ReturnType<typeof createApp>;
