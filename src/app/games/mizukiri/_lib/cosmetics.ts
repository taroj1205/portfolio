import { zones } from "./simulate";

export type Unlock =
  | { kind: "start" }
  | { kind: "level"; level: number }
  | { kind: "combo"; combo: number }
  | { kind: "zone"; zone: number }
  | { kind: "divine" };

export interface Option {
  id: string;
  name: string;
  unlock: Unlock;
}

export interface Color extends Option {
  mineral: [string, string, string];
  glow: string | null;
}

export type Part = "color" | "form" | "pattern" | "trail";

export interface Look {
  color: string;
  form: string;
  pattern: string;
  trail: string;
}

const colors: Color[] = [
  {
    glow: null,
    id: "river",
    mineral: ["#c9c4ba", "#8d8a84", "#4f4c47"],
    name: "川石",
    unlock: { kind: "start" },
  },
  {
    glow: null,
    id: "slate",
    mineral: ["#7a7f86", "#3a3d43", "#141518"],
    name: "黒",
    unlock: { kind: "level", level: 2 },
  },
  {
    glow: null,
    id: "rose",
    mineral: ["#f3d2c8", "#c98b7c", "#6e3e35"],
    name: "桜色",
    unlock: { kind: "level", level: 5 },
  },
  {
    glow: "#7dffb5",
    id: "jade",
    mineral: ["#d4f7e0", "#4fae7c", "#1d5a3c"],
    name: "翡翠",
    unlock: { kind: "combo", combo: 10 },
  },
  {
    glow: "#ffd27a",
    id: "gold",
    mineral: ["#fff4c2", "#e8b84a", "#7a4e0e"],
    name: "金",
    unlock: { kind: "divine" },
  },
  {
    glow: "#ff7a3a",
    id: "meteor",
    mineral: ["#5a4e48", "#2a2220", "#0e0b0a"],
    name: "隕石",
    unlock: { kind: "zone", zone: 4 },
  },
];

const forms: Option[] = [
  { id: "oval", name: "たまご", unlock: { kind: "start" } },
  { id: "round", name: "まんまる", unlock: { kind: "level", level: 3 } },
  { id: "flat", name: "ひらべったい", unlock: { kind: "zone", zone: 1 } },
  { id: "heart", name: "ハート", unlock: { kind: "level", level: 10 } },
];

const patterns: Option[] = [
  { id: "plain", name: "無地", unlock: { kind: "start" } },
  { id: "stripe", name: "縞", unlock: { kind: "level", level: 4 } },
  { id: "speckle", name: "まだら", unlock: { kind: "zone", zone: 2 } },
  { id: "ring", name: "輪っか", unlock: { kind: "combo", combo: 20 } },
];

const trails: Option[] = [
  { id: "spray", name: "水しぶき", unlock: { kind: "start" } },
  { id: "gold", name: "金粉", unlock: { kind: "combo", combo: 15 } },
  { id: "sakura", name: "桜吹雪", unlock: { kind: "zone", zone: 2 } },
  { id: "fox", name: "狐火", unlock: { kind: "zone", zone: 3 } },
];

export const parts: { part: Part; name: string; options: Option[] }[] = [
  { name: "色", options: colors, part: "color" },
  { name: "形", options: forms, part: "form" },
  { name: "模様", options: patterns, part: "pattern" },
  { name: "軌跡", options: trails, part: "trail" },
];

export const firstLook: Look = {
  color: "river",
  form: "oval",
  pattern: "plain",
  trail: "spray",
};

export const colorOf = (id: string) =>
  colors.find((color) => color.id === id) ?? colors[0];

export interface Progress {
  level: number;
  combo: number;
  zone: number;
  divine: boolean;
}

export const isOpen = (unlock: Unlock, progress: Progress) => {
  if (unlock.kind === "level") {
    return progress.level >= unlock.level;
  }
  if (unlock.kind === "combo") {
    return progress.combo >= unlock.combo;
  }
  if (unlock.kind === "zone") {
    return progress.zone >= unlock.zone;
  }
  if (unlock.kind === "divine") {
    return progress.divine;
  }
  return true;
};

export const conditionOf = (unlock: Unlock) => {
  if (unlock.kind === "level") {
    return `Lv.${unlock.level}`;
  }
  if (unlock.kind === "combo") {
    return `コンボ${unlock.combo}`;
  }
  if (unlock.kind === "zone") {
    return `${zones[unlock.zone]?.name ?? ""}に到達`;
  }
  if (unlock.kind === "divine") {
    return "神投げ";
  }
  return "";
};

export const opened = (progress: Progress) =>
  parts.flatMap(({ options }) =>
    options.filter((option) => isOpen(option.unlock, progress))
  );
