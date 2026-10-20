import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { createRiver, simulate, stoneAt } from "./simulate";
import type { River } from "./simulate";

const open = (seed: number): River => ({ ...createRiver(seed), props: [] });
const flat = { aim: 0, speed: 14, tilt: 20 };

describe(simulate, () => {
  test("the same river and throw always play out the same way", () => {
    const river = createRiver(7);
    assert.deepEqual(simulate(river, flat), simulate(river, flat));
  });

  test("a flat throw skips more than a steep one", () => {
    const river = open(3);
    assert.ok(
      simulate(river, flat).skips >
        simulate(river, { ...flat, tilt: 45 }).skips + 5
    );
  });

  test("a faster throw goes farther", () => {
    const river = open(3);
    assert.ok(
      simulate(river, flat).distance >
        simulate(river, { ...flat, speed: 9 }).distance
    );
  });

  test("a limp throw sinks without skipping", () => {
    const shot = simulate(open(3), { ...flat, speed: 2 });
    assert.equal(shot.ending, "plop");
    assert.equal(shot.skips, 0);
  });

  test("the stone touches the water at every skip and never jumps", () => {
    const shot = simulate(open(11), flat);
    for (const splash of shot.splashes) {
      const before = stoneAt(shot, splash.time - 1e-6);
      assert.ok(before);
      assert.ok(Math.abs(before.y) < 1e-3);
      assert.ok(Math.abs(before.z - splash.z) < 1e-3);
    }
  });

  test("a duck in the stone's path ends the throw", () => {
    const river = open(5);
    const first = simulate(river, flat).splashes.at(0);
    assert.ok(first);
    const shot = simulate(
      { ...river, props: [{ kind: "duck", turn: 0, x: first.x, z: first.z }] },
      flat
    );
    assert.equal(shot.ending, "duck");
    assert.equal(shot.hit?.prop, 0);
  });

  test("only a near-perfect throw reaches the far bank", () => {
    const river = { ...open(9), bank: 45 };
    assert.equal(simulate(river, { ...flat, speed: 16 }).ending, "bank");
    assert.notEqual(simulate(river, flat).ending, "bank");
    assert.notEqual(
      simulate(river, { ...flat, speed: 16, tilt: 32 }).ending,
      "bank"
    );
  });
});
