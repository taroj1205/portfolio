import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { LanguageButton } from "../../_components/language-button";
import { ReportMenu } from "../../_components/report-menu";
import { Speaker } from "../../_components/speaker-mark";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { dishes } from "../_lib/dishes";
import type { DishId } from "../_lib/dishes";
import { heightAt } from "../_lib/heights";
import { cmOf, lengthText, titleOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Stage } from "../_lib/session";
import type { End } from "../_lib/stretch";

export interface Notice {
  id: number;
  text: string;
}

type Slot = RefObject<HTMLSpanElement | null>;

const GOLD = "#ffd27a";
const DANGER = "#ff6b4a";

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const pop = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(12px) scale(0.7)" },
  "14%": { opacity: 1, transform: "translateY(0) scale(1.08)" },
  "24%": { transform: "scale(1)" },
  "80%": { opacity: 1, transform: "translateY(0) scale(1)" },
  "100%": { opacity: 0, transform: "translateY(-10px) scale(0.98)" },
});

const land = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(16px) scale(0.6)" },
  "60%": { opacity: 1, transform: "translateY(0) scale(1.08)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const fade = stylex.keyframes({
  "0%": { opacity: 0 },
  "12%": { opacity: 1 },
  "85%": { opacity: 1 },
  "100%": { opacity: 0 },
});

