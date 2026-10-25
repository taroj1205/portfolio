import type { Text } from "../../_lib/i18n";

export const syrupIds = [
  "mizore",
  "ichigo",
  "lemon",
  "melon",
  "blue",
  "uji",
  "rainbow",
] as const;

export type SyrupId = (typeof syrupIds)[number];

export interface Syrup {
  name: Text;
  icon: string;
  colors: readonly [string, string, string];
}

export const RAINBOW = ["#ff4f6d", "#ffb13b", "#ffe14d", "#5fd36b", "#3fa9ff"];

export const syrups: Record<SyrupId, Syrup> = {
  blue: {
    colors: ["#9fe6ff", "#2fa8f0", "#0d5fb8"],
    icon: "🟦",
    name: { en: "blue Hawaii", ja: "ブルーハワイ" },
  },
  ichigo: {
    colors: ["#ffb0bb", "#f2384f", "#a8102a"],
    icon: "🟥",
    name: { en: "strawberry", ja: "いちご" },
  },
  lemon: {
    colors: ["#fff6b0", "#ffd93a", "#d9a20c"],
    icon: "🟨",
    name: { en: "lemon", ja: "レモン" },
  },
  melon: {
    colors: ["#cbffb8", "#45d35a", "#178a33"],
    icon: "🟩",
    name: { en: "melon", ja: "メロン" },
  },
  mizore: {
    colors: ["#ffffff", "#eef4f8", "#cfdde6"],
    icon: "🧊",
    name: { en: "plain syrup", ja: "みぞれ" },
  },
  rainbow: {
    colors: ["#ffe9f4", "#ff86c0", "#7a5cff"],
    icon: "🌈",
    name: { en: "rainbow", ja: "レインボー" },
  },
  uji: {
    colors: ["#d8efa4", "#7fae3a", "#3f6a1c"],
    icon: "🍵",
    name: { en: "matcha and red bean", ja: "宇治金時" },
  },
};
