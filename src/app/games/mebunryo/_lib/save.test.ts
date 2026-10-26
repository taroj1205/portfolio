import assert from "node:assert/strict";

import { afterEach, describe, it, vi } from "vite-plus/test";

import { kinds } from "./puzzles";
import { fresh, loadSave, settle } from "./save";

const answers = kinds.map((kind, i) => ({
  error: i + 0.44,
  kind,
  points: 100 - i * 5,
}));

describe("mebunryo save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("an older or partial save fills in every field instead of resetting", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 700, runs: 3 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, best: 700, runs: 3 });
  });

  it("keeps the totals a player profile would need", () => {
    const first = settle(fresh, {
      answers,
      at: 5000,
      rival: null,
      seconds: 61.26,
    });

    assert.equal(first.record, false);
    assert.deepEqual(first.save, {
      answered: 10,
      best: 775,
      closest: Object.fromEntries(kinds.map((kind, i) => [kind, i + 0.4])),
      duels: { played: 0, won: 0 },
      firstPlayed: 5000,
      lastPlayed: 5000,
      perfect: 2,
      points: 775,
      runs: 1,
      seconds: 61.3,
    });

    const worse = answers.map((answer) => ({
      ...answer,
      error: answer.error + 3,
      points: answer.points - 10,
    }));

    const second = settle(first.save, {
      answers: worse,
      at: 9000,
      rival: 600,
      seconds: 50,
    });

    assert.equal(second.record, false);
    assert.equal(second.save.best, 775);
    assert.equal(second.save.points, 775 + 675);
    assert.equal(second.save.firstPlayed, 5000);
    assert.equal(second.save.lastPlayed, 9000);
    assert.deepEqual(second.save.duels, { played: 1, won: 1 });
    assert.deepEqual(second.save.closest, first.save.closest);
  });

  it("calls a higher total a new best only after the first run", () => {
    const first = settle(fresh, { answers, at: 1, rival: null, seconds: 1 });
    const better = answers.map((answer) => ({ ...answer, points: 100 }));
    assert.equal(
      settle(first.save, { answers: better, at: 2, rival: 1000, seconds: 1 })
        .record,
      true
    );
    assert.deepEqual(
      settle(first.save, { answers: better, at: 2, rival: 1000, seconds: 1 })
        .save.duels,
      { played: 1, won: 0 }
    );
  });
});
