import { describe, expect, test } from "bun:test";
import { withTestAuth } from "@onehouse/core/server/test";
import { createApp } from "./composition.ts";

describe("composition", () => {
  test("GET /healthz returns ok", async () => {
    await withTestAuth({}, async ({ auth }) => {
      const app = createApp({ auth, baseURL: "http://localhost:5173" });
      const res = await app.request("/healthz");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({ ok: true });
    });
  });

  test("GET /api/auth/get-session returns 200 with null for anonymous request", async () => {
    await withTestAuth({}, async ({ auth }) => {
      const app = createApp({ auth, baseURL: "http://localhost:5173" });
      const res = await app.request("/api/auth/get-session");
      expect(res.status).toBe(200);
      expect(await res.json()).toBeNull();
    });
  });

  test("GET /api/me without a session returns 401", async () => {
    await withTestAuth({}, async ({ auth }) => {
      const app = createApp({ auth, baseURL: "http://localhost:5173" });
      const res = await app.request("/api/me");
      expect(res.status).toBe(401);
      expect(await res.json()).toEqual({ error: "unauthorized" });
    });
  });

  test("GET /api/me with a valid session returns the user", async () => {
    await withTestAuth(
      { allowedEmails: "basile@example.com" },
      async ({ auth, signSessionCookie }) => {
        const ctx = await auth.$context;
        const user = await ctx.internalAdapter.createUser({
          name: "Basile",
          email: "basile@example.com",
        });
        const sessionRow = await ctx.internalAdapter.createSession(user.id);
        const signed = await signSessionCookie(sessionRow.token);

        const app = createApp({ auth, baseURL: "http://localhost:5173" });
        const res = await app.request("/api/me", {
          headers: { cookie: `onehouse.session_token=${signed}` },
        });

        expect(res.status).toBe(200);
        expect(await res.json()).toMatchObject({
          user: { id: user.id, email: "basile@example.com" },
        });
      },
    );
  });

  test("Google OAuth callback for a non-allowlisted email is rejected", async () => {
    await withTestAuth({ allowedEmails: "basile@example.com" }, async ({ auth, db }) => {
      const ctx = await auth.$context;
      await expect(
        ctx.internalAdapter.createUser({
          name: "Stranger",
          email: "stranger@example.com",
        }),
      ).rejects.toThrow(/allowlist/);

      const userCount = db.$client.query("SELECT COUNT(*) AS n FROM users").get();
      expect(userCount).toEqual({ n: 0 });
    });
  });
});
