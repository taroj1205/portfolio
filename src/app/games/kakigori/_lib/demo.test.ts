import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { seeded } from "../../_lib/svg";
import { createDemo } from "./demo";
import { UNIT, aim, createPile, heightOf, pour, step } from "./pile";

const DT = 1 / 60;

describe("the demo", () => {
  it("builds a mound and keeps it standing, then starts again", () => {
    for (const seed of [3, 17, 42]) {
      const pile = createPile(seeded(seed));
      const demo = createDemo();
      let tallest = 0;
      let again = false;

      for (let i = 0; i < 60 * 30 && !again; i += 1) {
        const move = demo.next(pile, DT);

        if (move.type === "pour") {
          aim(pile, move.at);
        }

        again = move.type === "again";
        pour(pile, move.type === "pour");
        const out = step(pile, DT);
        assert.ok(
          out.every((each) => each.type !== "topple"),
          `seed ${seed} toppled`
        );
        tallest = Math.max(tallest, heightOf(pile.cols));
      }

      assert.ok(again, `seed ${seed} never started again`);
      assert.ok(
        tallest >= 7 * UNIT,
        `seed ${seed} reached ${tallest / UNIT}cm`
      );
    }
  });

  it("waits a moment before it starts", () => {
    const pile = createPile(seeded(1));
    assert.equal(createDemo().next(pile, 0.5).type, "wait");
  });
});
