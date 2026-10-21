import type { Lang, Text } from "../../_lib/i18n";
import {
  MOCHI,
  USU,
  armPose,
  bruise,
  floor,
  forearm,
  gloss,
  grains,
  hand,
  kine,
  kinePose,
  lip,
  mochi,
  sleeve,
  tub,
  usu,
} from "./art";
import { createPainter } from "./paint";

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

interface Point {
  x: number;
  y: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  wet: boolean;
  born: number;
}

interface Floater {
  call: Call;
  born: number;
}

const HOLD = 45;
const PINNED = 520;
const FLOAT = 620;
const OUCH = 1100;
const DROP_LIFE = 650;

const paint = {
  drop: "rgb(255 252 246 / 0.95)",
  ring: "rgb(255 236 200 / 0.9)",
  steam: "255 255 255",
  stroke: "rgb(8 6 18 / 0.65)",
  water: "rgb(170 210 238 / 0.85)",
} as const;

const calls: Record<Call, { word: Text; color: string; size: number }> = {
  flub: {
    color: "rgb(255 255 255 / 0.7)",
    size: 0.075,
    word: { en: "Off", ja: "ずれ" },
  },
  good: { color: "#fffaf3", size: 0.1, word: { en: "Good", ja: "可" } },
  great: { color: "#ffd27a", size: 0.12, word: { en: "Great", ja: "良" } },
  hand: { color: "#ff6a5a", size: 0.15, word: { en: "Ouch!", ja: "痛っ！" } },
  miss: {
    color: "rgb(255 255 255 / 0.55)",
    size: 0.1,
    word: { en: "Miss", ja: "×" },
  },
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;
const smoothstep = (from: number, to: number, value: number) => {
  const t = clamp((value - from) / (to - from));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  const draw = createPainter(ctx);
  const font =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mincho")
      .trim() || "serif";
  let size = 0;
  let dpr = 1;
  let struck = -Infinity;
  let pounded = -Infinity;
  let firm = 0;
  let hurt: number | null = null;
  let jolt = { at: -Infinity, length: 1, strength: 0 };
  let drops: Drop[] = [];
  let floaters: Floater[] = [];
  let lang: Lang = "ja";

  const fit = () => {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
    const nextSize = Math.min(canvas.clientWidth, canvas.clientHeight);
    if (nextSize === 0 || (nextSize === size && nextDpr === dpr)) {
      return;
    }
    size = nextSize;
    dpr = nextDpr;
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
  };

  const place = (now: number) => {
    const age = now - jolt.at;
    const fade = calm ? 0 : Math.max(0, 1 - age / jolt.length);
    const dx = (Math.random() - 0.5) * jolt.strength * fade;
    const dy = (Math.random() - 0.5) * jolt.strength * fade;
    ctx.setTransform(
      dpr * size,
      0,
      0,
      dpr * size,
      ((canvas.clientWidth - size) / 2 + dx * size) * dpr,
      ((canvas.clientHeight - size) / 2 + dy * size) * dpr
    );
  };

  const glow = (view: View, now: number) => {
    const pulse = calm ? 0 : Math.exp(-(now - pounded) / 180);
    const heat = clamp(view.heat);
    const red = 255;
    const green = Math.round(mix(176, 92, heat));
    const blue = Math.round(mix(96, 70, heat));
    const strength = 0.2 + heat * 0.22 + pulse * 0.18;
    const light = ctx.createRadialGradient(0.5, 0.64, 0.02, 0.5, 0.64, 0.35);
    light.addColorStop(0, `rgb(${red} ${green} ${blue} / ${strength})`);
    light.addColorStop(1, `rgb(${red} ${green} ${blue} / 0)`);
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, 1, 1);
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
    draw(mochi);
    draw(grains, undefined, 1 - smooth);
    draw(gloss, undefined, 0.2 + 0.8 * smooth);
    ctx.restore();
  };

  const steam = (now: number) => {
    if (calm) {
      return;
    }
    for (let i = 0; i < 6; i += 1) {
      const t = (now / 2600 + i / 6) % 1;
      const x =
        0.5 + (i - 2.5) * 0.034 + Math.sin(now / 900 + i * 1.7) * 0.03 * t;
      const y = MOCHI.y - MOCHI.h - t * 0.32;
      const r = 0.03 + t * 0.06;
      const alpha = 0.12 * Math.sin(t * Math.PI);
      const puff = ctx.createRadialGradient(x, y, 0, x, y, r);
      puff.addColorStop(0, `rgb(${paint.steam} / ${alpha})`);
      puff.addColorStop(1, `rgb(${paint.steam} / 0)`);
      ctx.fillStyle = puff;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
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
    ctx.globalAlpha = near * 0.75;
    ctx.strokeStyle = paint.ring;
    ctx.lineWidth = 0.004 + near * 0.004;
    ctx.beginPath();
    ctx.ellipse(
      0.5,
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
      pose.hand.y += Math.sin(age / 18) * 0.008 * (1 - age / OUCH);
    }
    draw(sleeve, pose.sleeve);
    draw(forearm, pose.forearm);
    draw(hand, pose.hand);
    if (fresh) {
      draw(bruise, pose.hand, 1 - age / OUCH);
    }
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

  const splash = (now: number) => {
    drops = drops.filter((drop) => now - drop.born < DROP_LIFE);
    for (const drop of drops) {
      const t = (now - drop.born) / 1000;
      ctx.globalAlpha = Math.max(0, 1 - (now - drop.born) / DROP_LIFE);
      ctx.fillStyle = drop.wet ? paint.water : paint.drop;
      ctx.beginPath();
      ctx.arc(
        drop.x + drop.vx * t,
        drop.y + drop.vy * t + 1.1 * t * t,
        drop.r,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const shock = (now: number) => {
    const age = now - pounded;
    if (calm || age < 0 || age > 260) {
      return;
    }
    const t = age / 260;
    ctx.save();
    ctx.globalAlpha = (1 - t) * 0.6 * firm;
    ctx.strokeStyle = paint.ring;
    ctx.lineWidth = 0.006 * (1 - t);
    ctx.beginPath();
    ctx.ellipse(
      0.5,
      MOCHI.y - 0.01,
      MOCHI.rx * (1 + t * 0.7),
      MOCHI.h * (0.6 + t * 0.6),
      0,
      0,
      Math.PI * 2
    );
    ctx.stroke();
    ctx.restore();
  };

  const text = (
    value: string,
    at: Point,
    px: number,
    color: string,
    alpha: number
  ) => {
    ctx.globalAlpha = alpha;
    ctx.font = `700 ${px}px ${font}`;
    ctx.lineWidth = Math.max(2, px * 0.08);
    ctx.strokeStyle = paint.stroke;
    ctx.strokeText(value, at.x, at.y);
    ctx.fillStyle = color;
    ctx.fillText(value, at.x, at.y);
  };

  const words = (view: View, now: number) => {
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    const left = (canvas.clientWidth - size) / 2;
    const top = (canvas.clientHeight - size) / 2;
    const at = (x: number, y: number) => ({
      x: left + x * size,
      y: top + y * size,
    });
    if (view.count !== null) {
      text(String(view.count), at(0.5, 0.3), size * 0.2, paint.ring, 0.9);
    } else if (view.streak >= 5) {
      text(`${view.streak}`, at(0.5, 0.16), size * 0.07, paint.ring, 0.8);
    }
    floaters = floaters.filter(
      (floater) => now - floater.born < (floater.call === "hand" ? OUCH : FLOAT)
    );
    for (const floater of floaters) {
      const life = floater.call === "hand" ? OUCH : FLOAT;
      const t = (now - floater.born) / life;
      const style = calls[floater.call];
      const rise = calm ? 0 : easeOut(t) * 0.06;
      const pop = calm ? 1 : 1 + 0.25 * Math.max(0, 1 - t * 6);
      text(
        style.word[lang],
        at(
          floater.call === "hand" ? 0.3 : 0.5,
          (floater.call === "hand" ? 0.44 : 0.36) - rise
        ),
        size * style.size * pop,
        style.color,
        t < 0.65 ? 1 : 1 - (t - 0.65) / 0.35
      );
    }
    ctx.restore();
  };

  const burst = (now: number, strength: number) => {
    if (calm) {
      return;
    }
    for (let i = 0; i < 6 + strength * 8; i += 1) {
      const side = i % 2 === 0 ? -1 : 1;
      drops.push({
        born: now,
        r: 0.004 + Math.random() * 0.007,
        vx: side * (0.12 + Math.random() * 0.32),
        vy: -0.35 - Math.random() * 0.45 * strength,
        wet: Math.random() < 0.35,
        x: 0.5 + side * (0.06 + Math.random() * 0.08),
        y: MOCHI.y - MOCHI.h * 0.6,
      });
    }
    drops = drops.slice(-90);
  };

  return {
    language: (next: Lang) => {
      lang = next;
    },
    call: (call: Call, now: number) => {
      floaters = [...floaters.slice(-4), { born: now, call }];
    },
    draw: (view: View, now: number) => {
      fit();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      place(now);
      glow(view, now);
      draw(floor);
      draw(tub);
      draw(usu);
      dough(view, now);
      draw(lip);
      ring(view);
      steam(now);
      shock(now);
      arm(view, now);
      draw(kine, kinePose(liftOf(view, now)));
      splash(now);
      words(view, now);
    },
    hand: (now: number) => {
      struck = now;
      hurt = now;
      jolt = { at: now, length: 420, strength: 0.035 };
      floaters = [{ born: now, call: "hand" }];
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
