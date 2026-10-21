import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  SAFE,
  WARNINGS,
  createCarving,
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

  test("scratching away from the line breaks it without carving", () => {
    const carving = createCarving(moulds.circle);
    const start: Point = { x: 0.5, y: 0.5 };
    const snaps = scratch(carving, start, { x: 0.5, y: 0.66 }, 10);
    assert.equal(carving.count, 0);
    assert.equal(snaps.at(-1)?.type, "break");
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
