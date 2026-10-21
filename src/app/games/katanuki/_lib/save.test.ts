import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import type { MouldId } from "./moulds";
import type { Result } from "./result";
import { fresh, loadSave, settle } from "./save";
import type { Save } from "./save";

const play = (save: Save, result: Result, at = 1000) =>
  settle(save, {
    at,
    cracks: 2,
    notches: Math.round(result.carved * 2.4),
    result,
    seconds: 30,
  });

const broke = (mould: MouldId, carved = 50): Result => ({
  carved,
  mould,
  time: null,
});

const clear = (mould: MouldId, time = 400): Result => ({
  carved: 100,
  mould,
  time,
});

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
    const first = play(fresh, broke("fish", 40), 5000).save;
    const second = play(first, clear("fish", 500), 9000).save;
    assert.deepEqual(second, {
      ...fresh,
      best: { fish: 500 },
      breaks: 1,
      clears: 1,
      cracks: 4,
      firstPlayed: 5000,
      lastPlayed: 9000,
      notches: 96 + 240,
      runs: 2,
      seconds: 60,
    });
  });

  test("best is the fastest clear for each shape, and the first clear is not a record", () => {
    const first = play(fresh, clear("star", 600));
    assert.equal(first.record, false);
    const faster = play(first.save, clear("star", 450));
    assert.equal(faster.record, true);
    assert.equal(faster.save.best.star, 450);
    const slower = play(faster.save, clear("star", 900));
    assert.equal(slower.record, false);
    assert.equal(slower.save.best.star, 450);
    const other = play(slower.save, clear("umbrella", 900));
    assert.equal(other.record, false);
    assert.deepEqual(other.save.best, { star: 450, umbrella: 900 });
  });

  test("a break never touches the best times", () => {
    const cleared = play(fresh, clear("star", 600)).save;
    const broken = play(cleared, broke("star", 99));
    assert.equal(broken.record, false);
    assert.deepEqual(broken.save.best, { star: 600 });
  });
});
