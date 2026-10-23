export const bottles = ["isshobin", "tokkuri", "katakuchi"] as const;

export type Bottle = (typeof bottles)[number];

export const cups = ["masu", "mokkiri"] as const;

export type Cup = (typeof cups)[number];

const LONGEST = 20;
const MOKKIRI = 0.4;

type Range = readonly [number, number];

interface Feel {
  lag: Range;
  beat: Range;
  swing: Range;
  trickle: Range;
}

const feels: Record<Bottle, Feel> = {
  isshobin: {
    beat: [0.24, 0.32],
    lag: [0.24, 0.34],
    swing: [0.55, 0.75],
    trickle: [0.55, 0.75],
  },
  katakuchi: {
    beat: [0.5, 0.75],
    lag: [0.1, 0.16],
    swing: [0.14, 0.26],
    trickle: [0.3, 0.42],
  },
  tokkuri: {
    beat: [0.14, 0.2],
    lag: [0.14, 0.22],
    swing: [0.35, 0.5],
    trickle: [0.4, 0.55],
  },
};

const BRIM_TIME: Range = [2.3, 3.3];
const DOME_TIME: Range = [0.75, 1.2];
const RISE: Range = [2.4, 4.2];
const DRAIN = 0.5;
const ML_PER_MM = 4.5;

export const capacity: Record<Cup, number> = { masu: 180, mokkiri: 270 };

interface Flow {
  lag: number;
  flow: number;
  swing: number;
  beats: readonly number[];
}

export interface Pour extends Flow {
  seed: number;
  bottle: Bottle;
  cup: Cup;
  trickle: number;
  dome: number;
  rise: number;
  brink: number;
}

export interface Outcome {
  hold: number;
  poured: number;
  volume: number;
  spilled: number;
  spilledAt: number | null;
  settledAt: number;
  tenths: number;
}

const MODULUS = 2_147_483_647;
const STRIDE = 1_234_567_891;
const WARM_UP = 6;

const randomFrom = (seed: number) => {
  let state = ((seed + STRIDE) % (MODULUS - 1)) + 1;
  const roll = () => {
    state = (state * 48_271) % MODULUS;
    return (state - 1) / (MODULUS - 1);
  };
  for (let i = 0; i < WARM_UP; i += 1) {
    roll();
  }
  return roll;
};

const bump = (p: number) => 30 * p * p * (1 - p) * (1 - p);

const smoother = (p: number) => p * p * p * (10 - 15 * p + 6 * p * p);

export const rateAt = (flow: Flow, t: number) => {
  for (let i = 1; i < flow.beats.length && t >= flow.lag; i += 1) {
    const start = flow.beats[i - 1] ?? 0;
    const end = flow.beats[i] ?? start;
    if (t < end) {
      const p = (t - start) / (end - start);
      return flow.flow * (1 - flow.swing + flow.swing * bump(p));
    }
  }
  return 0;
};

export const pouredAt = (flow: Flow, t: number) => {
  let volume = 0;
  for (let i = 1; i < flow.beats.length && t > flow.lag; i += 1) {
    const start = flow.beats[i - 1] ?? 0;
    const end = flow.beats[i] ?? start;
    const length = end - start;
    if (t < end) {
      const p = (t - start) / length;
      return (
        volume +
        flow.flow * length * ((1 - flow.swing) * p + flow.swing * smoother(p))
      );
    }
    volume += flow.flow * length;
  }
  return volume;
};

const crossing = (flow: Flow, limit: number) => {
  let low = flow.lag;
  let high = LONGEST;
  for (let i = 0; i < 60; i += 1) {
    const mid = (low + high) / 2;
    if (pouredAt(flow, mid) > limit) {
      high = mid;
    } else {
      low = mid;
    }
  }
  return high;
};

