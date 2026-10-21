import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { copy } from "./copy";
import { tiers } from "./duel";
import {
  challengeOf,
  headlineOf,
  isFooled,
  lineOf,
  nextOf,
  queryOf,
  rankOf,
  readResult,
  resultOf,
  shareOf,
} from "./result";
import type { Result } from "./result";
import { loadSave, settleDuel, settleRun, settleVersus } from "./save";

const fast: Result = { miss: null, reaction: 182 };
const cat: Result = { miss: "cat", reaction: null };

const empty = () => {
  vi.stubGlobal("localStorage", { getItem: () => null });
  return loadSave();
};

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("a duel's result", () => {
  test("a counted reaction is the result, whoever's blade landed", () => {
    assert.deepEqual(
      resultOf({ kind: "cut", reaction: 182, side: "left" }, 182),
      fast
    );
    assert.deepEqual(
      resultOf({ kind: "cut", reaction: 490, side: "right" }, 530),
      { miss: null, reaction: 530 }
    );
  });

  test("never drawing in time, a false start and a fake-out are misses", () => {
    assert.deepEqual(
      resultOf({ kind: "cut", reaction: 490, side: "right" }, null),
      { miss: "slow", reaction: null }
    );
    assert.deepEqual(
      resultOf({ fake: null, kind: "early", reaction: 80, side: "left" }, null),
      { miss: "early", reaction: null }
    );
    assert.deepEqual(
      resultOf(
        { fake: "cat", kind: "early", reaction: null, side: "left" },
        null
      ),
      cat
    );
  });

  test("the rank follows how many of the five the time would have cut down", () => {
    assert.equal(rankOf(null).name.ja, "素人");
    assert.equal(rankOf(tiers[0]).name.ja, "素人");
    assert.equal(rankOf(tiers[0] - 1).name.ja, "門下生");
    assert.equal(rankOf(tiers[3] - 1).name.ja, "剣豪");
    assert.equal(rankOf(tiers[4]).name.ja, "剣豪");
    assert.equal(rankOf(tiers[4] - 1).name.ja, "剣聖");
    assert.equal(rankOf(182).name.en, "Sword saint");
  });

  test("the next opponent and how much faster it takes are real numbers", () => {
    assert.deepEqual(nextOf(300), { gap: 16, tier: 3 });
    assert.deepEqual(nextOf(tiers[3]), { gap: 1, tier: 3 });
    assert.deepEqual(nextOf(530), { gap: 41, tier: 0 });
    assert.equal(nextOf(tiers[4] - 1), null);
    assert.equal(
      copy.ja.gap(copy.ja.tiers[3], "16ms"),
      "あと16ms速ければ、人斬りを斬れた"
    );
    assert.equal(
      copy.en.gap(copy.en.tiers[1], "16ms"),
      "16ms faster to cut down the rōnin"
    );
  });

  test("the headline is the time, or what went wrong", () => {
    assert.equal(headlineOf(fast, "ja"), "182ms");
    assert.equal(headlineOf(cat, "ja"), "お手つき");
    assert.equal(
      headlineOf({ miss: "slow", reaction: null }, "en"),
      "Cut down"
    );
  });

  test("a fake-out says what you fell for, anything else says who fell", () => {
    assert.ok(isFooled(cat));
    assert.ok(isFooled({ miss: "early", reaction: null }));
    assert.ok(!isFooled({ miss: "slow", reaction: null }));
    assert.ok(!isFooled(fast));
    assert.equal(lineOf(cat, "ja"), "猫に斬りかかった。");
    assert.equal(lineOf(cat, "en"), "Drew on a cat.");
    assert.equal(lineOf(fast, "ja"), "剣聖を斬った。今日からあなたが剣聖。");
    assert.equal(
      lineOf({ miss: null, reaction: 300 }, "en"),
      "The dojo master falls. Good enough to run the dojo."
    );
    assert.equal(
      lineOf({ miss: "slow", reaction: null }, "ja"),
      "足軽に斬られた。まずは刀の抜き方から。"
    );
  });

  test("each of the five has a name in both languages", () => {
    for (const lang of ["en", "ja"] as const) {
      assert.equal(copy[lang].tiers.length, tiers.length);
    }
  });
});

