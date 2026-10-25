import {
  blur,
  curve,
  docOf,
  ellipse,
  linear,
  n,
  path,
  radial,
  seeded,
  shade,
} from "../../_lib/svg";
import type { Frame, Point, Sprite } from "../../_lib/svg";
import { FOOT, MOUTH } from "./pile";
import { RAINBOW, syrups } from "./syrups";
import type { SyrupId } from "./syrups";

export const SCENE = 1000;
export const ORIGIN = { x: 500, y: 640 } as const;
export const LIP = 178;

const ink = {
  azuki: "#5a1620",
  bamboo: "#c9a25a",
  cloud: "#ffffff",
  cloudShade: "#c9d8ea",
  eave: "#3b2417",
  glass: "#eaf6ff",
  rim: "#7cc4e8",
  wave: "#2d6fd0",
  red: "#d8262e",
  snow: "#ffffff",
  snowShade: "#d5e3ee",
  steel: "#4a5560",
} as const;

const CLUMP_STOPS = [
  [0, "#ffffff", 0.55],
  [0.5, "#ffffff", 0.22],
  [0.8, "#a8c4da", 0.14],
  [1, "#a8c4da", 0],
] as const;

const FOCUS = [-0.32, -0.38] as const;
const FLAT = 0.72;

export interface Clump {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

const hash = (a: number, b: number) => {
  const wave = Math.sin(a * 127.1 + b * 311.7) * 43_758.5453;

  return wave - Math.floor(wave);
};

const clumpShade = (id: string) => radial(id, [0, 0, 1], CLUMP_STOPS, FOCUS);

const blob = (id: string, { x, y, rx, ry }: Clump) =>
  `<circle r="1" transform="translate(${n(x)} ${n(y)}) scale(${n(rx)} ${n(ry)})" fill="url(#${id})"/>`;

const bowlIce = () => {
  const out: string[] = [];

  for (let row = 0; row < 6; row += 1) {
    for (let col = -9; col <= 9; col += 1) {
      const x = (col + (row % 2) * 0.5) * 20 + (hash(row, col) - 0.5) * 10;
      const y = 6 + row * 18 + hash(col, row) * 8;
      const r = 11 + hash(row + 40, col) * 7;
      out.push(blob("gb-clump", { rx: r, ry: r * FLAT, x, y }));
    }
  }

  return out.join("");
};

const BOWL = `M${-LIP} 0C${-LIP} 70 -92 118 -42 120L42 120C92 118 ${LIP} 70 ${LIP} 0Z`;
const INSIDE = `M${-LIP + 8} 0C${-LIP + 8} 62 -88 108 -40 110L40 110C88 108 ${LIP - 8} 62 ${LIP - 8} 0Z`;

export const glassBack: Sprite = {
  body: [
    "<defs>",
    linear(
      "gb-ice",
      [0, 0, 0, 120],
      [
        [0, "#ffffff"],
        [1, "#cddbe6"],
      ]
    ),
    linear(
      "gb-wall",
      [-LIP, 0, LIP, 0],
      [
        [0, "#9fd3ee", 0.5],
        [0.5, "#e6f4fb", 0.2],
        [1, "#7cbfe2", 0.55],
      ]
    ),
    blur("gb-drop", 10),
    clumpShade("gb-clump"),
    `<clipPath id="gb-inside"><path d="${INSIDE}"/></clipPath>`,
    "</defs>",
    ellipse(
      14,
      FOOT + 6,
      160,
      18,
      `fill="#1b2a3a" fill-opacity="0.35" filter="url(#gb-drop)"`
    ),
    path(BOWL, `fill="url(#gb-wall)"`),
    path(INSIDE, `fill="url(#gb-ice)"`),
    `<g clip-path="url(#gb-inside)">${bowlIce()}</g>`,
  ].join(""),
  box: { h: FOOT + 40, w: LIP * 2 + 40, x: -LIP - 20, y: -10 },
};

const scallops = () => {
  const parts = [`M${-LIP - 4} 0`];
  const count = 18;
  const step = ((LIP + 4) * 2) / count;

  for (let i = 0; i < count; i += 1) {
    const x = -LIP - 4 + step * (i + 1);
    parts.push(`Q${n(x - step / 2)} ${i % 2 === 0 ? -9 : 7} ${n(x)} 0`);
  }

  return parts.join("");
};

export const glassFront: Sprite = {
  body: [
    "<defs>",
    linear(
      "gf-sheen",
      [-LIP, 0, LIP, 0],
      [
        [0, "#ffffff", 0.4],
        [0.18, "#ffffff", 0.06],
        [0.75, "#ffffff", 0.02],
        [0.92, "#ffffff", 0.32],
        [1, "#ffffff", 0.1],
      ]
    ),
    linear(
      "gf-stem",
      [-30, 0, 30, 0],
      [
        [0, "#b7e0f4", 0.85],
        [0.5, "#ffffff", 0.95],
        [1, "#8cc9e8", 0.85],
      ]
    ),
    radial(
      "gf-foot",
      [0, FOOT, 140],
      [
        [0, "#ffffff", 0.9],
        [1, "#9ccfe9", 0.65],
      ]
    ),
    "</defs>",
    path(
      BOWL,
      `fill="url(#gf-sheen)" stroke="${ink.rim}" stroke-opacity="0.65" stroke-width="3"`
    ),
    path(
      `M${-LIP + 26} 34C-110 78 -60 98 0 100C60 98 110 78 ${LIP - 26} 34`,
      `fill="none" stroke="${ink.wave}" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round"`
    ),
    path(
      `M${-LIP + 44} 54C-96 86 -50 104 0 106C50 104 96 86 ${LIP - 44} 54`,
      `fill="none" stroke="${ink.red}" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"`
    ),
    path(
      `M${-LIP + 22} 12C${-LIP + 26} 50 -120 82 -96 96`,
      `fill="none" stroke="#fff" stroke-opacity="0.85" stroke-width="7" stroke-linecap="round"`
    ),
    path(
      scallops(),
      `fill="none" stroke="${ink.glass}" stroke-width="7" stroke-linejoin="round"`
    ),
    path(
      scallops(),
      `fill="none" stroke="${ink.rim}" stroke-opacity="0.7" stroke-width="2"`
    ),
    path(
      "M-22 120L-14 170L14 170L22 120Z",
      `fill="url(#gf-stem)" stroke="${ink.rim}" stroke-opacity="0.5" stroke-width="2"`
    ),
    ellipse(
      0,
      FOOT - 6,
      132,
      16,
      `fill="url(#gf-foot)" stroke="${ink.rim}" stroke-opacity="0.6" stroke-width="2"`
    ),
    ellipse(-50, FOOT - 10, 46, 4, `fill="#fff" fill-opacity="0.8"`),
  ].join(""),
  box: { h: FOOT + 30, w: LIP * 2 + 24, x: -LIP - 12, y: -16 },
};

export const BLOCK_BOX = { h: 190, w: 170, x: -85, y: -230 } as const;

export const shaver: Sprite = {
  body: [
    "<defs>",
    linear(
      "sh-iron",
      [-130, 0, 130, 0],
      [
        [0, "#8f1b20"],
        [0.3, "#e0453a"],
        [0.55, "#b8262a"],
        [1, "#5e1013"],
      ]
    ),
    linear(
      "sh-steel",
      [0, -34, 0, 0],
      [
        [0, "#c8d2da"],
        [0.5, "#7d8a96"],
        [1, ink.steel],
      ]
    ),
    shade("sh-plate", [
      [0, "#f15a4a"],
      [1, "#7c1418"],
    ]),
    "</defs>",
    path("M-132 -300L-108 -300L-108 -24L-132 -24Z", `fill="url(#sh-iron)"`),
    path("M108 -300L132 -300L132 -24L108 -24Z", `fill="url(#sh-iron)"`),
    `<rect x="-150" y="-330" width="300" height="38" rx="14" fill="url(#sh-plate)"/>`,
    `<rect x="-140" y="-326" width="280" height="8" rx="4" fill="#fff" fill-opacity="0.3"/>`,
    `<rect x="-118" y="-36" width="236" height="30" rx="10" fill="url(#sh-steel)"/>`,
    path("M-40 -6L40 -6L22 6L-22 6Z", `fill="${ink.steel}"`),
    `<rect x="-10" y="-360" width="20" height="40" rx="6" fill="url(#sh-steel)"/>`,
  ].join(""),
  box: { h: 380, w: 320, x: -160, y: -366 },
};

export const block: Sprite = {
  body: [
    "<defs>",
    linear(
      "bk-ice",
      [BLOCK_BOX.x, 0, BLOCK_BOX.x + BLOCK_BOX.w, 0],
      [
        [0, "#bfe8ff", 0.85],
        [0.35, "#f2fbff", 0.95],
        [0.7, "#d4efff", 0.9],
        [1, "#8fcdf2", 0.9],
      ]
    ),
    "</defs>",
    `<rect x="${BLOCK_BOX.x}" y="${BLOCK_BOX.y}" width="${BLOCK_BOX.w}" height="${BLOCK_BOX.h}" rx="10" fill="url(#bk-ice)" stroke="#ffffff" stroke-opacity="0.8" stroke-width="3"/>`,
    path(
      `M${BLOCK_BOX.x + 26} ${BLOCK_BOX.y + 16}L${BLOCK_BOX.x + 40} ${BLOCK_BOX.y + BLOCK_BOX.h - 20}`,
      `stroke="#fff" stroke-opacity="0.85" stroke-width="10" stroke-linecap="round"`
    ),
    path(
      `M${BLOCK_BOX.x + 120} ${BLOCK_BOX.y + 40}L${BLOCK_BOX.x + 100} ${BLOCK_BOX.y + 110}L${BLOCK_BOX.x + 130} ${BLOCK_BOX.y + 150}`,
      `fill="none" stroke="#9ed6f5" stroke-opacity="0.8" stroke-width="3"`
    ),
  ].join(""),
  box: { ...BLOCK_BOX },
};

export const crank: Sprite = {
  body: [
    `<circle r="62" fill="none" stroke="#b8262a" stroke-width="12"/>`,
    `<circle r="62" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="3" stroke-dasharray="40 120"/>`,
    ...[0, 1, 2].map(
      (i) =>
        `<rect x="-5" y="-60" width="10" height="60" rx="5" fill="#b8262a" transform="rotate(${i * 120})"/>`
    ),
    `<circle r="14" fill="${ink.steel}"/>`,
    `<rect x="-11" y="-92" width="22" height="44" rx="11" fill="#2d2a28"/>`,
  ].join(""),
  box: { h: 200, w: 160, x: -80, y: -100 },
};

export const snowTile: Sprite = {
  body: `<defs><filter id="snow-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="2" seed="5" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.78 0 0 0 0 0.86 0 0 0 0 0.94 0 0 0 -2.6 1.5"/></filter></defs><rect width="240" height="240" filter="url(#snow-grain)"/>`,
  box: { h: 240, w: 240, x: 0, y: 0 },
};

export const clump: Sprite = {
  body: `<defs>${radial("cl-shade", [0, 0, 50], CLUMP_STOPS, [FOCUS[0] * 50, FOCUS[1] * 50])}</defs><circle r="50" fill="url(#cl-shade)"/>`,
  box: { h: 100, w: 100, x: -50, y: -50 },
};

export const flake: Sprite = {
  body: `<defs>${radial(
    "flake-glow",
    [0, 0, 10],
    [
      [0, "#ffffff", 1],
      [0.5, "#ffffff", 0.85],
      [1, "#dff1ff", 0],
    ]
  )}</defs><circle r="10" fill="url(#flake-glow)"/>`,
  box: { h: 22, w: 22, x: -11, y: -11 },
};

const COUNTER = { h: 900, w: 4000 } as const;

export const counter: Sprite = {
  body: [
    "<defs>",
    `<filter id="ct-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.09" numOctaves="3" seed="11" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.25 0 0 0 0 0.13 0 0 0 0 0.05 0 0 0 1.2 -0.35"/></filter>`,
    linear(
      "ct-wood",
      [0, FOOT, 0, FOOT + COUNTER.h],
      [
        [0, "#c98a52"],
        [0.08, "#a8673a"],
        [1, "#5a321c"],
      ]
    ),
    "</defs>",
    `<rect x="${-COUNTER.w / 2}" y="${FOOT}" width="${COUNTER.w}" height="${COUNTER.h}" fill="url(#ct-wood)"/>`,
    `<rect x="${-COUNTER.w / 2}" y="${FOOT}" width="${COUNTER.w}" height="${COUNTER.h}" filter="url(#ct-grain)" opacity="0.7"/>`,
    `<rect x="${-COUNTER.w / 2}" y="${FOOT - 4}" width="${COUNTER.w}" height="10" fill="#f0c08a" fill-opacity="0.75"/>`,
  ].join(""),
  box: { h: COUNTER.h + 10, w: COUNTER.w, x: -COUNTER.w / 2, y: FOOT - 5 },
};

export const SPRITES: readonly Sprite[] = [
  glassBack,
  glassFront,
  shaver,
  block,
  crank,
  snowTile,
  clump,
  flake,
  counter,
];

const KANJI = [
  "M26 24Q32 30 33 38",
  "M55 10L55 82Q55 93 44 86",
  "M18 46L42 44Q34 66 12 84",
  "M84 26Q73 40 61 48",
  "M59 51Q71 71 91 86",
];

const flag = (x: number, y: number, size: number) => {
  const w = size;
  const h = size * 1.15;
  const k = (w * 0.62) / 100;

  const waves = Array.from({ length: 5 }, (_, i) => {
    const cx = (i + 0.5) * (w / 5);
    const r = w / 10;

    return `M${n(cx - r)} ${n(h)}A${n(r)} ${n(r)} 0 0 1 ${n(cx + r)} ${n(h)}`;
  }).join("");

  return [
    `<g transform="translate(${n(x)} ${n(y)})">`,
    `<rect x="${n(-w * 0.08)}" y="${n(-w * 0.06)}" width="${n(w * 1.16)}" height="${n(w * 0.06)}" rx="${n(w * 0.03)}" fill="${ink.bamboo}"/>`,
    path(
      `M0 0L${n(w)} 0L${n(w * 0.98)} ${n(h)}Q${n(w * 0.5)} ${n(h * 1.03)} ${n(w * 0.02)} ${n(h)}Z`,
      `fill="url(#bd-cloth)"`
    ),
    `<g transform="translate(${n(w * 0.19)} ${n(h * 0.1)}) scale(${n(k)})">${KANJI.map((d) => path(d, `fill="none" stroke="${ink.red}" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"`)).join("")}</g>`,
    `<rect x="0" y="${n(h * 0.8)}" width="${n(w)}" height="${n(h * 0.2)}" fill="${ink.wave}"/>`,
    path(waves, `fill="none" stroke="#fff" stroke-width="${n(w * 0.025)}"`),
    "</g>",
  ].join("");
};

const chime = (x: number, y: number, size: number) => {
  const r = size * 0.5;

  return [
    `<g transform="translate(${n(x)} ${n(y)})">`,
    path(
      `M0 ${n(-size * 0.9)}L0 0`,
      `stroke="#e8e0d0" stroke-opacity="0.7" stroke-width="2"`
    ),
    path(
      `M${n(-r)} ${n(r * 0.9)}Q${n(-r)} ${n(-r * 0.2)} 0 ${n(-r * 0.2)}Q${n(r)} ${n(-r * 0.2)} ${n(r)} ${n(r * 0.9)}Z`,
      `fill="url(#bd-chime)" stroke="#fff" stroke-opacity="0.7" stroke-width="2"`
    ),
    ellipse(
      r * -0.25,
      r * 0.4,
      r * 0.3,
      r * 0.16,
      `fill="${ink.red}" fill-opacity="0.85"`
    ),
    path(
      `M0 ${n(r * 0.6)}L0 ${n(r * 2)}`,
      `stroke="#e8e0d0" stroke-opacity="0.7" stroke-width="1.5"`
    ),
    `<rect x="${n(-r * 0.32)}" y="${n(r * 2)}" width="${n(r * 0.64)}" height="${n(r * 1.9)}" fill="#8fd3ff" fill-opacity="0.9"/>`,
    "</g>",
  ].join("");
};

const cloud = (random: () => number, cx: number, cy: number, size: number) =>
  Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    const x = cx + (random() - 0.5) * size * 1.1;
    const y = cy - t * size * 1.3 + (random() - 0.5) * size * 0.2;
    const r = size * (0.42 - t * 0.18 + random() * 0.08);

