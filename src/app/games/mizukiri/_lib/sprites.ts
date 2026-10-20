import type { Color } from "./cosmetics";
import { randomFrom } from "./simulate";

export interface Tint {
  color: string;
  alpha: number;
}

const TAU = Math.PI * 2;

const surface = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D is not available");
  }
  return { canvas, ctx };
};

const trace = (ctx: CanvasRenderingContext2D, points: [number, number][]) => {
  ctx.beginPath();
  for (const [x, y] of points) {
    ctx.lineTo(x, y);
  }
  ctx.closePath();
};

const shade = (ctx: CanvasRenderingContext2D, tint: Tint) => {
  if (tint.alpha <= 0) {
    return;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = "source-atop";
  ctx.globalAlpha = tint.alpha;
  ctx.fillStyle = tint.color;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
};

type Curve = (t: number) => [number, number];

const ellipse =
  (rx: number, ry: number): Curve =>
  (t) => [rx * Math.cos(t), ry * Math.sin(t)];

const polar =
  (rx: number, ry: number, radius: (t: number) => number): Curve =>
  (t) => [rx * radius(t) * Math.cos(t), ry * radius(t) * Math.sin(t)];

const lower =
  (by: number, curve: Curve): Curve =>
  (t) => {
    const [x, y] = curve(t);
    return [x, y + by];
  };

const crescent: Curve = (t) => {
  const tip = 1.016;
  if (t < Math.PI) {
    const a = tip + (t / Math.PI) * (2 * Math.PI - 2 * tip);
    return [110 * (Math.cos(a) + 0.24), 80 * Math.sin(a)];
  }
  const a = 4.686 - ((t - Math.PI) / Math.PI) * 3.09;
  return [110 * (0.79 + 0.85 * Math.cos(a)), 80 * 0.85 * Math.sin(a)];
};

const fan: Curve = (t) => {
  const outer = t < Math.PI;
  const u = outer ? t / Math.PI : (t - Math.PI) / Math.PI;
  const a = outer
    ? (7 * Math.PI) / 6 + u * ((2 * Math.PI) / 3)
    : (11 * Math.PI) / 6 - u * ((2 * Math.PI) / 3);
  const r = outer ? 120 : 26;
  return [r * Math.cos(a), r * Math.sin(a) + 53];
};

const fish: Curve = (t) => {
  const tail = Math.exp(-(((t - Math.PI) / 0.45) ** 2));
  const notch = Math.exp(-(((t - Math.PI) / 0.15) ** 2));
  return [
    95 * Math.cos(t) - 32 * tail + 26 * notch + 10,
    48 * Math.sin(t) * (1 + 2.2 * tail),
  ];
};

const hexagon: Curve = (t) => {
  const sector = Math.PI / 3;
  const r =
    Math.cos(sector / 2) /
    Math.cos((((t % sector) + sector) % sector) - sector / 2);
  return [110 * r * Math.cos(t), 78 * r * Math.sin(t)];
};

const bend = (value: number, power: number) =>
  Math.sign(value) * Math.abs(value) ** power;

const CURVES = new Map<string, Curve>([
  [
    "bean",
    (t) => {
      const [x, y] = ellipse(112, 70)(t);
      const dent = Math.atan2(
        Math.sin(t + Math.PI / 2),
        Math.cos(t + Math.PI / 2)
      );
      return [x, y + 30 * Math.exp(-((dent / 0.6) ** 2))];
    },
  ],
  ["crescent", crescent],
  [
    "diamond",
    (t) => [118 * bend(Math.cos(t), 1.7), 72 * bend(Math.sin(t), 1.7)],
  ],
  ["fan", fan],
  ["fish", fish],
  ["shell", hexagon],
  ["drop", (t) => [118 * Math.cos(t), 92 * Math.sin(t) * Math.sin(t / 2)]],
  ["flat", ellipse(122, 48)],
  [
    "gourd",
    (t) => [
      118 * Math.cos(t),
      104 *
        Math.sin(t) *
        (0.5 + 0.22 * Math.cos(2 * t)) *
        (1 - 0.18 * Math.cos(t)),
    ],
  ],
  [
    "heart",
    (t) => [
      105.6 * Math.sin(t) ** 3,
      -4.3 *
        (13 * Math.cos(t) -
          5 * Math.cos(2 * t) -
          2 * Math.cos(3 * t) -
          Math.cos(4 * t)) -
        4,
    ],
  ],
  [
    "leaf",
    (t) => [
      120 * Math.cos(t),
      66 * Math.sin(t) * Math.abs(Math.sin(t)) - 10 * Math.cos(t) ** 2 + 5,
    ],
  ],
  [
    "triangle",
    lower(
      10,
      polar(90, 74, (t) => 1 + 0.13 * Math.cos(3 * (t + Math.PI / 2)))
    ),
  ],
  ["oval", ellipse(118, 70)],
  ["round", ellipse(86, 80)],
  [
    "square",
    (t) => [
      100 * Math.sign(Math.cos(t)) * Math.abs(Math.cos(t)) ** 0.45,
      72 * Math.sign(Math.sin(t)) * Math.abs(Math.sin(t)) ** 0.45,
    ],
  ],
  [
    "star",
    lower(
      8,
      polar(90, 80, (t) => 0.74 + 0.26 * Math.cos(5 * (t + Math.PI / 2)))
    ),
  ],
]);

export const outlineOf = (form: string): [number, number][] => {
  const curve = CURVES.get(form) ?? ellipse(118, 70);
  return Array.from({ length: 97 }, (_, i) => {
    const [x, y] = curve((i / 96) * TAU);
    return [128 + x, 80 + y];
  });
};

const roughen = (outline: [number, number][], random: () => number) => {
  const phases = Array.from({ length: 4 }, () => random() * TAU);
  return outline.map(([x, y], i): [number, number] => {
    const a = (i / (outline.length - 1)) * TAU;
    const wobble = phases.reduce(
      (sum, phase, k) => sum + (0.03 / (k + 1)) * Math.sin((k + 2) * a + phase),
      1
    );
    return [128 + (x - 128) * wobble, 80 + (y - 80) * wobble];
  });
};

const paintWaves = (ctx: CanvasRenderingContext2D) => {
  ctx.strokeStyle = "rgb(255 255 255 / 0.32)";
  ctx.lineWidth = 2.5;
  for (let row = 0; row < 9; row += 1) {
    const y = row * 20;
    for (let x = row % 2 === 0 ? 0 : 22; x < 300; x += 44) {
      for (const r of [22, 15, 8]) {
        ctx.beginPath();
        ctx.arc(x, y, r, Math.PI, TAU);
        ctx.stroke();
      }
    }
  }
};

const paintCracks = (ctx: CanvasRenderingContext2D, random: () => number) => {
  ctx.strokeStyle = "#f2c14e";
  ctx.shadowColor = "#ffd27a";
  ctx.shadowBlur = 8;
  ctx.lineWidth = 3;
  for (let k = 0; k < 3; k += 1) {
    let x = 40 + random() * 60;
    let y = random() * 160;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let step = 0; step < 7; step += 1) {
      x += 18 + random() * 14;
      y += (random() - 0.5) * 40;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.shadowBlur = 0;
};

const paintPattern = (
  ctx: CanvasRenderingContext2D,
  pattern: string,
  random: () => number
) => {
  if (pattern === "stripe") {
    ctx.strokeStyle = "rgb(255 255 255 / 0.28)";
    ctx.lineWidth = 9;
    for (let k = 0; k < 4; k += 1) {
      const y = 35 + k * 30;
      ctx.beginPath();
      ctx.moveTo(-10, y);
      ctx.bezierCurveTo(80, y - 18, 170, y + 18, 266, y - 4);
      ctx.stroke();
    }
  } else if (pattern === "speckle") {
    for (let i = 0; i < 70; i += 1) {
      ctx.fillStyle =
        random() > 0.5 ? "rgb(255 255 255 / 0.35)" : "rgb(0 0 0 / 0.35)";
      ctx.beginPath();
      ctx.arc(random() * 256, random() * 160, 2 + random() * 5, 0, TAU);
      ctx.fill();
    }
  } else if (pattern === "wave") {
    paintWaves(ctx);
  } else if (pattern === "checker") {
    ctx.fillStyle = "rgb(0 0 0 / 0.28)";
    for (let y = 0; y < 160; y += 22) {
      for (let x = (y / 22) % 2 === 0 ? 0 : 22; x < 256; x += 44) {
        ctx.fillRect(x, y, 22, 22);
      }
    }
  } else if (pattern === "dots") {
    ctx.fillStyle = "rgb(255 255 255 / 0.4)";
    for (let y = 14; y < 160; y += 30) {
      for (let x = (y / 30) % 2 < 1 ? 14 : 29; x < 256; x += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, TAU);
        ctx.fill();
      }
    }
  } else if (pattern === "mended") {
    paintCracks(ctx, random);
  } else if (pattern === "ring") {
    ctx.strokeStyle = "rgb(250 248 240 / 0.85)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(128, 80, 70, 40, -0.15, 0, TAU);
    ctx.stroke();
  }
};

const W = 256;
const H = 160;

const lattice = (x: number, y: number, seed: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43_758.5453;
  return n - Math.floor(n);
};

const smooth = (t: number) => t * t * (3 - 2 * t);

const noise = (x: number, y: number, seed: number) => {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const top =
    lattice(ix, iy, seed) +
    (lattice(ix + 1, iy, seed) - lattice(ix, iy, seed)) * fx;
  const bottom =
    lattice(ix, iy + 1, seed) +
    (lattice(ix + 1, iy + 1, seed) - lattice(ix, iy + 1, seed)) * fx;
  return top + (bottom - top) * fy;
};

const fbm = (x: number, y: number, seed: number) =>
  noise(x, y, seed) * 0.5 +
  noise(x * 2.1, y * 2.1, seed + 1) * 0.25 +
  noise(x * 4.3, y * 4.3, seed + 2) * 0.15 +
  noise(x * 8.7, y * 8.7, seed + 3) * 0.1;

const blur = (source: Float32Array, radius: number) => {
  const pass = (
    from: Float32Array,
    step: number,
    span: number,
    lines: number
  ) => {
    const to = new Float32Array(from.length);
    const width = radius * 2 + 1;
    for (let line = 0; line < lines; line += 1) {
      const base = line * (step === 1 ? W : 1);
      let sum = 0;
      for (let k = -radius; k <= radius; k += 1) {
        sum += from[base + Math.min(span - 1, Math.max(0, k)) * step] ?? 0;
      }
      for (let i = 0; i < span; i += 1) {
        to[base + i * step] = sum / width;
        const add = Math.min(span - 1, i + radius + 1);
        const drop = Math.max(0, i - radius);
        sum += (from[base + add * step] ?? 0) - (from[base + drop * step] ?? 0);
      }
    }
    return to;
  };
  let out = source;
  for (let k = 0; k < 3; k += 1) {
    out = pass(pass(out, 1, W, H), W, H, W);
  }
  return out;
};

const rgbOf = (hex: string): [number, number, number] => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const LIGHT = (() => {
  const [x, y, z] = [-0.45, -0.62, 0.65];
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length] as const;
})();

