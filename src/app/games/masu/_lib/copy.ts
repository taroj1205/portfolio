import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { Bottle, Cup } from "./pour";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  mute: string;
  tension: string;
  rim: string;
  demo: string;
  bottles: Record<Bottle, string>;
  cups: Record<Cup, string>;
  mokkiri: string;
  spilled: string;
  rule: {
    lead: string;
    body: string;
    start: string;
    keys: string;
  };
  best: (tenths: string, pours: number) => string;
  interrupted: string;
  challenge: {
    received: string;
    dare: string;
    target: (score: string) => string;
    won: (gap: string) => string;
    lost: (gap: string) => string;
    tied: string;
    bothSpilled: string;
  };
  result: ShareLabels & {
    record: string;
    stopped: (mm: string, ml: number) => string;
    lost: (ml: number) => string;
    released: (time: string) => string;
    overflowed: (time: string) => string;
    again: string;
    games: string;
    maker: string;
    star: string;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    best: (tenths, pours) =>
      `Best ${tenths}% · ${pours} ${pours === 1 ? "pour" : "pours"}`,
    bottles: {
      isshobin: "Isshōbin bottle",
      katakuchi: "Katakuchi bowl",
      tokkuri: "Tokkuri flask",
    },
    challenge: {
      dare: "Same pour. Your turn.",
      lost: (gap) => `${gap} points short of the challenge`,
      received: "Challenge",
      bothSpilled: "They spilled it too",
      target: (score) => `Their pour ${score}`,
      tied: "Exactly level with the challenge",
      won: (gap) => `Beat the challenge by ${gap} points`,
    },
    cups: { masu: "Masu", mokkiri: "Mokkiri" },
    demo: "Demo",
    fallback:
      "A game about pouring sake into a wooden masu cup, one pour at a time. Sake pours while you press the screen and stops when you let go, though it keeps trickling for a moment. The score is how far above the rim surface tension holds it, and past a hidden limit it spills. You can also hold Space.",
    interrupted: "You left the screen, so the pour stopped there",
    mokkiri: "The glass is meant to overflow. The masu's rim is what counts.",
    mute: "Mute sound",
    name: "Masu",
    result: {
      again: "Pour again",
      copied: "Copied",
      copyLink: "Copy link",
      games: "More games",
      lost: (ml) => `${ml} ml on the table`,
      maker: "About the maker",
      postX: "Post on X",
      record: "New best",
      overflowed: (time) => `Overflowed at ${time}s, still pouring`,
      released: (time) => `Let go at ${time}s`,
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      stopped: (mm, ml) => `${mm} mm from the rim · ${ml} ml`,
    },
    rim: "From the rim",
    rule: {
      body: "One pour. Sake keeps trickling for a moment after you let go, so stop before the swelling surface spills over the rim.",
      keys: "Or hold Space",
      lead: "Pouring is easy. Letting go is the hard part.",
      start: "Press and hold to pour",
    },
    spilled: "Spilled",
    tension: "Surface tension",
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (tenths, pours) => `自己ベスト ${tenths}% · ${pours}杯`,
    bottles: { isshobin: "一升瓶", katakuchi: "片口", tokkuri: "徳利" },
    challenge: {
      dare: "同じ一杯で勝負",
      lost: (gap) => `挑戦状まで あと${gap}ポイント`,
      received: "挑戦状",
      bothSpilled: "相手もこぼしていた",
      target: (score) => `相手の一杯 ${score}`,
      tied: "挑戦状とまったく同じ",
      won: (gap) => `挑戦状を${gap}ポイント上回った`,
    },
    cups: { masu: "枡", mokkiri: "もっきり" },
    demo: "見本",
    fallback:
      "枡に酒を注ぐ、一杯勝負のゲーム。画面を押しているあいだ酒が注がれ、離すと止まる。ただし離しても、しばらく垂れ続ける。表面張力で縁より盛り上がった分が点数になり、見えない限界を超えるとこぼれる。スペースキーを押し続けても遊べる。",
    interrupted: "画面から離れたので、そこで注ぐのを止めた",
    mokkiri: "グラスからあふれるのはOK。勝負は枡の縁",
    mute: "音を消す",
    name: "枡",
    result: {
      again: "もう一杯注ぐ",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      games: "ほかのゲーム",
      lost: (ml) => `テーブルに ${ml}ml`,
      maker: "つくった人",
      postX: "Xに投稿",
      record: "自己ベスト",
      overflowed: (time) => `${time}秒で、持ったままあふれた`,
      released: (time) => `${time}秒で離した`,
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      stopped: (mm, ml) => `縁から ${mm}mm · ${ml}ml`,
    },
    rim: "縁から",
    rule: {
      body: "一杯勝負。離しても、酒はしばらくとくとく垂れる。表面張力でふくらんだ酒がこぼれる前に、早めに手を止めよう。",
      keys: "スペースキーでも注げる",
      lead: "注ぐのは簡単。むずかしいのは、離すとき。",
      start: "長押しで注ぐ",
    },
    spilled: "こぼれた",
    tension: "表面張力",
  },
};
