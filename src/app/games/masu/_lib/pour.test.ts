import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  bottles,
  cups,
  holdFor,
  limitOf,
  longestHold,
  outcomeOf,
  pourOf,
  pouredAt,
  rateAt,
  volumeAt,
} from "./pour";

const pour = pourOf(2026, 0);

describe("the pour", () => {
  test("the same seed and the same timing always fill the same", () => {
    assert.deepEqual(pourOf(2026, 3), pourOf(2026, 3));
    assert.notDeepEqual(pourOf(2026, 3), pourOf(2027, 3));
    assert.notDeepEqual(pourOf(2026, 3), pourOf(2026, 4));
    assert.deepEqual(outcomeOf(pour, 3210), outcomeOf(pourOf(2026, 0), 3210));
  });

  test("every bottle and cup turns up across seeds", () => {
    const seen = Array.from({ length: 60 }, (_, seed) => pourOf(seed, 0));
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
  });

  test("letting go before the sake arrives pours nothing", () => {
    const early = outcomeOf(pour, Math.floor(pour.lag * 500));
    assert.equal(early.volume, 0);
    assert.equal(early.tenths, 0);
    assert.equal(early.spilledAt, null);
  });

  test("past the hidden limit it spills, even after you let go", () => {
    const held = outcomeOf(pour, longestHold(pour));
    assert.equal(held.spilledAt, held.hold);
    assert.equal(held.tenths, 0);
    const late = holdFor(pour, (each) => each.spilledAt !== null);
    const after = outcomeOf(pour, late);
    assert.ok(late < longestHold(pour));
    assert.ok(after.spilledAt !== null && after.spilledAt > after.hold);
    assert.ok(
      Math.abs(volumeAt(pour, after.hold, after.spilledAt) - limitOf(pour)) <
        1e-9
    );
    const safe = outcomeOf(pour, late - 1);
    assert.equal(safe.spilledAt, null);
    assert.ok(safe.volume <= limitOf(pour));
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
});
