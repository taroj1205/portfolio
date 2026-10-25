import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { kinds, prizeIds, scoreOf } from "./prizes";
import type { PrizeId } from "./prizes";
import { PERFECT, rankOf } from "./result";
import type { Result } from "./result";

const KEY = "kadouchi.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: count,
  bigWins: count,
  cleared: count,
  corks: count,
  firstPlayed: moment,
  hits: count,
  lastPlayed: moment,
  most: count,
  prizes: z.partialRecord(z.enum(prizeIds), count).default({}),
  runs: count,
  seconds: z.number().min(0).default(0),
  top: z.number().int().min(0).max(PERFECT).default(0),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

interface Run {
  result: Result;
  fired: number;
  hits: number;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

export const foundOf = (save: Save) =>
  prizeIds.filter((id) => (save.prizes[id] ?? 0) > 0);

export const settle = (
  save: Save,
  { result, fired, hits, seconds, at }: Run
) => {
  const score = scoreOf(result.got);
  const { level } = rankOf(score);
  const prizes = { ...save.prizes };

  for (const id of result.got) {
    prizes[id] = (prizes[id] ?? 0) + 1;
  }

  const first: PrizeId[] = result.got.filter(
    (id) => (save.prizes[id] ?? 0) === 0
  );

  return {
    first,
    record: save.runs > 0 && score > save.best,
    save: {
      best: Math.max(save.best, score),
      bigWins:
        save.bigWins +
        result.got.filter((id) => kinds[id].size === "big").length,
      cleared: save.cleared + (level === PERFECT ? 1 : 0),
      corks: save.corks + fired,
      firstPlayed: save.firstPlayed ?? at,
      hits: save.hits + hits,
      lastPlayed: at,
      most: Math.max(save.most, result.got.length),
      prizes,
      runs: save.runs + 1,
      seconds: tenth(save.seconds + seconds),
      top: Math.max(save.top, level),
    },
  };
};
