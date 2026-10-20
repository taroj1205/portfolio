import { randomFrom, stoneAt } from "./simulate";
import type { Prop, River, Sky, Throw, Vec } from "./simulate";

interface Palette {
  sky: [string, string, string];
  sun: string;
  sunX: number;
  sunY: number;
  sunSize: number;
  glow: string;
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
  rock: string;
  leaf: string;
  duck: [string, string, string];
  stars: boolean;
  fireflies: boolean;
}

const palettes: Record<Sky, Palette> = {
  dawn: {
    clouds: "#ffffff",
    duck: ["#6b5f55", "#2b6650", "#e7b04a"],
    fireflies: false,
    glint: "#ffffff",
    glow: "#fff0d6",
    land: "#4b5b6b",
    leaf: "#d0563a",
    mist: "#f4efea",
    mistAlpha: 0.55,
    plume: "#efe9df",
    reed: "#3c4b58",
    ridges: ["#aebdcd", "#7f93a9"],
    ring: "#ffffff",
    rock: "#55606c",
    sky: ["#6b8cb6", "#d9d2da", "#f6e2cc"],
    snow: "#ffffff",
    stars: false,
    sun: "#fff6e6",
    sunSize: 0.03,
    sunX: 0.3,
    sunY: 0.16,
    torii: "#c4503a",
    trees: "#5f7182",
    water: ["#efe4dc", "#a3b4c6", "#4d667c"],
  },
  dusk: {
    clouds: "#f7b48c",
    duck: ["#4a3b33", "#1f4a3a", "#e0a84a"],
    fireflies: false,
    glint: "#ffd8a8",
    glow: "#ffb27a",
    land: "#1a1528",
    leaf: "#d9482b",
    mist: "#f0a98a",
    mistAlpha: 0.28,
    plume: "#e9b98f",
    reed: "#130f1f",
    ridges: ["#4a3a5e", "#2a2440"],
    ring: "#ffe6cf",
    rock: "#2c2636",
    sky: ["#121833", "#5b4470", "#f4a576"],
    snow: "#f6cfc4",
    stars: false,
    sun: "#ffe9c7",
    sunSize: 0.028,
    sunX: 0.68,
    sunY: 0.1,
    torii: "#b8402f",
    trees: "#221b33",
    water: ["#d29384", "#4c4a6e", "#0b1b2b"],
  },
  night: {
    clouds: null,
    duck: ["#2a2a33", "#16302a", "#8a6c34"],
    fireflies: true,
    glint: "#dfe8ff",
    glow: "#9fb6e8",
    land: "#050913",
    leaf: "#7a2c2c",
    mist: "#3a4f80",
    mistAlpha: 0.22,
    plume: "#8e9cc0",
    reed: "#03060d",
    ridges: ["#14203d", "#0a1226"],
    ring: "#c8d6ff",
    rock: "#151c2c",
    sky: ["#03060f", "#0b1630", "#22355e"],
    snow: "#9fb0d6",
    stars: true,
    sun: "#f3f0e2",
    sunSize: 0.022,
    sunX: 0.74,
    sunY: 0.45,
    torii: "#5e2626",
    trees: "#070c19",
    water: ["#2b3d66", "#0f1c37", "#040915"],
  },
};

export interface Frame {
  river: River;
  shot: Throw | null;
  time: number;
  clock: number;
  tilt: number | null;
}

interface Camera {
  z: number;
  y: number;
}
interface View {
  w: number;
  h: number;
  horizon: number;
  focal: number;
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
const STONE = 0.16;

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
    x: view.w / 2 + p.x * s,
    y: view.horizon + (view.camera.y - p.y) * s,
  };
};

const flatten = (view: View, d: number) => view.camera.y / d;

