import type { Lang } from "../../_lib/i18n";
import type { Ending, Event, Grade } from "./simulate";

export interface Copy {
  locale: string;
  fallback: string;
  surface: string;
  name: string;
  back: string;
  best: string;
  openWorkshop: string;
  reset: string;
  skipUnit: string;
  combo: (count: number) => string;
  hints: { ready: string; aiming: string; flying: string };
  challenge: {
    received: string;
    stone: (name: string) => string;
    tuning: (note: string) => string;
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
    stats: (
      skips: number,
      combo: number,
      quality: number,
      kmh: number
    ) => string;
    unlocked: string;
    newPart: (part: string) => string;
    wear: string;
    worn: string;
    points: (count: number) => string;
    xp: (count: string) => string;
    again: string;
    share: string;
    shareImage: string;
    saveImage: string;
    shareLink: string;
    postX: string;
    copyLink: string;
    copied: string;
    workshop: string;
    games: string;
    maker: string;
    star: string;
  };
  workshop: {
    title: string;
    tabs: {
      stone: string;
      tune: string;
      skill: string;
      record: string;
      setting: string;
    };
    firstThrow: string;
    points: (count: number) => string;
    tuneNote: string;
    skillPoints: (count: number) => string;
    respecPoints: string;
    opened: (count: number, total: number) => string;
    found: (count: number, total: number) => string;
    shifts: string;
    pairs: string;
    bonus: (note: string) => string;
    mode: {
      label: string;
      duel: { name: string; note: string };
      journey: { name: string; note: string };
    };
    lower: (name: string) => string;
    raise: (name: string) => string;
    respec: string;
    mute: { label: string; note: string };
    language: string;
    howto: string;
    steps: string[];
  };
}

