import { createAuth, createDb, parseAllowedEmails } from "@onehouse/core/server";
import { parseRuntimeEnv } from "@onehouse/core/shared";
import { createApp } from "./composition.ts";

const env = parseRuntimeEnv(process.env);

const db = createDb({ path: env.DATABASE_PATH });

const auth = createAuth({
  db,
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  google: { clientId: env.GOOGLE_ID, clientSecret: env.GOOGLE_SECRET },
  allowedEmails: parseAllowedEmails(env.ONEHOUSE_ALLOWED_EMAILS),
  useSecureCookies: process.env.NODE_ENV === "production",
});

const app = createApp({ auth, baseURL: env.BETTER_AUTH_URL });

Bun.serve({ port: env.PORT, fetch: app.fetch });

console.info(`onehouse server listening on http://localhost:${env.PORT}`);
