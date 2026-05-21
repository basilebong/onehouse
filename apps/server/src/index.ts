import { app } from "./composition.ts";

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  fetch: app.fetch,
});

console.info(`onehouse server listening on http://localhost:${port}`);
