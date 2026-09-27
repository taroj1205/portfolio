import japanese from "./messages/ja.json";

export type Locale = "en" | "ja";

export const isLocale = (value: string): value is Locale =>
  value === "en" || value === "ja";

export const intlLocale = (locale: Locale) =>
  locale === "ja" ? "ja-JP" : "en-NZ";

export const getTranslator = (locale: Locale) => (message: string) => {
  const messages: Readonly<Record<string, string>> = japanese;
  return locale === "ja" && Object.hasOwn(messages, message)
    ? messages[message]
    : message;
};
