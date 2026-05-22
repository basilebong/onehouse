import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "../db/index.ts";
import { checkEmailAllowed } from "./check-email-allowed.ts";
import * as authSchema from "./schema.ts";

export type CreateAuthOptions = {
  db: Db;
  baseURL: string;
  secret: string;
  google: { clientId: string; clientSecret: string };
  allowedEmails: ReadonlySet<string>;
  useSecureCookies: boolean;
};

export const createAuth = (opts: CreateAuthOptions) =>
  betterAuth({
    appName: "Onehouse",
    baseURL: opts.baseURL,
    secret: opts.secret,

    database: drizzleAdapter(opts.db, {
      provider: "sqlite",
      usePlural: true,
      schema: authSchema,
    }),

    socialProviders: {
      google: {
        clientId: opts.google.clientId,
        clientSecret: opts.google.clientSecret,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 30,
      updateAge: 60 * 60 * 24,
      cookieCache: { enabled: true, maxAge: 60 * 5 },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            checkEmailAllowed(opts.allowedEmails, user.email);
          },
        },
      },
    },

    advanced: {
      cookiePrefix: "onehouse",
      useSecureCookies: opts.useSecureCookies,
    },
  });

export type Auth = ReturnType<typeof createAuth>;
