import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { spriteDoc } from "../../_lib/svg";
import { SPRITES, backdrop, frameFor, counterOf, sceneDoc } from "./art";
import { cardDoc, cardLayers } from "./card";
import { prizeIds } from "./prizes";

const idsOf = (svg: string) =>
  [...svg.matchAll(/ id="(?<id>[^"]+)"/gu)].map((match) => match.groups?.id);

const documents = [
  sceneDoc(1200, 630, frameFor(1200, 630), {
    got: ["caramel", "game"],
    gun: false,
    standing: prizeIds.filter((id) => id !== "caramel" && id !== "game"),
  }),
  sceneDoc(390, 600, frameFor(390, 600), {
    got: [],
    gun: true,
    standing: prizeIds,
  }),
  sceneDoc(390, 600, frameFor(390, 600), {
    got: prizeIds,
    gun: false,
    standing: [],
  }),
  `<svg>${backdrop(390, 844, frameFor(390, 844))}</svg>`,
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

describe("the prizes on the counter", () => {
  it("line up in order without overlapping and stay on the counter", () => {
    const spots = counterOf(prizeIds);
    assert.deepEqual(
      spots.map((spot) => spot.id),
      prizeIds
    );

    for (let i = 1; i < spots.length; i += 1) {
      assert.ok(spots[i].x > spots[i - 1].x);
    }

    const [first] = spots;
    const [last] = spots.slice(-1);
    assert.ok(first.x > 110 && last.x < 890, `${first.x} ${last.x}`);
  });
});
