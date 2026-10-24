import { FLOOR, LANE } from "./physics";

export const ROOM = {
  ceiling: 236,
  floor: { x0: -260, x1: 260, y0: -200, y1: 300 },
  wall: { x0: -320, x1: 320, y: 300 },
};

export const DESK = {
  box: 11,
  inset: 2.5,
  leg: 1.2,
  thick: 2.4,
};

export const LIGHT = (() => {
  const x = -0.78;
  const y = 0.26;
  const z = 0.58;
  const length = Math.hypot(x, y, z);

  return { x: x / length, y: y / length, z: z / length };
})();

export type Rgb = readonly [number, number, number];

const SUN: Rgb = [1.16, 0.98, 0.74];
const AMBIENT: Rgb = [0.84, 0.88, 1.02];

export const seeded = (seed: number) => {
  let state = (Math.abs(Math.floor(seed)) % 2_147_483_646) + 1;

  return () => {
    state = (state * 16_807) % 2_147_483_647;

    return (state - 1) / 2_147_483_646;
  };
};

const createNoise = (seed: number) => {
  const roll = seeded(seed);
  const size = 256;
  const table = Float32Array.from({ length: size * size }, () => roll());

  const at = (x: number, y: number) =>
    table[(((y % size) + size) % size) * size + (((x % size) + size) % size)];

  return (x: number, y: number) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);
    const top = at(ix, iy) + (at(ix + 1, iy) - at(ix, iy)) * sx;
    const bottom = at(ix, iy + 1) + (at(ix + 1, iy + 1) - at(ix, iy + 1)) * sx;

    return top + (bottom - top) * sy;
  };
};

const fbm =
  (noise: (x: number, y: number) => number) => (x: number, y: number) =>
    noise(x, y) * 0.55 +
    noise(x * 2.1, y * 2.1) * 0.3 +
    noise(x * 4.3, y * 4.3) * 0.15;

const smooth = (edge0: number, edge1: number, value: number) => {
  const t = Math.min(1, Math.max(0, (value - edge0) / (edge1 - edge0)));

  return t * t * (3 - 2 * t);
};

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const channel = (value: number) =>
  Math.round(Math.min(255, Math.max(0, value)));

export const css = ([r, g, b]: Rgb, alpha = 1) =>
  `rgb(${channel(r)} ${channel(g)} ${channel(b)} / ${alpha})`;

const byte = (value: string, at: number) =>
  Number.parseInt(value.slice(at, at + 2), 16);

export const hex = (value: string): Rgb => [
  byte(value, 1),
  byte(value, 3),
  byte(value, 5),
];

export const lit = (color: Rgb, ambient: number, sun: number): Rgb => [
  color[0] * (ambient * AMBIENT[0] + sun * SUN[0]),
  color[1] * (ambient * AMBIENT[1] + sun * SUN[1]),
  color[2] * (ambient * AMBIENT[2] + sun * SUN[2]),
];

const pane = (along: number) => {
  const width = 96;
  const bar = 9;
  const local = (((along % width) + width) % width) - width / 2;

  return smooth(width / 2 - bar, width / 2 - bar - 6, Math.abs(local));
};

export const sunOn = (x: number, y: number, z: number) => {
  const reach = (x + 170) / -LIGHT.x;
  const height = z + reach * LIGHT.z - FLOOR;
  const along = y + reach * LIGHT.y + 30;
  const sill = smooth(78, 92, height) * smooth(262, 248, height);
  const transom = 1 - 0.85 * smooth(4, 0, Math.abs(height - 178));

  return pane(along) * sill * transom;
};

export interface Texture {
  levels: { canvas: HTMLCanvasElement; scale: number }[];
  x0: number;
  x1: number;
  a0: number;
  a1: number;
  flip: boolean;
}

export const makeCanvas = (width: number, height: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  return canvas;
};