    return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="url(#bd-puff)"/>`;
  }).join("");

const scenery = (width: number, height: number, banner: boolean) => {
  const side = Math.min(width, height);
  const random = seeded(23);
  const eave = Math.max(28, height * 0.07);

  return [
    "<defs>",
    linear(
      "bd-sky",
      [0, 0, 0, height],
      [
        [0, "#1f76d8"],
        [0.55, "#6fb8f2"],
        [1, "#d6eefc"],
      ]
    ),
    radial(
      "bd-sun",
      [width * 0.82, height * 0.18, side * 0.7],
      [
        [0, "#fffbe6", 0.85],
        [0.3, "#fff4c8", 0.35],
        [1, "#fff4c8", 0],
      ]
    ),
    radial(
      "bd-puff",
      [0, 0, 1],
      [
        [0, ink.cloud],
        [1, ink.cloudShade],
      ]
    ),
    shade("bd-cloth", [
      [0, "#ffffff"],
      [1, "#efe8dc"],
    ]),
    radial(
      "bd-chime",
      [0, 0, side * 0.05],
      [
        [0, "#ffffff", 0.95],
        [1, "#bfe6ff", 0.5],
      ]
    ),
    shade("bd-eave", [
      [0, "#2a170d"],
      [1, ink.eave],
    ]),
    blur("bd-soft", side * 0.012),
    radial(
      "bd-vignette",
      [width / 2, height * 0.45, Math.max(width, height) * 0.8],
      [
        [0, "#000", 0],
        [0.7, "#000", 0.08],
        [1, "#000", 0.4],
      ]
    ),
    "</defs>",
    `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-sky)"/>`,
    `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-sun)"/>`,
    `<g filter="url(#bd-soft)" opacity="0.95">`,
    cloud(random, width * 0.22, height * 0.62, side * 0.3),
    cloud(random, width * 0.7, height * 0.58, side * 0.42),
    cloud(random, width * 1.02, height * 0.66, side * 0.26),
    "</g>",
    `<rect width="${n(width)}" height="${n(eave)}" fill="url(#bd-eave)"/>`,
    `<rect y="${n(eave - 4)}" width="${n(width)}" height="4" fill="#6b4630"/>`,
    banner
      ? flag(Math.max(14, width * 0.05), eave + side * 0.03, side * 0.2)
      : "",
    chime(width - Math.max(30, width * 0.09), eave + side * 0.09, side * 0.07),
    `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-vignette)"/>`,
  ].join("");
};

