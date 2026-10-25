import { z } from "zod";

import type { Lang } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import type { Rank, Verdict } from "./copy";
import { ROUNDS, isSeed, totalOf } from "./puzzles";

export interface Shared {
  seed: number;
  marks: number[];
}

const verdicts: [Verdict, number][] = [
  ["eagle", 90],
  ["sharp", 70],
  ["fair", 40],
];

const ranks: [Rank, number][] = [
  ["ruler", 900],
  ["craft", 750],
  ["good", 550],
];

export const verdictColors: Record<Verdict, string> = {
  eagle: "#5ee08a",
  fair: "#ff9f4a",
  off: "#ff5d6c",
  sharp: "#ffd27a",
};

const squares: Record<Verdict, string> = {
  eagle: "🟩",
  fair: "🟧",
  off: "🟥",
  sharp: "🟨",
};

const atLeast = <T>(steps: [T, number][], value: number, below: T) =>
  steps.find(([, floor]) => value >= floor)?.[0] ?? below;

export const verdictOf = (points: number) => atLeast(verdicts, points, "off");

export const rankOf = (total: number) => atLeast(ranks, total, "training");

export const rowOf = (marks: readonly number[]) =>
  marks.map((mark) => squares[verdictOf(mark)]).join("");

const query = z.object({
  m: z
    .string()
    .regex(new RegExp(`^(?:\\d{1,3}\\.){${ROUNDS - 1}}\\d{1,3}$`, "u"))
    .transform((value) => value.split(".").map(Number))
    .pipe(z.array(z.number().int().min(0).max(100))),
  s: z
    .string()
    .regex(/^[1-9]\d{0,9}$/u)
    .transform(Number)
    .refine(isSeed),
});

type Params = Record<string, string | string[] | undefined>;

export const readShared = (params: Params): Shared | null => {
  const parsed = query.safeParse(params);

  return parsed.success ? { marks: parsed.data.m, seed: parsed.data.s } : null;
};

export const queryOf = (shared: Shared) =>
  new URLSearchParams({
    m: shared.marks.join("."),
    s: String(shared.seed),
  }).toString();

const hashtags: Record<Lang, string> = {
  en: "#目分量十番勝負 #TenRoundsByEye",
  ja: "#目分量十番勝負",
};

export const titleOf = (shared: Shared, lang: Lang) =>
  `${copy[lang].share.line(totalOf(shared.marks))} ${rowOf(shared.marks)}`;

export const shareOf = (shared: Shared, origin: string, lang: Lang): Share => {
  const words = copy[lang].share;
  const params = new URLSearchParams(queryOf(shared));
  params.set("l", lang);

  return {
    image: `${origin}/games/mebunryo/og?${params.toString()}`,
    text: [
      words.line(totalOf(shared.marks)),
      rowOf(shared.marks),
      words.dare,
      hashtags[lang],
    ].join("\n"),
    url: `${origin}/games/mebunryo?${params.toString()}`,
  };
};
