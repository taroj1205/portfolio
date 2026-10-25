import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { spriteDoc } from "../../_lib/svg";
import { SPRITES, backdrop, clumpsOf, moundBody, sceneDoc } from "./art";
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

const cone = (height: number) =>
  Array.from({ length: 50 }, (_, i) =>
    Math.max(0, height - Math.abs(i - 24.5) * (height / 20))
  );

describe("the ice clumps", () => {
  it("stay where they are as the mound grows, so the texture never crawls", () => {
    const grown = new Set(
      clumpsOf(cone(320)).map(({ x, y }) => `${x.toFixed(3)},${y.toFixed(3)}`)
    );

    for (const { x, y } of clumpsOf(cone(160))) {
      assert.ok(grown.has(`${x.toFixed(3)},${y.toFixed(3)}`), `${x},${y}`);
    }
  });

  it("only sit inside the mound", () => {
    const heights = cone(240);
    const clumps = clumpsOf(heights);
    assert.ok(clumps.length > 40, `${clumps.length} clumps`);

    for (const { x, y, ry } of clumps) {
      assert.ok(-y <= 240 + ry, `${x},${y}`);
      assert.ok(Math.abs(x) <= 220, `${x},${y}`);
    }

    assert.equal(clumpsOf(Array.from({ length: 50 }, () => 0)).length, 0);
  });
});
