import type { Lang } from "../../_lib/i18n";

const NICE = [1, 1.25, 1.6, 2, 2.5, 3.2, 4, 5, 6.3, 8] as const;
const PER_DECADE = NICE.length;

export const STEPS = 140;
export const START = 60;
export const MOST_GRAMS = 1e14;

export const DECADES = [
  { step: 0, text: { en: "1 g", ja: "1g" } },
  { step: 30, text: { en: "1 kg", ja: "1kg" } },
  { step: 60, text: { en: "1 t", ja: "1t" } },
  { step: 100, text: { en: "10,000 t", ja: "1万t" } },
  { step: 140, text: { en: "100M t", ja: "1億t" } },
] as const;

export const gramsAt = (step: number) => {
  const whole = Math.max(0, Math.min(STEPS, Math.round(step)));

  return (NICE[whole % PER_DECADE] ?? 1) * 10 ** Math.floor(whole / PER_DECADE);
};

export const stepOf = (grams: number) =>
  Math.max(0, Math.min(STEPS, Math.round(Math.log10(grams) * PER_DECADE)));

export const gradeOrder = ["hit", "near", "far", "way"] as const;

export type Grade = (typeof gradeOrder)[number];

const HIT = 0.15;
const NEAR = 2;
const FAR = 10;

export const ratioOf = (guess: number, actual: number) =>
  Math.max(guess / actual, actual / guess);

export const gradeOf = (guess: number, actual: number): Grade => {
  if (Math.abs(guess - actual) <= actual * HIT) {
    return "hit";
  }

  const ratio = ratioOf(guess, actual);

  if (ratio <= NEAR) {
    return "near";
  }

  return ratio <= FAR ? "far" : "way";
};

export const gradeColors: Record<Grade, string> = {
  far: "#ff9f43",
  hit: "#5ee08a",
  near: "#ffd84d",
  way: "#ff5d6c",
};

export const squares: Record<Grade, string> = {
  far: "🟧",
  hit: "🟩",
  near: "🟨",
  way: "🟥",
};

const decimalsFor = (value: number) => {
  if (value >= 100) {
    return 0;
  }

  return value >= 10 ? 1 : 2;
};

const tidy = (value: number) => Number(value.toFixed(decimalsFor(value)));

const english = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 2 });

const englishText = (grams: number) => {
  if (grams < 1000) {
    return `${english.format(tidy(grams))} g`;
  }

  if (grams < 1e6) {
    return `${english.format(tidy(grams / 1e3))} kg`;
  }

  if (grams < 1e12) {
    const tonnes = tidy(grams / 1e6);

    return `${english.format(tonnes)} ${tonnes === 1 ? "tonne" : "tonnes"}`;
  }

  return `${english.format(tidy(grams / 1e12))} million tonnes`;
};

const japaneseTonnes = (tonnes: number) => {
  const whole = Math.round(tonnes);
  const oku = Math.floor(whole / 1e8);
  const man = Math.floor((whole % 1e8) / 1e4);
  const rest = whole % 1e4;

  return [
    oku > 0 ? `${oku}億` : "",
    man > 0 ? `${man}万` : "",
    rest > 0 ? String(rest) : "",
  ].join("");
};

const japaneseText = (grams: number) => {
  if (grams < 1000) {
    return `${tidy(grams)}g`;
  }

  if (grams < 1e6) {
    return `${tidy(grams / 1e3)}kg`;
  }

  const tonnes = grams / 1e6;

  return `${tonnes < 1e4 ? tidy(tonnes) : japaneseTonnes(tonnes)}トン`;
};

const shownOf = (grams: number) => Number(grams.toPrecision(3));

export const isRounded = (grams: number) => shownOf(grams) !== grams;

export const weightText = (grams: number, lang: Lang) =>
  lang === "en" ? englishText(shownOf(grams)) : japaneseText(shownOf(grams));

export interface Bounds {
  low: number;
  high: number;
}

export const boundsOf = (guesses: readonly number[], actual: number) => {
  let low = 0;
  let high = STEPS;

  for (const step of guesses) {
    const grams = gramsAt(step);

    if (gradeOf(grams, actual) === "hit") {
      continue;
    }

    if (grams < actual) {
      low = Math.max(low, step + 1);
    } else {
      high = Math.min(high, step - 1);
    }
  }

  return { high, low };
};
