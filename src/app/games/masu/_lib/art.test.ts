import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { docOf, room, spriteDoc, sprites, stillDoc } from "./art";
import { drawList, flatten, spriteNames } from "./draw";
import type { Op } from "./draw";
import { glassOf } from "./result";
import { basis, project } from "./scene";
import { cardDoc, cardLayers, stillOf } from "./still";

const idsOf = (svg: string) =>
  [...svg.matchAll(/ id="(?<id>[^"]+)"/gu)].map((match) => match.groups?.id);

const pitch = drawList(stillOf(null));
const brimming = drawList(stillOf(glassOf({ hold: 4088, seed: 13 })));
const spilled = drawList(stillOf(glassOf({ hold: 3700, seed: 11 })));

describe("the camera basis", () => {
  test("projects every point exactly as project does", () => {
    for (const [x, y, z] of [
      [0, 0, 0],
      [44, 50, 44],
      [-36.5, 6, 36.5],
      [-170, 300, 150],
      [12, 120, -40],
    ] as const) {
      const rel = { x, y: y - basis.middle, z };
      const dot = (v: { x: number; y: number; z: number }) =>
        rel.x * v.x + rel.y * v.y + rel.z * v.z;
      const shrink = basis.distance / (basis.distance - dot(basis.back));
      const expected = project(x, y, z);
      assert.ok(Math.abs(dot(basis.right) * shrink - expected.x) < 1e-9);
      assert.ok(Math.abs(-dot(basis.up) * shrink - expected.y) < 1e-9);
    }
  });
});

describe("the sake surfaces", () => {
  test("carry the 2D layers the OG image and the no-WebGL canvas draw", () => {
    for (const ops of [pitch, brimming, spilled]) {
      const surfaces = ops.filter((op) => op.kind === "sake");
      assert.ok(surfaces.length > 0);
      for (const surface of surfaces) {
        assert.ok(surface.ops.length > 0);
      }
      const flat: readonly Op[] = flatten(ops);
      assert.ok(!flat.some((op) => op.kind === "sake"));
      for (const surface of surfaces) {
        for (const layer of surface.ops) {
          assert.ok(flat.includes(layer));
        }
      }
    }
  });

  test("dome above the rim when the pour brims", () => {
    const domes = brimming.flatMap((op) =>
      op.kind === "sake" && op.liquid.pinned ? [op.liquid] : []
    );
    assert.ok(domes.length > 0);
    for (const liquid of domes) {
      assert.ok(liquid.lift > 0);
    }
  });
});

describe("the svg", () => {
  const frames = [
    { cx: 880, cy: 384, scale: 2.9 },
    { cx: 195, cy: 120, scale: 2.4 },
    { cx: 195, cy: 560, scale: 2.4 },
  ];
  const documents = [
    stillDoc(1200, 630, { cx: 880, cy: 384, scale: 2.9 }, pitch),
    stillDoc(1200, 630, { cx: 880, cy: 384, scale: 2.9 }, brimming),
    stillDoc(1200, 630, { cx: 900, cy: 318, scale: 2.6 }, spilled),
    ...frames.map((frame) =>
      docOf({ h: 844, w: 390, x: 0, y: 0 }, 390, 844, room(390, 844, frame))
    ),
    ...cardLayers.map(cardDoc),
    ...spriteNames.map((name) => spriteDoc(sprites[name], 1)),
  ];

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

  test("has no missing numbers", () => {
    for (const svg of documents) {
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/u);
    }
  });
});
