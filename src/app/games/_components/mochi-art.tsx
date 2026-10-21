import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { backdrop, scene } from "../mochitsuki/_components/art";

const W = 640;
const H = 360;
const BEAT = "1.1s";

const paint = {
  fire: "#ff9a52",
  night: ["#1a1230", "#0d0918", "#1c0e0c"],
};

const pound = stylex.keyframes({
  "0%, 100%": { transform: "rotate(36deg)" },
  "38%": { transform: "rotate(41deg)" },
  "50%, 57%": { transform: "rotate(0deg)" },
});

const turn = stylex.keyframes({
  "0%, 18%, 82%, 100%": { transform: "translate(0, 0)" },
  "34%, 66%": { transform: "translate(-0.24px, 0.07px)" },
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
    transformOrigin: "1.007px 0.342px",
  },
  arm: {
    animationDuration: BEAT,
    animationIterationCount: "infinite",
    animationName: { default: turn, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.25, 1)",
    transform: { default: null, [media.reduce]: "translate(-0.24px, 0.07px)" },
  },
  mochi: {
    animationDuration: BEAT,
    animationIterationCount: "infinite",
    animationName: { default: squash, [media.reduce]: "none" },
    transformBox: "view-box",
    transformOrigin: "0.5px 0.668px",
  },
});

export const MochiArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${W} ${H}`}
    {...stylex.props(styles.art)}
  >
    <defs>
      <linearGradient id="mochi-art-night" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={paint.night[0]} />
        <stop offset="0.55" stopColor={paint.night[1]} />
        <stop offset="1" stopColor={paint.night[2]} />
      </linearGradient>
      <radialGradient id="mochi-art-fire">
        <stop offset="0" stopColor={paint.fire} stopOpacity="0.4" />
        <stop offset="1" stopColor={paint.fire} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect fill="url(#mochi-art-night)" height={H} width={W} />
    {backdrop({
      drape: 92,
      flakes: 40,
      height: H,
      id: "mochi-art-back",
      lanterns: [
        { size: 30, x: 92, y: 120 },
        { size: 30, x: 548, y: 120 },
      ],
      width: W,
    })}
    <ellipse
      cx={W / 2}
      cy={290}
      fill="url(#mochi-art-fire)"
      rx={260}
      ry={150}
    />
    <svg height={330} viewBox="0 0 1 1" width={330} x={155} y={38}>
      {scene({
        id: "mochi-art-scene",
        lift: 0,
        motion: {
          arm: stylex.props(styles.arm),
          kine: stylex.props(styles.kine),
          mochi: stylex.props(styles.mochi),
        },
        reach: 1,
        smooth: 0.7,
      })}
    </svg>
  </svg>
);
