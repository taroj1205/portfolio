import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";
import type { PointerEvent } from "react";

import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Point } from "../../_lib/svg";
import { copy } from "../_lib/copy";
import {
  ROUNDS,
  SIZE,
  canGuess,
  clampToBoard,
  errorText,
  totalOf,
} from "../_lib/puzzles";
import type { Graded, Puzzle } from "../_lib/puzzles";
import { verdictColors, verdictOf } from "../_lib/result";
import { Figure } from "./figure";

const GOLD = "#ffd27a";
const NUDGE = 1;
const LEAP = 10;

const bounce = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(18px) scale(0.6)" },
  "55%": { opacity: 1, transform: "translateY(-6px) scale(1.12)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const styles = stylex.create({
  play: {
    alignItems: "center",
    containerType: "inline-size",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "0.65rem",
    marginInline: "auto",
    maxWidth: "30rem",
    width: "100%",
  },
  stage: {
    alignItems: "center",
    alignSelf: "stretch",
    containerType: "size",
    display: "flex",
    flexGrow: 1,
    justifyContent: "center",
    maxHeight: "100cqi",
    minHeight: "12rem",
  },
  meta: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
    width: "100%",
  },
  round: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  pips: {
    display: "flex",
    gap: 5,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  pip: {
    backgroundColor: "rgb(255 255 255 / 0.18)",
    borderRadius: 999,
    height: 10,
    transitionDuration: "300ms",
    transitionProperty: "background-color, transform",
    width: 10,
  },
  pipNow: {
    backgroundColor: ink.text,
    transform: "scale(1.3)",
  },
  tint: (color: string) => ({ backgroundColor: color }),
  ask: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.2rem, 5.6vw, 1.6rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.04em * var(--track, 1))",
    lineHeight: 1.35,
    margin: 0,
    minHeight: "2.7em",
    textAlign: "center",
    textShadow: shade.large,
    textWrap: "balance",
    width: "100%",
  },
  board: {
    aspectRatio: "1",
    borderRadius: 18,
    boxShadow:
      "0 0 0 1px rgb(255 255 255 / 0.2), 0 24px 60px rgb(0 0 0 / 0.45)",
    cursor: "crosshair",
    display: "block",
    outlineColor: GOLD,
    outlineOffset: 4,
    overflow: "hidden",
    touchAction: "none",
    userSelect: "none",
    width: "100cqmin",
    WebkitUserSelect: "none",
  },
  cue: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    minHeight: "4.2rem",
  },
  hint: {
    color: ink.soft,
    fontSize: "0.85rem",
    letterSpacing: "calc(0.06em * var(--track, 1))",
    margin: 0,
    textAlign: "center",
    textShadow: shade.small,
  },
  verdict: {
    alignItems: "baseline",
    animationDuration: "520ms",
    animationName: { default: bounce, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.2rem 0.8rem",
    justifyContent: "center",
    margin: 0,
  },
  word: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.9rem, 9vw, 2.5rem)",
    fontWeight: 700,
    lineHeight: 1,
    textShadow: "0 0 24px currentColor, 0 2px 10px rgb(0 0 0 / 0.6)",
    whiteSpace: "nowrap",
  },
  color: (color: string) => ({ color }),
  numbers: {
    color: ink.text,
    fontSize: "1.05rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  rival: {
    color: ink.soft,
    fontSize: "0.8rem",
    fontWeight: 500,
    marginInlineStart: "0.4rem",
  },
  action: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderRadius: 999,
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.3)",
    color: "#1c1406",
    cursor: { default: "pointer", ":disabled": "default" },
    fontFamily: font.mincho,
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    minHeight: "3.3rem",
    opacity: { default: 1, ":disabled": 0.4 },
    outlineColor: GOLD,
    outlineOffset: 3,
    transform: { default: null, ":active:enabled": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform, opacity",
    width: "100%",
  },
  challenge: {
    borderRadius: 16,
    fontSize: "0.82rem",
    margin: 0,
    paddingBlock: "0.45rem",
    paddingInline: "0.9rem",
    textAlign: "center",
  },
  challengeLabel: {
    color: GOLD,
    fontWeight: 700,
    marginInlineEnd: "0.5rem",
  },
});

const keySteps = new Map<string, Point>([
  ["ArrowDown", { x: 0, y: 1 }],
  ["ArrowLeft", { x: -1, y: 0 }],
  ["ArrowRight", { x: 1, y: 0 }],
  ["ArrowUp", { x: 0, y: -1 }],
]);

const isControl = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest("button, a, input, [role='menu'], [role='dialog']") !== null;

const startOf = (puzzle: Puzzle): Point =>
  puzzle.pivot === null
    ? { x: SIZE / 2, y: SIZE / 2 }
    : clampToBoard({ x: puzzle.pivot.x, y: puzzle.pivot.y - SIZE / 4 });

