import { z } from "zod";

import { codeOf, nameOf, stoneFrom } from "./cosmetics";
import type { Stone } from "./cosmetics";
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

const tiers: [number, string][] = [
  [10_000, "伝説"],
  [3000, "仙人"],
  [1000, "名人"],
  [300, "上手い"],
  [60, "いい感じ"],
  [0, "ちょん、ちょん"],
];

const notes: Record<Boost, (times: number) => string> = {
  duck: (k) => `カモ${k}羽を踏み台に🦆`,
  fish: () => "鯉に押し出された🐟",
  lotus: (k) => `蓮の葉で${k}回ポンッ`,
  rock: (k) => `岩で${k}回カーン`,
};

const rank: Boost[] = ["fish", "rock", "duck", "lotus"];

export const describe = (result: Result): Story => {
  const distance = formatDistance(result.distance).replace(" ", "");
  const tier = tiers.find(([least]) => result.distance >= least)?.[1];
  const divine = result.quality === 100;
  if (result.ending === "plop") {
    return {
      line: "水切りしたら1回も跳ねなかった",
      rarity: null,
      title: "ぽちゃん",
    };
  }
  const note =
    result.highlight === null
      ? ""
      : `（${notes[result.highlight](result.times)}）`;
  if (result.ending === "leaf") {
    return {
      line: `水切りで${result.skips}回跳ねて${distance}、最後もみじの上で止まった🍁${note}`,
      rarity: "激レア",
      title: "もみじの上で止まった",
    };
  }
  if (divine) {
    return {
      line: `神投げで${result.skips}回跳ねて${distance}飛んだ${note}`,
      rarity: "神投げ",
      title: tier ?? "ちょん、ちょん",
    };
  }
  return {
    line: `水切りで${result.skips}回跳ねて${distance}飛んだ${note}`,
    rarity: result.highlight === "fish" ? "幻の鯉" : null,
    title: tier ?? "ちょん、ちょん",
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

const queryOf = (result: Result) => {
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

export const postUrl = (result: Result, origin: string) =>
  `https://x.com/intent/tweet?${new URLSearchParams({
    text: [
      describe(result).line,
      result.stone === null ? null : `石：${nameOf(result.stone)}`,
      "#水切り",
    ]
      .filter((line) => line !== null)
      .join("\n"),
    url: `${origin}/games/mizukiri?${queryOf(result)}`,
  }).toString()}`;
