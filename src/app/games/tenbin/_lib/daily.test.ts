import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import {
  dateOf,
  dayFrom,
  dayOf,
  gradesOf,
  itemOfDay,
  nextDayIn,
  outcomeOf,
} from "./daily";
import { items } from "./items";
import { stepOf } from "./scale";

describe("the day", () => {
  it("turns over at midnight in Japan, wherever the player is", () => {
    const before = Date.UTC(2026, 9, 25, 14, 59, 59, 999);
    const after = Date.UTC(2026, 9, 25, 15, 0, 0, 0);
    assert.equal(dayOf(before), 1);
    assert.equal(dayOf(after), 2);
    assert.equal(dateOf(1), "2026-10-25");
    assert.equal(nextDayIn(before), 1);
    assert.equal(nextDayIn(after), 86_400_000);
  });

  it("a clock set too early still gets day 1", () => {
    assert.equal(dayOf(Date.UTC(2020, 0, 1)), 1);
  });

  it("dates and day numbers convert both ways", () => {
    for (const day of [1, 2, 31, 365, 1000]) {
      assert.equal(dayFrom(dateOf(day)), day);
    }

    assert.equal(dayFrom("2026-10-24"), null);
    assert.equal(dayFrom("2027-02-30"), null);
    assert.equal(dayFrom("soon"), null);
  });
});

describe("the daily item", () => {
  it("is the same for everyone and shows every item once before repeating", () => {
    const first = Array.from({ length: items.length }, (_, i) =>
      itemOfDay(i + 1)
    );

    assert.equal(new Set(first).size, items.length);
    assert.equal(itemOfDay(1).id, "cloud");
    assert.equal(itemOfDay(items.length + 1), itemOfDay(1));
  });
});

describe("a round", () => {
  const [cloud] = items;

  it("is won by a hit and lost after five misses", () => {
    const hit = stepOf(cloud.grams);
    assert.equal(outcomeOf(gradesOf([], cloud)), "playing");
    assert.equal(outcomeOf(gradesOf([10, hit], cloud)), "won");
    assert.equal(outcomeOf(gradesOf([10, 20, 30, 40], cloud)), "playing");
    assert.equal(outcomeOf(gradesOf([10, 20, 30, 40, 50], cloud)), "lost");
    assert.equal(outcomeOf(gradesOf([10, 20, 30, 40, hit], cloud)), "won");
  });
});
