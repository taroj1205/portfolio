import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import {
  capacity,
  holdFor,
  longestHold,
  mlOf,
  outcomeOf,
  pourOf,
} from "./pour";
import {
  glassOf,
  lineOf,
  queryOf,
  rankOf,
  readResult,
  scoreOf,
  shareOf,
  spilledOf,
} from "./result";
import type { Result } from "./result";
import { fresh, loadSave, settle } from "./save";

const SEED = 4_242_424;
const pour = pourOf(SEED);

const holdAt = (tenths: number) =>
  holdFor(
    pour,
    (outcome) => outcome.spilledAt === null && outcome.tenths >= tenths
  );

const near: Result = { hold: holdAt(950), seed: SEED };
const late: Result = {
  hold: holdFor(pour, (outcome) => outcome.spilledAt !== null),
  seed: SEED,
};
const held: Result = { hold: longestHold(pour), seed: SEED };

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("one pour's result", () => {
  test("is recomputed from the seed and the hold time alone", () => {
    const glass = glassOf(near);
    assert.deepEqual(glass, glassOf({ ...near }));
    assert.deepEqual(glass.outcome, outcomeOf(pourOf(SEED), near.hold));
    assert.equal(glass.spilled, 0);
    assert.equal(glass.kept, Math.round(mlOf(pour, glass.outcome.volume)));
    assert.ok(glass.kept > capacity[pour.cup]);
  });

  test("a spill keeps the cup full to the rim and puts the rest on the table", () => {
    const glass = glassOf(late);
    assert.ok(spilledOf(glass));
    assert.equal(glass.kept, capacity[pour.cup]);
    assert.equal(
      glass.spilled,
      Math.round(mlOf(pour, glass.outcome.poured) - capacity[pour.cup])
    );
    assert.ok(glass.spilled > 0);
    assert.equal(scoreOf(glass), -1);
  });

  test("the rank follows the score, and a spill gets its own", () => {
    const at = (tenths: number) => {
      const hold = holdAt(tenths);
      return rankOf(glassOf({ hold, seed: SEED })).name.ja;
    };
    assert.equal(rankOf(glassOf({ hold: 0, seed: SEED })).name.ja, "下戸");
    assert.equal(at(200), "見習い");
    assert.equal(at(700), "呑兵衛");
    assert.equal(at(950), "杜氏");
    assert.equal(rankOf(glassOf(late)).name.ja, "あと一滴");
    assert.equal(rankOf(glassOf(held)).name.en, "Generous pour");
    assert.equal(lineOf(glassOf(near), "en"), rankOf(glassOf(near)).line.en);
  });

  test("a spill's line is picked by the seed, so the result, card and share agree", () => {
    const lines = new Set(
      Array.from({ length: 12 }, (_, seed) => {
        const each = pourOf(seed);
        return lineOf(glassOf({ hold: longestHold(each), seed }), "ja");
      })
    );
    assert.ok(lines.size > 2);
    assert.equal(lineOf(glassOf(late), "ja"), lineOf(glassOf(late), "ja"));
  });
});

