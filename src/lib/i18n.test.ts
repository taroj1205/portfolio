import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { day, compact } from "./format";
import { getTranslator, isLocale } from "./i18n";

describe("i18n", () => {
  test("only supported locales are accepted and translated copy preserves English", () => {
    assert.equal(isLocale("en"), true);
    assert.equal(isLocale("ja"), true);
    assert.equal(isLocale("fr"), false);
    assert.equal(isLocale("toString"), false);
    assert.equal(getTranslator("en")("A bit about me"), "A bit about me");
    assert.equal(getTranslator("ja")("A bit about me"), "自己紹介");
    assert.equal(getTranslator("ja")("GitHub"), "GitHub");
    assert.equal(day("2026-09-26T23:00:00Z", "ja"), "9月27日");
    assert.equal(compact(44_000, "ja"), "4.4万");
  });
});
