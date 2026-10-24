import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import { icons, kindIds, kinds, rankOfTier } from "./fish";
import type { KindId } from "./fish";
import { MOST } from "./tank";

export const PERFECT = 6;
const CELLS = 10;
const SHELF = 8;

type Catches = Record<KindId, number>;

export interface Result {
  catches: Catches;
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
    line: { en: "The paper gave way.", ja: "ポイが、すぐ破れた。" },
    name: { en: "Torn", ja: "破れた" },
  },
  {
    least: 1,
    level: 1,
    line: { en: "One to take home.", ja: "まずは、一匹。" },
    name: { en: "One to keep", ja: "一匹" },
  },
  {
    least: 3,
    level: 2,
    line: {
      en: "Now it feels like a festival.",
      ja: "お祭りらしくなってきた。",
    },
    name: { en: "Festival fun", ja: "お祭り気分" },
  },
  {
    least: 6,
    level: 3,
    line: { en: "The kids are watching.", ja: "子どもたちが見てる。" },
    name: { en: "Good hands", ja: "いい腕" },
  },
  {
    least: 10,
    level: 4,
    line: { en: "Light on the paper.", ja: "紙に、負担をかけない。" },
    name: { en: "Scoop master", ja: "すくい名人" },
  },
  {
    least: 15,
    level: 5,
    line: {
      en: "The stall owner is sweating.",
      ja: "屋台のおじさんが、困ってる。",
    },
    name: { en: "Stall's nightmare", ja: "屋台泣かせ" },
  },
  {
    least: 22,
    level: PERFECT,
    line: {
      en: "They'll tell this one at next year's festival.",
      ja: "来年の祭りまで、語りぐさ。",
    },
    name: { en: "Legend", ja: "伝説" },
  },
];

const emptyCatches = (): Catches => ({
  demekin: 0,
  nushi: 0,
  ogon: 0,
  ryukin: 0,
  sarasa: 0,
  shubunkin: 0,
  wakin: 0,
});

export const resultOf = (caught: readonly KindId[]): Result => {
  const catches = emptyCatches();

  for (const kind of caught) {
    catches[kind] += 1;
  }

  return { catches };
};

export const countOf = (result: Result) =>
  kindIds.reduce((sum, id) => sum + result.catches[id], 0);

export const rankOf = (count: number): Rank =>
  ranks.findLast((rank) => count >= rank.least) ?? ranks[0];

export const nextOf = (count: number) => {
  const next = ranks[rankOf(count).level + 1];

  return next === undefined ? null : { more: next.least - count, rank: next };
};

const byRarity = kindIds.toSorted(
  (a, b) => rankOfTier(kinds[a].tier) - rankOfTier(kinds[b].tier)
);

export const rarestOf = (result: Result): KindId | null =>
  byRarity.find((id) => result.catches[id] > 0) ?? null;

export const shelfOf = (result: Result, limit = SHELF) =>
  byRarity
    .flatMap((id) =>
      Array.from(
        { length: Math.min(limit, result.catches[id]) },
        (): KindId => id
      )
    )
    .slice(0, limit);

export const barOf = (result: Result) => {
  const count = countOf(result);

  if (count === 0) {
    return "💧";
  }

  const shown = shelfOf(result, CELLS)
    .map((id) => icons[kinds[id].tier])
    .join("");

  return count > CELLS ? `${shown}+${count - CELLS}` : shown;
};

const pattern = new RegExp(
  `^(?:0|[1-9]\\d{0,2})(?:\\.(?:0|[1-9]\\d{0,2})){${kindIds.length - 1}}$`,
  "u"
);

const shared = z.object({
  f: z
    .string()
    .regex(pattern)
    .transform((text) => text.split(".").map(Number))
    .refine((counts) => counts.reduce((sum, k) => sum + k, 0) <= MOST),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);

  if (!parsed.success) {
    return null;
  }

  const catches = emptyCatches();

  for (const [i, id] of kindIds.entries()) {
    catches[id] = parsed.data.f[i] ?? 0;
  }

  return { catches };
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    f: kindIds.map((id) => result.catches[id]).join("."),
  }).toString();

export const countText = (count: number, lang: Lang) =>
  lang === "en" ? `${count} fish` : `${count}匹`;

export const bragOf = (kind: KindId, lang: Lang) => {
  const { name, tier } = kinds[kind];

  if (lang === "ja") {
    return `${name.ja}も、すくった`;
  }

  return tier === "legend"
    ? "Even landed the old boss of the tank"
    : `Even got a ${name.en.toLowerCase()}`;
};

const lineOf = (result: Result, lang: Lang) => {
  const count = countOf(result);
  const rank = rankOf(count).name[lang];
  const rarest = rarestOf(result);

  const special =
    rarest !== null && kinds[rarest].tier !== "common"
      ? [`${bragOf(rarest, lang)} ${icons[kinds[rarest].tier]}`]
      : [];

  if (lang === "en") {
    const how =
      count === 0
        ? "Tore my poi without catching a single fish"
        : `Scooped ${countText(count, lang)} with one poi`;

    return [
      copy.en.name,
      `${how} · ${rank}`,
      barOf(result),
      ...special,
      count === 0 ? "Can you catch one?" : "Can you scoop more?",
    ].join("\n");
  }

  const how =
    count === 0
      ? "1匹もすくえずに破れた"
      : `ポイ一枚で${countText(count, lang)}すくった`;

  return [
    copy.ja.name,
    `${how} · ${rank}`,
    barOf(result),
    ...special,
    count === 0 ? "1匹でもすくえる？" : "これより多くすくえる？",
  ].join("\n");
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);

  return {
    image: `${origin}/games/kingyo/og?${query.toString()}`,
    text: [
      lineOf(result, lang),
      lang === "en" ? `#${copy.ja.name} #OnePoiLegend` : `#${copy.ja.name}`,
    ].join("\n"),
    url: `${origin}/games/kingyo?${query.toString()}`,
  };
};