const mips = (
  base: HTMLCanvasElement,
  scale: number,
  floorScale: number
): Texture["levels"] => {
  const levels = [{ canvas: base, scale }];
  let current = base;
  let currentScale = scale;

  while (currentScale / 2 >= floorScale) {
    const next = makeCanvas(current.width / 2, current.height / 2);
    const ctx = next.getContext("2d");

    if (!ctx) {
      break;
    }

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(current, 0, 0, next.width, next.height);
    currentScale /= 2;
    levels.push({ canvas: next, scale: currentScale });
    current = next;
  }

  return levels;
};

const fillPixels = (
  canvas: HTMLCanvasElement,
  shade: (u: number, v: number) => Rgb
) => {
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return null;
  }

  const image = ctx.createImageData(canvas.width, canvas.height);
  const { data } = image;

  for (let v = 0; v < canvas.height; v += 1) {
    for (let u = 0; u < canvas.width; u += 1) {
      const [r, g, b] = shade(u, v);
      const i = (v * canvas.width + u) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  return ctx;
};

const OAK: Rgb = [220, 184, 134];
const OAK_DARK: Rgb = [178, 134, 88];
const OAK_DEEP: Rgb = [136, 94, 56];
const EDGE: Rgb = [112, 76, 46];
const EDGE_SHINE: Rgb = [250, 236, 210];

const deskEdge = (x: number, y: number) => {
  const from = y < LANE.seam ? y : y - LANE.seam;

  return Math.min(
    from,
    LANE.seam - from,
    x + LANE.width / 2,
    LANE.width / 2 - x
  );
};

const deskShade = (scale: number) => {
  const grain = fbm(createNoise(11));
  const fine = createNoise(29);
  const blotch = fbm(createNoise(47));

  return (u: number, v: number): Rgb => {
    const x = u / scale - LANE.width / 2;
    const y = v / scale;
    const desk = y < LANE.seam ? 0 : 1;
    const warp = grain(x * 0.18 + desk * 40, y * 0.012) * 7;
    const ring = Math.sin((x + warp) * 1.9 + Math.sin(y * 0.03 + desk) * 0.8);
    const streak = (0.5 + 0.5 * ring) ** 6;
    const speck = Math.max(0, fine(u * 0.9, v * 0.25) - 0.82) * 2.4;

    let color = mix(
      OAK,
      OAK_DARK,
      streak * 0.55 + blotch(x * 0.05, y * 0.03) * 0.3
    );

    color = mix(color, OAK_DEEP, speck * 0.6);
    const edge = deskEdge(x, y);

    if (edge < 0.9) {
      color = mix(
        mix(EDGE, OAK_DARK, edge / 0.9),
        EDGE_SHINE,
        smooth(0.5, 0.2, edge) * 0.35
      );
    }

    if (Math.abs(y - LANE.seam) < 0.18) {
      color = [58, 38, 24];
    }

    const sun = sunOn(x, y, 0);

    return lit(color, 0.74, sun * 0.44 + 0.06);
  };
};

const trace = (ctx: CanvasRenderingContext2D, points: [number, number][]) => {
  for (const [i, [x, y]] of points.entries()) {
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
};

const pencil = (ctx: CanvasRenderingContext2D, scale: number) => {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(LANE.width / 2, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "rgb(62 60 70 / 0.42)";
  ctx.fillStyle = "rgb(62 60 70 / 0.38)";
  ctx.lineWidth = 0.16;
  const umbrella = { x: 13.6, y: 30 };
  ctx.beginPath();
  ctx.moveTo(umbrella.x, umbrella.y - 5);
  ctx.lineTo(umbrella.x, umbrella.y + 4);
  ctx.moveTo(umbrella.x - 3.6, umbrella.y - 2.2);
  ctx.quadraticCurveTo(
    umbrella.x,
    umbrella.y - 7.6,
    umbrella.x + 3.6,
    umbrella.y - 2.2
  );
  ctx.stroke();
  ctx.font = "1.5px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("けんた", umbrella.x - 1.9, umbrella.y + 1.4);
  ctx.fillText("みさき", umbrella.x + 1.9, umbrella.y + 1.4);
  ctx.save();
  ctx.translate(-14, 72);
  ctx.rotate(-0.12);
  ctx.font = "2.2px sans-serif";
  ctx.fillText("ファイト！", 0, 0);
  ctx.restore();
  ctx.beginPath();
  trace(
    ctx,
    Array.from({ length: 6 }, (_, i): [number, number] => {
      const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;

      return [-15 + Math.cos(angle) * 1.8, 104 + Math.sin(angle) * 1.8];
    })
  );
  ctx.stroke();
  ctx.strokeStyle = "rgb(255 246 228 / 0.28)";
  ctx.lineWidth = 0.08;
  const roll = seeded(83);
  ctx.beginPath();

  for (let i = 0; i < 46; i += 1) {
    const x = (roll() - 0.5) * (LANE.width - 3);
    const y = 4 + roll() * (LANE.length - 8);
    const angle = (roll() - 0.5) * 0.9;
    const length = 0.6 + roll() * 2.6;
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.sin(angle) * length, y + Math.cos(angle) * length);
  }

  ctx.stroke();
  ctx.fillStyle = "rgb(40 60 140 / 0.35)";
  ctx.beginPath();
  ctx.ellipse(16.4, 88, 0.45, 0.32, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const deskTexture = (): Texture | null => {
  const scale = 10;
  const canvas = makeCanvas(LANE.width * scale, LANE.length * scale);
  const ctx = fillPixels(canvas, deskShade(scale));

  if (!ctx) {
    return null;
  }

  pencil(ctx, scale);

  return {
    a0: 0,
    a1: LANE.length,
    flip: false,
    levels: mips(canvas, scale, 0.6),
    x0: -LANE.width / 2,
    x1: LANE.width / 2,
  };
};

const FLOOR_WOOD: Rgb = [150, 100, 60];
const FLOOR_DARK: Rgb = [108, 68, 40];
const FLOOR_SEAM: Rgb = [52, 32, 20];
const BOARD_LENGTH = 180;
const BOARD_WIDTH = 9;

const deskShadow = (x: number, y: number) => {
  const height = -FLOOR;
  const sx = x + (height * LIGHT.x) / LIGHT.z;
  const sy = y + (height * LIGHT.y) / LIGHT.z;

  const outside = Math.hypot(
    Math.max(0, Math.abs(sx) - LANE.width / 2),
    Math.max(0, Math.abs(sy - LANE.length / 2) - LANE.length / 2)
  );

  return smooth(14, 0, outside);
};

const floorShade = (scale: number) => {
  const grain = fbm(createNoise(5));
  const plank = createNoise(91);
  const { x0, y0 } = ROOM.floor;

  return (u: number, v: number): Rgb => {
    const x = u / scale + x0;
    const y = v / scale + y0;
    const column = Math.floor(x / BOARD_WIDTH);
    const shifted = y + plank(column * 3.1, 0) * BOARD_LENGTH;
    const board = Math.floor(shifted / BOARD_LENGTH);
    const tone = plank(column * 1.7, board * 2.3);
    const acrossSeam = x - column * BOARD_WIDTH;
    const alongSeam = ((shifted % BOARD_LENGTH) + BOARD_LENGTH) % BOARD_LENGTH;

    let color = mix(
      FLOOR_WOOD,
      FLOOR_DARK,
      tone * 0.6 + grain(x * 0.6, y * 0.02) * 0.35
    );

    if (acrossSeam < 0.3 || alongSeam < 0.5) {
      color = mix(color, FLOOR_SEAM, 0.7);
    }

    const under = Math.hypot(
      Math.max(0, Math.abs(x) - LANE.width / 2),
      Math.max(0, Math.abs(y - LANE.length / 2) - LANE.length / 2)
    );

    const occluded = smooth(22, 0, under);
    const sun = sunOn(x, y, FLOOR) * (1 - deskShadow(x, y) * 0.92);

    return lit(color, 0.6 - occluded * 0.26, sun * 0.72 + 0.04);
  };
};

export const floorTexture = (): Texture | null => {
  const scale = 1.6;
  const { x0, x1, y0, y1 } = ROOM.floor;
  const canvas = makeCanvas((x1 - x0) * scale, (y1 - y0) * scale);

  if (!fillPixels(canvas, floorShade(scale))) {
    return null;
  }

  return {
    a0: y0,
    a1: y1,
    flip: false,
    levels: mips(canvas, scale, 0.2),
    x0,
    x1,
  };
};

const PLASTER: Rgb = [232, 222, 200];
const PLASTER_DARK: Rgb = [212, 200, 176];
const PANEL: Rgb = [128, 88, 54];
const PANEL_DARK: Rgb = [98, 64, 40];
const PANEL_SEAM: Rgb = [60, 38, 24];
const BOARD: Rgb = [40, 70, 58];
const BOARD_DUST: Rgb = [76, 100, 88];
const ALUMINIUM: Rgb = [176, 178, 172];
const ALUMINIUM_DARK: Rgb = [112, 114, 110];

const BOARD_BOX = {
  x0: -190,
  x1: 190,
  z0: FLOOR + 84,
  z1: FLOOR + 204,
};

const boardColor = (x: number, z: number, dust: number): Rgb | null => {
  if (
    x < BOARD_BOX.x0 ||
    x > BOARD_BOX.x1 ||
    z < BOARD_BOX.z0 ||
    z > BOARD_BOX.z1
  ) {
    return null;
  }

  const edge = Math.min(
    x - BOARD_BOX.x0,
    BOARD_BOX.x1 - x,
    z - BOARD_BOX.z0,
    BOARD_BOX.z1 - z
  );

  return edge < 3
    ? mix(ALUMINIUM, ALUMINIUM_DARK, edge / 3)
    : mix(BOARD, BOARD_DUST, dust * 0.45);
};

const wallShade = (scale: number, top: number) => {
  const grain = fbm(createNoise(17));
  const dust = fbm(createNoise(63));
  const { x0 } = ROOM.wall;

  return (u: number, v: number): Rgb => {
    const x = u / scale + x0;
    const z = top - v / scale;
    const height = z - FLOOR;
    let color = mix(PLASTER, PLASTER_DARK, grain(x * 0.02, z * 0.02) * 0.6);

    if (height < 92) {
      color = mix(PANEL, PANEL_DARK, grain(x * 0.5, z * 0.01) * 0.7);

      if (((x % 60) + 60) % 60 < 0.8 || height < 9) {
        color = mix(color, PANEL_SEAM, 0.6);
      }
    }

    color = boardColor(x, z, dust(x * 0.03, z * 0.05)) ?? color;

    if (
      Math.abs(z - BOARD_BOX.z0) < 2.5 &&
      x > BOARD_BOX.x0 - 4 &&
      x < BOARD_BOX.x1 + 4
    ) {
      color = mix(ALUMINIUM, ALUMINIUM_DARK, (z - BOARD_BOX.z0 + 2.5) / 6);
    }

    const sun = sunOn(x, ROOM.wall.y, z) * smooth(-40, -160, x);

    return lit(color, 0.66, sun * 0.6 + 0.05);
  };
};

const roughen = (ctx: CanvasRenderingContext2D) => {
  const roll = seeded(7);
  const { width, height } = ctx.canvas;
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "rgb(0 0 0 / 0.55)";

  for (let i = 0; i < 2600; i += 1) {
    ctx.fillRect(
      roll() * width,
      roll() * height,
      0.3 + roll() * 0.9,
      0.2 + roll() * 0.5
    );
  }

  ctx.restore();
};

const RACK_DRAWING = [
  [0, 0],
  [-6, 1],
  [6, 1],
  [-12, 2],
  [0, 2],
  [12, 2],
] as const;

const boardWriting = (
  ctx: CanvasRenderingContext2D,
  scale: number,
  top: number,
  family: string
) => {
  const layer = makeCanvas(ctx.canvas.width, ctx.canvas.height);
  const chalk = layer.getContext("2d");

  if (!chalk) {
    return;
  }

  const u = (x: number) => (x - ROOM.wall.x0) * scale;
  const v = (z: number) => (top - z) * scale;

  const write = (text: string, x: number, z: number, size: number) => {
    chalk.font = `700 ${size * scale}px ${family}`;
    chalk.fillText(text, u(x), v(z));
  };

  const mid = (BOARD_BOX.z0 + BOARD_BOX.z1) / 2;
  chalk.textAlign = "center";
  chalk.textBaseline = "middle";
  chalk.fillStyle = "rgb(246 244 234 / 0.9)";
  write("消しボウ大会", -10, mid + 22, 30);
  chalk.fillStyle = "rgb(255 214 120 / 0.88)";
  write("めざせ ３００点！", -10, mid - 14, 13);
  chalk.fillStyle = "rgb(246 244 234 / 0.82)";
  const today = new Date();
  write(
    `${today.getMonth() + 1}月${today.getDate()}日`,
    150,
    BOARD_BOX.z1 - 14,
    8
  );
  write("日直", 160, BOARD_BOX.z1 - 32, 8);
  chalk.strokeStyle = "rgb(246 244 234 / 0.8)";
  chalk.lineWidth = 1.2 * scale;
  chalk.lineCap = "round";
  chalk.beginPath();

  for (const [dx, row] of RACK_DRAWING) {
    chalk.rect(u(-150 + dx - 2), v(mid + 22 - row * 11), 4 * scale, 8 * scale);
  }

  chalk.moveTo(u(-150), v(mid - 30));
  chalk.lineTo(u(-150), v(mid - 8));
  chalk.moveTo(u(-154), v(mid - 13));
  chalk.lineTo(u(-150), v(mid - 7));
  chalk.lineTo(u(-146), v(mid - 13));
  chalk.stroke();
  roughen(chalk);
  ctx.drawImage(layer, 0, 0);
  ctx.fillStyle = "rgb(250 250 244 / 0.92)";

  for (const [i, x] of [-120, -100, 60, 70].entries()) {
    ctx.fillRect(u(x), v(BOARD_BOX.z0 + 1.6), (6 + i) * scale, 1.1 * scale);
  }

  ctx.fillStyle = "rgb(40 40 46 / 0.95)";
  ctx.fillRect(u(120), v(BOARD_BOX.z0 + 4.4), 13 * scale, 3 * scale);
  ctx.fillStyle = "rgb(190 70 60 / 0.95)";
  ctx.fillRect(u(120), v(BOARD_BOX.z0 + 4.4), 13 * scale, 1.2 * scale);
};

const clock = (ctx: CanvasRenderingContext2D, scale: number, top: number) => {
  const cx = -ROOM.wall.x0 * scale;
  const cy = (top - (BOARD_BOX.z1 + 18)) * scale;
  const r = 13 * scale;
  ctx.save();
  ctx.fillStyle = "rgb(250 248 240)";
  ctx.strokeStyle = "rgb(60 60 66)";
  ctx.lineWidth = 1.6 * scale;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.lineCap = "round";

  const hand = (turn: number, from: number, to: number, width: number) => {
    const angle = turn * Math.PI * 2;
    ctx.lineWidth = width * scale;
    ctx.beginPath();
    ctx.moveTo(cx + Math.sin(angle) * from, cy - Math.cos(angle) * from);
    ctx.lineTo(cx + Math.sin(angle) * to, cy - Math.cos(angle) * to);
    ctx.stroke();
  };

  for (let i = 0; i < 12; i += 1) {
    hand(i / 12, r * 0.78, r * 0.9, i % 3 === 0 ? 0.9 : 0.4);
  }

  hand((3 + 40 / 60) / 12, 0, r * 0.5, 1);
  hand(40 / 60, 0, r * 0.74, 0.6);
  ctx.restore();
};

export const wallTexture = (family: string): Texture | null => {
  const scale = 1.6;
  const top = ROOM.ceiling + FLOOR;
  const { x0, x1 } = ROOM.wall;
  const canvas = makeCanvas((x1 - x0) * scale, (top - FLOOR) * scale);
  const ctx = fillPixels(canvas, wallShade(scale, top));

  if (!ctx) {
    return null;
  }

  boardWriting(ctx, scale, top, family);
  clock(ctx, scale, top);

  return {
    a0: FLOOR,
    a1: top,
    flip: true,
    levels: mips(canvas, scale, 0.2),
    x0,
    x1,
  };
};
