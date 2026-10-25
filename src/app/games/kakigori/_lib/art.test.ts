import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { spriteDoc } from "../../_lib/svg";
import { SPRITES, backdrop, moundBody, sceneDoc } from "./art";
import { cardDoc, cardLayers } from "./card";
import { syrupIds } from "./syrups";

const idsOf = (svg: string) =>
  [...svg.matchAll(/ id="(?<id>[^"]+)"/gu)].map((match) => match.groups?.id);

const profile = [10, 80, 200, 340, 420, 380, 260, 120, 30];

const documents = [
  ...syrupIds.map((syrup) =>
    sceneDoc(
      1200,
      630,
      { size: 620, x: 570, y: 98 },
      { lean: 0, profile, syrup, toppled: syrup === "melon" }
    )
  ),
  sceneDoc(
    390,
    600,
    { size: 390, x: 0, y: 0 },
    { lean: 0.2, profile: null, syrup: null, toppled: false }
  ),
  `<svg>${backdrop(390, 844)}</svg>`,
  `<svg>${moundBody(profile, null)}</svg>`,
  ...cardLayers.map(cardDoc),
  ...SPRITES.map((sprite) => spriteDoc(sprite, 1)),
];

describe("the svg", () => {
  it("never repeats an id inside one document", () => {
    for (const svg of documents) {
      const ids = idsOf(svg);
      assert.equal(new Set(ids).size, ids.length);
    }
  });

  it("only points at ids it defines", () => {
    for (const svg of documents) {
      const ids = new Set(idsOf(svg));

      for (const match of svg.matchAll(/(?:url\(#|href="#)(?<id>[^)"]+)/gu)) {
        const id = match.groups?.id ?? "";
        assert.ok(ids.has(id), id);
      }
    }
  });

  it("has no missing numbers", () => {
    for (const svg of documents) {
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/u);
    }
  });
});
