import { z } from "zod";

import type { Lang } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { TOP } from "./bodies";
import { copy } from "./copy";
import { hashtags, scoreText, trailOf } from "./result";
import type { Save } from "./save";

const total = z.coerce.number().int().min(0).max(1_000_000_000);

const shared = z.object({
  b: total,
  c: z.coerce.number().int().min(0).max(999),
  g: total,
  m: total,
  r: z.coerce.number().int().min(1).max(1_000_000_000),
  t: z.coerce.number().int().min(0).max(TOP),
});

export const readCareer = (
  params: Record<string, string | string[] | undefined>
): Save | null => {
  const parsed = shared.safeParse(params);

  if (!parsed.success) {
    return null;
  }

  const { b, c, g, m, r, t } = parsed.data;

  return { best: b, chain: c, galaxies: g, merges: m, runs: r, top: t };
};

export const careerQuery = (career: Save) =>
  new URLSearchParams({
    b: String(career.best),
    c: String(career.chain),
    g: String(career.galaxies),
    m: String(career.merges),
    r: String(career.runs),
    t: String(career.top),
  }).toString();

export const careerShare = (
  career: Save,
  origin: string,
  lang: Lang
): Share => {
  const query = new URLSearchParams(careerQuery(career));
  query.set("l", lang);
  const best = scoreText(career.best, lang);

  return {
    image: `${origin}/games/hoshiai/og?${query.toString()}`,
    text: [
      lang === "en"
        ? `My Hoshiai stats: best ${best}`
        : `星合の戦績：最高${best}`,
      copy[lang].career.summary(career.runs, career.merges, career.chain),
      trailOf(career),
      hashtags(lang),
    ].join("\n"),
    url: `${origin}/games/hoshiai?${query.toString()}`,
  };
};
