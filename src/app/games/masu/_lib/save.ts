import { z } from "zod";

import { createStore } from "../../_lib/storage";
import type { Glass } from "./result";

const KEY = "masu.v1";
const CLOSE = 950;
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: count,
  bottles: z
    .object({ isshobin: count, katakuchi: count, tokkuri: count })
    .prefault({}),
  close: count,
  cups: z.object({ masu: count, mokkiri: count }).prefault({}),
  firstPlayed: moment,
  kept: count,
  lastPlayed: moment,
  late: count,
  pours: count,
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

export const settle = (save: Save, { glass, at, seconds }: Poured) => {
  const { outcome, pour } = glass;
  const spilled = outcome.spilledAt !== null;
  return {
    record: save.pours > 0 && !spilled && outcome.tenths > save.best,
    save: {
      ...save,
      best: Math.max(save.best, outcome.tenths),
      bottles: {
        ...save.bottles,
        [pour.bottle]: save.bottles[pour.bottle] + 1,
      },
      close: save.close + (outcome.tenths >= CLOSE ? 1 : 0),
      cups: { ...save.cups, [pour.cup]: save.cups[pour.cup] + 1 },
      firstPlayed: save.firstPlayed ?? at,
      kept: save.kept + glass.kept,
      lastPlayed: at,
      late:
        save.late +
        (outcome.spilledAt !== null && outcome.spilledAt > outcome.hold
          ? 1
          : 0),
      pours: save.pours + 1,
      seconds: Math.round((save.seconds + seconds) * 10) / 10,
      spilled: save.spilled + glass.spilled,
      spills: save.spills + (spilled ? 1 : 0),
    },
  };
};
