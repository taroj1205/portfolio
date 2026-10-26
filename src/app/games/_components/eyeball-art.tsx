import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";

const ink = {
  answer: "#1d8a5a",
  guess: "#e2432a",
  line: "#1f1b16",
  paper: ["#f7f0e2", "#e9dcc3"],
  sky: ["#3a2a1c", "#0a0807"],
} as const;

const LOOP = "4.8s";
const CIRCLE = { r: 74, x: 196, y: 190 };
const LINE = { from: 352, to: 548, y: 112 };
const PIVOT = { x: 400, y: 290 };

const seek = stylex.keyframes({
  "0%, 8%": { transform: "translate(46px, -30px)" },
  "30%": { transform: "translate(-18px, 14px)" },
  "48%, 100%": { transform: "translate(3px, -2px)" },
});

const slide = stylex.keyframes({
  "0%, 12%": { transform: "translateX(-62px)" },
  "34%": { transform: "translateX(26px)" },
  "52%, 100%": { transform: "translateX(-4px)" },
});

const swing = stylex.keyframes({
  "0%, 16%": { transform: "rotate(-40deg)" },
  "40%": { transform: "rotate(12deg)" },
  "58%, 100%": { transform: "rotate(-2deg)" },
});

const reveal = stylex.keyframes({
  "0%, 60%": { opacity: 0, transform: "scale(2.6)" },
  "70%, 92%": { opacity: 1, transform: "scale(1)" },
  "100%": { opacity: 0, transform: "scale(1)" },
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
  seek: {
    animationName: { default: seek, [media.reduce]: "none" },
  },
  slide: {
    animationName: { default: slide, [media.reduce]: "none" },
  },
  swing: {
    animationName: { default: swing, [media.reduce]: "none" },
    transformBox: "view-box",
    transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
  },
  reveal: {
    animationName: { default: reveal, [media.reduce]: "none" },
    transformBox: "fill-box",
    transformOrigin: "center",
  },
});

const cross = (x: number, y: number) =>
  `M${x - 30} ${y}H${x - 8}M${x + 8} ${y}H${x + 30}M${x} ${y - 30}V${y - 8}M${x} ${y + 8}V${y + 30}`;

export const EyeballArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 640 360"
    {...stylex.props(styles.art)}
  >
    <defs>
      <linearGradient id="eyeball-art-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={ink.sky[0]} />
        <stop offset="1" stopColor={ink.sky[1]} />
      </linearGradient>
      <linearGradient id="eyeball-art-paper" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={ink.paper[0]} />
        <stop offset="1" stopColor={ink.paper[1]} />
      </linearGradient>
    </defs>
    <rect fill="url(#eyeball-art-sky)" height="360" width="640" />
    <rect
      fill="url(#eyeball-art-paper)"
      height="300"
      rx="22"
      transform="rotate(-2 320 180)"
      width="560"
      x="40"
      y="30"
    />
    <g fill="none" stroke={ink.line} strokeLinecap="round" strokeWidth="4">
      <circle cx={CIRCLE.x} cy={CIRCLE.y} r={CIRCLE.r} />
      <line x1={LINE.from} x2={LINE.to} y1={LINE.y} y2={LINE.y} />
      <line x1={PIVOT.x} x2={PIVOT.x + 150} y1={PIVOT.y} y2={PIVOT.y} />
    </g>
    <circle cx={PIVOT.x} cy={PIVOT.y} fill={ink.line} r="6" />
    <g
      fill="none"
      stroke={ink.answer}
      strokeLinecap="round"
      strokeWidth="4"
      {...stylex.props(styles.moving, styles.reveal)}
    >
      <circle cx={CIRCLE.x} cy={CIRCLE.y} r="14" />
      <path d={cross(CIRCLE.x, CIRCLE.y)} />
    </g>
    <g
      fill="none"
      stroke={ink.guess}
      strokeLinecap="round"
      strokeWidth="4"
      {...stylex.props(styles.moving, styles.seek)}
    >
      <circle cx={CIRCLE.x} cy={CIRCLE.y} r="14" />
      <path d={cross(CIRCLE.x, CIRCLE.y)} />
    </g>
    <g
      stroke={ink.guess}
      strokeLinecap="round"
      strokeWidth="5"
      {...stylex.props(styles.moving, styles.slide)}
    >
      <line
        x1={(LINE.from + LINE.to) / 2}
        x2={(LINE.from + LINE.to) / 2}
        y1={LINE.y - 26}
        y2={LINE.y + 26}
      />
    </g>
    <line
      stroke={ink.guess}
      strokeLinecap="round"
      strokeWidth="5"
      x1={PIVOT.x}
      x2={PIVOT.x}
      y1={PIVOT.y}
      y2={PIVOT.y - 150}
      {...stylex.props(styles.moving, styles.swing)}
    />
  </svg>
);
