import type { ReactNode } from "react";

import { Wordmark } from "./Wordmark";

type LoginScaffoldProps = {
  children: ReactNode;
  footnote?: boolean;
};

export const LoginScaffold = ({
  children,
  footnote = true,
}: LoginScaffoldProps): React.ReactElement => (
  <div className="flex flex-1 flex-col px-6 pt-24 pb-10">
    <div className="flex flex-col items-start">
      <Wordmark />
      <h1 className="mt-10 font-semibold text-[28px] text-slate-900 leading-[1.15] tracking-tight">
        The family
        <br />
        home screen.
      </h1>
      <p className="mt-3 max-w-[280px] text-[15px] text-slate-500 leading-relaxed">
        One quiet place for the small things you share — groceries, chores, the calendar.
      </p>
    </div>

    <div className="flex-1" />

    {children}

    {footnote ? (
      <p className="mx-auto mt-5 max-w-[260px] text-center text-[12px] text-slate-400 leading-snug">
        Invite-only · By signing in you accept our{" "}
        <span className="text-slate-500 underline decoration-slate-300 underline-offset-2">
          house rules
        </span>
        .
      </p>
    ) : null}
  </div>
);
