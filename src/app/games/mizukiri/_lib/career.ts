import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import { progressOf } from "./journey";
import { formatDistance, titleOf, toKmh } from "./result";
import type { Save } from "./save";
import { zoneIndex, zones } from "./simulate";

export interface Career {
  airtime: number;
  best: number;
  total: number;
  runs: number;
  combo: number;
  level: number | null;
  perfect: boolean;
  speed: number;
}

export const careerOf = (save: Save): Career => ({
  airtime: save.tally.airtime,
  best: save.best,
  combo: save.combo,
  level: save.mode === "journey" ? progressOf(save.xp).level : null,
  perfect: save.divine,
  runs: save.runs,
  speed: save.tally.bestSpeed,
  total: save.tally.distance,
});

const labels = {
  airtime: { en: "Flight time", ja: "飛行時間" },
  combo: { en: "Best combo", ja: "最大コンボ" },
  perfect: { en: "Perfect throw", ja: "神投げ達成" },
  runs: { en: "Throws", ja: "投げた数" },
  speed: { en: "Top speed", ja: "最高速度" },
  total: { en: "Total distance", ja: "総飛距離" },
} satisfies Record<string, Text>;

const clock: Record<Lang, string[]> = {
  en: ["h", "m", "s"],
  ja: ["時間", "分", "秒"],
};

const formatAirtime = (seconds: number, lang: Lang) => {
  const whole = Math.round(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  let start = 2;
  if (hours > 0) {
    start = 0;
  } else if (minutes > 0) {
    start = 1;
  }
  return [hours, minutes, whole % 60]
    .slice(start, start + 2)
    .map((count, i) => `${count}${clock[lang][start + i] ?? ""}`)
    .join(lang === "en" ? " " : "");
};

export const describeCareer = (career: Career, lang: Lang) => {
  const area = zones[zoneIndex(career.best)]?.name[lang] ?? "";
  const airtime = formatAirtime(career.airtime, lang);
  return {
    airtime,
    area,
    facts: [
      {
        label: labels.runs[lang],
        value: career.runs.toLocaleString(copy[lang].locale),
      },
      { label: labels.airtime[lang], value: airtime },
      { label: labels.total[lang], value: formatDistance(career.total) },
      { label: labels.combo[lang], value: `×${career.combo}` },
      { label: labels.speed[lang], value: `${toKmh(career.speed)} km/h` },
    ],
    perfect: career.perfect ? labels.perfect[lang] : null,
    reached: lang === "en" ? `Reached ${area}` : `${area}まで到達`,
    title: `${titleOf(career.best, lang)}${career.level === null ? "" : ` · Lv.${career.level}`}`,
  };
};

const shared = z.object({
  air: z.coerce.number().min(0).max(1e12),
  best: z.coerce.number().min(0).max(100_000_000),
  combo: z.coerce.number().int().min(0).max(100_000),
  lv: z.coerce.number().int().min(0).max(9999).optional(),
  perfect: z.literal("1").optional(),
  runs: z.coerce.number().int().min(1).max(100_000_000),
  top: z.coerce.number().min(0).max(1e6).optional(),
  total: z.coerce.number().min(0).max(1e16),
});

export const readCareer = (
  params: Record<string, string | string[] | undefined>
): Career | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const { air, best, combo, lv, perfect, runs, top, total } = parsed.data;
  return {
    airtime: air,
    best,
    combo,
    level: lv ?? null,
    perfect: perfect !== undefined,
    runs,
    speed: top ?? 0,
    total,
  };
};

export const careerQuery = (career: Career) => {
  const query = new URLSearchParams({
    air: career.airtime.toFixed(1),
    best: career.best.toFixed(1),
    combo: String(career.combo),
    runs: String(career.runs),
    top: career.speed.toFixed(1),
    total: career.total.toFixed(1),
  });
  if (career.level !== null) {
    query.set("lv", String(career.level));
  }
  if (career.perfect) {
    query.set("perfect", "1");
  }
  return query.toString();
};

export const careerShare = (
  career: Career,
  origin: string,
  lang: Lang
): Share => {
  const query = new URLSearchParams(careerQuery(career));
  query.set("l", lang);
  const { airtime, area } = describeCareer(career, lang);
  const best = formatDistance(career.best).replace(" ", "");
  const total = formatDistance(career.total).replace(" ", "");
  const runs = career.runs.toLocaleString(copy[lang].locale);
  const rank =
    career.level === null
      ? null
      : `${copy[lang].workshop.mode.journey.name} Lv.${career.level}`;
  return {
    text:
      lang === "en"
        ? `My ${copy.en.name} record: best ${best}, ${total} across ${runs} throw${career.runs === 1 ? "" : "s"} and ${airtime} in flight, reached ${area}${rank === null ? "" : ` (${rank})`}\n#天の川水切り #SkipToTheMilkyWay`
        : `${copy.ja.name}の戦績：自己ベスト${best}、${runs}投・飛行時間${airtime}で合計${total}、${area}まで到達${rank === null ? "" : `（${rank}）`}\n#天の川水切り`,
    image: `${origin}/games/mizukiri/og?${query.toString()}`,
    url: `${origin}/games/mizukiri?${query.toString()}`,
  };
};
