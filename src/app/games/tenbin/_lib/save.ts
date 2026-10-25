import { z } from "zod";

import { createStore } from "../../_lib/storage";
import { TRIES, dateOf, dayFrom } from "./daily";
import type { Outcome } from "./daily";
import { STEPS } from "./scale";

const KEY = "tenbin.v1";
const LONGEST_RUN = 600;
const count = z.number().int().min(0).default(0);
const moment = z.number().int().min(0).nullable().default(null);
const step = z.number().int().min(0).max(STEPS);

const schema = z.object({
  board: z
    .object({
      date: z.iso.date(),
      guesses: z.array(step).max(TRIES),
      item: z.string(),
    })
    .nullable()
    .default(null),
  daily: z
    .object({
      last: z.iso.date().nullable().default(null),
      longest: count,
      played: count,
      solvedIn: z
        .array(z.number().int().min(0))
        .length(TRIES)
        .default(() => Array.from({ length: TRIES }, () => 0)),
      streak: count,
      won: count,
    })
    .prefault({}),
  firstPlayed: moment,
  guesses: count,
  lastPlayed: moment,
  runs: count,
  seconds: z.number().min(0).default(0),
  versus: z.object({ best: count, right: count, runs: count }).prefault({}),
});

export type Save = z.infer<typeof schema>;

export const fresh: Save = schema.parse({});

const store = createStore(KEY, schema, fresh);

export const loadSave = store.read;

export const storeSave = store.write;

const tenth = (value: number) => Math.round(value * 10) / 10;

const lastDay = (save: Save) =>
  save.daily.last === null ? null : dayFrom(save.daily.last);

const playedOn = (save: Save, day: number) => {
  const last = lastDay(save);

  return last !== null && last >= day;
};

export const streakOn = (save: Save, today: number) => {
  const last = lastDay(save);

  return last !== null && last >= today - 1 ? save.daily.streak : 0;
};

export const boardOf = (save: Save, day: number, item: string) =>
  save.board !== null &&
  save.board.date === dateOf(day) &&
  save.board.item === item
    ? save.board.guesses
    : [];

export const keepBoard = (
  save: Save,
  day: number,
  item: string,
  guesses: readonly number[]
): Save => ({
  ...save,
  board: { date: dateOf(day), guesses: [...guesses], item },
});

const played = (save: Save, at: number, seconds: number): Save => ({
  ...save,
  firstPlayed: save.firstPlayed ?? at,
  lastPlayed: at,
  runs: save.runs + 1,
  seconds: tenth(save.seconds + Math.min(seconds, LONGEST_RUN)),
});

interface DailyRun {
  day: number | null;
  outcome: Exclude<Outcome, "playing">;
  tries: number;
  seconds: number;
  at: number;
}

const streakAfter = (save: Save, day: number, won: boolean) => {
  if (!won) {
    return 0;
  }

  return lastDay(save) === day - 1 ? save.daily.streak + 1 : 1;
};

const dailyOf = (save: Save, day: number, won: boolean, tries: number) => {
  const streak = streakAfter(save, day, won);

  return {
    last: dateOf(day),
    longest: Math.max(save.daily.longest, streak),
    played: save.daily.played + 1,
    solvedIn: save.daily.solvedIn.map((total, i) =>
      won && i === tries - 1 ? total + 1 : total
    ),
    streak,
    won: save.daily.won + (won ? 1 : 0),
  };
};

export const settleDaily = (
  save: Save,
  { day, outcome, tries, seconds, at }: DailyRun
): Save => {
  const official = day !== null && !playedOn(save, day);
  const next = played(save, at, seconds);

  return {
    ...next,
    daily: official ? dailyOf(save, day, outcome === "won", tries) : save.daily,
    guesses: save.guesses + tries,
  };
};

interface VersusRun {
  chain: number;
  seconds: number;
  at: number;
}

export const settleVersus = (
  save: Save,
  { chain, seconds, at }: VersusRun
) => ({
  record: chain > save.versus.best && save.versus.best > 0,
  save: {
    ...played(save, at, seconds),
    versus: {
      best: Math.max(save.versus.best, chain),
      right: save.versus.right + chain,
      runs: save.versus.runs + 1,
    },
  },
});
