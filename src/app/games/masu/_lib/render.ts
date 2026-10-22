import { dataUri, docOf, room, spriteDoc, sprites } from "./art";
import { drawList, pathOf, spriteNames } from "./draw";
import type { Bubble, Matrix, Moment, Op, Paint, Sprite } from "./draw";
import { createWave, pushWave, spillageOf, stepWave, streamOf } from "./liquid";
import type { Bead, Stream } from "./liquid";
import { capacity, domeOf, flowAt, insideAt, mlOf, overflowAt } from "./pour";
import type { Pour } from "./pour";
import { createSake } from "./sake";
import type { Backing, Sake } from "./sake";
import {
  angleAt,
  awayAt,
  box,
  reservedOf,
  fillOf,
  jetOf,
  lamps,
  landingOf,
  layoutOf,
  lipOf,
  poseOf,
  project,
  radiusAt,
  seeded,
  tumbler,
  worldX,
} from "./scene";
import type { Demo, Layout, Point, Reserved } from "./scene";

export interface Frame {
  pour: Pour;
  hold: number;
  spilledAt: number | null;
  t: number;
  raise: number;
  clock: number;
  dt: number;
}

interface Drop extends Bead {
  vx: number;
  vy: number;
  age: number;
  counter: boolean;
}

interface Mote {
  x: number;
  y: number;
  size: number;
  drift: number;
  phase: number;
  near: boolean;
}

interface Particle extends Bubble {
  vx: number;
  vz: number;
  age: number;
  life: number;
}

const TAU = Math.PI * 2;
const GRAVITY = 9810;
const H = box.height;
const A = box.outer;
const B = box.inner;
const BASE = box.floor + tumbler.base;
const WIDE = 720;
const RESULT = 0.32;
const SHEET_FLOW = 40;
const PUSH = 5;
const QUIVER = 160;
const SPLASH = 26;
const BUBBLES = 14;
const SPRAY = 30;
const SETTLED = 60;
const COUNTER_Z = A + 12;
const still = createWave(2);
const MOTES = 42;
const MOTE = "#ffe4b8";
const BEAM_FROM = project(lamps.key.x, lamps.key.y, lamps.key.z);
const BEAM_TO = project(0, H * 0.5, 0);

const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = [1, 3, 5].map((at) =>
    Number.parseInt(hex.slice(at, at + 2), 16)
  );
  return `rgb(${r} ${g} ${b} / ${alpha.toFixed(3)})`;
};

const paintOf = (ctx: CanvasRenderingContext2D, paint: Paint) => {
  if (paint.kind === "solid") {
    return paint.colour;
  }
  const gradient =
    paint.kind === "linear"
      ? ctx.createLinearGradient(
          paint.from.x,
          paint.from.y,
          paint.to.x,
          paint.to.y
        )
      : ctx.createRadialGradient(0, 0, 0, 0, 0, paint.r);
  for (const [at, colour, alpha] of paint.stops) {
    gradient.addColorStop(Math.min(1, Math.max(0, at)), rgba(colour, alpha));
  }
  return gradient;
};

const rasterize = async (svg: string, width: number, height: number) => {
  try {
    const image = new Image();
    image.src = dataUri(svg);
    await image.decode();
    const bitmap = document.createElement("canvas");
    bitmap.width = Math.max(1, Math.round(width));
    bitmap.height = Math.max(1, Math.round(height));
    bitmap
      .getContext("2d")
      ?.drawImage(image, 0, 0, bitmap.width, bitmap.height);
    return bitmap;
  } catch {
    return null;
  }
};

