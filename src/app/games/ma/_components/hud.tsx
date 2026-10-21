import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import * as stylex from "@stylexjs/stylex";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { formatGap, formatTime, rankOf, secondsText } from "../_lib/judge";
import { gapOf } from "../_lib/result";
import type { Mode, Plan, Result } from "../_lib/result";

const GOLD = "#ffd27a";
const modes = ["standard", "daily"] as const satisfies readonly Mode[];

export interface Notice {
  id: number;
  text: string;
}

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
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
  },
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.5rem",
    fontWeight: 700,
    gap: "0.35rem",
    letterSpacing: "0.12em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    whiteSpace: "nowrap",
  },
  reading: {
    color: GOLD,
    fontSize: "0.42em",
    letterSpacing: "0.2em",
  },
  stats: {
    color: ink.soft,
    fontSize: "0.74rem",
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
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
    gap: "0.8rem",
    marginInline: "auto",
    maxWidth: "28rem",
    minHeight: "9rem",
    textAlign: "center",
    width: "100%",
  },
  segments: {
    backgroundColor: "rgb(12 16 28 / 0.42)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    gap: 2,
    padding: 3,
    pointerEvents: "auto",
    WebkitBackdropFilter: "blur(18px) saturate(140%)",
    backdropFilter: "blur(18px) saturate(140%)",
  },
  segment: {
    backgroundColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    color: ink.soft,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.82rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    minHeight: "2.5rem",
    outlineColor: GOLD,
    outlineOffset: 2,
    paddingInline: "1rem",
    transitionDuration: "180ms",
    transitionProperty: "background-color, color",
  },
  segmentOn: {
    backgroundColor: "rgb(244 246 255 / 0.92)",
    color: "#0b1230",
  },
  dot: {
    backgroundColor: GOLD,
    borderRadius: 999,
    boxShadow: `0 0 8px ${GOLD}`,
    display: "inline-block",
    height: 6,
    marginInlineStart: "0.45rem",
    verticalAlign: "middle",
    width: 6,
  },
  status: {
    color: ink.soft,
    fontSize: "0.78rem",
    letterSpacing: "calc(0.06em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  rule: {
    animationDuration: "900ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
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
    marginTop: "0.3rem",
    textShadow: shade.small,
  },
  ring: {
    borderColor: "#dfe6ff",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 2,
    boxShadow: "0 0 18px rgb(190 206 255 / 0.6)",
    height: "1.5rem",
    position: "relative",
    width: "1.5rem",
  },
  wave: {
    animationDuration: "2.2s",
    animationIterationCount: "infinite",
    animationName: { default: ripple, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.3, 1)",
    borderColor: "#dfe6ff",
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
    fontSize: "0.74rem",
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
  notice: {
    animationDuration: "3.2s",
    animationFillMode: "forwards",
    animationName: fade,
    borderRadius: 999,
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "calc(0.06em * var(--track, 1))",
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
          <span {...stylex.props(styles.reading)}>むおんのじゅうびょう</span>
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

const ChallengeCard = ({
  lang,
  challenge,
}: {
  lang: Lang;
  challenge: Result;
}) => {
  const words = copy[lang];
  const gap = gapOf(challenge);
  const off = secondsText(formatGap(gap), lang);
  const rank = rankOf(gap).name[lang];
  const paren =
    lang === "en" ? ` (${formatGap(gap)})` : `（${formatGap(gap)}）`;
  const title =
    challenge.day === null
      ? `${secondsText(formatTime(challenge.time), lang)}${paren} · ${rank}`
      : `${words.challenge.day(challenge.day)} · ${off} · ${rank}`;
  return (
    <div {...stylex.props(glass.surface, styles.challenge)}>
      <span {...stylex.props(styles.label)}>{words.challenge.received}</span>
      <p {...stylex.props(styles.challengeTitle)}>{title}</p>
      <span {...stylex.props(styles.label)}>
        {gap === 0 ? words.challenge.match : words.challenge.dare}
      </span>
    </div>
  );
};

interface PromptProps {
  lang: Lang;
  mode: Mode;
  plan: Plan;
  today: number | null;
  challenge: Result | null;
  idle: boolean;
  daily: { gap: number; streak: number } | null;
  best: number | null;
  runs: number;
  notice: Notice | null;
  onMode: (mode: Mode) => void;
}

export const Prompt = ({
  lang,
  mode,
  plan,
  today,
  challenge,
  idle,
  daily,
  best,
  runs,
  notice,
  onMode,
}: PromptProps) => {
  const words = copy[lang];
  const target = formatTime(plan.target);
  let status: string | null = null;
  if (plan.today) {
    status =
      daily === null
        ? words.daily.fresh
        : words.daily.done(formatGap(daily.gap), daily.streak);
  }
  return (
    <div {...stylex.props(styles.prompt)}>
      {notice === null ? null : (
        <p
          aria-live="polite"
          key={notice.id}
          {...stylex.props(glass.surface, styles.notice)}
        >
          {notice.text}
        </p>
      )}
      {idle ? (
        <>
          {challenge === null ? (
            <ToggleGroup
              aria-label={words.modes.label}
              onValueChange={([next]) => {
                if (next !== undefined) {
                  onMode(next);
                }
              }}
              value={[mode]}
              {...stylex.props(styles.segments)}
            >
              {modes.map((value) => (
                <Toggle
                  className={(state) =>
                    stylex.props(
                      styles.segment,
                      state.pressed && styles.segmentOn
                    ).className
                  }
                  key={value}
                  value={value}
                >
                  {value === "standard"
                    ? words.modes.standard
                    : words.modes.daily(today)}
                  {value === "daily" && daily === null ? (
                    <span aria-hidden="true" {...stylex.props(styles.dot)} />
                  ) : null}
                </Toggle>
              ))}
            </ToggleGroup>
          ) : (
            <ChallengeCard challenge={challenge} lang={lang} />
          )}
          {status === null ? null : (
            <p {...stylex.props(styles.status)}>{status}</p>
          )}
          <p {...stylex.props(styles.rule)}>
            <span {...stylex.props(styles.lead)}>{words.rule.lead}</span>
            <span {...stylex.props(styles.body)}>
              {words.rule.body(target)}
            </span>
            <span {...stylex.props(styles.start)}>
              <span aria-hidden="true" {...stylex.props(styles.ring)}>
                <span {...stylex.props(styles.wave)} />
              </span>
              {words.rule.start}
            </span>
          </p>
          <p {...stylex.props(styles.keys)}>{words.rule.keys}</p>
          {best === null || runs === 0 ? null : (
            <p {...stylex.props(styles.stats)}>
              {words.stats(`±${formatTime(best)}`, runs)}
            </p>
          )}
        </>
      ) : null}
    </div>
  );
};