const cameraFor = (shot: Throw | null, time: number): Camera => {
  if (!shot) {
    return { y: 1.5, z: -1.6 };
  }
  const t = Math.min(time, shot.duration - 1e-6);
  let sum = 0;
  for (let k = 0; k < 6; k += 1) {
    sum += stoneAt(shot, t - k * 0.1)?.z ?? shot.distance;
  }
  const settle = ease((time - shot.duration) / 2.2);
  return {
    y: 1.5 - 0.45 * ease(time / 0.8) + 0.9 * settle,
    z: Math.max(-1.6, sum / 6 - 4.2) - 2.6 * settle,
  };
};

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

const paintBackdrop = (
  canvas: HTMLCanvasElement,
  view: View,
  river: River,
  palette: Palette,
  dpr: number
) => {
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

  ctx.fillStyle = palette.sun;
  ctx.shadowColor = palette.glow;
  ctx.shadowBlur = sunR * 1.6;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, TAU);
  ctx.fill();
  ctx.shadowBlur = 0;

  const fuji =
    random() < 0.65
      ? {
          height: h * 0.13,
          width: Math.max(w, h) * 0.3,
          x: w * (0.15 + random() * 0.7),
        }
      : null;
  const far = ridgeLine(random, w, Math.max(w, h), horizon, h * 0.07, fuji);
  const near = ridgeLine(random, w, Math.max(w, h), horizon, h * 0.035, null);

  const farFill = ctx.createLinearGradient(0, horizon - h * 0.16, 0, horizon);
  farFill.addColorStop(0, palette.ridges[0]);
  farFill.addColorStop(1, rgba(palette.ridges[0], 0.75));
  fillRidge(ctx, far, horizon, farFill);
  if (fuji) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, w, horizon - fuji.height * 0.62);
    ctx.clip();
    fillRidge(ctx, far, horizon, rgba(palette.snow, 0.85));
    ctx.restore();
  }
  fillRidge(ctx, near, horizon, palette.ridges[1]);

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