export const backdrop = (width: number, height: number) =>
  scenery(width, height, true);

const SOFTEN = [1, 2, 3, 2, 1];
const PUFF = 40;
const LUMP = 13;
const TUCK = 10;
const SOAK = 0.6;
const DRIPS = 7;

const soften = (profile: readonly number[]) => {
  const top = Math.max(0, ...profile);
  const reach = Math.max(1, Math.round(profile.length / 40));

  const smooth = profile.map((_, i) => {
    let sum = 0;
    let weight = 0;

    for (const [j, share] of SOFTEN.entries()) {
      const at = i + (j - 2) * reach;

      if (at >= 0 && at < profile.length) {
        sum += profile[at] * share;
        weight += share;
      }
    }

    return sum / weight;
  });

  const peak = Math.max(0, ...smooth);

  return smooth.map((h) => (peak > 0 ? (h / peak) * top : 0));
};

const CLUMP = 30;

export const clumpsOf = (profile: readonly number[]): Clump[] => {
  const surface = soften(profile);
  const last = surface.length - 1;
  const top = Math.max(0, ...surface);

  const heightAt = (x: number) => {
    const at = ((x + MOUTH / 2) / MOUTH) * last;

    if (at < 0 || at > last) {
      return 0;
    }

    const low = Math.floor(at);
    const high = Math.min(last, low + 1);

    return surface[low] + (surface[high] - surface[low]) * (at - low);
  };

  const out: Clump[] = [];
  const rows = Math.ceil(top / (CLUMP * 0.75)) + 1;

  for (let row = rows; row >= 0; row -= 1) {
    for (let col = -10; col <= 10; col += 1) {
      const x =
        (col + (row % 2) * 0.5) * CLUMP + (hash(row, col) - 0.5) * CLUMP * 1.1;

      const y = -row * CLUMP * 0.75 - hash(col, row) * CLUMP * 0.9;
      const r = CLUMP * (0.45 + hash(row + 99, col) * 0.75);

      const under = heightAt(x);

      if (under > 0 && -y < under + r * 0.3) {
        out.push({ rx: r, ry: r * FLAT, x, y });
      }
    }
  }

  return out;
};

