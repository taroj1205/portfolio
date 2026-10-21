import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";

interface Copy {
  name: string;
  reading: string;
  fallback: string;
  back: string;
  mute: string;
  day: (day: number) => string;
  today: (day: number, mould: string) => string;
  stats: (clears: number, runs: number) => string;
  daily: {
    fresh: string;
    done: (score: string, streak: number) => string;
  };
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
    official: string;
    practice: string;
    practiceNote: (score: string) => string;
    streak: (days: number) => string;
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

const days = (count: number) => `${count} ${count === 1 ? "day" : "days"}`;

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    challenge: {
      beat: "Can you cut it out?",
      dare: "Can you beat it?",
      received: "Challenge",
    },
    daily: {
      done: (score, streak) =>
        streak > 1
          ? `Today's try: ${score} · ${days(streak)} in a row. The rest are practice.`
          : `Today's try: ${score}. The rest are practice.`,
      fresh: "Your first try today is the one that counts",
    },
    day: (day) => `Daily #${day}`,
    fallback:
      "A game about cutting a shape out of a festival candy. Drag the needle along the pressed line to carve it. Going too fast or straying off the line puts stress on the candy, and if it cracks through, it breaks. Carve the whole outline to cut the shape out. A new shape comes every day.",
    meter: { carved: "Carved", stress: "Stress" },
    mute: "Mute sound",
    name: "Katanuki",
    reading: "Katanuki",
    result: {
      again: "Play again",
      copied: "Copied",
      copyLink: "Copy link",
      faster: (rank, seconds) => `${seconds}s faster for ${rank}`,
      further: (rank, percent) => `${percent}% further for ${rank}`,
      games: "More games",
      lost: "The challenge did better",
      maker: "About the maker",
      official: "Counts for today",
      postX: "Post on X",
      practice: "Practice",
      practiceNote: (score) => `Sharing posts today's first try (${score})`,
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      streak: (count) => `${days(count)} in a row`,
      tied: "Exactly level with the challenge",
      top: "It doesn't get better than this",
      won: "You beat the challenge",
    },
    rule: {
      body: "Too fast, or off the line, and it cracks.",
      lead: "Trace the line with the needle",
      start: "Drag to start",
    },
    stats: (clears, runs) =>
      `${clears} cut out · ${runs} ${runs === 1 ? "try" : "tries"}`,
    today: (day, mould) => `Daily #${day} · ${mould}`,
  },
  ja: {
    back: "ゲーム一覧にもどる",
    challenge: {
      beat: "これを抜ける？",
      dare: "これを超えられる？",
      received: "挑戦状",
    },
    daily: {
      done: (score, streak) =>
        streak > 1
          ? `今日の記録 ${score} · ${streak}日連続。ここからは練習`
          : `今日の記録 ${score}。ここからは練習`,
      fresh: "今日はじめての1枚が、今日の記録になる",
    },
    day: (day) => `お題 #${day}`,
    fallback:
      "お祭りの型抜きを、針で抜くゲーム。型の線に沿って針をなぞると、少しずつ削れていく。速すぎたり線からはみ出したりすると、ひびが入って割れる。線をぜんぶ削れば、型が抜ける。型は毎日かわる。",
    meter: { carved: "削り", stress: "ひび" },
    mute: "音を消す",
    name: "型抜き",
    reading: "かたぬき",
    result: {
      again: "もう一枚",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      faster: (rank, seconds) => `${rank}まで、あと${seconds}秒`,
      further: (rank, percent) => `${rank}まで、あと${percent}%`,
      games: "ほかのゲーム",
      lost: "挑戦状のほうが上",
      maker: "つくった人",
      official: "今日の記録",
      postX: "Xに投稿",
      practice: "練習",
      practiceNote: (score) => `シェアされるのは今日の記録（${score}）`,
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      streak: (count) => `${count}日連続`,
      tied: "挑戦状とまったく同じ",
      top: "これ以上はない",
      won: "挑戦状に勝った",
    },
    rule: {
      body: "速すぎても、はみ出しても、ひびが入る。",
      lead: "針で、線をなぞる",
      start: "なぞってスタート",
    },
    stats: (clears, runs) => `抜いた数 ${clears} · ${runs}枚`,
    today: (day, mould) => `お題 #${day} · ${mould}`,
  },
};
