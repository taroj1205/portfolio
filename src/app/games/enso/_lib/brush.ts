import { clamp01 } from "./stroke";
import type { Trace } from "./stroke";

export interface Sample {
  x: number;
  y: number;
  t: number;
}

interface Mark {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  size: number;
  tone: number;
}

export interface Bleed {
  x: number;
  y: number;
  size: number;
  alpha: number;
  born: number;
  kind: number;
  turn: number;
}

export interface Strokes {
  marks: Mark[];
  bleeds: Bleed[];
}

interface Bristle {
  offset: number;
  thick: number;
  shade: number;
  ink: number;
  thirst: number;
  floor: number;
  grain: number;
  x: number;
  y: number;
}

const COUNT = 30;
const WIDE = 0.064;
const NARROW = 0.014;
const FAST = 4.2;
const DRAIN = 0.36;
const DRY = 0.5;
const PIECE = 0.005;
const STEP = 0.008;
const BLEED_STEP = 0.011;
const DWELL = 30;
const SOAK = 900;
const PRESS = 140;
const TAIL = 7;

export const KINDS = 3;

export const seeded = (seed: number) => {
  let state = seed % 2_147_483_647 || 1;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const hash = (value: number) => {
  const s = Math.sin(value * 12.9898) * 43_758.5453;
  return s - Math.floor(s);
};

const streak = (at: number) => {
  const cell = Math.floor(at);
  const f = at - cell;
  const ease = f * f * (3 - 2 * f);
  return hash(cell) + (hash(cell + 1) - hash(cell)) * ease;
};

export const createBrush = (seed: number) => {
  const roll = seeded(seed);
  const bristles: Bristle[] = Array.from({ length: COUNT }, (_, i) => {
    const offset = -1 + (2 * i) / (COUNT - 1) + (roll() - 0.5) * 0.05;
    return {
      floor: Math.abs(offset) < 0.35 ? 0.2 : 0,
      grain: roll() * 1000,
      ink: 0.92 + roll() * 0.08,
      offset,
      shade: roll() * 0.1,
      thick: 0.75 + roll() * 0.5,
      thirst: 0.7 + roll() * 0.5 + offset * offset * 0.6,
      x: 0,
      y: 0,
    };
  });
  const trace: Trace[] = [];
  let last: Sample = { t: 0, x: 0, y: 0 };
  let tip = { x: 0, y: 0 };
  let start = 0;
  let width = WIDE * 0.8;
  let pace = 0;
  let ux = 1;
  let uy = 0;
  let along = 0;
  let bled = 0;
  let soaked = 0;

  const wetness = () =>
    bristles.reduce((sum, bristle) => sum + bristle.ink, 0) / COUNT;

  const bleed = (
    out: Strokes,
    x: number,
    y: number,
    size: number,
    alpha: number,
    born = last.t
  ) => {
    out.bleeds.push({
      alpha,
      born,
      kind: Math.floor(roll() * KINDS),
      size,
      turn: roll() * Math.PI * 2,
      x,
      y,
    });
  };

  const advance = (out: Strokes, x: number, y: number, w: number) => {
    const nx = -uy;
    const ny = ux;
    const fast = clamp01(pace / FAST);
    for (const bristle of bristles) {
      const fray =
        (streak(bristle.grain * 0.37 + along * 45) - 0.5) *
        0.16 *
        Math.abs(bristle.offset);
      const tx = x + nx * (bristle.offset + fray) * (w / 2);
      const ty = y + ny * (bristle.offset + fray) * (w / 2);
      const travel = Math.hypot(tx - bristle.x, ty - bristle.y);
      bristle.ink = Math.max(
        bristle.floor,
        bristle.ink - travel * DRAIN * bristle.thirst * (0.8 + 0.3 * fast)
      );
      const show =
        clamp01(bristle.ink / DRY) ** 1.4 * (1 - 0.3 * clamp01(fast - 0.3));
      const size =
        (w / COUNT) * 2.6 * bristle.thick * (0.65 + 0.35 * bristle.ink);
      const tone = (1 - bristle.ink) * 0.6 + bristle.shade;
      if (show >= 0.999) {
        out.marks.push({
          size,
          tone,
          x0: bristle.x,
          x1: tx,
          y0: bristle.y,
          y1: ty,
        });
      } else if (show > 0) {
        const pieces = Math.max(1, Math.ceil(travel / PIECE));
        for (let k = 0; k < pieces; k += 1) {
          const from = k / pieces;
          const to = (k + 1) / pieces;
          const at = along + (travel * (from + to)) / 2;
          if (streak(bristle.grain + at * 18) < show) {
            out.marks.push({
              size,
              tone,
              x0: bristle.x + (tx - bristle.x) * from,
              x1: bristle.x + (tx - bristle.x) * to,
              y0: bristle.y + (ty - bristle.y) * from,
              y1: bristle.y + (ty - bristle.y) * to,
            });
          }
        }
      }
      bristle.x = tx;
      bristle.y = ty;
    }
    if (along - bled > BLEED_STEP) {
      bled = along;
      const wet = wetness();
      if (wet > 0.25) {
        bleed(
          out,
          x,
          y,
          w * (1.25 + wet * 0.55),
          0.1 + 0.26 * wet * wet * (1 - fast)
        );
      }
    }
  };

  const sweep = (
    out: Strokes,
    to: { x: number; y: number },
    from: number,
    w: number
  ) => {
    const length =
      Math.hypot(last.x - tip.x, last.y - tip.y) +
      Math.hypot(to.x - last.x, to.y - last.y);
    const steps = Math.max(1, Math.ceil(length / STEP));
    for (let j = 1; j <= steps; j += 1) {
      const t = j / steps;
      const a = (1 - t) ** 2;
      const b = 2 * (1 - t) * t;
      const c = t * t;
      const dx = 2 * (1 - t) * (last.x - tip.x) + 2 * t * (to.x - last.x);
      const dy = 2 * (1 - t) * (last.y - tip.y) + 2 * t * (to.y - last.y);
      const speed = Math.hypot(dx, dy);
      if (speed > 1e-9) {
        const turn = 1 - Math.exp(-length / steps / 0.01);
        const vx = ux + (dx / speed - ux) * turn;
        const vy = uy + (dy / speed - uy) * turn;
        const norm = Math.hypot(vx, vy) || 1;
        ux = vx / norm;
        uy = vy / norm;
      }
      along += length / steps;
      advance(
        out,
        a * tip.x + b * last.x + c * to.x,
        a * tip.y + b * last.y + c * to.y,
        from + ((w - from) * j) / steps
      );
    }
    tip = { x: to.x, y: to.y };
  };

  return {
    lift: (): Strokes => {
      const out: Strokes = { bleeds: [], marks: [] };
      sweep(out, last, width, width);
      const reach = Math.min(0.06, Math.max(0.006, pace * 0.022));
      for (let j = 1; j <= TAIL; j += 1) {
        const x = last.x + ux * reach * (j / TAIL);
        const y = last.y + uy * reach * (j / TAIL);
        const w = width * (1 - j / TAIL) ** 1.2;
        along += reach / TAIL;
        advance(out, x, y, w);
        trace.push({ w, x, y });
      }
      return out;
    },
    move: (sample: Sample): Strokes => {
      const out: Strokes = { bleeds: [], marks: [] };
      const dx = sample.x - last.x;
      const dy = sample.y - last.y;
      const dist = Math.hypot(dx, dy);
      const dt = Math.max(1, sample.t - last.t);
      if (dist < 1e-4) {
        const resting = sample.t - last.t;
        if (resting - soaked >= DWELL && resting < SOAK) {
          soaked = resting;
          bleed(
            out,
            last.x,
            last.y,
            width * (1.4 + (resting / SOAK) * 0.9),
            0.2 * wetness(),
            sample.t
          );
        }
        return out;
      }
      soaked = 0;
      pace += ((dist / dt) * 1000 - pace) * (1 - Math.exp(-dt / 50));
      const press = Math.min(1, (sample.t - start) / PRESS);
      const target =
        (NARROW + (WIDE - NARROW) * clamp01(1 - pace / FAST) ** 0.8) *
        (0.6 + 0.4 * press);
      const from = width;
      width += (target - width) * (1 - Math.exp(-dt / 60));
      sweep(
        out,
        { x: (last.x + sample.x) / 2, y: (last.y + sample.y) / 2 },
        from,
        width
      );
      last = sample;
      trace.push({ w: width, x: sample.x, y: sample.y });
      return out;
    },
    press: (sample: Sample): Strokes => {
      const out: Strokes = { bleeds: [], marks: [] };
      last = sample;
      tip = { x: sample.x, y: sample.y };
      start = sample.t;
      for (const bristle of bristles) {
        const angle = roll() * Math.PI * 2;
        const reach = Math.sqrt(roll()) * width * 0.55;
        bristle.x = sample.x + Math.cos(angle) * reach;
        bristle.y = sample.y + Math.sin(angle) * reach;
        out.marks.push({
          size: (width / COUNT) * 3.2,
          tone: 0,
          x0: bristle.x,
          x1: bristle.x + 1e-4,
          y0: bristle.y,
          y1: bristle.y,
        });
      }
      out.marks.push({
        size: width * 1.1,
        tone: 0,
        x0: sample.x,
        x1: sample.x + 1e-4,
        y0: sample.y,
        y1: sample.y,
      });
      bleed(out, sample.x, sample.y, width * 1.9, 0.32);
      trace.push({ w: width, x: sample.x, y: sample.y });
      return out;
    },
    trace: (): readonly Trace[] => trace,
  };
};
