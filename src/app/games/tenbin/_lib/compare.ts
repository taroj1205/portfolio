import type { Lang } from "../../_lib/i18n";
import { items } from "./items";
import type { Item } from "./items";

export interface Measure {
  item: Item;
  count: number;
}

const byWeight = items.toSorted((a, b) => a.grams - b.grams);

const unitsWithout = (id: string) => byWeight.filter((item) => item.id !== id);

export const measureOf = (grams: number, skip: string): Measure => {
  const units = unitsWithout(skip);

  const unit =
    units.findLast((item) => item.grams <= grams) ?? units[0] ?? items[0];

  return { count: grams / unit.grams, item: unit };
};

export const equivalentsOf = (item: Item): Measure[] => {
  const near = measureOf(item.grams, item.id);
  const [smallest] = unitsWithout(item.id);

  const tiny =
    smallest === undefined || smallest.id === near.item.id
      ? []
      : [{ count: item.grams / smallest.grams, item: smallest }];

  return [near, ...tiny].filter((measure) => measure.count >= 1);
};

const counts: Record<Lang, Intl.NumberFormat> = {
  en: new Intl.NumberFormat("en-GB", {
    maximumSignificantDigits: 2,
    notation: "compact",
  }),
  ja: new Intl.NumberFormat("ja-JP", {
    maximumSignificantDigits: 2,
    notation: "compact",
  }),
};

export const numberText = (count: number, lang: Lang) =>
  counts[lang].format(count);

export const countText = (count: number, lang: Lang) =>
  `×${numberText(count, lang)}`;
