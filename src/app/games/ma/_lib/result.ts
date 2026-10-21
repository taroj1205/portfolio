import { z } from "zod";

import type { Lang } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { LAST_DAY, dailyTarget } from "./daily";
import {
  LONGEST,
  SHOWN,
  STANDARD,
  formatGap,
  formatTime,
  moonsOf,
  rankOf,
  secondsText,
} from "./judge";

export interface Result {
  time: number;
  day: number | null;
}

export type Mode = "standard" | "daily";

export interface Plan {
  day: number | null;
  target: number;
  today: boolean;
}

export const targetOf = (day: number | null) =>
  day === null ? STANDARD : dailyTarget(day);

export const gapOf = (result: Result) => result.time - targetOf(result.day);

const dayFor = (mode: Mode, challenge: Result | null, today: number) => {
  if (challenge !== null) {
    return challenge.day;
  }
  return mode === "daily" ? today : null;
};

export const planOf = (
  mode: Mode,
  challenge: Result | null,
  today: number
): Plan => {
  const day = dayFor(mode, challenge, today);
  return { day, target: targetOf(day), today: day === today };
};

const whole = (min: number, max: number) =>
  z
    .string()
    .regex(/^[1-9]\d{0,4}$/u)
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const shared = z.object({
  n: whole(1, LAST_DAY).optional(),
  t: whole(SHOWN, LONGEST),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  return parsed.success
    ? { day: parsed.data.n ?? null, time: parsed.data.t }
    : null;
};

export const queryOf = (result: Result) => {
  const query = new URLSearchParams({ t: String(result.time) });
  if (result.day !== null) {
    query.set("n", String(result.day));
  }
  return query.toString();
};

const lineOf = (result: Result, lang: Lang) => {
  const gap = gapOf(result);
  const rank = rankOf(gap);
  const off = secondsText(formatGap(gap), lang);
  const moons = moonsOf(rank.level);
  if (result.day !== null) {
    return lang === "en"
      ? `Ten Silent Seconds daily #${result.day}\n${off} · ${rank.name.en}\n${moons}`
      : `無音の十秒 お題 #${result.day}\n${off} · ${rank.name.ja}\n${moons}`;
  }
  const time = secondsText(formatTime(result.time), lang);
  return lang === "en"
    ? `Ten Silent Seconds: 10.00s challenge\n${time} (${formatGap(gap)}) · ${rank.name.en}\n${moons}\nThe timer vanishes after 3s. Can you stop at exactly 10.00?`
    : `無音の十秒 10.00秒チャレンジ\n${time}（${formatGap(gap)}）· ${rank.name.ja}\n${moons}\nタイマーが消えても、10.00秒ぴったりで止められる？`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/ma/og?${query.toString()}`,
    text: [
      lineOf(result, lang),
      lang === "en" ? "#無音の十秒 #TenSilentSeconds" : "#無音の十秒",
    ].join("\n"),
    url: `${origin}/games/ma?${query.toString()}`,
  };
};
