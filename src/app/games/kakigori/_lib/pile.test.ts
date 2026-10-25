import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { seeded } from "../../_lib/svg";
import { steer } from "./demo";
import {
  DX,
  LIMIT,
  REACH,
  SLOPE,
  UNIT,
  aim,
  cmOf,
  createPile,
  heightOf,
  pour,
  relax,
  serve,
  step,
} from "./pile";
import type { Pile } from "./pile";

const DT = 1 / 60;
const LAG = 12;

type Hand = (
  pile: Pile,
  seen: { lean: number; rate: number },
  t: number
) => number;

const play = (hand: Hand, seed: number, wary: boolean) => {
  const pile = createPile(seeded(seed));
  const seen: { lean: number; rate: number }[] = [];
  let rate = 0;
  let before = 0;

  for (let i = 0; i < 60 * 120; i += 1) {
    rate += ((pile.lean - before) / DT - rate) * 0.15;
    before = pile.lean;
    seen.push({ lean: pile.lean, rate });
    aim(pile, hand(pile, seen[Math.max(0, seen.length - 1 - LAG)], i * DT));
    pour(pile, true);
    const out = step(pile, DT);

    if (out.some((each) => each.type === "topple")) {
      return { cm: cmOf(heightOf(pile.cols)), cols: pile.cols, toppled: true };
    }

    const shaky =
      wary &&
      Math.abs(pile.lean) > LIMIT * 0.6 &&
      heightOf(pile.cols) > 5 * UNIT;

    if (out.some((each) => each.type === "empty") || shaky) {
      serve(pile);

      return { cm: cmOf(heightOf(pile.cols)), cols: pile.cols, toppled: false };
    }
  }

  return { cm: cmOf(heightOf(pile.cols)), cols: pile.cols, toppled: false };
};

const careful: Hand = (_pile, seen) => steer(seen.lean, seen.rate);
const still: Hand = () => 0;
const flail: Hand = (_pile, _seen, t) => Math.sin(t * 1.3) * 120;

const average = (values: readonly number[]) =>
  values.reduce((sum, each) => sum + each, 0) / values.length;

const SEEDS = [1, 2, 3, 4, 5, 6];

describe("the mound", () => {
  it("steering the glass toward the lean keeps it standing well past where a still glass topples", () => {
    const steered = SEEDS.map((seed) => play(careful, seed, true));
    const left = SEEDS.map((seed) => play(still, seed, false));
    assert.ok(
      steered.every((run) => !run.toppled),
      JSON.stringify(steered)
    );
    assert.ok(
      left.every((run) => run.toppled),
      JSON.stringify(left)
    );
    assert.ok(
      average(steered.map((run) => run.cm)) >= 13,
      JSON.stringify(steered)
    );
  });

  it("a steered mound rises as a rounded dome, not a needle", () => {
    for (const seed of SEEDS) {
      const { cols } = play(careful, seed, true);
      const top = heightOf(cols);
      const half = cols.filter((h) => h > top / 2).length * DX;
      assert.ok(half > top * 0.5, `${half}px wide at half of ${top}px`);
    }
  });

  it("swinging the glass about spills the ice and topples early", () => {
    const runs = SEEDS.map((seed) => play(flail, seed, false));
    assert.ok(
      runs.every((run) => run.toppled),
      JSON.stringify(runs)
    );
    assert.ok(average(runs.map((run) => run.cm)) < 5, JSON.stringify(runs));
  });

  it("ice falls straight down, so a glass pulled away from the shaver catches nothing", () => {
    const pile = createPile(seeded(9));
    aim(pile, REACH);

    for (let i = 0; i < 240; i += 1) {
      step(pile, DT);
    }

    pour(pile, true);

    for (let i = 0; i < 120; i += 1) {
      step(pile, DT);
    }

    assert.equal(heightOf(pile.cols), 0);
    assert.ok(pile.spilled > 100, `spilled ${pile.spilled}`);
  });

  it("a low mound never topples, however it is poured", () => {
    const pile = createPile(seeded(4));
    pour(pile, true);

    for (let i = 0; i < 60 * 3; i += 1) {
      aim(pile, i % 60 < 30 ? -90 : 90);
      const out = step(pile, DT);
      assert.ok(out.every((each) => each.type !== "topple"));

      if (heightOf(pile.cols) > 3 * UNIT) {
        break;
      }
    }
  });

  it("serving stops the shaver and leaves the mound as it was", () => {
    const pile = createPile(seeded(2));
    pour(pile, true);

    for (let i = 0; i < 120; i += 1) {
      step(pile, DT);
    }

    serve(pile);
    const kept = [...pile.cols];
    pour(pile, true);

    for (let i = 0; i < 240; i += 1) {
      step(pile, DT);
    }

    assert.deepEqual(pile.cols, kept);
    assert.equal(pile.pouring, false);
  });

  it("settling never leaves a slope steeper than the ice can hold", () => {
    const cols = [0, 0, 400, 0, 0, 900, 30, 0];
    relax(cols, 0, 200);

    for (let i = 0; i < cols.length - 1; i += 1) {
      assert.ok(Math.abs(cols[i] - cols[i + 1]) <= SLOPE * DX + 1e-6);
    }
  });
});