const spaced = (line: readonly Point[], gap: number) => {
  const out = [line[0]];
  let carried = 0;

  for (let i = 1; i < line.length; i += 1) {
    const from = line[i - 1];
    const to = line[i];
    const length = Math.hypot(to.x - from.x, to.y - from.y);
    let at = gap - carried;

    while (at <= length) {
      out.push({
        x: from.x + ((to.x - from.x) * at) / length,
        y: from.y + ((to.y - from.y) * at) / length,
      });
      at += gap;
    }

    carried = length - (at - gap);
  }

  const end = line.at(-1);

  return end === undefined || carried < gap / 3 ? out : [...out, end];
};

export const moundPoints = (profile: readonly number[]): Point[] => {
  const last = profile.length - 1;

  const surface = soften(profile).map((h, i) => ({
    x: -MOUTH / 2 + (i / last) * MOUTH,
    y: -Math.max(0, h),
  }));

  const first = Math.max(0, surface.findIndex((point) => point.y < -2) - 1);
  const end = surface.findLastIndex((point) => point.y < -2) + 1;

  if (end <= first) {
    return [
      { x: -MOUTH / 2, y: 0 },
      { x: MOUTH / 2, y: 0 },
    ];
  }

  const slope = surface.slice(first, Math.min(last, end) + 1);
  const [start] = slope;
  const stop = slope.at(-1) ?? start;

  const ridge = spaced(
    [
      { x: Math.max(start.x - 4, TUCK - LIP), y: 8 },
      ...slope,
      { x: Math.min(stop.x + 4, LIP - TUCK), y: 8 },
    ],
    PUFF
  );

  const fluffy: Point[] = [];

  for (const [i, point] of ridge.entries()) {
    fluffy.push(point);
    const next = ridge[i + 1];

    if (next !== undefined) {
      const dx = next.x - point.x;
      const dy = next.y - point.y;
      const length = Math.hypot(dx, dy) || 1;

      const bump = Math.min(LUMP * (0.45 + hash(i, 3) * 0.9), length * 0.45);

      fluffy.push({
        x: (point.x + next.x) / 2 + (dy / length) * bump,
        y: (point.y + next.y) / 2 - (dx / length) * bump,
      });
    }
  }

  return fluffy;
};

