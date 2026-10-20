import type { Lang } from "./i18n";
import type { Ending, Event, Grade } from "./simulate";

export interface Copy {
  locale: string;
  fallback: string;
  surface: string;
  title: string;
  best: string;
  openWorkshop: string;
  reset: string;
  skipUnit: string;
  combo: (count: number) => string;
  hints: { ready: string; aiming: string; flying: string };
  challenge: {
    received: string;
    stone: (name: string) => string;
    dare: string;
  };
  release: {
    divine: string;
    close: (quality: number) => string;
    plain: (quality: number) => string;
    steep: string;
    flat: string;
  };
  events: Record<Event, string>;
  grades: Record<Grade, string>;
  late: string;
  endings: Record<Ending, string>;
  result: {
    record: string;
    levelUp: string;
    stats: (skips: number, combo: number, quality: number) => string;
    unlocked: string;
    newPart: (part: string) => string;
    wear: string;
    worn: string;
    again: string;
    share: string;
    postX: string;
    copyLink: string;
    copied: string;
    workshop: string;
    points: (count: number) => string;
    xp: (count: string) => string;
    maker: string;
  };
  workshop: {
    title: string;
    tabs: { stone: string; skill: string; setting: string };
    opened: (count: number, total: number) => string;
    found: (count: number, total: number) => string;
    shifts: string;
    pairs: string;
    bonus: (note: string) => string;
    points: (count: number) => string;
    lower: (name: string) => string;
    raise: (name: string) => string;
    respec: string;
    mute: { label: string; note: string };
    language: string;
    howto: string;
    steps: string[];
  };
  pick: { title: string; note: string };
}

