import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { bodies, kindOf } from "../_lib/bodies";
import { copy } from "../_lib/copy";
import { formatScore, scoreText, titleOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import { BodyIcon } from "./body-icon";
import { Ladder } from "./ladder";

export interface Shout {
  id: number;
  text: string;
  gold: boolean;
}

const pop = stylex.keyframes({
  "0%": { transform: "scale(1.22)" },
  "100%": { transform: "scale(1)" },
});

const shoutIn = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(1.8) rotate(-4deg)" },
  "18%": { opacity: 1, transform: "scale(1) rotate(-4deg)" },
  "72%": {
    opacity: 1,
    transform: "scale(1.04) rotate(-4deg) translateY(-6px)",
  },
  "100%": {
    opacity: 0,
    transform: "scale(1.08) rotate(-4deg) translateY(-18px)",
  },
});

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const unveil = stylex.keyframes({
  "0%": { filter: "blur(12px)", opacity: 0, transform: "scale(0.9)" },
  "20%": { filter: "blur(0)", opacity: 1, transform: "scale(1)" },
  "78%": { filter: "blur(0)", opacity: 1, transform: "scale(1.02)" },
  "100%": { filter: "blur(8px)", opacity: 0, transform: "scale(1.04)" },
});

const throb = stylex.keyframes({
  "0%, 100%": { opacity: 0.85, transform: "scale(1)" },
  "50%": { opacity: 1, transform: "scale(1.06)" },
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
  },
  vignette: {
    backgroundImage:
      "radial-gradient(120% 90% at 50% 50%, transparent 55%, rgb(255 60 70 / 0.38) 100%)",
    inset: 0,
    opacity: 0,
    pointerEvents: "none",
    position: "fixed",
    transitionDuration: "200ms",
    transitionProperty: "opacity",
  },
  top: {
    alignItems: "flex-start",
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: "1fr auto 1fr",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    justifySelf: "start",
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
  scoreBox: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    paddingTop: "0.2rem",
  },
  score: {
    animationDuration: "380ms",
    animationName: { default: pop, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(2.6rem, 12vw, 4.4rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
    textShadow: shade.large,
  },
  unit: {
    fontSize: "0.32em",
    marginInlineStart: "0.2em",
  },
  label: {
    color: ink.soft,
    fontSize: "0.72rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  stats: {
    alignItems: "center",
    borderRadius: 999,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    gap: "0.4rem",
    minHeight: "2.25rem",
    paddingInline: "0.85rem",
    pointerEvents: "auto",
    transform: { default: null, ":active": "scale(0.95)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  corner: {
    alignItems: "flex-end",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    justifySelf: "end",
  },
  buttons: {
    display: "flex",
    gap: "0.45rem",
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
  next: {
    alignItems: "center",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    paddingBlock: "0.45rem",
    paddingInline: "0.55rem",
  },
  nextName: {
    fontSize: "0.68rem",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
  },
  shout: {
    animationDuration: "1000ms",
    animationFillMode: "forwards",
    animationName: { default: shoutIn, [media.reduce]: drift },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    fontFamily: font.mincho,
    fontSize: "clamp(2rem, 10vw, 3.4rem)",
    fontWeight: 800,
    insetInline: 0,
    margin: 0,
    position: "absolute",
    textAlign: "center",
    textShadow: shade.large,
    top: "21%",
    WebkitTextStroke: "1px rgb(0 0 0 / 0.25)",
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
  banner: {
    alignItems: "center",
    animationDuration: "3s",
    animationFillMode: "forwards",
    animationName: { default: unveil, [media.reduce]: drift },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    insetInline: 0,
    margin: 0,
    position: "absolute",
    textShadow: shade.large,
    top: "max(12vh, 6.5rem)",
  },
  bannerLead: {
    color: "#ffd27a",
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "calc(0.3em * var(--track, 1))",
  },
  bannerName: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.8rem, 8vw, 2.8rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.18em * var(--track, 1))",
  },
  rule: {
    backgroundImage:
      "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.8), transparent)",
    height: 1,
    width: "min(60vw, 18rem)",
  },
  challenge: {
    animationDuration: "700ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    insetInline: 0,
    marginInline: "auto",
    maxWidth: "17rem",
    paddingBlock: "0.7rem",
    paddingInline: "1rem",
    position: "absolute",
    textAlign: "center",
    top: "max(21vh, 11rem)",
    width: "calc(100% - 7rem)",
  },
  challengeTitle: {
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    margin: 0,
  },
  bottom: {
    alignItems: "center",
    bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.6rem))",
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    insetInline: "0.75rem",
    position: "absolute",
  },
  hint: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    margin: 0,
    textAlign: "center",
    textShadow: shade.small,
  },
  hintText: {
    fontSize: "0.92rem",
    fontWeight: 600,
  },
  hintSub: {
    color: ink.soft,
    fontSize: "0.78rem",
  },
  alert: {
    animationDuration: "700ms",
    animationIterationCount: "infinite",
    animationName: { default: throb, [media.reduce]: "none" },
    backgroundColor: "rgb(255 80 90 / 0.92)",
    borderRadius: 999,
    boxShadow: "0 0 30px rgb(255 60 70 / 0.6)",
    color: "#fff",
    fontSize: "0.85rem",
    fontWeight: 800,
    letterSpacing: "calc(0.14em * var(--track, 1))",
    margin: 0,
    paddingBlock: "0.3rem",
    paddingInline: "0.9rem",
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

const Restart = () => (
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

const Bars = () => (
  <svg aria-hidden="true" height="14" viewBox="0 0 24 24" width="14">
    <path
      d="M6 20V12M12 20V5M18 20v-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="3"
    />
  </svg>
);

interface HudProps {
  lang: Lang;
  score: number;
  best: number;
  next: number;
  reached: number;
  muted: boolean;
  playing: boolean;
  tutorial: boolean;
  alert: boolean;
  shout: Shout | null;
  banner: { id: number; tier: number } | null;
  challenge: Result | null;
  vignette: RefObject<HTMLDivElement | null>;
  onLang: () => void;
  onMute: () => void;
  onRestart: () => void;
  onStats: () => void;
  opener: RefObject<HTMLButtonElement | null>;
}

export const Hud = ({
  lang,
  score,
  best,
  next,
  reached,
  muted,
  playing,
  tutorial,
  alert,
  shout,
  banner,
  challenge,
  vignette,
  onLang,
  onMute,
  onRestart,
  onStats,
  opener,
}: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  const upcoming = kindOf(next);
  return (
    <>
      <div ref={vignette} {...stylex.props(styles.vignette)} />
      <div {...stylex.props(styles.root)}>
        <div {...stylex.props(styles.top)}>
          <div {...stylex.props(styles.brand)}>
            <BackToGames label={words.back} />
            <h1 lang="ja" {...stylex.props(styles.title)}>
              <span {...stylex.props(styles.lead)}>ほしあい</span>
              星合
            </h1>
            <span aria-hidden="true" {...stylex.props(styles.seal)}>
              星
            </span>
          </div>
          <div {...stylex.props(styles.scoreBox)}>
            <p key={score} {...stylex.props(styles.score)}>
              {formatScore(score, lang)}
              <span {...stylex.props(styles.unit)}>{words.points}</span>
            </p>
            {best > 0 ? (
              <button
                aria-label={`${words.career.open}: ${words.best} ${formatScore(best, lang)}`}
                onClick={onStats}
                ref={opener}
                type="button"
                {...stylex.props(glass.surface, styles.label, styles.stats)}
              >
                <Bars />
                {words.best} {formatScore(best, lang)}
              </button>
            ) : null}
          </div>
          <div {...stylex.props(styles.corner)}>
            <div {...stylex.props(styles.buttons)}>
              <button
                aria-label={muted ? words.unmute : words.mute}
                aria-pressed={muted}
                onClick={onMute}
                type="button"
                {...stylex.props(glass.surface, styles.button)}
              >
                <Speaker muted={muted} />
              </button>
              {playing ? (
                <button
                  aria-label={words.restart}
                  onClick={onRestart}
                  type="button"
                  {...stylex.props(glass.surface, styles.button)}
                >
                  <Restart />
                </button>
              ) : null}
            </div>
            <button
              lang={other}
              onClick={onLang}
              type="button"
              {...stylex.props(glass.surface, styles.button, styles.language)}
            >
              {langNames[other]}
            </button>
            {playing ? (
              <div {...stylex.props(glass.surface, styles.next)}>
                <span {...stylex.props(styles.label)}>{words.next}</span>
                <BodyIcon size="2.4rem" tier={next} />
                <span {...stylex.props(styles.nextName)}>
                  {upcoming.name[lang]}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {shout === null ? null : (
          <p
            aria-hidden="true"
            key={shout.id}
            {...stylex.props(styles.shout, shout.gold && styles.gold)}
          >
            {shout.text}
          </p>
        )}

        {banner === null ? null : (
          <p
            aria-live="polite"
            key={banner.id}
            {...stylex.props(styles.banner)}
          >
            <span {...stylex.props(styles.bannerLead)}>{words.first}</span>
            <BodyIcon size="3.4rem" tier={banner.tier} />
            <span {...stylex.props(styles.rule)} />
            <span {...stylex.props(styles.bannerName)}>
              {kindOf(banner.tier).name[lang]}
            </span>
            <span {...stylex.props(styles.rule)} />
          </p>
        )}

        {challenge === null ? null : (
          <div {...stylex.props(glass.surface, styles.challenge)}>
            <span {...stylex.props(styles.label)}>
              {words.challenge.received}
            </span>
            <p {...stylex.props(styles.challengeTitle)}>
              {titleOf(challenge, lang)} · {scoreText(challenge.score, lang)}
            </p>
            <span {...stylex.props(styles.label)}>{words.challenge.dare}</span>
          </div>
        )}

        {playing ? (
          <div {...stylex.props(styles.bottom)}>
            {alert ? (
              <p aria-live="assertive" {...stylex.props(styles.alert)}>
                {words.danger}
              </p>
            ) : null}
            {tutorial && !alert ? (
              <p {...stylex.props(styles.hint)}>
                <span {...stylex.props(styles.hintText)}>
                  {words.hints.aim}
                </span>
                <span {...stylex.props(styles.hintSub)}>
                  {words.hints.merge}
                </span>
              </p>
            ) : null}
            <Ladder
              goal
              label={words.found(Math.max(0, reached + 1), bodies.length)}
              reached={reached}
            />
          </div>
        ) : null}
      </div>
    </>
  );
};
