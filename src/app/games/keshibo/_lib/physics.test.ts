import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { bodyOf, firstDesign } from "./eraser";
import { knockedDown, rack, simulate, standingOf } from "./physics";

const body = bodyOf(firstDesign);

describe("keshibo physics", () => {
  test("a firm flick down the middle knocks every pin over", () => {
    const world = simulate(body, { angle: 0, power: 0.55, x: 0 });
    assert.equal(knockedDown(world), 10);
    assert.equal(world.rolling, false);
  });

  test("a soft flick stops short and leaves the rack standing", () => {
    const world = simulate(body, { angle: 0, power: 0.15, x: 0 });
    assert.equal(knockedDown(world), 0);
    assert.equal(world.ball.dropped, false);
  });

  test("a hard flick angled away falls off the side of the desk", () => {
    const world = simulate(body, { angle: 0.32, power: 1, x: 10 });
    assert.equal(world.ball.dropped, true);
    assert.equal(knockedDown(world), 0);
  });

  test("the same flick always gives the same pinfall", () => {
    const flick = { angle: -0.04, power: 0.7, x: 2.5 };
    assert.equal(
      knockedDown(simulate(body, flick)),
      knockedDown(simulate(body, flick))
    );
  });

  test("pins left standing keep their spots and ids for the second roll", () => {
    const world = simulate(body, { angle: 0, power: 0.3, x: -6 });
    const standing = standingOf(world);
    assert.ok(standing.length > 0 && standing.length < 10);
    const second = rack(standing);
    assert.deepEqual(
      second.map((pin) => pin.id),
      standing.map((spot) => spot.id)
    );
  });
});
