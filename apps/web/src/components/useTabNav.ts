import type { NavTab } from "@onehouse/app-grocery/ui";
import { useRouter } from "@tanstack/react-router";
import { useCallback } from "react";
import { match } from "ts-pattern";

export const useTabNav = (): ((tab: NavTab) => void) => {
  const router = useRouter();
  return useCallback(
    (tab: NavTab) => {
      match(tab)
        .with("grocery", () => void router.navigate({ to: "/grocery" }))
        .with("me", () => void router.navigate({ to: "/me" }))
        .with("todo", () => {})
        .exhaustive();
    },
    [router],
  );
};
