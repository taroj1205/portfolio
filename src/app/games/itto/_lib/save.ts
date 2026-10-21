import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { errorOf } from "./cut";
import type { Kind } from "./foods";

const KEY = "itto.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);
const closest = z.number().int().min(0).nullable().default(null);

const tally = {
  castella: count,
  daifuku: count,
  kagami: count,
  kaki: count,
  kamaboko: count,
  nerikiri: count,
  onigiri: count,
  rakugan: count,
  sushi: count,
  taiyaki: count,
  tofu: count,
  yokan: count,
} satisfies Record<Kind, typeof count>;

const schema = z.object({
  bestCut: closest,
  bestRun: closest,
  challenges: count,
  cuts: count,
  error: count,
  firstPlayed: moment,
  kinds: z.object(tally).prefault({}),
  lastPlayed: moment,
  misses: count,
  perfect: count,
  runs: count,
  seconds: z.number().min(0).default(0),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

const tenth = (value: number) => Math.round(value * 10) / 10;

interface Slice {
  kind: Kind;
  small: number;
  seconds: number;
  at: number;
}

export const settleCut = (save: Save, { kind, small, seconds, at }: Slice) => {
  const error = errorOf(small);
  return {
    ...save,
    bestCut: Math.min(save.bestCut ?? error, error),
    cuts: save.cuts + 1,
    error: save.error + error,
    firstPlayed: save.firstPlayed ?? at,
    kinds: { ...save.kinds, [kind]: save.kinds[kind] + 1 },
    lastPlayed: at,
    perfect: save.perfect + (error === 0 ? 1 : 0),
    seconds: tenth(save.seconds + seconds),
  };
};

export const settleMiss = (save: Save) => ({
  ...save,
  misses: save.misses + 1,
});

export const settleRun = (save: Save, total: number, challenged: boolean) => ({
  record: save.bestRun !== null && total < save.bestRun,
  save: {
    ...save,
    bestRun: Math.min(save.bestRun ?? total, total),
    challenges: save.challenges + (challenged ? 1 : 0),
    runs: save.runs + 1,
  },
});
