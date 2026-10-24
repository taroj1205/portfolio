import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { CARD, cardLayers } from "../cheese/_lib/card";

const PULL = "3.6s";

const stretch = stylex.keyframes({
  "0%, 100%": { transform: "scaleY(0.55)" },
  "55%, 70%": { transform: "scaleY(1)" },
});

const lift = stylex.keyframes({
  "0%, 100%": { transform: "translateY(105px)" },
  "55%, 70%": { transform: "translateY(0)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  cheese: {
    animationDuration: PULL,
    animationIterationCount: "infinite",
    animationName: { default: stretch, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.25, 1)",
    transformBox: "view-box",
    transformOrigin: "320px 330px",
  },
  held: {
    animationDuration: PULL,
    animationIterationCount: "infinite",
    animationName: { default: lift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.25, 1)",
  },
});

const motion = { back: null, cheese: styles.cheese, held: styles.held };

export const CheeseArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${CARD.width} ${CARD.height}`}
    {...stylex.props(styles.art)}
  >
    {cardLayers.map((layer) => (
      <image
        height={CARD.height}
        href={`/games/cheese/art/${layer}`}
        key={layer}
        width={CARD.width}
        {...stylex.props(motion[layer])}
      />
    ))}
  </svg>
);
