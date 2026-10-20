import { z } from "zod";

import type { Lang } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { GALAXY, TOP, bodies, kindOf } from "./bodies";
import { copy } from "./copy";
import type { World } from "./world";

export interface Result {
  score: number;
  top: number;
  chain: number;
  merges: number;
  galaxies: number;
}

export const resultOf = (world: World): Result => ({
  chain: world.chain,
  galaxies: world.galaxies,
  merges: world.merges,
  score: world.score,
  top: Math.max(0, world.top),
});

export const formatScore = (score: number, lang: Lang) =>
  score.toLocaleString(copy[lang].locale);

export const scoreText = (score: number, lang: Lang) =>
  lang === "en"
    ? `${formatScore(score, "en")} pts`
    : `${formatScore(score, "ja")}点`;

export const titleOf = (result: Result, lang: Lang) => {
  if (result.galaxies > 0) {
    return lang === "en" ? "Made the Milky Way" : "天の川をつくった";
  }
  const { name } = kindOf(result.top);
  return lang === "en" ? `Up to ${name.en}` : `${name.ja}まで`;
};

export const trailOf = (result: Result) =>
  bodies
    .map((kind, tier) => (tier <= result.top ? kind.emoji : "▫️"))
    .join("") + (result.galaxies > 0 ? "🌌" : "");

const shared = z.object({
  c: z.coerce.number().int().min(0).max(999).default(0),
  g: z.coerce.number().int().min(0).max(999).default(0),
  m: z.coerce.number().int().min(0).max(100_000).default(0),
  p: z.coerce.number().int().min(0).max(100_000_000),
  t: z.coerce.number().int().min(0).max(TOP),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const { c, g, m, p, t } = parsed.data;
  return { chain: c, galaxies: g, merges: m, score: p, top: t };
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    c: String(result.chain),
    g: String(result.galaxies),
    m: String(result.merges),
    p: String(result.score),
    t: String(result.top),
  }).toString();

const lineOf = (result: Result, lang: Lang) => {
  const score = scoreText(result.score, lang);
  if (lang === "en") {
    const reached =
      result.galaxies > 0
        ? `made the ${GALAXY.en}`
        : `merged up to ${kindOf(result.top).name.en}`;
    return `I ${reached} in Hoshiai: ${score}`;
  }
  const reached =
    result.galaxies > 0
      ? `${GALAXY.ja}をつくった`
      : `${kindOf(result.top).name.ja}までつくった`;
  return `星合で${reached}！ ${score}`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/hoshiai/og?${query.toString()}`,
    text: [
      lineOf(result, lang),
      trailOf(result),
      lang === "en" ? "#星合 #Hoshiai" : "#星合",
    ].join("\n"),
    url: `${origin}/games/hoshiai?${query.toString()}`,
  };
};
