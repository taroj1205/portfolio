import { landmarks, mix, seeded } from "./art";
import type { Landmark, Look } from "./art";

export interface Camera {
  width: number;
  height: number;
  base: number;
  ox: number;
  oy: number;
  scale: number;
  ground: number;
  table: number;
  altitude: number;
  clock: number;
  hero: number;
}

type Context = CanvasRenderingContext2D;

const EARTH = 637_100_000;
const ROUND = 6.6;
const ROOM = { ceiling: 290, half: 450 } as const;

const ink = {
  awning: ["#c8352b", "#fff4e6"],
  beam: "#3a2216",
  building: "#b5553a",
  buildingDark: "#7d3423",
  cityFar: "#4c4470",
  cityMid: "#3b3358",
  cityNear: "#2a2440",
  check: "#c8352b",
  cloth: "#fff4e6",
  cloud: "#fff1e8",
  frame: "#4a2a1a",
  bokeh: ["#ffcf7a", "#ff9a5a", "#fff0c8", "#ff7a4a"],
  glow: "#ffd9a0",
  land: ["#3d6b3a", "#2b4a2d", "#6b7a3a"],
  lamp: "#23463a",
  lit: "#ffd88a",
  litWarm: "#ffb35a",
  night: "#0d0a14",
  ocean: ["#4f9be8", "#1d4fa8", "#0a1f52"],
  parapet: "#6b2a1c",
  picture: "#ffd35a",
  plaster: ["#c9794c", "#7e3b26"],
  road: "#26222e",
  sign: "#1d1410",
  signText: "#ffd35a",
  street: "#3a3440",
  tableLeg: "#5e3b1d",
  tableTop: "#8a5a30",
  wainscot: "#7a4a2e",
  white: "#ffffff",
} as const;

export const smooth = (value: number, low: number, high: number) => {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
};

const sx = (cam: Camera, cm: number) => cam.ox + cm * cam.scale;
const sy = (cam: Camera, cm: number) => cam.ground - cm * cam.scale;

const visible = (
  cam: Camera,
  left: number,
  top: number,
  right: number,
  bottom: number
) => right >= 0 && left <= cam.width && bottom >= 0 && top <= cam.height;

const rect = (
  ctx: Context,
  cam: Camera,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  const left = sx(cam, x);
  const top = sy(cam, y + h);
  const width = w * cam.scale;
  const height = h * cam.scale;
  if (visible(cam, left, top, left + width, top + height)) {
    ctx.fillRect(left, top, width, height);
  }
};

const paths = new Map<string, Path2D>();

const pathFor = (d: string) => {
  let found = paths.get(d);
  if (found === undefined) {
    found = new Path2D(d);
    paths.set(d, found);
  }
  return found;
};

const drawMark = (
  ctx: Context,
  mark: Landmark,
  x: number,
  y: number,
  size: number,
  alpha = 1
) => {
  if (alpha <= 0.01 || size < 1.5) {
    return;
  }
  const k = size / mark.size;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.scale(k, k);
  const fill = ctx.createLinearGradient(0, 0, 0, -mark.size);
  for (const [offset, colour] of mark.fill) {
    fill.addColorStop(offset, colour);
  }
  ctx.fillStyle = fill;
  ctx.fill(pathFor(mark.d));
  ctx.restore();
};

const glowAt = (
  ctx: Context,
  x: number,
  y: number,
  r: number,
  colour: string,
  alpha: number
) => {
  if (r < 1 || alpha <= 0.01) {
    return;
  }
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, colour);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
};

export const drawSky = (ctx: Context, cam: Camera, look: Look) => {
  const g = ctx.createLinearGradient(0, 0, 0, Math.max(1, cam.ground));
  g.addColorStop(0, look.skyTop);
  g.addColorStop(1, look.skyLow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, cam.width, cam.height);
};

const STARS = (() => {
  const roll = seeded(97);
  return Array.from({ length: 220 }, () => ({
    phase: roll() * Math.PI * 2,
    r: 0.4 + roll() ** 3 * 1.6,
    x: roll(),
    y: roll(),
  }));
})();

