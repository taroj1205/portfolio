import { z } from "zod";

import { firstLook, isOpen, opened, parts } from "./cosmetics";
import type { Look, Option, Part, Progress } from "./cosmetics";
import { zoneIndex } from "./simulate";
import type { Flight, Gear } from "./simulate";

const KEY = "mizukiri.v3";
const level = z.number().int().min(0).max(9999);

const schema = z.object({
  best: z.number().min(0),
  combo: z.number().int().min(0),
  divine: z.boolean(),
  gear: z.object({ focus: level, power: level, stone: level }),
  look: z.object({
    color: z.string(),
    form: z.string(),
    pattern: z.string(),
    trail: z.string(),
  }),
  runs: z.number().int().min(0),
  xp: z.number().min(0),
});

export type Save = z.infer<typeof schema>;

const fresh: Save = {
  best: 0,
  combo: 0,
  divine: false,
  gear: { focus: 0, power: 0, stone: 0 },
  look: firstLook,
  runs: 0,
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

export const skills = [
  { key: "power", name: "腕力", note: "初速と最高速が上がる" },
  { key: "stone", name: "平たい石", note: "ミスしても失速しにくい" },
  { key: "focus", name: "集中", note: "タップの猶予が広がる" },
] as const satisfies readonly { key: keyof Gear; name: string; note: string }[];

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
      save.gear.power -
      save.gear.stone -
      save.gear.focus
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
  return { ...save, look };
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
  const before = new Set(opened(unlocksOf(save)).map((option) => option.id));
  const unlocked: Option[] = opened(unlocksOf(next)).filter(
    (option) => !before.has(option.id)
  );
  return {
    gained,
    climbed: progressOf(next.xp).level - progressOf(save.xp).level,
    record: flight.distance > save.best,
    save: next,
    unlocked,
  };
};
