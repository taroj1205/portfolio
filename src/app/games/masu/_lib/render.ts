import {
  createWave,
  pushWave,
  spillageOf,
  stepWave,
  streamOf,
  tiltAt,
  waveAt,
} from "./liquid";
import type { Bead, Impact, Run, Stream, Wave } from "./liquid";
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
  awayAt,
  backWall,
  box,
  camera,
  crestMark,
  crestOf,
  frontOf,
  domeHeight,
  domeOutline,
  face,
  fillOf,
  grain,
  joints,
  layoutOf,
  level,
  lipOf,
  paint,
  poseOf,
  project,
  radiusAt,
  rimOf,
  ring,
  seeded,
  shoulderOf,
  sideWalls,
  spoutAt,
  stamp,
  tumbler,
  vessels,
} from "./scene";
import type { Demo, Dome, Fill, Layout, Point } from "./scene";

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

interface Scene {
  frame: Frame;
  stream: Stream;
  half: number;
  strain: number;
  broke: number | null;
  start: number;
  surfaceY: (x: number) => number;
}

type Rgb = [number, number, number];

interface Vec {
  x: number;
  y: number;
  z: number;
}

const TAU = Math.PI * 2;
const GRAVITY = 9810;
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", serif';
const H = box.height;
const B = box.inner;
const A = box.outer;
const GLASS_TOP = box.floor + tumbler.height;
const still = createWave(2);
const WIDE = 720;
const RESULT = 0.32;
const SHEET_FLOW = 40;
const COLUMNS = 40;
const LIP_SPEED = 130;
const LIP_GAIN = 240;
const IMPACT_Z = 3;
const DOME_WAVE = 1.4;
const PUSH = 5;
const QUIVER = 160;
const SPLASH = 26;
const BUBBLES = 14;
const SPRAY = 30;
const SETTLED = 60;
const COUNTER_Z = A + 12;
const TEXTURE = 48;
const STRIPS = TEXTURE;
const STEEPEST = 0.32;
const RELIEF = 2.2;
const BANDS = 20;
const FILMED = 0.08;

const LOW_LAMP: Vec = { x: -40, y: 420, z: -1400 };
const HIGH_LAMP: Vec = { x: -70, y: 700, z: -40 };
const LAMP: Rgb = [255, 222, 168];
const ROOM: Rgb = [38, 22, 13];
const WOOD: Rgb = [216, 180, 124];
const WOOD_DEEP: Rgb = [146, 112, 74];
const GLASS_GROUND: Rgb = [150, 104, 52];
const ABSORB: Rgb = [0.0009, 0.0026, 0.0078];
const GLOW: Rgb = [214, 160, 86];
const BOKEH = [
  [-0.42, 0.3, 0.9],
  [-0.12, 0.38, 0.7],
  [0.16, 0.26, 1],
  [0.4, 0.34, 0.6],
] as const;
const F0 = 0.02;

const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = [1, 3, 5].map((at) =>
    Number.parseInt(hex.slice(at, at + 2), 16)
  );
  return `rgb(${r} ${g} ${b} / ${alpha.toFixed(3)})`;
};

const css = ([r, g, b]: Rgb, alpha = 1) =>
  `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${alpha.toFixed(3)})`;

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

const mixPoints = (from: readonly Point[], to: readonly Point[], t: number) =>
  from.map((point, i) => {
    const target = to[i] ?? point;
    return {
      x: point.x + (target.x - point.x) * t,
      y: point.y + (target.y - point.y) * t,
    };
  });

const normalise = (v: Vec): Vec => {
  const size = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / size, y: v.y / size, z: v.z / size };
};

const toward = (from: Vec, to: Vec) =>
  normalise({ x: to.x - from.x, y: to.y - from.y, z: to.z - from.z });

const dot = (a: Vec, b: Vec) => a.x * b.x + a.y * b.y + a.z * b.z;

const smooth = (from: number, to: number, t: number) => {
  const p = Math.min(1, Math.max(0, (t - from) / (to - from)));
  return p * p * (3 - 2 * p);
};

interface Look {
  ground: Rgb;
  path: number;
  walls: boolean;
}

const wallHit = (at: Vec, bounce: Vec) => {
  let reach = Infinity;
  if (bounce.z !== 0) {
    reach = (B - Math.sign(bounce.z) * at.z) / Math.abs(bounce.z);
  }
  if (bounce.x !== 0) {
    reach = Math.min(
      reach,
      (B - Math.sign(bounce.x) * at.x) / Math.abs(bounce.x)
    );
  }
  return at.y + reach * bounce.y;
};

