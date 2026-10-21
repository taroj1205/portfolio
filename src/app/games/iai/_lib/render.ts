import type { Fake, Side } from "./duel";
import {
  BLADE_Y,
  CAT_SIZE,
  EARLY_REACH,
  INK,
  LIFT,
  RIM,
  SIGNAL_Y,
  cat,
  crow,
  figures,
  homeOf,
  layoutOf,
  leaf,
  lungeOf,
  mark,
  paint,
  seeded,
  splash,
  VERMILION,
} from "./scene";
import type { Layout, Pose } from "./scene";

export type Clash =
  | { kind: "cut" | "early"; side: Side; at: number }
  | { kind: "draw"; at: number };

export interface Frame {
  now: number;
  cue: { kind: Fake; t: number; held: boolean } | null;
  signal: boolean;
  clash: Clash | null;
  colours: Record<Side, string>;
  raise: number;
  slide: number;
}

interface Blade {
  x: number;
  y: number;
  h: number;
  lean: number;
  phase: number;
  plume: boolean;
}

interface Actor {
  pose: Pose;
  x: number;
  dash: number;
}

interface Body {
  pose: Pose;
  x: number;
  side: Side;
  colour: string;
  ghost?: number;
}

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
  turn: number;
  size: number;
}

const DASH = 110;
const FALL = 380;
const FLASH = 220;
const SHAKE = 260;
const GHOSTS = 4;
const SLASH = 760;
const RAISE = 0.22;
const SLIDE = 0.2;
const GRASS = {
  back: "#141426",
  backPlume: "rgb(246 212 138 / 0.35)",
  front: paint.grass,
  frontPlume: "rgb(246 212 138 / 0.22)",
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const easeOut = (t: number) => 1 - (1 - clamp01(t)) ** 3;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const fade = (t: number, edge: number) =>
  Math.min(clamp01(t / edge), clamp01((1 - t) / edge));

const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};

const ridge = (
  ctx: CanvasRenderingContext2D,
  at: Layout,
  base: number,
  height: number,
  seed: number,
  colour: string,
  mist: string
) => {
  const roll = seeded(seed);
  const waves = Array.from({ length: 4 }, () => ({
    a: roll() * Math.PI * 2,
    f: 1 + roll() * 5,
    k: 0.3 + roll() * 0.7,
  }));
  ctx.beginPath();
  ctx.moveTo(0, at.h);
  for (let x = 0; x <= at.w + 8; x += 8) {
    let y = 0;
    for (const wave of waves) {
      y += Math.sin((x / at.w) * wave.f * Math.PI + wave.a) * wave.k;
    }
    ctx.lineTo(x, base - height * (0.55 + y * 0.28));
  }
  ctx.lineTo(at.w, at.h);
  ctx.closePath();
  const fill = ctx.createLinearGradient(0, base - height, 0, base + height);
  fill.addColorStop(0, colour);
  fill.addColorStop(1, mist);
  ctx.fillStyle = fill;
  ctx.fill();
};

