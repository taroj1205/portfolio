import { createAtlas } from "../../_lib/atlas";
import type { Lang, Text } from "../../_lib/i18n";
import type { Point, Sprite } from "../../_lib/svg";
import {
  BARREL,
  GUN,
  SCENE,
  SPRITES,
  STALL,
  backdrop,
  cork,
  frameFor,
  gun,
  counterOf,
  prizeSprites,
} from "./art";
import { LID, SHELVES, kinds } from "./prizes";
import type { PrizeId } from "./prizes";
import { FLIGHT, faceOf, powerOf, spotOf, squeeze } from "./stall";
import type { Outcome, Prize, Stall } from "./stall";

interface Floater {
  text: string;
  born: number;
  gold: boolean;
}

interface Pop {
  text: string;
  x: number;
  y: number;
  born: number;
}

interface Flash {
  x: number;
  y: number;
  born: number;
  strong: boolean;
}

interface Flight {
  from: Point;
  to: Point;
  born: number;
}

interface Shown {
  x: number;
  z: number;
  yaw: number;
  jolt: number;
  fell: number | null;
}

export interface Sights {
  aim: Point | null;
  held: number | null;
  sway: Point;
}

const FLOAT = 1300;
const POP = 1100;
const FLASH = 380;
const DROP = 900;
const REVEAL = 600;
const LINE_STAGGER = 140;
const LINE_POP = 420;
const RING = 58;
const CORNER = 44;

const WONT: Text = { en: "Won't budge!", ja: "びくともしない" };
const CORNERS: Text = { en: "Hit a top corner!", ja: "上の角を狙え！" };
const WOBBLE: Text = { en: "Wobble!", ja: "グラッ" };
const MISS: Text = { en: "Miss", ja: "ハズレ" };
const CLEAN: Text = { en: "Cleaned out!", ja: "総取り！" };

const ink = {
  dark: "#1b0a12",
  gold: ["#fff6d8", "#ffd27a", "#c9862c"],
  night: "#120c2a",
  ring: "#ffffff",
  shadow: "rgb(0 0 0 / 0.35)",
  stroke: "#1b0a12",
  white: ["#ffffff", "#ffe9ef"],
} as const;

const [pale, gold] = ink.gold;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;

