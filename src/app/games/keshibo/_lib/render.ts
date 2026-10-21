import { ballBox, cornersOf, depthOf, paintBox, pinBox, project } from "./box";
import type { Box, Look, Vec, View } from "./box";
import { FLOOR, LANE, hopsAt, isDown } from "./physics";
import type { Ball, Point, World } from "./physics";
import {
  DESK,
  LIGHT,
  ROOM,
  css,
  deskTexture,
  floorTexture,
  lit,
  makeCanvas,
  seeded,
  sunOn,
  wallTexture,
} from "./scenery";
import type { Rgb, Texture } from "./scenery";

export type Shot = "aim" | "follow" | "pins";

export interface Aim {
  x: number;
  angle: number;
  power: number;
  curl: number;
  finger: Point | null;
}

export interface Scene {
  world: World;
  look: Look;
  shot: Shot;
  aim: Aim | null;
  fade: number;
  rack: number | null;
  ballIn: number | null;
}

interface Crumb {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  turn: number;
  tone: number;
}

interface Mote {
  x: number;
  y: number;
  speed: number;
  size: number;
  phase: number;
}

const EDGE_FACE: Rgb = [96, 64, 40];
const STEEL: Rgb = [84, 88, 96];
const STEEL_DARK: Rgb = [44, 46, 52];
const CEILING = "#2a2320";
const SHADOW = "rgb(36 22 14 / 0.5)";
const CONTACT = "rgb(24 14 8 / 0.55)";
const CRUMB: Rgb = [214, 208, 198];
const CURVE = 0.004;
const GUIDE = "rgb(255 248 236 / 0.9)";
const POWER: readonly Rgb[] = [
  [255, 246, 226],
  [255, 196, 110],
  [240, 96, 70],
];

const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

const bounce = (t: number) => {
  const p = Math.min(1, Math.max(0, t));
  if (p < 0.7) {
    return (p / 0.7) ** 2;
  }
  const q = (p - 0.85) / 0.15;
  return 1 - 0.08 * (1 - q * q);
};

interface Rig {
  x: number;
  eyeY: number;
  eyeZ: number;
  lookY: number;
}

const AIM_RIG: Rig = { eyeY: -58, eyeZ: 104, lookY: 54, x: 0 };
const PIN_RIG: Rig = { eyeY: 50, eyeZ: 28, lookY: 98, x: 0 };

const followRig = (ball: Ball): Rig => {
  const y = Math.min(ball.y, 56);
  return { eyeY: y - 34, eyeZ: 24 + y * 0.08, lookY: y + 46, x: ball.x * 0.5 };
};

const rigOf = (scene: Scene, calm: boolean): Rig => {
  if (calm || scene.shot === "aim") {
    return AIM_RIG;
  }
  if (
    scene.shot === "pins" ||
    scene.world.ball.y > 64 ||
    scene.world.ball.dropped
  ) {
    return PIN_RIG;
  }
  return followRig(scene.world.ball);
};

const blend = (from: Rig, to: Rig, k: number): Rig => ({
  eyeY: from.eyeY + (to.eyeY - from.eyeY) * k,
  eyeZ: from.eyeZ + (to.eyeZ - from.eyeZ) * k,
  lookY: from.lookY + (to.lookY - from.lookY) * k,
  x: from.x + (to.x - from.x) * k,
});

const pickLevel = ({ levels }: Texture, cmPerPixel: number) => {
  let [picked] = levels;
  for (const level of levels) {
    picked = level;
    if (level.scale * cmPerPixel <= 1.4) {
      break;
    }
  }
  return picked;
};

type Plane =
  | { kind: "flat"; z: number; max: number }
  | { kind: "wall"; y: number };

