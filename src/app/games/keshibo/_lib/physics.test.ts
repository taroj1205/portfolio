import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { bodyOf, firstDesign } from "./eraser";
import type { Design } from "./eraser";
import {
  LANE,
  advance,
  createWorld,
  hopsAt,
  knockedDown,
  launch,
  rack,
  simulate,
  standingOf,
} from "./physics";
import type { Launch } from "./physics";
import { bendOf } from "./session";

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

const flight = (design: Design, launchWith: Launch) => {
  const world = createWorld(bodyOf(design), rack([]));
  launch(world, launchWith);
  let top = 0;
  let landings = 0;
  let flatAfterFlip = false;
  while (!advance(world, 1 / 240)) {
    const { ball } = world;
    top = Math.max(top, ball.z);
    landings += world.contacts.filter((c) => c.type === "land").length;
    world.contacts.length = 0;
    flatAfterFlip ||=
      !ball.dropped &&
      ball.z === 0 &&
      Math.abs(ball.pitch) >= Math.PI &&
      ball.pitch === Math.round(ball.pitch / Math.PI) * Math.PI;
  }
  return { ball: world.ball, flatAfterFlip, landings, top };
};

const soft: Design = { ...firstDesign, core: "soft" };

const curlAt = (power: number, curl: number) => {
  const world = createWorld(bodyOf(firstDesign), rack([]));
  launch(world, { angle: 0, curl, power, x: 0 });
  while (world.ball.y < LANE.head && !advance(world, 1 / 600)) {
    world.contacts.length = 0;
  }
  return world.ball.x;
};

describe("keshibo hops and curl", () => {
  test("a full pull on a soft eraser hops and flips, then lands flat", () => {
    const { flatAfterFlip, landings, top } = flight(soft, {
      angle: 0,
      power: 1,
      x: 0,
    });
    assert.ok(top > 0.2, `top ${top}`);
    assert.ok(landings >= 1);
    assert.ok(flatAfterFlip);
  });

  test("a pull below the hop point never leaves the desk", () => {
    const { top } = flight(soft, {
      angle: 0,
      power: hopsAt(bodyOf(soft)) - 0.05,
      x: 0,
    });
    assert.equal(top, 0);
  });

  test("a jumbo eraser stays down even at full pull", () => {
    const jumbo: Design = { ...soft, form: "jumbo" };
    assert.equal(hopsAt(bodyOf(jumbo)), 1);
    assert.equal(flight(jumbo, { angle: 0, power: 1, x: 0 }).top, 0);
  });

  test("the same hard flick always hops and lands the same way", () => {
    const flick = { angle: 0.03, curl: -0.4, power: 1, x: 1.5 };
    const a = flight(soft, flick);
    const b = flight(soft, flick);
    assert.deepEqual(
      [a.top, a.ball.x, a.ball.y, a.ball.pitch],
      [b.top, b.ball.x, b.ball.y, b.ball.pitch]
    );
  });

  test("curl bends the path the way the finger flicked, more on a slow roll", () => {
    assert.ok(curlAt(0.5, 1) > 1);
    assert.ok(curlAt(0.5, -1) < -1);
    assert.equal(curlAt(0.5, 0), 0);
    assert.ok(curlAt(0.4, 1) > curlAt(0.8, 1));
  });
});

const pullWith = (bulge: number, depth = 140) =>
  bendOf(
    Array.from({ length: 11 }, (_, i) => ({
      x: 200 + bulge * depth * Math.sin((i / 10) * Math.PI),
      y: 600 + (depth * i) / 10,
    }))
  );

describe("keshibo pull shape", () => {
  test("a straight pull has no curl, and a curved one curls the way it bulges", () => {
    assert.equal(pullWith(0), 0);
    assert.equal(pullWith(0.3), 1);
    assert.equal(pullWith(-0.3), -1);
    assert.ok(Math.abs(pullWith(0.135) - 0.5) < 0.01);
  });

  test("a slightly wobbly pull and a tiny pull stay straight", () => {
    assert.equal(pullWith(0.04), 0);
    assert.equal(pullWith(0.3, 30), 0);
    assert.equal(bendOf([{ x: 1, y: 1 }]), 0);
  });
});
