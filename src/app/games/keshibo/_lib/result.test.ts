import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { codeOf, designFrom, firstDesign } from "./eraser";
import type { Design } from "./eraser";
import { queryOf, rankOf, readResult, shareOf } from "./result";

const params = (query: string) =>
  Object.fromEntries(new URLSearchParams(query));

const custom: Design = {
  core: "hard",
  form: "jumbo",
  pattern: "dots",
  rubber: "sakura",
  sleeve: "pink",
};

const game = [10, 7, 3, 9, 0, 10, 10, 10, 8, 1, 0, 10, 10, 10, 7, 2];

describe("keshibo share links", () => {
  test("a finished game and its eraser survive the round trip", () => {
    const result = { design: custom, rolls: game };
    assert.deepEqual(readResult(params(queryOf(result))), result);
  });

  test("every eraser design has its own five-digit code", () => {
    assert.deepEqual(designFrom(codeOf(firstDesign)), firstDesign);
    assert.deepEqual(designFrom(codeOf(custom)), custom);
    assert.equal(designFrom("90000"), null);
    assert.equal(designFrom("0000"), null);
  });

  test("an unfinished or impossible game is not read as a result", () => {
    assert.equal(readResult({ e: "00000", r: "xxx" }), null);
    assert.equal(readResult({ e: "00000", r: "66000000000000000000" }), null);
    assert.equal(readResult({ e: "00000" }), null);
    assert.equal(readResult({ e: "0000a", r: "xxxxxxxxxxxx" }), null);
  });

  test("links from other games are not read as a bowling result", () => {
    assert.equal(readResult({ m: "umbrella", t: "400" }), null);
    assert.equal(readResult({ b: "5", r: "120" }), null);
  });

  test("ranks climb with the score and a perfect game tops them", () => {
    assert.equal(rankOf(0).level, 1);
    assert.equal(rankOf(119).level, 2);
    assert.equal(rankOf(299).level, 6);
    assert.equal(rankOf(300).level, 7);
  });

  test("share text starts with the title and ends with the game's own tags", () => {
    const result = { design: custom, rolls: game };
    const ja = shareOf(result, "https://example.com", "ja").text.split("\n");
    const en = shareOf(result, "https://example.com", "en").text.split("\n");
    assert.equal(ja[0], "消しボウ");
    assert.equal(ja.at(-1), "#消しボウ");
    assert.equal(en[0], "Keshibo");
    assert.equal(en.at(-1), "#消しボウ #Keshibo");
  });
});