const lightOf = (normal: Vec, at: Vec, look: Look, out: Rgb) => {
  const n = normalise(normal);
  const view = toward(at, camera);
  const facing = Math.max(0.02, dot(n, view));
  const bounce = {
    x: 2 * facing * n.x - view.x,
    y: 2 * facing * n.y - view.y,
    z: 2 * facing * n.z - view.z,
  };
  const fresnel = F0 + (1 - F0) * (1 - facing) ** 5;
  const hit = look.walls ? wallHit(at, bounce) : Infinity;
  const wall = 1 - smooth(H - 2, H + 1, hit);
  const glance =
    Math.max(0, dot(bounce, toward(at, LOW_LAMP))) ** 22_000 * 0.85 +
    Math.max(0, dot(bounce, toward(at, HIGH_LAMP))) ** 90 * 0.6;
  const lit = 0.7 + (0.3 * (Math.min(H, hit) - box.floor)) / (H - box.floor);
  const across = Math.atan2(bounce.x, -bounce.z);
  const up = Math.asin(Math.min(1, Math.max(-1, bounce.y)));
  const bokeh = BOKEH.reduce(
    (sum, [x, y, glow]) =>
      sum + glow * Math.exp(-((across - x) ** 2 + (up - y) ** 2) / 0.006),
    0
  );
  for (let c = 0; c < 3; c += 1) {
    const through = Math.exp(-(ABSORB[c] ?? 0) * look.path);
    const seen =
      (look.ground[c] ?? 0) * through + (GLOW[c] ?? 0) * (1 - through) * 0.35;
    const room =
      (ROOM[c] ?? 0) * (0.7 + 0.6 * Math.max(0, bounce.y)) +
      (LAMP[c] ?? 0) * 0.55 * bokeh;
    const mirror = room + ((WOOD[c] ?? 0) * lit - room) * wall;
    out[c] =
      seen * (1 - fresnel) +
      mirror * fresnel +
      (LAMP[c] ?? 0) * glance * (1 - wall);
  }
  return out;
};

interface Sheet {
  wave: Wave;
  half: number;
  y: number;
  depth: number;
  walls: boolean;
  dome: { lift: number; reach: number } | null;
  ground: Rgb;
}

const throughTo = (
  depth: number,
  toBack: number,
  deep: Rgb,
  walls: boolean,
  ground: Rgb
): Look => {
  const floor = smooth(0.7, 1.3, depth / Math.max(1e-3, toBack));
  for (let c = 0; c < 3; c += 1) {
    ground[c] = (WOOD[c] ?? 0) + ((deep[c] ?? 0) - (WOOD[c] ?? 0)) * floor;
  }
  return {
    ground,
    path: Math.SQRT2 * Math.max(0, Math.min(depth, toBack)),
    walls,
  };
};

const edgeSlope = (inset: number, reach: number) => {
  if (inset <= 0) {
    return 0;
  }
  const t = Math.tanh(inset / reach);
  return (1 - t * t) / reach;
};

const createShade = () => {
  const canvas = document.createElement("canvas");
  canvas.width = TEXTURE;
  canvas.height = TEXTURE;
  const target = canvas.getContext("2d");
  if (!target) {
    throw new Error("Canvas 2D is not available");
  }
  const image = target.createImageData(TEXTURE, TEXTURE);
  const colour: Rgb = [0, 0, 0];
  const ground: Rgb = [0, 0, 0];
  return (sheet: Sheet) => {
    const { data } = image;
    for (let j = 0; j < TEXTURE; j += 1) {
      const v = ((j + 0.5) / TEXTURE) * 2 - 1;
      const z = v * sheet.half;
      for (let i = 0; i < TEXTURE; i += 1) {
        const u = ((i + 0.5) / TEXTURE) * 2 - 1;
        const x = u * sheet.half;
        const tilt = tiltAt(sheet.wave, u, v, sheet.half / RELIEF, STEEPEST);
        let gx = tilt.x;
        let gz = tilt.z;
        let y = sheet.y + waveAt(sheet.wave, u, v);
        if (sheet.dome !== null) {
          const { lift, reach } = sheet.dome;
          const ex = Math.tanh(Math.max(0, B - Math.abs(x)) / reach);
          const ez = Math.tanh(Math.max(0, B - Math.abs(z)) / reach);
          gx -= Math.sign(x) * lift * edgeSlope(B - Math.abs(x), reach) * ez;
          gz -= Math.sign(z) * lift * edgeSlope(B - Math.abs(z), reach) * ex;
          y += lift * (ex * ez - 1);
        }
        lightOf(
          { x: -gx, y: 1, z: -gz },
          { x, y, z },
          throughTo(
            sheet.depth,
            z + sheet.half,
            sheet.ground,
            sheet.walls,
            ground
          ),
          colour
        );
        const k = (j * TEXTURE + i) * 4;
        [data[k], data[k + 1], data[k + 2]] = colour;
        data[k + 3] = 255;
      }
    }
    target.putImageData(image, 0, 0);
    return canvas;
  };
};

