import assert from "node:assert/strict";

import { afterEach, describe, it, vi } from "vite-plus/test";

import { createBrush } from "./brush";
import { modelSamples, modelTrace } from "./model";
import { nextRank, queryOf, rankOf, readResult, shareOf } from "./result";
import { loadSave, settle } from "./save";
import { judge } from "./score";
import type { Point } from "./score";
import { MAX_POINTS, inkPaths, pack, simplify, unpack } from "./stroke";

const ring = (
  count: number,
  {
    turns = 1,
    r = 0.35,
    rx = r,
    ry = r,
    wobble = () => 0,
  }: {
    turns?: number;
    r?: number;
    rx?: number;
    ry?: number;
    wobble?: (angle: number) => number;
  } = {}
): Point[] =>
  Array.from({ length: count }, (_, i) => {
    const angle = (i / (count - 1)) * Math.PI * 2 * turns;
    const k = 1 + wobble(angle);

    return {
      x: 0.5 + Math.cos(angle) * rx * k,
      y: 0.5 + Math.sin(angle) * ry * k,
    };
  });

const scoreOf = (points: Point[]) => judge(points).score;

const widthAt = (duration: number) => {
  const brush = createBrush(3);
  const points = ring(80);
  brush.press({ ...points[0], t: 0 });

  for (const [i, p] of points.entries()) {
    brush.move({ ...p, t: (i / points.length) * duration });
  }

  const trace = brush.trace();

  return trace.reduce((sum, p) => sum + p.w, 0) / trace.length;
};

describe("judging a circle", () => {
  it("a true circle scores at the top, whatever the point spacing", () => {
    assert.ok(scoreOf(ring(400)) >= 99.5);
    assert.ok(scoreOf(ring(60)) >= 99);
    const uneven = ring(400).filter((_, i) => i % 7 === 0 || i < 40);
    assert.ok(scoreOf(uneven) >= 99);
  });

  it("a steady hand beats a shaky one", () => {
    const steady = scoreOf(
      ring(300, { wobble: (a) => 0.015 * Math.sin(a * 3) })
    );

    const shaky = scoreOf(ring(300, { wobble: (a) => 0.1 * Math.sin(a * 24) }));
    assert.ok(steady >= 94, `steady ${steady}`);
    assert.ok(shaky < 80, `shaky ${shaky}`);
    assert.ok(
      scoreOf(ring(300, { wobble: (a) => 0.16 * Math.sin(a * 24) })) < 65
    );
    assert.equal(
      judge(ring(300, { wobble: (a) => 0.1 * Math.sin(a * 24) })).flaw,
      "wobbly"
    );
  });

  it("an ellipse loses points the flatter it gets", () => {
    const slight = scoreOf(ring(300, { rx: 0.35, ry: 0.32 }));
    const flat = scoreOf(ring(300, { rx: 0.35, ry: 0.25 }));
    assert.ok(slight < 95, `slight ${slight}`);
    assert.ok(flat < 65, `flat ${flat}`);
    assert.ok(flat < slight);
  });

  it("half a circle, or a stroke that goes back the way it came, scores nothing", () => {
    assert.equal(scoreOf(ring(200, { turns: 0.5 })), 0);
    assert.equal(judge(ring(200, { turns: 0.5 })).flaw, "partial");
    const there = ring(100, { turns: 0.5 });
    assert.equal(scoreOf([...there, ...there.toReversed()]), 0);
  });

  it("a gap between the ends costs points, a small overlap does not", () => {
    const open = judge(ring(300, { turns: 0.9 }));
    assert.ok(open.score < 60, `open ${open.score}`);
    assert.equal(open.flaw, "open");
    assert.ok(scoreOf(ring(300, { turns: 1.05 })) >= 99);
  });

  it("going round twice is not one circle", () => {
    const twice = judge(ring(600, { turns: 2 }));
    assert.equal(twice.flaw, "loops");
    assert.ok(twice.score < 10);
  });

  it("a tiny circle scores low, and a scribble too short to judge scores nothing", () => {
    const tiny = judge(ring(200, { r: 0.07 }));
    assert.equal(tiny.flaw, "small");
    assert.ok(tiny.score < 20);
    assert.equal(judge(ring(50, { r: 0.02 })).flaw, "short");
    assert.equal(judge([{ x: 0.5, y: 0.5 }]).flaw, "short");
    assert.equal(judge([]).flaw, "short");
  });

  it("a straight line has no circle to fit", () => {
    const line = Array.from({ length: 50 }, (_, i) => ({ x: i / 50, y: 0.5 }));
    assert.deepEqual(judge(line), { circle: null, flaw: "partial", score: 0 });
  });

  it("the fitted circle matches the drawn one and the score has one decimal", () => {
    const verdict = judge(
      ring(300, { r: 0.3, wobble: (a) => 0.02 * Math.sin(a * 5) })
    );

    assert.ok(verdict.circle);
    assert.ok(Math.abs(verdict.circle.x - 0.5) < 0.01);
    assert.ok(Math.abs(verdict.circle.r - 0.3) < 0.01);
    assert.equal(Math.round(verdict.score * 10) / 10, verdict.score);
  });
});

