import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { End } from "./stretch";

export type Feel = "loose" | "slack" | "sweet" | "tight";

interface Copy {
  name: string;
  reading: string;
  fallback: string;
  back: string;
  mute: string;
  today: string;
  dish: string;
  rule: { lead: string; body: string; start: string; keys: string };
  best: (length: string) => string;
  interrupted: string;
  feel: Record<Feel, string>;
  heat: string;
  strands: string;
  next: (name: string, length: string) => string;
  shout: Record<End, string>;
  marks: { best: string; challenge: string };
  challenge: { received: string; dare: string; passed: string };
  record: string;
  result: ShareLabels & {
    ends: Record<End, string>;
    record: string;
    moon: string;
    again: string;
    games: string;
    maker: string;
    star: string;
    next: (name: string, length: string) => string;
    won: (length: string) => string;
    lost: (length: string) => string;
    tied: string;
    sweet: (seconds: string) => string;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    best: (length) => `Your best ${length}`,
    challenge: {
      dare: "Same dish. Pull it further.",
      passed: "Past the challenge!",
      received: "Challenge",
    },
    fallback:
      "A cheese pulling game. Drag upwards anywhere on the screen to lift the food and stretch the cheese. Pull too fast and the strands snap one by one. Pull too slowly and the cheese cools and sets. Keep the pull in the golden zone, just under the limit, and the cheese stays warm for longer. The longer it gets, the further the camera pulls back, past Tokyo Tower and Mt Fuji and out into space. You can also hold Space or the up arrow.",
    feel: {
      loose: "Grab it and keep pulling",
      slack: "Pull harder",
      sweet: "Golden",
      tight: "It's tearing!",
    },
    heat: "Heat",
    interrupted: "Interrupted, so that one didn't count",
    marks: { best: "Your best", challenge: "Challenge" },
    mute: "Mute sound",
    name: "Cheese to the Moon",
    next: (name, length) => `${name} in ${length}`,
    reading: "Cheese to the Moon",
    record: "New best!",
    result: {
      again: "Pull again",
      copied: "Copied",
      copyLink: "Copy link",
      ends: {
        moon: "The Moon was made of cheese",
        set: "It cooled and set",
        snapped: "The last strand snapped",
      },
      games: "More games",
      lost: (length) => `${length} short of the challenge`,
      maker: "About the maker",
      moon: "Reached the Moon",
      next: (name, length) => `${length} more to ${name}`,
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      sweet: (seconds) => `${seconds}s in the golden zone`,
      tied: "Exactly the challenge length",
      won: (length) => `Beat the challenge by ${length}`,
    },
    rule: {
      body: "Too fast and it snaps. Too slow and it sets. Keep it glowing gold and it stays hot.",
      keys: "Or hold Space",
      lead: "Pull the cheese all the way to the Moon",
      start: "Drag up to pull",
    },
    shout: {
      moon: "It's cheese!",
      set: "Set solid",
      snapped: "Snap!",
    },
    strands: "Strands",
    today: "Today's dish",
    dish: "Dish",
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (length) => `自己ベスト ${length}`,
    challenge: {
      dare: "同じ料理で、もっとのばせ",
      passed: "挑戦状を超えた！",
      received: "挑戦状",
    },
    fallback:
      "チーズをのばすゲーム。画面のどこでも上になぞると、料理が持ち上がってチーズがのびる。速すぎると糸が一本ずつちぎれて、遅すぎるとチーズが冷めて固まる。限界の少し手前、金色に光る速さで引くと冷めにくい。のびるほどカメラが引いていって、東京タワー、富士山、宇宙の先まで行ける。スペースキーか上キーを押し続けても遊べる。",
    feel: {
      loose: "つかみ直して、引いて",
      slack: "もっと引ける",
      sweet: "金色キープ",
      tight: "ちぎれる！",
    },
    heat: "温度",
    interrupted: "途中で止まったので、今のはなしにした",
    marks: { best: "自己ベスト", challenge: "挑戦状" },
    mute: "音を消す",
    name: "月までチーズ",
    next: (name, length) => `${name}まで ${length}`,
    reading: "つきまでチーズ",
    record: "自己ベスト更新！",
    result: {
      again: "もう一回のばす",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      ends: {
        moon: "月はチーズでできていた",
        set: "冷めて固まった",
        snapped: "最後の一本がちぎれた",
      },
      games: "ほかのゲーム",
      lost: (length) => `挑戦状まであと${length}`,
      maker: "つくった人",
      moon: "月に到達",
      next: (name, length) => `${name}まであと${length}`,
      postX: "Xに投稿",
      record: "自己ベスト",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      sweet: (seconds) => `金色ゾーン ${seconds}秒`,
      tied: "挑戦状とまったく同じ長さ",
      won: (length) => `挑戦状より${length}のびた`,
    },
    rule: {
      body: "速すぎるとちぎれて、遅すぎると固まる。金色に光る速さで引くと、冷めにくい。",
      keys: "スペースキー長押しでもいい",
      lead: "チーズを、月までのばせ",
      start: "上になぞって引く",
    },
    shout: {
      moon: "チーズだった！",
      set: "固まった",
      snapped: "ぷつん！",
    },
    strands: "糸",
    today: "今日のお題",
    dish: "お題",
  },
};
