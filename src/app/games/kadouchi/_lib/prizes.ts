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
