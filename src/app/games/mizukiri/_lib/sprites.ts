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

const radii = new Map<string, [number, number]>([
  ["flat", [122, 48]],
  ["oval", [118, 70]],
  ["round", [86, 80]],
]);

const outlineOf = (form: string, random: () => number) => {
  const outline: [number, number][] = [];
  if (form === "heart") {
    for (let i = 0; i <= 64; i += 1) {
      const t = (i / 64) * TAU;
      outline.push([
        128 + 16 * Math.sin(t) ** 3 * 6.6,
        76 -
          (13 * Math.cos(t) -
            5 * Math.cos(2 * t) -
            2 * Math.cos(3 * t) -
            Math.cos(4 * t)) *
            4.3,
      ]);
    }
    return outline;
  }
  const [rx, ry] = radii.get(form) ?? [118, 70];
  const phases = Array.from({ length: 4 }, () => random() * TAU);
  for (let i = 0; i <= 64; i += 1) {
    const a = (i / 64) * TAU;
    const wobble = phases.reduce(
      (sum, phase, k) => sum + (0.04 / (k + 1)) * Math.sin((k + 2) * a + phase),
      1
    );
    outline.push([
      128 + Math.cos(a) * rx * wobble,
      80 + Math.sin(a) * ry * wobble,
    ]);
  }
  return outline;
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
  } else if (pattern === "ring") {
    ctx.strokeStyle = "rgb(250 248 240 / 0.85)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.ellipse(128, 80, 70, 40, -0.15, 0, TAU);
    ctx.stroke();
  }
};

export const stoneSprite = (color: Color, form: string, pattern: string) => {
  const random = randomFrom(color.mineral[1].length * 97 + form.length * 13);
  const { canvas, ctx } = surface(256, 160);
  const [light, mid, dark] = color.mineral;
  const outline = outlineOf(form, random);

  const body = ctx.createRadialGradient(92, 52, 6, 128, 80, 140);
  body.addColorStop(0, light);
  body.addColorStop(0.45, mid);
  body.addColorStop(1, dark);
  ctx.fillStyle = body;
  trace(ctx, outline);
  ctx.fill();

  ctx.save();
  ctx.clip();
  for (let i = 0; i < 220; i += 1) {
    const bright = random() > 0.5;
    ctx.fillStyle = bright
      ? `rgb(255 255 255 / ${(0.08 + random() * 0.22).toFixed(3)})`
      : `rgb(0 0 0 / ${(0.08 + random() * 0.2).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(random() * 256, random() * 160, 0.6 + random() * 1.8, 0, TAU);
    ctx.fill();
  }
  ctx.strokeStyle = "rgb(255 255 255 / 0.22)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const veinY = 50 + random() * 60;
  ctx.moveTo(10, veinY);
  ctx.bezierCurveTo(
    90,
    veinY - 30 + random() * 60,
    170,
    veinY - 30 + random() * 60,
    246,
    veinY + random() * 20
  );
  ctx.stroke();
  const gloss = ctx.createRadialGradient(88, 46, 2, 88, 46, 70);
  gloss.addColorStop(0, "rgb(255 255 255 / 0.4)");
  gloss.addColorStop(1, "rgb(255 255 255 / 0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, 256, 160);
  paintPattern(ctx, pattern, random);
  ctx.restore();

  if (color.glow !== null) {
    ctx.save();
    trace(ctx, outline);
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = color.glow;
    ctx.shadowColor = color.glow;
    ctx.shadowBlur = 12;
    ctx.lineWidth = 2.5;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      let x = 30 + random() * 196;
      let y = 30 + random() * 100;
      ctx.moveTo(x, y);
      for (let k = 0; k < 5; k += 1) {
        x += (random() - 0.5) * 60;
        y += (random() - 0.5) * 40;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  ctx.strokeStyle = "rgb(0 0 0 / 0.35)";
  ctx.lineWidth = 3;
  trace(ctx, outline);
  ctx.stroke();
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
