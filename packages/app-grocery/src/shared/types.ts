import type { UserId } from "@onehouse/core/shared";
import type { GroceryItemId } from "./ids.ts";
import type { GroceryStatus } from "./state.ts";

export type GroceryAuthor = {
  id: UserId;
  name: string;
  initial: string;
};

export type GroceryItem = {
  id: GroceryItemId;
  name: string;
  description: string | null;
  status: GroceryStatus;
  createdAt: number;
  updatedAt: number;
  addedBy: GroceryAuthor;
};
