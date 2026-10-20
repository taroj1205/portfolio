import type { Lang } from "../../_lib/i18n";
import { colorOf, comboOf, combos, formOf, parts } from "./cosmetics";
import type { Combo, Option, Part, Stone } from "./cosmetics";
import { areaOf, zoneIndex, zones } from "./simulate";
import type { Flight, Traits } from "./simulate";
import { axes } from "./tuning";
import type { Axis } from "./tuning";

export type Unlock =
  | { kind: "start" }
  | { kind: "level"; level: number }
  | { kind: "combo"; combo: number }
  | { kind: "zone"; zone: number }
  | { kind: "divine" };

export type Perks = Partial<Record<Axis, number>>;

export interface Gear {
  power: number;
  stone: number;
  lift: number;
  focus: number;
  impact: number;
}

export const noGear: Gear = {
  focus: 0,
  impact: 0,
  lift: 0,
  power: 0,
  stone: 0,
};

export interface Item {
  part: Part;
  option: Option;
}

interface Progress {
  level: number;
  combo: number;
  zone: number;
  divine: boolean;
}

interface Standing {
  xp: number;
  best: number;
  combo: number;
  divine: boolean;
}

interface Training extends Standing {
  gear: Gear;
}

const UNLOCKS = new Map<string, Unlock>([
  ["color:river", { kind: "start" }],
  ["color:slate", { kind: "level", level: 2 }],
  ["color:rose", { kind: "level", level: 5 }],
  ["color:ice", { kind: "level", level: 8 }],
  ["color:jade", { kind: "combo", combo: 10 }],
  ["color:amber", { kind: "level", level: 12 }],
  ["color:gold", { kind: "divine" }],
  ["color:meteor", { kind: "zone", zone: areaOf("sea") }],
  ["color:lapis", { kind: "level", level: 16 }],
  ["color:coral", { kind: "zone", zone: areaOf("snow") }],
  ["color:crystal", { kind: "level", level: 24 }],
  ["color:obsidian", { kind: "zone", zone: areaOf("cloud") }],
  ["color:moon", { kind: "zone", zone: areaOf("stars") }],
  ["form:oval", { kind: "start" }],
  ["form:round", { kind: "level", level: 3 }],
  ["form:flat", { kind: "zone", zone: areaOf("bamboo") }],
  ["form:drop", { kind: "level", level: 5 }],
  ["form:square", { kind: "level", level: 7 }],
  ["form:leaf", { kind: "zone", zone: areaOf("maple") }],
  ["form:triangle", { kind: "combo", combo: 10 }],
  ["form:heart", { kind: "level", level: 10 }],
  ["form:bean", { kind: "level", level: 13 }],
  ["form:crescent", { kind: "combo", combo: 20 }],
  ["form:star", { kind: "zone", zone: areaOf("town") }],
  ["form:gourd", { kind: "level", level: 18 }],
  ["form:diamond", { kind: "level", level: 22 }],
  ["form:fan", { kind: "combo", combo: 30 }],
  ["form:fish", { kind: "zone", zone: areaOf("firefly") }],
  ["form:shell", { kind: "level", level: 30 }],
  ["pattern:plain", { kind: "start" }],
  ["pattern:stripe", { kind: "level", level: 4 }],
  ["pattern:speckle", { kind: "zone", zone: areaOf("sakura") }],
  ["pattern:ring", { kind: "combo", combo: 20 }],
  ["pattern:wave", { kind: "level", level: 6 }],
  ["pattern:checker", { kind: "level", level: 9 }],
  ["pattern:dots", { kind: "combo", combo: 12 }],
  ["pattern:mended", { kind: "divine" }],
  ["trail:spray", { kind: "start" }],
  ["trail:gold", { kind: "combo", combo: 15 }],
  ["trail:sakura", { kind: "zone", zone: areaOf("sakura") }],
  ["trail:fox", { kind: "zone", zone: areaOf("firefly") }],
  ["trail:rainbow", { kind: "level", level: 11 }],
  ["trail:ink", { kind: "zone", zone: areaOf("ginkgo") }],
  ["trail:bubble", { kind: "zone", zone: areaOf("sea") }],
  ["trail:comet", { kind: "zone", zone: areaOf("stars") }],
]);

