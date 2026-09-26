import * as stylex from "@stylexjs/stylex";

export const color = stylex.defineVars({
  cobalt: "#2b4cff",
  cobaltDeep: "#1e36c9",
  cobaltSoft: "#e6ecff",
  green: "#1f9d55",
  ink: "#12100e",
  line: "#e4dcd1",
  merged: "#8250df",
  muted: "#6b655e",
  paper: "#f5f1ea",
  paperDeep: "#ebe4d8",
  surface: "#fff",
  tangerine: "#ff7a45",
  tangerineInk: "#b8461b",
  tangerineSoft: "#ffede4",
});

export const ease = stylex.defineConsts({
  drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  spring: "cubic-bezier(0.34, 1.3, 0.64, 1)",
});

export const font = stylex.defineConsts({
  display: "var(--font-display), system-ui, sans-serif",
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
});

export const media = stylex.defineConsts({
  // Touch devices fire hover on tap, so hover effects wait for a real pointer.
  hover: "@media (hover: hover) and (pointer: fine)",
  motion: "@media (prefers-reduced-motion: no-preference)",
  narrow: "@media (max-width: 520px)",
  reduce: "@media (prefers-reduced-motion: reduce)",
  stack: "@media (max-width: 900px)",
  tablet: "@media (max-width: 800px)",
});

export const shadow = stylex.defineConsts({
  lift: "0 28px 70px rgb(18 16 14 / 0.12)",
  soft: "0 12px 32px rgb(18 16 14 / 0.05)",
});

export const size = stylex.defineConsts({
  gutter: "clamp(1.25rem, 4vw, 2.5rem)",
  wrap: "1180px",
});
