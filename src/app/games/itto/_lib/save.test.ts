import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { fresh, loadSave, settleCut, settleMiss, settleRun } from "./save";
import type { Save } from "./save";

describe("itto save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("an older or partial save keeps its fields and fills in the rest", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({ bestRun: 34, cuts: 12, kinds: { tofu: 3 }, runs: 2 }),
    });
    assert.deepEqual(loadSave(), {
      ...fresh,
      bestRun: 34,
      cuts: 12,
      kinds: { ...fresh.kinds, tofu: 3 },
      runs: 2,
    });
  });

  test("a broken save falls back to a fresh one", () => {
    vi.stubGlobal("localStorage", { getItem: () => "{not json" });
    assert.deepEqual(loadSave(), fresh);
  });

  test("cuts, misses and runs add up the totals a profile would need", () => {
    let save: Save = settleCut(fresh, {
      at: 5000,
      kind: "tofu",
      seconds: 2.34,
      small: 500,
    });
    save = settleCut(save, {
      at: 9000,
      kind: "kaki",
      seconds: 1.2,
      small: 480,
    });
    save = settleMiss(save);
    assert.deepEqual(save, {
      ...fresh,
      bestCut: 0,
      cuts: 2,
      error: 20,
      firstPlayed: 5000,
      kinds: { ...fresh.kinds, kaki: 1, tofu: 1 },
      lastPlayed: 9000,
      misses: 1,
      perfect: 1,
      seconds: 3.5,
    });
    const first = settleRun(save, 42, false);
    assert.equal(first.record, false, "the first run is never a new best");
    assert.equal(first.save.bestRun, 42);
    const better = settleRun(first.save, 30, true);
    assert.equal(better.record, true);
    assert.equal(better.save.runs, 2);
    assert.equal(better.save.challenges, 1);
    assert.equal(settleRun(better.save, 31, false).save.bestRun, 30);
  });
});
