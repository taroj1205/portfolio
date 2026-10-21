import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { CARD, cardLayers } from "../mochitsuki/_lib/card";

const BEAT = "1.1s";

const pound = stylex.keyframes({
  "0%, 100%": { transform: "rotate(36deg)" },
  "38%": { transform: "rotate(41deg)" },
  "50%, 57%": { transform: "rotate(0deg)" },
});

const turn = stylex.keyframes({
  "0%, 18%, 82%, 100%": { transform: "translate(0, 0)" },
  "34%, 66%": { transform: "translate(-79px, 23px)" },
});

const squash = stylex.keyframes({
  "0%, 49%, 72%, 100%": { transform: "scale(1, 1)" },
  "53%": { transform: "scale(1.14, 0.7)" },
  "62%": { transform: "scale(0.97, 1.07)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  kine: {
    animationDuration: BEAT,
    animationIterationCount: "infinite",
    animationName: { default: pound, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.55, 0, 0.25, 1)",
    transform: { default: null, [media.reduce]: "rotate(36deg)" },
    transformBox: "view-box",
    transformOrigin: "487.31px 132.86px",
  },
  arm: {
    animationDuration: BEAT,
    animationIterationCount: "infinite",
    animationName: { default: turn, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.25, 1)",
    transform: { default: null, [media.reduce]: "translate(-79px, 23px)" },
  },
  mochi: {
    animationDuration: BEAT,
    animationIterationCount: "infinite",
    animationName: { default: squash, [media.reduce]: "none" },
    transformBox: "view-box",
    transformOrigin: "320px 240.44px",
  },
});

const motion = {
  arm: styles.arm,
  back: null,
  kine: styles.kine,
  lip: null,
  mochi: styles.mochi,
};

export const MochiArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${CARD.width} ${CARD.height}`}
    {...stylex.props(styles.art)}
  >
    {cardLayers.map((layer) => (
      <image
        height={CARD.height}
        href={`/games/mochitsuki/art/${layer}`}
        key={layer}
        width={CARD.width}
        {...stylex.props(motion[layer])}
      />
    ))}
  </svg>
);