const soakLine = (points: readonly Point[]) => {
  const random = seeded(37);
  const peak = Math.min(...points.map((each) => each.y));
  const left = Math.min(...points.map((each) => each.x));
  const right = Math.max(...points.map((each) => each.x));
  const half = Math.max(1, (right - left) / 2);
  const middle = (left + right) / 2;
  const depth = -peak * SOAK;

  const drips = Array.from({ length: DRIPS }, () => ({
    at: middle + (random() * 2 - 1) * half * 0.8,
    long: depth * (0.08 + random() * 0.16),
    wide: 10 + random() * 10,
  }));

  const line = Array.from({ length: 61 }, (_, i) => {
    const x = left + ((right - left) * i) / 60;

    const round = Math.cos(
      (Math.min(1, Math.abs(x - middle) / half) * Math.PI) / 2
    );

    const wave = Math.sin(x * 0.05 + 1.3) * depth * 0.05;
    let drip = 0;

    for (const each of drips) {
      drip += each.long * Math.exp(-(((x - each.at) / each.wide) ** 2));
    }

    return { x, y: peak + depth * (0.55 + 0.45 * round) + wave + drip };
  });

  return `M${n(left - 10)} ${n(peak - 20)}L${n(right + 10)} ${n(peak - 20)}${curve(line.toReversed()).replace("M", "L")}Z`;
};

