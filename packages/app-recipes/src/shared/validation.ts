import * as v from "valibot";
import { RecipeCategorySchema } from "./category.ts";

export const TitleSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Title can't be empty"),
  v.maxLength(120, "Title is too long"),
);

export const DescriptionSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(2000, "Description is too long"),
);

export const IngredientNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1, "Ingredient needs a name"),
  v.maxLength(120, "Ingredient name is too long"),
);

export const QuantitySchema = v.pipe(v.string(), v.trim(), v.maxLength(40, "Quantity is too long"));

export const MinutesSchema = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1440));
export const ServesSchema = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(50));

export const MAX_IMAGE_DATA_URL_LENGTH = 600_000;

export const IMAGE_DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

export const ImageDataUrlSchema = v.pipe(
  v.string(),
  v.maxLength(MAX_IMAGE_DATA_URL_LENGTH, "Image is too large"),
  v.regex(IMAGE_DATA_URL_RE, "Unsupported image"),
);

export const IngredientInputSchema = v.object({
  name: IngredientNameSchema,
  quantity: QuantitySchema,
  haveAtHome: v.optional(v.boolean(), false),
});

export const StepIngredientInputSchema = v.object({
  name: IngredientNameSchema,
  quantity: v.nullable(QuantitySchema),
});

export const StepTimerInputSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1), v.maxLength(64)),
  minutes: MinutesSchema,
  label: v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(80)),
});

export const StepInputSchema = v.object({
  title: v.pipe(v.string(), v.trim(), v.minLength(1, "Step needs a title"), v.maxLength(120)),
  body: v.pipe(v.string(), v.trim(), v.minLength(1, "Step needs instructions"), v.maxLength(2000)),
  concurrent: v.optional(v.boolean(), false),
  uses: v.optional(v.array(StepIngredientInputSchema), []),
  timers: v.optional(v.array(StepTimerInputSchema), []),
});

export const CreateRecipeInputSchema = v.object({
  title: TitleSchema,
  description: v.optional(DescriptionSchema, ""),
  image: v.optional(ImageDataUrlSchema),
  category: RecipeCategorySchema,
  minutes: MinutesSchema,
  serves: ServesSchema,
  ingredients: v.pipe(
    v.array(IngredientInputSchema),
    v.minLength(1, "Add at least one ingredient"),
  ),
  steps: v.pipe(v.array(StepInputSchema), v.minLength(1, "Add at least one step")),
});
export type CreateRecipeInput = v.InferOutput<typeof CreateRecipeInputSchema>;
