import type { Text } from "../../_lib/i18n";
import { MOON } from "./stretch";

interface Height {
  cm: number;
  emoji: string;
  name: Text;
  title: Text;
}

export const heights: readonly Height[] = [
  {
    cm: 10,
    emoji: "🧀",
    name: { en: "Gooey", ja: "とろ〜り" },
    title: { en: "Nice and gooey", ja: "とろ〜り" },
  },
  {
    cm: 30,
    emoji: "📺",
    name: { en: "Advert-worthy", ja: "CM級" },
    title: { en: "Advert-worthy", ja: "CM級ののび" },
  },
  {
    cm: 100,
    emoji: "📏",
    name: { en: "One metre", ja: "1メートル" },
    title: { en: "Past one metre", ja: "1メートル超え" },
  },
  {
    cm: 180,
    emoji: "🧍",
    name: { en: "Taller than you", ja: "背丈" },
    title: { en: "Taller than you", ja: "背丈超え" },
  },
  {
    cm: 1000,
    emoji: "🏠",
    name: { en: "Three storeys", ja: "三階建て" },
    title: { en: "Over the rooftop", ja: "屋根を突き抜けた" },
  },
  {
    cm: 33_300,
    emoji: "🗼",
    name: { en: "Tokyo Tower", ja: "東京タワー" },
    title: { en: "Past Tokyo Tower", ja: "東京タワー超え" },
  },
  {
    cm: 63_400,
    emoji: "🏙️",
    name: { en: "Skytree", ja: "スカイツリー" },
    title: { en: "Past the Skytree", ja: "スカイツリー超え" },
  },
  {
    cm: 377_600,
    emoji: "🗻",
    name: { en: "Mt Fuji", ja: "富士山" },
    title: { en: "Past Mt Fuji", ja: "富士山超え" },
  },
  {
    cm: 1_000_000,
    emoji: "✈️",
    name: { en: "Airliner", ja: "旅客機" },
    title: { en: "Up with the airliners", ja: "旅客機の高さ" },
  },
  {
    cm: 10_000_000,
    emoji: "🚀",
    name: { en: "Space", ja: "宇宙" },
    title: { en: "Into space", ja: "宇宙に届いた" },
  },
  {
    cm: 40_000_000,
    emoji: "🛰️",
    name: { en: "The ISS", ja: "宇宙ステーション" },
    title: { en: "Past the ISS", ja: "宇宙ステーション超え" },
  },
  {
    cm: 1_000_000_000,
    emoji: "🌏",
    name: { en: "The whole Earth", ja: "地球まるごと" },
    title: { en: "The whole Earth in view", ja: "地球がまるごと見えた" },
  },
  {
    cm: 3_578_600_000,
    emoji: "📡",
    name: { en: "Geostationary orbit", ja: "静止衛星" },
    title: { en: "Out to geostationary orbit", ja: "静止衛星の高さ" },
  },
  {
    cm: MOON,
    emoji: "🌕",
    name: { en: "The Moon", ja: "月" },
    title: { en: "All the way to the Moon", ja: "月まで届いた" },
  },
];

export const LAST = heights.length - 1;

export const reachedOf = (cm: number) => {
  let reached = -1;
  for (const [index, height] of heights.entries()) {
    if (cm >= height.cm) {
      reached = index;
    }
  }
  return reached;
};

export const heightAt = (index: number) => heights[index] ?? null;