export const copy: Record<Lang, Copy> = {
  en: {
    best: "Best",
    challenge: {
      dare: "Can you beat it?",
      received: "Challenge",
      stone: (name) => `Stone: ${name}`,
    },
    combo: (count) => `×${count} combo`,
    endings: { leaf: "Landed", plop: "Plop", sink: "Splash" },
    events: {
      duck: "Quack!",
      fish: "Carp leap!",
      lotus: "Boing",
      rock: "Clang!",
      wall: "Thud",
    },
    fallback:
      "A stone skipping game. Hold and flick up, or press and release Space, to throw. Tap or press Space as the stone touches the water to speed it up.",
    grades: { early: "Early", good: "Nice", miss: "Miss", perfect: "Perfect" },
    late: "Late",
    hints: {
      aiming: "Wait for a good angle, then flick up",
      flying: "Tap as the ring closes!",
      ready: "Hold, then flick up",
    },
    locale: "en-US",
    openWorkshop: "Open stone and skills",
    pick: {
      note: "You can change this later in Settings.",
      title: "Choose your language",
    },
    release: {
      close: (quality) => `${quality}% So close!`,
      divine: "Perfect throw",
      flat: " too flat",
      plain: (quality) => `${quality}%`,
      steep: " too steep",
    },
    reset: "Throw again",
    result: {
      again: "Again",
      levelUp: "Level up",
      maker: "Made by",
      newPart: (part) => `New ${part.toLowerCase()}`,
      points: (count) => `Skill points +${count}`,
      copied: "Copied",
      copyLink: "Copy link",
      postX: "Post on X",
      share: "Share",
      record: "New best",
      stats: (skips, combo, quality) =>
        `${skips} skips · best combo ×${combo} · throw ${quality}%`,
      unlocked: "Unlocked",
      wear: "Use",
      workshop: "Stone & skills",
      worn: "In use",
      xp: (count) => `+${count} XP`,
    },
    skipUnit: "skips",
    surface: "water",
    title: "水切り",
    workshop: {
      bonus: (note) => `Combo bonus ${note}`,
      found: (count, total) => `Found ${count} / ${total}`,
      howto: "How to play",
      language: "Language",
      lower: (name) => `Lower ${name}`,
      mute: { label: "Mute", note: "Sound effects and river" },
      opened: (count, total) => `Unlocked ${count} / ${total}`,
      pairs: "Certain pairs give a bonus",
      points: (count) => `Points ${count}`,
      raise: (name) => `Raise ${name}`,
      respec: "Reset all points",
      shifts: "Changes stats",
      steps: [
        "Hold, watch the stone's angle, then flick up. Nail both angle and speed for a perfect throw.",
        "Tap the moment the stone meets the water, as the ring closes. Gold means perfect.",
        "Ducks, rocks, carp and lily pads speed you up. Drift too close to a bank and you bounce off.",
      ],
      tabs: { setting: "Settings", skill: "Skills", stone: "Stone" },
      title: "Stone & skills",
    },
  },
  ja: {
    best: "自己ベスト",
    challenge: {
      dare: "超えられる？",
      received: "届いた記録",
      stone: (name) => `石：${name}`,
    },
    combo: (count) => `×${count} コンボ`,
    endings: { leaf: "ふわっ", plop: "ぽちゃん", sink: "ちゃぽん" },
    events: {
      duck: "グワッ！",
      fish: "鯉ジャンプ！",
      lotus: "ポンッ",
      rock: "カーン！",
      wall: "カツン",
    },
    fallback:
      "川に石を投げて、どこまで跳ねるかを競うゲーム。画面を押したまま上にはじくか、スペースキーを押して離すと投げられる。石が水面に着く瞬間にタップするか、スペースキーを押すと加速する。",
    grades: {
      early: "はやい",
      good: "ナイス",
      miss: "ミス",
      perfect: "パーフェクト",
    },
    late: "おそい",
    hints: {
      aiming: "いい角度で、上にはじく",
      flying: "輪が閉じる瞬間にタップ！",
      ready: "押したまま、上にはじく",
    },
    locale: "ja-JP",
    openWorkshop: "石と腕前をひらく",
    pick: {
      note: "あとから設定で変えられます",
      title: "言語をえらぶ",
    },
    release: {
      close: (quality) => `${quality}% 惜しい！`,
      divine: "神投げ",
      flat: " 寝かせすぎ",
      plain: (quality) => `${quality}%`,
      steep: " 立てすぎ",
    },
    reset: "投げ直す",
    result: {
      again: "もう一回",
      levelUp: "レベルアップ",
      maker: "つくった人",
      newPart: (part) => `新しい${part}`,
      points: (count) => `スキルポイント +${count}`,
      copied: "コピーした",
      copyLink: "リンクをコピー",
      postX: "Xに投稿",
      share: "シェア",
      record: "自己ベスト更新",
      stats: (skips, combo, quality) =>
        `${skips}回跳ねた · 最大コンボ ×${combo} · 投げの質 ${quality}%`,
      unlocked: "新しく解放",
      wear: "つける",
      workshop: "石と腕前",
      worn: "つけてる",
      xp: (count) => `+${count} 経験値`,
    },
    skipUnit: "回",
    surface: "水面",
    title: "水切り",
    workshop: {
      bonus: (note) => `相性ボーナス ${note}`,
      found: (count, total) => `発見 ${count} / ${total}`,
      howto: "遊び方",
      language: "言語",
      lower: (name) => `${name}を1下げる`,
      mute: { label: "音を消す", note: "効果音と川の音" },
      opened: (count, total) => `解放 ${count} / ${total}`,
      pairs: "決まった組み合わせでボーナス",
      points: (count) => `振れるポイント ${count}`,
      raise: (name) => `${name}を1上げる`,
      respec: "ポイントを全部戻す",
      shifts: "性能が変わる",
      steps: [
        "押したまま、石の角度を見て上にはじく。角度と速さがぴったりだと神投げ",
        "石が着水する瞬間、輪が閉じたところでタップ。金色ならパーフェクト",
        "カモ・岩・鯉・蓮の葉に当たると加速。土手に寄りすぎると跳ね返される",
      ],
      tabs: { setting: "設定", skill: "腕前", stone: "石" },
      title: "石と腕前",
    },
  },
};
