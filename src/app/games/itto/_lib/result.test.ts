import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { halving } from "./cut";
import { RUN, runOf } from "./foods";
import {
  blocksOf,
  demoOf,
  queryOf,
  rankOf,
  ratioText,
  readResult,
  scoreOf,
  shareOf,
  verdictOf,
} from "./result";
import type { Result } from "./result";

const SEED = 777;
const nudges = [99, -215, 376, 41, -1302];

const played = (seed: number, offsets: readonly number[]): Result => ({
  cuts: runOf(seed).map((food, index) => {
    const angle = 3000 + index * 2500;
    return {
      angle,
      offset: halving(food.outline, angle) + (offsets[index] ?? 0),
    };
  }),
  seed,
});

const run = played(SEED, nudges);

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("scoring a run", () => {
  test("each cut is scored from its own geometry and the errors add up", () => {
    const scored = scoreOf(run);
    assert.ok(scored !== null);
    const smalls = scored.pieces.map((piece) => piece.split.small);
    assert.equal(smalls.length, RUN);
    assert.equal(
      scored.total,
      smalls.reduce((sum, small) => sum + (500 - small), 0)
    );
    assert.equal(
      scored.best.split.small,
      Math.max(...smalls),
      "best is the closest to half"
    );
  });

  test("perfect halving scores zero off", () => {
    const scored = scoreOf(played(SEED, [0, 0, 0, 0, 0]));
    assert.equal(scored?.total, 0);
    assert.equal(rankOf(0).name.en, "Divine hand");
  });

  test("ranks and lines follow the total, from divine hand to a sibling feud", () => {
    assert.equal(rankOf(5).name.ja, "神業");
    assert.equal(rankOf(6).name.ja, "板長");
    assert.equal(rankOf(40).name.ja, "板前");
    assert.equal(rankOf(90).name.ja, "見習い");
    assert.equal(rankOf(200).name.ja, "皿洗い");
    assert.equal(rankOf(2500).name.ja, "兄弟げんか");
  });

  test("a cut reads as a ratio to one decimal, smaller side first", () => {
    assert.equal(ratioText(497), "49.7 : 50.3");
    assert.equal(ratioText(500), "50.0 : 50.0");
    assert.equal(ratioText(0), "0.0 : 100.0");
    assert.equal(verdictOf(500, "ja"), "ぴったり半分");
    assert.equal(verdictOf(497, "en"), "Almost exactly half");
    assert.equal(verdictOf(120, "en"), "That's an end, not a half");
  });
});

describe("share links", () => {
  test("carry only the seed and the five cuts, and round-trip", () => {
    assert.deepEqual(roundTrip(run), run);
    assert.deepEqual([...new URLSearchParams(queryOf(run)).keys()].toSorted(), [
      "c",
      "s",
    ]);
    assert.equal(
      queryOf(run),
      `c=${run.cuts.map((cut) => `${cut.angle}.${cut.offset}`).join("_")}&s=777`
    );
  });

  test("reject broken, tampered and impossible links", () => {
    const c = run.cuts.map((cut) => `${cut.angle}.${cut.offset}`);
    const bad = [
      {},
      { s: "777" },
      { c: c.join("_") },
      { c: c.join("_"), s: "0" },
      { c: c.join("_"), s: "-777" },
      { c: c.join("_"), s: "0777" },
      { c: c.join("_"), s: "7.5" },
      { c: c.join("_"), s: "2147483647" },
      { c: c.join("_"), s: ["777", "778"] },
      { c: c.slice(0, 4).join("_"), s: "777" },
      { c: [...c, c[0]].join("_"), s: "777" },
      { c: c.join(","), s: "777" },
      { c: ["18000.0", ...c.slice(1)].join("_"), s: "777" },
      { c: ["-1.0", ...c.slice(1)].join("_"), s: "777" },
      { c: ["0.12001", ...c.slice(1)].join("_"), s: "777" },
      { c: ["0.012", ...c.slice(1)].join("_"), s: "777" },
      { c: ["0.1.2", ...c.slice(1)].join("_"), s: "777" },
      { c: ["0.-0", ...c.slice(1)].join("_"), s: "777" },
      { c: ["1e3.0", ...c.slice(1)].join("_"), s: "777" },
      { c: [" 0.0", ...c.slice(1)].join("_"), s: "777" },
      { c: ["0.11999", ...c.slice(1)].join("_"), s: "777" },
      { c: `${c.join("_")}${"9".repeat(5000)}`, s: "777" },
    ];
    for (const params of bad) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });

  test("the same cuts on another seed's shapes are judged on those shapes", () => {
    const moved = { ...run, seed: SEED + 1 };
    const scored = scoreOf(moved);
    const original = scoreOf(run);
    assert.ok(scored === null || scored.total !== original?.total);
  });

  test("the share text names the total, the rank, the closest cut and the link", () => {
    const scored = scoreOf(run);
    assert.ok(scored !== null);
    const share = shareOf(run, scored, "https://x.y", "ja");
    assert.ok(share.text.startsWith("一刀で5つ切って、ズレ合計"));
    assert.ok(share.text.includes(blocksOf(scored)));
    assert.ok(share.text.includes(ratioText(scored.best.split.small)));
    assert.ok(share.text.endsWith("#一刀"));
    assert.equal(share.url, `https://x.y/games/itto?${queryOf(run)}&l=ja`);
    assert.equal(share.image, `https://x.y/games/itto/og?${queryOf(run)}&l=ja`);
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
    assert.equal(blocksOf(scored).match(/🟩|🟨|🟧|🟥/gu)?.length, RUN);
  });

  test("the demo always cuts its food in two", () => {
    for (let round = 0; round < 24; round += 1) {
      const small = demoOf(round).split?.small ?? 0;
      assert.ok(small > 480, `round ${round}: ${small}`);
    }
  });
});
