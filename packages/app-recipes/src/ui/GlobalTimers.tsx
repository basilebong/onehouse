import type { ReactElement } from "react";
import { FloatingTimers } from "./FloatingTimers.tsx";
import { useTimers } from "./useTimers.ts";

const ACCENT = "#ff6b35";

export const GlobalTimers = (): ReactElement | null => {
  const { timers, now, cancel } = useTimers();
  return <FloatingTimers timers={timers} now={now} accent={ACCENT} onCancel={cancel} />;
};
