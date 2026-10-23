import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { docOf, room, spriteDoc, sprites, stillDoc } from "./art";
import { drawList, flatten, spriteNames, streamOps } from "./draw";
import type { Op } from "./draw";
import { bottles } from "./pour";
import { glassOf } from "./result";
import { basis, poseOf, project, sweepOf } from "./scene";
import { cardDoc, cardLayers, stillOf } from "./still";

const idsOf = (svg: string) =>
  [...svg.matchAll(/ id="(?<id>[^"]+)"/gu)].map((match) => match.groups?.id);

const labelsOf = (body: string) =>
  [
    ...body.matchAll(
      /<path data-glyph="(?<glyph>[^"]+)"[^>]*transform="matrix\((?<matrix>[^)]+)\)"/gu
    ),
  ].map((match) => ({
    glyph: match.groups?.glyph,
    matrix: (match.groups?.matrix ?? "").split(" ").map(Number),
  }));

const pitching = stillOf(null);
const pitch = drawList(pitching);
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

describe("the shaded layers", () => {
  test("carry the 2D layers the OG image and the no-WebGL canvas draw", () => {
    for (const ops of [pitch, brimming, spilled]) {
      const shaded = ops.filter((op) => "ops" in op);
      assert.ok(shaded.some((op) => op.kind === "sake"));
      for (const op of shaded) {
        if (op.kind !== "stream") {
          assert.ok(op.ops.length > 0, op.kind);
        }
      }
      const flat: readonly Op[] = flatten(ops);
      assert.ok(!flat.some((op) => "ops" in op));
      for (const op of shaded) {
        for (const layer of flatten(op.ops)) {
          assert.ok(flat.includes(layer));
        }
      }
    }
  });

  test("shade the glass before the stream that falls into it", () => {
    const kinds = pitch.flatMap((op) => ("ops" in op ? [op.kind] : []));
    assert.deepEqual(kinds.slice(-2), ["glass", "stream"]);
    const stream = pitch.find((op) => op.kind === "stream");
    assert.equal(stream?.ops.length, 0);
  });

  test("draw the 2D stream between the back and front of the glass", () => {
    const glass = pitch.find((op) => op.kind === "glass");
    const layers = flatten(glass?.ops ?? []);
    const at = (name: string) =>
      layers.findIndex((op) => op.kind === "sprite" && op.name === name);
    const ribbons = flatten(streamOps(pitching.stream, pitching.clock)).flatMap(
      (op) => (op.kind === "fill" ? [op.d] : [])
    );
    assert.ok(ribbons.length > 0);
    for (const d of ribbons) {
      const index = layers.findIndex((op) => op.kind === "fill" && op.d === d);
      assert.ok(index > at("glassBack") && index < at("glassFront"));
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

describe("the bottle labels", () => {
  test("are drawn as strokes, not font text", () => {
    assert.deepEqual(
      labelsOf(sprites.isshobin.body).map((label) => label.glyph),
      ["吟", "酒"]
    );
    for (const bottle of bottles) {
      assert.doesNotMatch(sprites[bottle].body, /<text/u);
    }
  });

  test("never read mirrored at any pour angle", () => {
    for (const bottle of bottles) {
      for (const { matrix } of labelsOf(sprites[bottle].body)) {
        const [a = 0, b = 0, c = 0, d = 0] = matrix;
        for (const angle of sweepOf(bottle)) {
          const pose = poseOf(angle, 1);
          const facing = (pose.a * pose.d - pose.b * pose.c) * (a * d - b * c);
          assert.ok(facing > 0, `${bottle} at ${angle}`);
        }
      }
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
