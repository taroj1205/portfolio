import { colorOf } from "./cosmetics";
import type { Look } from "./cosmetics";
import {
  nextContact,
  propsIn,
  randomFrom,
  shoreAt,
  speedAt,
  stoneAt,
  surgeTier,
  windowFor,
  openWater,
  zoneIndex,
  zones,
} from "./simulate";
import type { Coast, Flight, Prop, River, Sky, Vec } from "./simulate";
import {
  duckSprite,
  leafSprite,
  lotusSprite,
  rockSprite,
  stoneSprite,
} from "./sprites";
import type { Tint } from "./sprites";
import { createWater } from "./water";

interface Palette {
  sky: [string, string, string];
  sun: string;
  sunX: number;
  sunY: number;
  sunSize: number;
  tint: Tint;
  glow: string;
  light: boolean;
  clouds: string | null;
  ridges: [string, string];
  snow: string;
  water: [string, string, string];
  glint: string;
  land: string;
  trees: string;
  reed: string;
  plume: string;
  torii: string;
  mist: string;
  mistAlpha: number;
  ring: string;
  stars: boolean;
  fireflies: boolean;
}

export const palettes: Record<Sky, Palette> = {
  dawn: {
    clouds: "#ffffff",
    fireflies: false,
    glint: "#ffffff",
    glow: "#fff0d6",
    light: true,
    land: "#4b5b6b",
    mist: "#f4efea",
    mistAlpha: 0.55,
    plume: "#efe9df",
    reed: "#3c4b58",
    ridges: ["#aebdcd", "#7f93a9"],
    ring: "#ffffff",
    sky: ["#6b8cb6", "#d9d2da", "#f6e2cc"],
    snow: "#ffffff",
    stars: false,
    sun: "#fff6e6",
    sunSize: 0.03,
    sunX: 0.3,
    sunY: 0.16,
    tint: { alpha: 0.1, color: "#dfe8f2" },
    torii: "#c4503a",
    trees: "#5f7182",
    water: ["#efe4dc", "#a3b4c6", "#4d667c"],
  },
  dusk: {
    clouds: "#f7b48c",
    fireflies: false,
    glint: "#ffd8a8",
    glow: "#ffb27a",
    light: false,
    land: "#1a1528",
    mist: "#f0a98a",
    mistAlpha: 0.28,
    plume: "#e9b98f",
    reed: "#130f1f",
    ridges: ["#4a3a5e", "#2a2440"],
    ring: "#ffe6cf",
    sky: ["#121833", "#5b4470", "#f4a576"],
    snow: "#f6cfc4",
    stars: false,
    sun: "#ffe9c7",
    sunSize: 0.028,
    sunX: 0.68,
    sunY: 0.1,
    tint: { alpha: 0.16, color: "#ff9a5c" },
    torii: "#b8402f",
    trees: "#221b33",
    water: ["#d29384", "#4c4a6e", "#0b1b2b"],
  },
  night: {
    clouds: null,
    fireflies: true,
    glint: "#dfe8ff",
    glow: "#9fb6e8",
    light: false,
    land: "#050913",
    mist: "#3a4f80",
    mistAlpha: 0.22,
    plume: "#8e9cc0",
    reed: "#03060d",
    ridges: ["#14203d", "#0a1226"],
    ring: "#c8d6ff",
    sky: ["#03060f", "#0b1630", "#22355e"],
    snow: "#9fb0d6",
    stars: true,
    sun: "#f3f0e2",
    sunSize: 0.022,
    sunX: 0.74,
    sunY: 0.45,
    tint: { alpha: 0.5, color: "#0b1630" },
    torii: "#5e2626",
    trees: "#070c19",
    water: ["#2b3d66", "#0f1c37", "#040915"],
  },
};

export interface Frame {
  river: River;
  shot: Flight | null;
  time: number;
  clock: number;
  tilt: number | null;
  look: Look;
  surface: string;
}

interface Camera {
  x: number;
  y: number;
  z: number;
  roll: number;
  speed: number;
  pitch: number;
}
interface View {
  w: number;
  h: number;
  horizon: number;
  focal: number;
  far: number;
  camera: Camera;
}
interface Screen {
  x: number;
  y: number;
  s: number;
  d: number;
}

const TAU = Math.PI * 2;
const NEAR = 0.35;
const STONE = 0.26;
const RING_FOLLOW_SPEED = 60;
const FRAME = 1 / 60;
const GOLD = "#ffd27a";

const hash = (a: number, b = 0) => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43_758.5453;
  return v - Math.floor(v);
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const ease = (v: number) => {
  const t = clamp01(v);
  return t * t * (3 - 2 * t);
};

const rgbCache = new Map<string, string>();
const rgba = (hex: string, alpha: number) => {
  let rgb = rgbCache.get(hex);
  if (rgb === undefined) {
    rgb = [1, 3, 5]
      .map((at) => Number.parseInt(hex.slice(at, at + 2), 16))
      .join(" ");
    rgbCache.set(hex, rgb);
  }
  return `rgb(${rgb} / ${clamp01(alpha).toFixed(3)})`;
};

const project = (view: View, p: Vec): Screen | null => {
  const d = p.z - view.camera.z;
  if (d < NEAR) {
    return null;
  }
  const s = view.focal / d;
  return {
    d,
    s,
    x: view.w / 2 + (p.x - view.camera.x) * s,
    y: view.horizon + (view.camera.y - p.y) * s,
  };
};

const flatten = (view: View, d: number) => view.camera.y / d;

const shakeAt = (flight: Flight, time: number) => {
  let shake = 0;
  for (const bump of flight.bumps) {
    const k = time - bump.time;
    if (k >= 0 && k < 0.45) {
      const power = bump.kind === "rock" ? 0.09 : 0.04;
      shake += (1 - k / 0.45) * power * Math.sin(k * 80);
    }
  }
  return shake;
};

const LOOK_AHEAD = 0.3;
const CLIMB_FROM = 3;

export const cameraFor = (
  flight: Flight | null,
  time: number,
  clock: number
): Camera => {
  const idle = {
    pitch: 0,
    roll: Math.sin(clock * 0.17) * 0.008,
    speed: 0,
    x: Math.sin(clock * 0.23) * 0.25,
    y: 1.15 + Math.sin(clock * 0.31) * 0.04,
    z: -1.8,
  };
  if (!flight) {
    return idle;
  }
  const t =
    flight.ending === null ? time : Math.min(time, flight.duration - 1e-6);
  const now = stoneAt(flight, t);
  const lead = stoneAt(flight, t + LOOK_AHEAD) ?? now;
  const x = lead?.x ?? 0;
  const y = Math.max(now?.y ?? 0, lead?.y ?? 0);
  const speed = speedAt(flight, t);
  const rush = clamp01((speed - 14) / 40);
  const ahead = stoneAt(flight, t + 0.05);
  const sway =
    ahead && now ? (ahead.x - now.x) / Math.max(0.05, ahead.z - now.z) : 0;
  const settle =
    flight.ending === null ? 0 : ease((time - flight.duration) / 2.4);
  const shake = shakeAt(flight, time);
  const blend = ease(time / 0.9);
  const climb = Math.max(0, y - CLIMB_FROM);
  const height = 1.05 + Math.min(3, (y / 6) * 0.45) + climb * 0.75 + rush * 0.5;
  return {
    pitch: 0.07 * blend,
    roll: idle.roll * (1 - blend) - sway * 0.35 + shake * 0.6,
    speed: rush,
    x: idle.x * (1 - blend) + x * blend + shake,
    y: idle.y + (height - idle.y) * blend + 1.1 * settle + shake * 0.5,
    z:
      Math.max(
        idle.z,
        (now?.z ?? flight.distance) - (4.6 + rush * 3 + climb * 0.5)
      ) -
      3 * settle,
  };
};

export const follow = (
  rig: Camera | null,
  target: Camera,
  dt: number
): Camera => {
  if (rig === null) {
    return target;
  }
  const k = 1 - Math.exp(-dt * 7);
  return {
    pitch: rig.pitch + (target.pitch - rig.pitch) * k,
    roll: rig.roll + (target.roll - rig.roll) * k,
    speed: rig.speed + (target.speed - rig.speed) * k,
    x: rig.x + (target.x - rig.x) * k,
    y: rig.y + (target.y - rig.y) * k,
    z: target.z,
  };
};

const viewOf = (camera: Camera, w: number, h: number): View => ({
  camera,
  far: camera.z + 90,
  focal: h * 0.85 * (1 - 0.22 * camera.speed),
  h,
  horizon: h * (w < h ? 0.4 : 0.44) + h * camera.pitch,
  w,
});

const ridgeLine = (
  random: () => number,
  w: number,
  span: number,
  base: number,
  amp: number,
  fuji: { x: number; width: number; height: number } | null
) => {
  const phases = [random() * TAU, random() * TAU, random() * TAU];
  const points: number[] = [];
  for (let x = 0; x <= w + 4; x += 4) {
    const u = x / span;
    let lift =
      amp *
      (0.5 +
        0.3 * Math.sin(u * 5.1 + (phases[0] ?? 0)) +
        0.15 * Math.sin(u * 13.7 + (phases[1] ?? 0)) +
        0.05 * Math.sin(u * 37.3 + (phases[2] ?? 0)));
    if (fuji) {
      const away = Math.abs(x - fuji.x) / fuji.width;
      if (away < 1) {
        lift = Math.max(lift, fuji.height * Math.min(0.94, (1 - away) ** 1.35));
      }
    }
    points.push(base - lift);
  }
  return points;
};

const fillRidge = (
  ctx: CanvasRenderingContext2D,
  points: number[],
  floor: number,
  fill: string | CanvasGradient
) => {
  ctx.beginPath();
  ctx.moveTo(0, floor);
  for (const [i, y] of points.entries()) {
    ctx.lineTo(i * 4, y);
  }
  ctx.lineTo(points.length * 4, floor);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
};

const zoneOf = (z: number) =>
  zones[zoneIndex(z)] ?? { coast: "village", from: 0, name: "" };

const scenery: Record<
  Coast,
  { far: number; near: number; fuji: number; tint: [string, number] | null }
