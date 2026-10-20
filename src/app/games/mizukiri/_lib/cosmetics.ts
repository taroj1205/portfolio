import { areaOf, plain, zones } from "./simulate";
import type { Traits } from "./simulate";

export type Unlock =
  | { kind: "start" }
  | { kind: "level"; level: number }
  | { kind: "combo"; combo: number }
  | { kind: "zone"; zone: number }
  | { kind: "divine" };

export type Axis = keyof Traits;

export type Perks = Partial<Record<Axis, number>>;

export const axes: { key: Axis; label: string }[] = [
  { key: "speed", label: "速さ" },
  { key: "keep", label: "粘り" },
  { key: "lift", label: "跳ね" },
  { key: "focus", label: "集中" },
  { key: "impact", label: "当たり" },
];

export interface Option {
  id: string;
  name: string;
  unlock: Unlock;
  perks?: Perks;
}

export interface Color extends Option {
  mineral: [string, string, string];
  glow: string | null;
  gloss: number;
  metal: boolean;
}

export type Part = "color" | "form" | "pattern" | "trail";

export interface Look {
  color: string;
  form: string;
  pattern: string;
  trail: string;
}

export type Stone = Pick<Look, "color" | "form">;

const colors: Color[] = [
  {
    gloss: 0.35,
    glow: null,
    id: "river",
    metal: false,
    mineral: ["#c9c4ba", "#8d8a84", "#4f4c47"],
    name: "川石",
    perks: {},
    unlock: { kind: "start" },
  },
  {
    gloss: 0.55,
    glow: null,
    id: "slate",
    metal: false,
    mineral: ["#7a7f86", "#3a3d43", "#141518"],
    name: "黒",
    perks: { impact: 1, keep: 1, lift: -2 },
    unlock: { kind: "level", level: 2 },
  },
  {
    gloss: 0.45,
    glow: null,
    id: "rose",
    metal: false,
    mineral: ["#f3d2c8", "#c98b7c", "#6e3e35"],
    name: "桜色",
    perks: { focus: 1, impact: -2, lift: 1 },
    unlock: { kind: "level", level: 5 },
  },
  {
    gloss: 0.95,
    glow: "#d6f6ff",
    id: "ice",
    metal: false,
    mineral: ["#eef9ff", "#9fd3ea", "#3f7f9c"],
    name: "氷",
    perks: { impact: -2, keep: 1, speed: 1 },
    unlock: { kind: "level", level: 8 },
  },
  {
    gloss: 0.8,
    glow: "#7dffb5",
    id: "jade",
    metal: false,
    mineral: ["#d4f7e0", "#4fae7c", "#1d5a3c"],
    name: "翡翠",
    perks: { focus: 2, speed: -1 },
    unlock: { kind: "combo", combo: 10 },
  },
  {
    gloss: 0.85,
    glow: "#ffb347",
    id: "amber",
    metal: false,
    mineral: ["#ffe2a8", "#d98a2b", "#6b3410"],
    name: "琥珀",
    perks: { lift: 2, speed: -1 },
    unlock: { kind: "level", level: 12 },
  },
  {
    gloss: 0.9,
    glow: "#ffd27a",
    id: "gold",
    metal: true,
    mineral: ["#fff4c2", "#e8b84a", "#7a4e0e"],
    name: "金",
    perks: { impact: 2, speed: -1 },
    unlock: { kind: "divine" },
  },
  {
    gloss: 0.5,
    glow: "#ff7a3a",
    id: "meteor",
    metal: true,
    mineral: ["#5a4e48", "#2a2220", "#0e0b0a"],
    name: "隕石",
    perks: { keep: -1, speed: 2 },
    unlock: { kind: "zone", zone: areaOf("sea") },
  },
  {
    gloss: 0.7,
    glow: "#7aa8ff",
    id: "lapis",
    metal: false,
    mineral: ["#c9d8ff", "#3f5fc4", "#16224f"],
    name: "瑠璃",
    perks: { focus: 1, lift: 1, speed: -1 },
    unlock: { kind: "level", level: 16 },
  },
  {
    gloss: 0.45,
    glow: null,
    id: "coral",
    metal: false,
    mineral: ["#ffd8cc", "#f08a6e", "#8a3424"],
    name: "珊瑚",
    perks: { impact: 1, keep: -1, lift: 1 },
    unlock: { kind: "zone", zone: areaOf("snow") },
  },
  {
    gloss: 1,
    glow: "#ffffff",
    id: "crystal",
    metal: false,
    mineral: ["#ffffff", "#d6e4f0", "#8ea4ba"],
    name: "水晶",
    perks: { focus: 1, keep: -1, speed: 1 },
    unlock: { kind: "level", level: 24 },
  },
  {
    gloss: 0.95,
    glow: "#b46bff",
    id: "obsidian",
    metal: false,
    mineral: ["#6a6478", "#24202c", "#08070b"],
    name: "黒曜石",
    perks: { focus: -2, impact: 1, speed: 2 },
    unlock: { kind: "zone", zone: areaOf("cloud") },
  },
  {
    gloss: 0.3,
    glow: "#fff6c8",
    id: "moon",
    metal: false,
    mineral: ["#fbf6e4", "#c9c2a8", "#6e6a5c"],
    name: "月の石",
    perks: { focus: 1, lift: 2, speed: -2 },
    unlock: { kind: "zone", zone: areaOf("stars") },
  },
];

