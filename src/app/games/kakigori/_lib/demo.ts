import { UNIT, heightOf } from "./pile";
import type { Pile } from "./pile";

const PACE = { hold: 1.4, lean: 400, rate: 100, start: 1.2, tall: 8 * UNIT };

export type Move =
  | { type: "wait" }
  | { type: "pour"; at: number }
  | { type: "again" };

export const steer = (lean: number, rate: number) =>
  Math.max(-120, Math.min(120, PACE.lean * lean + PACE.rate * rate));

export const createDemo = () => {
  let wait = PACE.start;
  let { hold } = PACE;
  let before = 0;
  let rate = 0;

  const next = (pile: Pile, dt: number): Move => {
    if (pile.toppled) {
      wait = PACE.start;
      ({ hold } = PACE);

      return { type: "again" };
    }

    if (dt > 0) {
      rate += ((pile.lean - before) / dt - rate) * Math.min(1, dt * 8);
    }

    before = pile.lean;

    if (wait > 0) {
      wait -= dt;

      return { type: "wait" };
    }

    if (heightOf(pile.cols) < PACE.tall && pile.left > 0) {
      return { at: steer(pile.lean, rate), type: "pour" };
    }

    hold -= dt;

    if (hold > 0) {
      return { type: "wait" };
    }

    wait = PACE.start;
    ({ hold } = PACE);

    return { type: "again" };
  };

  return { next };
};
