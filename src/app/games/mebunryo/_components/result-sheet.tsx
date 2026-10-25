import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Point } from "../../_lib/svg";
import { copy } from "../_lib/copy";
import { SIZE, errorText, totalOf } from "../_lib/puzzles";
import type { Graded, Puzzle } from "../_lib/puzzles";
import { rankOf, shareOf, verdictColors, verdictOf } from "../_lib/result";
import { Figure, paint } from "./figure";

const GOLD = "#ffd27a";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const styles = stylex.create({
  sheet: {
    animationDuration: "650ms",
    animationFillMode: "backwards",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    borderRadius: 26,
    boxShadow: "0 24px 60px rgb(0 0 0 / 0.35)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    gap: "0.9rem",
    marginInline: "auto",
    maxWidth: "40rem",
    padding: "1.1rem 1.2rem",
    width: "100%",
  },
  head: {
    alignItems: "flex-end",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.4rem 1rem",
    justifyContent: "space-between",
  },
  rank: {
    fontFamily: font.mincho,
    fontSize: "1.45rem",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    margin: 0,
  },
  total: {
    alignItems: "baseline",
    display: "flex",
    gap: "0.45rem",
  },
  totalValue: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "clamp(2.6rem, 12vw, 3.4rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    textShadow: "0 0 24px rgb(255 210 122 / 0.45)",
  },
  totalLabel: {
    color: ink.soft,
    fontSize: "0.8rem",
  },
  note: {
    alignItems: "center",
    color: ink.soft,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.85rem",
    gap: "0.5rem",
    margin: 0,
  },
  badge: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderRadius: 999,
    color: "#2a1d05",
    fontSize: "0.7rem",
    fontWeight: 800,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    paddingBlock: "0.2rem",
    paddingInline: "0.6rem",
  },
  duel: {
    alignItems: "center",
    borderColor: "rgb(255 210 122 / 0.3)",
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.3rem 1rem",
    justifyContent: "space-between",
    paddingBlock: "0.7rem",
    paddingInline: "0.9rem",
  },
  duelResult: {
    fontFamily: font.mincho,
    fontSize: "1.25rem",
    fontWeight: 700,
  },
  duelScores: {
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
  },
  grid: {
    display: "grid",
    gap: "0.6rem",
    gridTemplateColumns: {
      default: "repeat(5, minmax(0, 1fr))",
      "@media (max-width: 560px)": "repeat(2, minmax(0, 1fr))",
    },
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    margin: 0,
  },
  board: {
    aspectRatio: "1",
    borderRadius: 12,
    borderStyle: "solid",
    borderWidth: 3,
    display: "block",
    overflow: "hidden",
    width: "100%",
  },
  edge: (color: string) => ({ borderColor: color }),
  caption: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.75rem",
    fontVariantNumeric: "tabular-nums",
    gap: "0.1rem 0.4rem",
    justifyContent: "space-between",
  },
  ask: {
    color: ink.soft,
    fontSize: "0.72rem",
    lineHeight: 1.35,
  },
  points: {
    fontWeight: 800,
  },
  color: (color: string) => ({ color }),
  legend: {
    color: ink.soft,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.75rem",
    gap: "0.3rem 1rem",
    margin: 0,
  },
  key: {
    alignItems: "center",
    display: "inline-flex",
    gap: "0.35rem",
  },
  swatch: {
    borderRadius: 999,
    display: "inline-block",
    height: 10,
    width: 10,
  },
  fill: (color: string) => ({ backgroundColor: color }),
  actions: {
    display: "grid",
    gap: "0.6rem",
    gridTemplateColumns: "1fr 1fr",
  },
  action: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "1rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    minHeight: "3.1rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingInline: "0.6rem",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  primary: {
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.3)",
    color: "#1c1406",
  },
  secondary: {
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderColor: "rgb(255 255 255 / 0.2)",
    borderStyle: "solid",
    borderWidth: 1,
  },
});

