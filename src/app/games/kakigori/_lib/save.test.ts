import assert from "node:assert/strict";

import { afterEach, describe, it, vi } from "vite-plus/test";

import { foundOf, fresh, loadSave, settle } from "./save";
import type { Save } from "./save";

const play = (save: Save, tenths: number, toppled = false, at = 1000) =>
  settle(save, {
    at,
    peak: toppled ? tenths * 3 : tenths,
    poured: 2000,
    result: { outline: Array.from({ length: 16 }, () => 0), tenths, toppled },
    seconds: 30,
    spilled: 100,
  });

describe("kakigori save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 92, runs: 3 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, best: 92, runs: 3 });
  });

  it("keeps the totals a player profile would need", () => {
    const first = play(fresh, 125, false, 5000).save;
    const second = play(first, 41, true, 9000).save;
    assert.deepEqual(second, {
      ...fresh,
      best: 125,
      firstPlayed: 5000,
      grams: 600,
      lastPlayed: 9000,
      peak: 125,
      runs: 2,
      seconds: 60,
      served: 1,
      spilled: 30,
      syrups: { blue: 1, ichigo: 1 },
      toppled: 1,
      top: 4,
    });
    assert.deepEqual(foundOf(second), ["ichigo", "blue"]);
  });

  it("a first syrup is flagged once, the summit counts as a legend, and the first run is never a record", () => {
    const first = play(fresh, 35);
    assert.equal(first.record, false);
    assert.equal(first.first, "ichigo");
    const second = play(first.save, 190);
    assert.equal(second.record, true);
    assert.equal(second.first, "rainbow");
    assert.equal(second.save.legends, 1);
    const third = play(second.save, 40);
    assert.equal(third.first, null);
    assert.equal(third.record, false);
    assert.equal(third.save.best, 190);
  });
});
