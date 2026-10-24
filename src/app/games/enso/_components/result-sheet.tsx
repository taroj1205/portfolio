import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { formatScore, nextRank, rankOf, shareOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Ending } from "../_lib/session";
import { clamp01 } from "../_lib/stroke";

const COUNT_DELAY = 350;
const COUNT_LENGTH = 1100;

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const styles = stylex.create({
  sheet: {
    alignSelf: { default: "stretch", "@media (min-width: 900px)": "center" },
    animationDuration: "650ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    borderRadius: 26,
    boxShadow: "0 24px 60px rgb(0 0 0 / 0.35)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    gap: "0.8rem",
    marginInline: "auto",
    maxHeight: { default: "58svh", "@media (min-width: 900px)": "100%" },
    maxWidth: "26rem",
    outline: "none",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "1.25rem",
    width: "100%",
  },
  head: {
    alignItems: "flex-end",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    minWidth: 0,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundImage: "linear-gradient(180deg, #fff1b8, #ffd27a 50%, #d9962a)",
    borderRadius: 999,
    color: "#2a1d05",
    fontSize: "0.68rem",
    fontWeight: 800,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    paddingBlock: "0.2rem",
    paddingInline: "0.6rem",
  },
  rank: {
    fontFamily: font.mincho,
    fontSize: "1.45rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    margin: 0,
  },
  line: {
    color: ink.soft,
    fontSize: "0.85rem",
    margin: 0,
  },
  score: {
    alignItems: "baseline",
    display: "flex",
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "clamp(2.8rem, 14vw, 3.6rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
  },
  unit: {
    fontSize: "0.4em",
    marginInlineStart: "0.1em",
  },
  notes: {
    borderColor: "rgb(255 255 255 / 0.12)",
    borderStyle: "solid",
    borderWidth: "1px 0 0",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    listStyle: "none",
    margin: 0,
    paddingBlock: "0.75rem 0",
    paddingInline: 0,
  },
  note: {
    color: ink.soft,
    fontSize: "0.85rem",
    lineHeight: 1.5,
  },
  strong: {
    color: "#ffd27a",
    fontWeight: 700,
  },
  hidden: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  action: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    minHeight: "3.2rem",
    outlineColor: "#ffd27a",
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

const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

const useCount = (target: number) => {
  const [shown, setShown] = useState(() => (calm() ? target : 0));
  useEffect(() => {
    const start = performance.now() + COUNT_DELAY;
    let frame = 0;

    const step = (now: number) => {
      const k = clamp01((now - start) / COUNT_LENGTH);
      setShown(target * (1 - (1 - k) ** 3));

      if (k < 1) {
        frame = requestAnimationFrame(step);
      }
    };

    if (!calm()) {
      frame = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target]);

  return shown;
};

const versus = (score: number, challenge: Result, lang: Lang) => {
  const words = copy[lang].result;
  const gap = Math.round((score - challenge.score) * 10) / 10;

  if (gap > 0) {
    return words.won(formatScore(gap));
  }

  if (gap < 0) {
    return words.lost(formatScore(-gap));
  }

  return words.tied;
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
  const { result, record, flaw } = ending;
  const words = copy[lang];
  const rank = rankOf(result.score);
  const next = nextRank(result.score);
  const shown = useCount(result.score);
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section
      aria-labelledby="enso-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.titles)}>
          {record ? (
            <span {...stylex.props(styles.badge)}>{words.result.record}</span>
          ) : null}
          <h2 id="enso-result" {...stylex.props(styles.rank)}>
            {rank.name[lang]}
            <span {...stylex.props(styles.hidden)}>
              {" "}
              {formatScore(result.score)}
            </span>
          </h2>
          <p {...stylex.props(styles.line)}>{rank.line[lang]}</p>
        </div>
        <p aria-hidden="true" {...stylex.props(styles.score)}>
          {shown.toFixed(1)}
          <span {...stylex.props(styles.unit)}>%</span>
        </p>
      </div>
      <ul {...stylex.props(styles.notes)}>
        {flaw === null ? null : (
          <li {...stylex.props(styles.note, styles.strong)}>
            {words.result.flaws[flaw]}
          </li>
        )}
        <li {...stylex.props(styles.note)}>
          {next === null
            ? words.result.top
            : words.result.next(
                next.name[lang],
                formatScore(Math.round((next.min - result.score) * 10) / 10)
              )}
        </li>
        {challenge === null ? null : (
          <li {...stylex.props(styles.note)}>
            {versus(result.score, challenge, lang)}
          </li>
        )}
      </ul>
      <button
        onClick={onAgain}
        ref={again}
        type="button"
        {...stylex.props(styles.action, styles.primary)}
      >
        {words.result.again}
      </button>
      <ShareButton
        fileName="enso.png"
        labels={words.result}
        share={shareOf(result, window.location.origin, lang)}
        {...stylex.props(styles.action, styles.share)}
      />
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
