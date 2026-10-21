import type { Pour } from "./pour";
import {
  backWall,
  box,
  crestMark,
  drips,
  domeOutline,
  face,
  fillOf,
  grain,
  impactOf,
  joints,
  level,
  overflow,
  paint,
  project,
  radiusAt,
  raised,
  rimOf,
  ring,
  seeded,
  sideWalls,
  stamp,
  surfaceOf,
  tumbler,
  vesselScale,
  vessels,
} from "./scene";
import type { Dome, Fill, Point } from "./scene";

export interface Frame {
  pour: Pour;
  volume: number;
  stream: number;
  tilt: number;
  strain: number;
  broke: number | null;
  clock: number;
  dt: number;
}

interface Ripple {
  x: number;
  z: number;
  age: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  floor: number;
  age: number;
}

interface Layout {
  w: number;
  h: number;
  scale: number;
  cx: number;
  cy: number;
}

const TAU = Math.PI * 2;
const GRAVITY = 160;
const RIPPLE_LIFE = 1.1;
const RIPPLE_GAP = 0.13;
const SPLASH_GAP = 0.09;
const SETTLE = 0.55;
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", serif';
const H = box.height;
const GLASS_TOP = box.floor + tumbler.height;

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

const glint = (
  ctx: CanvasRenderingContext2D,
  at: Point,
  r: number,
  alpha: number
) => {
  ctx.save();
  ctx.clip();
  ctx.translate(at.x, at.y);
  ctx.scale(2.2, 0.32);
  const spot = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  spot.addColorStop(0, rgba(paint.sheen, alpha));
  spot.addColorStop(0.5, rgba(paint.sheen, alpha / 3));
  spot.addColorStop(1, rgba(paint.sheen, 0));
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
};

const paintFlat = (ctx: CanvasRenderingContext2D, y: number) => {
  const surface = level(y);
  polygon(ctx, surface);
  ctx.fillStyle = vertical(ctx, surface[0]?.y ?? 0, surface[2]?.y ?? 1, [
    [0, rgba(paint.mirror, 0.85)],
    [0.18, rgba(paint.sakeDeep, 0.7)],
    [0.6, rgba(paint.sake, 0.38)],
    [1, rgba(paint.sake, 0.26)],
  ]);
  ctx.fill();
  glint(ctx, project(-14, y, -20), 20, 0.8);
  trace(ctx, surface.slice(0, 2));
  ctx.strokeStyle = rgba(paint.sheen, 0.7);
  ctx.lineWidth = 0.5;
  ctx.stroke();
};

const paintDomeTop = (
  ctx: CanvasRenderingContext2D,
  dome: Dome,
  lift: number
) => {
  polygon(ctx, dome.outline);
  const top = Math.min(...dome.upper.map((point) => point.y));
  const bottom = dome.lower[0]?.y ?? top + 1;
  ctx.fillStyle = vertical(ctx, top, bottom, [
    [0, rgba(paint.sheen, 0.75)],
    [0.06, rgba(paint.mirror, 0.9)],
    [0.5, rgba(paint.mirror, 0.7)],
    [0.8, rgba(paint.sakeDeep, 0.6)],
    [1, rgba(paint.sake, 0.5)],
  ]);
  ctx.fill();
  glint(ctx, project(-14, H + lift * 0.9, -20), 20, 1);
  trace(ctx, dome.upper);
  ctx.strokeStyle = rgba(paint.sheen, 0.7);
  ctx.lineWidth = 0.35;
  ctx.stroke();
};

const paintDomeFront = (
  ctx: CanvasRenderingContext2D,
  dome: Dome,
  strain: number
) => {
  polygon(ctx, [...dome.crest, ...dome.lower]);
  const top = Math.min(...dome.crest.map((point) => point.y));
  ctx.fillStyle = vertical(ctx, top, dome.lower[0]?.y ?? top + 1, [
    [0, rgba(paint.sheen, 0.9)],
    [0.18, rgba(paint.sakeDeep, 0.6)],
    [0.75, rgba(paint.sake, 0.42)],
    [1, rgba(paint.sheen, 0.55)],
  ]);
  ctx.fill();
  trace(ctx, dome.crest);
  ctx.strokeStyle = rgba(paint.sheen, 0.7 + strain * 0.3);
  ctx.lineWidth = 0.3 + strain * 0.3;
  ctx.stroke();
  trace(ctx, dome.lower);
  ctx.strokeStyle = rgba(paint.woodShade, 0.8);
  ctx.lineWidth = 0.45;
  ctx.stroke();
};

