import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { postUrl } from "../../_lib/share";
import { TOP, kindOf } from "./bodies";
import { careerShare, readCareer } from "./career";
import { queryOf, readResult, resultOf, shareOf, trailOf } from "./result";
import { discover, settle } from "./save";
import type { Save } from "./save";
import {
  COOLDOWN,
  GRACE,
  LIMIT,
  TICK,
  createWorld,
  drop,
  launchRadius,
  pointsFor,
  step,
} from "./world";
import type { Orb, World } from "./world";

const place = (world: World, tier: number, x: number, y = 0): Orb => {
  const orb: Orb = {
    born: -10,
    chain: 0,
    falling: false,
    id: world.nextId,
    outside: 0,
    px: x,
    py: y,
    spin: 0,
    tier,
    tilt: 0,
    vx: 0,
    vy: 0,
    x,
    y,
  };
  world.nextId += 1;
  world.orbs.push(orb);
  return orb;
};

const run = (world: World, seconds: number) => {
  const merges = [];
  for (let t = 0; t < seconds; t += TICK) {
    merges.push(...step(world).merges);
  }
  return merges;
};

const fresh: Save = {
  best: 0,
  chain: 0,
  galaxies: 0,
  merges: 0,
  runs: 0,
  top: -1,
};

describe("merging", () => {
  test("two touching bodies of the same kind become the next one up", () => {
    const world = createWorld(1);
    const r = kindOf(3).radius;
    place(world, 3, -r);
    place(world, 3, r);
    const [merge] = run(world, TICK);
    assert.equal(merge?.made, 4);
    assert.equal(world.orbs.length, 1);
    assert.equal(world.orbs[0]?.tier, 4);
    assert.equal(world.score, pointsFor(3));
    assert.equal(world.top, 4);
  });

  test("different kinds push apart instead of merging", () => {
    const world = createWorld(1);
    place(world, 2, -0.05);
    place(world, 3, 0.05);
    run(world, 0.5);
    assert.equal(world.orbs.length, 2);
    const [a, b] = world.orbs;
    const gap = Math.hypot(
      (b?.x ?? 0) - (a?.x ?? 0),
      (b?.y ?? 0) - (a?.y ?? 0)
    );
    assert.ok(gap >= kindOf(2).radius + kindOf(3).radius - 1e-3);
  });

  test("a body made by a merge that merges again right away counts as a chain", () => {
    const world = createWorld(1);
    const small = kindOf(1).radius;
    const big = kindOf(2).radius;
    place(world, 1, -small);
    place(world, 1, small);
    place(world, 2, small + big + 0.001);
    const merges = run(world, 0.5);
    assert.deepEqual(
      merges.map(({ chain, made }) => [made, chain]),
      [
        [2, 1],
        [3, 2],
      ]
    );
    assert.equal(world.chain, 2);
    assert.equal(world.score, pointsFor(1) + pointsFor(2) * 2);
  });

  test("two black holes leave nothing behind and make the Milky Way", () => {
    const world = createWorld(1);
    const r = kindOf(TOP).radius;
    place(world, TOP, -r);
    place(world, TOP, r);
    const [merge] = run(world, TICK);
    assert.equal(merge?.made, null);
    assert.equal(world.orbs.length, 0);
    assert.equal(world.galaxies, 1);
    assert.equal(world.score, pointsFor(TOP));
  });
});

describe("dropping", () => {
  test("drops from the launch ring toward the core and waits for the cooldown", () => {
    const world = createWorld(7);
    const [first, second] = world.queue;
    const orb = drop(world, 0);
    assert.ok(orb);
    assert.equal(orb.tier, first);
    assert.ok(Math.abs(orb.x - launchRadius(first)) < 1e-9);
    assert.ok(orb.vx < 0);
    assert.equal(world.queue[0], second);
    assert.equal(drop(world, 0), null);
    run(world, COOLDOWN + TICK);
    assert.ok(drop(world, Math.PI));
  });

  test("only small bodies come up in the queue", () => {
    const world = createWorld(3);
    for (let i = 0; i < 200; i += 1) {
      world.ready = 0;
      const orb = drop(world, i);
      assert.ok(orb && orb.tier < 5);
      world.orbs = [];
    }
  });
});

