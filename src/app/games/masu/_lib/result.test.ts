import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { POURS, holdFor, longestHold, outcomeOf, pourOf } from "./pour";
import {
  heroOf,
  lineOf,
  queryOf,
  rankOf,
  readResult,
  shareOf,
  tallyOf,
  verdictOf,
} from "./result";
import type { Result } from "./result";
import { fresh, loadSave, settlePour, settleRun } from "./save";

const SEED = 4_242_424;

const holdsFor = (seed: number, tenths: number) =>
  Array.from({ length: POURS }, (_, index) =>
    holdFor(
      pourOf(seed, index),
      (outcome) => outcome.spilledAt === null && outcome.tenths >= tenths
    )
  );

const spillAll = (seed: number) =>
  Array.from({ length: POURS }, (_, index) => longestHold(pourOf(seed, index)));

const run: Result = { holds: holdsFor(SEED, 900), seed: SEED };

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("a run's tally", () => {
  test("averages the five pours and adds up what was poured and spilled", () => {
    const tally = tallyOf(run);
    assert.equal(tally.glasses.length, POURS);
    assert.equal(tally.spills, 0);
    assert.equal(tally.spilled, 0);
    assert.ok(tally.average >= 900);
    assert.equal(
      tally.average,
      Math.floor(
        tally.glasses.reduce((sum, glass) => sum + glass.outcome.tenths, 0) /
          POURS
      )
    );
    assert.ok(tally.kept > 0);
  });

  test("a spill scores nothing and counts what ran over the rim", () => {
    const tally = tallyOf({ holds: spillAll(SEED), seed: SEED });
    assert.equal(tally.spills, POURS);
    assert.equal(tally.average, 0);
    assert.ok(tally.spilled > 0);
    assert.equal(lineOf(tally, "ja"), "全部こぼした。テーブルが酔っぱらった。");
    assert.equal(lineOf(tally, "en"), "Spilled every one. The table is drunk.");
  });

  test("the rank follows the average", () => {
    assert.equal(rankOf(0).name.ja, "下戸");
    assert.equal(rankOf(199).name.ja, "下戸");
    assert.equal(rankOf(200).name.ja, "見習い");
    assert.equal(rankOf(849).name.ja, "呑兵衛");
    assert.equal(rankOf(950).name.ja, "杜氏");
    assert.equal(rankOf(999).name.en, "Master brewer");
    const tally = tallyOf(run);
    assert.equal(lineOf(tally, "en"), rankOf(tally.average).line.en);
  });
});

describe("a single pour", () => {
  test("the verdict says how it ended, including a spill after letting go", () => {
    const pour = pourOf(SEED, 0);
    const late = holdFor(pour, (outcome) => outcome.spilledAt !== null);
    assert.equal(verdictOf(outcomeOf(pour, longestHold(pour))), "held");
    assert.equal(verdictOf(outcomeOf(pour, late)), "after");
    const at = (tenths: number) =>
      verdictOf(
        outcomeOf(
          pour,
          holdFor(
            pour,
            (outcome) => outcome.spilledAt === null && outcome.tenths >= tenths
          )
        )
      );
    assert.equal(at(950), "brink");
    assert.equal(at(700), "brimming");
    assert.equal(at(1), "room");
    assert.equal(verdictOf(outcomeOf(pour, 0)), "short");
  });

  test("the cup shown for a run is its best pour, and a spilled one only when all spilled", () => {
    const tally = tallyOf(run);
    const best = Math.max(
      ...tally.glasses.map((glass) => glass.outcome.tenths)
    );
    assert.equal(heroOf(tally).outcome.tenths, best);
    const mixed = tallyOf({
      holds: [...spillAll(SEED).slice(0, 4), run.holds[4] ?? 0],
      seed: SEED,
    });
    assert.equal(heroOf(mixed).outcome.spilledAt, null);
    const spilled = tallyOf({ holds: spillAll(SEED), seed: SEED });
    assert.notEqual(heroOf(spilled).outcome.spilledAt, null);
  });
});

