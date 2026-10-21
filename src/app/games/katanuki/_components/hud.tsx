import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { mouldIds, moulds } from "../_lib/moulds";
import type { MouldId } from "../_lib/moulds";
import { headlineOf, rankOf } from "../_lib/result";
import type { Result } from "../_lib/result";

const GOLD = "#ffd27a";
const PINK = "#f6b3c4";

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
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "space-between",
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
    fontSize: "1.45rem",
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
  segments: {
    backdropFilter: "blur(18px) saturate(140%)",
    backgroundColor: "rgb(12 16 28 / 0.42)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 22,
    borderStyle: "solid",
    borderWidth: 1,
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
      default: "repeat(3, 1fr)",
      "@media (min-width: 520px)": "repeat(6, 1fr)",
    },
    padding: 3,
    pointerEvents: "auto",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    width: "100%",
  },
  segment: {
    backgroundColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    color: ink.soft,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.82rem",
    fontWeight: 700,
    minHeight: "2.5rem",
    outlineColor: GOLD,
    outlineOffset: 2,
    paddingInline: "0.5rem",
    transitionDuration: "180ms",
    transitionProperty: "background-color, color",
    whiteSpace: "nowrap",
  },
  segmentOn: {
    backgroundColor: "rgb(255 240 244 / 0.94)",
    color: "#3a1020",
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
    gridTemplateColumns: "3.2rem 1fr 3rem",
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
  carved: {
    backgroundImage: `linear-gradient(90deg, ${PINK}, #fff1f4)`,
  },
  stress: {
    backgroundImage: "linear-gradient(90deg, #ffcf6a, #ff7a5c 60%, #e5384b)",
  },
  value: {
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    textAlign: "end",
    textShadow: shade.small,
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

interface MeterProps {
  lang: Lang;
  carved: RefObject<HTMLDivElement | null>;
  percent: RefObject<HTMLSpanElement | null>;
  stress: RefObject<HTMLDivElement | null>;
}

export const Meter = ({ lang, carved, percent, stress }: MeterProps) => {
  const words = copy[lang].meter;
  return (
    <div {...stylex.props(styles.prompt)}>
      <div {...stylex.props(styles.meter)}>
        <div {...stylex.props(styles.gauge)}>
          <span {...stylex.props(styles.gaugeLabel)}>{words.carved}</span>
          <div {...stylex.props(styles.track)}>
            <div ref={carved} {...stylex.props(styles.fill, styles.carved)} />
          </div>
          <span ref={percent} {...stylex.props(styles.value)}>
            0%
          </span>
        </div>
        <div {...stylex.props(styles.gauge)}>
          <span {...stylex.props(styles.gaugeLabel)}>{words.stress}</span>
          <div {...stylex.props(styles.track)}>
            <div ref={stress} {...stylex.props(styles.fill, styles.stress)} />
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
  return (
    <div {...stylex.props(glass.surface, styles.challenge)}>
      <span {...stylex.props(styles.label)}>
        {`${words.challenge.received} · ${moulds[challenge.mould].name[lang]}`}
      </span>
      <p {...stylex.props(styles.challengeTitle)}>
        {`${headlineOf(challenge, lang)} · ${rankOf(challenge).name[lang]}`}
      </p>
      <span {...stylex.props(styles.label)}>
        {challenge.time === null ? words.challenge.beat : words.challenge.dare}
      </span>
    </div>
  );
};

interface PromptProps {
  lang: Lang;
  mould: MouldId;
  challenge: Result | null;
  best: number | null;
  clears: number;
  runs: number;
  onMould: (mould: MouldId) => void;
}

export const Prompt = ({
  lang,
  mould,
  challenge,
  best,
  clears,
  runs,
  onMould,
}: PromptProps) => {
  const words = copy[lang];
  return (
    <div {...stylex.props(styles.prompt)}>
      {challenge === null ? (
        <ToggleGroup
          aria-label={words.moulds}
          onValueChange={([next]) => {
            if (next !== undefined) {
              onMould(next);
            }
          }}
          value={[mould]}
          {...stylex.props(styles.segments)}
        >
          {mouldIds.map((id) => (
            <Toggle
              className={(state) =>
                stylex.props(styles.segment, state.pressed && styles.segmentOn)
                  .className
              }
              key={id}
              value={id}
            >
              {moulds[id].name[lang]}
            </Toggle>
          ))}
        </ToggleGroup>
      ) : (
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
          {best === null
            ? words.stats(clears, runs)
            : words.best(headlineOf({ carved: 100, mould, time: best }, lang))}
        </p>
      )}
    </div>
  );
};
