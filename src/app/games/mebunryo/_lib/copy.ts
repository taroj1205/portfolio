import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { Kind } from "./puzzles";

export type Verdict = "eagle" | "sharp" | "fair" | "off";

export type Rank = "ruler" | "craft" | "good" | "training";

export const READING = "めぶんりょうじゅうばんしょうぶ";

interface Copy {
  name: string;
  back: string;
  mute: string;
  pitch: string;
  tagline: string;
  board: string;
  round: (index: number, total: number) => string;
  ask: Record<Kind, string>;
  hint: Record<"point" | "ray", string>;
  lock: string;
  next: string;
  finish: string;
  verdict: Record<Verdict, string>;
  points: (points: number) => string;
  challenge: {
    received: string;
    target: (points: number) => string;
    them: string;
    won: string;
    lost: string;
    tied: string;
  };
  result: ShareLabels & {
    rank: Record<Rank, string>;
    total: string;
    best: (points: number) => string;
    record: string;
    you: string;
    answer: string;
    again: string;
    games: string;
    maker: string;
    star: string;
  };
  share: {
    line: (points: number) => string;
    dare: string;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    ask: {
      apex: "The third point of an equilateral triangle",
      centre: "The centre of the circle",
      centroid: "The balance point of the triangle",
      length: "As long as the gold line, along the dotted one",
      middle: "The exact middle of the line",
      parallel: "A line through the dot, parallel to the other",
      right: "A right angle from the dot",
      square: "The fourth corner of the square",
      third: "One third of the way from the dot",
      wall: "Where the line would hit the gold wall",
    },
    back: "Back to games",
    board:
      "Puzzle board. Drag to place your mark, or move it with the arrow keys",
    challenge: {
      lost: "They win this time",
      received: "Challenge",
      target: (points) => `Same ten puzzles. Beat ${points} points`,
      them: "Them",
      tied: "A draw",
      won: "You win!",
    },
    finish: "See results",
    hint: {
      point: "Drag to place your mark, then lock it in",
      ray: "Drag to aim the line, then lock it in",
    },
    lock: "Lock it in",
    mute: "Mute sound",
    name: "Ten Rounds by Eye",
    next: "Next",
    pitch:
      "Ten puzzles, no ruler. Find the middle, the centre, a right angle and more by eye alone.",
    points: (points) => `${points} pts`,
    tagline: "Ten puzzles, by eye alone",
    result: {
      again: "New ten",
      answer: "Answer",
      best: (points) => `Best ${points}`,
      copied: "Copied",
      copyLink: "Copy link",
      games: "More games",
      maker: "About the maker",
      postX: "Post on X",
      rank: {
        craft: "A craftsman's eye",
        good: "A good eye",
        ruler: "Who needs a ruler?",
        training: "Still in training",
      },
      record: "New best",
      saveImage: "Save image",
      share: "Challenge a friend",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      total: "out of 1000",
      you: "You",
    },
    round: (index, total) => `${index} / ${total}`,
    share: {
      dare: "Same ten puzzles. Can you beat it?",
      line: (points) => `Ten Rounds by Eye: ${points}/1000`,
    },
    verdict: {
      eagle: "Eagle eye!",
      fair: "Not bad",
      off: "Way off",
      sharp: "Sharp!",
    },
  },
  ja: {
    ask: {
      apex: "正三角形になる3つ目の点",
      centre: "円の中心",
      centroid: "三角形の重心",
      length: "金色の線と同じ長さを、点線の上に",
      middle: "線のちょうど真ん中",
      parallel: "点を通って、もう1本と平行な線",
      right: "点から直角に線を引く",
      square: "正方形の4つ目の角",
      third: "点のある端から3分の1のところ",
      wall: "線をのばすと、金色の壁のどこに当たる？",
    },
    back: "ゲーム一覧にもどる",
    board: "問題の図。なぞって印を置くか、矢印キーで動かす",
    challenge: {
      lost: "今回は相手の勝ち",
      received: "挑戦状",
      target: (points) => `同じ10問で${points}点をこえられる？`,
      them: "相手",
      tied: "引き分け",
      won: "勝った！",
    },
    finish: "結果を見る",
    hint: {
      point: "なぞって印を置いて、決定",
      ray: "なぞって線の向きを決めて、決定",
    },
    lock: "これで決定",
    mute: "音を消す",
    name: "目分量十番勝負",
    next: "次へ",
    pitch: "定規なしの10問。真ん中、中心、直角を目だけで当てる。",
    points: (points) => `${points}点`,
    tagline: "目だけで当てる10問",
    result: {
      again: "新しい10問",
      answer: "正解",
      best: (points) => `ベスト ${points}点`,
      copied: "コピーした",
      copyLink: "リンクをコピー",
      games: "ほかのゲーム",
      maker: "つくった人",
      postX: "Xに投稿",
      rank: {
        craft: "職人の目",
        good: "なかなかの目",
        ruler: "定規いらず",
        training: "まだ修行中",
      },
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "友だちに挑戦",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      total: "1000点中",
      you: "自分",
    },
    round: (index, total) => `${index} / ${total}`,
    share: {
      dare: "同じ10問で勝負しよう",
      line: (points) => `目分量十番勝負 ${points}点`,
    },
    verdict: {
      eagle: "神の目！",
      fair: "まあまあ",
      off: "ずれてる",
      sharp: "いい目！",
    },
  },
};
