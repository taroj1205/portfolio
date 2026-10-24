import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  cheeseMoon,
  landmarkBody,
  moon,
  plates,
  pullDoc,
  spriteDoc,
} from "./art";
import { cardDoc, cardLayers } from "./card";
import { dishIds } from "./dishes";

const idsOf = (svg: string) =>
  [...svg.matchAll(/ id="(?<id>[^"]+)"/gu)].map((match) => match.groups?.id);

const documents = [
  ...dishIds.flatMap((dish) => [
    spriteDoc(plates[dish].base, 1),
    spriteDoc(plates[dish].held, 1),
    pullDoc(
      1200,
      630,
      { base: { x: 900, y: 560 }, dish, size: 430, top: 200 },
      ["back", "cheese", "held"],
      landmarkBody("tower", "t", { x: 100, y: 630 }, 300)
    ),
  ]),
  spriteDoc(moon, 1),
  spriteDoc(cheeseMoon, 1),
  ...cardLayers.map(cardDoc),
];

describe("the cheese svg", () => {
  test("never repeats an id inside one document", () => {
    for (const svg of documents) {
      const ids = idsOf(svg);
      assert.equal(new Set(ids).size, ids.length);
    }
  });

  test("only points at gradients, filters and clips it defines", () => {
    for (const svg of documents) {
      const ids = new Set(idsOf(svg));
      for (const match of svg.matchAll(/url\(#(?<id>[^)]+)\)/gu)) {
        const id = match.groups?.id ?? "";
        assert.ok(ids.has(id), id);
      }
    }
  });

  test("has no missing numbers and stays ASCII for btoa", () => {
    for (const svg of documents) {
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/u);
      assert.doesNotMatch(svg, /[^ -~]/u);
    }
  });
});
