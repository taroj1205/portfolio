import { createAtlas } from "../../_lib/atlas";
import type { Lang, Text } from "../../_lib/i18n";
import type { Frame, Point, Sprite } from "../../_lib/svg";
import {
  BOWL,
  SCENE,
  SPRITES,
  TILT,
  backdrop,
  bodies,
  bowlBase,
  bowlRim,
  bowlSpots,
  caustics,
  paper,
  poiFrame,
  shadow,
  tailJoint,
  tails,
  torn,
} from "./art";
import { kinds } from "./fish";
import type { KindId } from "./fish";
import { POI, WATER, catchable } from "./tank";
import type { Fish, Tank } from "./tank";

interface Ripple {
  x: number;
  y: number;
  born: number;
  size: number;
}

interface Flight {
  kind: KindId;
  from: Point;
  heading: number;
  born: number;
  delay: number;
}

interface Drop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  born: number;
}

interface Floater {
  text: string;
  born: number;
  gold: boolean;
}

const FLY = 520;
const RIPPLE = 1100;
const DROP = 600;
const FLOAT = 1100;
const REVEAL = 600;
const SHOWN = 8;

const RIP: Text = { en: "Rip!", ja: "ビリッ" };
const UNDER: Text = { en: "Under the paper!", ja: "紙の下！" };

