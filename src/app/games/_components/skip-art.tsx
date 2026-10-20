import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import { palettes } from "../mizukiri/_lib/render";

const { dusk } = palettes;

const ink = {
  band: "#d6dcff",
  haze: "#8f8cf0",
  pebble: "#cfc9c4",
  pebbleLight: "#f3efe9",
  star: "#fffaf3",
};

const LANDINGS = [
  { rx: 44, x: 96, y: 330 },
  { rx: 32, x: 190, y: 290 },
  { rx: 23, x: 262, y: 262 },
  { rx: 16, x: 318, y: 244 },
  { rx: 11, x: 360, y: 232 },
  { rx: 7, x: 392, y: 224 },
];

const ARC =
  "M96 330Q143 230 190 290Q226 214 262 262Q290 208 318 244Q339 208 360 232Q376 206 392 224";

const GLINTS = [
  { w: 60, y: 208 },
  { w: 84, y: 219 },
  { w: 112, y: 233 },
  { w: 150, y: 251 },
  { w: 196, y: 274 },
];

const STARS = [
  [34, 22, 1.4],
  [88, 64, 1],
  [140, 30, 1.2],
  [210, 74, 0.9],
  [262, 18, 1.5],
  [318, 52, 1],
  [372, 24, 1.2],
  [430, 66, 0.9],
  [488, 20, 1.4],
  [548, 58, 1],
  [596, 28, 1.2],
  [612, 96, 0.9],
  [58, 112, 0.9],
  [176, 118, 1],
] as const;

const spread = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(0.55)" },
  "35%": { opacity: 0.9 },
  "100%": { opacity: 0, transform: "scale(1.35)" },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    objectFit: "cover",
    width: "100%",
  },
  ring: (delay: string) => ({
    animationDelay: delay,
    animationDuration: "3.6s",
    animationIterationCount: "infinite",
    animationName: { default: spread, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.22, 0.61, 0.36, 1)",
    opacity: 0,
    transformBox: "fill-box",
    transformOrigin: "center",
  }),
});

export const SkipArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMinYMid slice"
    viewBox="0 0 640 360"
    {...stylex.props(styles.art)}
  >
    <defs>
      <linearGradient id="skip-sky" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={dusk.sky[0]} />
        <stop offset="0.5" stopColor={dusk.sky[1]} />
        <stop offset="1" stopColor={dusk.sky[2]} />
      </linearGradient>
      <linearGradient id="skip-water" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={dusk.water[0]} />
        <stop offset="0.3" stopColor={dusk.water[1]} />
        <stop offset="1" stopColor={dusk.water[2]} />
      </linearGradient>
      <radialGradient id="skip-glow">
        <stop offset="0" stopColor={dusk.glint} stopOpacity="0.85" />
        <stop offset="1" stopColor={dusk.glow} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="skip-band">
        <stop offset="0" stopColor={ink.band} stopOpacity="0.4" />
        <stop offset="1" stopColor={ink.haze} stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect fill="url(#skip-sky)" height="204" width="640" />
    <ellipse
      cx="250"
      cy="84"
      fill="url(#skip-band)"
      rx="380"
      ry="34"
      transform="rotate(-18 250 84)"
    />
    {STARS.map(([x, y, r]) => (
      <circle cx={x} cy={y} fill={ink.star} key={`${x}-${y}`} r={r} />
    ))}
    <circle cx="435" cy="200" fill="url(#skip-glow)" r="110" />
    <circle cx="435" cy="198" fill={dusk.sun} r="15" />
    <path
      d="M0 204V166C60 148 110 172 170 156S280 138 340 162S470 148 520 158S600 148 640 156V204Z"
      fill={dusk.ridges[0]}
    />
    <path
      d="M0 204V184C70 170 130 190 210 178S330 168 400 184S540 172 640 186V204Z"
      fill={dusk.ridges[1]}
    />
    <rect fill="url(#skip-water)" height="160" width="640" y="200" />
    <g
      opacity="0.8"
      stroke={dusk.glint}
      strokeLinecap="round"
      strokeWidth="2.4"
    >
      {GLINTS.map(({ w, y }) => (
        <line key={y} x1={435 - w / 2} x2={435 + w / 2} y1={y} y2={y} />
      ))}
    </g>
    <g fill="none" stroke={dusk.ring}>
      {LANDINGS.map(({ rx, x, y }, index) => (
        <g key={x}>
          <ellipse
            cx={x}
            cy={y}
            opacity="0.85"
            rx={rx}
            ry={rx * 0.24}
            strokeWidth="2"
          />
          <ellipse
            cx={x}
            cy={y}
            opacity="0.35"
            rx={rx * 1.7}
            ry={rx * 0.4}
            strokeWidth="1.4"
          />
          <ellipse
            cx={x}
            cy={y}
            rx={rx * 1.2}
            ry={rx * 0.3}
            strokeWidth="1.6"
            {...stylex.props(styles.ring(`${index * 0.45}s`))}
          />
        </g>
      ))}
    </g>
    <path
      d={ARC}
      fill="none"
      stroke={dusk.ring}
      strokeDasharray="2 8"
      strokeLinecap="round"
      strokeWidth="3"
    />
    <g transform="rotate(-14 143 270)">
      <ellipse cx="143" cy="270" fill={ink.pebble} rx="11" ry="4.6" />
      <ellipse cx="141" cy="268.6" fill={ink.pebbleLight} rx="6.5" ry="2" />
    </g>
  </svg>
);
