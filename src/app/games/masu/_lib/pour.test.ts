import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  bottles,
  capacity,
  cups,
  flowAt,
  holdFor,
  insideAt,
  limitOf,
  longestHold,
  mlOf,
  outcomeOf,
  overflowAt,
  pourOf,
  pouredAt,
  rateAt,
  volumeAt,
} from "./pour";

const pour = pourOf(2026);

const close = (a: number, b: number, within = 1e-9) => {
  assert.ok(Math.abs(a - b) < within, `${a} vs ${b}`);
};

describe("the pour", () => {
  test("the same seed and the same timing always fill the same", () => {
    assert.deepEqual(pourOf(2026), pourOf(2026));
    assert.notDeepEqual(pourOf(2026), pourOf(2027));
    assert.deepEqual(outcomeOf(pour, 3210), outcomeOf(pourOf(2026), 3210));
    assert.equal(pour.seed, 2026);
  });

  test("every bottle and cup turns up across seeds", () => {
    const seen = Array.from({ length: 60 }, (_, seed) => pourOf(seed));
    for (const bottle of bottles) {
      assert.ok(
        seen.some((each) => each.bottle === bottle),
        bottle
      );
    }
    for (const cup of cups) {
      assert.ok(
        seen.some((each) => each.cup === cup),
        cup
      );
    }
  });

  test("nothing reaches the cup until the bottle tips, then it glugs", () => {
    assert.equal(pouredAt(pour, pour.lag * 0.9), 0);
    assert.equal(rateAt(pour, pour.lag * 0.9), 0);
    assert.equal(rateAt(pour, -1), 0);
    const rates = Array.from({ length: 200 }, (_, i) =>
      rateAt(pour, pour.lag + i / 100)
    );
    assert.ok(Math.max(...rates) > Math.min(...rates) * 1.2);
    assert.ok(pouredAt(pour, 2) < pouredAt(pour, 2.01));
  });

  test("it keeps trickling for a moment after you let go, then stops", () => {
    const hold = 2;
    const released = volumeAt(pour, hold, hold);
    const later = volumeAt(pour, hold, hold + pour.trickle / 2);
    const settled = volumeAt(pour, hold, hold + pour.trickle);
    assert.ok(later > released);
    assert.ok(settled > later);
    assert.equal(volumeAt(pour, hold, hold + pour.trickle + 5), settled);
    assert.ok(settled < pouredAt(pour, hold + pour.trickle));
    assert.equal(flowAt(pour, hold, hold + pour.trickle), 0);
  });

  test("the stream drawn on screen is exactly the rate that fills the cup", () => {
    const hold = 2.4;
    for (const t of [0.5, 1.3, 2.39, 2.45, 2.4 + pour.trickle * 0.7]) {
      const step = 1e-6;
      const slope =
        (volumeAt(pour, hold, t + step) - volumeAt(pour, hold, t - step)) /
        (2 * step);
      assert.ok(Math.abs(slope - flowAt(pour, hold, t)) < 1e-3, `${t}`);
    }
  });

  test("letting go before the sake arrives pours nothing", () => {
    const early = outcomeOf(pour, Math.floor(pour.lag * 500));
    assert.equal(early.volume, 0);
    assert.equal(early.poured, 0);
    assert.equal(early.tenths, 0);
    assert.equal(early.spilledAt, null);
  });

  test("past the hidden limit it spills, even after you let go", () => {
    const held = outcomeOf(pour, longestHold(pour));
    assert.equal(held.spilledAt, held.hold);
    assert.equal(held.tenths, 0);
    assert.equal(held.volume, 1);
    const late = holdFor(pour, (each) => each.spilledAt !== null);
    const after = outcomeOf(pour, late);
    assert.ok(late < longestHold(pour));
    assert.ok(after.spilledAt !== null && after.spilledAt > after.hold);
    close(volumeAt(pour, after.hold, after.spilledAt), limitOf(pour));
    close(after.spilled, after.poured - 1);
    assert.ok(after.spilled > pour.dome);
    const safe = outcomeOf(pour, late - 1);
    assert.equal(safe.spilledAt, null);
    assert.equal(safe.spilled, 0);
    assert.ok(safe.volume <= limitOf(pour));
  });

  test("what stays in the cup and what runs over always add up to what was poured", () => {
    const late = holdFor(pour, (each) => each.spilledAt !== null);
    const after = outcomeOf(pour, late);
    const { hold, spilledAt } = after;
    for (let t = 0; t < after.settledAt + 1; t += 0.05) {
      close(
        insideAt(pour, hold, spilledAt, t) +
          overflowAt(pour, hold, spilledAt, t),
        volumeAt(pour, hold, t)
      );
      assert.ok(insideAt(pour, hold, spilledAt, t) <= limitOf(pour) + 1e-12);
    }
    close(insideAt(pour, hold, spilledAt, after.settledAt), 1);
    close(
      overflowAt(pour, hold, spilledAt, after.settledAt + 5),
      after.spilled
    );
    assert.equal(overflowAt(pour, Infinity, null, 9), 0);
    assert.equal(insideAt(pour, Infinity, null, 99), limitOf(pour));
  });

  test("the score is how far into the dome the surface got, to a tenth of a percent", () => {
    const short = holdFor(pour, (each) => each.volume > 0.9);
    assert.equal(outcomeOf(pour, short).tenths, 0);
    const near = outcomeOf(
      pour,
      holdFor(pour, (each) => each.tenths >= 950)
    );
    assert.equal(near.spilledAt, null);
    assert.ok(near.tenths >= 950 && near.tenths < 1000);
    assert.equal(
      near.tenths,
      Math.floor(((near.volume - 1) / pour.dome) * 1000)
    );
  });

  test("ml above the rim follow the dome's height, not the time spent pouring", () => {
    assert.equal(mlOf(pour, 1), capacity[pour.cup]);
    assert.equal(mlOf(pour, 0.5), capacity[pour.cup] / 2);
    const brim = mlOf(pour, limitOf(pour)) - capacity[pour.cup];
    close(brim, pour.rise * 4.5);
    assert.ok(brim > 5 && brim < 25);
  });
});
