import type { Db } from "@onehouse/core/server";
import { desc, eq } from "@onehouse/core/server/drizzle";
import { users } from "@onehouse/core/server/schema";
import { type Result, type UserId, err, isErr, ok } from "@onehouse/core/shared";
import { ulid } from "ulid";
import {
  type CreateItemInput,
  type GroceryError,
  type GroceryItem,
  type GroceryItemId,
  type UpdateItemInput,
  parseGroceryItemId,
  transition,
} from "../shared/index.ts";
import { groceryItems } from "./schema.ts";
import { rowToItem, serializeStatus } from "./serialize.ts";

export type GroceryService = {
  list(): Promise<GroceryItem[]>;
  create(input: CreateItemInput, by: UserId): Promise<Result<GroceryItem, GroceryError>>;
  update(id: GroceryItemId, input: UpdateItemInput): Promise<Result<GroceryItem, GroceryError>>;
  markPurchased(id: GroceryItemId, by: UserId): Promise<Result<GroceryItem, GroceryError>>;
  markPending(id: GroceryItemId): Promise<Result<GroceryItem, GroceryError>>;
  remove(id: GroceryItemId): Promise<Result<{ id: GroceryItemId }, GroceryError>>;
  removeIfPurchased(
    id: GroceryItemId,
  ): Promise<Result<{ id: GroceryItemId; removed: boolean }, GroceryError>>;
};

type AuthorJoin = {
  item: typeof groceryItems.$inferSelect;
  author: { id: string; name: string | null; email: string | null } | null;
};

const fetchWithAuthor = async (db: Db, id: GroceryItemId): Promise<AuthorJoin | null> => {
  const rows = await db
    .select({ item: groceryItems, author: { id: users.id, name: users.name, email: users.email } })
    .from(groceryItems)
    .leftJoin(users, eq(users.id, groceryItems.addedByUserId))
    .where(eq(groceryItems.id, id))
    .limit(1);
  return rows[0] ?? null;
};

export const createGroceryService = (db: Db): GroceryService => ({
  async list() {
    const rows = await db
      .select({
        item: groceryItems,
        author: { id: users.id, name: users.name, email: users.email },
      })
      .from(groceryItems)
      .leftJoin(users, eq(users.id, groceryItems.addedByUserId))
      .orderBy(desc(groceryItems.createdAt));
    return rows.map((r) => rowToItem(r.item, r.author));
  },

  async create(input, by) {
    const now = new Date();
    const id = parseGroceryItemId(ulid());
    await db.insert(groceryItems).values({
      id,
      name: input.name,
      description: input.description ?? null,
      statusJson: serializeStatus({ kind: "pending" }),
      addedByUserId: by,
      createdAt: now,
      updatedAt: now,
      purchasedAt: null,
    });
    const row = await fetchWithAuthor(db, id);
    if (row === null) return err({ kind: "not_found", id });
    return ok(rowToItem(row.item, row.author));
  },

  async update(id, input) {
    if (input.name === undefined && input.description === undefined) {
      return err({ kind: "invalid_input", message: "Provide a name or description to update" });
    }
    const row = await fetchWithAuthor(db, id);
    if (row === null) return err({ kind: "not_found", id });
    const patch: { name?: string; description?: string | null; updatedAt: Date } = {
      updatedAt: new Date(),
    };
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    await db.update(groceryItems).set(patch).where(eq(groceryItems.id, id));
    const updated = await fetchWithAuthor(db, id);
    if (updated === null) return err({ kind: "not_found", id });
    return ok(rowToItem(updated.item, updated.author));
  },

  async markPurchased(id, by) {
    const row = await fetchWithAuthor(db, id);
    if (row === null) return err({ kind: "not_found", id });
    const current = rowToItem(row.item, row.author);
    const at = Date.now();
    const next = transition(current.status, { kind: "mark_purchased", by, at });
    if (isErr(next)) return err({ kind: "already_in_state", state: next.error.state });
    await db
      .update(groceryItems)
      .set({
        statusJson: serializeStatus(next.value),
        purchasedAt: new Date(at),
      })
      .where(eq(groceryItems.id, id));
    const updated = await fetchWithAuthor(db, id);
    if (updated === null) return err({ kind: "not_found", id });
    return ok(rowToItem(updated.item, updated.author));
  },

  async markPending(id) {
    const row = await fetchWithAuthor(db, id);
    if (row === null) return err({ kind: "not_found", id });
    const current = rowToItem(row.item, row.author);
    const next = transition(current.status, { kind: "mark_pending" });
    if (isErr(next)) return err({ kind: "already_in_state", state: next.error.state });
    await db
      .update(groceryItems)
      .set({
        statusJson: serializeStatus(next.value),
        purchasedAt: null,
      })
      .where(eq(groceryItems.id, id));
    const updated = await fetchWithAuthor(db, id);
    if (updated === null) return err({ kind: "not_found", id });
    return ok(rowToItem(updated.item, updated.author));
  },

  async remove(id) {
    const row = await fetchWithAuthor(db, id);
    if (row === null) return err({ kind: "not_found", id });
    await db.delete(groceryItems).where(eq(groceryItems.id, id));
    return ok({ id });
  },

  async removeIfPurchased(id) {
    const row = await fetchWithAuthor(db, id);
    if (row === null) return err({ kind: "not_found", id });
    const current = rowToItem(row.item, row.author);
    if (current.status.kind !== "purchased") {
      return ok({ id, removed: false });
    }
    await db.delete(groceryItems).where(eq(groceryItems.id, id));
    return ok({ id, removed: true });
  },
});
