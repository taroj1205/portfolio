import assert from "node:assert/strict";

import { afterEach, describe, it, vi } from "vite-plus/test";

import { prizeIds } from "./prizes";
import type { PrizeId } from "./prizes";
import { resultOf } from "./result";
import { foundOf, fresh, loadSave, settle } from "./save";
import type { Save } from "./save";

const play = (save: Save, got: PrizeId[], at = 1000) =>
  settle(save, {
    at,
    fired: 18,
    hits: 10,
    result: resultOf(got),
    seconds: 40,
  });

describe("kadouchi save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 130, runs: 3 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, best: 130, runs: 3 });
  });

  it("keeps the totals a player profile would need", () => {
    const first = play(fresh, ["caramel", "bear"], 5000).save;
    const second = play(first, ["caramel"], 9000).save;

    assert.deepEqual(second, {
      ...fresh,
      best: 110,
      bigWins: 1,
      corks: 36,
      firstPlayed: 5000,
      hits: 20,
      lastPlayed: 9000,
      most: 2,
      prizes: { bear: 1, caramel: 2 },
      runs: 2,
      seconds: 80,
      top: 3,
    });

    assert.deepEqual(foundOf(second), ["caramel", "bear"]);
  });

  it("flags new prizes, counts a clean sweep and never calls the first round a record", () => {
    const first = play(fresh, ["ramune"]);
    assert.equal(first.record, false);
    assert.deepEqual(first.first, ["ramune"]);
    const second = play(first.save, [...prizeIds]);
    assert.equal(second.record, true);
    assert.equal(second.save.cleared, 1);
    assert.equal(second.first.includes("ramune"), false);
    const third = play(second.save, ["ramune"]);
    assert.deepEqual(third.first, []);
    assert.equal(third.record, false);
  });
});
