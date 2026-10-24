import { z } from "zod";

import type { Lang } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { dishes, isDishId } from "./dishes";
import type { DishId } from "./dishes";
import { heightAt, heights, reachedOf } from "./heights";
import { MOON, START } from "./stretch";
import type { Run } from "./stretch";

export interface Result {
  dish: DishId;
  mm: number;
}

const MOON_MM = MOON * 10;
const plain = new Intl.NumberFormat("en-US");

export const resultOf = (run: Run): Result => ({
  dish: run.dish.id,
  mm: Math.min(MOON_MM, Math.round(run.length * 10)),
});

export const cmOf = (result: Result) => result.mm / 10;

export const reachedBy = (result: Result) => reachedOf(cmOf(result));

export const isMoon = (result: Result) => result.mm >= MOON_MM;

export const measure = (cm: number) => {
  if (cm < 100) {
    return { unit: "cm", value: cm.toFixed(1) };
  }

  if (cm < 100_000) {
    return { unit: "m", value: (cm / 100).toFixed(1) };
  }

  if (cm < 10_000_000) {
    return { unit: "km", value: (cm / 100_000).toFixed(2) };
  }

  return { unit: "km", value: plain.format(Math.floor(cm / 100_000)) };
};

export const lengthText = (cm: number, lang: Lang) => {
  const { value, unit } = measure(cm);

  return lang === "en" ? `${value} ${unit}` : `${value}${unit}`;
};

export const titleOf = (result: Result, lang: Lang) => {
  const height = heightAt(reachedBy(result));

  if (height === null) {
    return lang === "en" ? "Just a nibble" : "まだまだこれから";
  }

  return height.title[lang];
};

export const nextOf = (cm: number) => {
  const height = heightAt(reachedOf(cm) + 1);

  return height === null ? null : { height, left: height.cm - cm };
};

export const trailOf = (result: Result) => {
  const reached = reachedBy(result);

  return heights
    .map((height, index) => (index <= reached ? height.emoji : "▫️"))
    .join("");
};

const shared = z.object({
  d: z.string(),
  m: z.coerce
    .number()
    .int()
    .min(START * 10)
    .max(MOON_MM),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);

  if (!parsed.success || !isDishId(parsed.data.d)) {
    return null;
  }

  return { dish: parsed.data.d, mm: parsed.data.m };
};

export const queryOf = (result: Result) =>
  new URLSearchParams({ d: result.dish, m: String(result.mm) }).toString();

const linesOf = (result: Result, lang: Lang) => {
  const length = lengthText(cmOf(result), lang);
  const dish = dishes[result.dish].name[lang];

  if (lang === "en") {
    return [
      `Cheese to the Moon: ${length} of ${dish} cheese. ${titleOf(result, "en")}!`,
      trailOf(result),
      "#月までチーズ #CheeseToTheMoon",
    ];
  }

  return [
    `月までチーズ ${dish}のチーズが${length}のびた。${titleOf(result, "ja")}！`,
    trailOf(result),
    "#月までチーズ",
  ];
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);

  return {
    image: `${origin}/games/cheese/og?${query.toString()}`,
    text: linesOf(result, lang).join("\n"),
    url: `${origin}/games/cheese?${query.toString()}`,
  };
};
