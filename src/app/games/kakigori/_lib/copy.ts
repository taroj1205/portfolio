import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";

interface Copy {
  name: string;
  reading: string;
  fallback: string;
  back: string;
  mute: string;
  best: (height: string) => string;
  found: (found: number, total: number) => string;
  rule: {
    lead: string;
    body: string;
    start: string;
  };
  meter: { height: string; ice: string; serve: string };
  challenge: {
    received: string;
    dare: string;
  };
  result: ShareLabels & {
    record: string;
    first: (syrup: string) => string;
    more: (rank: string, height: string) => string;
    peak: (height: string) => string;
    toppled: string;
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
    best: (height) => `Your best: ${height}`,
    challenge: {
      dare: "Can you pile it higher?",
      received: "Challenge",
    },
    fallback:
      "A shaved ice game. Press and hold to turn the crank, and fluffy ice falls from the shaver above. Your finger moves the glass left and right under it. The taller the mound gets, the more it wobbles and leans, and if it leans too far the top falls off. When it leans, slide the glass the same way so the ice lands on the other side and straightens it. Pour the syrup whenever you like to finish, and the taller the mound, the better the syrup.",
    found: (found, total) => `${found} of ${total} syrups`,
    meter: { height: "Height", ice: "Ice", serve: "Add syrup" },
    mute: "Mute sound",
    name: "Kakigori Summit",
    reading: "Kakigori Summit",
    result: {
      again: "Another one",
      copied: "Copied",
      copyLink: "Copy link",
      first: (syrup) => `First ${syrup}`,
      games: "More games",
      lost: "The challenge piled higher",
      maker: "About the maker",
      more: (rank, height) => `${height} more for ${rank}`,
      peak: (height) => `It reached ${height} before it fell`,
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      tied: "Exactly level with the challenge",
      toppled: "Toppled",
      top: "It doesn't get higher than this",
      won: "You beat the challenge",
    },
    rule: {
      body: "Press to shave ice. Your finger moves the glass. When the mound leans, slide the glass that way so the ice lands on the other side.",
      lead: "Pile it high, keep it standing",
      start: "Press and hold to shave",
    },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (height) => `ベスト ${height}`,
    challenge: {
      dare: "これより高く盛れる？",
      received: "挑戦状",
    },
    fallback:
      "かき氷を高く盛るゲーム。押しているあいだハンドルが回り、上の機械からふわふわの氷が落ちてくる。指で器を左右に動かして受ける。山は高くなるほどぐらぐらして傾き、傾きすぎるとてっぺんが崩れ落ちる。傾いたら、そっちへ器を寄せて、反対側に氷を落とすと立て直せる。好きなときにシロップをかけて完成。高く盛るほど、いいシロップになる。",
    found: (found, total) => `シロップ ${found}/${total}`,
    meter: { height: "高さ", ice: "氷", serve: "シロップをかける" },
    mute: "音を消す",
    name: "てっぺんかき氷",
    reading: "てっぺんかきごおり",
    result: {
      again: "もう一杯",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      first: (syrup) => `はじめての${syrup}`,
      games: "ほかのゲーム",
      lost: "挑戦状のほうが高い",
      maker: "つくった人",
      more: (rank, height) => `${rank}まで、あと${height}`,
      peak: (height) => `崩れる前は${height}`,
      postX: "Xに投稿",
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      tied: "挑戦状とまったく同じ",
      toppled: "崩れた",
      top: "これ以上はない",
      won: "挑戦状に勝った",
    },
    rule: {
      body: "押すと氷が落ちる。指で器を動かす。山が傾いたら、そっちへ器を寄せて、反対側に盛る。",
      lead: "崩さずに、高く盛る",
      start: "押して、氷を削る",
    },
  },
};
