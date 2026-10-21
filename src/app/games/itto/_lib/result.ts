import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { ANGLES, REACH, errorOf, halving, splitBy } from "./cut";
import type { Cut, Split } from "./cut";
import { RUN, SEED_MAX, kinds, runOf, seeded, foodOf } from "./foods";
import type { Kind, Food } from "./foods";

export interface Result {
  seed: number;
  cuts: Cut[];
}

export interface Piece {
  food: Food;
  cut: Cut;
  split: Split;
}

export interface Scored {
  pieces: Piece[];
  total: number;
  best: Piece;
}

interface Rank {
  most: number;
  seal: readonly [string, string];
  name: Text;
  line: Text;
}

const feud: Rank = {
  line: {
    en: "This is how sibling fights start.",
    ja: "これは、きょうだいげんかになる。",
  },
  most: Infinity,
  name: { en: "Sibling feud", ja: "兄弟げんか" },
  seal: ["喧", "嘩"],
};

const ranks: readonly Rank[] = [
  {
    line: {
      en: "Your knife is more exact than the scales.",
      ja: "はかりより正確な包丁。",
    },
    most: 5,
    name: { en: "Divine hand", ja: "神業" },
    seal: ["神", "業"],
  },
  {
    line: {
      en: "The cutting board is yours now.",
      ja: "今日から、まな板はあなたのもの。",
    },
    most: 15,
    name: { en: "Head chef", ja: "板長" },
    seal: ["板", "長"],
  },
  {
    line: {
      en: "Good enough to serve to customers.",
      ja: "お客さんに出せる切り口。",
    },
    most: 40,
    name: { en: "Itamae", ja: "板前" },
    seal: ["板", "前"],
  },
  {
    line: {
      en: "You've got the grip. Now the aim.",
      ja: "包丁の持ち方は、もう大丈夫。",
    },
    most: 90,
    name: { en: "Apprentice", ja: "見習い" },
    seal: ["見", "習"],
  },
  {
    line: {
      en: "Maybe start with the dishes.",
      ja: "まずは、皿洗いから。",
    },
    most: 200,
    name: { en: "Dishwasher", ja: "皿洗い" },
    seal: ["皿", "洗"],
  },
  feud,
];

export const rankOf = (total: number) =>
  ranks.find((rank) => total <= rank.most) ?? feud;

const verdicts: readonly { most: number; text: Text }[] = [
  { most: 0, text: { en: "Dead even", ja: "ぴったり半分" } },
  { most: 3, text: { en: "Almost exactly half", ja: "ほぼ半分" } },
  { most: 10, text: { en: "Nicely done", ja: "上出来" } },
  { most: 30, text: { en: "Close", ja: "惜しい" } },
  { most: 80, text: { en: "A bit unfair", ja: "ちょっと不公平" } },
  {
    most: 200,
    text: { en: "Someone gets the big piece", ja: "大きい方の取り合いになる" },
  },
];

const corner: Text = {
  en: "That's an end, not a half",
  ja: "それは、はしっこ",
};

export const verdictOf = (small: number, lang: Lang) =>
  (verdicts.find((each) => errorOf(small) <= each.most)?.text ?? corner)[lang];

export const tenths = (value: number) => (value / 10).toFixed(1);

export const ratioText = (small: number) =>
  `${tenths(small)} : ${tenths(1000 - small)}`;

const kindNames: Record<Kind, Text> = {
  castella: { en: "castella", ja: "カステラ" },
  daifuku: { en: "daifuku", ja: "大福" },
  kagami: { en: "kagami mochi", ja: "鏡餅" },
  kaki: { en: "persimmon", ja: "柿" },
  kamaboko: { en: "kamaboko", ja: "かまぼこ" },
  nerikiri: { en: "nerikiri", ja: "練り切り" },
  onigiri: { en: "onigiri", ja: "おにぎり" },
  rakugan: { en: "rakugan", ja: "落雁" },
  sushi: { en: "sushi", ja: "寿司" },
  taiyaki: { en: "taiyaki", ja: "鯛焼き" },
  tofu: { en: "tofu", ja: "豆腐" },
  yokan: { en: "yōkan", ja: "羊羹" },
};

