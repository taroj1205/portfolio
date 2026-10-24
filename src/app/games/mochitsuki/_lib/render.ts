import { createAtlas } from "../../_lib/atlas";
import type { Layer } from "../../_lib/atlas";
import type { Lang, Text } from "../../_lib/i18n";
import type { Frame, Sprite } from "../../_lib/svg";
import {
  MOCHI,
  SCENE,
  STRIKE,
  USU,
  armPose,
  backdrop,
  bruise,
  forearm,
  hand,
  kine,
  kinePose,
  lanternsOf,
  lip,
  mat,
  mochiBody,
  mochiGloss,
  mochiGrains,
  sleeve,
  toWorld,
  tub,
  usu,
} from "./art";
import type { Place } from "./art";

export interface View {
  sweep: number | null;
  reach: number;
  interval: number;
  count: number | null;
  streak: number;
  heat: number;
  smooth: number;
}

export type Call = "great" | "good" | "flub" | "miss" | "hand";

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  wet: boolean;
  born: number;
}

interface Flake {
  x: number;
  y: number;
  r: number;
  speed: number;
  sway: number;
  near: boolean;
}

interface Floater {
  call: Call;
  born: number;
}

const HOLD = 45;
const PINNED = 520;
const FLOAT = 700;
const OUCH = 1100;
const DROP_LIFE = 650;
const STRETCH = 210;
const SNAP = 300;
const REVEAL = 600;
const GLIDE = 12;

const ink = {
  cream: "#efe2cb",
  drop: "#fffdf7",
  flake: "#f3f5fc",
  gold: ["#fff6d8", "#ffd27a", "#c9862c"],
  grain: 0.06,
  night: "#060518",
  ring: "#ffe2a8",
  stroke: "#120806",
  water: "#bfe0f6",
} as const;

const calls: Record<
  Call,
  { word: Text; size: number; fill: readonly string[] }
> = {
  flub: {
    fill: ["#ffffff", "#d8d4e4"],
    size: 0.07,
    word: { en: "Off", ja: "ずれ" },
  },
  good: {
    fill: ["#ffffff", "#f6eedc"],
    size: 0.095,
    word: { en: "Good", ja: "可" },
  },
  great: { fill: ink.gold, size: 0.12, word: { en: "Great", ja: "良" } },
  hand: {
    fill: ["#ffd0c4", "#ff5a46", "#b8121a"],
    size: 0.15,
    word: { en: "Ouch!", ja: "痛っ！" },
  },
  miss: {
    fill: ["#c9c6d6", "#8d8aa0"],
    size: 0.09,
    word: { en: "Miss", ja: "×" },
  },
};

const SPRITES: readonly Sprite[] = [
  mat,
  tub,
  usu,
  mochiBody,
  mochiGrains,
  mochiGloss,
  lip,
  sleeve,
  forearm,
  hand,
  bruise,
  kine,
];

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;

const smoothstep = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from));

  return t * t * (3 - 2 * t);
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const glowSprite = () => {
  const glow = document.createElement("canvas");
  glow.width = 128;
  glow.height = 128;
  const paint = glow.getContext("2d");

  if (paint) {
    const light = paint.createRadialGradient(64, 64, 0, 64, 64, 64);
    light.addColorStop(0, "rgb(255 255 255 / 1)");
    light.addColorStop(0.35, "rgb(255 255 255 / 0.42)");
    light.addColorStop(1, "rgb(255 255 255 / 0)");
    paint.fillStyle = light;
    paint.fillRect(0, 0, 128, 128);
  }

  return glow;
};

const tinted = (source: HTMLCanvasElement, color: string) => {
  const out = document.createElement("canvas");
  out.width = source.width;
  out.height = source.height;
  const paint = out.getContext("2d");

  if (paint) {
    paint.drawImage(source, 0, 0);
    paint.globalCompositeOperation = "source-in";
    paint.fillStyle = color;
    paint.fillRect(0, 0, out.width, out.height);
  }

  return out;
};

const noiseTile = () => {
  const tile = document.createElement("canvas");
  tile.width = 160;
  tile.height = 160;
  const paint = tile.getContext("2d");

  if (paint) {
    const image = paint.createImageData(160, 160);

    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.random() * 255;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }

    paint.putImageData(image, 0, 0);
  }

  return tile;
};

