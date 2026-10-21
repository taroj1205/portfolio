import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { bottles, outcomeOf, pourOf } from "./pour";
import {
  AWAY,
  angleAt,
  awayAt,
  keepOut,
  layoutOf,
  lipOf,
  outlineAt,
  sweepOf,
} from "./scene";
import type { Point } from "./scene";

const inside = (outline: readonly Point[], at: Point) => {
  let hit = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i, i += 1) {
    const p = outline[i] ?? at;
    const q = outline[j] ?? at;
    if (
      p.y > at.y !== q.y > at.y &&
      at.x < ((q.x - p.x) * (at.y - p.y)) / (q.y - p.y) + p.x
    ) {
      hit = !hit;
    }
  }
  return hit;
};

const viewports = [
  [390, 844],
  [360, 740],
  [1280, 800],
  [1280, 577],
] as const;

describe("the layout", () => {
  test("no bottle reaches the mute button, and the demo bottle clears the language button too", () => {
    for (const [w, h] of viewports) {
      const layout = layoutOf(w, h, "tokkuri");
      for (const bottle of bottles) {
        const corner = bottle === "tokkuri" ? keepOut.idle : keepOut.playing;
        const lip = lipOf({ bottle, cup: "masu" });
        const anchor = {
          x: layout.cx + lip.x * layout.scale,
          y: layout.cy + lip.y * layout.scale,
        };
        for (const angle of sweepOf(bottle)) {
          const outline = outlineAt(
            bottle,
            angle,
            layout.size[bottle] * layout.scale,
            anchor
          );
          for (let x = w - corner.width; x <= w; x += 2) {
            for (let y = 0; y <= corner.height; y += 2) {
              assert.ok(
                !inside(outline, { x, y }),
                `${bottle} at ${w}x${h} covers ${x},${y}`
              );
            }
          }
        }
      }
    }
  });

  test("bottles keep their full size unless the corner is too close", () => {
    assert.deepEqual(layoutOf(390, 844, "tokkuri").size, {
      isshobin: 1,
      katakuchi: 1,
      tokkuri: 1,
    });
    const small = layoutOf(360, 740, "tokkuri").size;
    assert.equal(small.isshobin, 1);
    assert.equal(small.katakuchi, 1);
    assert.ok(small.tokkuri >= 0.75 && small.tokkuri < 1);
  });

  test("the cup stays in the middle band of the screen", () => {
    for (const [w, h] of viewports) {
      const { cy } = layoutOf(w, h, "tokkuri");
      assert.ok(cy >= h * 0.47 && cy <= h * 0.56);
    }
  });

  test("a pour never tilts the bottle past the poses the layout checks", () => {
    for (let seed = 1; seed < 400; seed += 1) {
      const pour = pourOf(seed);
      const sweep = sweepOf(pour.bottle);
      const outcome = outcomeOf(pour, Math.ceil(pour.brink * 1000));
      for (let t = 0; t < outcome.settledAt; t += 0.01) {
        const angle = angleAt(pour, Infinity, t);
        assert.ok(angle >= (sweep[0] ?? 0) - 1e-9);
        assert.ok(angle <= (sweep.at(-1) ?? 0) + 1e-9);
      }
    }
  });

  test("the bottle stays while sake flows, then leaves before the result", () => {
    const pour = pourOf(13);
    const hold = 3.2;
    assert.equal(awayAt(pour, Infinity, 9), 0);
    assert.equal(awayAt(pour, hold, hold + pour.trickle), 0);
    assert.ok(awayAt(pour, hold, hold + pour.trickle + AWAY / 2) > 0);
    assert.equal(awayAt(pour, hold, hold + pour.trickle + AWAY), 1);
  });
});
