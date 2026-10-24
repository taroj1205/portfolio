import assert from "node:assert/strict";

import { afterEach, describe, it, vi } from "vite-plus/test";

import { firstDesign } from "./eraser";
import { fresh, loadSave, settle } from "./save";

const perfect = Array.from({ length: 12 }, () => 10);
const gutters = Array.from({ length: 20 }, () => 0);

describe("keshibo save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 120, runs: 3 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, best: 120, runs: 3 });
  });

  it("an eraser option that no longer exists falls back instead of wiping the save", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({ design: { ...firstDesign, sleeve: "gold" }, runs: 9 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, runs: 9 });
  });

  it("keeps the totals a player profile would need", () => {
    const first = settle(fresh, { at: 5000, rolls: gutters, seconds: 40 }).save;
    const second = settle(first, { at: 9000, rolls: perfect, seconds: 61.25 });
    assert.deepEqual(second.save, {
      ...fresh,
      best: 300,
      bestStreak: 12,
      firstPlayed: 5000,
      lastPlayed: 9000,
      misses: 20,
      perfect: 1,
      pins: 120,
      rolls: 32,
      runs: 2,
      seconds: 101.3,
      strikes: 12,
    });
    assert.equal(second.record, true);
  });

  it("the first game is not a record, and a lower score never lowers the best", () => {
    assert.equal(
      settle(fresh, { at: 1, rolls: perfect, seconds: 1 }).record,
      false
    );
    const best = settle(fresh, { at: 1, rolls: perfect, seconds: 1 }).save;
    const after = settle(best, { at: 2, rolls: gutters, seconds: 1 });
    assert.equal(after.record, false);
    assert.equal(after.save.best, 300);
  });
});
