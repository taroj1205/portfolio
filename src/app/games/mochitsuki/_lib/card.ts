import { sceneDoc } from "./art";
import type { Piece } from "./art";

export const CARD = {
  frame: { size: 330, x: 155, y: 20 },
  height: 360,
  width: 640,
} as const;

export const cardLayers = ["back", "mochi", "lip", "arm", "kine"] as const;

export type CardLayer = (typeof cardLayers)[number];

const picks: Record<CardLayer, (piece: Piece) => boolean> = {
  arm: (piece) => piece.group === "arm",
  back: (piece) => piece.group === undefined && piece.key !== "lip",
  kine: (piece) => piece.group === "kine",
  lip: (piece) => piece.key === "lip",
  mochi: (piece) => piece.group === "mochi",
};

export const isCardLayer = (value: string): value is CardLayer =>
  cardLayers.some((layer) => layer === value);

export const cardDoc = (layer: CardLayer) =>
  sceneDoc(
    CARD.width,
    CARD.height,
    CARD.frame,
    { hurt: false, lift: 0, reach: 1, smooth: 0.7 },
    picks[layer],
    layer === "back"
  );
