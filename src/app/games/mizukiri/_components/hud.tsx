import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import type { Copy } from "../_lib/copy";
import { nameOf } from "../_lib/cosmetics";
import type { Text } from "../_lib/i18n";
import { describe, formatDistance } from "../_lib/result";
import type { Result } from "../_lib/result";
import { pointsLeft, progressOf } from "../_lib/save";
import type { Save } from "../_lib/save";
import type { Phase } from "../_lib/session";
import { glass } from "./glass";
import { useCopy, useLang } from "./lang";
import { font, ink, media, shade } from "./theme.stylex";

export interface Popup {
  id: number;
  say: (copy: Copy) => string;
  tone: "gold" | "white" | "grey" | "green";
}

const pop = stylex.keyframes({
  "0%": { opacity: 0.75, transform: "scale(1.28)" },
  "100%": { opacity: 1, transform: "scale(1)" },
});

const shout = stylex.keyframes({
  "0%": { opacity: 0, transform: "rotate(-6deg) scale(1.9)" },
  "18%": { opacity: 1, transform: "rotate(-6deg) scale(1)" },
  "70%": {
    opacity: 1,
    transform: "rotate(-6deg) scale(1.04) translateY(-6px)",
  },
  "100%": {
    opacity: 0,
    transform: "rotate(-6deg) scale(1.08) translateY(-18px)",
  },
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

const unveil = stylex.keyframes({
  "0%": {
    filter: "blur(10px)",
    letterSpacing: "calc(0.9em * var(--track, 1))",
    opacity: 0,
  },
  "22%": {
    filter: "blur(0)",
    letterSpacing: "calc(0.5em * var(--track, 1))",
    opacity: 1,
  },
  "75%": {
    filter: "blur(0)",
    letterSpacing: "calc(0.46em * var(--track, 1))",
    opacity: 1,
  },
  "100%": {
    filter: "blur(6px)",
    letterSpacing: "calc(0.42em * var(--track, 1))",
    opacity: 0,
  },
});

const throb = stylex.keyframes({
  "0%": { transform: "scale(1)" },
  "50%": { transform: "scale(1.08)" },
  "100%": { transform: "scale(1)" },
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
  lead: {
    color: "#ffd27a",
    fontSize: "0.62em",
    letterSpacing: "0.18em",
    marginBlockEnd: "0.3em",
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
    gap: "0.6rem",
  },
  stat: {
    margin: 0,
    textAlign: "end",
    textShadow: shade.small,
  },
  label: {
    color: ink.soft,
    display: "block",
    fontSize: "0.7rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  value: {
    alignItems: "center",
    display: "inline-flex",
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    gap: "0.35rem",
  },
  dot: {
    backgroundColor: "#ffd27a",
    borderRadius: 999,
    boxShadow: "0 0 10px #ffd27a",
    height: 9,
    position: "absolute",
    right: 2,
    top: 2,
    width: 9,
  },
  mute: {
    position: "relative",
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
  meter: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(3.4rem, 16vw, 6.5rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    textShadow: shade.large,
  },
  meterUnit: {
    fontSize: "0.34em",
    marginInlineStart: "0.15em",
  },
  count: {
    animationDuration: "420ms",
    animationName: { default: pop, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    fontFamily: font.mincho,
    fontSize: "1.45rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    marginTop: "0.35rem",
    textShadow: shade.small,
  },
  countUnit: {
    fontSize: "0.7em",
    marginInlineStart: "0.1em",
  },
  combo: {
    animationDuration: "900ms",
    animationIterationCount: "infinite",
    animationName: { default: throb, [media.reduce]: "none" },
    color: "#2a1d05",
    backgroundColor: "#ffd27a",
    borderRadius: 999,
    boxShadow: "0 0 24px rgb(255 210 122 / 0.6)",
    fontSize: "0.8rem",
    fontWeight: 800,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    marginTop: "0.6rem",
    paddingBlock: "0.2rem",
    paddingInline: "0.7rem",
  },
  shout: {
    animationDuration: "900ms",
    animationFillMode: "forwards",
    animationName: { default: shout, [media.reduce]: drift },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    fontFamily: font.mincho,
    fontSize: "clamp(2.2rem, 11vw, 3.6rem)",
    fontWeight: 800,
    insetInline: 0,
    position: "absolute",
    textAlign: "center",
    textShadow: shade.large,
    top: "24%",
    WebkitTextStroke: "1px rgb(0 0 0 / 0.25)",
  },
  banner: {
    alignItems: "center",
    animationDuration: "3.2s",
    animationFillMode: "forwards",
    animationName: { default: unveil, [media.reduce]: drift },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    insetInline: 0,
    position: "absolute",
    textShadow: shade.large,
    top: "40%",
  },
  bannerRule: {
    backgroundImage:
      "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.8), transparent)",
    height: 1,
    width: "min(60vw, 18rem)",
  },
  bannerName: {
    fontFamily: font.mincho,
    fontSize: "clamp(2rem, 9vw, 3rem)",
    fontWeight: 700,
    paddingInlineStart: "0.5em",
  },
  gold: {
    backgroundClip: "text",
    backgroundImage:
      "linear-gradient(180deg, #fff4c2 0%, #ffd27a 45%, #c98a1e 100%)",
    color: "transparent",
    filter: "drop-shadow(0 2px 10px rgb(255 190 80 / 0.45))",
    textShadow: "none",
    WebkitBackgroundClip: "text",
  },
  white: { color: "#fffaf3" },
  grey: { color: "rgb(255 255 255 / 0.7)" },
  green: { color: "#b6f08f" },
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
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: 0,
    marginTop: "0.2rem",
  },
  hint: {
    alignItems: "center",
    bottom: "max(5vh, calc(env(safe-area-inset-bottom) + 1.5rem))",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    insetInline: 0,
    letterSpacing: "calc(0.18em * var(--track, 1))",
    position: "absolute",
    textShadow: shade.small,
  },
  hintText: {
    fontSize: "0.95rem",
    fontWeight: 600,
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
});

const Gear = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    viewBox="0 0 24 24"
    width="20"
  >
    <ellipse
      cx="12"
      cy="13"
      rx="8.5"
      ry="4.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <ellipse cx="10" cy="12" fill="currentColor" rx="3.4" ry="1.1" />
    <path
      d="M6 6.5 8 8.5M12 4v3M18 6.5 16 8.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="1.6"
    />
  </svg>
);

interface HudProps {
  banner: { id: number; name: Text } | null;
  phase: Phase;
  skips: number;
  combo: number;
  save: Save | null;
  popup: Popup | null;
  challenge: Result | null;
  tutorial: boolean;
  onReset: () => void;
  onWorkshop: () => void;
  opener: RefObject<HTMLButtonElement | null>;
  valueRef: RefObject<HTMLSpanElement | null>;
  unitRef: RefObject<HTMLSpanElement | null>;
}

const Challenge = ({ challenge }: { challenge: Result }) => {
  const lang = useLang();
  const copy = useCopy();
  return (
    <div {...stylex.props(glass.surface, styles.challenge)}>
      <span {...stylex.props(styles.label)}>{copy.challenge.received}</span>
      <p {...stylex.props(styles.challengeTitle)}>
        {formatDistance(challenge.distance)} · {describe(challenge, lang).title}
      </p>
      {challenge.stone === null ? null : (
        <span {...stylex.props(styles.label)}>
          {copy.challenge.stone(nameOf(challenge.stone, lang))}
        </span>
      )}
      <span {...stylex.props(styles.label)}>{copy.challenge.dare}</span>
    </div>
  );
};

const Replay = () => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    viewBox="0 0 24 24"
    width="20"
  >
    <path
      d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4.5h4.5"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
  </svg>
);

const Corner = ({
  phase,
  save,
  onReset,
  onWorkshop,
  opener,
}: Pick<HudProps, "phase" | "save" | "onReset" | "onWorkshop" | "opener">) => {
  const copy = useCopy();
  return (
    <div {...stylex.props(styles.corner)}>
      {save === null || save.best <= 0 ? null : (
        <p {...stylex.props(styles.stat)}>
          <span {...stylex.props(styles.label)}>{copy.best}</span>
          <span {...stylex.props(styles.value)}>
            {formatDistance(save.best)}
          </span>
        </p>
      )}
      {save === null ? null : (
        <p {...stylex.props(styles.stat)}>
          <span {...stylex.props(styles.label)}>
            Lv.{progressOf(save.xp).level}
          </span>
        </p>
      )}
      {phase === "ready" || phase === "done" ? (
        <button
          aria-label={copy.openWorkshop}
          onClick={onWorkshop}
          ref={opener}
          type="button"
          {...stylex.props(glass.surface, styles.mute)}
        >
          <Gear />
          {save !== null && (pointsLeft(save) > 0 || save.unseen.length > 0) ? (
            <span aria-hidden="true" {...stylex.props(styles.dot)} />
          ) : null}
        </button>
      ) : null}
      {phase === "flying" ? (
        <button
          aria-label={copy.reset}
          onClick={onReset}
          type="button"
          {...stylex.props(glass.surface, styles.mute)}
        >
          <Replay />
        </button>
      ) : null}
    </div>
  );
};

export const Hud = ({
  banner,
  phase,
  skips,
  combo,
  save,
  popup,
  challenge,
  tutorial,
  onReset,
  onWorkshop,
  opener,
  valueRef,
  unitRef,
}: HudProps) => {
  const lang = useLang();
  const copy = useCopy();
  const counting = phase === "flying" || phase === "done";
  const hint =
    phase === "done" || (phase === "flying" && !tutorial)
      ? undefined
      : copy.hints[phase];
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.top)}>
        <div {...stylex.props(styles.brand)}>
          <h1 lang="ja" {...stylex.props(styles.title)}>
            <span {...stylex.props(styles.lead)}>天の川</span>
            水切り
          </h1>
          <span aria-hidden="true" {...stylex.props(styles.seal)}>
            石
          </span>
        </div>
        <Corner
          onReset={onReset}
          onWorkshop={onWorkshop}
          opener={opener}
          phase={phase}
          save={save}
        />
      </div>

      <div
        aria-hidden={!counting}
        {...stylex.props(styles.counter, !counting && styles.hidden)}
      >
        <span {...stylex.props(styles.meter)}>
          <span ref={valueRef}>0.0</span>
          <span ref={unitRef} {...stylex.props(styles.meterUnit)}>
            m
          </span>
        </span>
        <span key={skips} {...stylex.props(styles.count)}>
          {skips}
          <span {...stylex.props(styles.countUnit)}>{copy.skipUnit}</span>
        </span>
        {combo >= 2 ? (
          <span {...stylex.props(styles.combo)}>{copy.combo(combo)}</span>
        ) : null}
      </div>

      {popup === null ? null : (
        <p
          aria-hidden="true"
          key={popup.id}
          {...stylex.props(styles.shout, styles[popup.tone])}
        >
          {popup.say(copy)}
        </p>
      )}

      {banner === null ? null : (
        <div
          aria-live="polite"
          key={banner.id}
          {...stylex.props(styles.banner)}
        >
          <span {...stylex.props(styles.bannerRule)} />
          <span {...stylex.props(styles.bannerName)}>{banner.name[lang]}</span>
          <span {...stylex.props(styles.bannerRule)} />
        </div>
      )}

      {challenge && !counting ? <Challenge challenge={challenge} /> : null}

      {hint === undefined ? null : (
        <div {...stylex.props(styles.hint)}>
          {phase === "ready" ? <span {...stylex.props(styles.finger)} /> : null}
          <span {...stylex.props(styles.hintText)}>{hint}</span>
        </div>
      )}
    </div>
  );
};
