import assert from "node:assert/strict";

import { afterEach, describe, it, vi } from "vite-plus/test";

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

  it("a new visitor starts with no language chosen, sound on and the distant ring", () => {
    stubStorage({});
    assert.deepEqual(loadSettings(), {
      distantRing: true,
      lang: null,
      muted: false,
      ringTipSeen: false,
    });
  });

  it("settings kept inside an older game save carry over once", () => {
    const data = stubStorage({
      "mizukiri.v3": JSON.stringify({
        runs: 4,
        settings: { lang: "en", muted: true },
      }),
    });

    const carried = {
      distantRing: true,
      lang: "en",
      muted: true,
      ringTipSeen: false,
    };

    assert.deepEqual(loadSettings(), carried);
    data.set("mizukiri.v3", JSON.stringify({ runs: 5 }));
    assert.deepEqual(loadSettings(), carried);
  });

  it("settings saved before the ring options keep their language and sound", () => {
    stubStorage({
      "games.settings.v1": JSON.stringify({ lang: "ja", muted: true }),
    });
    assert.deepEqual(loadSettings(), {
      distantRing: true,
      lang: "ja",
      muted: true,
      ringTipSeen: false,
    });
  });

  it("every game reads what another game stored", () => {
    stubStorage({
      "hoshiai.v1": JSON.stringify({
        settings: { lang: "ja", muted: false },
      }),
    });
    storeSettings({
      distantRing: false,
      lang: "en",
      muted: true,
      ringTipSeen: true,
    });
    assert.deepEqual(loadSettings(), {
      distantRing: false,
      lang: "en",
      muted: true,
      ringTipSeen: true,
    });
  });
});
