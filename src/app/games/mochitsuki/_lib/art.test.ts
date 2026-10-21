import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  KINE,
  MOCHI,
  STRIKE,
  USU,
  armPose,
  kinePose,
  sceneDoc,
  toWorld,
} from "./art";
import { cardDoc, cardLayers } from "./card";

const face = (lift: number) => toWorld(kinePose(lift), STRIKE.x, STRIKE.y);
const fingertips = (reach: number) => toWorld(armPose(reach).hand, 130, 0);
const top = MOCHI.y - MOCHI.h;
const idsOf = (svg: string) =>
  [...svg.matchAll(/ id="(?<id>[^"]+)"/gu)].map((match) => match.groups?.id);

describe("the mallet", () => {
  test("lands its face on top of the mochi", () => {
    const { x, y } = face(0);
    assert.ok(Math.abs(x - USU.cx) < 10);
    assert.ok(Math.abs(y - top) < 15);
  });

  test("swings clear of the mochi and stays on screen when raised", () => {
    const head = toWorld(kinePose(1), KINE.reach, 0);
    assert.ok(face(1).y < top - 300);
    assert.ok(head.y - KINE.head > 0);
  });
});

describe("the partner's hand", () => {
  test("reaches under the mallet when turning the mochi", () => {
    const tip = fingertips(1);
    assert.ok(Math.abs(tip.x - face(0).x) < KINE.r);
    assert.ok(Math.abs(tip.y - top) < 50);
  });

  test("rests by the water tub between turns", () => {
    const tip = fingertips(0);
    assert.ok(tip.x < USU.cx - USU.rim.rx);
    assert.ok(tip.y > USU.rim.y);
  });
});

describe("the svg", () => {
  const documents = [
    sceneDoc(
      1200,
      630,
      { size: 560, x: 640, y: 76 },
      {
        hurt: true,
        lift: 0,
        reach: 1,
        smooth: 0.4,
      }
    ),
    ...cardLayers.map(cardDoc),
  ];

  test("never repeats an id inside one document", () => {
    for (const svg of documents) {
      const ids = idsOf(svg);
      assert.equal(new Set(ids).size, ids.length);
    }
  });

  test("only points at gradients, filters and masks it defines", () => {
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
