import type { CreateItemInput } from "@onehouse/app-grocery/shared";
import {
  type Ingredient,
  type Recipe,
  RecipeIdSchema,
  defaultGrocerySelection,
  formatMinutes,
} from "@onehouse/app-recipes/shared";
import {
  Avatar,
  FloatingTimers,
  IngredientRow,
  IngredientToggle,
  MetaChip,
  PhotoPlaceholder,
  StepCard,
  useTimers,
} from "@onehouse/app-recipes/ui";
import {
  ArrowLeftIcon,
  BasketIcon,
  ClockIcon,
  CookingPotIcon,
  ForkKnifeIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactElement, useEffect, useState } from "react";
import { toast } from "sonner";
import * as v from "valibot";

import { BottomNav } from "@/components/BottomNav";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { createItem } from "@/lib/grocery-api";
import { fetchRecipe } from "@/lib/recipes-api";

const ACCENT = "#ff6b35";
const GROCERY_QUERY_KEY = ["grocery", "items"] as const;

type View = "ingredients" | "method";

const toGroceryInput = (ingredient: Ingredient): CreateItemInput => {
  const quantity = ingredient.quantity.trim();
  return quantity.length > 0
    ? { name: ingredient.name, description: quantity }
    : { name: ingredient.name };
};

const Shell = ({ children }: { children: ReactElement | ReactElement[] }): ReactElement => (
  <main className="relative flex min-h-dvh flex-col bg-slate-50">{children}</main>
);

const NotFound = (): ReactElement => (
  <Shell>
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <CookingPotIcon size={40} weight="duotone" className="text-slate-300" />
      <div>
        <p className="font-medium text-base text-slate-900">Recipe not found</p>
        <p className="mt-1 text-slate-500 text-sm">It may have been removed.</p>
      </div>
      <Link
        to="/recipes"
        className="flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 font-medium text-base text-white transition active:scale-[0.98]"
      >
        Back to recipes
      </Link>
    </div>
    <BottomNav active="recipes" />
  </Shell>
);

