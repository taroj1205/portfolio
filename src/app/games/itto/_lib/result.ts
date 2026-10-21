import { z } from "zod";

import type { Lang, Text } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { ANGLES, REACH, errorOf, halving, splitBy } from "./cut";
import type { Cut, Split } from "./cut";
import { dishOf, foodOf, isRare, kinds } from "./foods";
import type { Food, Kind } from "./foods";
import { SEED_MAX, seeded } from "./random";

export interface Result {
  seed: number;
  cut: Cut;
}

export interface Piece {
  food: Food;
  cut: Cut;
  split: Split;
}

interface Rank {
  most: number;
  seal: readonly [string, string];
  name: Text;
  line: Text;
}

const offcut: Rank = {
  line: {
    en: "That's an end, not a half.",
    ja: "それは半分じゃなくて、はしっこ。",
  },
  most: Infinity,
  name: { en: "Offcut", ja: "端切れ" },
  seal: ["端", "切"],
};

const ranks: readonly Rank[] = [
  {
    line: {
      en: "Your knife is more exact than the scales.",
      ja: "はかりより正確な包丁。",
    },
    most: 0,
    name: { en: "Divine hand", ja: "神業" },
    seal: ["神", "業"],
  },
  {
    line: {
      en: "The cutting board is yours now.",
      ja: "今日から、まな板はあなたのもの。",
    },
    most: 3,
    name: { en: "Head chef", ja: "板長" },
    seal: ["板", "長"],
  },
  {
    line: {
      en: "Good enough to serve to customers.",
      ja: "お客さんに出せる切り口。",
    },
    most: 10,
    name: { en: "Itamae", ja: "板前" },
    seal: ["板", "前"],
  },
  {
    line: {
      en: "You've got the grip. Now the aim.",
      ja: "包丁の持ち方は、もう大丈夫。",
    },
    most: 30,
    name: { en: "Apprentice", ja: "見習い" },
    seal: ["見", "習"],
  },
  {
    line: {
      en: "Maybe start with the dishes.",
      ja: "まずは、皿洗いから。",
    },
    most: 80,
    name: { en: "Dishwasher", ja: "皿洗い" },
    seal: ["皿", "洗"],
  },
  {
    line: {
      en: "This is how sibling fights start.",
      ja: "これは、きょうだいげんかになる。",
    },
    most: 200,
    name: { en: "Sibling feud", ja: "兄弟げんか" },
    seal: ["喧", "嘩"],
  },
  offcut,
];

export const rankOf = (small: number) =>
  ranks.find((rank) => errorOf(small) <= rank.most) ?? offcut;

export const tenths = (value: number) => (value / 10).toFixed(1);

export const ratioText = (small: number) =>
  `${tenths(small)} : ${tenths(1000 - small)}`;

const kindNames: Record<Kind, Text> = {
  castella: { en: "castella", ja: "カステラ" },
  chikuwa: { en: "chikuwa", ja: "ちくわ" },
  daifuku: { en: "daifuku", ja: "大福" },
  dango: { en: "three-colour dango", ja: "三色団子" },
  dorayaki: { en: "dorayaki", ja: "どら焼き" },
  ebiten: { en: "prawn tempura", ja: "海老天" },
  edamame: { en: "edamame", ja: "枝豆" },
  fuji: { en: "Mount Fuji nerikiri", ja: "富士山の練り切り" },
  gyoza: { en: "gyōza", ja: "餃子" },
  kagami: { en: "kagami mochi", ja: "鏡餅" },
  kaki: { en: "persimmon", ja: "柿" },
  kamaboko: { en: "kamaboko", ja: "かまぼこ" },
  kashiwa: { en: "kashiwa mochi", ja: "柏餅" },
  kintai: { en: "golden taiyaki", ja: "金の鯛焼き" },
  kuri: { en: "chestnut", ja: "栗" },
  maki: { en: "maki rolls", ja: "海苔巻き" },
  matsutake: { en: "matsutake", ja: "松茸" },
  mikan: { en: "mikan segment", ja: "みかんひと房" },
  naruto: { en: "naruto", ja: "なると" },
  nasu: { en: "aubergine", ja: "茄子" },
  neko: { en: "cat wagashi", ja: "猫の和菓子" },
  nerikiri: { en: "nerikiri", ja: "練り切り" },
  nikan: { en: "pair of sushi", ja: "寿司二貫" },
  ninjin: { en: "carrot flower", ja: "花形にんじん" },
  onigiri: { en: "onigiri", ja: "おにぎり" },
  rakugan: { en: "rakugan", ja: "落雁" },
  sanma: { en: "grilled saury", ja: "秋刀魚" },
  senbei: { en: "senbei", ja: "おせんべい" },
  sushi: { en: "sushi", ja: "寿司" },
  taiyaki: { en: "taiyaki", ja: "鯛焼き" },
  takenoko: { en: "bamboo shoot", ja: "筍" },
  tofu: { en: "tofu", ja: "豆腐" },
  yakitori: { en: "yakitori", ja: "焼き鳥" },
  yokan: { en: "yōkan", ja: "羊羹" },
};

