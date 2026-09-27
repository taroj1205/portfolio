import { intlLocale } from "./i18n";
import type { Locale } from "./i18n";

export const fmt = (n: number, locale: Locale = "en") =>
  n.toLocaleString(intlLocale(locale));

export const compact = (n: number, locale: Locale = "en") =>
  n.toLocaleString(intlLocale(locale), {
    maximumFractionDigits: 1,
    notation: "compact",
  });

export const day = (iso: string, locale: Locale = "en") =>
  new Date(iso).toLocaleDateString(intlLocale(locale), {
    day: "numeric",
    month: "short",
    timeZone: "Pacific/Auckland",
  });

export const splitTitle = (title: string) => {
  const match = /^(?<type>\w+)(?:\([^)]*\))?!?:\s*(?<text>.*)$/u.exec(title);
  return {
    text: match?.groups?.text ?? title,
    type: match?.groups?.type ?? "",
  };
};
