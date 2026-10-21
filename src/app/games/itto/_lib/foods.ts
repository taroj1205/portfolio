import { areaOf, centroidOf, signedArea } from "./geometry";
import type { Point } from "./geometry";
import type { Bite, Grain } from "./outline";
import { SEED_MAX, pick, seeded } from "./random";
import { recipes } from "./recipes";

export const kinds = [
  "tofu",
  "yokan",
  "castella",
  "onigiri",
  "daifuku",
  "kagami",
  "taiyaki",
  "kaki",
  "kamaboko",
  "nerikiri",
  "sushi",
  "rakugan",
  "kashiwa",
  "gyoza",
  "mikan",
  "chikuwa",
  "ebiten",
  "sanma",
  "nasu",
  "takenoko",
  "ninjin",
  "dorayaki",
  "edamame",
  "naruto",
  "kuri",
  "dango",
  "yakitori",
  "nikan",
  "senbei",
  "maki",
] as const;

export const rares = ["kintai", "fuji", "neko", "matsutake"] as const;

export type Kind = (typeof kinds)[number] | (typeof rares)[number];

export const everyKind: readonly Kind[] = [...kinds, ...rares];

export const SPAN = 2.8;
export const RARITY = 1 / 60;

export interface Unit {
  x: number;
  y: number;
  r: number;
  a: number;
  variant: number;
}

export interface Stick {
  from: Point;
  to: Point;
  width: number;
}

export interface Art {
  w: number;
  h: number;
  phase: number;
  variant: number;
  bite: Bite | null;
  spot: Point;
  grains: Grain[];
  units: Unit[];
  stick: Stick | null;
}

interface Place {
  turn: number;
  scale: number;
  x: number;
  y: number;
}

export interface Food {
  kind: Kind;
  parts: Point[][];
  place: Place;
  art: Art;
}

export const isRare = (kind: Kind) => rares.some((rare) => rare === kind);

export const foodOf = (kind: Kind, seed: number): Food => {
  const roll = seeded(seed);
  const { parts, art, tilt } = recipes[kind](roll);
  const turn = tilt === undefined ? roll() * 360 : (roll() * 2 - 1) * tilt;
  const angle = (turn * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const turned = parts.map((points) =>
    points.map((p) => ({
      x: p.x * cos - p.y * sin,
      y: p.x * sin + p.y * cos,
    }))
  );
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (const points of turned) {
    const weight = areaOf(points);
    const centre = centroidOf(points);
    area += weight;
    cx += centre.x * weight;
    cy += centre.y * weight;
  }
  const centre = { x: cx / area, y: cy / area };
  const reach = Math.max(
    ...turned.flat().map((p) => Math.hypot(p.x - centre.x, p.y - centre.y))
  );
  const scale = 1 / reach;
  return {
    art,
    kind,
    parts: turned.map((points) => {
      const placed = points.map((p) => ({
        x: (p.x - centre.x) * scale,
        y: (p.y - centre.y) * scale,
      }));
      return signedArea(placed) < 0 ? placed.toReversed() : placed;
    }),
    place: { scale, turn, x: -centre.x * scale, y: -centre.y * scale },
  };
};

const draw = (seed: number) => {
  const roll = seeded(seed);
  const kind: Kind =
    roll() < RARITY
      ? rares[pick(roll, rares.length)]
      : kinds[pick(roll, kinds.length)];
  return { kind, mould: 1 + Math.floor(roll() * SEED_MAX) };
};

export const kindOf = (seed: number) => draw(seed).kind;

export const dishOf = (seed: number) => {
  const { kind, mould } = draw(seed);
  return foodOf(kind, mould);
};
