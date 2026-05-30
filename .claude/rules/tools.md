# MCP tool rules

## Pin the SDK

`@modelcontextprotocol/sdk` v1.x — latest 1.x patch (must include the
CVE-2025-66414 DNS-rebinding fix from 1.24.0). Exact-version pin. Renovate
with a 7-day cooldown on top of pnpm's 24h. Stay on v1 until v2 stabilizes
AND two community projects we trust have migrated.

## Transport

Streamable HTTP at `/mcp`, via the SDK's `WebStandardStreamableHTTPServerTransport`
(Web-standard `Request`/`Response`, native to Bun + Hono — no Node `req`/`res`
shim). A fresh stateless transport + `McpServer` is created per request by
`runMcpRequest` in `@onehouse/core/server`. stdio is for processes Claude
Desktop spawns locally; this server lives in a container.

DNS-rebinding protection is non-negotiable. The SDK deprecated its built-in
`enableDnsRebindingProtection`/`allowedHosts` transport options in favour of
external middleware, so we enforce it with the `mcpHostGuard` Hono middleware
(a Host-header allowlist) mounted in front of `/mcp`:

```ts
.use("/mcp", mcpHostGuard(allowedHosts)); // allowedHosts ⊇ [MCP_HOST, public host]
```

## Auth

OAuth 2.1 via Better Auth's `@better-auth/oauth-provider` plugin (paired with the
`jwt()` plugin) — the server IS the OAuth Authorization Server for MCP clients.
Claude Desktop / claude.ai discover it through
`/.well-known/oauth-protected-resource` + `/.well-known/oauth-authorization-server`,
self-register via Dynamic Client Registration, then run the PKCE (S256)
authorization-code flow. The user signs in with Google (the existing social
provider) and approves the `/consent` screen.

`/mcp` is protected by `createMcpAuthGuard` in `@onehouse/core/server` (a thin
wrapper over `mcpHandler` from `@better-auth/oauth-provider`): it verifies the
Bearer JWT against our JWKS (`/api/auth/jwks`), checks issuer + audience, and
yields `jwt.sub` (the `UserId`). Every tool call records `{ userId, via: "mcp" }`
in the audit log.

Do NOT hand-roll bearer validation. Do NOT bypass the auth guard for
"convenience." API keys are NOT used here: Claude connects over OAuth, and the
installed Better Auth ships no api-key plugin.

## Tool definitions

Live in `packages/app-*/src/tools/`. One file per logical group; one
`registerXxxTools: Registrar` export per package. Zod is the input schema —
the MCP SDK v1 requires it as a peer dep, and this is the ONLY place Zod
appears in the codebase.

```ts
server.registerTool("grocery.list_items", {
  title: "List grocery items",
  description: "List items on a grocery list, optionally filtered by status.",
  inputSchema: { listId: z.string(), status: z.enum([...]).optional() },
}, async (args) => {
  // Pure adapter: parse IDs → call service → format response.
  // Business logic stays in app-*/server/service.ts.
});
```

## Naming

`<app>.<verb_object>` — `grocery.list_items`, `grocery.add_item`,
`grocery.mark_purchased`. Dots are namespaces; underscores separate words.

## Versioning

```ts
new McpServer({ name: "onehouse", version: "1.0.0" });
```

SemVer:
- PATCH — additive: new tool, new optional input
- MINOR — additive: new structured-output field
- MAJOR — breaking: removed/renamed tool, new required input, changed output shape

Bump on every PR that touches tool definitions.

## Responses

Always return both `content` (text, for the LLM to read) AND
`structuredContent` (for clients that want JSON). The shape of
`structuredContent` is part of the tool's public API.

## Testing

Tool handlers are tested in `packages/app-*/src/tools/**.test.ts` by driving a
real `McpServer` over the SDK's `InMemoryTransport` with an SDK `Client` (no
mocks), against a fresh `:memory:` DB via `withTestAuth`. The OAuth happy path
(discovery → token → authenticated `/mcp`) is verified end-to-end with the MCP
Inspector and against the built Docker image.
