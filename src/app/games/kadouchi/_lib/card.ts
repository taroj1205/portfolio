import { docOf, n } from "../../_lib/svg";
import { cork, prizeBody, sceneDoc } from "./art";
import { SHELVES, kinds, prizeIds } from "./prizes";

export const CARD = {
  frame: { size: 800, x: -80, y: -416 },
  height: 360,
  width: 640,
} as const;

const k = CARD.frame.size / 1000;

const at = (x: number, y: number) => ({
  x: CARD.frame.x + x * k,
  y: CARD.frame.y + y * k,
});

const PIVOT = at(kinds.game.x, SHELVES[kinds.game.row]);

const CORNER = at(
  kinds.game.x + kinds.game.w / 2,
  SHELVES[kinds.game.row] - kinds.game.h
);

export const cardLayers = ["back", "prize", "cork"] as const;

export type CardLayer = (typeof cardLayers)[number];

export const isCardLayer = (value: string): value is CardLayer =>
  cardLayers.some((layer) => layer === value);

const whole = (body: string) =>
  docOf(
    { h: CARD.height, w: CARD.width, x: 0, y: 0 },
    CARD.width,
    CARD.height,
    body
  );

const spark = () =>
  Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;

    return `<path d="M${n(CORNER.x + Math.cos(a) * 12)} ${n(CORNER.y + Math.sin(a) * 12)}L${n(CORNER.x + Math.cos(a) * 30)} ${n(CORNER.y + Math.sin(a) * 30)}" stroke="#ffd27a" stroke-width="4" stroke-linecap="round"/>`;
  }).join("");

const bodies: Record<CardLayer, () => string> = {
  back: () =>
    sceneDoc(CARD.width, CARD.height, CARD.frame, {
      got: [],
      gun: false,
      standing: prizeIds.filter((id) => id !== "game"),
    }),
  cork: () =>
    whole(
      `${spark()}<g transform="translate(${n(CORNER.x - 6)} ${n(CORNER.y + 4)}) scale(1.2) rotate(30)">${cork.body}</g>`
    ),
  prize: () =>
    whole(
      `<ellipse cx="${n(PIVOT.x)}" cy="${n(PIVOT.y + 2)}" rx="${n(kinds.game.w * 0.55 * k)}" ry="7" fill="#000" fill-opacity="0.35"/><g transform="translate(${n(PIVOT.x)} ${n(PIVOT.y)}) scale(${n(k)})">${prizeBody("game")}</g>`
    ),
};

export const cardDoc = (layer: CardLayer) => bodies[layer]();
