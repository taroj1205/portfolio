import { KINDS, seeded } from "./brush";
import type { Bleed, Strokes } from "./brush";
import { clamp01 } from "./stroke";

const SPREAD = 900;
const SPRITE = 96;
const INK = [14, 12, 18];
const DRY = [92, 88, 96];

const makeCanvas = (side: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, side);
  canvas.height = Math.max(1, side);

  return canvas;
};

const paintGrain = (roll: () => number) => {
  const canvas = makeCanvas(128);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvas;
  }

  const image = ctx.createImageData(128, 128);

  for (let i = 0; i < image.data.length; i += 4) {
    image.data[i] = 120;
    image.data[i + 1] = 98;
    image.data[i + 2] = 64;
    image.data[i + 3] = roll() ** 3 * 46;
  }

  ctx.putImageData(image, 0, 0);

  return canvas;
};

const paintPaper = (side: number) => {
  const canvas = makeCanvas(side);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvas;
  }

  const roll = seeded(1021);
  const base = ctx.createLinearGradient(0, 0, side, side);
  base.addColorStop(0, "#f7f0e1");
  base.addColorStop(1, "#ece1c9");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, side, side);
  const grain = ctx.createPattern(paintGrain(roll), "repeat");

  if (grain) {
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, side, side);
  }

  ctx.lineCap = "round";

  for (let i = 0; i < 340; i += 1) {
    const x = roll() * side;
    const y = roll() * side;
    const angle = roll() * Math.PI * 2;
    const reach = side * (0.02 + roll() * 0.09);
    const bend = (roll() - 0.5) * reach;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(
      x + Math.cos(angle) * reach * 0.5 - Math.sin(angle) * bend,
      y + Math.sin(angle) * reach * 0.5 + Math.cos(angle) * bend,
      x + Math.cos(angle) * reach,
      y + Math.sin(angle) * reach
    );
    ctx.lineWidth = side * (0.0007 + roll() * 0.0016);
    ctx.strokeStyle =
      roll() > 0.35
        ? `rgb(150 124 84 / ${0.05 + roll() * 0.1})`
        : `rgb(255 255 255 / ${0.3 + roll() * 0.35})`;
    ctx.stroke();
  }

  for (let i = 0; i < 54; i += 1) {
    const corner = i % 2 === 0 ? 0 : 1;
    const spread = roll() ** 2 * 0.34;
    const along = roll();
    const x = side * (corner === 0 ? spread : 1 - spread * along);
    const y = side * (corner === 0 ? spread * along : 1 - spread);
    const r = side * (0.003 + roll() ** 2 * 0.014);
    ctx.beginPath();

    for (let k = 0; k < 5; k += 1) {
      const a = (k / 5) * Math.PI * 2 + roll() * 0.9;
      const d = r * (0.5 + roll() * 0.7);
      ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    }

    ctx.closePath();
    ctx.fillStyle = `rgb(${196 + roll() * 40} ${154 + roll() * 34} ${70 + roll() * 30} / ${0.55 + roll() * 0.4})`;
    ctx.fill();
  }

  const edge = ctx.createRadialGradient(
    side / 2,
    side / 2,
    side * 0.38,
    side / 2,
    side / 2,
    side * 0.75
  );

  edge.addColorStop(0, "rgb(120 90 50 / 0)");
  edge.addColorStop(1, "rgb(120 90 50 / 0.16)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, side, side);

  return canvas;
};

