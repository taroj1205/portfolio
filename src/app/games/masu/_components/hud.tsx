import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import type { Pour } from "../_lib/pour";
import { glassOf, percent, rankOf, signed, spilledOf } from "../_lib/result";
import type { Glass, Result } from "../_lib/result";
import type { Stage } from "../_lib/session";

export interface Notice {
  id: number;
  text: string;
}

const GOLD = "#ffd27a";
const WIDE = "@media (min-width: 900px) and (orientation: landscape)";

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
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.35rem",
    fontWeight: 700,
    gap: "0.35rem",
    letterSpacing: "0.08em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    whiteSpace: "nowrap",
  },
  lead: {
    color: GOLD,
    fontSize: "0.42em",
    letterSpacing: "0.16em",
  },
  gauge: {
    animationDuration: "500ms",
    animationName: { default: drift, [media.reduce]: "none" },
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  label: {
    color: ink.soft,
    fontSize: "0.72rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  reading: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(2.3rem, 10vw, 3.4rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
    textShadow: shade.large,
  },
  unit: {
    fontSize: "0.36em",
    marginInlineStart: "0.2em",
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
  caption: {
    animationDuration: "600ms",
    animationName: { default: drift, [media.reduce]: "none" },
    borderRadius: 999,
    display: "flex",
    fontSize: "0.82rem",
    fontWeight: 700,
    gap: "0.5rem",
    left: "50%",
    letterSpacing: "calc(0.06em * var(--track, 1))",
    margin: 0,
    paddingBlock: "0.4rem",
    paddingInline: "0.9rem",
    position: "absolute",
    top: "max(5.2rem, 13vh)",
    translate: "-50% 0",
    whiteSpace: "nowrap",
  },
  captionTag: {
    color: GOLD,
  },
  bottom: {
    alignItems: { default: "center", [WIDE]: "flex-start" },
    bottom: "max(1.1rem, calc(env(safe-area-inset-bottom) + 0.7rem))",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    insetInline: {
      default: "0.75rem",
      [WIDE]: "max(2.5rem, calc(env(safe-area-inset-left) + 1.5rem)) auto",
    },
    maxWidth: { default: null, [WIDE]: "26rem" },
    position: "absolute",
    textAlign: { default: "center", [WIDE]: "start" },
  },
  rule: {
    alignItems: { default: "center", [WIDE]: "flex-start" },
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
    fontSize: "clamp(1.1rem, 4.8vw, 1.5rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.06em * var(--track, 1))",
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
    margin: 0,
    marginTop: "0.35rem",
    textShadow: shade.small,
  },
  ring: {
    borderColor: GOLD,
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
    borderColor: GOLD,
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
  note: {
    color: ink.soft,
    fontSize: "0.8rem",
    margin: 0,
    maxWidth: "20rem",
    textShadow: shade.small,
    textWrap: "balance",
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

const Prompt = ({ text }: { text: string }) => (
  <p {...stylex.props(styles.start)}>
    <span aria-hidden="true" {...stylex.props(styles.ring)}>
      <span {...stylex.props(styles.ringWave)} />
    </span>
    {text}
  </p>
);

interface HudProps {
  lang: Lang;
  stage: Stage;
  pour: Pour | null;
  demo: Glass | null;
  best: number;
  pours: number;
  muted: boolean;
  challenge: Result | null;
  notice: Notice | null;
  reading: RefObject<HTMLSpanElement | null>;
  prose: RefObject<HTMLDivElement | null>;
  onLang: () => void;
  onMute: (muted: boolean) => void;
}

const scoreText = (poured: Glass, lang: Lang) =>
  spilledOf(poured) ? copy[lang].spilled : `${percent(poured.outcome.tenths)}%`;

const Idle = ({
  lang,
  challenge,
  best,
  pours,
}: Pick<HudProps, "lang" | "challenge" | "best" | "pours">) => {
  const words = copy[lang];
  const target = challenge === null ? null : glassOf(challenge);
  return (
    <>
      {target === null ? null : (
        <div {...stylex.props(glass.surface, styles.challenge)}>
          <span {...stylex.props(styles.label)}>
            {words.challenge.received}
          </span>
          <p {...stylex.props(styles.challengeTitle)}>
            {words.challenge.target(scoreText(target, lang))} ·{" "}
            {rankOf(target).name[lang]}
          </p>
          <span {...stylex.props(styles.label)}>{words.challenge.dare}</span>
        </div>
      )}
      <p {...stylex.props(styles.rule)}>
        <span {...stylex.props(styles.ruleLead)}>{words.rule.lead}</span>
        <span {...stylex.props(styles.ruleBody)}>{words.rule.body}</span>
      </p>
      <Prompt text={words.rule.start} />
      <p {...stylex.props(styles.keys)}>{words.rule.keys}</p>
      {pours > 0 ? (
        <p {...stylex.props(styles.label)}>
          {words.best(percent(best), pours)}
        </p>
      ) : null}
    </>
  );
};

export const Hud = ({
  lang,
  stage,
  pour,
  demo,
  best,
  pours,
  muted,
  challenge,
  notice,
  reading,
  prose,
  onLang,
  onMute,
}: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  const playing = stage === "ready" || stage === "pouring";
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.top)}>
        <div {...stylex.props(styles.brand)}>
          <BackToGames label={words.back} />
          {playing && pour !== null ? (
            <div {...stylex.props(styles.gauge)}>
              <p {...stylex.props(styles.label)}>
                {words.bottles[pour.bottle]} · {words.cups[pour.cup]}
              </p>
              <p {...stylex.props(styles.label)}>{words.rim}</p>
              <p {...stylex.props(styles.reading)}>
                <span ref={reading}>{signed(0)}</span>
                <span {...stylex.props(styles.unit)}>mm</span>
              </p>
            </div>
          ) : (
            <h1 lang="ja" {...stylex.props(styles.title)}>
              <span {...stylex.props(styles.lead)}>{copy.ja.reading}</span>
              {copy.ja.name}
            </h1>
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

      {stage === "idle" && demo !== null ? (
        <p aria-hidden="true" {...stylex.props(glass.surface, styles.caption)}>
          <span {...stylex.props(styles.captionTag)}>{words.demo}</span>
          {words.tension} {scoreText(demo, lang)}
        </p>
      ) : null}

      <div ref={prose} {...stylex.props(styles.bottom)}>
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
          <Idle best={best} challenge={challenge} lang={lang} pours={pours} />
        ) : null}
        {stage === "ready" && pour !== null ? (
          <>
            {pour.cup === "mokkiri" ? (
              <p {...stylex.props(styles.note)}>{words.mokkiri}</p>
            ) : null}
            <Prompt text={words.rule.start} />
          </>
        ) : null}
      </div>
    </div>
  );
};
