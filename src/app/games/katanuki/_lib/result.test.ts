import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { mouldOf } from "./moulds";
import {
  PERFECT,
  barOf,
  nextOf,
  parOf,
  planOf,
  queryOf,
  rankOf,
  readResult,
  shareOf,
} from "./result";
import type { Result } from "./result";

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

const cleared = (day: number, pace: number): Result => ({
  carved: 100,
  day,
  time: Math.floor(parOf(day) * pace * 10),
});

describe("share links", () => {
  test("round-trip a clear and a break", () => {
    const clear = { carved: 100, day: 3, time: 423 };
    const broke = { carved: 87, day: 3, time: null };
    assert.deepEqual(roundTrip(clear), clear);
    assert.deepEqual(roundTrip(broke), broke);
    assert.equal(queryOf(clear), "n=3&t=423");
    assert.equal(queryOf(broke), "n=3&c=87");
    assert.deepEqual(roundTrip({ carved: 0, day: 1, time: null }), {
      carved: 0,
      day: 1,
      time: null,
    });
  });

  test("reject broken, mixed and tampered links", () => {
    const bad = [
      {},
      { n: "3" },
      { t: "423" },
      { c: "87" },
      { c: "87", n: "3", t: "423" },
      { c: "100", n: "3" },
      { c: "087", n: "3" },
      { c: "-1", n: "3" },
      { c: "8.5", n: "3" },
      { n: "0", t: "423" },
      { n: "100000", t: "423" },
      { n: "3", t: "0" },
      { n: "3", t: "36001" },
      { n: "3", t: "1e3" },
      { n: "3", t: ["423", "424"] },
      { n: "3", t: "9".repeat(5000) },
    ];
    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });
});

describe("ranks", () => {
  test("clears rank by pace against the shape's par, breaks by how far they got", () => {
    assert.equal(rankOf(cleared(3, 0.9)).level, PERFECT);
    assert.equal(rankOf(cleared(3, 1.2)).name.ja, "名人");
    assert.equal(rankOf(cleared(3, 1.8)).name.ja, "職人");
    assert.equal(rankOf(cleared(3, 9)).name.ja, "抜けた");
    assert.equal(rankOf({ carved: 99, day: 3, time: null }).name.ja, "惜しい");
    assert.equal(rankOf({ carved: 80, day: 3, time: null }).name.ja, "惜しい");
    assert.equal(
      rankOf({ carved: 79, day: 3, time: null }).name.ja,
      "ひび割れ"
    );
    assert.equal(rankOf({ carved: 0, day: 3, time: null }).name.ja, "粉々");
  });

  test("the next rank says how much further or faster", () => {
    assert.deepEqual(nextOf({ carved: 87, day: 3, time: null })?.carved, 13);
    assert.equal(
      nextOf({ carved: 87, day: 3, time: null })?.rank.name.ja,
      "抜けた"
    );
    assert.equal(nextOf({ carved: 12, day: 3, time: null })?.carved, 28);
    const slow = cleared(3, 1.8);
    const next = nextOf(slow);
    assert.equal(next?.rank.name.ja, "名人");
    assert.ok((next?.time ?? 0) > 0);
    assert.equal(nextOf(cleared(3, 1)), null);
  });

  test("the bar shows where it broke, or the shape when it came out", () => {
    assert.equal(
      barOf({ carved: 87, day: 3, time: null }),
      "🟧🟧🟧🟧🟧🟧🟧🟧💥⬜"
    );
    assert.equal(
      barOf({ carved: 0, day: 3, time: null }),
      "💥⬜⬜⬜⬜⬜⬜⬜⬜⬜"
    );
    assert.equal(
      barOf({ carved: 99, day: 3, time: null }),
      "🟧🟧🟧🟧🟧🟧🟧🟧🟧💥"
    );
    assert.equal(barOf(cleared(3, 9)), `${"🟧".repeat(10)}${mouldOf(3).emoji}`);
    assert.equal(
      barOf(cleared(3, 1)),
      `${"🟧".repeat(10)}${mouldOf(3).emoji}✨`
    );
  });
});

describe("plans", () => {
  test("a challenge plays its own day, and only today's counts as the daily", () => {
    assert.deepEqual(planOf(null, 5), { day: 5, today: true });
    assert.deepEqual(planOf({ carved: 50, day: 4, time: null }, 5), {
      day: 4,
      today: false,
    });
    assert.deepEqual(planOf({ carved: 50, day: 5, time: null }, 5), {
      day: 5,
      today: true,
    });
  });
});

describe("share text", () => {
  test("a break names the shape, how far it got and the bar", () => {
    const share = shareOf(
      { carved: 87, day: 3, time: null },
      "https://x.y",
      "ja"
    );
    const mould = mouldOf(3).name.ja;
    assert.equal(
      share.text,
      `型抜き お題 #3 ${mould}\n87%で割れた · 惜しい\n🟧🟧🟧🟧🟧🟧🟧🟧💥⬜\n#型抜き`
    );
    assert.equal(share.url, "https://x.y/games/katanuki?n=3&c=87&l=ja");
    assert.equal(share.image, "https://x.y/games/katanuki/og?n=3&c=87&l=ja");
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });

  test("a clear names the time in English too", () => {
    const { text } = shareOf(
      { carved: 100, day: 3, time: 3000 },
      "https://x.y",
      "en"
    );
    assert.ok(
      text.startsWith(
        `Katanuki daily #3 ${mouldOf(3).name.en}\nCut out in 300.0s`
      )
    );
    assert.ok(text.endsWith("#型抜き #Katanuki"));
  });
});
