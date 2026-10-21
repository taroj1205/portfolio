import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";

interface Copy {
  name: string;
  reading: string;
  fallback: string;
  back: string;
  mute: string;
  best: (pounds: string, tempo: string) => string;
  stats: (runs: number) => string;
  rule: {
    lead: string;
    body: string;
    start: string;
  };
  meter: { pounds: string; tempo: string; lives: string };
  challenge: {
    received: string;
    dare: string;
  };
  ending: { hand: string; miss: string };
  result: ShareLabels & {
    record: string;
    more: (rank: string, more: number) => string;
    top: string;
    tempo: (tempo: string) => string;
    greats: (greats: number) => string;
    won: string;
    lost: string;
    tied: string;
    again: string;
    games: string;
    maker: string;
    star: string;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    best: (pounds, tempo) => `Best ${pounds} · up to ${tempo}`,
    challenge: {
      dare: "Can you pound more?",
      received: "Challenge",
    },
    ending: {
      hand: "You hit your partner's hand",
      miss: "You lost the beat",
    },
    fallback:
      "A rhythm game about pounding mochi. Tap on the beat to bring the mallet down while your partner turns the mochi between beats. The tempo rises every eight beats. Tap while your partner's hand is in the mortar and it's over, and three missed beats end the run too. Pound as many times as you can.",
    meter: { lives: "Misses left", pounds: "Hits", tempo: "BPM" },
    mute: "Mute sound",
    name: "Mochitsuki",
    reading: "Mochitsuki",
    result: {
      again: "Pound again",
      copied: "Copied",
      copyLink: "Copy link",
      games: "More games",
      greats: (greats) => `${greats} right on the beat`,
      lost: "The challenge did better",
      maker: "About the maker",
      more: (rank, more) => `${more} more for ${rank}`,
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      tempo: (tempo) => `Up to ${tempo}`,
      tied: "Exactly level with the challenge",
      top: "No finer mochi than this",
      won: "You beat the challenge",
    },
    rule: {
      body: "Your partner turns it between beats. Tap then, and you hit their hand.",
      lead: "Tap on the beat to pound",
      start: "Tap to start",
    },
    stats: (runs) => `${runs} ${runs === 1 ? "run" : "runs"}`,
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (pounds, tempo) => `ベスト ${pounds} · 最高 ${tempo}`,
    challenge: {
      dare: "これより多くつける？",
      received: "挑戦状",
    },
    ending: {
      hand: "相方の手をついた",
      miss: "リズムが崩れた",
    },
    fallback:
      "餅つきのリズムゲーム。拍に合わせてタップすると、杵が落ちる。拍と拍のあいだは、相方が餅を返している。そのときにつくと手をついて終わり。拍を3回のがしても終わる。8拍ごとにテンポが上がっていくなかで、何回つけるかを競う。",
    meter: { lives: "のこり", pounds: "回数", tempo: "BPM" },
    mute: "音を消す",
    name: "餅つき",
    reading: "もちつき",
    result: {
      again: "もう一臼",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      games: "ほかのゲーム",
      greats: (greats) => `ぴったり ${greats}回`,
      lost: "挑戦状のほうが上",
      maker: "つくった人",
      more: (rank, more) => `${rank}まで、あと${more}回`,
      postX: "Xに投稿",
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      tempo: (tempo) => `最高 ${tempo}`,
      tied: "挑戦状とまったく同じ",
      top: "これ以上の仕上がりはない",
      won: "挑戦状に勝った",
    },
    rule: {
      body: "拍のあいだは相方が返す。そこでつくと、手をつく。",
      lead: "拍に合わせて、つく",
      start: "タップでスタート",
    },
    stats: (runs) => `${runs}臼`,
  },
};
