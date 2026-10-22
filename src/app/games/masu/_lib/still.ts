import { opsSvg, stillDoc } from "./art";
import { drawList, streamOps } from "./draw";
import type { Moment } from "./draw";
import { createWave, spillageOf, streamOf } from "./liquid";
import { domeOf, pourOf } from "./pour";
import type { Glass } from "./result";
import {
  GLASS_TOP,
  angleAt,
  box,
  fillOf,
  jetOf,
  landingOf,
  lipOf,
  poseOf,
} from "./scene";
import type { Fill, View } from "./scene";

const SETTLED = 60;
const PITCH_SEED = 11;
const PITCH_AT = 1.4;

const brimming: Fill = {
  dome: 3.2,
  glass: { dome: 2.2, level: GLASS_TOP, over: true },
  level: box.height,
};

const resting = (
  fill: Fill,
  strain: number,
  spillage: Moment["spillage"],
  pouring = false
): Moment => {
  const pour = pourOf(PITCH_SEED);
  const angle = angleAt(pour, Infinity, PITCH_AT);
  const lip = lipOf(pour);
  return {
    bottle: pouring
      ? {
          matrix: { ...poseOf(angle, 1), e: lip.x, f: lip.y },
          name: pour.bottle,
        }
      : null,
    bubbles: [],
    clock: 0,
    drops: [],
    film: pouring ? 0.6 : 0,
    fill,
    flux: 0,
    rate: pouring ? 1 : 0,
    spillage,
    strain,
    stream: pouring
      ? streamOf(
          jetOf(pour, Infinity),
          PITCH_AT,
          landingOf(fill, strain),
          pour.flow
        )
      : null,
    wave: createWave(2),
  };
};

const pitch = resting(brimming, 0.6, null, true);

export const stillOf = (glass: Glass | null): Moment => {
  if (glass === null) {
    return pitch;
  }
  const { pour, outcome } = glass;
  if (outcome.spilledAt !== null) {
    return resting(
      fillOf(pour, outcome.volume),
      0,
      spillageOf(pour.seed, () => glass.spilled, SETTLED, box.height, box.outer)
    );
  }
  return resting(
    fillOf(pour, outcome.volume),
    domeOf(pour, outcome.volume),
    null
  );
};

export const CARD = { height: 360, width: 640 } as const;

const cardFrame: View = { cx: 318, cy: 214, scale: 1.92 };

export const cardLayers = ["scene", "stream"] as const;

export type CardLayer = (typeof cardLayers)[number];

export const isCardLayer = (value: string): value is CardLayer =>
  cardLayers.some((layer) => layer === value);

const streamPoints = (pitch.stream?.threads ?? []).flat();

export const streamBox = (() => {
  const xs = streamPoints.map((p) => cardFrame.cx + p.x * cardFrame.scale);
  const ys = streamPoints.map((p) => cardFrame.cy + p.y * cardFrame.scale);
  const x = Math.floor(Math.min(...xs) - 6);
  const y = Math.floor(Math.min(...ys) - 2);
  return {
    height: Math.ceil(Math.max(...ys) + 2) - y,
    width: Math.ceil(Math.max(...xs) + 6) - x,
    x,
    y,
  };
})();

export const cardDoc = (layer: CardLayer) => {
  if (layer === "scene") {
    return stillDoc(
      CARD.width,
      CARD.height,
      cardFrame,
      drawList({ ...pitch, stream: null })
    );
  }
  const { body, defs } = opsSvg(
    streamOps(pitch.stream, pitch.clock),
    "stream-"
  );
  const { x, y, width, height } = streamBox;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${x} ${y} ${width} ${height}" width="${width}" height="${height}"><defs>${defs}</defs><g transform="translate(${cardFrame.cx} ${cardFrame.cy}) scale(${cardFrame.scale})">${body}</g></svg>`;
};
