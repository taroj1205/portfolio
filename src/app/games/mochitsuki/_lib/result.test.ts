import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { START_BPM, tempoAt } from "./beat";
import {
  MOST,
  PERFECT,
  barOf,
  beats,
  nextOf,
  queryOf,
  rankOf,
  ranks,
  readResult,
  resultOf,
  shareOf,
  tempoFits,
} from "./result";
import type { Result } from "./result";

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

const at = (pounds: number, ending: Result["ending"] = "hand"): Result => ({
  ending,
  pounds,
  tempo: tempoAt(pounds - 1),
});

describe("share links", () => {
  test("round-trip both endings", () => {
    assert.deepEqual(roundTrip(at(87)), at(87));
    assert.deepEqual(roundTrip(at(12, "miss")), at(12, "miss"));
    const none: Result = { ending: "miss", pounds: 0, tempo: START_BPM };
    assert.deepEqual(roundTrip(none), none);
    assert.equal(queryOf(at(87)), "b=190&e=h&p=87");
  });

  test("accept a tempo up to two missed beats ahead", () => {
    assert.equal(tempoFits(8, tempoAt(7)), true);
    assert.equal(tempoFits(8, tempoAt(9)), true);
    assert.equal(tempoFits(7, tempoAt(8)), true);
    assert.equal(tempoFits(5, tempoAt(8)), false);
    assert.equal(tempoFits(0, START_BPM + 10), false);
  });

  test("reject broken, mixed and tampered links", () => {
    const bad = [
      {},
      { p: "87" },
      { b: "190", p: "87" },
      { b: "190", e: "x", p: "87" },
      { b: "190", e: "h", p: "087" },
      { b: "190", e: "h", p: "-1" },
      { b: "190", e: "h", p: "8.5" },
      { b: "190", e: "h", p: "1000" },
      { b: "195", e: "h", p: "87" },
      { b: "260", e: "h", p: "87" },
      { b: "80", e: "h", p: "0" },
      { b: "190", e: ["h", "m"], p: "87" },
      { b: "0190", e: "h", p: "87" },
    ];
    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });

  test("cap a run beyond the link limit to a value the link can carry", () => {
    const capped = resultOf({ pounds: MOST + 40, tempo: 1400 }, "miss");
    assert.equal(capped.pounds, MOST);
    assert.deepEqual(roundTrip(capped), capped);
    assert.deepEqual(resultOf({ pounds: 3, tempo: START_BPM }, "hand"), {
      ending: "hand",
      pounds: 3,
      tempo: START_BPM,
    });
  });

  test("share text, image and post link carry the language and result", () => {
    const share = shareOf(at(87), "https://example.com", "ja");
    assert.equal(
      share.url,
      "https://example.com/games/mochitsuki?b=190&e=h&p=87&l=ja"
    );
    assert.equal(
      share.image,
      "https://example.com/games/mochitsuki/og?b=190&e=h&p=87&l=ja"
    );
    assert.match(share.text, /87回 · 極上/u);
    assert.match(share.text, /相方の手をついた/u);
    assert.match(postUrl(share), /^https:\/\/x\.com\/intent\/tweet\?/u);
    const en = shareOf(at(1, "miss"), "https://example.com", "en");
    assert.match(en.text, /1 hit · Still rice/u);
    assert.match(en.text, /lost the beat/u);
  });
});

describe("rank thresholds", () => {
  test("climb with every threshold and stop at the top", () => {
    for (const rank of ranks) {
      assert.equal(rankOf(rank.least).level, rank.level);
      if (rank.least > 0) {
        assert.equal(rankOf(rank.least - 1).level, rank.level - 1);
      }
    }
    assert.equal(rankOf(MOST).level, PERFECT);
    assert.deepEqual(nextOf(20), { more: 5, rank: ranks[2] });
    assert.equal(nextOf(ranks[PERFECT].least), null);
  });

  test("the bar fills toward the top rank and marks the ending", () => {
    assert.equal(barOf(at(0, "miss")), `${"▫️".repeat(10)}💨`);
    assert.equal(barOf(at(70)), `${"⬜".repeat(5)}${"▫️".repeat(5)}🤚💥`);
    assert.equal(barOf(at(200)), `${"⬜".repeat(10)}🤚💥✨`);
  });

  test("more pounds win, then the higher tempo", () => {
    assert.ok(beats(at(10), at(9)) > 0);
    assert.ok(beats(at(9), at(10)) < 0);
    const later = { ...at(8), tempo: tempoAt(9) };
    assert.ok(beats(later, at(8)) > 0);
    assert.equal(beats(at(8), at(8, "miss")), 0);
  });
});