export const drawStars = (ctx: Context, cam: Camera, look: Look) => {
  if (look.stars <= 0.01) {
    return;
  }
  ctx.fillStyle = ink.white;
  for (const star of STARS) {
    ctx.globalAlpha =
      look.stars * (0.45 + 0.4 * Math.sin(cam.clock * 1.3 + star.phase));
    ctx.beginPath();
    ctx.arc(star.x * cam.width, star.y * cam.height, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

interface Block {
  x: number;
  w: number;
  h: number;
  seed: number;
}

const skyline = (
  seed: number,
  count: number,
  near: number,
  far: number,
  low: number,
  high: number
) => {
  const roll = seeded(seed);
  return Array.from({ length: count }, (_, i): Block => {
    const side = i % 2 === 0 ? 1 : -1;
    const reach = near + (far - near) * roll() ** 1.6;
    return {
      h: low + (high - low) * roll() ** 2.2,
      seed: Math.floor(roll() * 10_000),
      w: 900 + roll() * 2600,
      x: side * reach,
    };
  });
};

const FAR = skyline(11, 90, 3000, 600_000, 3000, 24_000);
const NEAR = skyline(5, 70, 2000, 140_000, 1200, 9000);

const windows = (ctx: Context, cam: Camera, block: Block) => {
  const width = block.w * cam.scale;
  if (width < 26) {
    return;
  }
  const roll = seeded(block.seed + 1);
  const cols = Math.max(2, Math.floor(block.w / 400));
  const rows = Math.max(2, Math.floor(block.h / 380));
  ctx.fillStyle = ink.lit;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (roll() < 0.45) {
        rect(
          ctx,
          cam,
          block.x + (c + 0.3) * (block.w / cols),
          (r + 0.35) * (block.h / rows),
          (block.w / cols) * 0.4,
          (block.h / rows) * 0.35
        );
      }
    }
  }
};

const drawBlocks = (
  ctx: Context,
  cam: Camera,
  blocks: readonly Block[],
  colour: string,
  alpha: number,
  lit: boolean
) => {
  if (alpha <= 0.01) {
    return;
  }
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const block of blocks) {
    if (block.h * cam.scale >= 1) {
      ctx.fillStyle = colour;
      rect(ctx, cam, block.x - block.w / 2, 0, block.w, block.h);
      if (lit) {
        windows(ctx, cam, { ...block, x: block.x - block.w / 2 });
      }
    }
  }
  ctx.restore();
};

const drawFuji = (ctx: Context, cam: Camera) => {
  const alpha =
    smooth(cam.altitude, 4.9, 5.6) * (1 - smooth(cam.altitude, 7.2, 7.8));
  const size = 377_600 * cam.scale;
  drawMark(
    ctx,
    landmarks.fuji,
    sx(cam, 150_000),
    cam.ground,
    size,
    alpha * 0.95
  );
  drawMark(ctx, landmarks.snow, sx(cam, 150_000), cam.ground, size, alpha);
};

const drawTowers = (ctx: Context, cam: Camera) => {
  const fade = 1 - smooth(cam.altitude, 6.2, 6.9);
  const tower = 33_300 * cam.scale;
  const tree = 63_400 * cam.scale;
  glowAt(
    ctx,
    sx(cam, -13_000),
    cam.ground - tower * 0.5,
    tower * 0.7,
    "#ff8a4a",
    0.35 * fade
  );
  glowAt(
    ctx,
    sx(cam, 21_000),
    cam.ground - tree * 0.55,
    tree * 0.5,
    "#9ec8ff",
    0.25 * fade
  );
  drawMark(ctx, landmarks.tower, sx(cam, -13_000), cam.ground, tower, fade);
  drawMark(ctx, landmarks.skytree, sx(cam, 21_000), cam.ground, tree, fade);
};

const CLOUDS = (() => {
  const roll = seeded(61);
  return Array.from({ length: 46 }, () => ({
    h: 120_000 + roll() ** 1.4 * 800_000,
    w: 80_000 + roll() * 360_000,
    x: (roll() * 2 - 1) * 2_600_000,
  }));
})();