const syrupFill = (id: SyrupId, top: number, depth: number, prefix: string) => {
  const [light, mid, deep] = syrups[id].colors;

  if (id === "rainbow") {
    return RAINBOW.map((color, i) =>
      linear(
        `${prefix}-band-${i}`,
        [0, top, 0, top + depth],
        [
          [0, color, 0.95],
          [1, color, 0.7],
        ]
      )
    ).join("");
  }

  return linear(
    `${prefix}-syrup`,
    [0, top, 0, top + depth],
    [
      [0, deep, 0.92],
      [0.45, mid, 0.88],
      [1, light, 0.72],
    ]
  );
};

const syrupLayer = (id: SyrupId, prefix: string) => {
  if (id === "rainbow") {
    const band = MOUTH / RAINBOW.length;

    return RAINBOW.map(
      (_, i) =>
        `<rect x="${n(-MOUTH / 2 - 6 + i * band)}" y="-2000" width="${n(band + 12 / RAINBOW.length)}" height="2000" fill="url(#${prefix}-band-${i})"/>`
    ).join("");
  }

  return `<rect x="${-MOUTH / 2 - 10}" y="-2000" width="${MOUTH + 20}" height="2000" fill="url(#${prefix}-syrup)"/>`;
};

const beans = (points: readonly Point[], top: number) => {
  const random = seeded(31);
  let [peak] = points;

  for (const each of points) {
    if (each.y < peak.y) {
      peak = each;
    }
  }

  return Array.from({ length: 7 }, () => {
    const x = peak.x + (random() - 0.5) * 70;
    const y = peak.y + 12 + random() * Math.min(60, -top * 0.25);

    return ellipse(
      x,
      y,
      9,
      7,
      `fill="${ink.azuki}" stroke="#2b080c" stroke-width="1.5"`
    );
  }).join("");
};

