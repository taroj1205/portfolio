import * as stylex from "@stylexjs/stylex";

import { media } from "../../_components/theme.stylex";
import { bodies } from "../_lib/bodies";
import { BodyIcon } from "./body-icon";

const beckon = stylex.keyframes({
  "0%, 100%": { opacity: 0.45, transform: "scale(1)" },
  "50%": { opacity: 0.9, transform: "scale(1.12)" },
});

const styles = stylex.create({
  hidden: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  row: {
    alignItems: "center",
    display: "flex",
    gap: "clamp(2px, 1vw, 6px)",
    justifyContent: "center",
    margin: 0,
  },
  step: {
    display: "flex",
    position: "relative",
    transitionDuration: "600ms",
    transitionProperty: "filter, opacity",
  },
  unknown: {
    filter: "brightness(0) drop-shadow(0 0 1px rgb(255 255 255 / 0.55))",
    opacity: 0.55,
  },
  goal: {
    animationDuration: "2.4s",
    animationIterationCount: "infinite",
    animationName: { default: beckon, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
  },
  mark: {
    color: "rgb(255 255 255 / 0.7)",
    fontSize: "0.6rem",
    fontWeight: 800,
    inset: 0,
    lineHeight: 1,
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    position: "absolute",
  },
});

const sizeOf = (tier: number, scale: number) => {
  const px = (16 + tier * 2.2) * scale;

  return `min(${px.toFixed(1)}px, ${(px / 4).toFixed(2)}vw)`;
};

interface LadderProps {
  reached: number;
  label: string;
  scale?: number;
  goal?: boolean;
}

export const Ladder = ({
  reached,
  label,
  scale = 1,
  goal = false,
}: LadderProps) => (
  <p {...stylex.props(styles.row)}>
    <span {...stylex.props(styles.hidden)}>{label}</span>
    {bodies.map((kind, tier) => {
      const known = tier <= reached;
      const next = goal && tier === reached + 1;

      return (
        <span
          key={kind.name.en}
          {...stylex.props(styles.step, next && styles.goal)}
        >
          <span {...stylex.props(styles.step, !known && styles.unknown)}>
            <BodyIcon size={sizeOf(tier, scale)} tier={tier} />
          </span>
          {next ? (
            <span aria-hidden="true" {...stylex.props(styles.mark)}>
              ?
            </span>
          ) : null}
        </span>
      );
    })}
  </p>
);
