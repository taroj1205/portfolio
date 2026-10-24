import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { TOO_FAST, TOO_LATE, fakes, ladder, slowestOf } from "./duel";
import type { Fake } from "./duel";

const ends = ["clear", "slow", "early", ...fakes] as const;

export type End = (typeof ends)[number];

export interface Result {
  reach: number;
  best: number | null;
  average: number | null;
  end: End;
}

interface Rank {
  seal: readonly [string, string];
  name: Text;
  line: Text;
}

const ranks: readonly Rank[] = [
  {
    line: {
      en: "First, learn to draw the sword.",
      ja: "まずは、刀の抜き方から。",
    },
    name: { en: "Novice", ja: "素人" },
    seal: ["素", "人"],
  },
  {
    line: {
      en: "One down. The road is long.",
      ja: "ひとりは斬った。道はまだ長い。",
    },
    name: { en: "Pupil", ja: "門下生" },
    seal: ["門", "下"],
  },
  {
    line: {
      en: "Even a rōnin steps aside for you.",
      ja: "浪人も道をゆずる腕前。",
    },
    name: { en: "Swordsman", ja: "剣士" },
    seal: ["剣", "士"],
  },
  {
    line: {
      en: "Good enough to run the dojo.",
      ja: "道場をまかせられる腕前。",
    },
    name: { en: "Assistant master", ja: "師範代" },
    seal: ["師", "範"],
  },
  {
    line: {
      en: "One more. The sword saint is in sight.",
      ja: "あとひとり。剣聖の背中が見えた。",
    },
    name: { en: "Master swordsman", ja: "剣豪" },
    seal: ["剣", "豪"],
  },
  {
    line: {
      en: "You cut down the sword saint. The title is yours.",
      ja: "剣聖を斬った。今日からあなたが剣聖。",
    },
    name: { en: "Sword saint", ja: "剣聖" },
    seal: ["剣", "聖"],
  },
];

const foolLines: Record<Fake | "early", Text> = {
  cat: { en: "drew on a cat", ja: "猫に斬りかかった" },
  crow: { en: "drew on a crow", ja: "カラスに斬りかかった" },
  early: { en: "drew before the signal", ja: "合図の前に抜いてしまった" },
  leaf: { en: "cut down a falling leaf", ja: "落ち葉を斬った" },
  wind: { en: "cut the wind", ja: "風を斬った" },
};

export const rankOf = (reach: number) =>
  ranks[Math.max(0, Math.min(ranks.length - 1, reach))];

const foolOf = (end: End) =>
  end === "clear" || end === "slow" ? null : foolLines[end];

export const isEarly = (end: End) => foolOf(end) !== null;

export const lineOf = (result: Result, lang: Lang) => {
  const fool = foolOf(result.end);

  if (fool === null) {
    return rankOf(result.reach).line[lang];
  }

  const phrase = fool[lang];

  return lang === "en"
    ? `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`
    : `${phrase}。`;
};

export const formatMs = (ms: number) => `${ms}ms`;

export const reachText = (reach: number, lang: Lang) => {
  if (lang === "ja") {
    return reach === ladder.length ? "五人抜き" : `${reach}人抜き`;
  }

  return reach === ladder.length ? "All five" : `${reach} of ${ladder.length}`;
};

export const resultOf = (
  reach: number,
  reactions: readonly number[],
  end: End
): Result => ({
  average:
    reactions.length === 0
      ? null
      : Math.round(
          reactions.reduce((sum, each) => sum + each, 0) / reactions.length
        ),
  best: reactions.length === 0 ? null : Math.min(...reactions),
  end,
  reach,
});

const digits = (pattern: RegExp, min: number, max: number) =>
  z
    .string()
    .regex(pattern)
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const ms = digits(/^[1-9]\d{2,3}$/u, TOO_FAST, TOO_LATE);

const shared = z
  .object({
    a: ms.optional(),
    b: ms.optional(),
    e: z.enum(ends),
    r: digits(/^\d$/u, 0, ladder.length),
  })
  .refine(({ r, e }) => (r === ladder.length) === (e === "clear"))
  .refine(({ a, b }) => (a === undefined) === (b === undefined))
  .refine(({ a, b }) => a === undefined || b === undefined || a >= b)
  .refine(({ r, b }) => {
    const beaten = ladder[r - 1];

    return beaten === undefined || (b !== undefined && b < slowestOf(beaten));
  });

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);

  if (!parsed.success) {
    return null;
  }

  const { a, b, e, r } = parsed.data;

  return { average: a ?? null, best: b ?? null, end: e, reach: r };
};

export const challengeOf = (result: Result | null) =>
  result === null || result.best === null
    ? null
    : { best: result.best, reach: result.reach };

export type Challenge = NonNullable<ReturnType<typeof challengeOf>>;

export const queryOf = (result: Result) => {
  const query = new URLSearchParams({
    e: result.end,
    r: String(result.reach),
  });

  if (result.best !== null && result.average !== null) {
    query.set("b", String(result.best));
    query.set("a", String(result.average));
  }

  return query.toString();
};

const timesOf = (result: Result, lang: Lang) => {
  if (result.best === null || result.average === null) {
    return "";
  }

  const best = formatMs(result.best);
  const average = formatMs(result.average);

  return lang === "en"
    ? ` Fastest ${best}, average ${average}.`
    : `最速${best}、平均${average}。`;
};

const howEn = (result: Result) => {
  const rank = rankOf(result.reach).name.en;

  const beat =
    result.reach === ladder.length
      ? "beat all five"
      : `beat ${result.reach} of ${ladder.length}`;

  const fool = foolOf(result.end)?.en;

  if (fool === undefined) {
    return result.reach === 0
      ? `${rank}, cut down by the first opponent.`
      : `${rank}, ${beat}.`;
  }

  return result.reach === 0 ? `${fool}.` : `${beat}, then ${fool}.`;
};

const howJa = (result: Result) => {
  const rank = rankOf(result.reach).name.ja;
  const reach = reachText(result.reach, "ja");
  const fool = foolOf(result.end)?.ja;

  if (fool === undefined) {
    return result.reach === 0
      ? `ひとり目に斬られた（${rank}）。`
      : `${reach}（${rank}）。`;
  }

  return result.reach === 0 ? `、${fool}。` : `${reach}、そして${fool}。`;
};

const shareLine = (result: Result, lang: Lang) => {
  const times = timesOf(result, lang);

  if (lang === "en") {
    const dare =
      times === "" ? "Could you keep still?" : "Can you draw faster?";

    return `Sayabashiri, the quick-draw duel: ${howEn(result)}${times}\n${dare}`;
  }

  const dare =
    times === "" ? "あなたは、動かずにいられる？" : "この速さ、斬れる？";

  return `鞘走りで${howJa(result)}${times}\n${dare}`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);

  return {
    image: `${origin}/games/iai/og?${query.toString()}`,
    text: [
      shareLine(result, lang),
      lang === "en" ? "#鞘走り #Sayabashiri" : "#鞘走り",
    ].join("\n"),
    url: `${origin}/games/iai?${query.toString()}`,
  };
};
