import { edgeOf, tiltAt, waveAt } from "./liquid";
import type { Bead, Impact, Run, Spillage, Stream, Wave } from "./liquid";
import { bottles } from "./pour";
import type { Bottle } from "./pour";
import {
  CREST,
  GLASS_REACH,
  GLASS_TOP,
  LIFT,
  alongSide,
  backBar,
  box,
  domeHeight,
  edgeLine,
  frontArc,
  glassBetween,
  glintOn,
  hull,
  onScreen,
  project,
  radiusAt,
  ring,
  scaleAt,
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
  clock: number;
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

export interface Droplet extends Vec {
  r: number;
  counter: boolean;
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
  drops: readonly Droplet[];
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
const LAMP = "#ffcf8a";
const BAR = "#ff9947";
const LANTERN = "#ff521f";
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
      { x: long * 0.55, y: long * 0.9 * stretch },
      [
        [0, LAMP, 0.36],
        [0.5, LAMP, 0.12],
        [1, LAMP, 0],
      ],
      { blend: "screen", clip }
    ),
    spot(
      centre,
      { x: long * 0.16, y: long * 0.62 * stretch },
      [
        [0, SHEEN, 0.8],
        [0.45, SHEEN, 0.26],
        [1, SHEEN, 0],
      ],
      { blend: "screen", clip }
    ),
  ];
};

const mirrored = (
  moment: Moment,
  level: number,
  x: number,
  y: number
): Point => {
  const at = glintOn(level, { x, y, z: backBar.wall });
  const tilt = tiltAt(moment.wave, at.x / B, at.z / B, B / 2.2, 0.3);
  return project(at.x + tilt.x * 18, level, at.z + tilt.z * 18);
};

const barOps = (
  moment: Moment,
  level: number,
  strength: number,
  clip: readonly Point[]
): Op[] => {
  const { shelf, bokeh, lantern, wall } = backBar;
  const from = project(-80, 2 * level - shelf + 160, wall);
  const to = project(-80, 2 * level - shelf - 140, wall);
  const ledge = project(-80, 2 * level - shelf, wall);
  const at = (ledge.y - from.y) / (to.y - from.y || 1);
  const scale =
    project(-79, 2 * level - shelf, wall).x -
    project(-80, 2 * level - shelf, wall).x;
  return [
    {
      blend: "screen",
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: {
        from,
        kind: "linear",
        stops: [
          [0, BAR, 0],
          [at * 0.5, BAR, 0.16 * strength],
          [at - 0.02, BAR, 0.22 * strength],
          [at, LAMP, 0.4 * strength],
          [at + 0.03, BAR, 0.3 * strength],
          [at + (1 - at) * 0.45, BAR, 0.1 * strength],
          [1, BAR, 0],
        ],
        to,
      },
    },
    ...backBar.bottles.map(([x, top, half]) =>
      spot(
        mirrored(moment, level, x, (shelf + top) / 2),
        { x: half * scale * 1.6, y: ((top - shelf) / 2) * scale },
        [
          [0, DUSK, 0.24 * strength],
          [0.6, DUSK, 0.12 * strength],
          [1, DUSK, 0],
        ],
        { blend: "multiply", clip }
      )
    ),
    ...bokeh.map(([x, y, r, glow]) =>
      spot(
        mirrored(moment, level, x, y),
        { x: r * scale, y: r * scale },
        [
          [0, BAR, 0.4 * glow * strength],
          [0.5, BAR, 0.16 * glow * strength],
          [1, BAR, 0],
        ],
        { blend: "screen", clip }
      )
    ),
    spot(
      mirrored(moment, level, lantern.x, lantern.y),
      { x: lantern.w * scale * 1.6, y: lantern.h * scale * 1.6 },
      [
        [0, LANTERN, 0.55 * strength],
        [0.4, LANTERN, 0.3 * strength],
        [1, LANTERN, 0],
      ],
      { blend: "screen", clip }
    ),
  ];
};

const RINGS = [0, 1 / 3, 2 / 3] as const;

const impactOf = (moment: Moment) => moment.stream?.impact ?? null;

