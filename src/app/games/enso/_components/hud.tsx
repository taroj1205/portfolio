import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { LanguageButton } from "../../_components/language-button";
import { ReportMenu } from "../../_components/report-menu";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { formatScore, rankOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import { inkSvg, paperSvg } from "./ink-svg";

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const nudge = stylex.keyframes({
  "0%, 100%": { transform: "translateX(0)" },
  "20%": { transform: "translateX(-6px)" },
  "45%": { transform: "translateX(5px)" },
  "70%": { transform: "translateX(-3px)" },
});

const styles = stylex.create({
  top: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "space-between",
    position: "relative",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "0.7rem",
  },
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.35rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    whiteSpace: "nowrap",
  },
  lead: {
    color: "#ffd27a",
    fontSize: "0.42em",
    letterSpacing: "0.36em",
    marginBlockEnd: "0.35em",
  },
  stats: {
    alignItems: "baseline",
    display: "flex",
    gap: "0.6rem",
    flexBasis: "100%",
    justifyContent: "center",
    order: 1,
    margin: 0,
    textAlign: "center",
    textShadow: shade.small,
  },
  best: {
    fontFamily: font.mincho,
    fontSize: "1.25rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1.1,
  },
  label: {
    color: ink.soft,
    fontSize: "0.7rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
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
    outlineColor: "#ffd27a",
    outlineOffset: 3,
    padding: 0,
    transform: { default: null, ":active": "scale(0.92)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    width: "2.75rem",
  },
  prompt: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    minHeight: "4.5rem",
    transitionDuration: "240ms",
    transitionProperty: "opacity",
  },
  hidden: {
    opacity: 0,
  },
  hint: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    margin: 0,
    textAlign: "center",
    textShadow: shade.small,
  },
  hintTitle: {
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    fontWeight: 700,
  },
  miss: {
    animationDuration: "420ms",
    animationName: { default: nudge, [media.reduce]: "none" },
    color: "#ffd27a",
  },
  hintSub: {
    color: ink.soft,
    fontSize: "0.8rem",
  },
  challenge: {
    alignItems: "center",
    animationDuration: "700ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    borderRadius: 18,
    display: "flex",
    gap: "0.8rem",
    paddingBlock: "0.55rem",
    paddingInline: "0.6rem 1rem",
  },
  thumb: {
    borderRadius: 6,
    display: "block",
    flexShrink: 0,
    height: "3.4rem",
    width: "3.4rem",
  },
  challengeText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
    margin: 0,
  },
  challengeScore: {
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
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
  best: number;
  draws: number;
  muted: boolean;
  onLang: () => void;
  onMute: (muted: boolean) => void;
}

export const Hud = ({ lang, best, draws, muted, onLang, onMute }: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  return (
    <header {...stylex.props(styles.top)}>
      <div {...stylex.props(styles.brand)}>
        <BackToGames label={words.back} />
        <h1 lang="ja" {...stylex.props(styles.title)}>
          <span {...stylex.props(styles.lead)}>ひとふでのつき</span>
          {copy.ja.name}
        </h1>
      </div>
      {draws > 0 ? (
        <p {...stylex.props(styles.stats)}>
          <span {...stylex.props(styles.label)}>{words.best}</span>
          <span {...stylex.props(styles.best)}>{formatScore(best)}</span>
          <span {...stylex.props(styles.label)}>{words.draws(draws)}</span>
        </p>
      ) : null}
      <div {...stylex.props(styles.corner)}>
        <Toggle
          aria-label={words.mute}
          onPressedChange={onMute}
          pressed={muted}
          {...stylex.props(glass.surface, styles.button)}
        >
          <Speaker muted={muted} />
        </Toggle>
        <LanguageButton lang={other} onClick={onLang} xstyle={styles.button} />
        <ReportMenu iconOnly lang={lang} xstyle={styles.button} />
      </div>
    </header>
  );
};

interface PromptProps {
  lang: Lang;
  drawing: boolean;
  misses: number;
  challenge: Result | null;
}

export const Prompt = ({ lang, drawing, misses, challenge }: PromptProps) => {
  const words = copy[lang];
  return (
    <div
      aria-hidden={drawing}
      {...stylex.props(styles.prompt, drawing && styles.hidden)}
    >
      {challenge === null ? null : (
        <div {...stylex.props(glass.surface, styles.challenge)}>
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            {...stylex.props(styles.thumb)}
          >
            {paperSvg({ id: "challenge", size: 100, x: 0, y: 0 })}
            {inkSvg({
              id: "challenge",
              size: 84,
              trace: challenge.trace,
              x: 8,
              y: 8,
            })}
          </svg>
          <p {...stylex.props(styles.challengeText)}>
            <span {...stylex.props(styles.label)}>
              {words.challenge.received}
            </span>
            <span {...stylex.props(styles.challengeScore)}>
              {formatScore(challenge.score)} ·{" "}
              {rankOf(challenge.score).name[lang]}
            </span>
            <span {...stylex.props(styles.label)}>{words.challenge.dare}</span>
          </p>
        </div>
      )}
      <p aria-live="polite" {...stylex.props(styles.hint)}>
        <span
          key={misses}
          {...stylex.props(styles.hintTitle, misses > 0 && styles.miss)}
        >
          {misses > 0 ? words.miss : words.hint.title}
        </span>
        <span {...stylex.props(styles.hintSub)}>{words.hint.sub}</span>
      </p>
    </div>
  );
};
