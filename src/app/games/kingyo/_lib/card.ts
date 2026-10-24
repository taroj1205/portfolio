import { sceneDoc } from "./art";
import type { Swimmer } from "./art";

export const CARD = {
  frame: { size: 700, x: -30, y: -300 },
  height: 360,
  width: 640,
} as const;

export const cardLayers = ["back", "school", "poi"] as const;

export type CardLayer = (typeof cardLayers)[number];

const school: readonly Swimmer[] = [
  { heading: 0.15, kind: "wakin", sway: 0.25, x: 180, y: 520 },
  { heading: -0.2, kind: "sarasa", sway: -0.2, x: 420, y: 470 },
  { heading: 0.35, kind: "ogon", sway: 0.3, x: 610, y: 560 },
  { heading: -0.1, kind: "demekin", sway: -0.3, x: 140, y: 760 },
  { heading: 0.05, kind: "ryukin", sway: 0.2, x: 600, y: 760 },
  { heading: -0.3, kind: "wakin", sway: -0.25, x: 820, y: 520 },
];

export const isCardLayer = (value: string): value is CardLayer =>
  cardLayers.some((layer) => layer === value);

const poses = {
  back: { bowl: ["wakin", "sarasa", "shubunkin"], poi: null, swimmers: [] },
  poi: { bowl: null, poi: { torn: false, x: 380, y: 660 }, swimmers: [] },
  school: { bowl: null, poi: null, swimmers: school },
} as const;

export const cardDoc = (layer: CardLayer) =>
  sceneDoc(CARD.width, CARD.height, CARD.frame, poses[layer], layer === "back");
