import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import {
  LONGEST,
  SHORTEST,
  hundredths,
  createRun,
  createStick,
  phaseAt,
  step,
  windAt,
} from "./burn";
import type { Point, Run } from "./burn";
import { LAST } from "./phases";
import {
  finished,
  queryOf,
  reachedOf,
  readResult,
  resultOf,
  shareOf,
  titleOf,
  trailOf,
} from "./result";
import { settle } from "./save";
import type { Save } from "./save";

const still = { x: 0, y: 0 };

const hold = (run: Run, seconds: number, hand: (time: number) => Point) => {
  const until = run.time + seconds;
  while (run.end === null && run.time < until - 1e-9) {
    step(run, hand(run.time), true);
  }
  return run;
};

describe("the stick", () => {
  test("the same seed always burns the same way", () => {
    assert.deepEqual(createStick(42), createStick(42));
    assert.notDeepEqual(createStick(42), createStick(43));
  });

  test("small seeds still spread across the whole range", () => {
    const lengths = Array.from(
      { length: 200 },
      (_, seed) => createStick(seed).length
    );
    assert.ok(lengths.every((at) => at >= SHORTEST && at <= LONGEST));
    assert.ok(Math.min(...lengths) < SHORTEST + 300);
    assert.ok(Math.max(...lengths) > LONGEST - 300);
  });

  test("goes through every stage in order", () => {
    const stick = createStick(7);
    const seen: number[] = [];
    for (let time = 0; time < stick.length / 100; time += 0.1) {
      seen.push(phaseAt(stick, time));
    }
    assert.deepEqual([...new Set(seen)], [0, 1, 2, 3, LAST]);
    assert.ok(seen.every((phase, i) => i === 0 || phase >= (seen[i - 1] ?? 0)));
  });

  test("the sway never jumps at a stage change", () => {
    const run = createRun(createStick(9));
    let before = 0;
    while (run.end === null) {
      step(run, still, true);
      assert.ok(Math.abs(run.sway - before) < 0.01);
      before = run.sway;
    }
  });
});

describe("holding", () => {
  test("a still hand always lasts until it burns out", () => {
    for (let seed = 1; seed <= 120; seed += 1) {
      const run = hold(createRun(createStick(seed)), 60, () => still);
      assert.equal(run.end, "burned");
      assert.equal(hundredths(run), run.stick.length);
    }
  });

  test("wind alone never comes close to dropping it", () => {
    let peak = 0;
    for (let seed = 1; seed <= 120; seed += 1) {
      const run = createRun(createStick(seed));
      while (run.end === null) {
        step(run, still, true);
        peak = Math.max(peak, run.sway);
      }
    }
    assert.ok(peak < 0.9);
    assert.ok(peak > 0.3);
  });

  test("the wind actually blows during a burn", () => {
    const stick = createStick(3);
    assert.ok(stick.gusts.length > 2);
    const [, gust] = stick.gusts;
    assert.ok(gust !== undefined);
    assert.ok(Math.abs(windAt(stick, gust.at + gust.span / 2)) > 0.03);
  });

  test("letting go drops it on the spot", () => {
    const run = hold(createRun(createStick(5)), 12.34, () => still);
    step(run, still, false);
    assert.equal(run.end, "released");
    assert.equal(hundredths(run), 1234);
    step(run, still, true);
    assert.equal(hundredths(run), 1234);
  });

  test("only burning out counts as the full length", () => {
    const run = createRun(createStick(5));
    run.time = run.stick.length / 100 - 1e-8;
    step(run, still, false);
    assert.equal(run.end, "released");
    assert.equal(hundredths(run), run.stick.length - 1);
    assert.equal(finished(resultOf(run)), false);
  });

  test("a quick jerk of the finger drops it", () => {
    const run = hold(createRun(createStick(5)), 20, () => still);
    const from = run.time;
    hold(run, 2, (time) => ({
      x: Math.min(1, (time - from) / 0.08) * 0.25,
      y: 0,
    }));
    assert.equal(run.end, "shaken");
  });

  test("a slow drift is fine", () => {
    const run = hold(createRun(createStick(5)), 60, (time) => ({
      x: time / 20,
      y: 0,
    }));
    assert.equal(run.end, "burned");
  });

  test("small shakes that each would be fine add up when they keep coming", () => {
    const nudge = 0.06;
    const once = hold(createRun(createStick(5)), 20, () => still);
    const from = once.time;
    hold(once, 3, (time) => ({ x: time - from < 1 ? nudge : 0, y: 0 }));
    assert.equal(once.end, null);
    const rhythm = hold(createRun(createStick(5)), 20, () => still);
    hold(rhythm, 10, (time) => ({
      x: Math.sin(time * 7) > 0 ? nudge : 0,
      y: 0,
    }));
    assert.equal(rhythm.end, "shaken");
  });
});

