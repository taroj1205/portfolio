import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { streamOf } from "./liquid";
import type { Jet, Stream } from "./liquid";
import {
  bottles,
  capacity,
  cups,
  domeOf,
  holdFor,
  insideAt,
  limitOf,
  outcomeOf,
  pourOf,
} from "./pour";
import type { Cup, Pour } from "./pour";
import {
  AWAY,
  GAP,
  IDLE_TEXT,
  angleAt,
  awayAt,
  basis,
  box,
  camera,
  demoSweepOf,
  extent,
  fillOf,
  jetAt,
  jetOf,
  keepOut,
  landingOf,
  layoutOf,
  lipOf,
  onScreen,
  outlineAt,
  project,
  radiusAt,
  rimOf,
  ring,
  sweepOf,
  tumbler,
} from "./scene";
import type { Demo, Layout, Point, View } from "./scene";

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

const onStreamPlane = (screen: Point) => {
  const dir = {
    x:
      screen.x * basis.right.x -
      screen.y * basis.up.x -
      basis.distance * basis.back.x,
    y:
      screen.x * basis.right.y -
      screen.y * basis.up.y -
      basis.distance * basis.back.y,
    z:
      screen.x * basis.right.z -
      screen.y * basis.up.z -
      basis.distance * basis.back.z,
  };
  const t = -camera.z / dir.z;
  return { x: camera.x + dir.x * t, y: camera.y + dir.y * t };
};

const wallAt = (cup: Cup, y: number) =>
  cup === "masu" ? box.inner : radiusAt(y) - tumbler.wall;

const openingOf = (cup: Cup) =>
  cup === "masu"
    ? [
        project(-box.inner, box.height, -box.inner),
        project(box.inner, box.height, -box.inner),
        project(box.inner, box.height, box.inner),
        project(-box.inner, box.height, box.inner),
      ]
    : ring(rimOf(cup), wallAt(cup, rimOf(cup)), 0, Math.PI * 2, 96);

const onView = (view: View, p: Point) => ({
  x: view.cx + p.x * view.scale,
  y: view.cy + p.y * view.scale,
});

const fallsIn = (stream: Stream, cup: Cup, views: readonly View[]) => {
  const rim = rimOf(cup);
  const drawn = onScreen(stream);
  const problems: string[] = [];
  let crossed = false;
  for (const [k, thread] of drawn.threads.entries()) {
    const world = thread.map((bead, i) => ({
      ...onStreamPlane(bead),
      r: stream.threads[k]?.[i]?.r ?? 0,
    }));
    for (const [i, p] of world.entries()) {
      if (p.y < rim - 1e-6 && Math.abs(p.x) + p.r > wallAt(cup, p.y) + 1e-6) {
        problems.push(
          `pierces the wall at ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`
        );
      }
      const q = world[i + 1];
      if (q !== undefined && p.y >= rim && q.y < rim) {
        crossed = true;
        const mix = (p.y - rim) / (p.y - q.y);
        const x = p.x + (q.x - p.x) * mix;
        const r = p.r + (q.r - p.r) * mix;
        if (Math.abs(x) + r > wallAt(cup, rim)) {
          problems.push(`crosses the rim plane at x=${x.toFixed(1)}`);
        }
        for (const view of views) {
          if (
            !inside(
              openingOf(cup).map((each) => onView(view, each)),
              onView(view, project(x, rim, 0))
            )
          ) {
            problems.push(
              `crosses outside the drawn opening at x=${x.toFixed(1)}`
            );
          }
        }
      }
    }
  }
  for (const bead of drawn.beads) {
    const p = onStreamPlane(bead);
    if (p.y < rim) {
      crossed = true;
      if (Math.abs(p.x) > wallAt(cup, p.y)) {
        problems.push(
          `drips through the wall at ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`
        );
      }
    }
  }
  if (drawn.impact !== null) {
    const p = onStreamPlane(drawn.impact);
    if (Math.abs(p.x) > wallAt(cup, Math.min(p.y, rim))) {
      problems.push(
        `lands outside the cup at ${p.x.toFixed(1)}, ${p.y.toFixed(1)}`
      );
    }
  }
  return { problems, reached: crossed || drawn.impact !== null };
};

const fills = (pour: Pour) =>
  [0, 0.3, 0.62, 0.9, 1, limitOf(pour)].map((volume) => ({
    fill: fillOf(pour, volume),
    strain: domeOf(pour, volume),
  }));

const viewsOf = (w: number, h: number) => {
  const layout = layoutOf(w, h, demo);
  return [layout, layout.near];
};

describe("the stream", () => {
  test("falls through the opening and lands inside the cup at every sweep angle", () => {
    for (const [w, h] of [
      ...viewports,
      [414, 896],
      [1920, 1080],
      [1440, 900],
    ] as const) {
      const views = viewsOf(w, h);
      for (const bottle of bottles) {
        for (const cup of cups) {
          const pour: Pour = { ...pourOf(13), bottle, cup };
          for (const angle of sweepOf(bottle)) {
            for (const q of [0.08, 0.3, 0.7, 1, 1.3, 1.6]) {
              const rate = q * pour.flow;
              const emit = (at: number): Jet =>
                jetAt(pour, angle, rate, rate * capacity[cup] * at);
              for (const { fill, strain } of fills(pour)) {
                const { problems, reached } = fallsIn(
                  streamOf(emit, 1, landingOf(fill, strain), pour.flow),
                  cup,
                  views
                );
                const where = `${bottle} into ${cup} at ${angle.toFixed(2)} rad, ${q}x flow, ${w}x${h}`;
                assert.deepEqual(problems, [], where);
                assert.ok(reached, `${where} never reaches the cup`);
              }
            }
          }
        }
      }
    }
  });

  test("stays inside the cup through a whole pour and its drip", () => {
    const views = viewsOf(390, 844);
    for (let seed = 1; seed < 160; seed += 1) {
      const pour = pourOf(seed);
      for (const hold of [pour.lag + 0.4, pour.brink * 0.8, pour.brink]) {
        const outcome = outcomeOf(pour, Math.round(hold * 1000));
        for (let t = 0; t < outcome.settledAt; t += 0.05) {
          const volume = insideAt(pour, outcome.hold, outcome.spilledAt, t);
          const fill = fillOf(pour, volume);
          const stream = streamOf(
            jetOf(pour, outcome.hold),
            t,
            landingOf(fill, domeOf(pour, volume)),
            pour.flow
          );
          const { problems } = fallsIn(stream, pour.cup, views);
          assert.deepEqual(problems, [], `seed ${seed} at ${t.toFixed(2)}s`);
        }
      }
    }
  });
});
