import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { ladder } from "./duel";
import type { Call } from "./duel";

const KEY = "iai.v1";
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);

const schema = z.object({
  bestReach: count,
  bestReaction: z.number().int().min(0).nullable().default(null),
  clears: count,
  duels: count,
  duelsWon: count,
  falseStarts: count,
  firstPlayed: moment,
  fooled: count,
  lastPlayed: moment,
  reactionTotal: count,
  reactions: count,
  runs: count,
  seconds: z.number().min(0).default(0),
  versusGames: count,
});

export type Save = z.infer<typeof schema>;

const fresh: Save = {
  bestReach: 0,
  bestReaction: null,
  clears: 0,
  duels: 0,
  duelsWon: 0,
  falseStarts: 0,
  firstPlayed: null,
  fooled: 0,
  lastPlayed: null,
  reactionTotal: 0,
  reactions: 0,
  runs: 0,
  seconds: 0,
  versusGames: 0,
};

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

const tenth = (value: number) => Math.round(value * 10) / 10;

const played = (save: Save, at: number, seconds: number) => ({
  firstPlayed: save.firstPlayed ?? at,
  lastPlayed: at,
  seconds: tenth(save.seconds + seconds),
});

interface Duel {
  call: Call;
  reaction: number | null;
  at: number;
  seconds: number;
}

export const settleDuel = (
  save: Save,
  { call, reaction, at, seconds }: Duel
) => {
  const early = call.kind === "early" && call.side === "left";

  return {
    record:
      reaction !== null &&
      save.bestReaction !== null &&
      reaction < save.bestReaction,
    save: {
      ...save,
      ...played(save, at, seconds),
      bestReaction:
        reaction === null
          ? save.bestReaction
          : Math.min(save.bestReaction ?? reaction, reaction),
      duels: save.duels + 1,
      duelsWon:
        save.duelsWon + (call.kind === "cut" && call.side === "left" ? 1 : 0),
      falseStarts: save.falseStarts + (early ? 1 : 0),
      fooled: save.fooled + (early && call.fake !== null ? 1 : 0),
      reactionTotal: save.reactionTotal + (reaction ?? 0),
      reactions: save.reactions + (reaction === null ? 0 : 1),
    },
  };
};

export const settleRun = (save: Save, reach: number) => ({
  record: save.runs > 0 && reach > save.bestReach,
  save: {
    ...save,
    bestReach: Math.max(save.bestReach, reach),
    clears: save.clears + (reach === ladder.length ? 1 : 0),
    runs: save.runs + 1,
  },
});

export const settleVersus = (save: Save, at: number, seconds: number) => ({
  ...save,
  ...played(save, at, seconds),
  versusGames: save.versusGames + 1,
});
