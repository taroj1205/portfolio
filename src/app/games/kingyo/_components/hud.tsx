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
import { kindIds } from "../_lib/fish";
import { countOf, countText, rankOf } from "../_lib/result";
import type { Result } from "../_lib/result";

const GOLD = "#ffd27a";
const PINK = "#ff8ab6";

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const ripple = stylex.keyframes({
  "0%": { opacity: 0.9, transform: "scale(0.6)" },
  "100%": { opacity: 0, transform: "scale(1.9)" },
});

const styles = stylex.create({
  top: {
    alignItems: "flex-start",
    display: "flex",
    columnGap: "0.25rem",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: "0.5rem",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
  },
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.3rem",
    fontWeight: 700,
    gap: "0.35rem",
    letterSpacing: "0.08em",
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
    marginInlineStart: "auto",
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
  prompt: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    gap: "0.7rem",
    marginInline: "auto",
    maxWidth: "28rem",
    minHeight: "8.5rem",
    textAlign: "center",
    width: "100%",
  },
  rule: {
    alignItems: "center",
    animationDuration: "900ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    margin: 0,
  },
  lead: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.1rem, 4.8vw, 1.4rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    textShadow: shade.large,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  body: {
    color: ink.soft,
    fontSize: "0.86rem",
    lineHeight: 1.6,
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
    marginTop: "0.2rem",
    textShadow: shade.small,
  },
  ring: {
    borderColor: PINK,
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 0 18px rgb(246 179 196 / 0.6)",
    height: "1.5rem",
    position: "relative",
    width: "1.5rem",
  },
  wave: {
    animationDuration: "2.2s",
    animationIterationCount: "infinite",
    animationName: { default: ripple, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    borderColor: PINK,
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    inset: -2,
    opacity: 0,
    position: "absolute",
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
    animationDuration: "700ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    borderRadius: 18,
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    maxWidth: "19rem",
    paddingBlock: "0.65rem",
    paddingInline: "1.1rem",
    width: "100%",
  },
  label: {
    color: ink.soft,
    fontSize: "0.72rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  challengeTitle: {
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    margin: 0,
  },
  meter: {
    display: "grid",
    gap: "0.55rem",
    marginInline: "auto",
    maxWidth: "20rem",
    width: "100%",
  },
  gauge: {
    alignItems: "center",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "4.4rem 1fr 3rem",
  },
  gaugeLabel: {
    color: ink.soft,
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    textAlign: "start",
    textShadow: shade.small,
  },
  track: {
    backgroundColor: "rgb(255 255 255 / 0.12)",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 999,
    height: "100%",
    transform: "scaleX(0)",
    transformOrigin: "left center",
    width: "100%",
  },
  paper: {
    backgroundImage: "linear-gradient(90deg, #e5384b, #ffcf6a 40%, #fffaf0)",
    transform: "scaleX(1)",
  },
  count: {
    fontFamily: font.mincho,
    fontSize: "1.25rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    gridColumn: "2 / 4",
    textAlign: "start",
    textShadow: shade.small,
  },
});

interface HudProps {
  lang: Lang;
  playing: boolean;
  muted: boolean;
  onLang: () => void;
  onMute: (muted: boolean) => void;
}

export const Hud = ({ lang, playing, muted, onLang, onMute }: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  return (
    <header {...stylex.props(styles.top)}>
      <div {...stylex.props(styles.brand)}>
        <BackToGames label={words.back} />
        <h1 lang="ja" {...stylex.props(styles.title)}>
          <span {...stylex.props(styles.reading)}>{copy.ja.reading}</span>
          {copy.ja.name}
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
        {playing ? null : (
          <LanguageButton
            lang={other}
            onClick={onLang}
            xstyle={styles.button}
          />
        )}
        <ReportMenu iconOnly lang={lang} xstyle={styles.button} />
      </div>
    </header>
  );
};

interface MeterProps {
  lang: Lang;
  caught: RefObject<HTMLSpanElement | null>;
  paper: RefObject<HTMLDivElement | null>;
}

export const Meter = ({ lang, caught, paper }: MeterProps) => {
  const words = copy[lang].meter;
  return (
    <div {...stylex.props(styles.prompt)}>
      <div {...stylex.props(styles.meter)}>
        <div {...stylex.props(styles.gauge)}>
          <span {...stylex.props(styles.gaugeLabel)}>{words.caught}</span>
          <span ref={caught} {...stylex.props(styles.count)}>
            {countText(0, lang)}
          </span>
        </div>
        <div {...stylex.props(styles.gauge)}>
          <span {...stylex.props(styles.gaugeLabel)}>{words.paper}</span>
          <div {...stylex.props(styles.track)}>
            <div ref={paper} {...stylex.props(styles.fill, styles.paper)} />
          </div>
          <span aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};

const ChallengeCard = ({
  lang,
  challenge,
}: {
  lang: Lang;
  challenge: Result;
}) => {
  const words = copy[lang];
  const count = countOf(challenge);
  return (
    <div {...stylex.props(glass.surface, styles.challenge)}>
      <span {...stylex.props(styles.label)}>{words.challenge.received}</span>
      <p {...stylex.props(styles.challengeTitle)}>
        {`${countText(count, lang)} · ${rankOf(count).name[lang]}`}
      </p>
      <span {...stylex.props(styles.label)}>
        {count === 0 ? words.challenge.beat : words.challenge.dare}
      </span>
    </div>
  );
};

interface PromptProps {
  lang: Lang;
  challenge: Result | null;
  best: number;
  found: number;
  runs: number;
}

export const Prompt = ({ lang, challenge, best, found, runs }: PromptProps) => {
  const words = copy[lang];
  return (
    <div {...stylex.props(styles.prompt)}>
      {challenge === null ? null : (
        <ChallengeCard challenge={challenge} lang={lang} />
      )}
      <p {...stylex.props(styles.rule)}>
        <span {...stylex.props(styles.lead)}>{words.rule.lead}</span>
        <span {...stylex.props(styles.body)}>{words.rule.body}</span>
        <span {...stylex.props(styles.start)}>
          <span aria-hidden="true" {...stylex.props(styles.ring)}>
            <span {...stylex.props(styles.wave)} />
          </span>
          {words.rule.start}
        </span>
      </p>
      {runs === 0 ? null : (
        <p {...stylex.props(styles.stats)}>
          {`${words.best(countText(best, lang))} · ${words.found(found, kindIds.length)}`}
        </p>
      )}
    </div>
  );
};
