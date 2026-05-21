# MCP tool rules

## Pin the SDK

`@modelcontextprotocol/sdk` v1.x — latest 1.x patch (must include the
CVE-2025-66414 DNS-rebinding fix from 1.24.0). Exact-version pin. Renovate
with a 7-day cooldown on top of pnpm's 24h. Stay on v1 until v2 stabilizes
AND two community projects we trust have migrated.

## Transport

Streamable HTTP at `/mcp`. stdio is for processes Claude Desktop spawns
locally; this server lives in a container.

DNS-rebinding protection is non-negotiable:

```ts
new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
  enableDnsRebindingProtection: true,
  allowedHosts: [process.env.MCP_HOST!, "localhost", "127.0.0.1"],
});
```

## Auth

Better Auth API keys via the `requireApiKey` middleware in
`@onehouse/core/server`. Family members mint and revoke keys from the web UI
(`/settings/api-keys`). Every tool call records `{ userId, via: "mcp" }` in
the audit log.

Do NOT add a custom bearer scheme. Do NOT bypass `requireApiKey` for
"convenience."

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

Tool handlers tested in `packages/app-*/src/tools/**.test.ts` via the same
`withTestContext` helper, plus a real `apiKey` issued via the test user
helper.
