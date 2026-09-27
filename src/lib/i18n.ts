import { ja } from "./messages/ja";

export type Locale = "en" | "ja";

export const isLocale = (value: string): value is Locale =>
  value === "en" || value === "ja";

export const intlLocale = (locale: Locale) =>
  locale === "ja" ? "ja-JP" : "en-NZ";

export const getTranslator =
  (locale: Locale) =>
  (key: keyof typeof ja, english: string): string =>
    locale === "ja" ? ja[key] : english;
