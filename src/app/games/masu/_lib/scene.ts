import { edgeOf } from "./liquid";
import type { Bead, Jet, Stream } from "./liquid";
import { bottles, domeOf, flowAt, mlOf, rateAt, volumeAt } from "./pour";
import type { Bottle, Cup, Pour } from "./pour";

export interface Point {
  x: number;
  y: number;
}

export interface Vec {
  x: number;
  y: number;
  z: number;
}

export const box = { floor: 6, height: 50, inner: 36.5, outer: 44 } as const;

export const tumbler = {
  base: 14,
  bottom: 19,
  height: 86,
  top: 29,
  wall: 1.8,
} as const;

export const GLASS_TOP = box.floor + tumbler.height;
const GLASS_SHARE = 0.6;
const GLASS_SWELL = 0.03;
const GLASS_RISE = 4;
export const LIFT = 0.6;
const PITCH = 0.68;
const YAW = 0.3;
const DISTANCE = 400;
const MIDDLE = 34;

export const camera: Vec = {
  x: DISTANCE * Math.cos(PITCH) * Math.sin(YAW),
  y: MIDDLE + DISTANCE * Math.sin(PITCH),
  z: DISTANCE * Math.cos(PITCH) * Math.cos(YAW),
};

export const basis = {
  back: {
    x: Math.cos(PITCH) * Math.sin(YAW),
    y: Math.sin(PITCH),
    z: Math.cos(PITCH) * Math.cos(YAW),
  },
  distance: DISTANCE,
  middle: MIDDLE,
  right: { x: Math.cos(YAW), y: 0, z: -Math.sin(YAW) },
  up: {
    x: -Math.sin(PITCH) * Math.sin(YAW),
    y: Math.cos(PITCH),
    z: -Math.sin(PITCH) * Math.cos(YAW),
  },
} as const;

export const lamps = {
  back: { x: -90, y: 330, z: -400 },
  key: { x: -170, y: 300, z: 150 },
} as const;

export const backBar = {
  bokeh: [
    [-150, 226, 10, 1.3],
    [-96, 292, 8, 0.8],
    [-58, 214, 12, 1.1],
    [-130, 268, 7, 0.9],
    [-30, 300, 9, 0.7],
  ],
  bottles: [
    [-194, 312, 6.2],
    [-158, 334, 5.4],
    [-124, 300, 6.8],
    [-90, 322, 5.8],
    [-57, 340, 6.4],
    [-24, 306, 5.2],
    [10, 328, 6.6],
  ],
  lantern: { h: 26, w: 20, x: -12, y: 262 },
  shelf: 212,
  wall: -260,
} as const;

export const unit = (v: Vec): Vec => {
  const size = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / size, y: v.y / size, z: v.z / size };
};

export const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;

export const heading = (from: Vec, to: Vec) =>
  unit({ x: to.x - from.x, y: to.y - from.y, z: to.z - from.z });

export const shine = (at: Vec, normal: Vec, sharpness = 60) => {
  const n = unit(normal);
  const view = heading(at, camera);
  const facing = Math.max(0, dot(n, view));
  let lit = 0.04 + 0.96 * (1 - facing) ** 5;
  for (const lamp of [lamps.key, lamps.back]) {
    const light = heading(at, lamp);
    const half = unit({
      x: light.x + view.x,
      y: light.y + view.y,
      z: light.z + view.z,
    });
    lit += Math.max(0, dot(n, half)) ** sharpness;
  }
  return Math.min(1, lit);
};

export const glintOn = (y: number, lamp: Vec = lamps.back): Vec => {
  const t = (camera.y - y) / (camera.y - (2 * y - lamp.y));
  return {
    x: camera.x + (lamp.x - camera.x) * t,
    y,
    z: camera.z + (lamp.z - camera.z) * t,
  };
};

