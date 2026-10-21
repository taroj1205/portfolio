import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { fresh, loadSave, settleCut, settleMiss } from "./save";

describe("itto save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("an older or partial save keeps its fields and fills in the rest", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({ bestCut: 4, cuts: 12, kinds: { tofu: 3 }, runs: 2 }),
    });
    assert.deepEqual(loadSave(), {
      ...fresh,
      bestCut: 4,
      cuts: 12,
      kinds: { ...fresh.kinds, tofu: 3 },
    });
  });

  test("a broken save falls back to a fresh one", () => {
    vi.stubGlobal("localStorage", { getItem: () => "{not json" });
    assert.deepEqual(loadSave(), fresh);
  });

  test("cuts and misses add up the totals a profile would need", () => {
    const first = settleCut(fresh, {
      at: 5000,
      challenged: false,
      kind: "tofu",
      seconds: 2.34,
      small: 480,
    });
    assert.equal(first.record, false, "the first cut is never a new best");
    const second = settleCut(first.save, {
      at: 9000,
      challenged: true,
      kind: "kintai",
      seconds: 1.2,
      small: 500,
    });
    assert.equal(second.record, true);
    const save = settleMiss(second.save);
    assert.deepEqual(save, {
      ...fresh,
      bestCut: 0,
      challenges: 1,
      close: 1,
      cuts: 2,
      error: 20,
      firstPlayed: 5000,
      kinds: { ...fresh.kinds, kintai: 1, tofu: 1 },
      lastPlayed: 9000,
      misses: 1,
      perfect: 1,
      rares: 1,
      seconds: 3.5,
    });
    const worse = settleCut(save, {
      at: 9500,
      challenged: false,
      kind: "dango",
      seconds: 1,
      small: 300,
    });
    assert.equal(worse.record, false);
    assert.equal(worse.save.bestCut, 0);
    assert.equal(worse.save.close, 1);
  });
});