const paintSheet = (
  ctx: CanvasRenderingContext2D,
  texture: HTMLCanvasElement,
  y: number,
  half: number
) => {
  const rows = TEXTURE / STRIPS;
  for (let k = 0; k < STRIPS; k += 1) {
    const back = -half + (2 * half * k) / STRIPS;
    const front = -half + (2 * half * (k + 1)) / STRIPS;
    const from = project(-half, y, back);
    const left = project(-half, y, front);
    const right = project(half, y, front);
    ctx.save();
    ctx.transform(
      right.x - left.x,
      0,
      left.x - from.x,
      left.y - from.y,
      from.x,
      from.y
    );
    const taken = Math.min(rows + 1, TEXTURE - k * rows);
    ctx.drawImage(texture, 0, k * rows, TEXTURE, taken, 0, 0, 1, taken / rows);
    ctx.restore();
  }
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
    core.push({
      x: bead.x + nx * bead.r * 0.45,
      y: bead.y + ny * bead.r * 0.45,
    });
    width += bead.r / thread.length;
  }
  polygon(ctx, [...left, ...right.toReversed()]);
  ctx.fillStyle = rgba(paint.sake, 0.5);
  ctx.fill();
  for (const edge of [left, right]) {
    trace(ctx, edge);
    ctx.strokeStyle = rgba(paint.amber, 0.28);
    ctx.lineWidth = Math.max(0.12, width * 0.3);
    ctx.stroke();
  }
  trace(ctx, core);
  ctx.strokeStyle = rgba(paint.straw, 0.7);
  ctx.lineWidth = Math.max(0.1, width * 0.5);
  ctx.stroke();
  ctx.strokeStyle = rgba(paint.sheen, 0.85);
  ctx.lineWidth = Math.max(0.08, width * 0.18);
  ctx.stroke();
};

