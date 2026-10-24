export type Side = "left" | "right";

export const fakes = ["cat", "leaf", "crow", "wind"] as const;

export type Fake = (typeof fakes)[number];

export type Random = () => number;

export const TOO_FAST = 100;
export const TOO_LATE = 1000;
export const GRACE = 30;

const WAIT = { max: 6000, min: 1600, scale: 1500 };
const FAKE_LEAD = 600;
const FAKE_CLEAR = 350;
const FAKE_GAP = 250;
const FOOLED = 500;

export const fakeLength: Record<Fake, number> = {
  cat: 2200,
  crow: 1500,
  leaf: 2000,
  wind: 1300,
};

export interface Rung {
  base: number;
  spread: number;
  fakes: readonly [number, number];
}

export const ladder: readonly Rung[] = [
  { base: 540, fakes: [0, 1], spread: 50 },
  { base: 440, fakes: [1, 1], spread: 35 },
  { base: 365, fakes: [1, 2], spread: 25 },
  { base: 305, fakes: [1, 2], spread: 20 },
  { base: 250, fakes: [2, 2], spread: 18 },
];

export const CHALLENGE_FAKES = [1, 2] as const;
export const VERSUS_FAKES = [0, 2] as const;

export const slowestOf = (rung: Rung) => rung.base + rung.spread;

interface Cue {
  kind: Fake;
  at: number;
  length: number;
}

export interface Plan {
  wait: number;
  cues: Cue[];
  rival: number | null;
}

export interface Tap {
  side: Side;
  at: number;
}

export type Call =
  | { kind: "early"; side: Side; reaction: number | null; fake: Fake | null }
  | { kind: "cut"; side: Side; reaction: number }
  | { kind: "draw"; reaction: number }
  | { kind: "none" };

export const planWait = (random: Random) => {
  const tail = 1 - Math.exp(-(WAIT.max - WAIT.min) / WAIT.scale);

  return WAIT.min - WAIT.scale * Math.log(1 - random() * tail);
};

const shuffled = <T>(list: readonly T[], random: Random) => {
  const out = [...list];

  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }

  return out;
};

export const planCues = (random: Random, wait: number, count: number) => {
  const cues: Cue[] = [];
  let from = FAKE_LEAD;

  for (const [i, kind] of shuffled(fakes, random).slice(0, count).entries()) {
    const length = fakeLength[kind];
    const latest = wait - FAKE_CLEAR - length;

    if (latest >= from) {
      const at = from + random() * ((latest - from) / (count - i));
      cues.push({ at, kind, length });
      from = at + length + FAKE_GAP;
    }
  }

  return cues;
};

export const planDuel = (
  random: Random,
  rival: number | null,
  [fewest, most]: readonly [number, number]
): Plan => {
  const wait = planWait(random);
  const count = fewest + Math.floor(random() * (most - fewest + 1));

  return { cues: planCues(random, wait, count), rival, wait };
};

export const rivalOf = (rung: Rung, random: Random) =>
  Math.round(rung.base + (random() * 2 - 1) * rung.spread);

const firstTaps = (taps: readonly Tap[], startedAt: number) => {
  const seen = new Map<Side, Tap>();

  for (const tap of taps) {
    const known = seen.get(tap.side);

    if (tap.at >= startedAt && (known === undefined || tap.at < known.at)) {
      seen.set(tap.side, tap);
    }
  }

  return [...seen.values()];
};

const blame = (plan: Plan, startedAt: number, at: number) =>
  plan.cues.find(
    (cue) =>
      at >= startedAt + cue.at && at <= startedAt + cue.at + cue.length + FOOLED
  )?.kind ?? null;

export const reactionOf = (
  taps: readonly Tap[],
  side: Side,
  startedAt: number,
  signalAt: number | null
) => {
  const tap = firstTaps(taps, startedAt).find((each) => each.side === side);

  if (tap === undefined || signalAt === null) {
    return null;
  }

  const reaction = Math.round(tap.at - signalAt);

  return reaction >= TOO_FAST && reaction <= TOO_LATE ? reaction : null;
};

interface Moment {
  plan: Plan;
  startedAt: number;
  signalAt: number | null;
  taps: readonly Tap[];
  now: number;
}

export const decide = ({
  plan,
  startedAt,
  signalAt,
  taps,
  now,
}: Moment): Call | null => {
  const entries = firstTaps(taps, startedAt);

  if (plan.rival !== null && signalAt !== null) {
    entries.push({ at: signalAt + plan.rival, side: "right" });
  }

  entries.sort((a, b) => a.at - b.at);
  const [first, second] = entries;

  if (first === undefined) {
    return signalAt !== null && now >= signalAt + TOO_LATE + GRACE
      ? { kind: "none" }
      : null;
  }

  if (now < first.at + GRACE) {
    return null;
  }

  if (signalAt === null || first.at < signalAt) {
    return {
      fake: blame(plan, startedAt, first.at),
      kind: "early",
      reaction: null,
      side: first.side,
    };
  }

  const reaction = Math.round(first.at - signalAt);

  if (reaction < TOO_FAST) {
    return { fake: null, kind: "early", reaction, side: first.side };
  }

  if (second !== undefined && Math.round(second.at - signalAt) === reaction) {
    return { kind: "draw", reaction };
  }

  return { kind: "cut", reaction, side: first.side };
};

export const cueAt = (plan: Plan, startedAt: number, now: number) => {
  for (const cue of plan.cues) {
    const t = (now - startedAt - cue.at) / cue.length;

    if (t >= 0 && t <= 1) {
      return { kind: cue.kind, t };
    }
  }

  return null;
};

export const other = (side: Side): Side => (side === "left" ? "right" : "left");
