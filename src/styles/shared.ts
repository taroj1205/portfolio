import * as stylex from "@stylexjs/stylex";

import { color, ease, font, media, shadow, size } from "./tokens.stylex";

const rise = stylex.keyframes({
  from: { filter: "blur(6px)", opacity: 0, translate: "0 0.5em" },
});

const fade = stylex.keyframes({ from: { opacity: 0 } });

export const night = stylex.createTheme(color, {
  ink: "color-mix(in oklab, #12100e, #f5f1ea calc(var(--dusk) * 100%))",
  line: "color-mix(in oklab, #e4dcd1, #2e2a26 calc(var(--dusk) * 100%))",
  muted: "color-mix(in oklab, #6b655e, #a39b91 calc(var(--dusk) * 100%))",
  paper: "color-mix(in oklab, #f5f1ea, #1c1a17 calc(var(--dusk) * 100%))",
  paperDeep: "color-mix(in oklab, #ebe4d8, #221f1b calc(var(--dusk) * 100%))",
  surface: "color-mix(in oklab, #fff, #2a2723 calc(var(--dusk) * 100%))",
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
  mask: {
    display: "inline-block",
    marginBlock: "-0.08em -0.2em",
    overflowX: "visible",
    overflowY: "clip",
    paddingBlock: "0.08em 0.2em",
    verticalAlign: "top",
  },
  word: {
    display: "inline-block",
    transformOrigin: "0 100%",
  },
  tilt: {
    position: "relative",
    transform: {
      default: null,
      [media.hover]: {
        default: null,
        [media.motion]:
          "perspective(1000px) rotateX(calc((0.5 - var(--tilt-y, 0.5)) * 8deg)) rotateY(calc((var(--tilt-x, 0.5) - 0.5) * 10deg))",
      },
    },
    "::after": {
      backgroundImage:
        "radial-gradient(circle at var(--glare-at, 50% 50%), rgb(255 255 255 / 0.22), transparent 55%)",
      borderRadius: "inherit",
      content: '""',
      inset: 0,
      opacity: "var(--glare, 0)",
      pointerEvents: "none",
      position: "absolute",
      transitionDuration: "400ms",
      transitionProperty: "opacity",
    },
  },
  unveil: {
    display: "block",
    overflow: "clip",
  },
  scrub: {
    animationDelay: "calc(var(--scroll-0, 0) * -1s)",
    animationDuration: "1s",
    animationFillMode: "both",
    animationPlayState: "paused",
    animationTimingFunction: "linear",
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