export const moundBody = (
  profile: readonly number[],
  syrup: SyrupId | null,
  prefix = "md"
) => {
  const points = moundPoints(profile);
  const d = `${curve(points)}Z`;
  const top = Math.min(-20, ...points.map((each) => each.y));
  const box = `x="${-MOUTH / 2 - 10}" y="${n(top - 10)}" width="${MOUTH + 20}" height="${n(-top + 30)}"`;

  return [
    "<defs>",
    linear(
      `${prefix}-snow`,
      [0, top, 0, 0],
      [
        [0, ink.snow],
        [0.6, "#f1f7fb"],
        [1, ink.snowShade],
      ]
    ),
    linear(
      `${prefix}-side`,
      [-MOUTH / 2, 0, MOUTH / 2, 0],
      [
        [0.1, "#ffffff", 0.55],
        [0.4, "#ffffff", 0],
        [0.65, "#7fa6c4", 0],
        [0.95, "#7fa6c4", 0.4],
      ]
    ),
    linear(
      `${prefix}-foot`,
      [0, -60, 0, 10],
      [
        [0, "#7fa6c4", 0],
        [1, "#7fa6c4", 0.35],
      ]
    ),
    `<filter id="${prefix}-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="5" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.78 0 0 0 0 0.86 0 0 0 0 0.94 0 0 0 -2.6 1.5"/><feComposite in2="SourceGraphic" operator="in"/></filter>`,
    blur(`${prefix}-wet`, 3),
    clumpShade(`${prefix}-clump`),
    `<clipPath id="${prefix}-clip"><path d="${d}"/></clipPath>`,
    syrup === null
      ? ""
      : `<clipPath id="${prefix}-soak"><path d="${soakLine(points)}"/></clipPath>${syrupFill(syrup, top, -top * SOAK * 1.3, prefix)}`,
    "</defs>",
    path(d, `fill="url(#${prefix}-snow)"`),
    `<g clip-path="url(#${prefix}-clip)">`,
    `<rect ${box} fill="#fff" filter="url(#${prefix}-grain)" opacity="0.7"/>`,
    syrup === null
      ? ""
      : `<g filter="url(#${prefix}-wet)"><g clip-path="url(#${prefix}-soak)">${syrupLayer(syrup, prefix)}</g></g>`,
    clumpsOf(profile)
      .map((each) => blob(`${prefix}-clump`, each))
      .join(""),
    `<rect ${box} fill="#fff" filter="url(#${prefix}-grain)" opacity="0.35"/>`,
    path(d, `fill="url(#${prefix}-side)"`),
    path(
      d,
      `fill="none" stroke="${ink.rim}" stroke-opacity="0.12" stroke-width="14"`
    ),
    `<rect ${box} fill="url(#${prefix}-foot)"/>`,
    syrup === "uji" ? beans(points, top) : "",
    "</g>",
  ].join("");
};

