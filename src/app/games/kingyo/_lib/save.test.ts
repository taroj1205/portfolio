import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import type { KindId } from "./fish";
import { resultOf } from "./result";
import { foundOf, fresh, loadSave, settle } from "./save";
import type { Save } from "./save";

const play = (save: Save, caught: KindId[], at = 1000) =>
  settle(save, {
    at,
    biggest: Math.min(2, caught.length),
    result: resultOf(caught),
    scoops: caught.length,
    seconds: 40,
  });

describe("kingyo save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 4, runs: 7 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, best: 4, runs: 7 });
  });

  test("keeps the totals a player profile would need", () => {
    const first = play(fresh, ["wakin", "wakin", "demekin"], 5000).save;
    const second = play(first, [], 9000).save;
    assert.deepEqual(second, {
      ...fresh,
      best: 3,
      biggest: 2,
      firstPlayed: 5000,
      fish: 3,
      kinds: { demekin: 1, wakin: 2 },
      lastPlayed: 9000,
      runs: 2,
      scoops: 3,
      seconds: 80,
      top: 2,
    });
    assert.deepEqual(foundOf(second), ["wakin", "demekin"]);
  });

  test("a first catch of a kind is flagged once, and the first run is never a record", () => {
    const first = play(fresh, ["wakin", "ogon"]);
    assert.equal(first.record, false);
    assert.deepEqual(first.firsts, ["wakin", "ogon"]);
    const second = play(first.save, ["wakin", "wakin", "wakin", "nushi"]);
    assert.equal(second.record, true);
    assert.deepEqual(second.firsts, ["nushi"]);
    const third = play(second.save, ["wakin"]);
    assert.equal(third.record, false);
    assert.equal(third.save.best, 4);
  });
});
