import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { itemById, items } from "./items";
import { MOST_GRAMS } from "./scale";

describe("the items", () => {
  it("start with thirty, each with a unique id that fits a share link", () => {
    assert.equal(items.length, 30);
    const ids = items.map((item) => item.id);
    assert.equal(new Set(ids).size, ids.length);

    for (const id of ids) {
      assert.match(id, /^[a-z0-9-]{1,24}$/u);
      assert.equal(itemById(id)?.id, id);
    }

    assert.equal(itemById("nothing"), undefined);
  });

  it("all weigh between 1 g and 100 million tonnes", () => {
    for (const item of items) {
      assert.ok(item.grams >= 1 && item.grams <= MOST_GRAMS, item.id);
    }
  });

  it("all cite an https source and say what the number covers", () => {
    for (const item of items) {
      assert.equal(new URL(item.source.url).protocol, "https:", item.id);
      assert.ok(item.source.name.length > 0, item.id);
      assert.ok(item.detail.ja.length > 0 && item.detail.en.length > 0);
      assert.ok(item.name.ja.length > 0 && item.name.en.length > 0);
    }
  });

  it("spread across the whole slider, not bunched in one band", () => {
    const decades = new Set(
      items.map((item) => Math.floor(Math.log10(item.grams)))
    );

    assert.ok(decades.size >= 12, `${decades.size}`);
  });
});
