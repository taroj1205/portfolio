import { z } from "zod";

import { createStore } from "../../_lib/storage";
import type { Glass, Tally } from "./result";

const KEY = "masu.v1";
const CLOSE = 950;
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: count,
  bestPour: count,
  clean: count,
  close: count,
  firstPlayed: moment,
  kept: count,
  lastPlayed: moment,
  pours: count,
  runs: count,
  seconds: z.number().min(0).default(0),
  spilled: count,
  spills: count,
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

interface Poured {
  glass: Glass;
  at: number;
  seconds: number;
}

export const settlePour = (
  save: Save,
  { glass, at, seconds }: Poured
): Save => ({
  ...save,
  bestPour: Math.max(save.bestPour, glass.outcome.tenths),
  close: save.close + (glass.outcome.tenths >= CLOSE ? 1 : 0),
  firstPlayed: save.firstPlayed ?? at,
  kept: save.kept + glass.kept,
  lastPlayed: at,
  pours: save.pours + 1,
  seconds: Math.round((save.seconds + seconds) * 10) / 10,
  spilled: save.spilled + glass.spilled,
  spills: save.spills + (glass.outcome.spilledAt === null ? 0 : 1),
});

export const settleRun = (save: Save, tally: Tally) => ({
  record: save.runs > 0 && tally.average > save.best,
  save: {
    ...save,
    best: Math.max(save.best, tally.average),
    clean: save.clean + (tally.spills === 0 ? 1 : 0),
    runs: save.runs + 1,
  },
});
