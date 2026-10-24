import type { Text } from "../../_lib/i18n";

export const dishIds = ["pizza", "corndog", "fondue"] as const;

export type DishId = (typeof dishIds)[number];

export interface Dish {
  id: DishId;
  name: Text;
  give: number;
  cool: number;
  strands: number;
  width: number;
}

export const dishes: Record<DishId, Dish> = {
  corndog: {
    cool: 17,
    give: 1.68,
    id: "corndog",
    name: { en: "Cheese corn dog", ja: "チーズハットグ" },
    strands: 4,
    width: 22,
  },
  fondue: {
    cool: 13.5,
    give: 2.25,
    id: "fondue",
    name: { en: "Cheese fondue", ja: "チーズフォンデュ" },
    strands: 7,
    width: 30,
  },
  pizza: {
    cool: 16,
    give: 1.85,
    id: "pizza",
    name: { en: "Pizza", ja: "ピザ" },
    strands: 6,
    width: 34,
  },
};

const DAY = 86_400_000;
const JST = 9 * 3_600_000;

export const isDishId = (value: string): value is DishId =>
  dishIds.some((id) => id === value);

export const dishOfDay = (now: number): DishId =>
  dishIds[Math.floor((now + JST) / DAY) % dishIds.length] ?? "pizza";
