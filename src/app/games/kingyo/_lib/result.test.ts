import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import type { KindId } from "./fish";
import {
  PERFECT,
  barOf,
  countOf,
  nextOf,
  queryOf,
  rankOf,
  readResult,
  resultOf,
  shareOf,
} from "./result";
import type { Result } from "./result";

const many = (kind: KindId, count: number): KindId[] =>
  Array.from({ length: count }, () => kind);

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("share links", () => {
  test("round-trip the count of every kind", () => {
    const result = resultOf([
      ...many("wakin", 12),
      ...many("demekin", 3),
      "ogon",
      "nushi",
    ]);
    assert.equal(queryOf(result), "f=12.0.3.0.0.1.1");
    assert.deepEqual(roundTrip(result), result);
    assert.deepEqual(roundTrip(resultOf([])), resultOf([]));
  });

  test("reject broken and tampered links", () => {
    const bad = [
      {},
      { f: "" },
      { f: "1.2.3" },
      { f: "1.0.0.0.0.0.0.0" },
      { f: "01.0.0.0.0.0.0" },
      { f: "-1.0.0.0.0.0.0" },
      { f: "1.5.0.0.0.0.0x" },
      { f: "1e2.0.0.0.0.0.0" },
      { f: "999.999.0.0.0.0.0" },
      { f: "1000.0.0.0.0.0.0" },
      { f: ["1.0.0.0.0.0.0", "2.0.0.0.0.0.0"] },
    ];
    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });
});

describe("ranks", () => {
  test("climb with the number of fish", () => {
    assert.equal(rankOf(0).name.ja, "破れた");
    assert.equal(rankOf(1).name.ja, "一匹");
    assert.equal(rankOf(9).name.ja, "いい腕");
    assert.equal(rankOf(10).name.ja, "すくい名人");
    assert.equal(rankOf(22).level, PERFECT);
    assert.equal(rankOf(500).level, PERFECT);
  });

  test("the next rank says how many more", () => {
    assert.equal(nextOf(7)?.more, 3);
    assert.equal(nextOf(7)?.rank.name.ja, "すくい名人");
    assert.equal(nextOf(22), null);
  });

  test("the bar puts the rarest catches first and counts the rest", () => {
    assert.equal(barOf(resultOf([])), "💧");
    assert.equal(barOf(resultOf(["wakin", "ogon", "ryukin"])), "🌟🐠🐟");
    assert.equal(
      barOf(resultOf([...many("wakin", 14), "nushi"])),
      `👑${"🐟".repeat(9)}+5`
    );
  });
});

describe("share text", () => {
  test("names the count, the rank and the rarest catch", () => {
    const result = resultOf([...many("wakin", 10), "ogon", "sarasa"]);
    assert.equal(countOf(result), 12);
    const share = shareOf(result, "https://x.y", "ja");
    assert.equal(
      share.text,
      `ポイ一枚伝説\nポイ一枚で12匹すくった · すくい名人\n🌟${"🐟".repeat(9)}+2\n黄金の金魚も、すくった 🌟\nこれより多くすくえる？\n#ポイ一枚伝説`
    );
    assert.equal(share.url, "https://x.y/games/kingyo?f=10.1.0.0.0.1.0&l=ja");
    assert.equal(
      share.image,
      "https://x.y/games/kingyo/og?f=10.1.0.0.0.1.0&l=ja"
    );
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });

  test("a poi torn before the first fish dares for just one", () => {
    const { text } = shareOf(resultOf([]), "https://x.y", "en");
    assert.equal(
      text,
      "One Poi Legend\nTore my poi without catching a single fish · Torn\n💧\nCan you catch one?\n#ポイ一枚伝説 #OnePoiLegend"
    );
  });

  test("only common fish leave out the brag line", () => {
    const { text } = shareOf(resultOf(many("sarasa", 3)), "https://x.y", "en");
    assert.equal(
      text,
      "One Poi Legend\nScooped 3 fish with one poi · Festival fun\n🐟🐟🐟\nCan you scoop more?\n#ポイ一枚伝説 #OnePoiLegend"
    );
  });
});
