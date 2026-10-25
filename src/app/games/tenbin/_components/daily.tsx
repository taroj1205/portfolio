import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { shared } from "../../../../styles/shared";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { countText, measureOf } from "../_lib/compare";
import { copy } from "../_lib/copy";
import { TRIES, gradesOf, outcomeOf } from "../_lib/daily";
import type { Item } from "../_lib/items";
import { rowOf, scoreOf } from "../_lib/result";
import type { Solve } from "../_lib/result";
import {
  START,
  boundsOf,
  gradeColors,
  gramsAt,
  stepOf,
  weightText,
} from "../_lib/scale";
import type { Grade } from "../_lib/scale";
import { Balance, Load } from "./balance";
import { WeightSlider } from "./weight-slider";

const GOLD = "#ffd27a";

const LEAN: Record<Grade, number> = { far: 13, hit: 0, near: 6, way: 19 };

export interface Puzzle {
  item: Item;
  day: number | null;
}

const bounce = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(18px) scale(0.6)" },
  "55%": { opacity: 1, transform: "translateY(-6px) scale(1.12)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const nudgeUp = stylex.keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-7px)" },
});

const nudgeDown = stylex.keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(7px)" },
});

const pop = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(0.4)" },
  "70%": { opacity: 1, transform: "scale(1.15)" },
  "100%": { opacity: 1, transform: "scale(1)" },
});

const styles = stylex.create({
  board: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "0.55rem",
    marginInline: "auto",
    maxWidth: "30rem",
    minHeight: 0,
    pointerEvents: "auto",
    width: "100%",
  },
  meta: {
    alignItems: "baseline",
    color: ink.soft,
    display: "flex",
    fontSize: "0.78rem",
    gap: "0.75rem",
    justifyContent: "space-between",
    letterSpacing: "calc(0.08em * var(--track, 1))",
    textShadow: shade.small,
    width: "100%",
  },
  question: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    margin: 0,
    textAlign: "center",
  },
  ask: {
    color: GOLD,
    fontSize: "0.78rem",
    fontWeight: 700,
    letterSpacing: "calc(0.18em * var(--track, 1))",
  },
  name: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.35rem, 6.2vw, 1.9rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.06em * var(--track, 1))",
    lineHeight: 1.2,
    textShadow: shade.large,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  stage: {
    flexGrow: 1,
    maxHeight: "19rem",
    minHeight: "9rem",
    width: "100%",
  },
  verdict: {
    alignItems: "center",
    animationDuration: "520ms",
    animationName: { default: bounce, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    display: "flex",
    flexDirection: "column",
    whiteSpace: "nowrap",
  },
  cue: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    minHeight: "4.6rem",
    width: "100%",
  },
  hint: {
    color: ink.soft,
    fontSize: "0.85rem",
    lineHeight: 1.6,
    margin: 0,
    textAlign: "center",
    textShadow: shade.small,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  verdictText: {
    alignItems: "center",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(1.7rem, 8vw, 2.3rem)",
    fontWeight: 700,
    gap: "0.35rem",
    letterSpacing: "calc(0.06em * var(--track, 1))",
    lineHeight: 1,
    textShadow: "0 0 24px currentColor, 0 2px 10px rgb(0 0 0 / 0.6)",
  },
  arrow: {
    animationDuration: "900ms",
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
    display: "inline-block",
  },
  arrowUp: {
    animationName: { default: nudgeUp, [media.reduce]: "none" },
  },
  arrowDown: {
    animationName: { default: nudgeDown, [media.reduce]: "none" },
  },
  within: {
    color: ink.soft,
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    marginTop: "0.3rem",
    textShadow: shade.small,
  },
  tint: (color: string) => ({ color }),
  slots: {
    display: "grid",
    gap: "0.35rem",
    gridAutoColumns: "minmax(0, 1fr)",
    gridAutoFlow: "column",
    listStyle: "none",
    margin: 0,
    padding: 0,
    width: "100%",
  },
  slot: {
    alignItems: "center",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    fontSize: "0.7rem",
    fontVariantNumeric: "tabular-nums",
    gap: "0.1rem",
    justifyContent: "center",
    minHeight: "2.9rem",
    paddingInline: "0.15rem",
    textAlign: "center",
  },
  empty: {
    borderColor: "rgb(255 255 255 / 0.16)",
    borderStyle: "dashed",
    borderWidth: 1,
  },
  filled: {
    animationDuration: "420ms",
    animationName: { default: pop, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    color: "#10141f",
    fontWeight: 800,
  },
  fill: (color: string) => ({ backgroundColor: color }),
  slotValue: {
    overflowWrap: "anywhere",
  },
  reading: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
  },
  like: {
    color: GOLD,
    fontSize: "0.85rem",
    fontWeight: 700,
    letterSpacing: "calc(0.04em * var(--track, 1))",
    margin: 0,
    textAlign: "center",
    textShadow: shade.small,
    textWrap: "balance",
  },
  readout: {
    fontFamily: font.mincho,
    fontSize: "clamp(2rem, 9vw, 2.6rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    letterSpacing: "calc(0.04em * var(--track, 1))",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.large,
  },
  weigh: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderRadius: 999,
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.3)",
    color: "#1c1406",
    cursor: "pointer",
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
    minHeight: "3.2rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    width: "100%",
  },
  challenge: {
    borderRadius: 16,
    display: "flex",
    flexDirection: "column",
    fontSize: "0.82rem",
    gap: "0.1rem",
    paddingBlock: "0.45rem",
    paddingInline: "0.9rem",
    textAlign: "center",
  },
  challengeLabel: {
    color: GOLD,
    fontSize: "0.7rem",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
});

