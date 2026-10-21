import { NOTCHES } from "./moulds";
import type { Point, Mould } from "./moulds";

const LINE = 0.026;
export const SAFE = 0.12;
export const WARNINGS = [0.3, 0.55, 0.8] as const;
const REACH = 0.024;
const RUSH = 0.9;
const STRAY = 9;
const EASE = 0.2;
const STEP = 0.004;
const REARM = 0.15;

export type Snap =
  | { type: "warn"; at: Point; level: number }
  | { type: "break"; at: Point }
  | { type: "clear" };

export interface Carving {
  mould: Mould;
  carved: boolean[];
  count: number;
  tension: number;
  warned: number;
  touching: boolean;
  over: boolean;
}

export const createCarving = (mould: Mould): Carving => ({
  carved: Array.from({ length: NOTCHES }, () => false),
  count: 0,
  over: false,
  mould,
  tension: 0,
  touching: false,
  warned: 0,
});

export const percentOf = (carving: Carving) =>
  Math.floor((carving.count * 100) / NOTCHES);

const touch = (carving: Carving, at: Point) => {
  let nearest = Infinity;
  for (const [i, notch] of carving.mould.outline.entries()) {
    const gap = Math.hypot(notch.x - at.x, notch.y - at.y);
    nearest = Math.min(nearest, gap);
    if (gap <= REACH && !carving.carved[i]) {
      carving.carved[i] = true;
      carving.count += 1;
    }
  }
  return nearest;
};

const warnings = (carving: Carving, at: Point, snaps: Snap[]) => {
  while (
    carving.warned < WARNINGS.length &&
    carving.tension >= WARNINGS[carving.warned]
  ) {
    carving.warned += 1;
    snaps.push({ at, level: carving.warned, type: "warn" });
  }
};

export const scratch = (
  carving: Carving,
  from: Point,
  to: Point,
  seconds: number
): Snap[] => {
  if (carving.over) {
    return [];
  }
  const snaps: Snap[] = [];
  const moved = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(moved / STEP));
  const rush = (Math.max(0, moved - SAFE * seconds) / SAFE) * RUSH;
  for (let i = 1; i <= steps; i += 1) {
    const at = {
      x: from.x + ((to.x - from.x) * i) / steps,
      y: from.y + ((to.y - from.y) * i) / steps,
    };
    const off = touch(carving, at) - LINE;
    carving.touching ||= off <= 0;
    if (carving.touching) {
      const stray = STRAY * Math.min(1, Math.max(0, off) / LINE);
      carving.tension += (rush + moved * stray) / steps;
    }
  }
  warnings(carving, to, snaps);
  if (carving.count === NOTCHES) {
    carving.over = true;
    snaps.push({ type: "clear" });
  } else if (carving.tension >= 1) {
    carving.tension = 1;
    carving.over = true;
    snaps.push({ at: to, type: "break" });
  }
  return snaps;
};

export const lift = (carving: Carving) => {
  carving.touching = false;
};

export const rest = (carving: Carving, seconds: number) => {
  if (carving.over) {
    return;
  }
  carving.tension = Math.max(0, carving.tension - EASE * seconds);
  while (
    carving.warned > 0 &&
    carving.tension < WARNINGS[carving.warned - 1] - REARM
  ) {
    carving.warned -= 1;
  }
};
