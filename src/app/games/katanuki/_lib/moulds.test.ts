import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { NOTCHES, mouldIds, moulds } from "./moulds";

describe("the moulds", () => {
  it("every outline has evenly spaced notches inside the candy", () => {
    for (const id of mouldIds) {
      const { outline, length } = moulds[id];
      assert.equal(outline.length, NOTCHES, id);
      const spacing = length / NOTCHES;

      for (const [i, point] of outline.entries()) {
        const next = outline[(i + 1) % NOTCHES];
        const gap = Math.hypot(next.x - point.x, next.y - point.y);
        assert.ok(gap <= spacing * 1.01, `${id} ${i}`);
        assert.ok(Math.hypot(point.x - 0.5, point.y - 0.5) < 0.4, `${id} ${i}`);
      }
    }
  });
});
