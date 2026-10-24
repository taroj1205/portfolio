import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { CARD, cardLayers } from "../kingyo/_lib/card";

const drift = stylex.keyframes({
  "0%, 100%": { transform: "translate(0, 0)" },
  "50%": { transform: "translate(16px, -4px)" },
});

const dip = stylex.keyframes({
  "0%, 30%, 100%": { opacity: 1, transform: "scale(1)" },
  "45%, 80%": { opacity: 0.82, transform: "scale(0.95)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  school: {
    animationDuration: "6s",
    animationIterationCount: "infinite",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
  },
  poi: {
    animationDuration: "4.2s",
    animationIterationCount: "infinite",
    animationName: { default: dip, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    transformBox: "view-box",
    transformOrigin: "236px 162px",
  },
});

const motion = {
  back: null,
  poi: styles.poi,
  school: styles.school,
};

export const GoldfishArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${CARD.width} ${CARD.height}`}
    {...stylex.props(styles.art)}
  >
    {cardLayers.map((layer) => (
      <image
        height={CARD.height}
        href={`/games/kingyo/art/${layer}`}
        key={layer}
        width={CARD.width}
        {...stylex.props(motion[layer])}
      />
    ))}
  </svg>
);
