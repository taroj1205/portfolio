import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { day, compact } from "./format";
import { getTranslator, isLocale } from "./i18n";

describe("i18n", () => {
  test("only supported locales are accepted", () => {
    assert.equal(isLocale("en"), true);
    assert.equal(isLocale("ja"), true);
    assert.equal(isLocale("fr"), false);
    assert.equal(isLocale("toString"), false);
  });

  test("English copy can change without breaking the Japanese translation", () => {
    const en = getTranslator("en");
    const ja = getTranslator("ja");
    assert.equal(en("contact.title", "Say hi."), "Say hi.");
    assert.equal(en("contact.title", "Get in touch."), "Get in touch.");
    assert.equal(ja("contact.title", "Say hi."), "連絡はこちら");
    assert.equal(ja("contact.title", "Get in touch."), "連絡はこちら");
    assert.ok(
      ja("work.intro", "{total} merged PRs")
        .replace("{total}", "1,234")
        .includes("1,234件")
    );
    assert.equal(day("2026-09-26T23:00:00Z", "ja"), "9月27日");
    assert.equal(compact(44_000, "ja"), "4.4万");
  });
});
