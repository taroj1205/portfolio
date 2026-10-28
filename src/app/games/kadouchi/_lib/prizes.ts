import type { Text } from "../../_lib/i18n";

export const prizeIds = [
  "caramel",
  "ramune",
  "kendama",
  "choco",
  "daruma",
  "hanabi",
  "neko",
  "game",
  "bear",
] as const;

export type PrizeId = (typeof prizeIds)[number];

type Size = "small" | "medium" | "big";

type Knot = readonly [v: number, left: number, right: number];

export const LID = 0.25;

export interface Kind {
  name: Text;
  icon: string;
  size: Size;
  row: number;
  x: number;
  w: number;
  h: number;
  d: number;
  mass: number;
  gap: number;
  points: number;
  box: { side: string; top: string } | null;
  outline: readonly Knot[] | null;
}

export const SHELVES = [900, 580, 330] as const;

export const kinds: Record<PrizeId, Kind> = {
  bear: {
    box: null,
    d: 140,
    gap: 10,
    h: 280,
    icon: "🧸",
    mass: 520,
    name: { en: "teddy bear", ja: "くまのぬいぐるみ" },
    outline: [
      [0, 0.69, 0.69],
      [0.037, 0.87, 0.87],
      [0.113, 0.96, 0.96],
      [0.184, 0.85, 0.85],
      [0.219, 0.68, 0.68],
      [0.228, 0.69, 0.69],
      [0.229, 0.82, 0.82],
      [0.258, 0.94, 0.94],
      [0.373, 1.04, 1.04],
      [0.508, 0.98, 0.98],
      [0.555, 0.84, 0.84],
      [0.557, 0.82, 0.82],
      [0.558, 0.49, 0.49],
      [0.679, 0.63, 0.63],
      [0.819, 0.61, 0.61],
      [0.844, 0.61, 0.61],
      [0.909, 0.71, 0.71],
      [0.987, 0.65, 0.65],
      [1, 0.61, 0.61],
    ],
    points: 100,
    row: 0,
    size: "big",
    w: 230,
    x: 675,
  },
  caramel: {
    box: { side: "#c98a12", top: "#ffe27a" },
    d: 36,
    gap: 60,
    h: 128,
    icon: "🍬",
    mass: 30,
    name: { en: "caramels", ja: "キャラメル" },
    outline: null,
    points: 10,
    row: 2,
    size: "small",
    w: 64,
    x: 225,
  },
  choco: {
    box: { side: "#5a2a14", top: "#b8743e" },
    d: 32,
    gap: 60,
    h: 84,
    icon: "🍫",
    mass: 40,
    name: { en: "chocolate", ja: "板チョコ" },
    outline: null,
    points: 10,
    row: 2,
    size: "small",
    w: 110,
    x: 750,
  },
  daruma: {
    box: null,
    d: 120,
    gap: 20,
    h: 160,
    icon: "🔴",
    mass: 160,
    name: { en: "daruma", ja: "だるま" },
    outline: [
      [0, 0.09, 0.09],
      [0.018, 0.34, 0.34],
      [0.091, 0.67, 0.67],
      [0.271, 0.93, 0.93],
      [0.58, 0.99, 0.99],
      [0.841, 0.78, 0.78],
      [0.96, 0.46, 0.46],
      [0.996, 0.17, 0.17],
      [1, 0.09, 0.09],
    ],
    points: 30,
    row: 1,
    size: "medium",
    w: 140,
    x: 265,
  },
  game: {
    box: { side: "#141a3a", top: "#4b5cc4" },
    d: 100,
    gap: 12,
    h: 220,
    icon: "🎮",
    mass: 600,
    name: { en: "game console", ja: "ゲーム機" },
    outline: null,
    points: 100,
    row: 0,
    size: "big",
    w: 270,
    x: 320,
  },
  hanabi: {
    box: { side: "#0f1f52", top: "#3d5bd9" },
    d: 44,
    gap: 20,
    h: 200,
    icon: "🎆",
    mass: 120,
    name: { en: "fireworks set", ja: "花火セット" },
    outline: null,
    points: 30,
    row: 1,
    size: "medium",
    w: 110,
    x: 500,
  },
  kendama: {
    box: null,
    d: 40,
    gap: 60,
    h: 120,
    icon: "🪀",
    mass: 32,
    name: { en: "kendama", ja: "けん玉" },
    outline: [
      [0, 0.29, 0.29],
      [0.053, 0.51, 0.51],
      [0.101, 0.26, 0.26],
      [0.316, 0.2, 0.2],
      [0.318, 1.02, 1.02],
      [0.503, 0.86, 0.86],
      [0.534, 0.67, 0.67],
      [0.736, 0.87, 0.87],
      [0.928, 0.58, 0.58],
      [0.995, 0.18, 0.18],
      [1, 0.1, 0.1],
    ],
    points: 10,
    row: 2,
    size: "small",
    w: 78,
    x: 565,
  },
  neko: {
    box: null,
    d: 110,
    gap: 20,
    h: 190,
    icon: "🐱",
    mass: 220,
    name: { en: "lucky cat", ja: "招き猫" },
    outline: [
      [0, 0.08, 0.08],
      [0.02, 0.35, 0.35],
      [0.094, 0.69, 0.69],
      [0.239, 0.91, 0.91],
      [0.398, 0.82, 0.82],
      [0.505, 0.55, 0.55],
      [0.626, 0.7, 0.7],
      [0.628, 0.7, 0.79],
      [0.701, 0.71, 0.97],
      [0.884, 0.62, 0.97],
      [0.951, 0.59, 0.79],
      [0.952, 0.59, 0.77],
      [0.953, 0.59, 0.59],
      [1, 0.57, 0.57],
    ],
    points: 30,
    row: 1,
    size: "medium",
    w: 140,
    x: 735,
  },
  ramune: {
    box: null,
    d: 54,
    gap: 60,
    h: 150,
    icon: "🥤",
    mass: 32,
    name: { en: "ramune", ja: "ラムネ" },
    outline: [
      [0, 0.89, 0.89],
      [0.166, 1.03, 1.03],
      [0.644, 0.91, 0.91],
      [0.718, 0.57, 0.57],
      [0.816, 0.74, 0.74],
      [0.889, 0.51, 0.51],
      [1, 0.45, 0.45],
    ],
    points: 10,
    row: 2,
    size: "small",
    w: 54,
    x: 390,
  },
};

export const scoreOf = (ids: readonly PrizeId[]) => {
  let sum = 0;

  for (const id of ids) {
    sum += kinds[id].points;
  }

  return sum;
};

export const TOTAL = scoreOf(prizeIds);
