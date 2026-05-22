import { describe, expect, test } from "bun:test";
import { isErr, isOk, parseUserId } from "@onehouse/core/shared";
import { type GroceryStatus, transition } from "./state.ts";

const U1 = parseUserId("u1");
const U2 = parseUserId("u2");

const PENDING: GroceryStatus = { kind: "pending" };
const PURCHASED: GroceryStatus = { kind: "purchased", purchasedAt: 1000, purchasedBy: U1 };

describe("transition", () => {
  test("pending → purchased records who and when", () => {
    const r = transition(PENDING, { kind: "mark_purchased", by: U2, at: 2000 });
    expect(isOk(r)).toBe(true);
    if (isOk(r)) {
      expect(r.value).toEqual({ kind: "purchased", purchasedAt: 2000, purchasedBy: U2 });
    }
  });

  test("purchased → pending clears purchase metadata", () => {
    const r = transition(PURCHASED, { kind: "mark_pending" });
    expect(isOk(r)).toBe(true);
    if (isOk(r)) expect(r.value).toEqual({ kind: "pending" });
  });

  test("purchased → purchased is rejected", () => {
    const r = transition(PURCHASED, { kind: "mark_purchased", by: U2, at: 3000 });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.kind).toBe("already_in_state");
  });

  test("pending → pending is rejected", () => {
    const r = transition(PENDING, { kind: "mark_pending" });
    expect(isErr(r)).toBe(true);
  });
});
