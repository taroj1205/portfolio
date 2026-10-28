import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { CARD, cardLayers } from "../kadouchi/_lib/card";

const twist = stylex.keyframes({
  "0%, 30%, 100%": { transform: "rotate(0deg)" },
  "36%": { transform: "rotate(-4deg) translateY(-3px)" },
  "44%": { transform: "rotate(2deg)" },
  "52%": { transform: "rotate(-1deg)" },
  "60%": { transform: "rotate(0deg)" },
});

const fly = stylex.keyframes({
  "0%": { opacity: 0, transform: "translate(40px, 220px) scale(2.2)" },
  "28%": { opacity: 1, transform: "translate(0, 0) scale(1)" },
  "34%": { opacity: 1, transform: "translate(0, 0) scale(1)" },
  "50%, 100%": { opacity: 0, transform: "translate(-10px, 40px) scale(0.8)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  prize: {
    animationDuration: "2.4s",
    animationIterationCount: "infinite",
    animationName: { default: twist, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
    transformBox: "view-box",
    transformOrigin: "176px 304px",
  },
  cork: {
    animationDuration: "2.4s",
    animationIterationCount: "infinite",
    animationName: { default: fly, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    opacity: { default: 0, [media.reduce]: 1 },
    transformBox: "view-box",
    transformOrigin: "284px 108px",
  },
});

const motion = { back: null, cork: styles.cork, prize: styles.prize };

export const KadouchiArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${CARD.width} ${CARD.height}`}
    {...stylex.props(styles.art)}
  >
    {cardLayers.map((layer) => (
      <image
        height={CARD.height}
        href={`/games/kadouchi/art/${layer}`}
        key={layer}
        width={CARD.width}
        {...stylex.props(motion[layer])}
      />
    ))}
  </svg>
);
