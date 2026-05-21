import { describe, expect, test } from "bun:test";
import { app } from "./composition.ts";

describe("composition", () => {
  test("GET /healthz returns ok", async () => {
    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