interface PlayProps {
  lang: Lang;
  index: number;
  puzzle: Puzzle;
  guess: Point | null;
  graded: Graded | null;
  marks: readonly number[];
  rival: readonly number[] | null;
  onGuess: (guess: Point) => void;
  onLock: () => void;
  onNext: () => void;
}

export const Play = ({
  lang,
  index,
  puzzle,
  guess,
  graded,
  marks,
  rival,
  onGuess,
  onLock,
  onNext,
}: PlayProps) => {
  const words = copy[lang];
  const board = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);
  const last = index === ROUNDS - 1;
  const ready = guess !== null && canGuess(puzzle, guess);

  const aim = (event: PointerEvent<SVGSVGElement>) => {
    const rect = board.current?.getBoundingClientRect();

    if (rect === undefined || rect.width === 0 || graded !== null) {
      return;
    }

    onGuess(
      clampToBoard({
        x: ((event.clientX - rect.left) / rect.width) * SIZE,
        y: ((event.clientY - rect.top) / rect.height) * SIZE,
      })
    );
  };

  const keyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented || isControl(event.target)) {
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (graded !== null) {
        onNext();
      } else if (ready) {
        onLock();
      }

      return;
    }

    const step = keySteps.get(event.key);

    if (step === undefined || graded !== null) {
      return;
    }

    event.preventDefault();
    const from = guess ?? startOf(puzzle);
    const by = event.shiftKey ? LEAP : NUDGE;
    onGuess(clampToBoard({ x: from.x + step.x * by, y: from.y + step.y * by }));
  };

  useEffect(() => {
    window.addEventListener("keydown", keyDown);

    return () => {
      window.removeEventListener("keydown", keyDown);
    };
  });

  const verdict = graded === null ? null : verdictOf(graded.points);
  const theirs = rival?.[index];
  let label = words.lock;

  if (graded !== null) {
    label = last ? words.finish : words.next;
  }

  return (
    <section aria-labelledby="mebunryo-ask" {...stylex.props(styles.play)}>
      {rival === null ? null : (
        <p {...stylex.props(glass.surface, styles.challenge)}>
          <span {...stylex.props(styles.challengeLabel)}>
            {words.challenge.received}
          </span>
          {words.challenge.target(totalOf(rival))}
        </p>
      )}
      <div {...stylex.props(styles.meta)}>
        <span {...stylex.props(styles.round)}>
          {words.round(index + 1, ROUNDS)}
        </span>
        <ol aria-hidden="true" {...stylex.props(styles.pips)}>
          {Array.from({ length: ROUNDS }, (_, i) => {
            const mark = marks[i];

            return (
              <li
                key={i}
                {...stylex.props(
                  styles.pip,
                  i === index && styles.pipNow,
                  mark !== undefined &&
                    styles.tint(verdictColors[verdictOf(mark)])
                )}
              />
            );
          })}
        </ol>
      </div>
      <h2 id="mebunryo-ask" {...stylex.props(styles.ask)}>
        {words.ask[puzzle.kind]}
      </h2>
      <div {...stylex.props(styles.stage)}>
        <svg
          aria-label={words.board}
          onPointerCancel={() => {
            dragging.current = false;
          }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            dragging.current = true;
            aim(event);
          }}
          onPointerMove={(event) => {
            if (dragging.current) {
              aim(event);
            }
          }}
          onPointerUp={() => {
            dragging.current = false;
          }}
          ref={board}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          {...stylex.props(styles.board)}
        >
          <Figure
            animate
            answer={graded?.answer ?? null}
            guess={guess}
            puzzle={puzzle}
          />
        </svg>
      </div>
      <div {...stylex.props(styles.cue)}>
        {graded === null || verdict === null ? (
          <p {...stylex.props(styles.hint)}>
            {words.hint[puzzle.pivot === null ? "point" : "ray"]}
          </p>
        ) : (
          <p aria-live="polite" key={index} {...stylex.props(styles.verdict)}>
            <span
              {...stylex.props(
                styles.word,
                styles.color(verdictColors[verdict])
              )}
            >
              {words.verdict[verdict]}
            </span>
            <span {...stylex.props(styles.numbers)}>
              {`${errorText(graded.error, puzzle.unit)} · ${words.points(graded.points)}`}
              {theirs === undefined ? null : (
                <span {...stylex.props(styles.rival)}>
                  {`${words.challenge.them} ${words.points(theirs)}`}
                </span>
              )}
            </span>
          </p>
        )}
      </div>
      <button
        disabled={graded === null && !ready}
        onClick={graded === null ? onLock : onNext}
        type="button"
        {...stylex.props(styles.action)}
      >
        {label}
      </button>
    </section>
  );
};
