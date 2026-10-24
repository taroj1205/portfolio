import { signedArea } from "./geometry";
import type { Point } from "./geometry";
import { between, pick } from "./random";
import type { Roll } from "./random";

export const POINTS = 144;
export const TAU = Math.PI * 2;

export interface Grain {
  x: number;
  y: number;
  r: number;
  a: number;
}

export interface Bite {
  x: number;
  y: number;
  r: number;
}

export const clamp = (value: number, low = 0, high = 1) =>
  Math.min(high, Math.max(low, value));

const perimeter = (points: readonly Point[]) => {
  let total = 0;

  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }

  return total;
};

export const resample = (points: readonly Point[], count = POINTS) => {
  const step = perimeter(points) / count;
  const out: Point[] = [];
  let carry = 0;

  for (let i = 0; i < points.length && out.length < count; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    let at = carry;

    while (at < length && out.length < count) {
      const t = at / length;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      at += step;
    }

    carry = at - length;
  }

  return out;
};

export const rounded = (
  corners: readonly Point[],
  radius: number,
  count = POINTS
) => {
  const out: Point[] = [];
  const steps = 720;

  for (let i = 0; i < steps; i += 1) {
    const a = (i / steps) * TAU;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    let [best] = corners;
    let reach = -Infinity;

    for (const corner of corners) {
      const value = corner.x * ux + corner.y * uy;

      if (value > reach) {
        reach = value;
        best = corner;
      }
    }

    const point = { x: best.x + ux * radius, y: best.y + uy * radius };
    const last = out.at(-1);

    if (
      last === undefined ||
      Math.hypot(point.x - last.x, point.y - last.y) > 1e-6
    ) {
      out.push(point);
    }
  }

  return resample(out, count);
};

export const box = (w: number, h: number, radius: number, count = POINTS) =>
  rounded(
    [
      { x: -w + radius, y: -h + radius },
      { x: w - radius, y: -h + radius },
      { x: w - radius, y: h - radius },
      { x: -w + radius, y: h - radius },
    ],
    radius,
    count
  );

export const polar = (radius: (a: number) => number, count = POINTS) =>
  Array.from({ length: count }, (_, i) => {
    const a = (i / count) * TAU;
    const r = radius(a);

    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });

export const profile = (
  length: number,
  upper: (t: number) => number,
  lower: (t: number) => number,
  count = 90
) => {
  const top: Point[] = [];
  const bottom: Point[] = [];

  for (let i = 0; i <= count; i += 1) {
    const t = -Math.cos((i / count) * Math.PI);
    top.push({ x: t * length, y: -Math.max(0, upper(t)) });
    bottom.push({ x: t * length, y: Math.max(0, lower(t)) });
  }

  return [...top, ...bottom.toReversed()];
};

export const bend = (points: readonly Point[], radius: number) =>
  points.map((p) => {
    const a = p.x / radius;
    const r = radius - p.y;

    return { x: Math.sin(a) * r, y: radius - Math.cos(a) * r };
  });

export const swell = (
  points: readonly Point[],
  amount: (p: Point, i: number) => number
) => {
  const outward = signedArea(points) > 0 ? 1 : -1;

  return points.map((p, i) => {
    const prev = points[(i - 1 + points.length) % points.length];
    const next = points[(i + 1) % points.length];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const length = Math.hypot(dx, dy) || 1;
    const k = amount(p, i) * outward;

    return { x: p.x + (dy / length) * k, y: p.y - (dx / length) * k };
  });
};

export const waves = (roll: Roll, amp: number, from: number, to: number) => {
  const list = Array.from({ length: 3 }, () => ({
    amp: amp * between(roll, 0.4, 1),
    k: from + pick(roll, to - from + 1),
    phase: roll() * TAU,
  }));

  return (a: number) =>
    list.reduce(
      (sum, wave) => sum + wave.amp * Math.sin(wave.k * a + wave.phase),
      0
    );
};

export const wobble = (
  points: readonly Point[],
  curve: (a: number) => number
) =>
  points.map((p, i) => {
    const k = 1 + curve((i / points.length) * TAU);

    return { x: p.x * k, y: p.y * k };
  });

export const smooth = (values: readonly number[], passes: number) => {
  let list = [...values];

  for (let pass = 0; pass < passes; pass += 1) {
    const next: number[] = [];

    for (let i = 0; i < list.length; i += 1) {
      next.push(
        (list[(i - 1 + list.length) % list.length] +
          list[i] * 2 +
          list[(i + 1) % list.length]) /
          4
      );
    }

    list = next;
  }

  return list;
};

const bitten = (points: readonly Point[], bite: Bite, roll: Roll) => {
  const teeth = 5 + pick(roll, 4);
  const far = bite.x * bite.x + bite.y * bite.y - bite.r * bite.r;

  return points.map((p) => {
    const reach = Math.hypot(p.x, p.y);
    const ux = p.x / reach;
    const uy = p.y / reach;
    const toward = ux * bite.x + uy * bite.y;
    const room = toward * toward - far;
    const enter = toward - Math.sqrt(Math.max(0, room));

    if (reach === 0 || room <= 0 || enter <= 0 || enter >= reach) {
      return p;
    }

    const a = Math.atan2(uy * enter - bite.y, ux * enter - bite.x);
    const r = enter * (1 - 0.018 * Math.abs(Math.sin(a * teeth)));

    return { x: ux * r, y: uy * r };
  });
};

export const maybeBite = (
  points: Point[],
  roll: Roll,
  chance: number,
  size: number
) => {
  if (roll() >= chance) {
    return { bite: null, points };
  }

  const edge = points[pick(roll, points.length)];
  const d = Math.hypot(edge.x, edge.y) || 1;
  const r = size * between(roll, 0.75, 1);

  const bite = {
    r,
    x: edge.x + (edge.x / d) * r * 0.45,
    y: edge.y + (edge.y / d) * r * 0.45,
  };

  return { bite, points: bitten(points, bite, roll) };
};

const inside = (points: readonly Point[], x: number, y: number) => {
  let hit = false;

  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i];
    const b = points[j];

    if (
      a.y > y !== b.y > y &&
      x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x
    ) {
      hit = !hit;
    }
  }

  return hit;
};

export const scatter = (
  roll: Roll,
  points: readonly Point[],
  count: number,
  size: readonly [number, number]
) => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const width = Math.max(...xs) - left;
  const height = Math.max(...ys) - top;
  const grains: Grain[] = [];

  for (let tries = 0; grains.length < count && tries < count * 20; tries += 1) {
    const x = left + roll() * width;
    const y = top + roll() * height;

    if (inside(points, x, y)) {
      grains.push({
        a: roll() * 180,
        r: between(roll, size[0], size[1]),
        x,
        y,
      });
    }
  }

  return grains;
};

export const shrink = (points: readonly Point[], k: number) =>
  points.map((p) => ({ x: p.x * k, y: p.y * k }));

export const moved = (points: readonly Point[], by: Point) =>
  points.map((p) => ({ x: p.x + by.x, y: p.y + by.y }));

export const lobe = (x: number, width: number) =>
  Math.max(0, 1 - (x / width) ** 2);

export const turnOf = (a: number, at: number) =>
  ((((a - at) % TAU) + TAU * 1.5) % TAU) - Math.PI;