const paintBleed = (seed: number) => {
  const canvas = makeCanvas(SPRITE);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvas;
  }

  const roll = seeded(seed);
  const phases = Array.from({ length: 4 }, () => roll() * Math.PI * 2);
  const image = ctx.createImageData(SPRITE, SPRITE);
  const c = SPRITE / 2;

  for (let y = 0; y < SPRITE; y += 1) {
    for (let x = 0; x < SPRITE; x += 1) {
      const dx = x + 0.5 - c;
      const dy = y + 0.5 - c;
      const angle = Math.atan2(dy, dx);
      const d = Math.hypot(dx, dy) / c;

      const edge =
        1 +
        0.12 * Math.sin(angle * 5 + (phases[0] ?? 0)) +
        0.07 * Math.sin(angle * 11 + (phases[1] ?? 0) + d * 4) +
        0.05 * Math.sin(angle * 23 + (phases[2] ?? 0));

      const fall = clamp01((edge - d) / (edge * 0.55));

      const fibre =
        0.7 + 0.3 * Math.sin(angle * 37 + (phases[3] ?? 0) + d * 19);

      const i = (y * SPRITE + x) * 4;
      image.data[i] = 46;
      image.data[i + 1] = 50;
      image.data[i + 2] = 68;
      image.data[i + 3] = fall * fall * fibre * (0.75 + roll() * 0.25) * 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  return canvas;
};

const toneOf = (tone: number) =>
  `rgb(${INK.map((from, i) => Math.round(from + ((DRY[i] ?? from) - from) * tone)).join(" ")})`;

export const createRenderer = (canvas: HTMLCanvasElement, calm: boolean) => {
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas 2D is not available");
  }

  const ctx = context;
  const sprites = Array.from({ length: KINDS }, (_, i) => paintBleed(i + 3));
  let side = 0;
  let paper = makeCanvas(1);
  let ink = makeCanvas(1);
  let wash = makeCanvas(1);
  let marks: Strokes["marks"] = [];
  let bleeds: Bleed[] = [];
  let drawn = 0;
  let settled = true;
  let dirty = true;
  let alpha = 1;

  const fit = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const next = Math.round(canvas.clientWidth * dpr);

    if (next === side || next === 0) {
      return;
    }

    side = next;
    canvas.width = side;
    canvas.height = side;
    paper = paintPaper(side);
    ink = makeCanvas(side);
    wash = makeCanvas(side);
    drawn = 0;
    settled = false;
    dirty = true;
  };

  const drawMarks = () => {
    const pen = ink.getContext("2d");

    if (!pen || drawn >= marks.length) {
      return;
    }

    pen.globalCompositeOperation = "darken";
    pen.lineCap = "round";

    for (let i = drawn; i < marks.length; i += 1) {
      const mark = marks[i];
      pen.beginPath();
      pen.moveTo(mark.x0 * side, mark.y0 * side);
      pen.lineTo(mark.x1 * side, mark.y1 * side);
      pen.lineWidth = Math.max(0.5, mark.size * side);
      pen.strokeStyle = toneOf(mark.tone);
      pen.stroke();
    }

    drawn = marks.length;
    dirty = true;
  };

  const drawBleeds = (now: number) => {
    const pen = wash.getContext("2d");

    if (!pen || settled) {
      return;
    }

    pen.clearRect(0, 0, side, side);
    let growing = false;

    for (const bleed of bleeds) {
      const age = calm ? 1 : clamp01((now - bleed.born) / SPREAD);
      growing ||= age < 1;
      const grow = 1 - (1 - age) ** 3;
      const size = bleed.size * side * (0.55 + 0.45 * grow);
      pen.save();
      pen.translate(bleed.x * side, bleed.y * side);
      pen.rotate(bleed.turn);
      pen.globalAlpha = bleed.alpha * (0.6 + 0.4 * grow);
      pen.drawImage(sprites[bleed.kind], -size / 2, -size / 2, size, size);
      pen.restore();
    }

    settled = !growing;
    dirty = true;
  };

  return {
    add: (strokes: Strokes) => {
      for (const mark of strokes.marks) {
        marks.push(mark);
      }

      for (const bleed of strokes.bleeds) {
        bleeds.push(bleed);
        settled = false;
      }
    },
    clear: () => {
      marks = [];
      bleeds = [];
      drawn = 0;
      alpha = 1;
      ink.getContext("2d")?.clearRect(0, 0, side, side);
      wash.getContext("2d")?.clearRect(0, 0, side, side);
      dirty = true;
    },
    draw: (now: number) => {
      fit();
      drawMarks();
      drawBleeds(now);

      if (!dirty) {
        return;
      }

      dirty = false;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(paper, 0, 0);
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = alpha;
      ctx.drawImage(wash, 0, 0);
      ctx.drawImage(ink, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    },
    fade: (next: number) => {
      if (next !== alpha) {
        alpha = next;
        dirty = true;
      }
    },
  };
};
