import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import * as v from "valibot";

import { CheckingScreen } from "@/features/auth/CheckingScreen";
import { FirstArrivalScreen } from "@/features/auth/FirstArrivalScreen";
import { RejectedScreen } from "@/features/auth/RejectedScreen";
import { SignInScreen } from "@/features/auth/SignInScreen";

export const rootRoute = createRootRoute({
  component: Outlet,
});

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: CheckingScreen,
});

const signInSearchSchema = v.object({
  error: v.optional(v.picklist(["google_unreachable", "google_cancelled"])),
});

export const signInRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in",
  validateSearch: (search): v.InferOutput<typeof signInSearchSchema> =>
    v.parse(signInSearchSchema, search),
  component: SignInScreen,
});

const rejectedSearchSchema = v.object({
  email: v.optional(v.pipe(v.string(), v.email())),
});

export const rejectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/sign-in/rejected",
  validateSearch: (search): v.InferOutput<typeof rejectedSearchSchema> =>
    v.parse(rejectedSearchSchema, search),
  component: RejectedScreen,
});

export const welcomeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/welcome",
  component: FirstArrivalScreen,
});

const routeTree = rootRoute.addChildren([indexRoute, signInRoute, rejectedRoute, welcomeRoute]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
