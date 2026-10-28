import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import { CORKS } from "./stall";

interface Copy {
  name: string;
  reading: string;
  fallback: string;
  back: string;
  mute: string;
  best: (points: string) => string;
  found: (found: number, total: number) => string;
  rule: {
    lead: string;
    body: string;
    start: string;
  };
  meter: { score: string; corks: string; unit: string };
  challenge: {
    received: string;
    dare: string;
  };
  result: ShareLabels & {
    record: string;
    first: (prize: string) => string;
    prizes: string;
    haul: (count: number) => string;
    none: string;
    more: (rank: string, points: string) => string;
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
    best: (points) => `Your best: ${points}`,
    challenge: {
      dare: "Can you knock down more?",
      received: "Challenge",
    },
    fallback: `A festival shooting gallery game. Prizes stand on three shelves, and you have ${CORKS} corks. Press and hold to aim the cork rifle, and let go to fire. The longer you hold, the harder it shoots, but hold too long and the sights start to sway. A prize rocks more the higher and harder you hit it, and small ones tip over from a hit near the top. Big prizes won't budge from a hit in the middle. Hit a top corner and they twist back a little, and after a few they drop off the shelf. Every prize you knock down lines up on the counter at the end.`,
    found: (found, total) => `${found} of ${total} prizes`,
    meter: { corks: "Corks", score: "Score", unit: "pts" },
    mute: "Mute sound",
    name: "Kadouchi Cork",
    reading: "Kadouchi Cork",
    result: {
      again: "Another round",
      copied: "Copied",
      copyLink: "Copy link",
      first: (prize) => `First ${prize}`,
      games: "More games",
      haul: (count) => `${count} prizes`,
      lost: "The challenge knocked down more",
      maker: "About the maker",
      more: (rank, points) => `${points} more for ${rank}`,
      none: "Nothing fell this time",
      postX: "Post on X",
      prizes: "Prizes",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      tied: "Exactly level with the challenge",
      top: "Every prize is yours",
      won: "You beat the challenge",
    },
    rule: {
      body: "Hold to aim, let go to fire. Hit high to tip the small ones. The big ones only move when you hit a top corner.",
      lead: "Knock the prizes off the shelf",
      start: "Press and hold to aim",
    },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (points) => `ベスト ${points}`,
    challenge: {
      dare: "これより多く倒せる？",
      received: "挑戦状",
    },
    fallback: `お祭りの射的のゲーム。三段の棚に景品が並んでいて、コルクは${CORKS}発。押しているあいだコルク銃で狙って、離すと撃つ。長く押すほど強く飛ぶけど、押しすぎると照準が揺れる。景品は、高いところに強く当てるほど大きく揺れて、小さいものは上のほうに当てると倒れる。大物は真ん中に当ててもびくともしない。上の角に当てると少しずつねじれて下がり、何発か当てると棚から落ちる。倒した景品は、最後に台に並ぶ。`,
    found: (found, total) => `景品 ${found}/${total}`,
    meter: { corks: "コルク", score: "点数", unit: "点" },
    mute: "音を消す",
    name: "角撃ちコルク",
    reading: "かどうちコルク",
    result: {
      again: "もう一回",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      first: (prize) => `はじめての${prize}`,
      games: "ほかのゲーム",
      haul: (count) => `景品${count}個`,
      lost: "挑戦状のほうが多く倒した",
      maker: "つくった人",
      more: (rank, points) => `${rank}まで、あと${points}`,
      none: "今回は何も倒れなかった",
      postX: "Xに投稿",
      prizes: "倒した景品",
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      tied: "挑戦状とまったく同じ",
      top: "景品はぜんぶ取った",
      won: "挑戦状に勝った",
    },
    rule: {
      body: "押して狙って、離して撃つ。小さい景品は上を狙う。大物は上の角に当てないと動かない。",
      lead: "棚の景品を撃ち落とす",
      start: "押して、狙う",
    },
  },
};