const forms: Option[] = [
  { id: "oval", name: "たまご", perks: {}, unlock: { kind: "start" } },
  {
    id: "round",
    name: "まんまる",
    perks: { focus: 2, keep: -2, lift: 2, speed: -1 },
    unlock: { kind: "level", level: 3 },
  },
  {
    id: "flat",
    name: "ひらべったい",
    perks: { focus: -1, impact: -1, keep: 3, lift: -2, speed: 2 },
    unlock: { kind: "zone", zone: areaOf("bamboo") },
  },
  {
    id: "drop",
    name: "しずく",
    perks: { focus: -1, lift: -1, speed: 3 },
    unlock: { kind: "level", level: 5 },
  },
  {
    id: "square",
    name: "かくいし",
    perks: { impact: 1, keep: 3, lift: -2, speed: -1 },
    unlock: { kind: "level", level: 7 },
  },
  {
    id: "leaf",
    name: "このは",
    perks: { impact: -2, keep: 1, lift: 3, speed: -1 },
    unlock: { kind: "zone", zone: areaOf("maple") },
  },
  {
    id: "triangle",
    name: "おにぎり",
    perks: { focus: -2, impact: 2, keep: 1 },
    unlock: { kind: "combo", combo: 10 },
  },
  {
    id: "heart",
    name: "ハート",
    perks: { focus: 1, impact: 3, keep: -1, speed: -2 },
    unlock: { kind: "level", level: 10 },
  },
  {
    id: "bean",
    name: "まめ",
    perks: { focus: 3, keep: 1, lift: -1, speed: -2 },
    unlock: { kind: "level", level: 13 },
  },
  {
    id: "crescent",
    name: "みかづき",
    perks: { focus: 2, impact: -1, keep: -2, speed: 2 },
    unlock: { kind: "combo", combo: 20 },
  },
  {
    id: "star",
    name: "ほし",
    perks: { focus: 2, impact: 2, keep: -2, lift: 1, speed: -2 },
    unlock: { kind: "zone", zone: areaOf("town") },
  },
  {
    id: "gourd",
    name: "ひょうたん",
    perks: { focus: -2, impact: 2, lift: 2, speed: -1 },
    unlock: { kind: "level", level: 18 },
  },
  {
    id: "diamond",
    name: "ひしがた",
    perks: { impact: 1, keep: -1, lift: -1, speed: 2 },
    unlock: { kind: "level", level: 22 },
  },
  {
    id: "fan",
    name: "おうぎ",
    perks: { focus: 1, impact: -1, keep: -1, lift: 2 },
    unlock: { kind: "combo", combo: 30 },
  },
  {
    id: "fish",
    name: "さかな",
    perks: { focus: 1, impact: -1, lift: -1, speed: 2 },
    unlock: { kind: "zone", zone: areaOf("firefly") },
  },
  {
    id: "shell",
    name: "きっこう",
    perks: { impact: 1, keep: 2, speed: -2 },
    unlock: { kind: "level", level: 30 },
  },
];