export const copy: Record<Lang, Copy> = {
  en: {
    back: "Back to games",
    best: "Best",
    challenge: {
      dare: "Can you beat it?",
      received: "Challenge",
      stone: (name) => `Stone: ${name}`,
      tuning: (note) => `Tuning: ${note}`,
    },
    combo: (count) => `×${count} combo`,
    endings: { leaf: "Landed", plop: "Plop", sink: "Splash" },
    events: {
      dragonfly: "Zip!",
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
    openWorkshop: "Open workshop",
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
      games: "More games",
      maker: "About the maker",
      newPart: (part) => `New ${part.toLowerCase()}`,
      points: (count) => `Skill points +${count}`,
      copied: "Copied",
      copyLink: "Copy link",
      postX: "Post on X",
      saveImage: "Save image",
      share: "Share",
      shareImage: "Share image",
      shareLink: "Share link",
      star: "Star on GitHub",
      record: "New best",
      stats: (skips, combo, quality, kmh) =>
        `${skips} skips · best combo ×${combo} · throw ${quality}% · top\u00A0${kmh}\u00A0km/h`,
      unlocked: "Unlocked",
      wear: "Use",
      workshop: "Workshop",
      worn: "In use",
      xp: (count) => `+${count} XP`,
    },
    skipUnit: "skips",
    surface: "water",
    name: "Skip to the Milky Way",
    workshop: {
      bonus: (note) => `Combo bonus ${note}`,
      firstThrow: "Throw a stone to start your record",
      found: (count, total) => `Found ${count} / ${total}`,
      howto: "How to play",
      language: "Language",
      lower: (name) => `Lower ${name}`,
      mute: { label: "Mute", note: "Sound effects and river" },
      mode: {
        duel: {
          name: "Duel",
          note: "Everyone plays on equal terms. Tune your stone and compete on skill alone.",
        },
        journey: {
          name: "Journey",
          note: "Level up, earn skill points and unlock new stones at your own pace.",
        },
        label: "Mode",
      },
      opened: (count, total) => `Unlocked ${count} / ${total}`,
      pairs: "Some pairs boost your points",
      points: (count) => `Spare points ${count}`,
      raise: (name) => `Raise ${name}`,
      respec: "Reset tuning",
      respecPoints: "Reset all points",
      shifts: "Changes stats",
      skillPoints: (count) => `Points ${count}`,
      steps: [
        "Hold, watch the stone's angle, then flick up. Nail both angle and speed for a perfect throw.",
        "Tap the moment the stone meets the water, as the ring closes. Gold means perfect.",
        "Ducks, rocks, carp and lily pads speed you up, and so do dragonflies hovering over the water. Drift too close to a bank and you bounce off.",
      ],
      tabs: {
        record: "Record",
        setting: "Settings",
        skill: "Skills",
        stone: "Stone",
        tune: "Tuning",
      },
      title: "Workshop",
      tuneNote:
        "Lower one stat to raise another. Everyone gets the same points, so only your throws count.",
    },
  },
  ja: {
    back: "ゲーム一覧にもどる",
    best: "自己ベスト",
    challenge: {
      dare: "超えられる？",
      received: "届いた記録",
      stone: (name) => `石：${name}`,
      tuning: (note) => `配分：${note}`,
    },
    combo: (count) => `×${count} コンボ`,
    endings: { leaf: "ふわっ", plop: "ぽちゃん", sink: "ちゃぽん" },
    events: {
      dragonfly: "スイッ！",
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
    openWorkshop: "工房をひらく",
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
      games: "ほかのゲーム",
      maker: "つくった人",
      newPart: (part) => `新しい${part}`,
      points: (count) => `スキルポイント +${count}`,
      copied: "コピーした",
      copyLink: "リンクをコピー",
      postX: "Xに投稿",
      saveImage: "画像を保存",
      share: "シェア",
      shareImage: "画像でシェア",
      shareLink: "リンクでシェア",
      star: "GitHubでスター",
      record: "自己ベスト更新",
      stats: (skips, combo, quality, kmh) =>
        `${skips}回跳ねた · 最大コンボ ×${combo} · 投げの質 ${quality}% · 最高速度\u00A0${kmh}\u00A0km/h`,
      unlocked: "新しく解放",
      wear: "つける",
      workshop: "工房",
      worn: "つけてる",
      xp: (count) => `+${count} 経験値`,
    },
    skipUnit: "回",
    surface: "水面",
    name: "天の川水切り",
    workshop: {
      bonus: (note) => `相性ボーナス ${note}`,
      firstThrow: "石を投げると戦績が残る",
      found: (count, total) => `発見 ${count} / ${total}`,
      howto: "遊び方",
      language: "言語",
      lower: (name) => `${name}を1下げる`,
      mute: { label: "音を消す", note: "効果音と川の音" },
      mode: {
        duel: {
          name: "対決",
          note: "条件はみんな同じ。配分を決めて、腕だけで競う",
        },
        journey: {
          name: "育成",
          note: "遊ぶほど強くなる。レベルを上げて、石を解放していく",
        },
        label: "モード",
      },
      opened: (count, total) => `解放 ${count} / ${total}`,
      pairs: "組み合わせでポイントの効果アップ",
      points: (count) => `回せるポイント ${count}`,
      raise: (name) => `${name}を1上げる`,
      respec: "全部ゼロに戻す",
      respecPoints: "ポイントを全部戻す",
      shifts: "性能が変わる",
      skillPoints: (count) => `振れるポイント ${count}`,
      steps: [
        "押したまま、石の角度を見て上にはじく。角度と速さがぴったりだと神投げ",
        "石が着水する瞬間、輪が閉じたところでタップ。金色ならパーフェクト",
        "カモ・岩・鯉・蓮の葉、水面を飛ぶトンボに当たると加速。土手に寄りすぎると跳ね返される",
      ],
      tabs: {
        record: "戦績",
        setting: "設定",
        skill: "腕前",
        stone: "石",
        tune: "調整",
      },
      title: "工房",
      tuneNote:
        "どれかを下げると、別の項目を上げられる。ポイントはみんな同じだから、勝負は投げの腕だけ",
    },
  },
};