const PERKS = new Map<string, Perks>([
  ["color:slate", { impact: 1, keep: 1, lift: -2 }],
  ["color:rose", { focus: 1, impact: -2, lift: 1 }],
  ["color:ice", { impact: -2, keep: 1, speed: 1 }],
  ["color:jade", { focus: 2, speed: -1 }],
  ["color:amber", { lift: 2, speed: -1 }],
  ["color:gold", { impact: 2, speed: -1 }],
  ["color:meteor", { keep: -1, speed: 2 }],
  ["color:lapis", { focus: 1, lift: 1, speed: -1 }],
  ["color:coral", { impact: 1, keep: -1, lift: 1 }],
  ["color:crystal", { focus: 1, keep: -1, speed: 1 }],
  ["color:obsidian", { focus: -2, impact: 1, speed: 2 }],
  ["color:moon", { focus: 1, lift: 2, speed: -2 }],
  ["form:round", { focus: 2, keep: -2, lift: 2, speed: -1 }],
  ["form:flat", { focus: -1, impact: -1, keep: 3, lift: -2, speed: 2 }],
  ["form:drop", { focus: -1, lift: -1, speed: 3 }],
  ["form:square", { impact: 1, keep: 3, lift: -2, speed: -1 }],
  ["form:leaf", { impact: -2, keep: 1, lift: 3, speed: -1 }],
  ["form:triangle", { focus: -2, impact: 2, keep: 1 }],
  ["form:heart", { focus: 1, impact: 3, keep: -1, speed: -2 }],
  ["form:bean", { focus: 3, keep: 1, lift: -1, speed: -2 }],
  ["form:crescent", { focus: 2, impact: -1, keep: -2, speed: 2 }],
  ["form:star", { focus: 2, impact: 2, keep: -2, lift: 1, speed: -2 }],
  ["form:gourd", { focus: -2, impact: 2, lift: 2, speed: -1 }],
  ["form:diamond", { impact: 1, keep: -1, lift: -1, speed: 2 }],
  ["form:fan", { focus: 1, impact: -1, keep: -1, lift: 2 }],
  ["form:fish", { focus: 1, impact: -1, lift: -1, speed: 2 }],
  ["form:shell", { impact: 1, keep: 2, speed: -2 }],
]);

const COMBO_PERKS = new Map<string, Perks>([
  ["go", { keep: 2 }],
  ["jewel", { focus: 2 }],
  ["venus", { impact: 2, lift: 1 }],
  ["petal", { lift: 2 }],
  ["shooting", { speed: 2 }],
  ["love", { impact: 2 }],
  ["gourds", { impact: 1, lift: 1, speed: 1 }],
  ["moon", { focus: 1, speed: 2 }],
  ["grilled", { impact: 1, keep: 1 }],
  ["starfish", { impact: 1, lift: 1 }],
  ["tear", { focus: 2 }],
  ["lunar", { lift: 2 }],
  ["arrow", { speed: 2 }],
  ["flake", { keep: 2 }],
  ["blossom", { focus: 1, lift: 1 }],
  ["turtle", { keep: 2 }],
  ["sap", { keep: 1, lift: 1 }],
  ["goldfish", { impact: 2 }],
]);

export const unlockOf = (part: Part, option: Option): Unlock =>
  UNLOCKS.get(`${part}:${option.id}`) ?? { kind: "start" };

export const perksOf = (part: Part, id: string): Perks | undefined =>
  PERKS.get(`${part}:${id}`);

export const comboPerksOf = (combo: Combo): Perks =>
  COMBO_PERKS.get(combo.id) ?? {};

const needFor = (target: number) => Math.round(150 * target ** 1.8);

export const progressOf = (xp: number) => {
  let reached = 0;
  while (xp >= needFor(reached + 1)) {
    reached += 1;
  }
  const floor = needFor(reached);
  const ceiling = needFor(reached + 1);
  return { level: reached, part: (xp - floor) / (ceiling - floor) };
};

const unlocksOf = (standing: Standing): Progress => ({
  combo: standing.combo,
  divine: standing.divine,
  level: progressOf(standing.xp).level,
  zone: zoneIndex(standing.best),
});

const isOpen = (unlock: Unlock, progress: Progress) => {
  if (unlock.kind === "level") {
    return progress.level >= unlock.level;
  }
  if (unlock.kind === "combo") {
    return progress.combo >= unlock.combo;
  }
  if (unlock.kind === "zone") {
    return progress.zone >= unlock.zone;
  }
  if (unlock.kind === "divine") {
    return progress.divine;
  }
  return true;
};

export const isUnlocked = (standing: Standing, part: Part, option: Option) =>
  isOpen(unlockOf(part, option), unlocksOf(standing));

export const conditionOf = (unlock: Unlock, lang: Lang) => {
  const en = lang === "en";
  if (unlock.kind === "level") {
    return `Lv.${unlock.level}`;
  }
  if (unlock.kind === "combo") {
    return en ? `Combo ${unlock.combo}` : `コンボ${unlock.combo}`;
  }
  if (unlock.kind === "zone") {
    const area = zones[unlock.zone]?.name[lang] ?? "";
    return en ? `Reach ${area}` : `${area}に到達`;
  }
  if (unlock.kind === "divine") {
    return en ? "Perfect throw" : "神投げ";
  }
  return "";
};

export const keyOf = ({ part, option }: Item) => `${part}:${option.id}`;

const opened = (standing: Standing): Item[] =>
  parts.flatMap(({ part, options }) =>
    options
      .filter((option) => isUnlocked(standing, part, option))
      .map((option) => ({ option, part }))
  );

export const foundOf = (standing: Standing): Combo[] =>
  combos.filter(
    ({ color, form }) =>
      isUnlocked(standing, "color", colorOf(color)) &&
      isUnlocked(standing, "form", formOf(form))
  );