const patterns: Option[] = [
  { id: "plain", name: "無地", unlock: { kind: "start" } },
  { id: "stripe", name: "縞", unlock: { kind: "level", level: 4 } },
  {
    id: "speckle",
    name: "まだら",
    unlock: { kind: "zone", zone: areaOf("sakura") },
  },
  { id: "ring", name: "輪っか", unlock: { kind: "combo", combo: 20 } },
  { id: "wave", name: "青海波", unlock: { kind: "level", level: 6 } },
  { id: "checker", name: "市松", unlock: { kind: "level", level: 9 } },
  { id: "dots", name: "水玉", unlock: { kind: "combo", combo: 12 } },
  { id: "mended", name: "金継ぎ", unlock: { kind: "divine" } },
];

const trails: Option[] = [
  { id: "spray", name: "水しぶき", unlock: { kind: "start" } },
  { id: "gold", name: "金粉", unlock: { kind: "combo", combo: 15 } },
  {
    id: "sakura",
    name: "桜吹雪",
    unlock: { kind: "zone", zone: areaOf("sakura") },
  },
  {
    id: "fox",
    name: "狐火",
    unlock: { kind: "zone", zone: areaOf("firefly") },
  },
  { id: "rainbow", name: "虹", unlock: { kind: "level", level: 11 } },
  { id: "ink", name: "墨", unlock: { kind: "zone", zone: areaOf("ginkgo") } },
  { id: "bubble", name: "泡", unlock: { kind: "zone", zone: areaOf("sea") } },
  {
    id: "comet",
    name: "流星",
    unlock: { kind: "zone", zone: areaOf("stars") },
  },
];