describe("the brush", () => {
  it("a fast stroke is thinner than a slow one", () => {
    assert.ok(widthAt(300) < widthAt(3000) * 0.7);
  });

  it("the example circle is drawn, closes and scores well", () => {
    const verdict = judge(modelSamples);
    assert.ok(verdict.score >= 90, `model ${verdict.score}`);
    assert.ok(modelTrace.length >= 10 && modelTrace.length <= MAX_POINTS);
  });
});

describe("sharing a circle", () => {
  it("a stroke packs into a short link and comes back intact", () => {
    const text = pack(modelTrace);
    assert.match(text, /^[\w-]+$/u);
    assert.ok(text.length <= MAX_POINTS * 4);
    const back = unpack(text);
    assert.ok(back);
    assert.equal(back.length, modelTrace.length);

    for (const [i, p] of back.entries()) {
      const q = modelTrace[i];
      assert.ok(Math.abs(p.x - q.x) < 0.003 && Math.abs(p.y - q.y) < 0.003);
    }
  });

  it("long strokes are thinned to fit and stay inside the unit box", () => {
    const long = ring(2000, { wobble: (a) => 0.04 * Math.sin(a * 40) }).map(
      (p) => ({ ...p, w: 0.05 })
    );

    const kept = simplify(long);
    assert.ok(kept.length <= MAX_POINTS);

    for (const p of kept) {
      assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
    }
  });

  it("a drag far longer than one circle still thins down to a link", () => {
    const drag = Array.from({ length: 80_000 }, (_, i) => ({
      w: 0.04,
      x: 0.5 + Math.cos(i / 500) * 0.3,
      y: 0.5 + Math.sin(i / 500) * 0.3,
    }));

    assert.ok(simplify(drag).length <= MAX_POINTS);
  });

  it("broken or oversized links are ignored", () => {
    assert.equal(unpack(""), null);
    assert.equal(unpack("a"), null);
    assert.equal(unpack("ab$c"), null);
    assert.equal(unpack("A".repeat(MAX_POINTS * 4 + 4)), null);
    assert.equal(readResult({ d: pack(modelTrace), s: "1001" }), null);
    assert.equal(readResult({ s: "937" }), null);
    assert.equal(readResult({ d: "!!", s: "937" }), null);
  });

  it("a shared result round-trips through the query and the share text", () => {
    const result = { score: 93.7, trace: modelTrace };
    const query = Object.fromEntries(new URLSearchParams(queryOf(result)));
    const back = readResult(query);
    assert.equal(back?.score, 93.7);
    assert.equal(back?.trace.length, modelTrace.length);
    const share = shareOf(result, "https://example.com", "ja");
    assert.ok(share.url.startsWith("https://example.com/games/enso?"));
    assert.ok(share.image.includes("/games/enso/og?"));
    assert.match(share.text, /93\.7%/u);
    assert.match(share.text, /初段/u);
    assert.match(share.text, /#ひと筆の月/u);
  });

  it("the ink outline is a closed path of finite numbers", () => {
    const { body, streaks } = inkPaths(modelTrace, { size: 400, x: 10, y: 20 });
    assert.match(body, /^M.*Z$/u);
    assert.doesNotMatch(body, /NaN|Infinity/u);
    assert.ok(streaks.length > 0);

    const single = inkPaths(
      [
        { w: 0.1, x: 0.5, y: 0.5 },
        { w: 0.1, x: 0.5, y: 0.5 },
      ],
      {
        size: 100,
        x: 0,
        y: 0,
      }
    );

    assert.doesNotMatch(single.body, /NaN|Infinity/u);
  });
});

describe("ranks and the save", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("a save missing newer fields keeps its best and draws", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => JSON.stringify({ best: 91.5, draws: 3 }),
    });
    assert.deepEqual(loadSave(), {
      best: 91.5,
      divine: 0,
      draws: 3,
      firstPlayed: null,
      lastPlayed: null,
      seconds: 0,
      total: 0,
    });
  });

  it("every score has one rank and the next one to aim for", () => {
    assert.equal(rankOf(100).name.en, "Divine");
    assert.equal(rankOf(93.9).name.en, "First dan");
    assert.equal(rankOf(0).name.en, "Beginner");
    assert.equal(nextRank(93.9)?.name.en, "Sensei");
    assert.equal(nextRank(99.2), null);
  });

  it("the first circle sets the best without calling it a new record", () => {
    const fresh = loadSave();
    const first = settle(fresh, { at: 1000, score: 80, seconds: 1.24 });
    assert.equal(first.record, false);
    assert.deepEqual(first.save, {
      best: 80,
      divine: 0,
      draws: 1,
      firstPlayed: 1000,
      lastPlayed: 1000,
      seconds: 1.2,
      total: 80,
    });
    const better = settle(first.save, { at: 5000, score: 99.1, seconds: 2 });
    assert.equal(better.record, true);
    assert.deepEqual(better.save, {
      best: 99.1,
      divine: 1,
      draws: 2,
      firstPlayed: 1000,
      lastPlayed: 5000,
      seconds: 3.2,
      total: 179.1,
    });
    const worse = settle(better.save, { at: 9000, score: 70.2, seconds: 1 });
    assert.equal(worse.record, false);
    assert.equal(worse.save.best, 99.1);
    assert.equal(worse.save.total, 249.3);
  });
});
