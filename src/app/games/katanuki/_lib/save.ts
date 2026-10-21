import { z } from "zod";

import { dateOf, dayFrom } from "../../_lib/day";
import { createStore } from "../../_lib/storage";
import { mouldOf } from "./moulds";
import { LONGEST, PERFECT, rankOf } from "./result";
import type { Plan, Result } from "./result";

const KEY = "katanuki.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: z.record(z.string(), z.number().int().min(1).max(LONGEST)).default({}),
  breaks: count,
  clears: count,
  cracks: count,
  daily: z
    .object({
      carved: z.number().int().min(0).max(100).nullable().default(null),
      last: z.iso.date().nullable().default(null),
      longest: count,
      played: count,
      streak: count,
      time: z.number().int().min(1).max(LONGEST).nullable().default(null),
    })
    .prefault({}),
  divine: count,
  firstPlayed: moment,
  lastPlayed: moment,
  notches: count,
  runs: count,
  seconds: z.number().min(0).default(0),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

interface Run {
  plan: Plan;
  result: Result;
  notches: number;
  cracks: number;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

const lastDay = (save: Save) =>
  save.daily.last === null ? null : dayFrom(save.daily.last);

export const officialOf = (save: Save, day: number): Result | null =>
  lastDay(save) === day && save.daily.carved !== null
    ? { carved: save.daily.carved, day, time: save.daily.time }
    : null;

export const streakOn = (save: Save, today: number) => {
  const last = lastDay(save);
  return last !== null && last >= today - 1 ? save.daily.streak : 0;
};

const dailyOf = (save: Save, result: Result) => {
  const streak = lastDay(save) === result.day - 1 ? save.daily.streak + 1 : 1;
  return {
    carved: result.carved,
    last: dateOf(result.day),
    longest: Math.max(save.daily.longest, streak),
    played: save.daily.played + 1,
    streak,
    time: result.time,
  };
};

const bestOf = (save: Save, result: Result) => {
  const { id } = mouldOf(result.day);
  const previous = save.best[id] ?? null;
  if (result.time === null) {
    return { best: save.best, record: false };
  }
  return {
    best: {
      ...save.best,
      [id]: Math.min(previous ?? result.time, result.time),
    },
    record: previous !== null && result.time < previous,
  };
};

export const settle = (
  save: Save,
  { plan, result, notches, cracks, seconds, at }: Run
) => {
  const official = plan.today && (lastDay(save) ?? 0) < plan.day;
  const cleared = result.time !== null;
  const { best, record } = bestOf(save, result);
  return {
    official,
    record,
    save: {
      best,
      breaks: save.breaks + (cleared ? 0 : 1),
      clears: save.clears + (cleared ? 1 : 0),
      cracks: save.cracks + cracks,
      daily: official ? dailyOf(save, result) : save.daily,
      divine: save.divine + (rankOf(result).level === PERFECT ? 1 : 0),
      firstPlayed: save.firstPlayed ?? at,
      lastPlayed: at,
      notches: save.notches + notches,
      runs: save.runs + 1,
      seconds: tenth(save.seconds + seconds),
    },
  };
};
