import type { Dish } from "./dishes";

export const TICK = 1 / 120;
export const START = 3;
export const MOON = 38_440_000_000;
export const SWEET = 0.72;

const SLOW = 0.4;
const GRIP = 4.5;
const RELAX = 0.9;
const AFTER = 0.35;
const FLOOR = 0.02;
const SMOOTH = 1 - Math.exp(-TICK / 0.08);
const MODULUS = 2_147_483_647;

export type End = "snapped" | "set" | "moon";

export interface Strand {
  thickness: number;
  phase: number;
  at: number;
  snapped: number | null;
}

export interface Run {
  dish: Dish;
  time: number;
  length: number;
  heat: number;
  rate: number;
  load: number;
  strain: number;
  sweet: number;
  strands: Strand[];
  end: End | null;
}

const randomFrom = (seed: number) => {
  let state = (Math.abs(Math.floor(seed)) % (MODULUS - 1)) + 1;
  return () => {
    state = (state * 48_271) % MODULUS;
    return (state - 1) / (MODULUS - 1);
  };
};

export const createRun = (dish: Dish, seed: number): Run => {
  const roll = randomFrom(seed);
  return {
    dish,
    end: null,
    heat: 1,
    length: START,
    load: 0,
    rate: 0,
    strain: 0,
    strands: Array.from({ length: dish.strands }, () => ({
      at: 0.3 + roll() * 0.4,
      phase: roll() * Math.PI * 2,
      snapped: null,
      thickness: 0.7 + roll() * 0.6,
    })),
    sweet: 0,
    time: 0,
  };
};

export const aliveOf = (run: Run) =>
  run.strands.filter((strand) => strand.snapped === null).length;

export const limitOf = (run: Run) =>
  run.dish.give *
  Math.max(0, run.heat) ** 0.8 *
  (0.7 + (0.3 * aliveOf(run)) / run.strands.length);

export const isSweet = (load: number) => load >= SWEET && load <= 1;

const snap = (run: Run) => {
  let weakest: Strand | null = null;
  for (const strand of run.strands) {
    if (
      strand.snapped === null &&
      (weakest === null || strand.thickness < weakest.thickness)
    ) {
      weakest = strand;
    }
  }
  if (weakest !== null) {
    weakest.snapped = run.time;
  }
  run.strain = AFTER;
  if (aliveOf(run) === 0) {
    run.end = "snapped";
  }
};

export const step = (run: Run, growth: number) => {
  if (run.end !== null) {
    return;
  }
  run.time += TICK;
  run.rate += (Math.max(0, growth) / TICK - run.rate) * SMOOTH;
  run.load = run.rate / Math.max(1e-3, limitOf(run));
  const sweet = isSweet(run.load);
  if (sweet) {
    run.sweet += TICK;
  }
  run.heat -= (TICK / run.dish.cool) * (sweet ? SLOW : 1);
  run.length = Math.min(MOON, run.length * Math.exp(Math.max(0, growth)));
  run.strain =
    run.load > 1
      ? run.strain + (run.load - 1) * GRIP * TICK
      : Math.max(0, run.strain - RELAX * TICK);
  if (run.strain >= 1) {
    snap(run);
  }
  if (run.end !== null) {
    return;
  }
  if (run.length >= MOON) {
    run.end = "moon";
  } else if (run.heat <= FLOOR) {
    run.heat = 0;
    run.end = "set";
  }
};
