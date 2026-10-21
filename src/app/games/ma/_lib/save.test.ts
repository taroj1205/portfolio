import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { dailyTarget } from "./daily";
import { planOf } from "./result";
import { fresh, loadSave, officialOf, settle, streakOn } from "./save";
import type { Save } from "./save";

const standard = planOf("standard", null, 1);
const daily = (day: number) => planOf("daily", null, day);

const play = (save: Save, plan = standard, time = 1000, at = 1000) =>
  settle(save, { at, plan, seconds: time / 100, time });

describe("ma save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ perfect: 2, runs: 7 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, perfect: 2, runs: 7 });
  });

  test("keeps the totals a player profile would need", () => {
    const first = play(fresh, standard, 1012, 5000).save;
    const second = play(first, standard, 990, 6000).save;
    const third = play(second, standard, 1000, 9000).save;
    assert.deepEqual(third, {
      ...fresh,
      best: { daily: null, standard: 0 },
      drift: 2,
      error: 22,
      firstPlayed: 5000,
      lastPlayed: 9000,
      perfect: 1,
      runs: 3,
      seconds: 30,
    });
  });

  test("the first run is never a new best, and best is the closest per mode", () => {
    const first = play(fresh, standard, 1050);
    assert.equal(first.record, false);
    const closer = play(first.save, standard, 980);
    assert.equal(closer.record, true);
    assert.equal(closer.save.best.standard, 20);
    const worse = play(closer.save, standard, 1100);
    assert.equal(worse.record, false);
    assert.equal(worse.save.best.standard, 20);
    const other = play(worse.save, daily(1), dailyTarget(1) + 40);
    assert.equal(other.record, false);
    assert.deepEqual(other.save.best, { daily: 40, standard: 20 });
  });

  test("only the first daily try of the day is official", () => {
    const target = dailyTarget(3);
    const first = play(fresh, daily(3), target - 12);
    assert.equal(first.official, true);
    assert.deepEqual(first.save.daily, {
      last: "2026-10-23",
      longest: 1,
      played: 1,
      streak: 1,
      time: target - 12,
    });
    const practice = play(first.save, daily(3), target);
    assert.equal(practice.official, false);
    assert.deepEqual(practice.save.daily, first.save.daily);
    assert.equal(practice.save.perfect, 1);
    assert.deepEqual(officialOf(practice.save, 3), {
      day: 3,
      time: target - 12,
    });
    assert.equal(officialOf(practice.save, 4), null);
  });

  test("standard runs and other days' challenges don't touch the daily", () => {
    const old = planOf("standard", { day: 2, time: 900 }, 3);
    const run = play(fresh, old, dailyTarget(2));
    assert.equal(run.official, false);
    assert.deepEqual(run.save.daily, fresh.daily);
    assert.equal(run.save.best.daily, 0);
    assert.deepEqual(play(fresh).save.daily, fresh.daily);
  });

  test("streaks grow on back-to-back days and restart after a gap", () => {
    let save = fresh;
    for (const day of [1, 2, 3]) {
      ({ save } = play(save, daily(day), 900));
    }
    assert.equal(save.daily.streak, 3);
    assert.equal(streakOn(save, 3), 3);
    assert.equal(streakOn(save, 4), 3);
    assert.equal(streakOn(save, 5), 0);
    ({ save } = play(save, daily(6), 900));
    assert.equal(save.daily.streak, 1);
    assert.equal(save.daily.longest, 3);
    assert.equal(save.daily.played, 4);
  });

  test("a clock that went backwards can't replay an earlier day", () => {
    const later = play(fresh, daily(9), 900).save;
    const earlier = play(later, daily(8), 900);
    assert.equal(earlier.official, false);
    assert.deepEqual(earlier.save.daily, later.daily);
  });
});
