import { BellRingingIcon, CheckIcon, TimerIcon, XIcon } from "@phosphor-icons/react";
import type { ReactElement } from "react";
import { match } from "ts-pattern";
import { type Timer, formatClock, viewTimer } from "../shared/index.ts";

type TimeChipProps = {
  id: string;
  minutes: number;
  label: string;
  timer: Timer | undefined;
  now: number;
  accent: string;
  onStart: (id: string, label: string, minutes: number) => void;
  onCancel: (id: string) => void;
};

export const TimeChip = ({
  id,
  minutes,
  label,
  timer,
  now,
  accent,
  onStart,
  onCancel,
}: TimeChipProps): ReactElement =>
  match(viewTimer(timer, now))
    .with({ kind: "idle" }, () => (
      <button
        type="button"
        onClick={() => onStart(id, label, minutes)}
        className="group inline-flex h-8 items-center gap-1.5 rounded-full bg-slate-100 pr-3 pl-2.5 font-semibold text-[13px] text-slate-700 transition active:scale-95"
      >
        <TimerIcon size={16} className="text-slate-500" />
        <span className="tabular-nums">{minutes} min</span>
      </button>
    ))
    .with({ kind: "running" }, ({ remainingMs, fraction }) => (
      <span
        className="relative inline-flex h-8 select-none items-center gap-1.5 overflow-hidden rounded-full pr-1.5 pl-2.5 font-semibold text-[13px] text-white"
        style={{ background: accent }}
      >
        <span
          className="absolute inset-y-0 left-0 bg-black/10"
          style={{ width: `${fraction * 100}%` }}
        />
        <TimerIcon size={15} weight="fill" className="relative animate-pulse" />
        <span className="relative tabular-nums">{formatClock(remainingMs)}</span>
        <button
          type="button"
          onClick={() => onCancel(id)}
          aria-label={`Cancel ${label} timer`}
          className="relative grid size-5 place-items-center rounded-full bg-white/25 transition active:bg-white/40"
        >
          <XIcon size={10} weight="bold" />
        </button>
      </span>
    ))
    .with({ kind: "done" }, () => (
      <span
        className="inline-flex h-8 animate-oh-ring select-none items-center gap-1.5 rounded-full px-3 font-semibold text-[13px] text-white shadow-sm"
        style={{ background: accent }}
      >
        <BellRingingIcon size={15} weight="fill" />
        Done
        <button
          type="button"
          onClick={() => onCancel(id)}
          aria-label={`Dismiss ${label} timer`}
          className="-mr-1 grid size-5 place-items-center rounded-full bg-white/25 transition active:bg-white/40"
        >
          <CheckIcon size={10} weight="bold" />
        </button>
      </span>
    ))
    .exhaustive();
