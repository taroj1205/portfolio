import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { media } from "../../_components/theme.stylex";
import { STEPS } from "../_lib/scale";
import { ArtImage } from "./item-art";

const PIVOT = { x: 180, y: 70 };
const ARM = 128;
const HANG = 84;
const SPRING = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const brass = {
  dark: "#7a4f17",
  deep: "#a8722a",
  light: "#ffe7a8",
  mid: "#e0aa4c",
} as const;

const tone = {
  glow: "#ffd27a",
  shadow: "#05080d",
  string: "rgb(255 231 168 / 0.7)",
} as const;

const sway = stylex.keyframes({
  "0%, 100%": { transform: "rotate(-1.6deg)" },
  "50%": { transform: "rotate(1.6deg)" },
});

const plop = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(-26px) scale(0.7)" },
  "60%": { opacity: 1, transform: "translateY(0) scale(1.08, 0.92)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const pulse = stylex.keyframes({
  "0%": { opacity: 0.9, transform: "scale(0.6)" },
  "100%": { opacity: 0, transform: "scale(2.4)" },
});

const styles = stylex.create({
  svg: {
    display: "block",
    height: "100%",
    overflow: "visible",
    width: "100%",
  },
  sway: {
    animationDuration: "3.6s",
    animationIterationCount: "infinite",
    animationName: { default: sway, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
    transformBox: "view-box",
    transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
  },
  moving: {
    transitionDuration: { default: "1100ms", [media.reduce]: "0s" },
    transitionProperty: "transform",
    transitionTimingFunction: SPRING,
  },
  turn: (transform: string) => ({
    transform,
    transformBox: "view-box",
    transformOrigin: `${PIVOT.x}px ${PIVOT.y}px`,
  }),
  shift: (transform: string) => ({ transform }),
  grow: (transform: string) => ({
    transform,
    transformBox: "fill-box",
    transformOrigin: "50% 100%",
  }),
  plop: {
    animationDuration: "420ms",
    animationName: { default: plop, [media.reduce]: "none" },
    animationTimingFunction: SPRING,
    transformBox: "fill-box",
    transformOrigin: "50% 100%",
  },
  tag: {
    fontFamily: "inherit",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 800,
  },
  burst: {
    animationDuration: "1.4s",
    animationFillMode: "both",
    animationIterationCount: 2,
    animationName: { default: pulse, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    transformBox: "fill-box",
    transformOrigin: "center",
  },
});

const radians = (degrees: number) => (degrees * Math.PI) / 180;

const Pan = ({
  side,
  angle,
  tag,
  children,
}: {
  side: -1 | 1;
  angle: number;
  tag: string | null;
  children: ReactNode;
}) => {
  const theta = radians(angle);
  const dx = side * (ARM * Math.cos(theta) - ARM);
  const dy = side * ARM * Math.sin(theta);
  const x = PIVOT.x + side * ARM;

  return (
    <g
      {...stylex.props(
        styles.moving,
        styles.shift(`translate(${dx.toFixed(2)}px, ${dy.toFixed(2)}px)`)
      )}
    >
      <g transform={`translate(${x} ${PIVOT.y})`}>
        <path
          d={`M0 0L-46 ${HANG}M0 0L46 ${HANG}`}
          stroke={tone.string}
          strokeWidth="1.6"
        />
        <circle cx="0" cy="0" fill="url(#tenbin-brass)" r="5" />
        <g transform={`translate(0 ${HANG - 6})`}>{children}</g>
        <path
          d={`M-54 ${HANG}Q0 ${HANG + 34} 54 ${HANG}Z`}
          fill="url(#tenbin-pan)"
          stroke={brass.light}
          strokeOpacity="0.7"
          strokeWidth="1.2"
        />
        <ellipse
          cx="0"
          cy={HANG}
          fill={brass.light}
          opacity="0.35"
          rx="54"
          ry="4"
        />
        {tag === null ? null : (
          <text
            fill={brass.dark}
            fontSize="17"
            textAnchor="middle"
            y={HANG + 14}
            {...stylex.props(styles.tag)}
          >
            {tag}
          </text>
        )}
      </g>
    </g>
  );
};

interface BalanceProps {
  tilt: number;
  tag: string | null;
  idle: boolean;
  glow: number | null;
  left: ReactNode;
  right: ReactNode;
}

export const Balance = ({
  tilt,
  tag,
  idle,
  glow,
  left,
  right,
}: BalanceProps) => (
  <svg aria-hidden="true" viewBox="0 0 360 250" {...stylex.props(styles.svg)}>
    <defs>
      <linearGradient id="tenbin-brass" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={brass.light} />
        <stop offset="0.45" stopColor={brass.mid} />
        <stop offset="1" stopColor={brass.dark} />
      </linearGradient>
      <linearGradient id="tenbin-column" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={brass.dark} />
        <stop offset="0.4" stopColor={brass.light} />
        <stop offset="1" stopColor={brass.deep} />
      </linearGradient>
      <linearGradient id="tenbin-pan" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={brass.mid} />
        <stop offset="1" stopColor={brass.dark} />
      </linearGradient>
      <radialGradient id="tenbin-glow">
        <stop offset="0" stopColor={tone.glow} stopOpacity="0.8" />
        <stop offset="1" stopColor={tone.glow} stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse
      cx={PIVOT.x}
      cy="238"
      fill={tone.shadow}
      opacity="0.5"
      rx="120"
      ry="9"
    />
    <path
      d={`M${PIVOT.x - 7} ${PIVOT.y}L${PIVOT.x - 10} 218H${PIVOT.x + 10}L${PIVOT.x + 7} ${PIVOT.y}Z`}
      fill="url(#tenbin-column)"
    />
    <path
      d={`M${PIVOT.x - 62} 238Q${PIVOT.x - 56} 214 ${PIVOT.x - 26} 212H${PIVOT.x + 26}Q${PIVOT.x + 56} 214 ${PIVOT.x + 62} 238Z`}
      fill="url(#tenbin-brass)"
    />
    {glow === null ? null : (
      <circle
        cx={PIVOT.x}
        cy={PIVOT.y}
        fill="url(#tenbin-glow)"
        key={glow}
        r="60"
        {...stylex.props(styles.burst)}
      />
    )}
    <g {...stylex.props(idle && styles.sway)}>
      <g {...stylex.props(styles.moving, styles.turn(`rotate(${tilt}deg)`))}>
        <path
          d={`M${PIVOT.x - ARM - 4} ${PIVOT.y - 3}Q${PIVOT.x} ${PIVOT.y - 12} ${PIVOT.x + ARM + 4} ${PIVOT.y - 3}V${PIVOT.y + 4}Q${PIVOT.x} ${PIVOT.y - 4} ${PIVOT.x - ARM - 4} ${PIVOT.y + 4}Z`}
          fill="url(#tenbin-brass)"
        />
      </g>
      <Pan angle={tilt} side={-1} tag={null}>
        {left}
      </Pan>
      <Pan angle={tilt} side={1} tag={tag}>
        {right}
      </Pan>
      <circle
        cx={PIVOT.x}
        cy={PIVOT.y}
        fill="url(#tenbin-brass)"
        r="11"
        stroke={brass.light}
        strokeWidth="1.5"
      />
      <path d={`M${PIVOT.x} ${PIVOT.y - 30}l7 14h-14z`} fill={brass.light} />
    </g>
  </svg>
);

const ITEM = 84;
const LIGHTEST = 0.7;
const SPREAD = 0.45;

export const Load = ({ id, step }: { id: string; step?: number }) => (
  <g
    {...stylex.props(
      styles.moving,
      styles.grow(
        `scale(${step === undefined ? 1 : (LIGHTEST + (step / STEPS) * SPREAD).toFixed(3)})`
      )
    )}
  >
    <g key={id} {...stylex.props(styles.plop)}>
      <ArtImage id={id} size={ITEM} />
    </g>
  </g>
);
