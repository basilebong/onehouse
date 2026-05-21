import { parseEnv } from "@onehouse/core/shared";
import { app } from "./composition.ts";

const env = parseEnv(process.env);

Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.info(`onehouse server listening on http://localhost:${env.PORT}`);
