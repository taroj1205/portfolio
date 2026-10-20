import * as stylex from "@stylexjs/stylex";

export const ink = stylex.defineConsts({
  soft: "rgb(255 255 255 / 0.86)",
  text: "#fffaf3",
});

export const font = stylex.defineConsts({
  mincho: 'var(--font-mincho), "Hiragino Mincho ProN", "Yu Mincho", serif',
});

export const media = stylex.defineConsts({
  reduce: "@media (prefers-reduced-motion: reduce)",
});

export const shade = stylex.defineConsts({
  large:
    "0 0 2px rgb(0 0 0 / 0.3), 0 2px 14px rgb(0 0 0 / 0.45), 0 8px 48px rgb(0 0 0 / 0.4)",
  small:
    "0 0 2px rgb(0 0 0 / 0.45), 0 1px 3px rgb(0 0 0 / 0.4), 0 0 18px rgb(0 0 0 / 0.35)",
});