const arrowOf = (grams: number, actual: number) =>
  grams < actual ? "up" : "down";

interface Judged {
  grade: Grade;
  way: "up" | "down" | "hit";
}

const judge = (step: number, grade: Grade, item: Item): Judged => ({
  grade,
  way: grade === "hit" ? "hit" : arrowOf(gramsAt(step), item.grams),
});

const THUD: Keyframe[] = [
  { transform: "translateY(0)" },
  { offset: 0.18, transform: "translateY(7px)" },
  { offset: 0.42, transform: "translateY(-3px)" },
  { offset: 0.68, transform: "translateY(1.5px)" },
  { transform: "translateY(0)" },
];

const useThud = (count: number) => {
  const stage = useRef<HTMLDivElement>(null);
  const seen = useRef(count);
  useEffect(() => {
    const grew = count > seen.current;
    seen.current = count;

    if (grew && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      stage.current?.animate(THUD, {
        duration: 520,
        easing: "cubic-bezier(0.3, 0.7, 0.4, 1)",
      });
    }
  }, [count]);

  return stage;
};

const tiltOf = (last: Judged | null) => {
  if (last === null || last.way === "hit") {
    return 0;
  }

  return last.way === "up" ? -LEAN[last.grade] : LEAN[last.grade];
};

interface DailyProps {
  lang: Lang;
  puzzle: Puzzle;
  guesses: readonly number[];
  challenge: Solve | null;
  onGuess: (step: number) => void;
  children: ReactNode;
}

