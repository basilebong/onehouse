import { CookingPotIcon } from "@phosphor-icons/react";
import type { ReactElement } from "react";

import { BottomNav } from "@/components/BottomNav";

export const RecipesScreen = (): ReactElement => (
  <main className="flex min-h-dvh flex-col bg-slate-50">
    <header className="shrink-0 bg-white px-5 pt-[max(env(safe-area-inset-top),0.5rem)] pb-3">
      <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">Recipes</h1>
    </header>
    <div className="flex flex-1 items-center justify-center bg-white px-10">
      <div className="-mt-16 text-center">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-slate-100">
          <CookingPotIcon size={34} weight="duotone" className="text-slate-400" />
        </div>
        <div className="font-semibold text-lg text-slate-900">Recipes are coming soon</div>
        <div className="mt-1 text-slate-500 text-sm leading-relaxed">
          Meal ideas, ingredients, and step-by-step cooking will land here next.
        </div>
      </div>
    </div>
    <BottomNav active="recipes" />
  </main>
);
