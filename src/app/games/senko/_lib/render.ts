import { TICK, phaseAt, progressAt, windAt } from "./burn";
import type { Point, Run } from "./burn";

interface Frame {
  run: Run;
  clock: number;
  dt: number;
  dim: number;
}

interface Layout {
  x: number;
  y: number;
  rod: number;
  ground: number;
}

interface Kind {
  rate: (progress: number) => number;
  speed: [number, number];
  life: [number, number];
  drag: number;
  fall: number;
  depth: number;
  fork: [number, number];
  spread: number;
  streak: number;
  width: number;
  droop: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  depth: number;
  kind: Kind;
}

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

interface Pop {
  x: number;
  y: number;
  age: number;
  size: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  heat: number;
  landed: boolean;
}

interface Scene {
  phase: number;
  progress: number;
  heat: number;
  r: number;
  pivot: Point;
  bob: Point;
  motion: Point;
}

const TAU = Math.PI * 2;
const LIMIT = 1600;
const POP_LIFE = 0.08;
const EMBER_LIFE = 0.6;
const BANDS = 6;
const HANDLE = [
  "#b2332a",
  "#6d3b8f",
  "#2f7a52",
  "#d39a27",
  "#c75a2b",
  "#3b5c9e",
];

const bud: Kind = {
  depth: 0,
  drag: 4,
  droop: false,
  fall: 60,
  fork: [0, 0],
  life: [0.15, 0.3],
  rate: (p) => (p < 0.4 ? 0 : 20 * (p - 0.4)),
  speed: [30, 80],
  spread: 0,
  streak: 0.03,
  width: 0.9,
};

const peony: Kind = {
  depth: 1,
  drag: 3.5,
  droop: false,
  fall: 80,
  fork: [2, 4],
  life: [0.08, 0.26],
  rate: (p) => 26 + 26 * p,
  speed: [150, 260],
  spread: 0.7,
  streak: 0.05,
  width: 1.25,
};

const pine: Kind = {
  depth: 3,
  drag: 2.8,
  droop: false,
  fall: 90,
  fork: [2, 4],
  life: [0.07, 0.32],
  rate: (p) => 70 + 45 * Math.sin(p * Math.PI),
  speed: [170, 340],
  spread: 0.85,
  streak: 0.075,
  width: 1.15,
};

const willow: Kind = {
  depth: 0,
  drag: 1.5,
  droop: true,
  fall: 240,
  fork: [0, 0],
  life: [0.6, 1.1],
  rate: (p) => 52 - 22 * p,
  speed: [110, 190],
  spread: 0,
  streak: 0.06,
  width: 1,
};

const mum: Kind = {
  depth: 1,
  drag: 6,
  droop: false,
  fall: 60,
  fork: [3, 5],
  life: [0.1, 0.2],
  rate: (p) => (p > 0.93 ? 0 : 4 + 28 * (1 - p) ** 2),
  speed: [50, 120],
  spread: 1.6,
  streak: 0.02,
  width: 0.85,
};

const kinds = [bud, peony, pine, willow, mum];

const tint = (heat: number) => {
  if (heat > 0.66) {
    return "255 246 214";
  }
  return heat > 0.33 ? "255 196 106" : "255 128 52";
};

const bands = Array.from({ length: BANDS }, (_, band) => {
  const heat = (band + 0.5) / BANDS;
  return `rgb(${tint(heat)} / ${(0.3 + heat * 0.7).toFixed(2)})`;
});

const between = ([low, high]: [number, number]) =>
  low + Math.random() * (high - low);

const smooth = (t: number) => t * t * (3 - 2 * t);

const layoutOf = (w: number, h: number): Layout => ({
  ground: h * 0.9,
  rod: Math.min(200, Math.max(120, Math.min(w, h) * 0.34)),
  x: w / 2,
  y: Math.min(260, Math.max(120, h * 0.3)),
});

const sizeAt = (phase: number, progress: number) => {
  switch (phase) {
    case 0: {
      return 0.018 + 0.05 * smooth(progress);
    }
    case 1: {
      return 0.068 + 0.006 * Math.sin(progress * Math.PI);
    }
    case 2: {
      return 0.066 - 0.006 * progress;
    }
    case 3: {
      return 0.06 - 0.008 * progress;
    }
    default: {
      return 0.052 - 0.024 * progress - Math.max(0, progress - 0.85) * 0.1;
    }
  }
};

