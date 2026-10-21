import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";

interface Copy {
  name: string;
  reading: string;
  fallback: string;
  back: string;
  mute: string;
  moulds: string;
  best: (time: string) => string;
  stats: (clears: number, runs: number) => string;
  rule: {
    lead: string;
    body: string;
    start: string;
  };
  meter: { carved: string; stress: string };
  challenge: {
    received: string;
    dare: string;
    beat: string;
  };
  result: ShareLabels & {
    record: string;
    faster: (rank: string, seconds: string) => string;
    further: (rank: string, percent: number) => string;
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
    challenge: {
      beat: "Can you cut it out without breaking it?",
      dare: "Can you cut it out faster?",
      received: "Challenge",
    },
    best: (time) => `Your best on this shape: ${time}`,
    fallback:
      "A game about cutting a shape out of a festival candy. Drag the needle along the pressed line to carve it. Going too fast or straying off the line puts stress on the candy, and if it cracks through, it breaks. Carve the whole outline to cut the shape out, and race for the fastest time on each of the six shapes.",
    meter: { carved: "Carved", stress: "Stress" },
    moulds: "Shape",
    mute: "Mute sound",
    name: "Breathless Carve",
    reading: "Breathless Carve",
    result: {
      again: "Play again",
      copied: "Copied",
      copyLink: "Copy link",
      faster: (rank, seconds) => `${seconds}s faster for ${rank}`,
      further: (rank, percent) => `${percent}% further for ${rank}`,
      games: "More games",
      lost: "The challenge did better",
      maker: "About the maker",
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
      body: "Rest the tip on the line to start. Too fast, or off the line, and it cracks.",
      lead: "Trace the line with the needle",
      start: "Drag to start",
    },
    stats: (clears, runs) =>
      `${clears} cut out · ${runs} ${runs === 1 ? "try" : "tries"}`,
  },
  ja: {
    back: "ゲーム一覧にもどる",
    challenge: {
      beat: "割らずに抜ける？",
      dare: "これより速く抜ける？",
      received: "挑戦状",
    },
    best: (time) => `この型のベスト ${time}`,
    fallback:
      "お祭りの型抜きを、針で抜くゲーム。型の線に沿って針をなぞると、少しずつ削れていく。速すぎたり線からはみ出したりすると、ひびが入って割れる。線をぜんぶ削れば、型が抜ける。6つの型それぞれで、いちばん速いタイムを目指す。",
    meter: { carved: "削り", stress: "ひび" },
    moulds: "型",
    mute: "音を消す",
    name: "息止め型抜き",
    reading: "いきどめかたぬき",
    result: {
      again: "もう一枚",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      faster: (rank, seconds) => `${rank}まで、あと${seconds}秒`,
      further: (rank, percent) => `${rank}まで、あと${percent}%`,
      games: "ほかのゲーム",
      lost: "挑戦状のほうが上",
      maker: "つくった人",
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
      body: "針先を線に当てたら、削りはじめ。速すぎても、はみ出してもひびが入る。",
      lead: "針で、線をなぞる",
      start: "なぞってスタート",
    },
    stats: (clears, runs) => `抜いた数 ${clears} · ${runs}枚`,
  },
};
