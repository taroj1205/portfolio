import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { moulds } from "./moulds";
import type { MouldId } from "./moulds";
import {
  PERFECT,
  barOf,
  nextOf,
  parOf,
  queryOf,
  rankOf,
  readResult,
  shareOf,
} from "./result";
import type { Result } from "./result";

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

const cleared = (mould: MouldId, pace: number): Result => ({
  carved: 100,
  mould,
  time: Math.floor(parOf(mould) * pace * 10),
});

const broke = (carved: number): Result => ({
  carved,
  mould: "star",
  time: null,
});

describe("share links", () => {
  test("round-trip a clear and a break with their shape", () => {
    const clear: Result = { carved: 100, mould: "umbrella", time: 423 };
    assert.deepEqual(roundTrip(clear), clear);
    assert.deepEqual(roundTrip(broke(87)), broke(87));
    assert.deepEqual(roundTrip(broke(0)), broke(0));
    assert.equal(queryOf(clear), "m=umbrella&t=423");
    assert.equal(queryOf(broke(87)), "m=star&c=87");
  });

  test("reject broken, mixed and tampered links", () => {
    const bad = [
      {},
      { m: "star" },
      { t: "423" },
      { c: "87" },
      { m: "heart", t: "423" },
      { m: "STAR", t: "423" },
      { m: ["star", "fish"], t: "423" },
      { c: "87", m: "star", t: "423" },
      { c: "100", m: "star" },
      { c: "087", m: "star" },
      { c: "-1", m: "star" },
      { c: "8.5", m: "star" },
      { m: "star", t: "0" },
      { m: "star", t: "36001" },
      { m: "star", t: "1e3" },
      { m: "star", t: ["423", "424"] },
      { m: "star", t: "9".repeat(5000) },
    ];
    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });
});

describe("ranks", () => {
  test("clears rank by pace against the shape's length, breaks by how far they got", () => {
    assert.equal(rankOf(cleared("star", 0.9)).level, PERFECT);
    assert.equal(rankOf(cleared("star", 1.2)).name.ja, "名人");
    assert.equal(rankOf(cleared("star", 1.8)).name.ja, "職人");
    assert.equal(rankOf(cleared("star", 9)).name.ja, "抜けた");
    assert.equal(rankOf(broke(99)).name.ja, "惜しい");
    assert.equal(rankOf(broke(80)).name.ja, "惜しい");
    assert.equal(rankOf(broke(79)).name.ja, "ひび割れ");
    assert.equal(rankOf(broke(0)).name.ja, "粉々");
  });

  test("the same time ranks higher on a longer shape", () => {
    const time = Math.floor(parOf("circle") * 1.2 * 10);
    assert.equal(
      rankOf({ carved: 100, mould: "circle", time }).name.ja,
      "名人"
    );
    assert.equal(rankOf({ carved: 100, mould: "sakura", time }).level, PERFECT);
  });

  test("the next rank says how much further or faster", () => {
    assert.equal(nextOf(broke(87))?.carved, 13);
    assert.equal(nextOf(broke(87))?.rank.name.ja, "抜けた");
    assert.equal(nextOf(broke(12))?.carved, 28);
    const next = nextOf(cleared("star", 1.8));
    assert.equal(next?.rank.name.ja, "名人");
    assert.ok((next?.time ?? 0) > 0);
    assert.equal(nextOf(cleared("star", 1)), null);
  });

  test("the bar shows where it broke, or the shape when it came out", () => {
    assert.equal(barOf(broke(87)), "🟧🟧🟧🟧🟧🟧🟧🟧💥⬜");
    assert.equal(barOf(broke(0)), "💥⬜⬜⬜⬜⬜⬜⬜⬜⬜");
    assert.equal(barOf(broke(99)), "🟧🟧🟧🟧🟧🟧🟧🟧🟧💥");
    assert.equal(barOf(cleared("fish", 9)), `${"🟧".repeat(10)}🐟`);
    assert.equal(barOf(cleared("fish", 1)), `${"🟧".repeat(10)}🐟✨`);
  });
});

describe("share text", () => {
  test("a break names the shape, how far it got and the bar", () => {
    const share = shareOf(broke(87), "https://x.y", "ja");
    assert.equal(
      share.text,
      "型抜き 星\n87%で割れた · 惜しい\n🟧🟧🟧🟧🟧🟧🟧🟧💥⬜\n割らずに抜ける？\n#型抜き"
    );
    assert.equal(share.url, "https://x.y/games/katanuki?m=star&c=87&l=ja");
    assert.equal(share.image, "https://x.y/games/katanuki/og?m=star&c=87&l=ja");
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });

  test("a clear names the time and dares a faster one", () => {
    const { text } = shareOf(
      { carved: 100, mould: "umbrella", time: 3000 },
      "https://x.y",
      "en"
    );
    assert.ok(
      text.startsWith(`Katanuki ${moulds.umbrella.name.en}\nCut out in 300.0s`)
    );
    assert.ok(text.endsWith("Can you cut it out faster?\n#型抜き #Katanuki"));
  });
});
