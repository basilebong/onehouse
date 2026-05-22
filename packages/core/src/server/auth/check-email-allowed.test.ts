import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { parseAllowedEmails } from "./allowlist.ts";
import { checkEmailAllowed } from "./check-email-allowed.ts";

const apiErrorShape = v.object({
  statusCode: v.number(),
  body: v.object({ message: v.string() }),
});
const parseApiError = (raw: unknown): v.InferOutput<typeof apiErrorShape> =>
  v.parse(apiErrorShape, raw);

describe("checkEmailAllowed", () => {
  const allowed = parseAllowedEmails("basile@example.com,partner@example.com");

  test("returns undefined for an allowlisted email", () => {
    expect(checkEmailAllowed(allowed, "basile@example.com")).toBeUndefined();
  });

  test("matches case-insensitively", () => {
    expect(checkEmailAllowed(allowed, "Basile@Example.COM")).toBeUndefined();
  });

  test("throws a 403 APIError when the email is not on the allowlist", () => {
    let caught: unknown;
    try {
      checkEmailAllowed(allowed, "stranger@example.com");
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(Error);
    const apiErr = parseApiError(caught);
    expect(apiErr.statusCode).toBe(403);
    expect(apiErr.body.message).toContain("stranger@example.com");
    expect(apiErr.body.message).toContain("allowlist");
  });

  test("throws when the email is missing or empty", () => {
    expect(() => checkEmailAllowed(allowed, "")).toThrow();
    expect(() => checkEmailAllowed(allowed, undefined)).toThrow();
  });
});