describe("sharing a run", () => {
  test("the seed and hold times round-trip through the link", () => {
    assert.deepEqual(roundTrip(run), run);
    const spilled: Result = { holds: spillAll(SEED), seed: SEED };
    assert.deepEqual(roundTrip(spilled), spilled);
    const taps: Result = { holds: [0, 0, 0, 0, 0], seed: 0 };
    assert.deepEqual(roundTrip(taps), taps);
  });

  test("the link carries only the seed and the hold times", () => {
    assert.deepEqual([...new URLSearchParams(queryOf(run)).keys()].toSorted(), [
      "h",
      "s",
    ]);
  });

  test("broken, impossible and tampered links are rejected", () => {
    const base = { h: run.holds.join("-"), s: String(SEED) };
    assert.deepEqual(readResult(base), run);
    const longest = longestHold(pourOf(SEED, 0));
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
      { ...base, h: run.holds.slice(0, 4).join("-") },
      { ...base, h: [...run.holds, 1000].join("-") },
      { ...base, h: run.holds.join(".") },
      { ...base, h: `0${run.holds.join("-")}` },
      { ...base, h: `${base.h}-` },
      { ...base, h: ` ${base.h}` },
      { ...base, h: [longest + 1, 1, 1, 1, 1].join("-") },
      { ...base, h: "99999-1-1-1-1" },
    ];
    for (const params of broken) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });

  test("the share text gives the average, rank and spills, and the link opens the same pours", () => {
    const tally = tallyOf(run);
    const share = shareOf(run, "https://x.y", "ja");
    const lines = share.text.split("\n");
    assert.equal(
      lines[0],
      `枡で表面張力 平均${(tally.average / 10).toFixed(1)}%（${rankOf(tally.average).name.ja}）、一滴もこぼさず。`
    );
    assert.equal(lines.at(-1), "#枡");
    assert.equal(
      share.url,
      `https://x.y/games/masu?h=${run.holds.join("-")}&s=${SEED}&l=ja`
    );
    assert.ok(share.image.startsWith("https://x.y/games/masu/og?h="));
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
    const english = shareOf(
      { holds: spillAll(SEED), seed: SEED },
      "https://x.y",
      "en"
    );
    assert.ok(english.text.includes("5 of 5 spilled"));
    assert.ok(english.text.endsWith("#枡 #Masu"));
  });
});

describe("masu save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("an older or partial save keeps its fields and fills in the rest", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 812, runs: 3, spills: 4 }),
    });
    assert.deepEqual(loadSave(), { ...fresh, best: 812, runs: 3, spills: 4 });
  });

  test("keeps the lifetime totals a player profile would need", () => {
    const spilled = tallyOf({ holds: spillAll(SEED), seed: SEED });
    const tally = tallyOf(run);
    let save = fresh;
    for (const [index, glass] of [
      ...tally.glasses,
      ...spilled.glasses,
    ].entries()) {
      save = settlePour(save, { at: 1000 + index, glass, seconds: 4.2 });
    }
    assert.equal(save.pours, POURS * 2);
    assert.equal(save.spills, POURS);
    assert.equal(save.kept, tally.kept + spilled.kept);
    assert.equal(save.spilled, spilled.spilled);
    assert.equal(save.seconds, 42);
    assert.equal(save.firstPlayed, 1000);
    assert.equal(save.lastPlayed, 1000 + POURS * 2 - 1);
    assert.equal(
      save.bestPour,
      Math.max(...tally.glasses.map((glass) => glass.outcome.tenths))
    );
  });

  test("the first run is never a new best, a better average later is", () => {
    const tally = tallyOf(run);
    const first = settleRun(
      fresh,
      tallyOf({ holds: spillAll(SEED), seed: SEED })
    );
    assert.equal(first.record, false);
    assert.equal(first.save.clean, 0);
    const second = settleRun(first.save, tally);
    assert.equal(second.record, true);
    assert.equal(second.save.best, tally.average);
    assert.equal(second.save.clean, 1);
    assert.equal(second.save.runs, 2);
    assert.equal(settleRun(second.save, tally).record, false);
  });
});
