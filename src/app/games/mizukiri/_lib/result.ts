import { z } from "zod";

import { codeOf, nameOf, stoneFrom } from "./cosmetics";
import type { Stone } from "./cosmetics";
import type { Lang, Text } from "./i18n";
import { boosts, endings, skies } from "./simulate";
import type { Boost, Ending, Flight, Sky } from "./simulate";

export interface Result {
  skips: number;
  distance: number;
  ending: Ending;
  sky: Sky;
  highlight: Boost | null;
  times: number;
  quality: number;
  stone: Stone | null;
}

interface Story {
  title: string;
  rarity: string | null;
  line: string;
}

export const distanceParts = (meters: number): [string, string] => {
  if (meters < 1000) {
    return [meters.toFixed(1), "m"];
  }
  if (meters < 100_000) {
    return [(meters / 1000).toFixed(2), "km"];
  }
  return [Math.round(meters / 1000).toLocaleString("ja-JP"), "km"];
};

export const formatDistance = (meters: number) =>
  distanceParts(meters).join(" ");

const tiers: [number, Text][] = [
  [10_000, { en: "Legend", ja: "伝説" }],
  [3000, { en: "Sage", ja: "仙人" }],
  [1000, { en: "Master", ja: "名人" }],
  [300, { en: "Skilled", ja: "上手い" }],
  [60, { en: "Nice", ja: "いい感じ" }],
  [0, { en: "Skip, skip", ja: "ちょん、ちょん" }],
];

const count = (k: number, word: string) => `${k} ${word}${k === 1 ? "" : "s"}`;

const times = (k: number) => (k === 1 ? "once" : `${k} times`);

const notes: Record<Lang, Record<Boost, (times: number) => string>> = {
  en: {
    duck: (k) => `bounced off ${count(k, "duck")} 🦆`,
    fish: () => "pushed by a carp 🐟",
    lotus: (k) => count(k, "lily pad hop"),
    rock: (k) => count(k, "rock bounce"),
  },
  ja: {
    duck: (k) => `カモ${k}羽を踏み台に🦆`,
    fish: () => "鯉に押し出された🐟",
    lotus: (k) => `蓮の葉で${k}回ポンッ`,
    rock: (k) => `岩で${k}回カーン`,
  },
};

const rank: Boost[] = ["fish", "rock", "duck", "lotus"];

const lines: Record<
  Lang,
  {
    plop: Omit<Story, "rarity">;
    leaf: (skips: number, distance: string, note: string) => Story;
    flew: (skips: number, distance: string, note: string) => string;
    divine: (skips: number, distance: string, note: string) => string;
    rarity: { divine: string; carp: string };
  }
> = {
  en: {
    divine: (skips, distance, note) =>
      `Perfect throw: ${count(skips, "skip")}, ${distance}${note}`,
    flew: (skips, distance, note) =>
      `Skipped a stone ${times(skips)} for ${distance}${note}`,
    leaf: (skips, distance, note) => ({
      line: `Skipped ${times(skips)} for ${distance} and came to rest on a maple leaf 🍁${note}`,
      rarity: "Ultra rare",
      title: "Rested on a maple leaf",
    }),
    plop: { line: "Threw a stone and it never skipped", title: "Plop" },
    rarity: { carp: "Phantom carp", divine: "Perfect throw" },
  },
  ja: {
    divine: (skips, distance, note) =>
      `神投げで${skips}回跳ねて${distance}飛んだ${note}`,
    flew: (skips, distance, note) =>
      `水切りで${skips}回跳ねて${distance}飛んだ${note}`,
    leaf: (skips, distance, note) => ({
      line: `水切りで${skips}回跳ねて${distance}、最後もみじの上で止まった🍁${note}`,
      rarity: "激レア",
      title: "もみじの上で止まった",
    }),
    plop: { line: "水切りしたら1回も跳ねなかった", title: "ぽちゃん" },
    rarity: { carp: "幻の鯉", divine: "神投げ" },
  },
};

export const describe = (result: Result, lang: Lang): Story => {
  const copy = lines[lang];
  const distance = formatDistance(result.distance).replace(" ", "");
  const title = (tiers.find(([least]) => result.distance >= least)?.[1] ?? {
    en: "Skip, skip",
    ja: "ちょん、ちょん",
  })[lang];
  if (result.ending === "plop") {
    return { ...copy.plop, rarity: null };
  }
  const told =
    result.highlight === null
      ? ""
      : notes[lang][result.highlight](result.times);
  let note = "";
  if (told !== "") {
    note = lang === "en" ? ` (${told})` : `（${told}）`;
  }
  if (result.ending === "leaf") {
    return copy.leaf(result.skips, distance, note);
  }
  if (result.quality === 100) {
    return {
      line: copy.divine(result.skips, distance, note),
      rarity: copy.rarity.divine,
      title,
    };
  }
  return {
    line: copy.flew(result.skips, distance, note),
    rarity: result.highlight === "fish" ? copy.rarity.carp : null,
    title,
  };
};

export const resultOf = (flight: Flight, stone: Stone): Result => {
  const counts = new Map<Boost, number>();
  for (const bump of flight.splashes) {
    if (bump.event !== null && bump.event !== "wall") {
      counts.set(bump.event, (counts.get(bump.event) ?? 0) + 1);
    }
  }
  const highlight = rank.find((kind) => counts.has(kind)) ?? null;
  return {
    distance: Math.round(flight.distance * 10) / 10,
    ending: flight.ending ?? "sink",
    highlight,
    quality: flight.quality,
    skips: flight.skips,
    sky: flight.river.sky,
    stone: { color: stone.color, form: stone.form },
    times: highlight === null ? 0 : (counts.get(highlight) ?? 0),
  };
};

const shared = z.object({
  b: z.string().max(40).optional(),
  e: z.enum(endings),
  h: z.enum(boosts).optional(),
  k: z.coerce.number().int().min(0).max(100_000).optional(),
  m: z.coerce.number().min(0).max(100_000_000),
  n: z.coerce.number().int().min(0).max(1_000_000),
  q: z.coerce.number().int().min(0).max(100).optional(),
  s: z.enum(skies),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const { b, e, h, k, m, n, q, s } = parsed.data;
  return {
    distance: m,
    ending: e,
    highlight: h ?? null,
    quality: q ?? 0,
    skips: n,
    sky: s,
    stone: b === undefined ? null : stoneFrom(b),
    times: h === undefined ? 0 : (k ?? 1),
  };
};

export const queryOf = (result: Result) => {
  const query = new URLSearchParams({
    e: result.ending,
    m: result.distance.toFixed(1),
    n: String(result.skips),
    q: String(result.quality),
    s: result.sky,
  });
  if (result.stone !== null) {
    query.set("b", codeOf(result.stone));
  }
  if (result.highlight !== null) {
    query.set("h", result.highlight);
    query.set("k", String(result.times));
  }
  return query.toString();
};

export const shareOf = (result: Result, origin: string, lang: Lang) => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  const stone =
    result.stone === null
      ? null
      : `${lang === "en" ? "Stone: " : "石："}${nameOf(result.stone, lang)}`;
  return {
    text: [
      describe(result, lang).line,
      stone,
      lang === "en" ? "#水切り #mizukiri" : "#水切り",
    ]
      .filter((line) => line !== null)
      .join("\n"),
    url: `${origin}/games/mizukiri?${query.toString()}`,
  };
};

export const postUrl = (result: Result, origin: string, lang: Lang) =>
  `https://x.com/intent/tweet?${new URLSearchParams(
    shareOf(result, origin, lang)
  ).toString()}`;
