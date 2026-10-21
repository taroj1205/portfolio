export const SEED_MAX = 2_147_483_646;

export type Roll = () => number;

export const seeded = (seed: number): Roll => {
  let state = (Math.abs(Math.floor(seed)) % SEED_MAX) + 1;
  const step = () => {
    state = (state * 48_271) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
  for (let i = 0; i < 6; i += 1) {
    step();
  }
  return step;
};

export const between = (roll: Roll, min: number, max: number) =>
  min + roll() * (max - min);

export const pick = (roll: Roll, count: number) =>
  Math.min(count - 1, Math.floor(roll() * count));
