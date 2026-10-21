import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { dateOf, dayFrom } from "./daily";
import type { Plan } from "./result";

const KEY = "ma.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);
const closest = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: z.object({ daily: closest, standard: closest }).prefault({}),
  daily: z
    .object({
      last: z.iso.date().nullable().default(null),
      longest: count,
      played: count,
      streak: count,
      time: z.number().int().min(0).nullable().default(null),
    })
    .prefault({}),
  drift: z.number().int().default(0),
  error: count,
  firstPlayed: moment,
  lastPlayed: moment,
  perfect: count,
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
  time: number;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

const lastDay = (save: Save) =>
  save.daily.last === null ? null : dayFrom(save.daily.last);

export const officialOf = (save: Save, day: number | null) =>
  day !== null && lastDay(save) === day && save.daily.time !== null
    ? { day, time: save.daily.time }
    : null;

export const streakOn = (save: Save, today: number) => {
  const last = lastDay(save);
  return last !== null && last >= today - 1 ? save.daily.streak : 0;
};

const dailyOf = (save: Save, day: number, time: number) => {
  const streak = lastDay(save) === day - 1 ? save.daily.streak + 1 : 1;
  return {
    last: dateOf(day),
    longest: Math.max(save.daily.longest, streak),
    played: save.daily.played + 1,
    streak,
    time,
  };
};

export const settle = (save: Save, { plan, time, seconds, at }: Run) => {
  const gap = time - plan.target;
  const off = Math.abs(gap);
  const kind = plan.day === null ? "standard" : "daily";
  const previous = save.best[kind];
  const official =
    plan.today && plan.day !== null && (lastDay(save) ?? 0) < plan.day
      ? plan.day
      : null;
  return {
    official: official !== null,
    record: previous !== null && off < previous,
    save: {
      best: { ...save.best, [kind]: Math.min(previous ?? off, off) },
      daily: official === null ? save.daily : dailyOf(save, official, time),
      drift: save.drift + gap,
      error: save.error + off,
      firstPlayed: save.firstPlayed ?? at,
      lastPlayed: at,
      perfect: save.perfect + (off === 0 ? 1 : 0),
      runs: save.runs + 1,
      seconds: tenth(save.seconds + seconds),
    },
  };
};