> = {
  bamboo: { far: 0.05, fuji: 0, near: 0.06, tint: ["#2f6a3c", 0.4] },
  cloud: { far: 0.02, fuji: 1, near: 0, tint: null },
  firefly: { far: 0.09, fuji: 0, near: 0.07, tint: ["#16301f", 0.55] },
  ginkgo: { far: 0.08, fuji: 0.4, near: 0.05, tint: ["#b8861a", 0.35] },
  maple: { far: 0.12, fuji: 0, near: 0.065, tint: ["#9a3020", 0.38] },
  sakura: { far: 0.07, fuji: 0.8, near: 0.045, tint: ["#e7a1b8", 0.35] },
  sea: { far: 0, fuji: 1, near: 0, tint: null },
  snow: { far: 0.11, fuji: 1, near: 0.06, tint: ["#eef3fa", 0.6] },
  stars: { far: 0, fuji: 0, near: 0, tint: null },
  town: { far: 0.06, fuji: 1, near: 0.03, tint: null },
  village: { far: 0.07, fuji: 0.65, near: 0.035, tint: null },
};

const LEAVES = new Map<Coast, string[]>([
  ["ginkgo", ["#f4c531", "#e8a81c", "#ffd95a", "#c98a12"]],
  ["maple", ["#c8321f", "#e0562a", "#f08a2e", "#a8241c"]],
  ["sakura", ["#f7c6d4", "#f3a7c0", "#ffe1ea", "#e88aa8"]],
  ["snow", ["#ffffff", "#e6eef7", "#cfdcea", "#f4f8fc"]],
]);

const paintCastle = (
  ctx: CanvasRenderingContext2D,
  x: number,
  base: number,
  size: number,
  color: string
) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.7, base);
  ctx.lineTo(x - size * 0.55, base - size * 0.35);
  ctx.lineTo(x + size * 0.55, base - size * 0.35);
  ctx.lineTo(x + size * 0.7, base);
  ctx.fill();
  for (let tier = 0; tier < 3; tier += 1) {
    const half = size * (0.5 - tier * 0.12);
    const floor = base - size * (0.35 + tier * 0.28);
    ctx.fillRect(x - half * 0.75, floor - size * 0.2, half * 1.5, size * 0.2);
    ctx.beginPath();
    ctx.moveTo(x - half - size * 0.08, floor - size * 0.17);
    ctx.quadraticCurveTo(
      x - half * 0.4,
      floor - size * 0.24,
      x,
      floor - size * 0.33
    );
    ctx.quadraticCurveTo(
      x + half * 0.4,
      floor - size * 0.24,
      x + half + size * 0.08,
      floor - size * 0.17
    );
    ctx.lineTo(x + half * 0.8, floor - size * 0.2);
    ctx.lineTo(x - half * 0.8, floor - size * 0.2);
    ctx.closePath();
    ctx.fill();
  }
};

const paintCloudSea = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  horizon: number,
  random: () => number
) => {
  const bank = ctx.createLinearGradient(0, horizon - h * 0.05, 0, horizon);
  bank.addColorStop(0, "rgb(255 255 255 / 0)");
  bank.addColorStop(1, "rgb(248 250 255 / 0.9)");
  ctx.fillStyle = bank;
  ctx.fillRect(0, horizon - h * 0.05, w, h * 0.05);
  for (let i = 0; i < 26; i += 1) {
    const cx = random() * w;
    const cy = horizon - h * (0.005 + random() * 0.03);
    const r = h * (0.02 + random() * 0.04);
    const puff = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    puff.addColorStop(0, "rgb(255 255 255 / 0.75)");
    puff.addColorStop(1, "rgb(255 255 255 / 0)");
    ctx.fillStyle = puff;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }
};

const paintMilkyWay = (
  ctx: CanvasRenderingContext2D,
  w: number,
  horizon: number,
  random: () => number
) => {
  ctx.fillStyle = "rgb(4 8 26 / 0.7)";
  ctx.fillRect(0, 0, w, horizon + 1);
  ctx.save();
  ctx.translate(w / 2, horizon * 0.45);
  ctx.rotate(-0.5);
  const band = ctx.createLinearGradient(0, -horizon * 0.22, 0, horizon * 0.22);
  band.addColorStop(0, "rgb(160 140 255 / 0)");
  band.addColorStop(0.5, "rgb(220 210 255 / 0.32)");
  band.addColorStop(1, "rgb(160 140 255 / 0)");
  ctx.fillStyle = band;
  ctx.fillRect(-w, -horizon * 0.22, w * 2, horizon * 0.44);
  for (let i = 0; i < 700; i += 1) {
    const spread = (random() + random() + random() - 1.5) * horizon * 0.18;
    const size = random() > 0.97 ? 1.6 : 0.7;
    ctx.fillStyle = `rgb(255 255 255 / ${(0.25 + random() * 0.6).toFixed(3)})`;
    ctx.fillRect((random() - 0.5) * w * 2, spread, size, size);
  }
  ctx.restore();
};

const paintBackdrop = (
  canvas: HTMLCanvasElement,
  view: View,
  river: River,
  palette: Palette,
  coast: Coast,
  dpr: number
) => {
  const look = scenery[coast];
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  const { w, h, horizon } = view;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const random = randomFrom(river.seed + 104_729);

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, palette.sky[0]);
  sky.addColorStop(0.58, palette.sky[1]);
  sky.addColorStop(1, palette.sky[2]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon + 1);

  const sunX = w * palette.sunX;
  const sunY = horizon - horizon * palette.sunY;
  const sunR = Math.max(w, h) * palette.sunSize;
  const glow = ctx.createRadialGradient(
    sunX,
    sunY,
    0,
    sunX,
    sunY,
    Math.max(w, h) * 0.55
  );
  glow.addColorStop(0, rgba(palette.glow, 0.75));
  glow.addColorStop(0.18, rgba(palette.glow, 0.28));
  glow.addColorStop(1, rgba(palette.glow, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, horizon + 1);

  if (palette.clouds !== null) {
    for (let i = 0; i < 6; i += 1) {
      const cx = random() * w;
      const cy = horizon * (0.5 + random() * 0.38);
      const cw = w * (0.25 + random() * 0.4);
      const ch = h * (0.004 + random() * 0.008);
      const cloud = ctx.createLinearGradient(cx - cw, 0, cx + cw, 0);
      cloud.addColorStop(0, rgba(palette.clouds, 0));
      cloud.addColorStop(0.5, rgba(palette.clouds, 0.08 + random() * 0.14));
      cloud.addColorStop(1, rgba(palette.clouds, 0));
      ctx.fillStyle = cloud;
      ctx.beginPath();
      ctx.ellipse(cx, cy, cw, ch, 0, 0, TAU);
      ctx.fill();
    }
  }

  if (coast === "stars") {
    paintMilkyWay(ctx, w, horizon, random);
  }

  ctx.fillStyle = palette.sun;
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = sunR * 1.6;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;

  const fuji =
    random() < look.fuji
      ? {
          height: h * 0.13,
          width: Math.max(w, h) * 0.3,
          x: w * (0.15 + random() * 0.7),
        }
      : null;
  const far = ridgeLine(random, w, Math.max(w, h), horizon, h * look.far, fuji);
  const near = ridgeLine(
    random,
    w,
    Math.max(w, h),
    horizon,
    h * look.near,
    null
  );

  const farFill = ctx.createLinearGradient(0, horizon - h * 0.16, 0, horizon);
  farFill.addColorStop(0, palette.ridges[0]);
  farFill.addColorStop(1, rgba(palette.ridges[0], 0.75));
  fillRidge(ctx, far, horizon, farFill);
  if (fuji) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let x = 0; x <= w; x += 6) {
      const jag =
        Math.sin(x * 0.11) * h * 0.006 + (hash(x, river.seed) - 0.5) * h * 0.01;
      ctx.lineTo(x, horizon - fuji.height * 0.62 + jag);
    }
    ctx.lineTo(w, 0);
    ctx.closePath();
    ctx.clip();
    fillRidge(ctx, far, horizon, rgba(palette.snow, 0.85));
    ctx.restore();
  }
  fillRidge(ctx, near, horizon, palette.ridges[1]);
  if (look.tint) {
    fillRidge(ctx, near, horizon, rgba(look.tint[0], look.tint[1]));
  }
  if (coast === "town") {
    paintCastle(ctx, w * 0.64, horizon - h * 0.02, h * 0.07, palette.ridges[1]);
  }
  if (coast === "cloud") {
    paintCloudSea(ctx, w, h, horizon, random);
  }

  const water = ctx.createLinearGradient(0, horizon, 0, h);
  water.addColorStop(0, palette.water[0]);
  water.addColorStop(0.28, palette.water[1]);
  water.addColorStop(1, palette.water[2]);
  ctx.fillStyle = water;
  ctx.fillRect(0, horizon, w, h - horizon);

  ctx.save();
  ctx.globalAlpha = 0.32;
  ctx.translate(0, horizon * 2);
  ctx.scale(1, -1);
  ctx.beginPath();
  ctx.rect(0, horizon - h * 0.3, w, h * 0.3);
  ctx.clip();
  fillRidge(ctx, far, horizon, palette.ridges[0]);
  fillRidge(ctx, near, horizon, palette.ridges[1]);
  ctx.restore();

  ctx.save();
  ctx.translate(sunX, horizon);
  ctx.scale(1, 3.2);
  const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.22);
  pool.addColorStop(0, rgba(palette.glow, 0.45));
  pool.addColorStop(1, rgba(palette.glow, 0));
  ctx.fillStyle = pool;
  ctx.fillRect(-w, 0, w * 2, h);
  ctx.restore();
};

const paintStars = (
  ctx: CanvasRenderingContext2D,
  view: View,
  clock: number
) => {
  for (let i = 0; i < 90; i += 1) {
    const x = hash(i, 1) * view.w;
    const y = hash(i, 2) ** 1.6 * view.horizon * 0.92;
    const twinkle =
      0.35 + 0.65 * (0.5 + 0.5 * Math.sin(clock * (1 + hash(i, 3) * 2) + i));
    ctx.fillStyle = `rgb(255 255 255 / ${(twinkle * (0.3 + hash(i, 4) * 0.6)).toFixed(3)})`;
    ctx.fillRect(
      x,
      y,
      hash(i, 5) > 0.92 ? 1.8 : 1.1,
      hash(i, 5) > 0.92 ? 1.8 : 1.1
    );
  }
};

