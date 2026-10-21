import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { nextRank } from "./result";

const KEY = "enso.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: z.number().min(0).max(100).default(0),
  divine: count,
  draws: count,
  firstPlayed: moment,
  lastPlayed: moment,
  seconds: z.number().min(0).default(0),
  total: z.number().min(0).default(0),
});

export type Save = z.infer<typeof schema>;

const fresh: Save = {
  best: 0,
  divine: 0,
  draws: 0,
  firstPlayed: null,
  lastPlayed: null,
  seconds: 0,
  total: 0,
};

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

const tenth = (value: number) => Math.round(value * 10) / 10;

interface Draw {
  score: number;
  seconds: number;
  at: number;
}

export const settle = (save: Save, { score, seconds, at }: Draw) => ({
  record: save.draws > 0 && score > save.best,
  save: {
    best: Math.max(save.best, score),
    divine: save.divine + (nextRank(score) === null ? 1 : 0),
    draws: save.draws + 1,
    firstPlayed: save.firstPlayed ?? at,
    lastPlayed: at,
    seconds: tenth(save.seconds + seconds),
    total: tenth(save.total + score),
  },
});
