import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import { capacity, longestHold, mlOf, outcomeOf, pourOf } from "./pour";
import type { Outcome, Pour } from "./pour";
import { aboveRim, fillOf } from "./scene";

export interface Result {
  seed: number;
  hold: number;
}

export interface Glass {
  pour: Pour;
  outcome: Outcome;
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

const spillRanks: Record<"held" | "after", Rank> = {
  after: {
    line: {
      en: "You let go in time. The trickle didn't.",
      ja: "手は離した。とくとくは止まらなかった。",
    },
    name: { en: "One drop too many", ja: "あと一滴" },
    seal: "滴",
  },
  held: {
    line: {
      en: "A round for the whole counter.",
      ja: "カウンターじゅうに、おごった。",
    },
    name: { en: "Generous pour", ja: "大盤振る舞い" },
    seal: "溢",
  },
};

const spillLines: readonly Text[] = [
  { en: "The table had a drink.", ja: "テーブルが一杯やった。" },
  { en: "Could we get a cloth over here?", ja: "おしぼり、ください。" },
  {
    en: "The surface tension finally gave up.",
    ja: "表面張力が、ついに折れた。",
  },
  {
    en: "The counter drank more than you did.",
    ja: "枡の外のほうが、よく飲んだ。",
  },
];

export const spilledOf = (glass: Glass) => glass.outcome.spilledAt !== null;

export const glassOf = (result: Result): Glass => {
  const pour = pourOf(result.seed);
  const outcome = outcomeOf(pour, result.hold);
  return {
    kept: Math.round(mlOf(pour, outcome.volume)),
    outcome,
    pour,
    spilled: Math.round(mlOf(pour, 1 + outcome.spilled) - capacity[pour.cup]),
  };
};

export const spillKind = (outcome: Outcome) =>
  outcome.spilledAt !== null && outcome.spilledAt > outcome.hold
    ? "after"
    : "held";

export const rankOf = (glass: Glass): Rank =>
  spilledOf(glass)
    ? spillRanks[spillKind(glass.outcome)]
    : (ranks.findLast((rank) => glass.outcome.tenths >= rank.from) ?? ranks[0]);

export const lineOf = (glass: Glass, lang: Lang) => {
  if (!spilledOf(glass)) {
    return rankOf(glass).line[lang];
  }
  const extra = glass.pour.seed % (spillLines.length + 1);
  return (spillLines[extra] ?? rankOf(glass).line)[lang];
};

export const brimful = (glass: Glass) =>
  !spilledOf(glass) && glass.outcome.tenths >= 900;

export const percent = (tenths: number) => (tenths / 10).toFixed(1);

export const seconds = (hold: number) => (hold / 1000).toFixed(2);

export const heightOf = (glass: Glass) =>
  aboveRim(fillOf(glass.pour, glass.outcome.volume));

export const signed = (mm: number) => {
  const size = Math.abs(mm).toFixed(1);
  if (size === "0.0") {
    return size;
  }
  return mm > 0 ? `+${size}` : `−${size}`;
};

export const scoreOf = (glass: Glass) =>
  spilledOf(glass) ? -1 : glass.outcome.tenths;

const whole = (digits: number) =>
  z
    .string()
    .regex(new RegExp(`^(?:0|[1-9]\\d{0,${digits - 1}})$`, "u"))
    .transform(Number);

const shared = z.object({
  h: whole(5),
  s: whole(10).pipe(z.number().int().max(0xff_ff_ff_ff)),
});

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  if (!parsed.success) {
    return null;
  }
  const { h, s } = parsed.data;
  return h <= longestHold(pourOf(s)) ? { hold: h, seed: s } : null;
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    h: String(result.hold),
    s: String(result.seed),
  }).toString();

const shareLines = (glass: Glass, lang: Lang) => {
  const rank = rankOf(glass).name[lang];
  const { name } = copy[lang];
  if (spilledOf(glass)) {
    return lang === "en"
      ? [`${name}: I spilled it (${rank})`, `${glass.spilled} ml on the table.`]
      : [`${name}で、こぼした（${rank}）`, `テーブルに ${glass.spilled}ml。`];
  }
  const tension = percent(glass.outcome.tenths);
  const mm = signed(heightOf(glass));
  return lang === "en"
    ? [
        `${name}: ${tension}% surface tension (${rank})`,
        `Stopped at ${mm} mm from the rim.`,
      ]
    : [`${name} 表面張力 ${tension}%（${rank}）`, `縁から ${mm}mm で止めた。`];
};

export const shareOf = (result: Result, origin: string, lang: Lang): Share => {
  const glass = glassOf(result);
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/masu/og?${query.toString()}`,
    text: [
      ...shareLines(glass, lang),
      lang === "en"
        ? "Same pour, your turn. Can you fill it without spilling?"
        : "同じ一杯で勝負。こぼさずに、なみなみ注げる？",
      spilledOf(glass) ? "💦" : "🍶",
      lang === "en" ? "#表面張力酒場 #SurfaceTensionBar" : "#表面張力酒場",
    ].join("\n"),
    url: `${origin}/games/masu?${query.toString()}`,
  };
};
