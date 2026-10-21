import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";
import type { RefObject } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { POURS } from "../_lib/pour";
import type { Pour } from "../_lib/pour";
import {
  brimful,
  heightOf,
  percent,
  rankOf,
  signed,
  tallyOf,
  verdictOf,
} from "../_lib/result";
import type { Glass, Result } from "../_lib/result";
import type { Stage } from "../_lib/session";

export interface Notice {
  id: number;
  text: string;
}

const GOLD = "#ffd27a";
const SPILL = "#ff8a6a";

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

const pop = stylex.keyframes({
  "0%": { filter: "blur(8px)", opacity: 0, transform: "scale(0.86)" },
  "60%": { filter: "blur(0)", opacity: 1, transform: "scale(1.03)" },
  "100%": { filter: "blur(0)", opacity: 1, transform: "scale(1)" },
});

const shake = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateX(0) rotate(0)" },
  "15%": { opacity: 1, transform: "translateX(-6px) rotate(-3deg)" },
  "30%": { transform: "translateX(5px) rotate(2deg)" },
  "45%": { transform: "translateX(-3px) rotate(-1deg)" },
  "60%, 100%": { opacity: 1, transform: "translateX(0) rotate(0)" },
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
  titleBox: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    width: "2.75rem",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "2.1rem",
    fontWeight: 700,
    letterSpacing: "0.32em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    writingMode: "vertical-rl",
  },
  lead: {
    color: GOLD,
    fontSize: "0.4em",
    letterSpacing: "0.3em",
    marginBlockEnd: "0.5em",
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
  gauge: {
    animationDuration: "500ms",
    animationName: { default: drift, [media.reduce]: "none" },
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
  },
  turn: {
    fontFamily: font.mincho,
    fontSize: "1.2rem",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
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
  reveal: {
    alignItems: "center",
    animationDuration: "700ms",
    animationFillMode: "both",
    animationName: { default: pop, [media.reduce]: drift },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    margin: 0,
    marginBottom: "0.4rem",
    textAlign: "center",
    width: "min(90vw, 24rem)",
  },
  spilled: {
    animationDuration: "800ms",
    animationName: { default: shake, [media.reduce]: drift },
  },
  score: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(3.2rem, 15vw, 4.6rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    textShadow: shade.large,
  },
  gold: {
    color: GOLD,
  },
  spillWord: {
    color: SPILL,
    fontFamily: font.mincho,
    fontSize: "clamp(2.8rem, 13vw, 4rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    lineHeight: 1.1,
    textShadow: shade.large,
  },
  verdict: {
    fontFamily: font.mincho,
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    textShadow: shade.small,
  },
  quip: {
    color: ink.soft,
    fontSize: "0.85rem",
    textShadow: shade.small,
    textWrap: "balance",
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
  tally: {
    display: "grid",
    gap: "0.4rem",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    listStyle: "none",
    margin: 0,
    maxWidth: "22rem",
    padding: 0,
    width: "100%",
  },
  slot: {
    alignItems: "center",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 12,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    fontVariantNumeric: "tabular-nums",
    gap: "0.05rem",
    paddingBlock: "0.35rem",
    transitionDuration: "300ms",
    transitionProperty: "border-color, background-color",
  },
  slotNow: {
    backgroundColor: "rgb(255 210 122 / 0.12)",
    borderColor: GOLD,
  },
  slotIndex: {
    color: ink.soft,
    fontSize: "0.62rem",
    letterSpacing: "calc(0.1em * var(--track, 1))",
  },
  slotValue: {
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontWeight: 700,
    minHeight: "1.2em",
  },
  slotSpill: {
    color: SPILL,
    fontSize: "0.75rem",
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

const Reveal = ({
  lang,
  turn,
  poured,
}: {
  lang: Lang;
  turn: number;
  poured: Glass;
}) => {
  const words = copy[lang];
  const verdict = verdictOf(poured.outcome);
  if (poured.outcome.spilledAt !== null) {
    return (
      <p aria-live="polite" {...stylex.props(styles.reveal, styles.spilled)}>
        <span {...stylex.props(styles.spillWord)}>{words.spilled}</span>
        <span {...stylex.props(styles.verdict)}>{words.verdicts[verdict]}</span>
        <span {...stylex.props(styles.quip)}>
          {words.spills[turn % words.spills.length]}
        </span>
      </p>
    );
  }

  return (
    <p aria-live="polite" {...stylex.props(styles.reveal)}>
      <span {...stylex.props(styles.label)}>{words.tension}</span>
      <span
        {...stylex.props(styles.score, brimful(poured.outcome) && styles.gold)}
      >
        {percent(poured.outcome.tenths)}
        <span {...stylex.props(styles.unit)}>%</span>
      </span>
      <span {...stylex.props(styles.verdict)}>{words.verdicts[verdict]}</span>
      <span {...stylex.props(styles.quip)}>
        {words.rim} {signed(heightOf(poured))}mm
      </span>
    </p>
  );
};

const scoreText = (poured: Glass, lang: Lang) =>
  poured.outcome.spilledAt === null
    ? percent(poured.outcome.tenths)
    : copy[lang].spill;

const Tally = ({
  lang,
  turn,
  glasses,
}: {
  lang: Lang;
  turn: number;
  glasses: readonly Glass[];
}) => {
  const words = copy[lang];
  return (
    <ol aria-label={words.pours} {...stylex.props(styles.tally)}>
      {Array.from({ length: POURS }, (_, index) => {
        const done = glasses[index];
        const spilled = done !== undefined && done.outcome.spilledAt !== null;
        return (
          <li
            key={index}
            {...stylex.props(
              glass.surface,
              styles.slot,
              index === turn && done === undefined && styles.slotNow
            )}
          >
            <span {...stylex.props(styles.slotIndex)}>{words.mark(index)}</span>
            <span
              {...stylex.props(
                styles.slotValue,
                spilled && styles.slotSpill,
                done !== undefined && brimful(done.outcome) && styles.gold
              )}
            >
              {done === undefined ? null : scoreText(done, lang)}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

interface HudProps {
  lang: Lang;
  stage: Stage;
  turn: number;
  pour: Pour | null;
  glasses: readonly Glass[];
  demo: Glass | null;
  best: number;
  runs: number;
  muted: boolean;
  challenge: Result | null;
  notice: Notice | null;
  reading: RefObject<HTMLSpanElement | null>;
  onLang: () => void;
  onMute: (muted: boolean) => void;
}

const Idle = ({
  lang,
  challenge,
  best,
  runs,
}: Pick<HudProps, "lang" | "challenge" | "best" | "runs">) => {
  const words = copy[lang];
  const target = challenge === null ? null : tallyOf(challenge).average;
  return (
    <>
      {target === null ? null : (
        <div {...stylex.props(glass.surface, styles.challenge)}>
          <span {...stylex.props(styles.label)}>
            {words.challenge.received}
          </span>
          <p {...stylex.props(styles.challengeTitle)}>
            {words.challenge.target(percent(target))} ·{" "}
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
      {runs > 0 ? (
        <p {...stylex.props(styles.label)}>{words.best(percent(best), runs)}</p>
      ) : null}
    </>
  );
};

export const Hud = ({
  lang,
  stage,
  turn,
  pour,
  glasses,
  demo,
  best,
  runs,
  muted,
  challenge,
  notice,
  reading,
  onLang,
  onMute,
}: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  const playing = stage !== "idle" && stage !== "result";
  const shown = glasses[turn];
  return (
    <div {...stylex.props(styles.root)}>
      <div {...stylex.props(styles.top)}>
        <div {...stylex.props(styles.brand)}>
          <BackToGames label={words.back} />
          {playing && pour !== null ? (
            <div {...stylex.props(styles.gauge)}>
              <p {...stylex.props(styles.turn)}>{words.turn(turn)}</p>
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
            <div {...stylex.props(styles.titleBox)}>
              <h1 lang="ja" {...stylex.props(styles.title)}>
                <span {...stylex.props(styles.lead)}>ます</span>枡
              </h1>
              <span aria-hidden="true" {...stylex.props(styles.seal)}>
                酒
              </span>
            </div>
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
          {demo.outcome.spilledAt === null
            ? `${words.tension} ${percent(demo.outcome.tenths)}%`
            : words.verdicts[verdictOf(demo.outcome)]}
        </p>
      ) : null}

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
          <Idle best={best} challenge={challenge} lang={lang} runs={runs} />
        ) : null}
        {stage === "ready" && pour !== null ? (
          <>
            {pour.cup === "mokkiri" ? (
              <p {...stylex.props(styles.note)}>{words.mokkiri}</p>
            ) : null}
            <Prompt text={turn === 0 ? words.rule.start : words.rule.next} />
          </>
        ) : null}
        {stage === "settled" && shown !== undefined ? (
          <Reveal lang={lang} poured={shown} turn={turn} />
        ) : null}
        {playing ? <Tally glasses={glasses} lang={lang} turn={turn} /> : null}
      </div>
    </div>
  );
};