export const project = (x: number, y: number, z: number): Point => {
  const across = x * Math.cos(YAW) - z * Math.sin(YAW);
  const toward = x * Math.sin(YAW) + z * Math.cos(YAW);
  const height = y - MIDDLE;
  const up = height * Math.cos(PITCH) - toward * Math.sin(PITCH);
  const depth = height * Math.sin(PITCH) + toward * Math.cos(PITCH);
  const scale = DISTANCE / (DISTANCE - depth);
  return { x: across * scale, y: -up * scale };
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
  const spare = GLASS_SHARE + GLASS_SWELL;
  return {
    dome,
    glass: {
      dome: clamp((volume - GLASS_SHARE) / GLASS_SWELL) * GLASS_RISE,
      level: bottom + (GLASS_TOP - bottom) * clamp(volume / GLASS_SHARE),
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
    drop: 34,
    tip: 1.8,
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
    drop: 22,
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
    drop: 26,
    tip: 1.8,
    lean: 0.26,
    content: 540,
    spout: { x: 0, y: -1 },
  },
};

export const vesselScale = 0.6;

const RETURN = 0.45;
const JUDDER = 0.035;
export const AWAY = 0.5;

const ease = (t: number) => 1 - (1 - clamp(t)) ** 3;

const tiltAt = (pour: Pour, hold: number, t: number) => {
  const tipped = ease(Math.min(t, hold) / pour.lag);
  return t <= hold ? tipped : tipped * (1 - ease((t - hold) / RETURN));
};

export const awayAt = (pour: Pour, hold: number, t: number) => {
  const p = clamp((t - hold - pour.trickle) / AWAY);
  return p * p * (3 - 2 * p);
};

const emptiedAt = (pour: Pour, hold: number, t: number) =>
  Math.min(
    1,
    mlOf(pour, volumeAt(pour, hold, t)) / vessels[pour.bottle].content
  );

const FILLED = 0.86;

export const leftIn = (pour: Pour, hold: number, t: number) =>
  FILLED * (1 - emptiedAt(pour, hold, t));

export const angleAt = (pour: Pour, hold: number, t: number) => {
  const vessel = vessels[pour.bottle];
  const tilt = tiltAt(pour, hold, t);
  const emptied = emptiedAt(pour, hold, t);
  const glug = t <= hold ? rateAt(pour, t) / pour.flow - 1 : 0;
  return (
    vessel.rest +
    (vessel.tip - vessel.rest + vessel.lean * emptied) * tilt +
    JUDDER * glug * tilt
  );
};

const spoutAt = (bottle: Bottle, angle: number): Point => {
  const { spout } = vessels[bottle];
  const x = spout.x * Math.cos(angle) - spout.y * Math.sin(angle);
  const y = spout.x * Math.sin(angle) + spout.y * Math.cos(angle);
  const size = Math.hypot(x, y) || 1;
  return { x: -x / size, y: y / size };
};

const POUR_X = 18;

export const rimOf = (cup: Cup) => (cup === "masu" ? box.height : GLASS_TOP);

const lipAt = (pour: Pick<Pour, "bottle" | "cup">): Vec => ({
  x: POUR_X,
  y: rimOf(pour.cup) + vessels[pour.bottle].drop,
  z: 0,
});

export const lipOf = (pour: Pick<Pour, "bottle" | "cup">) => {
  const lip = lipAt(pour);
  return project(lip.x, lip.y, lip.z);
};

export const poseOf = (angle: number, size: number) => {
  const s = vesselScale * size;
  return {
    a: -s * Math.cos(angle),
    b: s * Math.sin(angle),
    c: s * Math.sin(angle),
    d: s * Math.cos(angle),
  };
};

export interface View {
  cx: number;
  cy: number;
  scale: number;
}

export interface Layout extends View {
  w: number;
  h: number;
  size: Record<Bottle, number>;
  near: View;
}

export const keepOut = {
  idle: { height: 121, width: 125 },
  playing: { height: 68, width: 68 },
} as const;

type KeepOut = (typeof keepOut)[keyof typeof keepOut];
const LOWEST = 0.6;
export const IDLE_TEXT = 330;
export const GAP = 14;
const HEADER = 96;
const SMALL = 1.1;
const FULL = 0.9;
const SMALLEST = 50;
const ZOOM = 1.4;
const NEAR_WIDTH = 0.86;
const NEAR_HEIGHT = 0.5;
const NEAR_FOOT = 0.9;
const NEAREST = 1.05;
const SWEEP = 24;
const MOST_POURED = 300;
const DEMO_SAMPLES = 200;

const insidePolygon = (polygon: readonly Point[], at: Point) => {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const p = polygon[i] ?? at;
    const q = polygon[j] ?? at;
    if (
      p.y > at.y !== q.y > at.y &&
      at.x < ((q.x - p.x) * (at.y - p.y)) / (q.y - p.y) + p.x
    ) {
      inside = !inside;
    }
  }
  return inside;
};

