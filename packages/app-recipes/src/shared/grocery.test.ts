import { describe, expect, test } from "bun:test";
import { defaultGrocerySelection } from "./grocery.ts";
import type { Ingredient } from "./types.ts";

const ingredient = (name: string, haveAtHome: boolean): Ingredient => ({
  name,
  quantity: "1",
  haveAtHome,
});

describe("defaultGrocerySelection", () => {
  test("pre-selects only the ingredients not already at home", () => {
    const selection = defaultGrocerySelection([
      ingredient("Rigatoni", false),
      ingredient("Butter", true),
      ingredient("Parmesan", false),
    ]);
    expect(selection).toEqual({ Rigatoni: true, Butter: false, Parmesan: true });
  });

  test("is empty for no ingredients", () => {
    expect(defaultGrocerySelection([])).toEqual({});
  });
});
