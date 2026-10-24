import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { seeded } from "./art";
import { dishIds, dishOfDay, dishes } from "./dishes";
import { LAST, heights, reachedOf } from "./heights";
import {
  MOON,
  START,
  TICK,
  aliveOf,
  createRun,
  limitOf,
  step,
} from "./stretch";
import type { Run } from "./stretch";

const DAY = 86_400_000;

const play = (run: Run, aim: number, spread: number, seed: number) => {
  const roll = seeded(seed);
  let noise = 0;
  let stroke = 0;
  let rest = 0;
  while (run.end === null) {
    noise +=
      -noise * 6 * TICK +
      spread * Math.sqrt(12 * TICK) * (roll() * 2 - 1) * 1.7;
    let growth = 0;
    if (rest > 0) {
      rest -= TICK;
    } else {
      growth = Math.max(0, aim * (1 + noise)) * limitOf(run) * TICK;
      stroke += growth;
      if (stroke > 1.2) {
        stroke = 0;
        rest = 0.22;
      }
    }
    step(run, growth);
  }
  return run;
};

const median = (aim: number, spread: number) => {
  const lengths = Array.from(
    { length: 15 },
    (_, i) => play(createRun(dishes.pizza, i + 1), aim, spread, i + 11).length
  ).toSorted((a, b) => a - b);
  return lengths[7] ?? 0;
};

describe("stretching cheese", () => {
  test("a run left alone cools and sets at the length it started at", () => {
    const run = createRun(dishes.pizza, 1);
    while (run.end === null) {
      step(run, 0);
    }
    assert.equal(run.end, "set");
    assert.equal(run.length, START);
    assert.equal(aliveOf(run), dishes.pizza.strands);
    assert.ok(Math.abs(run.time - dishes.pizza.cool) < 0.5);
  });

  test("pulling far past the limit snaps the strands one by one", () => {
    const run = createRun(dishes.corndog, 2);
    const seen: number[] = [];
    while (run.end === null) {
      step(run, limitOf(run) * 3 * TICK);
      if (seen.at(-1) !== aliveOf(run)) {
        seen.push(aliveOf(run));
      }
    }
    assert.equal(run.end, "snapped");
    assert.deepEqual(seen, [4, 3, 2, 1, 0]);
  });

  test("the golden zone keeps the cheese warm for longer", () => {
    const slow = createRun(dishes.pizza, 3);
    const sweet = createRun(dishes.pizza, 3);
    for (let i = 0; i < 600; i += 1) {
      step(slow, limitOf(slow) * 0.4 * TICK);
      step(sweet, limitOf(sweet) * 0.9 * TICK);
    }
    assert.ok(sweet.heat > slow.heat);
    assert.ok(sweet.sweet > 4.5);
  });

  test("careful pulls go much further than casual ones, and nothing passes the Moon", () => {
    const casual = median(0.5, 0.25);
    const careful = median(0.85, 0.12);
    const expert = median(0.95, 0.05);
    assert.ok(casual > 1000 && casual < 33_300, `casual ${casual}`);
    assert.ok(careful > 10_000_000, `careful ${careful}`);
    assert.ok(expert > careful);
    const greedy = createRun(dishes.fondue, 4);
    step(greedy, 100);
    assert.equal(greedy.length, MOON);
    assert.equal(greedy.end, "moon");
  });
});

describe("heights and dishes", () => {
  test("milestones climb in order and end at the Moon", () => {
    for (let i = 1; i < heights.length; i += 1) {
      assert.ok((heights[i]?.cm ?? 0) > (heights[i - 1]?.cm ?? 0));
    }
    assert.equal(reachedOf(MOON), LAST);
    assert.equal(reachedOf(START), -1);
    assert.equal(reachedOf(33_300), 5);
  });

  test("the dish of the day changes at midnight in Japan and cycles through every dish", () => {
    const midnight = Date.UTC(2026, 9, 24) - 9 * 3_600_000;
    assert.equal(dishOfDay(midnight - 1), dishOfDay(midnight - DAY));
    assert.notEqual(dishOfDay(midnight), dishOfDay(midnight - 1));
    const week = new Set(
      Array.from({ length: dishIds.length }, (_, i) =>
        dishOfDay(midnight + i * DAY)
      )
    );
    assert.equal(week.size, dishIds.length);
  });
});
