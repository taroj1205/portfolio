import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { finished, reachedOf } from "./result";
import type { Result } from "./result";

const KEY = "senko.v1";
const count = z.number().int().min(0);
const moment = z.number().int().min(0).nullable();

const schema = z.object({
  best: count,
  finishes: count,
  firstPlayed: moment,
  held: count,
  lastPlayed: moment,
  runs: count,
  top: z.number().int().min(-1),
});

export type Save = z.infer<typeof schema>;

const fresh: Save = {
  best: 0,
  finishes: 0,
  firstPlayed: null,
  held: 0,
  lastPlayed: null,
  runs: 0,
  top: -1,
};

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

export const settle = (save: Save, result: Result, now: number) => ({
  record: save.runs > 0 && result.time > save.best,
  save: {
    best: Math.max(save.best, result.time),
    finishes: save.finishes + (finished(result) ? 1 : 0),
    firstPlayed: save.firstPlayed ?? now,
    held: save.held + result.time,
    lastPlayed: now,
    runs: save.runs + 1,
    top: Math.max(save.top, reachedOf(result)),
  },
});
