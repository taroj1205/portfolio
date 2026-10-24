import {
  UNIT,
  cheeseMoon,
  dataUri,
  lookAt,
  mix,
  moon,
  paint,
  plates,
  sideOf,
  spriteDoc,
  threadOf,
  websOf,
} from "./art";
import type { Plate, Pull, Sprite } from "./art";
import { drawSky, drawStars, drawWorld, smooth } from "./scenery";
import type { Camera } from "./scenery";
import { pointAt, ribbonOf } from "./strand";
import type { Point, Thread } from "./strand";
import { MOON, isSweet } from "./stretch";
import type { Run, Strand } from "./stretch";

export interface Mark {
  cm: number;
  label: string;
  gold: boolean;
}

export interface View {
  run: Run;
  lift: number;
  clock: number;
  dt: number;
  idle: boolean;
  since: number;
  marks: readonly Mark[];
}

type Context = CanvasRenderingContext2D;

interface Bit {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  size: number;
}

const MOON_RADIUS = 173_700_000;
const DESK = 75;
const TAU = Math.PI * 2;

const ink = {
  edge: "rgba(90,38,4,0.32)",
  flash: "#fff6d8",
  gold: "#ffd27a",
  label: "#fffaf3",
  scrim: "rgba(6,4,10,0.62)",
  shade: "rgba(0,0,0,0.45)",
  spark: "#fff3b0",
} as const;

export const frameOf = (width: number, height: number) => ({
  base: Math.min(width, height * 0.62),
  max: height * 0.6,
  oy: height * 0.8,
  rest: height * 0.27,
  stroke: height * 0.3,
});

const rasterize = async (svg: string, width: number, height: number) => {
  try {
    const image = new Image();
    image.src = dataUri(svg);
    await image.decode();
    const bitmap = document.createElement("canvas");
    bitmap.width = Math.max(1, Math.round(width));
    bitmap.height = Math.max(1, Math.round(height));
    bitmap
      .getContext("2d")
      ?.drawImage(image, 0, 0, bitmap.width, bitmap.height);
    return bitmap;
  } catch {
    return null;
  }
};

const createSprites = () => {
  const bitmaps = new Map<Sprite, HTMLCanvasElement>();
  const scales = new Map<Sprite, number>();
  const want = (sprite: Sprite, scale: number) => {
    const had = scales.get(sprite) ?? 0;
    if (had > 0 && Math.abs(scale / had - 1) < 0.15) {
      return;
    }
    scales.set(sprite, scale);
    void (async () => {
      const bitmap = await rasterize(
        spriteDoc(sprite, scale),
        sprite.box.w * scale,
        sprite.box.h * scale
      );
      if (bitmap !== null && scales.get(sprite) === scale) {
        bitmaps.set(sprite, bitmap);
      }
    })();
  };
  return { get: (sprite: Sprite) => bitmaps.get(sprite) ?? null, want };
};

let puffCanvas: HTMLCanvasElement | null = null;

const puffImage = () => {
  if (puffCanvas === null) {
    puffCanvas = document.createElement("canvas");
    puffCanvas.width = 64;
    puffCanvas.height = 64;
    const ctx = puffCanvas.getContext("2d");
    if (ctx) {
      const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 64, 64);
    }
  }
  return puffCanvas;
};

const place = (
  ctx: Context,
  bitmap: HTMLCanvasElement | null,
  sprite: Sprite,
  at: Point,
  size: number,
  angle = 0
) => {
  if (bitmap === null) {
    return;
  }
  const k = size / UNIT;
  ctx.save();
  ctx.translate(at.x, at.y);
  ctx.rotate(angle);
  ctx.drawImage(
    bitmap,
    sprite.box.x * k,
    sprite.box.y * k,
    sprite.box.w * k,
    sprite.box.h * k
  );
  ctx.restore();
};

