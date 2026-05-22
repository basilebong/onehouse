import { useRouter } from "@tanstack/react-router";
import { useEffect } from "react";

import { useSession } from "@/lib/auth-client";

import { Spinner } from "./atoms/Spinner";

type Identity = {
  initial: string;
  name: string;
};

const fallbackIdentity: Identity = { initial: "·", name: "friend" };

const deriveIdentity = (
  name: string | null | undefined,
  email: string | null | undefined,
): Identity => {
  if (typeof name === "string" && name.trim().length > 0) {
    const first = name.trim().split(/\s+/)[0] ?? name.trim();
    return { initial: first[0]?.toUpperCase() ?? "·", name: first };
  }
  if (typeof email === "string" && email.length > 0) {
    const local = email.split("@")[0] ?? email;
    return { initial: local[0]?.toUpperCase() ?? "·", name: local };
  }
  return fallbackIdentity;
};

export const CheckingScreen = (): React.ReactElement => {
  const router = useRouter();
  const session = useSession();
  const user = session.data?.user;

  useEffect(() => {
    if (!session.isPending && session.data === null) {
      router.navigate({ to: "/sign-in" });
    }
  }, [session.isPending, session.data, router]);

  if (session.isPending || user === undefined) {
    return (
      <main className="flex min-h-dvh flex-col bg-slate-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        <div className="-mt-12 flex flex-1 items-center justify-center">
          <Spinner size={24} color="#0f172a" />
        </div>
      </main>
    );
  }

  const identity = deriveIdentity(user.name, user.email);

  return (
    <main className="flex min-h-dvh flex-col bg-slate-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="-mt-12 flex flex-1 flex-col items-center justify-center px-8">
        <div className="grid size-20 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-rose-400 font-semibold text-[28px] text-white shadow-md shadow-rose-400/20">
          {identity.initial}
        </div>
        <div className="mt-6 font-semibold text-[20px] text-slate-900">
          Welcome back, {identity.name}
        </div>
        <div className="mt-3 inline-flex items-center gap-2 text-[13px] text-slate-500">
          <Spinner size={14} />
          Unlocking the house…
        </div>
      </div>
    </main>
  );
};