const crossesBox = (p: Point, q: Point, from: Point, to: Point) => {
  let low = 0;
  let high = 1;
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  for (const [step, gap] of [
    [-dx, p.x - from.x],
    [dx, to.x - p.x],
    [-dy, p.y - from.y],
    [dy, to.y - p.y],
  ] as const) {
    if (step === 0) {
      if (gap < 0) {
        return false;
      }
    } else if (step < 0) {
      low = Math.max(low, gap / step);
    } else {
      high = Math.min(high, gap / step);
    }
  }
  return low <= high;
};

export const outlineAt = (
  bottle: Bottle,
  angle: number,
  size: number,
  anchor: Point
): Point[] => {
  const vessel = vessels[bottle];
  const { a, b, c, d } = poseOf(angle, size);
  return vessel.outline.map(([x, y]) => {
    const u = x - vessel.lip.x;
    const v = y - vessel.lip.y;
    return { x: anchor.x + a * u + c * v, y: anchor.y + b * u + d * v };
  });
};

export const sweepOf = (bottle: Bottle) => {
  const { rest, tip, lean, content } = vessels[bottle];
  const most = tip + lean * Math.min(1, MOST_POURED / content) + JUDDER;
  return Array.from(
    { length: SWEEP + 1 },
    (_, i) => rest + ((most - rest) * i) / SWEEP
  );
};

const clearOf = (
  bottle: Bottle,
  size: number,
  at: View & { w: number },
  zone: KeepOut,
  angles: readonly number[]
) => {
  const from = { x: at.w - zone.width, y: 0 };
  const to = { x: at.w, y: zone.height };
  const lip = lipOf({ bottle, cup: "mokkiri" });
  const anchor = { x: at.cx + lip.x * at.scale, y: at.cy + lip.y * at.scale };
  return angles.every((angle) => {
    const outline = outlineAt(bottle, angle, size * at.scale, anchor);
    return (
      !insidePolygon(outline, { x: at.w - 1, y: 1 }) &&
      outline.every(
        (p, i) => !crossesBox(p, outline[i + 1] ?? outline[0] ?? p, from, to)
      )
    );
  });
};

export interface Demo {
  pour: Pour;
  hold: number;
}

export const demoSweepOf = ({ pour, hold }: Demo) =>
  Array.from({ length: DEMO_SAMPLES + 1 }, (_, i) =>
    angleAt(pour, hold, ((hold + pour.trickle) * i) / DEMO_SAMPLES)
  );

const TAU = Math.PI * 2;
const A = box.outer;
const B = box.inner;
const H = box.height;

export const ring = (
  y: number,
  r: number,
  from = 0,
  to = TAU,
  steps = 48
): Point[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const a = from + ((to - from) * i) / steps;
    return project(Math.cos(a) * r, y, Math.sin(a) * r);
  });

const corners = [-1, 1].flatMap((x) =>
  [-1, 1].flatMap((z) => [project(x * A, 0, z * A), project(x * A, H, z * A)])
);

export const extent = (() => {
  const all = [...corners, ...ring(GLASS_TOP, tumbler.top, 0, TAU, 16)];
  const xs = all.map((p) => p.x);
  const ys = all.map((p) => p.y);
  return {
    bottom: Math.max(...ys),
    top: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
  };
})();

export interface Reserved {
  top: number;
  left: number;
  right: number;
}

const lipTop = Math.min(
  ...bottles.map((bottle) => lipOf({ bottle, cup: "mokkiri" }).y)
);

export const reservedOf = (w: number, h: number): Reserved => ({
  left: 0,
  right: w,
  top: h - IDLE_TEXT,
});

