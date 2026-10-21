import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import {
  brimful,
  heroOf,
  lineOf,
  percent,
  rankOf,
  shareOf,
  tallyOf,
} from "../_lib/result";
import type { Result, Tally } from "../_lib/result";
import { fillOf } from "../_lib/scene";
import type { Ending } from "../_lib/session";
import { cupSvg } from "./cup-svg";

const GOLD = "#ffd27a";
const SPILL = "#ff8a6a";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const settle = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px) scale(0.92)" },
  "100%": { opacity: 1, transform: "none" },
});

const styles = stylex.create({
  sheet: {
    animationDuration: "650ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    borderRadius: 26,
    bottom: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
    boxShadow: "0 24px 60px rgb(0 0 0 / 0.35)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
    insetInline: "1rem",
    marginInline: "auto",
    maxHeight: "min(86vh, 44rem)",
    maxWidth: "26rem",
    outline: "none",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "1.25rem",
    position: "fixed",
  },
  head: {
    alignItems: "center",
    display: "flex",
    gap: "0.9rem",
  },
  art: {
    animationDuration: "900ms",
    animationName: { default: settle, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    flexShrink: 0,
    height: "6.5rem",
    width: "6.5rem",
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    minWidth: 0,
  },
  badges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem",
  },
  badge: {
    backgroundImage: "linear-gradient(180deg, #fff1b8, #ffd27a 50%, #d9962a)",
    borderRadius: 999,
    color: "#2a1d05",
    fontSize: "0.68rem",
    fontWeight: 800,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    paddingBlock: "0.2rem",
    paddingInline: "0.6rem",
  },
  label: {
    color: ink.soft,
    fontSize: "0.75rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  score: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(2.6rem, 13vw, 3.4rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
  },
  unit: {
    fontSize: "0.4em",
    marginInlineStart: "0.15em",
  },
  rank: {
    alignItems: "center",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    fontWeight: 700,
    gap: "0.5rem",
    margin: 0,
  },
  seal: {
    alignItems: "center",
    backgroundColor: "#c8352b",
    borderRadius: 4,
    color: "#fff4ec",
    display: "flex",
    fontSize: "0.85rem",
    height: "1.6rem",
    justifyContent: "center",
    transform: "rotate(-4deg)",
    width: "1.6rem",
  },
  line: {
    fontFamily: font.mincho,
    fontSize: "1.02rem",
    fontWeight: 700,
    lineHeight: 1.6,
    margin: 0,
    textAlign: "center",
    textWrap: "balance",
  },
  pours: {
    display: "grid",
    gap: "0.4rem",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  pour: {
    alignItems: "center",
    backgroundColor: "rgb(255 255 255 / 0.06)",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
    paddingBlock: "0.45rem",
  },
  pourIndex: {
    color: ink.soft,
    fontSize: "0.62rem",
  },
  pourValue: {
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
  },
  gold: {
    color: GOLD,
  },
  spill: {
    color: SPILL,
    fontSize: "0.78rem",
  },
  notes: {
    color: ink.soft,
    display: "flex",
    flexDirection: "column",
    fontSize: "0.85rem",
    gap: "0.25rem",
    margin: 0,
    textAlign: "center",
    textWrap: "balance",
  },
  won: {
    color: GOLD,
    fontWeight: 700,
  },
  action: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    minHeight: "3.2rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  primary: {
    backgroundImage: "linear-gradient(180deg, #fff1b8, #ffd27a 50%, #d9962a)",
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.3)",
    color: "#1c1406",
  },
  share: {
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderColor: "rgb(255 255 255 / 0.2)",
    borderStyle: "solid",
    borderWidth: 1,
  },
});

const Versus = ({
  lang,
  tally,
  challenge,
}: {
  lang: Lang;
  tally: Tally;
  challenge: Result;
}) => {
  const words = copy[lang].challenge;
  const theirs = tallyOf(challenge).average;
  const gap = percent(Math.abs(tally.average - theirs));
  if (tally.average === theirs) {
    return <span {...stylex.props(styles.won)}>{words.tied}</span>;
  }
  return tally.average > theirs ? (
    <span {...stylex.props(styles.won)}>{words.won(gap)}</span>
  ) : (
    <span>{words.lost(gap)}</span>
  );
};

interface ResultSheetProps {
  lang: Lang;
  ending: Ending;
  challenge: Result | null;
  onAgain: () => void;
}

export const ResultSheet = ({
  lang,
  ending,
  challenge,
  onAgain,
}: ResultSheetProps) => {
  const { result, record, tally } = ending;
  const words = copy[lang];
  const rank = rankOf(tally.average);
  const hero = heroOf(tally);
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      aria-labelledby="masu-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <svg
          aria-hidden="true"
          viewBox="-62 -66 124 124"
          {...stylex.props(styles.art)}
        >
          {cupSvg({
            fill: fillOf(hero.pour, hero.outcome.volume),
            id: "masu-hero",
            spilled: hero.outcome.spilledAt !== null,
          })}
        </svg>
        <div {...stylex.props(styles.titles)}>
          {record || tally.spills === 0 ? (
            <div {...stylex.props(styles.badges)}>
              {record ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.record}
                </span>
              ) : null}
              {tally.spills === 0 ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.clean}
                </span>
              ) : null}
            </div>
          ) : null}
          <h2 id="masu-result" {...stylex.props(styles.label)}>
            {words.result.average}
          </h2>
          <p {...stylex.props(styles.score)}>
            {percent(tally.average)}
            <span {...stylex.props(styles.unit)}>%</span>
          </p>
          <p {...stylex.props(styles.rank)}>
            <span aria-hidden="true" {...stylex.props(styles.seal)}>
              {rank.seal}
            </span>
            {rank.name[lang]}
          </p>
        </div>
      </div>
      <p {...stylex.props(styles.line)}>{lineOf(tally, lang)}</p>
      <ol aria-label={words.pours} {...stylex.props(styles.pours)}>
        {tally.glasses.map((each, index) => {
          const spilled = each.outcome.spilledAt !== null;
          return (
            <li
              key={`${index}-${each.outcome.hold}`}
              {...stylex.props(styles.pour)}
            >
              <span {...stylex.props(styles.pourIndex)}>
                {words.mark(index)}
              </span>
              <span
                {...stylex.props(
                  styles.pourValue,
                  spilled && styles.spill,
                  brimful(each.outcome) && styles.gold
                )}
              >
                {spilled ? words.spill : `${percent(each.outcome.tenths)}%`}
              </span>
            </li>
          );
        })}
      </ol>
      <p {...stylex.props(styles.notes)}>
        {challenge === null ? null : (
          <Versus challenge={challenge} lang={lang} tally={tally} />
        )}
        <span>{words.result.poured(tally.kept, tally.spilled)}</span>
      </p>
      <button
        onClick={onAgain}
        ref={again}
        type="button"
        {...stylex.props(styles.action, styles.primary)}
      >
        {words.result.again}
      </button>
      <ShareButton
        fileName="masu.png"
        labels={words.result}
        share={shareOf(result, window.location.origin, lang)}
        {...stylex.props(styles.action, styles.share)}
      />
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