const strips = (
  ctx: CanvasRenderingContext2D,
  view: View,
  texture: Texture,
  plane: Plane,
  band: number
) => {
  const { height } = ctx.canvas;
  const hit = (row: number) => {
    const b = -(row - view.cy) / view.focal;
    const dy = b * view.sin + view.cos;
    const dz = b * view.cos - view.sin;
    if (plane.kind === "flat") {
      if (dz >= -1e-5) {
        return null;
      }
      const t = (plane.z - view.eye.z) / dz;
      const along = view.eye.y + t * dy;
      return along > plane.max ? null : { along, t };
    }
    if (dy <= 1e-5) {
      return null;
    }
    const t = (plane.y - view.eye.y) / dy;
    const along = view.eye.z + t * dz;
    return along < FLOOR ? null : { along, t };
  };
  for (let row = 0; row < height; row += band) {
    const here = hit(row + band / 2);
    if (
      here === null ||
      here.t <= 0 ||
      here.along < texture.a0 ||
      here.along >= texture.a1
    ) {
      continue;
    }
    const next = hit(row + band * 1.5);
    const step = next === null ? 0 : Math.abs(next.along - here.along) / band;
    const level = pickLevel(texture, Math.max(here.t / view.focal, step));
    const v = texture.flip
      ? (texture.a1 - here.along) * level.scale
      : (here.along - texture.a0) * level.scale;
    const perCm = view.focal / here.t;
    ctx.drawImage(
      level.canvas,
      0,
      Math.min(level.canvas.height - 1, Math.floor(v)),
      level.canvas.width,
      1,
      view.cx + (texture.x0 - view.eye.x) * perCm,
      row,
      (texture.x1 - texture.x0) * perCm,
      band + 0.5
    );
  }
};

const polygon = (
  ctx: CanvasRenderingContext2D,
  view: View,
  points: readonly Vec[]
) => {
  ctx.beginPath();
  for (const [i, point] of points.entries()) {
    const at = project(view, point);
    if (i === 0) {
      ctx.moveTo(at.x, at.y);
    } else {
      ctx.lineTo(at.x, at.y);
    }
  }
  ctx.closePath();
};

const deskSpans = [
  { y0: 0, y1: LANE.seam },
  { y0: LANE.seam, y1: LANE.length },
];

const paintFrame = (ctx: CanvasRenderingContext2D, view: View) => {
  const half = LANE.width / 2;
  for (const { y0, y1 } of deskSpans.toReversed()) {
    const legs = [
      [-half + 2, y1 - 2],
      [half - 2, y1 - 2],
      [-half + 2, y0 + 2],
      [half - 2, y0 + 2],
    ] as const;
    for (const [x, y] of legs) {
      const top = project(view, { x, y, z: -DESK.thick });
      const bottom = project(view, { x, y, z: FLOOR });
      if (top.depth < 1 || bottom.depth < 1) {
        continue;
      }
      const gradient = ctx.createLinearGradient(
        top.x,
        top.y,
        bottom.x,
        bottom.y
      );
      gradient.addColorStop(0, css(lit(STEEL, 0.7, 0.05)));
      gradient.addColorStop(1, css(STEEL_DARK));
      ctx.strokeStyle = gradient;
      ctx.lineWidth = (DESK.leg * view.focal * 2) / top.depth;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(bottom.x, bottom.y);
      ctx.stroke();
    }
    const inner = half - DESK.inset;
    const front = y0 + DESK.inset;
    ctx.fillStyle = css(lit(STEEL, 0.62, 0.02));
    polygon(ctx, view, [
      { x: -inner, y: front, z: -DESK.thick },
      { x: inner, y: front, z: -DESK.thick },
      { x: inner, y: front, z: -DESK.thick - DESK.box },
      { x: -inner, y: front, z: -DESK.thick - DESK.box },
    ]);
    ctx.fill();
  }
};

