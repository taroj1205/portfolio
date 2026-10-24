import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { designSchema, firstDesign } from "./eraser";
import { PERFECT, scoreOf, tallyOf } from "./score";

const KEY = "keshibo.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: z.number().int().min(0).max(PERFECT).default(0),
  bestStreak: count,
  design: designSchema.default(firstDesign),
  firstPlayed: moment,
  lastPlayed: moment,
  misses: count,
  perfect: count,
  pins: count,
  rolls: count,
  runs: count,
  seconds: z.number().min(0).default(0),
  spares: count,
  strikes: count,
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

interface Game {
  rolls: number[];
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

export const settle = (save: Save, { rolls, seconds, at }: Game) => {
  const score = scoreOf(rolls);
  const tally = tallyOf(rolls);

  return {
    record: save.runs > 0 && score > save.best,
    save: {
      ...save,
      best: Math.max(save.best, score),
      bestStreak: Math.max(save.bestStreak, tally.streak),
      firstPlayed: save.firstPlayed ?? at,
      lastPlayed: at,
      misses: save.misses + tally.misses,
      perfect: save.perfect + (score === PERFECT ? 1 : 0),
      pins: save.pins + tally.pins,
      rolls: save.rolls + rolls.length,
      runs: save.runs + 1,
      seconds: tenth(save.seconds + seconds),
      spares: save.spares + tally.spares,
      strikes: save.strikes + tally.strikes,
    },
  };
};
