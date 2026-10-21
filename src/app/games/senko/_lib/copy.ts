import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { End } from "./burn";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  mute: string;
  unit: string;
  sway: string;
  phases: string;
  rule: { lead: string; body: string; start: string; keys: string };
  best: (time: string, finishes: number) => string;
  interrupted: string;
  challenge: { received: string; dare: string; passed: string };
  result: ShareLabels & {
    ends: Record<End, string>;
    finished: string;
    record: string;
    left: (time: string) => string;
    won: (time: string) => string;
    lost: (time: string) => string;
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
    best: (time, finishes) =>
      `Best ${time}s · ${finishes} ${finishes === 1 ? "finish" : "finishes"}`,
    challenge: {
      dare: "Same sparkler. Your turn.",
      passed: "Past the challenge!",
      received: "Challenge",
    },
    fallback:
      "A sparkler game. You hold the sparkler only while you press the screen. Moving your finger makes the fireball sway, and once the sway builds up it drops. Letting go drops it too. Hold on until it burns out to finish. You can also hold Space.",
    interrupted: "Interrupted, so that one didn't count",
    mute: "Mute sound",
    name: "An Ember's Life",
    phases: "Stages of the sparkler",
    result: {
      again: "Play again",
      copied: "Copied",
      copyLink: "Copy link",
      ends: {
        burned: "Burned out",
        released: "You let go",
        shaken: "It swayed and dropped",
      },
      finished: "Finished",
      games: "More games",
      left: (time) => `This one had ${time}s left to burn`,
      lost: (time) => `${time}s short of the challenge`,
      maker: "About the maker",
      star: "Star on GitHub",
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      tied: "Exactly the challenge time",
      won: (time) => `Beat the challenge by ${time}s`,
    },
    rule: {
      body: "Keep still and don't drop the fireball before it burns out.",
      keys: "Or hold Space",
      lead: "It only burns while you hold on",
      start: "Press and hold to light it",
    },
    sway: "Sway",
    unit: "s",
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (time, finishes) => `自己ベスト ${time}秒 · 完走 ${finishes}回`,
    challenge: {
      dare: "同じ一本で勝負",
      passed: "挑戦状を超えた！",
      received: "挑戦状",
    },
    fallback:
      "線香花火を長く持たせるゲーム。画面を押しているあいだだけ花火を持っていられる。指が動くと火玉がゆれて、ゆれが溜まると落ちる。指を離しても落ちる。燃え尽きるまで持てば完走。スペースキーを押し続けても遊べる。",
    interrupted: "途中で止まったので、今のはなしにした",
    mute: "音を消す",
    name: "火玉の一生",
    phases: "線香花火の移り変わり",
    result: {
      again: "もう一回",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      ends: {
        burned: "燃え尽きた",
        released: "指を離して落ちた",
        shaken: "ゆれて落ちた",
      },
      finished: "完走",
      games: "ほかのゲーム",
      left: (time) => `この一本は、あと${time}秒で燃え尽きるところだった`,
      lost: (time) => `挑戦状まであと${time}秒`,
      maker: "つくった人",
      star: "GitHubでスター",
      postX: "Xに投稿",
      record: "自己ベスト",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      tied: "挑戦状とまったく同じタイム",
      won: (time) => `挑戦状に${time}秒差で勝った`,
    },
    rule: {
      body: "指を動かさずに持って、燃え尽きるまで火玉を落とさないで。",
      keys: "スペースキーを押し続けてもいい",
      lead: "押しているあいだだけ、火がともる",
      start: "長押しで火をつける",
    },
    sway: "ゆれ",
    unit: "秒",
  },
};