const paintBank = (
  ctx: CanvasRenderingContext2D,
  view: View,
  river: River,
  palette: Palette
) => {
  const ground = project(view, { x: 0, y: 0, z: river.bank });
  if (!ground) {
    return;
  }
  const back = river.bank + 4;
  const top: [number, number][] = [];
  const phase = (river.seed % 1000) / 100;
  for (let x = -70; x <= 70; x += 0.5) {
    const tall =
      5.2 +
      1.6 * Math.sin(x * 0.11 + phase) +
      0.9 * Math.sin(x * 0.31 + phase * 2) +
      0.4 * Math.abs(Math.sin(x * 1.3 + phase));
    const p = project(view, { x, y: tall, z: back });
    if (p) {
      top.push([p.x, p.y]);
    }
  }
  const shore = project(view, { x: 0, y: 0.4, z: river.bank + 0.6 });
  ctx.beginPath();
  ctx.moveTo(-10, ground.y);
  for (const [x, y] of top) {
    ctx.lineTo(x, y);
  }
  ctx.lineTo(view.w + 10, ground.y);
  ctx.closePath();
  ctx.fillStyle = palette.trees;
  ctx.fill();

  ctx.fillStyle = palette.land;
  ctx.fillRect(
    -10,
    shore?.y ?? ground.y,
    view.w + 20,
    ground.y - (shore?.y ?? ground.y) + 1
  );

  const side = hash(river.seed, 7) > 0.5 ? 1 : -1;
  const tx = side * (2 + hash(river.seed, 8) * 7);
  const z = river.bank + 2.2;
  const post = (x: number) => {
    const a = project(view, { x, y: 0.4, z });
    const b = project(view, { x, y: 3.6, z });
    if (a && b) {
      ctx.lineWidth = Math.max(1, 0.22 * a.s);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  };
  ctx.strokeStyle = palette.torii;
  ctx.fillStyle = palette.torii;
  post(tx - 1.1);
  post(tx + 1.1);
  const beam = (y: number, half: number, thick: number, curve: number) => {
    const l = project(view, { x: tx - half, y, z });
    const r = project(view, { x: tx + half, y, z });
    if (!l || !r) {
      return;
    }
    const t = thick * l.s;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y - curve * l.s);
    ctx.quadraticCurveTo(
      (l.x + r.x) / 2,
      l.y + curve * l.s * 0.6,
      r.x,
      r.y - curve * l.s
    );
    ctx.lineTo(r.x, r.y - curve * l.s + t);
    ctx.quadraticCurveTo(
      (l.x + r.x) / 2,
      l.y + curve * l.s * 0.6 + t,
      l.x,
      l.y - curve * l.s + t
    );
    ctx.closePath();
    ctx.fill();
  };
  beam(3.75, 1.75, 0.26, 0.18);
  beam(3.05, 1.35, 0.16, 0);
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
  lattice(view, river.bank, 0.45, (n, z) => {
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
  lattice(view, river.bank, 0.3, (n, z) => {
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

const paintShores = (
  ctx: CanvasRenderingContext2D,
  view: View,
  river: River,
  palette: Palette,
  clock: number
) => {
  for (const side of [-1, 1]) {
    const near = project(view, {
      x: side * river.shore,
      y: 0,
      z: view.camera.z + NEAR + 0.05,
    });
    const far = project(view, { x: side * river.shore, y: 0, z: river.bank });
    const edge = side < 0 ? -20 : view.w + 20;
    if (!near || !far) {
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(far.x, far.y);
    ctx.lineTo(edge, far.y);
    ctx.lineTo(edge, view.h + 20);
    ctx.lineTo(near.x, near.y);
    ctx.closePath();
    ctx.fillStyle = palette.land;
    ctx.fill();

    lattice(view, river.bank, 0.7, (n, z) => {
      for (let k = 0; k < 2; k += 1) {
        const x = side * (river.shore + 0.1 + hash(n * side, k) * 1.6);
        const tall = 1 + hash(n * side, k + 2) * 0.9;
        const sway = Math.sin(clock * 1.3 + z * 0.7 + k) * 0.1 * tall;
        const base = project(view, { x, y: 0, z });
        const tip = project(view, { x: x + sway, y: tall, z });
        if (!base || !tip) {
          continue;
        }
        ctx.strokeStyle = palette.reed;
        ctx.lineWidth = Math.max(0.6, 0.03 * base.s);
        ctx.beginPath();
        ctx.moveTo(base.x, base.y);
        ctx.quadraticCurveTo(base.x, (base.y + tip.y) / 2, tip.x, tip.y);
        ctx.stroke();
        if (hash(n * side, k + 4) > 0.45) {
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
        }
      }
    });
  }
};

const paintRipples = (
  ctx: CanvasRenderingContext2D,
  view: View,
  shot: Throw,
  palette: Palette,
  time: number
) => {
  for (const [i, splash] of shot.splashes.entries()) {
    const age = time - splash.time;
    if (age < 0 || age > 5) {
      continue;
    }
    const p = project(view, { x: splash.x, y: 0, z: splash.z });
    if (!p) {
      continue;
    }
    const squash = flatten(view, p.d);
    const grow = splash.big ? 1.25 : 0.85;
    for (let k = 0; k < 3; k += 1) {
      const a = age - k * 0.2;
      if (a <= 0) {
        continue;
      }
      const r = (0.08 + a * grow * (1 - a * 0.06)) * p.s;
      const alpha = (1 - age / 5) ** 2 * 0.6 * (1 - k * 0.25);
      ctx.strokeStyle = rgba(palette.ring, alpha);
      ctx.lineWidth = Math.max(0.6, 0.014 * p.s);
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, r, r * squash, 0, 0, TAU);
      ctx.stroke();
    }
    if (age < 0.7) {
      const count = splash.big ? 16 : 8;
      for (let j = 0; j < count; j += 1) {
        const angle = hash(i, j) * TAU;
        const out = 0.3 + hash(i, j + 20) * (splash.big ? 1.2 : 0.7);
        const up = (splash.big ? 1.6 : 0.9) + hash(i, j + 40) * 1.4;
        const y = up * age - 4.9 * age * age;
        if (y < 0) {
          continue;
        }
        const drop = project(view, {
          x: splash.x + Math.cos(angle) * out * age,
          y,
          z: splash.z + Math.sin(angle) * out * age * 0.6,
        });
        if (drop) {
          ctx.fillStyle = rgba(palette.ring, 0.85 * (1 - age / 0.7));
          ctx.beginPath();
          ctx.arc(drop.x, drop.y, Math.max(0.7, 0.012 * drop.s), 0, TAU);
          ctx.fill();
        }
      }
    }
  }
};

const paintLeaf = (
  ctx: CanvasRenderingContext2D,
  view: View,
  prop: Prop,
  palette: Palette,
  clock: number
) => {
  const p = project(view, { x: prop.x, y: 0, z: prop.z });
  if (!p) {
    return;
  }
  const size = 0.17 * p.s;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(1, Math.max(0.25, flatten(view, p.d) * 1.6));
  ctx.rotate(prop.turn + clock * 0.06);
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const angle = (i / 10) * TAU - Math.PI / 2;
    const r = i % 2 === 0 ? size : size * 0.42;
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
  }
  ctx.closePath();
  ctx.fillStyle = palette.leaf;
  ctx.fill();
  ctx.restore();
};

const paintRock = (
  ctx: CanvasRenderingContext2D,
  view: View,
  prop: Prop,
  palette: Palette,
  clock: number
) => {
  const base = project(view, { x: prop.x, y: 0, z: prop.z });
  if (!base) {
    return;
  }
  const squash = flatten(view, base.d);
  ctx.strokeStyle = rgba(
    palette.ring,
    0.25 + 0.1 * Math.sin(clock * 2 + prop.turn)
  );
  ctx.lineWidth = Math.max(0.6, 0.02 * base.s);
  ctx.beginPath();
  ctx.ellipse(base.x, base.y, 0.7 * base.s, 0.7 * base.s * squash, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i <= 8; i += 1) {
    const u = i / 8;
    const x = (u - 0.5) * 1.1 * (1 + (hash(prop.turn, i) - 0.5) * 0.2);
    const y =
      Math.sin(u * Math.PI) ** 0.7 *
      0.45 *
      (0.8 + hash(prop.turn, i + 9) * 0.3);
    const q = project(view, { x: prop.x + x, y, z: prop.z });
    if (q) {
      ctx.lineTo(q.x, q.y);
    }
  }
  ctx.closePath();
  ctx.fillStyle = palette.rock;
  ctx.fill();
  ctx.fillStyle = rgba(palette.glow, 0.18);
  ctx.fill();
};

const paintDuck = (
  ctx: CanvasRenderingContext2D,
  view: View,
  prop: Prop,
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
  const L = 0.42 * p.s;
  const facing = Math.cos(prop.turn) >= 0 ? 1 : -1;
  const [body, head, beak] = palette.duck;

  const draw = (mirror: boolean) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(facing, mirror ? -0.6 : 1);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, -L * 0.18, L * 0.5, L * 0.2, 0, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-L * 0.42, -L * 0.24);
    ctx.lineTo(-L * 0.62, -L * 0.36);
    ctx.lineTo(-L * 0.4, -L * 0.12);
    ctx.fill();
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(L * 0.36, -L * 0.48, L * 0.14, 0, TAU);
    ctx.fill();
    ctx.fillRect(L * 0.28, -L * 0.46, L * 0.12, L * 0.18);
    ctx.fillStyle = "rgb(255 255 255 / 0.75)";
    ctx.fillRect(L * 0.27, -L * 0.3, L * 0.14, L * 0.03);
    ctx.fillStyle = beak;
    ctx.beginPath();
    ctx.ellipse(L * 0.54, -L * 0.45, L * 0.09, L * 0.035, 0.15, 0, TAU);
    ctx.fill();
    if (flown !== null) {
      const flap = Math.sin(flown * 28) * L * 0.5;
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.moveTo(-L * 0.1, -L * 0.3);
      ctx.lineTo(L * 0.05, -L * 0.3 - flap);
      ctx.lineTo(L * 0.2, -L * 0.28);
      ctx.fill();
    }
    ctx.restore();
  };

  if (flown === null) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    draw(true);
    ctx.restore();
    ctx.strokeStyle = rgba(palette.ring, 0.25);
    ctx.lineWidth = Math.max(0.6, 0.012 * p.s);
    ctx.beginPath();
    ctx.moveTo(p.x - facing * L * 0.5, p.y);
    ctx.lineTo(p.x - facing * L * 1.3, p.y - L * 0.06);
    ctx.moveTo(p.x - facing * L * 0.5, p.y + L * 0.02);
    ctx.lineTo(p.x - facing * L * 1.3, p.y + L * 0.1);
    ctx.stroke();
  }
  draw(false);
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

const paintStone = (
  ctx: CanvasRenderingContext2D,
  view: View,
  shot: Throw,
  palette: Palette,
  time: number
) => {
  const at = stoneAt(shot, time);
  if (!at) {
    return;
  }
  for (let k = 6; k >= 1; k -= 1) {
    const past = stoneAt(shot, time - k * 0.014);
    const q = past && time <= shot.duration ? project(view, past) : null;
    if (q) {
      ctx.fillStyle = rgba(palette.ring, 0.12 * (1 - k / 7));
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(1, STONE * 0.35 * q.s), 0, TAU);
      ctx.fill();
    }
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
      STONE * 0.6 * shadow.s,
      STONE * 0.6 * shadow.s * flatten(view, shadow.d),
      0,
      0,
      TAU
    );
    ctx.fill();
  }
  const len = Math.max(1.8, STONE * p.s);
  const halo = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, len * 2.2 + 6);
  halo.addColorStop(0, rgba(palette.ring, 0.35));
  halo.addColorStop(1, rgba(palette.ring, 0));
  ctx.fillStyle = halo;
  ctx.fillRect(
    p.x - len * 3 - 6,
    p.y - len * 3 - 6,
    len * 6 + 12,
    len * 6 + 12
  );
  ctx.save();
  ctx.translate(p.x, p.y);
  const body = ctx.createLinearGradient(0, -len * 0.3, 0, len * 0.3);
  body.addColorStop(0, "#9b978f");
  body.addColorStop(1, "#3c3d44");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, len * 0.55, len * 0.2, -0.08, 0, TAU);
  ctx.fill();
  const spin = Math.cos(time * 42) * len * 0.25;
  ctx.fillStyle = rgba(palette.glint, 0.6);
  ctx.beginPath();
  ctx.ellipse(spin, -len * 0.07, len * 0.16, len * 0.05, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
};