export interface Pose {
  profile: readonly number[] | null;
  syrup: SyrupId | null;
  lean: number;
  toppled: boolean;
}

export const heapSpots = (side: number) => {
  const random = seeded(43);

  return Array.from({ length: 6 }, (_, i) => ({
    r: 46 - i * 5 + random() * 10,
    x: side * (LIP + 40 + i * 46 + random() * 20),
  }));
};

const heaps = (side: number) =>
  heapSpots(side)
    .map(({ x, r }) =>
      ellipse(x, FOOT - r * 0.35, r, r * 0.55, `fill="url(#hp-snow)"`)
    )
    .join("");

const poseBody = (pose: Pose) => {
  const lean = n((pose.lean * 180) / Math.PI);

  return [
    `<defs>${linear(
      "hp-snow",
      [0, FOOT - 60, 0, FOOT],
      [
        [0, ink.snow],
        [1, ink.snowShade],
      ]
    )}</defs>`,
    counter.body,
    pose.toppled ? heaps(pose.lean < 0 ? -1 : 1) : "",
    glassBack.body,
    pose.profile === null
      ? ""
      : `<g transform="rotate(${lean})">${moundBody(pose.profile, pose.syrup)}</g>`,
    glassFront.body,
  ].join("");
};

export const sceneDoc = (
  width: number,
  height: number,
  frame: Frame,
  pose: Pose,
  banner = true
) => {
  const k = frame.size / SCENE;

  return docOf(
    { h: height, w: width, x: 0, y: 0 },
    width,
    height,
    `${scenery(width, height, banner)}<g transform="translate(${n(frame.x + ORIGIN.x * k)} ${n(frame.y + ORIGIN.y * k)}) scale(${n(k)})">${poseBody(pose)}</g>`
  );
};