const gotText = (id: PrizeId, lang: Lang) =>
  lang === "ja"
    ? `${kinds[id].name.ja}ゲット！`
    : `Got the ${kinds[id].name.en}!`;

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
  let frame = { size: 1, x: 0, y: 0 };
  let k = 1;
  let revealed: number | null = null;
  let floaters: Floater[] = [];
  let pops: Pop[] = [];
  let flashes: Flash[] = [];
  let flights: Flight[] = [];
  let shown = new Map<PrizeId, Shown>();
  let kick = 0;
  let shake = 0;
  let haul: { got: readonly PrizeId[]; born: number } | null = null;
  let warned = false;
  let lang: Lang = "ja";
  let last = performance.now();
  let swing = 0;

  const fit = () => {
    const nextDpr = Math.min(window.devicePixelRatio || 1, 2);

    if (
      canvas.clientWidth !== width ||
      canvas.clientHeight !== height ||
      nextDpr !== dpr
    ) {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      dpr = nextDpr;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
    }

    frame = frameFor(width, height);
    k = frame.size / SCENE;
    atlas.prepare(k * dpr);
    atlas.scenery(width, height, frame, dpr);
  };

  const world = (now: number) => {
    const jolt = calm ? 0 : shake * Math.sin(now / 16) * 5;
    ctx.setTransform(
      k * dpr,
      0,
      0,
      k * dpr,
      (frame.x + jolt) * dpr,
      frame.y * dpr
    );
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
      ctx.drawImage(layer.image, 0, 0, width, height);
    }
  };

  const text = (
    words: string,
    x: number,
    y: number,
    px: number,
    fill: readonly string[]
  ) => {
    ctx.font = `700 ${px}px ${font}`;
    const paint = ctx.createLinearGradient(0, y - px / 2, 0, y + px / 2);

    for (const [i, color] of fill.entries()) {
      paint.addColorStop(i / Math.max(1, fill.length - 1), color);
    }

    ctx.lineWidth = px * 0.16;
    ctx.strokeStyle = ink.stroke;
    ctx.strokeText(words, x, y);
    ctx.fillStyle = paint;
    ctx.fillText(words, x, y);
  };

  const poseOf = (prize: Prize, dt: number): Shown => {
    const before = shown.get(prize.id) ?? {
      fell: null,
      jolt: 0,
      x: prize.x,
      yaw: prize.yaw,
      z: prize.z,
    };

    const ease = calm ? 1 : Math.min(1, dt * 12);

    const next = {
      ...before,
      jolt: Math.max(0, before.jolt - dt * 3.5),
      x: before.x + (prize.x - before.x) * ease,
      yaw: before.yaw + (prize.yaw - before.yaw) * ease,
      z: before.z + (prize.z - before.z) * ease,
    };

    shown.set(prize.id, next);

    return next;
  };

  const side = (id: PrizeId, front: number, yaw: number) => {
    const { box, h, d } = kinds[id];
    const wide = d * Math.abs(Math.sin(yaw));

    if (box === null || wide < 1) {
      return;
    }

    const edge = yaw > 0 ? -front / 2 : front / 2;
    const out = yaw > 0 ? -wide : wide;
    const lift = wide * LID;
    ctx.fillStyle = box.side;
    ctx.beginPath();
    ctx.moveTo(edge, 0);
    ctx.lineTo(edge, -h);
    ctx.lineTo(edge + out, -h - lift);
    ctx.lineTo(edge + out, -lift);
    ctx.closePath();
    ctx.fill();
  };

  const body = (prize: Prize, pose: Shown) => {
    const kind = kinds[prize.id];
    const turned = Math.abs(Math.cos(pose.yaw));
    const tilt = Math.min(1.1, Math.abs(prize.pitch));

    if (kind.box === null) {
      ctx.scale(squeeze(pose.yaw), Math.cos(tilt));
      put(prizeSprites[prize.id]);

      return;
    }

    const front = kind.w * turned;

    const shift =
      Math.sign(pose.yaw) * kind.d * Math.abs(Math.sin(pose.yaw)) * 0.5;

    ctx.scale(1, Math.cos(tilt));
    ctx.translate(shift, 0);
    side(prize.id, front, pose.yaw);
    ctx.scale(turned, 1);
    put(prizeSprites[prize.id]);
  };

  const corners = (prize: Prize, now: number) => {
    if (kinds[prize.id].size !== "big" || prize.down !== null) {
      return;
    }

    const face = faceOf(prize);
    const pulse = calm ? 0.6 : (Math.sin(now / 180) + 1) / 2;
    const size = CORNER + pulse * 10;
    ctx.save();
    ctx.strokeStyle = gold;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.globalAlpha = 0.45 + pulse * 0.55;

    for (const way of [-1, 1]) {
      const x = spotOf(prize, way, 1).x + way * 8;
      const y = face.top - 8;
      ctx.beginPath();
      ctx.moveTo(x - way * size, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + size);
      ctx.stroke();
    }

    ctx.restore();
  };

  const prizeAt = (prize: Prize, now: number, dt: number) => {
    const pose = poseOf(prize, dt);
    const kind = kinds[prize.id];
    const face = faceOf({ ...prize, x: pose.x, yaw: pose.yaw, z: pose.z });
    const fallen = pose.fell === null ? 0 : (now - pose.fell) / DROP;

    if (fallen >= 1) {
      return;
    }

    const jolt = calm ? 0 : pose.jolt * Math.sin(now / 14) * 7;
    const drop = 1200 * fallen * fallen;

    ctx.save();

    if (pose.fell !== null) {
      ctx.beginPath();
      ctx.rect(
        STALL.left - 60,
        0,
        STALL.right - STALL.left + 120,
        SHELVES[kind.row]
      );
      ctx.clip();
    }

    ctx.fillStyle = ink.shadow;
    ctx.globalAlpha =
      Math.cos(Math.min(1.4, Math.abs(prize.pitch))) * (1 - fallen);
    ctx.beginPath();
    ctx.ellipse(face.x, face.floor + 2, face.half * 1.1, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.translate(face.x + jolt, face.bottom + drop);
    ctx.scale(face.scale, face.scale);
    body(prize, pose);
    ctx.restore();
  };

  const prizes = (stall: Stall, now: number, dt: number) => {
    const order = stall.prizes.toSorted(
      (a, b) => kinds[b.id].row - kinds[a.id].row
    );

    for (const prize of order) {
      prizeAt(prize, now, dt);
    }

    for (const prize of order) {
      corners(prize, now);
    }
  };

  const muzzle = (aim: Point | null) => {
    const target = aim ?? { x: GUN.x, y: 0 };

    const angle = Math.max(
      -0.6,
      Math.min(0.6, Math.atan2(target.x - GUN.x, GUN.y - target.y))
    );

    return {
      angle,
      tip: {
        x: GUN.x + Math.sin(angle) * (BARREL - kick),
        y: GUN.y - Math.cos(angle) * (BARREL - kick),
      },
    };
  };

  const rifle = (aim: Point | null, dt: number) => {
    const goal = muzzle(aim).angle;
    swing += (goal - swing) * (calm ? 1 : Math.min(1, dt * 10));
    const lowered = haul === null ? 0 : 400;
    ctx.save();
    ctx.translate(GUN.x, GUN.y + kick + lowered);
    ctx.rotate(swing);
    put(gun);
    ctx.restore();
  };

  const sights = (view: Sights, now: number) => {
    if (view.aim === null || haul !== null) {
      return;
    }

    const x = view.aim.x + view.sway.x;
    const y = view.aim.y + view.sway.y;
    const charging = view.held !== null;
    const power = charging ? powerOf(view.held ?? 0) : 0;
    const full = power >= 0.999;
    const pulse = calm ? 0.5 : (Math.sin(now / 90) + 1) / 2;
    const r = RING * (charging ? 1 - 0.18 * (power - 0.3) : 1.1);
    ctx.save();
    ctx.lineCap = "round";
    ctx.globalAlpha = charging ? 1 : 0.7;
    ctx.strokeStyle = ink.stroke;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = ink.ring;
    ctx.lineWidth = 6;
    ctx.stroke();

    for (let i = 0; i < 4; i += 1) {
      const a = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * (r - 18), y + Math.sin(a) * (r - 18));
      ctx.lineTo(x + Math.cos(a) * (r + 18), y + Math.sin(a) * (r + 18));
      ctx.stroke();
    }

    ctx.fillStyle = full ? gold : ink.ring;
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, Math.PI * 2);
    ctx.fill();

    if (charging) {
      ctx.strokeStyle = full ? gold : pale;
      ctx.lineWidth = full ? 12 + pulse * 6 : 12;
      ctx.beginPath();
      ctx.arc(
        x,
        y,
        r + 24,
        -Math.PI / 2,
        -Math.PI / 2 + ((power - 0.3) / 0.7) * Math.PI * 2
      );
      ctx.stroke();
    }

    ctx.restore();
  };

  const corks = (now: number) => {
    flights = flights.filter((flight) => now - flight.born < FLIGHT * 1000);

    for (const flight of flights) {
      const t = clamp((now - flight.born) / (FLIGHT * 1000));
      const x = flight.from.x + (flight.to.x - flight.from.x) * t;

      const y =
        flight.from.y +
        (flight.to.y - flight.from.y) * t -
        Math.sin(t * Math.PI) * 40;

      const size = 1.8 - t * 1.1;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size, size);
      ctx.rotate(t * 6);
      put(cork);
      ctx.restore();
    }
  };

  const bursts = (now: number) => {
    flashes = flashes.filter((flash) => now - flash.born < FLASH);
    ctx.save();
    ctx.lineCap = "round";

    for (const flash of flashes) {
      const t = (now - flash.born) / FLASH;
      const reach = (flash.strong ? 90 : 60) * easeOut(t);
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = flash.strong ? gold : ink.ring;
      ctx.lineWidth = 8 * (1 - t) + 2;

      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2 + 0.3;
        ctx.beginPath();
        ctx.moveTo(
          flash.x + Math.cos(a) * reach * 0.4,
          flash.y + Math.sin(a) * reach * 0.4
        );
        ctx.lineTo(
          flash.x + Math.cos(a) * reach,
          flash.y + Math.sin(a) * reach
        );
        ctx.stroke();
      }
    }

    ctx.restore();
  };

  const points = (now: number) => {
    pops = pops.filter((pop) => now - pop.born < POP);
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    for (const pop of pops) {
      const t = (now - pop.born) / POP;
      ctx.globalAlpha = t < 0.7 ? 1 : 1 - (t - 0.7) / 0.3;
      const scale = calm ? 1 : 0.6 + 0.4 * easeOut(t * 4);
      text(
        pop.text,
        pop.x,
        pop.y - (calm ? 0 : easeOut(t) * 90),
        64 * scale,
        ink.gold
      );
    }

    ctx.restore();
  };

  const lined = (now: number) => {
    if (haul === null) {
      return;
    }

    for (const [i, spot] of counterOf(haul.got).entries()) {
      const t = clamp((now - haul.born - i * LINE_STAGGER) / LINE_POP);

      if (t <= 0) {
        continue;
      }

      const pop = calm ? 1 : easeOut(t) * (1 + 0.15 * Math.sin(t * Math.PI));
      ctx.save();
      ctx.fillStyle = ink.shadow;
      ctx.beginPath();
      ctx.ellipse(
        spot.x,
        spot.y + 2,
        kinds[spot.id].w * spot.scale * 0.55,
        8,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.translate(spot.x, spot.y);
      ctx.scale(spot.scale * pop, spot.scale * pop);
      put(prizeSprites[spot.id]);
      ctx.restore();
    }
  };

  const words = (now: number) => {
    floaters = floaters.filter((floater) => now - floater.born < FLOAT);
    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";

    for (const [i, floater] of floaters.entries()) {
      const t = (now - floater.born) / FLOAT;

      const px =
        Math.min(64, Math.max(34, width * 0.1)) * (floater.gold ? 1.1 : 1);

      const pop = calm ? 1 : 0.7 + 0.3 * easeOut(t * 5);
      ctx.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      const y = height * 0.2 + i * px * 1.15 - (calm ? 0 : easeOut(t) * 30);
      text(
        floater.text,
        width / 2,
        y,
        px * pop,
        floater.gold ? ink.gold : ink.white
      );
    }

    ctx.restore();
  };

  const say = (message: string, shine: boolean, now: number) => {
    floaters = [
      ...floaters.slice(-1),
      { born: now, gold: shine, text: message },
    ];
  };

  const reveal = (now: number) => {
    if (revealed === null && atlas.ready()) {
      revealed = now;
    }

    const t = revealed === null ? 0 : clamp((now - revealed) / REVEAL);

    if (t < 1) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = calm && revealed !== null ? 0 : 1 - easeOut(t);
      ctx.fillStyle = ink.night;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;
    }
  };

  const jolt = (id: PrizeId, size: number) => {
    const pose = shown.get(id);

    if (pose !== undefined) {
      shown.set(id, { ...pose, jolt: Math.max(pose.jolt, size) });
    }
  };

  const struck = (outcome: Extract<Outcome, { type: "hit" }>, now: number) => {
    flashes.push({
      born: now,
      strong: outcome.corner,
      x: outcome.x,
      y: outcome.y,
    });
    jolt(outcome.id, 0.2 + outcome.force * (outcome.budged ? 1 : 0.6));

    if (!outcome.budged && kinds[outcome.id].size === "big") {
      say(warned ? WONT[lang] : CORNERS[lang], false, now);
      warned = true;
    } else if (outcome.corner) {
      say(WOBBLE[lang], false, now);
    }
  };

  return {
    draw: (stall: Stall, view: Sights, now: number) => {
      const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
      last = now;
      fit();
      kick = Math.max(0, kick - dt * 160);
      shake = Math.max(0, shake - dt * 3);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      scenery();
      world(now);
      prizes(stall, now, dt);
      lined(now);
      bursts(now);
      corks(now);
      rifle(view.aim, dt);
      sights(view, now);
      points(now);
      words(now);
      reveal(now);
    },
    finish: (got: readonly PrizeId[], perfect: boolean, now: number) => {
      haul = { born: now + 500, got };

      if (perfect) {
        say(CLEAN[lang], true, now);
      }
    },
    fire: (to: Point, now: number) => {
      flights.push({ born: now, from: muzzle(to).tip, to });
      kick = 34;
    },
    language: (next: Lang) => {
      lang = next;
    },
    outcome: (outcome: Outcome, now: number) => {
      if (outcome.type === "hit") {
        struck(outcome, now);
      } else if (outcome.type === "miss") {
        flashes.push({ born: now, strong: false, x: outcome.x, y: outcome.y });
        say(MISS[lang], false, now);
      } else {
        const pose = shown.get(outcome.id);

        if (pose !== undefined) {
          shown.set(outcome.id, { ...pose, fell: now });
        }

        const { x, row, h } = kinds[outcome.id];
        pops.push({
          born: now,
          text: `+${kinds[outcome.id].points}`,
          x: pose?.x ?? x,
          y: SHELVES[row] - h,
        });
        say(gotText(outcome.id, lang), true, now);
        shake = kinds[outcome.id].size === "big" ? 1 : 0.4;
      }
    },
    reset: () => {
      floaters = [];
      pops = [];
      flashes = [];
      flights = [];
      shown = new Map();
      haul = null;
      shake = 0;
      kick = 0;
    },
    sceneOf: (px: number, py: number) => ({
      x: (px - frame.x) / k,
      y: (py - frame.y) / k,
    }),
    unit: () => k,
  };
};
