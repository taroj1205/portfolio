import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { StatKey } from "./eraser";
import { PERFECT } from "./score";
import type { Call } from "./session";

interface Copy {
  name: string;
  reading: string;
  fallback: string;
  back: string;
  mute: string;
  sheet: string;
  frame: (n: number) => string;
  total: string;
  rule: { lead: string; body: string; start: string };
  best: (score: number) => string;
  runs: (runs: number) => string;
  call: (call: Call) => string;
  challenge: {
    received: string;
    dare: (score: number) => string;
    borrow: string;
    borrowed: string;
  };
  workshop: {
    open: string;
    title: string;
    note: string;
    locked: string;
    done: string;
    groups: {
      form: string;
      core: string;
      sleeve: string;
      pattern: string;
      rubber: string;
    };
    stats: Record<StatKey, string>;
  };
  result: ShareLabels & {
    record: string;
    next: (rank: string, gap: number) => string;
    top: string;
    won: string;
    lost: string;
    tied: string;
    again: string;
    change: string;
    marks: (strikes: number, spares: number) => string;
    games: string;
    maker: string;
    star: string;
  };
}

const enStreak = ["", "Strike!", "Double!", "Turkey!"];
const jaStreak = ["", "ストライク！", "ダブル！", "ターキー！"];

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    best: (score) => `Best ${score}`,
    call: (call) => {
      if (call.kind === "strike") {
        return enStreak[call.run] ?? `${call.run} strikes in a row!`;
      }
      if (call.kind === "spare") {
        return "Spare!";
      }
      if (call.kind === "gutter") {
        return "Off the desk";
      }
      if (call.kind === "miss") {
        return "Miss";
      }
      return call.pins === 1 ? "1 pin" : `${call.pins} pins`;
    },
    challenge: {
      borrow: "Bowl with this eraser",
      borrowed: "Borrowed",
      dare: (score) =>
        score === PERFECT ? "Can you match it?" : "Can you bowl higher?",
      received: "Challenge",
    },
    fallback:
      "Eraser bowling on two school desks pushed together. Touch where you want to start, pull back, and let go to flick your eraser at ten standing erasers at the far end. Ten frames, strikes and spares, and up to 300 points. Design your own eraser in the workshop: its shape, how hard it is, and how it looks all change how it slides and hits.",
    frame: (n) => `Frame ${n}`,
    mute: "Mute sound",
    name: "Keshibo",
    reading: "Eraser bowling",
    result: {
      again: "Play again",
      change: "Change eraser",
      copied: "Copied",
      copyLink: "Copy link",
      games: "More games",
      lost: "The challenge scored higher",
      maker: "About the maker",
      marks: (strikes, spares) =>
        `${strikes} ${strikes === 1 ? "strike" : "strikes"} · ${spares} ${spares === 1 ? "spare" : "spares"}`,
      next: (rank, gap) => `${gap} more for ${rank}`,
      postX: "Post on X",
      record: "New best",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      tied: "Level with the challenge",
      top: "It doesn't get better than this",
      won: "You beat the challenge",
    },
    rule: {
      body: "Touch where to start, pull back, and let go to flick your eraser down the desks.",
      lead: "Pull back, then flick",
      start: "Pull to start",
    },
    runs: (runs) => `${runs} ${runs === 1 ? "game" : "games"}`,
    sheet: "Score sheet",
    total: "Total",
    workshop: {
      done: "Bowl with this",
      groups: {
        core: "Hardness",
        pattern: "Pattern",
        rubber: "Rubber",
        form: "Shape",
        sleeve: "Sleeve",
      },
      locked: "You can swap erasers between games.",
      note: "Shape and hardness change how it slides and how it hits. Heavy ones need a harder pull.",
      open: "Eraser workshop",
      stats: {
        bounce: "Bounce",
        speed: "Speed",
        mass: "Weight",
        width: "Width",
      },
      title: "Eraser workshop",
    },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: (score) => `ベスト ${score}点`,
    call: (call) => {
      if (call.kind === "strike") {
        return jaStreak[call.run] ?? `${call.run}連続ストライク！`;
      }
      if (call.kind === "spare") {
        return "スペア！";
      }
      if (call.kind === "gutter") {
        return "机から落ちた";
      }
      if (call.kind === "miss") {
        return "ミス";
      }
      return `${call.pins}本`;
    },
    challenge: {
      borrow: "この消しゴムで投げる",
      borrowed: "借りた",
      dare: (score) =>
        score === PERFECT ? "これに並べる？" : "これより高く投げられる？",
      received: "挑戦状",
    },
    fallback:
      "机をくっつけてつくったレーンで、消しゴムボウリング。投げたい位置に指を置いて、うしろに引いて離すと、消しゴムがすべっていく。奥に立てた10個の消しゴムを倒す。10フレームで、ストライクとスペアありの最高300点。工房で自分の消しゴムをつくれる。形やかたさ、見た目で、すべり方と当たり方が変わる。",
    frame: (n) => `${n}フレーム`,
    mute: "音を消す",
    name: "消しボウ",
    reading: "けしボウ",
    result: {
      again: "もう1ゲーム",
      change: "消しゴムを変える",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      games: "ほかのゲーム",
      lost: "挑戦状のほうが上",
      maker: "つくった人",
      marks: (strikes, spares) => `ストライク ${strikes} · スペア ${spares}`,
      next: (rank, gap) => `${rank}まで、あと${gap}点`,
      postX: "Xに投稿",
      record: "自己ベスト更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
      tied: "挑戦状と同点",
      top: "これ以上はない",
      won: "挑戦状に勝った",
    },
    rule: {
      body: "投げたい位置に指を置いて、うしろに引いて離すと、消しゴムがすべる。",
      lead: "引いて、はじく",
      start: "引いてスタート",
    },
    runs: (runs) => `${runs}ゲーム`,
    sheet: "スコア表",
    total: "合計",
    workshop: {
      done: "これで投げる",
      groups: {
        core: "かたさ",
        pattern: "柄",
        rubber: "ゴムの色",
        form: "形",
        sleeve: "スリーブ",
      },
      locked: "消しゴムはゲームの合間に変えられる",
      note: "形とかたさで、すべり方と当たり方が変わる。重いほど強く引かないと届かない。",
      open: "消しゴム工房",
      stats: {
        bounce: "はね返り",
        speed: "スピード",
        mass: "重さ",
        width: "当たり幅",
      },
      title: "消しゴム工房",
    },
  },
};
