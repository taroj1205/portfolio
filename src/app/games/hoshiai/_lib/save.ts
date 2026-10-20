import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { TOP } from "./bodies";
import type { Result } from "./result";

const KEY = "hoshiai.v1";
const count = z.number().int().min(0);

const schema = z.object({
  best: count,
  chain: count,
  galaxies: count,
  merges: count,
  runs: count,
  top: z.number().int().min(-1).max(TOP),
});

export type Save = z.infer<typeof schema>;

const fresh: Save = {
  best: 0,
  chain: 0,
  galaxies: 0,
  merges: 0,
  runs: 0,
  top: -1,
};

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

export const discover = (save: Save, tier: number): Save | null =>
  tier > save.top ? { ...save, top: tier } : null;

export const settle = (save: Save, result: Result) => ({
  record: save.runs > 0 && result.score > save.best,
  save: {
    ...save,
    best: Math.max(save.best, result.score),
    chain: Math.max(save.chain, result.chain),
    galaxies: save.galaxies + result.galaxies,
    merges: save.merges + result.merges,
    runs: save.runs + 1,
    top: Math.max(save.top, result.top),
  },
});
