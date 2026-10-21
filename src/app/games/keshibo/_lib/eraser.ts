import { z } from "zod";

import type { Text } from "../../_lib/i18n";
import { speedOf } from "./physics";

export const formIds = ["standard", "long", "cube", "jumbo"] as const;
export const coreIds = ["soft", "normal", "hard"] as const;
export const sleeveIds = [
  "blue",
  "red",
  "green",
  "yellow",
  "black",
  "pink",
] as const;
export const patternIds = ["bands", "plain", "dots", "check"] as const;
export const rubberIds = ["white", "sakura", "sky", "lemon"] as const;

export type FormId = (typeof formIds)[number];
export type CoreId = (typeof coreIds)[number];
export type SleeveId = (typeof sleeveIds)[number];
export type PatternId = (typeof patternIds)[number];
export type RubberId = (typeof rubberIds)[number];

export interface Size {
  w: number;
  d: number;
  h: number;
}

export const forms: Record<FormId, Size & { name: Text }> = {
  cube: { d: 2.6, h: 2.6, name: { en: "Dice", ja: "サイコロ" }, w: 2.6 },
  jumbo: { d: 3, h: 1.4, name: { en: "Jumbo", ja: "ジャンボ" }, w: 6 },
  long: { d: 1.6, h: 1, name: { en: "Slim", ja: "ほそなが" }, w: 6.4 },
  standard: { d: 2.2, h: 1.2, name: { en: "Classic", ja: "ふつう" }, w: 4.4 },
};

export const cores: Record<
  CoreId,
  { name: Text; density: number; grip: number; bounce: number }
> = {
  hard: {
    bounce: 0.55,
    density: 1.65,
    grip: 0.17,
    name: { en: "Hard", ja: "かため" },
  },
  normal: {
    bounce: 0.3,
    density: 1.4,
    grip: 0.24,
    name: { en: "Regular", ja: "ふつう" },
  },
  soft: {
    bounce: 0.1,
    density: 1.2,
    grip: 0.32,
    name: { en: "Soft", ja: "やわらか" },
  },
};

export const sleeves: Record<SleeveId, { name: Text; color: string }> = {
  black: { color: "#23232a", name: { en: "Black", ja: "くろ" } },
  blue: { color: "#2052b0", name: { en: "Blue", ja: "あお" } },
  green: { color: "#2e7a4e", name: { en: "Green", ja: "みどり" } },
  pink: { color: "#e3859f", name: { en: "Pink", ja: "ピンク" } },
  red: { color: "#c3343b", name: { en: "Red", ja: "あか" } },
  yellow: { color: "#e6ad24", name: { en: "Yellow", ja: "きいろ" } },
};

export const patterns: Record<PatternId, { name: Text }> = {
  bands: { name: { en: "Stripes", ja: "三色" } },
  check: { name: { en: "Check", ja: "チェック" } },
  dots: { name: { en: "Dots", ja: "水玉" } },
  plain: { name: { en: "Plain", ja: "無地" } },
};

export const rubbers: Record<RubberId, { name: Text; color: string }> = {
  lemon: { color: "#f2e9b8", name: { en: "Lemon", ja: "レモン" } },
  sakura: { color: "#f5d0d6", name: { en: "Cherry", ja: "さくら" } },
  sky: { color: "#d3e3f1", name: { en: "Soda", ja: "ソーダ" } },
  white: { color: "#f3f0e8", name: { en: "White", ja: "しろ" } },
};

const option = <Id extends string>(ids: readonly Id[], fallback: Id) =>
  z
    .string()
    .default(fallback)
    .transform((value) => ids.find((id) => id === value) ?? fallback);

export const designSchema = z.object({
  core: option(coreIds, "normal"),
  form: option(formIds, "standard"),
  pattern: option(patternIds, "bands"),
  rubber: option(rubberIds, "white"),
  sleeve: option(sleeveIds, "blue"),
});

export type Design = z.infer<typeof designSchema>;

export const firstDesign: Design = designSchema.parse({});

const digit = (ids: readonly string[], id: string) => String(ids.indexOf(id));

export const codeOf = (design: Design) =>
  [
    digit(formIds, design.form),
    digit(coreIds, design.core),
    digit(sleeveIds, design.sleeve),
    digit(patternIds, design.pattern),
    digit(rubberIds, design.rubber),
  ].join("");

const at = <Id extends string>(ids: readonly Id[], code: string, i: number) =>
  ids.at(Number(code[i]));

export const designFrom = (code: string): Design | null => {
  if (!/^\d{5}$/u.test(code)) {
    return null;
  }
  const design = {
    core: at(coreIds, code, 1),
    form: at(formIds, code, 0),
    pattern: at(patternIds, code, 3),
    rubber: at(rubberIds, code, 4),
    sleeve: at(sleeveIds, code, 2),
  };
  return Object.values(design).includes(undefined)
    ? null
    : designSchema.parse(design);
};

export interface Body extends Size {
  mass: number;
  grip: number;
  bounce: number;
}

export const bodyOf = (design: Design): Body => {
  const size = forms[design.form];
  const core = cores[design.core];
  return {
    bounce: core.bounce,
    d: size.d,
    grip: core.grip,
    h: size.h,
    mass: size.w * size.d * size.h * core.density,
    w: size.w,
  };
};

const span = (values: number[]) => ({
  max: Math.max(...values),
  min: Math.min(...values),
});

const everyBody = formIds.flatMap((form) =>
  coreIds.map((core) => bodyOf({ ...firstDesign, core, form }))
);

const ranges = {
  bounce: span(everyBody.map((body) => body.bounce)),
  speed: span(everyBody.map((body) => speedOf(body, 1))),
  mass: span(everyBody.map((body) => body.mass)),
  width: span(everyBody.map((body) => body.w)),
};

const level = (value: number, { min, max }: { min: number; max: number }) =>
  Math.round(20 + (80 * (value - min)) / (max - min));

export const statKeys = ["mass", "width", "speed", "bounce"] as const;

export type StatKey = (typeof statKeys)[number];

export const statsOf = (design: Design): Record<StatKey, number> => {
  const body = bodyOf(design);
  return {
    bounce: level(body.bounce, ranges.bounce),
    speed: level(speedOf(body, 1), ranges.speed),
    mass: level(body.mass, ranges.mass),
    width: level(body.w, ranges.width),
  };
};