const paintBead = (ctx: CanvasRenderingContext2D, bead: Bead) => {
  ctx.fillStyle = rgba(paint.sake, 0.7);
  ctx.beginPath();
  ctx.ellipse(bead.x, bead.y, bead.r * 0.9, bead.r * 1.1, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = rgba(paint.sheen, 0.85);
  ctx.beginPath();
  ctx.arc(bead.x - bead.r * 0.3, bead.y - bead.r * 0.35, bead.r * 0.3, 0, TAU);
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
  foam.addColorStop(0, rgba(paint.sheen, 0.7 * Math.min(1, q + 0.2)));
  foam.addColorStop(0.45, rgba(paint.straw, 0.32 * Math.min(1, q + 0.2)));
  foam.addColorStop(1, rgba(paint.straw, 0));
  ctx.fillStyle = foam;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.restore();
};

const MENISCUS = 1.6;

const paintMeniscus = (
  ctx: CanvasRenderingContext2D,
  y: number,
  wave: Wave
) => {
  const edges = [
    {
      inward: { x: 0, z: MENISCUS },
      spots: columns.map((x) => ({ x, z: -B })),
    },
    {
      inward: { x: MENISCUS, z: 0 },
      spots: columns.map((z) => ({ x: -B, z })),
    },
    {
      inward: { x: -MENISCUS, z: 0 },
      spots: columns.map((z) => ({ x: B, z })),
    },
  ];
  for (const { inward, spots } of edges) {
    const outer = spots.map(({ x, z }) =>
      project(x, y + waveAt(wave, x / B, z / B), z)
    );
    const inner = spots.map(({ x, z }) =>
      project(x + inward.x, y + waveAt(wave, x / B, z / B), z + inward.z)
    );
    for (const [reach, alpha] of [
      [1, 0.14],
      [0.45, 0.16],
    ] as const) {
      polygon(ctx, [...outer, ...mixPoints(outer, inner, reach).toReversed()]);
      ctx.fillStyle = rgba(paint.amber, alpha);
      ctx.fill();
    }
  }
};

const paintFlat = (
  ctx: CanvasRenderingContext2D,
  y: number,
  wave: Wave,
  texture: HTMLCanvasElement
) => {
  if (y <= box.floor + 0.15) {
    return;
  }
  const back = columns.map((x) => project(x, y + waveAt(wave, x / B, -1), -B));
  polygon(ctx, [...back, project(B, y, B), project(-B, y, B)]);
  ctx.save();
  ctx.clip();
  paintSheet(ctx, texture, y, B);
  ctx.restore();
  paintMeniscus(ctx, y, wave);
};

const below: Rgb = [0, 0, 0];

const profileOf = (t: number, lift: number, reach: number, out: Rgb) => {
  const z = B - reach * Math.atanh(Math.min(0.999, t));
  lightOf(
    { x: 0, y: 1, z: (lift / reach) * (1 - t * t) },
    { x: 0, y: H + t * lift, z },
    throughTo(H - box.floor + t * lift, z + B, WOOD_DEEP, false, below),
    out
  );
  const edge = smooth(0, 0.16, t);
  out[0] *= 0.55 + 0.45 * edge;
  out[1] *= 0.5 + 0.5 * edge;
  out[2] *= 0.45 + 0.55 * edge;
  return out;
};

const paintDome = (
  ctx: CanvasRenderingContext2D,
  dome: Dome,
  texture: HTMLCanvasElement,
  lift: number,
  reach: number,
  crestAt: number
) => {
  const colour: Rgb = [0, 0, 0];
  polygon(ctx, dome.outline);
  ctx.fillStyle = css(profileOf(crestAt, lift, reach, colour));
  ctx.fill();
  ctx.save();
  ctx.clip();
  paintSheet(ctx, texture, H + lift, B);
  ctx.restore();
  const rim = dome.lower.toReversed();
  for (let k = BANDS; k >= 1; k -= 1) {
    const t = k / BANDS;
    polygon(ctx, [...mixPoints(rim, dome.crest, t), ...dome.lower]);
    ctx.fillStyle = css(
      profileOf((t - 0.5 / BANDS) * crestAt, lift, reach, colour),
      Math.min(1, (1 - t) / 0.18 + 0.08)
    );
    ctx.fill();
  }
  const shade = ctx.createLinearGradient(-B, 0, B, 0);
  shade.addColorStop(0, rgba(paint.amber, 0.3));
  shade.addColorStop(0.18, rgba(paint.amber, 0));
  shade.addColorStop(0.82, rgba(paint.amber, 0));
  shade.addColorStop(1, rgba(paint.amber, 0.3));
  polygon(ctx, [...dome.crest, ...dome.lower]);
  ctx.fillStyle = shade;
  ctx.fill();
  const glow = ctx.createLinearGradient(-B, 0, B, 0);
  glow.addColorStop(0.04, rgba(paint.sheen, 0));
  glow.addColorStop(0.3, rgba(paint.sheen, 0.2));
  glow.addColorStop(0.62, rgba(paint.sheen, 0.12));
  glow.addColorStop(0.96, rgba(paint.sheen, 0));
  ctx.save();
  polygon(ctx, dome.outline);
  ctx.clip();
  ctx.fillStyle = glow;
  for (const band of [1.6, 0.6]) {
    polygon(ctx, [
      ...dome.upper,
      ...dome.upper
        .toReversed()
        .map((point) => ({ ...point, y: point.y + band })),
    ]);
    ctx.fill();
  }
  ctx.restore();
};

const paintGlassLiquid = (
  ctx: CanvasRenderingContext2D,
  glass: NonNullable<Fill["glass"]>,
  from: number,
  texture: HTMLCanvasElement
) => {
  const base = Math.max(from, box.floor + tumbler.base);
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
  across.addColorStop(0, rgba(paint.straw, 0.62));
  across.addColorStop(0.08, rgba(paint.sakeDeep, 0.85));
  across.addColorStop(0.3, rgba(paint.amber, 0.8));
  across.addColorStop(0.62, rgba(paint.sakeDeep, 0.78));
  across.addColorStop(0.9, rgba(paint.amber, 0.85));
  across.addColorStop(1, rgba(paint.straw, 0.5));
  ctx.fillStyle = across;
  ctx.fill();
  polygon(ctx, ring(y, r, 0, TAU, 40));
  ctx.save();
  ctx.clip();
  paintSheet(ctx, texture, y, r);
  ctx.restore();
  const back = ring(y, r, Math.PI, TAU, 40);
  const inner = ring(y, r - 1.4, Math.PI, TAU, 40);
  polygon(ctx, [...back, ...inner.toReversed()]);
  const glow = ctx.createLinearGradient(-r, 0, r, 0);
  glow.addColorStop(0, rgba(paint.sheen, 0));
  glow.addColorStop(0.3, rgba(paint.sheen, 0.28));
  glow.addColorStop(0.7, rgba(paint.sheen, 0.18));
  glow.addColorStop(1, rgba(paint.sheen, 0));
  ctx.fillStyle = glow;
  ctx.fill();
};

const onGlass = (angle: number, y: number, gap: number) => {
  const r = radiusAt(y) + gap;
  return project(Math.cos(angle) * r, y, Math.sin(angle) * r);
};

const streak = (
  ctx: CanvasRenderingContext2D,
  angle: number,
  width: number,
  from: number,
  to: number,
  alpha: number
) => {
  const top = onGlass(angle, to, 0.05);
  const bottom = onGlass(angle, from, 0.05);
  polygon(ctx, [
    onGlass(angle - width, to, 0.05),
    onGlass(angle + width, to, 0.05),
    onGlass(angle + width, from, 0.05),
    onGlass(angle - width, from, 0.05),
  ]);
  ctx.fillStyle = vertical(ctx, top.y, bottom.y, [
    [0, rgba(paint.glass, 0)],
    [0.12, rgba(paint.glass, alpha)],
    [0.7, rgba(paint.glass, alpha * 0.5)],
    [1, rgba(paint.glass, 0)],
  ]);
  ctx.fill();
};

const paintGlassShell = (
  ctx: CanvasRenderingContext2D,
  fill: Fill,
  from: number,
  film: number,
  clock: number,
  seed: number
) => {
  const { glass } = fill;
  if (glass === null) {
    return;
  }
  const shell = [
    ...ring(GLASS_TOP, tumbler.top, Math.PI, TAU),
    ...ring(from, radiusAt(from), 0, Math.PI),
  ];
  polygon(ctx, shell);
  const sheen = ctx.createLinearGradient(-tumbler.top, 0, tumbler.top, 0);
  sheen.addColorStop(0, rgba(paint.glass, 0.1));
  sheen.addColorStop(0.06, rgba(paint.glass, 0.02));
  sheen.addColorStop(0.94, rgba(paint.glass, 0.02));
  sheen.addColorStop(1, rgba(paint.glass, 0.08));
  ctx.fillStyle = sheen;
  ctx.fill();
  if (glass.over) {
    const sheet = [
      ...ring(GLASS_TOP, tumbler.top + 0.45, 0, Math.PI),
      ...ring(from, radiusAt(from) + 0.45, Math.PI, 0),
    ];
    polygon(ctx, sheet);
    ctx.fillStyle = rgba(paint.sake, 0.06 + 0.12 * film);
    ctx.fill();
    const roll = seeded(seed + 7);
    for (let k = 0; k < 4; k += 1) {
      const angle = 0.55 + (k + 0.2 + roll() * 0.6) * ((Math.PI - 1.1) / 4);
      const width = (0.012 + 0.02 * roll()) * (0.4 + Math.cbrt(film));
      const top = project(0, GLASS_TOP, tumbler.top).y;
      const bottom = project(0, from, radiusAt(from)).y;
      const pulse = (clock * 1.3 + roll()) % 1;
      polygon(ctx, [
        onGlass(angle - width, GLASS_TOP, 0.5),
        onGlass(angle + width, GLASS_TOP, 0.5),
        onGlass(angle + width * 1.4, from, 0.5),
        onGlass(angle - width * 1.4, from, 0.5),
      ]);
      ctx.fillStyle = vertical(ctx, top, bottom, [
        [0, rgba(paint.sakeDeep, 0.3 * film + 0.08)],
        [Math.max(0.01, pulse - 0.08), rgba(paint.sake, 0.22 * film + 0.06)],
        [pulse, rgba(paint.straw, 0.55 * film + 0.1)],
        [Math.min(0.99, pulse + 0.08), rgba(paint.sake, 0.22 * film + 0.06)],
        [1, rgba(paint.sakeDeep, 0.32 * film + 0.1)],
      ]);
      ctx.fill();
    }
    const lipTop = ring(
      GLASS_TOP + glass.dome * 0.35,
      tumbler.top + 0.2,
      0,
      Math.PI
    );
    const lipLow = ring(GLASS_TOP - 1.4, tumbler.top + 0.45, Math.PI, 0);
    polygon(ctx, [...lipTop, ...lipLow]);
    ctx.fillStyle = vertical(
      ctx,
      Math.min(...lipTop.map((p) => p.y)),
      Math.max(...lipLow.map((p) => p.y)),
      [
        [0, rgba(paint.sheen, 0.5)],
        [0.35, rgba(paint.straw, 0.32)],
        [1, rgba(paint.sake, 0.08)],
      ]
    );
    ctx.fill();
  }
  streak(ctx, Math.PI - 0.32, 0.07, from + 2, GLASS_TOP - 1.5, 0.32);
  streak(ctx, Math.PI - 0.12, 0.03, from + 2, GLASS_TOP - 1, 0.2);
  streak(ctx, 0.2, 0.05, from + 2, GLASS_TOP - 2, 0.14);
  for (const [start, end, alpha, width] of [
    [Math.PI, TAU, 0.28, 0.3],
    [0, Math.PI, 0.1, 1.1],
    [0, Math.PI, 0.5, 0.32],
  ] as const) {
    trace(ctx, ring(GLASS_TOP, tumbler.top, start, end, 40));
    ctx.strokeStyle = rgba(paint.glass, alpha);
    ctx.lineWidth = width;
    ctx.stroke();
  }
};

const paintPool = (
  ctx: CanvasRenderingContext2D,
  outline: readonly Point[],
  mirror: () => void
) => {
  if (outline.length < 3) {
    return;
  }
  const foot = project(0, 0, A).y;
  const far = Math.max(...outline.map((point) => point.y));
  const front = frontOf(outline);
  ctx.save();
  polygon(ctx, outline);
  ctx.clip();
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = rgba(paint.woodDark, 0.5);
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 0.5;
  mirror();
  ctx.globalAlpha = 1;
  ctx.fillStyle = vertical(ctx, foot, far, [
    [0, rgba(paint.counterDark, 0)],
    [1, rgba(paint.counterDark, 0.35)],
  ]);
  ctx.fill();
  for (const [width, alpha] of [
    [2.4, 0.1],
    [1.1, 0.14],
  ] as const) {
    ctx.strokeStyle = rgba(paint.shadow, alpha);
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.translate(front.x * 0.35 - 6, foot + (front.y - foot) * 0.62);
  ctx.scale(4, 0.5);
  const spot = ctx.createRadialGradient(0, 0, 0, 0, 0, 3);
  spot.addColorStop(0, rgba(paint.sheen, 0.42));
  spot.addColorStop(0.5, rgba(paint.lamp, 0.12));
  spot.addColorStop(1, rgba(paint.lamp, 0));
  ctx.fillStyle = spot;
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, TAU);
  ctx.fill();
  ctx.restore();
};

const paintFilm = (
  ctx: CanvasRenderingContext2D,
  path: readonly Run[],
  width: (bead: Run) => number,
  colour: string | CanvasGradient
) => {
  const left: Point[] = [];
  const right: Point[] = [];
  for (const bead of path) {
    const point = project(bead.x, bead.y, A + 0.3);
    const r = width(bead);
    left.push({ x: point.x - r, y: point.y });
    right.push({ x: point.x + r, y: point.y });
  }
  polygon(ctx, [...left, ...right.toReversed()]);
  ctx.fillStyle = colour;
  ctx.fill();
};

const paintSpillage = (
  ctx: CanvasRenderingContext2D,
  spillage: ReturnType<typeof spillageOf>,
  flux: number
) => {
  ctx.save();
  polygon(ctx, face);
  ctx.clip();
  ctx.globalCompositeOperation = "multiply";
  for (const rivulet of spillage.rivulets) {
    if (rivulet.path.length > 1) {
      paintFilm(
        ctx,
        rivulet.path,
        (bead) => bead.wet,
        rgba(paint.endGrain, 0.55)
      );
      paintFilm(
        ctx,
        rivulet.path.filter((bead) => bead.r > FILMED),
        (bead) => bead.r,
        rgba(paint.sake, 0.95)
      );
    }
  }
  const soaked = spillage.pool.outline.map(({ x }) => x);
  if (soaked.length > 0) {
    const foot = project(0, 0, A).y;
    const from = Math.max(-A, Math.min(...soaked));
    ctx.fillStyle = vertical(ctx, foot - 5, foot, [
      [0, rgba(paint.endGrain, 0)],
      [1, rgba(paint.endGrain, 0.8)],
    ]);
    ctx.fillRect(from, foot - 5, Math.min(A, Math.max(...soaked)) - from, 5);
  }
  ctx.globalCompositeOperation = "source-over";
  for (const rivulet of spillage.rivulets) {
    const live = rivulet.path.filter((bead) => bead.r > FILMED);
    if (live.length > 1) {
      const top = project(0, live[0]?.y ?? H, A).y;
      const bottom = project(0, live.at(-1)?.y ?? 0, A).y;
      paintFilm(
        ctx,
        live.map((bead) => ({ ...bead, x: bead.x - bead.r * 0.45 })),
        (bead) => bead.r * 0.16,
        vertical(ctx, top, Math.max(top + 1, bottom), [
          [0, rgba(paint.sheen, 0.5)],
          [0.6, rgba(paint.sheen, 0.22)],
          [1, rgba(paint.sheen, 0.35)],
        ])
      );
    }
    const head = rivulet.path.at(-1);
    if (head && rivulet.flux > 0.05 && rivulet.front < H) {
      const point = project(head.x, head.y, A + 0.5);
      const r = Math.max(0.7, head.r * 1.45);
      ctx.fillStyle = rgba(paint.amber, 0.3);
      ctx.beginPath();
      ctx.ellipse(point.x, point.y + r * 0.18, r * 1.02, r * 1.12, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(paint.sake, 0.55);
      ctx.beginPath();
      ctx.ellipse(point.x, point.y, r * 0.92, r, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(paint.sheen, 0.8);
      ctx.beginPath();
      ctx.ellipse(
        point.x - r * 0.32,
        point.y - r * 0.38,
        r * 0.26,
        r * 0.2,
        0,
        0,
        TAU
      );
      ctx.fill();
    }
  }
  ctx.restore();
  const from = Math.max(-A, spillage.start - spillage.sheet / 2);
  const to = Math.min(A, spillage.start + spillage.sheet / 2);
  if (to > from) {
    polygon(ctx, [
      project(from, H + 0.3, B),
      project(to, H + 0.3, B),
      project(to, H + 0.2, A + 0.4),
      project(from, H + 0.2, A + 0.4),
    ]);
    ctx.globalCompositeOperation = "multiply";
    ctx.fillStyle = rgba(paint.sake, 0.7 + 0.3 * Math.min(1, flux));
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    const near = project(0, H + 0.3, B).y;
    const outer = project(0, H + 0.2, A + 0.4).y;
    ctx.fillStyle = vertical(ctx, near, outer, [
      [0, rgba(paint.sheen, 0)],
      [0.7, rgba(paint.sheen, 0.03 + 0.09 * Math.min(1, flux))],
      [1, rgba(paint.sheen, 0)],
    ]);
    ctx.fill();
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
  angle: number,
  size: number
) => {
  const vessel = vessels[pour.bottle];
  const { a, b, c, d } = poseOf(angle, size);
  ctx.save();
  ctx.transform(a, b, c, d, anchor.x, anchor.y);
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

export const createRenderer = (
  canvas: HTMLCanvasElement,
  calm: boolean,
  demo: Demo
) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  let layout = layoutOf(1, 1, demo);
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
  let burst = false;
  let splashing = 0;
  let bubbling = 0;
  const shade = createShade();
  const shadeMasu = createShade();

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
    const key = `${w}x${h}@${dpr}`;
    if (layers?.key !== key) {
      layout = layoutOf(w, h, demo);
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

  const evolve = (scene: Scene) => {
    const { frame, stream, half, strain, broke, start, surfaceY } = scene;
    const { dt, pour } = frame;
    stepWave(wave, dt, half * 2);
    const { impact } = stream;
    if (impact !== null) {
      const q = Math.min(1.5, impact.rate / pour.flow);
      pushWave(
        wave,
        impact.x / half,
        IMPACT_Z / half,
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
          life: 0.4 + Math.random() * 0.9,
          r: 0.25 + Math.random() * 0.5,
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

  const paintBubbles = (height: (x: number, z: number) => number) => {
    for (const bubble of bubbles) {
      const fade = Math.sin((Math.PI * bubble.age) / bubble.life);
      const at = project(bubble.x, height(bubble.x, bubble.z) + 0.15, bubble.z);
      ctx.fillStyle = rgba(paint.straw, 0.32 * fade);
      ctx.beginPath();
      ctx.ellipse(at.x, at.y, bubble.r, bubble.r * 0.5, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(paint.sheen, 0.6 * fade);
      ctx.beginPath();
      ctx.ellipse(
        at.x - bubble.r * 0.35,
        at.y - bubble.r * 0.15,
        bubble.r * 0.3,
        bubble.r * 0.16,
        0,
        0,
        TAU
      );
      ctx.fill();
    }
  };

  const paintDrops = (counter: boolean) => {
    for (const drop of drops) {
      if (drop.counter !== counter) {
        continue;
      }
      ctx.fillStyle = rgba(paint.sake, 0.75);
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = rgba(paint.sheen, 0.85);
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

  const mirrorOf = (lift: number) => () => {
    const image = layers?.front;
    if (!image) {
      return;
    }
    const rise = Math.round(lift * dpr);
    const foot = dpr * (layout.cy - lift + project(0, 0, A).y * layout.scale);
    ctx.save();
    ctx.setTransform(1, 0, 0, -1, 0, 2 * foot);
    ctx.drawImage(image, 0, -rise);
    ctx.restore();
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
            waveAt(surface, x / B, z / B) * DOME_WAVE
          )
        : fill.level + waveAt(surface, x / B, z / B);
    const height = (x: number, z: number) =>
      glass !== null && Math.hypot(x, z) <= half
        ? glass.level + glass.dome * 0.6 + waveAt(wave, x / half, z / half)
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
              (x, z) => waveAt(surface, x / B, z / B) * DOME_WAVE
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

  const paintMasu = (scene: ReturnType<typeof sceneOf>) => {
    const { fill, dome, surface, strain } = scene;
    const reach = shoulderOf(strain);
    if (dome === null) {
      paintFlat(
        ctx,
        fill.level,
        surface,
        (fill.glass === null ? shade : shadeMasu)({
          depth: fill.level - box.floor,
          dome: null,
          ground: WOOD_DEEP,
          half: B,
          walls: true,
          wave: surface,
          y: fill.level,
        })
      );
      return;
    }
    const lift = fill.dome * LIFT;
    paintDome(
      ctx,
      dome,
      shade({
        depth: H - box.floor + lift,
        dome: { lift, reach },
        ground: WOOD_DEEP,
        half: B,
        walls: false,
        wave: surface,
        y: H + lift,
      }),
      lift,
      reach,
      crestOf(strain)
    );
  };

  const refract = (glass: NonNullable<Fill["glass"]>, lift: number) => {
    if (!layers || glass.level > GLASS_TOP - 0.5) {
      return;
    }
    const bend = 1.06;
    ctx.save();
    polygon(ctx, [
      ...ring(GLASS_TOP, tumbler.top, Math.PI, TAU),
      ...ring(glass.level, radiusAt(glass.level), 0, Math.PI),
    ]);
    ctx.clip();
    ctx.setTransform(bend, 0, 0, 1, dpr * layout.cx * (1 - bend), 0);
    ctx.drawImage(layers.back, 0, -Math.round(lift * dpr));
    ctx.restore();
  };

  const paintInside = (
    frame: Frame,
    scene: ReturnType<typeof sceneOf>,
    lift: number
  ) => {
    const { pour, hold, t, clock } = frame;
    const { fill, height, stream } = scene;
    paintMasu(scene);
    const from =
      fill.dome > 0 ? H + fill.dome * LIFT : Math.max(fill.level, box.floor);
    if (fill.glass !== null) {
      refract(fill.glass, lift);
      paintGlassLiquid(
        ctx,
        fill.glass,
        from,
        shade({
          depth: fill.glass.level - box.floor - tumbler.base,
          dome: null,
          ground: GLASS_GROUND,
          half: scene.half,
          walls: false,
          wave,
          y: fill.glass.level + fill.glass.dome * 0.6,
        })
      );
    }
    paintBubbles(height);
    paintStream(ctx, stream);
    paintFoam(ctx, stream.impact, pour.flow, clock);
    paintGlassShell(
      ctx,
      fill,
      from,
      Math.min(1, flowAt(pour, hold, t) / pour.flow),
      clock,
      pour.seed
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
        : frame.raise * Math.max(0, layout.cy - layout.h * RESULT);
    const scene = sceneOf(frame);
    const { spillage } = scene;
    if (!calm) {
      evolve({ ...scene, frame, start: spillage?.start ?? 0 });
    }
    paintLayer(layers?.back, rise);
    if (spillage !== null) {
      paintPool(
        ctx,
        spillage.pool.outline.map(({ x, z }) => project(x, 0, z)),
        mirrorOf(rise)
      );
    }
    paintInside(frame, scene, rise);
    paintLayer(layers?.front, rise);
    if (spillage !== null) {
      paintSpillage(ctx, spillage, scene.overflowing);
    }
    paintDrops(true);
    const away = Math.max(awayAt(pour, hold, t), frame.raise);
    if (away < 1) {
      toCup(ctx);
      paintVessel(
        ctx,
        pour,
        { x: scene.lip.x + (away * layout.w) / layout.scale, y: scene.lip.y },
        angleAt(pour, hold, t),
        layout.size[pour.bottle]
      );
    }
  };

  return { draw };
};
