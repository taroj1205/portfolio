import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  SAFE,
  WARNINGS,
  createCarving,
  lift,
  percentOf,
  rest,
  scratch,
} from "./carve";
import type { Snap } from "./carve";
import { NOTCHES, moulds } from "./moulds";
import type { Point } from "./moulds";

const trace = (speed: number, laps = 1) => {
  const carving = createCarving(moulds.star);
  const { outline } = carving.mould;
  const snaps: Snap[] = [];
  for (let i = 0; i < NOTCHES * laps && !carving.over; i += 1) {
    const from = outline[i % NOTCHES];
    const to = outline[(i + 1) % NOTCHES];
    const seconds = Math.hypot(to.x - from.x, to.y - from.y) / speed;
    snaps.push(...scratch(carving, from, to, seconds));
    rest(carving, seconds);
  }
  return { carving, snaps };
};

describe("carving", () => {
  test("tracing the whole line at a safe speed cuts the shape out", () => {
    const { carving, snaps } = trace(SAFE * 0.9);
    assert.equal(percentOf(carving), 100);
    assert.deepEqual(snaps, [{ type: "clear" }]);
    assert.ok(carving.over);
  });

  test("rushing builds stress, warns three times, then breaks", () => {
    const { carving, snaps } = trace(SAFE * 3);
    const types = snaps.map((snap) => snap.type);
    assert.deepEqual(types, ["warn", "warn", "warn", "break"]);
    assert.ok(percentOf(carving) < 100);
    assert.equal(carving.tension, 1);
  });

  test("the needle floats until its tip first touches the line", () => {
    const carving = createCarving(moulds.circle);
    const [onLine] = carving.mould.outline;
    const centre: Point = { x: 0.5, y: 0.5 };
    const inside: Point = { x: onLine.x, y: onLine.y + 0.1 };
    assert.deepEqual(scratch(carving, centre, inside, 0), []);
    assert.equal(carving.tension, 0);
    assert.equal(carving.touching, false);
    scratch(carving, inside, onLine, 10);
    assert.equal(carving.touching, true);
    assert.equal(carving.tension, 0);
    assert.ok(carving.count > 0);
  });

  test("once touching, scratching away from the line breaks it", () => {
    const carving = createCarving(moulds.circle);
    const [onLine] = carving.mould.outline;
    scratch(carving, onLine, onLine, 0);
    const before = carving.count;
    const snaps = scratch(carving, onLine, { x: 0.5, y: 0.5 }, 10);
    assert.equal(carving.count, before);
    assert.equal(snaps.at(-1)?.type, "break");
  });

  test("lifting the needle lets you move it anywhere for free", () => {
    const carving = createCarving(moulds.circle);
    const [onLine] = carving.mould.outline;
    scratch(carving, onLine, onLine, 0);
    lift(carving);
    assert.equal(carving.touching, false);
    const inside: Point = { x: onLine.x, y: onLine.y + 0.1 };
    assert.deepEqual(scratch(carving, inside, { x: 0.5, y: 0.5 }, 0), []);
    assert.equal(carving.tension, 0);
  });

  test("stress eases off while resting and the warnings can come again", () => {
    const carving = createCarving(moulds.circle);
    const [at] = carving.mould.outline;
    const [first] = WARNINGS;
    carving.tension = first;
    assert.equal(scratch(carving, at, at, 0)[0]?.type, "warn");
    rest(carving, 2);
    assert.equal(carving.tension, 0);
    carving.tension = first;
    assert.equal(scratch(carving, at, at, 0)[0]?.type, "warn");
  });

  test("carving the last notch cuts the shape out even if that stroke rushed", () => {
    const carving = createCarving(moulds.circle);
    const { outline } = carving.mould;
    carving.carved.fill(true, 0, NOTCHES - 1);
    carving.count = NOTCHES - 1;
    carving.tension = 0.95;
    const snaps = scratch(
      carving,
      outline[NOTCHES - 2],
      outline[NOTCHES - 1],
      0
    );
    assert.equal(carving.tension >= 1, true);
    assert.deepEqual(snaps.at(-1), { type: "clear" });
    assert.equal(percentOf(carving), 100);
  });

  test("a finished carving ignores more scratches", () => {
    const { carving } = trace(SAFE * 3);
    assert.deepEqual(scratch(carving, { x: 0, y: 0 }, { x: 1, y: 1 }, 0), []);
  });
});
