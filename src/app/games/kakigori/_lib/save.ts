import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { PERFECT, rankOf, syrupOf } from "./result";
import type { Result } from "./result";
import { syrupIds } from "./syrups";
import type { SyrupId } from "./syrups";

const KEY = "kakigori.v1";
const GRAMS = 0.15;
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: count,
  firstPlayed: moment,
  grams: count,
  lastPlayed: moment,
  legends: count,
  peak: count,
  runs: count,
  seconds: z.number().min(0).default(0),
  served: count,
  spilled: count,
  syrups: z.partialRecord(z.enum(syrupIds), count).default({}),
  toppled: count,
  top: z.number().int().min(0).max(PERFECT).default(0),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

interface Run {
  result: Result;
  peak: number;
  poured: number;
  spilled: number;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

export const foundOf = (save: Save) =>
  syrupIds.filter((id) => (save.syrups[id] ?? 0) > 0);

export const settle = (
  save: Save,
  { result, peak, poured, spilled, seconds, at }: Run
) => {
  const { level } = rankOf(result.tenths);
  const syrup: SyrupId = syrupOf(result.tenths);
  const first = (save.syrups[syrup] ?? 0) === 0;

  return {
    first: first ? syrup : null,
    record: save.runs > 0 && result.tenths > save.best,
    save: {
      best: Math.max(save.best, result.tenths),
      firstPlayed: save.firstPlayed ?? at,
      grams: save.grams + Math.round(poured * GRAMS),
      lastPlayed: at,
      legends: save.legends + (level === PERFECT ? 1 : 0),
      peak: Math.max(save.peak, peak),
      runs: save.runs + 1,
      seconds: tenth(save.seconds + seconds),
      served: save.served + (result.toppled ? 0 : 1),
      spilled: save.spilled + Math.round(spilled * GRAMS),
      syrups: { ...save.syrups, [syrup]: (save.syrups[syrup] ?? 0) + 1 },
      toppled: save.toppled + (result.toppled ? 1 : 0),
      top: Math.max(save.top, level),
    },
  };
};
