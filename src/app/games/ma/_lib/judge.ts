import type { Lang, Text } from "../../_lib/i18n";

export const STANDARD = 1000;
export const SHOWN = 300;
export const LONGEST = 6000;
export const PERFECT = 6;
const MOONS = 5;

export interface Rank {
  level: number;
  name: Text;
  line: Text;
}

interface Band extends Rank {
  within: number;
  side?: "early" | "late";
}

const lost: Band = {
  level: 0,
  line: { en: "Where did the time go?", ja: "気づけば、時が過ぎていた。" },
  name: { en: "Lost in time", ja: "浦島太郎" },
  side: "late",
  within: Infinity,
};

const bands: readonly Band[] = [
  {
    level: 6,
    line: { en: "Time stood still.", ja: "時が、止まった。" },
    name: { en: "Perfect", ja: "神業" },
    within: 0,
  },
  {
    level: 5,
    line: { en: "There's a clock inside you.", ja: "体の中に、時計がある。" },
    name: { en: "Human clock", ja: "体内時計" },
    within: 3,
  },
  {
    level: 4,
    line: { en: "Almost dead on.", ja: "ほぼ、ぴったり。" },
    name: { en: "Master", ja: "達人" },
    within: 10,
  },
  {
    level: 3,
    line: { en: "A fine sense of timing.", ja: "いい間の取り方。" },
    name: { en: "Sharp", ja: "名手" },
    within: 25,
  },
  {
    level: 2,
    line: { en: "Roughly right.", ja: "だいたい合ってる。" },
    name: { en: "Not bad", ja: "まずまず" },
    within: 50,
  },
  {
    level: 1,
    line: { en: "Couldn't wait.", ja: "待ちきれなかった。" },
    name: { en: "Hasty", ja: "せっかち" },
    side: "early",
    within: 100,
  },
  {
    level: 1,
    line: { en: "No rush at all.", ja: "時間はたっぷりある。" },
    name: { en: "Laid-back", ja: "のんびり" },
    side: "late",
    within: 100,
  },
  {
    level: 0,
    line: { en: "It wasn't over yet.", ja: "まだまだ、これから。" },
    name: { en: "Jumped the gun", ja: "早とちり" },
    side: "early",
    within: Infinity,
  },
  lost,
];

const onSide = (band: Band, gap: number) =>
  band.side === undefined || (band.side === "early") === gap < 0;

const fits = (band: Band, gap: number) =>
  Math.abs(gap) <= band.within && onSide(band, gap);

export const rankOf = (gap: number): Rank =>
  bands.find((band) => fits(band, gap)) ?? lost;

export const nextOf = (gap: number) => {
  const { level } = rankOf(gap);
  const next = bands.find(
    (band) => band.level === level + 1 && onSide(band, gap)
  );
  return next === undefined
    ? null
    : { closer: Math.abs(gap) - next.within, rank: next };
};

export const moonsOf = (level: number) => {
  const full = Math.min(MOONS, level);
  return `${"🌕".repeat(full)}${"🌑".repeat(MOONS - full)}${level === PERFECT ? "✨" : ""}`;
};

export const hundredthsBetween = (from: number, to: number) =>
  Math.floor((to - from) / 10 + 1e-6);

export const formatTime = (time: number) => (time / 100).toFixed(2);

export const formatGap = (gap: number) => {
  const size = formatTime(Math.abs(gap));
  if (gap === 0) {
    return `±${size}`;
  }
  return gap > 0 ? `+${size}` : `−${size}`;
};

export const secondsText = (text: string, lang: Lang) =>
  lang === "en" ? `${text}s` : `${text}秒`;