export const pourOf = (seed: number): Pour => {
  const roll = randomFrom(seed);
  const within = ([low, high]: Range) => low + roll() * (high - low);
  const bottle = bottles[Math.floor(roll() * bottles.length)] ?? "tokkuri";
  const cup: Cup = roll() < MOKKIRI ? "mokkiri" : "masu";
  const feel = feels[bottle];
  const brim = within(BRIM_TIME);
  const lag = within(feel.lag);
  const beat = within(feel.beat);
  const beats = [lag];
  for (let at = lag; at < LONGEST;) {
    at += beat * (0.82 + roll() * 0.36);
    beats.push(at);
  }
  const flow: Flow = { beats, flow: 1 / brim, lag, swing: within(feel.swing) };
  const dome = within(DOME_TIME) / brim;
  return {
    ...flow,
    bottle,
    brink: crossing(flow, 1 + dome),
    cup,
    dome,
    rise: within(RISE),
    seed,
    trickle: within(feel.trickle),
  };
};

export const limitOf = (pour: Pour) => 1 + pour.dome;

export const mlOf = (pour: Pour, volume: number) =>
  capacity[pour.cup] * Math.min(1, Math.max(0, volume)) +
  (Math.max(0, volume - 1) / pour.dome) * pour.rise * ML_PER_MM;

export const longestHold = (pour: Pour) => Math.ceil(pour.brink * 1000);

export const volumeAt = (pour: Pour, hold: number, t: number) => {
  if (t <= hold) {
    return pouredAt(pour, t);
  }
  const s = Math.min(1, (t - hold) / pour.trickle);
  return (
    pouredAt(pour, hold) +
    (rateAt(pour, hold) * pour.trickle * (1 - (1 - s) ** 3)) / 3
  );
};

export const flowAt = (pour: Pour, hold: number, t: number) => {
  if (t <= hold) {
    return rateAt(pour, t);
  }
  const s = Math.min(1, (t - hold) / pour.trickle);
  return rateAt(pour, hold) * (1 - s) ** 2;
};

const spillOf = (pour: Pour, hold: number) => {
  if (hold >= pour.brink) {
    return hold;
  }
  if (volumeAt(pour, hold, hold + pour.trickle) <= limitOf(pour)) {
    return null;
  }
  const share =
    (3 * (limitOf(pour) - pouredAt(pour, hold))) /
    (rateAt(pour, hold) * pour.trickle);
  return hold + (1 - Math.cbrt(1 - share)) * pour.trickle;
};

export const outcomeOf = (pour: Pour, holdMs: number): Outcome => {
  const hold = Math.min(holdMs / 1000, pour.brink);
  const poured = volumeAt(pour, hold, hold + pour.trickle);
  const spilledAt = spillOf(pour, hold);
  if (spilledAt !== null) {
    return {
      hold,
      poured,
      settledAt: Math.max(hold + pour.trickle, spilledAt + DRAIN),
      spilled: poured - 1,
      spilledAt,
      tenths: 0,
      volume: 1,
    };
  }
  return {
    hold,
    poured,
    settledAt: hold + pour.trickle,
    spilled: 0,
    spilledAt: null,
    tenths: Math.max(0, Math.floor(((poured - 1) / pour.dome) * 1000)),
    volume: poured,
  };
};

export const insideAt = (
  pour: Pour,
  hold: number,
  spilledAt: number | null,
  t: number
) => {
  if (spilledAt === null || t < spilledAt) {
    return Math.min(limitOf(pour), volumeAt(pour, hold, t));
  }
  return 1 + pour.dome * Math.max(0, 1 - (t - spilledAt) / DRAIN);
};

export const overflowAt = (
  pour: Pour,
  hold: number,
  spilledAt: number | null,
  t: number
) =>
  spilledAt === null || t < spilledAt
    ? 0
    : volumeAt(pour, hold, t) - insideAt(pour, hold, spilledAt, t);

export const domeOf = (pour: Pour, volume: number) =>
  Math.min(1, Math.max(0, (volume - 1) / pour.dome));

export const holdFor = (pour: Pour, fits: (outcome: Outcome) => boolean) => {
  for (let ms = Math.ceil(pour.lag * 1000); ms < longestHold(pour); ms += 1) {
    if (fits(outcomeOf(pour, ms))) {
      return ms;
    }
  }
  return longestHold(pour);
};

export const beatsBy = (pour: Pour, t: number) =>
  pour.beats.filter((beat) => beat <= t).length;
