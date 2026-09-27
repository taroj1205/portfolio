import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { horizontalWheelGesture } from "./wheel-gesture";

describe("wheel gesture", () => {
  test("wheel gestures keep their starting axis until scrolling stops", () => {
    const horizontal = horizontalWheelGesture();
    assert.equal(horizontal({ deltaX: 0, deltaY: 0, timeStamp: 0 }), false);
    assert.equal(horizontal({ deltaX: 1, deltaY: 20, timeStamp: 0 }), false);
    assert.equal(horizontal({ deltaX: 30, deltaY: 2, timeStamp: 16 }), false);
    assert.equal(horizontal({ deltaX: 15, deltaY: 0, timeStamp: 100 }), false);
    assert.equal(horizontal({ deltaX: 5, deltaY: 0, timeStamp: 220 }), false);
    assert.equal(horizontal({ deltaX: 20, deltaY: 1, timeStamp: 500 }), true);
    assert.equal(horizontal({ deltaX: 2, deltaY: 30, timeStamp: 516 }), true);
    assert.equal(horizontal({ deltaX: 0, deltaY: 20, timeStamp: 800 }), false);
    assert.equal(
      horizontal({ deltaX: 10, deltaY: 10, timeStamp: 1100 }),
      false
    );
    assert.equal(
      horizontal({ deltaX: -20, deltaY: 0, timeStamp: 1116 }),
      false
    );
    assert.equal(horizontal({ deltaX: 0, deltaY: 0, timeStamp: 1400 }), false);
    assert.equal(horizontal({ deltaX: -20, deltaY: 0, timeStamp: 1416 }), true);
  });
});
