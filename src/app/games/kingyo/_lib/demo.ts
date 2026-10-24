import type { Point } from "../../_lib/svg";
import { WATER, catchable, dip, freshen, lift } from "./tank";
import type { Outcome, Tank } from "./tank";

const PACE = { lead: 130, patience: 3.5, rest: 1.1, settle: 0.5, start: 1.5 };

export type Move =
  | { type: "dip"; at: Point }
  | { type: "lift"; outcomes: Outcome[] };

const aheadOf = (tank: Tank): Point | null => {
  const centre = { x: 500, y: 500 };

  const ahead = tank.fish
    .filter((fish) => fish.fright === 0)
    .map((fish) => ({
      fish,
      x: fish.x + Math.cos(fish.heading) * PACE.lead,
      y: fish.y + Math.sin(fish.heading) * PACE.lead,
    }))
    .filter(
      (spot) =>
        spot.x > WATER.left + 90 &&
        spot.x < WATER.right - 90 &&
        spot.y > WATER.top + 90 &&
        spot.y < WATER.bottom - 90
    )
    .toSorted(
      (a, b) =>
        Math.hypot(a.fish.x - centre.x, a.fish.y - centre.y) -
        Math.hypot(b.fish.x - centre.x, b.fish.y - centre.y)
    );

  return ahead.length > 0 ? { x: ahead[0].x, y: ahead[0].y } : null;
};

export const createDemo = () => {
  let wait = PACE.start;
  let held = 0;
  let seen = -1;

  const next = (tank: Tank, dt: number): Move | null => {
    if (tank.poi.torn) {
      return null;
    }

    if (!tank.poi.down) {
      wait -= dt;
      const at = wait <= 0 ? aheadOf(tank) : null;

      if (at === null) {
        return null;
      }

      dip(tank, at);
      held = 0;
      seen = -1;

      return { at: { x: tank.poi.x, y: tank.poi.y }, type: "dip" };
    }

    held += dt;

    if (seen < 0 && catchable(tank).length > 0) {
      seen = held;
    }

    if ((seen >= 0 && held - seen >= PACE.settle) || held >= PACE.patience) {
      wait = PACE.rest;
      const outcomes = lift(tank);
      freshen(tank);

      return { outcomes, type: "lift" };
    }

    return null;
  };

  return { next };
};
