import assert from "node:assert/strict";

import sharp from "sharp";
import { describe, it } from "vite-plus/test";

import { spriteDoc } from "../../_lib/svg";
import {
  SPRITES,
  backdrop,
  frameFor,
  counterOf,
  prizeSprites,
  sceneDoc,
} from "./art";
import { cardDoc, cardLayers } from "./card";
import { kinds, prizeIds } from "./prizes";
import type { PrizeId } from "./prizes";
import { createStall, faceOf, spotOf } from "./stall";

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

const SCALE = 2;
const SLACK = 5;

const rowsOf = async (id: PrizeId) => {
  const sprite = prizeSprites[id];

  const { data, info } = await sharp(Buffer.from(spriteDoc(sprite, SCALE)))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const columns = Array.from({ length: info.width }, (_, column) => column);

  return Array.from({ length: info.height }, (_, row) => {
    const xs = columns
      .filter((column) => data[(row * info.width + column) * 4 + 3] > 24)
      .map((column) => sprite.box.x + (column + 0.5) / SCALE);

    return {
      left: xs.length === 0 ? 0 : -Math.min(...xs),
      right: xs.length === 0 ? 0 : Math.max(...xs),
      v: -(sprite.box.y + (row + 0.5) / SCALE) / kinds[id].h,
    };
  });
};

describe("where the cork can hit", () => {
  it("covers every drawing and reaches no more than a few units past it", async () => {
    const stall = createStall(() => 0.5);

    const drawn = await Promise.all(
      stall.prizes.map(async ({ id }) => await rowsOf(id))
    );

    for (const [index, prize] of stall.prizes.entries()) {
      const face = faceOf(prize);
      const rows = drawn[index];

      for (const [i, { v, left, right }] of rows.entries()) {
        if (v < 0.01 || v > 0.99) {
          continue;
        }

        const near = rows.slice(i - SCALE, i + SCALE + 1);

        const reach = {
          left: face.x - spotOf(prize, -1, v).x,
          right: spotOf(prize, 1, v).x - face.x,
        };

        const where = `${prize.id} at ${v.toFixed(3)}`;
        assert.ok(reach.left >= left - SLACK, where);
        assert.ok(reach.right >= right - SLACK, where);
        assert.ok(
          reach.left <= Math.max(...near.map((r) => r.left)) + SLACK,
          where
        );
        assert.ok(
          reach.right <= Math.max(...near.map((r) => r.right)) + SLACK,
          where
        );
      }
    }
  });
});
