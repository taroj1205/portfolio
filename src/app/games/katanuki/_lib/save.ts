import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { LONGEST, PERFECT, rankOf } from "./result";
import type { Result } from "./result";

const KEY = "katanuki.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: z.record(z.string(), z.number().int().min(1).max(LONGEST)).default({}),
  breaks: count,
  clears: count,
  cracks: count,
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
  result: Result;
  notches: number;
  cracks: number;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

const bestOf = (save: Save, { mould, time }: Result) => {
  const previous = save.best[mould] ?? null;

  if (time === null) {
    return { best: save.best, record: false };
  }

  return {
    best: { ...save.best, [mould]: Math.min(previous ?? time, time) },
    record: previous !== null && time < previous,
  };
};

export const settle = (
  save: Save,
  { result, notches, cracks, seconds, at }: Run
) => {
  const cleared = result.time !== null;
  const { best, record } = bestOf(save, result);

  return {
    record,
    save: {
      best,
      breaks: save.breaks + (cleared ? 0 : 1),
      clears: save.clears + (cleared ? 1 : 0),
      cracks: save.cracks + cracks,
      divine: save.divine + (rankOf(result).level === PERFECT ? 1 : 0),
      firstPlayed: save.firstPlayed ?? at,
      lastPlayed: at,
      notches: save.notches + notches,
      runs: save.runs + 1,
      seconds: tenth(save.seconds + seconds),
    },
  };
};
