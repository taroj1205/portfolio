import { LAST } from "./phases";

export const TICK = 1 / 120;
export const SHORTEST = 3600;
export const LONGEST = 5600;

const MODULUS = 2_147_483_647;
const WARM_UP = 4;
const GRAVITY = 49;
const DAMPING = 1;
const SHARES = [0.11, 0.19, 0.28, 0.21, 0.21];
const LIMITS = [16, 13, 14, 12, 10].map((degrees) => (degrees * Math.PI) / 180);
const BLEND = 1.5;
const GUST = 0.11;
const BREEZE = 0.03;
const WRIST = 25;

export interface Point {
  x: number;
  y: number;
}

interface Gust {
  at: number;
  span: number;
  push: number;
}

export interface Stick {
  seed: number;
  length: number;
  starts: readonly number[];
  vigour: number;
  breeze: number;
  gusts: readonly Gust[];
}

export type End = "released" | "shaken" | "burned";

export interface Run {
  stick: Stick;
  time: number;
  hand: Point;
  pace: Point;
  bob: Point;
  last: Point;
  sway: number;
  end: End | null;
}

const randomFrom = (seed: number) => {
  let state = (Math.abs(Math.floor(seed)) % (MODULUS - 1)) + 1;
  const roll = () => {
    state = (state * 48_271) % MODULUS;
    return (state - 1) / (MODULUS - 1);
  };
  for (let i = 0; i < WARM_UP; i += 1) {
    roll();
  }
  return roll;
};

export const createStick = (seed: number): Stick => {
  const roll = randomFrom(seed);
  const length = SHORTEST + Math.floor(roll() * (LONGEST - SHORTEST + 1));
  const seconds = length / 100;
  const weights = SHARES.map((share) => share * (0.8 + roll() * 0.4));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const starts: number[] = [];
  let at = 0;
  for (const weight of weights) {
    starts.push(at);
    at += (weight / total) * seconds;
  }
  const vigour = 0.8 + roll() * 0.45;
  const windiness = 0.35 + roll() * 0.65;
  const breeze = (roll() * 2 - 1) * BREEZE * windiness;
  const gusts: Gust[] = [];
  let next = 3 + roll() * 5;
  while (next < seconds) {
    const span = 1.4 + roll() * 2.6;
    const side = roll() < 0.5 ? -1 : 1;
    gusts.push({
      at: next,
      push: side * GUST * windiness * (0.45 + roll() * 0.55),
      span,
    });
    next += span + 2.5 + roll() * 7;
  }
  return { breeze, gusts, length, seed, starts, vigour };
};

export const phaseAt = (stick: Stick, time: number) => {
  let phase = 0;
  while (phase < LAST && time >= (stick.starts[phase + 1] ?? Infinity)) {
    phase += 1;
  }
  return phase;
};

export const progressAt = (stick: Stick, time: number) => {
  const phase = phaseAt(stick, time);
  const start = stick.starts[phase] ?? 0;
  const end = stick.starts[phase + 1] ?? stick.length / 100;
  return Math.min(1, Math.max(0, (time - start) / (end - start)));
};

export const windAt = (stick: Stick, time: number) => {
  let wind = stick.breeze * Math.sin(time * 0.41 + (stick.seed % 7));
  for (const gust of stick.gusts) {
    const into = (time - gust.at) / gust.span;
    if (into > 0 && into < 1) {
      wind += gust.push * Math.sin(Math.PI * into) ** 2;
    }
  }
  return wind;
};

const limitAt = (stick: Stick, time: number) => {
  const phase = phaseAt(stick, time);
  const limit = LIMITS[phase] ?? 0;
  const next = stick.starts[phase + 1];
  const following = LIMITS[phase + 1];
  if (next === undefined || following === undefined || next - time > BLEND) {
    return limit;
  }
  return following + ((limit - following) * (next - time)) / BLEND;
};

export const createRun = (stick: Stick, time = 0): Run => ({
  bob: { x: 0, y: 1 },
  end: null,
  hand: { x: 0, y: 0 },
  last: { x: 0, y: 1 },
  pace: { x: 0, y: 0 },
  stick,
  sway: 0,
  time,
});

const follow = (at: number, speed: number, target: number) =>
  speed + (WRIST * WRIST * (target - at) - 2 * WRIST * speed) * TICK;

export const hundredths = (run: Run) =>
  run.end === "burned"
    ? run.stick.length
    : Math.min(run.stick.length - 1, Math.floor(run.time * 100 + 1e-6));

export const step = (run: Run, finger: Point, held: boolean) => {
  if (run.end !== null) {
    return;
  }
  if (!held) {
    run.end = "released";
    return;
  }
  const pace = {
    x: follow(run.hand.x, run.pace.x, finger.x),
    y: follow(run.hand.y, run.pace.y, finger.y),
  };
  const hand = { x: run.hand.x + pace.x * TICK, y: run.hand.y + pace.y * TICK };
  run.pace = pace;
  run.hand = hand;
  const keep = 1 - DAMPING * TICK;
  const push = windAt(run.stick, run.time) * GRAVITY * TICK * TICK;
  const x = run.bob.x + (run.bob.x - run.last.x) * keep + push;
  const y = run.bob.y + (run.bob.y - run.last.y) * keep + GRAVITY * TICK * TICK;
  run.last = run.bob;
  const dx = x - hand.x;
  const dy = y - hand.y;
  const reach = Math.hypot(dx, dy) || 1;
  run.bob = { x: hand.x + dx / reach, y: hand.y + dy / reach };
  const angle = Math.atan2(dx, dy);
  const vx = (run.bob.x - run.last.x) / TICK - pace.x;
  const vy = (run.bob.y - run.last.y) / TICK - pace.y;
  const along = vx * Math.cos(angle) - vy * Math.sin(angle);
  const energy = (along * along) / (2 * GRAVITY) + 1 - Math.cos(angle);
  const swing = Math.acos(Math.max(-1, 1 - energy));
  run.sway = swing / limitAt(run.stick, run.time);
  run.time += TICK;
  if (run.time >= run.stick.length / 100 - 1e-9) {
    run.time = run.stick.length / 100;
    run.end = "burned";
  } else if (run.sway >= 1) {
    run.end = "shaken";
  }
};