const createAtlas = () => {
  const bitmaps = new Map<Sprite, HTMLCanvasElement>();
  let scale = 0;
  let backdrop: HTMLCanvasElement | null = null;
  let wanted = "";
  const load = async (name: Sprite, at: number) => {
    const art = sprites[name];
    const target = at * art.scale;
    const bitmap = await rasterize(
      spriteDoc(art, target),
      art.box.w * target,
      art.box.h * target
    );
    if (bitmap !== null && scale === at) {
      bitmaps.set(name, bitmap);
    }
  };
  const light = async (layout: Layout, dpr: number, key: string) => {
    const frame = { cx: layout.cx, cy: layout.cy, scale: layout.scale };
    const image = await rasterize(
      docOf(
        { h: layout.h, w: layout.w, x: 0, y: 0 },
        layout.w * dpr,
        layout.h * dpr,
        room(layout.w, layout.h, frame)
      ),
      layout.w * dpr,
      layout.h * dpr
    );
    if (image !== null && wanted === key) {
      backdrop = image;
    }
  };
  return {
    backdrop: () => backdrop,
    get: (name: Sprite) => bitmaps.get(name) ?? null,
    prepare: (layout: Layout, dpr: number) => {
      const target = layout.scale * dpr;
      if (scale === 0 || Math.abs(target / scale - 1) > 0.04) {
        scale = target;
        for (const name of spriteNames) {
          void load(name, target);
        }
      }
      const key = [layout.w, layout.h, layout.cx, layout.cy, layout.scale, dpr]
        .map((value) => value.toFixed(2))
        .join(":");
      if (key !== wanted) {
        wanted = key;
        void light(layout, dpr, key);
      }
    },
  };
};

type Atlas = ReturnType<typeof createAtlas>;

const inverse = ({ a, b, c, d, e, f }: Matrix): Matrix => {
  const det = a * d - b * c || 1;
  return {
    a: d / det,
    b: -b / det,
    c: -c / det,
    d: a / det,
    e: (c * f - d * e) / det,
    f: (b * e - a * f) / det,
  };
};

const apply = ({ a, b, c, d, e, f }: Matrix, p: Point): Point => ({
  x: a * p.x + c * p.y + e,
  y: b * p.x + d * p.y + f,
});

const boundsOf = (points: readonly Point[]) => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  return {
    x0: Math.min(...xs),
    x1: Math.max(...xs),
    y0: Math.min(...ys),
    y1: Math.max(...ys),
  };
};

const traced = (d: string) => new Path2D(d);

const createPainter = (canvas: HTMLCanvasElement, atlas: Atlas, sake: Sake) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  const scratch = document.createElement("canvas");
  const copy = scratch.getContext("2d");
  const paths = new WeakMap<readonly Point[], Path2D>();
  const clipOf = (points: readonly Point[]) => {
    const known = paths.get(points);
    if (known) {
      return known;
    }
    const path = new Path2D(pathOf(points));
    paths.set(points, path);
    return path;
  };

  const lens = (op: Extract<Op, { kind: "lens" }>, scene: Matrix) => {
    if (!copy) {
      return;
    }
    const area = boundsOf(op.clip);
    const back = inverse(op.matrix);
    const source = boundsOf(
      [
        { x: area.x0, y: area.y0 },
        { x: area.x1, y: area.y0 },
        { x: area.x1, y: area.y1 },
        { x: area.x0, y: area.y1 },
      ].map((p) => apply(scene, apply(back, p)))
    );
    const x0 = Math.max(0, Math.floor(source.x0) - 1);
    const y0 = Math.max(0, Math.floor(source.y0) - 1);
    const x1 = Math.min(canvas.width, Math.ceil(source.x1) + 1);
    const y1 = Math.min(canvas.height, Math.ceil(source.y1) + 1);
    if (x1 <= x0 || y1 <= y0) {
      return;
    }
    if (scratch.width < x1 - x0 || scratch.height < y1 - y0) {
      scratch.width = Math.max(scratch.width, x1 - x0);
      scratch.height = Math.max(scratch.height, y1 - y0);
    }
    copy.clearRect(0, 0, x1 - x0, y1 - y0);
    copy.drawImage(canvas, x0, y0, x1 - x0, y1 - y0, 0, 0, x1 - x0, y1 - y0);
    const unscale = inverse(scene);
    const from = apply(unscale, { x: x0, y: y0 });
    const to = apply(unscale, { x: x1, y: y1 });
    ctx.transform(
      op.matrix.a,
      op.matrix.b,
      op.matrix.c,
      op.matrix.d,
      op.matrix.e,
      op.matrix.f
    );
    ctx.drawImage(
      scratch,
      0,
      0,
      x1 - x0,
      y1 - y0,
      from.x,
      from.y,
      to.x - from.x,
      to.y - from.y
    );
  };

  const sprite = (op: Extract<Op, { kind: "sprite" }>) => {
    const bitmap = atlas.get(op.name);
    if (bitmap === null) {
      return;
    }
    if (op.matrix) {
      ctx.transform(
        op.matrix.a,
        op.matrix.b,
        op.matrix.c,
        op.matrix.d,
        op.matrix.e,
        op.matrix.f
      );
    }
    const { box: area } = sprites[op.name];
    ctx.drawImage(bitmap, area.x, area.y, area.w, area.h);
  };

  let backed: Backing | null = null;
  const backing = () => {
    const bitmap = atlas.get("inside");
    if (bitmap === null) {
      return null;
    }
    if (backed?.bitmap !== bitmap) {
      backed = { bitmap, ...sprites.inside.box };
    }
    return backed;
  };

  const paint = (ops: readonly Op[], scene: Matrix) => {
    for (const op of ops) {
      if (op.kind === "sake") {
        if (!sake.draw(ctx, op.liquid, scene, backing())) {
          paint(op.ops, scene);
        }
        continue;
      }
      ctx.save();
      ctx.setTransform(scene.a, scene.b, scene.c, scene.d, scene.e, scene.f);
      if (op.clip) {
        ctx.clip(clipOf(op.clip));
      }
      ctx.globalAlpha = op.alpha ?? 1;
      ctx.globalCompositeOperation = op.blend ?? "source-over";
      if (op.kind === "fill") {
        if (op.matrix) {
          const { a, b, c, d, e, f } = op.matrix;
          ctx.transform(a, b, c, d, e, f);
        }
        ctx.fillStyle = paintOf(ctx, op.paint);
        ctx.fill(traced(op.d));
      } else if (op.kind === "stroke") {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = op.width;
        ctx.strokeStyle = paintOf(ctx, op.paint);
        ctx.stroke(traced(op.d));
      } else if (op.kind === "sprite") {
        sprite(op);
      } else {
        lens(op, scene);
      }
      ctx.restore();
    }
  };

  return paint;
};

