import { edgeOf } from "./liquid";
import { domeOf, mlOf, rateAt, volumeAt } from "./pour";
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
export const LIFT = 2.2;
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
  amber: "#9a6420",
  straw: "#fbefc8",
  wet: "#5e3c1c",
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

interface Vessel {
  outline: readonly (readonly [number, number])[];
  lip: Point;
  spout: Point;
  rest: number;
  tip: number;
  lean: number;
  content: number;
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
    lean: 0.22,
    content: 1800,
    spout: { x: 0, y: -1 },
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
    lean: 0.16,
    content: 450,
    spout: { x: 0.73, y: -0.68 },
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
    lean: 0.26,
    content: 540,
    spout: { x: 0, y: -1 },
  },
};

const RETURN = 0.45;
const JUDDER = 0.035;

const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

const tiltAt = (pour: Pour, hold: number, t: number) => {
  const tipped = ease(Math.min(t, hold) / pour.lag);
  return t <= hold ? tipped : tipped * (1 - ease((t - hold) / RETURN));
};

export const angleAt = (pour: Pour, hold: number, t: number) => {
  const vessel = vessels[pour.bottle];
  const tilt = tiltAt(pour, hold, t);
  const emptied = Math.min(
    1,
    mlOf(pour, volumeAt(pour, hold, t)) / vessel.content
  );
  const glug = t <= hold ? rateAt(pour, t) / pour.flow - 1 : 0;
  return (
    vessel.rest +
    (vessel.tip - vessel.rest + vessel.lean * emptied) * tilt +
    JUDDER * glug * tilt
  );
};

export const spoutAt = (bottle: Bottle, angle: number): Point => {
  const { spout } = vessels[bottle];
  const x = spout.x * Math.cos(angle) - spout.y * Math.sin(angle);
  const y = spout.x * Math.sin(angle) + spout.y * Math.cos(angle);
  const size = Math.hypot(x, y) || 1;
  return { x: -x / size, y: y / size };
};

export const lipOf = (pour: Pour) =>
  project(
    14,
    (pour.cup === "masu" ? box.height : box.floor + tumbler.height) +
      vessels[pour.bottle].drop,
    0
  );

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

const REACH = 6.5;

export const domeHeight = (
  lift: number,
  strain: number,
  x: number,
  z: number,
  wave = 0
) => {
  const reach = REACH * (1 - 0.4 * strain);
  const pinned =
    edgeOf(B - Math.abs(x), reach) * edgeOf(B - Math.abs(z), reach);
  return (lift * LIFT + wave) * pinned;
};

export const domeOutline = (
  height: number,
  strain = 0,
  wave: (x: number) => number = () => 0
) => {
  const surface = (x: number, z: number) =>
    project(x, H + domeHeight(height, strain, x, z, wave(x)), z);
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
  const crest = columns.map((x) => surface(x, B - REACH * 0.9));
  return { crest, lower, outline: [...upper, ...lower], upper };
};

export type Dome = ReturnType<typeof domeOutline>;

export const poolOutline = (radius: number, start: number, seed: number) => {
  const phase = seed % 97;
  const x = start * 0.4;
  const z = A + radius * 0.35;
  return Array.from({ length: 49 }, (_, i) => {
    const a = (i / 48) * TAU;
    const r =
      radius *
      (1 +
        0.09 * Math.sin(3 * a + phase) +
        0.05 * Math.sin(5 * a + phase * 1.7) +
        0.03 * Math.sin(9 * a + phase * 0.3));
    return project(x + Math.cos(a) * r * 1.25, 0, z + Math.sin(a) * r);
  });
};

export const vesselScale = 0.6;

export const stamp = project(0, H * 0.46, A);

export const crestMark = (r: number) => {
  const { x, y } = stamp;
  return `M${x} ${y - r}L${x + r} ${y}L${x} ${y + r}L${x - r} ${y}Z`;
};
