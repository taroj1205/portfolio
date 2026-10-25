import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import { UNIT, heightOf } from "./pile";
import { syrupIds, syrups } from "./syrups";
import type { SyrupId } from "./syrups";

export const PERFECT = 6;
const SAMPLES = 16;
const TOP = 35;
const TALLEST = 400;
const BLOCKS = "▁▂▃▄▅▆▇█";

export interface Result {
  tenths: number;
  outline: readonly number[];
  toppled: boolean;
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
    line: { en: "You can still see the glass.", ja: "まだ、器が見えてる。" },
    name: { en: "Just a taste", ja: "ひとくち" },
  },
  {
    least: 30,
    level: 1,
    line: { en: "Festival stall size.", ja: "屋台くらいの盛り。" },
    name: { en: "Regular", ja: "並盛り" },
  },
  {
    least: 60,
    level: 2,
    line: { en: "The spoon won't stop.", ja: "スプーンが止まらない。" },
    name: { en: "Large", ja: "大盛り" },
  },
  {
    least: 90,
    level: 3,
    line: { en: "Fit for the shop sign.", ja: "お店の看板にできる。" },
    name: { en: "Extra large", ja: "特盛り" },
  },
  {
    least: 120,
    level: 4,
    line: {
      en: "Brain freeze just looking at it.",
      ja: "見るだけで頭がキーン。",
    },
    name: { en: "Heaped high", ja: "山盛り" },
  },
  {
    least: 150,
    level: 5,
    line: { en: "The regulars are murmuring.", ja: "常連さんがざわついてる。" },
    name: { en: "Fuji-size", ja: "富士盛り" },
  },
  {
    least: 180,
    level: PERFECT,
    line: {
      en: "Any higher and it's in the clouds.",
      ja: "これより上は、雲の上。",
    },
    name: { en: "Summit", ja: "てっぺん" },
  },
];

export const rankOf = (tenths: number): Rank =>
  ranks.findLast((rank) => tenths >= rank.least) ?? ranks[0];

export const nextOf = (tenths: number) => {
  const next = ranks[rankOf(tenths).level + 1];

  return next === undefined ? null : { more: next.least - tenths, rank: next };
};

export const goals = ranks.slice(1);

export const syrupOf = (tenths: number): SyrupId =>
  syrupIds[rankOf(tenths).level];

export const tenthsOf = (height: number) =>
  Math.min(TALLEST, Math.round((height / UNIT) * 10));

const outlineOf = (cols: readonly number[]) => {
  const last = cols.length - 1;

  const samples = Array.from({ length: SAMPLES }, (_, i) => {
    const at = (i * last) / (SAMPLES - 1);
    const low = Math.floor(at);
    const high = Math.min(last, low + 1);

    return cols[low] + (cols[high] - cols[low]) * (at - low);
  });

  const top = heightOf(samples);

  return samples.map((h) => (top > 0 ? Math.round((h / top) * TOP) : 0));
};

export const resultOf = (cols: readonly number[], toppled: boolean) => ({
  outline: outlineOf(cols),
  tenths: tenthsOf(heightOf(cols)),
  toppled,
});

export const profileOf = (result: Result) =>
  result.outline.map((each) => (each / TOP) * (result.tenths / 10) * UNIT);

export const heightText = (tenths: number) => `${(tenths / 10).toFixed(1)}cm`;

export const barOf = (result: Result) =>
  result.tenths === 0
    ? "🧊"
    : result.outline
        .map(
          (each) =>
            BLOCKS[
              Math.min(
                BLOCKS.length - 1,
                Math.floor((each / (TOP + 1)) * BLOCKS.length)
              )
            ]
        )
        .join("");

const shared = z.object({
  h: z
    .string()
    .regex(/^(?:0|[1-9]\d{0,2})$/u)
    .transform(Number)
    .refine((tenths) => tenths <= TALLEST),
  s: z
    .string()
    .regex(new RegExp(`^[0-9a-z]{${SAMPLES}}$`, "u"))
    .transform((text) =>
      Array.from({ length: SAMPLES }, (_, i) =>
        Number.parseInt(text.charAt(i), 36)
      )
    ),
  t: z.literal("1").optional(),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);

  if (!parsed.success) {
    return null;
  }

  return {
    outline: parsed.data.s,
    tenths: parsed.data.h,
    toppled: parsed.data.t === "1",
  };
};

export const queryOf = (result: Result) => {
  const query = new URLSearchParams({
    h: String(result.tenths),
    s: result.outline.map((each) => each.toString(36)).join(""),
  });

  if (result.toppled) {
    query.set("t", "1");
  }

  return query.toString();
};

export const titleOf = (result: Result, lang: Lang) =>
  `${heightText(result.tenths)} · ${rankOf(result.tenths).name[lang]}`;

const howOf = (result: Result, lang: Lang) => {
  const height = heightText(result.tenths);
  const syrup = syrups[syrupOf(result.tenths)].name[lang];

  if (lang === "en") {
    return result.toppled
      ? `It toppled, ${height} left`
      : `Piled ${height} with ${syrup}`;
  }

  return result.toppled ? `崩れて、残り${height}` : `${syrup}で${height}盛った`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  const rank = rankOf(result.tenths).name[lang];
  const { icon } = syrups[syrupOf(result.tenths)];
  const words = copy[lang];

  return {
    image: `${origin}/games/kakigori/og?${query.toString()}`,
    text: [
      words.name,
      `${howOf(result, lang)} · ${rank}`,
      `${barOf(result)} ${icon}`,
      words.challenge.dare,
      lang === "en" ? `#${copy.ja.name} #KakigoriSummit` : `#${copy.ja.name}`,
    ].join("\n"),
    url: `${origin}/games/kakigori?${query.toString()}`,
  };
};
