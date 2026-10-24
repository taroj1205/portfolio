import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { SAFE } from "./carve";
import { mouldIds, moulds } from "./moulds";
import type { MouldId } from "./moulds";

export const LONGEST = 36_000;
export const PERFECT = 6;
const CELLS = 10;

export interface Result {
  mould: MouldId;
  carved: number;
  time: number | null;
}

export interface Rank {
  level: number;
  name: Text;
  line: Text;
}

interface Band extends Rank {
  pace?: number;
  carved?: number;
}

const shattered: Band = {
  carved: 0,
  level: 0,
  line: {
    en: "Back to the stall for another.",
    ja: "もう一枚、買ってこよう。",
  },
  name: { en: "Shattered", ja: "粉々" },
};

const bands: readonly Band[] = [
  {
    level: 6,
    line: { en: "Not one wasted scratch.", ja: "ひと筋の迷いもない。" },
    name: { en: "Divine", ja: "神業" },
    pace: 1,
  },
  {
    level: 5,
    line: {
      en: "The stall owner is worried.",
      ja: "屋台のおじさんも青ざめる。",
    },
    name: { en: "Master", ja: "名人" },
    pace: 1.35,
  },
  {
    level: 4,
    line: { en: "Steady hands.", ja: "手元がぶれない。" },
    name: { en: "Craftsman", ja: "職人" },
    pace: 2,
  },
  {
    level: 3,
    line: { en: "It came out in one piece.", ja: "割らずに、抜けた。" },
    name: { en: "Cut out", ja: "抜けた" },
    pace: Infinity,
  },
  {
    carved: 80,
    level: 2,
    line: { en: "So close it hurts.", ja: "あと少しだった。" },
    name: { en: "So close", ja: "惜しい" },
  },
  {
    carved: 40,
    level: 1,
    line: { en: "A crack ran right through it.", ja: "ひびが、走った。" },
    name: { en: "Cracked", ja: "ひび割れ" },
  },
  shattered,
];

export const parOf = (mould: MouldId) => moulds[mould].length / SAFE;

const paceOf = (result: Result) =>
  result.time === null ? Infinity : result.time / 10 / parOf(result.mould);

const fits = (band: Band, result: Result) =>
  band.pace === undefined
    ? result.time === null && result.carved >= (band.carved ?? 0)
    : result.time !== null && paceOf(result) <= band.pace;

export const rankOf = (result: Result): Rank =>
  bands.find((band) => fits(band, result)) ?? shattered;

export const nextOf = (result: Result) => {
  const { level } = rankOf(result);
  const next = bands.find((band) => band.level === level + 1);

  if (next === undefined) {
    return null;
  }

  if (next.pace !== undefined && result.time !== null) {
    const goal = Math.floor(next.pace * parOf(result.mould) * 10);

    return { carved: null, rank: next, time: result.time - goal };
  }

  return {
    carved: (next.carved ?? 100) - result.carved,
    rank: next,
    time: null,
  };
};

export const formatTime = (time: number) => (time / 10).toFixed(1);

const secondsText = (time: number, lang: Lang) =>
  lang === "en" ? `${formatTime(time)}s` : `${formatTime(time)}秒`;

export const barOf = (result: Result) => {
  if (result.time !== null) {
    const { emoji } = moulds[result.mould];

    return `${"🟧".repeat(CELLS)}${emoji}${rankOf(result).level === PERFECT ? "✨" : ""}`;
  }

  const done = Math.min(CELLS - 1, Math.floor(result.carved / CELLS));

  return `${"🟧".repeat(done)}💥${"⬜".repeat(CELLS - 1 - done)}`;
};

const whole = (pattern: RegExp, min: number, max: number) =>
  z
    .string()
    .regex(pattern)
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const shared = z
  .object({
    c: whole(/^(?:0|[1-9]\d?)$/u, 0, 99).optional(),
    m: z.enum(mouldIds),
    t: whole(/^[1-9]\d{0,4}$/u, 1, LONGEST).optional(),
  })
  .refine(({ c, t }) => (c === undefined) !== (t === undefined));

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);

  if (!parsed.success) {
    return null;
  }

  const { c, m, t } = parsed.data;

  return t === undefined
    ? { carved: c ?? 0, mould: m, time: null }
    : { carved: 100, mould: m, time: t };
};

export const queryOf = (result: Result) => {
  const query = new URLSearchParams({ m: result.mould });

  if (result.time === null) {
    query.set("c", String(result.carved));
  } else {
    query.set("t", String(result.time));
  }

  return query.toString();
};

export const headlineOf = (result: Result, lang: Lang) =>
  result.time === null ? `${result.carved}%` : secondsText(result.time, lang);

const lineOf = (result: Result, lang: Lang) => {
  const mould = moulds[result.mould].name[lang];
  const rank = rankOf(result).name[lang];
  const bar = barOf(result);

  if (lang === "en") {
    const how =
      result.time === null
        ? `Broke at ${result.carved}%`
        : `Cut out in ${secondsText(result.time, lang)}`;

    const dare =
      result.time === null
        ? "Can you cut it out without breaking it?"
        : "Can you cut it out faster?";

    return `Breathless Carve ${mould}\n${how} · ${rank}\n${bar}\n${dare}`;
  }

  const how =
    result.time === null
      ? `${result.carved}%で割れた`
      : `${secondsText(result.time, lang)}で抜けた`;

  const dare =
    result.time === null ? "割らずに抜ける？" : "これより速く抜ける？";

  return `息止め型抜き ${mould}\n${how} · ${rank}\n${bar}\n${dare}`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);

  return {
    image: `${origin}/games/katanuki/og?${query.toString()}`,
    text: [
      lineOf(result, lang),
      lang === "en" ? "#息止め型抜き #BreathlessCarve" : "#息止め型抜き",
    ].join("\n"),
    url: `${origin}/games/katanuki?${query.toString()}`,
  };
};
