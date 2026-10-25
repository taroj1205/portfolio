import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { COLS, UNIT } from "./pile";
import {
  PERFECT,
  barOf,
  nextOf,
  profileOf,
  queryOf,
  rankOf,
  readResult,
  resultOf,
  shareOf,
  syrupOf,
} from "./result";
import type { Result } from "./result";

const cone = (cm: number) =>
  Array.from({ length: COLS }, (_, i) => {
    const t = 1 - (Math.abs(i - (COLS - 1) / 2) - 0.5) / (COLS / 2);

    return Math.max(0.05, t) * cm * UNIT;
  });

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("share links", () => {
  it("round-trip the height, the outline and whether it toppled", () => {
    const served = resultOf(cone(12.34), false);
    assert.equal(served.tenths, 123);
    assert.deepEqual(roundTrip(served), served);
    const fell = resultOf(cone(4), true);
    assert.match(queryOf(fell), /&t=1$/u);
    assert.deepEqual(roundTrip(fell), fell);
    assert.deepEqual(
      roundTrip(resultOf(cone(0), false)),
      resultOf(cone(0), false)
    );
  });

  it("reject broken and tampered links", () => {
    const outline = "0123456789abcdef";

    const bad = [
      {},
      { h: "120" },
      { s: outline },
      { h: "", s: outline },
      { h: "012", s: outline },
      { h: "-5", s: outline },
      { h: "1e2", s: outline },
      { h: "401", s: outline },
      { h: "120", s: "0123" },
      { h: "120", s: "0123456789ABCDEF" },
      { h: "120", s: "0123456789abcde!" },
      { h: "120", s: "0123456789abcdef", t: "yes" },
      { h: ["120", "130"], s: "0123456789abcdef" },
    ];

    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });

  it("the outline redraws the mound at its real height", () => {
    const result = resultOf(cone(10), false);
    const profile = profileOf(result);
    assert.equal(profile.length, result.outline.length);
    assert.ok(Math.abs(Math.max(...profile) - 10 * UNIT) < 1);
  });
});

describe("ranks and syrups", () => {
  it("climb every 3cm up to the summit at 18cm", () => {
    assert.equal(rankOf(0).name.ja, "ひとくち");
    assert.equal(rankOf(29).name.ja, "ひとくち");
    assert.equal(rankOf(30).name.ja, "並盛り");
    assert.equal(rankOf(149).name.ja, "山盛り");
    assert.equal(rankOf(180).level, PERFECT);
    assert.equal(rankOf(400).level, PERFECT);
  });

  it("each rank pours a better syrup", () => {
    assert.equal(syrupOf(0), "mizore");
    assert.equal(syrupOf(30), "ichigo");
    assert.equal(syrupOf(155), "uji");
    assert.equal(syrupOf(180), "rainbow");
  });

  it("the next rank says how much higher", () => {
    assert.equal(nextOf(72)?.more, 18);
    assert.equal(nextOf(72)?.rank.name.ja, "特盛り");
    assert.equal(nextOf(180), null);
  });

  it("the bar sketches the outline of the mound", () => {
    assert.equal(barOf(resultOf(cone(0), false)), "🧊");
    const bar = barOf(resultOf(cone(9), false));

    const cells = Array.from(
      new Intl.Segmenter().segment(bar),
      (each) => each.segment
    );

    assert.equal(cells.length, 16);
    assert.ok(["▁", "▂"].includes(cells[0]), bar);
    assert.ok(["▁", "▂"].includes(cells[15]), bar);
    assert.ok(cells.slice(7, 9).includes("█"), bar);
  });
});

describe("share text", () => {
  it("names the syrup, the height and the rank", () => {
    const result = resultOf(cone(12.34), false);
    const share = shareOf(result, "https://x.y", "ja");
    const lines = share.text.split("\n");
    assert.deepEqual(
      [lines[0], lines[1], lines[3], lines[4]],
      [
        "てっぺんかき氷",
        "ブルーハワイで12.3cm盛った · 山盛り",
        "これより高く盛れる？",
        "#てっぺんかき氷",
      ]
    );
    assert.equal(lines[2], `${barOf(result)} 🟦`);
    assert.equal(
      share.url,
      `https://x.y/games/kakigori?${queryOf(result)}&l=ja`
    );
    assert.equal(
      share.image,
      `https://x.y/games/kakigori/og?${queryOf(result)}&l=ja`
    );
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });

  it("a toppled mound says what was left, with both hashtags in English", () => {
    const { text } = shareOf(resultOf(cone(4.2), true), "https://x.y", "en");
    const lines = text.split("\n");
    assert.equal(lines[0], "Kakigori Summit");
    assert.equal(lines[1], "It toppled, 4.2cm left · Regular");
    assert.equal(lines.at(-1), "#てっぺんかき氷 #KakigoriSummit");
  });
});
