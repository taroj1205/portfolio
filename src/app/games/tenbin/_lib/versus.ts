import { items } from "./items";
import type { Item } from "./items";
import { ratioOf } from "./scale";

export const APART = 1.5;

export interface Pair {
  left: Item;
  right: Item;
}

const fair = items.flatMap((left, i) =>
  items
    .slice(i + 1)
    .filter((right) => ratioOf(left.grams, right.grams) >= APART)
    .map((right) => ({ left, right }))
);

const shares = (pair: Pair, other: Pair | null) =>
  other !== null &&
  [pair.left, pair.right].some(
    (item) => item === other.left || item === other.right
  );

export const pairOf = (roll: () => number, previous: Pair | null): Pair => {
  const fresh = fair.filter((pair) => !shares(pair, previous));
  const pool = fresh.length > 0 ? fresh : fair;

  const pair = pool[Math.floor(roll() * pool.length) % pool.length] ?? {
    left: items[0],
    right: items[1],
  };

  return roll() < 0.5 ? pair : { left: pair.right, right: pair.left };
};

export const heavierOf = (pair: Pair) =>
  pair.left.grams > pair.right.grams ? pair.left : pair.right;
