import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import {
  POURS,
  capacity,
  limitOf,
  longestHold,
  outcomeOf,
  pourOf,
} from "./pour";
import type { Outcome, Pour } from "./pour";
import { aboveRim, fillOf } from "./scene";

export type Verdict =
  | "brink"
  | "brimming"
  | "room"
  | "short"
  | "held"
  | "after";

export interface Result {
  seed: number;
  holds: readonly number[];
}

export interface Glass {
  pour: Pour;
  outcome: Outcome;
  kept: number;
  spilled: number;
}

export interface Tally {
  glasses: Glass[];
  average: number;
  spills: number;
  kept: number;
  spilled: number;
}

interface Rank {
  seal: string;
  name: Text;
  line: Text;
}

const ranks: readonly (Rank & { from: number })[] = [
  {
    from: 0,
    line: {
      en: "Maybe start on the receiving end.",
      ja: "まずは、注ぐより注がれる側から。",
    },
    name: { en: "Teetotaller", ja: "下戸" },
    seal: "下",
  },
  {
    from: 200,
    line: {
      en: "The rim is still a long way off.",
      ja: "枡の縁が、まだ遠い。",
    },
    name: { en: "Apprentice", ja: "見習い" },
    seal: "見",
  },
  {
    from: 450,
    line: {
      en: "The staff are starting to know your face.",
      ja: "そろそろ、お店の人に顔を覚えられる。",
    },
    name: { en: "Regular", ja: "常連" },
    seal: "常",
  },
  {
    from: 700,
    line: {
      en: "Pour it to the brim and the talk flows too.",
      ja: "なみなみ注げば、話もはずむ。",
    },
    name: { en: "Tippler", ja: "呑兵衛" },
    seal: "呑",
  },
  {
    from: 850,
    line: {
      en: "You can feel the surface tension in your hand.",
      ja: "表面張力を、手で感じている。",
    },
    name: { en: "Seasoned drinker", ja: "酒豪" },
    seal: "豪",
  },
  {
    from: 950,
    line: {
      en: "Not a drop wasted. A brewer's hands.",
      ja: "一滴も無駄にしない、杜氏の手つき。",
    },
    name: { en: "Master brewer", ja: "杜氏" },
    seal: "杜",
  },
];

const spillLines: Record<"some" | "all", Text> = {
  all: {
    en: "Spilled every one. The table is drunk.",
    ja: "全部こぼした。テーブルが酔っぱらった。",
  },
  some: {
    en: "The table drank more than you did.",
    ja: "枡の外のほうが、よく飲んだ。",
  },
};

export const rankOf = (average: number): Rank =>
  ranks.findLast((rank) => average >= rank.from) ?? ranks[0];

const pourSet = (seed: number) =>
  Array.from({ length: POURS }, (_, index) => pourOf(seed, index));

export const glassOf = (pour: Pour, outcome: Outcome): Glass => {
  const ml = capacity[pour.cup];
  return {
    kept: Math.round((outcome.spilledAt === null ? outcome.volume : 1) * ml),
    outcome,
    pour,
    spilled:
      outcome.spilledAt === null ? 0 : Math.round((limitOf(pour) - 1) * ml),
  };
};

export const tallyOf = (result: Result): Tally => {
  const glasses = pourSet(result.seed).map((pour, index) =>
    glassOf(pour, outcomeOf(pour, result.holds[index] ?? 0))
  );
  const sum = (pick: (glass: Glass) => number) =>
    glasses.reduce((total, glass) => total + pick(glass), 0);
  return {
    average: Math.floor(sum((glass) => glass.outcome.tenths) / POURS),
    glasses,
    kept: sum((glass) => glass.kept),
    spilled: sum((glass) => glass.spilled),
    spills: glasses.filter((glass) => glass.outcome.spilledAt !== null).length,
  };
};

export const brimful = (outcome: Outcome) =>
  outcome.spilledAt === null && outcome.tenths >= 900;

export const verdictOf = (outcome: Outcome): Verdict => {
  if (outcome.spilledAt !== null) {
    return outcome.spilledAt > outcome.hold ? "after" : "held";
  }
  if (outcome.tenths >= 950) {
    return "brink";
  }
  if (outcome.tenths >= 700) {
    return "brimming";
  }
  return outcome.tenths > 0 ? "room" : "short";
};

export const lineOf = (tally: Tally, lang: Lang) => {
  if (tally.spills === POURS) {
    return spillLines.all[lang];
  }
  return tally.spills >= 3
    ? spillLines.some[lang]
    : rankOf(tally.average).line[lang];
};

export const percent = (tenths: number) => (tenths / 10).toFixed(1);

const trailOf = (tally: Tally) =>
  tally.glasses
    .map(({ outcome }) => {
      if (outcome.spilledAt !== null) {
        return "💦";
      }
      if (brimful(outcome)) {
        return "🍶";
      }
      return outcome.tenths > 0 ? "🟡" : "⚪";
    })
    .join("");

const holdPattern = "(?:0|[1-9]\\d{0,4})";

const shared = z.object({
  h: z
    .string()
    .regex(new RegExp(`^${holdPattern}(?:-${holdPattern}){${POURS - 1}}$`, "u"))
    .transform((value) => value.split("-").map(Number)),
  s: z
    .string()
    .regex(/^(?:0|[1-9]\d{0,9})$/u)
    .transform(Number)
    .pipe(z.number().int().max(0xff_ff_ff_ff)),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const { h, s } = parsed.data;
  return h.every((hold, index) => hold <= longestHold(pourOf(s, index)))
    ? { holds: h, seed: s }
    : null;
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    h: result.holds.join("-"),
    s: String(result.seed),
  }).toString();

const shareLine = (tally: Tally, lang: Lang) => {
  const rank = rankOf(tally.average).name[lang];
  const average = percent(tally.average);
  if (lang === "en") {
    const spills =
      tally.spills === 0
        ? "not a drop spilled"
        : `${tally.spills} of ${POURS} spilled`;
    return `Masu: surface tension ${average}% on average (${rank}), ${spills}.\nCan you pour it to the brim without spilling?`;
  }
  const spills =
    tally.spills === 0
      ? "一滴もこぼさず"
      : `${POURS}杯中${tally.spills}杯こぼして`;
  return `枡で表面張力 平均${average}%（${rank}）、${spills}。\nこぼさずに、なみなみ注げる？`;
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const tally = tallyOf(result);
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/masu/og?${query.toString()}`,
    text: [
      shareLine(tally, lang),
      trailOf(tally),
      lang === "en" ? "#枡 #Masu" : "#枡",
    ].join("\n"),
    url: `${origin}/games/masu?${query.toString()}`,
  };
};

export const heightOf = (glass: Glass) =>
  aboveRim(fillOf(glass.pour, glass.outcome.volume));

export const signed = (mm: number) => {
  const size = Math.abs(mm).toFixed(1);
  if (size === "0.0") {
    return size;
  }
  return mm > 0 ? `+${size}` : `−${size}`;
};

const heroKey = (glass: Glass) =>
  glass.outcome.spilledAt === null
    ? glass.outcome.tenths + glass.outcome.volume / 1000
    : -1;

export const heroOf = (tally: Tally) =>
  tally.glasses.toSorted((a, b) => heroKey(b) - heroKey(a))[0];
