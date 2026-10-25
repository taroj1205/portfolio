import type { Point } from "../../_lib/svg";

export const MOUTH = 400;
export const COLS = 50;
export const DX = MOUTH / COLS;
export const UNIT = 32;
export const SLOPE = 6;
const CREST = 0.6;
const GRAIN = 5;
export const FOOT = 186;
export const BLOCK = 3600;
export const LIMIT = 0.32;
const GAP = 260;
export const REACH = 320;
const PEAK = 22 * UNIT;

const RATE = 80;
const FALL = 3000;
const SPREAD = 100;
const FLUFF = [0.15, 0.2, 0.3, 0.2, 0.15];
const SAFE = 4 * UNIT;
const GROW = 2.6;
const NUDGE = 0.006;
const SLUMP = 0.8;
const JOLT = 0.1;
const KNOCK = 0.25;
const WOBBLE = 4;
const DAMP = 2.2;
const COUPLE = 0.0003;
const SPRING = 220;
const FRICTION = 30;
const SHOVE = 2400;
const STEP = 1 / 120;

interface Grain {
  x: number;
  y: number;
  vx: number;
  vy: number;
  lost: boolean;
}

export type Outcome =
  | { type: "spill"; at: Point }
  | { type: "slump"; at: Point; side: number }
  | {
      type: "topple";
      side: number;
      lean: number;
      cut: number;
      chunk: number[];
    }
  | { type: "empty" };

export interface Pile {
  cols: number[];
  lean: number;
  tilt: number;
  wobble: number;
  spin: number;
  cup: { x: number; v: number; aim: number; push: number };
  grains: Grain[];
  shaver: number;
  pouring: boolean;
  left: number;
  poured: number;
  spilled: number;
  peak: number;
  toppled: boolean;
  served: boolean;
  emptied: boolean;
  carry: number;
  edges: [number, number];
  random: () => number;
}

export const createPile = (random: () => number): Pile => ({
  carry: 0,
  cols: Array.from({ length: COLS }, () => 0),
  cup: { aim: 0, push: 0, v: 0, x: 0 },
  edges: [0, 0],
  emptied: false,
  grains: [],
  lean: 0,
  left: BLOCK,
  peak: 0,
  poured: 0,
  pouring: false,
  random,
  served: false,
  shaver: GAP,
  spilled: 0,
  spin: 0,
  tilt: 0,
  toppled: false,
  wobble: 0,
});

const xOf = (i: number) => -MOUTH / 2 + (i + 0.5) * DX;

export const heightOf = (cols: readonly number[]) => Math.max(0, ...cols);

export const cmOf = (height: number) => Math.round((height / UNIT) * 10) / 10;

export const dangerOf = (pile: Pile) =>
  Math.min(1, Math.abs(pile.lean) / LIMIT);

export const toWorld = (pile: Pile, x: number, y: number): Point => {
  const cos = Math.cos(pile.lean);
  const sin = Math.sin(pile.lean);

  return { x: pile.cup.x + x * cos + y * sin, y: -x * sin + y * cos };
};

const toLocal = (pile: Pile, x: number, y: number): Point => {
  const cos = Math.cos(pile.lean);
  const sin = Math.sin(pile.lean);
  const dx = x - pile.cup.x;

  return { x: dx * cos - y * sin, y: dx * sin + y * cos };
};

const frozen = (pile: Pile) => pile.toppled || pile.served;

export const aim = (pile: Pile, x: number) => {
  pile.cup.aim = Math.max(-REACH, Math.min(REACH, x));
};

export const pour = (pile: Pile, on: boolean) => {
  pile.pouring = on && !frozen(pile);
};

export const shaving = (pile: Pile) => pile.pouring && pile.left > 0;

const settleAir = (pile: Pile) => {
  pile.grains = pile.grains.filter((grain) => grain.lost);
};

export const relax = (cols: number[], tilt: number, passes: number) => {
  const drop = DX * tilt;
  const off: [number, number] = [0, 0];
  const last = cols.length - 1;

  for (let pass = 0; pass < passes; pass += 1) {
    const top = Math.max(1, ...cols);

    const limitOf = (h: number) =>
      DX * (CREST + (SLOPE - CREST) * Math.max(0, 1 - h / top));

    const limit = limitOf(0);
    const left = cols[0] - drop - limit;

    if (left > 0) {
      cols[0] -= left / 2;
      off[0] += left / 2;
    }

    const right = cols[last] + drop - limit;

    if (right > 0) {
      cols[last] -= right / 2;
      off[1] += right / 2;
    }

    for (let i = 0; i < last; i += 1) {
      const hold = limitOf(Math.min(cols[i], cols[i + 1]));
      const down = cols[i] - cols[i + 1] + drop - hold;
      const up = cols[i + 1] - cols[i] - drop - hold;

      if (down > 0) {
        cols[i] -= down / 2;
        cols[i + 1] += down / 2;
      } else if (up > 0) {
        cols[i + 1] -= up / 2;
        cols[i] += up / 2;
      }
    }
  }

  return off;
};

const slide = (pile: Pile, dt: number) => {
  const { cup } = pile;

  const push = Math.max(
    -SHOVE,
    Math.min(SHOVE, SPRING * (cup.aim - cup.x) - FRICTION * cup.v)
  );

  cup.push = push;
  cup.v += push * dt;
  cup.x += cup.v * dt;
};

const growthOf = (height: number) => (GROW * (height - SAFE)) / (PEAK - SAFE);

const balance = (pile: Pile, dt: number) => {
  const height = heightOf(pile.cols);
  pile.tilt += growthOf(height) * pile.tilt * dt;

  const swing =
    -WOBBLE * WOBBLE * pile.wobble -
    DAMP * pile.spin -
    (COUPLE * pile.cup.push * height) / PEAK;

  pile.spin += swing * dt;
  pile.wobble += pile.spin * dt;
  pile.lean = pile.tilt + pile.wobble;
};