export const pointsLeft = ({ gear, xp }: Training) =>
  Math.max(
    0,
    progressOf(xp).level -
      (gear.focus + gear.impact + gear.lift + gear.power + gear.stone)
  );

export const spend = (
  training: Training,
  key: keyof Gear,
  step: 1 | -1
): Gear | null => {
  if (step === 1 && pointsLeft(training) <= 0) {
    return null;
  }
  if (step === -1 && training.gear[key] === 0) {
    return null;
  }
  return { ...training.gear, [key]: training.gear[key] + step };
};

export const earn = <S extends Standing & { unseen: string[] }>(
  before: S,
  after: S,
  flight: Flight
) => {
  const gained = Math.round(
    flight.distance * 0.5 +
      flight.skips * 2 +
      flight.bestCombo * 5 +
      (flight.quality >= 90 ? 40 : 0) +
      (flight.quality === 100 ? 160 : 0)
  );
  const next = { ...after, xp: before.xp + gained };
  const known = new Set(opened(before).map(keyOf));
  const unlocked = opened(next).filter((item) => !known.has(keyOf(item)));
  return {
    climbed: progressOf(next.xp).level - progressOf(before.xp).level,
    gained,
    save: { ...next, unseen: [...before.unseen, ...unlocked.map(keyOf)] },
    unlocked,
  };
};

const WORTH_STEP = 0.15;

const STEP: Record<Axis, number> = {
  focus: 0.09,
  impact: 0.25,
  keep: 0.0045,
  lift: 0.12,
  speed: 0.045,
};

const earned = (points: number) =>
  0.6 * (1 - 0.9 ** points) + 2.4 * Math.log1p(points / 40);

const eased = (points: number) => {
  const total = earned(points);
  return total / (total + 1);
};

export const traitsOf = (gear: Gear, look: Stone): Traits => {
  const perks = [
    PERKS.get(`color:${look.color}`) ?? {},
    PERKS.get(`form:${look.form}`) ?? {},
  ];
  const steps = (axis: Axis) =>
    perks.reduce((sum, entry) => sum + (entry[axis] ?? 0), 0);
  const scale = (axis: Axis) => (1 + STEP[axis]) ** steps(axis);
  const pair = comboOf(look);
  const pairPerks = pair === null ? {} : comboPerksOf(pair);
  const worth = (axis: Axis) => 1 + WORTH_STEP * (pairPerks[axis] ?? 0);
  const points = {
    focus: gear.focus * worth("focus"),
    impact: gear.impact * worth("impact"),
    lift: gear.lift * worth("lift"),
    power: gear.power * worth("speed"),
    stone: gear.stone * worth("keep"),
  };
  return {
    focus: scale("focus"),
    good: 0.22 + 0.18 * eased(points.focus),
    impact: scale("impact") * (1 + 0.6 * earned(points.impact)),
    keep: STEP.keep * steps("keep") + 0.085 * eased(points.stone),
    lift: scale("lift") * (1 + 0.3 * earned(points.lift)),
    perfect: 0.09 + 0.14 * eased(points.focus),
    speed: scale("speed") * (1 + 0.15 * points.power),
    top: 30 * (1 + 0.15 * points.power),
  };
};

const span = (value: number, low: number, high: number) =>
  Math.max(0, (value - low) / (high - low));

export const statsOf = (traits: Traits): Record<Axis, number> => ({
  focus: span(traits.perfect * traits.focus, 0.01, 0.25),
  impact: span(traits.impact, 0.2, 2.2),
  keep: span(0.86 + traits.keep, 0.8, 0.95),
  lift: span(traits.lift, 0.4, 1.9),
  speed: span(traits.speed, 0.2, 2.2),
});

export const scoresOf = (
  stats: Record<Axis, number>
): Record<Axis, string> => ({
  focus: String(Math.round(stats.focus * 100)),
  impact: String(Math.round(stats.impact * 100)),
  keep: String(Math.round(stats.keep * 100)),
  lift: String(Math.round(stats.lift * 100)),
  speed: String(Math.round(stats.speed * 100)),
});

export const perksNote = (perks: Perks, lang: Lang) => {
  const marks = axes.flatMap(({ key, label }) => {
    const step = perks[key] ?? 0;
    if (step === 0) {
      return [];
    }
    return [`${label[lang]}${(step > 0 ? "↑" : "↓").repeat(Math.abs(step))}`];
  });
  if (marks.length > 0) {
    return marks.join(" ");
  }
  return lang === "en" ? "Balanced" : "クセなし";
};

export const peaksOf = (perks: Perks): Perks => {
  const ranked = axes
    .map(({ key }) => ({ key, step: perks[key] ?? 0 }))
    .toSorted((a, b) => b.step - a.step);
  const best = ranked.at(0);
  const worst = ranked.at(-1);
  return {
    ...(best !== undefined && best.step > 0 && { [best.key]: best.step }),
    ...(worst !== undefined && worst.step < 0 && { [worst.key]: worst.step }),
  };
};
