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

  test("a new visitor starts with no language chosen, sound on and the ring under the stone", () => {
    stubStorage({});
    assert.deepEqual(loadSettings(), {
      distantRing: false,
      lang: null,
      muted: false,
    });
  });

  test("settings kept inside an older game save carry over once", () => {
    const data = stubStorage({
      "mizukiri.v3": JSON.stringify({
        runs: 4,
        settings: { lang: "en", muted: true },
      }),
    });
    const carried = { distantRing: false, lang: "en", muted: true };
    assert.deepEqual(loadSettings(), carried);
    data.set("mizukiri.v3", JSON.stringify({ runs: 5 }));
    assert.deepEqual(loadSettings(), carried);
  });

  test("settings saved before the ring option keep their language and sound", () => {
    stubStorage({
      "games.settings.v1": JSON.stringify({ lang: "ja", muted: true }),
    });
    assert.deepEqual(loadSettings(), {
      distantRing: false,
      lang: "ja",
      muted: true,
    });
  });

  test("every game reads what another game stored", () => {
    stubStorage({
      "hoshiai.v1": JSON.stringify({
        settings: { lang: "ja", muted: false },
      }),
    });
    storeSettings({ distantRing: true, lang: "en", muted: true });
    assert.deepEqual(loadSettings(), {
      distantRing: true,
      lang: "en",
      muted: true,
    });
  });
});
