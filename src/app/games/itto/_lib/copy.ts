import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { Fumble } from "./session";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  mute: string;
  demo: string;
  rule: { lead: string; body: string; keys: string };
  start: string;
  record: (total: string, runs: number) => string;
  hint: string;
  fumble: Record<Fumble, string>;
  round: (index: number, total: number) => string;
  next: string;
  finish: string;
  quit: string;
  challenge: {
    received: string;
    dare: string;
    accept: string;
    won: (gap: string) => string;
    lost: (gap: string) => string;
    tied: string;
  };
  result: ShareLabels & {
    off: string;
    closest: string;
    record: string;
    again: string;
    games: string;
    maker: string;
    star: string;
    cuts: string;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    challenge: {
      accept: "Cut the same five",
      dare: "Same shapes, same board. Can you cut closer to half?",
      lost: (gap) => `${gap}% further off than the challenge`,
      received: "Challenge",
      tied: "Exactly as close as the challenge",
      won: (gap) => `${gap}% closer than the challenge`,
    },
    demo: "Demo",
    fallback:
      "A cutting game. Swipe one straight line across a piece of Japanese food to cut it in two, and try to make both pieces exactly the same size. The split is measured by area to one decimal place, so a perfect cut is 50.0 : 50.0. A run is five pieces, from tofu and yōkan to taiyaki and persimmon, and the shapes are different every time.",
    finish: "See the result",
    fumble: {
      miss: "Missed. Swipe across the food",
      partial: "Not all the way through. Swipe from one side to the other",
      tap: "Swipe in a straight line, don't tap",
    },
    hint: "Swipe straight across, end to end",
    mute: "Mute sound",
    name: "Ittō",
    next: "Next",
    quit: "Quit",
    record: (total, runs) =>
      `Best ${total}% off · ${runs} ${runs === 1 ? "run" : "runs"}`,
    result: {
      again: "Cut again",
      closest: "Closest",
      copied: "Copied",
      copyLink: "Copy link",
      cuts: "Your cuts",
      games: "More games",
      maker: "About the maker",
      off: "off in total",
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
    },
    round: (index, total) => `${index + 1} of ${total}`,
    rule: {
      body: "One straight swipe. Measured by area, to 0.1%.",
      keys: "Keyboard: Enter shows the knife, the arrow keys aim it, Enter cuts",
      lead: "Cut it exactly in half",
    },
    start: "Start cutting",
  },
  ja: {
    back: "ゲーム一覧にもどる",
    challenge: {
      accept: "同じ5つを切る",
      dare: "同じ形、同じまな板。もっと半分に近づける？",
      lost: (gap) => `挑戦状より${gap}%ずれた`,
      received: "挑戦状",
      tied: "挑戦状とまったく同じズレ",
      won: (gap) => `挑戦状より${gap}%半分に近い`,
    },
    demo: "見本",
    fallback:
      "まっすぐ一刀で、食べものを半分に切るゲーム。豆腐や羊羹、鯛焼き、柿などの端から端までスワイプして、ふたつの大きさをそろえる。面積の比を小数1桁まで測るので、ぴったりなら50.0 : 50.0。5つ切って1回で、形は毎回ちがう。",
    finish: "結果を見る",
    fumble: {
      miss: "空振り。食べものの上を通して",
      partial: "切れてない。端から端まで",
      tap: "タップじゃなくて、スッと引く",
    },
    hint: "端から端まで、まっすぐスワイプ",
    mute: "音を消す",
    name: "一刀",
    next: "次へ",
    quit: "やめる",
    record: (total, runs) => `最高 ズレ${total}% · ${runs}回`,
    result: {
      again: "もう一回",
      closest: "いちばん半分",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      cuts: "切ったもの",
      games: "ほかのゲーム",
      maker: "つくった人",
      off: "ズレ合計",
      postX: "Xに投稿",
      record: "最高記録",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
    },
    round: (index, total) => `${index + 1} / ${total}`,
    rule: {
      body: "まっすぐ一刀。面積を0.1%まで測る。",
      keys: "キーボード: Enterで包丁を出し、矢印キーで狙って、Enterで切る",
      lead: "ぴったり半分に、切る",
    },
    start: "切りはじめる",
  },
};
