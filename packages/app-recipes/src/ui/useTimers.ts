import { useCallback, useEffect, useState } from "react";
import { type TimerMap, cancelTimer, hasActiveTimer, startTimer } from "../shared/index.ts";

export type UseTimers = {
  timers: TimerMap;
  now: number;
  start: (id: string, label: string, minutes: number) => void;
  cancel: (id: string) => void;
};

const TICK_MS = 500;

export const useTimers = (): UseTimers => {
  const [timers, setTimers] = useState<TimerMap>(() => ({}));
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (!hasActiveTimer(timers, Date.now())) return undefined;
    const interval = setInterval(() => {
      const at = Date.now();
      setNow(at);
      if (!hasActiveTimer(timers, at)) clearInterval(interval);
    }, TICK_MS);
    return () => clearInterval(interval);
  }, [timers]);

  const start = useCallback((id: string, label: string, minutes: number): void => {
    const at = Date.now();
    setNow(at);
    setTimers((prev) => startTimer(prev, id, label, minutes, at));
  }, []);

  const cancel = useCallback((id: string): void => {
    setTimers((prev) => cancelTimer(prev, id));
  }, []);

  return { timers, now, start, cancel };
};