export const Daily = ({
  lang,
  puzzle,
  guesses,
  challenge,
  onGuess,
  children,
}: DailyProps) => {
  const words = copy[lang];
  const { item } = puzzle;
  const grades = gradesOf(guesses, item);
  const outcome = outcomeOf(grades);
  const over = outcome !== "playing";
  const [step, setStep] = useState(guesses.at(-1) ?? START);
  const stage = useThud(guesses.length);
  const lastStep = guesses.at(-1);
  const lastGrade = grades.at(-1);

  const last =
    lastStep === undefined || lastGrade === undefined
      ? null
      : judge(lastStep, lastGrade, item);

  const answerStep = stepOf(item.grams);
  const tilt = over ? 0 : tiltOf(last);
  const shown = over ? answerStep : step;
  const unit = measureOf(gramsAt(shown), item.id);
  const tag = countText(unit.count, lang);

  return (
    <section aria-labelledby="tenbin-item" {...stylex.props(styles.board)}>
      <div {...stylex.props(styles.meta)}>
        <span>
          {puzzle.day === null
            ? words.daily.practice
            : words.daily.day(puzzle.day)}
        </span>
        <span>
          {over ? scoreOf(grades) : words.daily.left(TRIES - guesses.length)}
        </span>
      </div>
      {challenge !== null && !over ? (
        <p {...stylex.props(glass.surface, styles.challenge)}>
          <span {...stylex.props(styles.challengeLabel)}>
            {words.challenge.received}
          </span>
          <span>
            {`${words.share.daily(challenge.day)} ${challenge.item.emoji} ${scoreOf(challenge.grades)} ${rowOf(challenge.grades)}`}
          </span>
          <span>{words.challenge.beat}</span>
        </p>
      ) : null}
      <h2 id="tenbin-item" {...stylex.props(styles.question)}>
        <span {...stylex.props(styles.ask)}>{words.daily.ask}</span>
        <span {...stylex.props(styles.name)}>{item.name[lang]}</span>
      </h2>
      <div {...stylex.props(styles.cue)}>
        {last === null || outcome === "lost" ? (
          <p {...stylex.props(styles.hint)}>{words.daily.hint}</p>
        ) : (
          <div
            aria-live="polite"
            key={guesses.length}
            {...stylex.props(
              styles.verdict,
              styles.tint(gradeColors[last.grade])
            )}
          >
            <span {...stylex.props(styles.verdictText)}>
              {words.daily.verdict[last.way]}
              {last.way === "hit" ? null : (
                <span
                  aria-hidden="true"
                  {...stylex.props(
                    styles.arrow,
                    last.way === "up" ? styles.arrowUp : styles.arrowDown
                  )}
                >
                  {last.way === "up" ? "↑" : "↓"}
                </span>
              )}
            </span>
            <span {...stylex.props(styles.within)}>
              {words.daily.within[last.grade]}
            </span>
          </div>
        )}
      </div>
      <div ref={stage} {...stylex.props(styles.stage)}>
        <Balance
          glow={outcome === "won" ? guesses.length : null}
          idle={last === null}
          left={<Load id={item.id} />}
          right={<Load id={unit.item.id} step={shown} />}
          tag={tag}
          tilt={tilt}
        />
      </div>
      <ol {...stylex.props(styles.slots)}>
        {Array.from({ length: TRIES }, (_, i) => {
          const guess = guesses[i];
          const grade = grades[i];

          if (guess === undefined || grade === undefined) {
            return <li key={i} {...stylex.props(styles.slot, styles.empty)} />;
          }

          const { way } = judge(guess, grade, item);

          return (
            <li
              key={i}
              {...stylex.props(
                styles.slot,
                styles.filled,
                styles.fill(gradeColors[grade])
              )}
            >
              <span {...stylex.props(shared.srOnly)}>
                {`${weightText(gramsAt(guess), lang)}: ${words.daily.verdict[way]}, ${words.daily.within[grade]}`}
              </span>
              <span aria-hidden="true">
                {way === "hit" ? "◎" : null}
                {way === "up" ? "↑" : null}
                {way === "down" ? "↓" : null}
              </span>
              <span aria-hidden="true" {...stylex.props(styles.slotValue)}>
                {weightText(gramsAt(guess), lang)}
              </span>
            </li>
          );
        })}
      </ol>
      {over ? (
        children
      ) : (
        <>
          <div {...stylex.props(styles.reading)}>
            <p aria-live="off" {...stylex.props(styles.readout)}>
              {weightText(gramsAt(step), lang)}
            </p>
            <p {...stylex.props(styles.like)}>
              {words.daily.like(unit.item.name[lang], tag)}
            </p>
          </div>
          <WeightSlider
            bounds={boundsOf(guesses, item.grams)}
            lang={lang}
            onStep={setStep}
            step={step}
          />
          <button
            disabled={guesses.includes(step)}
            onClick={() => {
              onGuess(step);
            }}
            type="button"
            {...stylex.props(styles.weigh)}
          >
            {words.daily.weigh}
          </button>
        </>
      )}
    </section>
  );
};
