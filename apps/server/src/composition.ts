import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
// import { cors } from "hono/cors";
// import { auth } from "@onehouse/core/server";
// import { requireSession } from "@onehouse/core/server";
// import { groceryRoutes } from "@onehouse/app-grocery/server";
// import { mountMcp } from "./mcp.ts";
// import { mountStatic } from "./static.ts";

// Composition root for the single Bun process. Mount order matters:
//   1. Better Auth handler (/api/auth/*) BEFORE session middleware
//   2. /api/* (session-gated)
//   3. /mcp  (API-key-gated)
//   4. /*    (static React — catch-all LAST)
//
// Per .claude/CLAUDE.md rule 8, app-specific routes live in the relevant
// packages/app-*; this file only wires them. Adding a new app = one .route()
// line here and one call inside mountMcp.

export const app = new Hono()
  .use("*", logger())
  .use("*", secureHeaders())
  .get("/healthz", (c) => c.json({ ok: true }));
// .on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))
// .use("/api/*", cors({ origin: [process.env.BETTER_AUTH_URL!], credentials: true }))
// .use("/api/*", requireSession)
// .route("/api/grocery", groceryRoutes)
// .route("/mcp", mountMcp())
// .route("/", mountStatic());

export type AppType = typeof app;
