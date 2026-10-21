import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { Flaw } from "./score";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  best: string;
  draws: (count: number) => string;
  mute: string;
  model: string;
  hint: { title: string; sub: string };
  miss: string;
  challenge: { received: string; dare: string };
  result: ShareLabels & {
    record: string;
    again: string;
    games: string;
    maker: string;
    top: string;
    next: (rank: string, gap: string) => string;
    won: (gap: string) => string;
    lost: (gap: string) => string;
    tied: string;
    flaws: Record<Flaw, string>;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    best: "Best",
    challenge: { dare: "Can you draw a rounder one?", received: "Challenge" },
    draws: (count) => `${count} ${count === 1 ? "circle" : "circles"} drawn`,
    fallback:
      "A one-stroke circle drawing game. Draw a circle on the paper with a mouse, finger or pen in one stroke, and let go to see how close it is to a perfect circle, scored as a percentage. Drawing needs a pointer, so it can't be played with the keyboard alone. The buttons for sound, language and the result can all be reached with the Tab key.",
    hint: {
      sub: "Let go to score it. The rounder, the higher.",
      title: "Draw a circle in one stroke",
    },
    miss: "Go all the way around",
    model: "Example",
    mute: "Mute sound",
    name: "Ensō",
    result: {
      again: "Draw again",
      copied: "Copied",
      copyLink: "Copy link",
      flaws: {
        loops: "Stop after one lap",
        open: "Close the gap between the start and the end",
        partial: "Go all the way around",
        short: "Draw a full circle in one stroke",
        small: "Go bigger",
        wobbly: "Slow down and keep it smooth",
      },
      games: "More games",
      lost: (gap) => `${gap} short of the challenge`,
      maker: "About the maker",
      next: (rank, gap) => `${gap} to ${rank}`,
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      tied: "A tie with the challenge",
      top: "The highest rank",
      won: (gap) => `Beat the challenge by ${gap}`,
    },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: "自己ベスト",
    challenge: { dare: "これより丸く描ける？", received: "挑戦状" },
    draws: (count) => `${count}回描いた`,
    fallback:
      "一筆で円を描いて、真円にどれだけ近いかを％で出すゲーム。紙の上にマウスか指かペンで円を一筆で描き、離すと採点される。描くにはポインター操作が必要で、キーボードだけでは描けない。音、言語、結果のボタンはTabキーで選べる。",
    hint: {
      sub: "離すと採点。真円に近いほど高得点",
      title: "一筆で、まるを描く",
    },
    miss: "ぐるっと一周、描いてみて",
    model: "お手本",
    mute: "音を消す",
    name: "円相",
    result: {
      again: "もう一回",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      flaws: {
        loops: "一周で止めよう",
        open: "始点と終点をつなげよう",
        partial: "ぐるっと一周しよう",
        short: "一筆で円を描いてみて",
        small: "もっと大きく描こう",
        wobbly: "ゆっくり、なめらかに",
      },
      games: "ほかのゲーム",
      lost: (gap) => `挑戦状まで、あと${gap}`,
      maker: "つくった人",
      next: (rank, gap) => `${rank}まで、あと${gap}`,
      postX: "Xに投稿",
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      tied: "挑戦状と引き分け",
      top: "最高の段位",
      won: (gap) => `挑戦状に${gap}差で勝った`,
    },
  },
};
