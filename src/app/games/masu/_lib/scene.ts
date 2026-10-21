import { domeOf } from "./pour";
import type { Bottle, Pour } from "./pour";

export interface Point {
  x: number;
  y: number;
}

export const box = { floor: 6, height: 50, inner: 36.5, outer: 44 } as const;

export const tumbler = {
  base: 5,
  bottom: 21.5,
  height: 66,
  top: 25.5,
} as const;

const GLASS_SHARE = 0.6;
const GLASS_SWELL = 0.03;
const GLASS_RISE = 2.6;
const LIFT = 3;
const PITCH = 0.3;
const DISTANCE = 520;
const MIDDLE = 28;

export const paint = {
  night: "#070403",
  room: "#160c07",
  counter: "#2a170d",
  counterLight: "#6b4024",
  counterDark: "#120904",
  wood: "#e9cf9f",
  woodLight: "#f7e6c2",
  woodDark: "#b98e57",
  woodShade: "#8a6236",
  grain: "#a77b45",
  endGrain: "#c79f68",
  brand: "#5a2d12",
  inner: "#d8b47c",
  innerDark: "#9c7444",
  sake: "#f3dc9a",
  sakeDeep: "#c99a45",
  mirror: "#4a2e12",
  sheen: "#fffbea",
  glass: "#eef6ff",
  shadow: "#050302",
  lamp: "#ffcf8a",
  isshobin: "#1f4a2c",
  isshobinLight: "#5e9b6c",
  isshobinDark: "#0a1d10",
  label: "#f4ead7",
  labelInk: "#2b1c12",
  porcelain: "#f2efe6",
  porcelainShade: "#c9c4b6",
  porcelainDark: "#8f8a7c",
  indigo: "#2c3f8f",
  lacquer: "#1b0d0b",
  lacquerLight: "#5a2a22",
  vermilion: "#b8321f",
} as const;

export const project = (x: number, y: number, z: number): Point => {
  const height = y - MIDDLE;
  const up = height * Math.cos(PITCH) - z * Math.sin(PITCH);
  const depth = height * Math.sin(PITCH) + z * Math.cos(PITCH);
  const scale = DISTANCE / (DISTANCE - depth);
  return { x: x * scale, y: -up * scale };
};

const crown = (u: number) => Math.max(0, 1 - Math.abs(u) ** 6);

export interface Fill {
  level: number;
  dome: number;
  glass: { level: number; dome: number; over: boolean } | null;
}

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export const fillOf = (pour: Pour, volume: number): Fill => {
  const span = box.height - box.floor;
  const dome = volume > 1 ? domeOf(pour, volume) * pour.rise : 0;
  if (pour.cup === "masu") {
    return { dome, glass: null, level: box.floor + span * clamp(volume) };
  }
  const bottom = box.floor + tumbler.base;
  const top = box.floor + tumbler.height;
  const spare = GLASS_SHARE + GLASS_SWELL;
  return {
    dome,
    glass: {
      dome: clamp((volume - GLASS_SHARE) / GLASS_SWELL) * GLASS_RISE,
      level: bottom + (top - bottom) * clamp(volume / GLASS_SHARE),
      over: volume > spare,
    },
    level: box.floor + span * clamp((volume - spare) / (1 - spare)),
  };
};

export const aboveRim = (fill: Fill) =>
  fill.dome > 0 ? fill.dome : fill.level - box.height;

export const raised = (fill: Fill) => fill.dome * LIFT;

export const surfaceOf = (fill: Fill) =>
  fill.glass === null ? fill.level + raised(fill) : fill.glass.level;

export const impactOf = (fill: Fill) => ({
  x: fill.glass === null ? -6 : -3,
  z: fill.glass === null ? 4 : 2,
});

interface Vessel {
  outline: readonly (readonly [number, number])[];
  lip: Point;
  rest: number;
  tip: number;
  drop: number;
}

const revolve = (half: readonly (readonly [number, number])[]) => [
  ...half.map(([r, y]) => [r, y] as const),
  ...half.toReversed().map(([r, y]) => [-r, y] as const),
];

export const vessels: Record<Bottle, Vessel> = {
  isshobin: {
    lip: { x: 14, y: 0 },
    outline: revolve([
      [14, 0],
      [14, 9],
      [12, 11],
      [12, 92],
      [20, 112],
      [36, 128],
      [50, 146],
      [53, 166],
      [53, 392],
      [49, 398],
    ]),
    rest: 1.18,
    drop: 66,
    tip: 1.98,
  },
  katakuchi: {
    lip: { x: 76, y: -7 },
    outline: [
      [76, -7],
      [62, 6],
      [58, 34],
      [46, 54],
      [26, 62],
      [24, 70],
      [-24, 70],
      [-26, 62],
      [-46, 54],
      [-58, 34],
      [-62, 0],
      [60, 0],
    ],
    rest: 0.1,
    drop: 44,
    tip: 0.86,
  },
  tokkuri: {
    lip: { x: 15, y: 0 },
    outline: revolve([
      [15, 0],
      [13, 5],
      [9, 14],
      [9, 34],
      [18, 52],
      [36, 76],
      [43, 104],
      [40, 128],
      [31, 146],
      [32, 152],
    ]),
    rest: 0.96,
    drop: 54,
    tip: 1.9,
  },
};

