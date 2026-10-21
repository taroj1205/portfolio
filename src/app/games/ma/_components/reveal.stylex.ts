import * as stylex from "@stylexjs/stylex";

const AT = 1350;
const SEEN = 260;

export const reveal = stylex.defineConsts({
  at: `${AT}ms`,
  band: `${AT + 420}ms`,
  ruler: `${AT + 120}ms`,
  seen: `${SEEN}ms`,
  sheet: `${AT + 250}ms`,
  unseen: `${AT - SEEN}ms`,
});
