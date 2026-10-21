import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { LIVES, START_BPM, tempoAt } from "./beat";
import type { Ending, Run } from "./beat";

export const MOST = 999;
export const PERFECT = 6;
const CELLS = 10;

export interface Result {
  pounds: number;
  tempo: number;
  ending: Ending;
}

export interface Rank {
  level: number;
  least: number;
  name: Text;
  line: Text;
}

export const ranks: readonly Rank[] = [
  {
    least: 0,
    level: 0,
    line: { en: "It's still just rice.", ja: "まだ、ごはん。" },
    name: { en: "Still rice", ja: "米つぶ" },
  },
  {
    least: 10,
    level: 1,
    line: { en: "Good enough for ohagi.", ja: "おはぎには、なる。" },
    name: { en: "Half-pounded", ja: "半殺し" },
  },
  {
    least: 25,
    level: 2,
    line: { en: "That's real mochi now.", ja: "ちゃんと、餅になった。" },
    name: { en: "Fresh mochi", ja: "つきたて" },
  },
  {
    least: 45,
    level: 3,
    line: { en: "Look at that stretch.", ja: "のびが、ちがう。" },
    name: { en: "Fine mochi", ja: "上物" },
  },
  {
    least: 70,
    level: 4,
    line: { en: "Fit for the shop window.", ja: "お店に出せる。" },
    name: { en: "Superb", ja: "極上" },
  },
  {
    least: 100,
    level: 5,
    line: { en: "A crowd is gathering.", ja: "見物人が、集まってきた。" },
    name: { en: "Master", ja: "名人" },
  },
  {
    least: 140,
    level: PERFECT,
    line: { en: "Too fast to see.", ja: "目にも止まらぬ。" },
    name: { en: "Lightning pounder", ja: "高速餅つき" },
  },
];

export const rankOf = (pounds: number): Rank =>
  ranks.findLast((rank) => pounds >= rank.least) ?? ranks[0];

export const smoothness = (pounds: number) =>
  Math.min(1, pounds / ranks[3].least);

export const nextOf = (pounds: number) => {
  const next = ranks[rankOf(pounds).level + 1];
  return next === undefined ? null : { more: next.least - pounds, rank: next };
};

export const tempoFits = (pounds: number, tempo: number) =>
  pounds === 0
    ? tempo === START_BPM
    : Array.from({ length: LIVES }, (_, misses) =>
        tempoAt(pounds - 1 + misses)
      ).includes(tempo);

export const resultOf = (
  run: Pick<Run, "pounds" | "tempo">,
  ending: Ending
): Result =>
  run.pounds > MOST
    ? { ending, pounds: MOST, tempo: tempoAt(MOST - 1) }
    : { ending, pounds: run.pounds, tempo: run.tempo };

export const beats = (result: Result, other: Result) =>
  result.pounds - other.pounds || result.tempo - other.tempo;

export const barOf = (result: Result) => {
  const top = ranks[PERFECT].least;
  const done = Math.min(CELLS, Math.floor((result.pounds / top) * CELLS));
  const end = result.ending === "hand" ? "🤚💥" : "💨";
  const shine = rankOf(result.pounds).level === PERFECT ? "✨" : "";
  return `${"⬜".repeat(done)}${"▫️".repeat(CELLS - done)}${end}${shine}`;
};

const whole = (pattern: RegExp, min: number, max: number) =>
  z
    .string()
    .regex(pattern)
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const shared = z
  .object({
    b: whole(/^[1-9]\d{1,3}$/u, START_BPM, tempoAt(MOST + LIVES)),
    e: z.enum(["h", "m"]),
    p: whole(/^(?:0|[1-9]\d{0,2})$/u, 0, MOST),
  })
  .refine(({ b, p }) => tempoFits(p, b));

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const { b, e, p } = parsed.data;
  return { ending: e === "h" ? "hand" : "miss", pounds: p, tempo: b };
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    b: String(result.tempo),
    e: result.ending === "hand" ? "h" : "m",
    p: String(result.pounds),
  }).toString();

export const poundsText = (pounds: number, lang: Lang) =>
  lang === "en" ? `${pounds} ${pounds === 1 ? "hit" : "hits"}` : `${pounds}回`;

export const tempoText = (tempo: number) => `BPM ${tempo}`;

const lineOf = (result: Result, lang: Lang) => {
  const rank = rankOf(result.pounds).name[lang];
  const bar = barOf(result);
  const tempo = tempoText(result.tempo);
  if (lang === "en") {
    const how =
      result.ending === "hand"
        ? "then hit my partner's hand"
        : "then lost the beat";
    return `Mochitsuki: ${poundsText(result.pounds, lang)} · ${rank}\nUp to ${tempo}, ${how}\n${bar}\nCan you pound more?`;
  }
  const how = result.ending === "hand" ? "相方の手をついた" : "リズムが崩れた";
  return `餅つき ${poundsText(result.pounds, lang)} · ${rank}\n最高${tempo}で${how}\n${bar}\nこれより多くつける？`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/mochitsuki/og?${query.toString()}`,
    text: [
      lineOf(result, lang),
      lang === "en" ? "#餅つき #Mochitsuki" : "#餅つき",
    ].join("\n"),
    url: `${origin}/games/mochitsuki?${query.toString()}`,
  };
};
