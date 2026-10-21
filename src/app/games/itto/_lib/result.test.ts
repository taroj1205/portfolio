import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { halving, splitBy } from "./cut";
import { dishOf, isRare } from "./foods";
import {
  demoOf,
  pieceOf,
  queryOf,
  rankOf,
  ratioText,
  readResult,
  shareOf,
} from "./result";
import type { Result } from "./result";

const played = (seed: number, nudge: number): Result => {
  const angle = 3000;
  return {
    cut: { angle, offset: halving(dishOf(seed).parts, angle) + nudge },
    seed,
  };
};

const cut = played(777, 99);

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

const rareSeed = () => {
  for (let seed = 1; ; seed += 1) {
    if (isRare(dishOf(seed).kind)) {
      return seed;
    }
  }
};

describe("scoring a cut", () => {
  test("the cut is scored from the shape its seed gives", () => {
    const piece = pieceOf(cut);
    assert.ok(piece !== null);
    assert.equal(piece.food.kind, dishOf(777).kind);
    assert.ok(piece.split.small < 500 && piece.split.small > 300);
    assert.equal(piece.split.sides[0].share + piece.split.sides[1].share, 1000);
  });

  test("halving exactly scores 50.0 : 50.0 and the top rank", () => {
    const piece = pieceOf(played(777, 0));
    assert.equal(piece?.split.small, 500);
    assert.equal(rankOf(500).name.en, "Divine hand");
  });

  test("ranks follow how far the cut is from half", () => {
    assert.equal(rankOf(500).name.ja, "神業");
    assert.equal(rankOf(499).name.ja, "板長");
    assert.equal(rankOf(497).name.ja, "板長");
    assert.equal(rankOf(496).name.ja, "板前");
    assert.equal(rankOf(490).name.ja, "板前");
    assert.equal(rankOf(470).name.ja, "見習い");
    assert.equal(rankOf(420).name.ja, "皿洗い");
    assert.equal(rankOf(300).name.ja, "兄弟げんか");
    assert.equal(rankOf(120).name.ja, "端切れ");
    assert.equal(rankOf(0).name.en, "Offcut");
  });

  test("a cut reads as a ratio to one decimal, smaller side first", () => {
    assert.equal(ratioText(497), "49.7 : 50.3");
    assert.equal(ratioText(500), "50.0 : 50.0");
    assert.equal(ratioText(0), "0.0 : 100.0");
  });
});

describe("share links", () => {
  test("carry only the seed and the one cut, and round-trip", () => {
    assert.deepEqual(roundTrip(cut), cut);
    assert.equal(queryOf(cut), `c=${cut.cut.angle}.${cut.cut.offset}&s=777`);
    for (const seed of [1, 42, 99_999, 2_147_483_646]) {
      const result = played(seed, -37);
      assert.deepEqual(roundTrip(result), result, `seed ${seed}`);
    }
  });

  test("a rare piece comes back from its link", () => {
    const seed = rareSeed();
    const result = played(seed, 12);
    const back = roundTrip(result);
    assert.ok(back !== null);
    const piece = pieceOf(back);
    assert.ok(piece !== null && isRare(piece.food.kind));
    assert.deepEqual(piece.food, dishOf(seed));
  });

  test("reject broken, tampered and impossible links", () => {
    const c = `${cut.cut.angle}.${cut.cut.offset}`;
    const bad = [
      {},
      { s: "777" },
      { c },
      { c, s: "0" },
      { c, s: "-777" },
      { c, s: "0777" },
      { c, s: "7.5" },
      { c, s: "2147483647" },
      { c, s: ["777", "778"] },
      { c: [c, c], s: "777" },
      { c: `${c}_${c}`, s: "777" },
      { c: "18000.0", s: "777" },
      { c: "-1.0", s: "777" },
      { c: "0.12001", s: "777" },
      { c: "0.012", s: "777" },
      { c: "0.1.2", s: "777" },
      { c: "0.-0", s: "777" },
      { c: "1e3.0", s: "777" },
      { c: " 0.0", s: "777" },
      { c: "0.11999", s: "777" },
      { c: `${c}${"9".repeat(5000)}`, s: "777" },
    ];
    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });

  test("the same cut on another seed is judged on that seed's shape", () => {
    const moved = { ...cut, seed: 778 };
    assert.deepEqual(
      pieceOf(moved)?.split ?? null,
      splitBy(dishOf(778).parts, cut.cut)
    );
  });

  test("the share text names the split, the food, the rank and the link", () => {
    const piece = pieceOf(cut);
    assert.ok(piece !== null);
    const share = shareOf(cut, piece, "https://x.y", "ja");
    assert.ok(share.text.includes(ratioText(piece.split.small)));
    assert.ok(share.text.includes(rankOf(piece.split.small).name.ja));
    assert.ok(share.text.endsWith("#一刀"));
    assert.ok(!share.text.includes("レア"));
    assert.equal(share.url, `https://x.y/games/itto?${queryOf(cut)}&l=ja`);
    assert.equal(share.image, `https://x.y/games/itto/og?${queryOf(cut)}&l=ja`);
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });

  test("a rare piece says so in the share text", () => {
    const result = played(rareSeed(), 40);
    const piece = pieceOf(result);
    assert.ok(piece !== null);
    assert.ok(
      shareOf(result, piece, "https://x.y", "ja").text.startsWith("✨ レア")
    );
    assert.ok(
      shareOf(result, piece, "https://x.y", "en").text.startsWith(
        "✨ A rare one"
      )
    );
  });

  test("the demo always cuts its food in two", () => {
    for (let round = 0; round < 40; round += 1) {
      const small = demoOf(round).split?.small ?? 0;
      assert.ok(small > 480, `round ${round}: ${small}`);
    }
  });
});