const HALF = (() => {
  const [x, y, z] = [LIGHT[0], LIGHT[1], LIGHT[2] + 1];
  const length = Math.hypot(x, y, z);
  return [x / length, y / length, z / length] as const;
})();

const alphaOf = (paint: (ctx: CanvasRenderingContext2D) => void) => {
  const { ctx } = surface(W, H);
  paint(ctx);
  return ctx.getImageData(0, 0, W, H).data;
};

const centerOf = (coverage: Float32Array) => {
  let sx = 0;
  let sy = 0;
  let total = 0;
  let left = W;
  let right = 0;
  let top = H;
  let bottom = 0;
  for (let i = 0; i < coverage.length; i += 1) {
    const c = coverage[i] ?? 0;
    if (c > 0.5) {
      const x = i % W;
      const y = Math.floor(i / W);
      sx += x;
      sy += y;
      total += 1;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  return {
    cx: sx / Math.max(1, total),
    cy: sy / Math.max(1, total),
    rx: Math.max(1, (right - left) / 2),
    ry: Math.max(1, (bottom - top) / 2),
  };
};

interface Surface {
  height: Float32Array;
  center: ReturnType<typeof centerOf>;
}

const normalAt = (
  { height, center }: Surface,
  i: number,
  x: number,
  y: number
) => {
  const dx =
    ((height[i + 1] ?? 0) - (height[i - 1] ?? 0)) * 7 +
    ((center.cx - x) / center.rx) * 0.45;
  const dy =
    ((height[i + W] ?? 0) - (height[i - W] ?? 0)) * 7 +
    ((center.cy - y) / center.ry) * 0.45;
  const length = Math.hypot(dx, dy, 1);
  return [-dx / length, -dy / length, 1 / length] as const;
};

interface Finish {
  color: Color;
  tones: [number, number, number][];
  glow: [number, number, number] | null;
}

const finishOf = (color: Color): Finish => ({
  color,
  glow: color.glow === null ? null : rgbOf(color.glow),
  tones: color.mineral.map(rgbOf),
});

const mineralAt = (
  { color, tones }: Finish,
  x: number,
  y: number,
  seed: number
) => {
  const [light, mid, dark] = tones;
  const rough = 1 - color.gloss;
  const fine = fbm(x / 9, y / 9, seed + 5);
  const tone =
    (fbm(x / 70, y / 70, seed) - 0.5) * 1.3 +
    (fine - 0.5) * rough +
    (lattice(x, y, seed + 9) - 0.5) * 0.3 * rough;
  const target = tone < 0 ? dark : light;
  const amount = Math.min(1, Math.abs(tone) * 1.3);
  return {
    fine,
    rgb: [0, 1, 2].map(
      (c) => (mid?.[c] ?? 0) + ((target?.[c] ?? 0) - (mid?.[c] ?? 0)) * amount
    ),
  };
};

const shadeAt = (
  { color, glow }: Finish,
  albedo: number[],
  normal: readonly [number, number, number],
  h: number,
  fine: number
) => {
  const [nx, ny, nz] = normal;
  const diffuse = Math.max(0, nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2]);
  const facing = Math.max(0, nx * HALF[0] + ny * HALF[1] + nz * HALF[2]);
  const spec =
    facing ** (18 + color.gloss * 55) * color.gloss * 1.2 + facing ** 6 * 0.08;
  const sky = 0.5 - ny * 0.5;
  const lit = color.metal
    ? 0.12 + 1.25 * sky * sky + 0.25 * diffuse
    : 0.3 + 0.85 * diffuse;
  const occlusion = 0.5 + 0.5 * Math.min(1, h * 1.6);
  const rim = (1 - nz) ** 2 * 33;
  const inner = (0.02 + 0.1 * h * h) * (0.6 + 0.4 * fine);
  return albedo.map((value, c) =>
    Math.min(
      255,
      value * lit * occlusion +
        (color.metal ? value * 1.7 : 255) * spec +
        rim +
        (glow?.[c] ?? 0) * inner
    )
  );
};

export const stoneSprite = (color: Color, form: string, pattern: string) => {
  const seed = color.mineral[1].length * 97 + form.length * 13;
  const random = randomFrom(seed);
  const outline = roughen(outlineOf(form), random);
  const mask = alphaOf((ctx) => {
    ctx.fillStyle = "#ffffff";
    trace(ctx, outline);
    ctx.fill();
  });
  const decor = alphaOf((ctx) => {
    paintPattern(ctx, pattern, random);
  });
  const coverage = new Float32Array(W * H);
  for (let i = 0; i < coverage.length; i += 1) {
    coverage[i] = (mask[i * 4 + 3] ?? 0) / 255;
  }
  const surfaceOf: Surface = {
    center: centerOf(coverage),
    height: blur(coverage, 15),
  };
  const finish = finishOf(color);
  const { canvas, ctx } = surface(W, H);
  const image = ctx.createImageData(W, H);
  const out = image.data;
  for (let y = 1; y < H - 1; y += 1) {
    for (let x = 1; x < W - 1; x += 1) {
      const i = y * W + x;
      const cover = coverage[i] ?? 0;
      if (cover > 0) {
        const { fine, rgb } = mineralAt(finish, x, y, seed);
        const paint = (decor[i * 4 + 3] ?? 0) / 255;
        const albedo = rgb.map(
          (value, c) => value + ((decor[i * 4 + c] ?? 0) - value) * paint
        );
        const shaded = shadeAt(
          finish,
          albedo,
          normalAt(surfaceOf, i, x, y),
          surfaceOf.height[i] ?? 0,
          fine
        );
        out[i * 4] = shaded[0] ?? 0;
        out[i * 4 + 1] = shaded[1] ?? 0;
        out[i * 4 + 2] = shaded[2] ?? 0;
        out[i * 4 + 3] = cover * 255;
      }
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
};

export const duckSprite = (tint: Tint) => {
  const { canvas, ctx } = surface(280, 200);
  const L = 220;
  ctx.translate(132, 160);
  ctx.scale(L, L);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const body = () => {
    ctx.beginPath();
    ctx.moveTo(-0.4, 0);
    ctx.bezierCurveTo(-0.47, -0.06, -0.5, -0.16, -0.46, -0.24);
    ctx.lineTo(-0.37, -0.21);
    ctx.bezierCurveTo(-0.22, -0.3, 0.02, -0.33, 0.18, -0.28);
    ctx.bezierCurveTo(0.3, -0.24, 0.36, -0.14, 0.33, -0.06);
    ctx.bezierCurveTo(0.3, 0, 0.2, 0.02, 0.1, 0.02);
    ctx.lineTo(-0.3, 0.02);
    ctx.closePath();
  };

  const flank = ctx.createLinearGradient(0, -0.32, 0, 0.02);
  flank.addColorStop(0, "#a29e98");
  flank.addColorStop(1, "#5f5b56");
  ctx.fillStyle = flank;
  body();
  ctx.fill();

  ctx.save();
  ctx.clip();
  ctx.fillStyle = "#6e3b28";
  ctx.beginPath();
  ctx.ellipse(0.27, -0.13, 0.13, 0.15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#141414";
  ctx.beginPath();
  ctx.ellipse(-0.4, -0.12, 0.09, 0.12, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = "#6f6458";
  ctx.beginPath();
  ctx.ellipse(-0.07, -0.19, 0.25, 0.075, -0.08, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "rgb(0 0 0 / 0.25)";
  ctx.lineWidth = 0.008;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-0.24 + i * 0.05, -0.2);
    ctx.lineTo(-0.3 + i * 0.05, -0.16);
    ctx.stroke();
  }
  ctx.fillStyle = "#3a5fd0";
  ctx.fillRect(-0.2, -0.205, 0.09, 0.03);
  ctx.fillStyle = "rgb(255 255 255 / 0.8)";
  ctx.fillRect(-0.2, -0.21, 0.09, 0.006);
  ctx.fillRect(-0.2, -0.178, 0.09, 0.006);

  ctx.strokeStyle = "#141414";
  ctx.lineWidth = 0.018;
  ctx.beginPath();
  ctx.moveTo(-0.44, -0.22);
  ctx.quadraticCurveTo(-0.42, -0.31, -0.36, -0.29);
  ctx.stroke();

  const green = ctx.createLinearGradient(0.2, -0.56, 0.4, -0.28);
  green.addColorStop(0, "#3fa772");
  green.addColorStop(0.5, "#1d6b4b");
  green.addColorStop(1, "#0d3526");
  ctx.strokeStyle = green;
  ctx.lineWidth = 0.11;
  ctx.beginPath();
  ctx.moveTo(0.2, -0.24);
  ctx.quadraticCurveTo(0.25, -0.36, 0.31, -0.43);
  ctx.stroke();
  ctx.fillStyle = green;
  ctx.beginPath();
  ctx.ellipse(0.34, -0.47, 0.11, 0.085, -0.2, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "rgb(190 120 255 / 0.25)";
  ctx.beginPath();
  ctx.ellipse(0.31, -0.5, 0.06, 0.03, -0.4, 0, TAU);
  ctx.fill();

  ctx.strokeStyle = "#f4f1ea";
  ctx.lineWidth = 0.018;
  ctx.beginPath();
  ctx.moveTo(0.19, -0.31);
  ctx.quadraticCurveTo(0.24, -0.29, 0.3, -0.32);
  ctx.stroke();

  ctx.fillStyle = "#e7b33d";
  ctx.beginPath();
  ctx.moveTo(0.42, -0.5);
  ctx.quadraticCurveTo(0.53, -0.5, 0.57, -0.46);
  ctx.quadraticCurveTo(0.52, -0.43, 0.42, -0.45);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2a2a2a";
  ctx.beginPath();
  ctx.arc(0.555, -0.465, 0.008, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.arc(0.36, -0.495, 0.013, 0, TAU);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(0.364, -0.499, 0.004, 0, TAU);
  ctx.fill();

  shade(ctx, tint);
  return canvas;
};

export const rockSprite = (seed: number, tint: Tint) => {
  const random = randomFrom(seed);
  const { canvas, ctx } = surface(240, 150);
  ctx.beginPath();
  ctx.moveTo(8, 132);
  const peaks = 7;
  for (let i = 0; i <= peaks; i += 1) {
    const u = i / peaks;
    const x = 8 + u * 224;
    const y = 132 - Math.sin(u * Math.PI) ** 0.7 * (90 + random() * 30);
    ctx.quadraticCurveTo(x - 14, y - 10 * random(), x, y);
  }
  ctx.lineTo(232, 132);
  ctx.closePath();

  const body = ctx.createLinearGradient(0, 20, 0, 132);
  body.addColorStop(0, "#a49f96");
  body.addColorStop(0.55, "#6c6862");
  body.addColorStop(1, "#33312e");
  ctx.fillStyle = body;
  ctx.fill();

  ctx.save();
  ctx.clip();
  const glow = ctx.createRadialGradient(80, 40, 4, 80, 40, 120);
  glow.addColorStop(0, "rgb(255 255 255 / 0.28)");
  glow.addColorStop(1, "rgb(255 255 255 / 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 240, 150);
  for (let i = 0; i < 6; i += 1) {
    ctx.fillStyle = `rgb(86 112 64 / ${(0.35 + random() * 0.3).toFixed(3)})`;
    ctx.beginPath();
    ctx.ellipse(
      30 + random() * 180,
      40 + random() * 40,
      8 + random() * 16,
      4 + random() * 6,
      random(),
      0,
      TAU
    );
    ctx.fill();
  }
  ctx.strokeStyle = "rgb(0 0 0 / 0.3)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i += 1) {
    const x = 40 + random() * 160;
    ctx.beginPath();
    ctx.moveTo(x, 50 + random() * 30);
    ctx.lineTo(x + (random() - 0.5) * 30, 90 + random() * 30);
    ctx.stroke();
  }
  ctx.fillStyle = "rgb(20 20 24 / 0.55)";
  ctx.fillRect(0, 112, 240, 40);
  ctx.restore();

  shade(ctx, tint);
  return canvas;
};

export const lotusSprite = (seed: number, tint: Tint) => {
  const random = randomFrom(seed);
  const { canvas, ctx } = surface(200, 200);
  ctx.translate(100, 100);
  const notch = random() * TAU;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, 92, notch + 0.18, notch + TAU - 0.18);
  ctx.closePath();
  const green = ctx.createRadialGradient(0, 0, 4, 0, 0, 92);
  green.addColorStop(0, "#8cc46a");
  green.addColorStop(0.6, "#4f8f3f");
  green.addColorStop(1, "#2f6129");
  ctx.fillStyle = green;
  ctx.fill();
  ctx.strokeStyle = "rgb(20 50 20 / 0.5)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.strokeStyle = "rgb(220 255 190 / 0.35)";
  ctx.lineWidth = 1.5;
  for (let i = 1; i < 12; i += 1) {
    const a = notch + (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 86, Math.sin(a) * 86);
    ctx.stroke();
  }
  if (random() < 0.35) {
    for (let ring = 0; ring < 2; ring += 1) {
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * TAU + ring * 0.4;
        ctx.fillStyle = ring === 0 ? "#f3a6c1" : "#fbd3e1";
        ctx.beginPath();
        ctx.ellipse(
          Math.cos(a) * (26 - ring * 10),
          Math.sin(a) * (26 - ring * 10),
          22 - ring * 6,
          10,
          a,
          0,
          TAU
        );
        ctx.fill();
      }
    }
    ctx.fillStyle = "#f2d14a";
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, TAU);
    ctx.fill();
  }
  shade(ctx, tint);
  return canvas;
};

export const leafSprite = (seed: number, tint: Tint) => {
  const random = randomFrom(seed);
  const { canvas, ctx } = surface(180, 180);
  ctx.translate(90, 100);
  const lobes = 7;
  const tips: [number, number][] = [];
  ctx.beginPath();
  for (let i = 0; i <= 140; i += 1) {
    const a = (i / 140) * TAU - Math.PI / 2;
    const k = (((a + Math.PI / 2) / TAU) * lobes) % 1;
    const lobe = 1 - Math.abs(k - 0.5) * 2;
    const down = Math.max(0, Math.sin(a));
    const reach = (0.38 + 0.62 * lobe ** 2.4) * (1 - down * 0.45);
    const r = 78 * reach + Math.sin(i * 2.7) * 2.4;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (lobe > 0.97) {
      tips.push([x, y]);
    }
    ctx.lineTo(x, y);
  }
  ctx.closePath();
  const hue = random();
  const fill = ctx.createRadialGradient(0, 0, 4, 0, 0, 80);
  fill.addColorStop(0, hue > 0.5 ? "#f7b23c" : "#f07a2a");
  fill.addColorStop(0.55, "#e0432a");
  fill.addColorStop(1, "#a8221b");
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = "rgb(255 220 180 / 0.45)";
  ctx.lineWidth = 1.6;
  for (const [x, y] of tips) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(x * 0.92, y * 0.92);
    ctx.stroke();
  }
  ctx.strokeStyle = "#7a2a17";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(4, 40, -6, 70);
  ctx.stroke();
  shade(ctx, tint);
  return canvas;
};
