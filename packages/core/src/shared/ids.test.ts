import { describe, expect, test } from "bun:test";
import { parseUserId } from "./ids.ts";

describe("parseUserId", () => {
  test("accepts a non-empty string", () => {
    const id = parseUserId("user_01HXYZ");
    expect(id).toBe("user_01HXYZ" as ReturnType<typeof parseUserId>);
  });

  test("rejects empty string", () => {
    expect(() => parseUserId("")).toThrow(TypeError);
  });

  test("rejects non-string", () => {
    expect(() => parseUserId(123)).toThrow(TypeError);
    expect(() => parseUserId(null)).toThrow(TypeError);
    expect(() => parseUserId(undefined)).toThrow(TypeError);
  });
});
