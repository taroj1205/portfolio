import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  GRACE,
  TOO_FAST,
  TOO_LATE,
  cueAt,
  decide,
  fakeLength,
  ladder,
  planCues,
  planDuel,
  planWait,
  reactionOf,
  rivalOf,
  slowestOf,
} from "./duel";
import type { Plan, Tap } from "./duel";

const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const START = 1000;
const SIGNAL = 4000;

const solo = (rival: number, cues: Plan["cues"] = []): Plan => ({
  cues,
  rival,
  wait: SIGNAL - START,
});

const versus: Plan = { cues: [], rival: null, wait: SIGNAL - START };

const at = (moment: {
  plan: Plan;
  taps: Tap[];
  now: number;
  signalAt?: number | null;
}) =>
  decide({
    plan: moment.plan,
    signalAt: moment.signalAt === undefined ? SIGNAL : moment.signalAt,
    startedAt: START,
    taps: moment.taps,
    now: moment.now,
  });

describe("the wait before the signal", () => {
  test("every wait falls between the shortest and longest, with no fixed rhythm", () => {
    const random = seeded(7);
    const waits = Array.from({ length: 4000 }, () => planWait(random));
    assert.ok(Math.min(...waits) >= 1600);
    assert.ok(Math.max(...waits) < 6000);
    const buckets = new Set(waits.map((wait) => Math.floor(wait / 250)));
    assert.ok(buckets.size >= 16, `${buckets.size} buckets`);
    const short = waits.filter((wait) => wait < 3000).length / waits.length;
    const long = waits.filter((wait) => wait > 4500).length / waits.length;
    assert.ok(short > 0.4 && short < 0.75, `short ${short}`);
    assert.ok(long > 0.05, `long ${long}`);
  });

  test("the edges of the random range map to the edges of the wait", () => {
    assert.equal(
      planWait(() => 0),
      1600
    );
    assert.ok(planWait(() => 0.999999) > 5990);
  });

  test("fake-outs never overlap each other or reach the signal", () => {
    const random = seeded(11);
    for (let i = 0; i < 500; i += 1) {
      const plan = planDuel(random, 300, [2, 2]);
      let end = 0;
      for (const cue of plan.cues) {
        assert.ok(cue.at >= 600, `starts at ${cue.at}`);
        assert.ok(cue.at >= end, "overlaps the one before");
        end = cue.at + cue.length;
        assert.ok(end <= plan.wait - 350, `ends ${end} of ${plan.wait}`);
        assert.equal(cue.length, fakeLength[cue.kind]);
      }
      assert.equal(
        new Set(plan.cues.map((cue) => cue.kind)).size,
        plan.cues.length
      );
    }
  });

  test("a wait too short for a fake-out simply has none", () => {
    assert.deepEqual(
      planCues(() => 0.5, 1700, 2),
      []
    );
  });

  test("cues are found by time", () => {
    const plan = solo(300, [{ at: 800, kind: "cat", length: 2000 }]);
    assert.equal(cueAt(plan, START, START + 700), null);
    assert.deepEqual(cueAt(plan, START, START + 1800), { kind: "cat", t: 0.5 });
  });
});

describe("the ladder", () => {
  test("each opponent is faster than the one before", () => {
    for (const [i, rung] of ladder.entries()) {
      const next = ladder[i + 1];
      if (next !== undefined) {
        assert.ok(slowestOf(next) < rung.base - rung.spread);
      }
    }
  });

  test("an opponent's time stays inside its range", () => {
    const random = seeded(3);
    for (const rung of ladder) {
      for (let i = 0; i < 200; i += 1) {
        const time = rivalOf(rung, random);
        assert.ok(time >= rung.base - rung.spread && time <= slowestOf(rung));
        assert.equal(time, Math.round(time));
      }
    }
  });
});

