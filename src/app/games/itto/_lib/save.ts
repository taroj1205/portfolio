import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { errorOf } from "./cut";
import { isRare } from "./foods";
import type { Kind } from "./foods";

const KEY = "itto.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const tally = {
  castella: count,
  chikuwa: count,
  daifuku: count,
  dango: count,
  dorayaki: count,
  ebiten: count,
  edamame: count,
  fuji: count,
  gyoza: count,
  kagami: count,
  kaki: count,
  kamaboko: count,
  kashiwa: count,
  kintai: count,
  kuri: count,
  maki: count,
  matsutake: count,
  mikan: count,
  naruto: count,
  nasu: count,
  neko: count,
  nerikiri: count,
  nikan: count,
  ninjin: count,
  onigiri: count,
  rakugan: count,
  sanma: count,
  senbei: count,
  sushi: count,
  taiyaki: count,
  takenoko: count,
  tofu: count,
  yakitori: count,
  yokan: count,
} satisfies Record<Kind, typeof count>;

const schema = z.object({
  bestCut: z.number().int().min(0).nullable().default(null),
  challenges: count,
  close: count,
  cuts: count,
  error: count,
  firstPlayed: moment,
  kinds: z.object(tally).prefault({}),
  lastPlayed: moment,
  misses: count,
  perfect: count,
  rares: count,
  seconds: z.number().min(0).default(0),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

const tenth = (value: number) => Math.round(value * 10) / 10;

interface Slice {
  kind: Kind;
  small: number;
  seconds: number;
  at: number;
  challenged: boolean;
}

export const settleCut = (
  save: Save,
  { kind, small, seconds, at, challenged }: Slice
) => {
  const error = errorOf(small);

  return {
    record: save.bestCut !== null && error < save.bestCut,
    save: {
      ...save,
      bestCut: Math.min(save.bestCut ?? error, error),
      challenges: save.challenges + (challenged ? 1 : 0),
      close: save.close + (error <= 10 ? 1 : 0),
      cuts: save.cuts + 1,
      error: save.error + error,
      firstPlayed: save.firstPlayed ?? at,
      kinds: { ...save.kinds, [kind]: save.kinds[kind] + 1 },
      lastPlayed: at,
      perfect: save.perfect + (error === 0 ? 1 : 0),
      rares: save.rares + (isRare(kind) ? 1 : 0),
      seconds: tenth(save.seconds + seconds),
    },
  };
};

export const settleMiss = (save: Save) => ({
  ...save,
  misses: save.misses + 1,
});
