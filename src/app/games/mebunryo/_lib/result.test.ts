import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import {
  queryOf,
  rankOf,
  readShared,
  rowOf,
  shareOf,
  titleOf,
  verdictOf,
} from "./result";

const marks = [100, 95, 90, 89, 70, 69, 40, 39, 0, 50];
const shared = { marks, seed: 123_456_789 };

const params = (query: string) =>
  Object.fromEntries(new URLSearchParams(query));

describe("mebunryo result", () => {
  it("round-trips a challenge link with the seed and every mark", () => {
    assert.equal(
      queryOf(shared),
      "m=100.95.90.89.70.69.40.39.0.50&s=123456789"
    );
    assert.deepEqual(readShared(params(queryOf(shared))), shared);
  });

  it("ignores links that could not come from a finished run", () => {
    const bad = [
      "m=100.95&s=5",
      "m=101.95.90.89.70.69.40.39.0.50&s=5",
      "m=100.95.90.89.70.69.40.39.0.50&s=0",
      "m=100.95.90.89.70.69.40.39.0.50&s=2147483647",
      "m=100.95.90.89.70.69.40.39.0.50",
      "s=5",
    ];

    for (const query of bad) {
      assert.equal(readShared(params(query)), null, query);
    }
  });

  it("colours each puzzle by how close it was", () => {
    assert.equal(rowOf(marks), "🟩🟩🟩🟨🟨🟧🟧🟥🟥🟧");
    assert.equal(verdictOf(90), "eagle");
    assert.equal(verdictOf(39), "off");
    assert.equal(rankOf(900), "ruler");
    assert.equal(rankOf(549), "training");
  });

  it("shares the same ten puzzles with the game's hashtags", () => {
    const ja = shareOf(shared, "https://example.com", "ja");
    assert.equal(
      ja.text,
      "目分量十番勝負 642点\n🟩🟩🟩🟨🟨🟧🟧🟥🟥🟧\n同じ10問で勝負しよう\n#目分量十番勝負"
    );
    assert.equal(
      ja.url,
      "https://example.com/games/mebunryo?m=100.95.90.89.70.69.40.39.0.50&s=123456789&l=ja"
    );

    const en = shareOf(shared, "https://example.com", "en");
    assert.equal(
      en.text,
      "Ten Rounds by Eye: 642/1000\n🟩🟩🟩🟨🟨🟧🟧🟥🟥🟧\nSame ten puzzles. Can you beat it?\n#目分量十番勝負 #TenRoundsByEye"
    );
    assert.ok(en.image.startsWith("https://example.com/games/mebunryo/og?"));
    assert.equal(
      titleOf(shared, "ja"),
      "目分量十番勝負 642点 🟩🟩🟩🟨🟨🟧🟧🟥🟥🟧"
    );
  });
});
