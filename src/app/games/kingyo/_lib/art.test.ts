import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { spriteDoc } from "../../_lib/svg";
import { SPRITES, backdrop, posed, sceneDoc } from "./art";
import { cardDoc, cardLayers } from "./card";
import { kindIds } from "./fish";

const idsOf = (svg: string) =>
  [...svg.matchAll(/ id="(?<id>[^"]+)"/gu)].map((match) => match.groups?.id);

const documents = [
  sceneDoc(
    1200,
    630,
    { size: 600, x: 590, y: 15 },
    {
      bowl: [...kindIds],
      poi: { torn: true, x: 330, y: 610 },
      swimmers: posed(5, 9),
    }
  ),
  sceneDoc(
    400,
    400,
    { size: 400, x: 0, y: 0 },
    {
      bowl: null,
      poi: null,
      swimmers: kindIds.map((kind, i) => ({
        heading: i,
        kind,
        sway: 0.2,
        x: 100 + i * 100,
        y: 500,
      })),
    }
  ),
  `<svg>${backdrop(390, 390, { size: 390, x: 0, y: 0 })}</svg>`,
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
