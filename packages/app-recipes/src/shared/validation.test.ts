import { describe, expect, test } from "bun:test";
import * as v from "valibot";
import { CreateRecipeInputSchema, ImageDataUrlSchema } from "./validation.ts";

const tinyJpeg =
  "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAAAv/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AnwH/2Q==";

const baseRecipe = {
  title: "Tomato Butter Rigatoni",
  category: "Main",
  minutes: 35,
  serves: 4,
  ingredients: [{ name: "Rigatoni", quantity: "400 g" }],
  steps: [{ title: "Boil", body: "Boil until al dente." }],
} as const;

describe("ImageDataUrlSchema", () => {
  test("accepts a jpeg data URL", () => {
    expect(v.parse(ImageDataUrlSchema, tinyJpeg)).toBe(tinyJpeg);
  });

  test("accepts png and webp data URLs", () => {
    const png = "data:image/png;base64,iVBORw0KGgo=";
    const webp = "data:image/webp;base64,UklGRiQ=";
    expect(v.parse(ImageDataUrlSchema, png)).toBe(png);
    expect(v.parse(ImageDataUrlSchema, webp)).toBe(webp);
  });

  test("rejects a non-image data URL", () => {
    expect(v.safeParse(ImageDataUrlSchema, "data:text/html;base64,PHA+").success).toBe(false);
  });

  test("rejects a plain http url", () => {
    expect(v.safeParse(ImageDataUrlSchema, "https://example.com/a.jpg").success).toBe(false);
  });

  test("rejects an oversized payload", () => {
    const huge = `data:image/jpeg;base64,${"A".repeat(2_000_000)}`;
    expect(v.safeParse(ImageDataUrlSchema, huge).success).toBe(false);
  });
});

describe("CreateRecipeInputSchema image", () => {
  test("accepts a recipe without an image", () => {
    const result = v.safeParse(CreateRecipeInputSchema, baseRecipe);
    expect(result.success).toBe(true);
    if (result.success) expect(result.output.image).toBeUndefined();
  });

  test("accepts a recipe with a valid image", () => {
    const result = v.safeParse(CreateRecipeInputSchema, { ...baseRecipe, image: tinyJpeg });
    expect(result.success).toBe(true);
    if (result.success) expect(result.output.image).toBe(tinyJpeg);
  });

  test("rejects a recipe with an invalid image", () => {
    const result = v.safeParse(CreateRecipeInputSchema, {
      ...baseRecipe,
      image: "not-a-data-url",
    });
    expect(result.success).toBe(false);
  });
});