const Duel = ({
  lang,
  mine,
  theirs,
}: {
  lang: Lang;
  mine: number;
  theirs: number;
}) => {
  const words = copy[lang].challenge;
  let outcome = words.tied;

  if (mine !== theirs) {
    outcome = mine > theirs ? words.won : words.lost;
  }

  return (
    <div {...stylex.props(styles.duel)}>
      <span {...stylex.props(styles.duelResult)}>{outcome}</span>
      <span {...stylex.props(styles.duelScores)}>
        {`${copy[lang].result.you} ${mine} – ${theirs} ${words.them}`}
      </span>
    </div>
  );
};

interface ResultSheetProps {
  lang: Lang;
  seed: number;
  puzzles: readonly Puzzle[];
  guesses: readonly Point[];
  graded: readonly Graded[];
  rival: readonly number[] | null;
  best: number;
  record: boolean;
  onAgain: () => void;
}

export const ResultSheet = ({
  lang,
  seed,
  puzzles,
  guesses,
  graded,
  rival,
  best,
  record,
  onAgain,
}: ResultSheetProps) => {
  const words = copy[lang];
  const marks = graded.map((one) => one.points);
  const total = totalOf(marks);
  const again = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      aria-labelledby="mebunryo-rank"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <h2 id="mebunryo-rank" {...stylex.props(styles.rank)}>
          {words.result.rank[rankOf(total)]}
        </h2>
        <div {...stylex.props(styles.total)}>
          <span {...stylex.props(styles.totalValue)}>{total}</span>
          <span {...stylex.props(styles.totalLabel)}>{words.result.total}</span>
        </div>
      </div>
      <p {...stylex.props(styles.note)}>
        {record ? (
          <span {...stylex.props(styles.badge)}>{words.result.record}</span>
        ) : null}
        {words.result.best(best)}
      </p>
      {rival === null ? null : (
        <Duel lang={lang} mine={total} theirs={totalOf(rival)} />
      )}
      <p aria-hidden="true" {...stylex.props(styles.legend)}>
        <span {...stylex.props(styles.key)}>
          <span {...stylex.props(styles.swatch, styles.fill(paint.guess))} />
          {words.result.you}
        </span>
        <span {...stylex.props(styles.key)}>
          <span {...stylex.props(styles.swatch, styles.fill(paint.answer))} />
          {words.result.answer}
        </span>
      </p>
      <ol {...stylex.props(styles.grid)}>
        {puzzles.map((puzzle, i) => {
          const one = graded[i];
          const guess = guesses[i];

          if (one === undefined || guess === undefined) {
            return null;
          }

          const color = verdictColors[verdictOf(one.points)];
          const theirs = rival?.[i];

          return (
            <li key={puzzle.kind} {...stylex.props(styles.card)}>
              <svg
                aria-hidden="true"
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                {...stylex.props(styles.board, styles.edge(color))}
              >
                <Figure
                  answer={one.answer}
                  guess={guess}
                  puzzle={puzzle}
                  size={1.6}
                />
              </svg>
              <span {...stylex.props(styles.ask)}>
                {`${i + 1}. ${words.ask[puzzle.kind]}`}
              </span>
              <span {...stylex.props(styles.caption)}>
                <span>{errorText(one.error, puzzle.unit)}</span>
                <span {...stylex.props(styles.points, styles.color(color))}>
                  {words.points(one.points)}
                </span>
                {theirs === undefined ? null : (
                  <span>{`${words.challenge.them} ${theirs}`}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <div {...stylex.props(styles.actions)}>
        <ShareButton
          fileName="mebunryo.png"
          labels={words.result}
          share={shareOf({ marks, seed }, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.primary)}
        />
        <button
          onClick={onAgain}
          ref={again}
          type="button"
          {...stylex.props(styles.action, styles.secondary)}
        >
          {words.result.again}
        </button>
      </div>
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