const paintMist = (
  ctx: CanvasRenderingContext2D,
  view: View,
  palette: Palette
) => {
  const band = view.h * 0.07;
  const mist = ctx.createLinearGradient(
    0,
    view.horizon - band,
    0,
    view.horizon + band
  );
  mist.addColorStop(0, rgba(palette.mist, 0));
  mist.addColorStop(0.5, rgba(palette.mist, palette.mistAlpha));
  mist.addColorStop(1, rgba(palette.mist, 0));
  ctx.fillStyle = mist;
  ctx.fillRect(0, view.horizon - band, view.w, band * 2);
};

const lattice = (
  view: View,
  limit: number,
  spacing: number,
  visit: (n: number, z: number) => void
) => {
  const first = Math.ceil((view.camera.z + 0.8) / spacing);
  const last = Math.floor(Math.min(limit, view.camera.z + 60) / spacing);
  for (let n = first; n <= last; n += 1) {
    const d = n * spacing - view.camera.z;
    let stride = 1;
    if (d > 13) {
      stride = 2;
    }
    if (d > 28) {
      stride = 4;
    }
    if (n % stride === 0) {
      visit(n, n * spacing);
    }
  }
};

const paintWater = (
  ctx: CanvasRenderingContext2D,
  view: View,
  river: River,
  palette: Palette,
  clock: number
) => {
  lattice(view, view.far, 0.45, (n, z) => {
    for (let k = 0; k < 3; k += 1) {
      const x =
        (hash(n, k) - 0.5) * 2.4 * river.shore +
        Math.sin(clock * 0.6 + n + k) * 0.18;
      const p = project(view, { x, y: 0, z });
      if (!p) {
        continue;
      }
      const length = Math.min(
        (0.4 + hash(n, k + 9) * 0.8) * p.s,
        view.w * 0.16
      );
      const fade =
        (1 - clamp01(p.d / 60)) * (0.3 + 0.7 * clamp01((p.d - 1.5) / 6));
      const light = hash(n, k + 3) > 0.45;
      ctx.fillStyle = light
        ? rgba(palette.glint, (0.05 + hash(n, k + 5) * 0.1) * fade)
        : rgba(palette.water[2], 0.18 * fade);
      ctx.fillRect(p.x - length / 2, p.y, length, Math.max(0.6, 0.018 * p.s));
    }
  });

  const sunX = view.w * palette.sunX;
  lattice(view, view.far, 0.3, (n, z) => {
    const p = project(view, { x: 0, y: 0, z });
    if (!p) {
      return;
    }
    const sparkle = Math.sin(clock * (2.4 + hash(n, 2)) + n * 1.7);
    if (sparkle < 0.1) {
      return;
    }
    const spread = view.w * 0.05 + p.s * 0.35;
    const x = sunX + (hash(n, 1) - 0.5) * spread * 2;
    const length = Math.min(
      (0.2 + hash(n, 3) * 0.6) * (p.s * 0.5 + view.w * 0.02),
      view.w * 0.12
    );
    ctx.fillStyle = rgba(
      palette.glint,
      sparkle *
        0.75 *
        (1 - clamp01(p.d / 70)) *
        (0.3 + 0.7 * clamp01((p.d - 1.5) / 6))
    );
    ctx.fillRect(x - length / 2, p.y, length, Math.max(0.7, 0.02 * p.s));
  });
};

const paintFarShore = (
  ctx: CanvasRenderingContext2D,
  view: View,
  river: River,
  palette: Palette
) => {
  const back = view.camera.z + 160;
  const ground = project(view, { x: 0, y: 0, z: back - 4 });
  if (!ground || openWater(zoneOf(back).coast)) {
    return;
  }
  const top: [number, number][] = [];
  const phase = (river.seed % 1000) / 100;
  for (let x = -120; x <= 120; x += 1) {
    const tall =
      6 +
      2 * Math.sin(x * 0.07 + phase) +
      1.2 * Math.sin(x * 0.23 + phase * 2) +
      0.5 * Math.abs(Math.sin(x * 0.9 + phase));
    const p = project(view, { x: x + view.camera.x, y: tall, z: back });
    if (p) {
      top.push([p.x, p.y]);
    }
  }
  ctx.beginPath();
  ctx.moveTo(-10, ground.y);
  for (const [x, y] of top) {
    ctx.lineTo(x, y);
  }
  ctx.lineTo(view.w + 10, ground.y);
  ctx.closePath();
  ctx.fillStyle = palette.trees;
  ctx.fill();
};

