// MCP server mount. One sub-Hono at /mcp, gated by requireApiKey.
// StreamableHTTPServerTransport MUST be constructed with
//   enableDnsRebindingProtection: true
//   allowedHosts: [process.env.MCP_HOST!, "localhost", "127.0.0.1"]
// (CVE-2025-66414).
//
// Each app's registerXxxTools(server, ctx) call is added here when the app
// ships. The tool definitions themselves live in packages/app-*/src/tools/.

// TODO(basile): import McpServer + StreamableHTTPServerTransport + registrars
// once @onehouse/core/server and the MCP SDK are installed.

import { Hono } from "hono";

export const mountMcp = () =>
  new Hono().all("/", (c) => c.json({ error: "mcp not yet wired" }, 501));
