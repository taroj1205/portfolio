import { z } from "zod";

import { createStore } from "../../_lib/storage";
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
import type { Combo, Item, Part, Progress } from "./cosmetics";
import { endings, events, grades, topSpeed, zoneIndex } from "./simulate";
import type { Flight, Gear } from "./simulate";

const KEY = "mizukiri.v3";
const level = z.number().int().min(0).max(9999);
const count = z.number().int().min(0);

const tally = z.object({
  airtime: z.number().min(0).default(0),
  bestAirtime: z.number().min(0).default(0),
  bestSkips: count.default(0),
  bestSpeed: z.number().min(0).default(0),
  distance: z.number().min(0).default(0),
  divineThrows: count.default(0),
  endings: z.partialRecord(z.enum(endings), count).default({}),
  events: z.partialRecord(z.enum(events), count).default({}),
  grades: z.partialRecord(z.enum(grades), count).default({}),
  quality: z.number().min(0).default(0),
  skips: count.default(0),
});

const schema = z
  .object({
    best: z.number().min(0),
    combo: z.number().int().min(0),
    divine: z.boolean(),
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
    tally: tally.prefault({}),
    unseen: z.array(z.string()).default([]),
    xp: z.number().min(0),
  })
  .transform((save) => ({
    ...save,
    tally: {
      ...save.tally,
      distance: Math.max(save.tally.distance, save.best),
    },
  }));

export type Save = z.infer<typeof schema>;

type Tally = Save["tally"];

const fresh: Save = {
  best: 0,
  combo: 0,
  divine: false,
  gear: { focus: 0, impact: 0, lift: 0, power: 0, stone: 0 },
  look: firstLook,
  runs: 0,
  tally: tally.parse({}),
  unseen: [],
  xp: 0,
};

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

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
  return { ...save, look: { ...save.look, [part]: id } };
};

export const foundOf = (save: Save): Combo[] => {
  const unlocked = unlocksOf(save);
  return combos.filter(
    ({ color, form }) =>
      isOpen(colorOf(color).unlock, unlocked) &&
      isOpen(formOf(form).unlock, unlocked)
  );
};

export const wearCombo = (save: Save, id: string): Save | null => {
  const entry = foundOf(save).find((combo) => combo.id === id);
  if (!entry || comboOf(save.look)?.id === id) {
    return null;
  }
  return {
    ...save,
    look: { ...save.look, color: entry.color, form: entry.form },
  };
};

const counted = <Key extends string>(
  counts: Partial<Record<Key, number>>,
  keys: Key[]
) => {
  const next = { ...counts };
  for (const key of keys) {
    next[key] = (next[key] ?? 0) + 1;
  }
  return next;
};

const tallied = (before: Tally, flight: Flight): Tally => ({
  airtime: before.airtime + flight.duration,
  bestAirtime: Math.max(before.bestAirtime, flight.duration),
  bestSkips: Math.max(before.bestSkips, flight.skips),
  bestSpeed: Math.max(before.bestSpeed, topSpeed(flight)),
  distance: before.distance + flight.distance,
  divineThrows: before.divineThrows + (flight.quality === 100 ? 1 : 0),
  endings: counted(before.endings, [flight.ending ?? "sink"]),
  events: counted(
    before.events,
    flight.splashes.flatMap(({ event }) => (event === null ? [] : [event]))
  ),
  grades: counted(
    before.grades,
    flight.splashes.flatMap(({ grade }) => (grade === null ? [] : [grade]))
  ),
  quality: before.quality + flight.quality,
  skips: before.skips + flight.skips,
});

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
    tally: tallied(save.tally, flight),
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
