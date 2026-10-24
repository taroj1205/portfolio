import type { Text } from "../../_lib/i18n";

export const kindIds = [
  "wakin",
  "sarasa",
  "demekin",
  "ryukin",
  "shubunkin",
  "ogon",
  "nushi",
] as const;

export type KindId = (typeof kindIds)[number];

export type Tier = "common" | "uncommon" | "rare" | "legend";

export interface Kind {
  name: Text;
  tier: Tier;
  weight: number;
  speed: number;
  length: number;
  chance: number;
}

export const kinds: Record<KindId, Kind> = {
  demekin: {
    chance: 10,
    length: 92,
    name: { en: "Black moor", ja: "黒出目金" },
    speed: 0.75,
    tier: "uncommon",
    weight: 1.3,
  },
  nushi: {
    chance: 0.7,
    length: 170,
    name: { en: "Old boss of the tank", ja: "水槽の主" },
    speed: 0.55,
    tier: "legend",
    weight: 3.4,
  },
  ogon: {
    chance: 2.4,
    length: 100,
    name: { en: "Golden goldfish", ja: "黄金の金魚" },
    speed: 1.3,
    tier: "rare",
    weight: 1.1,
  },
  ryukin: {
    chance: 8,
    length: 108,
    name: { en: "Ryukin", ja: "琉金" },
    speed: 0.65,
    tier: "uncommon",
    weight: 1.7,
  },
  sarasa: {
    chance: 26,
    length: 100,
    name: { en: "Red-and-white", ja: "更紗" },
    speed: 1,
    tier: "common",
    weight: 1,
  },
  shubunkin: {
    chance: 7,
    length: 104,
    name: { en: "Shubunkin", ja: "朱文金" },
    speed: 1.25,
    tier: "uncommon",
    weight: 1,
  },
  wakin: {
    chance: 46,
    length: 100,
    name: { en: "Wakin", ja: "和金" },
    speed: 1,
    tier: "common",
    weight: 1,
  },
};

export const icons: Record<Tier, string> = {
  common: "🐟",
  legend: "👑",
  rare: "🌟",
  uncommon: "🐠",
};

const tiers: readonly Tier[] = ["legend", "rare", "uncommon", "common"];

export const rankOfTier = (tier: Tier) => tiers.indexOf(tier);

export const pickKind = (
  random: () => number,
  caught: number,
  bossAround: boolean
): KindId => {
  const boost = 1 + caught / 15;

  const weights = kindIds.map((id) => {
    const { chance, tier } = kinds[id];

    if (id === "nushi" && bossAround) {
      return 0;
    }

    return tier === "rare" || tier === "legend" ? chance * boost : chance;
  });

  let roll = random() * weights.reduce((sum, weight) => sum + weight, 0);

  for (const [i, weight] of weights.entries()) {
    roll -= weight;

    if (roll < 0) {
      return kindIds[i];
    }
  }

  return "wakin";
};
