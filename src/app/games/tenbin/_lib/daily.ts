import { items } from "./items";
import type { Item } from "./items";
import { gradeOf, gramsAt } from "./scale";
import type { Grade } from "./scale";

const DAY = 86_400_000;
const JST = 9 * 3_600_000;
const FIRST = Date.UTC(2026, 9, 25) / DAY;

export const LAST_DAY = 99_999;
export const TRIES = 5;

export const dayOf = (now: number) =>
  Math.max(1, Math.floor((now + JST) / DAY) - FIRST + 1);

export const dateOf = (day: number) =>
  new Date((FIRST + day - 1) * DAY).toISOString().slice(0, 10);

export const dayFrom = (date: string) => {
  const day = Date.parse(`${date}T00:00:00Z`) / DAY - FIRST + 1;

  return Number.isInteger(day) && day >= 1 && dateOf(day) === date ? day : null;
};

export const nextDayIn = (now: number) => DAY - ((now + JST) % DAY);

export const itemOfDay = (day: number): Item =>
  items[(day - 1) % items.length] ?? items[0];

export type Outcome = "playing" | "won" | "lost";

export const gradesOf = (guesses: readonly number[], item: Item): Grade[] =>
  guesses.map((step) => gradeOf(gramsAt(step), item.grams));

export const outcomeOf = (grades: readonly Grade[]): Outcome => {
  if (grades.includes("hit")) {
    return "won";
  }

  return grades.length >= TRIES ? "lost" : "playing";
};
