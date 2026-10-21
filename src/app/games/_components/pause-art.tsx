import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";

const ink = {
  far: ["#232d5c", "#0e1430"],
  gold: "#ffd27a",
  halo: "#d6e0ff",
  moon: ["#fffdf4", "#e2e1d8"],
  near: ["#4a5891", "#141a3a"],
  sky: ["#04060f", "#0b1230", "#1c2752"],
  snow: "#f4f6ff",
} as const;

const LOOP = "7.2s";
const LINE = { left: 120, right: 520, y: 300 };
const TARGET = LINE.left + (LINE.right - LINE.left) * (10 / 12);
const STOP = LINE.left + (LINE.right - LINE.left) * (9.93 / 12);

const FLAKES = [
  [40, 0.9, 0],
  [92, 1.6, 1],
  [150, 1.1, 2],
  [214, 2.2, 0],
  [262, 0.8, 1],
  [318, 1.4, 2],
  [360, 2.6, 1],
  [402, 1, 0],
  [458, 1.8, 2],
  [512, 1.2, 1],
  [560, 2.4, 0],
  [604, 0.9, 2],
  [70, 2, 2],
  [182, 1.3, 1],
  [290, 1.7, 0],
  [430, 0.8, 1],
  [586, 1.5, 2],
  [24, 1.2, 1],
] as const;

const fall = stylex.keyframes({
  "0%": { transform: "translate(0, -370px)" },
  "100%": { transform: "translate(24px, 370px)" },
});

const vanish = stylex.keyframes({
  "0%, 34%": { filter: "blur(0)", opacity: 1 },
  "46%, 90%": { filter: "blur(8px)", opacity: 0 },
  "100%": { filter: "blur(0)", opacity: 1 },
});

const land = stylex.keyframes({
  "0%, 66%": { opacity: 0, transform: "scale(0.2)" },
  "71%": { opacity: 1, transform: "scale(1.4)" },
  "74%, 90%": { opacity: 1, transform: "scale(1)" },
  "96%, 100%": { opacity: 0, transform: "scale(1)" },
});

const reach = stylex.keyframes({
  "0%, 46%": { strokeDashoffset: 1 },
  "70%, 92%": { strokeDashoffset: 0 },
  "100%": { strokeDashoffset: 1 },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  flake: {
    animationIterationCount: "infinite",
    animationName: { default: fall, [media.reduce]: "none" },
    animationTimingFunction: "linear",
  },
  slow: {
    animationDuration: "23s",
  },
  mid: {
    animationDuration: "17s",
  },
  quick: {
    animationDuration: "13s",
  },
  digits: {
    animationDuration: LOOP,
    animationIterationCount: "infinite",
    animationName: { default: vanish, [media.reduce]: "none" },
    fontFamily: "var(--font-mincho), serif",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
  },
  trail: {
    animationDuration: LOOP,
    animationIterationCount: "infinite",
    animationName: { default: reach, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.3, 0, 0.2, 1)",
  },
  stop: {
    animationDuration: LOOP,
    animationIterationCount: "infinite",
    animationName: { default: land, [media.reduce]: "none" },
    transformBox: "fill-box",
    transformOrigin: "center",
  },
});

const speeds = [styles.slow, styles.mid, styles.quick] as const;

export const PauseArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 640 360"
    {...stylex.props(styles.art)}
  >
    <defs>
      <linearGradient id="pause-art-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={ink.sky[0]} />
        <stop offset="0.55" stopColor={ink.sky[1]} />
        <stop offset="1" stopColor={ink.sky[2]} />
      </linearGradient>
      <radialGradient id="pause-art-halo">
        <stop offset="0" stopColor={ink.halo} stopOpacity="0.4" />
        <stop offset="1" stopColor={ink.halo} stopOpacity="0" />
      </radialGradient>
      <radialGradient cx="0.38" cy="0.35" id="pause-art-moon" r="0.75">
        <stop offset="0" stopColor={ink.moon[0]} />
        <stop offset="1" stopColor={ink.moon[1]} />
      </radialGradient>
      <linearGradient id="pause-art-far" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={ink.far[0]} />
        <stop offset="1" stopColor={ink.far[1]} />
      </linearGradient>
      <linearGradient id="pause-art-near" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={ink.near[0]} />
        <stop offset="1" stopColor={ink.near[1]} />
      </linearGradient>
    </defs>
    <rect fill="url(#pause-art-sky)" height="360" width="640" />
    <circle cx="520" cy="78" fill="url(#pause-art-halo)" r="190" />
    <circle cx="520" cy="78" fill="url(#pause-art-moon)" r="30" />
    <path
      d="M0 360V262c60-30 110-46 170-30s104 22 158-6 112-42 172-18 92 14 140 0v152z"
      fill="url(#pause-art-far)"
    />
    <path
      d="M0 360v-58c70-18 140-22 214-10s152 10 226-6 140-14 200 2v72z"
      fill="url(#pause-art-near)"
    />
    <text
      fill={ink.snow}
      fontSize="104"
      textAnchor="middle"
      x="300"
      y="196"
      {...stylex.props(styles.digits)}
    >
      10.00
    </text>
    <line
      stroke={ink.snow}
      strokeOpacity="0.18"
      x1={LINE.left}
      x2={LINE.right}
      y1={LINE.y}
      y2={LINE.y}
    />
    <path
      d={`M${LINE.left} ${LINE.y}H${STOP}`}
      fill="none"
      pathLength={1}
      stroke={ink.snow}
      strokeDasharray="1"
      strokeLinecap="round"
      strokeOpacity="0.75"
      strokeWidth="2"
      {...stylex.props(styles.trail)}
    />
    <line
      stroke={ink.gold}
      strokeWidth="2"
      x1={TARGET}
      x2={TARGET}
      y1={LINE.y - 14}
      y2={LINE.y + 14}
    />
    <circle cx={TARGET} cy={LINE.y - 21} fill={ink.gold} r="4" />
    <circle
      cx={STOP}
      cy={LINE.y}
      fill={ink.snow}
      r="5"
      {...stylex.props(styles.stop)}
    />
    {FLAKES.map(([x, r, speed]) => (
      <circle
        cx={x}
        cy={(x * 37) % 360}
        fill={ink.snow}
        key={x}
        opacity={0.35 + r / 4}
        r={r * 1.5}
        {...stylex.props(styles.flake, speeds[speed])}
      />
    ))}
  </svg>
);
