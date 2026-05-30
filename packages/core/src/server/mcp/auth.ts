import { mcpHandler } from "@better-auth/oauth-provider";
import { type UserId, parseUserId } from "../../shared/index.ts";

export type McpAuthConfig = {
  issuer: string;
  audience: string;
  jwksUrl: string;
};

export const deriveMcpAuthConfig = (baseURL: string): McpAuthConfig => ({
  issuer: `${baseURL}/api/auth`,
  audience: `${baseURL}/mcp`,
  jwksUrl: `${baseURL}/api/auth/jwks`,
});

export type AuthedMcpHandler = (req: Request, actor: UserId) => Promise<Response>;

export const createMcpAuthGuard =
  (config: McpAuthConfig) =>
  (handler: AuthedMcpHandler): ((req: Request) => Promise<Response>) =>
    mcpHandler(
      {
        verifyOptions: { issuer: config.issuer, audience: config.audience },
        jwksUrl: config.jwksUrl,
      },
      (req, jwt) => {
        if (typeof jwt.sub !== "string") {
          return new Response(JSON.stringify({ error: "invalid_token" }), {
            status: 401,
            headers: { "content-type": "application/json" },
          });
        }
        return handler(req, parseUserId(jwt.sub));
      },
    );
