import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import { codeOf, designFrom } from "./eraser";
import type { Design } from "./eraser";
import { ALL, PERFECT, framesOf, isValidGame, scoreOf } from "./score";

export interface Result {
  rolls: number[];
  design: Design;
}

export interface Rank {
  level: number;
  name: Text;
  line: Text;
}

const lowest: Rank & { from: number } = {
  from: 0,
  level: 1,
  line: {
    en: "Sweep the crumbs and go again.",
    ja: "消しカスを払って、もう一回。",
  },
  name: { en: "Eraser crumbs", ja: "消しカス" },
};

const ranks: readonly (Rank & { from: number })[] = [
  {
    from: PERFECT,
    level: 7,
    line: {
      en: "Twelve strikes. Not one wasted flick.",
      ja: "12投ぜんぶストライク。",
    },
    name: { en: "Perfect game", ja: "パーフェクト" },
  },
  {
    from: 250,
    level: 6,
    line: {
      en: "They'll talk about this after school for years.",
      ja: "放課後の伝説になる。",
    },
    name: { en: "Legend", ja: "伝説" },
  },
  {
    from: 200,
    level: 5,
    line: {
      en: "Nobody in the school throws better.",
      ja: "学校でいちばんうまい。",
    },
    name: { en: "School champion", ja: "学校チャンピオン" },
  },
  {
    from: 160,
    level: 4,
    line: {
      en: "The whole class is watching now.",
      ja: "クラスのみんなが見てる。",
    },
    name: { en: "Class hero", ja: "クラスの英雄" },
  },
  {
    from: 120,
    level: 3,
    line: { en: "Steady flicks, honest pinfall.", ja: "安定してきた。" },
    name: { en: "Regular", ja: "常連" },
  },
  {
    from: 80,
    level: 2,
    line: {
      en: "Getting the feel of the desk.",
      ja: "机のクセがわかってきた。",
    },
    name: { en: "Rookie", ja: "見習い" },
  },
  lowest,
];

export const rankOf = (score: number): Rank =>
  ranks.find((rank) => score >= rank.from) ?? lowest;

export const nextRankOf = (score: number) => {
  const next = ranks.findLast((rank) => rank.from > score);
  return next === undefined ? null : { gap: next.from - score, rank: next };
};

const encodeRolls = (rolls: readonly number[]) =>
  rolls.map((pins) => (pins === ALL ? "x" : String(pins))).join("");

const decodeRolls = (text: string) =>
  Array.from(text, (char) => (char === "x" ? ALL : Number(char)));

const shared = z.object({
  e: z.string().regex(/^\d{5}$/u),
  r: z.string().regex(/^[\dx]{11,21}$/u),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const rolls = decodeRolls(parsed.data.r);
  const design = designFrom(parsed.data.e);
  return design !== null && isValidGame(rolls) ? { design, rolls } : null;
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    e: codeOf(result.design),
    r: encodeRolls(result.rolls),
  }).toString();

export const pointsText = (score: number, lang: Lang) =>
  lang === "en" ? `${score}` : `${score}点`;

const sheetLine = (rolls: readonly number[]) =>
  framesOf(rolls)
    .map((frame) => frame.marks.join(""))
    .join(" ");

const lineOf = (result: Result, lang: Lang) => {
  const score = scoreOf(result.rolls);
  const rank = rankOf(score).name[lang];
  const sheet = sheetLine(result.rolls);
  if (lang === "en") {
    return `Keshibo, eraser bowling\n${score} · ${rank}\n${sheet}\n${copy.en.challenge.dare(score)}`;
  }
  return `消しボウ\n${score}点 · ${rank}\n${sheet}\n${copy.ja.challenge.dare(score)}`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/keshibo/og?${query.toString()}`,
    text: [
      lineOf(result, lang),
      lang === "en" ? "#消しボウ #Keshibo" : "#消しボウ",
    ].join("\n"),
    url: `${origin}/games/keshibo?${query.toString()}`,
  };
};
