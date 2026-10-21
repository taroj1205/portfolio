import {
  createWave,
  pushWave,
  spillageOf,
  stepWave,
  streamOf,
  waveAt,
} from "./liquid";
import type { Bead, Impact, Stream, Wave } from "./liquid";
import {
  capacity,
  domeOf,
  flowAt,
  insideAt,
  mlOf,
  overflowAt,
  volumeAt,
} from "./pour";
import type { Pour } from "./pour";
import {
  LIFT,
  angleAt,
  backWall,
  box,
  crestMark,
  domeHeight,
  domeOutline,
  face,
  fillOf,
  grain,
  joints,
  level,
  lipOf,
  paint,
  poolOutline,
  project,
  radiusAt,
  rimOf,
  ring,
  seeded,
  sideWalls,
  spoutAt,
  stamp,
  tumbler,
  vesselScale,
  vessels,
} from "./scene";
import type { Dome, Fill, Point } from "./scene";

export interface Frame {
  pour: Pour;
  hold: number;
  spilledAt: number | null;
  t: number;
  raise: number;
  clock: number;
  dt: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  age: number;
  counter: boolean;
}

interface Bubble {
  x: number;
  z: number;
  vx: number;
  vz: number;
  r: number;
  age: number;
  life: number;
}

interface Ripple {
  x: number;
  z: number;
  age: number;
  strength: number;
}

interface Scene {
  frame: Frame;
  stream: Stream;
  half: number;
  strain: number;
  broke: number | null;
  start: number;
  surfaceY: (x: number) => number;
}

interface Layout {
  w: number;
  h: number;
  scale: number;
  cx: number;
  cy: number;
}

const TAU = Math.PI * 2;
const GRAVITY = 9810;
const RIPPLE_LIFE = 0.9;
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", serif';
const H = box.height;
const GLASS_TOP = box.floor + tumbler.height;
const still = createWave(2);
const WIDE = 720;
const RAISE = 0.15;
const SHEET_FLOW = 40;

const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = [1, 3, 5].map((at) =>
    Number.parseInt(hex.slice(at, at + 2), 16)
  );
  return `rgb(${r} ${g} ${b} / ${alpha.toFixed(3)})`;
};

const layoutOf = (w: number, h: number): Layout => ({
  cx: w / 2,
  cy: h * 0.47,
  h,
  scale: Math.min((w * 0.62) / 94, (h * 0.36) / 96),
  w,
});

