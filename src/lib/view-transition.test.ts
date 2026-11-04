import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { turnTiming } from "./view-transition";

const along = (s: number, a: number, b: number) =>
  3 * (1 - s) ** 2 * s * a + 3 * (1 - s) * s ** 2 * b + s ** 3;

const curve = (easing: string) => {
  const [x1, y1, x2, y2] = (easing.match(/[\d.]+/gu) ?? []).map(Number);

  return (x: number) => {
    let [low, high] = [0, 1];

    for (let i = 0; i < 60; i += 1) {
      const mid = (low + high) / 2;
      [low, high] = along(mid, x1, x2) < x ? [mid, high] : [low, mid];
    }

    return along((low + high) / 2, y1, y2);
  };
};

describe(turnTiming, () => {
  it("restarts a turned animation at the progress it had reached", () => {
    for (const back of [false, true]) {
      for (const progress of [0, 0.05, 0.3, 0.5, 0.78, 0.97, 1]) {
        const { at, easing } = turnTiming(progress, back);

        assert.ok(Math.abs(curve(easing)(at) - progress) < 1e-6);
      }
    }
  });

  it("leaves more of the turn to run the further it has to travel", () => {
    assert.ok(turnTiming(0.9, true).at > turnTiming(0.2, true).at);
    assert.ok(turnTiming(0.2, false).at < turnTiming(0.9, false).at);
  });
});