const paintDeskEdges = (ctx: CanvasRenderingContext2D, view: View) => {
  const half = LANE.width / 2;
  for (const { y0 } of deskSpans.toReversed()) {
    if (view.eye.y >= y0) {
      continue;
    }
    ctx.fillStyle = css(lit(EDGE_FACE, 0.72, 0.1));
    polygon(ctx, view, [
      { x: -half, y: y0, z: 0 },
      { x: half, y: y0, z: 0 },
      { x: half, y: y0, z: -DESK.thick },
      { x: -half, y: y0, z: -DESK.thick },
    ]);
    ctx.fill();
  }
  for (const side of [-1, 1]) {
    if (Math.abs(view.eye.x) <= half || Math.sign(view.eye.x) !== side) {
      continue;
    }
    ctx.fillStyle = css(lit(EDGE_FACE, 0.6, side < 0 ? 0.4 : 0));
    polygon(ctx, view, [
      { x: side * half, y: 0, z: 0 },
      { x: side * half, y: LANE.length, z: 0 },
      { x: side * half, y: LANE.length, z: -DESK.thick },
      { x: side * half, y: 0, z: -DESK.thick },
    ]);
    ctx.fill();
  }
};

const turn = (o: Point, a: Point, b: Point) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

const chain = (points: Point[]) => {
  const kept: Point[] = [];
  for (const point of points) {
    while (kept.length >= 2) {
      const [before, last] = kept.slice(-2);
      if (turn(before, last, point) > 0) {
        break;
      }
      kept.pop();
    }
    kept.push(point);
  }
  return kept.slice(0, -1);
};

const hull = (points: Point[]) => {
  const sorted = points.toSorted((a, b) => a.x - b.x || a.y - b.y);
  return [...chain(sorted), ...chain(sorted.toReversed())];
};

const OFFSET = 20_000;

