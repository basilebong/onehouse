import { describe, expect, test } from "bun:test";
import type { CleanupScheduler } from "@onehouse/app-grocery/server";
import { createGroceryService } from "@onehouse/app-grocery/server";
import { createAssistantsService, createAuditRecorder } from "@onehouse/core/server";
import { withTestAuth } from "@onehouse/core/server/test";
import { type AppType, createApp } from "./composition.ts";

const noopCleanup: CleanupScheduler = {
  schedule: async () => {},
  cancel: async () => {},
  close: async () => {},
};

const b64url = (bytes: Uint8Array): string => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const pkce = async (): Promise<{ verifier: string; challenge: string }> => {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: b64url(new Uint8Array(digest)) };
};

const jwtClaims = (token: string): { sub: unknown; iss: unknown; aud: unknown } => {
  const part = token.split(".")[1] ?? "";
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const parsed: unknown = JSON.parse(atob(padded));
  if (parsed === null || typeof parsed !== "object") throw new Error("bad jwt payload");
  return {
    sub: "sub" in parsed ? parsed.sub : undefined,
    iss: "iss" in parsed ? parsed.iss : undefined,
    aud: "aud" in parsed ? parsed.aud : undefined,
  };
};

const dataPayload = (sseOrJson: string): unknown => {
  const line = sseOrJson.split("\n").find((l) => l.startsWith("data:"));
  return JSON.parse(line === undefined ? sseOrJson : line.slice("data:".length).trim());
};

describe("MCP over OAuth (end-to-end)", () => {
  test("Claude-style DCR + PKCE + consent + token grants access to grocery tools", async () => {
    let app: AppType | undefined;
    const server = Bun.serve({
      port: 0,
      fetch: (req) => app?.fetch(req) ?? new Response("not ready", { status: 503 }),
    });
    const baseURL = `http://localhost:${server.port}`;
    const redirectUri = `${baseURL}/oauth/callback`;

    try {
      await withTestAuth({ allowedEmails: "basile@example.com", baseURL }, async (ctx) => {
        const { auth, db, signSessionCookie } = ctx;
        const adapter = await auth.$context;
        const user = await adapter.internalAdapter.createUser({
          name: "Basile",
          email: "basile@example.com",
        });
        const session = await adapter.internalAdapter.createSession(user.id);
        const cookie = `onehouse.session_token=${await signSessionCookie(session.token)}`;

        app = createApp({
          auth,
          baseURL,
          jwksOrigin: baseURL,
          allowedHosts: [`localhost:${server.port}`],
          audit: createAuditRecorder(db),
          assistants: { service: createAssistantsService(db) },
          grocery: { service: createGroceryService(db), cleanup: noopCleanup },
        });

        const register = await fetch(`${baseURL}/api/auth/oauth2/register`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            client_name: "Claude",
            redirect_uris: [redirectUri],
            token_endpoint_auth_method: "none",
            grant_types: ["authorization_code", "refresh_token"],
            response_types: ["code"],
            scope: "openid profile email",
          }),
        });
        expect(register.status).toBe(200);
        const clientId: unknown = (await register.json()).client_id;
        expect(typeof clientId).toBe("string");

        const { verifier, challenge } = await pkce();
        const authorize = await fetch(
          `${baseURL}/api/auth/oauth2/authorize?${new URLSearchParams({
            client_id: String(clientId),
            redirect_uri: redirectUri,
            response_type: "code",
            scope: "openid profile email",
            code_challenge: challenge,
            code_challenge_method: "S256",
            state: "xyz",
            resource: `${baseURL}/mcp`,
          })}`,
          { headers: { cookie }, redirect: "manual" },
        );
        expect(authorize.status).toBe(302);
        const location = authorize.headers.get("location") ?? "";
        expect(location).toContain("/consent");
        const oauthQuery = location.slice(location.indexOf("?") + 1);

        const consent = await fetch(`${baseURL}/api/auth/oauth2/consent`, {
          method: "POST",
          headers: { "content-type": "application/json", cookie, origin: baseURL },
          body: JSON.stringify({ accept: true, oauth_query: oauthQuery }),
        });
        expect(consent.status).toBe(200);
        const code = new URL((await consent.json()).url).searchParams.get("code");
        expect(typeof code).toBe("string");

        const token = await fetch(`${baseURL}/api/auth/oauth2/token`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "authorization_code",
            code: code ?? "",
            redirect_uri: redirectUri,
            client_id: String(clientId),
            code_verifier: verifier,
            resource: `${baseURL}/mcp`,
          }).toString(),
        });
        expect(token.status).toBe(200);
        const accessToken: unknown = (await token.json()).access_token;
        expect(typeof accessToken).toBe("string");

        const claims = jwtClaims(String(accessToken));
        expect(claims.sub).toBe(user.id);
        expect(claims.iss).toBe(`${baseURL}/api/auth`);
        expect(Array.isArray(claims.aud) ? claims.aud : []).toContain(`${baseURL}/mcp`);

        const unauthorized = await fetch(`${baseURL}/mcp`, {
          method: "POST",
          headers: { "content-type": "application/json", accept: "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
        });
        expect(unauthorized.status).toBe(401);

        const call = await fetch(`${baseURL}/mcp`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            accept: "application/json, text/event-stream",
            authorization: `Bearer ${String(accessToken)}`,
          },
          body: JSON.stringify({
            jsonrpc: "2.0",
            id: 2,
            method: "tools/call",
            params: { name: "grocery.add_item", arguments: { name: "Milk via Claude" } },
          }),
        });
        expect(call.status).toBe(200);
        const payload = dataPayload(await call.text());
        expect(JSON.stringify(payload)).toContain("Milk via Claude");

        const items = db.$client.query("SELECT name FROM grocery_items").all();
        expect(items).toEqual([{ name: "Milk via Claude" }]);
        const audit = db.$client.query("SELECT action, via FROM audit_log").all();
        expect(audit).toEqual([{ action: "grocery.add_item", via: "mcp" }]);
      });
    } finally {
      await server.stop(true);
    }
  });
});