const drawClouds = (ctx: Context, cam: Camera, look: Look) => {
  const alpha =
    smooth(cam.altitude, 5.1, 5.6) * (1 - smooth(cam.altitude, 6.9, 7.4));
  if (alpha <= 0.01) {
    return;
  }
  ctx.save();
  for (const cloud of CLOUDS) {
    const x = sx(cam, cloud.x);
    const y = sy(cam, cloud.h);
    const w = cloud.w * cam.scale;
    if (w > 2 && visible(cam, x - w, y - w, x + w, y + w)) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, w / 2);
      g.addColorStop(0, ink.cloud);
      g.addColorStop(0.6, look.skyLow);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, w / 2, w / 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
};

const BOKEH = (() => {
  const roll = seeded(29);
  return Array.from({ length: 16 }, (_, i) => ({
    colour: ink.bokeh[i % ink.bokeh.length] ?? ink.glow,
    depth: 0.4 + roll(),
    r: 0.05 + roll() * 0.11,
    x: roll(),
    y: roll() * 0.75,
  }));
})();

const drawBokeh = (ctx: Context, cam: Camera) => {
  const fade = 1 - smooth(cam.altitude, 1.4, 2.2);
  if (fade <= 0.01) {
    return;
  }
  for (const light of BOKEH) {
    const r = light.r * cam.base * (1 + light.depth * 0.3);
    const x = light.x * cam.width;
    const y =
      light.y * cam.height + cam.altitude * light.depth * cam.height * 0.12;
    glowAt(ctx, x, y, r, light.colour, 0.28 * fade);
  }
};