export const parts: { part: Part; name: string; options: Option[] }[] = [
  { name: "石の種類", options: colors, part: "color" },
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

export const formOf = (id: string) =>
  forms.find((form) => form.id === id) ?? forms[0];

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

export interface Item {
  part: Part;
  option: Option;
}

export const keyOf = ({ part, option }: Item) => `${part}:${option.id}`;

export const opened = (progress: Progress): Item[] =>
  parts.flatMap(({ part, options }) =>
    options
      .filter((option) => isOpen(option.unlock, progress))
      .map((option) => ({ option, part }))
  );

export interface Combo {
  id: string;
  name: string;
  color: string;
  form: string;
  perks: Perks;
}

export const combos: Combo[] = [
  { color: "slate", form: "flat", id: "go", name: "碁石", perks: { keep: 2 } },
  {
    color: "jade",
    form: "bean",
    id: "jewel",
    name: "勾玉",
    perks: { focus: 2 },
  },
  {
    color: "gold",
    form: "star",
    id: "venus",
    name: "一番星",
    perks: { impact: 2, lift: 1 },
  },
  {
    color: "rose",
    form: "leaf",
    id: "petal",
    name: "花びら",
    perks: { lift: 2 },
  },
  {
    color: "meteor",
    form: "drop",
    id: "shooting",
    name: "流れ星",
    perks: { speed: 2 },
  },
  {
    color: "rose",
    form: "heart",
    id: "love",
    name: "恋の石",
    perks: { impact: 2 },
  },
  {
    color: "gold",
    form: "gourd",
    id: "gourds",
    name: "千成瓢箪",
    perks: { impact: 1, lift: 1, speed: 1 },
  },
  {
    color: "ice",
    form: "crescent",
    id: "moon",
    name: "氷の月",
    perks: { focus: 1, speed: 2 },
  },
  {
    color: "amber",
    form: "triangle",
    id: "grilled",
    name: "焼きおにぎり",
    perks: { impact: 1, keep: 1 },
  },
  {
    color: "coral",
    form: "star",
    id: "starfish",
    name: "ヒトデ",
    perks: { impact: 1, lift: 1 },
  },
  {
    color: "crystal",
    form: "drop",
    id: "tear",
    name: "涙",
    perks: { focus: 2 },
  },
  {
    color: "moon",
    form: "crescent",
    id: "lunar",
    name: "三日月",
    perks: { lift: 2 },
  },
  {
    color: "obsidian",
    form: "diamond",
    id: "arrow",
    name: "矢じり",
    perks: { speed: 2 },
  },
  {
    color: "ice",
    form: "star",
    id: "flake",
    name: "雪の結晶",
    perks: { keep: 2 },
  },
  {
    color: "rose",
    form: "fan",
    id: "blossom",
    name: "花扇",
    perks: { focus: 1, lift: 1 },
  },
  {
    color: "jade",
    form: "shell",
    id: "turtle",
    name: "万年亀",
    perks: { keep: 2 },
  },
  {
    color: "amber",
    form: "drop",
    id: "sap",
    name: "樹液",
    perks: { keep: 1, lift: 1 },
  },
  {
    color: "gold",
    form: "fish",
    id: "goldfish",
    name: "金魚",
    perks: { impact: 2 },
  },
];

export const comboOf = ({ color, form }: Stone) =>
  combos.find((combo) => combo.color === color && combo.form === form) ?? null;

const STEP: Record<Axis, number> = {
  focus: 0.045,
  impact: 0.25,
  keep: 0.0045,
  lift: 0.12,
  speed: 0.045,
};

const perksOf = (look: Stone): Perks[] => [
  colorOf(look.color).perks ?? {},
  formOf(look.form).perks ?? {},
  comboOf(look)?.perks ?? {},
];

export const traitsOf = (look: Stone): Traits => {
  const steps = (axis: Axis) =>
    perksOf(look).reduce((sum, perks) => sum + (perks[axis] ?? 0), 0);
  const scale = (axis: Axis) => (1 + STEP[axis]) ** steps(axis);
  return {
    focus: plain.focus * scale("focus"),
    impact: plain.impact * scale("impact"),
    keep: plain.keep + STEP.keep * steps("keep"),
    lift: plain.lift * scale("lift"),
    speed: plain.speed * scale("speed"),
  };
};

export const noteOf = (perks: Perks) => {
  const marks = axes.flatMap(({ key, label }) => {
    const step = perks[key] ?? 0;
    if (step === 0) {
      return [];
    }
    return [`${label}${(step > 0 ? "↑" : "↓").repeat(Math.abs(step))}`];
  });
  return marks.length === 0 ? "クセなし" : marks.join(" ");
};

export const peaksOf = (perks: Perks): Perks => {
  const ranked = axes
    .map(({ key }) => ({ key, step: perks[key] ?? 0 }))
    .toSorted((a, b) => b.step - a.step);
  const best = ranked.at(0);
  const worst = ranked.at(-1);
  return {
    ...(best !== undefined && best.step > 0 && { [best.key]: best.step }),
    ...(worst !== undefined && worst.step < 0 && { [worst.key]: worst.step }),
  };
};

export const nameOf = ({ color, form }: Stone) => {
  const combo = comboOf({ color, form });
  const base = `${colorOf(color).name}の${formOf(form).name}`;
  return combo === null ? base : `${combo.name}（${base}）`;
};

const known = (options: Option[], id: string | undefined) =>
  options.some((option) => option.id === id);

export const stoneFrom = (code: string): Stone | null => {
  const [color, form] = code.split(".");
  return color !== undefined &&
    form !== undefined &&
    known(colors, color) &&
    known(forms, form)
    ? { color, form }
    : null;
};

export const codeOf = ({ color, form }: Stone) => `${color}.${form}`;
