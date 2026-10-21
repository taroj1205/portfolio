import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  PERFECT,
  formatGap,
  hundredthsBetween,
  moonsOf,
  nextOf,
  rankOf,
} from "./judge";

describe("timing", () => {
  test("counts whole hundredths like a stopwatch", () => {
    assert.equal(hundredthsBetween(1000, 11_000), 1000);
    assert.equal(hundredthsBetween(1000, 10_999.9), 999);
    assert.equal(hundredthsBetween(1000, 11_009.9), 1000);
    assert.equal(hundredthsBetween(1000, 11_010), 1001);
  });

  test("float noise in the timestamps never costs a hundredth", () => {
    for (const start of [0.1, 12_345.6, 98_765.4321, 3_600_000.7]) {
      assert.equal(hundredthsBetween(start, start + 10_000), 1000);
      assert.equal(hundredthsBetween(start, start + 7420), 742);
    }
  });
});

describe("ranks", () => {
  test("only exactly on target is perfect", () => {
    assert.equal(rankOf(0).level, PERFECT);
    assert.equal(rankOf(0).name.ja, "神業");
    assert.equal(rankOf(1).name.ja, "体内時計");
    assert.equal(rankOf(-1).name.ja, "体内時計");
  });

  test("bands are closed at their edge and the same both ways", () => {
    const names = [3, 4, 10, 11, 25, 26, 50].map((off) => [
      rankOf(off).name.en,
      rankOf(-off).name.en,
    ]);
    assert.deepEqual(names, [
      ["Human clock", "Human clock"],
      ["Master", "Master"],
      ["Master", "Master"],
      ["Sharp", "Sharp"],
      ["Sharp", "Sharp"],
      ["Not bad", "Not bad"],
      ["Not bad", "Not bad"],
    ]);
  });

  test("a big miss says whether it was early or late", () => {
    assert.equal(rankOf(-51).name.ja, "せっかち");
    assert.equal(rankOf(51).name.ja, "のんびり");
    assert.equal(rankOf(-100).name.ja, "せっかち");
    assert.equal(rankOf(-101).name.ja, "早とちり");
    assert.equal(rankOf(101).name.ja, "浦島太郎");
    assert.equal(rankOf(5000).level, 0);
  });

  test("the next rank is on the same side and says how much closer", () => {
    assert.deepEqual(nextOf(14), {
      closer: 4,
      rank: rankOf(10),
    });
    assert.equal(nextOf(-300)?.rank.name.ja, "せっかち");
    assert.equal(nextOf(300)?.rank.name.ja, "のんびり");
    assert.equal(nextOf(300)?.closer, 200);
    assert.equal(nextOf(2)?.rank.level, PERFECT);
    assert.equal(nextOf(0), null);
  });

  test("every level reads as a row of moons", () => {
    assert.equal(moonsOf(0), "🌑🌑🌑🌑🌑");
    assert.equal(moonsOf(4), "🌕🌕🌕🌕🌑");
    assert.equal(moonsOf(5), "🌕🌕🌕🌕🌕");
    assert.equal(moonsOf(PERFECT), "🌕🌕🌕🌕🌕✨");
  });

  test("gaps carry a sign", () => {
    assert.equal(formatGap(0), "±0.00");
    assert.equal(formatGap(-2), "−0.02");
    assert.equal(formatGap(123), "+1.23");
  });
});