const createAir = (canvas: HTMLCanvasElement, calm: boolean) => {
  const ctx = canvas.getContext("2d");
  const roll = seeded(1205);
  const motes: Mote[] = Array.from({ length: MOTES }, (_, i) => ({
    drift: 0.004 + roll() * 0.01,
    near: i % 6 === 0,
    phase: roll() * TAU,
    size: 0.6 + roll() * 1,
    x: roll(),
    y: roll(),
  }));
  return (layout: Layout, dpr: number, clock: number, rise: number) => {
    if (ctx === null) {
      return;
    }
    const t = calm ? 0 : clock;
    const lx = (layout.cx + BEAM_FROM.x * layout.scale) * dpr;
    const ly = (layout.cy - rise + BEAM_FROM.y * layout.scale) * dpr;
    const ax = (BEAM_TO.x - BEAM_FROM.x) * layout.scale * dpr;
    const ay = (BEAM_TO.y - BEAM_FROM.y) * layout.scale * dpr;
    const span = Math.hypot(ax, ay) || 1;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = MOTE;
    for (const mote of motes) {
      const x = ((mote.x + t * mote.drift) % 1) * canvas.width;
      const lift =
        (t * mote.drift * 0.45 + Math.sin(t * 0.4 + mote.phase) * 0.01) % 1;
      const y = ((((mote.y - lift) % 1) + 1) % 1) * canvas.height;
      const along = ((x - lx) * ax + (y - ly) * ay) / span;
      const across = Math.abs((x - lx) * ay - (y - ly) * ax) / span;
      const reach = Math.min(
        1,
        Math.max(0, (span * 1.2 - along) / (span * 0.25))
      );
      const beam = Math.max(0, 1 - across / (along * 0.2 + 24 * dpr)) * reach;
      const glow = 0.25 + 0.45 * Math.max(0, Math.sin(t * 0.8 + mote.phase));
      const alpha = Math.min(1, glow * beam * (mote.near ? 0.9 : 1.1));
      if (along > 0 && alpha > 0.02) {
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(x, y, mote.size * dpr * (mote.near ? 2.4 : 1), 0, TAU);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };
};

export const createRenderer = (
  canvas: HTMLCanvasElement,
  calm: boolean,
  demo: Demo
) => {
  const atlas = createAtlas();
  const sake = createSake();
  const paint = createPainter(canvas, atlas, sake);
  const air = createAir(canvas, calm);
  const backdrop = canvas.getContext("2d");
  let reserved: (Reserved & { w: number; h: number }) | null = null;
  let layout = layoutOf(1, 1, demo);
  let dpr = 1;
  let key = "";
  let wave = createWave();
  let current: Pour | null = null;
  let last = 0;
  let drops: Drop[] = [];
  let bubbles: Particle[] = [];
  let burst = false;
  let splashing = 0;
  let bubbling = 0;

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    if (w === 0 || h === 0) {
      return false;
    }
    const space =
      reserved !== null && reserved.w === w && reserved.h === h
        ? reserved
        : reservedOf(w, h);
    const next = [w, h, dpr, space.top, space.left, space.right].join(":");
    if (next !== key) {
      key = next;
      layout = layoutOf(w, h, demo, space);
    }
    atlas.prepare(layout, dpr);
    return true;
  };

  const reset = (pour: Pour) => {
    current = pour;
    wave = createWave();
    drops = [];
    bubbles = [];
    burst = false;
    splashing = 0;
    bubbling = 0;
  };

  const spray = (
    from: Point,
    count: number,
    speed: number,
    counter: boolean
  ) => {
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const push = speed * (0.35 + Math.random() * 0.65);
      drops.push({
        age: 0,
        counter,
        r: 0.3 + Math.random() * 0.6,
        vx: Math.cos(angle) * push,
        vy: Math.sin(angle) * push,
        x: from.x + (Math.random() - 0.5) * 2,
        y: from.y,
      });
    }
  };

  const evolve = (
    frame: Frame,
    stream: Stream,
    half: number,
    strain: number,
    broke: number | null,
    start: number,
    surfaceY: (x: number) => number
  ) => {
    const { dt, pour } = frame;
    stepWave(wave, dt, half * 2);
    const { impact } = stream;
    if (impact !== null) {
      const q = Math.min(1.5, impact.rate / pour.flow);
      const x = worldX(impact.x, H);
      pushWave(
        wave,
        x / half,
        0,
        -PUSH * q * (0.6 + 0.8 * Math.random()) * impact.speed * dt,
        0.11
      );
      splashing += dt * SPLASH * Math.max(0, q - 0.2) * (impact.speed / 1000);
      while (splashing > 1) {
        splashing -= 1;
        spray(impact, 1, 520 * Math.min(1.3, impact.speed / 1000), false);
      }
      bubbling += dt * BUBBLES * q;
      while (bubbling > 1) {
        bubbling -= 1;
        const angle = Math.random() * TAU;
        const drift = 6 + Math.random() * 22;
        bubbles.push({
          age: 0,
          fade: 0,
          life: 0.4 + Math.random() * 0.9,
          r: 0.25 + Math.random() * 0.5,
          vx: Math.cos(angle) * drift,
          vz: Math.sin(angle) * drift,
          x,
          z: 0,
        });
      }
    }
    if (broke === null && strain > 0.45) {
      const shiver = QUIVER * (strain - 0.45) ** 2 * dt;
      pushWave(
        wave,
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * shiver * 60,
        0.16
      );
    }
    if (broke !== null && !burst) {
      burst = true;
      pushWave(wave, start / B, 1, -60, 0.35);
      spray(project(start, H + 1, A), SPRAY, 420, true);
    }
    for (const bubble of bubbles) {
      bubble.age += dt;
      bubble.x += bubble.vx * dt;
      bubble.z += bubble.vz * dt;
      bubble.fade = Math.sin((Math.PI * bubble.age) / bubble.life);
    }
    bubbles = bubbles.filter(
      (bubble) =>
        bubble.age < bubble.life &&
        Math.abs(bubble.x) < half - 1 &&
        Math.abs(bubble.z) < half - 1
    );
    for (const drop of drops) {
      drop.age += dt;
      drop.vy += GRAVITY * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
    }
    drops = drops.filter((drop) => {
      const floor = drop.counter
        ? project(drop.x, 0, COUNTER_Z).y
        : surfaceY(drop.x);
      return drop.age < 2 && (drop.vy < 0 || drop.y < floor);
    });
  };

  const momentOf = (frame: Frame): Moment => {
    const { pour, hold, spilledAt, t, clock } = frame;
    const inside = insideAt(pour, hold, spilledAt, t);
    const fill = fillOf(pour, inside);
    const broke = spilledAt !== null && t >= spilledAt ? t - spilledAt : null;
    const strain = broke === null ? domeOf(pour, inside) : 0;
    const surfaceY = landingOf(fill, strain);
    const lip = lipOf(pour);
    const stream = streamOf(jetOf(pour, hold), t, surfaceY, pour.flow);
    const spilt = (since: number) =>
      mlOf(
        pour,
        1 + overflowAt(pour, hold, spilledAt, (spilledAt ?? 0) + since)
      ) - capacity[pour.cup];
    const since = calm ? SETTLED : (broke ?? 0);
    const spillage =
      broke === null ? null : spillageOf(pour.seed, spilt, since, H, A);
    const glassTarget = fill.glass !== null && !fill.glass.over;
    const half = glassTarget
      ? radiusAt(fill.glass?.level ?? BASE) - tumbler.wall
      : B;
    if (!calm) {
      evolve(
        frame,
        stream,
        half,
        strain,
        broke,
        spillage?.start ?? 0,
        surfaceY
      );
    }
    const rate = Math.min(1.5, flowAt(pour, hold, t) / pour.flow);
    const away = Math.max(awayAt(pour, hold, t), frame.raise);
    const pose = poseOf(angleAt(pour, hold, t), layout.size[pour.bottle]);
    return {
      bottle:
        away < 1
          ? {
              matrix: {
                ...pose,
                e: lip.x + (away * layout.w) / layout.scale,
                f: lip.y,
              },
              name: pour.bottle,
            }
          : null,
      bubbles: glassTarget ? [] : bubbles,
      clock,
      drops,
      film: fill.glass?.over === true ? rate : 0,
      fill,
      flux: Math.min(
        1,
        (spilt(since) - spilt(since - 0.05)) / 0.05 / SHEET_FLOW
      ),
      rate,
      spillage,
      strain,
      stream: calm ? { ...stream, beads: [] } : stream,
      wave: calm ? still : wave,
    };
  };

  const draw = (frame: Frame) => {
    if (!resize()) {
      return;
    }
    const { pour, t } = frame;
    if (current !== pour || t < last) {
      reset(pour);
    }
    last = t;
    const rise =
      layout.w >= layout.h && layout.w >= WIDE
        ? 0
        : frame.raise * Math.max(0, layout.cy - layout.h * RESULT);
    const moment = momentOf(frame);
    if (backdrop) {
      backdrop.setTransform(1, 0, 0, 1, 0, 0);
      backdrop.globalAlpha = 1;
      backdrop.globalCompositeOperation = "source-over";
      const image = atlas.backdrop();
      if (image === null) {
        backdrop.fillStyle = "#0b0604";
        backdrop.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        const shift = Math.round(rise * dpr);
        backdrop.drawImage(image, 0, -shift);
        if (shift > 0) {
          backdrop.drawImage(
            image,
            0,
            image.height - 1,
            image.width,
            1,
            0,
            image.height - shift,
            image.width,
            shift
          );
        }
      }
    }
    paint(drawList(moment), {
      a: dpr * layout.scale,
      b: 0,
      c: 0,
      d: dpr * layout.scale,
      e: dpr * layout.cx,
      f: dpr * (layout.cy - rise),
    });
    air(layout, dpr, frame.clock, rise);
  };

  return {
    dispose: sake.dispose,
    reserve: (next: Reserved) => {
      reserved = { ...next, h: canvas.clientHeight, w: canvas.clientWidth };
    },
    draw,
  };
};