const paintBackdrop = (base: Layout, dpr: number) => {
  const tall = base.h > base.w;
  const at = {
    ...base,
    h: base.h * (tall ? 1 + RAISE : 1),
    w: base.w * (tall ? 1 : 1 + SLIDE),
  };
  const canvas = makeCanvas(at.w * dpr, at.h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.scale(dpr, dpr);
  const sky = ctx.createLinearGradient(0, 0, 0, at.ground);
  sky.addColorStop(0, paint.skyTop);
  sky.addColorStop(0.55, paint.skyMid);
  sky.addColorStop(1, paint.skyLow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, at.w, at.h);

  const roll = seeded(1021);
  for (let i = 0; i < 160; i += 1) {
    const x = roll() * at.w;
    const y = roll() ** 1.4 * at.ground * 0.9;
    ctx.globalAlpha = 0.2 + roll() * 0.6;
    ctx.fillStyle = "#fffaf3";
    ctx.beginPath();
    ctx.arc(x, y, 0.4 + roll() ** 3 * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const { moon } = at;
  const halo = ctx.createRadialGradient(
    moon.x,
    moon.y,
    moon.r * 0.8,
    moon.x,
    moon.y,
    moon.r * 3.4
  );
  halo.addColorStop(0, "rgb(255 226 160 / 0.34)");
  halo.addColorStop(0.4, "rgb(200 170 255 / 0.08)");
  halo.addColorStop(1, "rgb(120 110 200 / 0)");
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, at.w, at.h);

  const face = ctx.createRadialGradient(
    moon.x - moon.r * 0.3,
    moon.y - moon.r * 0.35,
    moon.r * 0.1,
    moon.x,
    moon.y,
    moon.r
  );
  face.addColorStop(0, paint.moon);
  face.addColorStop(0.65, paint.moonMid);
  face.addColorStop(1, paint.moonEdge);
  ctx.fillStyle = face;
  ctx.shadowColor = "rgb(255 230 170 / 0.8)";
  ctx.shadowBlur = moon.r * 0.35;
  ctx.beginPath();
  ctx.arc(moon.x, moon.y, moon.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.save();
  ctx.clip();
  const pocks = seeded(77);
  for (let i = 0; i < 14; i += 1) {
    const a = pocks() * Math.PI * 2;
    const d = pocks() ** 0.7 * moon.r * 0.85;
    const r = moon.r * (0.05 + pocks() * 0.16);
    ctx.globalAlpha = 0.05 + pocks() * 0.07;
    ctx.fillStyle = "#a88a55";
    ctx.beginPath();
    ctx.arc(
      moon.x + Math.cos(a) * d,
      moon.y + Math.sin(a) * d,
      r,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  ridge(
    ctx,
    at,
    at.ground,
    base.h * 0.15,
    5,
    "rgb(52 56 104 / 0.62)",
    "rgb(40 40 80 / 0)"
  );
  ridge(
    ctx,
    at,
    at.ground,
    base.h * 0.11,
    9,
    "rgb(14 15 32 / 0.95)",
    "rgb(14 15 32 / 0.2)"
  );

  const field = ctx.createLinearGradient(0, at.ground, 0, at.h);
  field.addColorStop(0, paint.field);
  field.addColorStop(0.3, "#08080f");
  field.addColorStop(1, paint.fieldLow);
  ctx.fillStyle = field;
  ctx.fillRect(0, at.ground, at.w, at.h - at.ground);

  const pool = ctx.createRadialGradient(
    at.mid,
    at.ground + 10,
    0,
    at.mid,
    at.ground + 10,
    at.w * 0.55
  );
  pool.addColorStop(0, "rgb(255 226 160 / 0.16)");
  pool.addColorStop(1, "rgb(255 226 160 / 0)");
  ctx.save();
  ctx.translate(0, at.ground);
  ctx.scale(1, 0.18);
  ctx.translate(0, -at.ground);
  ctx.fillStyle = pool;
  ctx.fillRect(0, at.ground - at.w, at.w, at.w * 2);
  ctx.restore();

  const mist = ctx.createLinearGradient(
    0,
    at.ground - base.h * 0.05,
    0,
    at.ground + base.h * 0.04
  );
  mist.addColorStop(0, "rgb(170 170 220 / 0)");
  mist.addColorStop(0.5, "rgb(170 170 220 / 0.1)");
  mist.addColorStop(1, "rgb(170 170 220 / 0)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, at.ground - base.h * 0.05, at.w, base.h * 0.09);
  return canvas;
};

const paintVeil = (at: Layout, dpr: number) => {
  const canvas = makeCanvas(at.w * dpr, at.h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.scale(dpr, dpr);
  const veil = ctx.createRadialGradient(
    at.mid,
    at.h * 0.5,
    Math.min(at.w, at.h) * 0.3,
    at.mid,
    at.h * 0.5,
    Math.hypot(at.w, at.h) * 0.62
  );
  veil.addColorStop(0, "rgb(0 0 0 / 0)");
  veil.addColorStop(1, "rgb(0 0 0 / 0.62)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, at.w, at.h);
  return canvas;
};

const paintCloud = (width: number, height: number, seed: number) => {
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  const roll = seeded(seed);
  for (let i = 0; i < 22; i += 1) {
    const x = width * (0.08 + roll() * 0.84);
    const y = height * (0.35 + roll() * 0.3);
    const r = height * (0.18 + roll() * 0.32);
    const puff = ctx.createRadialGradient(x, y, 0, x, y, r);
    puff.addColorStop(0, "rgb(60 62 110 / 0.5)");
    puff.addColorStop(1, "rgb(60 62 110 / 0)");
    ctx.fillStyle = puff;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  return canvas;
};

const growBlades = (at: Layout, front: boolean): Blade[] => {
  const roll = seeded(front ? 4242 : 2424);
  const count = Math.round((at.w / (front ? 9 : 5)) * (front ? 1 : 1.1));
  return Array.from({ length: count }, () => {
    const depth = roll();
    const y = front
      ? at.h - roll() * (at.h - at.ground) * 0.28
      : at.ground - 2 + depth * (at.h - at.ground) * 0.32;
    return {
      h:
        at.scale *
        (front ? 70 + roll() * 90 : (12 + roll() * 34) * (0.7 + depth)),
      lean: (roll() - 0.35) * 0.5,
      phase: roll() * Math.PI * 2,
      plume: roll() < (front ? 0.35 : 0.22),
      x: roll() * (at.w + 40) - 20,
      y,
    };
  });
};

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const ctx = canvas.getContext("2d");
  const paths = new Map<string, Path2D>();
  const mincho =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mincho")
      .trim() || "serif";
  let at = layoutOf(1, 1);
  let dpr = 1;
  let backdrop = makeCanvas(1, 1);
  let veil = backdrop;
  let clouds: HTMLCanvasElement[] = [];
  let back: Blade[] = [];
  let front: Blade[] = [];
  let bits: Bit[] = [];
  let seen: number | null = null;
  let last = 0;
  const offset = { x: 0, y: 0 };

  const path = (d: string) => {
    let found = paths.get(d);
    if (found === undefined) {
      found = new Path2D(d);
      paths.set(d, found);
    }
    return found;
  };

  const fit = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (width === at.w && height === at.h && ratio === dpr) {
      return;
    }
    dpr = ratio;
    at = layoutOf(width, height);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    backdrop = paintBackdrop(at, dpr);
    veil = paintVeil(at, dpr);
    clouds = [1, 2, 3].map((seed) =>
      paintCloud(at.moon.r * 3.2, at.moon.r * 0.9, seed)
    );
    back = growBlades(at, false);
    front = growBlades(at, true);
  };

  const sway = (blade: Blade, now: number, gust: number) => {
    if (calm) {
      return blade.lean;
    }
    const wave = Math.sin(now * 0.0011 + blade.phase + blade.x * 0.004);
    return blade.lean + wave * 0.12 + gust * (0.55 + 0.25 * wave);
  };

  const drawBlades = (
    c: CanvasRenderingContext2D,
    blades: Blade[],
    now: number,
    gust: number,
    colour: string,
    width: number,
    plume: string
  ) => {
    c.beginPath();
    const tips: { x: number; y: number; bend: number; h: number }[] = [];
    for (const blade of blades) {
      const bend = sway(blade, now, gust);
      const tipX = blade.x + bend * blade.h;
      const tipY = blade.y - blade.h * (1 - Math.abs(bend) * 0.35);
      c.moveTo(blade.x, blade.y);
      c.quadraticCurveTo(
        blade.x + bend * blade.h * 0.15,
        blade.y - blade.h * 0.6,
        tipX,
        tipY
      );
      if (blade.plume) {
        tips.push({ bend, h: blade.h, x: tipX, y: tipY });
      }
    }
    c.strokeStyle = colour;
    c.lineWidth = width;
    c.lineCap = "round";
    c.stroke();
    c.beginPath();
    for (const tip of tips) {
      const reach = tip.h * 0.22;
      for (let k = 0; k < 5; k += 1) {
        const along = k / 5;
        const x = tip.x - tip.bend * reach * along * 0.8;
        const y = tip.y + reach * along;
        c.moveTo(x, y);
        c.lineTo(
          x + reach * (0.22 + tip.bend * 0.4),
          y - reach * (0.12 - along * 0.1)
        );
      }
    }
    c.strokeStyle = plume;
    c.lineWidth = width * 0.7;
    c.stroke();
  };

  const drawKnot = (
    c: CanvasRenderingContext2D,
    knot: readonly [number, number],
    colour: string,
    now: number,
    gust: number,
    side: Side
  ) => {
    const [kx, ky] = knot;
    const flow = calm ? 0 : Math.sin(now * 0.006 + (side === "left" ? 0 : 2));
    const stretch = 1 + gust * 0.6;
    c.strokeStyle = colour;
    c.lineCap = "round";
    for (const [lift, length] of [
      [0, 26],
      [5, 20],
    ] as const) {
      c.beginPath();
      c.moveTo(kx, ky);
      c.quadraticCurveTo(
        kx - length * 0.5 * stretch,
        ky + lift + flow * 3,
        kx - length * stretch,
        ky + lift + 4 + flow * 6 - gust * 6
      );
      c.lineWidth = 2.4;
      c.stroke();
    }
    c.beginPath();
    c.moveTo(kx - 2, ky - 6);
    c.lineTo(kx + 9, ky - 7);
    c.lineWidth = 2.6;
    c.stroke();
  };

  const drawFigure = (
    c: CanvasRenderingContext2D,
    { pose, x, side, colour, ghost }: Body,
    now: number,
    gust: number
  ) => {
    const figure = figures[pose];
    c.save();
    c.globalAlpha = ghost ?? 1;
    c.translate(x, at.ground);
    c.scale(at.scale * LIFT * (side === "left" ? 1 : -1), at.scale * LIFT);
    const passes =
      ghost === undefined
        ? ([
            [1.3, RIM],
            [0, INK],
          ] as const)
        : ([[0, INK]] as const);
    for (const [shift, fill] of passes) {
      c.save();
      c.translate(shift, -shift * 0.9);
      c.fillStyle = fill;
      c.strokeStyle = fill;
      c.lineCap = "round";
      for (const d of figure.body) {
        c.fill(path(d));
      }
      for (const line of figure.lines) {
        c.lineWidth = line.width;
        c.stroke(path(line.d));
      }
      c.restore();
    }
    if (ghost !== undefined) {
      c.restore();
      return;
    }
    if (figure.blade !== null) {
      c.save();
      c.shadowColor = "rgb(255 236 190 / 0.9)";
      c.shadowBlur = 8;
      c.fillStyle = paint.blade;
      c.fill(path(figure.blade));
      c.restore();
    }
    drawKnot(c, figure.knot, colour, now, gust, side);
    c.restore();
  };

  const home = (side: Side) => homeOf(at, side);

  const lunge = (side: Side) => lungeOf(at, side);

  const actor = (side: Side, clash: Clash | null, now: number): Actor => {
    if (clash === null) {
      return { dash: 0, pose: "stance", x: home(side) };
    }
    const age = now - clash.at;
    const striking = clash.kind === "draw" || clash.side === side;
    if (striking) {
      const reach = clash.kind === "early" ? EARLY_REACH : 1;
      const k = (calm ? 1 : easeOut(age / DASH)) * reach;
      return {
        dash: k,
        pose: "strike",
        x: lerp(home(side), lunge(side), k),
      };
    }
    const fallen = clash.kind === "cut" && age > (calm ? 0 : FALL);
    return {
      dash: 0,
      pose: fallen ? "fallen" : "stance",
      x: home(side),
    };
  };

  const label = (
    c: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    size: number,
    alpha: number
  ) => {
    c.save();
    c.globalAlpha = alpha;
    c.font = `700 ${size}px ${mincho}`;
    c.textAlign = "center";
    c.fillStyle = "#fff4dc";
    c.shadowColor = "rgb(0 0 0 / 0.8)";
    c.shadowBlur = 8;
    c.fillText(text, x, y);
    c.restore();
  };

  const drawCat = (
    c: CanvasRenderingContext2D,
    t: number,
    held: boolean,
    now: number
  ) => {
    const stop = calm || held || (t > 0.42 && t < 0.62);
    let p = 0;
    if (!calm) {
      if (t <= 0.42) {
        p = lerp(-1.5, 0, t / 0.42);
      } else if (t >= 0.62) {
        p = lerp(0, 1.5, (t - 0.62) / 0.38);
      }
    }
    const x = at.mid + p * at.gap;
    const y = at.ground + 8 * at.scale;
    const size = at.scale * CAT_SIZE;
    const alpha = held ? 1 : fade(t, 0.08);
    const step = stop ? 0 : Math.sin(now * 0.025) * 2.6;
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    c.scale(size, size);
    c.lineCap = "round";
    c.lineWidth = 2.2;
    for (const [shift, fill] of [
      [0.9, RIM],
      [0, INK],
    ] as const) {
      c.save();
      c.translate(shift, -shift);
      c.fillStyle = fill;
      c.strokeStyle = fill;
      for (const d of cat.body) {
        c.fill(path(d));
      }
      c.stroke(path(cat.tail));
      for (const [i, [lx, ly]] of cat.legs.entries()) {
        const swing = i % 2 === 0 ? step : -step;
        c.beginPath();
        c.moveTo(lx, ly);
        c.lineTo(lx + swing, 0);
        c.stroke();
      }
      c.restore();
    }
    if (stop) {
      c.globalAlpha = alpha;
      c.fillStyle = paint.eye;
      c.shadowColor = paint.eye;
      c.shadowBlur = 6;
      for (const [ex, ey] of cat.eyes) {
        c.beginPath();
        c.ellipse(ex, ey, 1.2, 1.6, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.restore();
    if (stop) {
      label(
        c,
        "にゃ",
        x + 16 * size,
        y - 34 * size,
        17 * at.scale,
        alpha * (calm || held ? 1 : fade((t - 0.42) / 0.2, 0.25))
      );
    }
  };

  const drawLeaf = (c: CanvasRenderingContext2D, t: number) => {
    const k = calm ? 0.5 : t;
    const x = at.mid + Math.sin(k * Math.PI * 3) * 30 * at.scale;
    const y = lerp(at.ground - 200 * at.scale, at.ground - 6 * at.scale, k);
    const turn = calm ? 0.4 : Math.sin(k * Math.PI * 4) * 0.9 + k * 2;
    const size = at.scale * 1.7;
    c.save();
    c.globalAlpha = fade(t, 0.1);
    c.translate(x, y);
    c.rotate(turn);
    c.scale(size, size);
    const fill = c.createLinearGradient(-12, -12, 12, 12);
    fill.addColorStop(0, "#ffb347");
    fill.addColorStop(1, VERMILION);
    c.fillStyle = fill;
    c.shadowColor = "rgb(255 140 60 / 0.7)";
    c.shadowBlur = 10;
    c.fill(path(leaf));
    c.shadowBlur = 0;
    c.strokeStyle = "rgb(90 20 10 / 0.7)";
    c.lineWidth = 0.9;
    c.beginPath();
    c.moveTo(0, 4);
    c.lineTo(0, 14);
    c.stroke();
    c.restore();
  };

  const drawCrow = (c: CanvasRenderingContext2D, t: number, now: number) => {
    const k = calm ? 0.5 : t;
    const x = lerp(at.mid + at.w * 0.62, at.mid - at.w * 0.62, k);
    const y = at.moon.y - at.moon.r * 0.3 + Math.sin(k * Math.PI * 2) * 8;
    const size = at.scale * 1.6;
    const alpha = fade(t, 0.06);
    c.save();
    c.globalAlpha = alpha;
    c.translate(x, y);
    c.scale(-size, size);
    c.fillStyle = INK;
    c.fill(path(crow.body));
    const flap = calm || Math.floor(now / 70) % 2 === 0;
    c.fill(path(flap ? crow.up : crow.down));
    c.restore();
    label(
      c,
      "カァ",
      x,
      y - 26 * at.scale,
      15 * at.scale,
      alpha * (calm ? 1 : fade((t - 0.3) / 0.4, 0.25))
    );
  };

  const drawWind = (c: CanvasRenderingContext2D, t: number) => {
    const strength = calm ? 0.7 : Math.sin(Math.PI * t);
    c.save();
    c.lineCap = "round";
    for (let i = 0; i < 6; i += 1) {
      const travel = calm ? 0.5 : t * 1.5 - i * 0.08;
      const x = lerp(-at.w * 0.4, at.w * 1.1, travel);
      const y = at.ground - (30 + i * 26) * at.scale;
      const length = (120 + (i % 3) * 50) * at.scale;
      c.globalAlpha = strength * 0.55;
      c.strokeStyle = paint.wind;
      c.lineWidth = 1.4;
      c.beginPath();
      c.moveTo(x, y);
      c.bezierCurveTo(
        x + length * 0.35,
        y - 8 * at.scale,
        x + length * 0.7,
        y + 6 * at.scale,
        x + length,
        y - 4 * at.scale
      );
      c.stroke();
    }
    c.restore();
    label(
      c,
      "ひゅう",
      at.mid - at.gap * 0.6,
      at.ground - 150 * at.scale,
      15 * at.scale,
      strength
    );
  };

  const drawSignal = (c: CanvasRenderingContext2D) => {
    const x = at.mid;
    const y = at.ground - SIGNAL_Y * at.scale;
    const r = 44 * at.scale;
    c.save();
    c.translate(x, y);
    c.beginPath();
    for (const [i, point] of splash.entries()) {
      if (i === 0) {
        c.moveTo(point.x * r, point.y * r);
      } else {
        c.lineTo(point.x * r, point.y * r);
      }
    }
    c.closePath();
    c.fillStyle = VERMILION;
    c.shadowColor = "rgb(255 80 40 / 0.85)";
    c.shadowBlur = 26 * at.scale;
    c.fill();
    c.shadowBlur = 0;
    c.scale(at.scale * 1.05, at.scale * 1.05);
    c.translate(0, -2);
    c.fillStyle = paint.moon;
    c.fill(path(mark.stem));
    c.fill(path(mark.dot));
    c.restore();
  };

  const spawnBits = (x: number, now: number) => {
    const roll = seeded(Math.floor(now) + 7);
    bits = Array.from({ length: 22 }, () => ({
      size: (6 + roll() * 10) * at.scale,
      spin: (roll() - 0.5) * 0.02,
      turn: roll() * Math.PI,
      vx: (roll() - 0.3) * 0.32 * at.scale,
      vy: -(0.25 + roll() * 0.45) * at.scale,
      x: x + (roll() - 0.5) * 60 * at.scale,
      y: at.ground - roll() * 30 * at.scale,
    }));
  };

  const drawBits = (c: CanvasRenderingContext2D, dt: number, age: number) => {
    if (bits.length === 0) {
      return;
    }
    c.save();
    c.globalAlpha = clamp01(1 - age / 1600);
    c.strokeStyle = "#1a1a26";
    c.lineWidth = 1.6;
    c.lineCap = "round";
    c.beginPath();
    for (const bit of bits) {
      bit.vy += 0.0011 * at.scale * dt;
      bit.x += bit.vx * dt;
      bit.y += bit.vy * dt;
      bit.turn += bit.spin * dt;
      c.moveTo(bit.x, bit.y);
      c.lineTo(
        bit.x + Math.cos(bit.turn) * bit.size,
        bit.y + Math.sin(bit.turn) * bit.size
      );
    }
    c.stroke();
    c.restore();
    if (age > 1600) {
      bits = [];
    }
  };

  const drawSlash = (
    c: CanvasRenderingContext2D,
    clash: Clash,
    age: number
  ) => {
    if (age > SLASH) {
      return;
    }
    const from =
      clash.kind === "draw" ? at.mid - at.gap * 1.2 : home(clash.side);
    const to =
      clash.kind === "draw"
        ? at.mid + at.gap * 1.2
        : home(clash.side === "left" ? "right" : "left") +
          (clash.side === "left" ? 1 : -1) * at.gap * 0.5;
    const grow = calm ? 1 : easeOut(age / 80);
    const end = lerp(from, to, grow);
    const y = at.ground - BLADE_Y * at.scale * LIFT;
    const thick = (clash.kind === "early" ? 2 : 4) * at.scale;
    c.save();
    c.globalAlpha = clamp01(1 - age / SLASH);
    c.fillStyle = paint.slash;
    c.shadowColor = RIM;
    c.shadowBlur = 18;
    c.beginPath();
    c.moveTo(from, y + 6 * at.scale);
    c.quadraticCurveTo((from + end) / 2, y - thick, end, y - 6 * at.scale);
    c.quadraticCurveTo((from + end) / 2, y + thick, from, y + 6 * at.scale);
    c.fill();
    c.restore();
  };

  const noteClash = (clash: Clash | null, now: number) => {
    if (clash === null) {
      seen = null;
      bits = [];
      return;
    }
    if (clash.at !== seen) {
      seen = clash.at;
      if (clash.kind === "cut" && !calm) {
        spawnBits(home(clash.side === "left" ? "right" : "left"), now);
      }
    }
  };

  const gustOf = (cue: Frame["cue"]) => {
    if (cue?.kind !== "wind") {
      return 0;
    }
    return calm ? 0.5 : Math.sin(Math.PI * cue.t);
  };

  const shakeOf = (clash: Clash | null, age: number) =>
    calm || clash === null || clash.kind === "early" || age > SHAKE
      ? 0
      : 7 * (1 - age / SHAKE);

  const drawClouds = (c: CanvasRenderingContext2D, now: number) => {
    for (const [i, cloud] of clouds.entries()) {
      const drift = calm
        ? 0.3
        : (now * 0.000012 * (1 + i * 0.4) + i * 0.37) % 1;
      const x = lerp(-cloud.width, at.w, drift);
      const y = at.moon.y - at.moon.r * (0.9 - i * 0.55);
      c.drawImage(cloud, x, y - cloud.height / 2);
    }
  };

  const drawActors = (
    c: CanvasRenderingContext2D,
    frame: Frame,
    age: number,
    gust: number
  ) => {
    const { clash, colours, now } = frame;
    for (const side of ["left", "right"] as const) {
      const state = actor(side, clash, now);
      if (!calm && state.dash > 0 && age < DASH + 160) {
        for (let g = 1; g <= GHOSTS; g += 1) {
          drawFigure(
            c,
            {
              colour: colours[side],
              ghost: 0.22 * clamp01(1 - (age - DASH) / 160),
              pose: "strike",
              side,
              x: lerp(home(side), lunge(side), (state.dash * g) / (GHOSTS + 1)),
            },
            now,
            gust
          );
        }
      }
    }
    for (const side of ["left", "right"] as const) {
      const state = actor(side, clash, now);
      drawFigure(
        c,
        { colour: colours[side], pose: state.pose, side, x: state.x },
        now,
        gust
      );
    }
  };

  const drawCue = (c: CanvasRenderingContext2D, frame: Frame) => {
    const { cue, now } = frame;
    if (cue?.kind === "cat") {
      drawCat(c, cue.t, cue.held, now);
    } else if (cue?.kind === "leaf") {
      drawLeaf(c, cue.t);
    } else if (cue?.kind === "wind") {
      drawWind(c, cue.t);
    }
  };

  const drawFlash = (
    c: CanvasRenderingContext2D,
    clash: Clash | null,
    age: number
  ) => {
    if (calm || clash === null || clash.kind === "early" || age >= FLASH) {
      return;
    }
    c.fillStyle = `rgb(255 250 235 / ${0.5 * (1 - age / FLASH)})`;
    c.fillRect(-20, -20, at.w + 40, at.h + 40);
  };

  const settle = (frame: Frame, dt: number) => {
    const tall = at.h > at.w;
    const x = tall ? 0 : -Math.min(SLIDE, frame.slide) * at.w;
    const y = tall ? -Math.min(RAISE, frame.raise) * at.h : 0;
    const k = calm ? 1 : 1 - Math.exp(-dt / 140);
    offset.x += (x - offset.x) * k;
    offset.y += (y - offset.y) * k;
  };

  const draw = (frame: Frame) => {
    if (!ctx) {
      return;
    }
    fit();
    const { now, cue, clash } = frame;
    const dt = Math.min(50, Math.max(0, now - last));
    last = now;
    noteClash(clash, now);
    const age = clash === null ? Infinity : now - clash.at;
    const gust = gustOf(cue);
    const shake = shakeOf(clash, age);

    settle(frame, dt);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.translate(
      offset.x + shake * (Math.random() * 2 - 1),
      offset.y + shake * (Math.random() * 2 - 1)
    );
    ctx.drawImage(backdrop, 0, 0, backdrop.width / dpr, backdrop.height / dpr);
    drawClouds(ctx, now);
    if (cue?.kind === "crow") {
      drawCrow(ctx, cue.t, now);
    }
    drawBlades(ctx, back, now, gust, GRASS.back, 1.2, GRASS.backPlume);
    drawActors(ctx, frame, age, gust);
    drawCue(ctx, frame);
    if (frame.signal && (clash === null || age < 90)) {
      drawSignal(ctx);
    }
    if (clash !== null) {
      drawSlash(ctx, clash, age);
      drawBits(ctx, dt, age);
    }
    drawBlades(ctx, front, now, gust, GRASS.front, 2.4, GRASS.frontPlume);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.drawImage(veil, 0, 0, at.w, at.h);
    drawFlash(ctx, clash, age);
  };

  const side = (x: number, y: number): Side => {
    const rect = canvas.getBoundingClientRect();
    const first =
      rect.height >= rect.width
        ? y - rect.top < rect.height / 2
        : x - rect.left < rect.width / 2;

    return first ? "left" : "right";
  };

  return { draw, side };
};