const ink = {
  gold: ["#fff6d8", "#ffd27a", "#c9862c"],
  finger: ["rgb(255 255 255 / 0.32)", "rgb(255 255 255 / 0.85)"],
  halo: [
    "rgb(255 226 140 / 0.85)",
    "rgb(255 226 140 / 0.35)",
    "rgb(255 226 140 / 0)",
  ],
  night: "#0b0a1c",
  ripple: "#eaf8ff",
  stroke: "#071a24",
  tint: "rgb(26 102 140 / 0.32)",
  white: ["#ffffff", "#e8f2f6"],
} as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;
const easeInOut = (t: number) => {
  const c = clamp(t);
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
};

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D is not available");
  }
  const ctx = context;
  const font =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--font-mincho")
      .trim() || "serif";
  const atlas = createAtlas(SPRITES, backdrop);
  let width = 0;
  let height = 0;
  let dpr = 1;
  let frame: Frame = { size: 1, x: 0, y: 0 };
  let shown: number | null = null;
  let last = performance.now();
  let rise = 1;
  let ripples: Ripple[] = [];
  let flights: Flight[] = [];
  let drops: Drop[] = [];
  let floaters: Floater[] = [];
  let bowl: KindId[] = [];
  let lang: Lang = "ja";
  let finger: Point | null = null;

  const fit = () => {
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
    const size = Math.min(width, height);
    frame = { size, x: (width - size) / 2, y: (height - size) / 2 };
    atlas.prepare((size / SCENE) * dpr);
    atlas.scenery(width, height, frame, dpr);
  };

  const scene = () => {
    const k = (frame.size / SCENE) * dpr;
    ctx.setTransform(k, 0, 0, k, frame.x * dpr, frame.y * dpr);
  };

  const put = (sprite: Sprite) => {
    const bitmap = atlas.sprite(sprite);
    if (bitmap !== null) {
      const { box } = sprite;
      ctx.drawImage(bitmap, box.x, box.y, box.w, box.h);
    }
  };

  const scenery = () => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = ink.night;
    ctx.fillRect(0, 0, width, height);
    const layer = atlas.backdrop();
    if (layer) {
      const k = frame.size / layer.frame.size;
      ctx.drawImage(
        layer.image,
        frame.x - layer.frame.x * k,
        frame.y - layer.frame.y * k,
        width * k,
        height * k
      );
    }
  };

  const shimmer = (now: number) => {
    const tile = atlas.sprite(caustics);
    if (tile === null) {
      return;
    }
    scene();
    ctx.save();
    ctx.beginPath();
    ctx.rect(
      WATER.left - 12,
      WATER.top - 12,
      WATER.right - WATER.left + 24,
      WATER.bottom - WATER.top + 24
    );
    ctx.clip();
    ctx.globalCompositeOperation = "lighter";
    const size = caustics.box.w;
    const drifts = [
      { alpha: 0.1, x: 0.011, y: 0.007 },
      { alpha: 0.08, x: -0.008, y: 0.012 },
    ];
    for (const drift of drifts) {
      const t = calm ? 0 : now;
      const ox = (((t * drift.x) % size) + size) % size;
      const oy = (((t * drift.y) % size) + size) % size;
      ctx.globalAlpha = drift.alpha;
      for (let x = -size + ox; x < SCENE; x += size) {
        for (let y = -size + oy; y < SCENE; y += size) {
          ctx.drawImage(tile, x, y, size, size);
        }
      }
    }
    ctx.restore();
  };

  const rings = (now: number) => {
    ripples = ripples.filter((ripple) => now - ripple.born < RIPPLE);
    ctx.save();
    ctx.strokeStyle = ink.ripple;
    for (const ripple of ripples) {
      const t = (now - ripple.born) / RIPPLE;
      for (const lag of [0, 0.18]) {
        const u = t - lag;
        if (u > 0) {
          ctx.globalAlpha = (1 - u) * 0.45;
          ctx.lineWidth = 3 * (1 - u) + 0.5;
          ctx.beginPath();
          ctx.arc(
            ripple.x,
            ripple.y,
            ripple.size * (0.3 + easeOut(u) * 0.9),
            0,
            Math.PI * 2
          );
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  };

  const fishAt = (
    kind: KindId,
    at: Point,
    heading: number,
    sway: number,
    scale: number,
    alpha: number,
    withShadow: boolean
  ) => {
    const { length } = kinds[kind];
    ctx.save();
    ctx.globalAlpha = alpha;
    if (withShadow) {
      ctx.save();
      ctx.translate(at.x + 10 * scale, at.y + 16 * scale);
      ctx.rotate(heading);
      ctx.scale((length / 100) * scale, (length / 100) * scale);
      put(shadow);
      ctx.restore();
    }
    ctx.translate(at.x, at.y);
    ctx.rotate(heading);
    ctx.scale(scale, scale);
    ctx.save();
    ctx.translate(tailJoint(kind), 0);
    ctx.rotate(sway);
    put(tails[kind]);
    ctx.restore();
    put(bodies[kind]);
    ctx.restore();
  };

  const swimmer = (fish: Fish) => {
    const effort = Math.min(1, fish.speed / 200);
    const sway = calm
      ? 0
      : Math.sin(fish.phase) * (0.22 + effort * 0.3) + fish.turn * 0.12;
    fishAt(
      fish.kind,
      fish,
      fish.heading - sway * 0.12,
      sway,
      1,
      Math.min(1, fish.age / 0.8),
      true
    );
  };

  const halo = (fish: Fish) => {
    const r = kinds[fish.kind].length * 0.7;
    const glow = ctx.createRadialGradient(fish.x, fish.y, 0, fish.x, fish.y, r);
    for (const [i, color] of ink.halo.entries()) {
      glow.addColorStop(i / (ink.halo.length - 1), color);
    }
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(fish.x, fish.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const fingertip = () => {
    if (finger === null) {
      return;
    }
    const [fill, edge] = ink.finger;
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = edge;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(finger.x, finger.y, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  const poiAt = (tank: Tank, lifted: number) => {
    const { poi } = tank;
    const sheet = poi.torn ? torn : paper;
    const scale = 1 + lifted * 0.06;
    if (lifted > 0.02) {
      ctx.save();
      ctx.globalAlpha = 0.5 * lifted;
      ctx.translate(poi.x + 22 * lifted, poi.y + 34 * lifted);
      ctx.rotate(TILT);
      ctx.scale(POI.ring / 46, POI.ring / 46);
      put(shadow);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(poi.x, poi.y);
    ctx.rotate(TILT);
    ctx.scale(scale, scale);
    ctx.globalAlpha = (poi.down ? 0.5 : 0.72) + 0.28 * poi.paper;
    put(sheet);
    ctx.globalAlpha = 1;
    put(poiFrame);
    if (lifted < 0.98) {
      ctx.globalAlpha = 1 - lifted;
      ctx.fillStyle = ink.tint;
      ctx.beginPath();
      ctx.arc(0, 0, POI.ring + 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const bowlSwim = (now: number) => {
    ctx.save();
    ctx.translate(BOWL.x, BOWL.y);
    put(bowlBase);
    ctx.restore();
    const spin = calm ? 0 : now / 2600;
    for (const [i, spot] of bowlSpots(bowl.length).entries()) {
      const dir = i % 2 === 0 ? 1 : -1;
      const angle = spin * dir;
      const dx = spot.x - BOWL.x;
      const dy = spot.y - BOWL.y;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      fishAt(
        bowl[i],
        { x: BOWL.x + dx * cos - dy * sin, y: BOWL.y + dx * sin + dy * cos },
        spot.heading + angle + (dir < 0 ? Math.PI : 0),
        calm ? 0.2 : Math.sin(now / 160 + i) * 0.3,
        0.5,
        1,
        false
      );
    }
    ctx.save();
    ctx.translate(BOWL.x, BOWL.y);
    put(bowlRim);
    ctx.restore();
  };

  const fly = (now: number) => {
    const landed = flights.filter(
      (flight) => now - flight.born - flight.delay >= FLY
    );
    for (const flight of landed) {
      bowl = [...bowl, flight.kind].slice(-SHOWN);
      ripples.push({ born: now, size: 50, x: BOWL.x, y: BOWL.y });
    }
    flights = flights.filter((flight) => !landed.includes(flight));
    for (const flight of flights) {
      const t = clamp((now - flight.born - flight.delay) / FLY);
      const u = easeInOut(t);
      const lift = Math.sin(Math.PI * t);
      fishAt(
        flight.kind,
        {
          x: flight.from.x + (BOWL.x - flight.from.x) * u,
          y: flight.from.y + (BOWL.y - flight.from.y) * u - lift * 120,
        },
        flight.heading + t * 2.2,
        Math.sin(now / 50) * 0.5,
        1 + lift * 0.3 - u * 0.5,
        1,
        true
      );
    }
  };

  const splash = (now: number) => {
    drops = drops.filter((drop) => now - drop.born < DROP);
    ctx.save();
    ctx.fillStyle = ink.ripple;
    for (const drop of drops) {
      const t = (now - drop.born) / 1000;
      ctx.globalAlpha = 0.8 * (1 - (now - drop.born) / DROP);
      ctx.beginPath();
      ctx.arc(
        drop.x + drop.vx * t,
        drop.y + drop.vy * t + 900 * t * t,
        drop.r,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    ctx.restore();
  };

  const label = (floater: Floater, now: number) => {
    const t = (now - floater.born) / FLOAT;
    const px = floater.gold ? 58 : 50;
    ctx.font = `700 ${px}px ${font}`;
    const half = ctx.measureText(floater.text).width / 2;
    const x = Math.min(BOWL.x, SCENE - 24 - half);
    const y = BOWL.y - BOWL.r - 30 - (calm ? 0 : easeOut(t) * 70);
    ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
    const fill = floater.gold ? ink.gold : ink.white;
    const paint = ctx.createLinearGradient(0, y - px / 2, 0, y + px / 2);
    for (const [i, color] of fill.entries()) {
      paint.addColorStop(i / Math.max(1, fill.length - 1), color);
    }
    ctx.lineWidth = px * 0.12;
    ctx.strokeStyle = ink.stroke;
    ctx.strokeText(floater.text, x, y);
    ctx.fillStyle = paint;
    ctx.fillText(floater.text, x, y);
  };

  const words = (now: number) => {
    floaters = floaters.filter((floater) => now - floater.born < FLOAT);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    for (const floater of floaters) {
      label(floater, now);
    }
    ctx.restore();
  };

  const reveal = (now: number) => {
    if (shown === null && atlas.ready()) {
      shown = now;
    }
    const t = shown === null ? 0 : clamp((now - shown) / REVEAL);
    if (t < 1) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = calm && shown !== null ? 0 : 1 - easeOut(t);
      ctx.fillStyle = ink.night;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  };

  const burst = (at: Point, now: number, count: number) => {
    if (calm) {
      return;
    }
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      drops.push({
        born: now,
        r: 3 + Math.random() * 5,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 220,
        x: at.x + Math.cos(angle) * POI.r * 0.6,
        y: at.y + Math.sin(angle) * POI.r * 0.6,
      });
    }
    drops = drops.slice(-90);
  };

  return {
    dip: (at: Point, now: number) => {
      ripples.push({ born: now, size: POI.ring * 1.4, x: at.x, y: at.y });
    },
    draw: (tank: Tank, now: number) => {
      const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
      last = now;
      fit();
      const goal = tank.poi.down ? 0 : 1;
      rise = calm ? goal : rise + (goal - rise) * Math.min(1, dt * 14);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      scenery();
      shimmer(now);
      scene();
      rings(now);
      const sunk = tank.poi.down || tank.poi.torn;
      if (sunk) {
        for (const fish of tank.fish) {
          if (fish.under) {
            swimmer(fish);
          }
        }
        poiAt(tank, 0);
      }
      const glowing = tank.poi.down ? catchable(tank) : [];
      for (const fish of tank.fish) {
        if (sunk && fish.under) {
          continue;
        }
        if (glowing.includes(fish)) {
          halo(fish);
        }
        swimmer(fish);
      }
      bowlSwim(now);
      fingertip();
      if (!sunk) {
        poiAt(tank, rise);
      }
      fly(now);
      splash(now);
      words(now);
      reveal(now);
    },
    guide: (at: Point | null) => {
      finger = at === null ? null : { x: at.x, y: at.y };
    },
    language: (next: Lang) => {
      lang = next;
    },
    reset: () => {
      ripples = [];
      flights = [];
      drops = [];
      floaters = [];
      bowl = [];
      rise = 1;
      finger = null;
    },
    scoop: (fish: readonly Fish[], at: Point, now: number) => {
      flights.push(
        ...fish.map((each, i) => ({
          born: now,
          delay: i * 90,
          from: { x: each.x, y: each.y },
          heading: each.heading,
          kind: each.kind,
        }))
      );
      ripples.push({ born: now, size: POI.ring * 1.6, x: at.x, y: at.y });
      burst(at, now, 10 + fish.length * 6);
      const rare = fish.find((each) => kinds[each.kind].tier !== "common");
      floaters = [
        ...floaters.slice(-2),
        {
          born: now,
          gold: rare !== undefined,
          text:
            rare === undefined
              ? `+${fish.length}`
              : `${kinds[rare.kind].name[lang]}${lang === "ja" ? "！" : "!"}`,
        },
      ];
    },
    under: (at: Point, now: number) => {
      ripples.push({ born: now, size: POI.ring * 1.2, x: at.x, y: at.y });
      floaters = [
        ...floaters.slice(-2),
        { born: now, gold: false, text: UNDER[lang] },
      ];
    },
    tear: (at: Point, now: number) => {
      ripples.push({ born: now, size: POI.ring * 2, x: at.x, y: at.y });
      burst(at, now, 14);
      floaters = [{ born: now, gold: false, text: RIP[lang] }];
    },
  };
};
