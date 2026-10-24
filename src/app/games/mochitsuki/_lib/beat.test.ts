import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import {
  COUNT_IN,
  HAND,
  LIVES,
  START_BPM,
  STEP_BEATS,
  advance,
  counting,
  createRun,
  intervalAt,
  reach,
  resume,
  strike,
  sweep,
  tempoAt,
  windowsAt,
} from "./beat";
import type { Run } from "./beat";

const started = () => {
  const run = createRun(0);

  return { first: run.at, run };
};

const poundAll = (run: Run, count: number) => {
  for (let i = 0; i < count; i += 1) {
    assert.equal(strike(run, run.at).kind, "great");
  }
};

describe("tempo", () => {
  it("starts slow and steps up every eight beats", () => {
    assert.equal(tempoAt(0), START_BPM);
    assert.equal(tempoAt(STEP_BEATS - 1), START_BPM);
    assert.equal(tempoAt(STEP_BEATS), START_BPM + 10);
    assert.equal(tempoAt(STEP_BEATS * 17), 260);
  });

  it("the pound window never reaches into the hand", () => {
    for (const beat of [0, 40, 120, 400, 2000]) {
      const { good, great } = windowsAt(beat);
      assert.ok(great < good);
      assert.ok(good <= intervalAt(beat) * HAND.from);
    }
  });
});

describe("a run", () => {
  it("counts in before the first beat and ignores taps meanwhile", () => {
    const { run, first } = started();
    assert.equal(first, COUNT_IN * intervalAt(0));
    assert.equal(counting(run, 10), true);
    assert.deepEqual(strike(run, 10), { kind: "idle" });
    assert.equal(run.pounds, 0);
    assert.equal(counting(run, first - intervalAt(0) + 1), false);
  });

  it("grades taps by how close they land to the beat", () => {
    const { run, first } = started();
    assert.deepEqual(strike(run, first + 10), {
      beat: 0,
      kind: "great",
      offset: 10,
    });
    const second = run.at;
    assert.deepEqual(strike(run, second - 70), {
      beat: 1,
      kind: "good",
      offset: -70,
    });
    assert.equal(run.pounds, 2);
    assert.equal(run.greats, 1);
    assert.equal(run.streak, 2);
    assert.equal(run.at, second + intervalAt(1));
  });

  it("a tap while the hand is in the mortar ends the run", () => {
    const { run, first } = started();
    strike(run, first);
    const middle = first + intervalAt(0) / 2;
    assert.deepEqual(strike(run, middle), { kind: "hand" });
    assert.equal(run.over, "hand");
    assert.deepEqual(strike(run, run.at), { kind: "idle" });
  });

  it("a tap just outside the window and the hand only breaks the streak", () => {
    const { run, first } = started();
    strike(run, first);
    const outcome = strike(run, first + intervalAt(0) * 0.2);
    assert.deepEqual(outcome, { kind: "flub" });
    assert.equal(run.streak, 0);
    assert.equal(run.misses, 0);
    assert.equal(run.over, null);
  });

  it("letting three beats pass ends the run", () => {
    const { run, first } = started();
    let at = first;

    for (let i = 0; i < LIVES; i += 1) {
      at += intervalAt(i);
    }

    assert.equal(advance(run, at), LIVES);
    assert.equal(run.over, "miss");
  });

  it("misses before a tap are counted before it is judged", () => {
    const { run, first } = started();
    const late = first + intervalAt(0) + 5;
    assert.equal(strike(run, late).kind, "great");
    assert.equal(run.misses, 1);
    assert.equal(run.pounds, 1);
    assert.equal(run.tempo, tempoAt(1));
  });

  it("tempo follows the beat of the last pound", () => {
    const { run } = started();
    poundAll(run, STEP_BEATS + 1);
    assert.equal(run.tempo, START_BPM + 10);
    assert.equal(run.longest, STEP_BEATS + 1);
  });

  it("resuming counts in again at the current tempo", () => {
    const { run } = started();
    poundAll(run, STEP_BEATS);
    resume(run, 50_000);
    assert.equal(run.gap, intervalAt(STEP_BEATS));
    assert.equal(run.at, 50_000 + COUNT_IN * intervalAt(STEP_BEATS));
    assert.equal(advance(run, 50_100), 0);
  });
});

describe("the hand", () => {
  it("is out on the beat and fully in halfway between", () => {
    const { run, first } = started();
    assert.equal(sweep(run, first), 0);
    assert.ok(sweep(run, first - 1) > 0.99);
    assert.ok(Math.abs(sweep(run, first - intervalAt(0) / 2) - 0.5) < 1e-9);
    assert.equal(reach(0), 0);
    assert.equal(reach(1), 0);
    assert.ok(reach(0.5) > 0.95);
    assert.ok(reach(HAND.from) > 0);
    assert.ok(reach(HAND.to) > 0);
  });
});
