import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { mouldOf } from "./moulds";
import { planOf } from "./result";
import type { Result } from "./result";
import { fresh, loadSave, officialOf, settle, streakOn } from "./save";
import type { Save } from "./save";

const play = (save: Save, result: Result, today = result.day, at = 1000) =>
  settle(save, {
    at,
    cracks: 2,
    notches: Math.round(result.carved * 2.4),
    plan: planOf(today === result.day ? null : result, today),
    result,
    seconds: 30,
  });

const broke = (day: number, carved = 50): Result => ({
  carved,
  day,
  time: null,
});
const clear = (day: number, time = 400): Result => ({ carved: 100, day, time });

describe("katanuki save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ clears: 2, runs: 7 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, clears: 2, runs: 7 });
  });

  test("keeps the totals a player profile would need", () => {
    const first = play(fresh, broke(1, 40), 1, 5000).save;
    const second = play(first, clear(1, 500), 1, 9000).save;
    assert.deepEqual(second, {
      ...fresh,
      best: { [mouldOf(1).id]: 500 },
      breaks: 1,
      clears: 1,
      cracks: 4,
      daily: {
        carved: 40,
        last: "2026-10-21",
        longest: 1,
        played: 1,
        streak: 1,
        time: null,
      },
      firstPlayed: 5000,
      lastPlayed: 9000,
      notches: 96 + 240,
      runs: 2,
      seconds: 60,
    });
  });

  test("best is the fastest clear per shape, and the first clear is not a record", () => {
    const first = play(fresh, clear(2, 600));
    assert.equal(first.record, false);
    const faster = play(first.save, clear(2, 450), 3);
    assert.equal(faster.record, true);
    assert.equal(faster.save.best[mouldOf(2).id], 450);
    const slower = play(faster.save, clear(2, 900), 3);
    assert.equal(slower.record, false);
    assert.equal(slower.save.best[mouldOf(2).id], 450);
    assert.equal(play(slower.save, broke(2)).save.best[mouldOf(2).id], 450);
  });

  test("only the first try of the day is official", () => {
    const first = play(fresh, broke(3, 70));
    assert.equal(first.official, true);
    const practice = play(first.save, clear(3));
    assert.equal(practice.official, false);
    assert.deepEqual(practice.save.daily, first.save.daily);
    assert.deepEqual(officialOf(practice.save, 3), broke(3, 70));
    assert.equal(officialOf(practice.save, 4), null);
  });

  test("other days' challenges don't touch the daily", () => {
    const run = play(fresh, clear(2), 3);
    assert.equal(run.official, false);
    assert.deepEqual(run.save.daily, fresh.daily);
  });

  test("streaks grow on back-to-back days and restart after a gap", () => {
    let save = fresh;
    for (const day of [1, 2, 3]) {
      ({ save } = play(save, broke(day)));
    }
    assert.equal(save.daily.streak, 3);
    assert.equal(streakOn(save, 4), 3);
    assert.equal(streakOn(save, 5), 0);
    ({ save } = play(save, clear(6)));
    assert.equal(save.daily.streak, 1);
    assert.equal(save.daily.longest, 3);
    assert.equal(save.daily.played, 4);
  });

  test("a clock that went backwards can't replay an earlier day", () => {
    const later = play(fresh, broke(9)).save;
    const earlier = play(later, broke(8));
    assert.equal(earlier.official, false);
    assert.deepEqual(earlier.save.daily, later.daily);
  });
});
