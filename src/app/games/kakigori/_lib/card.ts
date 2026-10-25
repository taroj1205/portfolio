import { docOf, n, seeded } from "../../_lib/svg";
import { ORIGIN, SCENE, moundBody, sceneDoc } from "./art";

export const CARD = {
  frame: { size: 520, x: 60, y: -92 },
  height: 360,
  width: 640,
} as const;

const PIVOT = {
  x: CARD.frame.x + (ORIGIN.x * CARD.frame.size) / SCENE,
  y: CARD.frame.y + (ORIGIN.y * CARD.frame.size) / SCENE,
} as const;

export const cardLayers = ["back", "mound", "flakes"] as const;

export type CardLayer = (typeof cardLayers)[number];

const PROFILE = [
  30, 120, 230, 320, 380, 415, 435, 445, 445, 435, 415, 380, 320, 230, 120, 30,
];

export const isCardLayer = (value: string): value is CardLayer =>
  cardLayers.some((layer) => layer === value);

const k = CARD.frame.size / SCENE;

const flakes = () => {
  const random = seeded(7);

  return Array.from({ length: 26 }, () => {
    const x = PIVOT.x + (random() - 0.5) * 120;
    const y = random() * (PIVOT.y - 220 * k);
    const r = 2 + random() * 2.5;

    return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="#fff" fill-opacity="${n(0.7 + random() * 0.3)}"/>`;
  }).join("");
};

const bodies: Record<CardLayer, () => string> = {
  back: () =>
    sceneDoc(CARD.width, CARD.height, CARD.frame, {
      lean: 0,
      profile: null,
      syrup: null,
      toppled: false,
    }),
  flakes: () =>
    docOf(
      { h: CARD.height, w: CARD.width, x: 0, y: 0 },
      CARD.width,
      CARD.height,
      flakes()
    ),
  mound: () =>
    docOf(
      { h: CARD.height, w: CARD.width, x: 0, y: 0 },
      CARD.width,
      CARD.height,
      `<g transform="translate(${n(PIVOT.x)} ${n(PIVOT.y)}) scale(${n(k)})">${moundBody(PROFILE, "ichigo", "cd")}</g>`
    ),
};

export const cardDoc = (layer: CardLayer) => bodies[layer]();
