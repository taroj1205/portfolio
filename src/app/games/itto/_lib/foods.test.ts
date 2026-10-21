import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { areaOfParts, errorOf, splitBy } from "./cut";
import {
  DRIFT,
  RARITY,
  dishOf,
  everyKind,
  foodOf,
  isRare,
  kindOf,
  kinds,
  rares,
} from "./foods";
import { areaOf, centreOf } from "./geometry";
import type { Point } from "./geometry";
import { seeded } from "./random";

const side = (p: Point, q: Point, r: Point) =>
  (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);

const crosses = (a: Point, b: Point, c: Point, d: Point) =>
  side(a, b, c) * side(a, b, d) < 0 && side(c, d, a) * side(c, d, b) < 0;

const edges = (points: readonly Point[]) =>
  points.map((a, i) => [a, points[(i + 1) % points.length]] as const);

const isSimple = (points: readonly Point[]) =>
  edges(points).every(([a, b], i) =>
    edges(points).every(([c, d], j) => {
      const near =
        Math.abs(i - j) <= 1 || Math.abs(i - j) === points.length - 1;
      return near || !crosses(a, b, c, d);
    })
  );

const contains = (points: readonly Point[], p: Point) => {
  let hit = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i, i += 1) {
    const a = points[i];
    const b = points[j];
    if (
      a.y > p.y !== b.y > p.y &&
      p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x
    ) {
      hit = !hit;
    }
  }
  return hit;
};

const apart = (first: readonly Point[], second: readonly Point[]) =>
  !contains(first, second[0]) &&
  !contains(second, first[0]) &&
  edges(first).every(([a, b]) =>
    edges(second).every(([c, d]) => !crosses(a, b, c, d))
  );

describe("foods", () => {
  test("every kind gives simple, separate, finite parts that fit the board off its middle, for many seeds", () => {
    for (const kind of everyKind) {
      for (let seed = 1; seed <= 40; seed += 1) {
        const { parts } = foodOf(kind, seed * 7919);
        const label = `${kind} ${seed}`;
        const points = parts.flat();
        assert.ok(
          points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)),
          label
        );
        const centre = centreOf(parts);
        const away = Math.hypot(centre.x, centre.y);
        assert.ok(
          away >= DRIFT[0] - 1e-9 && away <= DRIFT[1] + 1e-9,
          `${label} sits ${away} from the middle`
        );
        const reach = Math.max(
          ...points.map((p) => Math.hypot(p.x - centre.x, p.y - centre.y))
        );
        assert.ok(
          reach <= 1.0001 && reach >= 0.9999,
          `${label} reaches ${reach}`
        );
        assert.ok(areaOfParts(parts) > 0.25, `${label} is too small`);
        for (const [index, part] of parts.entries()) {
          assert.ok(part.length >= 48, `${label} part ${index} is too coarse`);
          assert.ok(areaOf(part) > 0.02, `${label} part ${index} is a sliver`);
          assert.ok(isSimple(part), `${label} part ${index} crosses itself`);
          for (const other of parts.slice(index + 1)) {
            assert.ok(apart(part, other), `${label} parts overlap`);
          }
        }
      }
    }
  });

  test("there are many kinds, a few of them compound and a few rare", () => {
    assert.ok(kinds.length >= 25);
    assert.ok(rares.length >= 3);
    assert.equal(new Set(everyKind).size, everyKind.length);
    const compound = kinds.filter((kind) => foodOf(kind, 1).parts.length > 1);
    assert.ok(compound.length >= 3, compound.join(", "));
    assert.ok(rares.every(isRare));
    assert.ok(!kinds.some(isRare));
  });

  test("the same seed gives the same food, and another seed a different one", () => {
    for (const kind of everyKind) {
      assert.deepEqual(foodOf(kind, 99), foodOf(kind, 99));
      assert.notDeepEqual(foodOf(kind, 99).parts, foodOf(kind, 100).parts);
    }
  });

  test("about one dish in sixty is rare, and the seed decides which", () => {
    const count = 60_000;
    const roll = seeded(2024);
    const seen = new Set<string>();
    const found: number[] = [];
    for (let i = 0; i < count; i += 1) {
      const seed = 1 + Math.floor(roll() * 2_000_000_000);
      const kind = kindOf(seed);
      seen.add(kind);
      if (isRare(kind)) {
        found.push(seed);
      }
    }
    const expected = count * RARITY;
    assert.ok(
      Math.abs(found.length - expected) < expected * 0.12,
      `${found.length} rare in ${count}, expected about ${expected}`
    );
    assert.equal(seen.size, everyKind.length);
    for (const seed of found.slice(0, 40)) {
      const dish = dishOf(seed);
      assert.equal(dish.kind, kindOf(seed));
      assert.deepEqual(dishOf(seed), dish, `seed ${seed}`);
    }
  });

  test("a cut straight through the middle of the board is no free half", () => {
    const errors: number[] = [];
    for (let seed = 1; seed <= 600; seed += 1) {
      const split = splitBy(dishOf(seed).parts, { angle: 0, offset: 0 });
      errors.push(split === null ? 500 : errorOf(split.small));
    }
    const close = errors.filter((error) => error <= 3).length;
    const median = errors.toSorted((a, b) => a - b)[errors.length / 2] ?? 0;
    assert.ok(close < errors.length * 0.06, `${close} near-perfect`);
    assert.ok(median > 30, `median ${median}`);
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