const slump = (pile: Pile, dt: number, out: Outcome[]) => {
  const height = heightOf(pile.cols);
  const odds = Math.max(0, height - SAFE) / (PEAK - SAFE);

  if (pile.random() >= SLUMP * odds * dt) {
    return;
  }

  const side = pile.random() < 0.5 ? -1 : 1;
  const base = height * 0.6;
  const kept = pile.cols.map((h) => Math.min(h, base));

  for (const [i, h] of pile.cols.entries()) {
    const j = Math.max(0, Math.min(COLS - 1, i + side));
    kept[j] += Math.max(0, h - base);
  }

  pile.cols = kept;
  pile.tilt += side * JOLT * odds;
  pile.spin += side * KNOCK * odds;
  const top = pile.cols.indexOf(heightOf(pile.cols));
  out.push({
    at: toWorld(pile, xOf(top), pile.cols[top]),
    side,
    type: "slump",
  });
};

const spawn = (pile: Pile, dt: number) => {
  if (!pile.pouring || pile.left <= 0) {
    return;
  }

  pile.carry += RATE * dt;

  while (pile.carry >= 1 && pile.left > 0) {
    pile.carry -= 1;
    pile.left -= 1;
    pile.poured += 1;
    pile.grains.push({
      lost: false,
      vx: (pile.random() - 0.5) * 30,
      vy: -120 - pile.random() * 80,
      x: (pile.random() + pile.random() - 1) * SPREAD,
      y: pile.shaver - 30,
    });
  }
};

const land = (pile: Pile, grain: Grain) => {
  const local = toLocal(pile, grain.x, grain.y);
  const i = Math.floor((local.x + MOUTH / 2) / DX);

  if (i < 0 || i >= COLS) {
    if (grain.y < 0) {
      grain.lost = true;
      pile.spilled += 1;
    }

    return false;
  }

  if (local.y > pile.cols[i]) {
    return false;
  }

  for (const [j, share] of FLUFF.entries()) {
    const at = Math.max(0, Math.min(COLS - 1, i + j - 2));
    pile.cols[at] += GRAIN * share;
  }

  pile.tilt += (NUDGE * local.x) / (MOUTH / 2);

  return true;
};

const fall = (pile: Pile, dt: number) => {
  const kept: Grain[] = [];

  for (const grain of pile.grains) {
    grain.vy -= FALL * dt;
    grain.x += grain.vx * dt;
    grain.y += grain.vy * dt;
    const settled = !grain.lost && !frozen(pile) && land(pile, grain);

    if (!settled && grain.y > -FOOT) {
      kept.push(grain);
    }
  }

  pile.grains = kept;
};

const shed = (pile: Pile, off: [number, number], out: Outcome[]) => {
  for (const side of [0, 1] as const) {
    pile.edges[side] += off[side];

    while (pile.edges[side] >= GRAIN) {
      pile.edges[side] -= GRAIN;
      pile.spilled += 1;

      const at = toWorld(
        pile,
        side === 0 ? -MOUTH / 2 : MOUTH / 2,
        pile.cols[side === 0 ? 0 : COLS - 1]
      );

      pile.grains.push({
        lost: true,
        vx: (side === 0 ? -1 : 1) * (60 + pile.random() * 80),
        vy: 40,
        x: at.x,
        y: at.y,
      });

      if (pile.random() < 0.2) {
        out.push({ at, type: "spill" });
      }
    }
  }
};

const topple = (pile: Pile, out: Outcome[]) => {
  const cut = heightOf(pile.cols) * 0.35;
  const chunk = pile.cols.map((h) => Math.max(0, h - cut));
  pile.cols = pile.cols.map((h) => Math.min(h, cut));
  relax(pile.cols, 0, 40);
  pile.spilled += Math.round(chunk.reduce((sum, h) => sum + h, 0) / GRAIN);
  out.push({
    chunk,
    cut,
    lean: pile.lean,
    side: Math.sign(pile.lean) || 1,
    type: "topple",
  });
  pile.toppled = true;
  pile.pouring = false;
  settleAir(pile);
  pile.lean = 0;
  pile.tilt = 0;
  pile.wobble = 0;
  pile.spin = 0;
};

const tick = (pile: Pile, dt: number, out: Outcome[]) => {
  pile.shaver +=
    (heightOf(pile.cols) + GAP - pile.shaver) * Math.min(1, dt * 2.5);
  spawn(pile, dt);
  fall(pile, dt);

  if (frozen(pile)) {
    return;
  }

  slide(pile, dt);
  shed(pile, relax(pile.cols, Math.tan(pile.lean), 2), out);
  slump(pile, dt, out);
  balance(pile, dt);
  pile.peak = Math.max(pile.peak, heightOf(pile.cols));

  if (Math.abs(pile.lean) > LIMIT && heightOf(pile.cols) > SAFE) {
    topple(pile, out);

    return;
  }

  if (
    pile.left <= 0 &&
    !pile.emptied &&
    pile.grains.every((grain) => grain.lost)
  ) {
    pile.emptied = true;
    out.push({ type: "empty" });
  }
};

export const step = (pile: Pile, dt: number) => {
  const out: Outcome[] = [];
  let left = dt;

  while (left > 1e-6) {
    const slice = Math.min(STEP, left);
    tick(pile, slice, out);
    left -= slice;
  }

  return out;
};

export const serve = (pile: Pile) => {
  pile.served = true;
  pile.pouring = false;
  settleAir(pile);
  relax(pile.cols, 0, 40);
};
