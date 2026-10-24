import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import { plain } from "./simulate";
import type { Traits } from "./simulate";

export type Axis = "speed" | "keep" | "lift" | "focus" | "impact";

export type Tuning = Record<Axis, number>;

export const axes: { key: Axis; label: Text; note: Text }[] = [
  {
    key: "speed",
    label: { en: "Speed", ja: "速さ" },
    note: {
      en: "How fast the stone leaves your hand. Faster stones travel farther.",
      ja: "投げた石の初速。速いほど遠くまで飛ぶ",
    },
  },
  {
    key: "keep",
    label: { en: "Grit", ja: "粘り" },
    note: {
      en: "How much speed the stone keeps on each skip, so it carries on longer.",
      ja: "跳ねるたびに残る速さ。高いほど失速しにくく、長く跳ね続ける",
    },
  },
  {
    key: "lift",
    label: { en: "Bounce", ja: "跳ね" },
    note: {
      en: "How high the stone hops on each skip. Higher hops stay in the air longer.",
      ja: "跳ねるときの高さ。高いほど一回の滞空が長い",
    },
  },
  {
    key: "focus",
    label: { en: "Focus", ja: "集中" },
    note: {
      en: "How much leeway you get to tap as the stone touches the water.",
      ja: "着水の瞬間にタップできる猶予の広さ",
    },
  },
  {
    key: "impact",
    label: { en: "Impact", ja: "当たり" },
    note: {
      en: "How much extra speed ducks, rocks and dragonflies give the stone.",
      ja: "カモや岩、トンボに当たったときの加速の大きさ",
    },
  },
];

export const LIMIT = 3;

const STEP: Record<Axis, number> = {
  focus: 0.03,
  impact: 0.21,
  keep: 0.004,
  lift: 0.065,
  speed: 0.025,
};

export const flatTuning: Tuning = {
  focus: 0,
  impact: 0,
  keep: 0,
  lift: 0,
  speed: 0,
};

const step = z.number().int().min(-LIMIT).max(LIMIT);

const BASE = 5;

export const scoreOf = (by: number) => String(BASE + by);

export const pointsLeft = (tuning: Tuning) =>
  axes.reduce((sum, { key }) => sum - tuning[key], 0);

const tuningSchema = z
  .object({
    focus: step,
    impact: step,
    keep: step,
    lift: step,
    speed: step,
  })
  .refine((tuning) => pointsLeft(tuning) >= 0);

export const tuningOrFlat = z
  .unknown()
  .optional()
  .transform((value): Tuning => {
    const parsed = tuningSchema.safeParse(value);

    return parsed.success ? parsed.data : flatTuning;
  });

export const tune = (tuning: Tuning, key: Axis, by: 1 | -1): Tuning | null => {
  const next = { ...tuning, [key]: tuning[key] + by };

  return tuningSchema.safeParse(next).success ? next : null;
};

export const traitsOf = (tuning: Tuning): Traits => {
  const scale = (key: Axis) => (1 + STEP[key]) ** tuning[key];

  return {
    ...plain,
    focus: plain.focus * scale("focus"),
    impact: plain.impact * scale("impact"),
    keep: plain.keep + STEP.keep * tuning.keep,
    lift: plain.lift * scale("lift"),
    speed: plain.speed * scale("speed"),
  };
};

export const noteOf = (tuning: Tuning, lang: Lang) => {
  const marks = axes.flatMap(({ key, label }) => {
    const by = tuning[key];

    if (by === 0) {
      return [];
    }

    return [`${label[lang]}${(by > 0 ? "↑" : "↓").repeat(Math.abs(by))}`];
  });

  if (marks.length > 0) {
    return marks.join(" ");
  }

  return lang === "en" ? "Balanced" : "クセなし";
};

export const tuningCode = (tuning: Tuning) =>
  axes.map(({ key }) => tuning[key]).join(".");

export const tuningFrom = (code: string): Tuning | null => {
  const parts = code.split(".");

  if (parts.length !== axes.length || !parts.every((p) => /^-?\d+$/u.test(p))) {
    return null;
  }

  const parsed = tuningSchema.safeParse(
    Object.fromEntries(axes.map(({ key }, i) => [key, Number(parts[i])]))
  );

  return parsed.success ? parsed.data : null;
};
