import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { kindIds } from "./fish";
import type { KindId } from "./fish";
import { PERFECT, countOf, rankOf } from "./result";
import type { Result } from "./result";

const KEY = "kingyo.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  best: count,
  biggest: count,
  firstPlayed: moment,
  fish: count,
  kinds: z.partialRecord(z.enum(kindIds), count).default({}),
  lastPlayed: moment,
  legends: count,
  runs: count,
  scoops: count,
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
  scoops: number;
  biggest: number;
  seconds: number;
  at: number;
}

const tenth = (value: number) => Math.round(value * 10) / 10;

export const foundOf = (save: Save) =>
  kindIds.filter((id) => (save.kinds[id] ?? 0) > 0);

export const settle = (
  save: Save,
  { result, scoops, biggest, seconds, at }: Run
) => {
  const caught = countOf(result);
  const { level } = rankOf(caught);
  const kinds = { ...save.kinds };
  const firsts: KindId[] = [];
  for (const id of kindIds) {
    const got = result.catches[id];
    if (got > 0) {
      if ((kinds[id] ?? 0) === 0) {
        firsts.push(id);
      }
      kinds[id] = (kinds[id] ?? 0) + got;
    }
  }
  return {
    firsts,
    record: save.runs > 0 && caught > save.best,
    save: {
      best: Math.max(save.best, caught),
      biggest: Math.max(save.biggest, biggest),
      firstPlayed: save.firstPlayed ?? at,
      fish: save.fish + caught,
      kinds,
      lastPlayed: at,
      legends: save.legends + (level === PERFECT ? 1 : 0),
      runs: save.runs + 1,
      scoops: save.scoops + scoops,
      seconds: tenth(save.seconds + seconds),
      top: Math.max(save.top, level),
    },
  };
};
