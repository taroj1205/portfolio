import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { EARLIEST, LATEST, dailyTarget } from "./daily";

describe("the daily target", () => {
  test("is the same for everyone on a given day, forever", () => {
    assert.deepEqual(
      [1, 2, 3, 100, 365].map(dailyTarget),
      [1305, 895, 1263, 574, 1053]
    );
  });

  test("stays between 5.00 and 15.00 and moves from day to day", () => {
    const targets = Array.from({ length: 3650 }, (_, i) => dailyTarget(i + 1));
    assert.ok(targets.every((target) => Number.isInteger(target)));
    assert.ok(Math.min(...targets) >= EARLIEST);
    assert.ok(Math.max(...targets) <= LATEST);
    assert.ok(Math.min(...targets) < EARLIEST + 20);
    assert.ok(Math.max(...targets) > LATEST - 20);
    assert.ok(new Set(targets).size > 900);
    const repeats = targets.filter((target, i) => target === targets[i - 1]);
    assert.ok(repeats.length < 5);
  });
});