const drawRoom = (ctx: Context, cam: Camera, look: Look) => {
  if (ROOM.half * 2 * cam.scale < 3) {
    return;
  }
  const wall = ctx.createLinearGradient(
    0,
    sy(cam, ROOM.ceiling),
    0,
    sy(cam, 0)
  );
  wall.addColorStop(0, ink.plaster[1]);
  wall.addColorStop(1, ink.plaster[0]);
  ctx.fillStyle = wall;
  rect(ctx, cam, -ROOM.half, 0, ROOM.half * 2, ROOM.ceiling);
  ctx.fillStyle = ink.wainscot;
  rect(ctx, cam, -ROOM.half, 0, ROOM.half * 2, 58);
  ctx.fillStyle = ink.frame;
  rect(ctx, cam, -ROOM.half, 56, ROOM.half * 2, 5);
  rect(ctx, cam, 134, 104, 202, 138);
  const pane = ctx.createLinearGradient(0, sy(cam, 236), 0, sy(cam, 110));
  pane.addColorStop(0, look.skyTop);
  pane.addColorStop(1, look.skyLow);
  ctx.fillStyle = pane;
  rect(ctx, cam, 140, 110, 190, 126);
  ctx.fillStyle = ink.frame;
  rect(ctx, cam, 232, 110, 6, 126);
  rect(ctx, cam, 140, 170, 190, 5);
  rect(ctx, cam, -336, 136, 140, 90);
  ctx.fillStyle = ink.night;
  rect(ctx, cam, -328, 144, 124, 74);
  ctx.fillStyle = ink.picture;
  ctx.beginPath();
  ctx.arc(sx(cam, -250), sy(cam, 190), 16 * cam.scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink.beam;
  rect(ctx, cam, -ROOM.half, ROOM.ceiling, ROOM.half * 2, 22);
  rect(ctx, cam, -1, 205, 2, ROOM.ceiling - 205);
  ctx.fillStyle = ink.lamp;
  ctx.beginPath();
  ctx.moveTo(sx(cam, -16), sy(cam, 208));
  ctx.lineTo(sx(cam, 16), sy(cam, 208));
  ctx.lineTo(sx(cam, 38), sy(cam, 182));
  ctx.lineTo(sx(cam, -38), sy(cam, 182));
  ctx.fill();
  glowAt(ctx, sx(cam, 0), sy(cam, 176), 190 * cam.scale, ink.glow, 0.55);
  drawMark(ctx, landmarks.person, sx(cam, -150), cam.ground, 175 * cam.scale);
};

const drawBuilding = (ctx: Context, cam: Camera) => {
  if (1200 * cam.scale < 2) {
    return;
  }
  ctx.fillStyle = ink.cityMid;
  rect(ctx, cam, -1500, 0, 880, 1500);
  rect(ctx, cam, 620, 0, 880, 850);
  windows(ctx, cam, { h: 1500, seed: 3, w: 880, x: -1500 });
  windows(ctx, cam, { h: 850, seed: 4, w: 880, x: 620 });
  ctx.fillStyle = ink.building;
  rect(ctx, cam, -600, 0, 1200, 1100);
  ctx.fillStyle = ink.parapet;
  rect(ctx, cam, -630, 1100, 1260, 40);
  rect(ctx, cam, 250, 1140, 160, 120);
  for (const floor of [430, 740]) {
    for (const x of [-480, -230, 70, 320]) {
      ctx.fillStyle = ink.buildingDark;
      rect(ctx, cam, x - 10, floor - 10, 180, 200);
      ctx.fillStyle = floor === 430 ? ink.lit : ink.litWarm;
      rect(ctx, cam, x, floor, 160, 180);
    }
  }
  ctx.fillStyle = ink.sign;
  rect(ctx, cam, -320, 322, 640, 76);
  const size = 44 * cam.scale;
  const signY = sy(cam, 360);
  if (size > 5 && size < 300 && signY > -size && signY < cam.height + size) {
    ctx.fillStyle = ink.signText;
    ctx.font = `800 ${size}px "Hiragino Sans", system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CHEESE", sx(cam, 0), signY);
  }
  for (let i = 0; i < 12; i += 1) {
    ctx.fillStyle = ink.awning[i % 2] ?? ink.white;
    rect(ctx, cam, -ROOM.half + i * 75, 292, 75, 30);
  }
};

const drawTable = (ctx: Context, cam: Camera) => {
  const width = Math.max(170 * cam.scale, cam.hero * 1.3);
  const left = cam.ox - width / 2;
  const top = cam.table;
  const slab = Math.max(5 * cam.scale, 6);
  const drop = Math.max(32 * cam.scale, 26);
  const legs = Math.max(0, cam.ground - top);
  ctx.fillStyle = ink.tableLeg;
  const leg = Math.max(4 * cam.scale, 4);
  ctx.fillRect(left + width * 0.08, top, leg, legs);
  ctx.fillRect(left + width * 0.92 - leg, top, leg, legs);
  ctx.fillStyle = ink.tableTop;
  ctx.fillRect(left, top, width, slab);
  ctx.fillStyle = ink.cloth;
  ctx.fillRect(left - width * 0.02, top, width * 1.04, drop);
  const check = Math.max(5, Math.min(3 * cam.scale, 16));
  ctx.save();
  ctx.globalAlpha *= 0.8;
  ctx.fillStyle = ink.check;
  for (let y = 0; y * check < drop; y += 1) {
    for (let x = 0; x * check < width * 1.04; x += 1) {
      if ((x + y) % 2 === 0) {
        ctx.fillRect(
          left - width * 0.02 + x * check,
          top + y * check,
          check,
          check
        );
      }
    }
  }
  ctx.restore();
};

const drawFlat = (ctx: Context, cam: Camera) => {
  const t = smooth(cam.altitude, 4.6, ROUND);
  const g = ctx.createLinearGradient(0, cam.ground, 0, cam.height);
  g.addColorStop(0, mix(ink.street, ink.land[0], t));
  g.addColorStop(1, ink.road);
  ctx.fillStyle = g;
  ctx.fillRect(0, cam.ground, cam.width, Math.max(0, cam.height - cam.ground));
};

const KM = 100_000;

const LANDS: readonly [number, number, number, number, number][] = [
  [0, 0, 1100, 210, -0.5],
  [-900, 300, 1200, 400, 0.2],
  [600, -100, 500, 300, -0.9],
  [-4200, 1200, 3800, 2200, 0.3],
  [-3000, 4200, 2600, 1600, -0.2],
  [3800, 3800, 1600, 2600, 0.6],
  [1200, 7600, 3000, 1200, 0],
  [-5200, 6400, 1800, 1400, 0.4],
];

const drawEarth = (ctx: Context, cam: Camera) => {
  const r = EARTH * cam.scale;
  const cy = cam.ground + r;
  ctx.save();
  const halo = ctx.createRadialGradient(
    cam.ox,
    cy,
    r * 0.98,
    cam.ox,
    cy,
    r * 1.06
  );
  halo.addColorStop(0, "rgba(120,180,255,0.9)");
  halo.addColorStop(1, "rgba(120,180,255,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cam.ox, cy, r * 1.06, 0, Math.PI * 2);
  ctx.fill();
  const sea = ctx.createRadialGradient(
    cam.ox - r * 0.35,
    cy - r * 0.45,
    r * 0.1,
    cam.ox,
    cy,
    r
  );
  sea.addColorStop(0, ink.ocean[0]);
  sea.addColorStop(0.6, ink.ocean[1]);
  sea.addColorStop(1, ink.ocean[2]);
  ctx.fillStyle = sea;
  ctx.beginPath();
  ctx.arc(cam.ox, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.clip();
  for (const [i, [x, depth, rx, ry, angle]] of LANDS.entries()) {
    ctx.fillStyle = ink.land[i % ink.land.length] ?? ink.land[0];
    ctx.beginPath();
    ctx.ellipse(
      cam.ox + x * KM * cam.scale,
      cam.ground + depth * KM * cam.scale,
      rx * KM * cam.scale,
      ry * KM * cam.scale,
      angle,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  const night = ctx.createLinearGradient(cam.ox - r, 0, cam.ox + r, 0);
  night.addColorStop(0.55, "rgba(2,4,16,0)");
  night.addColorStop(1, "rgba(2,4,16,0.75)");
  ctx.fillStyle = night;
  ctx.fillRect(cam.ox - r, cy - r, r * 2, r * 2);
  ctx.restore();
};

const drawFlyers = (ctx: Context, cam: Camera) => {
  const plane =
    smooth(cam.altitude, 5.6, 6) * (1 - smooth(cam.altitude, 7, 7.5));
  if (plane > 0.01) {
    const x = sx(cam, -300_000 + ((cam.clock * 25_000) % 600_000));
    const y = sy(cam, 1_060_000);
    const size = Math.max(7000 * cam.scale, cam.base * 0.11);
    const trail = ctx.createLinearGradient(x - size * 6, y, x - size * 0.4, y);
    trail.addColorStop(0, "rgba(255,255,255,0)");
    trail.addColorStop(1, "rgba(255,255,255,0.6)");
    ctx.globalAlpha = plane;
    ctx.fillStyle = trail;
    ctx.fillRect(x - size * 6, y - size * 0.03, size * 5.6, size * 0.06);
    ctx.globalAlpha = 1;
    drawMark(ctx, landmarks.airliner, x, y, size, plane);
  }
  const station =
    smooth(cam.altitude, 7.1, 7.5) * (1 - smooth(cam.altitude, 9, 9.4));
  drawMark(
    ctx,
    landmarks.iss,
    sx(cam, 3_000_000),
    sy(cam, 41_000_000),
    Math.max(10_900 * cam.scale, cam.base * 0.13),
    station
  );
  const geo =
    smooth(cam.altitude, 8.8, 9.2) * (1 - smooth(cam.altitude, 10.3, 10.6));
  drawMark(
    ctx,
    landmarks.satellite,
    sx(cam, -900_000_000),
    sy(cam, 3_578_600_000),
    Math.max(1000 * cam.scale, cam.base * 0.1),
    geo
  );
};

export const drawWorld = (ctx: Context, cam: Camera, look: Look) => {
  if (cam.altitude < ROUND) {
    drawFlat(ctx, cam);
  } else {
    drawEarth(ctx, cam);
  }
  drawFuji(ctx, cam);
  drawClouds(ctx, cam, look);
  drawBlocks(
    ctx,
    cam,
    FAR,
    ink.cityFar,
    1 - smooth(cam.altitude, 6.4, 7),
    false
  );
  drawTowers(ctx, cam);
  drawBlocks(
    ctx,
    cam,
    NEAR,
    ink.cityNear,
    1 - smooth(cam.altitude, 6, 6.6),
    true
  );
  drawBuilding(ctx, cam);
  const indoors = 1 - smooth(cam.altitude, 2.05, 2.5);
  if (indoors > 0.01) {
    ctx.save();
    ctx.globalAlpha = indoors;
    drawRoom(ctx, cam, look);
    drawBokeh(ctx, cam);
    drawTable(ctx, cam);
    ctx.restore();
  }
  drawFlyers(ctx, cam);
};
