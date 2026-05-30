import type { GroceryService } from "@onehouse/app-grocery/server";
import { registerGroceryTools } from "@onehouse/app-grocery/tools";
import type { AuditRecorder } from "@onehouse/core/server";
import {
  createAuthServerMetadataHandler,
  createMcpAuthGuard,
  createProtectedResourceMetadataHandler,
  deriveMcpAuthConfig,
  mcpHostGuard,
  runMcpRequest,
} from "@onehouse/core/server";
import { Hono } from "hono";
import { cors } from "hono/cors";

export type McpDeps = {
  baseURL: string;
  allowedHosts: readonly string[];
  service: GroceryService;
  audit: AuditRecorder;
};

export const mountMcp = ({ baseURL, allowedHosts, service, audit }: McpDeps) => {
  const config = deriveMcpAuthConfig(baseURL);
  const handle = createMcpAuthGuard(config)((req, actor) =>
    runMcpRequest((server) => registerGroceryTools(server, { service, actor, audit }), req),
  );

  const authServerMetadata = createAuthServerMetadataHandler(baseURL);
  const protectedResourceMetadata = createProtectedResourceMetadataHandler(
    config.audience,
    config.issuer,
  );

  return new Hono()
    .get("/.well-known/oauth-authorization-server", () => authServerMetadata())
    .get("/.well-known/oauth-authorization-server/api/auth", () => authServerMetadata())
    .get("/.well-known/openid-configuration", () => authServerMetadata())
    .get("/.well-known/openid-configuration/api/auth", () => authServerMetadata())
    .get("/.well-known/oauth-protected-resource", () => protectedResourceMetadata())
    .get("/.well-known/oauth-protected-resource/mcp", () => protectedResourceMetadata())
    .use(
      "/mcp",
      cors({
        origin: "*",
        allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "mcp-session-id",
          "mcp-protocol-version",
          "Last-Event-ID",
        ],
        exposeHeaders: ["mcp-session-id", "mcp-protocol-version", "WWW-Authenticate"],
      }),
    )
    .use("/mcp", mcpHostGuard(allowedHosts))
    .all("/mcp", (c) => handle(c.req.raw));
};
