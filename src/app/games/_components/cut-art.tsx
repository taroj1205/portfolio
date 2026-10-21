import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import {
  cutSvg,
  layersOf,
  pieceSvg,
  tagAt,
} from "../itto/_components/food-svg";
import { knifeSvg } from "../itto/_components/knife-svg";
import { woodSvg } from "../itto/_components/wood-svg";
import { reachOf } from "../itto/_lib/cut";
import { SPAN } from "../itto/_lib/foods";
import { demoOf, tenths } from "../itto/_lib/result";

const ink = {
  label: "#2a1a10",
  pill: "#fffcf4",
  slash: "#ffffff",
} as const;

const LOOP = "5.6s";
const SIZE = 300;
const demo = demoOf(9);
const { split } = demo;
const reach = reachOf(demo.food.parts, demo.cut);
const scale = SIZE / SPAN;

const whole = stylex.keyframes({
  "0%, 44%": { opacity: 1 },
  "45%, 100%": { opacity: 0 },
});

const apart = stylex.keyframes({
  "0%, 44%": { opacity: 0, transform: "none" },
  "45%": { opacity: 1, transform: "none" },
  "56%, 90%": { opacity: 1, transform: "translate(var(--dx), var(--dy))" },
  "100%": { opacity: 0, transform: "translate(var(--dx), var(--dy))" },
});

const sweep = stylex.keyframes({
  "0%, 24%": { opacity: 0, transform: "none" },
  "28%": { opacity: 1, transform: "none" },
  "44%": { opacity: 1, transform: "translate(var(--dx), var(--dy))" },
  "52%, 100%": { opacity: 0, transform: "translate(var(--dx), var(--dy))" },
});

const flash = stylex.keyframes({
  "0%, 43%": { opacity: 0 },
  "46%": { opacity: 1 },
  "64%, 100%": { opacity: 0 },
});

const pop = stylex.keyframes({
  "0%, 52%": { opacity: 0 },
  "58%, 90%": { opacity: 1 },
  "100%": { opacity: 0 },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  loop: {
    animationDuration: LOOP,
    animationIterationCount: "infinite",
    animationTimingFunction: "cubic-bezier(0.3, 0.9, 0.3, 1)",
  },
  whole: {
    animationName: { default: whole, [media.reduce]: "none" },
    opacity: { default: null, [media.reduce]: 0 },
  },
  apart: {
    animationName: { default: apart, [media.reduce]: "none" },
    transform: {
      default: null,
      [media.reduce]: "translate(var(--dx), var(--dy))",
    },
  },
  sweep: {
    animationName: { default: sweep, [media.reduce]: "none" },
    opacity: { default: null, [media.reduce]: 0 },
  },
  flash: {
    animationName: { default: flash, [media.reduce]: "none" },
    opacity: { default: null, [media.reduce]: 0 },
  },
  pop: {
    animationName: { default: pop, [media.reduce]: "none" },
  },
  push: (dx: string, dy: string) => ({
    "--dx": dx,
    "--dy": dy,
  }),
});

const px = (value: number) => `${value.toFixed(4)}px`;

export const CutArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox="0 0 640 360"
    {...stylex.props(styles.art)}
  >
    {woodSvg("cut-art-wood", 640, 360)}
    <g transform={`translate(320 180) scale(${scale})`}>
      <g {...stylex.props(styles.loop, styles.whole)}>
        {cutSvg("cut-art-whole", demo.food, null, 0)}
      </g>
      {split === null
        ? null
        : layersOf(split).map(({ faces, half, key, side }) => (
            <g
              key={key}
              {...stylex.props(
                styles.loop,
                styles.apart,
                styles.push(px(side.push.x * 1.4), px(side.push.y * 1.4))
              )}
            >
              {pieceSvg({
                chunks: side.chunks,
                faces,
                food: demo.food,
                half,
                id: `cut-art-${key}`,
                split,
              })}
            </g>
          ))}
      <path
        d={`M${reach.from.x} ${reach.from.y}L${reach.to.x} ${reach.to.y}`}
        stroke={ink.slash}
        strokeLinecap="round"
        strokeWidth={0.03}
        {...stylex.props(styles.loop, styles.flash)}
      />
      <g
        {...stylex.props(
          styles.loop,
          styles.sweep,
          styles.push(
            px(reach.to.x - reach.from.x),
            px(reach.to.y - reach.from.y)
          )
        )}
      >
        {knifeSvg(reach.from, {
          x: reach.from.x * 2 - reach.to.x,
          y: reach.from.y * 2 - reach.to.y,
        })}
      </g>
      {split === null
        ? null
        : split.sides.map((side, index) => {
            const { x, y } = tagAt(side, 1.4);
            return (
              <g
                key={index === 0 ? "plus" : "minus"}
                transform={`translate(${x.toFixed(3)} ${y.toFixed(3)})`}
                {...stylex.props(styles.loop, styles.pop)}
              >
                <rect
                  fill={ink.pill}
                  height={0.26}
                  rx={0.13}
                  width={0.72}
                  x={-0.36}
                  y={-0.13}
                />
                <text
                  dominantBaseline="central"
                  fill={ink.label}
                  fontFamily="var(--font-mincho), serif"
                  fontSize={0.17}
                  fontWeight={700}
                  textAnchor="middle"
                >
                  {tenths(side.share)}%
                </text>
              </g>
            );
          })}
    </g>
  </svg>
);
