import * as stylex from "@stylexjs/stylex";

import { media } from "../../../styles/tokens.stylex";
import {
  figureSvg,
  grassSvg,
  signalSvg,
  skySvg,
  slashSvg,
} from "../iai/_components/duel-svg";
import { homeOf, lungeOf, tints } from "../iai/_lib/scene";
import type { Layout } from "../iai/_lib/scene";

const at: Layout = {
  gap: 150,
  ground: 292,
  h: 360,
  mid: 320,
  moon: { r: 104, x: 320, y: 172 },
  scale: 1.05,
  w: 640,
};

const before = stylex.keyframes({
  "0%, 57.9%": { opacity: 1 },
  "58%, 96%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const loser = stylex.keyframes({
  "0%, 63.9%": { opacity: 1 },
  "64%, 96%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const fallen = stylex.keyframes({
  "0%, 63.9%": { opacity: 0 },
  "64%, 94%": { opacity: 1 },
  "97%, 100%": { opacity: 0 },
});

const after = stylex.keyframes({
  "0%, 57.9%": { opacity: 0 },
  "58%, 94%": { opacity: 1 },
  "97%, 100%": { opacity: 0 },
});

const signal = stylex.keyframes({
  "0%, 45.9%": { opacity: 0 },
  "46%, 58%": { opacity: 1 },
  "61%, 100%": { opacity: 0 },
});

const slash = stylex.keyframes({
  "0%, 57.9%": { opacity: 0 },
  "58%": { opacity: 1 },
  "76%, 100%": { opacity: 0 },
});

const styles = stylex.create({
  art: {
    display: "block",
    height: "100%",
    width: "100%",
  },
  before: {
    animationDuration: "5.2s",
    animationIterationCount: "infinite",
    animationName: { default: before, [media.reduce]: "none" },
    animationTimingFunction: "linear",
  },
  loser: {
    animationDuration: "5.2s",
    animationIterationCount: "infinite",
    animationName: { default: loser, [media.reduce]: "none" },
    animationTimingFunction: "linear",
  },
  fallen: {
    animationDuration: "5.2s",
    animationIterationCount: "infinite",
    animationName: { default: fallen, [media.reduce]: "none" },
    animationTimingFunction: "linear",
    opacity: { default: null, [media.reduce]: 0 },
  },
  after: {
    animationDuration: "5.2s",
    animationIterationCount: "infinite",
    animationName: { default: after, [media.reduce]: "none" },
    animationTimingFunction: "linear",
    opacity: { default: null, [media.reduce]: 0 },
  },
  signal: {
    animationDuration: "5.2s",
    animationIterationCount: "infinite",
    animationName: { default: signal, [media.reduce]: "none" },
    animationTimingFunction: "linear",
  },
  slash: {
    animationDuration: "5.2s",
    animationIterationCount: "infinite",
    animationName: { default: slash, [media.reduce]: "none" },
    animationTimingFunction: "linear",
    opacity: { default: null, [media.reduce]: 0 },
  },
});

export const BladeArt = () => (
  <svg
    aria-hidden="true"
    preserveAspectRatio="xMidYMid slice"
    viewBox={`0 0 ${at.w} ${at.h}`}
    {...stylex.props(styles.art)}
  >
    {skySvg("blade-art", at)}
    <g {...stylex.props(styles.before)}>
      {figureSvg(at, "left", "stance", homeOf(at, "left"), tints.duel.left)}
    </g>
    <g {...stylex.props(styles.after)}>
      {figureSvg(at, "left", "strike", lungeOf(at, "left"), tints.duel.left)}
    </g>
    <g {...stylex.props(styles.loser)}>
      {figureSvg(at, "right", "stance", homeOf(at, "right"), tints.duel.right)}
    </g>
    <g {...stylex.props(styles.fallen)}>
      {figureSvg(at, "right", "fallen", homeOf(at, "right"), tints.duel.right)}
    </g>
    <g {...stylex.props(styles.signal)}>{signalSvg(at)}</g>
    <g {...stylex.props(styles.slash)}>{slashSvg(at, "left")}</g>
    {grassSvg(at)}
  </svg>
);