const paintGlassLiquid = (
  ctx: CanvasRenderingContext2D,
  y: number,
  lift: number
) => {
  const base = box.floor + tumbler.base;
  if (y <= base + 0.2) {
    return;
  }
  const r = radiusAt(y);
  polygon(ctx, [
    ...ring(y, r, Math.PI, TAU),
    ...ring(base, radiusAt(base), 0, Math.PI),
  ]);
  ctx.fillStyle = rgba(paint.sake, 0.38);
  ctx.fill();
  const surface = ring(y + lift * 0.6, r);
  polygon(ctx, surface);
  ctx.fillStyle = vertical(ctx, surface[24]?.y ?? 0, surface[8]?.y ?? 1, [
    [0, rgba(paint.sakeDeep, 0.7)],
    [1, rgba(paint.sheen, 0.55)],
  ]);
  ctx.fill();
  if (lift > 0) {
    trace(ctx, ring(y + lift, r * 0.92, 0, Math.PI));
    ctx.strokeStyle = rgba(paint.sheen, 0.8);
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
};

const paintGlass = (
  ctx: CanvasRenderingContext2D,
  fill: Fill,
  clock: number,
  calm: boolean
) => {
  const { glass } = fill;
  if (glass === null) {
    return;
  }
  polygon(ctx, [
    ...ring(GLASS_TOP, tumbler.top, Math.PI, TAU),
    ...ring(box.floor, tumbler.bottom, 0, Math.PI),
  ]);
  const sheen = ctx.createLinearGradient(-tumbler.top, 0, tumbler.top, 0);
  sheen.addColorStop(0, rgba(paint.glass, 0.2));
  sheen.addColorStop(0.18, rgba(paint.glass, 0.05));
  sheen.addColorStop(0.7, rgba(paint.glass, 0.03));
  sheen.addColorStop(0.9, rgba(paint.glass, 0.16));
  sheen.addColorStop(1, rgba(paint.glass, 0.05));
  ctx.fillStyle = sheen;
  ctx.fill();
  paintGlassLiquid(ctx, glass.level, glass.dome);
  if (glass.over) {
    const sway = (y: number, i: number) =>
      calm ? 0 : Math.sin(y * 0.4 + clock * 6 + i) * 0.04;
    for (const line of overflow(Math.max(fill.level, box.floor), sway)) {
      trace(ctx, line);
      ctx.strokeStyle = rgba(paint.sake, 0.55);
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.strokeStyle = rgba(paint.sheen, 0.65);
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
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
  tilt: number
) => {
  const vessel = vessels[pour.bottle];
  ctx.save();
  ctx.translate(anchor.x, anchor.y);
  ctx.scale(-vesselScale, vesselScale);
  ctx.rotate(vessel.rest + (vessel.tip - vessel.rest) * tilt);
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

const paintPuddle = (ctx: CanvasRenderingContext2D, broke: number) => {
  const spread = 1 - (1 - Math.min(1, broke / 1.4)) ** 2;
  const centre = project(-4, 0, box.outer + 12);
  const rx = 20 + 46 * spread;
  const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  pool.addColorStop(0, rgba(paint.sake, 0.3));
  pool.addColorStop(0.7, rgba(paint.sake, 0.16));
  pool.addColorStop(0.9, rgba(paint.sheen, 0.22));
  pool.addColorStop(1, rgba(paint.sheen, 0));
  ctx.save();
  ctx.translate(centre.x, centre.y);
  ctx.scale(1, 0.22);
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, TAU);
  ctx.fillStyle = pool;
  ctx.fill();
  ctx.restore();
};

const paintDrip = (
  ctx: CanvasRenderingContext2D,
  drip: ReturnType<typeof drips>[number]
) => {
  const { top, bottom, width } = drip;
  const half = width / 2;
  const across = ctx.createLinearGradient(top.x - half, 0, top.x + half, 0);
  across.addColorStop(0, rgba(paint.sakeDeep, 0.45));
  across.addColorStop(0.3, rgba(paint.sheen, 0.85));
  across.addColorStop(0.6, rgba(paint.sake, 0.45));
  across.addColorStop(1, rgba(paint.sakeDeep, 0.35));
  ctx.fillStyle = across;
  ctx.beginPath();
  ctx.moveTo(top.x - half, top.y);
  ctx.lineTo(bottom.x - half * 0.7, bottom.y - half);
  ctx.arc(bottom.x, bottom.y - half * 0.3, half * 0.85, Math.PI, 0, true);
  ctx.lineTo(top.x + half, top.y);
  ctx.closePath();
  ctx.fill();
};

const paintSpill = (ctx: CanvasRenderingContext2D, broke: number) => {
  const grow = 1 - (1 - Math.min(1, broke / 0.9)) ** 3;
  const film = drips(grow);
  const left = (film[0]?.top.x ?? 0) - 4;
  const right = (film.at(-1)?.top.x ?? 0) + 4;
  const top = project(0, H, box.outer).y;
  ctx.fillStyle = vertical(ctx, top, top + 4, [
    [0, rgba(paint.sheen, 0.7)],
    [1, rgba(paint.sake, 0)],
  ]);
  ctx.fillRect(left, top - 0.4, right - left, 4 * grow + 0.4);
  for (const drip of film) {
    if (drip.bottom.y - drip.top.y > drip.width) {
      paintDrip(ctx, drip);
    }
  }
};

const paintStream = (
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  frame: Frame
) => {
  if (frame.stream <= 0.02) {
    return;
  }
  const thick =
    Math.min(1.4, frame.stream) ** 0.5 * (1.1 + frame.pour.flow * 7);
  const bend = { x: from.x - 4, y: from.y + (to.y - from.y) * 0.25 };
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i <= 16; i += 1) {
    const t = i / 16;
    const x = (1 - t) ** 2 * from.x + 2 * (1 - t) * t * bend.x + t * t * to.x;
    const y = (1 - t) ** 2 * from.y + 2 * (1 - t) * t * bend.y + t * t * to.y;
    const half = (thick * (1 - 0.4 * t)) / 2;
    left.push({ x: x - half, y });
    right.push({ x: x + half, y });
  }
  polygon(ctx, [...left, ...right.toReversed()]);
  const body = ctx.createLinearGradient(from.x - thick, 0, from.x + thick, 0);
  body.addColorStop(0, rgba(paint.sakeDeep, 0.55));
  body.addColorStop(0.45, rgba(paint.sheen, 0.85));
  body.addColorStop(1, rgba(paint.sake, 0.5));
  ctx.fillStyle = body;
  ctx.fill();
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
  let ripples: Ripple[] = [];
  let drops: Drop[] = [];
  let since = 0;
  let splashed = 0;
  let wobble = 0;
  let current: Pour | null = null;
  let burst = false;

  const toCup = (target: CanvasRenderingContext2D) => {
    target.setTransform(
      dpr * layout.scale,
      0,
      0,
      dpr * layout.scale,
      dpr * layout.cx,
      dpr * layout.cy
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

  const spray = (from: Point, count: number, speed: number, floor: number) => {
    for (let i = 0; i < count; i += 1) {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const push = speed * (0.4 + Math.random() * 0.6);
      drops.push({
        age: 0,
        floor,
        r: 0.4 + Math.random() * 0.9,
        vx: Math.cos(angle) * push,
        vy: Math.sin(angle) * push,
        x: from.x,
        y: from.y,
      });
    }
  };

  const evolve = (frame: Frame, fill: Fill, impact: Point) => {
    const { dt } = frame;
    for (const ripple of ripples) {
      ripple.age += dt;
    }
    ripples = ripples.filter((ripple) => ripple.age < RIPPLE_LIFE);
    for (const drop of drops) {
      drop.age += dt;
      drop.vy += GRAVITY * dt;
      drop.x += drop.vx * dt;
      drop.y += drop.vy * dt;
    }
    drops = drops.filter((drop) => drop.y < drop.floor && drop.age < 3);
    const target =
      0.025 * Math.min(1.5, frame.stream) + frame.strain ** 4 * 0.07;
    wobble += (target - wobble) * Math.min(1, dt / SETTLE);
    if (frame.stream > 0.02) {
      since += dt;
      splashed += dt;
      if (since > RIPPLE_GAP) {
        since = 0;
        ripples.push({ age: 0, ...impactOf(fill) });
      }
      if (splashed > SPLASH_GAP && frame.stream > 0.8) {
        splashed = 0;
        spray(impact, 1 + Math.floor(Math.random() * 2), 30, impact.y + 2);
      }
    }
    if (frame.broke !== null && !burst) {
      burst = true;
      spray(project(-6, H + 2, box.inner), 26, 70, project(0, 0, 74).y);
    }
  };

  const paintRipples = (y: number) => {
    for (const ripple of ripples) {
      const t = ripple.age / RIPPLE_LIFE;
      const r = 2 + t * 30;
      trace(
        ctx,
        Array.from({ length: 29 }, (_, i) => {
          const a = (i / 28) * TAU;
          return project(
            ripple.x + Math.cos(a) * r,
            y,
            ripple.z + Math.sin(a) * r
          );
        })
      );
      ctx.strokeStyle = rgba(paint.sheen, 0.35 * (1 - t));
      ctx.lineWidth = 0.35;
      ctx.stroke();
    }
  };

  const paintDrops = () => {
    ctx.fillStyle = rgba(paint.sheen, 0.85);
    for (const drop of drops) {
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.r, 0, TAU);
      ctx.fill();
    }
  };

  const paintLayer = (image: HTMLCanvasElement | undefined) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (image) {
      ctx.drawImage(image, 0, 0);
    }
    toCup(ctx);
  };

  const draw = (frame: Frame) => {
    resize();
    if (current !== frame.pour) {
      current = frame.pour;
      ripples = [];
      drops = [];
      wobble = 0;
      burst = false;
    }
    const fill = fillOf(frame.pour, frame.volume);
    const top = fill.glass === null ? H : GLASS_TOP;
    const anchor = project(14, top + vessels[frame.pour.bottle].drop, 0);
    const hit = impactOf(fill);
    const impact = project(hit.x, surfaceOf(fill), hit.z);
    if (!calm) {
      evolve(frame, fill, impact);
    }
    paintLayer(layers?.back);
    if (frame.broke !== null) {
      paintPuddle(ctx, frame.broke);
    }
    const amp = calm ? 0 : wobble;
    const wave = (x: number, z: number) =>
      amp *
      (Math.sin(frame.clock * 5.2) * 0.6 +
        Math.sin(x * 0.11 + frame.clock * 7.4) *
          Math.cos(z * 0.09 - frame.clock * 5.3));
    const dome = fill.dome > 0 ? domeOutline(fill.dome, wave) : null;
    if (dome === null) {
      paintFlat(ctx, fill.level);
    } else {
      paintDomeTop(ctx, dome, raised(fill));
    }
    if (fill.glass === null) {
      paintRipples(surfaceOf(fill));
    }
    paintStream(ctx, anchor, impact, frame);
    paintGlass(ctx, fill, frame.clock, calm);
    paintLayer(layers?.front);
    if (dome !== null) {
      paintDomeFront(ctx, dome, frame.strain);
    }
    if (frame.broke !== null) {
      paintSpill(ctx, frame.broke);
    }
    paintDrops();
    paintVessel(ctx, frame.pour, anchor, frame.tilt);
  };

  return { draw };
};
