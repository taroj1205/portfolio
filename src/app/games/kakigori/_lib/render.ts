import { createAtlas, rasterize } from "../../_lib/atlas";
import type { Lang, Text } from "../../_lib/i18n";
import { docOf } from "../../_lib/svg";
import type { Box, Point, Sprite } from "../../_lib/svg";
import {
  BLOCK_BOX,
  LIP,
  SPRITES,
  backdrop,
  block,
  counter,
  crank,
  flake,
  glassBack,
  glassFront,
  heapSpots,
  moundBody,
  moundPoints,
  shaver,
  snowTile,
} from "./art";
import {
  BLOCK,
  FOOT,
  MOUTH,
  UNIT,
  dangerOf,
  heightOf,
  shaving,
  toWorld,
} from "./pile";
import type { Pile } from "./pile";
import { goals } from "./result";
import { syrups } from "./syrups";
import type { SyrupId } from "./syrups";

interface Floater {
  text: string;
  born: number;
  gold: boolean;
}

interface Chunk {
  heights: number[];
  cut: number;
  landed: boolean;
  side: number;
  lean: number;
  cup: number;
  born: number;
}

interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  born: number;
}

interface Pour {
  syrup: SyrupId;
  born: number;
  image: HTMLCanvasElement | null;
  top: number;
}

const WIDE = 940;
const BELOW = FOOT + 70;
const ABOVE = 400;
const FLOAT = 1300;
const FALL = 1100;
const PUFF = 800;
const SOAK = 1500;
const REVEAL = 600;

const WOBBLE: Text = { en: "Wobble!", ja: "グラッ" };
const CRASH: Text = { en: "Crash!", ja: "ドサッ" };
const DONE: Text = { en: "Done!", ja: "完成！" };
const BEST: Text = { en: "Best", ja: "ベスト" };

const ink = {
  gold: ["#fff6d8", "#ffd27a", "#c9862c"],
  guide: "rgb(255 255 255 / 0.55)",
  line: "#ffffff",
  night: "#1f76d8",
  ring: "#ff5a6e",
  snow: ["#ffffff", "#f1f7fb", "#d5e3ee"],
  stroke: "#0b2340",
  white: ["#ffffff", "#e8f2f6"],
} as const;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;