const nearOf = (layout: Omit<Layout, "near">): View => {
  const { w, h, size } = layout;
  const fits = (view: View) =>
    view.cy + lipTop * view.scale >= HEADER &&
    bottles.every((bottle) =>
      clearOf(
        bottle,
        size[bottle],
        { ...view, w },
        keepOut.playing,
        sweepOf(bottle)
      )
    );
  for (
    let scale = Math.min(
      layout.scale * ZOOM,
      (w * NEAR_WIDTH) / extent.width,
      (h * NEAR_HEIGHT) / (extent.bottom - extent.top)
    );
    scale > layout.scale * NEAREST;
    scale *= 0.97
  ) {
    const view = {
      cx: w / 2,
      cy: h * NEAR_FOOT - extent.bottom * scale,
      scale,
    };
    if (fits(view)) {
      return view;
    }
  }
  return { cx: layout.cx, cy: layout.cy, scale: layout.scale };
};

export const layoutOf = (
  w: number,
  h: number,
  demo: Demo,
  reserved = reservedOf(w, h)
): Layout => {
  const shown = demoSweepOf(demo);
  const placed = (scale: number) => {
    const half = (extent.width / 2) * scale;
    const beside =
      reserved.right < w / 2 - half || reserved.left > w / 2 + half;
    const floor = (beside ? h : reserved.top) - GAP;
    const at = {
      cx: w / 2,
      cy: Math.min(h * LOWEST, floor - extent.bottom * scale),
      scale,
      w,
    };
    const fits = (bottle: Bottle) => {
      for (let size = 100; size > SMALLEST; size -= 2) {
        if (
          clearOf(bottle, size / 100, at, keepOut.playing, sweepOf(bottle)) &&
          (bottle !== demo.pour.bottle ||
            clearOf(bottle, size / 100, at, keepOut.idle, shown))
        ) {
          return size / 100;
        }
      }
      return SMALLEST / 100;
    };
    return {
      ...at,
      h,
      size: {
        isshobin: fits("isshobin"),
        katakuchi: fits("katakuchi"),
        tokkuri: fits("tokkuri"),
      },
    };
  };
  const cramped = (layout: Omit<Layout, "near">) =>
    layout.cy + lipTop * layout.scale < HEADER ||
    Object.values(layout.size).some((size) => size < FULL);
  let scale = Math.min(
    (w * 0.62) / extent.width,
    (h * 0.42) / (extent.bottom - extent.top)
  );
  let layout = placed(scale);
  while (scale > SMALL && cramped(layout)) {
    scale = Math.max(SMALL, scale * 0.97);
    layout = placed(scale);
  }
  return { ...layout, near: nearOf(layout) };
};

export const toward = Math.atan2(camera.z, camera.x);

export const frontArc = (y: number, r: number, steps = 32) =>
  ring(y, r, toward + Math.PI / 2, toward - Math.PI / 2, steps);

export const radiusAt = (y: number) =>
  tumbler.bottom +
  ((tumbler.top - tumbler.bottom) * (y - box.floor)) / tumbler.height;

const cross = (o: Point, a: Point, b: Point) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

const halfHull = (points: readonly Point[]) => {
  const kept: Point[] = [];
  for (const point of points) {
    let [o, a] = kept.slice(-2);
    while (o !== undefined && a !== undefined && cross(o, a, point) <= 0) {
      kept.pop();
      [o, a] = kept.slice(-2);
    }
    kept.push(point);
  }
  return kept.slice(0, -1);
};

export const hull = (points: readonly Point[]) => {
  const sorted = points.toSorted((p, q) => p.x - q.x || p.y - q.y);
  return [...halfHull(sorted), ...halfHull(sorted.toReversed())];
};

export const glassBetween = (from: number, to: number, inset = 0) =>
  hull([
    ...ring(from, radiusAt(from) - inset, 0, TAU, 40),
    ...ring(to, radiusAt(to) - inset, 0, TAU, 40),
  ]);

export const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const REACH = 2.6;
const SAMPLES = 32;

export const CREST = 0.62;

export const shoulderOf = (strain: number) => REACH * (1 - 0.4 * strain);

export const domeHeight = (
  lift: number,
  strain: number,
  x: number,
  z: number,
  wave = 0
) => {
  const reach = shoulderOf(strain);
  const pinned =
    edgeOf(B - Math.abs(x), reach) * edgeOf(B - Math.abs(z), reach);
  return (lift * LIFT + wave) * pinned;
};

export type Surface = (x: number, z: number) => number;

const steps = Array.from(
  { length: SAMPLES + 1 },
  (_, i) => -B + (2 * B * i) / SAMPLES
);

