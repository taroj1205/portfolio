import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { RUN, foodOf, kinds, runOf, seeded } from "./foods";
import { areaOf } from "./geometry";
import type { Point } from "./geometry";

const side = (p: Point, q: Point, r: Point) =>
  (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);

const crosses = (a: Point, b: Point, c: Point, d: Point) =>
  side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;

const isSimple = (points: readonly Point[]) =>
  points.every((a, i) => {
    const b = points[(i + 1) % points.length];
    return points.every((c, j) => {
      const d = points[(j + 1) % points.length];
      const near =
        Math.abs(i - j) <= 1 || Math.abs(i - j) === points.length - 1;
      return near || !crosses(a, b, c, d);
    });
  });

describe("foods", () => {
  test("every kind gives a simple, finite outline that fits the board, for many seeds", () => {
    for (const kind of kinds) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const { outline } = foodOf(kind, seed * 7919);
        const label = `${kind} ${seed}`;
        assert.ok(outline.length >= 100, label);
        assert.ok(
          outline.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
          label
        );
        const reach = Math.max(...outline.map((p) => Math.hypot(p.x, p.y)));
        assert.ok(reach <= 1.05 && reach >= 0.95, `${label} reaches ${reach}`);
        assert.ok(areaOf(outline) > 0.8, label);
        assert.ok(isSimple(outline), `${label} crosses itself`);
      }
    }
  });

  test("the same seed gives the same food, and another seed a different one", () => {
    for (const kind of kinds) {
      assert.deepEqual(foodOf(kind, 99), foodOf(kind, 99));
      assert.notDeepEqual(foodOf(kind, 99).outline, foodOf(kind, 100).outline);
    }
  });

  test("a run is five different kinds, the same for the same seed", () => {
    const run = runOf(123_456);
    assert.equal(run.length, RUN);
    assert.equal(new Set(run.map((food) => food.kind)).size, RUN);
    assert.deepEqual(runOf(123_456), run);
    assert.notDeepEqual(
      runOf(123_457).map((food) => food.outline),
      run.map((food) => food.outline)
    );
  });

  test("the random numbers stay in range for any seed", () => {
    for (const seed of [1, 2, 2_147_483_646, 0, -5, 1e12]) {
      const roll = seeded(seed);
      for (let i = 0; i < 50; i += 1) {
        const value = roll();
        assert.ok(value >= 0 && value < 1, `${seed}: ${value}`);
      }
    }
  });
});
