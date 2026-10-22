import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { bottles, cups, holdFor, outcomeOf, pourOf } from "./pour";
import {
  AWAY,
  GAP,
  IDLE_TEXT,
  angleAt,
  awayAt,
  demoSweepOf,
  extent,
  keepOut,
  layoutOf,
  lipOf,
  outlineAt,
  sweepOf,
} from "./scene";
import type { Demo, Layout, Point } from "./scene";

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

const demoPour = pourOf(13);
const demo: Demo = {
  hold:
    holdFor(
      demoPour,
      (outcome) => outcome.spilledAt === null && outcome.tenths >= 970
    ) / 1000,
  pour: demoPour,
};

const covers = (
  layout: Layout,
  bottle: (typeof bottles)[number],
  angles: readonly number[],
  zone: { width: number; height: number }
) =>
  cups.some((cup) => {
    const lip = lipOf({ bottle, cup });
    const anchor = {
      x: layout.cx + lip.x * layout.scale,
      y: layout.cy + lip.y * layout.scale,
    };
    return angles.some((angle) => {
      const outline = outlineAt(
        bottle,
        angle,
        layout.size[bottle] * layout.scale,
        anchor
      );
      for (let x = layout.w - zone.width; x <= layout.w; x += 2) {
        for (let y = 0; y <= zone.height; y += 2) {
          if (inside(outline, { x, y })) {
            return true;
          }
        }
      }
      return false;
    });
  });

describe("the layout", () => {
  test("no pour reaches the mute button, and the demo clears the language button too", () => {
    for (const [w, h] of viewports) {
      const layout = layoutOf(w, h, demo);
      for (const bottle of bottles) {
        assert.ok(
          !covers(layout, bottle, sweepOf(bottle), keepOut.playing),
          `${bottle} reaches the mute button at ${w}x${h}`
        );
      }
      assert.ok(
        !covers(layout, demoPour.bottle, demoSweepOf(demo), keepOut.idle),
        `the demo reaches the language button at ${w}x${h}`
      );
    }
  });

  test("bottles keep their full size unless the corner is too close", () => {
    const phone = layoutOf(390, 844, demo).size;
    assert.equal(phone.isshobin, 1);
    assert.equal(phone.katakuchi, 1);
    assert.ok(phone.tokkuri >= 0.9);
    const small = layoutOf(360, 740, demo).size;
    assert.equal(small.isshobin, 1);
    assert.equal(small.katakuchi, 1);
    assert.ok(small.tokkuri >= 0.75);
  });

  test("the cup stays above the idle text, and sits lower when the text is beside it", () => {
    for (const [w, h] of [...viewports, [414, 896], [1920, 1080]] as const) {
      const under = layoutOf(w, h, demo);
      assert.ok(
        under.cy + extent.bottom * under.scale <= h - IDLE_TEXT - GAP + 1e-9
      );
      const beside = layoutOf(w, h, demo, {
        left: 40,
        right: 456,
        top: h - IDLE_TEXT,
      });
      if (w >= 1280) {
        assert.ok(beside.cy > under.cy);
        assert.ok(beside.cx - (extent.width / 2) * beside.scale > 456);
      }
    }
  });

  test("the pouring close-up keeps the bottles off the mute button and the cup on screen", () => {
    for (const [w, h] of [...viewports, [414, 896], [1920, 1080]] as const) {
      const layout = layoutOf(w, h, demo);
      const near = { ...layout, ...layout.near };
      assert.ok(near.scale >= layout.scale);
      for (const bottle of bottles) {
        assert.ok(
          !covers(near, bottle, sweepOf(bottle), keepOut.playing),
          `${bottle} reaches the mute button in the close-up at ${w}x${h}`
        );
      }
      assert.ok(near.cy + extent.top * near.scale >= 0);
      assert.ok(near.cy + extent.bottom * near.scale <= h);
      assert.ok(
        (extent.width / 2) * near.scale <= Math.min(near.cx, w - near.cx)
      );
    }
    const phone = layoutOf(390, 844, demo);
    assert.ok(phone.near.scale >= phone.scale * 1.3);
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
