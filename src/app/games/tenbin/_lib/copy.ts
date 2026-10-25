import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { Grade } from "./scale";

export type Mode = "daily" | "versus";

interface Copy {
  name: string;
  back: string;
  mute: string;
  pitch: string;
  modes: Record<Mode, string> & { label: string };
  daily: {
    day: (day: number | null) => string;
    practice: string;
    ask: string;
    left: (tries: number) => string;
    weight: string;
    lighter: string;
    heavier: string;
    hint: string;
    like: (name: string, count: string) => string;
    weigh: string;
    verdict: Record<"up" | "down" | "hit", string>;
    within: Record<Grade, string>;
  };
  result: ShareLabels & {
    won: (tries: number) => string;
    lost: string;
    answer: string;
    about: string;
    same: string;
    source: string;
    next: (time: string) => string;
    practiceNote: string;
    played: string;
    rate: string;
    streak: string;
    longest: string;
    solvedIn: string;
    again: string;
    today: string;
    toVersus: string;
    games: string;
    maker: string;
    star: string;
  };
  versus: {
    ask: string;
    pick: string;
    chain: (count: number) => string;
    dare: string;
    best: (count: number) => string;
    right: string;
    wrong: string;
    times: (ratio: string) => string;
    over: (count: number) => string;
    record: string;
  };
  challenge: {
    received: string;
    beat: string;
  };
  share: {
    daily: (day: number | null) => string;
    dare: (name: string) => string;
    versus: (count: number) => string;
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    challenge: {
      beat: "Can you beat it?",
      received: "Challenge",
    },
    daily: {
      ask: "How heavy?",
      day: (day) => (day === null ? "Puzzle" : `Puzzle #${day}`),
      heavier: "One step heavier",
      hint: "Slide anywhere from 1 g to 100 million tonnes, then weigh it",
      left: (tries) => `${tries} ${tries === 1 ? "try" : "tries"} left`,
      like: (name, count) => `≈ ${name} ${count}`,
      lighter: "One step lighter",
      practice: "An older puzzle, for practice",
      verdict: { down: "Lighter", hit: "Spot on!", up: "Heavier" },
      weigh: "Weigh it",
      weight: "Your guess",
      within: {
        far: "Within 10×",
        hit: "Within 15%",
        near: "Within 2×",
        way: "More than 10× off",
      },
    },
    modes: {
      daily: "Today's puzzle",
      label: "Mode",
      versus: "Which is heavier?",
    },
    mute: "Mute sound",
    name: "Heftle",
    pitch: "From 1 g to 100 million tonnes. Five tries to weigh today's thing.",
    result: {
      about: "about ",
      again: "Play again",
      answer: "Answer",
      copied: "Copied",
      copyLink: "Copy link",
      games: "More games",
      longest: "Longest",
      lost: "Not this time",
      maker: "About the maker",
      next: (time) => `Next puzzle in ${time}`,
      played: "Played",
      postX: "Post on X",
      practiceNote: "Older puzzles don't count towards your stats",
      rate: "Won",
      same: "The same as",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      solvedIn: "Solved in",
      source: "Source",
      star: "Star on GitHub",
      streak: "Streak",
      toVersus: "Which is heavier?",
      today: "Today's puzzle",
      won: (tries) => (tries === 1 ? "First try!" : `Got it in ${tries}`),
    },
    share: {
      daily: (day) => (day === null ? "Heftle" : `Heftle #${day}`),
      dare: () => "Guess the weight, from 1 g to 100 million tonnes",
      versus: (count) => `Heftle, Which is heavier?: ${count} in a row`,
    },
    versus: {
      ask: "Which is heavier?",
      best: (count) => `Best ${count}`,
      chain: (count) => `${count} in a row`,
      dare: "Can you go further?",
      over: (count) => `${count} in a row`,
      pick: "Tap the heavier one",
      record: "New best",
      right: "Right!",
      times: (ratio) => `${ratio}× heavier`,
      wrong: "Wrong",
    },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    challenge: {
      beat: "これより少ない回数で当てられる？",
      received: "挑戦状",
    },
    daily: {
      ask: "重さは？",
      day: (day) => (day === null ? "お題" : `お題 #${day}`),
      heavier: "1目盛り重く",
      hint: "1gから1億トンまで。スライダーで選んで量る",
      left: (tries) => `あと${tries}回`,
      like: (name, count) => `${name} ${count} くらい`,
      lighter: "1目盛り軽く",
      practice: "過去のお題。練習として遊べる",
      verdict: { down: "もっと軽い", hit: "ぴったり！", up: "もっと重い" },
      weigh: "これで量る",
      weight: "予想の重さ",
      within: {
        far: "10倍以内",
        hit: "誤差15%以内",
        near: "2倍以内",
        way: "10倍以上ずれてる",
      },
    },
    modes: {
      daily: "今日のお題",
      label: "モード",
      versus: "どっちが重い？",
    },
    mute: "音を消す",
    name: "一億トン天秤",
    pitch: "1gから1億トンまで。今日のお題の重さを5回で当てる。",
    result: {
      about: "約",
      again: "もう一回",
      answer: "答え",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      games: "ほかのゲーム",
      longest: "最長",
      lost: "今日は外れ",
      maker: "つくった人",
      next: (time) => `次のお題まで ${time}`,
      played: "遊んだ日",
      postX: "Xに投稿",
      practiceNote: "過去のお題は記録に残らない",
      rate: "正解率",
      same: "身近なもので量ると",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      solvedIn: "当てた回数",
      source: "出典",
      star: "GitHubでスター",
      streak: "連続",
      toVersus: "どっちが重い？",
      today: "今日のお題",
      won: (tries) => (tries === 1 ? "一発で当てた！" : `${tries}回で当てた`),
    },
    share: {
      daily: (day) => (day === null ? "一億トン天秤" : `一億トン天秤 #${day}`),
      dare: (name) => `${name}の重さ、当てられる？`,
      versus: (count) => `一億トン天秤「どっちが重い？」${count}連続正解`,
    },
    versus: {
      ask: "どっちが重い？",
      best: (count) => `ベスト ${count}`,
      chain: (count) => `${count}連続`,
      dare: "これより長く続けられる？",
      over: (count) => `${count}連続で終了`,
      pick: "重いと思うほうをタップ",
      record: "自己ベスト更新",
      right: "正解！",
      times: (ratio) => `${ratio}倍重い`,
      wrong: "ざんねん",
    },
  },
};
