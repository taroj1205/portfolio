import assert from "node:assert/strict";

import { afterEach, describe, test, vi } from "vite-plus/test";

import { loadSettings, storeSettings } from "./settings";

const stubStorage = (entries: Record<string, string>) => {
  const data = new Map(Object.entries(entries));
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  });
  return data;
};

describe("shared game settings", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("a new visitor starts with no language chosen and sound on", () => {
    stubStorage({});
    assert.deepEqual(loadSettings(), { lang: null, muted: false });
  });

  test("settings kept inside an older game save carry over once", () => {
    const data = stubStorage({
      "mizukiri.v3": JSON.stringify({
        runs: 4,
        settings: { lang: "en", muted: true },
      }),
    });
    assert.deepEqual(loadSettings(), { lang: "en", muted: true });
    data.set("mizukiri.v3", JSON.stringify({ runs: 5 }));
    assert.deepEqual(loadSettings(), { lang: "en", muted: true });
  });

  test("every game reads what another game stored", () => {
    stubStorage({
      "hoshiai.v1": JSON.stringify({
        settings: { lang: "ja", muted: false },
      }),
    });
    storeSettings({ lang: "en", muted: true });
    assert.deepEqual(loadSettings(), { lang: "en", muted: true });
  });
});
