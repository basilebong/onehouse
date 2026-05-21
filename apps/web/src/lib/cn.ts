// clsx + tailwind-merge helper. Used everywhere shadcn primitives need
// conditional className merging. See .claude/rules/ui.md.

// TODO(basile): install clsx + tailwind-merge.
// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";
//
// export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));

export const cn = (...classes: (string | false | null | undefined)[]): string =>
  classes.filter(Boolean).join(" ");