export const surfaceOutline = (height: Surface) => {
  const at = (x: number, z: number) => project(x, height(x, z), z);
  const back = steps.toReversed().map((x) => {
    let top = at(x, -B);
    for (const z of steps) {
      const point = at(x, z);
      if (point.y < top.y) {
        top = point;
      }
    }
    return top;
  });
  return [
    ...steps.map((x) => at(x, B)),
    ...steps.toReversed().map((z) => at(B, z)),
    ...back,
    ...steps.map((z) => at(-B, z)),
  ];
};

export type Side = "back" | "left" | "front" | "right";

const sides: Record<Side, (t: number, inset: number) => [number, number]> = {
  back: (t, inset) => [t, -B + inset],
  front: (t, inset) => [t, B - inset],
  left: (t, inset) => [-B + inset, t],
  right: (t, inset) => [B - inset, t],
};

export const alongSide = (side: Side, inset = 0) =>
  steps.map((t) => sides[side](t, inset));

export const edgeLine = (height: Surface, side: Side, inset = 0) =>
  alongSide(side, inset).map(([x, z]) => project(x, height(x, z), z));

const LIP_SPEED = 130;
const LIP_GAIN = 60;
const HEAD = 0.3;

const planeOf = (screen: Point, at: Vec): Point => {
  const origin = project(at.x, at.y, at.z);
  const across = project(at.x + 1, at.y, at.z);
  const rise = project(at.x, at.y + 1, at.z);
  const ax = across.x - origin.x;
  const ay = across.y - origin.y;
  const bx = rise.x - origin.x;
  const by = rise.y - origin.y;
  const det = ax * by - bx * ay || 1;
  const x = (screen.x * by - bx * screen.y) / det;
  const up = (ax * screen.y - screen.x * ay) / det;
  const size = Math.hypot(x, up) || 1;
  return { x: x / size, y: -up / size };
};

export const jetAt = (
  pour: Pick<Pour, "bottle" | "cup" | "flow">,
  angle: number,
  rate: number,
  volume: number
): Jet => {
  const lip = lipAt(pour);
  const { rest, tip } = vessels[pour.bottle];
  const direction = planeOf(spoutAt(pour.bottle, angle), lip);
  const head = HEAD + (1 - HEAD) * clamp((angle - rest) / (tip - rest));
  const speed = (LIP_SPEED + LIP_GAIN * Math.min(1.6, rate / pour.flow)) * head;
  return {
    rate,
    volume,
    vx: direction.x * speed,
    vy: direction.y * speed,
    x: lip.x,
    y: -lip.y,
  };
};

export const jetOf =
  (pour: Pour, hold: number) =>
  (at: number): Jet =>
    jetAt(
      pour,
      angleAt(pour, hold, at),
      flowAt(pour, hold, at),
      mlOf(pour, volumeAt(pour, hold, at))
    );

export const GLASS_REACH = 4.5;

export const landingOf = (fill: Fill, strain: number) => {
  const { glass } = fill;
  return (x: number) => {
    if (glass !== null) {
      const y = Math.min(
        GLASS_TOP,
        Math.max(glass.level, box.floor + tumbler.base)
      );
      if (Math.abs(x) < radiusAt(y) - tumbler.wall) {
        return -(
          y +
          glass.dome * edgeOf(tumbler.top - Math.abs(x), GLASS_REACH)
        );
      }
    }
    return -(fill.dome > 0
      ? H + domeHeight(fill.dome, strain, x, 0)
      : Math.max(fill.level, box.floor));
  };
};

export const scaleAt = (x: number, y: number, z: number) =>
  DISTANCE /
  (DISTANCE -
    ((y - MIDDLE) * Math.sin(PITCH) +
      (x * Math.sin(YAW) + z * Math.cos(YAW)) * Math.cos(PITCH)));

const shown = <T extends Bead>(bead: T): T => ({
  ...bead,
  ...project(bead.x, -bead.y, 0),
  r: bead.r * scaleAt(bead.x, -bead.y, 0),
});

export const onScreen = (stream: Stream): Stream => ({
  beads: stream.beads.map(shown),
  impact:
    stream.impact === null
      ? null
      : { ...stream.impact, ...project(stream.impact.x, -stream.impact.y, 0) },
  threads: stream.threads.map((thread) => thread.map(shown)),
});
