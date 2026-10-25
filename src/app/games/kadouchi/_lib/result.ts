import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import { TOTAL, kinds, prizeIds, scoreOf } from "./prizes";
import type { PrizeId } from "./prizes";

export const PERFECT = 5;
const ALL = 2 ** prizeIds.length - 1;

export interface Result {
  got: readonly PrizeId[];
}

export interface Rank {
  level: number;
  least: number;
  name: Text;
  line: Text;
}

const ranks: readonly Rank[] = [
  {
    least: 0,
    level: 0,
    line: { en: "Only the corks flew.", ja: "コルクだけ飛んでいった。" },
    name: { en: "Empty-handed", ja: "スカ" },
  },
  {
    least: 10,
    level: 1,
    line: { en: "A sweet for the walk home.", ja: "帰り道のおやつができた。" },
    name: { en: "A little something", ja: "おまけ" },
  },
  {
    least: 50,
    level: 2,
    line: { en: "Both hands full.", ja: "両手がふさがる。" },
    name: { en: "Small win", ja: "小当たり" },
  },
  {
    least: 100,
    level: 3,
    line: { en: "The stall keeper winces.", ja: "屋台のおじさんが渋い顔。" },
    name: { en: "Good haul", ja: "中当たり" },
  },
  {
    least: 200,
    level: 4,
    line: { en: "You're carrying a big one home.", ja: "大物をかついで帰る。" },
    name: { en: "Big win", ja: "大当たり" },
  },
  {
    least: TOTAL,
    level: PERFECT,
    line: { en: "The shelves are bare.", ja: "棚がからっぽになった。" },
    name: { en: "Cleaned out", ja: "総取り" },
  },
];

export const rankOf = (score: number): Rank =>
  ranks.findLast((rank) => score >= rank.least) ?? ranks[0];

export const nextOf = (score: number) => {
  const next = ranks[rankOf(score).level + 1];

  return next === undefined ? null : { more: next.least - score, rank: next };
};

export const resultOf = (got: readonly PrizeId[]): Result => ({
  got: prizeIds.filter((id) => got.includes(id)),
});

export const pointsText = (score: number, lang: Lang) =>
  lang === "ja" ? `${score}点` : `${score} pts`;

export const iconsOf = (result: Result) =>
  result.got.length === 0
    ? "💨"
    : result.got.map((id) => kinds[id].icon).join("");

const maskOf = (got: readonly PrizeId[]) => {
  let mask = 0;

  for (const [i, id] of prizeIds.entries()) {
    mask += got.includes(id) ? 2 ** i : 0;
  }

  return mask;
};

const shared = z.object({
  p: z
    .string()
    .regex(/^(?:0|[1-9]\d{0,2})$/u)
    .transform(Number)
    .refine((mask) => mask <= ALL),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);

  if (!parsed.success) {
    return null;
  }

  const mask = parsed.data.p;

  return {
    got: prizeIds.filter((_, i) => Math.floor(mask / 2 ** i) % 2 === 1),
  };
};

export const queryOf = (result: Result) =>
  new URLSearchParams({ p: String(maskOf(result.got)) }).toString();

const rankName = (result: Result, lang: Lang) =>
  rankOf(scoreOf(result.got)).name[lang];

export const titleOf = (result: Result, lang: Lang) =>
  `${pointsText(scoreOf(result.got), lang)} · ${rankName(result, lang)}`;

const howOf = (result: Result, lang: Lang) => {
  const count = result.got.length;
  const points = pointsText(scoreOf(result.got), lang);

  if (lang === "en") {
    return count === 0 ? "Nothing fell" : `Knocked down ${count} for ${points}`;
  }

  return count === 0 ? "ひとつも倒れなかった" : `${count}個倒して${points}`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  const words = copy[lang];

  return {
    image: `${origin}/games/kadouchi/og?${query.toString()}`,
    text: [
      words.name,
      `${howOf(result, lang)} · ${rankName(result, lang)}`,
      iconsOf(result),
      words.challenge.dare,
      lang === "en" ? `#${copy.ja.name} #KadouchiCork` : `#${copy.ja.name}`,
    ].join("\n"),
    url: `${origin}/games/kadouchi?${query.toString()}`,
  };
};
