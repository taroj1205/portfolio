import { z } from "zod";

import type { Lang } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { hundredths, createStick, phaseAt } from "./burn";
import type { Run } from "./burn";
import { phaseOf, phases } from "./phases";

export interface Result {
  seed: number;
  time: number;
}

export const resultOf = (run: Run): Result => ({
  seed: run.stick.seed,
  time: hundredths(run),
});

export const reachedOf = (result: Result) =>
  phaseAt(createStick(result.seed), result.time / 100);

export const finished = (result: Result) =>
  result.time >= createStick(result.seed).length;

export const formatTime = (time: number) => (time / 100).toFixed(2);

export const timeText = (time: number, lang: Lang) =>
  lang === "en" ? `${formatTime(time)}s` : `${formatTime(time)}秒`;

export const titleOf = (result: Result, lang: Lang) => {
  if (finished(result)) {
    return lang === "en" ? "Burned all the way down" : "燃え尽きるまで";
  }
  const { name } = phaseOf(reachedOf(result));
  return lang === "en" ? `Made it to ${name.en}` : `${name.ja}まで`;
};

export const trailOf = (result: Result) => {
  const reached = reachedOf(result);
  return (
    phases
      .map((phase, index) => (index <= reached ? phase.emoji : "▫️"))
      .join("") + (finished(result) ? "🎇" : "")
  );
};

const shared = z.object({
  s: z.coerce.number().int().min(0).max(0xff_ff_ff_ff),
  t: z.coerce.number().int().min(0),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const { s, t } = parsed.data;
  return t > createStick(s).length ? null : { seed: s, time: t };
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    s: String(result.seed),
    t: String(result.time),
  }).toString();

const lineOf = (result: Result, lang: Lang) => {
  const done = finished(result);
  const { name } = phaseOf(reachedOf(result));
  if (lang === "en") {
    return `An Ember's Life ${timeText(result.time, "en")}, ${done ? "burned all the way down" : `made it to ${name.en}`}`;
  }
  return `火玉の一生 ${timeText(result.time, "ja")} ${done ? "完走" : `${name.ja}まで`}`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/senko/og?${query.toString()}`,
    text: [
      lineOf(result, lang),
      trailOf(result),
      lang === "en" ? "#火玉の一生 #EmberLife" : "#火玉の一生",
    ].join("\n"),
    url: `${origin}/games/senko?${query.toString()}`,
  };
};
