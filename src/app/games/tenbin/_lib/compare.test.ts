import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { countText, equivalentsOf, measureOf, numberText } from "./compare";
import { itemById } from "./items";

const item = (id: string) => {
  const found = itemById(id);
  assert.ok(found, id);

  return found;
};

describe("a guess in familiar things", () => {
  it("uses the heaviest thing that still fits under the guess", () => {
    const measure = measureOf(1e6, "cloud");
    assert.equal(measure.item.id, "grand-piano");
    assert.equal(measure.count, 1e6 / item("grand-piano").grams);
  });

  it("never names today's answer, so it can't give it away", () => {
    const panda = item("panda");
    assert.notEqual(measureOf(panda.grams, "panda").item.id, "panda");
    assert.equal(measureOf(panda.grams, "panda").item.id, "emperors-cup");
  });

  it("falls back to the lightest thing below every item", () => {
    const measure = measureOf(1, "one-yen");
    assert.equal(measure.item.id, "five-hundred-yen");
    assert.ok(measure.count < 1);
  });
});

describe("the answer in familiar things", () => {
  it("gives the nearest lighter thing and the ¥1 coin", () => {
    const tower = item("tokyo-tower");
    assert.deepEqual(
      equivalentsOf(tower).map((measure) => measure.item.id),
      ["saturn-v", "one-yen"]
    );
    assert.equal(equivalentsOf(tower)[1]?.count, tower.grams);
  });

  it("names the ¥1 coin once when it is also the nearest", () => {
    assert.deepEqual(
      equivalentsOf(item("five-hundred-yen")).map((measure) => measure.item.id),
      ["one-yen"]
    );
  });

  it("leaves the lightest item without a comparison", () => {
    assert.deepEqual(equivalentsOf(item("one-yen")), []);
  });
});

describe("counts", () => {
  it("read short in both languages", () => {
    assert.equal(countText(1.36, "ja"), "×1.4");
    assert.equal(countText(588, "en"), "×590");
    assert.equal(countText(4e9, "ja"), "×40億");
    assert.equal(countText(4e9, "en"), "×4bn");
  });

  it("keep huge ratios readable", () => {
    assert.equal(numberText(7.3, "ja"), "7.3");
    assert.equal(numberText(413e6, "ja"), "4.1億");
    assert.equal(numberText(413e6, "en"), "410m");
  });
});
