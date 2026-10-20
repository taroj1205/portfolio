import type { Text } from "../../_lib/i18n";

interface Phase {
  name: Text;
  reading: string;
  emoji: string;
}

export const phases: readonly Phase[] = [
  { emoji: "🔴", name: { en: "Bud", ja: "蕾" }, reading: "つぼみ" },
  { emoji: "🌺", name: { en: "Peony", ja: "牡丹" }, reading: "ぼたん" },
  { emoji: "🌲", name: { en: "Pine needles", ja: "松葉" }, reading: "まつば" },
  { emoji: "🌿", name: { en: "Willow", ja: "柳" }, reading: "やなぎ" },
  {
    emoji: "🏵️",
    name: { en: "Falling chrysanthemum", ja: "散り菊" },
    reading: "ちりぎく",
  },
];

export const LAST = phases.length - 1;

export const phaseOf = (index: number): Phase => {
  const phase = phases[index];
  if (phase === undefined) {
    throw new RangeError(`No phase at ${index}`);
  }
  return phase;
};
