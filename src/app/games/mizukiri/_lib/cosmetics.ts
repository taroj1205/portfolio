import type { Lang, Text } from "../../_lib/i18n";

export interface Option {
  id: string;
  name: Text;
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
    name: { en: "River", ja: "川石" },
  },
  {
    gloss: 0.55,
    glow: null,
    id: "slate",
    metal: false,
    mineral: ["#7a7f86", "#3a3d43", "#141518"],
    name: { en: "Black", ja: "黒" },
  },
  {
    gloss: 0.45,
    glow: null,
    id: "rose",
    metal: false,
    mineral: ["#f3d2c8", "#c98b7c", "#6e3e35"],
    name: { en: "Blush", ja: "桜色" },
  },
  {
    gloss: 0.95,
    glow: "#d6f6ff",
    id: "ice",
    metal: false,
    mineral: ["#eef9ff", "#9fd3ea", "#3f7f9c"],
    name: { en: "Ice", ja: "氷" },
  },
  {
    gloss: 0.8,
    glow: "#7dffb5",
    id: "jade",
    metal: false,
    mineral: ["#d4f7e0", "#4fae7c", "#1d5a3c"],
    name: { en: "Jade", ja: "翡翠" },
  },
  {
    gloss: 0.85,
    glow: "#ffb347",
    id: "amber",
    metal: false,
    mineral: ["#ffe2a8", "#d98a2b", "#6b3410"],
    name: { en: "Amber", ja: "琥珀" },
  },
  {
    gloss: 0.9,
    glow: "#ffd27a",
    id: "gold",
    metal: true,
    mineral: ["#fff4c2", "#e8b84a", "#7a4e0e"],
    name: { en: "Gold", ja: "金" },
  },
  {
    gloss: 0.5,
    glow: "#ff7a3a",
    id: "meteor",
    metal: true,
    mineral: ["#5a4e48", "#2a2220", "#0e0b0a"],
    name: { en: "Meteorite", ja: "隕石" },
  },
  {
    gloss: 0.7,
    glow: "#7aa8ff",
    id: "lapis",
    metal: false,
    mineral: ["#c9d8ff", "#3f5fc4", "#16224f"],
    name: { en: "Lapis", ja: "瑠璃" },
  },
  {
    gloss: 0.45,
    glow: null,
    id: "coral",
    metal: false,
    mineral: ["#ffd8cc", "#f08a6e", "#8a3424"],
    name: { en: "Coral", ja: "珊瑚" },
  },
  {
    gloss: 1,
    glow: "#ffffff",
    id: "crystal",
    metal: false,
    mineral: ["#ffffff", "#d6e4f0", "#8ea4ba"],
    name: { en: "Crystal", ja: "水晶" },
  },
  {
    gloss: 0.95,
    glow: "#b46bff",
    id: "obsidian",
    metal: false,
    mineral: ["#6a6478", "#24202c", "#08070b"],
    name: { en: "Obsidian", ja: "黒曜石" },
  },
  {
    gloss: 0.3,
    glow: "#fff6c8",
    id: "moon",
    metal: false,
    mineral: ["#fbf6e4", "#c9c2a8", "#6e6a5c"],
    name: { en: "Moonstone", ja: "月の石" },
  },
];

const forms: Option[] = [
  {
    id: "oval",
    name: { en: "Egg", ja: "たまご" },
  },
  {
    id: "round",
    name: { en: "Round", ja: "まんまる" },
  },
  {
    id: "flat",
    name: { en: "Flat", ja: "ひらべったい" },
  },
  {
    id: "drop",
    name: { en: "Drop", ja: "しずく" },
  },
  {
    id: "square",
    name: { en: "Square", ja: "かくいし" },
  },
  {
    id: "leaf",
    name: { en: "Leaf", ja: "このは" },
  },
  {
    id: "triangle",
    name: { en: "Onigiri", ja: "おにぎり" },
  },
  {
    id: "heart",
    name: { en: "Heart", ja: "ハート" },
  },
  {
    id: "bean",
    name: { en: "Bean", ja: "まめ" },
  },
  {
    id: "crescent",
    name: { en: "Crescent", ja: "みかづき" },
  },
  {
    id: "star",
    name: { en: "Star", ja: "ほし" },
  },
  {
    id: "gourd",
    name: { en: "Gourd", ja: "ひょうたん" },
  },
  {
    id: "diamond",
    name: { en: "Diamond", ja: "ひしがた" },
  },
  {
    id: "fan",
    name: { en: "Fan", ja: "おうぎ" },
  },
  {
    id: "fish",
    name: { en: "Fish", ja: "さかな" },
  },
  {
    id: "shell",
    name: { en: "Hexagon", ja: "きっこう" },
  },
];

