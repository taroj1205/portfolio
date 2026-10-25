import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { media } from "../../../styles/tokens.stylex";
import { ArtImage } from "../tenbin/_components/item-art";

const ink = {
  brass: ["#ffe7a8", "#e0aa4c", "#7a4f17"],
  sky: ["#22465a", "#0f2130", "#070c14"],
  string: "#ffe7a8",
  text: "#fffaf3",
} as const;

const PIVOT = { x: 320, y: 120 };
const ARM = 150;
const HANG = 92;
const LOOP = "6s";

const DRIFT = [
  { id: "blue-whale", size: 120, x: 526, y: 104 },
  { id: "elephant", size: 100, x: 118, y: 346 },
  { id: "tokyo-tower", size: 140, x: 556, y: 352 },
  { id: "one-yen", size: 40, x: 254, y: 304 },
  { id: "five-hundred-yen", size: 36, x: 392, y: 312 },
] as const;

const drift = stylex.keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-7px)" },
});

const rock = stylex.keyframes({
  "0%, 100%": { transform: "rotate(-9deg)" },
  "45%, 55%": { transform: "rotate(9deg)" },
});

const leftPan = stylex.keyframes({
  "0%, 100%": { transform: "translate(1.85px, 23.47px)" },
  "45%, 55%": { transform: "translate(1.85px, -23.47px)" },
});

const rightPan = stylex.keyframes({
  "0%, 100%": { transform: "translate(-1.85px, -23.47px)" },
  "45%, 55%": { transform: "translate(-1.85px, 23.47px)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  moving: {
    animationDuration: LOOP,
    animationIterationCount: "infinite",
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.2, 1)",
  },
  drift: {
    animationDuration: "7s",
    animationIterationCount: "infinite",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
    opacity: 0.42,
  },
  delay: (delay: string) => ({ animationDelay: delay }),
  beam: {
    animationName: { default: rock, [media.reduce]: "none" },
    transformBox: "view-box",
    transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
  },
  left: {
    animationName: { default: leftPan, [media.reduce]: "none" },
  },
  right: {
    animationName: { default: rightPan, [media.reduce]: "none" },
  },
});

const Pan = ({ x, children }: { x: number; children: ReactNode }) => (
  <g transform={`translate(${x} ${PIVOT.y})`}>
    <path
      d={`M0 0L-52 ${HANG}M0 0L52 ${HANG}`}
      stroke={ink.string}
      strokeOpacity="0.7"
      strokeWidth="1.6"
    />
    <g transform={`translate(0 ${HANG - 4})`}>{children}</g>
    <path
      d={`M-60 ${HANG}Q0 ${HANG + 36} 60 ${HANG}Z`}
      fill="url(#scale-art-brass)"
    />
  </g>
);

export const ScaleArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 640 360"
    {...stylex.props(styles.art)}
  >
    <defs>
      <radialGradient cx="0.5" cy="0" id="scale-art-sky" r="1.1">
        <stop offset="0" stopColor={ink.sky[0]} />
        <stop offset="0.5" stopColor={ink.sky[1]} />
        <stop offset="1" stopColor={ink.sky[2]} />
      </radialGradient>
      <linearGradient id="scale-art-brass" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={ink.brass[0]} />
        <stop offset="0.45" stopColor={ink.brass[1]} />
        <stop offset="1" stopColor={ink.brass[2]} />
      </linearGradient>
    </defs>
    <rect fill="url(#scale-art-sky)" height="360" width="640" />
    {DRIFT.map(({ id, size, x, y }, i) => (
      <g key={id} transform={`translate(${x} ${y})`}>
        <g {...stylex.props(styles.drift, styles.delay(`${-i * 1.3}s`))}>
          <ArtImage id={id} size={size} />
        </g>
      </g>
    ))}
    <path
      d={`M${PIVOT.x - 8} ${PIVOT.y}L${PIVOT.x - 11} 318H${PIVOT.x + 11}L${PIVOT.x + 8} ${PIVOT.y}Z`}
      fill="url(#scale-art-brass)"
    />
    <path
      d={`M${PIVOT.x - 70} 340Q${PIVOT.x - 62} 316 ${PIVOT.x - 28} 314H${PIVOT.x + 28}Q${PIVOT.x + 62} 316 ${PIVOT.x + 70} 340Z`}
      fill="url(#scale-art-brass)"
    />
    <g {...stylex.props(styles.moving, styles.beam)}>
      <rect
        fill="url(#scale-art-brass)"
        height="9"
        rx="4.5"
        width={ARM * 2 + 10}
        x={PIVOT.x - ARM - 5}
        y={PIVOT.y - 4.5}
      />
    </g>
    <g {...stylex.props(styles.moving, styles.left)}>
      <Pan x={PIVOT.x - ARM}>
        <ArtImage id="cloud" size={116} />
      </Pan>
    </g>
    <g {...stylex.props(styles.moving, styles.right)}>
      <Pan x={PIVOT.x + ARM}>
        <text
          fill={ink.text}
          fontFamily="var(--font-mincho), serif"
          fontSize="40"
          fontWeight="700"
          textAnchor="middle"
          y="-6"
        >
          ?t
        </text>
      </Pan>
    </g>
    <circle cx={PIVOT.x} cy={PIVOT.y} fill="url(#scale-art-brass)" r="12" />
  </svg>
);
