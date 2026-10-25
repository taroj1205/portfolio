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
import { heightText, titleOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import { syrupIds } from "../_lib/syrups";

const GOLD = "#ffd27a";
const SKY = "#9fe6ff";

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const press = stylex.keyframes({
  "0%, 100%": { transform: "scale(1)" },
  "45%": { transform: "scale(0.82)" },
});

const styles = stylex.create({
  top: {
    alignItems: "flex-start",
    columnGap: "0.25rem",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: "0.5rem",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "0.6rem",
  },
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.1rem",
    fontWeight: 700,
    gap: "0.35rem",
    letterSpacing: "0.06em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    whiteSpace: "nowrap",
  },
  reading: {
    color: SKY,
    fontSize: "0.42em",
    letterSpacing: "0.14em",
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
    gap: "0.6rem",
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
  dot: {
    animationDuration: "1.4s",
    animationIterationCount: "infinite",
    animationName: { default: press, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.45, 0, 0.55, 1)",
    backgroundColor: "rgb(255 255 255 / 0.85)",
    borderRadius: 999,
    boxShadow: `0 0 18px ${SKY}`,
    height: "1.4rem",
    width: "1.4rem",
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
    paddingBlock: "0.6rem",
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
    alignItems: "center",
    display: "grid",
    gap: "0.9rem",
    gridTemplateColumns: "1fr auto",
    marginInline: "auto",
    maxWidth: "26rem",
    width: "100%",
  },
  gauges: {
    display: "grid",
    gap: "0.45rem",
    minWidth: 0,
  },
  height: {
    alignItems: "baseline",
    display: "flex",
    gap: "0.6rem",
  },
  gaugeLabel: {
    color: ink.soft,
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    textShadow: shade.small,
  },
  count: {
    fontFamily: font.mincho,
    fontSize: "2rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    textShadow: shade.small,
  },
  ice: {
    alignItems: "center",
    display: "grid",
    gap: "0.6rem",
    gridTemplateColumns: "auto 1fr",
  },
  track: {
    backgroundColor: "rgb(255 255 255 / 0.18)",
    borderRadius: 999,
    height: 8,
    overflow: "hidden",
  },
  fill: {
    backgroundImage: "linear-gradient(90deg, #6fc4ff, #e8f8ff)",
    borderRadius: 999,
    height: "100%",
    transform: "scaleX(1)",
    transformOrigin: "left center",
    width: "100%",
  },
  serve: {
    alignItems: "center",
    backgroundImage: "linear-gradient(180deg, #fff3f6, #ffc2cf 55%, #f2577a)",
    borderRadius: 999,
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(242 87 122 / 0.35)",
    color: "#3a0d18",
    cursor: "pointer",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "1rem",
    fontWeight: 700,
    justifyContent: "center",
    letterSpacing: "calc(0.08em * var(--track, 1))",
    minHeight: "3.4rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingInline: "1.2rem",
    transform: { default: null, ":active": "scale(0.96)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    whiteSpace: "nowrap",
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
  height: RefObject<HTMLSpanElement | null>;
  ice: RefObject<HTMLDivElement | null>;
  onServe: () => void;
}

export const Meter = ({ lang, height, ice, onServe }: MeterProps) => {
  const words = copy[lang].meter;

  return (
    <div {...stylex.props(styles.prompt)}>
      <div {...stylex.props(styles.meter)}>
        <div {...stylex.props(styles.gauges)}>
          <div {...stylex.props(styles.height)}>
            <span {...stylex.props(styles.gaugeLabel)}>{words.height}</span>
            <span ref={height} {...stylex.props(styles.count)}>
              {heightText(0)}
            </span>
          </div>
          <div {...stylex.props(styles.ice)}>
            <span {...stylex.props(styles.gaugeLabel)}>{words.ice}</span>
            <div {...stylex.props(styles.track)}>
              <div ref={ice} {...stylex.props(styles.fill)} />
            </div>
          </div>
        </div>
        <button onClick={onServe} type="button" {...stylex.props(styles.serve)}>
          {words.serve}
        </button>
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

  return (
    <div {...stylex.props(glass.surface, styles.challenge)}>
      <span {...stylex.props(styles.label)}>{words.challenge.received}</span>
      <p {...stylex.props(styles.challengeTitle)}>{titleOf(challenge, lang)}</p>
      <span {...stylex.props(styles.label)}>{words.challenge.dare}</span>
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
          <span aria-hidden="true" {...stylex.props(styles.dot)} />
          {words.rule.start}
        </span>
      </p>
      {runs === 0 ? null : (
        <p {...stylex.props(styles.stats)}>
          {`${words.best(heightText(best))} · ${words.found(found, syrupIds.length)}`}
        </p>
      )}
    </div>
  );
};
