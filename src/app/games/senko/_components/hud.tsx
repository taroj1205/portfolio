import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { phaseOf } from "../_lib/phases";
import { formatTime, timeText, titleOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Stage } from "../_lib/session";
import { Ladder } from "./ladder";

export interface Notice {
  id: number;
  text: string;
}

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const unveil = stylex.keyframes({
  "0%": { filter: "blur(10px)", opacity: 0, transform: "translateY(-8px)" },
  "18%": { filter: "blur(0)", opacity: 1, transform: "translateY(0)" },
  "80%": { filter: "blur(0)", opacity: 1, transform: "translateY(4px)" },
  "100%": { filter: "blur(6px)", opacity: 0, transform: "translateY(10px)" },
});

const fade = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(6px)" },
  "12%": { opacity: 1, transform: "translateY(0)" },
  "85%": { opacity: 1, transform: "translateY(0)" },
  "100%": { opacity: 0, transform: "translateY(-4px)" },
});

const ripple = stylex.keyframes({
  "0%": { opacity: 0.9, transform: "scale(0.6)" },
  "100%": { opacity: 0, transform: "scale(1.9)" },
});

const styles = stylex.create({
  root: {
    color: ink.text,
    inset: 0,
    paddingBlock:
      "max(1rem, calc(env(safe-area-inset-top) + 0.6rem)) max(1rem, calc(env(safe-area-inset-bottom) + 0.6rem))",
    paddingInline:
      "max(1rem, calc(env(safe-area-inset-left) + 0.6rem)) max(1rem, calc(env(safe-area-inset-right) + 0.6rem))",
    pointerEvents: "none",
    position: "fixed",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  top: {
    alignItems: "flex-start",
    display: "flex",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
  },
  titleBox: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    width: "2.75rem",
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
    fontSize: "0.5em",
    letterSpacing: "0.2em",
    marginBlockEnd: "0.4em",
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
  clockBox: {
    animationDuration: "500ms",
    animationName: { default: drift, [media.reduce]: "none" },
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  clock: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(2.6rem, 11vw, 4rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
    textShadow: shade.large,
  },
  unit: {
    fontSize: "0.34em",
    marginInlineStart: "0.2em",
  },
  phaseLine: {
    alignItems: "baseline",
    display: "flex",
    gap: "0.5em",
    margin: 0,
    textShadow: shade.small,
  },
  phaseName: {
    color: "#ffd27a",
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
  },
  label: {
    color: ink.soft,
    fontSize: "0.72rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  corner: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    height: "2.75rem",
    justifyContent: "center",
    padding: 0,
    pointerEvents: "auto",
    transform: { default: null, ":active": "scale(0.92)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    width: "2.75rem",
  },
  language: {
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    paddingInline: "1rem",
    width: "auto",
  },
  shout: {
    animationDuration: "2.6s",
    animationFillMode: "forwards",
    animationName: { default: unveil, [media.reduce]: fade },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    display: "flex",
    gap: "0.6rem",
    margin: 0,
    position: "absolute",
    right: "max(1.2rem, calc(env(safe-area-inset-right) + 0.8rem))",
    textShadow: shade.large,
    top: "max(9.5rem, 26vh)",
    writingMode: "vertical-rl",
  },
  shoutName: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.9rem, 8vw, 2.8rem)",
    fontWeight: 700,
    letterSpacing: "0.24em",
  },
  shoutReading: {
    color: "#ffd27a",
    fontSize: "0.8rem",
    letterSpacing: "0.3em",
    paddingTop: "0.3rem",
  },
  bottom: {
    alignItems: "center",
    bottom: "max(1.1rem, calc(env(safe-area-inset-bottom) + 0.7rem))",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    insetInline: "0.75rem",
    position: "absolute",
    textAlign: "center",
  },
  rule: {
    animationDuration: "900ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    margin: 0,
    maxWidth: "24rem",
  },
  ruleLead: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.15rem, 5vw, 1.55rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    textShadow: shade.large,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  ruleBody: {
    color: ink.soft,
    fontSize: "0.86rem",
    lineHeight: 1.7,
    textShadow: shade.small,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  start: {
    alignItems: "center",
    display: "flex",
    fontSize: "0.95rem",
    fontWeight: 700,
    gap: "0.75rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
    marginTop: "0.35rem",
    textShadow: shade.small,
  },
  ring: {
    borderColor: "#ffd27a",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 0 18px rgb(255 190 100 / 0.6)",
    height: "1.6rem",
    position: "relative",
    width: "1.6rem",
  },
  ringWave: {
    animationDuration: "1.8s",
    animationIterationCount: "infinite",
    animationName: { default: ripple, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    borderColor: "#ffd27a",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    inset: -2,
    opacity: 0,
    position: "absolute",
  },
  keys: {
    color: ink.soft,
    display: {
      default: "none",
      "@media (hover: hover) and (pointer: fine)": "block",
    },
    fontSize: "0.75rem",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  challenge: {
    animationDuration: "700ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    maxWidth: "17rem",
    paddingBlock: "0.65rem",
    paddingInline: "1.1rem",
    width: "100%",
  },
  challengeTitle: {
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: 0,
  },
  meter: {
    alignItems: "center",
    display: "flex",
    gap: "0.6rem",
    margin: 0,
  },
  track: {
    backgroundColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 999,
    height: 4,
    overflow: "hidden",
    width: "min(52vw, 13rem)",
  },
  fill: {
    backgroundImage:
      "linear-gradient(90deg, #fff1c9 0%, #ffd27a 45%, #ff8a3c 75%, #ff4a3a 100%)",
    borderRadius: 999,
    clipPath: "inset(0 100% 0 0)",
    display: "block",
    height: "100%",
    width: "100%",
  },
  target: {
    color: ink.soft,
    fontSize: "0.75rem",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  notice: {
    animationDuration: "2.8s",
    animationFillMode: "forwards",
    animationName: fade,
    borderRadius: 999,
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    margin: 0,
    paddingBlock: "0.45rem",
    paddingInline: "1rem",
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
    <path
      d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    {muted ? (
      <path
        d="m16 9.5 5 5m0-5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    ) : (
      <path
        d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    )}
  </svg>
);

interface HudProps {
  lang: Lang;
  stage: Stage;
  phase: number;
  best: number;
  finishes: number;
  runs: number;
  muted: boolean;
  challenge: Result | null;
  shout: number | null;
  notice: Notice | null;
  clock: RefObject<HTMLSpanElement | null>;
  sway: RefObject<HTMLSpanElement | null>;
  onLang: () => void;
  onMute: (muted: boolean) => void;
}

export const Hud = ({
  lang,
  stage,
  phase,
  best,
  finishes,
  runs,
  muted,
  challenge,
  shout,
  notice,
  clock,
  sway,
  onLang,
  onMute,
}: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  const playing = stage === "burning" || stage === "ending";
  const current = phaseOf(phase);
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.top)}>
        <div {...stylex.props(styles.brand)}>
          <BackToGames label={words.back} />
          {playing ? (
            <div {...stylex.props(styles.clockBox)}>
              <p {...stylex.props(styles.clock)}>
                <span ref={clock}>{formatTime(0)}</span>
                <span {...stylex.props(styles.unit)}>{words.unit}</span>
              </p>
              <p {...stylex.props(styles.phaseLine)}>
                <span {...stylex.props(styles.phaseName)}>
                  {current.name[lang]}
                </span>
                {lang === "ja" ? (
                  <span {...stylex.props(styles.label)}>{current.reading}</span>
                ) : null}
              </p>
            </div>
          ) : (
            <div {...stylex.props(styles.titleBox)}>
              <h1 lang="ja" {...stylex.props(styles.title)}>
                <span {...stylex.props(styles.lead)}>ひだまのいっしょう</span>
                {copy.ja.name}
              </h1>
              <span aria-hidden="true" {...stylex.props(styles.seal)}>
                火
              </span>
            </div>
          )}
        </div>
        <div {...stylex.props(styles.corner)}>
          <Toggle
            aria-label={words.mute}
            onPressedChange={onMute}
            pressed={muted}
            {...stylex.props(glass.surface, styles.button)}
          >
            <Speaker muted={muted} />
          </Toggle>
          {playing ? null : (
            <button
              lang={other}
              onClick={onLang}
              type="button"
              {...stylex.props(glass.surface, styles.button, styles.language)}
            >
              {langNames[other]}
            </button>
          )}
        </div>
      </div>

      {shout === null || !playing ? null : (
        <p aria-live="polite" key={shout} {...stylex.props(styles.shout)}>
          <span lang="ja" {...stylex.props(styles.shoutName)}>
            {current.name.ja}
          </span>
          <span lang={lang} {...stylex.props(styles.shoutReading)}>
            {lang === "ja" ? current.reading : current.name.en}
          </span>
        </p>
      )}

      <div {...stylex.props(styles.bottom)}>
        {notice === null ? null : (
          <p
            aria-live="polite"
            key={notice.id}
            {...stylex.props(glass.surface, styles.notice)}
          >
            {notice.text}
          </p>
        )}
        {stage === "idle" ? (
          <>
            {challenge === null ? null : (
              <div {...stylex.props(glass.surface, styles.challenge)}>
                <span {...stylex.props(styles.label)}>
                  {words.challenge.received}
                </span>
                <p {...stylex.props(styles.challengeTitle)}>
                  {timeText(challenge.time, lang)} · {titleOf(challenge, lang)}
                </p>
                <span {...stylex.props(styles.label)}>
                  {words.challenge.dare}
                </span>
              </div>
            )}
            <p {...stylex.props(styles.rule)}>
              <span {...stylex.props(styles.ruleLead)}>{words.rule.lead}</span>
              <span {...stylex.props(styles.ruleBody)}>{words.rule.body}</span>
              <span {...stylex.props(styles.start)}>
                <span aria-hidden="true" {...stylex.props(styles.ring)}>
                  <span {...stylex.props(styles.ringWave)} />
                </span>
                {words.rule.start}
              </span>
            </p>
            <p {...stylex.props(styles.keys)}>{words.rule.keys}</p>
            {runs > 0 ? (
              <p {...stylex.props(styles.label)}>
                {words.best(formatTime(best), finishes)}
              </p>
            ) : null}
          </>
        ) : null}
        {playing ? (
          <>
            <p {...stylex.props(styles.meter)}>
              <span {...stylex.props(styles.label)}>{words.sway}</span>
              <span {...stylex.props(styles.track)}>
                <span ref={sway} {...stylex.props(styles.fill)} />
              </span>
            </p>
            <Ladder label={words.phases} lang={lang} live reached={phase} />
            {challenge === null ? null : (
              <p {...stylex.props(styles.target)}>
                {words.challenge.received} {timeText(challenge.time, lang)}
              </p>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
};
