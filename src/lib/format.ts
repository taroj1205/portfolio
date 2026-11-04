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

const monthOf = (
  month: string,
  locale: Locale,
  options: Intl.DateTimeFormatOptions
) =>
  new Date(`${month}-01T00:00:00Z`).toLocaleString(intlLocale(locale), {
    ...options,
    timeZone: "UTC",
  });

export const nameMonths = (
  monthly: { month: string; contributions: number }[],
  locale: Locale
) =>
  monthly.map((m) => ({
    ...m,
    dated: monthOf(m.month, locale, { month: "short", year: "numeric" }),
    narrow:
      locale === "ja"
        ? String(Number(m.month.slice(5)))
        : monthOf(m.month, locale, { month: "narrow" }),
    short: monthOf(m.month, locale, { month: "short" }),
  }));

export type NamedMonth = ReturnType<typeof nameMonths>[number];
