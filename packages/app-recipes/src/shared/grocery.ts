import type { Ingredient } from "./types.ts";

export const defaultGrocerySelection = (
  ingredients: readonly Ingredient[],
): Record<string, boolean> => {
  const selection: Record<string, boolean> = {};
  for (const ingredient of ingredients) selection[ingredient.name] = !ingredient.haveAtHome;
  return selection;
};
