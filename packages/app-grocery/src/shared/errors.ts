import { match } from "ts-pattern";
import type { GroceryItemId } from "./ids.ts";

export type GroceryError =
  | { kind: "not_found"; id: GroceryItemId }
  | { kind: "invalid_input"; message: string }
  | { kind: "already_in_state"; state: "pending" | "purchased" };

export const groceryErrorStatus = (e: GroceryError): 400 | 404 | 409 =>
  match(e)
    .with({ kind: "not_found" }, () => 404 as const)
    .with({ kind: "invalid_input" }, () => 400 as const)
    .with({ kind: "already_in_state" }, () => 409 as const)
    .exhaustive();
