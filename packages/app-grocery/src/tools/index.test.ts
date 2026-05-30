import { describe, expect, test } from "bun:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createAuditRecorder } from "@onehouse/core/server";
import type { Auth, Db } from "@onehouse/core/server";
import { withTestAuth } from "@onehouse/core/server/test";
import { type UserId, parseUserId } from "@onehouse/core/shared";
import { createGroceryService } from "../server/index.ts";
import { registerGroceryTools } from "./index.ts";

const TEST_EMAIL = "basile@example.com";

const seedUser = async (auth: Auth): Promise<UserId> => {
  const ctx = await auth.$context;
  const user = await ctx.internalAdapter.createUser({ name: "Basile", email: TEST_EMAIL });
  return parseUserId(user.id);
};

const connect = async (db: Db, actor: UserId): Promise<Client> => {
  const server = new McpServer({ name: "onehouse-test", version: "1.0.0" });
  registerGroceryTools(server, {
    service: createGroceryService(db),
    actor,
    audit: createAuditRecorder(db),
  });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: "test-client", version: "1.0.0" });
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  return client;
};

const auditActions = (db: Db): string[] =>
  db.$client
    .query("SELECT action FROM audit_log ORDER BY created_at")
    .all()
    .flatMap((row) =>
      typeof row === "object" && row !== null && "action" in row ? [row.action] : [],
    )
    .filter((action): action is string => typeof action === "string");

const itemIdOf = (result: unknown): string => {
  if (result !== null && typeof result === "object" && "structuredContent" in result) {
    const sc = result.structuredContent;
    if (sc !== null && typeof sc === "object" && "item" in sc) {
      const item = sc.item;
      if (
        item !== null &&
        typeof item === "object" &&
        "id" in item &&
        typeof item.id === "string"
      ) {
        return item.id;
      }
    }
  }
  throw new Error("expected item.id in tool result");
};

describe("grocery MCP tools", () => {
  test("lists the registered tools", async () => {
    await withTestAuth({ allowedEmails: TEST_EMAIL }, async ({ auth, db }) => {
      const client = await connect(db, await seedUser(auth));
      const { tools } = await client.listTools();
      expect(tools.map((t) => t.name).sort()).toEqual([
        "grocery.add_item",
        "grocery.list_items",
        "grocery.mark_pending",
        "grocery.mark_purchased",
        "grocery.remove_item",
        "grocery.update_item",
      ]);
    });
  });

  test("add_item creates a pending item attributed to the actor", async () => {
    await withTestAuth({ allowedEmails: TEST_EMAIL }, async ({ auth, db }) => {
      const actor = await seedUser(auth);
      const client = await connect(db, actor);
      const result = await client.callTool({
        name: "grocery.add_item",
        arguments: { name: "Milk", description: "Whole" },
      });
      expect(result.isError).toBeFalsy();
      expect(result.structuredContent).toMatchObject({
        item: {
          name: "Milk",
          description: "Whole",
          status: { kind: "pending" },
          addedBy: { kind: "user", id: actor },
        },
      });
      expect(auditActions(db)).toContain("grocery.add_item");
    });
  });

  test("mark_purchased then list with the purchased filter", async () => {
    await withTestAuth({ allowedEmails: TEST_EMAIL }, async ({ auth, db }) => {
      const actor = await seedUser(auth);
      const client = await connect(db, actor);
      const added = await client.callTool({
        name: "grocery.add_item",
        arguments: { name: "Eggs" },
      });
      const itemId = itemIdOf(added);

      const purchased = await client.callTool({
        name: "grocery.mark_purchased",
        arguments: { itemId },
      });
      expect(purchased.structuredContent).toMatchObject({
        item: { status: { kind: "purchased" } },
      });

      const list = await client.callTool({
        name: "grocery.list_items",
        arguments: { status: "purchased" },
      });
      expect(list.structuredContent).toMatchObject({ items: [{ name: "Eggs" }] });
    });
  });

  test("update_item changes the name", async () => {
    await withTestAuth({ allowedEmails: TEST_EMAIL }, async ({ auth, db }) => {
      const actor = await seedUser(auth);
      const client = await connect(db, actor);
      const added = await client.callTool({
        name: "grocery.add_item",
        arguments: { name: "Bred" },
      });
      const itemId = itemIdOf(added);
      const updated = await client.callTool({
        name: "grocery.update_item",
        arguments: { itemId, name: "Bread" },
      });
      expect(updated.structuredContent).toMatchObject({ item: { name: "Bread" } });
    });
  });

  test("remove_item deletes the item", async () => {
    await withTestAuth({ allowedEmails: TEST_EMAIL }, async ({ auth, db }) => {
      const actor = await seedUser(auth);
      const client = await connect(db, actor);
      const added = await client.callTool({
        name: "grocery.add_item",
        arguments: { name: "Soap" },
      });
      const itemId = itemIdOf(added);
      await client.callTool({ name: "grocery.remove_item", arguments: { itemId } });
      const list = await client.callTool({ name: "grocery.list_items", arguments: {} });
      expect(list.structuredContent).toMatchObject({ items: [] });
    });
  });

  test("mark_purchased on a missing item returns an MCP error", async () => {
    await withTestAuth({ allowedEmails: TEST_EMAIL }, async ({ auth, db }) => {
      const client = await connect(db, await seedUser(auth));
      const result = await client.callTool({
        name: "grocery.mark_purchased",
        arguments: { itemId: "does-not-exist" },
      });
      expect(result.isError).toBe(true);
    });
  });
});
