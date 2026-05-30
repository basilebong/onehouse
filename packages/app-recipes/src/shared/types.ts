import type { RecipeCategory } from "./category.ts";
import type { RecipeId } from "./ids.ts";

export type Cook = { name: string; initial: string };

export type Ingredient = { name: string; quantity: string; haveAtHome: boolean };

export type StepIngredient = { name: string; quantity: string | null };

export type StepTimer = { id: string; minutes: number; label: string };

export type RecipeStep = {
  title: string;
  body: string;
  concurrent: boolean;
  uses: readonly StepIngredient[];
  timers: readonly StepTimer[];
};

export type Recipe = {
  id: RecipeId;
  title: string;
  description: string;
  image: string | null;
  category: RecipeCategory;
  minutes: number;
  serves: number;
  cook: Cook;
  ingredients: readonly Ingredient[];
  steps: readonly RecipeStep[];
};

export type RecipeSummary = {
  id: RecipeId;
  title: string;
  category: RecipeCategory;
  minutes: number;
  serves: number;
  cook: Cook;
};

export const toSummary = (recipe: Recipe): RecipeSummary => ({
  id: recipe.id,
  title: recipe.title,
  category: recipe.category,
  minutes: recipe.minutes,
  serves: recipe.serves,
  cook: recipe.cook,
});
