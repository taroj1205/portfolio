import * as stylex from "@stylexjs/stylex";

import { colorOf } from "../_lib/cosmetics";
import type { Item } from "../_lib/cosmetics";
import { outlineOf, stoneSprite } from "../_lib/sprites";

const styles = stylex.create({
  glyph: {
    height: "1.9rem",
    objectFit: "contain",
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

const patterns = new Map<string, HTMLCanvasElement>();

const patternSprite = (id: string) => {
  const cached = patterns.get(id);
  if (cached) {
    return cached;
  }
  const made = stoneSprite(colorOf("river"), "round", id);
  patterns.set(id, made);
  return made;
};

const TRAIL_PREVIEW = new Map<string, string>([
  ["fox", "linear-gradient(90deg, transparent, #5aa8ff, #d6f2ff)"],
  ["gold", "linear-gradient(90deg, transparent, #c98a1e, #fff4c2)"],
  ["sakura", "linear-gradient(90deg, transparent, #f7a8c4, #ffe3ec)"],
  ["spray", "linear-gradient(90deg, transparent, #9fc3dd, #ffffff)"],
  [
    "rainbow",
    "linear-gradient(90deg, transparent, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff)",
  ],
  ["ink", "linear-gradient(90deg, transparent, #3a3a48, #0e0e16)"],
  [
    "bubble",
    "radial-gradient(circle at 72% 50%, transparent 28%, #dff4ff 31%, transparent 38%), linear-gradient(90deg, transparent, #9fd3ea)",
  ],
  ["comet", "linear-gradient(90deg, transparent, #7aa8ff, #ffffff)"],
]);

export const Preview = ({ part, option }: Item) => {
  if (part === "form") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 256 160"
        {...stylex.props(styles.glyph)}
      >
        <polygon
          fill="currentColor"
          opacity="0.85"
          points={outlineOf(option.id).join(" ")}
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
  if (part === "pattern") {
    return (
      <canvas
        aria-hidden="true"
        height={160}
        ref={(canvas) => {
          const ctx = canvas?.getContext("2d");
          ctx?.clearRect(0, 0, 256, 160);
          ctx?.drawImage(patternSprite(option.id), 0, 0);
        }}
        width={256}
        {...stylex.props(styles.glyph)}
      />
    );
  }
  return (
    <span
      {...stylex.props(styles.swatch(TRAIL_PREVIEW.get(option.id) ?? ""))}
    />
  );
};
