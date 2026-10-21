import type { Text } from "../../_lib/i18n";

export interface Point {
  x: number;
  y: number;
}

export const mouldIds = [
  "circle",
  "triangle",
  "star",
  "sakura",
  "fish",
  "umbrella",
] as const;

export type MouldId = (typeof mouldIds)[number];

export interface Mould {
  id: MouldId;
  name: Text;
  emoji: string;
  outline: readonly Point[];
  length: number;
}

const SIZE = 0.56;
export const NOTCHES = 240;

const arc = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  to: number,
  steps = 24
) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const angle = from + ((to - from) * i) / steps;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });

const polar = (radius: (angle: number) => number, steps = 360) =>
  Array.from({ length: steps }, (_, i) => {
    const angle = -Math.PI / 2 + (i / steps) * Math.PI * 2;
    const r = radius(angle);
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  });

const corners = (count: number, outer: number, inner = outer) =>
  Array.from({ length: count * (inner === outer ? 1 : 2) }, (_, i) => {
    const step = inner === outer ? i * 2 : i;
    const angle = -Math.PI / 2 + (step * Math.PI) / count;
    const r = step % 2 === 0 ? outer : inner;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r };
  });

const wrap = (angle: number, span: number) =>
  ((((angle + span / 2) % span) + span) % span) - span / 2;

const sakura = polar((angle) => {
  const u = wrap(angle + Math.PI / 2, (Math.PI * 2) / 5);
  const petal = Math.sqrt(Math.max(0, Math.cos((u * 5) / 2)));
  return 0.15 + 0.14 * petal - 0.055 * Math.exp(-((u / 0.085) ** 2));
});

const fishHalf = (t: number) =>
  0.035 * t + 0.15 * Math.sin(Math.PI * t ** 0.8) ** 0.9;

const fish = (() => {
  const steps = 40;
  const upper = Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { x: 0.18 + 0.48 * t, y: 0.5 - fishHalf(t) };
  });
  const lower = upper.map(({ x }, i) => ({
    x,
    y: 0.5 + fishHalf(i / steps),
  }));
  return [
    ...upper,
    { x: 0.82, y: 0.33 },
    { x: 0.76, y: 0.5 },
    { x: 0.82, y: 0.67 },
    ...lower.toReversed(),
  ];
})();

const umbrella = (() => {
  const rim = 0.48;
  const scallop = (from: number, to: number) =>
    arc((from + to) / 2, rim, (to - from) / 2, 0.035, 0, -Math.PI, 12);
  return [
    ...arc(0.5, rim, 0.3, 0.24, Math.PI, Math.PI * 2, 48),
    ...scallop(0.65, 0.8),
    ...scallop(0.518, 0.65),
    { x: 0.518, y: 0.76 },
    ...arc(0.44, 0.76, 0.078, 0.078, 0, Math.PI, 20),
    ...arc(0.38, 0.76, 0.018, 0.018, Math.PI, Math.PI * 2, 8),
    ...arc(0.44, 0.76, 0.042, 0.042, Math.PI, 0, 14),
    { x: 0.482, y: rim },
    ...scallop(0.35, 0.482),
    ...scallop(0.2, 0.35),
  ];
})();

const lengthOf = (points: readonly Point[]) => {
  let total = 0;
  for (const [i, point] of points.entries()) {
    const next = points[(i + 1) % points.length];
    total += Math.hypot(next.x - point.x, next.y - point.y);
  }
  return total;
};

const fitted = (points: readonly Point[]) => {
  const xs = points.map(({ x }) => x);
  const ys = points.map(({ y }) => y);
  const [left, right] = [Math.min(...xs), Math.max(...xs)];
  const [top, bottom] = [Math.min(...ys), Math.max(...ys)];
  const scale = SIZE / Math.max(right - left, bottom - top);
  return points.map(({ x, y }) => ({
    x: 0.5 + (x - (left + right) / 2) * scale,
    y: 0.5 + (y - (top + bottom) / 2) * scale,
  }));
};

const resample = (points: readonly Point[], count: number) => {
  const total = lengthOf(points);
  const out: Point[] = [];
  let walked = 0;
  for (let i = 0; i < points.length && out.length < count; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const span = Math.hypot(b.x - a.x, b.y - a.y);
    while (
      out.length < count &&
      (out.length * total) / count <= walked + span
    ) {
      const u = span === 0 ? 0 : ((out.length * total) / count - walked) / span;
      out.push({ x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u });
    }
    walked += span;
  }
  return out;
};

const make = (
  id: MouldId,
  name: Text,
  emoji: string,
  points: readonly Point[]
): Mould => {
  const outline = resample(fitted(points), NOTCHES);
  return { emoji, id, length: lengthOf(outline), name, outline };
};

export const moulds: Record<MouldId, Mould> = {
  star: make("star", { en: "Star", ja: "星" }, "⭐", corners(5, 0.3, 0.125)),
  umbrella: make("umbrella", { en: "Umbrella", ja: "傘" }, "☂️", umbrella),
  circle: make(
    "circle",
    { en: "Circle", ja: "丸" },
    "⭕",
    polar(() => 0.25)
  ),
  fish: make("fish", { en: "Fish", ja: "魚" }, "🐟", fish),
  sakura: make("sakura", { en: "Sakura", ja: "桜" }, "🌸", sakura),
  triangle: make(
    "triangle",
    { en: "Triangle", ja: "三角" },
    "🔺",
    corners(3, 0.3)
  ),
};

const seeded = (seed: number) => {
  let state = (seed * 48_271) % 2_147_483_647 || 1;
  return () => {
    state = (state * 48_271) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const cycleOf = (cycle: number): MouldId[] => {
  const roll = seeded(cycle + 7);
  const order = [...mouldIds];
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(roll() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

const orderOf = (cycle: number): MouldId[] => {
  const order = cycleOf(cycle);
  if (cycle > 0 && order[0] === cycleOf(cycle - 1).at(-1)) {
    [order[0], order[1]] = [order[1], order[0]];
  }
  return order;
};

export const mouldOf = (day: number) => {
  const index = Math.max(0, day - 1);
  return moulds[
    orderOf(Math.floor(index / mouldIds.length))[index % mouldIds.length]
  ];
};
