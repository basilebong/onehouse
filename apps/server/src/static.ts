// Static React assets served from apps/web/dist via Hono's serveStatic.
// MUST be mounted LAST so the catch-all doesn't shadow /api/* or /mcp.

import { Hono } from "hono";
// import { serveStatic } from "hono/bun";

export const mountStatic = () =>
  new Hono().get("/*", (c) => c.text("static serving not yet wired", 501));
// .use("/*", serveStatic({ root: "./apps/web/dist" }))
// .get("/*", serveStatic({ path: "./apps/web/dist/index.html" }));
