import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { inkSvg, paperSvg } from "../enso/_components/ink-svg";
import { modelTrace } from "../enso/_lib/model";
import { inkPaths } from "../enso/_lib/stroke";

const ink = {
  glow: "#fff1d6",
  mask: "#ffffff",
  seal: "#c8352b",
  sealText: "#fff1e8",
  sky: ["#211c4d", "#0c1029", "#04050c"],
  star: "#fffaf3",
} as const;

const PAPER = { size: 252, x: 194, y: 54 };
const MARGIN = 24;
const INK = {
  size: PAPER.size - MARGIN * 2,
  x: PAPER.x + MARGIN,
  y: PAPER.y + MARGIN,
};
const { spine } = inkPaths(modelTrace, INK);

const STARS = [
  [34, 22, 1.4],
  [88, 64, 1],
  [140, 30, 1.2],
  [210, 74, 0.9],
  [262, 18, 1.5],
  [600, 24, 1.2],
  [612, 300, 0.9],
  [618, 140, 1.1],
  [58, 112, 0.9],
  [176, 128, 1],
  [96, 300, 1.3],
  [190, 330, 0.9],
  [250, 250, 1.1],
  [36, 210, 1],
] as const;

const draw = stylex.keyframes({
  "0%": { opacity: 1, strokeDashoffset: 1 },
  "42%": { opacity: 1, strokeDashoffset: 0 },
  "86%": { opacity: 1, strokeDashoffset: 0 },
  "100%": { opacity: 0, strokeDashoffset: 0 },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  reveal: {
    animationDuration: "4.2s",
    animationIterationCount: "infinite",
    animationName: { default: draw, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.25, 1)",
  },
  seal: {
    fontFamily: "var(--font-mincho), serif",
    fontWeight: 700,
  },
});

const sealX = PAPER.x + PAPER.size - 44;
const sealY = PAPER.y + PAPER.size - 52;

export const BrushArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 640 360"
    {...stylex.props(styles.art)}
  >
    <defs>
      <radialGradient cx="0.5" cy="0.5" id="brush-art-sky" r="0.8">
        <stop offset="0" stopColor={ink.sky[0]} />
        <stop offset="0.55" stopColor={ink.sky[1]} />
        <stop offset="1" stopColor={ink.sky[2]} />
      </radialGradient>
      <radialGradient id="brush-art-glow">
        <stop offset="0" stopColor={ink.glow} stopOpacity="0.3" />
        <stop offset="1" stopColor={ink.glow} stopOpacity="0" />
      </radialGradient>
      <mask id="brush-art-reveal">
        <path
          d={spine}
          fill="none"
          pathLength={1}
          stroke={ink.mask}
          strokeDasharray="1"
          strokeLinecap="round"
          strokeWidth={INK.size * 0.2}
          {...stylex.props(styles.reveal)}
        />
      </mask>
    </defs>
    <rect fill="url(#brush-art-sky)" height="360" width="640" />
    {STARS.map(([x, y, r]) => (
      <circle cx={x} cy={y} fill={ink.star} key={`${x}-${y}`} r={r} />
    ))}
    <circle
      cx={PAPER.x + PAPER.size / 2}
      cy={PAPER.y + PAPER.size / 2}
      fill="url(#brush-art-glow)"
      r={PAPER.size * 0.95}
    />
    <g
      transform={`rotate(-3 ${PAPER.x + PAPER.size / 2} ${PAPER.y + PAPER.size / 2})`}
    >
      {paperSvg({ id: "brush-art", ...PAPER })}
      <g mask="url(#brush-art-reveal)">
        {inkSvg({ id: "brush-art", ...INK, trace: modelTrace })}
      </g>
      <rect
        fill={ink.seal}
        height="34"
        rx="3"
        transform={`rotate(-4 ${sealX + 15} ${sealY + 17})`}
        width="30"
        x={sealX}
        y={sealY}
      />
      <text
        fill={ink.sealText}
        fontSize="13"
        textAnchor="middle"
        x={sealX + 15}
        y={sealY + 15}
        {...stylex.props(styles.seal)}
      >
        円
      </text>
      <text
        fill={ink.sealText}
        fontSize="13"
        textAnchor="middle"
        x={sealX + 15}
        y={sealY + 29}
        {...stylex.props(styles.seal)}
      >
        相
      </text>
    </g>
  </svg>
);
