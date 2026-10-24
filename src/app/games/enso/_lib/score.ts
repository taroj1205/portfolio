import { clamp01 } from "./stroke";

export interface Point {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export type Flaw = "short" | "small" | "open" | "partial" | "loops" | "wobbly";

export interface Verdict {
  score: number;
  circle: Circle | null;
  flaw: Flaw | null;
}

const SAMPLES = 128;
const MIN_LENGTH = 0.2;
const FULL_SIZE = 0.16;
const TINY = 0.06;
const FREE_GAP = 0.06;
const FLAWLESS = 0.95;

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const lengthOf = (points: readonly Point[]) => {
  let total = 0;

  for (let i = 1; i < points.length; i += 1) {
    total += distance(points[i - 1], points[i]);
  }

  return total;
};

const resample = (points: readonly Point[], total: number) => {
  const step = total / (SAMPLES - 1);
  const [first] = points;
  const even: Point[] = [first];
  let need = step;

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const span = distance(a, b);
    let used = 0;

    while (span - used >= need && even.length < SAMPLES - 1) {
      used += need;
      need = step;
      const t = used / span;
      even.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }

    need -= span - used;
  }

  even.push(points.at(-1) ?? first);

  return even;
};

const fit = (points: readonly Point[]): Circle | null => {
  const n = points.length;
  let mx = 0;
  let my = 0;

  for (const p of points) {
    mx += p.x / n;
    my += p.y / n;
  }

  let suu = 0;
  let svv = 0;
  let suv = 0;
  let su = 0;
  let sv = 0;

  for (const p of points) {
    const u = p.x - mx;
    const v = p.y - my;
    suu += u * u;
    svv += v * v;
    suv += u * v;
    su += u * (u * u + v * v);
    sv += v * (u * u + v * v);
  }

  const det = suu * svv - suv * suv;

  if (det <= 1e-6 * (suu + svv) ** 2) {
    return null;
  }

  const uc = (su * svv - sv * suv) / (2 * det);
  const vc = (sv * suu - su * suv) / (2 * det);

  return {
    r: Math.sqrt(uc * uc + vc * vc + (suu + svv) / n),
    x: uc + mx,
    y: vc + my,
  };
};

const turnsAround = (points: readonly Point[], circle: Circle) => {
  let sweep = 0;

  for (let i = 1; i < points.length; i += 1) {
    const a = points[i - 1];
    const b = points[i];
    const ax = a.x - circle.x;
    const ay = a.y - circle.y;
    const bx = b.x - circle.x;
    const by = b.y - circle.y;
    sweep += Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
  }

  return Math.abs(sweep) / (Math.PI * 2);
};

export const judge = (points: readonly Point[]): Verdict => {
  const total = lengthOf(points);

  if (points.length < 3 || !(total >= MIN_LENGTH)) {
    return { circle: null, flaw: "short", score: 0 };
  }

  const even = resample(points, total);
  const circle = fit(even);

  if (circle === null) {
    return { circle: null, flaw: "partial", score: 0 };
  }

  let squares = 0;

  for (const p of even) {
    squares += (distance(p, circle) - circle.r) ** 2;
  }

  const wobble = Math.sqrt(squares / even.length) / circle.r;
  const turns = turnsAround(even, circle);
  const [first] = even;
  const last = even.at(-1) ?? first;

  const gap =
    (turns < 1
      ? distance(first, last)
      : Math.abs(distance(last, circle) - distance(first, circle))) / circle.r;

  const factors: [Flaw, number][] = [
    ["small", clamp01((circle.r - TINY) / (FULL_SIZE - TINY))],
    turns < 1
      ? ["partial", clamp01((turns - 0.5) / 0.4)]
      : ["loops", clamp01(1 - 1.5 * Math.max(0, turns - 1.2))],
    ["open", clamp01(1 - 1.2 * Math.max(0, gap - FREE_GAP))],
    ["wobbly", clamp01(1 - 4 * wobble)],
  ];

  let product = 1;
  let [worst] = factors;

  for (const factor of factors) {
    product *= factor[1];

    if (factor[1] < worst[1]) {
      worst = factor;
    }
  }

  return {
    circle,
    flaw: worst[1] < FLAWLESS ? worst[0] : null,
    score: Math.round(product * 1000) / 10,
  };
};
