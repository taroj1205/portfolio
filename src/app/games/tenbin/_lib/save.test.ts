import assert from "node:assert/strict";

import { afterEach, describe, it, vi } from "vite-plus/test";

import {
  boardOf,
  fresh,
  keepBoard,
  loadSave,
  settleDaily,
  settleVersus,
  streakOn,
} from "./save";
import type { Save } from "./save";

const win = (save: Save, day: number | null, tries = 3, at = 1000) =>
  settleDaily(save, { at, day, outcome: "won", seconds: 30, tries });

const lose = (save: Save, day: number) =>
  settleDaily(save, { at: 2000, day, outcome: "lost", seconds: 40, tries: 5 });

describe("tenbin save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ guesses: 9, runs: 4 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, guesses: 9, runs: 4 });
  });

  it("keeps the totals a player profile would need", () => {
    const first = win(fresh, 1, 3, 5000);
    const second = settleVersus(first, { at: 9000, chain: 6, seconds: 50 });
    assert.deepEqual(second.save, {
      ...fresh,
      daily: {
        last: "2026-10-25",
        longest: 1,
        played: 1,
        solvedIn: [0, 0, 1, 0, 0],
        streak: 1,
        won: 1,
      },
      firstPlayed: 5000,
      guesses: 3,
      lastPlayed: 9000,
      runs: 2,
      seconds: 80,
      versus: { best: 6, right: 6, runs: 1 },
    });
  });

  it("a streak grows on back-to-back wins, and a miss or a skipped day resets it", () => {
    const one = win(fresh, 1);
    const two = win(one, 2);
    assert.equal(two.daily.streak, 2);
    assert.equal(streakOn(two, 3), 2);
    assert.equal(streakOn(two, 4), 0);
    const lost = lose(two, 3);
    assert.equal(lost.daily.streak, 0);
    assert.equal(lost.daily.longest, 2);
    assert.equal(win(lost, 4).daily.streak, 1);
    assert.equal(win(two, 5).daily.streak, 1);
  });

  it("only the first finish of a day counts, and old puzzles never do", () => {
    const once = win(fresh, 1);
    const twice = win(once, 1);
    assert.deepEqual(twice.daily, once.daily);
    assert.equal(twice.runs, 2);
    const practice = win(fresh, null);
    assert.deepEqual(practice.daily, fresh.daily);
    assert.equal(practice.runs, 1);
  });

  it("today's guesses survive a reload but not a new day or a new item", () => {
    const kept = keepBoard(fresh, 3, "cloud", [40, 80]);
    assert.deepEqual(boardOf(kept, 3, "cloud"), [40, 80]);
    assert.deepEqual(boardOf(kept, 4, "cloud"), []);
    assert.deepEqual(boardOf(kept, 3, "egg"), []);
  });

  it("a which-is-heavier record needs a best to beat", () => {
    const first = settleVersus(fresh, { at: 1, chain: 4, seconds: 9 });
    assert.equal(first.record, false);
    const better = settleVersus(first.save, { at: 2, chain: 5, seconds: 9 });
    assert.equal(better.record, true);
    const worse = settleVersus(better.save, { at: 3, chain: 2, seconds: 9 });
    assert.equal(worse.record, false);
    assert.equal(worse.save.versus.best, 5);
  });
});
