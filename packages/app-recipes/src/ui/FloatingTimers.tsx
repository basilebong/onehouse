import { BellRingingIcon, CheckIcon, TimerIcon, XIcon } from "@phosphor-icons/react";
import type { ReactElement } from "react";
import { match } from "ts-pattern";
import { type TimerMap, formatClock, viewTimer } from "../shared/index.ts";
import { cn } from "./cn.ts";

type FloatingTimersProps = {
  timers: TimerMap;
  now: number;
  accent: string;
  onCancel: (id: string) => void;
};

export const FloatingTimers = ({
  timers,
  now,
  accent,
  onCancel,
}: FloatingTimersProps): ReactElement | null => {
  const entries = Object.entries(timers);
  if (entries.length === 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-40 mx-auto flex max-w-md flex-col gap-2">
      {entries.map(([id, timer]) => {
        const display = match(viewTimer(timer, now))
          .with({ kind: "idle" }, () => ({ done: false, fraction: 0, clock: formatClock(0) }))
          .with({ kind: "running" }, ({ remainingMs, fraction }) => ({
            done: false,
            fraction,
            clock: formatClock(remainingMs),
          }))
          .with({ kind: "done" }, () => ({ done: true, fraction: 1, clock: "0:00" }))
          .exhaustive();

        return (
          <div
            key={id}
            className={cn(
              "relative flex items-center gap-3 overflow-hidden rounded-2xl bg-slate-900 px-3.5 py-2.5 text-white shadow-lg shadow-slate-900/25",
              display.done && "animate-oh-ring",
            )}
          >
            <span
              className="absolute inset-y-0 left-0 opacity-30"
              style={{ width: `${display.fraction * 100}%`, background: accent }}
            />
            {display.done ? (
              <BellRingingIcon
                size={18}
                weight="fill"
                className="relative"
                style={{ color: accent }}
              />
            ) : (
              <TimerIcon
                size={18}
                weight="fill"
                className="relative animate-pulse"
                style={{ color: accent }}
              />
            )}
            <div className="relative min-w-0 flex-1">
              <div className="truncate font-medium text-[13px]">{timer.label}</div>
              <div className="text-[11px] text-white/60 tabular-nums">
                {display.done ? "Time’s up" : "counting down"}
              </div>
            </div>
            <span className="relative font-semibold text-[17px] tabular-nums">{display.clock}</span>
            <button
              type="button"
              onClick={() => onCancel(id)}
              aria-label={`Stop ${timer.label} timer`}
              className="relative grid size-7 place-items-center rounded-full bg-white/10 transition active:bg-white/20"
            >
              {display.done ? (
                <CheckIcon size={13} weight="bold" />
              ) : (
                <XIcon size={13} weight="bold" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
};
