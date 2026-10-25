import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { TOTAL, prizeIds } from "./prizes";
import {
  PERFECT,
  iconsOf,
  nextOf,
  queryOf,
  rankOf,
  readResult,
  resultOf,
  shareOf,
} from "./result";
import type { Result } from "./result";

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("share links", () => {
  it("round-trip the prizes knocked down, in shelf order", () => {
    const result = resultOf(["bear", "caramel", "neko"]);
    assert.deepEqual(result.got, ["caramel", "neko", "bear"]);
    assert.deepEqual(roundTrip(result), result);
    assert.deepEqual(roundTrip(resultOf([])), { got: [] });
    assert.deepEqual(roundTrip(resultOf(prizeIds)), { got: prizeIds });
  });

  it("reject broken and tampered links", () => {
    const bad = [
      {},
      { p: "" },
      { p: "01" },
      { p: "-1" },
      { p: "1e2" },
      { p: "512" },
      { p: "1000" },
      { p: "abc" },
      { p: ["3", "4"] },
    ];

    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });
});

describe("ranks", () => {
  it("climb with the points and top out when the shelves are bare", () => {
    assert.equal(rankOf(0).name.ja, "スカ");
    assert.equal(rankOf(10).name.ja, "おまけ");
    assert.equal(rankOf(130).name.ja, "中当たり");
    assert.equal(rankOf(TOTAL - 10).name.ja, "大当たり");
    assert.equal(rankOf(TOTAL).level, PERFECT);
    assert.equal(TOTAL, 330);
  });

  it("the next rank says how many more points", () => {
    assert.equal(nextOf(70)?.more, 30);
    assert.equal(nextOf(70)?.rank.name.ja, "中当たり");
    assert.equal(nextOf(TOTAL), null);
  });
});

describe("share text", () => {
  it("names the haul, the points and the rank, with the prizes as icons", () => {
    const result = resultOf(["caramel", "hanabi", "bear"]);
    const share = shareOf(result, "https://x.y", "ja");

    assert.deepEqual(share.text.split("\n"), [
      "角撃ちコルク",
      "3個倒して140点 · 中当たり",
      "🍬🎆🧸",
      "これより多く倒せる？",
      "#角撃ちコルク",
    ]);

    assert.equal(
      share.url,
      `https://x.y/games/kadouchi?${queryOf(result)}&l=ja`
    );
    assert.equal(
      share.image,
      `https://x.y/games/kadouchi/og?${queryOf(result)}&l=ja`
    );
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });

  it("an empty round says so, with both hashtags in English", () => {
    const lines = shareOf(resultOf([]), "https://x.y", "en").text.split("\n");
    assert.equal(lines[0], "Kadouchi Cork");
    assert.equal(lines[1], "Nothing fell · Empty-handed");
    assert.equal(lines[2], iconsOf(resultOf([])));
    assert.equal(lines.at(-1), "#角撃ちコルク #KadouchiCork");
  });
});
