import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import type { Design } from "../_lib/eraser";
import { pointsText, rankOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import { frameSlots, framesOf, scoreOf, stateOf } from "../_lib/score";
import type { Call } from "../_lib/session";
import { EraserPicture } from "./eraser-picture";

const GOLD = "#ffd27a";
const PAPER = "#f6efdf";
const PENCIL = "#2c2a30";
const RED = "#c23b32";

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const ripple = stylex.keyframes({
  "0%": { opacity: 0.9, transform: "scale(0.6)" },
  "100%": { opacity: 0, transform: "scale(1.9)" },
});

const stamp = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(1.6) rotate(-6deg)" },
  "14%": { opacity: 1, transform: "scale(0.94) rotate(-3deg)" },
  "22%": { transform: "scale(1.02) rotate(-3deg)" },
  "30%, 78%": { opacity: 1, transform: "scale(1) rotate(-3deg)" },
  "100%": { opacity: 0, transform: "scale(1) rotate(-3deg) translateY(-14px)" },
});

const fadeAway = stylex.keyframes({
  "0%, 70%": { opacity: 1 },
  "100%": { opacity: 0 },
});

const styles = stylex.create({
  top: {
    alignItems: "flex-start",
    display: "flex",
    gap: "0.5rem",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    pointerEvents: "auto",
  },
  title: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "1.65rem",
    fontWeight: 700,
    gap: "0.5rem",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    whiteSpace: "nowrap",
  },
  reading: {
    color: GOLD,
    fontSize: "0.42em",
    letterSpacing: "0.16em",
  },
  corner: {
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
    outlineColor: GOLD,
    outlineOffset: 3,
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
  sheet: {
    listStyle: "none",
    marginBlock: 0,
    padding: 0,
    backgroundColor: PAPER,
    backgroundImage:
      "linear-gradient(180deg, rgb(255 255 255 / 0.5), rgb(255 255 255 / 0) 40%), repeating-linear-gradient(90deg, rgb(120 90 60 / 0.035) 0 1px, transparent 1px 3px)",
    borderRadius: 6,
    boxShadow:
      "0 1px 0 rgb(255 255 255 / 0.7) inset, 0 10px 24px rgb(20 10 4 / 0.38), 0 2px 4px rgb(20 10 4 / 0.3)",
    color: PENCIL,
    display: "grid",
    gridTemplateColumns: "repeat(9, minmax(0, 1fr)) minmax(0, 1.45fr)",
    marginInline: "auto",
    maxWidth: "34rem",
    overflow: "hidden",
    rotate: "-0.4deg",
    width: "100%",
  },
  reader: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  frame: {
    position: "relative",
    borderColor: "rgb(60 40 30 / 0.28)",
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    display: "grid",
    gridTemplateRows: "auto 1fr",
    minWidth: 0,
    transitionDuration: "300ms",
    transitionProperty: "background-color",
  },
  frameLast: {
    borderInlineEndWidth: 0,
  },
  frameNow: {
    backgroundColor: "rgb(255 214 110 / 0.45)",
  },
  number: {
    borderBottomColor: "rgb(60 40 30 / 0.28)",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: "rgb(60 40 30 / 0.55)",
    fontSize: "0.56rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1.5,
    textAlign: "center",
  },
  boxes: {
    display: "flex",
    justifyContent: "flex-end",
  },
  box: {
    alignItems: "center",
    borderBottomColor: "rgb(60 40 30 / 0.22)",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    borderInlineStartColor: "rgb(60 40 30 / 0.22)",
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    display: "flex",
    flexBasis: "1.15rem",
    flexShrink: 1,
    fontFamily: font.mincho,
    fontSize: "0.74rem",
    fontWeight: 700,
    height: "1.15rem",
    justifyContent: "center",
    lineHeight: 1,
    minWidth: 0,
  },
  boxFirst: {
    borderInlineStartWidth: 0,
  },
  mark: {
    color: RED,
  },
  running: {
    fontFamily: font.mincho,
    fontSize: "0.86rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    paddingBlock: "0.28rem 0.32rem",
    textAlign: "center",
  },
  prompt: {
    alignItems: "center",
    animationDuration: "800ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.65rem",
    marginInline: "auto",
    maxWidth: "26rem",
    textAlign: "center",
    width: "100%",
  },
  rule: {
    alignItems: "center",
    borderRadius: 22,
    paddingBlock: "0.85rem",
    paddingInline: "1.2rem",
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    margin: 0,
  },
  lead: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.15rem, 5vw, 1.45rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    textShadow: shade.large,
  },
  body: {
    color: ink.soft,
    fontSize: "0.84rem",
    lineHeight: 1.6,
    textShadow: shade.small,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  start: {
    alignItems: "center",
    display: "flex",
    fontSize: "0.92rem",
    fontWeight: 700,
    gap: "0.7rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
    marginTop: "0.15rem",
    textShadow: shade.small,
  },
  ring: {
    borderColor: GOLD,
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 0 18px rgb(255 210 122 / 0.55)",
    height: "1.4rem",
    position: "relative",
    width: "1.4rem",
  },
  wave: {
    animationDuration: "2.2s",
    animationIterationCount: "infinite",
    animationName: { default: ripple, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    borderColor: GOLD,
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    inset: -2,
    opacity: 0,
    position: "absolute",
  },
  row: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "center",
  },
  workshop: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "0.92rem",
    fontWeight: 700,
    gap: "0.55rem",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    minHeight: "2.75rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingBlock: "0.3rem",
    paddingInline: "0.5rem 1rem",
    pointerEvents: "auto",
    transform: { default: null, ":active": "scale(0.96)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  thumb: {
    display: "block",
    height: "2rem",
    width: "2.6rem",
  },
  stats: {
    color: ink.soft,
    fontSize: "0.74rem",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  challenge: {
    alignItems: "center",
    borderBottomColor: "rgb(255 255 255 / 0.14)",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    gap: "0.8rem",
    marginBottom: "0.35rem",
    maxWidth: "19rem",
    paddingBottom: "0.7rem",
    pointerEvents: "auto",
    textAlign: "start",
    width: "100%",
  },
  challengeText: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    gap: "0.1rem",
    minWidth: 0,
  },
  label: {
    color: ink.soft,
    fontSize: "0.7rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  challengeTitle: {
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    margin: 0,
  },
  borrow: {
    backgroundColor: "rgb(255 255 255 / 0.1)",
    borderColor: "rgb(255 255 255 / 0.22)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: ink.text,
    cursor: { default: "pointer", ":disabled": "default" },
    fontFamily: "inherit",
    fontSize: "0.72rem",
    fontWeight: 700,
    marginTop: "0.3rem",
    opacity: { default: 1, ":disabled": 0.6 },
    outlineColor: GOLD,
    outlineOffset: 2,
    paddingBlock: "0.35rem",
    paddingInline: "0.75rem",
    width: "fit-content",
  },
  challengeThumb: {
    flexShrink: 0,
    height: "3rem",
    width: "3.6rem",
  },
  call: {
    alignItems: "center",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    pointerEvents: "none",
    position: "fixed",
  },
  callText: {
    animationDuration: "1.5s",
    animationFillMode: "forwards",
    animationName: { default: stamp, [media.reduce]: fadeAway },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    color: ink.text,
    fontFamily: font.mincho,
    fontSize: "clamp(2.4rem, 12vw, 4.4rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    margin: 0,
    opacity: 0,
    textShadow:
      "0 2px 0 rgb(60 20 10 / 0.6), 0 6px 30px rgb(0 0 0 / 0.55), 0 0 60px rgb(255 160 80 / 0.4)",
    whiteSpace: "nowrap",
  },
  callBig: {
    backgroundClip: "text",
    backgroundImage: `linear-gradient(180deg, #fff6d6, ${GOLD} 55%, #e0902a)`,
    color: "transparent",
    filter:
      "drop-shadow(0 2px 0 rgb(80 30 6 / 0.85)) drop-shadow(0 8px 22px rgb(0 0 0 / 0.55))",
    textShadow: "none",
    WebkitBackgroundClip: "text",
  },
  callSmall: {
    fontSize: "clamp(1.6rem, 8vw, 2.6rem)",
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
  muted: boolean;
  playing: boolean;
  onLang: () => void;
  onMute: (muted: boolean) => void;
  onQuit: () => void;
}

export const Hud = ({
  lang,
  muted,
  playing,
  onLang,
  onMute,
  onQuit,
}: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  return (
    <header {...stylex.props(styles.top)}>
      <div {...stylex.props(styles.brand)}>
        <BackToGames label={words.back} />
        <h1 {...stylex.props(styles.title)}>
          <span lang="ja">消しボウ</span>
          <span {...stylex.props(styles.reading)}>{copy.ja.reading}</span>
        </h1>
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
        {playing ? (
          <button
            onClick={onQuit}
            type="button"
            {...stylex.props(glass.surface, styles.button, styles.language)}
          >
            {words.quit}
          </button>
        ) : (
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
    </header>
  );
};

export const ScoreSheet = ({
  lang,
  rolls,
}: {
  lang: Lang;
  rolls: number[];
}) => {
  const words = copy[lang];
  const frames = framesOf(rolls);
  const state = stateOf(rolls);
  return (
    <ol aria-label={words.sheet} {...stylex.props(styles.sheet)}>
      {frameSlots.map(({ index, last, boxes }) => {
        const frame = frames.at(index);
        const marks = frame?.marks ?? [];
        const now = !state.over && state.frame === index;
        return (
          <li
            aria-current={now ? "step" : undefined}
            key={index}
            {...stylex.props(
              styles.frame,
              last && styles.frameLast,
              now && styles.frameNow
            )}
          >
            <span {...stylex.props(styles.reader)}>
              {`${words.frame(index + 1)} ${marks.filter(Boolean).join(" ")} ${frame?.total ?? ""}`}
            </span>
            <span aria-hidden="true" {...stylex.props(styles.number)}>
              {index + 1}
            </span>
            <span aria-hidden="true">
              <span {...stylex.props(styles.boxes)}>
                {boxes.map((box) => {
                  const mark = marks.at(box) ?? "";
                  return (
                    <span
                      key={box}
                      {...stylex.props(
                        styles.box,
                        box === 0 && styles.boxFirst,
                        (mark === "X" || mark === "/") && styles.mark
                      )}
                    >
                      {mark}
                    </span>
                  );
                })}
              </span>
              <span {...stylex.props(styles.running)}>
                {frame?.total ?? " "}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const ChallengeCard = ({
  lang,
  challenge,
  borrowed,
  onBorrow,
}: {
  lang: Lang;
  challenge: Result;
  borrowed: boolean;
  onBorrow: () => void;
}) => {
  const words = copy[lang];
  const score = scoreOf(challenge.rolls);
  return (
    <div {...stylex.props(styles.challenge)}>
      <span {...stylex.props(styles.challengeThumb)}>
        <EraserPicture design={challenge.design} />
      </span>
      <span {...stylex.props(styles.challengeText)}>
        <span {...stylex.props(styles.label)}>{words.challenge.received}</span>
        <p {...stylex.props(styles.challengeTitle)}>
          {`${pointsText(score, lang)} · ${rankOf(score).name[lang]}`}
        </p>
        <span {...stylex.props(styles.label)}>
          {words.challenge.dare(score)}
        </span>
        <button
          disabled={borrowed}
          onClick={onBorrow}
          type="button"
          {...stylex.props(styles.borrow)}
        >
          {borrowed ? words.challenge.borrowed : words.challenge.borrow}
        </button>
      </span>
    </div>
  );
};

interface PromptProps {
  lang: Lang;
  design: Design;
  challenge: Result | null;
  borrowed: boolean;
  best: number;
  runs: number;
  opener: RefObject<HTMLButtonElement | null>;
  onWorkshop: () => void;
  onBorrow: () => void;
}

export const Prompt = ({
  lang,
  design,
  challenge,
  borrowed,
  best,
  runs,
  opener,
  onWorkshop,
  onBorrow,
}: PromptProps) => {
  const words = copy[lang];
  return (
    <div {...stylex.props(styles.prompt)}>
      <div {...stylex.props(glass.surface, styles.rule)}>
        {challenge === null ? null : (
          <ChallengeCard
            borrowed={borrowed}
            challenge={challenge}
            lang={lang}
            onBorrow={onBorrow}
          />
        )}
        <span {...stylex.props(styles.lead)}>{words.rule.lead}</span>
        {challenge === null ? (
          <span {...stylex.props(styles.body)}>{words.rule.body}</span>
        ) : null}
        <span {...stylex.props(styles.start)}>
          <span aria-hidden="true" {...stylex.props(styles.ring)}>
            <span {...stylex.props(styles.wave)} />
          </span>
          {words.rule.start}
        </span>
        {runs === 0 ? null : (
          <p {...stylex.props(styles.stats)}>
            {`${words.best(best)} · ${words.runs(runs)}`}
          </p>
        )}
      </div>
      <div {...stylex.props(styles.row)}>
        <button
          onClick={onWorkshop}
          ref={opener}
          type="button"
          {...stylex.props(glass.surface, styles.workshop)}
        >
          <span {...stylex.props(styles.thumb)}>
            <EraserPicture design={design} />
          </span>
          {words.workshop.open}
        </button>
      </div>
    </div>
  );
};

export const Callout = ({ lang, call }: { lang: Lang; call: Call | null }) => (
  <div aria-live="polite" {...stylex.props(styles.call)}>
    {call === null ? null : (
      <p
        key={call.id}
        {...stylex.props(
          styles.callText,
          (call.kind === "strike" || call.kind === "spare") && styles.callBig,
          call.kind === "count" && styles.callSmall
        )}
      >
        {copy[lang].call(call)}
      </p>
    )}
  </div>
);
