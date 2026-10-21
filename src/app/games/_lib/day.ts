const DAY = 86_400_000;
const JST = 9 * 3_600_000;
const FIRST = Date.UTC(2026, 9, 21) / DAY;

export const LAST_DAY = 99_999;

export const dayOf = (now: number) =>
  Math.max(1, Math.floor((now + JST) / DAY) - FIRST + 1);

export const dateOf = (day: number) =>
  new Date((FIRST + day - 1) * DAY).toISOString().slice(0, 10);

export const dayFrom = (date: string) => {
  const day = Date.parse(`${date}T00:00:00Z`) / DAY - FIRST + 1;
  return Number.isInteger(day) && day >= 1 && dateOf(day) === date ? day : null;
};
