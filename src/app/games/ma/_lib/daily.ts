const DAY = 86_400_000;
const JST = 9 * 3_600_000;
const FIRST = Date.UTC(2026, 9, 21) / DAY;

export const LAST_DAY = 99_999;
export const EARLIEST = 500;
export const LATEST = 1500;

export const dayOf = (now: number) =>
  Math.max(1, Math.floor((now + JST) / DAY) - FIRST + 1);

export const dateOf = (day: number) =>
  new Date((FIRST + day - 1) * DAY).toISOString().slice(0, 10);

export const dayFrom = (date: string) => {
  const day = Date.parse(`${date}T00:00:00Z`) / DAY - FIRST + 1;

  return Number.isInteger(day) && day >= 1 && dateOf(day) === date ? day : null;
};

const PRIME = 67_108_859;

const mix = (value: number) => {
  let state = (value * 2_654_435 + 1_013_904) % PRIME;

  for (let round = 0; round < 4; round += 1) {
    state = (state * state + 7919) % PRIME;
  }

  return state;
};

export const dailyTarget = (day: number) =>
  EARLIEST + (mix(day) % (LATEST - EARLIEST + 1));
