import type { SessionVariables } from "@onehouse/core/server";
import { parseUserId } from "@onehouse/core/shared";
import { Hono } from "hono";
import { match } from "ts-pattern";
import * as v from "valibot";
import {
  CreateRecipeInputSchema,
  type RecipeError,
  type RecipeId,
  RecipeIdSchema,
  recipeErrorStatus,
} from "../shared/index.ts";
import type { RecipeService } from "./service.ts";

export type RecipeDeps = { service: RecipeService };

const handleError = (e: RecipeError) =>
  match(e)
    .with({ kind: "not_found" }, (it) => ({ status: recipeErrorStatus(it), body: it }) as const)
    .with({ kind: "invalid_input" }, (it) => ({ status: recipeErrorStatus(it), body: it }) as const)
    .exhaustive();

type ParsedBody<T> = { ok: true; value: T } | { ok: false };

const parseBody = async <S extends v.GenericSchema>(
  req: Request,
  schema: S,
): Promise<ParsedBody<v.InferOutput<S>>> => {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false };
  }
  const parsed = v.safeParse(schema, raw);
  if (!parsed.success) return { ok: false };
  return { ok: true, value: parsed.output };
};

const tryParseRecipeId = (raw: string | undefined): RecipeId | null => {
  const parsed = v.safeParse(RecipeIdSchema, raw);
  return parsed.success ? parsed.output : null;
};

const invalidInput = (message = "Invalid input") =>
  ({ kind: "invalid_input" as const, message }) as const;

export const createRecipeRoutes = (deps: RecipeDeps) =>
  new Hono<{ Variables: SessionVariables }>()
    .get("/", async (c) => {
      const recipes = await deps.service.list();
      return c.json({ recipes });
    })
    .get("/:id", async (c) => {
      const id = tryParseRecipeId(c.req.param("id"));
      if (id === null) return c.json(invalidInput("Invalid recipe id"), 400);
      const result = await deps.service.get(id);
      if (result.kind === "err") {
        const e = handleError(result.error);
        return c.json(e.body, e.status);
      }
      return c.json({ recipe: result.value });
    })
    .post("/", async (c) => {
      const parsed = await parseBody(c.req.raw, CreateRecipeInputSchema);
      if (!parsed.ok) return c.json(invalidInput(), 400);
      const user = c.get("user");
      const result = await deps.service.create(parsed.value, parseUserId(user.id));
      if (result.kind === "err") {
        const e = handleError(result.error);
        return c.json(e.body, e.status);
      }
      return c.json({ recipe: result.value }, 201);
    })
    .put("/:id", async (c) => {
      const id = tryParseRecipeId(c.req.param("id"));
      if (id === null) return c.json(invalidInput("Invalid recipe id"), 400);
      const parsed = await parseBody(c.req.raw, CreateRecipeInputSchema);
      if (!parsed.ok) return c.json(invalidInput(), 400);
      const result = await deps.service.update(id, parsed.value);
      if (result.kind === "err") {
        const e = handleError(result.error);
        return c.json(e.body, e.status);
      }
      return c.json({ recipe: result.value });
    })
    .delete("/:id", async (c) => {
      const id = tryParseRecipeId(c.req.param("id"));
      if (id === null) return c.json(invalidInput("Invalid recipe id"), 400);
      const result = await deps.service.remove(id);
      if (result.kind === "err") {
        const e = handleError(result.error);
        return c.json(e.body, e.status);
      }
      return c.json({ id: result.value.id });
    });

export type RecipeRoutes = ReturnType<typeof createRecipeRoutes>;