const heatAt = (phase: number, progress: number) => {
  switch (phase) {
    case 0: {
      return 0.45 + 0.45 * progress;
    }
    case 1: {
      return 0.95;
    }
    case 2: {
      return 1;
    }
    case 3: {
      return 0.88 - 0.16 * progress;
    }
    default: {
      return Math.max(
        0,
        0.72 - 0.4 * progress - Math.max(0, progress - 0.9) * 3.2
      );
    }
  }
};

const makeCanvas = (w: number, h: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w));
  canvas.height = Math.max(1, Math.round(h));
  return canvas;
};

const paintGlow = (stops: [number, string][]) => {
  const canvas = makeCanvas(128, 128);
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    for (const [at, color] of stops) {
      gradient.addColorStop(at, color);
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
  }
  return canvas;
};

const paintBackdrop = (w: number, h: number, dpr: number, ground: number) => {
  const canvas = makeCanvas(w * dpr, h * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  ctx.scale(dpr, dpr);
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "rgb(4 3 9 / 0.35)");
  sky.addColorStop(0.5, "rgb(7 6 12 / 0.55)");
  sky.addColorStop(1, "rgb(18 12 13 / 0.9)");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  let seed = 11;
  const roll = () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  for (let i = 0; i < 9; i += 1) {
    const x = roll() * w;
    const y = ground - h * (0.1 + roll() * 0.22);
    const r = 6 + roll() * 22;
    const light = ctx.createRadialGradient(x, y, 0, x, y, r);
    light.addColorStop(
      0,
      roll() > 0.35 ? "rgb(255 170 90 / 0.16)" : "rgb(150 170 255 / 0.1)"
    );
    light.addColorStop(1, "rgb(0 0 0 / 0)");
    ctx.fillStyle = light;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const floor = ctx.createLinearGradient(0, ground - 30, 0, h);
  floor.addColorStop(0, "rgb(30 20 18 / 0)");
  floor.addColorStop(0.3, "rgb(24 17 15 / 0.75)");
  floor.addColorStop(1, "rgb(10 7 7 / 1)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, ground - 30, w, h - ground + 30);
  const vignette = ctx.createRadialGradient(
    w / 2,
    h * 0.42,
    Math.min(w, h) * 0.2,
    w / 2,
    h * 0.42,
    Math.max(w, h) * 0.8
  );
  vignette.addColorStop(0, "rgb(0 0 0 / 0)");
  vignette.addColorStop(1, "rgb(0 0 0 / 0.6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
  return canvas;
};

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  const glow = paintGlow([
    [0, "rgb(255 250 225 / 1)"],
    [0.18, "rgb(255 214 140 / 0.75)"],
    [0.45, "rgb(255 140 60 / 0.22)"],
    [1, "rgb(255 90 30 / 0)"],
  ]);
  const warmth = paintGlow([
    [0, "rgb(255 150 70 / 0.55)"],
    [0.4, "rgb(240 100 40 / 0.18)"],
    [1, "rgb(120 30 10 / 0)"],
  ]);
  const haze = paintGlow([
    [0, "rgb(190 180 175 / 0.5)"],
    [0.5, "rgb(150 140 140 / 0.2)"],
    [1, "rgb(120 110 110 / 0)"],
  ]);
  let sparks: Spark[] = [];
  let puffs: Puff[] = [];
  let pops: Pop[] = [];
  let embers: Pop[] = [];
  let drop: Drop | null = null;
  let current: Run | null = null;
  let flash = 0;
  let crackle = 0;
  let owed = 0;
  let smoke = 0;
  let cooled = 0;
  let layout: Layout = { ground: 0, rod: 150, x: 0, y: 0 };
  let backdrop: { key: string; image: HTMLCanvasElement } | null = null;
  let dpr = 1;

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
    if (backdrop?.key !== key) {
      backdrop = { image: paintBackdrop(w, h, dpr, layout.ground), key };
    }
    return { h, w };
  };

  const unit = () => layout.rod / 150;

  const toScreen = (at: Point) => ({
    x: layout.x + at.x * layout.rod,
    y: layout.y + at.y * layout.rod,
  });

  const sceneOf = (run: Run): Scene => {
    const phase = phaseAt(run.stick, run.time);
    const progress = progressAt(run.stick, run.time);
    return {
      bob: toScreen(run.bob),
      heat: run.end === "burned" ? 0 : heatAt(phase, progress),
      motion: {
        x: ((run.bob.x - run.last.x) / TICK) * layout.rod,
        y: ((run.bob.y - run.last.y) / TICK) * layout.rod,
      },
      phase,
      pivot: toScreen(run.hand),
      progress,
      r: sizeAt(phase, progress) * layout.rod,
    };
  };

  const emit = (kind: Kind, scene: Scene) => {
    const angle = kind.droop
      ? Math.PI * (0.15 + Math.random() * 0.7)
      : Math.random() * TAU;
    const speed = between(kind.speed) * unit();
    sparks.push({
      age: 0,
      depth: 0,
      kind,
      life: between(kind.life),
      vx: Math.cos(angle) * speed + scene.motion.x * 0.3,
      vy: Math.sin(angle) * speed,
      x: scene.bob.x + Math.cos(angle) * scene.r,
      y: scene.bob.y + Math.sin(angle) * scene.r,
    });
  };

  const spawn = (run: Run, scene: Scene, dt: number) => {
    const kind = kinds[scene.phase] ?? mum;
    const scale = run.stick.vigour * (calm ? 0.35 : 1);
    owed += kind.rate(scene.progress) * scale * dt;
    if (kind === peony && Math.random() < dt * 2 * scale) {
      owed += 8 + Math.random() * 7;
    }
    while (owed >= 1 && sparks.length < LIMIT) {
      owed -= 1;
      emit(kind, scene);
    }
    owed = Math.min(owed, 16);
  };

  const exhale = (scene: Scene, lit: boolean, dt: number) => {
    smoke += dt * (scene.phase === 0 && lit ? 7 : 2.5) * (calm ? 0.5 : 1);
    while (smoke >= 1) {
      smoke -= 1;
      puffs.push({
        age: 0,
        life: 2.5 + Math.random() * 1.6,
        size: 3 * unit(),
        vx: (Math.random() - 0.5) * 8,
        vy: -(16 + Math.random() * 14) * unit(),
        x: scene.bob.x,
        y: scene.bob.y - scene.r * 2,
      });
    }
  };

  const split = (spark: Spark) => {
    const { kind } = spark;
    const depth = calm ? Math.min(1, kind.depth) : kind.depth;
    if (spark.depth >= depth || sparks.length > LIMIT) {
      return;
    }
    const heading = Math.atan2(spark.vy, spark.vx);
    const count = Math.round(between(kind.fork));
    const speed = between(kind.speed) * unit() * 0.42 ** (spark.depth + 1);
    for (let i = 0; i < count; i += 1) {
      const turn = heading + (Math.random() * 2 - 1) * kind.spread;
      sparks.push({
        age: 0,
        depth: spark.depth + 1,
        kind,
        life: spark.life * (0.55 + Math.random() * 0.3),
        vx: Math.cos(turn) * speed,
        vy: Math.sin(turn) * speed,
        x: spark.x,
        y: spark.y,
      });
    }
    if (!calm) {
      pops.push({
        age: 0,
        size: (6 - spark.depth) * unit(),
        x: spark.x,
        y: spark.y,
      });
      flash = Math.min(1, flash + 0.025);
    }
    crackle += 1;
  };

  const age = (dt: number, wind: number) => {
    const push = wind * 900 * unit();
    const alive: Spark[] = [];
    for (const spark of sparks) {
      spark.age += dt;
      if (spark.age >= spark.life) {
        split(spark);
        continue;
      }
      const drag = Math.exp(-spark.kind.drag * dt);
      spark.vx = spark.vx * drag + push * dt;
      spark.vy = spark.vy * drag + spark.kind.fall * unit() * dt;
      spark.x += spark.vx * dt;
      spark.y += spark.vy * dt;
      if (spark.y > layout.ground) {
        embers.push({ age: 0, size: 1.2, x: spark.x, y: layout.ground });
        continue;
      }
      alive.push(spark);
    }
    sparks = alive;
    for (const puff of puffs) {
      puff.age += dt;
      puff.vx += (wind * 260 - puff.vx * 0.6) * dt;
      puff.x += puff.vx * dt;
      puff.y += puff.vy * dt;
      puff.size += 9 * dt * unit();
    }
    puffs = puffs.filter((puff) => puff.age < puff.life);
    for (const pop of [...pops, ...embers]) {
      pop.age += dt;
    }
    pops = pops.filter((pop) => pop.age < POP_LIFE);
    embers = embers.filter((ember) => ember.age < EMBER_LIFE).slice(-200);
    flash *= Math.exp(-10 * dt);
  };

  const sizzle = (at: Drop) => {
    flash = Math.min(1, flash + 0.4);
    for (let i = 0; i < (calm ? 6 : 18); i += 1) {
      const angle = -Math.PI * (0.1 + Math.random() * 0.8);
      const speed = between([60, 200]) * unit();
      sparks.push({
        age: 0,
        depth: 0,
        kind: mum,
        life: between([0.08, 0.2]),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        x: at.x,
        y: at.y,
      });
    }
  };

  const fall = (dt: number) => {
    if (drop === null) {
      return;
    }
    drop.heat *= Math.exp(-(drop.landed ? 0.7 : 0.15) * dt);
    if (drop.landed) {
      return;
    }
    drop.vy += 1900 * unit() * dt;
    drop.x += drop.vx * dt;
    drop.y += drop.vy * dt;
    if (drop.y + drop.r >= layout.ground) {
      drop.y = layout.ground - drop.r;
      drop.landed = true;
      sizzle(drop);
    }
  };

  const drawSparks = () => {
    ctx.lineCap = "round";
    for (let band = 0; band < BANDS; band += 1) {
      ctx.beginPath();
      let width = 1;
      for (const spark of sparks) {
        const heat = 1 - spark.age / spark.life;
        if (Math.min(BANDS - 1, Math.floor(heat * BANDS)) !== band) {
          continue;
        }
        const tail = spark.kind.streak * (calm ? 0.6 : 1);
        ctx.moveTo(spark.x - spark.vx * tail, spark.y - spark.vy * tail);
        ctx.lineTo(spark.x, spark.y);
        width = spark.kind.width * (spark.depth === 0 ? 1 : 0.75);
      }
      ctx.lineWidth = width;
      ctx.strokeStyle = bands[band] ?? "#fff";
      ctx.stroke();
    }
    for (const pop of pops) {
      ctx.globalAlpha = (1 - pop.age / POP_LIFE) * 0.8;
      const size = pop.size * (1 + pop.age * 8);
      ctx.drawImage(glow, pop.x - size, pop.y - size, size * 2, size * 2);
    }
    for (const ember of embers) {
      ctx.globalAlpha = (1 - ember.age / EMBER_LIFE) * 0.6;
      ctx.drawImage(warmth, ember.x - 3, ember.y - 2, 6, 4);
    }
    ctx.globalAlpha = 1;
  };

  const drawPuffs = () => {
    for (const puff of puffs) {
      ctx.globalAlpha = Math.sin((puff.age / puff.life) * Math.PI) * 0.09;
      ctx.drawImage(
        haze,
        puff.x - puff.size,
        puff.y - puff.size,
        puff.size * 2,
        puff.size * 2
      );
    }
    ctx.globalAlpha = 1;
  };

  const drawHandle = (pivot: Point, light: number, ball: Point) => {
    const top = -12;
    const length = pivot.y - top;
    if (length <= 0) {
      return;
    }
    const { x } = pivot;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x - 1.1, pivot.y);
    ctx.lineTo(x - 1.9, top);
    ctx.lineTo(x + 1.9, top);
    ctx.lineTo(x + 1.1, pivot.y);
    ctx.closePath();
    ctx.clip();
    ctx.fillStyle = "#2a211d";
    ctx.fillRect(x - 3, top, 6, length);
    const painted = pivot.y - length * 0.42;
    for (let i = 0; painted - i * 9 > top; i += 1) {
      const y = painted - i * 9;
      ctx.fillStyle = HANDLE[i % HANDLE.length] ?? "#b2332a";
      ctx.beginPath();
      ctx.moveTo(x - 3, y);
      ctx.lineTo(x + 3, y - 4);
      ctx.lineTo(x + 3, y - 10);
      ctx.lineTo(x - 3, y - 6);
      ctx.fill();
    }
    ctx.strokeStyle = "rgb(0 0 0 / 0.35)";
    ctx.lineWidth = 0.6;
    for (let i = 0; pivot.y - i * 3.2 > painted; i += 1) {
      const y = pivot.y - i * 3.2;
      ctx.beginPath();
      ctx.moveTo(x - 3, y);
      ctx.lineTo(x + 3, y - 2.4);
      ctx.stroke();
    }
    const shade = ctx.createLinearGradient(x - 2, 0, x + 2, 0);
    shade.addColorStop(0, "rgb(255 220 180 / 0.18)");
    shade.addColorStop(0.5, "rgb(0 0 0 / 0)");
    shade.addColorStop(1, "rgb(0 0 0 / 0.5)");
    ctx.fillStyle = shade;
    ctx.fillRect(x - 3, top, 6, length);
    const dark = ctx.createLinearGradient(0, ball.y, 0, top);
    dark.addColorStop(0, `rgb(0 0 0 / ${(0.25 - light * 0.2).toFixed(3)})`);
    dark.addColorStop(1, "rgb(0 0 0 / 0.82)");
    ctx.fillStyle = dark;
    ctx.fillRect(x - 3, top, 6, length);
    ctx.restore();
  };

  const drawString = (scene: Scene, end: Point, ember: number) => {
    const { pivot, motion } = scene;
    const mid = {
      x: (pivot.x + end.x) / 2 - motion.x * 0.025,
      y: (pivot.y + end.y) / 2 - motion.y * 0.01,
    };
    const paint = ctx.createLinearGradient(pivot.x, pivot.y, end.x, end.y);
    paint.addColorStop(0, "#2c221d");
    paint.addColorStop(0.78, "#251b17");
    paint.addColorStop(
      0.92,
      `rgb(140 46 18 / ${(0.4 + ember * 0.6).toFixed(3)})`
    );
    paint.addColorStop(1, `rgb(255 140 60 / ${ember.toFixed(3)})`);
    ctx.strokeStyle = paint;
    ctx.lineWidth = 1.7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(pivot.x, pivot.y);
    ctx.quadraticCurveTo(mid.x, mid.y, end.x, end.y);
    ctx.stroke();
  };

  const drawBall = (at: Point, r: number, heat: number, clock: number) => {
    if (r <= 0.2) {
      return;
    }
    const boil = calm
      ? 1
      : 1 + 0.05 * Math.sin(clock * 23) * Math.sin(clock * 7.3);
    const size = r * boil;
    const hot = Math.min(1, heat * 1.1);
    const channel = (cold: number, warm: number) =>
      Math.round(cold + (warm - cold) * hot);
    const body = ctx.createRadialGradient(
      at.x - size * 0.28,
      at.y - size * 0.32,
      size * 0.05,
      at.x,
      at.y,
      size
    );
    body.addColorStop(
      0,
      `rgb(${channel(74, 255)} ${channel(26, 254)} ${channel(14, 230)})`
    );
    body.addColorStop(
      0.4,
      `rgb(${channel(45, 255)} ${channel(15, 200)} ${channel(8, 80)})`
    );
    body.addColorStop(0.8, `rgb(${channel(90, 230)} ${channel(24, 74)} 12)`);
    body.addColorStop(1, `rgb(${channel(40, 160)} 16 8)`);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(at.x, at.y, size, 0, TAU);
    ctx.fill();
    if (hot <= 0.3 || calm) {
      return;
    }
    ctx.fillStyle = `rgb(255 252 230 / ${(hot * 0.8).toFixed(3)})`;
    for (let i = 0; i < 3; i += 1) {
      const turn = clock * (2.1 + i * 0.7) + i * 2.1;
      ctx.beginPath();
      ctx.arc(
        at.x + Math.cos(turn) * size * 0.45,
        at.y + Math.sin(turn * 1.3) * size * 0.4,
        size * 0.12,
        0,
        TAU
      );
      ctx.fill();
    }
  };

  const drawLight = (
    at: Point,
    r: number,
    light: number,
    w: number,
    h: number
  ) => {
    if (light <= 0.01) {
      return;
    }
    ctx.globalCompositeOperation = "lighter";
    const wash = Math.max(w, h) * (0.55 + 0.35 * light);
    ctx.globalAlpha = 0.34 * light;
    ctx.drawImage(warmth, at.x - wash, at.y - wash, wash * 2, wash * 2);
    const pool = Math.min(w, h) * 0.5;
    ctx.globalAlpha = 0.28 * light;
    ctx.drawImage(
      warmth,
      at.x - pool,
      layout.ground - pool * 0.12,
      pool * 2,
      pool * 0.3
    );
    const halo = Math.max(r, 2) * 13;
    ctx.globalAlpha = Math.min(1, 0.78 * light);
    ctx.drawImage(glow, at.x - halo, at.y - halo, halo * 2, halo * 2);
    const bloom = Math.max(r, 2) * 34;
    ctx.globalAlpha = 0.22 * light;
    ctx.drawImage(glow, at.x - bloom, at.y - bloom, bloom * 2, bloom * 2);
    if (!calm) {
      ctx.globalAlpha = 0.14 * light;
      ctx.drawImage(glow, at.x - r * 46, at.y - r * 0.9, r * 92, r * 1.8);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const emberOf = (heat: number) => {
    if (drop === null) {
      return Math.max(heat, 0.25 * Math.exp(-cooled));
    }
    return drop.landed ? 0.1 : 0.35;
  };

  const paint = (
    run: Run,
    scene: Scene,
    clock: number,
    size: { w: number; h: number }
  ) => {
    const { w, h } = size;
    const { bob, pivot } = scene;
    const flicker = calm
      ? 1
      : 0.9 + 0.1 * Math.sin(clock * 31) * Math.sin(clock * 17.3);
    const light = Math.min(1.2, scene.heat * flicker + flash * 0.6);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, w, h);
    if (backdrop) {
      ctx.drawImage(backdrop.image, 0, 0, w, h);
    }
    drawLight(bob, scene.r, drop === null ? light : flash * 0.6, w, h);
    if (drop !== null) {
      drawLight(drop, drop.r, drop.heat * 0.9, w, h);
    }
    drawPuffs();
    drawHandle(pivot, light, bob);
    const tip =
      drop === null
        ? bob
        : {
            x: bob.x - (bob.x - pivot.x) * 0.04,
            y: bob.y - (bob.y - pivot.y) * 0.04,
          };
    drawString(scene, tip, emberOf(scene.heat));
    ctx.globalCompositeOperation = "lighter";
    drawSparks();
    ctx.globalCompositeOperation = "source-over";
    if (drop !== null) {
      drawBall(drop, drop.r, drop.heat, clock);
    } else if (run.end === "burned") {
      drawBall(bob, scene.r, 0.35 * Math.exp(-cooled * 1.4), clock);
    } else {
      drawBall(bob, scene.r, scene.heat, clock);
    }
  };

  return {
    draw: (frame: Frame) => {
      const { run, clock, dt } = frame;
      const size = resize();
      if (run !== current) {
        current = run;
        drop = null;
        cooled = 0;
        if (run.time === 0) {
          flash = Math.min(1, flash + 0.6);
        }
      }
      const scene = sceneOf(run);
      const lit = run.end === null;
      cooled = run.end === "burned" ? cooled + dt : 0;
      if (lit) {
        spawn(run, scene, dt);
      } else if (run.end !== "burned" && drop === null) {
        drop = {
          heat: scene.heat,
          landed: false,
          r: scene.r,
          vx: scene.motion.x,
          vy: scene.motion.y,
          x: scene.bob.x,
          y: scene.bob.y,
        };
      }
      exhale(scene, lit, dt);
      age(dt, windAt(run.stick, run.time));
      fall(dt);
      paint(run, scene, clock, size);
      if (frame.dim > 0) {
        ctx.fillStyle = `rgb(4 3 8 / ${frame.dim.toFixed(3)})`;
        ctx.fillRect(0, 0, size.w, size.h);
      }
    },
    heard: () => {
      const heard = crackle;
      crackle = 0;
      return heard;
    },
  };
};