const solid = (
  ctx: CanvasRenderingContext2D,
  view: View,
  corners: Vec[],
  fill: string
) => {
  const points = corners.map((corner) => project(view, corner));
  if (points.some((point) => point === null)) {
    return;
  }
  ctx.beginPath();
  for (const point of points) {
    if (point) {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
};

const box = (x0: number, x1: number, y0: number, y1: number, z: number) => [
  { x: x0, y: y0, z },
  { x: x1, y: y0, z },
  { x: x1, y: y1, z },
  { x: x0, y: y1, z },
];

const paintTorii = (
  ctx: CanvasRenderingContext2D,
  view: View,
  cx: number,
  z: number,
  palette: Palette
) => {
  const ink = "#1b1414";
  for (const side of [-1, 1]) {
    const x = cx + side * 1.1;
    solid(
      ctx,
      view,
      [
        { x: x - 0.15, y: 0, z },
        { x: x + 0.15, y: 0, z },
        { x: x + 0.11, y: 3.5, z },
        { x: x - 0.11, y: 3.5, z },
      ],
      palette.torii
    );
    solid(ctx, view, box(x - 0.18, x + 0.18, 0, 0.35, z), ink);
  }
  solid(ctx, view, box(cx - 1.45, cx + 1.45, 2.8, 2.96, z), palette.torii);
  solid(ctx, view, box(cx - 0.1, cx + 0.1, 2.96, 3.5, z), palette.torii);
  const lintel: Vec[] = [];
  for (let i = 0; i <= 12; i += 1) {
    const u = i / 12;
    const x = cx - 1.9 + u * 3.8;
    lintel.push({ x, y: 3.5 + 0.3 * (2 * u - 1) ** 6, z });
  }
  const upper = lintel.map((p) => ({ ...p, y: p.y + 0.24 })).toReversed();
  solid(ctx, view, [...lintel, ...upper], palette.torii);
  const cap = lintel.map((p) => ({ ...p, y: p.y + 0.24 }));
  const capTop = cap.map((p) => ({ ...p, y: p.y + 0.09 })).toReversed();
  solid(ctx, view, [...cap, ...capTop], ink);
};

const paintLantern = (
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  z: number,
  clock: number
) => {
  const stone = "#8a857c";
  solid(ctx, view, box(x - 0.3, x + 0.3, 0, 0.18, z), stone);
  solid(ctx, view, box(x - 0.1, x + 0.1, 0.18, 0.9, z), stone);
  solid(ctx, view, box(x - 0.24, x + 0.24, 0.9, 1, z), stone);
  solid(ctx, view, box(x - 0.2, x + 0.2, 1, 1.32, z), "#5b5650");
  solid(
    ctx,
    view,
    [
      { x: x - 0.4, y: 1.32, z },
      { x: x + 0.4, y: 1.32, z },
      { x: x + 0.05, y: 1.6, z },
      { x: x - 0.05, y: 1.6, z },
    ],
    stone
  );
  const light = project(view, { x, y: 1.16, z });
  if (light) {
    const flicker = 0.75 + 0.25 * Math.sin(clock * 9 + z);
    const r = Math.max(3, 0.6 * light.s);
    const glow = ctx.createRadialGradient(
      light.x,
      light.y,
      0,
      light.x,
      light.y,
      r
    );
    glow.addColorStop(0, `rgb(255 214 140 / ${(0.85 * flicker).toFixed(3)})`);
    glow.addColorStop(1, "rgb(255 190 110 / 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(light.x - r, light.y - r, r * 2, r * 2);
  }
};

const paintPost = (
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  z: number
) => {
  solid(ctx, view, box(x - 0.06, x + 0.06, 0, 1.3, z), "#4a3826");
  solid(ctx, view, box(x - 0.5, x + 0.5, 1.05, 1.55, z), "#efe6d4");
  const label = project(view, { x, y: 1.3, z });
  if (label && label.s > 14) {
    ctx.fillStyle = "#2a2018";
    ctx.font = `700 ${Math.round(0.3 * label.s)}px "Hiragino Mincho ProN", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(z >= 1000 ? `${z / 1000}km` : `${z}m`, label.x, label.y);
  }
};

const paintEmbankment = (
  ctx: CanvasRenderingContext2D,
  view: View,
  river: River,
  side: number
) => {
  const top: Screen[] = [];
  const bottom: Screen[] = [];
  for (
    let z = view.far;
    z >= view.camera.z + NEAR + 0.05;
    z -= Math.max(0.5, (z - view.camera.z) * 0.08)
  ) {
    if (openWater(zoneOf(z).coast)) {
      continue;
    }
    const x = side * shoreAt(river, z);
    const a = project(view, { x, y: 0.45, z });
    const b = project(view, { x, y: 0, z });
    if (a && b) {
      top.push(a);
      bottom.push(b);
    }
  }
  if (top.length < 2) {
    return;
  }
  ctx.beginPath();
  for (const point of top) {
    ctx.lineTo(point.x, point.y);
  }
  for (const point of bottom.toReversed()) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.closePath();
  ctx.fillStyle = "#5e5a53";
  ctx.fill();
  ctx.strokeStyle = "rgb(255 255 255 / 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const point of top) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.stroke();
};

const paintReed = (
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  z: number,
  tall: number,
  sway: number,
  side: number,
  palette: Palette
) => {
  const base = project(view, { x, y: 0.4, z });
  const tip = project(view, { x: x + sway, y: tall, z });
  if (!base || !tip) {
    return;
  }
  ctx.strokeStyle = palette.reed;
  ctx.lineWidth = Math.max(0.6, 0.03 * base.s);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.quadraticCurveTo(base.x, (base.y + tip.y) / 2, tip.x, tip.y);
  ctx.stroke();
  ctx.strokeStyle = rgba(palette.plume, 0.55);
  ctx.lineWidth = Math.max(1, 0.045 * base.s);
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.quadraticCurveTo(
    tip.x + (sway * 0.6 + 0.03 * side) * base.s,
    tip.y + 0.05 * base.s,
    tip.x + (sway + 0.08 * side) * base.s,
    tip.y + 0.14 * base.s
  );
  ctx.stroke();
  ctx.lineCap = "butt";
};

const paintBamboo = (
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  z: number,
  tall: number,
  sway: number,
  palette: Palette
) => {
  const base = project(view, { x, y: 0.4, z });
  const tip = project(view, { x: x + sway, y: tall, z });
  if (!base || !tip) {
    return;
  }
  const width = Math.max(1, 0.09 * base.s);
  const stalk = ctx.createLinearGradient(base.x - width, 0, base.x + width, 0);
  stalk.addColorStop(0, "#2d5a2e");
  stalk.addColorStop(0.5, "#79a65a");
  stalk.addColorStop(1, "#244a26");
  ctx.strokeStyle = stalk;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.quadraticCurveTo(base.x, (base.y + tip.y) / 2, tip.x, tip.y);
  ctx.stroke();
  ctx.strokeStyle = "rgb(20 40 20 / 0.6)";
  ctx.lineWidth = Math.max(0.6, width * 0.3);
  for (let node = 1; node < 6; node += 1) {
    const u = node / 6;
    const nx = base.x + (tip.x - base.x) * u * u;
    const ny = base.y + (tip.y - base.y) * u;
    ctx.beginPath();
    ctx.moveTo(nx - width * 0.6, ny);
    ctx.lineTo(nx + width * 0.6, ny);
    ctx.stroke();
  }
  ctx.fillStyle = rgba(palette.tint.alpha > 0.3 ? "#1f3a24" : "#3f7a3a", 0.85);
  for (let leaf = 0; leaf < 5; leaf += 1) {
    const lx = tip.x + Math.sin(leaf * 2.3) * base.s * 0.5;
    const ly = tip.y + leaf * base.s * 0.12;
    ctx.beginPath();
    ctx.ellipse(
      lx,
      ly,
      base.s * 0.32,
      base.s * 0.05,
      Math.sin(leaf) * 0.6,
      0,
      TAU
    );
    ctx.fill();
  }
};

const paintTree = (
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  z: number,
  seed: number,
  clock: number,
  leaves: string[]
) => {
  const base = project(view, { x, y: 0.4, z });
  const crown = project(view, { x, y: 3.6, z });
  if (!base || !crown) {
    return;
  }
  ctx.strokeStyle = "#3b2418";
  ctx.lineWidth = Math.max(1, 0.18 * base.s);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.quadraticCurveTo(
    base.x + 0.3 * base.s,
    (base.y + crown.y) / 2,
    crown.x,
    crown.y
  );
  ctx.stroke();
  for (let k = 0; k < 9; k += 1) {
    const r = (0.7 + hash(seed, k) * 0.7) * base.s;
    const cx =
      crown.x +
      (hash(seed, k + 10) - 0.5) * 2.6 * base.s +
      Math.sin(clock * 0.8 + k) * 0.03 * base.s;
    const cy = crown.y + (hash(seed, k + 20) - 0.6) * 1.4 * base.s;
    ctx.fillStyle = leaves[k % leaves.length] ?? "#c8321f";
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const paintHouse = (
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  z: number,
  side: number,
  seed: number,
  clock: number
) => {
  const wide = 3.4 + hash(seed, 1) * 2;
  const tall = 2.6 + hash(seed, 2) * 1.2;
  const near = x - side * 0.2;
  const away = x + side * wide;
  solid(
    ctx,
    view,
    box(Math.min(near, away), Math.max(near, away), 0.4, tall, z),
    "#3a2e26"
  );
  solid(
    ctx,
    view,
    [
      { x: near - side * 0.5, y: tall, z },
      { x: away + side * 0.3, y: tall, z },
      { x: (near + away) / 2, y: tall + 1.4, z },
    ],
    "#26232a"
  );
  const glow = project(view, { x: x + side * wide * 0.4, y: tall * 0.55, z });
  if (glow) {
    const flicker = 0.8 + 0.2 * Math.sin(clock * 6 + seed);
    const size = Math.max(2, 0.5 * glow.s);
    ctx.fillStyle = `rgb(255 196 120 / ${(0.85 * flicker).toFixed(3)})`;
    ctx.fillRect(glow.x - size, glow.y - size * 0.6, size * 2, size * 1.2);
  }
};

const paintBuoy = (
  ctx: CanvasRenderingContext2D,
  view: View,
  x: number,
  z: number,
  clock: number
) => {
  const bob = Math.sin(clock * 2 + z) * 0.08;
  const base = project(view, { x, y: bob, z });
  const top = project(view, { x, y: 1.1 + bob, z });
  if (!base || !top) {
    return;
  }
  ctx.fillStyle = "#d8452f";
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, 0.35 * base.s, 0.18 * base.s, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "#f2efe8";
  ctx.lineWidth = Math.max(1, 0.06 * base.s);
  ctx.beginPath();
  ctx.moveTo(base.x, base.y);
  ctx.lineTo(top.x, top.y);
  ctx.stroke();
  if (top.s > 14) {
    ctx.fillStyle = "#f2efe8";
    ctx.font = `700 ${Math.round(0.32 * top.s)}px "Hiragino Mincho ProN", serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(z >= 1000 ? `${z / 1000}km` : `${z}m`, top.x, top.y - 2);
  }
};

interface Bank {
  ctx: CanvasRenderingContext2D;
  view: View;
  river: River;
  palette: Palette;
  clock: number;
  side: number;
}

const paintLand = ({ ctx, view, river, palette, side }: Bank) => {
  const edge = side < 0 ? -40 : view.w + 40;
  const line: Screen[] = [];
  for (
    let z = view.far;
    z >= view.camera.z + NEAR + 0.05;
    z -= Math.max(0.5, (z - view.camera.z) * 0.08)
  ) {
    if (openWater(zoneOf(z).coast)) {
      continue;
    }
    const p = project(view, { x: side * shoreAt(river, z), y: 0.4, z });
    if (p) {
      line.push(p);
    }
  }
  const first = line.at(0);
  const last = line.at(-1);
  if (first === undefined || last === undefined) {
    return;
  }
  ctx.beginPath();
  ctx.moveTo(edge, first.y);
  for (const point of line) {
    ctx.lineTo(point.x, point.y);
  }
  ctx.lineTo(last.x, view.h + 40);
  ctx.lineTo(edge, view.h + 40);
  ctx.closePath();
  ctx.fillStyle = palette.land;
  ctx.fill();
};

const paintLandmark = (bank: Bank, n: number) => {
  const { ctx, view, river, palette, clock, side } = bank;
  const z = n * 6;
  const { coast } = zoneOf(z);
  const shore = shoreAt(river, z);
  if (z % 100 === 0) {
    if (openWater(coast)) {
      paintBuoy(ctx, view, side * 3, z, clock);
    } else if (side < 0) {
      paintPost(ctx, view, -(shore + 0.9), z);
    }
    return;
  }
  const toriiSide = (z / 120) % 2 === (side < 0 ? 0 : 1);
  if (coast === "village" && z % 120 === 0 && toriiSide) {
    paintTorii(ctx, view, side * (shore + 3.2), z, palette);
  } else if (LEAVES.has(coast) && hash(n, side) > 0.35) {
    const x = side * (shore + 1.2 + hash(n, side + 4) * 2);
    paintTree(ctx, view, x, z, n * side, clock, LEAVES.get(coast) ?? []);
  } else if (coast === "town" && n % 2 === 0) {
    paintHouse(ctx, view, side * (shore + 0.8), z, side, n * side, clock);
  } else if (
    (coast === "village" || coast === "town" || coast === "firefly") &&
    hash(n, side) > 0.75
  ) {
    paintLantern(ctx, view, side * (shore + 1.4), z, clock);
  }
};

const paintVerge = (bank: Bank, n: number, z: number) => {
  const { ctx, view, river, palette, clock, side } = bank;
  const { coast } = zoneOf(z);
  if (openWater(coast) || coast === "town") {
    return;
  }
  const shore = shoreAt(river, z);
  for (let k = 0; k < 2; k += 1) {
    const x = side * (shore + 0.1 + hash(n * side, k) * 1.6);
    if (coast === "bamboo") {
      if (k === 0 && n % 2 === 0) {
        const tall = 5 + hash(n * side, k + 2) * 3;
        const sway = Math.sin(clock * 0.9 + z * 0.3) * 0.25;
        paintBamboo(ctx, view, x, z, tall, sway, palette);
      }
    } else if (!LEAVES.has(coast) || k === 0) {
      const tall = 1 + hash(n * side, k + 2) * 0.9;
      const sway = Math.sin(clock * 1.3 + z * 0.7 + k) * 0.1 * tall;
      paintReed(ctx, view, x, z, tall, sway, side, palette);
    }
  }
};

const paintShores = (
  ctx: CanvasRenderingContext2D,
  view: View,
  river: River,
  palette: Palette,
  clock: number
) => {
  for (const side of [-1, 1]) {
    const bank: Bank = { clock, ctx, palette, river, side, view };
    paintLand(bank);
    paintEmbankment(ctx, view, river, side);
    const start = Math.ceil((view.camera.z + 1) / 6);
    for (let n = Math.floor(view.far / 6); n >= start; n -= 1) {
      paintLandmark(bank, n);
    }
    lattice(view, view.far, 0.7, (n, z) => {
      paintVerge(bank, n, z);
    });
  }
};

const paintSplashes = (
  ctx: CanvasRenderingContext2D,
  view: View,
  shot: Flight,
  palette: Palette,
  time: number,
  rings: boolean
) => {
  for (const [i, splash] of shot.splashes.entries()) {
    const age = time - splash.time;
    if (age < 0 || age > 5 || splash.y > 0) {
      continue;
    }
    const p = project(view, { x: splash.x, y: 0, z: splash.z });
    if (!p) {
      continue;
    }
    const squash = flatten(view, p.d);
    if (rings) {
      for (let k = 0; k < 3; k += 1) {
        const a = age - k * 0.2;
        if (a > 0) {
          const r = (0.08 + a * 0.9 * (1 - a * 0.06)) * p.s;
          ctx.strokeStyle = rgba(
            palette.ring,
            (1 - age / 5) ** 2 * 0.6 * (1 - k * 0.25)
          );
          ctx.lineWidth = Math.max(0.6, 0.014 * p.s);
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, r, r * squash, 0, 0, TAU);
          ctx.stroke();
        }
      }
    }
    if (age > 0.9) {
      continue;
    }
    const heavy = splash.big || splash.event !== null;
    if (age < 0.4) {
      const puff = (0.25 + age * 1.6) * p.s * (heavy ? 1.6 : 1);
      const mist = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, puff);
      mist.addColorStop(0, rgba(palette.ring, 0.35 * (1 - age / 0.4)));
      mist.addColorStop(1, rgba(palette.ring, 0));
      ctx.fillStyle = mist;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, puff, puff * Math.max(0.35, squash * 2), 0, 0, TAU);
      ctx.fill();
    }
    const count = heavy ? 22 : 12;
    ctx.lineCap = "round";
    for (let j = 0; j < count; j += 1) {
      const angle = hash(i, j) * TAU;
      const out = 0.3 + hash(i, j + 20) * (heavy ? 1.4 : 0.8);
      const up = (heavy ? 2 : 1.1) + hash(i, j + 40) * 1.6;
      const spot = (t: number): Vec => ({
        x: splash.x + Math.cos(angle) * out * t,
        y: up * t - 4.9 * t * t,
        z: splash.z + Math.sin(angle) * out * t * 0.6,
      });
      const head = spot(age);
      if (head.y < 0) {
        continue;
      }
      const a = project(view, head);
      const b = project(view, spot(Math.max(0, age - 0.035)));
      if (a && b) {
        ctx.strokeStyle = rgba(palette.ring, 0.9 * (1 - age / 0.9));
        ctx.lineWidth = Math.max(0.8, 0.016 * a.s);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
    ctx.lineCap = "butt";
  }
};

const paintBursts = (
  ctx: CanvasRenderingContext2D,
  view: View,
  shot: Flight,
  time: number
) => {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const splash of shot.splashes) {
    const age = time - splash.time;
    const bright =
      splash.grade === "perfect" ||
      (splash.event !== null && splash.event !== "wall");
    if (!bright || age < 0 || age > 0.5) {
      continue;
    }
    const p = project(view, { x: splash.x, y: splash.y + 0.05, z: splash.z });
    if (!p) {
      continue;
    }
    const hue =
      splash.event === "lotus" || splash.event === "fish" ? "#a8f08a" : GOLD;
    const fade = 1 - age / 0.5;
    const size = Math.max(40, 1.6 * p.s) * (0.6 + age);
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
    glow.addColorStop(0, rgba(hue, 0.55 * fade));
    glow.addColorStop(1, rgba(hue, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - size, p.y - size, size * 2, size * 2);
    ctx.strokeStyle = rgba(hue, 0.8 * fade);
    ctx.lineCap = "round";
    for (let k = 0; k < 4; k += 1) {
      const a = (k / 4) * TAU + Math.PI / 4;
      const long = size * (k % 2 === 0 ? 1.2 : 0.7);
      ctx.lineWidth = Math.max(1, size * 0.03);
      ctx.beginPath();
      ctx.moveTo(
        p.x + Math.cos(a) * size * 0.1,
        p.y + Math.sin(a) * size * 0.1
      );
      ctx.lineTo(p.x + Math.cos(a) * long, p.y + Math.sin(a) * long);
      ctx.stroke();
    }
    if (splash.y > 0) {
      continue;
    }
    const ring = (0.4 + age * 6) * p.s;
    ctx.lineWidth = Math.max(1.2, 0.05 * p.s * fade);
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, ring, ring * flatten(view, p.d), 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
};

interface Sprites {
  stone: HTMLCanvasElement;
  edge: HTMLCanvasElement;
  duck: HTMLCanvasElement;
  rock: (prop: Prop) => HTMLCanvasElement;
  lotus: (prop: Prop) => HTMLCanvasElement;
  leaf: (prop: Prop) => HTMLCanvasElement;
}

const keyOf = (prop: Prop) => Math.floor(prop.turn * 1_000_000);

const darken = (source: HTMLCanvasElement) => {
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = "source-atop";
    ctx.fillStyle = "rgb(12 12 16 / 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  return canvas;
};

const createSprites = (tint: Tint, look: Look): Sprites => {
  const stone = stoneSprite(colorOf(look.color), look.form, look.pattern);
  const cache = new Map<string, HTMLCanvasElement>();
  const memo = (key: string, make: () => HTMLCanvasElement) => {
    const hit = cache.get(key);
    if (hit) {
      return hit;
    }
    if (cache.size > 240) {
      cache.clear();
    }
    const made = make();
    cache.set(key, made);
    return made;
  };
  return {
    duck: duckSprite(tint),
    leaf: (prop) =>
      memo(`leaf:${keyOf(prop)}`, () => leafSprite(keyOf(prop), tint)),
    lotus: (prop) =>
      memo(`lotus:${keyOf(prop)}`, () => lotusSprite(keyOf(prop), tint)),
    rock: (prop) =>
      memo(`rock:${keyOf(prop)}`, () => rockSprite(keyOf(prop), tint)),
    edge: darken(stone),
    stone,
  };
};

const paintFlat = (
  ctx: CanvasRenderingContext2D,
  view: View,
  prop: Prop,
  sprite: HTMLCanvasElement,
  size: number,
  spin: number
) => {
  const p = project(view, { x: prop.x, y: 0, z: prop.z });
  if (!p) {
    return;
  }
  const w = size * p.s;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1, Math.max(0.18, flatten(view, p.d) * 1.5));
  ctx.rotate(spin);
  ctx.drawImage(sprite, -w / 2, -w / 2, w, w);
  ctx.restore();
};

const paintRock = (
  ctx: CanvasRenderingContext2D,
  view: View,
  prop: Prop,
  sprite: HTMLCanvasElement,
  palette: Palette,
  clock: number
) => {
  const p = project(view, { x: prop.x, y: 0, z: prop.z });
  if (!p) {
    return;
  }
  const squash = flatten(view, p.d);
  ctx.strokeStyle = rgba(
    palette.ring,
    0.3 + 0.1 * Math.sin(clock * 2 + prop.turn)
  );
  ctx.lineWidth = Math.max(0.6, 0.025 * p.s);
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 0.8 * p.s, 0.8 * p.s * squash, 0, 0, TAU);
  ctx.stroke();
  const w = 1.3 * p.s;
  const h = (w * 150) / 240;
  ctx.drawImage(sprite, p.x - w / 2, p.y - h * 0.86, w, h);
};

const paintDuck = (
  ctx: CanvasRenderingContext2D,
  view: View,
  prop: Prop,
  sprite: HTMLCanvasElement,
  palette: Palette,
  clock: number,
  flown: number | null
) => {
  const at: Vec = {
    x: prop.x,
    y: Math.sin(clock * 1.8 + prop.turn) * 0.015,
    z: prop.z,
  };
  if (flown !== null) {
    at.x += Math.cos(prop.turn) * 2 * flown;
    at.y += 2.4 * flown;
    at.z += 1.4 * flown;
  }
  const p = project(view, at);
  if (!p) {
    return;
  }
  const w = 0.62 * p.s;
  const h = (w * 200) / 280;
  const facing = Math.cos(prop.turn) >= 0 ? 1 : -1;
  const draw = (flip: number, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(p.x, p.y);
    ctx.scale(facing, flip);
    ctx.drawImage(sprite, (-132 / 280) * w, (-160 / 200) * h, w, h);
    ctx.restore();
  };
  if (flown === null) {
    draw(-0.55, 0.22);
    ctx.strokeStyle = rgba(palette.ring, 0.3);
    ctx.lineWidth = Math.max(0.6, 0.012 * p.s);
    ctx.beginPath();
    ctx.moveTo(p.x - facing * w * 0.4, p.y);
    ctx.lineTo(p.x - facing * w * 1.1, p.y - w * 0.05);
    ctx.moveTo(p.x - facing * w * 0.4, p.y + w * 0.02);
    ctx.lineTo(p.x - facing * w * 1.1, p.y + w * 0.09);
    ctx.stroke();
  }
  draw(1, 1);
  if (flown !== null) {
    const flap = Math.sin(flown * 28) * w * 0.45;
    ctx.fillStyle = "#6f6458";
    ctx.beginPath();
    ctx.moveTo(p.x - facing * w * 0.15, p.y - w * 0.22);
    ctx.lineTo(p.x, p.y - w * 0.22 - flap);
    ctx.lineTo(p.x + facing * w * 0.12, p.y - w * 0.2);
    ctx.fill();
  }
};

const paintDragonfly = (
  ctx: CanvasRenderingContext2D,
  view: View,
  prop: Prop,
  clock: number,
  flown: number | null
) => {
  const facing = Math.cos(prop.turn) >= 0 ? 1 : -1;
  const at: Vec = {
    x: prop.x + Math.sin(clock * 1.3 + prop.turn) * 0.06,
    y: prop.y + Math.sin(clock * 2.1 + prop.turn * 2) * 0.04,
    z: prop.z,
  };
  if (flown !== null) {
    at.x += facing * 3 * flown;
    at.y += 1.8 * flown;
    at.z += 4 * flown;
  }
  const p = project(view, at);
  if (!p) {
    return;
  }
  const L = Math.max(6, 0.36 * p.s);
  const shadow = project(view, { x: at.x, y: 0, z: at.z });
  if (shadow) {
    const r = L * (0.45 + 0.3 * at.y);
    ctx.save();
    ctx.translate(shadow.x, shadow.y);
    ctx.scale(1, Math.max(0.18, flatten(view, shadow.d) * 1.5));
    const soft = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    soft.addColorStop(0, "rgb(0 0 0 / 0.3)");
    soft.addColorStop(1, "rgb(0 0 0 / 0)");
    ctx.fillStyle = soft;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  if (flown === null) {
    const r = L * (1.1 + 0.15 * Math.sin(clock * 3 + prop.turn));
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    glow.addColorStop(0, rgba(GOLD, 0.35));
    glow.addColorStop(1, rgba(GOLD, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(facing, 1);
  const beat = Math.sin(clock * 70 + prop.turn) * 0.35;
  ctx.fillStyle = "rgb(236 244 255 / 0.55)";
  ctx.strokeStyle = "rgb(30 40 60 / 0.45)";
  ctx.lineWidth = Math.max(0.75, L * 0.025);
  for (const [x, lean] of [
    [0.12, -0.5],
    [-0.02, -0.75],
  ] as const) {
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(
        x * L,
        -0.05 * L,
        L * 0.32,
        L * 0.07,
        side * (lean + beat),
        0,
        TAU
      );
      ctx.fill();
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "#c8432b";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, L * 0.06);
  ctx.beginPath();
  ctx.moveTo(0.05 * L, 0);
  ctx.lineTo(-0.55 * L, 0.04 * L);
  ctx.stroke();
  ctx.fillStyle = "#8e2f1f";
  ctx.beginPath();
  ctx.ellipse(0.1 * L, 0, L * 0.1, L * 0.06, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0.22 * L, -0.01 * L, L * 0.06, 0, TAU);
  ctx.fill();
  ctx.restore();
};

const SAKURA = ["#ffd3e2", "#f7a8c4", "#fbe6ee"];

interface Speck {
  x: number;
  y: number;
  s: number;
  fade: number;
  seed: number;
  k: number;
  time: number;
}

const SPECKS = new Map<
  string,
  (ctx: CanvasRenderingContext2D, at: Speck) => void
>([
  [
    "gold",
    (ctx, { x, y, s, fade, seed }) => {
      ctx.fillStyle = rgba(hash(seed, 3) > 0.5 ? GOLD : "#fff4c2", fade);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1.2, 0.04 * s) * fade, 0, TAU);
      ctx.fill();
    },
  ],
  [
    "sakura",
    (ctx, { x, y, s, fade, seed, k, time }) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = rgba(
        SAKURA[seed % SAKURA.length] ?? "#ffd3e2",
        0.9 * fade
      );
      ctx.beginPath();
      ctx.ellipse(
        x,
        y + k * 1.5,
        Math.max(2, 0.06 * s),
        Math.max(1, 0.03 * s),
        hash(seed, 4) * TAU + time * 6,
        0,
        TAU
      );
      ctx.fill();
      ctx.globalCompositeOperation = "lighter";
    },
  ],
  [
    "fox",
    (ctx, { x, y, s, fade }) => {
      const r = Math.max(4, 0.25 * s) * fade;
      const flame = ctx.createRadialGradient(x, y, 0, x, y, r);
      flame.addColorStop(0, `rgb(200 240 255 / ${(0.7 * fade).toFixed(3)})`);
      flame.addColorStop(0.5, `rgb(90 170 255 / ${(0.35 * fade).toFixed(3)})`);
      flame.addColorStop(1, "rgb(60 120 255 / 0)");
      ctx.fillStyle = flame;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    },
  ],
  [
    "ink",
    (ctx, { x, y, s, fade, k }) => {
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = `rgb(14 14 22 / ${(0.55 * fade).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(2, 0.05 * s) * (1 + k * 0.12), 0, TAU);
      ctx.fill();
      ctx.globalCompositeOperation = "lighter";
    },
  ],
  [
    "bubble",
    (ctx, { x, y, s, fade, seed, k }) => {
      ctx.strokeStyle = rgba("#dff4ff", 0.8 * fade);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(
        x,
        y - k * 2,
        Math.max(2, 0.05 * s) * (0.6 + hash(seed, 5)),
        0,
        TAU
      );
      ctx.stroke();
    },
  ],
  [
    "comet",
    (ctx, { x, y, s, fade }) => {
      const r = Math.max(2, 0.07 * s) * fade;
      ctx.fillStyle = rgba("#eaf2ff", fade);
      ctx.beginPath();
      ctx.moveTo(x, y - r * 2);
      ctx.lineTo(x + r * 0.4, y - r * 0.4);
      ctx.lineTo(x + r * 2, y);
      ctx.lineTo(x + r * 0.4, y + r * 0.4);
      ctx.lineTo(x, y + r * 2);
      ctx.lineTo(x - r * 0.4, y + r * 0.4);
      ctx.lineTo(x - r * 2, y);
      ctx.lineTo(x - r * 0.4, y - r * 0.4);
      ctx.fill();
    },
  ],
]);

const lineColor = (trail: string, k: number, time: number) => {
  if (trail === "rainbow") {
    return `hsl(${Math.round((k * 28 + time * 240) % 360)} 90% 72%)`;
  }
  if (trail === "fox") {
    return "#8fd8ff";
  }
  return null;
};

const paintTrail = (
  ctx: CanvasRenderingContext2D,
  view: View,
  flight: Flight,
  trail: string,
  palette: Palette,
  time: number
) => {
  const tier = surgeTier(flight.streak);
  const hot = flight.combo >= 3 || tier > 0;
  const reach = 12 + 6 * tier;
  const speck = SPECKS.get(trail);
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";
  for (let k = 1; k <= reach; k += 1) {
    const a = stoneAt(flight, time - (k - 1) * 0.02);
    const b = stoneAt(flight, time - k * 0.02);
    const pa = a ? project(view, a) : null;
    const pb = b ? project(view, b) : null;
    if (!pa || !pb) {
      continue;
    }
    const fade = 1 - k / (reach + 1);
    const tone = lineColor(trail, k, time);
    ctx.globalAlpha = Math.min(1, (hot ? 0.5 : 0.3) + 0.1 * tier) * fade;
    ctx.strokeStyle = tone ?? (hot ? GOLD : palette.ring);
    ctx.lineWidth = Math.max(1, STONE * 0.35 * (1 + 0.5 * tier) * pa.s * fade);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    if (speck !== undefined) {
      const seed = Math.floor((time - k * 0.02) * 50);
      const spread = Math.max(4, 0.3 * pa.s);
      speck(ctx, {
        fade,
        k,
        s: pa.s,
        seed,
        time,
        x: pa.x + (hash(seed, 1) - 0.5) * spread * k * 0.3,
        y: pa.y + (hash(seed, 2) - 0.5) * spread * k * 0.3,
      });
    }
  }
  ctx.restore();
};

const poseOf = (flight: Flight, at: Vec, time: number, view: View) => {
  const ahead = stoneAt(flight, time + 0.02) ?? at;
  const rise = ahead.y - at.y;
  const run = Math.hypot(ahead.x - at.x, ahead.z - at.z);
  const speed = run / 0.02;
  const climb = run > 1e-4 ? Math.atan2(rise, run) : 0;
  const base = (Math.min(60, Math.max(0, flight.tilt)) * Math.PI) / 180;
  const last = flight.splashes.findLast((splash) => splash.time <= time);
  const since = last ? time - last.time : 10;
  const kick = Math.exp(-since * 7) * Math.sin(since * 38) * 0.45;
  const wobble = Math.exp(-since * 5) * Math.sin(since * 27) * 0.22;
  const landed = flight.ending !== null && time > flight.duration;
  const d = Math.max(0.5, at.z - view.camera.z);
  return {
    pitch: landed ? 0 : base * 0.55 + climb * 0.6 + kick,
    roll: landed ? 0 : wobble + Math.sin(time * 3.1) * 0.05,
    speed,
    spin: landed ? 0.4 : time * (8 + Math.min(40, speed) * 0.9),
    view: Math.atan2(view.camera.y - at.y, d),
  };
};

const paintStone = (
  ctx: CanvasRenderingContext2D,
  view: View,
  flight: Flight,
  sprite: HTMLCanvasElement,
  edge: HTMLCanvasElement,
  trail: string,
  palette: Palette,
  time: number
) => {
  const at = stoneAt(flight, time);
  if (!at) {
    return;
  }
  const moving = flight.ending === null || time <= flight.duration;
  if (moving) {
    paintTrail(ctx, view, flight, trail, palette, time);
  }
  const shadow = project(view, { ...at, y: 0 });
  const p = project(view, at);
  if (!p) {
    return;
  }
  if (shadow && at.y > 0.03) {
    ctx.fillStyle = `rgb(0 0 0 / ${(0.3 / (1 + at.y * 3)).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(
      shadow.x,
      shadow.y,
      STONE * 0.5 * shadow.s,
      STONE * 0.5 * shadow.s * flatten(view, shadow.d),
      0,
      0,
      TAU
    );
    ctx.fill();
  }
  const len = Math.max(3, STONE * p.s);
  if (len < 14) {
    const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, len * 2 + 8);
    halo.addColorStop(0, rgba(palette.ring, 0.45));
    halo.addColorStop(1, rgba(palette.ring, 0));
    ctx.fillStyle = halo;
    ctx.fillRect(
      p.x - len * 2 - 8,
      p.y - len * 2 - 8,
      len * 4 + 16,
      len * 4 + 16
    );
  }
  const pose = poseOf(flight, at, time, view);
  const face = Math.min(1, Math.max(0.14, Math.sin(pose.view + pose.pitch)));
  const thick = len * 0.11 * Math.cos(pose.view + pose.pitch);
  if (moving && pose.speed > 12) {
    for (let k = 3; k >= 1; k -= 1) {
      const ghost = stoneAt(flight, time - k * 0.012);
      const q = ghost ? project(view, ghost) : null;
      if (q) {
        ctx.save();
        ctx.globalAlpha = 0.12 * (4 - k);
        ctx.translate(q.x, q.y);
        ctx.rotate(pose.roll);
        ctx.scale(1, face);
        ctx.rotate(pose.spin - k * 0.4);
        ctx.drawImage(sprite, -len / 2, (-len * 0.625) / 2, len, len * 0.625);
        ctx.restore();
      }
    }
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(pose.roll);
  ctx.save();
  ctx.translate(0, Math.max(1, thick));
  ctx.scale(1, face);
  ctx.rotate(pose.spin);
  ctx.drawImage(edge, -len / 2, (-len * 0.625) / 2, len, len * 0.625);
  ctx.restore();
  ctx.scale(1, face);
  ctx.rotate(pose.spin);
  ctx.drawImage(sprite, -len / 2, (-len * 0.625) / 2, len, len * 0.625);
  ctx.restore();
  if (moving && time < 1.4) {
    const fade = Math.min(1, (1.4 - time) / 0.4);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.fillStyle = GOLD;
    ctx.font = `700 ${Math.round(Math.max(13, len * 0.5))}px "Hiragino Mincho ProN", serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.shadowColor = "rgb(0 0 0 / 0.6)";
    ctx.shadowBlur = 6;
    ctx.fillText(
      `${Math.round(flight.tilt)}°`,
      p.x + len * 0.7 + 6,
      p.y - len * 0.5
    );
    ctx.restore();
  }
};

const paintHand = (
  ctx: CanvasRenderingContext2D,
  view: View,
  { stone, edge }: Pick<Sprites, "stone" | "edge">,
  tilt: number | null,
  clock: number,
  surface: string
) => {
  const aiming = tilt !== null;
  const angle = tilt ?? 28 + 3 * Math.sin(clock * 1.4);
  const size = Math.min(view.w * 0.32, 160);
  const cx = view.w / 2;
  const cy = view.h * 0.76 + (aiming ? 0 : Math.sin(clock * 1.6) * 3);
  const rad = (-angle * Math.PI) / 180;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = `rgb(255 255 255 / ${aiming ? 0.55 : 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(-size * 0.75, 0);
  ctx.lineTo(size * 0.95, 0);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = `rgb(255 255 255 / ${aiming ? 0.8 : 0.5})`;
  ctx.font = "600 12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(surface, size * 0.62, 6);

  ctx.strokeStyle = aiming ? GOLD : "rgb(255 255 255 / 0.4)";
  ctx.lineWidth = aiming ? 3 : 2;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.6, 0, rad, true);
  ctx.stroke();
  ctx.fillStyle = aiming ? GOLD : "rgb(255 255 255 / 0.6)";
  ctx.font = `700 ${aiming ? 20 : 15}px "Hiragino Mincho ProN", serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(
    `${Math.round(angle)}°`,
    Math.cos(rad / 2) * size * 0.7,
    Math.sin(rad / 2) * size * 0.7
  );

  ctx.rotate(rad);
  ctx.shadowColor = "rgb(0 0 0 / 0.45)";
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  ctx.save();
  ctx.scale(1, 0.42);
  for (let k = 3; k >= 1; k -= 1) {
    ctx.drawImage(edge, -size / 2, -size * 0.3125 + k * 5, size, size * 0.625);
    ctx.shadowColor = "transparent";
  }
  ctx.drawImage(stone, -size / 2, -size * 0.3125, size, size * 0.625);
  ctx.restore();
  ctx.restore();
};

export const cameraAt = (
  flight: Flight,
  camera: Camera,
  time: number,
  until: number,
  clock: number
) => {
  let rig = camera;
  for (let t = time; t < until;) {
    const step = Math.min(FRAME, until - t);
    t += step;
    rig = follow(rig, cameraFor(flight, t, clock + t - time), step);
  }
  return rig;
};

const paintApproach = (
  ctx: CanvasRenderingContext2D,
  view: View,
  flight: Flight,
  time: number,
  clock: number
) => {
  const contact = nextContact(flight);
  if (contact === null) {
    return;
  }
  const remain = contact - time;
  if (remain < 0 || remain > 0.9) {
    return;
  }
  const landing = contact - 1e-4;
  const at = stoneAt(flight, landing);
  const sight =
    speedAt(flight, time) > RING_FOLLOW_SPEED
      ? viewOf(
          cameraAt(flight, view.camera, time, landing, clock),
          view.w,
          view.h
        )
      : view;
  const airborne = (flight.pending?.y ?? 0) > 0;
  const p = at ? project(sight, airborne ? at : { ...at, y: 0 }) : null;
  if (!p) {
    return;
  }
  const squash = airborne ? 1 : flatten(sight, p.d);
  const y = Math.min(p.y, view.h);
  const win = windowFor(flight);
  const radiusAt = (left: number) => (0.45 + left * 3.2) * p.s;
  const target = radiusAt(win.perfect);
  const ring = radiusAt(remain);
  let color = "rgb(255 255 255 / 0.55)";
  if (remain <= win.good) {
    color = "rgb(255 255 255 / 0.95)";
  }
  if (remain <= win.perfect) {
    color = GOLD;
  }
  ctx.fillStyle = rgba(GOLD, 0.12);
  ctx.beginPath();
  ctx.ellipse(p.x, y, target, target * squash, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgb(255 255 255 / 0.5)";
  ctx.lineWidth = Math.max(1, 0.02 * p.s);
  ctx.stroke();
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = color;
  for (const [width, alpha] of [
    [0.16, 0.12],
    [0.08, 0.25],
    [0.035, 1],
  ] as const) {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1.5, width * p.s);
    ctx.beginPath();
    ctx.ellipse(p.x, y, ring, ring * squash, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
};

const paintFish = (
  ctx: CanvasRenderingContext2D,
  view: View,
  at: Vec,
  age: number
) => {
  const u = (age + 0.2) / 0.75;
  if (u < 0 || u > 1) {
    return;
  }
  const p = project(view, {
    x: at.x,
    y: 1.1 * 4 * u * (1 - u),
    z: at.z + (u - 0.5) * 0.9,
  });
  if (!p) {
    return;
  }
  const L = 0.5 * p.s;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((u - 0.5) * 2.2);
  ctx.fillStyle = "#e8692f";
  ctx.beginPath();
  ctx.ellipse(0, 0, L * 0.5, L * 0.17, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-L * 0.45, 0);
  ctx.lineTo(-L * 0.75, -L * 0.18);
  ctx.lineTo(-L * 0.75, L * 0.18);
  ctx.fill();
  ctx.fillStyle = "rgb(255 255 255 / 0.85)";
  ctx.beginPath();
  ctx.ellipse(L * 0.08, -L * 0.04, L * 0.16, L * 0.08, 0.2, 0, TAU);
  ctx.fill();
  ctx.restore();
};

const paintFireflies = (
  ctx: CanvasRenderingContext2D,
  view: View,
  river: River,
  clock: number
) => {
  lattice(view, view.far, 1.9, (n, z) => {
    const side = n % 2 === 0 ? -1 : 1;
    const p = project(view, {
      x:
        side * (river.shore - 0.6 + hash(n, 1) * 2.4) +
        Math.sin(clock * 0.4 + n) * 0.3,
      y: 0.5 + hash(n, 2) * 1.1 + Math.sin(clock * 0.7 + n * 2) * 0.15,
      z,
    });
    if (!p) {
      return;
    }
    const pulse = 0.5 + 0.5 * Math.sin(clock * (1.4 + hash(n, 3)) + n);
    const r = Math.max(2, 0.06 * p.s) * (1.5 + pulse);
    const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
    glow.addColorStop(0, `rgb(226 255 150 / ${(0.9 * pulse).toFixed(3)})`);
    glow.addColorStop(1, "rgb(226 255 150 / 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2);
  });
};

const paintDrift = (
  ctx: CanvasRenderingContext2D,
  view: View,
  clock: number,
  colors: string[]
) => {
  for (let i = 0; i < 36; i += 1) {
    const fall = 18 + hash(i, 6) * 30;
    const x =
      (((hash(i, 7) * view.w + Math.sin(clock * 0.7 + i) * 24 - clock * 12) %
        view.w) +
        view.w) %
      view.w;
    const y = (hash(i, 8) * view.h + clock * fall) % view.h;
    const size = 2 + hash(i, 9) * 3.5;
    ctx.fillStyle = colors[i % colors.length] ?? "#ffffff";
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.ellipse(x, y, size, size * 0.55, clock * 1.5 + i, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const makeGrain = () => {
  const tile = document.createElement("canvas");
  tile.width = 160;
  tile.height = 160;
  const ctx = tile.getContext("2d");
  if (ctx) {
    const image = ctx.createImageData(160, 160);
    for (let i = 0; i < image.data.length; i += 4) {
      const v = Math.random() * 255;
      image.data[i] = v;
      image.data[i + 1] = v;
      image.data[i + 2] = v;
      image.data[i + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
  }
  return tile;
};

const paintFilm = (
  ctx: CanvasRenderingContext2D,
  view: View,
  pattern: CanvasPattern | null,
  clock: number
) => {
  const { w, h } = view;
  const vignette = ctx.createRadialGradient(
    w / 2,
    h * 0.45,
    Math.min(w, h) * 0.35,
    w / 2,
    h * 0.5,
    Math.max(w, h) * 0.8
  );
  vignette.addColorStop(0, "rgb(0 0 0 / 0)");
  vignette.addColorStop(1, "rgb(0 0 0 / 0.42)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  if (pattern) {
    ctx.save();
    ctx.globalAlpha = 0.045;
    ctx.translate(hash(clock) * 160, hash(clock, 1) * 160);
    ctx.fillStyle = pattern;
    ctx.fillRect(-160, -160, w + 320, h + 320);
    ctx.restore();
  }
};

const sameProp = (a: Prop | null | undefined, b: Prop) =>
  a !== null && a !== undefined && a.x === b.x && a.z === b.z;

const paintScene = (
  ctx: CanvasRenderingContext2D,
  view: View,
  frame: Frame,
  palette: Palette,
  sprites: Sprites,
  rings: boolean
) => {
  const { shot, time, clock } = frame;
  const props = propsIn(frame.river, view.camera.z + NEAR, view.far).toSorted(
    (a, b) => b.z - a.z
  );
  for (const prop of props) {
    if (prop.kind === "lotus") {
      paintFlat(
        ctx,
        view,
        prop,
        sprites.lotus(prop),
        1.1,
        prop.turn + Math.sin(clock * 0.4 + prop.turn) * 0.05
      );
    } else if (prop.kind === "leaf") {
      paintFlat(
        ctx,
        view,
        prop,
        sprites.leaf(prop),
        0.34,
        prop.turn + clock * 0.06
      );
    }
  }
  if (shot) {
    paintSplashes(ctx, view, shot, palette, time, rings);
    paintApproach(ctx, view, shot, time, frame.clock);
  }
  const flownOf = (prop: Prop) => {
    const hit =
      shot?.bumps.find((bump) => sameProp(bump.prop, prop))?.time ?? null;
    return hit !== null && time > hit ? time - hit : null;
  };
  for (const prop of props) {
    if (prop.kind === "rock") {
      paintRock(ctx, view, prop, sprites.rock(prop), palette, clock);
    } else if (prop.kind === "duck") {
      paintDuck(ctx, view, prop, sprites.duck, palette, clock, flownOf(prop));
    } else if (prop.kind === "dragonfly") {
      paintDragonfly(ctx, view, prop, clock, flownOf(prop));
    }
  }
  for (const bump of shot?.bumps ?? []) {
    if (bump.kind === "fish") {
      paintFish(ctx, view, bump.at, time - bump.time);
    }
  }
  if (shot) {
    paintStone(
      ctx,
      view,
      shot,
      sprites.stone,
      sprites.edge,
      frame.look.trail,
      palette,
      time
    );
    paintBursts(ctx, view, shot, time);
  }
};

const mixHex = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((at) => Number.parseInt(a.slice(at, at + 2), 16));
  const pb = [1, 3, 5].map((at) => Number.parseInt(b.slice(at, at + 2), 16));
  return `#${pa
    .map((v, i) =>
      Math.round(v + ((pb[i] ?? v) - v) * t)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
};

const waterTint: Record<Coast, [string, number]> = {
  bamboo: ["#1f4a34", 0.25],
  cloud: ["#c9d6e6", 0.35],
  firefly: ["#0c2a1c", 0.4],
  ginkgo: ["#4a3a12", 0.15],
  maple: ["#3a2a2e", 0.15],
  sakura: ["#6a3a52", 0.15],
  sea: ["#0d3a5e", 0.45],
  snow: ["#8fa8c4", 0.3],
  stars: ["#0a0f2e", 0.6],
  town: ["#1c2238", 0.15],
  village: ["#000000", 0],
};

const transitionAt = (z: number) => {
  const index = zoneIndex(z);
  const next = zones.at(index + 1);
  if (next === undefined) {
    return { blend: 0, index, next: index };
  }
  return {
    blend: clamp01((z - (next.from - 220)) / 220),
    index,
    next: index + 1,
  };
};

const ripplesOf = (frame: Frame) =>
  (frame.shot?.splashes ?? [])
    .filter(
      (splash) =>
        splash.y === 0 &&
        frame.time >= splash.time &&
        frame.time - splash.time < 4.5
    )
    .slice(-24)
    .map((splash) => ({
      age: frame.time - splash.time,
      strength: splash.big || splash.event !== null ? 1.4 : 1,
      x: splash.x,
      z: splash.z,
    }));

const paintWorld = (
  ctx: CanvasRenderingContext2D,
  view: View,
  frame: Frame,
  palette: Palette,
  sprites: Sprites,
  flat: boolean,
  tier: number
) => {
  const { coast } = zoneOf(view.camera.z);
  if (palette.stars || coast === "stars") {
    paintStars(ctx, view, frame.clock);
  }
  paintFarShore(ctx, view, frame.river, palette);
  paintMist(ctx, view, palette);
  if (flat) {
    paintWater(ctx, view, frame.river, palette, frame.clock);
  }
  paintShores(ctx, view, frame.river, palette, frame.clock);
  paintScene(ctx, view, frame, palette, sprites, flat);
  if ((palette.fireflies || coast === "firefly") && tier > 0) {
    paintFireflies(ctx, view, frame.river, frame.clock);
  }
  const drift = LEAVES.get(coast);
  if (drift !== undefined && tier > 0) {
    paintDrift(ctx, view, frame.clock, drift);
  }
};

const TIER_KEY = "mizukiri.quality";

const guessTier = () => {
  const cores = navigator.hardwareConcurrency || 4;
  const memory =
    "deviceMemory" in navigator ? Number(navigator.deviceMemory) : 4;
  return cores <= 4 || memory <= 2 ? 1 : 2;
};

const startingTier = () => {
  try {
    const stored = localStorage.getItem(TIER_KEY);
    const tier = Number(stored);
    return stored !== null && [0, 1, 2].includes(tier) ? tier : guessTier();
  } catch {
    return guessTier();
  }
};

const keepTier = (tier: number) => {
  try {
    localStorage.setItem(TIER_KEY, String(tier));
    return true;
  } catch {
    return false;
  }
};

export const createRenderer = (surfaces: {
  scene: HTMLCanvasElement;
  water: HTMLCanvasElement;
}) => {
  const canvas = surfaces.scene;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  const water = createWater(surfaces.water);
  const pattern = ctx.createPattern(makeGrain(), "repeat");
  const backdrops = new Map<number, HTMLCanvasElement>();
  let backdropKey = "";
  let uploaded = "";
  let sprites: { key: string; set: Sprites } | null = null;
  let rig: Camera | null = null;
  let lastClock = 0;
  let lastShot: Flight | null = null;
  let ceiling = startingTier();
  let pace = 1 / 60;
  let strain = 0;
  let calm = 0;
  let frames = 0;

  const settle = (next: number) => {
    ceiling = next;
    strain = 0;
    calm = 0;
    pace = 1 / 60;
    keepTier(next);
  };

  const measure = (dt: number) => {
    frames += 1;
    if (dt <= 0 || frames < 45) {
      return;
    }
    pace = pace * 0.9 + dt * 0.1;
    strain = pace > 0.024 ? strain + 1 : Math.max(0, strain - 2);
    calm = pace < 0.0185 ? calm + 1 : 0;
    if (strain > 45 && ceiling > 0) {
      settle(ceiling - 1);
    } else if (calm > 1200 && ceiling < 2) {
      settle(ceiling + 1);
    }
  };

  const backdropFor = (
    index: number,
    view: View,
    river: River,
    palette: Palette,
    dpr: number
  ) => {
    const cached = backdrops.get(index);
    if (cached) {
      return cached;
    }
    const made = document.createElement("canvas");
    paintBackdrop(
      made,
      view,
      river,
      palette,
      zones[index]?.coast ?? "village",
      dpr
    );
    backdrops.set(index, made);
    return made;
  };

  return (frame: Frame) => {
    const dt = Math.min(0.1, Math.max(0, frame.clock - lastClock));
    lastClock = frame.clock;
    measure(dt);
    const tier = ceiling;
    const dpr = Math.min(window.devicePixelRatio || 1, [1, 1.5, 2][tier] ?? 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const palette = palettes[frame.river.sky];
    const { look } = frame;
    const spriteKey = `${frame.river.seed}:${look.color}:${look.form}:${look.pattern}`;
    if (sprites?.key !== spriteKey) {
      sprites = { key: spriteKey, set: createSprites(palette.tint, look) };
    }
    if (frame.shot !== lastShot) {
      rig = null;
      lastShot = frame.shot;
    }
    rig = follow(rig, cameraFor(frame.shot, frame.time, frame.clock), dt);
    const camera = rig;
    const zoom = 1 + Math.abs(camera.roll) * 1.6;
    const level = h * (w < h ? 0.4 : 0.44);
    const shift = h * camera.pitch;
    const view = viewOf(camera, w, h);
    const still: View = { ...view, horizon: level };

    const key = `${w}x${h}@${dpr}:${frame.river.seed}`;
    if (key !== backdropKey) {
      backdrops.clear();
      backdropKey = key;
      uploaded = "";
    }
    const stage = transitionAt(Math.max(0, camera.z));
    const current = backdropFor(stage.index, still, frame.river, palette, dpr);
    const next = backdropFor(stage.next, still, frame.river, palette, dpr);
    const coast = zones[stage.index]?.coast ?? "village";
    const [tintColor, tintAmount] = waterTint[coast];

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    if (water) {
      const pair = `${key}:${stage.index}:${stage.next}`;
      if (pair !== uploaded) {
        water.skies(current, next);
        uploaded = pair;
      }
      water.draw({
        blend: stage.blend,
        camera,
        deep: mixHex(palette.water[2], tintColor, tintAmount),
        detail: tier / 2,
        dpr: Math.min(dpr, [0.75, 1, 1.25][tier] ?? 1.25),
        focal: view.focal,
        height: h,
        horizon: view.horizon,
        mist: palette.mist,
        mistAlpha: palette.mistAlpha,
        ripples: ripplesOf(frame),
        roll: camera.roll,
        shift,
        shallow: mixHex(palette.water[1], tintColor, tintAmount * 0.6),
        shore: openWater(zoneOf(camera.z + 10).coast)
          ? 0
          : frame.river.shore,
        sun: {
          x: w * palette.sunX,
          y: level - level * palette.sunY + shift,
        },
        sunColor: palette.glow,
        time: frame.clock,
        width: w,
        zoom,
      });
    }

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(camera.roll);
    ctx.scale(zoom, zoom);
    ctx.translate(-w / 2, -h / 2);
    if (!water) {
      ctx.drawImage(current, 0, shift, w, h);
      ctx.globalAlpha = stage.blend;
      ctx.drawImage(next, 0, shift, w, h);
      ctx.globalAlpha = 1;
    }
    paintWorld(ctx, view, frame, palette, sprites.set, water === null, tier);
    ctx.restore();
    if (!frame.shot) {
      paintHand(ctx, view, sprites.set, frame.tilt, frame.clock, frame.surface);
    }
    paintFilm(ctx, view, tier > 0 ? pattern : null, frame.clock);
  };
};