const fillPoints = (ctx: Context, points: readonly Point[]) => {
  ctx.beginPath();
  for (const [i, point] of points.entries()) {
    if (i === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  ctx.closePath();
  ctx.fill();
};

const spine = (ctx: Context, thread: Thread, offset: number) => {
  ctx.beginPath();
  for (let i = 0; i <= 18; i += 1) {
    const point = pointAt(thread, 0.04 + (i / 18) * 0.92);
    if (i === 0) {
      ctx.moveTo(point.x + offset, point.y);
    } else {
      ctx.lineTo(point.x + offset, point.y);
    }
  }
  ctx.stroke();
};

interface Tone {
  body: string;
  light: string;
  deep: string;
}

const toneOf = (heat: number): Tone => {
  const cold = 1 - Math.max(0, Math.min(1, heat));
  return {
    body: mix(paint.cheese[1], "#e0a640", cold * 0.85),
    deep: mix(paint.cheese[2], "#b97a22", cold),
    light: mix(paint.cheese[0], "#f3cf78", cold * 0.8),
  };
};

const drawThread = (ctx: Context, thread: Thread, tone: Tone) => {
  const ribbon = ribbonOf(thread);
  ctx.save();
  ctx.translate(Math.max(1, thread.neck * 0.35), 1);
  ctx.fillStyle = ink.edge;
  fillPoints(ctx, ribbon);
  ctx.restore();
  ctx.fillStyle = tone.body;
  fillPoints(ctx, ribbon);
  ctx.lineCap = "round";
  ctx.strokeStyle = tone.deep;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(0.6, thread.neck * 0.3);
  spine(ctx, thread, thread.neck * 0.32);
  ctx.strokeStyle = tone.light;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(0.6, thread.neck * 0.28);
  spine(ctx, thread, -thread.neck * 0.22);
  ctx.globalAlpha = 1;
  ctx.fillStyle = tone.body;
  ctx.beginPath();
  ctx.ellipse(
    thread.from.x,
    thread.from.y,
    thread.ends * 0.7,
    thread.ends * 0.26,
    0,
    0,
    TAU
  );
  ctx.ellipse(
    thread.to.x,
    thread.to.y,
    thread.ends * 0.6,
    thread.ends * 0.22,
    0,
    0,
    TAU
  );
  ctx.fill();
};

const drawWebs = (ctx: Context, threads: readonly Thread[], tone: Tone) => {
  ctx.fillStyle = tone.body;
  ctx.globalAlpha = 0.6;
  for (const { ea, pa, mid, pb, eb } of websOf(threads)) {
    ctx.beginPath();
    ctx.moveTo(ea.x, ea.y);
    ctx.lineTo(pa.x, pa.y);
    ctx.quadraticCurveTo(mid.x, mid.y, pb.x, pb.y);
    ctx.lineTo(eb.x, eb.y);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
};

const spring = (t: number) => 1 - Math.exp(-t * 6) * Math.cos(t * 13);

const stubsOf = (
  thread: Thread,
  strand: Strand,
  side: number,
  since: number
): Thread[] => {
  const height = thread.from.y - thread.to.y;
  const e = spring(Math.max(0, since));
  const lean = (side >= 0 ? 1 : -1) * (0.2 + Math.abs(side) * 0.5);
  const low =
    height * strand.at +
    (Math.min(height * 0.3, thread.ends * 2.4) - height * strand.at) * e;
  const high =
    height * (1 - strand.at) +
    (Math.min(height * 0.25, thread.ends * 2) - height * (1 - strand.at)) * e;
  const neck = thread.neck * 1.3;
  return [
    {
      ...thread,
      bend: lean * low * 0.35 * e,
      neck,
      to: { x: thread.from.x + lean * low * 0.25 * e, y: thread.from.y - low },
    },
    {
      ...thread,
      bend: -lean * high * 0.3 * e,
      from: { x: thread.to.x - lean * high * 0.2 * e, y: thread.to.y + high },
      neck,
    },
  ];
};

const glowSpines = (
  ctx: Context,
  threads: readonly Thread[],
  level: number
) => {
  if (level <= 0.01) {
    return;
  }
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = ink.gold;
  ctx.lineCap = "round";
  for (const thread of threads) {
    ctx.globalAlpha = 0.14 * level;
    ctx.lineWidth = thread.neck * 2.4 + 3;
    spine(ctx, thread, 0);
  }
  ctx.restore();
};

const tick = (bits: Bit[], dt: number, gravity: number) => {
  for (const bit of bits) {
    bit.age += dt;
    bit.vy += gravity * dt;
    bit.x += bit.vx * dt;
    bit.y += bit.vy * dt;
  }
  return bits.filter((bit) => bit.age < bit.life);
};

const spill = (bits: Bit[], at: Point, count: number, size: number) => {
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * TAU;
    const speed = 80 + Math.random() * 240;
    bits.push({
      age: 0,
      life: 0.7 + Math.random() * 0.5,
      size: size * (0.5 + Math.random()),
      vx: Math.cos(a) * speed,
      vy: Math.sin(a) * speed - 120,
      x: at.x,
      y: at.y,
    });
  }
};

interface Scene {
  cam: Camera;
  pull: Pull;
  plate: Plate;
  threads: Thread[];
  alive: number[];
}

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const ctx = canvas.getContext("2d");
  const sprites = createSprites();
  let steam: Bit[] = [];
  let drips: Bit[] = [];
  let sparks: Bit[] = [];
  let bits: Bit[] = [];
  let hero = 0;
  let rise = 1;
  let shake = 0;
  let flash = 0;
  let seen: Run | null = null;
  const breaks = new WeakMap<Strand, number>();
  let snapped = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;

  const fit = () => {
    const nextDpr = Math.min(2, window.devicePixelRatio || 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w !== width || h !== height || nextDpr !== dpr) {
      width = w;
      height = h;
      dpr = nextDpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
  };

  const heroFor = (
    run: Run,
    lift: number,
    scale: number,
    altitude: number,
    plate: Plate,
    dt: number,
    oy: number
  ) => {
    const frame = frameOf(width, height);
    const floor = frame.base * (0.44 - 0.24 * smooth(altitude, 6, 10.3));
    const room = ((oy - lift - height * 0.12) * UNIT) / plate.crown;
    const target = Math.max(
      frame.base * 0.18,
      Math.min(frame.base * 1.12, room, Math.max(floor, scale * run.dish.width))
    );
    hero =
      hero === 0 ? target : hero + (target - hero) * (1 - Math.exp(-dt / 0.18));
    return hero;
  };

  const sceneOf = (view: View): Scene => {
    const { run, lift, clock, dt } = view;
    const frame = frameOf(width, height);
    const plate = plates[run.dish.id];
    const scale = lift / run.length;
    const altitude = Math.log10(run.length);
    rise += ((view.idle ? 1 : 0) - rise) * (1 - Math.exp(-dt / 0.35));
    const oy = frame.oy - rise * height * 0.16;
    const size = heroFor(run, lift, scale, altitude, plate, dt, oy);
    const table = oy + (plate.feet * size) / UNIT;
    const cam: Camera = {
      altitude,
      base: frame.base,
      clock,
      ground: table + DESK * scale,
      height,
      hero: size,
      ox: width / 2,
      oy,
      scale,
      table,
      width,
    };
    const pull: Pull = {
      base: { x: cam.ox, y: oy },
      dish: run.dish.id,
      size,
      top: oy - lift,
    };
    const thin =
      Math.max(0.28, Math.min(1.3, 1.3 - 0.075 * Math.log(run.length / 3))) *
      (1 - 0.45 * run.strain);
    const tremble = run.strain > 0.25 ? run.strain * 3 : 0;
    const alive: number[] = [];
    const threads = run.strands.map((twist, i) => {
      if (twist.snapped === null) {
        alive.push(i);
      }
      const thread = threadOf(pull, twist, sideOf(i, run.strands.length), {
        clock,
        sway: 0.45 + run.strain * 1.4,
        thin,
      });
      return {
        ...thread,
        bend: thread.bend + Math.sin(clock * 41 + twist.phase) * tremble,
      };
    });
    return { alive, cam, plate, pull, threads };
  };

  const watchSnaps = (run: Run, scene: Scene, clock: number) => {
    if (seen !== run) {
      seen = run;
      snapped = 0;
      flash = 0;
    }
    const count = run.strands.length - scene.alive.length;
    if (count > snapped) {
      for (const [i, strand] of run.strands.entries()) {
        const thread = scene.threads[i];
        if (
          strand.snapped !== null &&
          thread !== undefined &&
          !breaks.has(strand)
        ) {
          breaks.set(strand, clock);
          spill(
            bits,
            pointAt(thread, strand.at),
            9,
            Math.max(3, thread.ends * 0.25)
          );
        }
      }
      shake = calm ? 0 : 10;
      flash = Math.max(flash, 0.25);
    }
    snapped = count;
  };

  const emit = (view: View, scene: Scene) => {
    const { run, dt } = view;
    const k = scene.pull.size / UNIT;
    if (Math.random() < dt * 7 * Math.max(0.15, run.heat)) {
      steam.push({
        age: 0,
        life: 1.6 + Math.random(),
        size: (60 + Math.random() * 60) * k * 2,
        vx: (Math.random() - 0.5) * 20,
        vy: -(30 + Math.random() * 40),
        x: scene.cam.ox + (Math.random() - 0.5) * scene.plate.spread * 4 * k,
        y: scene.cam.oy - 10 * k,
      });
    }
    const pick =
      scene.threads[
        scene.alive[Math.floor(Math.random() * scene.alive.length)] ?? -1
      ];
    if (pick !== undefined && Math.random() < dt * 1.6 * run.heat) {
      const at = pointAt(pick, 0.25 + Math.random() * 0.5);
      drips.push({
        age: 0,
        life: 1.4,
        size: Math.max(2, pick.neck * 1.3),
        vx: 0,
        vy: 30,
        x: at.x,
        y: at.y,
      });
    }
    if (
      pick !== undefined &&
      isSweet(run.load) &&
      !view.idle &&
      Math.random() < dt * 26
    ) {
      const at = pointAt(pick, Math.random());
      sparks.push({
        age: 0,
        life: 0.55,
        size: 4 + Math.random() * 6,
        vx: 0,
        vy: -20,
        x: at.x,
        y: at.y,
      });
    }
  };

  const drawMoon = (scene: Scene, run: Run, since: number) => {
    const { cam } = scene;
    const alpha = smooth(cam.altitude, 7.6, 8.1);
    if (alpha <= 0.01 || ctx === null) {
      return;
    }
    const r = Math.min(
      cam.base * 0.26,
      Math.max(MOON_RADIUS * cam.scale, cam.base * 0.17)
    );
    const truth = cam.oy - MOON * cam.scale - r * 0.92;
    const y = Math.max(truth, -r * 0.55);
    const swapped = run.end === "moon" ? smooth(since, 0.15, 0.9) : 0;
    sprites.want(moon, (r * 2 * dpr) / 200);
    sprites.want(cheeseMoon, (r * 2 * dpr) / 200);
    ctx.globalAlpha = alpha * (1 - swapped);
    place(ctx, sprites.get(moon), moon, { x: cam.ox, y }, r * 10);
    ctx.globalAlpha = alpha * swapped;
    place(ctx, sprites.get(cheeseMoon), cheeseMoon, { x: cam.ox, y }, r * 10);
    ctx.globalAlpha = 1;
  };

  const drawMarks = (scene: Scene, marks: readonly Mark[]) => {
    if (ctx === null) {
      return;
    }
    const { cam } = scene;
    ctx.font = `700 ${Math.round(Math.max(11, cam.base * 0.032))}px "Hiragino Sans", system-ui, sans-serif`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    for (const mark of marks) {
      const y = cam.oy - mark.cm * cam.scale;
      if (y > height * 0.12 && y < cam.oy - 24) {
        ctx.strokeStyle = mark.gold ? ink.gold : ink.label;
        ctx.globalAlpha = 0.75;
        ctx.setLineDash([8, 7]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = mark.gold ? ink.gold : ink.label;
        ctx.fillText(mark.label, width - 14, y - 5);
        ctx.globalAlpha = 1;
      }
    }
  };

  const drawCheese = (scene: Scene, run: Run, clock: number) => {
    if (ctx === null) {
      return;
    }
    const tone = toneOf(run.heat);
    const live = scene.threads.filter(
      (_, i) => run.strands[i]?.snapped === null
    );
    drawWebs(ctx, live, tone);
    glowSpines(ctx, live, isSweet(run.load) && run.end === null ? 1 : 0);
    for (const [i, thread] of scene.threads.entries()) {
      const strand = run.strands[i];
      if (strand === undefined) {
        continue;
      }
      if (strand.snapped === null) {
        drawThread(ctx, thread, tone);
      } else {
        for (const stub of stubsOf(
          thread,
          strand,
          sideOf(i, run.strands.length),
          clock - (breaks.get(strand) ?? clock)
        )) {
          drawThread(ctx, stub, tone);
        }
      }
    }
    if (run.strain > 0.5 && run.end === null) {
      ctx.globalAlpha =
        (run.strain - 0.5) * 0.8 * (0.6 + 0.4 * Math.sin(clock * 30));
      ctx.strokeStyle = "#fffdf2";
      ctx.lineWidth = 1;
      for (const thread of live) {
        spine(ctx, thread, 0);
      }
      ctx.globalAlpha = 1;
    }
  };

  const drawBits = (list: readonly Bit[], colour: string, stretch: number) => {
    if (ctx === null) {
      return;
    }
    ctx.fillStyle = colour;
    for (const bit of list) {
      ctx.globalAlpha = 1 - bit.age / bit.life;
      ctx.beginPath();
      ctx.ellipse(
        bit.x,
        bit.y,
        bit.size * 0.5,
        bit.size * 0.5 * stretch,
        0,
        0,
        TAU
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const drawSteam = () => {
    if (ctx === null) {
      return;
    }
    const image = puffImage();
    for (const puff of steam) {
      const t = puff.age / puff.life;
      const size = puff.size * (0.6 + t);
      ctx.globalAlpha = 0.16 * Math.sin(Math.PI * t);
      ctx.drawImage(image, puff.x - size / 2, puff.y - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
  };

  const drawSparks = () => {
    if (ctx === null) {
      return;
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = ink.spark;
    for (const spark of sparks) {
      const t = spark.age / spark.life;
      const r = spark.size * Math.sin(Math.PI * t);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(spark.x, spark.y - r);
      ctx.quadraticCurveTo(spark.x, spark.y, spark.x + r, spark.y);
      ctx.quadraticCurveTo(spark.x, spark.y, spark.x, spark.y + r);
      ctx.quadraticCurveTo(spark.x, spark.y, spark.x - r, spark.y);
      ctx.quadraticCurveTo(spark.x, spark.y, spark.x, spark.y - r);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawOverlay = (view: View) => {
    if (ctx === null) {
      return;
    }
    const v = ctx.createRadialGradient(
      width / 2,
      height * 0.5,
      Math.min(width, height) * 0.35,
      width / 2,
      height * 0.5,
      Math.max(width, height) * 0.8
    );
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, ink.shade);
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, width, height);
    const scrim = view.idle ? 1 : 0.55;
    const s = ctx.createLinearGradient(0, height * 0.55, 0, height);
    s.addColorStop(0, "rgba(6,4,10,0)");
    s.addColorStop(1, ink.scrim);
    ctx.globalAlpha = scrim;
    ctx.fillStyle = s;
    ctx.fillRect(0, height * 0.55, width, height * 0.45);
    const top = ctx.createLinearGradient(0, 0, 0, height * 0.22);
    top.addColorStop(0, ink.scrim);
    top.addColorStop(1, "rgba(6,4,10,0)");
    ctx.globalAlpha = view.idle ? 0.5 : 0.8;
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, width, height * 0.22);
    if (flash > 0.01) {
      ctx.globalAlpha = calm ? flash * 0.3 : flash;
      ctx.fillStyle = ink.flash;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.globalAlpha = 1;
  };

  const drawHero = (scene: Scene, view: View) => {
    if (ctx === null) {
      return;
    }
    const { plate, pull } = scene;
    sprites.want(plate.base, (frameOf(width, height).base * 1.12 * dpr) / UNIT);
    sprites.want(plate.held, (frameOf(width, height).base * 1.12 * dpr) / UNIT);
    const glow = 1 - smooth(scene.cam.altitude, 3, 5);
    if (glow > 0.01) {
      const g = ctx.createRadialGradient(
        pull.base.x,
        pull.base.y,
        0,
        pull.base.x,
        pull.base.y,
        pull.size * 0.9
      );
      g.addColorStop(0, "rgba(255,200,120,0.35)");
      g.addColorStop(1, "rgba(255,200,120,0)");
      ctx.globalAlpha = glow;
      ctx.fillStyle = g;
      ctx.fillRect(
        pull.base.x - pull.size,
        pull.base.y - pull.size,
        pull.size * 2,
        pull.size * 2
      );
      ctx.globalAlpha = 1;
    }
    place(ctx, sprites.get(plate.base), plate.base, pull.base, pull.size);
    drawSteam();
    drawCheese(scene, view.run, view.clock);
    const tilt =
      Math.sin(view.clock * 1.4) * 0.025 +
      (view.run.strain > 0.3
        ? Math.sin(view.clock * 38) * 0.01 * view.run.strain
        : 0);
    place(
      ctx,
      sprites.get(plate.held),
      plate.held,
      { x: pull.base.x, y: pull.top },
      pull.size,
      tilt
    );
    drawBits(drips, toneOf(view.run.heat).body, 1.5);
    drawBits(bits, toneOf(view.run.heat).body, 1);
    drawSparks();
  };

  return {
    draw: (view: View) => {
      fit();
      if (ctx === null || width === 0 || height === 0) {
        return;
      }
      const scene = sceneOf(view);
      watchSnaps(view.run, scene, view.clock);
      emit(view, scene);
      steam = tick(steam, view.dt, -12);
      drips = tick(drips, view.dt, 900).filter(
        (drip) => drip.y < scene.cam.oy + 6
      );
      sparks = tick(sparks, view.dt, 0);
      bits = tick(bits, view.dt, 1100);
      shake *= Math.exp(-view.dt * 9);
      flash *= Math.exp(-view.dt * 5);
      const look = lookAt(scene.cam.altitude);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.save();
      ctx.translate(
        (Math.random() - 0.5) * shake,
        (Math.random() - 0.5) * shake
      );
      drawSky(ctx, scene.cam, look);
      drawStars(ctx, scene.cam, look);
      drawWorld(ctx, scene.cam, look);
      drawMoon(scene, view.run, view.since);
      drawMarks(scene, view.marks);
      drawHero(scene, view);
      ctx.restore();
      drawOverlay(view);
    },
    flash: (level: number) => {
      flash = Math.max(flash, level);
    },
  };
};
