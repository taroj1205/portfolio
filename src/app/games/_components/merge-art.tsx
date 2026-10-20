import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { orbDefs, orbSvg } from "../hoshiai/_components/orb-svg";
import { kindOf } from "../hoshiai/_lib/bodies";

const ink = {
  band: "#d6dcff",
  bandEdge: "#6a5bd6",
  core: "#fff4dc",
  coreEdge: "#a08cff",
  guide: "#ffe0a0",
  ring: "#dce4ff",
  sky: ["#241d55", "#0d1029", "#04050c"],
  star: "#fffaf3",
} as const;

const CORE = { x: 430, y: 185 };
const SCALE = 150;

const CLUSTER = [
  { tier: 9, x: 410, y: 195 },
  { tier: 8, x: 482, y: 134 },
  { tier: 6, x: 334, y: 222 },
  { tier: 5, x: 424, y: 270 },
  { tier: 4, x: 366, y: 272 },
  { tier: 3, x: 490, y: 226 },
  { tier: 2, x: 348, y: 156 },
  { tier: 1, x: 526, y: 186 },
  { tier: 0, x: 464, y: 260 },
];

const FALLING = { tier: 7, x: 252, y: 86 };

const STARS = [
  [34, 22, 1.4],
  [88, 64, 1],
  [140, 30, 1.2],
  [210, 74, 0.9],
  [262, 18, 1.5],
  [318, 52, 1],
  [600, 24, 1.2],
  [612, 300, 0.9],
  [580, 96, 1.1],
  [58, 112, 0.9],
  [176, 128, 1],
  [96, 300, 1.3],
  [190, 330, 0.9],
  [560, 340, 1.1],
] as const;

const spread = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(0.6)" },
  "30%": { opacity: 0.9 },
  "100%": { opacity: 0, transform: "scale(1.6)" },
});

const breathe = stylex.keyframes({
  "0%, 100%": { opacity: 0.55 },
  "50%": { opacity: 1 },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  wave: {
    animationDuration: "2.8s",
    animationIterationCount: "infinite",
    animationName: { default: spread, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.22, 0.61, 0.36, 1)",
    opacity: 0,
    transformBox: "fill-box",
    transformOrigin: "center",
  },
  core: {
    animationDuration: "4s",
    animationIterationCount: "infinite",
    animationName: { default: breathe, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
  },
});

const sun = CLUSTER[0] ?? { tier: 9, x: 0, y: 0 };

export const MergeArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 640 360"
    {...stylex.props(styles.art)}
  >
    {orbDefs("merge-art")}
    <defs>
      <radialGradient id="merge-art-sky" cx="0.67" cy="0.5" r="0.8">
        <stop offset="0" stopColor={ink.sky[0]} />
        <stop offset="0.55" stopColor={ink.sky[1]} />
        <stop offset="1" stopColor={ink.sky[2]} />
      </radialGradient>
      <radialGradient id="merge-art-band">
        <stop offset="0" stopColor={ink.band} stopOpacity="0.36" />
        <stop offset="1" stopColor={ink.bandEdge} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="merge-art-core">
        <stop offset="0" stopColor={ink.core} stopOpacity="0.55" />
        <stop offset="1" stopColor={ink.coreEdge} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect fill="url(#merge-art-sky)" height="360" width="640" />
    <ellipse
      cx="320"
      cy="180"
      fill="url(#merge-art-band)"
      rx="420"
      ry="60"
      transform="rotate(-24 320 180)"
    />
    {STARS.map(([x, y, r]) => (
      <circle cx={x} cy={y} fill={ink.star} key={`${x}-${y}`} r={r} />
    ))}
    <circle
      cx={CORE.x}
      cy={CORE.y}
      fill="url(#merge-art-core)"
      r={SCALE * 1.3}
      {...stylex.props(styles.core)}
    />
    <circle
      cx={CORE.x}
      cy={CORE.y}
      fill="none"
      r={SCALE}
      stroke={ink.ring}
      strokeDasharray="2 8"
      strokeLinecap="round"
      strokeOpacity="0.45"
      strokeWidth="2"
    />
    <path
      d={`M${FALLING.x + 30} ${FALLING.y + 18}L${CORE.x - 70} ${CORE.y - 40}`}
      fill="none"
      stroke={ink.guide}
      strokeDasharray="3 8"
      strokeLinecap="round"
      strokeOpacity="0.6"
      strokeWidth="2"
    />
    {CLUSTER.map((orb) => (
      <g key={orb.tier}>
        {orbSvg({
          id: "merge-art",
          r: kindOf(orb.tier).radius * SCALE,
          tier: orb.tier,
          x: orb.x,
          y: orb.y,
        })}
      </g>
    ))}
    <circle
      cx={sun.x}
      cy={sun.y}
      fill="none"
      r={kindOf(sun.tier).radius * SCALE * 1.15}
      stroke={kindOf(sun.tier).glow}
      strokeWidth="2"
      {...stylex.props(styles.wave)}
    />
    {orbSvg({
      id: "merge-art",
      r: kindOf(FALLING.tier).radius * SCALE,
      tier: FALLING.tier,
      x: FALLING.x,
      y: FALLING.y,
    })}
  </svg>
);
