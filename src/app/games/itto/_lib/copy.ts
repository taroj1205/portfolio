import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { Fumble } from "./session";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  mute: string;
  demo: string;
  rare: string;
  rule: { lead: string; body: string; keys: string };
  start: string;
  record: (off: string, cuts: number) => string;
  hint: string;
  fumble: Record<Fumble, string>;
  quit: string;
  challenge: {
    received: string;
    dare: string;
    accept: string;
    retry: string;
    won: (gap: string) => string;
    lost: (gap: string) => string;
    tied: string;
  };
  result: ShareLabels & {
    off: (off: string) => string;
    record: string;
    again: string;
    games: string;
    maker: string;
    star: string;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    challenge: {
      accept: "Cut the same piece",
      dare: "Same piece, same board. Can you cut it closer to half?",
      lost: (gap) => `${gap}% further off than the challenge`,
      received: "Challenge",
      retry: "Try that piece again",
      tied: "Exactly as close as the challenge",
      won: (gap) => `${gap}% closer than the challenge`,
    },
    demo: "Demo",
    fallback:
      "A cutting game. Swipe one straight line across a piece of Japanese food to cut it in two, and try to make both pieces exactly the same size. The split is measured by area to one decimal place, so a perfect cut is 50.0 : 50.0. There are over thirty foods, from tofu and taiyaki to a skewer of dango, every piece is shaped a little differently, and now and then a rare one turns up.",
    fumble: {
      miss: "Missed. Swipe across the food",
      partial: "Not all the way through. Swipe from one side to the other",
      tap: "Swipe in a straight line, don't tap",
    },
    hint: "Swipe straight across, end to end",
    mute: "Mute sound",
    name: "Ittō",
    quit: "Quit",
    rare: "Rare",
    record: (off, cuts) =>
      `Best ${off}% off · ${cuts} ${cuts === 1 ? "cut" : "cuts"}`,
    result: {
      again: "Cut again",
      copied: "Copied",
      copyLink: "Copy link",
      games: "More games",
      maker: "About the maker",
      off: (off) => `${off}% off half`,
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
    },
    rule: {
      body: "One straight swipe. Measured by area, to 0.1%.",
      keys: "Keyboard: Enter shows the knife, the arrow keys aim it, Enter cuts",
      lead: "Cut it exactly in half",
    },
    start: "Cut one",
  },
  ja: {
    back: "ゲーム一覧にもどる",
    challenge: {
      accept: "同じものを切る",
      dare: "同じ形、同じまな板。もっと半分に近づける？",
      lost: (gap) => `挑戦状より${gap}%ずれた`,
      received: "挑戦状",
      retry: "同じものをもう一回",
      tied: "挑戦状とまったく同じズレ",
      won: (gap) => `挑戦状より${gap}%半分に近い`,
    },
    demo: "見本",
    fallback:
      "まっすぐ一刀で、食べものを半分に切るゲーム。豆腐や鯛焼き、三色団子などの端から端までスワイプして、ふたつの大きさをそろえる。面積の比を小数1桁まで測るので、ぴったりなら50.0 : 50.0。食べものは30種類以上あって形は毎回すこしちがい、たまにレアなものも出る。",
    fumble: {
      miss: "空振り。食べものの上を通して",
      partial: "切れてない。端から端まで",
      tap: "タップじゃなくて、スッと引く",
    },
    hint: "端から端まで、まっすぐスワイプ",
    mute: "音を消す",
    name: "一刀",
    quit: "やめる",
    rare: "レア",
    record: (off, cuts) => `最高 ズレ${off}% · ${cuts}回切った`,
    result: {
      again: "もう一回切る",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      games: "ほかのゲーム",
      maker: "つくった人",
      off: (off) => `半分からのズレ ${off}%`,
      postX: "Xに投稿",
      record: "最高記録",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
    },
    rule: {
      body: "まっすぐ一刀。面積を0.1%まで測る。",
      keys: "キーボード: Enterで包丁を出し、矢印キーで狙って、Enterで切る",
      lead: "ぴったり半分に、切る",
    },
    start: "切ってみる",
  },
};
