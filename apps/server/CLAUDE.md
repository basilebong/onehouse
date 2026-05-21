# apps/server

SINGLE runtime entry-point. Serves API + Better Auth + MCP + static React.
Composition only — NO business logic.

## Hard rules
- Better Auth handler mounted at `/api/auth/*` MUST come BEFORE any middleware
  that calls `auth.api.getSession`.
- `requireSession` gates `/api/*` (browser sessions).
- `requireApiKey` gates `/mcp` (Better Auth API keys).
- `StreamableHTTPServerTransport` MUST have `enableDnsRebindingProtection: true`
  AND `allowedHosts` containing the public host. MCP SDK pinned to 1.x with
  CVE-2025-66414 fix.
- Static assets via `serveStatic` LAST — catch-all must not shadow API/MCP.
- Migrations run from the Docker entrypoint, NOT from this file.