const AddToGroceryDrawer = ({
  recipe,
  open,
  onOpenChange,
}: {
  recipe: Recipe;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactElement => {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<ReadonlyMap<string, boolean>>(() => new Map());

  useEffect(() => {
    if (!open) return;
    setSelected(new Map(Object.entries(defaultGrocerySelection(recipe.ingredients))));
  }, [open, recipe.ingredients]);

  const toggle = (name: string): void => {
    setSelected((prev) => {
      const next = new Map(prev);
      next.set(name, !(prev.get(name) ?? false));
      return next;
    });
  };

  const chosen = recipe.ingredients.filter((i) => selected.get(i.name) ?? false);

  const add = useMutation({
    mutationFn: async (items: readonly Ingredient[]): Promise<number> => {
      await Promise.all(items.map((i) => createItem(toGroceryInput(i))));
      return items.length;
    },
    onSuccess: (count) => {
      toast.success(`Added ${count} item${count === 1 ? "" : "s"} to Grocery`);
      void qc.invalidateQueries({ queryKey: GROCERY_QUERY_KEY });
      onOpenChange(false);
    },
    onError: () => toast.error("Couldn't add to grocery"),
  });

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (!next && add.isPending) return;
        onOpenChange(next);
      }}
    >
      <DrawerContent className="rounded-t-3xl bg-white">
        <DrawerTitle className="px-5 pt-2 font-semibold text-lg text-slate-900">
          Add to grocery
        </DrawerTitle>
        <DrawerDescription className="px-5 pt-0.5 text-slate-500 text-sm">
          Untick anything you already have at home.
        </DrawerDescription>
        <div className="flex max-h-[60dvh] flex-col overflow-y-auto px-5 pt-2">
          <div className="divide-y divide-slate-100">
            {recipe.ingredients.map((ingredient) => (
              <IngredientToggle
                key={ingredient.name}
                name={ingredient.name}
                quantity={ingredient.quantity}
                haveAtHome={ingredient.haveAtHome}
                checked={selected.get(ingredient.name) ?? false}
                onToggle={() => toggle(ingredient.name)}
              />
            ))}
          </div>
        </div>
        <div className="border-slate-100 border-t px-5 pt-3 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <button
            type="button"
            disabled={chosen.length === 0 || add.isPending}
            onClick={() => add.mutate(chosen)}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 font-semibold text-base text-white transition active:scale-[0.99] disabled:opacity-40"
          >
            <BasketIcon size={18} weight="bold" />
            {add.isPending
              ? "Adding…"
              : `Add ${chosen.length} item${chosen.length === 1 ? "" : "s"} to Grocery`}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

const RecipeView = ({ recipe }: { recipe: Recipe }): ReactElement => {
  const [view, setView] = useState<View>("ingredients");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { timers, now, start, cancel } = useTimers();

  if (view === "method") {
    return (
      <Shell>
        <div className="flex h-12 shrink-0 items-center justify-between border-slate-100 border-b bg-white px-3 pt-[env(safe-area-inset-top)]">
          <button
            type="button"
            onClick={() => setView("ingredients")}
            aria-label="Back to ingredients"
            className="grid size-11 place-items-center rounded-full text-slate-600 transition active:bg-slate-100"
          >
            <ArrowLeftIcon size={18} weight="bold" />
          </button>
          <div className="truncate px-2 font-semibold text-[15px] text-slate-900">
            {recipe.title}
          </div>
          <div className="size-11 shrink-0" />
        </div>
        <div className="flex-1 overflow-y-auto bg-white px-5 pt-4 pb-28">
          <h2 className="font-semibold text-[11px] text-slate-400 uppercase tracking-[0.12em]">
            Instructions
          </h2>
          <div className="mt-1 divide-y divide-slate-100">
            {recipe.steps.map((step, index) => (
              <StepCard
                key={`${index}-${step.title}`}
                step={step}
                index={index}
                accent={ACCENT}
                timers={timers}
                now={now}
                showIngredients
                onStart={start}
                onCancel={cancel}
              />
            ))}
          </div>
        </div>
        <FloatingTimers timers={timers} now={now} accent={ACCENT} onCancel={cancel} />
        <BottomNav active="recipes" />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="relative shrink-0">
        <PhotoPlaceholder className="h-44 w-full" />
        <div className="absolute inset-x-0 top-0 flex h-12 items-center px-2 pt-[env(safe-area-inset-top)]">
          <Link
            to="/recipes"
            aria-label="Back to recipes"
            className="grid size-11 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm backdrop-blur transition active:scale-95"
          >
            <ArrowLeftIcon size={18} weight="bold" />
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        <div className="px-5 pt-4">
          <h1 className="font-semibold text-[22px] text-slate-900 leading-tight tracking-tight">
            {recipe.title}
          </h1>
          {recipe.description.length > 0 && (
            <p className="mt-1.5 text-pretty text-[14px] text-slate-500 leading-relaxed">
              {recipe.description}
            </p>
          )}
          <div className="mt-3.5 flex items-center gap-4">
            <MetaChip icon={ClockIcon}>{formatMinutes(recipe.minutes)}</MetaChip>
            <MetaChip icon={ForkKnifeIcon}>Serves {recipe.serves}</MetaChip>
            <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
              <Avatar cook={recipe.cook} size={20} />
              <span className="font-medium text-slate-600">{recipe.cook.name}</span>
            </span>
          </div>
        </div>

        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[11px] text-slate-400 uppercase tracking-[0.12em]">
              Ingredients · {recipe.ingredients.length}
            </h2>
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-slate-900 pr-3 pl-2.5 font-medium text-[12px] text-white transition active:scale-95"
            >
              <BasketIcon size={14} weight="bold" />
              Add to grocery
            </button>
          </div>
          <div className="mt-1 divide-y divide-slate-100">
            {recipe.ingredients.map((ingredient) => (
              <IngredientRow
                key={ingredient.name}
                name={ingredient.name}
                quantity={ingredient.quantity}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 border-slate-100 border-t bg-white px-5 pt-2.5 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        <button
          type="button"
          onClick={() => setView("method")}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl font-semibold text-[15px] text-white transition active:scale-[0.99]"
          style={{ background: ACCENT }}
        >
          <CookingPotIcon size={18} weight="fill" />
          Start cooking
        </button>
      </div>

      <BottomNav active="recipes" />
      <AddToGroceryDrawer recipe={recipe} open={drawerOpen} onOpenChange={setDrawerOpen} />
    </Shell>
  );
};

export const RecipeDetailScreen = ({ recipeId }: { recipeId: string }): ReactElement => {
  const idResult = v.safeParse(RecipeIdSchema, recipeId);
  const recipe = useQuery({
    queryKey: ["recipes", "detail", recipeId],
    queryFn: () => {
      if (!idResult.success) throw new Error("invalid recipe id");
      return fetchRecipe(idResult.output);
    },
    enabled: idResult.success,
  });

  if (!idResult.success) return <NotFound />;

  if (recipe.isPending) {
    return (
      <Shell>
        <div className="h-44 w-full shrink-0 animate-pulse bg-slate-100" />
        <div className="flex-1 space-y-3 bg-white px-5 pt-5">
          <div className="h-6 w-2/3 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
        <BottomNav active="recipes" />
      </Shell>
    );
  }

  if (recipe.isError) {
    const message = recipe.error instanceof Error ? recipe.error.message : "";
    if (message.includes("404") || message.includes("not_found")) return <NotFound />;
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <WarningCircleIcon size={40} weight="fill" className="text-slate-300" />
          <div>
            <p className="font-medium text-base text-slate-900">Couldn't load this recipe</p>
            <p className="mt-1 text-slate-500 text-sm">Check your connection and try again.</p>
          </div>
          <button
            type="button"
            onClick={() => void recipe.refetch()}
            className="flex min-h-11 items-center justify-center rounded-2xl bg-slate-900 px-6 font-medium text-base text-white transition active:scale-[0.98]"
          >
            Try again
          </button>
        </div>
        <BottomNav active="recipes" />
      </Shell>
    );
  }

  return <RecipeView recipe={recipe.data} />;
};
