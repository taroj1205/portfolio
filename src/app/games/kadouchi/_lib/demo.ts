import { kinds } from "./prizes";
import { FULL, cleared, spotOf, still } from "./stall";
import type { Stall } from "./stall";

const PACE = { again: 1.6, rest: 0.9, start: 1.2, steer: 6 };

export interface DemoMove {
  aim: { x: number; y: number };
  held: number | null;
  fire: boolean;
  again: boolean;
}

export const createDemo = (random: () => number) => {
  let wait = PACE.start;
  let held: number | null = null;
  let side = 1;
  let aim = { x: 500, y: 700 };

  const goal = (stall: Stall) => {
    const standing = stall.prizes.filter((prize) => prize.down === null);

    const [prize] = standing.toSorted(
      (a, b) => kinds[a.id].row - kinds[b.id].row || a.x - b.x
    );

    if (prize === undefined) {
      return aim;
    }

    const u = kinds[prize.id].size === "small" ? 0 : side * 0.85;

    return spotOf(prize, u, 0.9);
  };

  const next = (stall: Stall, dt: number): DemoMove => {
    const done = cleared(stall) || (stall.corks === 0 && still(stall));

    if (done) {
      wait -= dt;

      if (wait <= -PACE.again) {
        wait = PACE.start;

        return { again: true, aim, fire: false, held: null };
      }

      return { again: false, aim, fire: false, held: null };
    }

    const target = goal(stall);
    const k = Math.min(1, dt * PACE.steer);
    aim = {
      x: aim.x + (target.x - aim.x) * k,
      y: aim.y + (target.y - aim.y) * k,
    };

    if (wait > 0) {
      wait -= dt;

      return { again: false, aim, fire: false, held: null };
    }

    held = (held ?? 0) + dt;

    if (held >= FULL + random() * 0.1) {
      held = null;
      wait = PACE.rest;
      side = -side;

      return { again: false, aim, fire: true, held: FULL };
    }

    return { again: false, aim, fire: false, held };
  };

  return { next };
};
