import { cn } from "@/lib/cn";
import type { ReactElement } from "react";

export const MeTopBar = ({ online }: { online: boolean }): ReactElement => (
  <header className="shrink-0 bg-white px-5 pt-[max(env(safe-area-inset-top),0.5rem)] pb-3">
    <div className="flex items-center justify-between">
      <h1 className="font-semibold text-2xl text-slate-900 tracking-tight">Me</h1>
      <span
        role="img"
        aria-label={online ? "Online" : "Offline"}
        title={online ? "Online" : "Offline"}
        className={cn("size-2 rounded-full", online ? "bg-emerald-500" : "bg-slate-300")}
      />
    </div>
  </header>
);
