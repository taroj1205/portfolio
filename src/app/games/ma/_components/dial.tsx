import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import {
  PERFECT,
  formatGap,
  formatTime,
  rankOf,
  secondsText,
} from "../_lib/judge";
import type { Phase } from "../_lib/session";
import { Timeline } from "./timeline";

const GOLD = "#ffd27a";
const GAP = "#ff9b7f";

export interface Reveal {
  time: number;
  target: number;
  demo: boolean;
}

const bloom = stylex.keyframes({
  "0%": { filter: "blur(18px)", opacity: 0, transform: "scale(1.06)" },
  "100%": { filter: "blur(0)", opacity: 1, transform: "scale(1)" },
});

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(8px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const nudge = stylex.keyframes({
  "0%, 100%": { transform: "translateX(0)" },
  "20%": { transform: "translateX(-6px)" },
  "45%": { transform: "translateX(5px)" },
  "70%": { transform: "translateX(-3px)" },
});

const ring = stylex.keyframes({
  "0%": { opacity: 0.85, transform: "translate(-50%, -50%) scale(0.3)" },
  "100%": { opacity: 0, transform: "translate(-50%, -50%) scale(2.6)" },
});

const flash = stylex.keyframes({
  "0%": { opacity: 0 },
  "12%": { opacity: 0.55 },
  "100%": { opacity: 0 },
});

const shimmer = stylex.keyframes({
  "0%": { backgroundPosition: "0% 50%" },
  "100%": { backgroundPosition: "200% 50%" },
});

const styles = stylex.create({
  dial: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "0.4rem",
    justifyContent: "center",
    minHeight: 0,
    minWidth: 0,
    pointerEvents: "none",
    position: "relative",
    textAlign: "center",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  eyebrow: {
    alignItems: "center",
    color: ink.soft,
    display: "flex",
    fontSize: "0.78rem",
    fontWeight: 700,
    gap: "0.5rem",
    letterSpacing: "calc(0.2em * var(--track, 1))",
    margin: 0,
    minHeight: "1.6rem",
    textShadow: shade.small,
  },
  chip: {
    backgroundColor: "rgb(255 255 255 / 0.1)",
    borderColor: "rgb(255 255 255 / 0.22)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    paddingBlock: "0.2rem",
    paddingInline: "0.75rem",
  },
  numerals: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(4.8rem, 26vw, 11rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    justifyContent: "center",
    letterSpacing: "-0.01em",
    lineHeight: 0.95,
    margin: 0,
    textShadow: "0 0 40px rgb(190 206 255 / 0.35), 0 6px 30px rgb(0 0 0 / 0.5)",
  },
  ghost: {
    color: "transparent",
    textShadow: "0 0 30px rgb(190 206 255 / 0.25)",
    WebkitTextStroke: "1.5px rgb(244 246 255 / 0.75)",
  },
  small: {
    fontSize: "clamp(3.8rem, 19vw, 8rem)",
  },
  unit: {
    fontSize: "0.28em",
    letterSpacing: 0,
    marginInlineStart: "0.12em",
  },
  ghostUnit: {
    color: "rgb(244 246 255 / 0.75)",
    WebkitTextStroke: "0",
  },
  face: {
    transitionDuration: { default: "80ms", [media.reduce]: "0s" },
    transitionProperty: "opacity, filter",
  },
  bloom: {
    animationDuration: "900ms",
    animationName: { default: bloom, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
  },
  gold: {
    backgroundClip: "text",
    backgroundImage: `linear-gradient(100deg, #fff6d8 0%, ${GOLD} 30%, #fff1b8 50%, #e9a93a 70%, #fff6d8 100%)`,
    backgroundSize: "200% 100%",
    color: "transparent",
    animationDuration: "2.4s",
    animationIterationCount: "infinite",
    animationName: { default: shimmer, [media.reduce]: "none" },
    animationTimingFunction: "linear",
    filter: "drop-shadow(0 0 24px rgb(255 200 110 / 0.55))",
    textShadow: "none",
    WebkitBackgroundClip: "text",
  },
  caption: {
    color: ink.soft,
    fontFamily: font.mincho,
    fontSize: "clamp(1rem, 4.4vw, 1.25rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.18em * var(--track, 1))",
    margin: 0,
    minHeight: "1.8rem",
    textShadow: shade.small,
  },
  early: {
    animationDuration: "420ms",
    animationName: { default: nudge, [media.reduce]: "none" },
    color: GOLD,
  },
  gap: {
    animationDelay: "250ms",
    animationDuration: "600ms",
    animationFillMode: "backwards",
    animationName: { default: rise, [media.reduce]: "none" },
    color: GAP,
    fontFamily: font.mincho,
    fontSize: "clamp(1.1rem, 4.8vw, 1.45rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    letterSpacing: "calc(0.06em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  gapPerfect: {
    color: GOLD,
  },
  gapSoft: {
    color: ink.soft,
    fontFamily: "inherit",
    fontSize: "0.8em",
    fontWeight: 600,
    marginInlineStart: "0.6em",
  },
  timeline: {
    marginBlockStart: "0.6rem",
    maxWidth: "34rem",
    width: "100%",
  },
  stage: {
    position: "relative",
  },
  ring: {
    animationDuration: "1.6s",
    animationFillMode: "both",
    animationName: { default: ring, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    aspectRatio: "1",
    borderColor: GOLD,
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 0 30px rgb(255 200 110 / 0.5)",
    left: "50%",
    opacity: { default: null, [media.reduce]: 0 },
    position: "absolute",
    top: "50%",
    width: "min(70vw, 22rem)",
  },
  second: {
    animationDelay: "260ms",
  },
  third: {
    animationDelay: "520ms",
  },
  flash: {
    animationDuration: "900ms",
    animationFillMode: "both",
    animationName: { default: flash, [media.reduce]: "none" },
    backgroundImage:
      "radial-gradient(circle at 50% 40%, rgb(255 240 200 / 0.9), rgb(255 210 122 / 0.25) 45%, transparent 75%)",
    inset: 0,
    opacity: { default: null, [media.reduce]: 0 },
    pointerEvents: "none",
    position: "fixed",
  },
});

interface DialProps {
  lang: Lang;
  phase: Phase;
  target: number;
  reveal: Reveal | null;
  early: number;
  clock: RefObject<HTMLSpanElement | null>;
  face: RefObject<HTMLDivElement | null>;
  onLand: () => void;
}

const Example = ({ lang }: { lang: Lang }) => (
  <p {...stylex.props(styles.eyebrow)}>
    <span {...stylex.props(styles.chip)}>{copy[lang].example}</span>
  </p>
);

const Goal = ({ lang, target }: { lang: Lang; target: number }) => {
  const words = copy[lang];
  return (
    <>
      <p {...stylex.props(styles.eyebrow)}>{words.modes.label}</p>
      <p {...stylex.props(styles.numerals, styles.ghost)}>
        {formatTime(target)}
        <span {...stylex.props(styles.unit, styles.ghostUnit)}>
          {words.unit}
        </span>
      </p>
      <p {...stylex.props(styles.caption)}>{words.goal}</p>
    </>
  );
};

const Shown = ({
  lang,
  reveal,
  onLand,
}: {
  lang: Lang;
  reveal: Reveal;
  onLand: () => void;
}) => {
  const words = copy[lang];
  const gap = reveal.time - reveal.target;
  const perfect = rankOf(gap).level === PERFECT;
  let lean = words.result.exact;
  if (gap < 0) {
    lean = words.result.early;
  } else if (gap > 0) {
    lean = words.result.late;
  }
  return (
    <>
      {perfect && !reveal.demo ? (
        <span aria-hidden="true" {...stylex.props(styles.flash)} />
      ) : null}
      {reveal.demo ? (
        <Example lang={lang} />
      ) : (
        <p {...stylex.props(styles.eyebrow)} />
      )}
      <div {...stylex.props(styles.stage)}>
        {perfect ? (
          <>
            <span aria-hidden="true" {...stylex.props(styles.ring)} />
            <span
              aria-hidden="true"
              {...stylex.props(styles.ring, styles.second)}
            />
            <span
              aria-hidden="true"
              {...stylex.props(styles.ring, styles.third)}
            />
          </>
        ) : null}
        <p
          {...stylex.props(
            styles.numerals,
            styles.small,
            styles.bloom,
            perfect && styles.gold
          )}
        >
          {formatTime(reveal.time)}
          <span {...stylex.props(styles.unit)}>{words.unit}</span>
        </p>
      </div>
      <p {...stylex.props(styles.gap, perfect && styles.gapPerfect)}>
        {secondsText(formatGap(gap), lang)}
        <span {...stylex.props(styles.gapSoft)}>{lean}</span>
      </p>
      <div {...stylex.props(styles.timeline)}>
        <Timeline
          id={reveal.demo ? "ma-demo" : "ma-run"}
          lang={lang}
          onLand={reveal.demo ? undefined : onLand}
          target={reveal.target}
          time={reveal.time}
        />
      </div>
    </>
  );
};

export const Dial = ({
  lang,
  phase,
  target,
  reveal,
  early,
  clock,
  face,
  onLand,
}: DialProps) => {
  const words = copy[lang];
  if (reveal !== null) {
    return (
      <section aria-live="polite" {...stylex.props(styles.dial)}>
        <Shown
          key={`${reveal.demo}-${reveal.time}`}
          lang={lang}
          onLand={onLand}
          reveal={reveal}
        />
      </section>
    );
  }
  if (phase === "ready" || phase === "done") {
    return (
      <section {...stylex.props(styles.dial)}>
        <Goal lang={lang} target={target} />
      </section>
    );
  }
  const demo = phase === "demo";
  return (
    <section {...stylex.props(styles.dial)}>
      {demo ? <Example lang={lang} /> : <p {...stylex.props(styles.eyebrow)} />}
      <div ref={face} {...stylex.props(styles.face)}>
        <p aria-hidden="true" {...stylex.props(styles.numerals)}>
          <span ref={clock}>{formatTime(0)}</span>
          <span {...stylex.props(styles.unit)}>{words.unit}</span>
        </p>
      </div>
      <p
        aria-live="polite"
        key={early}
        {...stylex.props(styles.caption, early > 0 && !demo && styles.early)}
      >
        {early > 0 && !demo ? words.early : words.aim(formatTime(target))}
      </p>
    </section>
  );
};
