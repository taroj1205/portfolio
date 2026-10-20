import { z } from "zod";

import { langs } from "../../_lib/i18n";
import { createStore } from "../../_lib/storage";
import { comboOf, firstLook, parts } from "./cosmetics";
import type { Part } from "./cosmetics";
import { foundOf, isUnlocked, noGear } from "./journey";
import { endings, events, grades, topSpeed } from "./simulate";
import type { Flight } from "./simulate";
import { flatTuning, tuningOrFlat } from "./tuning";

const KEY = "mizukiri.v4";
const LEGACY_KEY = "mizukiri.v3";
const count = z.number().int().min(0);
const level = z.number().int().min(0).max(9999);

export const modes = ["duel", "journey"] as const;

export type Mode = (typeof modes)[number];

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

const settings = z
  .object({
    lang: z.enum(langs).nullable().default(null),
    muted: z.boolean(),
  })
  .default({ lang: null, muted: false });

const profile = z.object({
  best: z.number().min(0),
  combo: z.number().int().min(0),
  divine: z.boolean(),
  look: z.object({
    color: z.string(),
    form: z.string(),
    pattern: z.string(),
    trail: z.string(),
  }),
  runs: z.number().int().min(0),
  tally: tally.prefault({}),
});

const training = {
  gear: z.object({
    focus: level,
    impact: level.default(0),
    lift: level.default(0),
    power: level,
    stone: level,
  }),
  unseen: z.array(z.string()).default([]),
  xp: z.number().min(0),
};

const countsBest = <T extends { best: number; tally: { distance: number } }>(
  entry: T
): T => ({
  ...entry,
  tally: {
    ...entry.tally,
    distance: Math.max(entry.tally.distance, entry.best),
  },
});

const profiles = z.object({
  duel: profile.extend({ tuning: tuningOrFlat }).transform(countsBest),
  journey: profile.extend(training).transform(countsBest),
  mode: z.enum(modes),
  settings,
});

const legacy = profile.extend({ ...training, settings }).transform(countsBest);

export type Profiles = z.infer<typeof profiles>;

export type Settings = Profiles["settings"];

export type DuelSave = Profiles["duel"] & { mode: "duel"; settings: Settings };

export type JourneySave = Profiles["journey"] & {
  mode: "journey";
  settings: Settings;
};

export type Save = DuelSave | JourneySave;

type Tally = Save["tally"];

const freshProfile = {
  best: 0,
  combo: 0,
  divine: false,
  look: firstLook,
  runs: 0,
  tally: tally.parse({}),
};

const fresh: Profiles = {
  duel: { ...freshProfile, tuning: flatTuning },
  journey: { ...freshProfile, gear: noGear, unseen: [], xp: 0 },
  mode: "duel",
  settings: { lang: null, muted: false },
};

const current = createStore<Profiles | null>(KEY, profiles.nullable(), null);

const previous = createStore<z.infer<typeof legacy> | null>(
  LEGACY_KEY,
  legacy.nullable(),
  null
);

const carriedOver = (older: z.infer<typeof legacy>): Profiles => {
  const { settings: kept, ...journey } = older;
  return {
    duel: { ...fresh.duel, look: older.look },
    journey,
    mode: "journey",
    settings: kept,
  };
};

export const loadProfiles = (): Profiles => {
  const saved = current.read();
  if (saved !== null) {
    return saved;
  }
  const older = previous.read();
  return older === null ? fresh : carriedOver(older);
};

export const storeProfiles = current.write;

export const viewOf = (all: Profiles): Save =>
  all.mode === "duel"
    ? { ...all.duel, mode: "duel", settings: all.settings }
    : { ...all.journey, mode: "journey", settings: all.settings };

export const withView = (all: Profiles, view: Save): Profiles => {
  if (view.mode === "duel") {
    const { mode: _mode, settings: kept, ...duel } = view;
    return { ...all, duel, settings: kept };
  }
  const { mode: _mode, settings: kept, ...journey } = view;
  return { ...all, journey, settings: kept };
};

export const wear = <S extends Save>(
  save: S,
  part: Part,
  id: string
): S | null => {
  const option = parts
    .find((entry) => entry.part === part)
    ?.options.find((entry) => entry.id === id);
  if (
    option === undefined ||
    save.look[part] === id ||
    (save.mode === "journey" && !isUnlocked(save, part, option))
  ) {
    return null;
  }
  return { ...save, look: { ...save.look, [part]: id } };
};

export const wearCombo = (
  save: JourneySave,
  id: string
): JourneySave | null => {
  const entry = foundOf(save).find((combo) => combo.id === id);
  if (!entry || comboOf(save.look)?.id === id) {
    return null;
  }
  return {
    ...save,
    look: { ...save.look, color: entry.color, form: entry.form },
  };
};

export const seen = (save: JourneySave): JourneySave | null =>
  save.unseen.length === 0 ? null : { ...save, unseen: [] };

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

export const settle = <S extends Save>(save: S, flight: Flight) => ({
  record: flight.distance > save.best,
  save: {
    ...save,
    best: Math.max(save.best, flight.distance),
    combo: Math.max(save.combo, flight.bestCombo),
    divine: save.divine || flight.quality === 100,
    runs: save.runs + 1,
    tally: tallied(save.tally, flight),
  },
});