describe("sharing a result", () => {
  test("a result round-trips through the link", () => {
    assert.deepEqual(roundTrip(fast), fast);
    assert.deepEqual(roundTrip(cat), cat);
    const slow: Result = { miss: "slow", reaction: null };
    assert.deepEqual(roundTrip(slow), slow);
    const late: Result = { miss: null, reaction: 640 };
    assert.deepEqual(roundTrip(late), late);
  });

  test("the link carries only the time, or the miss", () => {
    assert.equal(queryOf(fast), "t=182");
    assert.equal(queryOf(cat), "e=cat");
  });

  test("broken, oversized and tampered links are rejected", () => {
    const broken: Record<string, string | string[] | undefined>[] = [
      {},
      { l: "ja" },
      { t: "99" },
      { t: "1001" },
      { t: "2e2" },
      { t: "0182" },
      { t: " 182" },
      { t: "1820000000000000000000" },
      { t: ["182", "183"] },
      { e: "sleep" },
      { e: "clear" },
      { e: "cat", t: "182" },
    ];
    for (const params of broken) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });

  test("a timed link is a challenge at that time, a miss is not", () => {
    assert.deepEqual(challengeOf(readResult({ l: "en", t: "182" })), {
      best: 182,
    });
    assert.equal(challengeOf(readResult({ e: "cat" })), null);
    assert.equal(challengeOf(null), null);
  });

  test("the share text leads with the time and says who fell", () => {
    const share = shareOf(fast, "https://x.y", "ja");
    assert.equal(
      share.text,
      "居合で182ms。剣聖を斬った。今日からあなたが剣聖。\nこの速さ、斬れる？\n#居合"
    );
    assert.equal(share.url, "https://x.y/games/iai?t=182&l=ja");
    assert.equal(share.image, "https://x.y/games/iai/og?t=182&l=ja");
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
    assert.equal(
      shareOf({ miss: null, reaction: 300 }, "https://x.y", "en").text,
      "Iai, the quick-draw duel: 300ms. The dojo master falls. Good enough to run the dojo.\nCan you draw faster?\n#居合 #Iai"
    );
  });

  test("a fake-out is shared as the funny moment it was", () => {
    assert.equal(
      shareOf(cat, "https://x.y", "ja").text,
      "居合で、猫に斬りかかった。\nあなたは、動かずにいられる？\n#居合"
    );
    assert.equal(
      shareOf(cat, "https://x.y", "en").text,
      "Iai, the quick-draw duel: Drew on a cat.\nCould you keep still?\n#居合 #Iai"
    );
    assert.equal(
      shareOf({ miss: "leaf", reaction: null }, "https://x.y", "ja").url,
      "https://x.y/games/iai?e=leaf&l=ja"
    );
  });
});

describe("links shared before one duel per game", () => {
  test("a run with times opens at the sharer's best time, as a challenge", () => {
    const run = readResult({ a: "274", b: "231", e: "slow", l: "ja", r: "4" });
    assert.deepEqual(run, { miss: null, reaction: 231 });
    assert.deepEqual(challengeOf(run), { best: 231 });
    assert.deepEqual(readResult({ a: "236", b: "201", e: "clear", r: "5" }), {
      miss: null,
      reaction: 201,
    });
    assert.deepEqual(readResult({ a: "400", b: "380", e: "leaf", r: "2" }), {
      miss: null,
      reaction: 380,
    });
    assert.deepEqual(readResult({ a: "640", b: "610", e: "slow", r: "0" }), {
      miss: null,
      reaction: 610,
    });
  });

  test("a run that ended before any time opens as the miss it was", () => {
    assert.deepEqual(readResult({ e: "cat", r: "0" }), cat);
    assert.deepEqual(readResult({ e: "early", r: "0" }), {
      miss: "early",
      reaction: null,
    });
    assert.equal(challengeOf(readResult({ e: "wind", r: "0" })), null);
  });

  test("a broken old link is still rejected rather than misread", () => {
    const base = { a: "274", b: "231", e: "slow", r: "4" };
    const broken: Record<string, string | string[] | undefined>[] = [
      { ...base, r: "6" },
      { ...base, r: "-1" },
      { ...base, r: "" },
      { ...base, e: "sleep" },
      { ...base, e: "clear" },
      { ...base, b: "99" },
      { ...base, b: "0231" },
      { ...base, a: "200" },
      { ...base, a: undefined },
      { ...base, b: undefined },
      { ...base, b: ["231", "232"] },
      { e: "slow", r: "5" },
      { e: "clear", r: "5" },
    ];
    for (const params of broken) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });
});

