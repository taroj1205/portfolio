import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { ladder, slowestOf } from "./duel";
import {
  isEarly,
  lineOf,
  queryOf,
  rankOf,
  reachText,
  readResult,
  resultOf,
  shareOf,
} from "./result";
import type { Result } from "./result";
import { loadSave, settleDuel, settleRun, settleVersus } from "./save";

const run: Result = { average: 274, best: 231, end: "slow", reach: 4 };

const empty = () => {
  vi.stubGlobal("localStorage", { getItem: () => null });
  return loadSave();
};

const roundTrip = (result: Result) =>
  readResult(Object.fromEntries(new URLSearchParams(queryOf(result))));

describe("a run's result", () => {
  test("best and average come from the reactions, rounded to the millisecond", () => {
    assert.deepEqual(resultOf(3, [301, 255, 280], "slow"), {
      average: 279,
      best: 255,
      end: "slow",
      reach: 3,
    });
    assert.deepEqual(resultOf(0, [], "cat"), {
      average: null,
      best: null,
      end: "cat",
      reach: 0,
    });
  });

  test("the rank follows how far the run got", () => {
    assert.equal(rankOf(0).name.ja, "素人");
    assert.equal(rankOf(4).name.ja, "剣豪");
    assert.equal(rankOf(ladder.length).name.ja, "剣聖");
    assert.equal(reachText(4, "ja"), "4人抜き");
    assert.equal(reachText(ladder.length, "ja"), "五人抜き");
    assert.equal(reachText(2, "en"), "2 of 5");
  });

  test("a run that ended on a fake-out says what you fell for", () => {
    const cat: Result = { average: null, best: null, end: "cat", reach: 0 };
    assert.ok(isEarly("cat"));
    assert.ok(!isEarly("slow"));
    assert.equal(lineOf(cat, "ja"), "猫に斬りかかった。");
    assert.equal(lineOf(cat, "en"), "Drew on a cat.");
    assert.equal(lineOf(run, "en"), rankOf(4).line.en);
  });
});

describe("sharing a result", () => {
  test("a result round-trips through the link, with or without times", () => {
    assert.deepEqual(roundTrip(run), run);
    const fooled: Result = { average: null, best: null, end: "wind", reach: 0 };
    assert.deepEqual(roundTrip(fooled), fooled);
    const clear: Result = { average: 236, best: 201, end: "clear", reach: 5 };
    assert.deepEqual(roundTrip(clear), clear);
  });

  test("the link carries only the totals", () => {
    assert.deepEqual([...new URLSearchParams(queryOf(run)).keys()].toSorted(), [
      "a",
      "b",
      "e",
      "r",
    ]);
  });

  test("broken, oversized and tampered links are rejected", () => {
    const base = { a: "274", b: "231", e: "slow", r: "4" };
    assert.deepEqual(readResult(base), run);
    const broken: Record<string, string | string[] | undefined>[] = [
      {},
      { ...base, r: "6" },
      { ...base, r: "-1" },
      { ...base, r: "4.0" },
      { ...base, r: "" },
      { ...base, e: "sleep" },
      { ...base, e: undefined },
      { ...base, b: "99" },
      { ...base, b: "1001" },
      { ...base, b: "2e2" },
      { ...base, b: "0231" },
      { ...base, b: "2310000000000000000000" },
      { ...base, b: " 231" },
      { ...base, a: "200" },
      { ...base, a: undefined },
      { ...base, b: undefined },
      { ...base, b: ["231", "232"] },
      { ...base, e: "clear" },
      { ...base, e: "slow", r: "5" },
      { ...base, b: String(slowestOf(ladder[3])) },
      { e: "slow", r: "1" },
      { a: "900", b: "800", e: "clear", r: "5" },
    ];
    for (const params of broken) {
      assert.equal(readResult(params), null, JSON.stringify(params));
    }
  });

  test("a zero-win run may carry a slow reaction, a winning one must be fast enough", () => {
    assert.deepEqual(readResult({ a: "640", b: "610", e: "slow", r: "0" }), {
      average: 640,
      best: 610,
      end: "slow",
      reach: 0,
    });
    const fastest = String(slowestOf(ladder[0]) - 1);
    assert.equal(
      readResult({ a: fastest, b: fastest, e: "slow", r: "1" })?.best,
      Number(fastest)
    );
  });

  test("the share text names the reach, rank and times, and the link opens the game", () => {
    const share = shareOf(run, "https://x.y", "ja");
    assert.equal(
      share.text,
      "鞘走りで4人抜き（剣豪）。最速231ms、平均274ms。\nこの速さ、斬れる？\n#鞘走り"
    );
    assert.equal(
      share.url,
      "https://x.y/games/iai?e=slow&r=4&b=231&a=274&l=ja"
    );
    assert.ok(share.image.startsWith("https://x.y/games/iai/og?e=slow&r=4"));
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
    assert.equal(
      shareOf(run, "https://x.y", "en").text,
      "Sayabashiri, the quick-draw duel: Master swordsman, beat 4 of 5. Fastest 231ms, average 274ms.\nCan you draw faster?\n#鞘走り #Sayabashiri"
    );
  });

  test("a fake-out ending is shared as the funny moment it was", () => {
    const zero: Result = { average: null, best: null, end: "cat", reach: 0 };
    assert.equal(
      shareOf(zero, "https://x.y", "ja").text,
      "鞘走りで、猫に斬りかかった。\nあなたは、動かずにいられる？\n#鞘走り"
    );
    assert.equal(
      shareOf(zero, "https://x.y", "en").text,
      "Sayabashiri, the quick-draw duel: drew on a cat.\nCould you keep still?\n#鞘走り #Sayabashiri"
    );
    const slow: Result = { average: 640, best: 610, end: "slow", reach: 0 };
    assert.ok(
      shareOf(slow, "https://x.y", "ja").text.startsWith(
        "鞘走りでひとり目に斬られた（素人）。最速610ms"
      )
    );
    const two: Result = { average: 400, best: 380, end: "leaf", reach: 2 };
    assert.ok(
      shareOf(two, "https://x.y", "ja").text.startsWith(
        "鞘走りで2人抜き、そして落ち葉を斬った。最速380ms、平均400ms。"
      )
    );
    assert.ok(
      shareOf(two, "https://x.y", "en").text.startsWith(
        "Sayabashiri, the quick-draw duel: beat 2 of 5, then cut down a falling leaf."
      )
    );
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

  test("runs keep the furthest reach and count clears, two-player games are counted apart", () => {
    const first = settleRun(empty(), 2);
    assert.equal(first.record, false);
    const clear = settleRun(first.save, ladder.length);
    assert.equal(clear.record, true);
    const worse = settleRun(clear.save, 1);
    assert.equal(worse.record, false);
    assert.equal(worse.save.bestReach, ladder.length);
    assert.equal(worse.save.clears, 1);
    assert.equal(worse.save.runs, 3);
    const versus = settleVersus(worse.save, 9000, 5.55);
    assert.equal(versus.versusGames, 1);
    assert.equal(versus.firstPlayed, 9000);
    assert.equal(versus.seconds, 5.6);
    assert.equal(versus.duels, 0);
  });
});
