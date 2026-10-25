import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { ratioOf } from "./scale";
import { APART, heavierOf, pairOf } from "./versus";
import type { Pair } from "./versus";

const golden = () => {
  let value = 0;

  return () => {
    value = (value + 0.61803398875) % 1;

    return value;
  };
};

describe("which is heavier", () => {
  it("never pairs two things too close to call", () => {
    const roll = golden();
    let previous: Pair | null = null;

    for (let round = 0; round < 500; round += 1) {
      const pair = pairOf(roll, previous);
      assert.notEqual(pair.left, pair.right);
      assert.ok(ratioOf(pair.left.grams, pair.right.grams) >= APART);

      if (previous !== null) {
        for (const item of [pair.left, pair.right]) {
          assert.ok(item !== previous.left && item !== previous.right);
        }
      }

      previous = pair;
    }
  });

  it("puts the heavier one on either side", () => {
    const roll = golden();

    const sides = new Set(
      Array.from({ length: 60 }, () => {
        const pair = pairOf(roll, null);

        return heavierOf(pair) === pair.left ? "left" : "right";
      })
    );

    assert.deepEqual([...sides].toSorted(), ["left", "right"]);
  });
});