export const kindTitle = (kind: Kind, lang: Lang) => {
  const name = kindNames[kind][lang];
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
};

export const scoreOf = (result: Result): Scored | null => {
  const foods = runOf(result.seed);
  const pieces: Piece[] = [];
  for (const [index, cut] of result.cuts.entries()) {
    const food = foods[index];
    const split = food === undefined ? null : splitBy(food.outline, cut);
    if (split === null) {
      return null;
    }
    pieces.push({ cut, food, split });
  }
  const [first] = pieces;
  if (first === undefined) {
    return null;
  }
  const [best = first] = pieces.toSorted(
    (a, b) => b.split.small - a.split.small
  );
  return {
    best,
    pieces,
    total: pieces.reduce((sum, piece) => sum + errorOf(piece.split.small), 0),
  };
};

const NUMBER = /^(?:0|-?[1-9]\d{0,4})$/u;

const cutText = z.string().transform((text, context) => {
  const [angle, offset, extra] = text.split(".");
  if (
    extra !== undefined ||
    angle === undefined ||
    offset === undefined ||
    !NUMBER.test(angle) ||
    !NUMBER.test(offset)
  ) {
    context.addIssue({ code: "custom", message: "Unreadable cut" });
    return z.NEVER;
  }
  return { angle: Number(angle), offset: Number(offset) };
});

const cutRange = z.object({
  angle: z
    .number()
    .int()
    .min(0)
    .max(ANGLES - 1),
  offset: z.number().int().min(-REACH).max(REACH),
});

const shared = z
  .object({
    c: z
      .string()
      .max(RUN * 13)
      .transform((text) => text.split("_"))
      .pipe(z.array(cutText.pipe(cutRange)).length(RUN)),
    s: z
      .string()
      .regex(/^[1-9]\d{0,9}$/u)
      .transform(Number)
      .pipe(z.number().int().min(1).max(SEED_MAX)),
  })
  .transform(({ c, s }) => ({ cuts: c, seed: s }))
  .refine((result) => scoreOf(result) !== null);

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  return parsed.success ? parsed.data : null;
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    c: result.cuts.map((cut) => `${cut.angle}.${cut.offset}`).join("_"),
    s: String(result.seed),
  }).toString();

export const gradeOf = (small: number) => {
  const error = errorOf(small);
  if (error <= 3) {
    return 0;
  }
  if (error <= 10) {
    return 1;
  }
  return error <= 30 ? 2 : 3;
};

const squares = ["🟩", "🟨", "🟧", "🟥"] as const;

export const blocksOf = (scored: Scored) =>
  scored.pieces.map((piece) => squares[gradeOf(piece.split.small)]).join("");

const lineOf = (scored: Scored, lang: Lang) => {
  const total = tenths(scored.total);
  const rank = rankOf(scored.total).name[lang];
  const best = ratioText(scored.best.split.small);
  const kind = kindNames[scored.best.food.kind][lang];
  const blocks = blocksOf(scored);
  return lang === "en"
    ? `Ittō, one straight cut: off by ${total}% across ${RUN} cuts (${rank})\n${blocks}\nClosest: ${best} on the ${kind}\nCan you cut the same shapes more evenly?`
    : `一刀で${RUN}つ切って、ズレ合計${total}%（${rank}）\n${blocks}\nいちばん半分に近かったのは${kind}の${best}\n同じ形で、もっと半分に切れる？`;
};

export const shareOf = (
  result: Result,
  scored: Scored,
  origin: string,
  lang: Lang
): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/itto/og?${query.toString()}`,
    text: [lineOf(scored, lang), lang === "en" ? "#一刀 #Itto" : "#一刀"].join(
      "\n"
    ),
    url: `${origin}/games/itto?${query.toString()}`,
  };
};

export const demoOf = (round: number) => {
  const roll = seeded(4099 + round * 31);
  const food = foodOf(kinds[(round * 7 + 6) % kinds.length], 1 + round * 977);
  const angle = Math.floor(roll() * ANGLES);
  const offset =
    halving(food.outline, angle) + Math.round((roll() - 0.5) * 120);
  const cut = { angle, offset };
  return { cut, food, split: splitBy(food.outline, cut) };
};