const softFill = (
  ctx: CanvasRenderingContext2D,
  view: View,
  outline: Point[],
  color: string,
  blur: number
) => {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.shadowOffsetX = OFFSET;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  for (const [i, point] of outline.entries()) {
    const at = project(view, { x: point.x, y: point.y, z: 0 });
    if (i === 0) {
      ctx.moveTo(at.x - OFFSET, at.y);
    } else {
      ctx.lineTo(at.x - OFFSET, at.y);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
};

const paintShadow = (ctx: CanvasRenderingContext2D, view: View, box: Box) => {
  const corners = cornersOf(box);
  const lowest = Math.min(...corners.map((point) => point.z));
  if (lowest < -0.5 || lowest > 30) {
    return;
  }
  const base = project(view, box.center);
  const sun = sunOn(box.center.x, box.center.y, 0);
  const cast = hull(
    corners.map((point) => ({
      x: point.x - (LIGHT.x * point.z) / LIGHT.z,
      y: point.y - (LIGHT.y * point.z) / LIGHT.z,
    }))
  );
  ctx.globalAlpha =
    box.alpha * (0.25 + sun * 0.75) * Math.max(0, 1 - lowest / 30);
  softFill(ctx, view, cast, SHADOW, (0.9 * view.focal) / base.depth);
  const contact = hull(
    corners
      .filter((point) => point.z < lowest + 0.6)
      .map((point) => ({ x: point.x, y: point.y }))
  );
  ctx.globalAlpha = box.alpha * Math.max(0, 1 - lowest / 3);
  softFill(ctx, view, contact, CONTACT, (0.5 * view.focal) / base.depth);
  ctx.globalAlpha = 1;
};

const clipDesk = (ctx: CanvasRenderingContext2D, view: View) => {
  const half = LANE.width / 2;
  polygon(ctx, view, [
    { x: -half, y: Math.max(0, view.eye.y + 2), z: 0 },
    { x: half, y: Math.max(0, view.eye.y + 2), z: 0 },
    { x: half, y: LANE.length, z: 0 },
    { x: -half, y: LANE.length, z: 0 },
  ]);
  ctx.clip();
};

const fontFamily = () =>
  getComputedStyle(document.documentElement)
    .getPropertyValue("--font-mincho")
    .trim() || "serif";

const boxesOf = (scene: Scene) => {
  const { world } = scene;
  const boxes: Box[] = world.pins.map((pin, i) => {
    const knocked = isDown(pin);
    const enter = scene.rack === null ? 1 : bounce(scene.rack * 1.6 - i * 0.06);
    return pinBox(pin, (1 - enter) * 26, knocked ? scene.fade : 1);
  });
  const ballIn = scene.ballIn === null ? 1 : bounce(scene.ballIn);
  boxes.push(
    ballBox(
      world.ball,
      scene.look,
      (1 - ballIn) * 14,
      scene.ballIn === null ? 1 : ease(scene.ballIn * 2)
    )
  );
  return boxes;
};

const fontReady = async (family: string) => {
  try {
    await document.fonts.load(
      `700 30px ${family}`,
      "消しゴムボウリング大会めざせ３００点！月日日直"
    );
    return true;
  } catch {
    return false;
  }
};

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  const desk = deskTexture();
  const floor = floorTexture();
  let wall = wallTexture(fontFamily());
  let under = makeCanvas(1, 1);
  let top = makeCanvas(1, 1);
  let cached = "";
  let dpr = 1;
  let width = 0;
  let height = 0;
  let view: View = {
    cos: 1,
    cx: 0,
    cy: 0,
    eye: { x: 0, y: 0, z: 1 },
    focal: 1,
    sin: 0,
  };
  let rig: Rig = AIM_RIG;
  let previous = 0;
  let shake = 0;
  let crumbs: Crumb[] = [];
  let crumbFade = 1;
  const roll = seeded(1205);
  const motes: Mote[] = Array.from({ length: 46 }, () => ({
    phase: roll() * Math.PI * 2,
    size: 0.6 + roll() * 1.6,
    speed: 0.004 + roll() * 0.01,
    x: roll(),
    y: roll(),
  }));

  const loadWall = async () => {
    if (await fontReady(fontFamily())) {
      wall = wallTexture(fontFamily());
      cached = "";
    }
  };
  void loadWall();

  const fit = () => {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;
    if (nextWidth === width && nextHeight === height && nextDpr === dpr) {
      return;
    }
    width = nextWidth;
    height = nextHeight;
    dpr = nextDpr;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    under = makeCanvas(canvas.width, canvas.height);
    top = makeCanvas(canvas.width, canvas.height);
    cached = "";
  };

  const aimView = (shaking: number): View => {
    const pitch = Math.atan2(rig.eyeZ, rig.lookY - rig.eyeY);
    const focal = Math.min(width * 2.1, height * 0.98) * dpr;
    const wobble = shaking * dpr;
    return {
      cos: Math.cos(pitch),
      cx: (width / 2) * dpr + (roll() - 0.5) * wobble,
      cy: height * 0.5 * dpr + (roll() - 0.5) * wobble,
      eye: { x: rig.x, y: rig.eyeY, z: rig.eyeZ },
      focal,
      sin: Math.sin(pitch),
    };
  };

  const paintLayers = () => {
    const key = [
      view.eye.x,
      view.eye.y,
      view.eye.z,
      view.sin,
      view.focal,
      view.cx,
      view.cy,
    ]
      .map((value) => value.toFixed(2))
      .join(",");
    if (key === cached) {
      return;
    }
    cached = key;
    const band = Math.max(1, Math.round(dpr * 1.5));
    const back = under.getContext("2d");
    const front = top.getContext("2d");
    if (!back || !front) {
      return;
    }
    back.fillStyle = CEILING;
    back.fillRect(0, 0, under.width, under.height);
    if (wall) {
      strips(back, view, wall, { kind: "wall", y: ROOM.wall.y }, band);
    }
    if (floor) {
      strips(
        back,
        view,
        floor,
        { kind: "flat", max: ROOM.wall.y, z: FLOOR },
        band
      );
    }
    paintFrame(back, view);
    front.clearRect(0, 0, top.width, top.height);
    paintDeskEdges(front, view);
    if (desk) {
      strips(front, view, desk, { kind: "flat", max: LANE.length, z: 0 }, band);
    }
  };

  const paintCrumbs = (dt: number) => {
    if (crumbs.length === 0) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = crumbFade;
    for (const crumb of crumbs) {
      crumb.vz -= 981 * dt;
      crumb.z = Math.max(0, crumb.z + crumb.vz * dt);
      if (crumb.z === 0) {
        crumb.vz = 0;
        crumb.vx *= 1 - Math.min(1, 9 * dt);
        crumb.vy *= 1 - Math.min(1, 9 * dt);
      }
      crumb.x += crumb.vx * dt;
      crumb.y += crumb.vy * dt;
      const at = project(view, crumb);
      if (at.depth < 2) {
        continue;
      }
      const size = (crumb.size * view.focal) / at.depth;
      ctx.fillStyle = css(lit(CRUMB, 0.78 - crumb.tone * 0.2, 0.2));
      ctx.beginPath();
      ctx.ellipse(at.x, at.y, size, size * 0.45, crumb.turn, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const guide = (aim: Aim, ball: Ball) => {
    const length = 16 + aim.power * 34;
    const along = { x: Math.sin(aim.angle), y: Math.cos(aim.angle) };
    const start = ball.d / 2 + 1.5;
    const bend = aim.curl * CURVE * (1.4 - aim.power);
    const at = (s: number) => {
      const side = bend * (s - start) ** 2;
      return project(view, {
        x: ball.x + along.x * s + along.y * side,
        y: ball.y + along.y * s - along.x * side,
        z: 0.05,
      });
    };
    ctx.save();
    ctx.lineCap = "round";
    for (let s = start; s < start + length; s += 2.2) {
      const fade = 1 - (s - start) / length;
      const a = at(s);
      const b = at(s + 1.1);
      ctx.globalAlpha = 0.35 + fade * 0.65;
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = Math.max(2.5 * dpr, (0.5 * view.focal) / a.depth);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const powerRing = (aim: Aim, ball: Ball) => {
    if (aim.finger === null) {
      return;
    }
    const center = project(view, { x: ball.x, y: ball.y, z: ball.h / 2 });
    const finger = { x: aim.finger.x * dpr, y: aim.finger.y * dpr };
    const hops = hopsAt(ball);
    const safe = css(aim.power < 0.5 ? POWER[0] : POWER[1]);
    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgb(255 255 255 / 0.35)";
    ctx.lineWidth = 1.5 * dpr;
    ctx.setLineDash([4 * dpr, 5 * dpr]);
    ctx.beginPath();
    ctx.moveTo(center.x, center.y);
    ctx.lineTo(finger.x, finger.y);
    ctx.stroke();
    ctx.setLineDash([]);
    const radius = 26 * dpr;
    ctx.strokeStyle = "rgb(20 12 6 / 0.35)";
    ctx.lineWidth = 5 * dpr;
    ctx.beginPath();
    ctx.arc(finger.x, finger.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    const arc = (from: number, to: number, color: string) => {
      if (to <= from) {
        return;
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 4 * dpr;
      ctx.beginPath();
      ctx.arc(
        finger.x,
        finger.y,
        radius,
        -Math.PI / 2 + from * Math.PI * 2,
        -Math.PI / 2 + to * Math.PI * 2
      );
      ctx.stroke();
    };
    arc(0, Math.min(aim.power, hops), safe);
    arc(hops, aim.power, css(POWER[2]));
    if (hops < 1) {
      const mark = -Math.PI / 2 + hops * Math.PI * 2;
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2.5 * dpr;
      ctx.beginPath();
      ctx.moveTo(
        finger.x + Math.cos(mark) * (radius - 6 * dpr),
        finger.y + Math.sin(mark) * (radius - 6 * dpr)
      );
      ctx.lineTo(
        finger.x + Math.cos(mark) * (radius + 6 * dpr),
        finger.y + Math.sin(mark) * (radius + 6 * dpr)
      );
      ctx.stroke();
    }
    ctx.restore();
  };

  const atmosphere = (now: number) => {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const [i, offset] of [0.02, 0.24, 0.5].entries()) {
      const breathe = calm ? 1 : 0.85 + 0.15 * Math.sin(now / 2600 + i * 1.7);
      const shaft = ctx.createLinearGradient(0, 0, w, h * 0.6);
      shaft.addColorStop(offset, "rgb(255 196 120 / 0)");
      shaft.addColorStop(offset + 0.08, `rgb(255 196 120 / ${0.07 * breathe})`);
      shaft.addColorStop(offset + 0.16, "rgb(255 196 120 / 0)");
      ctx.fillStyle = shaft;
      ctx.fillRect(0, 0, w, h);
    }
    for (const mote of motes) {
      const t = calm ? 0 : now / 1000;
      const x = ((mote.x + t * mote.speed) % 1) * w;
      const y = ((mote.y + Math.sin(t * 0.3 + mote.phase) * 0.02) % 1) * h;
      const glow = 0.25 + 0.35 * Math.max(0, Math.sin(t * 0.8 + mote.phase));
      ctx.fillStyle = `rgb(255 236 200 / ${glow * (1 - y / h)})`;
      ctx.beginPath();
      ctx.arc(x, y, mote.size * dpr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
    const vignette = ctx.createRadialGradient(
      w / 2,
      h * 0.48,
      Math.min(w, h) * 0.35,
      w / 2,
      h * 0.5,
      Math.hypot(w, h) * 0.62
    );
    vignette.addColorStop(0, "rgb(18 8 4 / 0)");
    vignette.addColorStop(1, "rgb(18 8 4 / 0.55)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  };

  return {
    crumbs: (at: Point, strength: number) => {
      if (calm || crumbs.length > 180) {
        return;
      }
      crumbFade = 1;
      const count = Math.min(6, Math.floor(strength / 40));
      for (let i = 0; i < count; i += 1) {
        const angle = roll() * Math.PI * 2;
        const speed = 10 + roll() * strength * 0.3;
        crumbs.push({
          size: 0.1 + roll() * 0.16,
          tone: roll(),
          turn: roll() * Math.PI,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          vz: 20 + roll() * 60,
          x: at.x,
          y: at.y,
          z: 0.5,
        });
      }
    },
    draw: (now: number, scene: Scene) => {
      fit();
      const dt = Math.min(0.05, Math.max(0, now - previous) / 1000);
      previous = now;
      rig = blend(
        rig,
        rigOf(scene, calm),
        1 - Math.exp(-dt * (scene.shot === "follow" ? 7 : 3.2))
      );
      shake *= Math.exp(-dt * 9);
      view = aimView(calm ? 0 : shake);
      paintLayers();
      ctx.drawImage(under, 0, 0);
      const boxes = boxesOf(scene);
      const sorted = boxes.toSorted(
        (a, b) => depthOf(view, b.center) - depthOf(view, a.center)
      );
      for (const box of sorted) {
        if (box.center.z < -DESK.thick && depthOf(view, box.center) > 2) {
          paintBox(ctx, view, box, false);
        }
      }
      ctx.drawImage(top, 0, 0);
      ctx.save();
      clipDesk(ctx, view);
      for (const box of boxes) {
        paintShadow(ctx, view, box);
      }
      paintCrumbs(dt);
      if (scene.aim) {
        guide(scene.aim, scene.world.ball);
      }
      ctx.restore();
      for (const box of sorted) {
        if (box.center.z >= -DESK.thick && depthOf(view, box.center) > 2) {
          paintBox(ctx, view, box);
        }
      }
      if (scene.aim) {
        powerRing(scene.aim, scene.world.ball);
      }
      atmosphere(now);
    },
    sweep: () => {
      crumbFade = 0;
      crumbs = [];
    },
    shake: (amount: number) => {
      shake = Math.max(shake, amount);
    },
    screenOf: (at: Point): Point => {
      const spot = project(view, { x: at.x, y: at.y, z: 0 });
      return { x: spot.x / dpr, y: spot.y / dpr };
    },
    toLane: (client: Point): Point | null => {
      const rect = canvas.getBoundingClientRect();
      const sx = (client.x - rect.left) * dpr;
      const sy = (client.y - rect.top) * dpr;
      const a = (sx - view.cx) / view.focal;
      const b = -(sy - view.cy) / view.focal;
      const dy = b * view.sin + view.cos;
      const dz = b * view.cos - view.sin;
      if (dz >= -1e-5) {
        return null;
      }
      const t = -view.eye.z / dz;
      return { x: view.eye.x + t * a, y: view.eye.y + t * dy };
    },
  };
};
