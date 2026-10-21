export const EARLIEST = 500;
export const LATEST = 1500;

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
