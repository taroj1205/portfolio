import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { describe } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Phase } from "../_lib/session";
import { glass } from "./glass";
import { font, ink, media, shade } from "./theme.stylex";

const pop = stylex.keyframes({
  "0%": { opacity: 0.75, transform: "scale(1.28)" },
  "100%": { opacity: 1, transform: "scale(1)" },
});

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const swipe = stylex.keyframes({
  "0%": { opacity: 0, transform: "translate(-14px, 14px)" },
  "20%": { opacity: 1 },
  "60%": { opacity: 0, transform: "translate(22px, -46px)" },
  "100%": { opacity: 0, transform: "translate(22px, -46px)" },
});

const styles = stylex.create({
  root: {
    color: ink.text,
    inset: 0,
    paddingBlock:
      "max(1.25rem, calc(env(safe-area-inset-top) + 0.75rem)) max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))",
    paddingInline:
      "max(1.25rem, calc(env(safe-area-inset-left) + 0.75rem)) max(1.25rem, calc(env(safe-area-inset-right) + 0.75rem))",
    pointerEvents: "none",
    position: "fixed",
  },
  top: {
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "1.65rem",
    fontWeight: 700,
    letterSpacing: "0.32em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    writingMode: "vertical-rl",
  },
  seal: {
    alignItems: "center",
    backgroundColor: "#c8352b",
    borderRadius: 4,
    boxShadow: "0 2px 10px rgb(120 20 10 / 0.35)",
    color: "#fff4ec",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "0.8rem",
    fontWeight: 700,
    height: "1.6rem",
    justifyContent: "center",
    transform: "rotate(-4deg)",
    width: "1.6rem",
  },
  corner: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  best: {
    margin: 0,
    textAlign: "end",
    textShadow: shade.small,
  },
  label: {
    color: ink.soft,
    display: "block",
    fontSize: "0.7rem",
    letterSpacing: "0.14em",
  },
  bestValue: {
    fontFamily: font.mincho,
    fontSize: "1.3rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
  },
  unitSmall: {
    fontSize: "0.75rem",
    marginInlineStart: "0.15em",
  },
  mute: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    height: "2.75rem",
    justifyContent: "center",
    padding: 0,
    pointerEvents: "auto",
    width: "2.75rem",
  },
  counter: {
    alignItems: "center",
    backgroundImage:
      "radial-gradient(closest-side, rgb(10 14 24 / 0.3), transparent)",
    display: "flex",
    flexDirection: "column",
    insetInline: 0,
    position: "absolute",
    top: "max(11vh, 5.5rem)",
    transitionDuration: "400ms",
    transitionProperty: "opacity, transform",
  },
  hidden: {
    opacity: 0,
    transform: "translateY(-12px)",
  },
  count: {
    animationDuration: "420ms",
    animationName: { default: pop, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    display: "flex",
    alignItems: "baseline",
    fontFamily: font.mincho,
    fontSize: "clamp(5.5rem, 26vw, 10.5rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    textShadow: shade.large,
  },
  countUnit: {
    fontSize: "0.24em",
    marginInlineStart: "0.12em",
  },
  distance: {
    color: ink.soft,
    fontSize: "0.85rem",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "0.16em",
    marginTop: "0.4rem",
    textShadow: shade.small,
  },
  challenge: {
    animationDuration: "700ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    borderRadius: 18,
    insetInline: 0,
    marginInline: "auto",
    maxWidth: "17rem",
    paddingBlock: "0.75rem",
    paddingInline: "1rem",
    position: "absolute",
    textAlign: "center",
    top: "max(14vh, 6.5rem)",
    width: "calc(100% - 7rem)",
  },
  challengeTitle: {
    margin: 0,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    marginTop: "0.2rem",
  },
  hint: {
    alignItems: "center",
    bottom: "max(5vh, calc(env(safe-area-inset-bottom) + 1.5rem))",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    insetInline: 0,
    letterSpacing: "0.18em",
    position: "absolute",
    textShadow: shade.small,
    transitionDuration: "300ms",
    transitionProperty: "opacity",
  },
  hintText: {
    fontSize: "0.9rem",
  },
  finger: {
    animationDuration: "1.8s",
    animationIterationCount: "infinite",
    animationName: { default: swipe, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.3, 0.7, 0.2, 1)",
    backgroundColor: "rgb(255 255 255 / 0.85)",
    borderRadius: 999,
    boxShadow: "0 0 0 6px rgb(255 255 255 / 0.15)",
    height: "1.1rem",
    width: "1.1rem",
  },
  faded: {
    opacity: 0,
  },
});

const Speaker = ({ muted }: { muted: boolean }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    viewBox="0 0 24 24"
    width="20"
  >
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    {muted ? (
      <path
        d="m16 9.5 5 5m0-5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    ) : (
      <path
        d="M15.5 9a4.2 4.2 0 0 1 0 6m2.6-8.6a7.8 7.8 0 0 1 0 11.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    )}
  </svg>
);

interface HudProps {
  phase: Phase;
  skips: number;
  best: number | null;
  challenge: Result | null;
  muted: boolean;
  onMute: () => void;
  distanceRef: RefObject<HTMLSpanElement | null>;
}

export const Hud = ({
  phase,
  skips,
  best,
  challenge,
  muted,
  onMute,
  distanceRef,
}: HudProps) => {
  const counting = phase === "flying" || phase === "done";
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.top)}>
        <div {...stylex.props(styles.brand)}>
          <h1 {...stylex.props(styles.title)}>水切り</h1>
          <span aria-hidden="true" {...stylex.props(styles.seal)}>
            石
          </span>
        </div>
        <div {...stylex.props(styles.corner)}>
          {best === null ? null : (
            <p {...stylex.props(styles.best)}>
              <span {...stylex.props(styles.label)}>自己ベスト</span>
              <span {...stylex.props(styles.bestValue)}>
                {best}
                <span {...stylex.props(styles.unitSmall)}>回</span>
              </span>
            </p>
          )}
          <button
            aria-label={muted ? "音を出す" : "音を消す"}
            aria-pressed={muted}
            onClick={onMute}
            type="button"
            {...stylex.props(glass.surface, styles.mute)}
          >
            <Speaker muted={muted} />
          </button>
        </div>
      </div>

      <div
        aria-hidden={!counting}
        {...stylex.props(styles.counter, !counting && styles.hidden)}
      >
        <span key={skips} {...stylex.props(styles.count)}>
          {skips}
          <span {...stylex.props(styles.countUnit)}>回</span>
        </span>
        <span ref={distanceRef} {...stylex.props(styles.distance)}>
          0.0 m
        </span>
      </div>

      {challenge && !counting ? (
        <div {...stylex.props(glass.surface, styles.challenge)}>
          <span {...stylex.props(styles.label)}>届いた記録</span>
          <p {...stylex.props(styles.challengeTitle)}>
            {challenge.skips}回 · {describe(challenge).title}
          </p>
          <span {...stylex.props(styles.label)}>超えられる？</span>
        </div>
      ) : null}

      <div
        aria-hidden={phase !== "ready"}
        {...stylex.props(styles.hint, phase !== "ready" && styles.faded)}
      >
        <span {...stylex.props(styles.finger)} />
        <span {...stylex.props(styles.hintText)}>押したまま、上にはじく</span>
      </div>
    </div>
  );
};
