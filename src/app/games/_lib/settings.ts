import { z } from "zod";

import { langs } from "./i18n";
import { createStore } from "./storage";

const KEY = "games.settings.v1";
const LEGACY_KEYS = ["mizukiri.v3", "hoshiai.v1"];

const schema = z.object({
  distantRing: z.boolean().default(true),
  lang: z.enum(langs).nullable().default(null),
  muted: z.boolean(),
  ringTipSeen: z.boolean().default(false),
});

export type Settings = z.infer<typeof schema>;

const fresh: Settings = {
  distantRing: true,
  lang: null,
  muted: false,
  ringTipSeen: false,
};

const legacy = z.object({ settings: schema });

const store = createStore(KEY, schema, fresh);

const inherited = (): Settings => {
  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key);

      if (raw !== null) {
        const found = legacy.safeParse(JSON.parse(raw));

        if (found.success) {
          return found.data.settings;
        }
      }
    } catch {
      continue;
    }
  }

  return fresh;
};

export const loadSettings = (): Settings => {
  try {
    if (localStorage.getItem(KEY) !== null) {
      return store.read();
    }

    const settings = inherited();
    store.write(settings);

    return settings;
  } catch {
    return fresh;
  }
};

export const storeSettings = store.write;
