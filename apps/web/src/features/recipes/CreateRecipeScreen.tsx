import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { toast } from "sonner";

import { createRecipe } from "@/lib/recipes-api";
import { RecipeForm } from "./RecipeForm";

export const CreateRecipeScreen = (): ReactElement => {
  const qc = useQueryClient();
  const navigate = useNavigate();

  const create = useMutation({
    mutationFn: createRecipe,
    onSuccess: (recipe) => {
      void qc.invalidateQueries({ queryKey: ["recipes", "list"] });
      toast.success("Recipe saved");
      void navigate({ to: "/recipes/$recipeId", params: { recipeId: recipe.id } });
    },
    onError: () => toast.error("Couldn't save recipe"),
  });

  return (
    <RecipeForm
      heading="New recipe"
      submitLabel="Save recipe"
      pending={create.isPending}
      cancelSlot={
        <Link
          to="/recipes"
          className="px-2 font-medium text-[15px] text-slate-500 active:text-slate-700"
        >
          Cancel
        </Link>
      }
      onSubmit={(input) => create.mutate(input)}
    />
  );
};
