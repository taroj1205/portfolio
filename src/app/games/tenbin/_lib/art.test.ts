import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { artDoc } from "./art";
import { items } from "./items";

const idsOf = (svg: string) =>
  [...svg.matchAll(/ id="(?<id>[^"]+)"/gu)].map((match) => match.groups?.id);

const documents = items.map((item) => artDoc(item.id));

describe("the item art", () => {
  it("draws every item", () => {
    for (const item of items) {
      assert.notEqual(artDoc(item.id), artDoc("missing"), item.id);
    }
  });

  it("never repeats an id inside one drawing", () => {
    for (const svg of documents) {
      const ids = idsOf(svg);
      assert.equal(new Set(ids).size, ids.length);
    }
  });

  it("only points at ids the drawing defines", () => {
    for (const svg of documents) {
      const ids = new Set(idsOf(svg));

      for (const match of svg.matchAll(/url\(#(?<id>[^)]+)\)/gu)) {
        const id = match.groups?.id ?? "";
        assert.ok(ids.has(id), id);
      }
    }
  });

  it("has no missing numbers and stays plain ASCII for data URIs", () => {
    for (const svg of documents) {
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/u);
      assert.match(svg, /^[ -~]+$/u);
    }
  });
});
