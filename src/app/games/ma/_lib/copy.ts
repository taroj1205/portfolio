import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";

export type Void = "hidden" | "long";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  mute: string;
  example: string;
  unit: string;
  stats: (best: string, runs: number) => string;
  modes: {
    label: string;
    standard: string;
    daily: (day: number | null) => string;
  };
  daily: {
    fresh: string;
    done: (gap: string, streak: number) => string;
  };
  rule: {
    lead: string;
    body: (target: string) => string;
    start: string;
    keys: string;
  };
  goal: string;
  aim: (target: string) => string;
  early: string;
  voided: Record<Void, string>;
  challenge: {
    received: string;
    dare: string;
    match: string;
    day: (day: number) => string;
  };
  timeline: { label: string; hidden: string; zoom: string };
  result: ShareLabels & {
    record: string;
    official: string;
    practice: string;
    practiceNote: (gap: string) => string;
    streak: (days: number) => string;
    next: (rank: string, gap: string) => string;
    top: string;
    early: string;
    late: string;
    exact: string;
    won: (gap: string) => string;
    lost: (gap: string) => string;
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
    aim: (target) => `Tap when you think it's ${target}s`,
    back: "Back to games",
    challenge: {
      dare: "Can you get closer?",
      match: "Can you match it?",
      day: (day) => `Daily #${day}`,
      received: "Challenge",
    },
    daily: {
      done: (gap, streak) =>
        streak > 1
          ? `Today's try: ${gap}s · ${days(streak)} in a row. The rest are practice.`
          : `Today's try: ${gap}s. The rest are practice.`,
      fresh: "Your first try today is the one that counts",
    },
    early: "It's still showing. Wait until it's gone.",
    example: "Example",
    fallback:
      "A game about stopping at exactly 10.00 seconds without seeing the timer. Press the screen to start the timer, which disappears after 3 seconds. Press again when you think 10.00 seconds have passed, and you'll see the time you stopped at and how far off you were, to 0.01 seconds. The Space bar works too.",
    goal: "Stop it right on",
    modes: {
      daily: (day) => (day === null ? "Daily" : `Daily #${day}`),
      label: "Target",
      standard: "10.00s",
    },
    mute: "Mute sound",
    name: "Ma",
    result: {
      again: "Play again",
      copied: "Copied",
      copyLink: "Copy link",
      early: "Early",
      exact: "Dead on",
      games: "More games",
      late: "Late",
      lost: (gap) => `${gap}s further off than the challenge`,
      maker: "About the maker",
      next: (rank, gap) => `${gap}s closer for ${rank}`,
      official: "Counts for today",
      postX: "Post on X",
      practice: "Practice",
      practiceNote: (gap) => `Sharing posts today's first try (${gap}s)`,
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      streak: (count) => `${days(count)} in a row`,
      tied: "Exactly as close as the challenge",
      top: "It doesn't get better than this",
      won: (gap) => `${gap}s closer than the challenge`,
    },
    rule: {
      body: (target) => `Tap again when you think ${target}s have passed.`,
      keys: "Or use the Space bar",
      lead: "The timer vanishes after 3 seconds",
      start: "Press to start",
    },
    stats: (best, runs) =>
      `Best ${best}s · ${runs} ${runs === 1 ? "try" : "tries"}`,
    timeline: {
      hidden: "Unseen",
      label: "Where you stopped",
      zoom: "Close-up",
    },
    unit: "s",
    voided: {
      hidden: "You left the page, so that one didn't count",
      long: "Over a minute, so that one didn't count",
    },
  },
  ja: {
    aim: (target) => `${target}秒だと思ったら、タップ`,
    back: "ゲーム一覧にもどる",
    challenge: {
      dare: "これより近づける？",
      match: "これに並べる？",
      day: (day) => `お題 #${day}`,
      received: "挑戦状",
    },
    daily: {
      done: (gap, streak) =>
        streak > 1
          ? `今日の記録 ${gap}秒 · ${streak}日連続。ここからは練習`
          : `今日の記録 ${gap}秒。ここからは練習`,
      fresh: "今日はじめての1回が、今日の記録になる",
    },
    early: "まだ見えてる。消えてから止めよう",
    example: "お手本",
    fallback:
      "タイマーを見ずに、10.00秒ぴったりで止めるゲーム。画面を押すとタイマーが動き出し、3秒で消える。10.00秒たったと思ったところでもう一度押すと、止めた時間とずれが0.01秒単位で出る。スペースキーでも遊べる。",
    goal: "ぴったりで、止める",
    modes: {
      daily: (day) => (day === null ? "今日のお題" : `今日のお題 #${day}`),
      label: "お題",
      standard: "10.00秒",
    },
    mute: "音を消す",
    name: "間",
    result: {
      again: "もう一回",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      early: "はやい",
      exact: "ずれなし",
      games: "ほかのゲーム",
      late: "おそい",
      lost: (gap) => `挑戦状より${gap}秒遠い`,
      maker: "つくった人",
      next: (rank, gap) => `${rank}まで、あと${gap}秒`,
      official: "今日の記録",
      postX: "Xに投稿",
      practice: "練習",
      practiceNote: (gap) => `シェアされるのは今日の記録（${gap}秒）`,
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      streak: (count) => `${count}日連続`,
      tied: "挑戦状とまったく同じずれ",
      top: "これ以上はない",
      won: (gap) => `挑戦状より${gap}秒近い`,
    },
    rule: {
      body: (target) => `${target}秒たったと思ったら、もう一度タップ。`,
      keys: "スペースキーでも遊べる",
      lead: "タイマーは3秒で消える",
      start: "押してスタート",
    },
    stats: (best, runs) => `ベスト ${best}秒 · ${runs}回`,
    timeline: {
      hidden: "見えない間",
      label: "止めたところ",
      zoom: "拡大",
    },
    unit: "秒",
    voided: {
      hidden: "画面を離れたので、今のはなしにした",
      long: "1分を過ぎたので、今のはなしにした",
    },
  },
};