const splashOps = (
  moment: Moment,
  impact: Impact,
  y: number,
  clip: readonly Point[]
): Op[] => {
  const { clock, rate } = moment;
  const { x } = impact;
  const q = Math.min(1.4, rate);
  const r = (1.2 + 2.6 * Math.sqrt(q)) * (1 + 0.1 * Math.sin(clock * 47));
  return [
    ...RINGS.flatMap((phase): Op[] => {
      const age = (clock * 1.3 + phase) % 1;
      const ripple = pathOf(
        Array.from({ length: 33 }, (_, i) => {
          const a = (i / 32) * TAU;
          const reach = 1.6 + age * 15;
          return project(x + Math.cos(a) * reach, y, Math.sin(a) * reach);
        })
      );
      const fade = (1 - age) ** 2 * Math.min(1, q);
      return [
        {
          alpha: 0.3 * fade,
          blend: "multiply",
          clip,
          d: ripple,
          kind: "stroke",
          paint: solid(WET),
          width: 0.9,
        },
        {
          alpha: 0.5 * fade,
          blend: "screen",
          clip,
          d: ripple,
          kind: "stroke",
          paint: solid(SHEEN),
          width: 0.3,
        },
      ];
    }),
    spot(
      project(x, y, 0),
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

const CREST_GLOW: Record<Side, number> = {
  back: 0.9,
  front: 0,
  left: 0.75,
  right: 0.45,
};

const domeEdge = (
  { height, swell }: Pool,
  strain: number,
  clip: readonly Point[]
) => {
  const reach = shoulderOf(strain);
  const sides: readonly Side[] = ["back", "left", "right", "front"];
  return sides.flatMap((side): Op[] => {
    const glow = alongSide(side, reach * CREST).map(([x, z]) =>
      glowAt({ x, y: height(x, z), z }, normalOf(height, x, z))
    );
    return [
      sheen(
        edgeLine(height, side, reach * CREST),
        glow.map((g) => 0.3 + 0.7 * g),
        CREST_GLOW[side] * swell * 0.7,
        0.55,
        clip
      ),
      {
        alpha: 0.25,
        blend: "multiply",
        clip,
        d: pathOf(edgeLine(height, side, 0.15), false),
        kind: "stroke",
        paint: solid(SOAK),
        width: 0.35,
      },
    ];
  });
};

const WET_RIM = 2.2;

const middleOf = (points: readonly Point[]) =>
  points[Math.floor(points.length / 2)] ?? { x: 0, y: 0 };

const wetRim = (sides: readonly Side[]): Op[] =>
  sides.map((side): Op => {
    const inner = alongSide(side).map(([x, z]) => project(x, H, z));
    const outer = alongSide(side, -WET_RIM).map(([x, z]) => project(x, H, z));
    return {
      blend: "multiply",
      d: pathOf(band(inner, outer)),
      kind: "fill",
      paint: {
        from: middleOf(inner),
        kind: "linear",
        stops: [
          [0, SOAK, 0.5],
          [0.45, WET, 0.3],
          [1, WET, 0],
        ],
        to: middleOf(outer),
      },
    };
  });

const liquidOf = (
  { fill, strain, wave, clock }: Moment,
  pool: Pool
): Liquid => ({
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
  clock,
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
  const impact = impactOf(moment);
  const body: Op[] = [
    { clip, kind: "lens", matrix: refraction(level) },
    {
      alpha: wet * (0.18 + 0.1 * deep),
      blend: "multiply",
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: solid(DAMP),
    },
    {
      alpha: 0.4 * deep,
      blend: "multiply",
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: solid(STRAW),
    },
    ...(domed
      ? []
      : [
          {
            alpha: 0.45,
            blend: "screen",
            clip,
            kind: "lens",
            matrix: mirrorAbout(project(-B, level, -B), project(B, level, -B)),
          } satisfies Op,
        ]),
    ...barOps(moment, level, wet, clip),
    ...highlight(
      level,
      clip,
      (at) => Math.abs(at.x) < B - 3 && Math.abs(at.z) < B - 3,
      moment,
      B,
      domed ? 34 : 26
    ),
    ...(domed ? domeEdge(pool, moment.strain, clip) : []),
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
  const fade = smooth(FLOOR, FLOOR + 4, level);
  const bead = (x: number, z: number) =>
    spot(
      project(x, level + MENISCUS, z),
      { x: 1.8, y: 0.75 },
      [
        [0, SPARK, 1],
        [0.45, SHEEN, 0.5],
        [1, SHEEN, 0],
      ],
      { alpha: fade, blend: "screen" }
    );
  return [
    ...(["back", "left"] as const).flatMap((side): Op[] => [
      {
        alpha: 0.3 * fade,
        blend: "multiply",
        d: pathOf(edgeLine(height, side, 1.1), false),
        kind: "stroke",
        paint: solid(SOAK),
        width: 0.7,
      },
      {
        alpha: 0.4 * fade,
        blend: "screen",
        d: pathOf(edgeLine(climbed, side), false),
        kind: "stroke",
        paint: solid(SHEEN),
        width: 1.1,
      },
      {
        alpha: 0.95 * fade,
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

const inner = (y: number) => radiusAt(y) - tumbler.wall;

const GLASS_RIPPLE = 0.6;
const ARCS = 24;

const glassLiquid = (
  { wave, clock }: Moment,
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
        clock,
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
        clock,
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
      paint: solid(STRAW),
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
        [0, STRAW, 0.35],
        [0.5, STRAW, 0.7],
        [1, STRAW, 0.35],
      ]),
    },
    {
      alpha: 0.14,
      clip,
      d: pathOf(clip),
      kind: "fill",
      paint: solid(STRAW),
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
      paint: solid(STRAW),
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

const ribbon = (thread: readonly Bead[], from: number, to: number) => {
  const near: Point[] = [];
  const far: Point[] = [];
  for (const [index, bead] of thread.entries()) {
    const before = thread[Math.max(0, index - 1)] ?? bead;
    const after = thread[Math.min(thread.length - 1, index + 1)] ?? bead;
    const size = Math.hypot(after.x - before.x, after.y - before.y) || 1;
    const nx = (-(after.y - before.y) / size) * bead.r;
    const ny = ((after.x - before.x) / size) * bead.r;
    near.push({ x: bead.x + nx * from, y: bead.y + ny * from });
    far.push({ x: bead.x + nx * to, y: bead.y + ny * to });
  }
  return pathOf(band(near, far));
};

const dropOps = (drops: readonly Droplet[], counter: boolean) =>
  drops.flatMap((drop) =>
    drop.counter === counter
      ? beadOps({
          ...project(drop.x, drop.y, drop.z),
          r: drop.r * scaleAt(drop.x, drop.y, drop.z),
        })
      : []
  );

export const streamOps = (world: Stream | null, clock: number): Op[] => {
  if (world === null) {
    return [];
  }
  const stream = onScreen(world);
  return [
    ...stream.threads.flatMap((thread): Op[] => {
      const from = thread[0] ?? { x: 0, y: 0 };
      const to = thread.at(-1) ?? { x: 0, y: 1 };
      const along = (stops: readonly Stop[]): Paint => ({
        from,
        kind: "linear",
        stops,
        to,
      });
      const glints = Array.from({ length: BEADS + 1 }, (_, i): Stop => {
        const at = i / BEADS;
        const swell = 0.5 + 0.5 * Math.sin((at * at * 5.5 - clock * 3.1) * TAU);
        return [at, SPARK, (0.35 + 0.65 * swell) * (1 - 0.25 * at)];
      });
      return [
        {
          alpha: 0.3,
          blend: "multiply",
          d: ribbon(thread, -1, 1),
          kind: "fill",
          paint: solid(DAMP),
        },
        {
          blend: "screen",
          d: ribbon(thread, -1, 1),
          kind: "fill",
          paint: along([
            [0, STRAW, 0.5],
            [0.6, STRAW, 0.32],
            [1, STRAW, 0.24],
          ]),
        },
        ...(
          [
            [-1, -0.55],
            [0.6, 1],
          ] as const
        ).map(([edge, rim]): Op => ({
          alpha: 0.6,
          blend: "multiply",
          d: ribbon(thread, edge, rim),
          kind: "fill",
          paint: solid(WET),
        })),
        {
          blend: "screen",
          d: ribbon(thread, -0.5, -0.16),
          kind: "fill",
          paint: along(glints),
        },
        {
          alpha: 0.45,
          blend: "screen",
          d: ribbon(thread, 0.3, 0.48),
          kind: "fill",
          paint: solid(SHEEN),
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
      paint: solid(STRAW),
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
    ...dropOps(moment.drops, false),
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
    ...(pool?.domed === true ? wetRim(["back", "left"]) : []),
    ...(pool === null ? [] : poolOps(moment, pool, pool.outline)),
    ...(pool === null || pool.domed ? [] : waterline(pool)),
    ...(fill.glass === null
      ? streamOps(moment.stream, moment.clock)
      : glassOps(moment, fill.glass, pool)),
    ...(fill.glass === null ? dropOps(moment.drops, false) : []),
    { kind: "sprite", name: "outside" },
    ...(pool?.domed === true ? wetRim(["front", "right"]) : []),
    ...(spillage === null ? [] : spillOps(moment, spillage)),
    ...dropOps(moment.drops, true),
    ...(bottle === null
      ? []
      : [
          { kind: "sprite", matrix: bottle.matrix, name: bottle.name } as const,
        ]),
  ];
};
