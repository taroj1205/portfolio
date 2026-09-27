import ja from "./messages/ja.json";

export type Locale = "en" | "ja";

type MessageKey<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${MessageKey<T[K]>}`;
}[keyof T & string];

interface Messages {
  [key: string]: string | Messages;
}

export const isLocale = (value: string): value is Locale =>
  value === "en" || value === "ja";

export const intlLocale = (locale: Locale) =>
  locale === "ja" ? "ja-JP" : "en-NZ";

export const getTranslator =
  (locale: Locale) =>
  (key: MessageKey<typeof ja>, english: string): string => {
    if (locale === "en") {
      return english;
    }
    let message: string | Messages = ja;
    for (const part of key.split(".")) {
      if (typeof message === "string" || !Object.hasOwn(message, part)) {
        return english;
      }
      message = message[part];
    }
    return typeof message === "string" ? message : english;
  };