const trace = (ctx: CanvasRenderingContext2D, points: readonly Point[]) => {
  const at = (i: number) => points[Math.max(0, Math.min(points.length - 1, i))];
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i += 1) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    ctx.bezierCurveTo(
      b.x + (c.x - a.x) / 6,
      b.y + (c.y - a.y) / 6,
      c.x - (d.x - b.x) / 6,
      c.y - (d.y - b.y) / 6,
      c.x,
      c.y
    );
  }

  ctx.closePath();
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
  let scale = 0;
  let base = 0;
  let shown: number[] = [];
  let shownLean = 0;
  let crankTurn = 0;
  let revealed: number | null = null;
  let last = performance.now();
  let floaters: Floater[] = [];
  let puffs: Puff[] = [];
  let chunk: Chunk | null = null;
  let heaped = 0;
  let pour: Pour | null = null;
  let shake = 0;
  let best = 0;
  let lang: Lang = "ja";
  let finger: number | null = null;

  const fit = (pile: Pile, dt: number) => {
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
      scale = 0;
    }

    const span =
      Math.max(pile.shaver, heightOf(pile.cols) + 200) + ABOVE + BELOW;

    const goal = Math.min(height / span, width / WIDE);
    scale =
      scale === 0 || calm ? goal : scale + (goal - scale) * Math.min(1, dt * 3);
    base = height - BELOW * scale;
    atlas.prepare(scale * dpr);
    const side = Math.min(width, height);
    atlas.scenery(
      width,
      height,
      { size: side, x: (width - side) / 2, y: (height - side) / 2 },
      dpr
    );
  };

  const world = () => {
    const jolt = calm ? 0 : shake * Math.sin(performance.now() / 18) * 6;
    ctx.setTransform(
      scale * dpr,
      0,
      0,
      scale * dpr,
      (width / 2 + jolt) * dpr,
      base * dpr
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

    ctx.lineWidth = px * 0.14;
    ctx.strokeStyle = ink.stroke;
    ctx.strokeText(words, x, y);
    ctx.fillStyle = paint;
    ctx.fillText(words, x, y);
  };

  const goalLines = () => {
    const tenths = Math.round((heightOf(shown) / UNIT) * 10);
    const next = goals.find((rank) => rank.least > tenths);

    const lines = [
      ...(next === undefined
        ? []
        : [
            {
              gold: false,
              label: `${next.name[lang]} ${next.least / 10}cm`,
              tenths: next.least,
            },
          ]),
      ...(best > tenths
        ? [
            {
              gold: true,
              label: `${BEST[lang]} ${(best / 10).toFixed(1)}cm`,
              tenths: best,
            },
          ]
        : []),
    ];

    ctx.save();
    ctx.textBaseline = "bottom";
    ctx.lineJoin = "round";

    for (const line of lines) {
      const y = -(line.tenths / 10) * UNIT;
      ctx.setLineDash([22, 16]);
      ctx.lineWidth = Math.max(5, 2.5 / scale);
      ctx.strokeStyle = line.gold ? ink.gold[1] : ink.line;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.moveTo(-LIP - 120, y);
      ctx.lineTo(LIP + 120, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.textAlign = line.gold ? "right" : "left";
      text(
        line.label,
        line.gold ? LIP + 120 : -LIP - 120,
        y - 8,
        Math.max(30, 18 / scale),
        line.gold ? ink.gold : ink.white
      );
    }

    ctx.restore();
  };

  const moundPath = (heights: readonly number[]) => {
    trace(ctx, moundPoints(heights));
  };

  const snowFill = (
    heights: readonly number[],
    danger: number,
    side: number
  ) => {
    const top = -Math.max(20, heightOf(heights));
    moundPath(heights);
    const paint = ctx.createLinearGradient(0, top, 0, 0);

    for (const [i, color] of ink.snow.entries()) {
      paint.addColorStop(i / (ink.snow.length - 1), color);
    }

    ctx.fillStyle = paint;
    ctx.fill();
    ctx.save();
    ctx.clip();
    const tile = atlas.sprite(snowTile);

    if (tile !== null) {
      const pattern = ctx.createPattern(tile, "repeat");

      if (pattern !== null) {
        pattern.setTransform(
          new DOMMatrix().scale(snowTile.box.w / tile.width)
        );
        ctx.globalAlpha = 0.7;
        ctx.fillStyle = pattern;
        ctx.fillRect(-MOUTH / 2 - 10, top - 10, MOUTH + 20, -top + 20);
      }
    }

    const sideways = ctx.createLinearGradient(-MOUTH / 2, 0, MOUTH / 2, 0);
    sideways.addColorStop(0, "rgb(255 255 255 / 0.5)");
    sideways.addColorStop(0.35, "rgb(255 255 255 / 0)");
    sideways.addColorStop(0.7, "rgb(127 166 196 / 0)");
    sideways.addColorStop(1, "rgb(127 166 196 / 0.35)");
    ctx.globalAlpha = 1;
    ctx.fillStyle = sideways;
    ctx.fillRect(-MOUTH / 2 - 10, top - 10, MOUTH + 20, -top + 20);

    if (danger > 0.3) {
      const warn = ctx.createLinearGradient(
        -side * MOUTH * 0.5,
        0,
        side * MOUTH * 0.5,
        0
      );

      warn.addColorStop(0, "rgb(255 74 61 / 0)");
      warn.addColorStop(
        1,
        `rgb(255 74 61 / ${(0.55 * (danger - 0.3)).toFixed(3)})`
      );
      ctx.fillStyle = warn;
      ctx.fillRect(-MOUTH / 2 - 10, top - 10, MOUTH + 20, -top + 20);
    }

    ctx.restore();
  };

  const soak = (now: number) => {
    if (pour === null || pour.image === null) {
      return;
    }

    const t = calm ? 1 : clamp((now - pour.born) / SOAK);
    const reach = pour.top + (-pour.top + 20) * easeOut(t) * 1.1;
    ctx.save();
    ctx.beginPath();
    ctx.rect(-MOUTH / 2 - 20, pour.top - 30, MOUTH + 40, reach - pour.top + 30);
    ctx.clip();
    ctx.drawImage(
      pour.image,
      -MOUTH / 2 - 20,
      pour.top - 30,
      MOUTH + 40,
      -pour.top + 50
    );
    ctx.restore();
  };

  const stream = (now: number) => {
    if (pour === null || calm) {
      return;
    }

    const t = (now - pour.born) / SOAK;

    if (t < 0 || t > 0.8) {
      return;
    }

    const [, mid] = syrups[pour.syrup].colors;
    const fade = t < 0.6 ? 1 : 1 - (t - 0.6) / 0.2;
    ctx.save();
    ctx.globalAlpha = 0.85 * fade;
    ctx.fillStyle = mid;
    const thick = 16 * (1 - t * 0.6);
    ctx.beginPath();
    ctx.roundRect(
      -thick / 2,
      -base / scale - 40,
      thick,
      base / scale + 40 + pour.top,
      thick / 2
    );
    ctx.fill();
    ctx.restore();
  };

  const glints = (now: number) => {
    const points = moundPoints(shown);
    ctx.save();
    ctx.strokeStyle = ink.line;
    ctx.lineCap = "round";

    for (let i = 2; i < points.length - 2; i += 3) {
      const point = points[i];

      if (point.y > -24) {
        continue;
      }

      const twinkle = calm ? 0.6 : (Math.sin(now / 260 + i * 1.7) + 1) / 2;
      const r = 4 + twinkle * 7;
      const y = point.y + 14 + (i % 3) * 10;
      ctx.globalAlpha = 0.25 + twinkle * 0.75;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(point.x - r, y);
      ctx.lineTo(point.x + r, y);
      ctx.moveTo(point.x, y - r);
      ctx.lineTo(point.x, y + r);
      ctx.stroke();
    }

    ctx.restore();
  };

  const mound = (pile: Pile, now: number) => {
    const danger = dangerOf(pile);
    const side = Math.sign(pile.lean) || 1;
    ctx.save();
    ctx.translate(pile.cup.x, 0);
    ctx.rotate(shownLean);
    snowFill(shown, pile.served ? 0 : danger, side);
    glints(now);
    soak(now);
    ctx.restore();
  };

  const glass = (pile: Pile, sprite: Sprite) => {
    ctx.save();
    ctx.translate(pile.cup.x, 0);
    put(sprite);
    ctx.restore();
  };

  const heaps = () => {
    if (heaped === 0) {
      return;
    }

    ctx.save();

    for (const { x, r } of heapSpots(heaped)) {
      const paint = ctx.createLinearGradient(0, FOOT - r, 0, FOOT);
      paint.addColorStop(0, ink.snow[0]);
      paint.addColorStop(1, ink.snow[2]);
      ctx.fillStyle = paint;
      ctx.beginPath();
      ctx.ellipse(x, FOOT - r * 0.35, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const machine = (pile: Pile, dt: number) => {
    crankTurn += shaving(pile) && !calm ? dt * 9 : 0;
    const y = -pile.shaver;
    ctx.save();
    ctx.translate(0, y);
    const left = clamp(pile.left / BLOCK);
    const bitmap = atlas.sprite(block);

    if (bitmap !== null && left > 0) {
      const h = BLOCK_BOX.h * (0.08 + 0.92 * left);
      ctx.drawImage(
        bitmap,
        0,
        bitmap.height * (1 - h / BLOCK_BOX.h),
        bitmap.width,
        bitmap.height * (h / BLOCK_BOX.h),
        BLOCK_BOX.x,
        BLOCK_BOX.y + BLOCK_BOX.h - h,
        BLOCK_BOX.w,
        h
      );
    }

    put(shaver);
    ctx.translate(152, -250);
    ctx.rotate(crankTurn);
    put(crank);
    ctx.restore();
  };

  const guide = (pile: Pile, now: number) => {
    if (pile.toppled || pile.served) {
      return;
    }

    const top = -pile.shaver;
    ctx.save();
    ctx.strokeStyle = ink.guide;
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 18]);
    ctx.lineDashOffset = calm ? 0 : -now / 20;
    ctx.globalAlpha = pile.pouring ? 0.35 : 0.8;
    ctx.beginPath();
    ctx.moveTo(0, top + 10);
    ctx.lineTo(0, FOOT);
    ctx.stroke();
    ctx.restore();
  };

  const target = (pile: Pile, now: number) => {
    const danger = dangerOf(pile);

    if (pile.toppled || pile.served || danger < 0.3) {
      return;
    }

    const side = Math.sign(pile.lean) || 1;
    const h = heightOf(pile.cols);
    const spot = toWorld(pile, -side * Math.min(70, MOUTH * 0.22), h * 0.7);
    const pulse = calm ? 0.5 : (Math.sin(now / 120) + 1) / 2;
    const r = 34 + pulse * 14 + danger * 20;
    ctx.save();
    ctx.globalAlpha = 0.5 + danger * 0.5;
    ctx.strokeStyle = ink.ring;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(spot.x, -spot.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(spot.x, -spot.y, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
    const arrowY = 70;
    const shift = calm ? 0 : pulse * 24 * side;
    ctx.fillStyle = ink.ring;

    for (let i = 0; i < 3; i += 1) {
      const x = pile.cup.x + side * (LIP + 20 + i * 46) + shift;
      ctx.globalAlpha = (0.4 + danger * 0.6) * (1 - i * 0.25);
      ctx.beginPath();
      ctx.moveTo(x + side * 36, arrowY);
      ctx.lineTo(x - side * 12, arrowY - 36);
      ctx.lineTo(x - side * 12, arrowY + 36);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  };

  const grains = (pile: Pile) => {
    const bitmap = atlas.sprite(flake);

    if (bitmap === null) {
      return;
    }

    for (const grain of pile.grains) {
      ctx.drawImage(bitmap, grain.x - 9, -grain.y - 9, 18, 18);
    }
  };

  const burst = (at: Point, now: number, count: number) => {
    if (calm) {
      return;
    }

    for (let i = 0; i < count; i += 1) {
      const angle = Math.PI + Math.random() * Math.PI;
      const speed = 160 + Math.random() * 420;
      puffs.push({
        born: now,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        x: at.x,
        y: at.y,
      });
    }

    puffs = puffs.slice(-160);
  };

  const soakIn = async (pending: Pour, box: Box, body: string) => {
    const k = scale * dpr;
    pending.image = await rasterize(
      docOf(box, box.w * k, box.h * k, body),
      box.w * k,
      box.h * k
    );
  };

  const tumble = (now: number) => {
    if (chunk === null) {
      return;
    }

    const t = (now - chunk.born) / FALL;

    if (t >= 1) {
      chunk = null;

      return;
    }

    if (!chunk.landed && t > 0.7) {
      chunk.landed = true;
      burst({ x: chunk.cup + chunk.side * (LIP + 120), y: FOOT - 20 }, now, 40);
    }

    const drop = 1400 * t * t;
    ctx.save();
    ctx.globalAlpha = t > 0.8 ? (1 - t) / 0.2 : 1;
    ctx.translate(chunk.cup + chunk.side * 260 * t, drop);
    ctx.rotate(chunk.lean + chunk.side * 2.2 * t * t);
    ctx.translate(0, -chunk.cut);
    snowFill(chunk.heights, 0, chunk.side);
    ctx.restore();
  };

  const flurry = (now: number) => {
    puffs = puffs.filter((puff) => now - puff.born < PUFF);
    const bitmap = atlas.sprite(flake);

    if (bitmap === null) {
      return;
    }

    ctx.save();

    for (const puff of puffs) {
      const t = (now - puff.born) / 1000;
      ctx.globalAlpha = 1 - (now - puff.born) / PUFF;
      ctx.drawImage(
        bitmap,
        puff.x + puff.vx * t - 11,
        puff.y + puff.vy * t + 1600 * t * t - 11,
        22,
        22
      );
    }

    ctx.restore();
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
        Math.min(72, Math.max(40, width * 0.12)) * (floater.gold ? 1.1 : 1);

      const pop = calm ? 1 : 0.7 + 0.3 * easeOut(t * 5);
      ctx.globalAlpha = t < 0.75 ? 1 : 1 - (t - 0.75) / 0.25;
      const y = height * 0.3 + i * px * 1.1 - (calm ? 0 : easeOut(t) * 40);
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

  const say = (message: string, gold: boolean, now: number) => {
    floaters = [...floaters.slice(-1), { born: now, gold, text: message }];
  };

  const fingertip = () => {
    if (finger === null) {
      return;
    }

    ctx.save();
    ctx.fillStyle = "rgb(255 255 255 / 0.35)";
    ctx.strokeStyle = "rgb(255 255 255 / 0.9)";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(finger, FOOT + 36, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
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

  const ease = (pile: Pile, dt: number) => {
    if (shown.length !== pile.cols.length) {
      shown = pile.cols.map(() => 0);
    }

    const k = calm ? 1 : Math.min(1, dt * 16);
    shown = shown.map((h, i) => h + (pile.cols[i] - h) * k);
    const lean = pour === null ? pile.lean : 0;
    shownLean +=
      (lean - shownLean) * (pour === null || calm ? 1 : Math.min(1, dt * 4));
    shake = Math.max(0, shake - dt * 2.5);
  };

  return {
    best: (tenths: number) => {
      best = tenths;
    },
    draw: (pile: Pile, now: number) => {
      const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
      last = now;
      fit(pile, dt);
      ease(pile, dt);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      scenery();
      world();
      put(counter);
      heaps();
      glass(pile, glassBack);
      mound(pile, now);
      glass(pile, glassFront);
      guide(pile, now);
      machine(pile, dt);
      goalLines();
      grains(pile);
      stream(now);
      target(pile, now);
      tumble(now);
      flurry(now);
      fingertip();
      words(now);
      reveal(now);
    },
    goal: (name: Text, now: number) => {
      say(lang === "ja" ? `${name.ja}！` : `${name.en}!`, true, now);
    },
    guide: (x: number | null) => {
      finger = x;
    },
    language: (next: Lang) => {
      lang = next;
    },
    reset: () => {
      floaters = [];
      puffs = [];
      chunk = null;
      heaped = 0;
      pour = null;
      shake = 0;
      shownLean = 0;
      shown = shown.map(() => 0);
      finger = null;
    },
    serve: (pile: Pile, syrup: SyrupId, now: number, after = 0) => {
      const top = -Math.max(20, heightOf(pile.cols));
      const current: Pour = { born: now + after, image: null, syrup, top };
      pour = current;

      if (!pile.toppled) {
        say(DONE[lang], true, now);
      }

      const box = {
        h: -top + 50,
        w: MOUTH + 40,
        x: -MOUTH / 2 - 20,
        y: top - 30,
      };

      void soakIn(current, box, moundBody(pile.cols, syrup, "sv"));
    },
    slump: (now: number) => {
      say(WOBBLE[lang], false, now);
      shake = Math.max(shake, 0.4);
    },
    spill: (at: Point, now: number) => {
      burst({ x: at.x, y: -at.y }, now, 3);
    },
    topple: (
      outcome: { chunk: number[]; cut: number; side: number; lean: number },
      pile: Pile,
      now: number
    ) => {
      chunk = {
        born: now,
        cup: pile.cup.x,
        cut: outcome.cut,
        heights: outcome.chunk,
        landed: false,
        lean: outcome.lean,
        side: outcome.side,
      };
      shownLean = 0;
      shown = [...pile.cols];
      heaped = outcome.side;
      shake = 1;
      say(CRASH[lang], false, now);
    },
    worldX: (px: number) => (scale > 0 ? (px - width / 2) / scale : 0),
  };
};
