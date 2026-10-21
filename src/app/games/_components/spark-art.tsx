import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { sparklerDefs, sparklerParts } from "../senko/_components/sparkler-svg";

const ink = {
  ground: "#170e0d",
  sky: ["#04050d", "#0b0b1a", "#1a100e"],
  star: "#fffaf3",
  warm: "#ff9a4a",
} as const;

const STARS = [
  [34, 22, 1.2],
  [96, 58, 0.9],
  [150, 26, 1.1],
  [214, 80, 0.8],
  [262, 30, 1.3],
  [70, 132, 0.8],
  [180, 150, 1],
  [560, 40, 1.1],
  [604, 110, 0.9],
  [520, 150, 0.8],
  [600, 220, 1],
  [40, 230, 0.9],
] as const;

const flicker = stylex.keyframes({
  "0%, 100%": { opacity: 1 },
  "45%": { opacity: 0.15 },
});

const flare = stylex.keyframes({
  "0%, 100%": { opacity: 0.15 },
  "45%": { opacity: 1 },
});

const breathe = stylex.keyframes({
  "0%, 100%": { opacity: 0.75 },
  "50%": { opacity: 1 },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  first: {
    animationDuration: "0.42s",
    animationIterationCount: "infinite",
    animationName: { default: flicker, [media.reduce]: "none" },
    animationTimingFunction: "steps(3)",
  },
  second: {
    animationDuration: "0.42s",
    animationIterationCount: "infinite",
    animationName: { default: flare, [media.reduce]: "none" },
    animationTimingFunction: "steps(3)",
    opacity: { default: null, [media.reduce]: 0 },
  },
  glow: {
    animationDuration: "1.7s",
    animationIterationCount: "infinite",
    animationName: { default: breathe, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
  },
});

const HERO = { x: 420, y: 196 };

export const SparkArt = () => {
  const first = sparklerParts({
    id: "spark-art",
    phase: 2,
    scale: 1.25,
    top: -10,
    x: HERO.x,
    y: HERO.y,
  });
  const second = sparklerParts({
    id: "spark-art",
    phase: 2,
    scale: 1.25,
    top: -10,
    variant: 1,
    x: HERO.x,
    y: HERO.y,
  });
  return (
    <svg
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      viewBox="0 0 640 360"
      {...stylex.props(styles.art)}
    >
      {sparklerDefs("spark-art")}
      <defs>
        <linearGradient id="spark-art-sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={ink.sky[0]} />
          <stop offset="0.6" stopColor={ink.sky[1]} />
          <stop offset="1" stopColor={ink.sky[2]} />
        </linearGradient>
        <radialGradient id="spark-art-wash">
          <stop offset="0" stopColor={ink.warm} stopOpacity="0.42" />
          <stop offset="1" stopColor={ink.warm} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect fill="url(#spark-art-sky)" height="360" width="640" />
      {STARS.map(([x, y, r]) => (
        <circle
          cx={x}
          cy={y}
          fill={ink.star}
          key={`${x}-${y}`}
          opacity="0.7"
          r={r}
        />
      ))}
      <rect fill={ink.ground} height="40" opacity="0.8" width="640" y="320" />
      <g {...stylex.props(styles.glow)}>
        <circle cx={HERO.x} cy={HERO.y} fill="url(#spark-art-wash)" r="260" />
        <ellipse
          cx={HERO.x}
          cy="330"
          fill="url(#spark-art-wash)"
          rx="220"
          ry="26"
        />
      </g>
      {first.back}
      <g {...stylex.props(styles.first)}>{first.sparks}</g>
      <g {...stylex.props(styles.second)}>{second.sparks}</g>
      {first.front}
    </svg>
  );
};
