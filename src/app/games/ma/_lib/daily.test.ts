import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { EARLIEST, LATEST, dailyTarget, dateOf, dayFrom, dayOf } from "./daily";

describe("the daily target", () => {
  it("is the same for everyone on a given day, forever", () => {
    assert.deepEqual(
      [1, 2, 3, 100, 365].map(dailyTarget),
      [1305, 895, 1263, 574, 1053]
    );
  });

  it("stays between 5.00 and 15.00 and moves from day to day", () => {
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

describe("the day", () => {
  it("turns over at midnight in Japan, wherever the player is", () => {
    const before = Date.UTC(2026, 9, 21, 14, 59, 59, 999);
    const after = Date.UTC(2026, 9, 21, 15, 0, 0, 0);
    assert.equal(dayOf(before), 1);
    assert.equal(dayOf(after), 2);
    assert.equal(dateOf(dayOf(before)), "2026-10-21");
    assert.equal(dateOf(dayOf(after)), "2026-10-22");
    assert.equal(dayOf(Date.UTC(2026, 9, 22, 9, 0)), 2);
  });

  it("numbers start at 1 and a clock set too early still gets day 1", () => {
    assert.equal(dateOf(1), "2026-10-21");
    assert.equal(dayOf(Date.UTC(2020, 0, 1)), 1);
  });

  it("dates and day numbers convert both ways", () => {
    for (const day of [1, 2, 31, 365, 366, 1000]) {
      assert.equal(dayFrom(dateOf(day)), day);
    }

    assert.equal(dayFrom("2026-10-20"), null);
    assert.equal(dayFrom("2027-02-30"), null);
    assert.equal(dayFrom("2026-1-5"), null);
    assert.equal(dayFrom("soon"), null);
  });
});