const paintFireflies = (
  ctx: CanvasRenderingContext2D,
  view: View,
  river: River,
  clock: number
) => {
  lattice(view, river.bank, 1.9, (n, z) => {
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

const paintHand = (
  ctx: CanvasRenderingContext2D,
  view: View,
  palette: Palette,
  tilt: number | null,
  clock: number
) => {
  const aiming = tilt !== null;
  const angle = tilt ?? 30 + 4 * Math.sin(clock * 1.4);
  const size = Math.min(view.w * 0.22, 120);
  const cx = view.w / 2;
  const cy = view.h * 0.8 + (aiming ? 0 : Math.sin(clock * 1.6) * 3);
  const radius = size * 1.05;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = "round";
  ctx.strokeStyle = `rgb(255 255 255 / ${aiming ? 0.35 : 0.14})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, radius, (-50 * Math.PI) / 180, (8 * Math.PI) / 180);
  ctx.stroke();
  for (let deg = 0; deg <= 45; deg += 15) {
    const a = (-deg * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (radius - 5), Math.sin(a) * (radius - 5));
    ctx.lineTo(Math.cos(a) * (radius + 5), Math.sin(a) * (radius + 5));
    ctx.stroke();
  }
  const needle = (-angle * Math.PI) / 180;
  ctx.fillStyle = `rgb(255 255 255 / ${aiming ? 0.95 : 0.3})`;
  ctx.beginPath();
  ctx.arc(
    Math.cos(needle) * radius,
    Math.sin(needle) * radius,
    aiming ? 5 : 3.5,
    0,
    TAU
  );
  ctx.fill();
  if (aiming) {
    ctx.font = `600 13px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${Math.round(angle)}°`,
      Math.cos(needle) * (radius + 14),
      Math.sin(needle) * (radius + 14)
    );
  }

  ctx.rotate(needle);
  ctx.shadowColor = "rgb(0 0 0 / 0.45)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 10;
  const body = ctx.createRadialGradient(
    -size * 0.15,
    -size * 0.12,
    size * 0.05,
    0,
    0,
    size * 0.6
  );
  body.addColorStop(0, "#b5b1a8");
  body.addColorStop(0.55, "#6f6d6a");
  body.addColorStop(1, "#34353b");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.5, size * 0.17, 0, 0, TAU);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.strokeStyle = rgba(palette.glow, 0.5);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.5, size * 0.17, 0, Math.PI * 1.05, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();
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

const paintScene = (
  ctx: CanvasRenderingContext2D,
  view: View,
  frame: Frame,
  palette: Palette
) => {
  const { shot, time, clock } = frame;
  if (shot) {
    paintRipples(ctx, view, shot, palette, time);
  }
  const order = [...frame.river.props.entries()].toSorted(
    ([, a], [, b]) => b.z - a.z
  );
  for (const [, prop] of order) {
    if (prop.kind === "leaf") {
      paintLeaf(ctx, view, prop, palette, clock);
    }
  }
  for (const [index, prop] of order) {
    if (prop.kind === "rock") {
      paintRock(ctx, view, prop, palette, clock);
    } else if (prop.kind === "duck") {
      const hit = shot?.hit?.prop === index ? shot.hit.time : null;
      paintDuck(
        ctx,
        view,
        prop,
        palette,
        clock,
        hit !== null && time > hit ? time - hit : null
      );
    }
  }
  if (shot?.ending === "fish" && shot.hit) {
    paintFish(ctx, view, shot.hit.at, time - shot.hit.time);
  }
  if (shot) {
    paintStone(ctx, view, shot, palette, time);
  }
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

export const createRenderer = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  const backdrop = document.createElement("canvas");
  const pattern = ctx.createPattern(makeGrain(), "repeat");
  let painted = "";

  return (frame: Frame) => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (
      canvas.width !== Math.round(w * dpr) ||
      canvas.height !== Math.round(h * dpr)
    ) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const palette = palettes[frame.river.sky];
    const view: View = {
      camera: cameraFor(frame.shot, frame.time),
      focal: h * 0.85,
      h,
      horizon: h * (w < h ? 0.4 : 0.44),
      w,
    };

    const key = `${w}x${h}@${dpr}:${frame.river.seed}`;
    if (key !== painted) {
      paintBackdrop(backdrop, view, frame.river, palette, dpr);
      painted = key;
    }
    ctx.drawImage(backdrop, 0, 0, w, h);
    if (palette.stars) {
      paintStars(ctx, view, frame.clock);
    }
    paintBank(ctx, view, frame.river, palette);
    paintMist(ctx, view, palette);
    paintWater(ctx, view, frame.river, palette, frame.clock);
    paintScene(ctx, view, frame, palette);
    if (palette.fireflies) {
      paintFireflies(ctx, view, frame.river, frame.clock);
    }
    paintShores(ctx, view, frame.river, palette, frame.clock);
    if (!frame.shot) {
      paintHand(ctx, view, palette, frame.tilt, frame.clock);
    }
    paintFilm(ctx, view, pattern, frame.clock);
  };
};
