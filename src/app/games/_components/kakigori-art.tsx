import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { CARD, cardLayers } from "../kakigori/_lib/card";

const sway = stylex.keyframes({
  "0%, 100%": { transform: "rotate(-2.5deg)" },
  "50%": { transform: "rotate(2.5deg)" },
});

const fall = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(-30px)" },
  "20%, 80%": { opacity: 1 },
  "100%": { opacity: 0, transform: "translateY(40px)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  mound: {
    animationDuration: "3.2s",
    animationIterationCount: "infinite",
    animationName: { default: sway, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
    transformBox: "view-box",
    transformOrigin: "320px 241px",
  },
  flakes: {
    animationDuration: "1.6s",
    animationIterationCount: "infinite",
    animationName: { default: fall, [media.reduce]: "none" },
    animationTimingFunction: "linear",
  },
});

const motion = { back: null, flakes: styles.flakes, mound: styles.mound };

export const KakigoriArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${CARD.width} ${CARD.height}`}
    {...stylex.props(styles.art)}
  >
    {cardLayers.map((layer) => (
      <image
        height={CARD.height}
        href={`/games/kakigori/art/${layer}`}
        key={layer}
        width={CARD.width}
        {...stylex.props(motion[layer])}
      />
    ))}
  </svg>
);
