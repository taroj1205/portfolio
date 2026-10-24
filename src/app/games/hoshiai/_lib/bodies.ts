import type { Text } from "../../_lib/i18n";

interface Kind {
  name: Text;
  radius: number;
  emoji: string;
  light: string;
  base: string;
  deep: string;
  glow: string;
}

export const bodies: readonly Kind[] = [
  {
    base: "#ffe3a3",
    deep: "#d99a3d",
    emoji: "✨",
    glow: "#ffd98a",
    light: "#fffbea",
    name: { en: "Stardust", ja: "星屑" },
    radius: 0.058,
  },
  {
    base: "#9a8b7e",
    deep: "#4a403a",
    emoji: "🪨",
    glow: "#d9c4ad",
    light: "#d6c8ba",
    name: { en: "Asteroid", ja: "小惑星" },
    radius: 0.074,
  },
  {
    base: "#a9d8f2",
    deep: "#3d6f99",
    emoji: "☄️",
    glow: "#9fe3ff",
    light: "#f0fbff",
    name: { en: "Comet", ja: "彗星" },
    radius: 0.094,
  },
  {
    base: "#d8d4ca",
    deep: "#6e6a64",
    emoji: "🌙",
    glow: "#f3efe2",
    light: "#f7f4ec",
    name: { en: "Moon", ja: "月" },
    radius: 0.115,
  },
  {
    base: "#c8573a",
    deep: "#5c1f12",
    emoji: "🔴",
    glow: "#ff8a5c",
    light: "#f2a07c",
    name: { en: "Mars", ja: "火星" },
    radius: 0.14,
  },
  {
    base: "#2f74d0",
    deep: "#0b2552",
    emoji: "🌍",
    glow: "#7cc4ff",
    light: "#9fd2ff",
    name: { en: "Earth", ja: "地球" },
    radius: 0.169,
  },
  {
    base: "#3f63d6",
    deep: "#141f63",
    emoji: "🔵",
    glow: "#7f9bff",
    light: "#a3c0ff",
    name: { en: "Neptune", ja: "海王星" },
    radius: 0.202,
  },
  {
    base: "#dcbd84",
    deep: "#7a5a2c",
    emoji: "🪐",
    glow: "#ffe0a0",
    light: "#f7e6c0",
    name: { en: "Saturn", ja: "土星" },
    radius: 0.238,
  },
  {
    base: "#d29a6a",
    deep: "#6b3a1f",
    emoji: "🟠",
    glow: "#ffbf8a",
    light: "#f6dcc0",
    name: { en: "Jupiter", ja: "木星" },
    radius: 0.278,
  },
  {
    base: "#ffb43b",
    deep: "#e2531b",
    emoji: "☀️",
    glow: "#ffcf6b",
    light: "#fff6c9",
    name: { en: "Sun", ja: "太陽" },
    radius: 0.324,
  },
  {
    base: "#0a0610",
    deep: "#000000",
    emoji: "🕳️",
    glow: "#ff9f4a",
    light: "#ffd7a1",
    name: { en: "Black hole", ja: "ブラックホール" },
    radius: 0.378,
  },
];

export const TOP = bodies.length - 1;

export const TIER = {
  asteroid: 1,
  comet: 2,
  earth: 5,
  jupiter: 8,
  mars: 4,
  moon: 3,
  neptune: 6,
  saturn: 7,
  stardust: 0,
  sun: 9,
} as const;

export const GALAXY: Text = { en: "Milky Way", ja: "天の川" };

export const kindOf = (tier: number): Kind => {
  const kind = bodies[tier];

  if (kind === undefined) {
    throw new RangeError(`No body at tier ${tier}`);
  }

  return kind;
};
