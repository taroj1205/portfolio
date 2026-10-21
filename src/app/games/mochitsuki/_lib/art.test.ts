import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { KINE, MOCHI, STRIKE, USU, armPose, kinePose, toWorld } from "./art";

const face = (lift: number) => toWorld(kinePose(lift), STRIKE.x, STRIKE.y);
const fingertips = (reach: number) => toWorld(armPose(reach).hand, 0.13, 0);
const top = MOCHI.y - MOCHI.h;

describe("the mallet", () => {
  test("lands its face on top of the mochi", () => {
    const { x, y } = face(0);
    assert.ok(Math.abs(x - USU.cx) < 0.01);
    assert.ok(Math.abs(y - top) < 0.015);
  });

  test("swings clear of the mochi and stays on screen when raised", () => {
    const head = toWorld(kinePose(1), KINE.reach, 0);
    assert.ok(face(1).y < top - 0.3);
    assert.ok(head.y - KINE.head > 0);
  });
});

describe("the partner's hand", () => {
  test("reaches under the mallet when turning the mochi", () => {
    const tip = fingertips(1);
    assert.ok(Math.abs(tip.x - face(0).x) < KINE.r);
    assert.ok(Math.abs(tip.y - top) < 0.05);
  });

  test("rests by the water tub between turns", () => {
    const tip = fingertips(0);
    assert.ok(tip.x < USU.cx - USU.rim.rx);
    assert.ok(tip.y > USU.rim.y);
  });
});