describe("sharing a pour", () => {
  test("the seed and hold time round-trip through the link", () => {
    assert.deepEqual(roundTrip(near), near);
    assert.deepEqual(roundTrip(late), late);
    assert.deepEqual(roundTrip(held), held);
    assert.deepEqual(roundTrip({ hold: 0, seed: 0 }), { hold: 0, seed: 0 });
  });

  test("the link carries only the seed and the hold time", () => {
    assert.deepEqual(
      [...new URLSearchParams(queryOf(near)).keys()].toSorted(),
      ["h", "s"]
    );
  });

  test("broken, impossible and tampered links are rejected", () => {
    const base = { h: String(near.hold), s: String(SEED) };
    assert.deepEqual(readResult(base), near);
    const broken: Record<string, string | string[] | undefined>[] = [
      {},
      { ...base, s: undefined },
      { ...base, h: undefined },
      { ...base, s: "-1" },
      { ...base, s: "1.5" },
      { ...base, s: "01" },
      { ...base, s: "4294967296" },
      { ...base, s: "1e3" },
      { ...base, s: [String(SEED), "1"] },
      { ...base, h: `${near.hold}-1` },
      { ...base, h: `0${near.hold}` },
      { ...base, h: ` ${near.hold}` },
      { ...base, h: "1.5" },
      { ...base, h: String(longestHold(pour) + 1) },
      { ...base, h: "99999" },
      { ...base, h: "100000" },
    ];
    for (const params of broken) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });

  test("the share text gives the score, rank and real numbers, and the link opens the same pour", () => {
    const glass = glassOf(near);
    const share = shareOf(near, "https://x.y", "ja");
    const lines = share.text.split("\n");
    assert.equal(
      lines[0],
      `表面張力酒場 表面張力 ${(glass.outcome.tenths / 10).toFixed(1)}%（${rankOf(glass).name.ja}）`
    );
    assert.match(lines[1] ?? "", /^縁から \+\d+\.\dmm で止めた。$/u);
    assert.equal(lines.at(-1), "#表面張力酒場");
    assert.equal(
      share.url,
      `https://x.y/games/masu?h=${near.hold}&s=${SEED}&l=ja`
    );
    assert.ok(share.image.startsWith("https://x.y/games/masu/og?h="));
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
    const spilt = shareOf(late, "https://x.y", "en").text.split("\n");
    assert.equal(
      spilt[0],
      "Surface Tension Bar: I spilled it (One drop too many)"
    );
    assert.equal(spilt[1], `${glassOf(late).spilled} ml on the table.`);
    assert.equal(spilt.at(-1), "#表面張力酒場 #SurfaceTensionBar");
  });
});

describe("masu save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("an older or partial save keeps its fields and fills in the rest", () => {
    vi.stubGlobal("localStorage", {
      getItem: () =>
        JSON.stringify({ best: 812, bottles: { tokkuri: 2 }, pours: 3 }),
    });
    assert.deepEqual(loadSave(), {
      ...fresh,
      best: 812,
      bottles: { ...fresh.bottles, tokkuri: 2 },
      pours: 3,
    });
  });

  test("keeps the lifetime totals a player profile would need", () => {
    let save = fresh;
    const pours = [near, late, held, near];
    for (const [index, result] of pours.entries()) {
      ({ save } = settle(save, {
        at: 1000 + index,
        glass: glassOf(result),
        seconds: 4.2,
      }));
    }
    assert.equal(save.pours, 4);
    assert.equal(save.spills, 2);
    assert.equal(save.late, 1);
    assert.equal(save.close, 2);
    assert.equal(save.best, glassOf(near).outcome.tenths);
    assert.equal(
      save.kept,
      pours.reduce((sum, result) => sum + glassOf(result).kept, 0)
    );
    assert.equal(save.spilled, glassOf(late).spilled + glassOf(held).spilled);
    assert.equal(save.bottles[pour.bottle], 4);
    assert.equal(save.cups[pour.cup], 4);
    assert.equal(save.seconds, 16.8);
    assert.equal(save.firstPlayed, 1000);
    assert.equal(save.lastPlayed, 1003);
  });

  test("the first pour is never a new best, a better one later is, a spill never is", () => {
    const first = settle(fresh, {
      at: 1,
      glass: glassOf({ hold: holdAt(500), seed: SEED }),
      seconds: 1,
    });
    assert.equal(first.record, false);
    const spill = settle(first.save, {
      at: 2,
      glass: glassOf(late),
      seconds: 1,
    });
    assert.equal(spill.record, false);
    const better = settle(spill.save, {
      at: 3,
      glass: glassOf(near),
      seconds: 1,
    });
    assert.equal(better.record, true);
    assert.equal(
      settle(better.save, { at: 4, glass: glassOf(near), seconds: 1 }).record,
      false
    );
  });
});
