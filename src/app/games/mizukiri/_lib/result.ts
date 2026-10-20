import { z } from "zod";

import { endings, skies } from "./simulate";
import type { Ending, River, Sky, Throw } from "./simulate";

export interface Result {
  skips: number;
  distance: number;
  ending: Ending;
  sky: Sky;
}

interface Story {
  title: string;
  rarity: string | null;
  line: string;
}

const tiers: [number, string][] = [
  [25, "伝説"],
  [17, "名人"],
  [10, "上手い"],
  [5, "いい感じ"],
  [1, "ちょん、ちょん"],
];

const stories: Record<Ending, (skips: number, distance: string) => Story> = {
  bank: (n) => ({
    line: `${n}回跳ねて、向こう岸まで届いた`,
    rarity: "激レア",
    title: "向こう岸まで届いた",
  }),
  duck: (n) => ({
    line: `${n}回跳ねて、最後カモに当たった🦆`,
    rarity: "レア",
    title: "カモに当たった",
  }),
  fish: (n) => ({
    line: `${n}回跳ねたら、魚に食べられた🐟`,
    rarity: "幻",
    title: "魚に食べられた",
  }),
  leaf: (n) => ({
    line: `${n}回跳ねて、もみじの上で止まった🍁`,
    rarity: "激レア",
    title: "もみじの上で止まった",
  }),
  plop: () => ({
    line: "水切りしたら1回も跳ねなかった",
    rarity: null,
    title: "ぽちゃん",
  }),
  rock: (n) => ({
    line: `${n}回跳ねて、岩にカーンって当たった`,
    rarity: "レア",
    title: "岩にカーン",
  }),
  sink: (n, m) => ({
    line: `水切り ${n}回跳ねた（${m}m）`,
    rarity: null,
    title: tiers.find(([least]) => n >= least)?.[1] ?? "ぽちゃん",
  }),
};

export const describe = (result: Result) =>
  stories[result.ending](result.skips, result.distance.toFixed(1));

export const resultOf = (shot: Throw, river: River): Result => ({
  distance: Math.round(shot.distance * 10) / 10,
  ending: shot.ending,
  skips: shot.skips,
  sky: river.sky,
});

const shared = z.object({
  e: z.enum(endings),
  m: z.coerce.number().min(0).max(99),
  n: z.coerce.number().int().min(0).max(99),
  s: z.enum(skies),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const { e, m, n, s } = parsed.data;
  return { distance: m, ending: e, skips: n, sky: s };
};

const queryOf = (result: Result) =>
  new URLSearchParams({
    e: result.ending,
    m: result.distance.toFixed(1),
    n: String(result.skips),
    s: result.sky,
  }).toString();

export const postUrl = (result: Result, origin: string) =>
  `https://x.com/intent/tweet?${new URLSearchParams({
    text: `${describe(result).line}\n#水切り`,
    url: `${origin}/games/mizukiri?${queryOf(result)}`,
  }).toString()}`;
