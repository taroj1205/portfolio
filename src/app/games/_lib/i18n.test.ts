import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { langFromHeader } from "./i18n";

describe("games i18n", () => {
  it("the first listed language decides, and a missing header stays Japanese", () => {
    assert.equal(langFromHeader("ja-JP,ja;q=0.9,en;q=0.8"), "ja");
    assert.equal(langFromHeader("en-US,en;q=0.9,ja;q=0.8"), "en");
    assert.equal(langFromHeader("fr-FR,fr;q=0.9"), "en");
    assert.equal(langFromHeader(null), "ja");
  });
});
