import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import {
  cupSvg,
  vesselPath,
  vesselTransform,
} from "../masu/_components/cup-svg";
import { LIFT, box, lipOf, paint, project } from "../masu/_lib/scene";
import type { Fill } from "../masu/_lib/scene";

const fill: Fill = { dome: 3.4, glass: null, level: box.height };
const lip = lipOf({ bottle: "tokkuri", cup: "masu" });
const surface = project(-6, box.height + fill.dome * LIFT, 4);

const BOKEH = [
  [70, 60, 46, 0.16],
  [170, 120, 30, 0.12],
  [250, 40, 38, 0.1],
  [430, 80, 52, 0.14],
  [560, 50, 34, 0.12],
  [600, 150, 44, 0.1],
  [40, 180, 30, 0.08],
] as const;

const glug = stylex.keyframes({
  "0%, 100%": { transform: "scaleX(1)" },
  "20%": { transform: "scaleX(1.55)" },
  "45%": { transform: "scaleX(0.8)" },
  "70%": { transform: "scaleX(1.3)" },
});

const shimmer = stylex.keyframes({
  "0%, 100%": { opacity: 0.55 },
  "50%": { opacity: 1 },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  stream: {
    animationDuration: "0.62s",
    animationIterationCount: "infinite",
    animationName: { default: glug, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
    transformBox: "fill-box",
    transformOrigin: "center",
  },
  glint: {
    animationDuration: "1.9s",
    animationIterationCount: "infinite",
    animationName: { default: shimmer, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
  },
});

export const PourArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 640 360"
    {...stylex.props(styles.art)}
  >
    <defs>
      <linearGradient id="pour-art-room" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={paint.night} />
        <stop offset="0.62" stopColor={paint.room} />
        <stop offset="0.63" stopColor={paint.counterDark} />
        <stop offset="0.8" stopColor={paint.counter} />
        <stop offset="1" stopColor={paint.counterDark} />
      </linearGradient>
      <radialGradient id="pour-art-lamp">
        <stop offset="0" stopColor={paint.lamp} stopOpacity="0.32" />
        <stop offset="1" stopColor={paint.lamp} stopOpacity="0" />
      </radialGradient>
      <radialGradient id="pour-art-bokeh">
        <stop offset="0" stopColor={paint.lamp} stopOpacity="1" />
        <stop offset="1" stopColor={paint.lamp} stopOpacity="0" />
      </radialGradient>
      <linearGradient id="pour-art-stream" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={paint.sakeDeep} stopOpacity="0.6" />
        <stop offset="0.45" stopColor={paint.sheen} stopOpacity="0.9" />
        <stop offset="1" stopColor={paint.sake} stopOpacity="0.55" />
      </linearGradient>
      <clipPath id="pour-art-clip">
        <path d={vesselPath("tokkuri")} />
      </clipPath>
      <linearGradient id="pour-art-flask" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={paint.porcelainShade} />
        <stop offset="0.3" stopColor={paint.porcelain} />
        <stop offset="1" stopColor={paint.porcelainDark} />
      </linearGradient>
    </defs>
    <rect fill="url(#pour-art-room)" height="360" width="640" />
    {BOKEH.map(([x, y, r, o]) => (
      <circle
        cx={x}
        cy={y}
        fill="url(#pour-art-bokeh)"
        key={`${x}-${y}`}
        opacity={o}
        r={r}
      />
    ))}
    <ellipse cx="320" cy="200" fill="url(#pour-art-lamp)" rx="260" ry="190" />
    <g transform="translate(296 244) scale(1.62)">
      {cupSvg({ fill, id: "pour-art", spill: null })}
      <path
        d={`M${lip.x - 1} ${lip.y}Q${lip.x - 5} ${lip.y + 14} ${surface.x - 0.4} ${surface.y}L${surface.x + 1.4} ${surface.y}Q${lip.x - 2} ${lip.y + 14} ${lip.x + 2.4} ${lip.y}Z`}
        fill="url(#pour-art-stream)"
        {...stylex.props(styles.stream)}
      />
      <ellipse
        cx={surface.x}
        cy={surface.y}
        fill={paint.sheen}
        rx="4.5"
        ry="1"
        {...stylex.props(styles.glint)}
      />
      <g transform={vesselTransform("tokkuri", lip, 1)}>
        <path d={vesselPath("tokkuri")} fill="url(#pour-art-flask)" />
        <path
          clipPath="url(#pour-art-clip)"
          d="M-50 60H50M-50 66H50M-50 126H50M-43 96a7 7 0 0 1 14 0M-25 96a7 7 0 0 1 14 0M-7 96a7 7 0 0 1 14 0M11 96a7 7 0 0 1 14 0M29 96a7 7 0 0 1 14 0"
          fill="none"
          stroke={paint.indigo}
          strokeWidth="2.6"
        />
      </g>
    </g>
  </svg>
);
