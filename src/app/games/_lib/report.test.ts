import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { reportUrls } from "./report";

describe("report links", () => {
  test("both links carry the game path in the reader's language", () => {
    const ja = reportUrls("/games/senko", "ja");
    const en = reportUrls("/games/senko", "en");

    const jaIssue = new URL(ja.github);
    assert.equal(jaIssue.pathname, "/taroj1205/portfolio/issues/new");
    assert.equal(jaIssue.searchParams.get("title"), "/games/senko の不具合");
    assert.equal(
      jaIssue.searchParams.get("body"),
      "ゲーム: /games/senko\n\n何が起きたか:\n\n端末とブラウザ:\n"
    );

    assert.equal(
      new URL(en.x).searchParams.get("text"),
      "@taroj1205 Problem in /games/senko: "
    );
  });
});
