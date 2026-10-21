import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { dateOf, dayFrom, dayOf } from "./day";

describe("the day", () => {
  test("turns over at midnight in Japan, wherever the player is", () => {
    const before = Date.UTC(2026, 9, 21, 14, 59, 59, 999);
    const after = Date.UTC(2026, 9, 21, 15, 0, 0, 0);
    assert.equal(dayOf(before), 1);
    assert.equal(dayOf(after), 2);
    assert.equal(dateOf(dayOf(before)), "2026-10-21");
    assert.equal(dateOf(dayOf(after)), "2026-10-22");
    assert.equal(dayOf(Date.UTC(2026, 9, 22, 9, 0)), 2);
  });

  test("numbers start at 1 and a clock set too early still gets day 1", () => {
    assert.equal(dateOf(1), "2026-10-21");
    assert.equal(dayOf(Date.UTC(2020, 0, 1)), 1);
  });

  test("dates and day numbers convert both ways", () => {
    for (const day of [1, 2, 31, 365, 366, 1000]) {
      assert.equal(dayFrom(dateOf(day)), day);
    }
    assert.equal(dayFrom("2026-10-20"), null);
    assert.equal(dayFrom("2027-02-30"), null);
    assert.equal(dayFrom("2026-1-5"), null);
    assert.equal(dayFrom("soon"), null);
  });
});
