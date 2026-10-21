import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import { ladder } from "./duel";
import type { Fake } from "./duel";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  mute: string;
  rule: { lead: string; body: string; keys: string };
  modes: { solo: string; soloSub: string; versus: string; versusSub: string };
  record: (reach: string, best: string | null) => string;
  demo: { hush: string; fake: string; signal: string; calm: string };
  rivals: { title: string; name: string }[];
  ordinal: (index: number) => string;
  ladder: string;
  ready: string;
  hint: string;
  you: string;
  rival: string;
  players: { left: string; right: string };
  zone: { touch: string; left: string; right: string };
  verdict: {
    won: string;
    lost: string;
    early: string;
    guess: (ms: number) => string;
    fooled: Record<Fake, string>;
    draw: string;
    none: string;
    wins: (player: string) => string;
  };
  next: string;
  retry: string;
  rematch: string;
  quit: string;
  interrupted: string;
  challenge: {
    received: string;
    who: string;
    dare: string;
    still: string;
    slow: string;
    accept: string;
    won: (gap: string) => string;
    lost: (gap: string) => string;
    tied: string;
    early: string;
    again: string;
    ladder: string;
  };
  result: ShareLabels & {
    fastest: string;
    average: string;
    record: string;
    furthest: string;
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
      accept: "Accept the challenge",
      again: "Try again",
      dare: "This opponent draws at that speed. Can you beat it?",
      early: "A false start. The challenge stands.",
      ladder: "Take on the five",
      lost: (gap) => `${gap} too slow for the challenge`,
      received: "Challenge",
      slow: "Cut down before you drew",
      still: "Could you keep still?",
      tied: "Exactly the same time. Both blades landed.",
      who: "Challenger",
      won: (gap) => `You beat the challenge by ${gap}`,
    },
    demo: {
      calm: "This is the signal",
      fake: "Not the signal. Hold still.",
      hush: "Silence…",
      signal: "Now!",
    },
    fallback:
      "A quick-draw duel. Two samurai face each other in silence. After a random wait a red 「！」 appears, and whoever draws first wins. Tap, click or press Space as soon as you see it. Drawing before the signal is a false start, and the cat, falling leaf, crow or gust of wind that sometimes passes by is not the signal. Solo mode is a ladder of five opponents who get faster. In two-player mode each player owns half of the screen, or presses F and J on a keyboard.",
    hint: "Draw when 「！」 appears",
    interrupted: "Interrupted, so that duel didn't count",
    ladder: "Opponents",
    modes: {
      solo: "Solo",
      soloSub: "Beat five in a row",
      versus: "Two players",
      versusSub: "On one screen",
    },
    mute: "Mute sound",
    name: "Iai",
    next: "Next opponent",
    ordinal: (index) => `Opponent ${index + 1} of ${ladder.length}`,
    players: { left: "Blue", right: "Red" },
    quit: "Stop",
    ready: "Take your stance",
    rematch: "Again",
    record: (reach, best) =>
      best === null ? `Best ${reach}` : `Best ${reach} · fastest ${best}`,
    result: {
      again: "Play again",
      average: "Average",
      copied: "Copied",
      copyLink: "Copy link",
      fastest: "Fastest",
      furthest: "Furthest yet",
      games: "More games",
      maker: "About the maker",
      postX: "Post on X",
      record: "New fastest",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
    },
    retry: "Draw again",
    rival: "Opponent",
    rivals: [
      { name: "Gonbei", title: "Foot soldier" },
      { name: "Hanjirō", title: "Rōnin" },
      { name: "Ryūsai", title: "Dojo master" },
      { name: "Onimaru", title: "Hitokiri" },
      { name: "Mumyō", title: "Sword saint" },
    ],
    rule: {
      body: "Whoever draws first wins. A cat or a falling leaf is not the signal.",
      keys: "Space to draw · two players: F and J",
      lead: "When 「！」 appears, draw",
    },
    verdict: {
      draw: "Both blades landed",
      early: "False start",
      fooled: {
        cat: "Fooled by a cat",
        crow: "Fooled by a crow",
        leaf: "Fooled by a leaf",
        wind: "Fooled by the wind",
      },
      guess: (ms) => `${ms}ms is too fast to have seen it`,
      lost: "Cut down",
      none: "Nobody drew",
      wins: (player) => `${player} wins`,
      won: "Victory",
    },
    you: "You",
    zone: { left: "F", right: "J", touch: "Tap your half" },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    challenge: {
      accept: "挑戦を受ける",
      again: "もう一度挑む",
      dare: "この速さで斬ってくる相手に、勝てる？",
      early: "お手つき。挑戦状はまだ破れていない",
      ladder: "勝ち抜きに挑む",
      lost: (gap) => `挑戦状まで、あと${gap}`,
      received: "挑戦状",
      slow: "抜く前に斬られた",
      still: "あなたは、動かずにいられる？",
      tied: "まったく同じ速さ。相打ち",
      who: "挑戦者",
      won: (gap) => `挑戦状に${gap}差で勝った`,
    },
    demo: {
      calm: "これが合図",
      fake: "これは合図じゃない。動くな",
      hush: "静寂……",
      signal: "今だ！",
    },
    fallback:
      "居合の早抜きで勝負するゲーム。向かい合ったふたりの侍のあいだに、しばらく待つと赤い「！」が出る。先に斬った方の勝ち。見えたらすぐにタップかクリック、またはスペースキー。合図の前に抜くとお手つきで負け。ときどき通る猫や落ち葉、カラス、風は合図じゃない。ひとりで遊ぶと、だんだん速くなる五人と勝ち抜き。ふたりで遊ぶときは画面を半分ずつ使うか、キーボードのFとJで。",
    hint: "「！」が出たら斬る",
    interrupted: "途中で止まったので、今の勝負はなしにした",
    ladder: "相手",
    modes: {
      solo: "ひとりで",
      soloSub: "五人勝ち抜き",
      versus: "ふたりで",
      versusSub: "ひとつの画面で対決",
    },
    mute: "音を消す",
    name: "居合",
    next: "次の相手へ",
    ordinal: (index) =>
      `${["一", "二", "三", "四", "五"][index] ?? index + 1}人目`,
    players: { left: "藍", right: "朱" },
    quit: "やめる",
    ready: "構える",
    rematch: "もう一本",
    record: (reach, best) =>
      best === null ? `最高 ${reach}` : `最高 ${reach} · 最速 ${best}`,
    result: {
      again: "もう一回",
      average: "平均",
      copied: "コピーした",
      copyLink: "リンクをコピー",
      fastest: "最速",
      furthest: "最高記録",
      games: "ほかのゲーム",
      maker: "つくった人",
      postX: "Xに投稿",
      record: "最速更新",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクをシェア",
      star: "GitHubでスター",
    },
    retry: "仕切り直し",
    rival: "相手",
    rivals: [
      { name: "権兵衛", title: "足軽" },
      { name: "半次郎", title: "浪人" },
      { name: "柳斎", title: "道場主" },
      { name: "鬼丸", title: "人斬り" },
      { name: "無明", title: "剣聖" },
    ],
    rule: {
      body: "先に斬った方の勝ち。猫や落ち葉は合図じゃない。",
      keys: "スペースキーで斬る · ふたりなら F と J",
      lead: "「！」が出たら、斬れ",
    },
    verdict: {
      draw: "相打ち",
      early: "お手つき",
      fooled: {
        cat: "猫につられた",
        crow: "カラスにつられた",
        leaf: "落ち葉につられた",
        wind: "風につられた",
      },
      guess: (ms) => `${ms}msは、見てからでは間に合わない速さ`,
      lost: "斬られた",
      none: "どちらも抜かなかった",
      wins: (player) => `${player}の勝ち`,
      won: "勝ち",
    },
    you: "あなた",
    zone: { left: "F", right: "J", touch: "自分の側をタップ" },
  },
};
