import { type UserId, parseUserId } from "@onehouse/core/shared";
import * as v from "valibot";
import {
  type GroceryAuthor,
  type GroceryItem,
  type GroceryStatus,
  parseGroceryItemId,
} from "../shared/index.ts";
import type { GroceryItemRow } from "./schema.ts";

const StoredStatusSchema = v.union([
  v.object({ kind: v.literal("pending") }),
  v.object({
    kind: v.literal("purchased"),
    purchasedAt: v.number(),
    purchasedBy: v.pipe(v.string(), v.minLength(1), v.brand("UserId")),
  }),
]);

const parseStatus = (rowId: string, raw: string): GroceryStatus => {
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = v.safeParse(StoredStatusSchema, parsed);
    if (result.success) return result.output;
    console.error("grocery: corrupt status_json, coercing to pending", { rowId, raw });
    return { kind: "pending" };
  } catch (e) {
    console.error("grocery: invalid status_json, coercing to pending", { rowId, raw, error: e });
    return { kind: "pending" };
  }
};

export const serializeStatus = (status: GroceryStatus): string => JSON.stringify(status);

const initialOf = (name: string): string => {
  const trimmed = name.trim();
  if (trimmed.length === 0) return "·";
  const first = trimmed.split(/\s+/)[0] ?? trimmed;
  return first.charAt(0).toUpperCase();
};

const UNKNOWN_AUTHOR_ID: UserId = parseUserId("unknown");

const toAuthor = (
  user: { id: string; name: string | null; email: string | null } | null,
): GroceryAuthor => {
  if (user === null) return { id: UNKNOWN_AUTHOR_ID, name: "Someone", initial: "·" };
  const trimmedName = user.name?.trim();
  const displayName =
    trimmedName !== undefined && trimmedName.length > 0 ? trimmedName : (user.email ?? "Someone");
  return { id: parseUserId(user.id), name: displayName, initial: initialOf(displayName) };
};

export const rowToItem = (
  row: GroceryItemRow,
  author: { id: string; name: string | null; email: string | null } | null,
): GroceryItem => ({
  id: parseGroceryItemId(row.id),
  name: row.name,
  description: row.description,
  status: parseStatus(row.id, row.statusJson),
  createdAt: row.createdAt.getTime(),
  updatedAt: row.updatedAt.getTime(),
  addedBy: toAuthor(author),
});