const climb = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(14px)" },
  "30%": { opacity: 1 },
  "70%": { opacity: 1 },
  "100%": { opacity: 0, transform: "translateY(-14px)" },
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
  centre: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    insetInline: "4.5rem",
    position: "absolute",
    textAlign: "center",
    top: "max(1.1rem, calc(env(safe-area-inset-top) + 0.7rem))",
  },
  brand: {
    alignItems: "center",
    animationDuration: "700ms",
    animationName: { default: drift, [media.reduce]: "none" },
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  reading: {
    color: GOLD,
    fontSize: "0.72rem",
    letterSpacing: "0.32em",
    textShadow: shade.small,
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "clamp(2rem, 9vw, 2.8rem)",
    fontWeight: 700,
    letterSpacing: "0.08em",
    lineHeight: 1.05,
    margin: 0,
    textShadow: shade.large,
    whiteSpace: "nowrap",
  },
  today: {
    alignItems: "center",
    borderRadius: 999,
    display: "flex",
    fontSize: "0.8rem",
    gap: "0.5rem",
    letterSpacing: "calc(0.08em * var(--track, 1))",
    marginTop: "0.45rem",
    paddingBlock: "0.35rem",
    paddingInline: "0.9rem",
  },
  todayDish: {
    color: GOLD,
    fontWeight: 800,
  },
  dial: {
    alignItems: "center",
    animationDuration: "500ms",
    animationName: { default: drift, [media.reduce]: "none" },
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  length: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(2.8rem, 13vw, 4.4rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
    textShadow: shade.large,
    whiteSpace: "nowrap",
  },
  unit: {
    fontSize: "0.4em",
    marginInlineStart: "0.15em",
  },
  next: {
    color: ink.soft,
    fontSize: "0.8rem",
    letterSpacing: "calc(0.08em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  shout: {
    alignItems: "center",
    animationDuration: "2.2s",
    animationFillMode: "forwards",
    animationName: { default: pop, [media.reduce]: fade },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    insetInline: "1rem",
    margin: 0,
    position: "absolute",
    textAlign: "center",
    textShadow: shade.large,
    top: "34%",
  },
  finale: {
    alignItems: "center",
    animationDuration: "700ms",
    animationFillMode: "both",
    animationName: { default: land, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    insetInline: "1rem",
    margin: 0,
    position: "absolute",
    textAlign: "center",
    textShadow: shade.large,
    top: "58%",
  },
  finaleWord: {
    fontFamily: font.mincho,
    fontSize: "clamp(2.2rem, 11vw, 3.4rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
  },
  finaleNote: {
    color: GOLD,
    fontSize: "0.95rem",
    fontWeight: 700,
    letterSpacing: "calc(0.1em * var(--track, 1))",
  },
  shoutEmoji: {
    fontSize: "2.4rem",
    lineHeight: 1,
  },
  shoutName: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "clamp(1.7rem, 8vw, 2.6rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
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
    alignItems: "center",
    animationDuration: "900ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    margin: 0,
    maxWidth: "24rem",
  },
  ruleLead: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.2rem, 5.4vw, 1.6rem)",
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
    gap: "0.7rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
    marginTop: "0.35rem",
    textShadow: shade.small,
  },
  swipe: {
    borderColor: GOLD,
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 0 18px rgb(255 190 100 / 0.6)",
    height: "2.2rem",
    overflow: "hidden",
    position: "relative",
    width: "1.4rem",
  },
  swipeDot: {
    animationDuration: "1.5s",
    animationIterationCount: "infinite",
    animationName: { default: climb, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    backgroundColor: GOLD,
    borderRadius: 999,
    height: "0.5rem",
    left: "50%",
    marginLeft: "-0.25rem",
    position: "absolute",
    top: "0.75rem",
    width: "0.5rem",
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
  label: {
    color: ink.soft,
    fontSize: "0.72rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  challenge: {
    animationDuration: "700ms",
    animationName: { default: drift, [media.reduce]: "none" },
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
  feel: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    marginTop: "0.35rem",
    textShadow: shade.small,
    transitionDuration: "150ms",
    transitionProperty: "color",
  },
  track: {
    backgroundImage: `linear-gradient(90deg, rgb(255 255 255 / 0.16) 0%, rgb(255 255 255 / 0.22) 47.5%, ${GOLD} 48%, #ffe9a8 66.4%, ${DANGER} 67%, #c8352b 100%)`,
    borderRadius: 999,
    boxShadow:
      "0 0 0 1px rgb(255 255 255 / 0.18), 0 4px 16px rgb(0 0 0 / 0.35)",
    height: 12,
    position: "relative",
    width: "min(15rem, 62vw)",
  },
  needle: {
    backgroundColor: "#fffaf3",
    borderRadius: 999,
    boxShadow: "0 0 10px rgb(255 255 255 / 0.9)",
    height: 22,
    left: 0,
    marginLeft: -3,
    position: "absolute",
    top: -5,
    width: 6,
  },
  stats: {
    alignItems: "center",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
    maxWidth: "21rem",
    width: "100%",
  },
  stat: {
    alignItems: "center",
    display: "flex",
    gap: "0.45rem",
  },
  heatTrack: {
    backgroundColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 999,
    height: 5,
    overflow: "hidden",
    width: "min(30vw, 7rem)",
  },
  heatFill: {
    backgroundImage: "linear-gradient(90deg, #ffb14a, #ff6b4a)",
    borderRadius: 999,
    display: "block",
    height: "100%",
    transformOrigin: "left",
    width: "100%",
  },
  strands: {
    display: "flex",
    gap: 4,
  },
  strand: {
    backgroundColor: GOLD,
    borderRadius: 999,
    boxShadow: "0 0 6px rgb(255 210 122 / 0.7)",
    height: 14,
    transitionDuration: "300ms",
    transitionProperty: "opacity, transform",
    width: 4,
  },
  strandGone: {
    boxShadow: "none",
    opacity: 0.2,
    transform: "scaleY(0.5)",
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

interface HudProps {
  lang: Lang;
  stage: Stage;
  dish: DishId | null;
  end: End | null;
  best: number;
  muted: boolean;
  challenge: Result | null;
  shout: { id: number; index: number } | null;
  notice: Notice | null;
  alive: number;
  strands: number;
  value: Slot;
  unit: Slot;
  next: Slot;
  needle: Slot;
  feel: Slot;
  heat: Slot;
  onLang: () => void;
  onMute: (muted: boolean) => void;
}

const Idle = ({
  lang,
  best,
  challenge,
}: {
  lang: Lang;
  best: number;
  challenge: Result | null;
}) => {
  const words = copy[lang];

  return (
    <>
      {challenge === null ? null : (
        <div {...stylex.props(glass.surface, styles.challenge)}>
          <span {...stylex.props(styles.label)}>
            {words.challenge.received}
          </span>
          <p {...stylex.props(styles.challengeTitle)}>
            {lengthText(cmOf(challenge), lang)} · {titleOf(challenge, lang)}
          </p>
          <span {...stylex.props(styles.label)}>{words.challenge.dare}</span>
        </div>
      )}
      <p {...stylex.props(styles.rule)}>
        <span {...stylex.props(styles.ruleLead)}>{words.rule.lead}</span>
        <span {...stylex.props(styles.ruleBody)}>{words.rule.body}</span>
        <span {...stylex.props(styles.start)}>
          <span aria-hidden="true" {...stylex.props(styles.swipe)}>
            <span {...stylex.props(styles.swipeDot)} />
          </span>
          {words.rule.start}
        </span>
      </p>
      <p {...stylex.props(styles.keys)}>{words.rule.keys}</p>
      {best > 0 ? (
        <p {...stylex.props(styles.label)}>
          {words.best(lengthText(best / 10, lang))}
        </p>
      ) : null}
    </>
  );
};

const Gauge = ({
  lang,
  alive,
  strands,
  heat,
}: {
  lang: Lang;
  alive: number;
  strands: number;
  heat: Slot;
}) => {
  const words = copy[lang];

  return (
    <div {...stylex.props(styles.stats)}>
      <span {...stylex.props(styles.stat)}>
        <span {...stylex.props(styles.label)}>{words.heat}</span>
        <span {...stylex.props(styles.heatTrack)}>
          <span ref={heat} {...stylex.props(styles.heatFill)} />
        </span>
      </span>
      <span {...stylex.props(styles.stat)}>
        <span {...stylex.props(styles.label)}>{words.strands}</span>
        <span aria-hidden="true" {...stylex.props(styles.strands)}>
          {Array.from({ length: strands }, (_, i) => (
            <span
              key={i}
              {...stylex.props(styles.strand, i >= alive && styles.strandGone)}
            />
          ))}
        </span>
        <span {...stylex.props(styles.label)}>
          {alive}/{strands}
        </span>
      </span>
    </div>
  );
};

export const Hud = ({
  lang,
  stage,
  dish,
  end,
  best,
  muted,
  challenge,
  shout,
  notice,
  alive,
  strands,
  value,
  unit,
  next,
  needle,
  feel,
  heat,
  onLang,
  onMute,
}: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  const playing = stage === "pulling" || stage === "ending";
  const reached = shout === null ? null : heightAt(shout.index);

  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.top)}>
        <BackToGames label={words.back} />
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
            <LanguageButton
              lang={other}
              onClick={onLang}
              xstyle={styles.button}
            />
          )}
          <ReportMenu iconOnly lang={lang} xstyle={styles.button} />
        </div>
      </div>

      <div {...stylex.props(styles.centre)}>
        {playing ? (
          <div {...stylex.props(styles.dial)}>
            <p {...stylex.props(styles.length)}>
              <span ref={value}>3.0</span>
              <span ref={unit} {...stylex.props(styles.unit)}>
                cm
              </span>
            </p>
            <p {...stylex.props(styles.next)}>
              <span ref={next} />
            </p>
            <span ref={feel} {...stylex.props(styles.feel)}>
              {words.feel.slack}
            </span>
            <div aria-hidden="true" {...stylex.props(styles.track)}>
              <span ref={needle} {...stylex.props(styles.needle)} />
            </div>
          </div>
        ) : (
          <div {...stylex.props(styles.brand)}>
            <span lang="ja" {...stylex.props(styles.reading)}>
              {copy.ja.reading}
            </span>
            <h1 lang="ja" {...stylex.props(styles.title)}>
              {copy.ja.name}
            </h1>
            {dish === null ? null : (
              <span {...stylex.props(glass.surface, styles.today)}>
                {challenge === null ? words.today : words.dish}
                <span {...stylex.props(styles.todayDish)}>
                  {dishes[dish].name[lang]}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {stage === "ending" && end !== null ? (
        <p aria-live="polite" {...stylex.props(styles.finale)}>
          <span {...stylex.props(styles.finaleWord)}>{words.shout[end]}</span>
          <span {...stylex.props(styles.finaleNote)}>
            {words.result.ends[end]}
          </span>
        </p>
      ) : null}

      {reached === null || shout === null || stage !== "pulling" ? null : (
        <p aria-live="polite" key={shout.id} {...stylex.props(styles.shout)}>
          <span aria-hidden="true" {...stylex.props(styles.shoutEmoji)}>
            {reached.emoji}
          </span>
          <span {...stylex.props(styles.shoutName)}>{reached.title[lang]}</span>
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
          <Idle best={best} challenge={challenge} lang={lang} />
        ) : null}
        {playing ? (
          <Gauge alive={alive} heat={heat} lang={lang} strands={strands} />
        ) : null}
      </div>
    </div>
  );
};
