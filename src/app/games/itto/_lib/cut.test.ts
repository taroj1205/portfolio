import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  cutOf,
  errorOf,
  halving,
  judgeSwipe,
  lineOf,
  splitBy,
  steer,
} from "./cut";
import { areaOf, centroidOf, clip, flip, spansOf } from "./geometry";
import type { Point } from "./geometry";

const square: Point[] = [
  { x: -1, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
];

const cup: Point[] = [
  { x: -1, y: -1 },
  { x: -0.5, y: -1 },
  { x: -0.5, y: 0.5 },
  { x: 0.5, y: 0.5 },
  { x: 0.5, y: -1 },
  { x: 1, y: -1 },
  { x: 1, y: 1 },
  { x: -1, y: 1 },
];

const near = (actual: number, expected: number) =>
  Math.abs(actual - expected) <= 1e-9;

describe("polygon area", () => {
  test("the shoelace formula gives the exact area either way round", () => {
    assert.ok(near(areaOf(square), 4));
    assert.ok(near(areaOf(square.toReversed()), 4));
    assert.ok(
      near(
        areaOf([
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 0, y: 4 },
        ]),
        6
      )
    );
    assert.ok(near(areaOf(cup), 4 - 1.5));
  });

  test("the centroid of a square is its middle", () => {
    const centre = centroidOf(square);
    assert.ok(near(centre.x, 0));
    assert.ok(near(centre.y, 0));
  });
});

describe("splitting along a line", () => {
  test("the two sides add back up to the whole", () => {
    const line = { d: 0.3, nx: Math.SQRT1_2, ny: Math.SQRT1_2 };
    assert.ok(
      near(areaOf(clip(square, line)) + areaOf(clip(square, flip(line))), 4)
    );
  });

  test("a line through the middle of a square halves it", () => {
    const split = splitBy(square, { angle: 0, offset: 0 });
    assert.ok(split !== null);
    assert.equal(split.small, 500);
    assert.deepEqual(
      split.sides.map((side) => side.share),
      [500, 500]
    );
  });

  test("an off-centre cut is measured by area, to a tenth of a percent", () => {
    const split = splitBy(square, { angle: 0, offset: 5000 });
    assert.ok(split !== null);
    assert.equal(split.small, 250);
    assert.equal(errorOf(split.small), 250);
    const diagonal = splitBy(square, { angle: 4500, offset: 0 });
    assert.equal(diagonal?.small, 500);
  });

  test("a line across a concave outline finds every stretch of food it crosses", () => {
    const line = lineOf({ angle: 9000, offset: -2500 });
    assert.equal(spansOf(cup, line).length, 2);
    const split = splitBy(cup, { angle: 9000, offset: -2500 });
    assert.ok(split !== null);
    assert.equal(split.faces.length, 2);
    assert.ok(
      near(
        areaOf(split.sides[0].points) + areaOf(split.sides[1].points),
        areaOf(cup)
      )
    );
  });

  test("a line that misses the food can't split it", () => {
    assert.equal(splitBy(square, { angle: 0, offset: 12_000 }), null);
  });

  test("halving finds the offset that splits the area in two", () => {
    for (const angle of [0, 3000, 9000, 15_500]) {
      const split = splitBy(cup, { angle, offset: halving(cup, angle) });
      assert.equal(split?.small, 500, `angle ${angle}`);
    }
  });
});

describe("a swipe", () => {
  test("from one side to the other is a cut", () => {
    const swipe = judgeSwipe(square, { x: -1.5, y: 0.2 }, { x: 1.5, y: 0.1 });
    assert.equal(swipe.kind, "cut");
  });

  test("that stops inside the food didn't go all the way through", () => {
    assert.deepEqual(judgeSwipe(square, { x: -1.5, y: 0 }, { x: 0.2, y: 0 }), {
      kind: "partial",
    });
    assert.deepEqual(judgeSwipe(square, { x: 0, y: 0 }, { x: 0.5, y: 0.5 }), {
      kind: "partial",
    });
  });

  test("that never touches the food is a miss, even if its line would", () => {
    assert.deepEqual(
      judgeSwipe(square, { x: -1.5, y: 1.5 }, { x: 1.5, y: 1.5 }),
      { kind: "miss" }
    );
    assert.deepEqual(judgeSwipe(square, { x: -3, y: 0 }, { x: -1.6, y: 0 }), {
      kind: "miss",
    });
  });

  test("that barely moves is a tap", () => {
    assert.deepEqual(judgeSwipe(square, { x: 0, y: 0 }, { x: 0.01, y: 0 }), {
      kind: "tap",
    });
    assert.deepEqual(judgeSwipe(square, { x: 0, y: 0 }, { x: 0, y: 0 }), {
      kind: "tap",
    });
  });

  test("crossing only one arm of a concave outline is not a full cut", () => {
    const swipe = judgeSwipe(cup, { x: -1.5, y: -0.25 }, { x: 0, y: -0.25 });
    assert.equal(swipe.kind, "partial");
  });

  test("the cut is snapped to the same grid a share link uses", () => {
    const cut = cutOf({ d: -0.123456, nx: -1, ny: 0 });
    assert.deepEqual(cut, { angle: 0, offset: 1235 });
    const back = cutOf(lineOf(cut));
    assert.deepEqual(back, cut);
    for (const angle of [0, 1, 8999, 17_999]) {
      assert.deepEqual(cutOf(lineOf({ angle, offset: -42 })), {
        angle,
        offset: -42,
      });
    }
  });
});

describe("aiming with the keyboard", () => {
  test("arrows turn and move the knife, and Shift is finer", () => {
    const aim = { angle: 0, offset: 0 };
    assert.deepEqual(steer(aim, "ArrowLeft", false), {
      angle: 17_800,
      offset: 0,
    });
    assert.deepEqual(steer(aim, "ArrowRight", true), { angle: 20, offset: 0 });
    assert.deepEqual(steer(aim, "ArrowDown", false), { angle: 0, offset: 200 });
    assert.deepEqual(steer({ angle: 0, offset: 11_900 }, "ArrowDown", false), {
      angle: 0,
      offset: 12_000,
    });
    assert.equal(steer(aim, "Enter", false), null);
  });

  test("turning past 0° or 180° keeps the knife on the same side", () => {
    const left = steer({ angle: 100, offset: 2000 }, "ArrowLeft", false);
    assert.deepEqual(left, { angle: 17_900, offset: -2000 });
    assert.deepEqual(
      steer({ angle: 17_900, offset: -2000 }, "ArrowRight", false),
      {
        angle: 100,
        offset: 2000,
      }
    );
    const before = lineOf({ angle: 100, offset: 2000 });
    const after = lineOf(left ?? { angle: 0, offset: 0 });
    assert.ok(Math.abs(before.nx * before.d - after.nx * after.d) < 0.05);
  });
});
