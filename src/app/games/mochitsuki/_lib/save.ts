import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { PERFECT, rankOf } from "./result";
import type { Result } from "./result";

const KEY = "mochitsuki.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: count,
  firstPlayed: moment,
  greats: count,
  lastPlayed: moment,
  lightning: count,
  longest: count,
  ouches: count,
  pounds: count,
  runs: count,
  seconds: z.number().min(0).default(0),
  tempo: count,
  top: z.number().int().min(0).max(PERFECT).default(0),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

interface Run {
  result: Result;
  greats: number;
  longest: number;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

export const settle = (
  save: Save,
  { result, greats, longest, seconds, at }: Run
) => {
  const { level } = rankOf(result.pounds);
  return {
    record: save.runs > 0 && result.pounds > save.best,
    save: {
      best: Math.max(save.best, result.pounds),
      firstPlayed: save.firstPlayed ?? at,
      greats: save.greats + greats,
      lastPlayed: at,
      lightning: save.lightning + (level === PERFECT ? 1 : 0),
      longest: Math.max(save.longest, longest),
      ouches: save.ouches + (result.ending === "hand" ? 1 : 0),
      pounds: save.pounds + result.pounds,
      runs: save.runs + 1,
      seconds: tenth(save.seconds + seconds),
      tempo: Math.max(save.tempo, result.tempo),
      top: Math.max(save.top, level),
    },
  };
};
