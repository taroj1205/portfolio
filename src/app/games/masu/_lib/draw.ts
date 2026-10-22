import { edgeOf, tiltAt, waveAt } from "./liquid";
import type { Bead, Impact, Run, Spillage, Stream, Wave } from "./liquid";
import { bottles } from "./pour";
import type { Bottle } from "./pour";
import {
  GLASS_TOP,
  LIFT,
  alongSide,
  box,
  domeHeight,
  edgeLine,
  frontArc,
  glassBetween,
  glintOn,
  hull,
  project,
  radiusAt,
  ring,
  shine,
  shoulderOf,
  surfaceOutline,
  toward,
  tumbler,
} from "./scene";
import type { Fill, Point, Side, Surface, Vec } from "./scene";

type Blend = "multiply" | "screen";

export type Stop = readonly [number, string, number];

export type Paint =
  | { kind: "solid"; colour: string }
  | { kind: "linear"; from: Point; to: Point; stops: readonly Stop[] }
  | { kind: "radial"; r: number; stops: readonly Stop[] };

const solid = (colour: string): Paint => ({ colour, kind: "solid" });

export interface Matrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
}

export const spriteNames = [
  "inside",
  "outside",
  "glassBack",
  "glassFront",
  ...bottles,
] as const;

export type Sprite = (typeof spriteNames)[number];

interface Look {
  alpha?: number;
  blend?: Blend;
  clip?: readonly Point[];
}

export interface Liquid {
  round: boolean;
  half: number;
  span: number;
  base: number;
  lift: number;
  reach: number;
  pinned: boolean;
  ripple: number;
  meniscus: number;
  wave: Wave;
}

export type Op =
  | (Look & { kind: "fill"; d: string; paint: Paint; matrix?: Matrix })
  | (Look & { kind: "stroke"; d: string; paint: Paint; width: number })
  | (Look & { kind: "sprite"; name: Sprite; matrix?: Matrix })
  | (Look & { kind: "lens"; clip: readonly Point[]; matrix: Matrix })
  | { kind: "sake"; liquid: Liquid; ops: readonly Op[] };

type Layer = Exclude<Op, { kind: "sake" }>;

export const flatten = (ops: readonly Op[]): Layer[] =>
  ops.flatMap((op) => (op.kind === "sake" ? flatten(op.ops) : [op]));

export interface Bubble {
  x: number;
  z: number;
  r: number;
  fade: number;
}

export interface Moment {
  fill: Fill;
  strain: number;
  wave: Wave;
  film: number;
  clock: number;
  spillage: Spillage | null;
  flux: number;
  stream: Stream | null;
  rate: number;
  bubbles: readonly Bubble[];
  drops: readonly Bead[];
  bottle: { name: Bottle; matrix: Matrix } | null;
}

const TAU = Math.PI * 2;
const H = box.height;
const A = box.outer;
const B = box.inner;
const FLOOR = box.floor;
const BASE = FLOOR + tumbler.base;
const DOME_WAVE = 1.2;
const MENISCUS = 0.3;
const SHEEN = "#fff7e6";
const SPARK = "#ffffff";
const STRAW = "#f4e4b4";
const GOLD = "#efc366";
const LAMP = "#ffcf8a";
const DAMP = "#b4854c";
const DUSK = "#1c120a";
const WET = "#9c6a38";
const SOAK = "#3a2210";

const round = (value: number) => Math.round(value * 100) / 100;