const snowfall = (): Flake[] =>
  Array.from({ length: 70 }, (_, i) => {
    const near = i < 6;

    return {
      near,
      r: near ? 2.4 + Math.random() * 1.6 : 0.8 + Math.random() * 1.6,
      speed: near ? 0.09 + Math.random() * 0.05 : 0.025 + Math.random() * 0.035,
      sway: Math.random() * Math.PI * 2,
      x: Math.random(),
      y: Math.random(),
    };
  });

export const createRenderer = (
  canvas: HTMLCanvasElement,
  stage: () => DOMRect | null,
  calm: boolean
) => {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D is not available");
  }

  const ctx = context;

  const font =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mincho")
      .trim() || "serif";

  const atlas = createAtlas(SPRITES, (w, h, at) => backdrop(w, h, at, false));
  const glow = glowSprite();
  const amber = tinted(glow, "#ff9448");
  const rose = tinted(glow, "#ff5a3a");
  const snow = tinted(glow, ink.flake);
  const grain = ctx.createPattern(noiseTile(), "repeat");
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame: Frame = { size: 1, x: 0, y: 0 };
  let goal: Frame = frame;
  const flakes = snowfall();
  let last = performance.now();
  let shown: number | null = null;
  let struck = -Infinity;
  let pounded = -Infinity;
  let firm = 0;
  let hurt: number | null = null;
  let jolt = { at: -Infinity, length: 1, strength: 0 };
  let drops: Drop[] = [];
  let floaters: Floater[] = [];
  let lang: Lang = "ja";

  const fit = (dt: number) => {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextWidth = canvas.clientWidth;
    const nextHeight = canvas.clientHeight;

    if (nextWidth !== width || nextHeight !== height || nextDpr !== dpr) {
      width = nextWidth;
      height = nextHeight;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    const box = stage();
    const own = canvas.getBoundingClientRect();

    if (box && box.width > 0 && box.height > 0) {
      const size = Math.min(box.width * 1.15, box.height, 680);
      goal = {
        size,
        x: box.left - own.left + (box.width - size) / 2,
        y: box.top - own.top + box.height - size,
      };
    }

    const follow = calm || shown === null ? 1 : 1 - Math.exp(-dt * GLIDE);
    frame = {
      size: mix(frame.size, goal.size, follow),
      x: mix(frame.x, goal.x, follow),
      y: mix(frame.y, goal.y, follow),
    };
    atlas.prepare((goal.size / SCENE) * dpr);
    atlas.scenery(width, height, goal, dpr);
  };

  const screen = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const scene = (now: number) => {
    const age = now - jolt.at;
    const fade = calm ? 0 : Math.max(0, 1 - age / jolt.length);
    const dx = (Math.random() - 0.5) * jolt.strength * fade * frame.size;
    const dy = (Math.random() - 0.5) * jolt.strength * fade * frame.size;
    const k = (frame.size / SCENE) * dpr;
    ctx.setTransform(k, 0, 0, k, (frame.x + dx) * dpr, (frame.y + dy) * dpr);
  };

  const put = (sprite: Sprite, place?: Place, alpha = 1) => {
    const bitmap = atlas.sprite(sprite);

    if (bitmap === null || alpha <= 0) {
      return;
    }

    ctx.save();

    if (place) {
      ctx.translate(place.x, place.y);
      ctx.rotate(place.angle);
      ctx.scale(place.sx, place.sy);
    }

    ctx.globalAlpha *= alpha;
    const { box } = sprite;
    ctx.drawImage(bitmap, box.x, box.y, box.w, box.h);
    ctx.restore();
  };

  const lay = (layer: Layer) => {
    const k = frame.size / layer.frame.size;
    ctx.drawImage(
      layer.image,
      frame.x - layer.frame.x * k,
      frame.y - layer.frame.y * k,
      width * k,
      height * k
    );
  };

  const scenery = () => {
    screen();
    ctx.fillStyle = ink.night;
    ctx.fillRect(0, 0, width, height);
    const layer = atlas.backdrop();

    if (layer) {
      lay(layer);
    }
  };

  const lanterns = (now: number) => {
    screen();
    ctx.globalCompositeOperation = "lighter";

    for (const [i, spot] of lanternsOf(width, height, frame).entries()) {
      const flicker = calm
        ? 0.5
        : 0.5 + 0.3 * Math.sin(now / 170 + i * 2.1) * Math.sin(now / 410 + i);

      const r = spot.size * (2.4 + flicker * 0.5);
      ctx.globalAlpha = 0.16 + flicker * 0.14;
      ctx.drawImage(amber, spot.x - r, spot.y - r, r * 2, r * 2);
    }

    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
  };

  const fall = (dt: number, near: boolean) => {
    if (calm) {
      return;
    }

    screen();

    for (const flake of flakes) {
      if (flake.near !== near) {
        continue;
      }

      flake.y += flake.speed * dt;
      flake.sway += dt * 0.8;

      if (flake.y > 1.05) {
        flake.y = -0.05;
        flake.x = Math.random();
      }

      const x = flake.x * width + Math.sin(flake.sway) * 14;
      const y = flake.y * height;
      const r = flake.r * (near ? 2.6 : 2);
      ctx.globalAlpha = near ? 0.22 : 0.7;
      ctx.drawImage(snow, x - r, y - r, r * 2, r * 2);
    }

    ctx.globalAlpha = 1;
  };

  const squashOf = (now: number) => {
    if (calm) {
      return 0;
    }

    const t = now - pounded;

    if (t < 0 || t > 700) {
      return 0;
    }

    return firm * Math.exp(-t / 140) * Math.cos((t / 210) * Math.PI * 2);
  };

  const dough = (view: View, now: number) => {
    const squash = squashOf(now);
    const smooth = clamp(view.smooth);
    ctx.save();
    ctx.translate(USU.cx, MOCHI.y);
    ctx.scale(1 + 0.16 * squash, 1 - 0.38 * squash);
    ctx.translate(-USU.cx, -MOCHI.y);
    put(mochiBody);
    put(mochiGrains, undefined, 1 - smooth);
    put(mochiGloss, undefined, 0.2 + 0.8 * smooth);
    ctx.restore();
  };

  const liftOf = (view: View, now: number) => {
    const since = now - struck;
    const rise = Math.min(220, view.interval * 0.55);

    const poise =
      view.sweep === null ? 0 : smoothstep(0.4, 0.92, view.sweep) * 0.12;

    const hold = hurt === null ? HOLD : PINNED;

    if (since < hold) {
      return 0;
    }

    return easeOut((since - hold) / rise) * (1 + poise);
  };

  const strand = (lift: number, now: number) => {
    const since = now - pounded;

    if (calm || hurt !== null || since < HOLD || since > HOLD + STRETCH) {
      return;
    }

    const face = toWorld(kinePose(lift), STRIKE.x, STRIKE.y);
    const base = { x: USU.cx, y: MOCHI.y - MOCHI.h + 8 };
    const reach = Math.hypot(face.x - base.x, face.y - base.y);

    if (reach > SNAP) {
      return;
    }

    const t = reach / SNAP;
    const waist = mix(46, 4, t);
    const foot = mix(80, 50, t);
    const head = mix(46, 22, t);
    const mid = { x: (face.x + base.x) / 2, y: (face.y + base.y) / 2 };
    const body = ctx.createLinearGradient(base.x - foot, 0, base.x + foot, 0);
    body.addColorStop(0, ink.cream);
    body.addColorStop(0.4, "#ffffff");
    body.addColorStop(1, ink.cream);
    ctx.save();
    ctx.globalAlpha = 1 - t * 0.35;
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(base.x - foot, base.y + 6);
    ctx.quadraticCurveTo(mid.x - waist, mid.y, face.x - head, face.y);
    ctx.lineTo(face.x + head, face.y);
    ctx.quadraticCurveTo(mid.x + waist, mid.y, base.x + foot, base.y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  const steam = (now: number) => {
    if (calm) {
      return;
    }

    ctx.save();

    for (let i = 0; i < 6; i += 1) {
      const t = (now / 2800 + i / 6) % 1;

      const x =
        USU.cx + (i - 2.5) * 34 + Math.sin(now / 900 + i * 1.7) * 30 * t;

      const y = MOCHI.y - MOCHI.h - t * 320;
      const r = 40 + t * 70;
      ctx.globalAlpha = 0.14 * Math.sin(t * Math.PI);
      ctx.drawImage(snow, x - r, y - r, r * 2, r * 2);
    }

    ctx.restore();
  };

  const ring = (view: View) => {
    if (view.sweep === null) {
      return;
    }

    const near = smoothstep(0.45, 1, view.sweep);

    if (near <= 0) {
      return;
    }

    const grow = 1 + (1 - near) * 0.9;
    ctx.save();
    ctx.globalAlpha = near * 0.85;
    ctx.strokeStyle = ink.ring;
    const [, halo] = ink.gold;
    ctx.shadowColor = halo;
    ctx.shadowBlur = 18 * (frame.size / SCENE) * dpr;
    ctx.lineWidth = 3 + near * 4;
    ctx.beginPath();
    ctx.ellipse(
      USU.cx,
      MOCHI.y - MOCHI.h * 0.4,
      MOCHI.rx * grow,
      MOCHI.h * 0.9 * grow,
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  };

  const shock = (now: number) => {
    const age = now - pounded;

    if (calm || age < 0 || age > 300) {
      return;
    }

    const t = age / 300;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = (1 - t) * 0.5 * firm;
    const r = 180 + t * 260;
    ctx.drawImage(amber, USU.cx - r, MOCHI.y - 60 - r * 0.5, r * 2, r);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = (1 - t) * 0.7 * firm;
    ctx.strokeStyle = ink.ring;
    ctx.lineWidth = 6 * (1 - t);
    ctx.beginPath();
    ctx.ellipse(
      USU.cx,
      MOCHI.y - 10,
      MOCHI.rx * (1 + t * 0.7),
      MOCHI.h * (0.6 + t * 0.6),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  };

  const reachOf = (view: View, now: number) => {
    if (hurt === null) {
      return view.reach;
    }

    const age = now - hurt;

    return age < PINNED ? 1 : mix(1, 0.25, easeOut((age - PINNED) / 500));
  };

  const arm = (view: View, now: number) => {
    const age = hurt === null ? Infinity : now - hurt;
    const fresh = age < OUCH;

    const swell = fresh
      ? 1 + 0.14 * Math.sin(Math.min(1, age / 200) * Math.PI)
      : 1;

    const pose = armPose(reachOf(view, now), swell);

    if (!calm && fresh) {
      pose.hand.y += Math.sin(age / 18) * 8 * (1 - age / OUCH);
    }

    put(sleeve, pose.sleeve);
    put(forearm, pose.forearm);
    put(hand, pose.hand);

    if (fresh) {
      put(bruise, pose.hand, 1 - age / OUCH);
    }
  };

  const splash = (now: number) => {
    drops = drops.filter((drop) => now - drop.born < DROP_LIFE);
    ctx.save();

    for (const drop of drops) {
      const t = (now - drop.born) / 1000;
      const x = drop.x + drop.vx * t;
      const y = drop.y + drop.vy * t + 1100 * t * t;
      ctx.globalAlpha = Math.max(0, 1 - (now - drop.born) / DROP_LIFE);
      ctx.fillStyle = drop.wet ? ink.water : ink.drop;
      ctx.beginPath();
      ctx.ellipse(x, y, drop.r, drop.r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const warmth = (view: View, now: number) => {
    const pulse = calm ? 0 : Math.exp(-(now - pounded) / 180);

    const flicker = calm
      ? 0
      : 0.04 * Math.sin(now / 130) * Math.sin(now / 370 + 1);

    const heat = clamp(view.heat);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = clamp(0.12 + heat * 0.16 + pulse * 0.2 + flicker);
    ctx.drawImage(heat > 0.5 ? rose : amber, 60, 380, 880, 520);
    ctx.restore();
  };

  const text = (
    value: string,
    x: number,
    y: number,
    px: number,
    fill: readonly string[],
    alpha: number
  ) => {
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${px}px ${font}`;
    const paint = ctx.createLinearGradient(0, y - px / 2, 0, y + px / 2);

    for (const [i, color] of fill.entries()) {
      paint.addColorStop(i / Math.max(1, fill.length - 1), color);
    }

    ctx.shadowColor = "rgb(0 0 0 / 0.55)";
    ctx.shadowBlur = px * 0.35;
    ctx.lineWidth = Math.max(2, px * 0.09);
    ctx.strokeStyle = ink.stroke;
    ctx.strokeText(value, x, y);
    ctx.shadowColor = fill[1] ?? fill[0];
    ctx.shadowBlur = px * 0.25;
    ctx.fillStyle = paint;
    ctx.fillText(value, x, y);
    ctx.shadowBlur = 0;
  };

  const words = (view: View, now: number) => {
    screen();
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    const at = (x: number, y: number) => ({
      x: frame.x + (x / SCENE) * frame.size,
      y: frame.y + (y / SCENE) * frame.size,
    });

    const { size } = frame;
    const lane = at(270, 150);
    const sky = Math.max(110, lane.y);

    if (view.count !== null) {
      text(
        String(view.count),
        lane.x,
        sky + size * 0.06,
        size * 0.2,
        ink.gold,
        0.95
      );
    } else if (view.streak >= 5) {
      text(
        `${view.streak}`,
        lane.x,
        sky - size * 0.06,
        size * 0.06,
        ink.gold,
        0.9
      );
    }

    floaters = floaters.filter(
      (floater) => now - floater.born < (floater.call === "hand" ? OUCH : FLOAT)
    );

    for (const floater of floaters) {
      const life = floater.call === "hand" ? OUCH : FLOAT;
      const t = (now - floater.born) / life;
      const style = calls[floater.call];
      const rise = calm ? 0 : easeOut(t) * 60;
      const pop = calm ? 1 : 1 + 0.35 * Math.max(0, 1 - t * 7);

      const spot =
        floater.call === "hand"
          ? at(300, 440 - rise)
          : { x: lane.x, y: sky + size * 0.04 - (rise / SCENE) * size };

      text(
        style.word[lang],
        spot.x,
        spot.y,
        size * style.size * pop,
        style.fill,
        t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35
      );
    }

    ctx.restore();
  };

  const finish = (now: number) => {
    screen();

    if (grain) {
      ctx.save();
      ctx.globalAlpha = ink.grain;
      ctx.globalCompositeOperation = "overlay";
      const shift = calm ? 0 : Math.floor(Math.random() * 160);
      ctx.translate(-shift, -shift);
      ctx.fillStyle = grain;
      ctx.fillRect(0, 0, width + 160, height + 160);
      ctx.restore();
    }

    if (shown === null && atlas.ready()) {
      shown = now;
    }

    const reveal = shown === null ? 0 : clamp((now - shown) / REVEAL);

    if (reveal < 1) {
      ctx.globalAlpha = calm && shown !== null ? 0 : 1 - easeOut(reveal);
      ctx.fillStyle = ink.night;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  };

  const burst = (now: number, strength: number) => {
    if (calm) {
      return;
    }

    for (let i = 0; i < 8 + strength * 10; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      drops.push({
        born: now,
        r: 4 + Math.random() * 8,
        vx: side * (120 + Math.random() * 340),
        vy: -360 - Math.random() * 460 * strength,
        wet: Math.random() < 0.35,
        x: USU.cx + side * (60 + Math.random() * 80),
        y: MOCHI.y - MOCHI.h * 0.6,
      });
    }

    drops = drops.slice(-110);
  };

  return {
    call: (call: Call, now: number) => {
      floaters = [...floaters.slice(-4), { born: now, call }];
    },
    draw: (view: View, now: number) => {
      const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
      last = now;
      fit(dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      scenery();
      lanterns(now);
      fall(dt, false);
      scene(now);
      put(mat);
      put(tub);
      put(usu);
      const lift = liftOf(view, now);
      dough(view, now);
      put(lip);
      strand(lift, now);
      ring(view);
      steam(now);
      shock(now);
      arm(view, now);
      put(kine, kinePose(lift));
      splash(now);
      warmth(view, now);
      fall(dt, true);
      words(view, now);
      finish(now);
    },
    hand: (now: number) => {
      struck = now;
      hurt = now;
      jolt = { at: now, length: 420, strength: 0.035 };
      floaters = [{ born: now, call: "hand" }];
    },
    language: (next: Lang) => {
      lang = next;
    },
    pound: (now: number, great: boolean, heat: number) => {
      struck = now;
      pounded = now;
      firm = great ? 1 : 0.75;
      jolt = {
        at: now,
        length: 140,
        strength: (great ? 0.008 : 0.005) * (0.6 + heat),
      };
      burst(now, great ? 1 : 0.6);
    },
    reset: () => {
      struck = -Infinity;
      pounded = -Infinity;
      hurt = null;
      jolt = { at: -Infinity, length: 1, strength: 0 };
      drops = [];
      floaters = [];
    },
    swing: (now: number) => {
      struck = now;
      pounded = now;
      firm = 0.4;
    },
  };
};
