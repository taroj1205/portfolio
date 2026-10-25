import { z } from "zod";

import type { Lang } from "../../_lib/i18n";
import type { Share } from "../../_lib/share";
import { copy } from "./copy";
import { LAST_DAY, TRIES, itemOfDay, outcomeOf } from "./daily";
import { itemById } from "./items";
import type { Item } from "./items";
import { gradeOrder, squares } from "./scale";
import type { Grade } from "./scale";

export interface Solve {
  item: Item;
  day: number | null;
  grades: Grade[];
}

export type Shared =
  | { kind: "daily"; solve: Solve }
  | { kind: "versus"; chain: number };

const letters: Record<Grade, string> = {
  far: "f",
  hit: "h",
  near: "n",
  way: "w",
};

const gradeFrom = (letter: string): Grade =>
  gradeOrder.find((grade) => letters[grade] === letter) ?? "way";

const whole = (min: number, max: number) =>
  z
    .string()
    .regex(/^[1-9]\d{0,4}$/u)
    .transform(Number)
    .pipe(z.number().int().min(min).max(max));

const dailyQuery = z.object({
  i: z.string().regex(/^[a-z0-9-]{1,24}$/u),
  n: whole(1, LAST_DAY).optional(),
  s: z.string().regex(/^(?:[nfw]{0,4}h|[nfw]{5})$/u),
});

const versusQuery = z.object({ c: whole(1, 99_999) });

type Params = Record<string, string | string[] | undefined>;

export const readShared = (params: Params): Shared | null => {
  const daily = dailyQuery.safeParse(params);

  if (daily.success) {
    const item = itemById(daily.data.i);
    const day = daily.data.n ?? null;

    return item === undefined
      ? null
      : {
          kind: "daily",
          solve: {
            day: day !== null && itemOfDay(day).id === item.id ? day : null,
            grades: Array.from({ length: daily.data.s.length }, (_, i) =>
              gradeFrom(daily.data.s.charAt(i))
            ),
            item,
          },
        };
  }

  const versus = versusQuery.safeParse(params);

  return versus.success ? { chain: versus.data.c, kind: "versus" } : null;
};

export const queryOf = (shared: Shared) => {
  if (shared.kind === "versus") {
    return new URLSearchParams({ c: String(shared.chain) }).toString();
  }

  const { item, day, grades } = shared.solve;

  const query = new URLSearchParams({
    i: item.id,
    s: grades.map((grade) => letters[grade]).join(""),
  });

  if (day !== null) {
    query.set("n", String(day));
  }

  return query.toString();
};

export const scoreOf = (grades: readonly Grade[]) =>
  `${outcomeOf(grades) === "won" ? grades.length : "X"}/${TRIES}`;

export const rowOf = (grades: readonly Grade[]) =>
  grades.map((grade) => squares[grade]).join("");

const hashtags: Record<Lang, string> = {
  en: "#一億トン天秤 #Heftle",
  ja: "#一億トン天秤",
};

const lineOf = (shared: Shared, lang: Lang) => {
  const words = copy[lang];

  if (shared.kind === "versus") {
    return words.share.versus(shared.chain);
  }

  const { item, day, grades } = shared.solve;

  return [
    `${words.share.daily(day)} ${item.emoji} ${scoreOf(grades)}`,
    rowOf(grades),
    words.share.dare(item.name[lang]),
  ].join("\n");
};

export const shareOf = (shared: Shared, origin: string, lang: Lang): Share => {
  const query = new URLSearchParams(queryOf(shared));
  query.set("l", lang);

  return {
    image: `${origin}/games/tenbin/og?${query.toString()}`,
    text: `${lineOf(shared, lang)}\n${hashtags[lang]}`,
    url: `${origin}/games/tenbin?${query.toString()}`,
  };
};

export const titleOf = (shared: Shared, lang: Lang) => {
  const words = copy[lang];

  if (shared.kind === "versus") {
    return words.share.versus(shared.chain);
  }

  const { item, day, grades } = shared.solve;

  return `${words.share.daily(day)} ${item.emoji} ${scoreOf(grades)} ${rowOf(grades)}`;
};
