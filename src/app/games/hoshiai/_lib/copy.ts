import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";

interface Copy {
  locale: string;
  name: string;
  fallback: string;
  points: string;
  back: string;
  best: string;
  next: string;
  mute: string;
  unmute: string;
  restart: string;
  hints: { aim: string; merge: string };
  chain: (count: number) => string;
  first: string;
  danger: string;
  found: (count: number, total: number) => string;
  challenge: { received: string; dare: string };
  over: string;
  result: ShareLabels & {
    record: string;
    galaxy: string;
    again: string;
    stats: (merges: number, chain: number) => string;
    games: string;
    maker: string;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    best: "Best",
    chain: (count) => `${count} chain!`,
    challenge: { dare: "Can you beat it?", received: "Challenge" },
    danger: "Overflowing!",
    fallback:
      "A star merging game. Drag around the ring to aim and let go to drop a star, or turn with the arrow keys and drop with Space. Matching stars merge into the next size up. The run ends when stars spill past the ring.",
    first: "New find",
    found: (count, total) => `${count} of ${total} found`,
    hints: {
      aim: "Drag to aim, let go to drop",
      merge: "Matching stars merge into the next one",
    },
    locale: "en-US",
    mute: "Mute sound",
    name: "Hoshiai",
    next: "Next",
    over: "It overflowed",
    points: "pts",
    restart: "Start over",
    result: {
      again: "Play again",
      copied: "Copied",
      copyLink: "Copy link",
      galaxy: "Milky Way",
      games: "More games",
      maker: "Made by",
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      stats: (merges, chain) =>
        `${merges} ${merges === 1 ? "merge" : "merges"} · best chain ${chain}`,
    },
    unmute: "Turn sound on",
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: "最高",
    chain: (count) => `${count}連鎖！`,
    challenge: { dare: "これ、超えられる？", received: "挑戦状" },
    danger: "あふれそう！",
    fallback:
      "星をくっつけて大きくしていくゲーム。輪のまわりをなぞって向きを決め、離すと星が落ちる。矢印キーで向きを変えて、スペースキーで落とすこともできる。同じ星がふれると、ひとつ上の星になる。星が輪からあふれたら終わり。",
    first: "はじめての",
    found: (count, total) => `${total}個中${count}個みつけた`,
    hints: {
      aim: "なぞって向きを決めて、離すと落ちる",
      merge: "同じ星がふれると、ひとつ上の星になる",
    },
    locale: "ja-JP",
    mute: "音を消す",
    name: "星合",
    next: "つぎ",
    over: "あふれた",
    points: "点",
    restart: "最初から",
    result: {
      again: "もう一回",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      galaxy: "天の川",
      games: "ほかのゲーム",
      maker: "つくった人",
      postX: "Xに投稿",
      record: "自己ベスト",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      stats: (merges, chain) => `合体 ${merges}回 · 最大 ${chain}連鎖`,
    },
    unmute: "音を出す",
  },
};
