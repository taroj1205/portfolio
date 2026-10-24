import { landmarkBody, linear, pullDoc } from "./art";
import type { Layer } from "./art";

export const CARD = {
  base: { x: 320, y: 330 },
  height: 360,
  size: 270,
  top: 96,
  width: 640,
} as const;

export const cardLayers = [
  "back",
  "cheese",
  "held",
] as const satisfies readonly Layer[];

export type CardLayer = (typeof cardLayers)[number];

export const isCardLayer = (value: string): value is CardLayer =>
  cardLayers.some((layer) => layer === value);

const scenery = [
  `<defs>${linear(
    "card-sky",
    [0, 0, 0, 1],
    [
      [0, "#2a2a6a"],
      [0.6, "#7a4a7a"],
      [1, "#ff9a6a"],
    ]
  )}</defs>`,
  `<rect width="${CARD.width}" height="${CARD.height}" fill="url(#card-sky)"/>`,
  landmarkBody("fuji", "card-fuji", { x: 470, y: 360 }, 120, 0.85),
  landmarkBody("snow", "card-snow", { x: 470, y: 360 }, 120),
  landmarkBody("tower", "card-tower", { x: 96, y: 360 }, 230),
  landmarkBody("skytree", "card-tree", { x: 560, y: 360 }, 300, 0.9),
].join("");

export const cardDoc = (layer: CardLayer) =>
  pullDoc(
    CARD.width,
    CARD.height,
    { base: CARD.base, dish: "pizza", size: CARD.size, top: CARD.top },
    [layer],
    layer === "back" ? scenery : ""
  );
