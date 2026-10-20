export const langs = ["ja", "en"] as const;

export type Lang = (typeof langs)[number];

export type Text = Record<Lang, string>;

export const langNames: Text = { en: "English", ja: "日本語" };

export const langFromHeader = (header: string | null): Lang =>
  header === null || header.toLowerCase().startsWith("ja") ? "ja" : "en";

export const guessLang = (): Lang =>
  navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";

export const langFrom = (value: string | string[] | undefined): Lang =>
  value === "en" ? "en" : "ja";
