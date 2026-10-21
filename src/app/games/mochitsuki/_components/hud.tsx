import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { LIVES } from "../_lib/beat";
import { copy } from "../_lib/copy";
import { poundsText, rankOf, tempoText } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Stats } from "../_lib/session";

const GOLD = "#ffd27a";
const MOCHI = "#fff6ea";

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const ripple = stylex.keyframes({
  "0%": { opacity: 0.9, transform: "scale(0.6)" },
  "100%": { opacity: 0, transform: "scale(1.9)" },
});

const bump = stylex.keyframes({
  "0%": { transform: "scale(1.22)" },
  "100%": { transform: "scale(1)" },
});

const styles = stylex.create({
  top: {
    alignItems: "flex-start",
    display: "flex",
    gap: "0.5rem",
    justifyContent: "space-between",
    pointerEvents: "none",
    position: "relative",
    zIndex: 1,
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
  },
  title: {
    alignItems: "center",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "1.65rem",
    fontWeight: 700,
    gap: "0.45rem",
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
    borderColor: MOCHI,
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 0 18px rgb(255 214 160 / 0.6)",
    height: "1.5rem",
    position: "relative",
    width: "1.5rem",
  },
  wave: {
    animationDuration: "667ms",
    animationIterationCount: "infinite",
    animationName: { default: ripple, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    borderColor: MOCHI,
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
    alignItems: "end",
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: "1fr 1fr 1fr",
    marginInline: "auto",
    maxWidth: "22rem",
    width: "100%",
  },
  gauge: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    margin: 0,
  },
  gaugeLabel: {
    color: ink.soft,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    textShadow: shade.small,
  },
  value: {
    animationDuration: "220ms",
    animationName: { default: bump, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    display: "inline-block",
    fontFamily: font.mincho,
    fontSize: "2rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
  },
  hot: {
    color: GOLD,
  },
  lives: {
    display: "flex",
    gap: "0.4rem",
    height: "2rem",
    alignItems: "center",
  },
  life: {
    backgroundColor: MOCHI,
    borderRadius: 999,
    boxShadow: "0 0 10px rgb(255 236 210 / 0.55)",
    height: "0.85rem",
    transitionDuration: "240ms",
    transitionProperty: "opacity, transform",
    width: "0.85rem",
  },
  hiddenText: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  lost: {
    boxShadow: "none",
    opacity: 0.18,
    transform: "scale(0.7)",
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
          餅つき
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
    </header>
  );
};

export const Meter = ({ lang, stats }: { lang: Lang; stats: Stats }) => {
  const words = copy[lang].meter;
  return (
    <div {...stylex.props(styles.prompt)}>
      <div {...stylex.props(styles.meter)}>
        <p {...stylex.props(styles.gauge)}>
          <span {...stylex.props(styles.gaugeLabel)}>{words.pounds}</span>
          <span key={stats.pounds} {...stylex.props(styles.value)}>
            {stats.pounds}
          </span>
        </p>
        <p {...stylex.props(styles.gauge)}>
          <span {...stylex.props(styles.gaugeLabel)}>{words.tempo}</span>
          <span
            key={stats.tempo}
            {...stylex.props(styles.value, stats.tempo >= 200 && styles.hot)}
          >
            {stats.tempo}
          </span>
        </p>
        <div {...stylex.props(styles.gauge)}>
          <span {...stylex.props(styles.gaugeLabel)}>{words.lives}</span>
          <span {...stylex.props(styles.hiddenText)}>
            {`${stats.lives} / ${LIVES}`}
          </span>
          <span aria-hidden="true" {...stylex.props(styles.lives)}>
            {Array.from({ length: LIVES }, (_, i) => (
              <span
                key={i}
                {...stylex.props(styles.life, i >= stats.lives && styles.lost)}
              />
            ))}
          </span>
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
  return (
    <div {...stylex.props(glass.surface, styles.challenge)}>
      <span {...stylex.props(styles.label)}>
        {`${words.challenge.received} · ${tempoText(challenge.tempo)}`}
      </span>
      <p {...stylex.props(styles.challengeTitle)}>
        {`${poundsText(challenge.pounds, lang)} · ${rankOf(challenge.pounds).name[lang]}`}
      </p>
      <span {...stylex.props(styles.label)}>{words.challenge.dare}</span>
    </div>
  );
};

interface PromptProps {
  lang: Lang;
  challenge: Result | null;
  best: number;
  tempo: number;
  runs: number;
}

export const Prompt = ({ lang, challenge, best, tempo, runs }: PromptProps) => {
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
          {`${words.best(poundsText(best, lang), tempoText(tempo))} · ${words.stats(runs)}`}
        </p>
      )}
    </div>
  );
};
