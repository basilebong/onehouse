import { createAuthClient } from "better-auth/react";

const baseURL =
  import.meta.env.VITE_AUTH_URL ??
  (typeof window === "undefined" ? "http://localhost:5173" : window.location.origin);

const authClient = createAuthClient({ baseURL });

export const signInWithGoogle = (callbackURL = "/"): Promise<unknown> =>
  authClient.signIn.social({
    provider: "google",
    callbackURL,
    errorCallbackURL: "/sign-in/rejected",
  });

export const signOut = (): Promise<unknown> => authClient.signOut();

export const useSession = authClient.useSession;