describe("judging a duel", () => {
  test("a tap after the signal that beats the opponent is a cut", () => {
    const plan = solo(300);
    const taps: Tap[] = [{ at: SIGNAL + 241.4, side: "left" }];
    assert.equal(at({ now: SIGNAL + 250, plan, taps }), null);
    assert.deepEqual(at({ now: SIGNAL + 280, plan, taps }), {
      kind: "cut",
      reaction: 241,
      side: "left",
    });
  });

  test("the opponent cuts first when the player is slower or never taps", () => {
    const plan = solo(300);
    assert.equal(at({ now: SIGNAL + 300 + GRACE - 1, plan, taps: [] }), null);
    assert.deepEqual(at({ now: SIGNAL + 300 + GRACE, plan, taps: [] }), {
      kind: "cut",
      reaction: 300,
      side: "right",
    });
    const late: Tap[] = [{ at: SIGNAL + 420, side: "left" }];
    assert.deepEqual(at({ now: SIGNAL + 500, plan, taps: late }), {
      kind: "cut",
      reaction: 300,
      side: "right",
    });
    assert.equal(reactionOf(late, "left", START, SIGNAL), 420);
  });

  test("an earlier tap that arrives late still wins within the grace", () => {
    const plan = solo(300);
    assert.deepEqual(
      at({
        now: SIGNAL + 300 + GRACE,
        plan,
        taps: [{ at: SIGNAL + 299, side: "left" }],
      }),
      { kind: "cut", reaction: 299, side: "left" }
    );
  });

  test("the same millisecond as the opponent is a draw", () => {
    assert.deepEqual(
      at({
        now: SIGNAL + 400,
        plan: solo(287),
        taps: [{ at: SIGNAL + 287.3, side: "left" }],
      }),
      { kind: "draw", reaction: 287 }
    );
  });

  test("tapping before the signal is a false start, and blames the fake-out on screen", () => {
    const plan = solo(300, [{ at: 1000, kind: "cat", length: 2000 }]);
    const fooled = at({
      now: START + 1600,
      plan,
      signalAt: null,
      taps: [{ at: START + 1500, side: "left" }],
    });
    assert.deepEqual(fooled, {
      fake: "cat",
      kind: "early",
      reaction: null,
      side: "left",
    });
    const plain = at({
      now: START + 600,
      plan,
      signalAt: null,
      taps: [{ at: START + 400, side: "left" }],
    });
    assert.deepEqual(plain, {
      fake: null,
      kind: "early",
      reaction: null,
      side: "left",
    });
  });

  test("a fake-out that just left the screen still gets the blame", () => {
    const plan = solo(300, [{ at: 1000, kind: "leaf", length: 2000 }]);
    const call = at({
      now: START + 3500,
      plan,
      signalAt: null,
      taps: [{ at: START + 3400, side: "left" }],
    });
    assert.equal(call?.kind === "early" ? call.fake : "none", "leaf");
  });

  test("a tap once the signal is drawn but before it can be seen is early", () => {
    const call = at({
      now: SIGNAL + 40,
      plan: solo(300),
      signalAt: SIGNAL,
      taps: [{ at: SIGNAL - 0.4, side: "left" }],
    });
    assert.deepEqual(call, {
      fake: null,
      kind: "early",
      reaction: null,
      side: "left",
    });
  });

  test("faster than anyone can see is a false start too", () => {
    const call = at({
      now: SIGNAL + 200,
      plan: solo(300),
      taps: [{ at: SIGNAL + TOO_FAST - 1, side: "left" }],
    });
    assert.deepEqual(call, {
      fake: null,
      kind: "early",
      reaction: TOO_FAST - 1,
      side: "left",
    });
    const edge = at({
      now: SIGNAL + 200,
      plan: solo(300),
      taps: [{ at: SIGNAL + TOO_FAST, side: "left" }],
    });
    assert.equal(edge?.kind, "cut");
  });

  test("taps from before the duel started are ignored, and only the first tap counts", () => {
    const taps: Tap[] = [
      { at: START - 10, side: "left" },
      { at: SIGNAL + 250, side: "left" },
      { at: SIGNAL + 120, side: "left" },
      { at: SIGNAL + 130, side: "left" },
    ];
    assert.deepEqual(at({ now: SIGNAL + 400, plan: solo(300), taps }), {
      kind: "cut",
      reaction: 120,
      side: "left",
    });
  });

  test("a reaction is only counted inside the window people can react in", () => {
    const tap = (delay: number): Tap[] => [
      { at: SIGNAL + delay, side: "left" },
    ];
    assert.equal(reactionOf(tap(50), "left", START, SIGNAL), null);
    assert.equal(reactionOf(tap(TOO_LATE + 1), "left", START, SIGNAL), null);
    assert.equal(reactionOf(tap(TOO_LATE), "left", START, SIGNAL), TOO_LATE);
    assert.equal(reactionOf(tap(300), "left", START, null), null);
    assert.equal(reactionOf([], "left", START, SIGNAL), null);
  });
});

describe("two players", () => {
  test("the first valid tap wins whichever side it comes from", () => {
    const taps: Tap[] = [
      { at: SIGNAL + 233, side: "right" },
      { at: SIGNAL + 251, side: "left" },
    ];
    assert.deepEqual(at({ now: SIGNAL + 300, plan: versus, taps }), {
      kind: "cut",
      reaction: 233,
      side: "right",
    });
    assert.equal(reactionOf(taps, "left", START, SIGNAL), 251);
  });

  test("a false start loses even if the other player is slow", () => {
    const taps: Tap[] = [
      { at: SIGNAL - 300, side: "left" },
      { at: SIGNAL + 700, side: "right" },
    ];
    const call = at({
      now: SIGNAL + 800,
      plan: versus,
      signalAt: SIGNAL,
      taps,
    });
    assert.equal(call?.kind, "early");
    assert.equal(call?.kind === "early" ? call.side : null, "left");
  });

  test("taps in the same millisecond are a draw", () => {
    const taps: Tap[] = [
      { at: SIGNAL + 260.2, side: "left" },
      { at: SIGNAL + 260.4, side: "right" },
    ];
    assert.deepEqual(at({ now: SIGNAL + 400, plan: versus, taps }), {
      kind: "draw",
      reaction: 260,
    });
  });

  test("no one drawing is a no-contest after the reaction window", () => {
    assert.equal(at({ now: SIGNAL + TOO_LATE, plan: versus, taps: [] }), null);
    assert.deepEqual(
      at({ now: SIGNAL + TOO_LATE + GRACE, plan: versus, taps: [] }),
      { kind: "none" }
    );
    assert.equal(
      at({ now: SIGNAL + 9000, plan: versus, signalAt: null, taps: [] }),
      null
    );
  });
});
