import * as stylex from "@stylexjs/stylex";

import { colorOf } from "../_lib/cosmetics";
import type { Item } from "../_lib/cosmetics";

const styles = stylex.create({
  glyph: {
    height: "1.9rem",
    width: "2.6rem",
  },
  swatch: (background: string) => ({
    backgroundImage: background,
    borderRadius: 999,
    boxShadow: "inset 0 -3px 6px rgb(0 0 0 / 0.4), 0 2px 6px rgb(0 0 0 / 0.3)",
    flexShrink: 0,
    height: "1.9rem",
    width: "2.6rem",
  }),
});

const STONE_FACE =
  "radial-gradient(circle at 35% 30%, #d8d4cc, #8d8a84 55%, #4f4c47)";

const PATTERN_PREVIEW = new Map<string, string>([
  ["plain", STONE_FACE],
  [
    "ring",
    `radial-gradient(circle, transparent 38%, #f6f2e8 40%, #f6f2e8 52%, transparent 54%), ${STONE_FACE}`,
  ],
  [
    "speckle",
    `radial-gradient(circle at 30% 40%, #2b2a28 8%, transparent 9%), radial-gradient(circle at 65% 60%, #f6f2e8 7%, transparent 8%), radial-gradient(circle at 55% 30%, #2b2a28 6%, transparent 7%), ${STONE_FACE}`,
  ],
  [
    "stripe",
    `repeating-linear-gradient(170deg, transparent 0 5px, rgb(255 255 255 / 0.45) 5px 8px), ${STONE_FACE}`,
  ],
]);

const TRAIL_PREVIEW = new Map<string, string>([
  ["fox", "linear-gradient(90deg, transparent, #5aa8ff, #d6f2ff)"],
  ["gold", "linear-gradient(90deg, transparent, #c98a1e, #fff4c2)"],
  ["sakura", "linear-gradient(90deg, transparent, #f7a8c4, #ffe3ec)"],
  ["spray", "linear-gradient(90deg, transparent, #9fc3dd, #ffffff)"],
]);

const FORM_PATH = new Map<string, string>([
  ["flat", "M4 16c0-4 10-6 22-6s22 2 22 6-10 6-22 6S4 20 4 16z"],
  [
    "heart",
    "M26 28C14 20 8 15 8 10a7 7 0 0 1 18-2 7 7 0 0 1 18 2c0 5-6 10-18 18z",
  ],
  ["oval", "M6 16c0-6 9-10 20-10s20 4 20 10-9 10-20 10S6 22 6 16z"],
  ["round", "M12 16a14 13 0 1 0 28 0a14 13 0 1 0-28 0z"],
]);

export const Preview = ({ part, option }: Item) => {
  if (part === "form") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 52 32"
        {...stylex.props(styles.glyph)}
      >
        <path
          d={FORM_PATH.get(option.id) ?? ""}
          fill="currentColor"
          opacity="0.85"
        />
      </svg>
    );
  }
  if (part === "color") {
    const [light, mid, dark] = colorOf(option.id).mineral;
    return (
      <span
        {...stylex.props(
          styles.swatch(
            `radial-gradient(circle at 35% 30%, ${light}, ${mid} 55%, ${dark})`
          )
        )}
      />
    );
  }
  const preview = part === "pattern" ? PATTERN_PREVIEW : TRAIL_PREVIEW;
  return (
    <span {...stylex.props(styles.swatch(preview.get(option.id) ?? ""))} />
  );
};
