import { centroidOf, signedArea } from "./geometry";
import type { Point } from "./geometry";

export const kinds = [
  "tofu",
  "yokan",
  "castella",
  "onigiri",
  "daifuku",
  "kagami",
  "taiyaki",
  "kaki",
  "kamaboko",
  "nerikiri",
  "sushi",
  "rakugan",
] as const;

export type Kind = (typeof kinds)[number];

export const RUN = 5;
export const SPAN = 2.8;
export const SEED_MAX = 2_147_483_646;
const POINTS = 144;
const TAU = Math.PI * 2;

interface Grain {
  x: number;
  y: number;
  r: number;
  a: number;
}

interface Bite {
  x: number;
  y: number;
  r: number;
}

export interface Art {
  w: number;
  h: number;
  phase: number;
  variant: number;
  bite: Bite | null;
  spot: Point;
  grains: Grain[];
}

interface Place {
  turn: number;
  scale: number;
  x: number;
  y: number;
}

export interface Food {
  kind: Kind;
  outline: Point[];
  place: Place;
  art: Art;
}

type Roll = () => number;

export const seeded = (seed: number): Roll => {
  let state = (Math.abs(Math.floor(seed)) % SEED_MAX) + 1;
  const step = () => {
    state = (state * 48_271) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
  for (let i = 0; i < 6; i += 1) {
    step();
  }
  return step;
};

const between = (roll: Roll, min: number, max: number) =>
  min + roll() * (max - min);

const pick = (roll: Roll, count: number) =>
  Math.min(count - 1, Math.floor(roll() * count));

const perimeter = (points: readonly Point[]) => {
  let total = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
};

const resample = (points: readonly Point[], count: number) => {
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

const rounded = (corners: readonly Point[], radius: number) => {
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
  return resample(out, POINTS);
};

const box = (w: number, h: number, radius: number) =>
  rounded(
    [
      { x: -w + radius, y: -h + radius },
      { x: w - radius, y: -h + radius },
      { x: w - radius, y: h - radius },
      { x: -w + radius, y: h - radius },
    ],
    radius
  );

const polar = (radius: (a: number) => number) =>
  Array.from({ length: POINTS }, (_, i) => {
    const a = (i / POINTS) * TAU;
    const r = radius(a);
    return { x: Math.cos(a) * r, y: Math.sin(a) * r };
  });

const waves = (roll: Roll, amp: number, from: number, to: number) => {
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

const wobble = (points: readonly Point[], curve: (a: number) => number) =>
  points.map((p, i) => {
    const k = 1 + curve((i / points.length) * TAU);
    return { x: p.x * k, y: p.y * k };
  });

const smooth = (values: readonly number[], passes: number) => {
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

const maybeBite = (
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

const scatter = (
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

const shrink = (points: readonly Point[], k: number) =>
  points.map((p) => ({ x: p.x * k, y: p.y * k }));

interface Draft {
  points: Point[];
  art: Art;
}

const plain = (w: number, h: number): Art => ({
  bite: null,
  grains: [],
  h,
  phase: 0,
  spot: { x: 0, y: 0 },
  variant: 0,
  w,
});

const tofu = (roll: Roll): Draft => {
  const w = between(roll, 0.95, 1.25);
  const h = between(roll, 0.62, 0.86);
  const base = wobble(
    box(w, h, between(roll, 0.07, 0.13)),
    waves(roll, 0.012, 2, 5)
  );
  const { bite, points } = maybeBite(
    base,
    roll,
    0.4,
    between(roll, 0.14, 0.22)
  );
  const spot = {
    x: between(roll, -0.35, 0.35) * w,
    y: between(roll, -0.3, 0.3) * h,
  };
  return {
    art: {
      ...plain(w, h),
      bite,
      grains: Array.from({ length: 5 + pick(roll, 4) }, () => ({
        a: roll() * 180,
        r: between(roll, 0.055, 0.08),
        x: spot.x + between(roll, -0.34, 0.34),
        y: spot.y + between(roll, -0.26, 0.26),
      })),
      spot,
      variant: pick(roll, 2),
    },
    points,
  };
};

const yokan = (roll: Roll): Draft => {
  const w = between(roll, 1.25, 1.55);
  const h = between(roll, 0.42, 0.56);
  const slant = between(roll, -0.28, 0.28);
  const base = box(w, h, between(roll, 0.03, 0.06)).map((p) => ({
    x: p.x + slant * p.y * Math.max(0, p.x / w),
    y: p.y,
  }));
  const variant = pick(roll, 3);
  const points = wobble(base, waves(roll, 0.006, 2, 4));
  return {
    art: {
      ...plain(w, h),
      grains:
        variant === 1
          ? scatter(roll, shrink(points, 0.85), 6, [0.08, 0.13])
          : [],
      variant,
    },
    points,
  };
};

const castella = (roll: Roll): Draft => {
  const w = between(roll, 0.95, 1.3);
  const h = between(roll, 0.5, 0.7);
  const base = wobble(box(w, h, 0.025), waves(roll, 0.008, 2, 6));
  const { bite, points } = maybeBite(
    base,
    roll,
    0.3,
    between(roll, 0.16, 0.24)
  );
  return {
    art: {
      ...plain(w, h),
      bite,
      grains: scatter(roll, points, 110, [0.006, 0.016]),
    },
    points,
  };
};

const onigiri = (roll: Roll): Draft => {
  const w = between(roll, 0.85, 1.05);
  const h = between(roll, 0.8, 1);
  const lean = between(roll, -0.12, 0.12);
  const corner = between(roll, 0.32, 0.44);
  const base = rounded(
    [
      { x: lean, y: -h + corner },
      { x: w - corner, y: h * 0.72 - corner },
      { x: -w + corner, y: h * 0.72 - corner },
    ],
    corner
  );
  const grainy = wobble(
    base,
    (a) => 0.011 * Math.sin(a * 41) + 0.007 * Math.sin(a * 59 + 1)
  );
  const { bite, points } = maybeBite(
    wobble(grainy, waves(roll, 0.02, 2, 4)),
    roll,
    0.5,
    between(roll, 0.24, 0.32)
  );
  return {
    art: {
      ...plain(w, h),
      bite,
      grains: scatter(roll, points, 90, [0.045, 0.06]),
      spot: { x: lean * 0.6, y: h * 0.72 },
      variant: pick(roll, 3),
    },
    points,
  };
};

const daifuku = (roll: Roll): Draft => {
  const stretch = between(roll, 1, 1.14);
  const curve = waves(roll, 0.045, 2, 3);
  const base = polar((a) => 0.95 * (1 + curve(a))).map((p) => ({
    x: p.x * stretch,
    y: p.y,
  }));
  const { bite, points } = maybeBite(
    base,
    roll,
    0.5,
    between(roll, 0.32, 0.42)
  );
  const variant = pick(roll, 3);
  return {
    art: {
      ...plain(stretch, 1),
      bite,
      grains:
        variant === 0
          ? scatter(roll, shrink(points, 0.9), 10, [0.075, 0.1])
          : scatter(roll, points, 70, [0.006, 0.018]),
      variant,
    },
    points,
  };
};

const kagami = (roll: Roll): Draft => {
  const squash = between(roll, 1.04, 1.18);
  const curve = waves(roll, 0.03, 2, 4);
  const points = polar((a) => 0.95 * (1 + curve(a))).map((p) => ({
    x: p.x * squash,
    y: p.y,
  }));
  const grains = Array.from({ length: 2 + pick(roll, 3) }, () => {
    const a = roll() * TAU;
    const r = between(roll, 0.72, 0.88);
    return {
      a: a + between(roll, -0.5, 0.5),
      r: between(roll, 0.1, 0.2),
      x: Math.cos(a) * r * squash,
      y: Math.sin(a) * r,
    };
  });
  return {
    art: {
      ...plain(squash, between(roll, 0.6, 0.68)),
      grains,
      phase: roll() * TAU,
      spot: { x: between(roll, -0.08, 0.08), y: between(roll, -0.08, 0.08) },
    },
    points,
  };
};

const lobe = (x: number, width: number) => Math.max(0, 1 - (x / width) ** 2);

const turnOf = (a: number, at: number) =>
  ((((a - at) % TAU) + TAU * 1.5) % TAU) - Math.PI;

const taiyaki = (roll: Roll): Draft => {
  const w = between(roll, 0.8, 0.92);
  const h = between(roll, 0.44, 0.54);
  const tail = between(roll, 0.32, 0.46);
  const fork = between(roll, 0.2, 0.26);
  const variant = pick(roll, 2);
  const crisp = variant === 1 ? waves(roll, 0.025, 31, 47) : () => 0;
  const radius = (a: number) => {
    const body = 1 / Math.hypot(Math.cos(a) / w, Math.sin(a) / h);
    const back = turnOf(a, Math.PI);
    const fins = tail * (lobe(back - fork, 0.19) + lobe(back + fork, 0.19));
    const dorsal = 0.08 * lobe(turnOf(a, -Math.PI / 2 - 0.35), 0.55);
    const belly = 0.05 * lobe(turnOf(a, Math.PI / 2 + 0.5), 0.35);
    const mouth = -0.05 * lobe(turnOf(a, 0), 0.08);
    return (body + fins + dorsal + belly + mouth) * (1 + crisp(a));
  };
  const points = polar(radius);
  return {
    art: {
      ...plain(w, h),
      grains: scatter(roll, shrink(points, 0.8), 40, [0.07, 0.09]).filter(
        (grain) => grain.x < w * 0.3 && grain.x > -w * 0.7
      ),
      spot: {
        x: w * between(roll, 0.55, 0.65),
        y: -h * between(roll, 0.15, 0.3),
      },
      variant,
    },
    points,
  };
};

const kaki = (roll: Roll): Draft => {
  const square = between(roll, 0.03, 0.07);
  const phase = roll() * TAU;
  const curve = waves(roll, 0.02, 2, 3);
  const points = polar(
    (a) => 0.95 * (1 + square * Math.cos(4 * a + phase) + curve(a))
  );
  return {
    art: {
      ...plain(1, 1),
      phase,
      spot: { x: between(roll, -0.07, 0.07), y: between(roll, -0.07, 0.07) },
      variant: pick(roll, 2),
    },
    points,
  };
};

const kamaboko = (roll: Roll): Draft => {
  const w = between(roll, 1, 1.2);
  const h = between(roll, 0.8, 1);
  const base = 0.42;
  const arc = Array.from({ length: 60 }, (_, i) => {
    const a = Math.PI + (i / 59) * Math.PI;
    return { x: Math.cos(a) * w, y: base + Math.sin(a) * h };
  });
  const outline = [
    ...arc,
    { x: w * 0.98, y: base + 0.02 },
    { x: 0, y: base + 0.02 },
    { x: -w * 0.98, y: base + 0.02 },
  ];
  const points = wobble(resample(outline, POINTS), waves(roll, 0.008, 2, 5));
  return {
    art: {
      ...plain(w, h),
      phase: between(roll, 0.13, 0.2),
      spot: { x: 0, y: base },
      variant: pick(roll, 2),
    },
    points,
  };
};

const nerikiri = (roll: Roll): Draft => {
  const variant = pick(roll, 3);
  const petals = variant === 2 ? 6 : 5;
  const phase = roll() * TAU;
  const curve = waves(roll, 0.015, 2, 3);
  const radius = (a: number) => {
    const t = (((a + phase) * petals) / TAU) % 1;
    const swell = Math.sin(t * Math.PI) ** (variant === 2 ? 1.6 : 0.55);
    const notch = variant === 0 ? 0.1 * lobe(t - 0.5, 0.07) : 0;
    return 0.72 + 0.26 * swell - notch + curve(a);
  };
  return {
    art: { ...plain(1, 1), phase, variant, w: petals },
    points: polar(radius),
  };
};

const sushi = (roll: Roll): Draft => {
  const w = between(roll, 1.15, 1.35);
  const h = between(roll, 0.46, 0.58);
  const bend = between(roll, -0.12, 0.12);
  const base = box(w, h, h * between(roll, 0.55, 0.8)).map((p) => ({
    x: p.x,
    y: p.y + bend * (p.x / w) ** 2,
  }));
  const rice = wobble(base, (a) => {
    const below = Math.max(0, Math.sin(a));
    return below * below * (0.06 + 0.012 * Math.sin(a * 37));
  });
  const points = wobble(rice, waves(roll, 0.01, 2, 4));
  return {
    art: {
      ...plain(w, h),
      grains: scatter(roll, points, 80, [0.045, 0.06]),
      phase: bend,
      variant: pick(roll, 3),
    },
    points,
  };
};

const gourd = (roll: Roll) => {
  const top = { r: between(roll, 0.36, 0.44), y: -between(roll, 0.45, 0.55) };
  const low = { r: between(roll, 0.55, 0.63), y: between(roll, 0.3, 0.38) };
  const gap = low.y - top.y;
  const waist = top.y + (gap * gap + top.r * top.r - low.r * low.r) / (2 * gap);
  const reach = (a: number, circle: { r: number; y: number }) => {
    const y = circle.y - waist;
    const toward = Math.sin(a) * y;
    return toward + Math.sqrt(toward * toward - y * y + circle.r * circle.r);
  };
  const radii = smooth(
    Array.from({ length: POINTS }, (_, i) => {
      const a = (i / POINTS) * TAU;
      return Math.max(reach(a, top), reach(a, low));
    }),
    6
  );
  return {
    points: radii.map((r, i) => {
      const a = (i / POINTS) * TAU;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r + waist };
    }),
    waist,
  };
};

const folding = (roll: Roll) => {
  const spread = between(roll, 1.9, 2.3);
  const hole = between(roll, 0.3, 0.4);
  const from = -Math.PI / 2 - spread / 2;
  const outer = Array.from({ length: 50 }, (_, i) => {
    const a = from + (i / 49) * spread;
    return { x: Math.cos(a), y: Math.sin(a) + 0.5 };
  });
  const inner = Array.from({ length: 16 }, (_, i) => {
    const a = from + spread - (i / 15) * spread;
    return { x: Math.cos(a) * hole, y: Math.sin(a) * hole + 0.5 };
  });
  return { hole, points: resample([...outer, ...inner], POINTS), spread };
};

const rakugan = (roll: Roll): Draft => {
  const tint = pick(roll, 4);
  if (roll() < 0.5) {
    const { points, waist } = gourd(roll);
    return {
      art: {
        ...plain(1, 1),
        grains: scatter(roll, points, 80, [0.006, 0.014]),
        spot: { x: 0, y: waist },
        variant: tint,
      },
      points: wobble(points, waves(roll, 0.005, 2, 4)),
    };
  }
  const { hole, points, spread } = folding(roll);
  return {
    art: {
      ...plain(spread, hole),
      grains: scatter(roll, points, 80, [0.006, 0.014]),
      spot: { x: 0, y: 0.5 },
      variant: 4 + tint,
    },
    points: wobble(points, waves(roll, 0.005, 2, 4)),
  };
};

const drafts: Record<Kind, (roll: Roll) => Draft> = {
  castella,
  daifuku,
  kagami,
  kaki,
  kamaboko,
  nerikiri,
  onigiri,
  rakugan,
  sushi,
  taiyaki,
  tofu,
  yokan,
};

export const foodOf = (kind: Kind, seed: number): Food => {
  const roll = seeded(seed);
  const { points, art } = drafts[kind](roll);
  const turn = roll() * 360;
  const angle = (turn * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const turned = points.map((p) => ({
    x: p.x * cos - p.y * sin,
    y: p.x * sin + p.y * cos,
  }));
  const centre = centroidOf(turned);
  const reach = Math.max(
    ...turned.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y))
  );
  const scale = 1 / reach;
  const outline = turned.map((p) => ({
    x: (p.x - centre.x) * scale,
    y: (p.y - centre.y) * scale,
  }));
  return {
    art,
    kind,
    outline: signedArea(outline) < 0 ? outline.toReversed() : outline,
    place: { scale, turn, x: -centre.x * scale, y: -centre.y * scale },
  };
};

export const runOf = (seed: number) => {
  const roll = seeded(seed);
  const order = kinds
    .map((kind) => ({ kind, key: roll() }))
    .toSorted((a, b) => a.key - b.key);
  return order
    .slice(0, RUN)
    .map(({ kind }) => foodOf(kind, 1 + Math.floor(roll() * SEED_MAX)));
};
