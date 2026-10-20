import { z } from "zod";

import {
  colorOf,
  comboOf,
  combos,
  firstLook,
  formOf,
  isOpen,
  keyOf,
  opened,
  parts,
} from "./cosmetics";
import type { Item, Look, Part, Progress } from "./cosmetics";
import { langs } from "./i18n";
import type { Text } from "./i18n";
import { zoneIndex } from "./simulate";
import type { Flight, Gear } from "./simulate";

const KEY = "mizukiri.v3";
const level = z.number().int().min(0).max(9999);

const schema = z.object({
  best: z.number().min(0),
  combo: z.number().int().min(0),
  divine: z.boolean(),
  found: z.array(z.string()).default([]),
  gear: z.object({
    focus: level,
    impact: level.default(0),
    lift: level.default(0),
    power: level,
    stone: level,
  }),
  look: z.object({
    color: z.string(),
    form: z.string(),
    pattern: z.string(),
    trail: z.string(),
  }),
  runs: z.number().int().min(0),
  settings: z
    .object({
      lang: z.enum(langs).nullable().default(null),
      muted: z.boolean(),
    })
    .default({ lang: null, muted: false }),
  unseen: z.array(z.string()).default([]),
  xp: z.number().min(0),
});

export type Settings = Save["settings"];

export type Save = z.infer<typeof schema>;

const fresh: Save = {
  best: 0,
  combo: 0,
  divine: false,
  found: [],
  gear: { focus: 0, impact: 0, lift: 0, power: 0, stone: 0 },
  look: firstLook,
  runs: 0,
  settings: { lang: null, muted: false },
  unseen: [],
  xp: 0,
};

export const loadSave = (): Save => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) {
      return fresh;
    }
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : fresh;
  } catch {
    return fresh;
  }
};

export const storeSave = (save: Save) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
};

export const skills: { key: keyof Gear; name: Text; note: Text }[] = [
  {
    key: "power",
    name: { en: "Arm", ja: "腕力" },
    note: { en: "Higher launch and top speed", ja: "初速と最高速が上がる" },
  },
  {
    key: "stone",
    name: { en: "Flat stone", ja: "平たい石" },
    note: { en: "Lose less speed on a miss", ja: "ミスしても失速しにくい" },
  },
  {
    key: "lift",
    name: { en: "Lift", ja: "跳ね上げ" },
    note: {
      en: "Bounces higher and flies longer",
      ja: "石が高く跳ねて長く飛ぶ",
    },
  },
  {
    key: "focus",
    name: { en: "Focus", ja: "集中" },
    note: { en: "Wider tap timing", ja: "タップの猶予が広がる" },
  },
  {
    key: "impact",
    name: { en: "Aim", ja: "当て勘" },
    note: {
      en: "More boost from ducks and carp",
      ja: "カモや鯉に当たった時の加速が上がる",
    },
  },
];

const needFor = (target: number) => Math.round(150 * target ** 1.8);

export const progressOf = (xp: number) => {
  let reached = 0;
  while (xp >= needFor(reached + 1)) {
    reached += 1;
  }
  const floor = needFor(reached);
  const ceiling = needFor(reached + 1);
  return { level: reached, part: (xp - floor) / (ceiling - floor) };
};

export const unlocksOf = (save: Save): Progress => ({
  combo: save.combo,
  divine: save.divine,
  level: progressOf(save.xp).level,
  zone: zoneIndex(save.best),
});

export const pointsLeft = (save: Save) =>
  Math.max(
    0,
    progressOf(save.xp).level -
      Object.values(save.gear).reduce((sum, points) => sum + points, 0)
  );

export const tune = (
  save: Save,
  key: keyof Gear,
  step: 1 | -1
): Save | null => {
  if (step === 1 && pointsLeft(save) <= 0) {
    return null;
  }
  if (step === -1 && save.gear[key] === 0) {
    return null;
  }
  return { ...save, gear: { ...save.gear, [key]: save.gear[key] + step } };
};

export const respec = (save: Save): Save => ({
  ...save,
  gear: { focus: 0, impact: 0, lift: 0, power: 0, stone: 0 },
});

export const wear = (save: Save, part: Part, id: string): Save | null => {
  const option = parts
    .find((entry) => entry.part === part)
    ?.options.find((entry) => entry.id === id);
  if (
    !option ||
    !isOpen(option.unlock, unlocksOf(save)) ||
    save.look[part] === id
  ) {
    return null;
  }
  const look: Look = { ...save.look, [part]: id };
  const combo = comboOf(look);
  const found =
    combo === null || save.found.includes(combo.id)
      ? save.found
      : [...save.found, combo.id];
  return { ...save, found, look };
};

export const wearCombo = (save: Save, id: string): Save | null => {
  const entry = combos.find((combo) => combo.id === id);
  if (!entry || !save.found.includes(id) || comboOf(save.look)?.id === id) {
    return null;
  }
  const unlocked = unlocksOf(save);
  if (
    !isOpen(colorOf(entry.color).unlock, unlocked) ||
    !isOpen(formOf(entry.form).unlock, unlocked)
  ) {
    return null;
  }
  return {
    ...save,
    look: { ...save.look, color: entry.color, form: entry.form },
  };
};

export const settle = (save: Save, flight: Flight) => {
  const gained = Math.round(
    flight.distance * 0.5 +
      flight.skips * 2 +
      flight.bestCombo * 5 +
      (flight.quality >= 90 ? 40 : 0) +
      (flight.quality === 100 ? 160 : 0)
  );
  const next: Save = {
    ...save,
    best: Math.max(save.best, flight.distance),
    combo: Math.max(save.combo, flight.bestCombo),
    divine: save.divine || flight.quality === 100,
    runs: save.runs + 1,
    xp: save.xp + gained,
  };
  const before = new Set(opened(unlocksOf(save)).map(keyOf));
  const unlocked: Item[] = opened(unlocksOf(next)).filter(
    (item) => !before.has(keyOf(item))
  );
  return {
    gained,
    climbed: progressOf(next.xp).level - progressOf(save.xp).level,
    record: flight.distance > save.best,
    save: { ...next, unseen: [...save.unseen, ...unlocked.map(keyOf)] },
    unlocked,
  };
};

export const seen = (save: Save): Save | null =>
  save.unseen.length === 0 ? null : { ...save, unseen: [] };
