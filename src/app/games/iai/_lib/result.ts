import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import { TOO_FAST, TOO_LATE, beatenBy, fakes, tiers } from "./duel";
import type { Call, Fake } from "./duel";

const misses = ["slow", "early", ...fakes] as const;

type Miss = (typeof misses)[number];

export type Result =
  | { miss: null; reaction: number }
  | { miss: Miss; reaction: null };

interface Rank {
  seal: readonly [string, string];
  name: Text;
  line: Text;
}

const ranks: readonly Rank[] = [
  {
    line: {
      en: "The foot soldier cuts you down. First, learn to draw the sword.",
      ja: "足軽に斬られた。まずは刀の抜き方から。",
    },
    name: { en: "Novice", ja: "素人" },
    seal: ["素", "人"],
  },
  {
    line: {
      en: "The foot soldier falls. The road is long.",
      ja: "足軽を斬った。道はまだ長い。",
    },
    name: { en: "Pupil", ja: "門下生" },
    seal: ["門", "下"],
  },
  {
    line: {
      en: "The rōnin falls. Even a rōnin steps aside for you.",
      ja: "浪人を斬った。浪人も道をゆずる腕前。",
    },
    name: { en: "Swordsman", ja: "剣士" },
    seal: ["剣", "士"],
  },
  {
    line: {
      en: "The dojo master falls. Good enough to run the dojo.",
      ja: "道場主を斬った。道場をまかせられる腕前。",
    },
    name: { en: "Assistant master", ja: "師範代" },
    seal: ["師", "範"],
  },
  {
    line: {
      en: "The hitokiri falls. The sword saint is in sight.",
      ja: "人斬りを斬った。剣聖の背中が見えた。",
    },
    name: { en: "Master swordsman", ja: "剣豪" },
    seal: ["剣", "豪"],
  },
  {
    line: {
      en: "The sword saint falls. The title is yours.",
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

export const rankOf = (reaction: number | null) => ranks[beatenBy(reaction)];

export const nextOf = (reaction: number) => {
  const beaten = beatenBy(reaction);
  return beaten === tiers.length
    ? null
    : { gap: reaction - tiers[beaten] + 1, tier: beaten };
};

const foolOf = (result: Result) =>
  result.miss === null || result.miss === "slow"
    ? null
    : foolLines[result.miss];

export const isFooled = (result: Result) => foolOf(result) !== null;

export const lineOf = (result: Result, lang: Lang) => {
  const fool = foolOf(result);
  if (fool === null) {
    return rankOf(result.reaction).line[lang];
  }
  const phrase = fool[lang];
  return lang === "en"
    ? `${phrase.charAt(0).toUpperCase()}${phrase.slice(1)}.`
    : `${phrase}。`;
};

export const formatMs = (ms: number) => `${ms}ms`;

export const headlineOf = (result: Result, lang: Lang) => {
  if (result.reaction !== null) {
    return formatMs(result.reaction);
  }
  const words = copy[lang].verdict;
  return result.miss === "slow" ? words.lost : words.early;
};

export const resultOf = (call: Call, reaction: number | null): Result => {
  if (call.kind === "early") {
    return { miss: call.fake ?? "early", reaction: null };
  }
  return reaction === null
    ? { miss: "slow", reaction: null }
    : { miss: null, reaction };
};

const digits = (pattern: RegExp, min: number, max: number) =>
  z
    .string()
    .regex(pattern)
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const ms = digits(/^[1-9]\d{2,3}$/u, TOO_FAST, TOO_LATE);

const current = z.object({ e: z.enum(misses).optional(), t: ms.optional() });

const legacy = z
  .object({
    a: ms.optional(),
    b: ms.optional(),
    e: z.enum(["clear", ...misses]),
    r: digits(/^\d$/u, 0, tiers.length),
  })
  .refine(({ r, e }) => (r === tiers.length) === (e === "clear"))
  .refine(({ a, b }) => (a === undefined) === (b === undefined))
  .refine(({ a, b }) => a === undefined || b === undefined || a >= b);

const fromCurrent = ({ e, t }: z.infer<typeof current>): Result | null => {
  if (t !== undefined && e === undefined) {
    return { miss: null, reaction: t };
  }
  if (t === undefined && e !== undefined) {
    return { miss: e, reaction: null };
  }
  return null;
};

const fromLegacy = ({ b, e }: z.infer<typeof legacy>): Result | null => {
  if (b !== undefined) {
    return { miss: null, reaction: b };
  }
  return e === "clear" ? null : { miss: e, reaction: null };
};

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  if (params.r !== undefined) {
    const parsed = legacy.safeParse(params);
    return parsed.success ? fromLegacy(parsed.data) : null;
  }
  const parsed = current.safeParse(params);
  return parsed.success ? fromCurrent(parsed.data) : null;
};

export const challengeOf = (result: Result | null) =>
  result === null || result.reaction === null
    ? null
    : { best: result.reaction };

export type Challenge = NonNullable<ReturnType<typeof challengeOf>>;

export const queryOf = (result: Result) =>
  new URLSearchParams(
    result.reaction === null
      ? { e: result.miss }
      : { t: String(result.reaction) }
  ).toString();

const shareLine = (result: Result, lang: Lang) => {
  const line = lineOf(result, lang);
  const time = result.reaction === null ? null : formatMs(result.reaction);
  const fooled = isFooled(result);
  if (lang === "en") {
    const dare = fooled ? "Could you keep still?" : "Can you draw faster?";
    const said = time === null ? line : `${time}. ${line}`;
    return `Iai, the quick-draw duel: ${said}\n${dare}`;
  }
  const dare = fooled ? "あなたは、動かずにいられる？" : "この速さ、斬れる？";
  const said = time === null ? `、${line}` : `${time}。${line}`;
  return `居合で${said}\n${dare}`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/iai/og?${query.toString()}`,
    text: [
      shareLine(result, lang),
      lang === "en" ? "#居合 #Iai" : "#居合",
    ].join("\n"),
    url: `${origin}/games/iai?${query.toString()}`,
  };
};
