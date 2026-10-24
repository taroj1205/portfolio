import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { reachedBy } from "./result";
import type { Result } from "./result";
import type { End } from "./stretch";

const KEY = "cheese.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: count,
  dishes: z
    .object({ corndog: count, fondue: count, pizza: count })
    .prefault({}),
  firstPlayed: moment,
  lastPlayed: moment,
  moons: count,
  runs: count,
  seconds: z.number().min(0).default(0),
  sets: count,
  snaps: count,
  stretched: count,
  sweet: z.number().min(0).default(0),
  top: z.number().int().min(-1).default(-1),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

interface Settled {
  result: Result;
  end: End;
  snaps: number;
  sweet: number;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

export const settle = (
  save: Save,
  { result, end, snaps, sweet, seconds, at }: Settled
) => ({
  record: save.dishes[result.dish] > 0 && result.mm > save.dishes[result.dish],
  save: {
    best: Math.max(save.best, result.mm),
    dishes: {
      ...save.dishes,
      [result.dish]: Math.max(save.dishes[result.dish], result.mm),
    },
    firstPlayed: save.firstPlayed ?? at,
    lastPlayed: at,
    moons: save.moons + (end === "moon" ? 1 : 0),
    runs: save.runs + 1,
    seconds: tenth(save.seconds + seconds),
    sets: save.sets + (end === "set" ? 1 : 0),
    snaps: save.snaps + snaps,
    stretched: save.stretched + result.mm,
    sweet: tenth(save.sweet + sweet),
    top: Math.max(save.top, reachedBy(result)),
  },
});
