import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import { POURS } from "./pour";
import type { Bottle, Cup } from "./pour";
import type { Verdict } from "./result";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  mute: string;
  tension: string;
  rim: string;
  demo: string;
  turn: (index: number) => string;
  mark: (index: number) => string;
  bottles: Record<Bottle, string>;
  cups: Record<Cup, string>;
  mokkiri: string;
  verdicts: Record<Verdict, string>;
  spills: readonly string[];
  spilled: string;
  spill: string;
  rule: {
    lead: string;
    body: string;
    start: string;
    keys: string;
    next: string;
  };
  best: (average: string, runs: number) => string;
  interrupted: string;
  pours: string;
  challenge: {
    received: string;
    dare: string;
    target: (average: string) => string;
    won: (gap: string) => string;
    lost: (gap: string) => string;
    tied: string;
  };
  result: ShareLabels & {
    average: string;
    record: string;
    clean: string;
    poured: (kept: number, spilled: number) => string;
    again: string;
    games: string;
    maker: string;
    star: string;
  };
}

const KANJI = ["一", "二", "三", "四", "五"];

const cupful = (index: number) => `${KANJI[index] ?? index + 1}杯目`;

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    best: (average, runs) =>
      `Best average ${average}% · ${runs} ${runs === 1 ? "run" : "runs"}`,
    bottles: {
      isshobin: "Isshōbin bottle",
      katakuchi: "Katakuchi bowl",
      tokkuri: "Tokkuri flask",
    },
    challenge: {
      dare: "Same five pours. Your turn.",
      lost: (gap) => `${gap} points short of the challenge`,
      received: "Challenge",
      target: (average) => `Their average ${average}%`,
      tied: "Exactly level with the challenge",
      won: (gap) => `Beat the challenge by ${gap} points`,
    },
    cups: { masu: "Masu", mokkiri: "Mokkiri" },
    demo: "Demo",
    fallback:
      "A game about pouring sake into a wooden masu cup. Sake pours while you press the screen and stops when you let go, though it keeps trickling for a moment. The score is how far above the rim surface tension holds it, and past a hidden limit it spills. Your average over five pours counts. You can also hold Space.",
    interrupted: "You left the screen, so the pour stopped there",
    mokkiri: "The glass is meant to overflow. The masu's rim is what counts.",
    mute: "Mute sound",
    name: "Masu",
    pours: "Your five pours",
    result: {
      again: "Pour again",
      average: "Average surface tension",
      clean: "Not a drop spilled",
      copied: "Copied",
      copyLink: "Copy link",
      games: "More games",
      maker: "About the maker",
      postX: "Post on X",
      poured: (kept, spilled) => `Kept ${kept} ml · spilled ${spilled} ml`,
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
    },
    rim: "From the rim",
    rule: {
      body: "Sake keeps trickling for a moment after you let go. Stop early, before the swelling surface spills over the rim.",
      keys: "Or hold Space",
      lead: "Pouring is easy. Letting go is the hard part.",
      next: "Press and hold for the next pour",
      start: "Press and hold to pour",
    },
    spill: "Spill",
    spilled: "Spilled",
    spills: [
      "What a waste. The table had a drink.",
      "Could we get a cloth over here?",
      "The surface tension finally gave up.",
      "Spilled sake isn't on the house.",
      "One drop too many.",
    ],
    tension: "Surface tension",
    mark: (index) => `#${index + 1}`,
    turn: (index) => `Pour ${index + 1} of ${POURS}`,
    verdicts: {
      after: "You let go, and it still spilled",
      brimming: "Brimming",
      brink: "Right at the edge",
      held: "Held on too long",
      room: "Room for more",
      short: "Short of the rim",
    },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (average, runs) => `自己ベスト 平均${average}% · ${runs}回`,
    bottles: { isshobin: "一升瓶", katakuchi: "片口", tokkuri: "徳利" },
    challenge: {
      dare: "同じ5杯で勝負",
      lost: (gap) => `挑戦状まで あと${gap}ポイント`,
      received: "挑戦状",
      target: (average) => `相手の平均 ${average}%`,
      tied: "挑戦状とまったく同じ",
      won: (gap) => `挑戦状を${gap}ポイント上回った`,
    },
    cups: { masu: "枡", mokkiri: "もっきり" },
    demo: "見本",
    fallback:
      "枡に酒を注ぐゲーム。画面を押しているあいだ酒が注がれ、離すと止まる。ただし離しても、しばらく垂れ続ける。表面張力で縁より盛り上がった分が点数になり、見えない限界を超えるとこぼれる。5杯の平均で競う。スペースキーを押し続けても遊べる。",
    interrupted: "画面から離れたので、そこで注ぐのを止めた",
    mokkiri: "グラスからあふれるのはOK。勝負は枡の縁",
    mute: "音を消す",
    name: "枡",
    pours: "5杯の結果",
    result: {
      again: "もう一回注ぐ",
      average: "平均 表面張力",
      clean: "一滴もこぼさず",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      games: "ほかのゲーム",
      maker: "つくった人",
      postX: "Xに投稿",
      poured: (kept, spilled) => `注いだ ${kept}ml · こぼした ${spilled}ml`,
      record: "自己ベスト",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
    },
    rim: "縁から",
    rule: {
      body: "離しても、酒はしばらくとくとく垂れる。表面張力でふくらんだ酒がこぼれる前に、早めに手を止めよう。",
      keys: "スペースキーでも注げる",
      lead: "注ぐのは簡単。むずかしいのは、離すとき。",
      next: "長押しで次の一杯",
      start: "長押しで注ぐ",
    },
    spill: "こぼれ",
    spilled: "こぼれた",
    spills: [
      "もったいない。テーブルが一杯やった。",
      "おしぼり、ください。",
      "表面張力が、ついに折れた。",
      "こぼした分は、店のおごり…ではない。",
      "あと一滴が、多かった。",
    ],
    tension: "表面張力",
    mark: cupful,
    turn: cupful,
    verdicts: {
      after: "離したのに、あふれた",
      brimming: "なみなみ",
      brink: "ぎりぎり",
      held: "注ぎすぎた",
      room: "まだ攻められる",
      short: "縁に届かず",
    },
  },
};
