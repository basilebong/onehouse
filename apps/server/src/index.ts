import { app } from "./composition.ts";

const port = Number(process.env.PORT ?? 3000);

Bun.serve({
  port,
  fetch: app.fetch,
});

// biome-ignore lint/suspicious/noConsoleLog: server boot banner
console.log(`onehouse server listening on http://localhost:${port}`);
