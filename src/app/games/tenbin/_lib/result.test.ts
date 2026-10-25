import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { itemById, items } from "./items";
import { queryOf, readShared, shareOf } from "./result";
import type { Shared } from "./result";

const [cloud] = items;

const roundTrip = (shared: Shared) =>
  readShared(Object.fromEntries(new URLSearchParams(queryOf(shared))));

describe("share links", () => {
  it("round-trip a daily result and a which-is-heavier run", () => {
    const daily: Shared = {
      kind: "daily",
      solve: { day: 1, grades: ["way", "far", "hit"], item: cloud },
    };

    const practice: Shared = {
      kind: "daily",
      solve: {
        day: null,
        grades: ["near", "near", "far", "way", "near"],
        item: cloud,
      },
    };

    const versus: Shared = { chain: 12, kind: "versus" };
    assert.deepEqual(roundTrip(daily), daily);
    assert.deepEqual(roundTrip(practice), practice);
    assert.deepEqual(roundTrip(versus), versus);
    assert.equal(queryOf(daily), "i=cloud&s=wfh&n=1");
    assert.equal(queryOf(versus), "c=12");
  });

  it("drop a day number that doesn't match that day's item", () => {
    const faked = readShared({ i: "egg", n: "1", s: "h" });
    assert.equal(faked?.kind, "daily");
    assert.equal(faked?.kind === "daily" ? faked.solve.day : 0, null);
  });

  it("reject broken, impossible and tampered links", () => {
    const bad = [
      {},
      { i: "cloud" },
      { s: "h" },
      { i: "moon", s: "h" },
      { i: "Cloud", s: "h" },
      { i: "cloud", s: "" },
      { i: "cloud", s: "hh" },
      { i: "cloud", s: "hn" },
      { i: "cloud", s: "nnnn" },
      { i: "cloud", s: `${"n".repeat(5)}h` },
      { i: "cloud", s: "nnnnnn" },
      { i: "cloud", s: "x" },
      { i: "cloud", n: "0", s: "h" },
      { i: "cloud", n: "1.5", s: "h" },
      { i: "cloud", n: "100000", s: "h" },
      { i: ["cloud", "egg"], s: "h" },
      { c: "0" },
      { c: "-3" },
      { c: "012" },
      { c: "9".repeat(400) },
    ];

    for (const params of bad) {
      assert.equal(readShared(params), null, JSON.stringify(params));
    }
  });

  it("the share text is the emoji grid, the item and the tags", () => {
    const egg = itemById("egg");
    assert.ok(egg !== undefined);

    const ja = shareOf(
      {
        kind: "daily",
        solve: { day: 2, grades: ["way", "near", "hit"], item: egg },
      },
      "https://example.com",
      "ja"
    );

    assert.equal(
      ja.text,
      "一億トン天秤 #2 🥚 3/5\n🟥🟨🟩\nLサイズの卵の重さ、当てられる？\n#一億トン天秤"
    );
    assert.equal(
      ja.url,
      "https://example.com/games/tenbin?i=egg&s=wnh&n=2&l=ja"
    );
    assert.equal(
      ja.image,
      "https://example.com/games/tenbin/og?i=egg&s=wnh&n=2&l=ja"
    );

    const en = shareOf(
      {
        kind: "daily",
        solve: {
          day: 2,
          grades: ["way", "way", "far", "far", "near"],
          item: egg,
        },
      },
      "https://example.com",
      "en"
    );

    assert.equal(
      en.text,
      "Heftle #2 🥚 X/5\n🟥🟥🟧🟧🟨\nGuess the weight, from 1 g to 100 million tonnes\n#一億トン天秤 #Heftle"
    );
    assert.equal(
      shareOf({ chain: 7, kind: "versus" }, "https://example.com", "ja").text,
      "一億トン天秤「どっちが重い？」7連続正解\n#一億トン天秤"
    );
  });
});
