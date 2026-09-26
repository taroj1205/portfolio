import * as stylex from "@stylexjs/stylex";

import { color, ease, font, media, shadow, size } from "./tokens.stylex";

const rise = stylex.keyframes({
  from: { filter: "blur(6px)", opacity: 0, translate: "0 0.5em" },
});

const fade = stylex.keyframes({ from: { opacity: 0 } });

const reveal = stylex.keyframes({
  from: { filter: "blur(4px)", opacity: 0, translate: "0 24px" },
});

// Both ends spelled out: inset() can't interpolate to `none`.
const wipe = stylex.keyframes({
  from: { clipPath: "inset(0 0 100% 0)" },
  to: { clipPath: "inset(0 0 0 0)" },
});

export const shared = stylex.create({
  enter: (delay: string) => ({
    animationDelay: delay,
    animationDuration: "900ms",
    animationFillMode: "both",
    animationName: { default: rise, [media.reduce]: fade },
    animationTimingFunction: ease.out,
  }),
  card: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: 28,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.soft,
    padding: "clamp(1.25rem, 3vw, 1.75rem)",
  },
  cardLabel: {
    color: color.muted,
    fontSize: "0.8rem",
    fontWeight: 650,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  display: {
    fontFamily: font.display,
    fontWeight: 700,
    letterSpacing: "-0.03em",
  },
  pressable: {
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    transitionTimingFunction: ease.out,
  },
  reveal: {
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: {
        default: null,
        "@supports (animation-timeline: view())": reveal,
      },
    },
    animationRange: "entry 0% entry 60%",
    animationTimeline: "view()",
    animationTimingFunction: ease.out,
  },
  unveil: {
    animationFillMode: "both",
    animationName: {
      default: null,
      [media.motion]: {
        default: null,
        "@supports (animation-timeline: view())": wipe,
      },
    },
    animationRange: "entry 10% cover 45%",
    animationTimeline: "view()",
    animationTimingFunction: ease.out,
  },
  srOnly: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  textLink: {
    alignItems: "center",
    color: color.cobalt,
    display: "inline-flex",
    fontWeight: 650,
    gap: "0.4rem",
    textDecoration: {
      default: "none",
      [media.hover]: { default: null, ":hover": "underline" },
    },
  },
  title: {
    fontSize: "clamp(2.25rem, 5vw, 3.75rem)",
    letterSpacing: "-0.04em",
  },
  wrap: {
    marginInline: "auto",
    width: `min(${size.wrap}, 100% - 2 * ${size.gutter})`,
  },
});
