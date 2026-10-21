export const START_BPM = 90;
const STEP_BPM = 10;
export const STEP_BEATS = 8;
export const COUNT_IN = 4;
export const LIVES = 3;
export const HAND = { from: 0.25, to: 0.75 } as const;

const GREAT_MS = 40;
const GOOD_MS = 100;

export const tempoAt = (beat: number) =>
  START_BPM + STEP_BPM * Math.floor(Math.max(0, beat) / STEP_BEATS);

export const intervalAt = (beat: number) => 60_000 / tempoAt(beat);

export const windowsAt = (beat: number) => {
  const interval = intervalAt(beat);
  return {
    good: Math.min(GOOD_MS, interval * HAND.from),
    great: Math.min(GREAT_MS, interval * 0.1),
  };
};

export type Ending = "hand" | "miss";

export interface Run {
  beat: number;
  at: number;
  gap: number;
  pounds: number;
  greats: number;
  misses: number;
  streak: number;
  longest: number;
  tempo: number;
  over: Ending | null;
}

export type Strike =
  | { kind: "great" | "good"; offset: number; beat: number }
  | { kind: "flub" | "hand" | "idle" };

export const createRun = (now: number): Run => ({
  at: now + COUNT_IN * intervalAt(0),
  beat: 0,
  gap: intervalAt(0),
  greats: 0,
  longest: 0,
  misses: 0,
  over: null,
  pounds: 0,
  streak: 0,
  tempo: START_BPM,
});

const step = (run: Run) => {
  run.gap = intervalAt(run.beat);
  run.at += run.gap;
  run.beat += 1;
};

export const resume = (run: Run, now: number) => {
  run.gap = intervalAt(run.beat);
  run.at = now + COUNT_IN * run.gap;
};

export const counting = (run: Run, now: number) => now < run.at - run.gap;

export const advance = (run: Run, now: number) => {
  let missed = 0;
  while (run.over === null && now > run.at + windowsAt(run.beat).good) {
    missed += 1;
    run.misses += 1;
    run.streak = 0;
    step(run);
    if (run.misses >= LIVES) {
      run.over = "miss";
    }
  }
  return missed;
};

export const sweep = (run: Run, now: number) =>
  now >= run.at
    ? (now - run.at) / intervalAt(run.beat)
    : 1 - (((run.at - now) / run.gap) % 1);

export const strike = (run: Run, now: number): Strike => {
  if (run.over !== null || counting(run, now)) {
    return { kind: "idle" };
  }
  advance(run, now);
  if (run.over !== null) {
    return { kind: "idle" };
  }
  const offset = now - run.at;
  const { good, great } = windowsAt(run.beat);
  if (Math.abs(offset) <= good) {
    const kind = Math.abs(offset) <= great ? "great" : "good";
    const { beat } = run;
    run.pounds += 1;
    run.greats += kind === "great" ? 1 : 0;
    run.streak += 1;
    run.longest = Math.max(run.longest, run.streak);
    run.tempo = tempoAt(beat);
    step(run);
    return { beat, kind, offset };
  }
  const at = sweep(run, now);
  if (at >= HAND.from && at <= HAND.to) {
    run.over = "hand";
    return { kind: "hand" };
  }
  run.streak = 0;
  return { kind: "flub" };
};

export const reach = (at: number) => {
  const from = HAND.from - 0.06;
  const to = HAND.to + 0.04;
  if (at <= from || at >= to) {
    return 0;
  }
  return Math.sin(((at - from) / (to - from)) * Math.PI);
};