const TAU = Math.PI * 2;
const B = box.inner;
const A = box.outer;
const H = box.height;
const SAMPLES = 40;

type Corner = readonly [number, number, number];

const corners = (points: readonly Corner[]): Point[] =>
  points.map(([x, y, z]) => project(x, y, z));

export const ring = (
  y: number,
  r: number,
  from = 0,
  to = TAU,
  steps = 32
): Point[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return project(Math.cos(a) * r, y, Math.sin(a) * r);
  });

export const radiusAt = (y: number) =>
  tumbler.bottom +
  ((tumbler.top - tumbler.bottom) * (y - box.floor)) / tumbler.height;

export const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const grainRoll = seeded(1205);

export const grain = Array.from({ length: 34 }, (_, i) => {
  const y = (H * (i + grainRoll() * 0.8)) / 34;
  const wave = (grainRoll() - 0.5) * 1.6;
  return {
    alpha: 0.08 + grainRoll() * 0.2,
    points: [
      project(-A, y, A),
      project(grainRoll() * 40 - 20, y + wave * 1.6, A),
      project(A, y + wave * 0.4, A),
    ] as const,
    width: 0.12 + grainRoll() * 0.35,
  };
});

export const joints = [-1, 1].flatMap((side) =>
  [0, 1, 2, 3, 4]
    .filter((i) => (i + (side > 0 ? 1 : 0)) % 2 === 0)
    .map((i) =>
      corners([
        [side * A, (H * (i + 1)) / 5, A],
        [side * B, (H * (i + 1)) / 5, A],
        [side * B, (H * i) / 5, A],
        [side * A, (H * i) / 5, A],
      ])
    )
);

export const face = corners([
  [-A, H, A],
  [A, H, A],
  [A, 0, A],
  [-A, 0, A],
]);

export const rimOf = (side: -1 | 1) => ({
  ends: [-1, 1].map((x) =>
    corners([
      [x * A, H, side * A],
      [x * B, H, side * A],
      [x * B, H, side * B],
      [x * A, H, side * B],
    ])
  ),
  inner: corners([
    [B, H, 0],
    [B, H, side * B],
    [-B, H, side * B],
    [-B, H, 0],
  ]),
  outer: corners([
    [-A, H, 0],
    [-A, H, side * A],
    [A, H, side * A],
    [A, H, 0],
  ]),
});

export const level = (y: number) =>
  corners([
    [-B, y, -B],
    [B, y, -B],
    [B, y, B],
    [-B, y, B],
  ]);

export const backWall = corners([
  [-B, H, -B],
  [B, H, -B],
  [B, box.floor, -B],
  [-B, box.floor, -B],
]);

export const sideWalls = [-1, 1].map((x) =>
  corners([
    [x * B, H, -B],
    [x * B, H, B],
    [x * B, box.floor, B],
    [x * B, box.floor, -B],
  ])
);

export const domeOutline = (
  height: number,
  wave: (x: number, z: number) => number = () => 0
) => {
  const lift = height * LIFT;
  const surface = (x: number, z: number) =>
    project(x, H + lift * crown(x / B) * crown(z / B) * (1 + wave(x, z)), z);
  const columns = Array.from(
    { length: SAMPLES + 1 },
    (_, i) => -B + (2 * B * i) / SAMPLES
  );
  const upper = columns.map((x) => {
    let top = project(x, H, B);
    for (let j = 0; j <= SAMPLES / 2; j += 1) {
      const point = surface(x, -B + (4 * B * j) / SAMPLES);
      if (point.y < top.y) {
        top = point;
      }
    }
    return top;
  });
  const lower = columns.toReversed().map((x) => project(x, H, B));
  const crest = columns.map((x) => surface(x, B * 0.9));
  return { crest, lower, outline: [...upper, ...lower], upper };
};

export type Dome = ReturnType<typeof domeOutline>;

export const overflow = (
  floor: number,
  sway: (y: number, i: number) => number
) =>
  [0.55, 1.35, 2.25, 2.85].map((angle, i) => {
    const points: Point[] = [];
    for (let y = box.floor + tumbler.height; y >= floor; y -= 2) {
      const r = radiusAt(y) + 0.6;
      const a = angle + sway(y, i);
      points.push(project(Math.cos(a) * r, y, Math.sin(a) * r));
    }
    return points;
  });

export const drips = (grow: number) =>
  [-26, -15, -6, 5, 14, 24].map((x, i) => {
    const reach = (0.45 + 0.55 * Math.abs(Math.sin(i * 2.3 + 1))) * grow;
    return {
      bottom: project(x, H - (H + 1) * reach, A + 0.5),
      top: project(x, H, A + 0.5),
      width: 2.2 + (i % 3) * 1.4,
    };
  });

export const vesselScale = 0.6;

export const stamp = project(0, H * 0.46, A);

export const crestMark = (r: number) => {
  const { x, y } = stamp;
  return `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`;
};