describe("the save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("a save missing newer fields keeps what it had", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ bestReaction: 244, runs: 3 }),
    });
    assert.deepEqual(loadSave(), {
      bestReach: 0,
      bestReaction: 244,
      clears: 0,
      duels: 0,
      duelsWon: 0,
      falseStarts: 0,
      firstPlayed: null,
      fooled: 0,
      lastPlayed: null,
      reactionTotal: 0,
      reactions: 0,
      runs: 3,
      seconds: 0,
      versusGames: 0,
    });
  });

  test("a save from the five-opponent ladder loads as it was and keeps adding up", () => {
    const ladder = {
      bestReach: 4,
      bestReaction: 231,
      clears: 1,
      duels: 37,
      duelsWon: 22,
      falseStarts: 9,
      firstPlayed: 1_760_000_000_000,
      fooled: 5,
      lastPlayed: 1_760_500_000_000,
      reactionTotal: 7480,
      reactions: 26,
      runs: 12,
      seconds: 431.5,
      versusGames: 3,
    };
    vi.stubGlobal("localStorage", { getItem: () => JSON.stringify(ladder) });
    const old = loadSave();
    assert.deepEqual(old, ladder);
    const slow = settleRun(old, 1);
    assert.equal(slow.bestReach, 4);
    assert.equal(slow.runs, 13);
    assert.equal(slow.clears, 1);
    assert.equal(slow.firstPlayed, ladder.firstPlayed);
  });

  test("duels add up the totals a profile needs, and the first reaction is not a record", () => {
    const won = settleDuel(empty(), {
      at: 1000,
      call: { kind: "cut", reaction: 280, side: "left" },
      reaction: 280,
      seconds: 4.26,
    });
    assert.equal(won.record, false);
    const faster = settleDuel(won.save, {
      at: 2000,
      call: { kind: "cut", reaction: 251, side: "left" },
      reaction: 251,
      seconds: 3,
    });
    assert.equal(faster.record, true);
    const lost = settleDuel(faster.save, {
      at: 3000,
      call: { kind: "cut", reaction: 300, side: "right" },
      reaction: 340,
      seconds: 3,
    });
    assert.equal(lost.record, false);
    const fooled = settleDuel(lost.save, {
      at: 4000,
      call: { fake: "cat", kind: "early", reaction: null, side: "left" },
      reaction: null,
      seconds: 2,
    });
    assert.deepEqual(fooled.save, {
      bestReach: 0,
      bestReaction: 251,
      clears: 0,
      duels: 4,
      duelsWon: 2,
      falseStarts: 1,
      firstPlayed: 1000,
      fooled: 1,
      lastPlayed: 4000,
      reactionTotal: 871,
      reactions: 3,
      runs: 0,
      seconds: 12.3,
      versusGames: 0,
    });
  });

  test("each solo duel is a run, keeping the most cut down and counting the sword saint", () => {
    const first = settleRun(empty(), 2);
    assert.equal(first.runs, 1);
    assert.equal(first.bestReach, 2);
    const saint = settleRun(first, tiers.length);
    assert.equal(saint.clears, 1);
    const worse = settleRun(saint, 0);
    assert.equal(worse.bestReach, tiers.length);
    assert.equal(worse.clears, 1);
    assert.equal(worse.runs, 3);
    const versus = settleVersus(worse, 9000, 5.55);
    assert.equal(versus.versusGames, 1);
    assert.equal(versus.firstPlayed, 9000);
    assert.equal(versus.seconds, 5.6);
    assert.equal(versus.duels, 0);
  });
});