const patterns: Option[] = [
  { id: "plain", name: { en: "Plain", ja: "無地" } },
  {
    id: "stripe",
    name: { en: "Stripes", ja: "縞" },
  },
  {
    id: "speckle",
    name: { en: "Speckled", ja: "まだら" },
  },
  {
    id: "ring",
    name: { en: "Ring", ja: "輪っか" },
  },
  {
    id: "wave",
    name: { en: "Seigaiha", ja: "青海波" },
  },
  {
    id: "checker",
    name: { en: "Ichimatsu", ja: "市松" },
  },
  {
    id: "dots",
    name: { en: "Polka dots", ja: "水玉" },
  },
  {
    id: "mended",
    name: { en: "Kintsugi", ja: "金継ぎ" },
  },
];

const trails: Option[] = [
  {
    id: "spray",
    name: { en: "Spray", ja: "水しぶき" },
  },
  {
    id: "gold",
    name: { en: "Gold dust", ja: "金粉" },
  },
  {
    id: "sakura",
    name: { en: "Cherry petals", ja: "桜吹雪" },
  },
  {
    id: "fox",
    name: { en: "Foxfire", ja: "狐火" },
  },
  {
    id: "rainbow",
    name: { en: "Rainbow", ja: "虹" },
  },
  {
    id: "ink",
    name: { en: "Ink", ja: "墨" },
  },
  {
    id: "bubble",
    name: { en: "Bubbles", ja: "泡" },
  },
  {
    id: "comet",
    name: { en: "Meteors", ja: "流星" },
  },
];

export const parts: { part: Part; name: Text; options: Option[] }[] = [
  { name: { en: "Stone", ja: "石の種類" }, options: colors, part: "color" },
  { name: { en: "Shape", ja: "形" }, options: forms, part: "form" },
  { name: { en: "Pattern", ja: "模様" }, options: patterns, part: "pattern" },
  { name: { en: "Trail", ja: "軌跡" }, options: trails, part: "trail" },
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

export interface Combo {
  id: string;
  name: Text;
  color: string;
  form: string;
}

export const combos: Combo[] = [
  {
    color: "slate",
    form: "flat",
    id: "go",
    name: { en: "Go stone", ja: "碁石" },
  },
  {
    color: "jade",
    form: "bean",
    id: "jewel",
    name: { en: "Magatama", ja: "勾玉" },
  },
  {
    color: "gold",
    form: "star",
    id: "venus",
    name: { en: "Evening star", ja: "一番星" },
  },
  {
    color: "rose",
    form: "leaf",
    id: "petal",
    name: { en: "Petal", ja: "花びら" },
  },
  {
    color: "meteor",
    form: "drop",
    id: "shooting",
    name: { en: "Shooting star", ja: "流れ星" },
  },
  {
    color: "rose",
    form: "heart",
    id: "love",
    name: { en: "Love stone", ja: "恋の石" },
  },
  {
    color: "gold",
    form: "gourd",
    id: "gourds",
    name: { en: "Gourd standard", ja: "千成瓢箪" },
  },
  {
    color: "ice",
    form: "crescent",
    id: "moon",
    name: { en: "Ice moon", ja: "氷の月" },
  },
  {
    color: "amber",
    form: "triangle",
    id: "grilled",
    name: { en: "Grilled onigiri", ja: "焼きおにぎり" },
  },
  {
    color: "coral",
    form: "star",
    id: "starfish",
    name: { en: "Starfish", ja: "ヒトデ" },
  },
  {
    color: "crystal",
    form: "drop",
    id: "tear",
    name: { en: "Teardrop", ja: "涙" },
  },
  {
    color: "moon",
    form: "crescent",
    id: "lunar",
    name: { en: "Crescent moon", ja: "三日月" },
  },
  {
    color: "obsidian",
    form: "diamond",
    id: "arrow",
    name: { en: "Arrowhead", ja: "矢じり" },
  },
  {
    color: "ice",
    form: "star",
    id: "flake",
    name: { en: "Snowflake", ja: "雪の結晶" },
  },
  {
    color: "rose",
    form: "fan",
    id: "blossom",
    name: { en: "Flower fan", ja: "花扇" },
  },
  {
    color: "jade",
    form: "shell",
    id: "turtle",
    name: { en: "Ancient turtle", ja: "万年亀" },
  },
  {
    color: "amber",
    form: "drop",
    id: "sap",
    name: { en: "Sap", ja: "樹液" },
  },
  {
    color: "gold",
    form: "fish",
    id: "goldfish",
    name: { en: "Goldfish", ja: "金魚" },
  },
];

export const comboOf = ({ color, form }: Stone) =>
  combos.find((combo) => combo.color === color && combo.form === form) ?? null;

export const nameOf = ({ color, form }: Stone, lang: Lang) => {
  const combo = comboOf({ color, form });
  const kind = colorOf(color).name[lang];
  const cut = formOf(form).name[lang];
  const base = lang === "en" ? `${kind} ${cut}` : `${kind}の${cut}`;
  if (combo === null) {
    return base;
  }
  return lang === "en"
    ? `${combo.name.en} (${base})`
    : `${combo.name.ja}（${base}）`;
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