describe("overflow", () => {
  test("ends the run once a settled body stays past the ring for the grace time", () => {
    const world = createWorld(1);
    const orb = place(world, 0, LIMIT);
    let over = false;
    for (let t = 0; t < GRACE + 0.5 && !over; t += TICK) {
      orb.x = LIMIT;
      orb.y = 0;
      orb.vx = 0;
      orb.vy = 0;
      step(world);
      ({ over } = world);
    }
    assert.ok(over);
    assert.ok(world.time >= GRACE - TICK);
    assert.equal(drop(world, 0), null);
  });

  test("a body still falling in from the launch ring does not count", () => {
    const world = createWorld(1);
    drop(world, 0);
    run(world, 0.3);
    assert.equal(world.over, false);
    assert.equal(world.danger, 0);
  });

  test("a lone body settles at the core", () => {
    const world = createWorld(1);
    drop(world, 1);
    run(world, 6);
    const [orb] = world.orbs;
    assert.ok(orb !== undefined && Math.hypot(orb.x, orb.y) < 0.02);
    assert.equal(world.over, false);
  });
});

describe("results", () => {
  test("round-trip through the share link", () => {
    const world = createWorld(1);
    world.score = 3210;
    world.top = 7;
    world.chain = 3;
    world.merges = 42;
    const result = resultOf(world);
    const parsed = readResult(
      Object.fromEntries(new URLSearchParams(queryOf(result)))
    );
    assert.deepEqual(parsed, result);
  });

  test("rejects links that don't describe a run", () => {
    assert.equal(readResult({}), null);
    assert.equal(readResult({ p: "10", t: String(TOP + 1) }), null);
    assert.equal(readResult({ p: "-1", t: "3" }), null);
  });

  test("the share text names how far you got and shows the trail", () => {
    const result = { chain: 3, galaxies: 0, merges: 42, score: 3210, top: 7 };
    const share = shareOf(result, "https://x.y", "ja");
    assert.equal(
      share.text,
      `星合で土星までつくった！ 3,210点\n${trailOf(result)}\n#星合`
    );
    assert.equal(trailOf(result), "✨🪨☄️🌙🔴🌍🔵🪐▫️▫️▫️");
    assert.ok(share.url.startsWith("https://x.y/games/hoshiai?"));
    assert.ok(share.image.startsWith("https://x.y/games/hoshiai/og?"));
    const english = shareOf(
      { ...result, galaxies: 1, top: TOP },
      "https://x.y",
      "en"
    );
    assert.ok(
      english.text.startsWith("I made the Milky Way in Hoshiai: 3,210 pts")
    );
    assert.ok(english.text.includes("🕳️🌌"));
    assert.equal(new URL(postUrl(share)).hostname, "x.com");
  });
});

describe("career", () => {
  const career: Save = {
    best: 12_340,
    chain: 8,
    galaxies: 1,
    merges: 1203,
    runs: 25,
    top: 7,
  };

  test("round-trips through the share link", () => {
    const share = careerShare(career, "https://x.y", "en");
    const url = new URL(share.url);
    assert.deepEqual(readCareer(Object.fromEntries(url.searchParams)), career);
    assert.equal(readResult(Object.fromEntries(url.searchParams)), null);
    assert.ok(share.image.startsWith("https://x.y/games/hoshiai/og?"));
  });

  test("is not mistaken for a shared result", () => {
    const params = Object.fromEntries(
      new URLSearchParams(
        queryOf({ chain: 3, galaxies: 0, merges: 42, score: 3210, top: 7 })
      )
    );
    assert.equal(readCareer(params), null);
    assert.equal(readCareer({}), null);
    assert.equal(readCareer({ ...params, b: "1", r: "0" }), null);
  });

  test("the share text shows the totals and the trail", () => {
    assert.equal(
      careerShare(career, "https://x.y", "en").text,
      `My Hoshiai stats: best 12,340 pts\n25 runs · 1,203 merges · best chain 8\n${trailOf(career)}\n#星合 #Hoshiai`
    );
    assert.equal(
      careerShare({ ...career, galaxies: 0, runs: 1 }, "https://x.y", "ja")
        .text,
      `星合の戦績：最高12,340点\nプレイ 1回 · 合体 1,203回 · 最大 8連鎖\n${trailOf({ galaxies: 0, top: 7 })}\n#星合`
    );
  });
});

describe("save", () => {
  test("the first run never counts as a new best", () => {
    const result = { chain: 1, galaxies: 0, merges: 5, score: 40, top: 3 };
    const first = settle(fresh, result);
    assert.equal(first.record, false);
    assert.equal(first.save.best, 40);
    assert.equal(first.save.runs, 1);
    const second = settle(first.save, { ...result, score: 41 });
    assert.equal(second.record, true);
    assert.equal(settle(second.save, result).record, false);
  });

  test("only records a body the first time it is found", () => {
    const found = discover(fresh, 4);
    assert.equal(found?.top, 4);
    assert.ok(found !== null);
    assert.equal(discover(found, 3), null);
  });
});
