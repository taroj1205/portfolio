export const langs = ["ja", "en"] as const;

export type Lang = (typeof langs)[number];

export type Text = Record<Lang, string>;

export const langNames: Text = { en: "English", ja: "日本語" };

export const langPrompt: Record<Lang, { title: string; note: string }> = {
  en: {
    note: "You can change this any time.",
    title: "Choose your language",
  },
  ja: {
    note: "あとからいつでも変えられます",
    title: "言語をえらぶ",
  },
};

export const langFromHeader = (header: string | null): Lang =>
  header === null || header.toLowerCase().startsWith("ja") ? "ja" : "en";

export const guessLang = (): Lang =>
  navigator.language.toLowerCase().startsWith("ja") ? "ja" : "en";

export const langFrom = (value: string | string[] | undefined): Lang =>
  value === "en" ? "en" : "ja";
