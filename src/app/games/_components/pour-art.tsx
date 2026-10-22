import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { CARD, streamBox } from "../masu/_lib/still";

const glug = stylex.keyframes({
  "0%, 100%": { transform: "scaleX(1)" },
  "20%": { transform: "scaleX(1.35)" },
  "45%": { transform: "scaleX(0.85)" },
  "70%": { transform: "scaleX(1.18)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  stream: {
    animationDuration: "0.62s",
    animationIterationCount: "infinite",
    animationName: { default: glug, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
    transformBox: "fill-box",
    transformOrigin: "50% 0%",
  },
});

export const PourArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${CARD.width} ${CARD.height}`}
    {...stylex.props(styles.art)}
  >
    <image
      height={CARD.height}
      href="/games/masu/art/scene"
      width={CARD.width}
    />
    <image
      height={streamBox.height}
      href="/games/masu/art/stream"
      width={streamBox.width}
      x={streamBox.x}
      y={streamBox.y}
      {...stylex.props(styles.stream)}
    />
  </svg>
);
