import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { seeded } from "../../_lib/svg";
import { createDemo } from "./demo";
import { createTank, step } from "./tank";

const DT = 1 / 60;

describe("the demo", () => {
  it("shows the technique: it dips ahead of a goldfish and scoops it, never landing on one", () => {
    for (const seed of [3, 17, 42]) {
      const tank = createTank(seeded(seed));
      const play = createDemo();
      const kinds = new Set<string>();
      let scooped = 0;

      for (let i = 0; i < 60 * 45; i += 1) {
        step(tank, DT);
        const move = play.next(tank, DT);

        for (const outcome of move?.type === "lift" ? move.outcomes : []) {
          kinds.add(outcome.type);
          scooped += outcome.type === "scoop" ? outcome.fish.length : 0;
        }
      }

      assert.ok(scooped >= 4, `seed ${seed} scooped ${scooped}`);
      assert.deepEqual(tank.caught, []);
      assert.ok(tank.poi.paper > 0.9, `seed ${seed} paper ${tank.poi.paper}`);
      assert.equal(
        kinds.has("under"),
        false,
        `seed ${seed} dipped onto a fish`
      );
    }
  });

  it("waits a moment before it starts", () => {
    const tank = createTank(seeded(1));
    const play = createDemo();
    assert.equal(play.next(tank, 1), null);
    assert.equal(tank.poi.down, false);
  });
});