describe("results", () => {
  test("round-trip through the share link and stay on the same stick", () => {
    const run = hold(createRun(createStick(123_456)), 31.5, () => still);
    step(run, still, false);
    const result = resultOf(run);
    const parsed = readResult(
      Object.fromEntries(new URLSearchParams(queryOf(result)))
    );
    assert.deepEqual(parsed, result);
    assert.deepEqual(createStick(parsed?.seed ?? 0), run.stick);
  });

  test("rejects links that don't describe a run", () => {
    const { length } = createStick(8);
    assert.equal(readResult({}), null);
    assert.equal(readResult({ s: "8" }), null);
    assert.equal(readResult({ s: "8", t: "-1" }), null);
    assert.equal(readResult({ s: "8", t: "1.5" }), null);
    assert.equal(readResult({ s: "8", t: String(length + 1) }), null);
    assert.equal(readResult({ s: "4294967296", t: "10" }), null);
    assert.deepEqual(readResult({ s: "8", t: String(length) }), {
      seed: 8,
      time: length,
    });
  });

  test("the share text names the time and the last stage reached", () => {
    const stick = createStick(11);
    const time = Math.ceil((stick.starts[2] ?? 0) * 100) + 50;
    const result = { seed: 11, time };
    assert.equal(reachedOf(result), 2);
    const share = shareOf(result, "https://x.y", "ja");
    assert.equal(
      share.text,
      `線香花火 ${(time / 100).toFixed(2)}秒 松葉まで\n🔴🌺🌲▫️▫️\n#線香花火`
    );
    assert.ok(share.url.startsWith("https://x.y/games/senko?s=11&t="));
    assert.ok(share.image.startsWith("https://x.y/games/senko/og?"));
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });

  test("burning all the way down is a finish", () => {
    const result = { seed: 11, time: createStick(11).length };
    assert.ok(finished(result));
    assert.equal(trailOf(result), "🔴🌺🌲🌿🏵️🎇");
    assert.equal(titleOf(result, "ja"), "燃え尽きるまで");
    assert.ok(
      shareOf(result, "https://x.y", "en").text.startsWith(
        `Senko Hanabi ${(result.time / 100).toFixed(2)}s, burned all the way down`
      )
    );
  });
});

describe("save", () => {
  const fresh: Save = {
    best: 0,
    finishes: 0,
    firstPlayed: null,
    held: 0,
    lastPlayed: null,
    runs: 0,
    top: -1,
  };

  test("the first run never counts as a new best, and finishes add up", () => {
    const first = settle(fresh, { seed: 1, time: 900 }, 1000);
    assert.equal(first.record, false);
    assert.equal(first.save.best, 900);
    assert.equal(first.save.runs, 1);
    const done = settle(
      first.save,
      { seed: 1, time: createStick(1).length },
      2000
    );
    assert.equal(done.record, true);
    assert.equal(done.save.finishes, 1);
    assert.equal(settle(done.save, { seed: 1, time: 900 }, 3000).record, false);
  });

  test("keeps the totals a player profile would need", () => {
    const { length } = createStick(1);
    const first = settle(fresh, { seed: 1, time: 900 }, 1000).save;
    const second = settle(first, { seed: 1, time: length }, 5000).save;
    const third = settle(second, { seed: 1, time: 100 }, 9000).save;
    assert.deepEqual(third, {
      best: length,
      finishes: 1,
      firstPlayed: 1000,
      held: 1000 + length,
      lastPlayed: 9000,
      runs: 3,
      top: 4,
    });
  });
});
