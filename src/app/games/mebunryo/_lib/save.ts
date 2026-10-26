import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { PERFECT, kinds, totalOf } from "./puzzles";
import type { Kind } from "./puzzles";

const KEY = "mebunryo.v1";
const LONGEST_RUN = 900;
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  answered: count,
  best: count,
  closest: z.partialRecord(z.enum(kinds), z.number().min(0)).default({}),
  duels: z.object({ played: count, won: count }).prefault({}),
  firstPlayed: moment,
  lastPlayed: moment,
  perfect: count,
  points: count,
  runs: count,
  seconds: z.number().min(0).default(0),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

export interface Answer {
  kind: Kind;
  error: number;
  points: number;
}

interface Run {
  answers: readonly Answer[];
  rival: number | null;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

const closestOf = (save: Save, answers: readonly Answer[]) => {
  const closest = { ...save.closest };

  for (const { kind, error } of answers) {
    closest[kind] = tenth(Math.min(closest[kind] ?? error, error));
  }

  return closest;
};

export const settle = (save: Save, { answers, rival, seconds, at }: Run) => {
  const total = totalOf(answers.map((answer) => answer.points));

  return {
    record: save.runs > 0 && total > save.best,
    save: {
      answered: save.answered + answers.length,
      best: Math.max(save.best, total),
      closest: closestOf(save, answers),
      duels:
        rival === null
          ? save.duels
          : {
              played: save.duels.played + 1,
              won: save.duels.won + (total > rival ? 1 : 0),
            },
      firstPlayed: save.firstPlayed ?? at,
      lastPlayed: at,
      perfect:
        save.perfect +
        answers.filter((answer) => answer.points >= PERFECT).length,
      points: save.points + total,
      runs: save.runs + 1,
      seconds: tenth(save.seconds + Math.min(seconds, LONGEST_RUN)),
    } satisfies Save,
  };
};