const trace = (ctx: CanvasRenderingContext2D, points: readonly Point[]) => {
  ctx.beginPath();
  for (const [index, point] of points.entries()) {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
};

const polygon = (ctx: CanvasRenderingContext2D, points: readonly Point[]) => {
  trace(ctx, points);
  ctx.closePath();
};

const vertical = (
  ctx: CanvasRenderingContext2D,
  from: number,
  to: number,
  stops: readonly (readonly [number, string])[]
) => {
  const gradient = ctx.createLinearGradient(0, from, 0, to);
  for (const [at, colour] of stops) {
    gradient.addColorStop(at, colour);
  }
  return gradient;
};

const paintBokeh = (ctx: CanvasRenderingContext2D, at: Layout) => {
  const roll = seeded(4242);
  const tints = ["255 168 84", "255 120 70", "255 206 140", "232 84 52"];
  for (let i = 0; i < 16; i += 1) {
    const x = roll() * at.w;
    const y = roll() * at.cy * 0.85;
    const r = (14 + roll() * 46) * Math.max(1, at.scale / 3);
    const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tint = tints[i % tints.length] ?? "255 168 84";
    const alpha = 0.06 + roll() * 0.16;
    glow.addColorStop(0, `rgb(${tint} / ${alpha.toFixed(3)})`);
    glow.addColorStop(0.7, `rgb(${tint} / ${(alpha * 0.5).toFixed(3)})`);
    glow.addColorStop(1, `rgb(${tint} / 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
};

const paintCounter = (ctx: CanvasRenderingContext2D, at: Layout) => {
  const { w, h, scale, cx, cy } = at;
  const edge = cy + project(0, 0, -260).y * scale;
  ctx.fillStyle = vertical(ctx, edge, h, [
    [0, paint.counterDark],
    [0.25, paint.counter],
    [1, paint.counterDark],
  ]);
  ctx.fillRect(0, edge, w, h - edge);
  ctx.fillStyle = rgba(paint.lamp, 0.12);
  ctx.fillRect(0, edge, w, Math.max(1, scale * 0.4));
  const roll = seeded(99);
  for (let i = 0; i < 70; i += 1) {
    const y = cy + project(0, 0, -255 + i * i * 0.12).y * scale;
    if (y > h) {
      break;
    }
    const bend = (roll() - 0.5) * 6 * scale;
    ctx.strokeStyle = `rgb(0 0 0 / ${(0.12 + roll() * 0.22).toFixed(3)})`;
    ctx.lineWidth = Math.max(0.5, scale * (0.15 + roll() * 0.3));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.3, y + bend, w * 0.7, y - bend, w, y + bend * 0.5);
    ctx.stroke();
  }
  const pool = ctx.createRadialGradient(
    cx,
    cy + 30 * scale,
    0,
    cx,
    cy + 30 * scale,
    150 * scale
  );
  pool.addColorStop(0, rgba(paint.lamp, 0.24));
  pool.addColorStop(0.5, rgba(paint.counterLight, 0.1));
  pool.addColorStop(1, rgba(paint.counterLight, 0));
  ctx.fillStyle = pool;
  ctx.fillRect(0, edge, w, h - edge);
};

const paintBackdrop = (ctx: CanvasRenderingContext2D, at: Layout) => {
  const { w, h, scale, cx, cy } = at;
  ctx.fillStyle = vertical(ctx, 0, h, [
    [0, paint.night],
    [0.5, paint.room],
    [1, paint.night],
  ]);
  ctx.fillRect(0, 0, w, h);
  paintBokeh(ctx, at);
  const lamp = ctx.createRadialGradient(
    cx,
    cy - 140 * scale,
    0,
    cx,
    cy,
    190 * scale
  );
  lamp.addColorStop(0, rgba(paint.lamp, 0.16));
  lamp.addColorStop(1, rgba(paint.lamp, 0));
  ctx.fillStyle = lamp;
  ctx.fillRect(0, 0, w, h);
  paintCounter(ctx, at);
  const vignette = ctx.createRadialGradient(
    cx,
    cy,
    Math.min(w, h) * 0.3,
    cx,
    cy,
    Math.max(w, h) * 0.8
  );
  vignette.addColorStop(0, rgba(paint.shadow, 0));
  vignette.addColorStop(1, rgba(paint.shadow, 0.6));
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
};

const paintShadow = (ctx: CanvasRenderingContext2D) => {
  const centre = project(0, 0, 4);
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, 78);
  shadow.addColorStop(0, rgba(paint.shadow, 0.75));
  shadow.addColorStop(0.55, rgba(paint.shadow, 0.35));
  shadow.addColorStop(1, rgba(paint.shadow, 0));
  ctx.save();
  ctx.translate(centre.x, centre.y);
  ctx.scale(1, 0.42);
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, 78, 0, TAU);
  ctx.fill();
  ctx.restore();
};

const paintRim = (ctx: CanvasRenderingContext2D, side: -1 | 1) => {
  const rim = rimOf(side);
  polygon(ctx, [...rim.outer, ...rim.inner]);
  ctx.fillStyle = vertical(ctx, rim.outer[1]?.y ?? 0, rim.outer[0]?.y ?? 1, [
    [0, side < 0 ? paint.woodDark : paint.woodLight],
    [1, paint.wood],
  ]);
  ctx.fill();
  for (const end of rim.ends) {
    polygon(ctx, end);
    ctx.fillStyle = rgba(paint.endGrain, 0.55);
    ctx.fill();
  }
  trace(ctx, rim.inner.slice(0, 3));
  ctx.strokeStyle = rgba(paint.woodShade, 0.5);
  ctx.lineWidth = 0.35;
  ctx.stroke();
};

const paintBack = (ctx: CanvasRenderingContext2D) => {
  paintShadow(ctx);
  paintRim(ctx, -1);
  polygon(ctx, level(box.floor));
  ctx.fillStyle = paint.innerDark;
  ctx.fill();
  for (const wall of sideWalls) {
    polygon(ctx, wall);
    ctx.fill();
  }
  polygon(ctx, backWall);
  ctx.fillStyle = vertical(ctx, backWall[0]?.y ?? 0, backWall[2]?.y ?? 1, [
    [0, paint.inner],
    [1, paint.innerDark],
  ]);
  ctx.fill();
};

const paintFront = (ctx: CanvasRenderingContext2D) => {
  polygon(ctx, face);
  ctx.fillStyle = vertical(ctx, face[0]?.y ?? 0, face[3]?.y ?? 1, [
    [0, paint.woodLight],
    [0.35, paint.wood],
    [1, paint.woodDark],
  ]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  const across = ctx.createLinearGradient(
    face[0]?.x ?? 0,
    0,
    face[1]?.x ?? 1,
    0
  );
  across.addColorStop(0, rgba(paint.shadow, 0.16));
  across.addColorStop(0.45, rgba(paint.sheen, 0.05));
  across.addColorStop(1, rgba(paint.shadow, 0.22));
  ctx.fillStyle = across;
  ctx.fill();
  for (const line of grain) {
    const [from, mid, to] = line.points;
    ctx.strokeStyle = rgba(paint.grain, line.alpha);
    ctx.lineWidth = line.width;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.quadraticCurveTo(mid.x, mid.y, to.x, to.y);
    ctx.stroke();
  }
  for (const joint of joints) {
    polygon(ctx, joint);
    ctx.fillStyle = rgba(paint.endGrain, 0.7);
    ctx.fill();
    ctx.strokeStyle = rgba(paint.woodShade, 0.35);
    ctx.lineWidth = 0.25;
    ctx.stroke();
  }
  ctx.strokeStyle = rgba(paint.brand, 0.62);
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(stamp.x, stamp.y, 11.5, 11, 0, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1.4;
  ctx.stroke(new Path2D(crestMark(6.5)));
  ctx.restore();
  polygon(ctx, face);
  ctx.strokeStyle = rgba(paint.woodShade, 0.7);
  ctx.lineWidth = 0.4;
  ctx.stroke();
  paintRim(ctx, 1);
  trace(ctx, face.slice(0, 2));
  ctx.strokeStyle = rgba(paint.sheen, 0.55);
  ctx.lineWidth = 0.45;
  ctx.stroke();
};

const B = box.inner;
const A = box.outer;
const COLUMNS = 40;
const LIP_SPEED = 130;
const LIP_GAIN = 240;
const IMPACT_Z = 3;
const FLAT_WAVE = 0.9;
const DOME_WAVE = 2.4;
const GLASS_WAVE = 0.7;
const PUSH = 2600;
const QUIVER = 2600;
const SPLASH = 26;
const BUBBLES = 22;
const RIPPLE_SPEED = 58;
const SPRAY = 30;
const SETTLED = 60;
const COUNTER_Z = A + 12;

const columns = Array.from(
  { length: COLUMNS + 1 },
  (_, i) => -B + (2 * B * i) / COLUMNS
);

const jetOf = (pour: Pour, hold: number, lip: Point) => (at: number) => {
  const rate = flowAt(pour, hold, at);
  const direction = spoutAt(pour.bottle, angleAt(pour, hold, at));
  const speed = LIP_SPEED + LIP_GAIN * Math.min(1.6, rate / pour.flow);
  return {
    rate,
    volume: mlOf(pour, volumeAt(pour, hold, at)),
    vx: direction.x * speed,
    vy: direction.y * speed,
    x: lip.x,
    y: lip.y,
  };
};

const paintThread = (
  ctx: CanvasRenderingContext2D,
  thread: readonly Bead[]
) => {
  const left: Point[] = [];
  const right: Point[] = [];
  const core: Point[] = [];
  let width = 0;
  for (const [index, bead] of thread.entries()) {
    const before = thread[Math.max(0, index - 1)] ?? bead;
    const after = thread[Math.min(thread.length - 1, index + 1)] ?? bead;
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const size = Math.hypot(dx, dy) || 1;
    const nx = -dy / size;
    const ny = dx / size;
    left.push({ x: bead.x + nx * bead.r, y: bead.y + ny * bead.r });
    right.push({ x: bead.x - nx * bead.r, y: bead.y - ny * bead.r });
    core.push({ x: bead.x + nx * bead.r * 0.5, y: bead.y + ny * bead.r * 0.5 });
    width += bead.r / thread.length;
  }
  polygon(ctx, [...left, ...right.toReversed()]);
  ctx.fillStyle = rgba(paint.sake, 0.5);
  ctx.fill();
  for (const edge of [left, right]) {
    trace(ctx, edge);
    ctx.strokeStyle = rgba(paint.amber, 0.45);
    ctx.lineWidth = Math.max(0.12, width * 0.18);
    ctx.stroke();
  }
  trace(ctx, core);
  ctx.strokeStyle = rgba(paint.straw, 0.92);
  ctx.lineWidth = Math.max(0.1, width * 0.26);
  ctx.stroke();
};

const paintBead = (ctx: CanvasRenderingContext2D, bead: Bead) => {
  ctx.fillStyle = rgba(paint.sake, 0.78);
  ctx.beginPath();
  ctx.ellipse(bead.x, bead.y, bead.r * 0.9, bead.r * 1.1, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(paint.straw, 0.95);
  ctx.beginPath();
  ctx.arc(bead.x - bead.r * 0.3, bead.y - bead.r * 0.35, bead.r * 0.32, 0, TAU);
  ctx.fill();
};

const paintStream = (ctx: CanvasRenderingContext2D, stream: Stream) => {
  for (const thread of stream.threads) {
    paintThread(ctx, thread);
  }
  for (const bead of stream.beads) {
    paintBead(ctx, bead);
  }
};

const paintFoam = (
  ctx: CanvasRenderingContext2D,
  impact: Impact | null,
  flow: number,
  clock: number
) => {
  if (impact === null) {
    return;
  }
  const q = Math.min(1.4, impact.rate / flow);
  const r = (1.4 + 3.2 * Math.sqrt(q)) * (1 + 0.12 * Math.sin(clock * 47));
  ctx.save();
  ctx.translate(impact.x, impact.y);
  ctx.scale(1, 0.34);
  const foam = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  foam.addColorStop(0, rgba(paint.sheen, 0.8 * Math.min(1, q + 0.2)));
  foam.addColorStop(0.45, rgba(paint.straw, 0.45 * Math.min(1, q + 0.2)));
  foam.addColorStop(1, rgba(paint.straw, 0));
  ctx.fillStyle = foam;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
};

const slopes = (wave: Wave, scale: number) =>
  columns.map((x, i) => {
    const step = (2 * B) / COLUMNS;
    const left = waveAt(wave, (columns[Math.max(0, i - 1)] ?? x) / B);
    const middle = waveAt(wave, x / B);
    const right = waveAt(wave, (columns[Math.min(COLUMNS, i + 1)] ?? x) / B);
    return {
      bend: ((left - 2 * middle + right) * scale) / (step * step),
      slope: ((right - left) * scale) / (2 * step),
      x,
    };
  });

const band = (
  ctx: CanvasRenderingContext2D,
  wave: Wave,
  scale: number,
  edge: (x: number) => number,
  thickness: number,
  shift: number
) => {
  const rows = slopes(wave, scale);
  polygon(ctx, [
    ...rows.map(({ slope, x }) => ({ x, y: edge(x) + slope * shift })),
    ...rows.toReversed().map(({ bend, slope, x }) => ({
      x,
      y:
        edge(x) +
        slope * shift +
        thickness * Math.min(1.6, Math.max(0.4, 1 + bend * 6)),
    })),
  ]);
};

const paintSpecular = (
  ctx: CanvasRenderingContext2D,
  at: Point,
  wave: Wave,
  scale: number,
  strength: number
) => {
  const across = ctx.createLinearGradient(at.x - 22, 0, at.x + 22, 0);
  across.addColorStop(0, rgba(paint.sheen, 0));
  across.addColorStop(0.5, rgba(paint.sheen, strength));
  across.addColorStop(1, rgba(paint.sheen, 0));
  ctx.fillStyle = across;
  for (const size of [3.6, 2, 0.9]) {
    ctx.globalAlpha = 0.4;
    band(ctx, wave, scale, () => at.y - size / 2, size, 16);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const paintCaustics = (
  ctx: CanvasRenderingContext2D,
  wave: Wave,
  depth: number
) => {
  if (depth < 2) {
    return;
  }
  const top = project(0, box.floor, -B).y;
  const bottom = project(0, box.floor, B).y;
  const width = (2 * B) / COLUMNS + 0.05;
  ctx.globalCompositeOperation = "lighter";
  for (const { bend, x } of slopes(wave, FLAT_WAVE)) {
    const light = Math.min(0.22, Math.max(0, -bend) * 0.9);
    if (light > 0.01) {
      ctx.fillStyle = rgba(paint.lamp, light);
      ctx.fillRect(x - width / 2, top, width, bottom - top);
    }
  }
  ctx.globalCompositeOperation = "source-over";
};

const paintWet = (ctx: CanvasRenderingContext2D, from: number, to: number) => {
  if (to - from < 0.3) {
    return;
  }
  const top = Math.min(H, to);
  polygon(ctx, [
    project(-B, top, -B),
    project(B, top, -B),
    project(B, from, -B),
    project(-B, from, -B),
  ]);
  ctx.fillStyle = vertical(ctx, project(0, top, -B).y, project(0, from, -B).y, [
    [0, rgba(paint.wet, 0.1)],
    [1, rgba(paint.wet, 0.32)],
  ]);
  ctx.fill();
};

const paintFlat = (ctx: CanvasRenderingContext2D, y: number, wave: Wave) => {
  if (y <= box.floor + 0.15) {
    return;
  }
  const back = columns.map((x) =>
    project(x, y + waveAt(wave, x / B) * FLAT_WAVE, -B)
  );
  const front = [project(B, y, B), project(-B, y, B)];
  const top = Math.min(...back.map((point) => point.y));
  const bottom = front[0]?.y ?? top + 1;
  const depth = y - box.floor;
  const body = 1 - Math.exp(-depth / 22);
  polygon(ctx, [...back, ...front]);
  ctx.fillStyle = vertical(ctx, top, bottom, [
    [0, rgba(paint.straw, 0.3 + 0.15 * body)],
    [0.12, rgba(paint.sake, 0.28 + 0.2 * body)],
    [0.45, rgba(paint.sakeDeep, 0.3 + 0.45 * body)],
    [1, rgba(paint.amber, 0.38 + 0.6 * body)],
  ]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  paintCaustics(ctx, wave, depth);
  const mirror = project(0, H, -B).y - project(0, y, -B).y;
  const reflection = ctx.createLinearGradient(0, top, 0, top - mirror * 0.9);
  reflection.addColorStop(0, rgba(paint.woodLight, 0.34));
  reflection.addColorStop(0.7, rgba(paint.inner, 0.12));
  reflection.addColorStop(1, rgba(paint.inner, 0));
  ctx.fillStyle = reflection;
  band(
    ctx,
    wave,
    FLAT_WAVE,
    (x) => project(x, y, -B).y - 0.5,
    mirror * 0.9,
    10
  );
  ctx.fill();
  paintSpecular(ctx, project(-12, y, -16), wave, FLAT_WAVE, 0.85);
  ctx.restore();
  trace(ctx, back);
  ctx.strokeStyle = rgba(paint.straw, 0.8);
  ctx.lineWidth = 0.42;
  ctx.stroke();
  for (const side of [-1, 1]) {
    trace(ctx, [project(side * B, y, -B), project(side * B, y, B)]);
    ctx.strokeStyle = rgba(paint.straw, 0.45);
    ctx.lineWidth = 0.35;
    ctx.stroke();
  }
};

const paintDomeTop = (
  ctx: CanvasRenderingContext2D,
  dome: Dome,
  wave: Wave,
  lift: number,
  strain: number
) => {
  polygon(ctx, dome.outline);
  const top = Math.min(...dome.upper.map((point) => point.y));
  const bottom = dome.lower[0]?.y ?? top + 1;
  ctx.fillStyle = vertical(ctx, top, bottom, [
    [0, rgba(paint.sheen, 0.8)],
    [0.03, rgba(paint.mirror, 0.62)],
    [0.3, rgba(paint.amber, 0.62)],
    [0.72, rgba(paint.sakeDeep, 0.6)],
    [1, rgba(paint.amber, 0.72)],
  ]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  paintSpecular(ctx, project(-12, H + lift * 0.92, -18), wave, DOME_WAVE, 0.95);
  paintSpecular(
    ctx,
    project(16, H + lift * 0.7, -4),
    wave,
    DOME_WAVE,
    0.18 + 0.3 * strain
  );
  ctx.restore();
  trace(ctx, dome.upper);
  ctx.strokeStyle = rgba(paint.sheen, 0.75 + 0.25 * strain);
  ctx.lineWidth = 0.4;
  ctx.stroke();
};

const paintDomeFront = (
  ctx: CanvasRenderingContext2D,
  dome: Dome,
  strain: number,
  clock: number,
  calm: boolean
) => {
  polygon(ctx, [...dome.crest, ...dome.lower]);
  const top = Math.min(...dome.crest.map((point) => point.y));
  ctx.fillStyle = vertical(ctx, top, dome.lower[0]?.y ?? top + 1, [
    [0, rgba(paint.sheen, 0.8)],
    [0.12, rgba(paint.straw, 0.3)],
    [0.5, rgba(paint.sake, 0.14)],
    [0.86, rgba(paint.sakeDeep, 0.3)],
    [1, rgba(paint.amber, 0.6)],
  ]);
  ctx.fill();
  trace(ctx, dome.crest);
  ctx.strokeStyle = rgba(paint.sheen, 0.18 + 0.35 * strain);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.strokeStyle = rgba(paint.sheen, 0.95);
  ctx.lineWidth = 0.32 + 0.2 * strain;
  ctx.stroke();
  trace(ctx, dome.lower);
  ctx.strokeStyle = rgba(paint.amber, 0.8);
  ctx.lineWidth = 0.3;
  ctx.stroke();
  if (calm || strain < 0.6) {
    return;
  }
  const glow = (strain - 0.6) / 0.4;
  for (let k = 0; k < 3; k += 1) {
    const u = (clock * (0.35 + k * 0.17) + k / 3) % 1;
    const point = dome.crest[Math.round(u * (dome.crest.length - 1))];
    if (point !== undefined) {
      ctx.fillStyle = rgba(paint.sheen, glow * 0.9 * Math.sin(u * Math.PI));
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, 1.4, 0.45, 0, 0, TAU);
      ctx.fill();
    }
  }
};

const paintGlassLiquid = (
  ctx: CanvasRenderingContext2D,
  glass: NonNullable<Fill["glass"]>,
  wave: Wave
) => {
  const base = box.floor + tumbler.base;
  if (glass.level <= base + 0.2) {
    return;
  }
  const r = radiusAt(glass.level);
  const y = glass.level + glass.dome * 0.6;
  polygon(ctx, [
    ...ring(glass.level, r, Math.PI, TAU),
    ...ring(base, radiusAt(base), 0, Math.PI),
  ]);
  const across = ctx.createLinearGradient(-r, 0, r, 0);
  across.addColorStop(0, rgba(paint.straw, 0.4));
  across.addColorStop(0.18, rgba(paint.sakeDeep, 0.55));
  across.addColorStop(0.55, rgba(paint.amber, 0.62));
  across.addColorStop(0.9, rgba(paint.sakeDeep, 0.5));
  across.addColorStop(1, rgba(paint.straw, 0.45));
  ctx.fillStyle = across;
  ctx.fill();
  const surface = Array.from({ length: 41 }, (_, i) => {
    const a = (i / 40) * TAU;
    const x = Math.cos(a) * r;
    return project(x, y + waveAt(wave, x / r) * GLASS_WAVE, Math.sin(a) * r);
  });
  polygon(ctx, surface);
  ctx.fillStyle = vertical(ctx, surface[30]?.y ?? 0, surface[10]?.y ?? 1, [
    [0, rgba(paint.straw, 0.75)],
    [0.3, rgba(paint.sakeDeep, 0.62)],
    [1, rgba(paint.amber, 0.72)],
  ]);
  ctx.fill();
  trace(ctx, surface.slice(20));
  ctx.strokeStyle = rgba(paint.sheen, 0.85);
  ctx.lineWidth = 0.4;
  ctx.stroke();
};

const paintGlassShell = (
  ctx: CanvasRenderingContext2D,
  fill: Fill,
  film: number,
  clock: number
) => {
  const { glass } = fill;
  if (glass === null) {
    return;
  }
  const shell = [
    ...ring(GLASS_TOP, tumbler.top, Math.PI, TAU),
    ...ring(box.floor, tumbler.bottom, 0, Math.PI),
  ];
  polygon(ctx, shell);
  const sheen = ctx.createLinearGradient(-tumbler.top, 0, tumbler.top, 0);
  sheen.addColorStop(0, rgba(paint.glass, 0.2));
  sheen.addColorStop(0.18, rgba(paint.glass, 0.05));
  sheen.addColorStop(0.7, rgba(paint.glass, 0.03));
  sheen.addColorStop(0.9, rgba(paint.glass, 0.16));
  sheen.addColorStop(1, rgba(paint.glass, 0.05));
  ctx.fillStyle = sheen;
  ctx.fill();
  if (glass.over) {
    const bottom = Math.max(fill.level, box.floor);
    const sheet = [
      ...ring(GLASS_TOP, tumbler.top + 0.5, 0, Math.PI),
      ...ring(bottom, radiusAt(bottom) + 0.5, Math.PI, 0),
    ];
    polygon(ctx, sheet);
    ctx.fillStyle = rgba(paint.sake, 0.1 + 0.22 * film);
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let k = 0; k < 9; k += 1) {
      const a = 0.25 + (k / 8) * (Math.PI - 0.5);
      const fall = (clock * 1.6 + k * 0.37) % 1;
      const points: Point[] = [];
      for (let y = GLASS_TOP; y >= bottom; y -= 2) {
        const r = radiusAt(y) + 0.6;
        const sway = Math.sin(y * 0.35 + k * 1.7) * 0.03;
        points.push(project(Math.cos(a + sway) * r, y, Math.sin(a + sway) * r));
      }
      trace(ctx, points);
      ctx.strokeStyle = rgba(
        paint.straw,
        (0.12 + 0.5 * film) * (0.6 + 0.4 * Math.sin(fall * TAU))
      );
      ctx.lineWidth = 0.35 + 0.9 * film;
      ctx.stroke();
    }
    ctx.restore();
    trace(
      ctx,
      ring(GLASS_TOP + glass.dome * 0.35, tumbler.top + 0.3, 0, Math.PI)
    );
    ctx.strokeStyle = rgba(paint.sheen, 0.7);
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
  trace(ctx, ring(GLASS_TOP, tumbler.top));
  ctx.strokeStyle = rgba(paint.glass, 0.7);
  ctx.lineWidth = 0.55;
  ctx.stroke();
  for (const side of [-1, 1]) {
    trace(ctx, [
      project(side * (tumbler.top - 2.5), GLASS_TOP - 4, 2),
      project(side * (tumbler.bottom - 2), box.floor + 8, 2),
    ]);
    ctx.strokeStyle = rgba(paint.glass, side < 0 ? 0.5 : 0.22);
    ctx.lineWidth = side < 0 ? 1.4 : 0.8;
    ctx.stroke();
  }
};

const paintPool = (
  ctx: CanvasRenderingContext2D,
  radius: number,
  start: number,
  seed: number
) => {
  if (radius < 0.5) {
    return;
  }
  const outline = poolOutline(radius, start, seed);
  const centre = { x: start * 0.4, y: A + radius * 0.35 };
  polygon(ctx, outline);
  ctx.fillStyle = rgba(paint.amber, 0.3);
  ctx.fill();
  ctx.save();
  ctx.clip();
  const foot = project(0, 0, A);
  const top = project(0, H, A);
  const height = (foot.y - top.y) * 0.8;
  ctx.fillStyle = vertical(ctx, foot.y, foot.y + height, [
    [0, rgba(paint.woodLight, 0.45)],
    [0.45, rgba(paint.wood, 0.28)],
    [1, rgba(paint.wood, 0)],
  ]);
  ctx.fillRect(
    face[3]?.x ?? -A,
    foot.y,
    (face[2]?.x ?? A) - (face[3]?.x ?? -A),
    height
  );
  const shine = project(centre.x - radius * 0.3, 0, centre.y + radius * 0.35);
  ctx.translate(shine.x, shine.y);
  ctx.scale(3, 0.35);
  const spot = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 0.3 + 2);
  spot.addColorStop(0, rgba(paint.sheen, 0.75));
  spot.addColorStop(0.4, rgba(paint.lamp, 0.3));
  spot.addColorStop(1, rgba(paint.lamp, 0));
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.3 + 2, 0, TAU);
  ctx.fill();
  ctx.restore();
  polygon(ctx, outline);
  ctx.strokeStyle = rgba(paint.straw, 0.28);
  ctx.lineWidth = 0.3;
  ctx.stroke();
  trace(ctx, outline.slice(3, 22));
  ctx.strokeStyle = rgba(paint.sheen, 0.7);
  ctx.lineWidth = 0.45;
  ctx.stroke();
};

const edgesOf = (path: readonly Bead[]) => {
  const left: Point[] = [];
  const right: Point[] = [];
  for (const bead of path) {
    const point = project(bead.x, bead.y, A + 0.4);
    left.push({ x: point.x - bead.r, y: point.y });
    right.push({ x: point.x + bead.r, y: point.y });
  }
  return { left, right };
};

const paintSpillage = (
  ctx: CanvasRenderingContext2D,
  spillage: ReturnType<typeof spillageOf>,
  flux: number
) => {
  const from = Math.max(-A, spillage.start - spillage.sheet / 2);
  const to = Math.min(A, spillage.start + spillage.sheet / 2);
  if (to > from) {
    polygon(ctx, [
      project(from, H + 0.3, box.inner),
      project(to, H + 0.3, box.inner),
      project(to, H + 0.2, A + 0.4),
      project(from, H + 0.2, A + 0.4),
    ]);
    ctx.fillStyle = rgba(paint.sake, 0.16 + 0.4 * Math.min(1, flux));
    ctx.fill();
    trace(ctx, [
      project(from, H + 0.2, A + 0.4),
      project(to, H + 0.2, A + 0.4),
    ]);
    ctx.strokeStyle = rgba(paint.sheen, 0.3 + 0.5 * Math.min(1, flux));
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  for (const rivulet of spillage.rivulets) {
    if (rivulet.path.length < 2) {
      continue;
    }
    const trail = rivulet.path.map((bead) => project(bead.x, bead.y, A + 0.3));
    trace(ctx, trail);
    ctx.strokeStyle = rgba(paint.woodShade, 0.26);
    ctx.lineWidth = 1.5 + 3 * rivulet.share;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.strokeStyle = rgba(paint.sheen, 0.22);
    ctx.lineWidth = 0.25;
    ctx.stroke();
    ctx.lineCap = "butt";
    const live = rivulet.path.filter((bead) => bead.r > 0.12);
    if (live.length > 1) {
      const { left, right } = edgesOf(live);
      polygon(ctx, [...left, ...right.toReversed()]);
      ctx.fillStyle = rgba(paint.sake, 0.62);
      ctx.fill();
      trace(
        ctx,
        left.map((point, i) => ({
          x: point.x + (live[i]?.r ?? 0) * 0.45,
          y: point.y,
        }))
      );
      ctx.strokeStyle = rgba(paint.straw, 0.9);
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
    const head = rivulet.path.at(-1);
    if (head && rivulet.flux > 0.05 && rivulet.front < H) {
      const point = project(head.x, head.y, A + 0.5);
      const r = Math.max(0.9, head.r * 1.5);
      ctx.fillStyle = rgba(paint.sake, 0.75);
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, r, r * 1.2, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(paint.sheen, 0.9);
      ctx.beginPath();
      ctx.arc(point.x - r * 0.35, point.y - r * 0.3, r * 0.3, 0, TAU);
      ctx.fill();
    }
  }
};
const vesselBody = (
  ctx: CanvasRenderingContext2D,
  pour: Pour,
  width: number
) => {
  const body = ctx.createLinearGradient(-width, 0, width, 0);
  const stops: Record<Pour["bottle"], readonly (readonly [number, string])[]> =
    {
      isshobin: [
        [0, paint.isshobin],
        [0.25, paint.isshobinLight],
        [0.4, paint.isshobin],
        [1, paint.isshobinDark],
      ],
      katakuchi: [
        [0, paint.lacquer],
        [0.3, paint.lacquerLight],
        [1, paint.lacquer],
      ],
      tokkuri: [
        [0, paint.porcelainShade],
        [0.3, paint.porcelain],
        [1, paint.porcelainDark],
      ],
    };
  for (const [at, colour] of stops[pour.bottle]) {
    body.addColorStop(at, colour);
  }
  return body;
};

const vesselMarks = (ctx: CanvasRenderingContext2D, pour: Pour) => {
  if (pour.bottle === "isshobin") {
    ctx.fillStyle = paint.label;
    ctx.fillRect(-40, 214, 80, 120);
    ctx.fillStyle = paint.vermilion;
    ctx.fillRect(-40, 214, 80, 8);
    ctx.fillStyle = paint.labelInk;
    ctx.font = `700 46px ${MINCHO}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.save();
    ctx.translate(0, 278);
    ctx.scale(-1, 1);
    ctx.fillText("酒", 0, 0);
    ctx.restore();
    ctx.fillStyle = rgba(paint.sheen, 0.25);
    ctx.fillRect(-34, 120, 7, 270);
    return;
  }
  if (pour.bottle === "tokkuri") {
    ctx.strokeStyle = paint.indigo;
    ctx.lineWidth = 2.4;
    for (const y of [60, 66, 126]) {
      ctx.beginPath();
      ctx.moveTo(-50, y);
      ctx.lineTo(50, y);
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.arc(i * 18, 96, 7, Math.PI, TAU);
      ctx.stroke();
    }
    return;
  }
  ctx.fillStyle = paint.vermilion;
  ctx.beginPath();
  ctx.ellipse(-1, 1, 60, 5, 0, 0, TAU);
  ctx.fill();
};

const paintVessel = (
  ctx: CanvasRenderingContext2D,
  pour: Pour,
  anchor: Point,
  angle: number
) => {
  const vessel = vessels[pour.bottle];
  ctx.save();
  ctx.translate(anchor.x, anchor.y);
  ctx.scale(-vesselScale, vesselScale);
  ctx.rotate(angle);
  ctx.translate(-vessel.lip.x, -vessel.lip.y);
  polygon(
    ctx,
    vessel.outline.map(([x, y]) => ({ x, y }))
  );
  ctx.fillStyle = vesselBody(
    ctx,
    pour,
    Math.max(...vessel.outline.map(([x]) => x))
  );
  ctx.fill();
  ctx.strokeStyle = rgba(paint.sheen, 0.22);
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.clip();
  vesselMarks(ctx, pour);
  ctx.restore();
};

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  let layout = layoutOf(1, 1);
  let dpr = 1;
  let layers: {
    key: string;
    back: HTMLCanvasElement;
    front: HTMLCanvasElement;
  } | null = null;
  let wave = createWave();
  let current: Pour | null = null;
  let last = 0;
  let drops: Drop[] = [];
  let bubbles: Bubble[] = [];
  let ripples: Ripple[] = [];
  let wet: number = box.floor;
  let burst = false;
  let rippling = 0;
  let splashing = 0;
  let bubbling = 0;

  const toCup = (target: CanvasRenderingContext2D, lift = 0) => {
    target.setTransform(
      dpr * layout.scale,
      0,
      0,
      dpr * layout.scale,
      dpr * layout.cx,
      dpr * (layout.cy - lift)
    );
  };

  const layer = (paintLayer: (target: CanvasRenderingContext2D) => void) => {
    const image = document.createElement("canvas");
    image.width = canvas.width;
    image.height = canvas.height;
    const target = image.getContext("2d");
    if (target) {
      paintLayer(target);
    }
    return image;
  };

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
    layout = layoutOf(w, h);
    const key = `${w}x${h}@${dpr}`;
    if (layers?.key !== key) {
      layers = {
        back: layer((target) => {
          target.setTransform(dpr, 0, 0, dpr, 0, 0);
          paintBackdrop(target, layout);
          toCup(target);
          paintBack(target);
        }),
        front: layer((target) => {
          toCup(target);
          paintFront(target);
        }),
        key,
      };
    }
  };

  const reset = (pour: Pour) => {
    current = pour;
    wave = createWave();
    drops = [];
    bubbles = [];
    ripples = [];
    wet = box.floor;
    burst = false;
    rippling = 0;
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
        r: 0.3 + Math.random() * 0.7,
        vx: Math.cos(angle) * push,
        vy: Math.sin(angle) * push,
        x: from.x + (Math.random() - 0.5) * 2,
        y: from.y,
      });
    }
  };

  const evolve = (scene: Scene) => {
    const { frame, stream, half, strain, broke, start, surfaceY } = scene;
    const { dt, pour } = frame;
    stepWave(wave, dt, half * 2);
    const { impact } = stream;
    if (impact !== null) {
      const q = Math.min(1.5, impact.rate / pour.flow);
      const hit = impact.x / half;
      pushWave(
        wave,
        hit,
        -PUSH * q * (0.5 + Math.random()) * (impact.speed / 1000) * dt,
        0.07
      );
      rippling += dt * (3 + 9 * q);
      if (rippling > 1) {
        rippling = 0;
        ripples.push({
          age: 0,
          strength: Math.min(1, 0.35 + q),
          x: impact.x,
          z: IMPACT_Z,
        });
      }
      splashing += dt * SPLASH * Math.max(0, q - 0.2) * (impact.speed / 1000);
      while (splashing > 1) {
        splashing -= 1;
        spray(impact, 1, 520 * Math.min(1.3, impact.speed / 1000), false);
      }
      bubbling += dt * BUBBLES * q;
      while (bubbling > 1) {
        bubbling -= 1;
        const angle = Math.random() * TAU;
        const drift = 6 + Math.random() * 26;
        bubbles.push({
          age: 0,
          life: 0.5 + Math.random() * 1.1,
          r: 0.35 + Math.random() * 0.8,
          vx: Math.cos(angle) * drift,
          vz: Math.sin(angle) * drift,
          x: impact.x,
          z: IMPACT_Z,
        });
      }
    }
    if (broke === null && strain > 0.45) {
      const shiver = QUIVER * (strain - 0.45) ** 2 * dt;
      pushWave(
        wave,
        (Math.random() - 0.5) * 1.6,
        (Math.random() - 0.5) * shiver,
        0.05
      );
    }
    if (broke !== null && !burst) {
      burst = true;
      pushWave(wave, start / B, -90, 0.3);
      spray(project(start, H + 1, A), SPRAY, 420, true);
    }
    for (const ripple of ripples) {
      ripple.age += dt;
    }
    ripples = ripples.filter((ripple) => ripple.age < RIPPLE_LIFE);
    for (const bubble of bubbles) {
      bubble.age += dt;
      bubble.x += bubble.vx * dt;
      bubble.z += bubble.vz * dt;
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

  const paintRipples = (
    height: (x: number, z: number) => number,
    half: number
  ) => {
    for (const ripple of ripples) {
      const t = ripple.age / RIPPLE_LIFE;
      const r = 1.5 + ripple.age * RIPPLE_SPEED;
      const points: Point[] = [];
      for (let i = 0; i <= 28; i += 1) {
        const a = (i / 28) * TAU;
        const x = Math.max(-half, Math.min(half, ripple.x + Math.cos(a) * r));
        const z = Math.max(-half, Math.min(half, ripple.z + Math.sin(a) * r));
        points.push(project(x, height(x, z), z));
      }
      trace(ctx, points);
      ctx.strokeStyle = rgba(paint.sheen, 0.32 * ripple.strength * (1 - t));
      ctx.lineWidth = 0.32;
      ctx.stroke();
    }
  };

  const paintBubbles = (height: (x: number, z: number) => number) => {
    for (const bubble of bubbles) {
      const fade = 1 - bubble.age / bubble.life;
      const at = project(bubble.x, height(bubble.x, bubble.z) + 0.2, bubble.z);
      ctx.strokeStyle = rgba(paint.sheen, 0.55 * fade);
      ctx.lineWidth = 0.18;
      ctx.beginPath();
      ctx.ellipse(at.x, at.y, bubble.r, bubble.r * 0.45, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(paint.sheen, 0.7 * fade);
      ctx.fillRect(
        at.x - bubble.r * 0.4,
        at.y - bubble.r * 0.25,
        bubble.r * 0.3,
        bubble.r * 0.18
      );
    }
  };

  const paintDrops = (counter: boolean) => {
    for (const drop of drops) {
      if (drop.counter !== counter) {
        continue;
      }
      ctx.fillStyle = rgba(paint.sake, 0.85);
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(paint.sheen, 0.9);
      ctx.beginPath();
      ctx.arc(
        drop.x - drop.r * 0.3,
        drop.y - drop.r * 0.3,
        drop.r * 0.35,
        0,
        TAU
      );
      ctx.fill();
    }
  };

  const paintLayer = (image: HTMLCanvasElement | undefined, lift: number) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (image) {
      const rise = Math.round(lift * dpr);
      ctx.drawImage(image, 0, -rise);
      if (rise > 0 && image === layers?.back) {
        ctx.drawImage(
          image,
          0,
          image.height - 1,
          image.width,
          1,
          0,
          image.height - rise,
          image.width,
          rise
        );
      }
    }
    toCup(ctx, lift);
  };

  const sceneOf = (frame: Frame) => {
    const { pour, hold, spilledAt, t } = frame;
    const inside = insideAt(pour, hold, spilledAt, t);
    const fill = fillOf(pour, inside);
    const broke = spilledAt !== null && t >= spilledAt ? t - spilledAt : null;
    const strain = broke === null ? domeOf(pour, inside) : 0;
    const { glass } = fill;
    const half = glass === null ? B : radiusAt(glass.level);
    const surface = glass === null ? wave : still;
    const masuTop = (x: number, z: number) =>
      fill.dome > 0
        ? H +
          domeHeight(
            fill.dome,
            strain,
            x,
            z,
            waveAt(surface, x / B) * DOME_WAVE
          )
        : fill.level + waveAt(surface, x / B) * FLAT_WAVE;
    const height = (x: number, z: number) =>
      glass !== null && Math.hypot(x, z) <= half
        ? glass.level + glass.dome * 0.6 + waveAt(wave, x / half) * GLASS_WAVE
        : masuTop(x, z);
    const surfaceY = (x: number) => project(x, height(x, IMPACT_Z), IMPACT_Z).y;
    const spilt = (since: number) =>
      mlOf(
        pour,
        1 + overflowAt(pour, hold, spilledAt, (spilledAt ?? 0) + since)
      ) - capacity[pour.cup];
    const since = calm ? SETTLED : (broke ?? 0);
    return {
      broke,
      dome:
        fill.dome > 0
          ? domeOutline(
              fill.dome,
              strain,
              (x) => waveAt(surface, x / B) * DOME_WAVE
            )
          : null,
      fill,
      half,
      height,
      lip: lipOf(pour),
      overflowing: Math.min(
        1,
        (spilt(since) - spilt(since - 0.05)) / 0.05 / SHEET_FLOW
      ),
      spillage:
        broke === null ? null : spillageOf(pour.seed, spilt, since, H, A),
      strain,
      stream: streamOf(jetOf(pour, hold, lipOf(pour)), t, surfaceY, pour.flow),
      surface,
      surfaceY,
    };
  };

  const paintInside = (frame: Frame, scene: ReturnType<typeof sceneOf>) => {
    const { pour, hold, t, clock } = frame;
    const { fill, dome, surface, height, half, stream, strain } = scene;
    paintWet(ctx, fill.level, wet);
    if (dome === null) {
      paintFlat(ctx, fill.level, surface);
    } else {
      paintDomeTop(ctx, dome, surface, fill.dome * LIFT, strain);
    }
    if (fill.glass !== null) {
      paintGlassLiquid(ctx, fill.glass, wave);
    }
    paintRipples(height, half);
    paintBubbles(height);
    paintStream(ctx, stream);
    paintFoam(ctx, stream.impact, pour.flow, clock);
    paintGlassShell(
      ctx,
      fill,
      Math.min(1, flowAt(pour, hold, t) / pour.flow),
      clock
    );
    paintDrops(false);
  };

  const draw = (frame: Frame) => {
    resize();
    const { pour, hold, t } = frame;
    if (current !== pour || t < last) {
      reset(pour);
    }
    last = t;
    const rise =
      layout.w >= layout.h && layout.w >= WIDE
        ? 0
        : frame.raise * layout.h * RAISE;
    const scene = sceneOf(frame);
    const { spillage, dome, fill } = scene;
    if (!calm) {
      evolve({ ...scene, frame, start: spillage?.start ?? 0 });
    }
    wet = Math.max(wet, fill.glass === null ? fill.level : box.floor);
    paintLayer(layers?.back, rise);
    if (spillage !== null) {
      paintPool(ctx, spillage.pool, spillage.start, pour.seed);
    }
    paintInside(frame, scene);
    paintLayer(layers?.front, rise);
    if (dome !== null) {
      paintDomeFront(ctx, dome, scene.strain, frame.clock, calm);
    }
    if (spillage !== null) {
      paintSpillage(ctx, spillage, scene.overflowing);
    }
    paintDrops(true);
    paintVessel(ctx, pour, scene.lip, angleAt(pour, hold, t));
  };

  return { draw };
};
