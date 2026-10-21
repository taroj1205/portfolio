import type { Lang } from "../../_lib/i18n";
import type { ShareLabels } from "../../_lib/share";
import type { Fake } from "./duel";

interface Copy {
  name: string;
  fallback: string;
  back: string;
  mute: string;
  rule: { lead: string; body: string; keys: string };
  modes: { solo: string; soloSub: string; versus: string; versusSub: string };
  record: (best: string, rank: string) => string;
  demo: { hush: string; fake: string; signal: string; calm: string };
  duel: { label: string; name: string };
  tiers: string[];
  opponents: string;
  gap: (tier: string, gap: string) => string;
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
    solo: string;
  };
  result: ShareLabels & {
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
      accept: "Accept the challenge",
      again: "Try again",
      dare: "This opponent draws at that speed. Can you beat it?",
      early: "A false start. The challenge stands.",
      solo: "Duel solo",
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
      "A quick-draw duel. Two samurai face each other in silence. After a random wait a red 「！」 appears, and whoever draws first wins. Tap, click or press Space as soon as you see it. Drawing before the signal is a false start, and the cat, falling leaf, crow or gust of wind that sometimes passes by is not the signal. Solo is one duel, and your reaction time decides which of five opponents, from a foot soldier to the sword saint, you would have cut down. In two-player mode each player owns half of the screen, or presses F and J on a keyboard.",
    hint: "Draw when 「！」 appears",
    duel: { label: "One duel", name: "Foot soldier or sword saint?" },
    gap: (tier, gap) => `${gap} faster to cut down the ${tier.toLowerCase()}`,
    interrupted: "Interrupted, so that duel didn't count",
    modes: {
      solo: "Solo",
      soloSub: "One duel",
      versus: "Two players",
      versusSub: "On one screen",
    },
    mute: "Mute sound",
    name: "Iai",
    opponents: "Who you would cut down",
    players: { left: "Blue", right: "Red" },
    quit: "Quit",
    ready: "Take your stance",
    rematch: "Again",
    record: (best, rank) => `Fastest ${best} · ${rank}`,
    result: {
      again: "Duel again",
      copied: "Copied",
      copyLink: "Copy link",
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
    rule: {
      body: "Whoever draws first wins. A cat or a falling leaf is not the signal.",
      keys: "Space to draw · two players: F and J",
      lead: "When 「！」 appears, draw",
    },
    tiers: ["Foot soldier", "Rōnin", "Dojo master", "Hitokiri", "Sword saint"],
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
      solo: "ひとりで勝負",
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
      "居合の早抜きで勝負するゲーム。向かい合ったふたりの侍のあいだに、しばらく待つと赤い「！」が出る。先に斬った方の勝ち。見えたらすぐにタップかクリック、またはスペースキー。合図の前に抜くとお手つきで負け。ときどき通る猫や落ち葉、カラス、風は合図じゃない。ひとりで遊ぶと一本勝負。反応の速さで、足軽から剣聖まで、五人のうち誰を斬れたかが決まる。ふたりで遊ぶときは画面を半分ずつ使うか、キーボードのFとJで。",
    hint: "「！」が出たら斬る",
    duel: { label: "一本勝負", name: "足軽か、剣聖か" },
    gap: (tier, gap) => `あと${gap}速ければ、${tier}を斬れた`,
    interrupted: "途中で止まったので、今の勝負はなしにした",
    modes: {
      solo: "ひとりで",
      soloSub: "一本勝負",
      versus: "ふたりで",
      versusSub: "ひとつの画面で対決",
    },
    mute: "音を消す",
    name: "居合",
    opponents: "斬れる相手",
    players: { left: "藍", right: "朱" },
    quit: "やめる",
    ready: "構える",
    rematch: "もう一本",
    record: (best, rank) => `最速 ${best} · ${rank}`,
    result: {
      again: "もう一本",
      copied: "コピーした",
      copyLink: "リンクをコピー",
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
    rule: {
      body: "先に斬った方の勝ち。猫や落ち葉は合図じゃない。",
      keys: "スペースキーで斬る · ふたりなら F と J",
      lead: "「！」が出たら、斬れ",
    },
    tiers: ["足軽", "浪人", "道場主", "人斬り", "剣聖"],
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
