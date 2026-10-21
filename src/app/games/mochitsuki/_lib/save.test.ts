import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { tempoAt } from "./beat";
import type { Result } from "./result";
import { fresh, loadSave, settle } from "./save";
import type { Save } from "./save";

const result = (pounds: number, ending: Result["ending"] = "miss"): Result => ({
  ending,
  pounds,
  tempo: tempoAt(Math.max(0, pounds - 1)),
});

const play = (save: Save, run: Result, at = 1000) =>
  settle(save, {
    at,
    greats: Math.floor(run.pounds / 2),
    longest: run.pounds,
    result: run,
    seconds: 20,
  });

describe("mochitsuki save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 40, runs: 3 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, best: 40, runs: 3 });
  });

  test("keeps the totals a player profile would need", () => {
    const first = play(fresh, result(30, "hand"), 5000).save;
    const second = play(first, result(150), 9000).save;
    assert.deepEqual(second, {
      best: 150,
      firstPlayed: 5000,
      greats: 15 + 75,
      lastPlayed: 9000,
      lightning: 1,
      longest: 150,
      ouches: 1,
      pounds: 180,
      runs: 2,
      seconds: 40,
      tempo: tempoAt(149),
      top: 6,
    });
  });

  test("a new best is a record, but the first run is not", () => {
    const first = play(fresh, result(20));
    assert.equal(first.record, false);
    const better = play(first.save, result(21));
    assert.equal(better.record, true);
    const level = play(better.save, result(21));
    assert.equal(level.record, false);
    const worse = play(level.save, result(5, "hand"));
    assert.equal(worse.record, false);
    assert.equal(worse.save.best, 21);
    assert.equal(worse.save.top, 1);
  });
});