export const pathOf = (points: readonly Point[], close = true) =>
  points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${round(point.x)} ${round(point.y)}`
    )
    .join("") + (close ? "Z" : "");

const UNIT = "M-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0Z";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const smooth = (from: number, to: number, t: number) => {
  const p = clamp((t - from) / (to - from));
  return p * p * (3 - 2 * p);
};

export const affineFrom = (
  from: readonly [Point, Point, Point],
  to: readonly [Point, Point, Point]
): Matrix => {
  const [p0, p1, p2] = from;
  const [q0, q1, q2] = to;
  const ux = p1.x - p0.x;
  const uy = p1.y - p0.y;
  const vx = p2.x - p0.x;
  const vy = p2.y - p0.y;
  const det = ux * vy - vx * uy || 1;
  const sx = { x: q1.x - q0.x, y: q1.y - q0.y };
  const sy = { x: q2.x - q0.x, y: q2.y - q0.y };
  const a = (sx.x * vy - sy.x * uy) / det;
  const c = (sy.x * ux - sx.x * vx) / det;
  const b = (sx.y * vy - sy.y * uy) / det;
  const d = (sy.y * ux - sx.y * vx) / det;
  return {
    a,
    b,
    c,
    d,
    e: q0.x - a * p0.x - c * p0.y,
    f: q0.y - b * p0.x - d * p0.y,
  };
};

const mirrorAbout = (p: Point, q: Point): Matrix => {
  const slope = (q.y - p.y) / (q.x - p.x || 1);
  return { a: 1, b: 2 * slope, c: 0, d: -1, e: 0, f: 2 * (p.y - slope * p.x) };
};

const placed = (at: Point, sx: number, sy: number, turn = 0): Matrix => ({
  a: sx * Math.cos(turn),
  b: sx * Math.sin(turn),
  c: -sy * Math.sin(turn),
  d: sy * Math.cos(turn),
  e: at.x,
  f: at.y,
});

const about = (at: Point, sx: number, sy: number): Matrix => ({
  a: sx,
  b: 0,
  c: 0,
  d: sy,
  e: at.x * (1 - sx),
  f: at.y * (1 - sy),
});

const spot = (
  at: Point,
  size: Point,
  stops: readonly Stop[],
  look: Look,
  turn = 0
): Op => ({
  ...look,
  d: UNIT,
  kind: "fill",
  matrix: placed(at, size.x, size.y, turn),
  paint: { kind: "radial", r: 1, stops },
});

const band = (upper: readonly Point[], lower: readonly Point[]): Point[] => [
  ...upper,
  ...lower.toReversed(),
];

interface Pool {
  height: Surface;
  outline: Point[];
  level: number;
  domed: boolean;
  swell: number;
  ripple: number;
}

const poolOf = ({ fill, strain, wave }: Moment): Pool | null => {
  const ripple = (x: number, z: number) => waveAt(wave, x / B, z / B);
  if (fill.dome > 0) {
    const height: Surface = (x, z) =>
      H + domeHeight(fill.dome, strain, x, z, ripple(x, z) * DOME_WAVE);
    return {
      domed: true,
      height,
      level: H + fill.dome * LIFT,
      outline: surfaceOutline(height),
      ripple: DOME_WAVE,
      swell: clamp(fill.dome / 2.5),
    };
  }
  if (fill.level <= FLOOR + 0.15) {
    return null;
  }
  const calm = smooth(FLOOR, FLOOR + 6, fill.level);
  return {
    domed: false,
    height: (x, z) => fill.level + ripple(x, z) * calm,
    level: fill.level,
    outline: surfaceOutline(() => fill.level),
    ripple: calm,
    swell: 0,
  };
};

const backing = pathOf(
  hull([
    ...[-B, B].flatMap((x) =>
      [FLOOR, H].flatMap((y) => [project(x, y, -B), project(x, y, B)])
    ),
    project(A, FLOOR, -B),
    project(A, FLOOR, A),
    project(-B, FLOOR, A),
  ])
);

const refraction = (level: number): Matrix => {
  const corner = project(-B, level, -B);
  const edge = Math.max(FLOOR, Math.min(level, H) - 0.5);
  return affineFrom(
    [corner, project(-B, FLOOR, B), project(B, FLOOR, B)],
    [corner, project(-B, edge, B), project(B, edge, B)]
  );
};

const highlight = (
  y: number,
  clip: readonly Point[],
  inside: (at: Vec) => boolean,
  moment: Moment,
  half: number,
  long: number
): Op[] => {
  const at = glintOn(y);
  if (!inside(at)) {
    return [];
  }
  const tilt = tiltAt(moment.wave, at.x / half, at.z / half, half / 2.2, 0.3);
  const centre = project(at.x + tilt.x * 18, y, at.z + tilt.z * 18);
  const stretch = 1 + Math.hypot(tilt.x, tilt.z) * 3;
  return [
    spot(
      centre,
      { x: long * 1.7 * stretch, y: 2.4 + long * 0.16 },
      [
        [0, LAMP, 0.32],
        [0.5, LAMP, 0.1],
        [1, LAMP, 0],
      ],
      { blend: "screen", clip },
      -0.05
    ),
    spot(
      centre,
      { x: long * stretch, y: 1.3 + long * 0.06 },
      [
        [0, SHEEN, 0.8],
        [0.4, SHEEN, 0.28],
        [1, SHEEN, 0],
      ],
      { blend: "screen", clip },
      -0.05
    ),
    spot(
      centre,
      { x: long * 0.4 * stretch, y: 0.55 },
      [
        [0, SPARK, 1],
        [0.5, SPARK, 0.5],
        [1, SPARK, 0],
      ],
      { blend: "screen", clip },
      -0.05
    ),
  ];
};

const BOKEH = [
  [-0.55, -0.5, 9, "#ffb055"],
  [0.45, -0.7, 6, "#ffd08a"],
  [0.6, 0.05, 11, "#ff8a4a"],
] as const;

const bokehOps = (
  moment: Moment,
  y: number,
  alpha: number,
  clip: readonly Point[]
) =>
  BOKEH.map(([u, v, r, tint]) => {
    const tilt = tiltAt(moment.wave, u, v, B / 2.2, 0.3);
    return spot(
      project((u + tilt.x) * B, y, (v + tilt.z) * B),
      { x: r, y: r * 0.45 },
      [
        [0, tint, alpha],
        [0.5, tint, alpha * 0.4],
        [1, tint, 0],
      ],
      { blend: "screen", clip }
    );
  });

const impactOf = (moment: Moment) => moment.stream?.impact ?? null;

const splashOps = (
  moment: Moment,
  impact: Impact,
  y: number,
  clip: readonly Point[]
): Op[] => {
  const { clock, rate } = moment;
  const left = project(-10, y, 0);
  const right = project(10, y, 0);
  const x = ((impact.x - left.x) / (right.x - left.x || 1)) * 20 - 10;
  const q = Math.min(1.4, rate);
  const r = (1.2 + 2.6 * Math.sqrt(q)) * (1 + 0.1 * Math.sin(clock * 47));
  return [
    ...[0, 0.5].map((phase): Op => {
      const age = (clock * 1.6 + phase) % 1;
      return {
        alpha: 0.16 * (1 - age) ** 2 * Math.min(1, q),
        blend: "screen",
        clip,
        d: pathOf(
          Array.from({ length: 33 }, (_, i) => {
            const a = (i / 32) * TAU;
            const reach = 2 + age * 13;
            return project(x + Math.cos(a) * reach, y, Math.sin(a) * reach);
          })
        ),
        kind: "stroke",
        paint: solid(SHEEN),
        width: 0.25,
      };
    }),
    spot(
      impact,
      { x: r, y: r * 0.42 },
      [
        [0, SPARK, 0.75 * Math.min(1, q + 0.2)],
        [0.5, SHEEN, 0.3 * Math.min(1, q + 0.2)],
        [1, SHEEN, 0],
      ],
      { blend: "screen", clip }
    ),
  ];
};

const bubbleOps = (moment: Moment, height: Surface, clip: readonly Point[]) =>
  moment.bubbles.map((bubble) =>
    spot(
      project(bubble.x, height(bubble.x, bubble.z) + 0.1, bubble.z),
      { x: bubble.r, y: bubble.r * 0.55 },
      [
        [0, SPARK, 0],
        [0.6, SPARK, 0.25 * bubble.fade],
        [0.85, SHEEN, 0.75 * bubble.fade],
        [1, SHEEN, 0],
      ],
      { blend: "screen", clip }
    )
  );

const glassMirror = (moment: Moment, y: number, clip: readonly Point[]) => {
  if (moment.fill.glass === null) {
    return [];
  }
  const r = radiusAt(y);
  const matrix = mirrorAbout(project(-r, y, 0), project(r, y, 0));
  return (["glassBack", "glassFront"] as const).map((name): Op => ({
    alpha: 0.28,
    clip,
    kind: "sprite",
    matrix,
    name,
  }));
};

const NUDGE = 0.3;
const GLOW = 2;

const normalOf = (height: Surface, x: number, z: number): Vec => ({
  x: (height(x - NUDGE, z) - height(x + NUDGE, z)) / (2 * NUDGE),
  y: 1,
  z: (height(x, z - NUDGE) - height(x, z + NUDGE)) / (2 * NUDGE),
});

const glowAt = (at: Vec, normal: Vec) =>
  Math.min(1, GLOW * shine(at, normal, 30));

const sheen = (
  points: readonly Point[],
  glow: readonly number[],
  alpha: number,
  width: number,
  clip: readonly Point[]
): Op => ({
  blend: "screen",
  clip,
  d: pathOf(points, false),
  kind: "stroke",
  paint: {
    from: points[0] ?? { x: 0, y: 0 },
    kind: "linear",
    stops: glow.map((g, i) => [
      i / Math.max(1, glow.length - 1),
      SPARK,
      g * alpha,
    ]),
    to: points.at(-1) ?? { x: 1, y: 0 },
  },
  width,
});

const contact = (shade: readonly Point[], clip?: readonly Point[]): Op => ({
  alpha: 0.4,
  blend: "multiply",
  clip,
  d: pathOf(shade, false),
  kind: "stroke",
  paint: solid(DUSK),
  width: 0.5,
});

const line = (
  points: readonly Point[],
  alpha: number,
  clip?: readonly Point[]
): Op => ({
  alpha,
  blend: "screen",
  clip,
  d: pathOf(points, false),
  kind: "stroke",
  paint: solid(SPARK),
  width: 0.32,
});

const domeEdge = (height: Surface, strain: number, clip: readonly Point[]) => {
  const reach = shoulderOf(strain);
  const sides: readonly Side[] = ["back", "left", "right", "front"];
  return sides.flatMap((side): Op[] => {
    const crest = side === "back";
    const glow = alongSide(side, reach * 0.4).map(([x, z]) =>
      Math.max(
        crest ? 0.75 : 0,
        glowAt({ x, y: height(x, z), z }, normalOf(height, x, z))
      )
    );
    return [
      sheen(
        edgeLine(height, side, reach * 0.55),
        glow,
        0.22,
        reach * 0.8,
        clip
      ),
      sheen(
        edgeLine(height, side, reach * 0.3),
        glow,
        crest ? 0.95 : 0.6,
        reach * (crest ? 0.26 : 0.2),
        clip
      ),
      contact(edgeLine(height, side, 0.9), clip),
      sheen(
        edgeLine(height, side, 0.15),
        glow.map((g) => 0.3 + 0.7 * g),
        crest ? 1 : 0.45,
        0.3,
        clip
      ),
    ];
  });
};

const glare = ({ level, swell }: Pool, clip: readonly Point[]): Op[] => {
  const at = (x: number, z: number) => project(x * B, level, z * B);
  return [
    {
      blend: "screen",
      clip,
      d: pathOf([
        at(-0.55, -0.82),
        at(0.5, -0.82),
        at(0.5, -0.12),
        at(-0.55, -0.12),
      ]),
      kind: "fill",
      paint: {
        from: at(0, -0.82),
        kind: "linear",
        stops: [
          [0, SHEEN, 0],
          [0.25, SHEEN, 0.42 * swell],
          [0.7, SHEEN, 0.3 * swell],
          [1, SHEEN, 0],
        ],
        to: at(0, -0.12),
      },
    },
    ...[-0.2, 0.15].map((x): Op => ({
      alpha: 0.12 * swell,
      blend: "multiply",
      clip,
      d: pathOf([at(x, -0.8), at(x, -0.14)], false),
      kind: "stroke",
      paint: solid(DUSK),
      width: 0.5,
    })),
  ];
};

const shoulders = (height: Surface, strain: number, clip: readonly Point[]) => {
  const reach = shoulderOf(strain);
  return (["left", "front"] as const).map((side): Op => ({
    alpha: 0.32,
    blend: "multiply",
    clip,
    d: pathOf(edgeLine(height, side, reach * 0.45), false),
    kind: "stroke",
    paint: solid(DUSK),
    width: reach * 0.7,
  }));
};

const liquidOf = ({ fill, strain, wave }: Moment, pool: Pool): Liquid => ({
  base: pool.domed ? H : pool.level,
  half: B,
  lift: pool.domed ? fill.dome * LIFT : 0,
  meniscus: pool.domed ? 0 : MENISCUS,
  pinned: pool.domed,
  reach: shoulderOf(strain),
  ripple: pool.ripple,
  round: false,
  span: B,
  wave,
});

const poolOps = (
  moment: Moment,
  pool: Pool,
  clip: readonly Point[],
  shaded = true
): Op[] => {
  const { height, level, domed } = pool;
  const deep = clamp((level - FLOOR) / (H - FLOOR));
  const wet = smooth(FLOOR, FLOOR + 2, level);
  const back = project(0, level, -B);
  const front = project(0, level, B);
  const impact = impactOf(moment);
  const body: Op[] = [
    { clip, kind: "lens", matrix: refraction(level) },
    {
      alpha: wet * (0.32 + 0.15 * deep),
      blend: "multiply",
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: {
        from: back,
        kind: "linear",
        stops: [
          [0, DAMP, 1],
          [0.6, DAMP, 0.8],
          [1, DAMP, 0.65],
        ],
        to: front,
      },
    },
    spot(
      project(0, level, 0),
      { x: B * 1.35, y: (front.y - back.y) * 0.75 },
      [
        [0, GOLD, 0.25 + 0.35 * deep],
        [0.55, GOLD, 0.2 + 0.25 * deep],
        [1, STRAW, 0.25],
      ],
      { blend: "multiply", clip }
    ),
    {
      alpha: domed ? 0.18 : 0.45,
      blend: "screen",
      clip,
      kind: "lens",
      matrix: mirrorAbout(project(-B, level, -B), project(B, level, -B)),
    },
    {
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: {
        from: back,
        kind: "linear",
        stops: [
          [0, DUSK, 0.16],
          [0.5, DUSK, 0.05],
          [1, DUSK, 0],
        ],
        to: front,
      },
    },
    {
      blend: "screen",
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: {
        from: back,
        kind: "linear",
        stops: [
          [0, LAMP, 0.26],
          [0.3, LAMP, 0.08],
          [1, LAMP, 0],
        ],
        to: front,
      },
    },
    ...bokehOps(moment, level, wet * 0.45, clip),
    ...(domed ? glare(pool, clip) : []),
    ...highlight(
      level,
      clip,
      (at) => Math.abs(at.x) < B - 3 && Math.abs(at.z) < B - 3,
      moment,
      B,
      domed ? 34 : 26
    ),
    ...(domed
      ? [
          ...shoulders(height, moment.strain, clip),
          ...domeEdge(height, moment.strain, clip),
        ]
      : []),
  ];
  return [
    ...(shaded
      ? [{ kind: "sake", liquid: liquidOf(moment, pool), ops: body } as const]
      : body),
    ...glassMirror(moment, level, clip),
    ...bubbleOps(moment, height, clip),
    ...(impact === null || moment.fill.glass !== null
      ? []
      : splashOps(moment, impact, level, clip)),
  ];
};

const waterline = ({ height, level }: Pool): Op[] => {
  const climbed: Surface = (x, z) => height(x, z) + MENISCUS;
  const glint = glintOn(level);
  const bead = (x: number, z: number) =>
    spot(
      project(x, level + MENISCUS, z),
      { x: 1.8, y: 0.75 },
      [
        [0, SPARK, 1],
        [0.45, SHEEN, 0.5],
        [1, SHEEN, 0],
      ],
      { blend: "screen" }
    );
  return [
    ...(["back", "left"] as const).flatMap((side): Op[] => [
      {
        alpha: 0.5,
        blend: "multiply",
        d: pathOf(edgeLine(height, side, 1.1), false),
        kind: "stroke",
        paint: solid(SOAK),
        width: 1,
      },
      {
        alpha: 0.4,
        blend: "screen",
        d: pathOf(edgeLine(climbed, side), false),
        kind: "stroke",
        paint: solid(SHEEN),
        width: 1.1,
      },
      {
        alpha: 0.95,
        blend: "screen",
        d: pathOf(edgeLine(climbed, side), false),
        kind: "stroke",
        paint: solid(SPARK),
        width: 0.4,
      },
    ]),
    bead(Math.min(B - 3, Math.max(3 - B, glint.x)), -B),
    bead(-B + 0.6, -B + 0.6),
  ];
};

const LIP = 0.9;
const lipXs = alongSide("front").map(([x]) => x);
const taper = (x: number) => edgeOf(B - Math.abs(x), 2.5);
const lipFoot = lipXs.map((x) => project(x, H + 0.02, B + LIP * taper(x)));

const lipOps = ({ height, swell }: Pool): Op[] => {
  const crest = lipXs.map((x) =>
    project(x, H + 0.15 + 0.7 * swell * taper(x), B + LIP * 0.3)
  );
  const top = edgeLine(height, "front", 1.2);
  return [
    {
      alpha: 0.45,
      blend: "multiply",
      d: pathOf(band(top, lipFoot)),
      kind: "fill",
      paint: solid(GOLD),
    },
    {
      alpha: 0.5,
      blend: "multiply",
      d: pathOf(lipFoot, false),
      kind: "stroke",
      paint: solid(SOAK),
      width: 0.45,
    },
    {
      alpha: 0.95,
      blend: "screen",
      d: pathOf(crest, false),
      kind: "stroke",
      paint: solid(SPARK),
      width: 0.4,
    },
  ];
};

const inner = (y: number) => radiusAt(y) - tumbler.wall;

const GLASS_REACH = 4.5;
const GLASS_RIPPLE = 0.6;
const ARCS = 24;

const glassLiquid = (
  { wave }: Moment,
  y: number,
  r: number,
  lift: number
): Liquid =>
  lift > 0
    ? {
        base: GLASS_TOP,
        half: tumbler.top,
        lift,
        meniscus: 0,
        pinned: true,
        reach: GLASS_REACH,
        ripple: 0,
        round: true,
        span: r,
        wave,
      }
    : {
        base: y,
        half: r,
        lift: 0,
        meniscus: MENISCUS,
        pinned: false,
        reach: 1,
        ripple: GLASS_RIPPLE,
        round: true,
        span: r,
        wave,
      };

const glassDomeLines = (lift: number): Op[] => [
  line(frontArc(GLASS_TOP + lift - 0.15, tumbler.top - GLASS_REACH * 0.8), 0.7),
  {
    alpha: 0.95,
    blend: "screen",
    d: pathOf(ring(GLASS_TOP + 0.05, tumbler.top + 0.1, 0, TAU, 64)),
    kind: "stroke",
    paint: solid(SPARK),
    width: 0.32,
  },
];

const glassDome = (lift: number): Op[] => {
  const r = tumbler.top;
  const crest = GLASS_TOP + lift;
  const heightAt = (rho: number) =>
    GLASS_TOP + lift * edgeOf(r - rho, GLASS_REACH);
  const outline = hull([
    ...ring(crest, r - GLASS_REACH, 0, TAU, 48),
    ...ring(GLASS_TOP, r, 0, TAU, 48),
  ]);
  const rho = r - GLASS_REACH * 0.4;
  const slope = (heightAt(rho - NUDGE) - heightAt(rho + NUDGE)) / (2 * NUDGE);
  const arcs = Array.from({ length: ARCS }, (_, i): Op => {
    const from = (i / ARCS) * TAU;
    const to = ((i + 1) / ARCS) * TAU;
    const middle = (from + to) / 2;
    const at = {
      x: Math.cos(middle) * rho,
      y: heightAt(rho),
      z: Math.sin(middle) * rho,
    };
    return {
      alpha: glowAt(at, {
        x: -Math.cos(middle) * slope,
        y: 1,
        z: -Math.sin(middle) * slope,
      }),
      blend: "screen",
      d: pathOf(ring(heightAt(rho), rho, from, to, 4), false),
      kind: "stroke",
      paint: solid(SPARK),
      width: GLASS_REACH * 0.45,
    };
  });
  const lamp = glintOn(crest);
  const pull = Math.min(1, (r * 0.5) / (Math.hypot(lamp.x, lamp.z) || 1));
  const glint = project(lamp.x * pull, crest, lamp.z * pull);
  return [
    {
      alpha: 0.3,
      blend: "multiply",
      clip: outline,
      d: pathOf(outline),
      kind: "fill",
      paint: solid(GOLD),
    },
    {
      blend: "screen",
      clip: outline,
      d: pathOf(outline),
      kind: "fill",
      paint: {
        from: project(0, crest, -r),
        kind: "linear",
        stops: [
          [0, SHEEN, 0.14],
          [0.5, SHEEN, 0.03],
          [1, SHEEN, 0.06],
        ],
        to: project(0, crest, r),
      },
    },
    {
      blend: "screen",
      clip: outline,
      d: pathOf(band(frontArc(crest, r - GLASS_REACH), frontArc(GLASS_TOP, r))),
      kind: "fill",
      paint: {
        from: project(0, crest, r - GLASS_REACH),
        kind: "linear",
        stops: [
          [0, SPARK, 0.32],
          [0.4, SHEEN, 0.08],
          [1, SHEEN, 0.03],
        ],
        to: project(0, GLASS_TOP, r),
      },
    },
    ...arcs.map((arc) => ({ ...arc, clip: outline })),
    spot(
      glint,
      { x: r * 0.85, y: 2.6 },
      [
        [0, SPARK, 0.9],
        [0.35, SHEEN, 0.35],
        [1, SHEEN, 0],
      ],
      { blend: "screen", clip: outline },
      -0.06
    ),
  ];
};

const glassContents = (
  moment: Moment,
  glass: NonNullable<Fill["glass"]>
): Op[] => {
  if (glass.level <= BASE + 0.2) {
    return [];
  }
  const y = Math.min(glass.level, GLASS_TOP);
  const r = inner(y);
  const middle = (BASE + y) / 2;
  const clip = glassBetween(BASE, y, tumbler.wall);
  const surface = ring(y, r, 0, TAU, 48);
  const ripple = (x: number, z: number) => waveAt(moment.wave, x / r, z / r);
  const impact = impactOf(moment);
  const side = (sign: number, inset = 0) => {
    const angle = toward + sign * (Math.PI / 2 - inset);
    return (at: number) =>
      project(Math.cos(angle) * inner(at), at, Math.sin(angle) * inner(at));
  };
  const across = (stops: readonly Stop[]): Paint => ({
    from: side(-1)(middle),
    kind: "linear",
    stops,
    to: side(1)(middle),
  });
  return [
    {
      clip,
      kind: "lens",
      matrix: about(project(0, middle, 0), 1.34, 1.02),
    },
    {
      blend: "multiply",
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: across([
        [0, GOLD, 0.35],
        [0.5, GOLD, 0.7],
        [1, GOLD, 0.35],
      ]),
    },
    {
      alpha: 0.14,
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: solid(GOLD),
    },
    {
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: across([
        [0, DUSK, 0.62],
        [0.1, DUSK, 0.36],
        [0.24, DUSK, 0.06],
        [0.76, DUSK, 0.06],
        [0.9, DUSK, 0.36],
        [1, DUSK, 0.62],
      ]),
    },
    ...[-1, 1].map((sign): Op => {
      const edge = side(sign, 0.32);
      return {
        alpha: 0.5,
        blend: "screen",
        clip,
        d: pathOf([edge(BASE + 1), edge(y - 1)], false),
        kind: "stroke",
        paint: solid(SHEEN),
        width: 0.9,
      };
    }),
    {
      kind: "sake",
      liquid: glassLiquid(moment, y, r, glass.dome),
      ops: [
        {
          blend: "screen",
          clip: surface,
          d: pathOf(surface),
          kind: "fill",
          paint: {
            from: project(0, y, -r),
            kind: "linear",
            stops: [
              [0, LAMP, 0.4],
              [0.55, SHEEN, 0.06],
              [1, SHEEN, 0.14],
            ],
            to: project(0, y, r),
          },
        },
        {
          clip: surface,
          d: pathOf(surface),
          kind: "fill",
          paint: {
            from: project(0, y, -r),
            kind: "linear",
            stops: [
              [0, DUSK, 0.3],
              [0.5, DUSK, 0.14],
              [1, DUSK, 0.06],
            ],
            to: project(0, y, r),
          },
        },
        ...highlight(
          y,
          surface,
          (at) => Math.hypot(at.x, at.z) < r - 2,
          moment,
          r,
          13
        ),
        ...(glass.dome > 0 ? glassDome(glass.dome) : []),
      ],
    },
    ...(impact === null ? [] : splashOps(moment, impact, y, surface)),
    {
      alpha: 0.45,
      blend: "multiply",
      clip,
      d: pathOf(frontArc(y - 1.2, r), false),
      kind: "stroke",
      paint: solid(SOAK),
      width: 1.6,
    },
    contact(ring(y - 0.6, r - 0.4, 0, TAU, 48)),
    line(
      Array.from({ length: 49 }, (_, i) => {
        const x = Math.cos((i / 48) * TAU) * r;
        const z = Math.sin((i / 48) * TAU) * r;
        return project(x, y + ripple(x, z) * GLASS_RIPPLE, z);
      }),
      0.95
    ),
    {
      alpha: 0.9,
      blend: "screen",
      d: pathOf(frontArc(y + 0.2, r + 0.2), false),
      kind: "stroke",
      paint: solid(SPARK),
      width: 0.55,
    },
    ...(glass.dome > 0 ? glassDomeLines(glass.dome) : []),
  ];
};

const skin = (y: number) => radiusAt(y) + 0.45;

const onSkin = (angle: number, y: number) =>
  project(Math.cos(angle) * skin(y), y, Math.sin(angle) * skin(y));

const sheetOps = (moment: Moment, glass: NonNullable<Fill["glass"]>): Op[] => {
  if (!glass.over) {
    return [];
  }
  const { film, clock } = moment;
  const foot = Math.max(moment.fill.level, FLOOR);
  const sheet = band(
    frontArc(GLASS_TOP, skin(GLASS_TOP)),
    frontArc(foot, skin(foot))
  );
  const runs = [-1.05, -0.62, -0.2, 0.27, 0.7, 1.1].map((offset, i): Op => {
    const a = toward + offset;
    const width = 0.02 + 0.012 * ((i * 7) % 3);
    const top = onSkin(a, GLASS_TOP);
    const bottom = onSkin(a, foot);
    const pulse = (clock * 1.4 + i * 0.37) % 1;
    return {
      alpha: 0.25 + 0.75 * film,
      blend: "screen",
      d: pathOf([
        onSkin(a - width, GLASS_TOP),
        onSkin(a + width, GLASS_TOP),
        onSkin(a + width * 1.5, foot),
        onSkin(a - width * 1.5, foot),
      ]),
      kind: "fill",
      paint: {
        from: top,
        kind: "linear",
        stops: [
          [0, SHEEN, 0.45],
          [Math.max(0.01, pulse - 0.1), SHEEN, 0.12],
          [pulse, SPARK, 0.55],
          [Math.min(0.99, pulse + 0.1), SHEEN, 0.12],
          [1, SHEEN, 0.3],
        ],
        to: bottom,
      },
    };
  });
  return [
    {
      alpha: 0.25 + 0.3 * film,
      blend: "multiply",
      d: pathOf(sheet),
      kind: "fill",
      paint: solid(GOLD),
    },
    {
      alpha: 0.08 + 0.12 * film,
      blend: "screen",
      d: pathOf(sheet),
      kind: "fill",
      paint: solid(SHEEN),
    },
    ...runs,
    {
      alpha: 0.35 + 0.5 * film,
      blend: "screen",
      d: pathOf(frontArc(GLASS_TOP + 0.3, tumbler.top + 0.35), false),
      kind: "stroke",
      paint: solid(SPARK),
      width: 0.55,
    },
    {
      alpha: 0.2 + 0.5 * film,
      blend: "screen",
      d: pathOf(frontArc(foot + 0.4, skin(foot) + 0.8), false),
      kind: "stroke",
      paint: solid(SHEEN),
      width: 0.6,
    },
  ];
};

const submergedOf = (level: number) =>
  band(
    frontArc(level, radiusAt(level) + 0.3),
    frontArc(FLOOR, radiusAt(FLOOR) + 0.3)
  );

const beadOps = (bead: Bead): Op[] => [
  spot(
    bead,
    { x: bead.r * 0.95, y: bead.r * 1.1 },
    [
      [0, STRAW, 0.2],
      [0.75, SHEEN, 0.35],
      [1, SHEEN, 0],
    ],
    { blend: "screen" }
  ),
  spot(
    { x: bead.x - bead.r * 0.3, y: bead.y - bead.r * 0.35 },
    { x: bead.r * 0.3, y: bead.r * 0.3 },
    [
      [0, SPARK, 0.95],
      [1, SPARK, 0],
    ],
    { blend: "screen" }
  ),
];

const BEADS = 16;

export const streamOps = (stream: Stream | null, clock: number): Op[] => {
  if (stream === null) {
    return [];
  }
  return [
    ...stream.threads.flatMap((thread): Op[] => {
      const left: Point[] = [];
      const right: Point[] = [];
      const lit: Point[] = [];
      const far: Point[] = [];
      let width = 0;
      for (const [index, bead] of thread.entries()) {
        const before = thread[Math.max(0, index - 1)] ?? bead;
        const after = thread[Math.min(thread.length - 1, index + 1)] ?? bead;
        const size = Math.hypot(after.x - before.x, after.y - before.y) || 1;
        const nx = -(after.y - before.y) / size;
        const ny = (after.x - before.x) / size;
        left.push({ x: bead.x + nx * bead.r, y: bead.y + ny * bead.r });
        right.push({ x: bead.x - nx * bead.r, y: bead.y - ny * bead.r });
        lit.push({
          x: bead.x + nx * bead.r * 0.42,
          y: bead.y + ny * bead.r * 0.42,
        });
        far.push({
          x: bead.x - nx * bead.r * 0.66,
          y: bead.y - ny * bead.r * 0.66,
        });
        width += bead.r / thread.length;
      }
      const outline = band(left, right);
      const glints = Array.from({ length: BEADS + 1 }, (_, i): Stop => {
        const at = i / BEADS;
        const swell = 0.5 + 0.5 * Math.sin((at * at * 5.5 - clock * 3.1) * TAU);
        return [at, SPARK, (0.4 + 0.6 * swell) * (1 - 0.3 * at)];
      });
      return [
        {
          alpha: 0.18,
          d: pathOf(outline),
          kind: "fill",
          paint: solid(STRAW),
        },
        ...[left, right].map((edge, side): Op => ({
          alpha: side === 0 ? 0.42 : 0.6,
          blend: "multiply",
          clip: outline,
          d: pathOf(edge, false),
          kind: "stroke",
          paint: solid(WET),
          width: Math.max(0.12, width * 0.85),
        })),
        {
          blend: "screen",
          d: pathOf(lit, false),
          kind: "stroke",
          paint: {
            from: thread[0] ?? { x: 0, y: 0 },
            kind: "linear",
            stops: glints,
            to: thread.at(-1) ?? { x: 0, y: 1 },
          },
          width: Math.max(0.1, width * 0.26),
        },
        {
          alpha: 0.4,
          blend: "screen",
          d: pathOf(far, false),
          kind: "stroke",
          paint: solid(SHEEN),
          width: Math.max(0.08, width * 0.12),
        },
      ];
    }),
    ...stream.beads.flatMap(beadOps),
  ];
};

const face = [
  project(-A, H, A),
  project(A, H, A),
  project(A, 0, A),
  project(-A, 0, A),
];

const film = (
  path: readonly Run[],
  width: (bead: Run) => number,
  shift = 0
) => {
  const left: Point[] = [];
  const right: Point[] = [];
  for (const bead of path) {
    const r = width(bead);
    left.push(project(bead.x + shift - r, bead.y, A + 0.3));
    right.push(project(bead.x + shift + r, bead.y, A + 0.3));
  }
  return pathOf(band(left, right));
};

const puddleOps = (spillage: Spillage): Op[] => {
  const outline = spillage.pool.outline.map(({ x, z }) => project(x, 0, z));
  if (outline.length < 3) {
    return [];
  }
  const glint = glintOn(0);
  return [
    {
      alpha: 0.32,
      blend: "multiply",
      d: pathOf(outline),
      kind: "fill",
      paint: solid(SOAK),
    },
    {
      alpha: 0.3,
      blend: "multiply",
      d: pathOf(outline),
      kind: "fill",
      paint: solid(GOLD),
    },
    {
      alpha: 0.36,
      clip: outline,
      kind: "sprite",
      matrix: mirrorAbout(project(-A, 0, A), project(A, 0, A)),
      name: "outside",
    },
    {
      blend: "multiply",
      clip: outline,
      d: pathOf(outline),
      kind: "fill",
      paint: {
        from: project(0, 0, A),
        kind: "linear",
        stops: [
          [0, SOAK, 0],
          [0.5, SOAK, 0.35],
          [1, SOAK, 0.6],
        ],
        to: project(0, 0, A + 60),
      },
    },
    spot(
      project(glint.x, 0, Math.max(A + 6, glint.z)),
      { x: 22, y: 2.2 },
      [
        [0, SPARK, 0.6],
        [0.4, SHEEN, 0.2],
        [1, SHEEN, 0],
      ],
      { blend: "screen", clip: outline },
      -0.1
    ),
    contact(outline),
    line(outline, 0.14),
  ];
};

const spillOps = (moment: Moment, spillage: Spillage): Op[] => {
  const { rivulets, sheet, start } = spillage;
  const from = Math.max(-A, start - sheet / 2);
  const to = Math.min(A, start + sheet / 2);
  const rim: Op[] =
    to > from
      ? [
          {
            alpha: 0.35,
            blend: "multiply",
            d: pathOf([
              project(from, H + 0.2, B),
              project(to, H + 0.2, B),
              project(to, H + 0.2, A + 0.3),
              project(from, H + 0.2, A + 0.3),
            ]),
            kind: "fill",
            paint: solid(WET),
          },
          {
            alpha: 0.35 + 0.5 * Math.min(1, moment.flux),
            blend: "screen",
            d: pathOf(
              [project(from, H + 0.3, A + 0.3), project(to, H + 0.3, A + 0.3)],
              false
            ),
            kind: "stroke",
            paint: solid(SPARK),
            width: 0.5,
          },
        ]
      : [];
  return [
    ...rim,
    ...rivulets.flatMap((rivulet): Op[] => {
      if (rivulet.path.length < 2) {
        return [];
      }
      const live = rivulet.path.filter((bead) => bead.r > 0.08);
      const head = rivulet.path.at(-1);
      return [
        {
          alpha: 0.3,
          blend: "multiply",
          clip: face,
          d: film(rivulet.path, (bead) => bead.wet * 1.8),
          kind: "fill",
          paint: solid(WET),
        },
        ...(live.length > 1
          ? [
              {
                alpha: 0.3,
                blend: "multiply",
                clip: face,
                d: film(live, (bead) => bead.r * 1.4),
                kind: "fill",
                paint: solid(DAMP),
              } satisfies Op,
              {
                alpha: 0.85,
                blend: "screen",
                clip: face,
                d: film(live, (bead) => bead.r * 0.14, -0.35),
                kind: "fill",
                paint: solid(SPARK),
              } satisfies Op,
            ]
          : []),
        ...(head && rivulet.flux > 0.05 && rivulet.front < H
          ? beadOps({
              r: Math.max(0.7, head.r * 1.45),
              ...project(head.x, head.y, A + 0.6),
            })
          : []),
      ];
    }),
  ];
};

const submerged = (moment: Moment, pool: Pool): Op[] => {
  const level = Math.min(pool.level, H);
  return [
    ...poolOps(moment, pool, submergedOf(level), false),
    {
      alpha: 0.85,
      blend: "screen",
      d: pathOf(frontArc(level + MENISCUS, radiusAt(level) + 0.35), false),
      kind: "stroke",
      paint: solid(SPARK),
      width: 0.4,
    },
  ];
};

const glassOps = (
  moment: Moment,
  glass: NonNullable<Fill["glass"]>,
  pool: Pool | null
): Op[] => {
  const silhouette = glassBetween(FLOOR, GLASS_TOP);
  return [
    {
      clip: silhouette,
      kind: "lens",
      matrix: about(project(0, (FLOOR + GLASS_TOP) / 2, 0), 1.05, 1),
    },
    {
      clip: glassBetween(FLOOR, BASE),
      kind: "lens",
      matrix: about(project(0, (FLOOR + BASE) / 2, 0), 1.18, -0.8),
    },
    { kind: "sprite", name: "glassBack" },
    ...glassContents(moment, glass),
    ...streamOps(moment.stream, moment.clock),
    { kind: "sprite", name: "glassFront" },
    ...sheetOps(moment, glass),
    ...(pool === null ? [] : submerged(moment, pool)),
  ];
};

export const drawList = (moment: Moment): Op[] => {
  const { fill, spillage, bottle } = moment;
  const pool = poolOf(moment);
  return [
    ...(spillage === null ? [] : puddleOps(spillage)),
    { d: backing, kind: "fill", paint: solid(DAMP) },
    { kind: "sprite", name: "inside" },
    ...(pool === null ? [] : poolOps(moment, pool, pool.outline)),
    ...(pool === null || pool.domed ? [] : waterline(pool)),
    ...(fill.glass === null
      ? streamOps(moment.stream, moment.clock)
      : glassOps(moment, fill.glass, pool)),
    { kind: "sprite", name: "outside" },
    ...(pool?.domed === true ? lipOps(pool) : []),
    ...(spillage === null ? [] : spillOps(moment, spillage)),
    ...moment.drops.flatMap(beadOps),
    ...(bottle === null
      ? []
      : [
          { kind: "sprite", matrix: bottle.matrix, name: bottle.name } as const,
        ]),
  ];
};
