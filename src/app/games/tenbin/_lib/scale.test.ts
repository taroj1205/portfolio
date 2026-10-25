import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { items } from "./items";
import {
  MOST_GRAMS,
  STEPS,
  boundsOf,
  gradeOf,
  gramsAt,
  stepOf,
  weightText,
} from "./scale";

describe("the slider", () => {
  it("runs from 1 g to 100 million tonnes in rounded steps", () => {
    assert.equal(gramsAt(0), 1);
    assert.equal(gramsAt(STEPS), MOST_GRAMS);
    assert.deepEqual(
      Array.from({ length: 11 }, (_, i) => gramsAt(30 + i)),
      [1000, 1250, 1600, 2000, 2500, 3200, 4000, 5000, 6300, 8000, 10_000]
    );
    assert.equal(gramsAt(-4), 1);
    assert.equal(gramsAt(STEPS + 4), MOST_GRAMS);
  });

  it("always has a step close enough to hit any weight in range", () => {
    for (let exponent = 0; exponent <= 14; exponent += 0.0137) {
      const grams = 10 ** exponent;
      assert.equal(gradeOf(gramsAt(stepOf(grams)), grams), "hit", `${grams}`);
    }
  });

  it("every item can be hit, so no puzzle is impossible", () => {
    for (const item of items) {
      assert.equal(
        gradeOf(gramsAt(stepOf(item.grams)), item.grams),
        "hit",
        item.id
      );
    }
  });
});

describe("grades", () => {
  it("hit within 15% of the answer, then go by how many times off", () => {
    assert.equal(gradeOf(115, 100), "hit");
    assert.equal(gradeOf(85, 100), "hit");
    assert.equal(gradeOf(125, 145.2), "hit");
    assert.equal(gradeOf(116, 100), "near");
    assert.equal(gradeOf(84, 100), "near");
    assert.equal(gradeOf(50, 100), "near");
    assert.equal(gradeOf(49, 100), "far");
    assert.equal(gradeOf(1000, 100), "far");
    assert.equal(gradeOf(1001, 100), "way");
    assert.equal(gradeOf(1, 1e14), "way");
  });
});

describe("weights read naturally", () => {
  it("in Japanese, with 万 and 億 for big tonnages", () => {
    assert.equal(weightText(1, "ja"), "1g");
    assert.equal(weightText(7.1, "ja"), "7.1g");
    assert.equal(weightText(1250, "ja"), "1.25kg");
    assert.equal(weightText(6.3e6, "ja"), "6.3トン");
    assert.equal(weightText(4000e6, "ja"), "4000トン");
    assert.equal(weightText(10_100e6, "ja"), "1万100トン");
    assert.equal(weightText(1.24e12, "ja"), "124万トン");
    assert.equal(weightText(1e14, "ja"), "1億トン");
  });

  it("in English, with tonnes and millions", () => {
    assert.equal(weightText(145.2, "en"), "145 g");
    assert.equal(weightText(29e3, "en"), "29 kg");
    assert.equal(weightText(1e6, "en"), "1 tonne");
    assert.equal(weightText(10_100e6, "en"), "10,100 tonnes");
    assert.equal(weightText(5.99e12, "en"), "5.99 million tonnes");
    assert.equal(weightText(1e14, "en"), "100 million tonnes");
  });

  it("to three significant figures, so conversions don't fake precision", () => {
    assert.equal(weightText(330_000 * 453.59237, "ja"), "150トン");
    assert.equal(weightText(6.6e6 * 907_184.74, "ja"), "599万トン");
  });
});

describe("the ruled-out range", () => {
  it("shrinks from both ends as misses come in, and ignores hits", () => {
    const actual = gramsAt(70);
    assert.deepEqual(boundsOf([], actual), { high: STEPS, low: 0 });
    assert.deepEqual(boundsOf([40, 100], actual), { high: 99, low: 41 });
    assert.deepEqual(boundsOf([40, 100, 60, 90], actual), {
      high: 89,
      low: 61,
    });
    assert.deepEqual(boundsOf([70], actual), { high: STEPS, low: 0 });
  });
});
