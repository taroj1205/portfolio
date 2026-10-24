import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";

interface Copy {
  name: string;
  reading: string;
  fallback: string;
  back: string;
  mute: string;
  best: (count: string) => string;
  found: (found: number, total: number) => string;
  rule: {
    lead: string;
    body: string;
    start: string;
  };
  meter: { caught: string; paper: string };
  challenge: {
    received: string;
    dare: string;
    beat: string;
  };
  result: ShareLabels & {
    record: string;
    first: (kind: string) => string;
    more: (rank: string, count: number) => string;
    biggest: (count: number) => string;
    catch: string;
    top: string;
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
    best: (count) => `Your best: ${count}`,
    challenge: {
      beat: "Can you catch even one?",
      dare: "Can you scoop more?",
      received: "Challenge",
    },
    fallback:
      "A goldfish scooping game from a summer festival stall. Press to dip a paper scoop into the tank right where you touch, and let go to lift it. A goldfish that swims onto the paper glows and comes up with it into your bowl, but dip right on top of one and it ends up under the paper. The paper weakens the longer it stays wet, the faster it moves through the water, and the heavier the catch, and when it tears the game is over. See how many you can scoop with one paper, and look out for rare black moors, golden goldfish and the old boss of the tank.",
    found: (found, total) => `${found} of ${total} kinds found`,
    meter: { caught: "Caught", paper: "Paper" },
    mute: "Mute sound",
    name: "One Poi Legend",
    reading: "One Poi Legend",
    result: {
      again: "New poi",
      biggest: (count) => `${count} in one scoop`,
      catch: "Your catch",
      copied: "Copied",
      copyLink: "Copy link",
      first: (kind) => `First ${kind}`,
      games: "More games",
      lost: "The challenge did better",
      maker: "About the maker",
      more: (rank, count) => `${count} more for ${rank}`,
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      tied: "Exactly level with the challenge",
      top: "It doesn't get better than this",
      won: "You beat the challenge",
    },
    rule: {
      body: "Dip just ahead of a goldfish and wait. When it swims onto the paper and glows, let go. Dip on top of one and it ends up under the paper.",
      lead: "Dip gently, lift gently",
      start: "Dip just ahead of a goldfish",
    },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (count) => `ベスト ${count}`,
    challenge: {
      beat: "1匹でもすくえる？",
      dare: "これより多くすくえる？",
      received: "挑戦状",
    },
    fallback:
      "夏祭りの屋台の、金魚すくいのゲーム。触れたところにポイが入り、離すとすくい上げる。紙の上に泳いできた金魚は光って、一緒にお椀に入るが、真上から入れると金魚は紙の下になる。水に浸けているほど、速く動かすほど、重い金魚をすくうほど紙は弱くなり、破れたらおしまい。ポイ一枚で何匹すくえるか。黒出目金や黄金の金魚、水槽の主にも出会えるかもしれない。",
    found: (found, total) => `図鑑 ${found}/${total}`,
    meter: { caught: "すくった", paper: "ポイ" },
    mute: "音を消す",
    name: "ポイ一枚伝説",
    reading: "ぽいいちまいでんせつ",
    result: {
      again: "もう一枚",
      biggest: (count) => `一度に${count}匹`,
      catch: "すくった金魚",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      first: (kind) => `はじめての${kind}`,
      games: "ほかのゲーム",
      lost: "挑戦状のほうが上",
      maker: "つくった人",
      more: (rank, count) => `${rank}まで、あと${count}匹`,
      postX: "Xに投稿",
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      tied: "挑戦状とまったく同じ",
      top: "これ以上はない",
      won: "挑戦状に勝った",
    },
    rule: {
      body: "金魚の進む先にポイを入れて待つ。紙に乗って光ったら離す。真上から入れると、金魚は紙の下。",
      lead: "そっと入れて、そっとすくう",
      start: "金魚の進む先にポイを入れる",
    },
  },
};
