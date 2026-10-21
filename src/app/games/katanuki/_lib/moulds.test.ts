import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { NOTCHES, mouldIds, mouldOf, moulds } from "./moulds";

describe("the moulds", () => {
  test("every outline has evenly spaced notches inside the candy", () => {
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

  test("the daily shape is the same for everyone and never repeats the next day", () => {
    assert.deepEqual(
      [1, 2, 3, 4, 5, 6].map((day) => mouldOf(day).id).toSorted(),
      [...mouldIds].toSorted()
    );
    const days = Array.from({ length: 3650 }, (_, i) => mouldOf(i + 1).id);
    assert.ok(days.every((id, i) => i === 0 || id !== days[i - 1]));
    assert.equal(mouldOf(40).id, mouldOf(40).id);
    assert.equal(mouldOf(0).id, mouldOf(1).id);
  });
});
