let audioCtx: AudioContext | null = null;

const getCtx = (): AudioContext | null => {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return null;
  if (audioCtx === null) audioCtx = new AudioContext();
  return audioCtx;
};

export const unlockAudio = (): void => {
  const ctx = getCtx();
  if (ctx !== null && ctx.state === "suspended") void ctx.resume();
};

export const playChime = (): void => {
  const ctx = getCtx();
  if (ctx === null) return;
  if (ctx.state === "suspended") void ctx.resume();
  const start = ctx.currentTime;
  for (const [index, frequency] of [880, 1320, 1760].entries()) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    const at = start + index * 0.16;
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(0.25, at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.15);
    osc.connect(gain).connect(ctx.destination);
    osc.start(at);
    osc.stop(at + 0.16);
  }
};