const kindName = (kind: Kind, lang: Lang) => kindNames[kind][lang];

export const kindTitle = (kind: Kind, lang: Lang) => {
  const name = kindName(kind, lang);
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`;
};

export const pieceOf = (result: Result): Piece | null => {
  const food = dishOf(result.seed);
  const split = splitBy(food.parts, result.cut);
  return split === null ? null : { cut: result.cut, food, split };
};

const NUMBER = /^(?:0|-?[1-9]\d{0,4})$/u;

const cutText = z
  .string()
  .max(13)
  .transform((text, context) => {
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
  })
  .pipe(
    z.object({
      angle: z
        .number()
        .int()
        .min(0)
        .max(ANGLES - 1),
      offset: z.number().int().min(-REACH).max(REACH),
    })
  );

const shared = z
  .object({
    c: cutText,
    s: z
      .string()
      .regex(/^[1-9]\d{0,9}$/u)
      .transform(Number)
      .pipe(z.number().int().min(1).max(SEED_MAX)),
  })
  .transform(({ c, s }) => ({ cut: c, seed: s }))
  .refine((result) => pieceOf(result) !== null);

export const readResult = (
  params: Record<string, string | string[] | undefined>
): Result | null => {
  const parsed = shared.safeParse(params);
  return parsed.success ? parsed.data : null;
};

export const queryOf = (result: Result) =>
  new URLSearchParams({
    c: `${result.cut.angle}.${result.cut.offset}`,
    s: String(result.seed),
  }).toString();

const lineOf = (piece: Piece, lang: Lang) => {
  const { small } = piece.split;
  const ratio = ratioText(small);
  const off = tenths(errorOf(small));
  const rank = rankOf(small).name[lang];
  const name = kindName(piece.food.kind, lang);
  const rare = isRare(piece.food.kind);
  if (lang === "en") {
    return [
      rare ? `✨ A rare one: ${name}!` : null,
      `Ittō, one straight cut: ${ratio} on the ${name} (${rank})`,
      `${off}% off half. Can you cut this one closer?`,
    ];
  }
  return [
    rare ? `✨ レアの${name}が出た！` : null,
    `一刀で${name}を切ったら ${ratio}（${rank}）`,
    `半分からのズレ${off}%。同じのを、もっと半分に切れる？`,
  ];
};

export const shareOf = (
  result: Result,
  piece: Piece,
  origin: string,
  lang: Lang
): Share => {
  const query = new URLSearchParams(queryOf(result));
  query.set("l", lang);
  return {
    image: `${origin}/games/itto/og?${query.toString()}`,
    text: [
      ...lineOf(piece, lang).filter((line) => line !== null),
      lang === "en" ? "#一刀 #Itto" : "#一刀",
    ].join("\n"),
    url: `${origin}/games/itto?${query.toString()}`,
  };
};

export const demoOf = (round: number) => {
  const roll = seeded(4099 + round * 31);
  const food = foodOf(kinds[(round * 7 + 6) % kinds.length], 1 + round * 977);
  const angle = Math.floor(roll() * ANGLES);
  const offset = halving(food.parts, angle) + Math.round((roll() - 0.5) * 120);
  const cut = { angle, offset };
  return { cut, food, split: splitBy(food.parts, cut) };
};
