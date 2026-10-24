import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { pack, unpack } from "./stroke";
import type { Trace } from "./stroke";

export interface Result {
  score: number;
  trace: Trace[];
}

interface Rank {
  min: number;
  seal: readonly [string, string];
  name: Text;
  line: Text;
}

const beginner: Rank = {
  line: { en: "This, too, is an ensō.", ja: "これもまた、円相。" },
  min: 0,
  name: { en: "Beginner", ja: "入門" },
  seal: ["入", "門"],
};

const ranks: readonly Rank[] = [
  {
    line: { en: "Did you use a compass?", ja: "コンパス、使った？" },
    min: 99,
    name: { en: "Divine", ja: "神品" },
    seal: ["神", "品"],
  },
  {
    line: { en: "A Zen monk would look twice.", ja: "禅僧も二度見する円。" },
    min: 97,
    name: { en: "Master", ja: "名人" },
    seal: ["名", "人"],
  },
  {
    line: { en: "Ready to take students.", ja: "弟子をとれる腕前。" },
    min: 94,
    name: { en: "Sensei", ja: "師範" },
    seal: ["師", "範"],
  },
  {
    line: {
      en: "A real circle. Be proud of it.",
      ja: "胸を張れる、ちゃんとした円。",
    },
    min: 90,
    name: { en: "First dan", ja: "初段" },
    seal: ["初", "段"],
  },
  {
    line: { en: "Almost perfectly round.", ja: "あと少しで、まんまる。" },
    min: 80,
    name: { en: "First kyu", ja: "一級" },
    seal: ["一", "級"],
  },
  {
    line: {
      en: "The spirit of a circle is there.",
      ja: "円の気持ちは、伝わってる。",
    },
    min: 60,
    name: { en: "Apprentice", ja: "見習い" },
    seal: ["見", "習"],
  },
  beginner,
];

export const rankOf = (score: number) =>
  ranks.find((rank) => score >= rank.min) ?? beginner;

export const nextRank = (score: number) =>
  ranks.findLast((rank) => rank.min > score) ?? null;

export const formatScore = (score: number) => `${score.toFixed(1)}%`;

const shared = z.object({
  d: z.string().transform((text, context) => {
    const trace = unpack(text);

    if (trace === null) {
      context.addIssue({ code: "custom", message: "Unreadable stroke" });

      return z.NEVER;
    }

    return trace;
  }),
  s: z.coerce.number().int().min(0).max(1000),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);

  return parsed.success
    ? { score: parsed.data.s / 10, trace: parsed.data.d }
    : null;
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    d: pack(result.trace),
    s: String(Math.round(result.score * 10)),
  }).toString();

const lineOf = (result: Result, lang: Lang) => {
  const score = formatScore(result.score);
  const rank = rankOf(result.score).name[lang];

  return lang === "en"
    ? `I drew a ${score} circle in one stroke on One-Brush Moon (${rank}).\nCan you draw a rounder one?`
    : `ひと筆の月で、${score}の円を描いた（${rank}）\nこれより丸く描ける？`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);

  return {
    image: `${origin}/games/enso/og?${query.toString()}`,
    text: [
      lineOf(result, lang),
      lang === "en" ? "#ひと筆の月 #OneBrushMoon" : "#ひと筆の月",
    ].join("\n"),
    url: `${origin}/games/enso?${query.toString()}`,
  };
};
