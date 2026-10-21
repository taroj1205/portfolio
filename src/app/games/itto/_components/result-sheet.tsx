import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { kindTitle, rankOf, scoreOf, shareOf, tenths } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Ending } from "../_lib/session";
import { CutThumb } from "./cut-thumb";
import { markOf } from "./hud";

const GOLD = "#ffd27a";
const VERMILION = "#c8352b";
const WIDE = "@media (min-width: 900px) and (min-aspect-ratio: 1/1)";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "none" },
});

const stamp = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(1.7) rotate(-5deg)" },
  "60%": { opacity: 1, transform: "scale(0.94) rotate(-5deg)" },
  "100%": { opacity: 1, transform: "scale(1) rotate(-5deg)" },
});

const styles = stylex.create({
  sheet: {
    alignSelf: { default: "stretch", [WIDE]: "center" },
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
    maxHeight: { default: "62svh", [WIDE]: "100%" },
    maxWidth: "27rem",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "1.15rem",
    width: "100%",
  },
  head: {
    alignItems: "center",
    display: "flex",
    gap: "1rem",
  },
  seal: {
    alignItems: "center",
    animationDelay: "250ms",
    animationDuration: "420ms",
    animationFillMode: "backwards",
    animationName: { default: stamp, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    backgroundColor: VERMILION,
    borderRadius: 8,
    boxShadow:
      "inset 0 0 0 3px rgb(255 255 255 / 0.14), 0 6px 20px rgb(120 20 10 / 0.45)",
    color: "#fff4ec",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "1.3rem",
    fontWeight: 700,
    height: "3.9rem",
    justifyContent: "center",
    lineHeight: 1.05,
    transform: "rotate(-5deg)",
    width: "3.9rem",
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
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
  total: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    fontFamily: font.mincho,
    fontWeight: 700,
    gap: "0.2rem 0.5rem",
    margin: 0,
  },
  totalLabel: {
    color: ink.soft,
    fontSize: "0.85rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
  },
  totalValue: {
    fontSize: "clamp(2rem, 9vw, 2.6rem)",
    fontVariantNumeric: "tabular-nums",
    lineHeight: 1,
  },
  rank: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  line: {
    color: ink.soft,
    fontSize: "0.88rem",
    lineHeight: 1.5,
    margin: 0,
  },
  cuts: {
    borderColor: "rgb(255 255 255 / 0.12)",
    borderStyle: "solid",
    borderWidth: "1px 0",
    display: "grid",
    gap: "0.3rem",
    gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
    listStyle: "none",
    margin: 0,
    paddingBlock: "0.7rem",
    paddingInline: 0,
  },
  cut: {
    alignItems: "center",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    minWidth: 0,
    paddingBlock: "0.25rem",
    position: "relative",
  },
  best: {
    backgroundColor: "rgb(255 210 122 / 0.12)",
    boxShadow: "inset 0 0 0 1px rgb(255 210 122 / 0.45)",
  },
  thumb: {
    aspectRatio: "1",
    width: "100%",
  },
  kind: {
    color: ink.soft,
    fontSize: "0.66rem",
    maxWidth: "100%",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  ratio: {
    fontFamily: font.mincho,
    fontSize: "clamp(0.62rem, 2.6vw, 0.74rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  colon: {
    color: ink.soft,
    marginInline: "0.12em",
  },
  mark: {
    borderRadius: 999,
    height: 7,
    insetBlockStart: 6,
    insetInlineEnd: 6,
    position: "absolute",
    width: 7,
  },
  tint: (colour: string) => ({ backgroundColor: colour }),
  versus: {
    color: ink.soft,
    fontSize: "0.9rem",
    margin: 0,
    textAlign: "center",
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
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    minHeight: "3.2rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingInline: "1.4rem",
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
  secondary: {
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderColor: "rgb(255 255 255 / 0.2)",
    borderStyle: "solid",
    borderWidth: 1,
  },
  row: {
    display: "flex",
    gap: "0.6rem",
  },
  grow: {
    flexGrow: 1,
  },
});

const versusOf = (total: number, challenge: Result, lang: Lang) => {
  const theirs = scoreOf(challenge);
  if (theirs === null) {
    return null;
  }
  const words = copy[lang].challenge;
  const gap = theirs.total - total;
  if (gap > 0) {
    return { text: words.won(tenths(gap)), won: true };
  }
  return { text: gap < 0 ? words.lost(tenths(-gap)) : words.tied, won: false };
};

interface ResultSheetProps {
  lang: Lang;
  ending: Ending;
  challenge: Result | null;
  onAgain: () => void;
  onQuit: () => void;
}

export const ResultSheet = ({
  lang,
  ending,
  challenge,
  onAgain,
  onQuit,
}: ResultSheetProps) => {
  const words = copy[lang];
  const { scored, result, record, challenged } = ending;
  const rank = rankOf(scored.total);
  const versus =
    challenged && challenge !== null
      ? versusOf(scored.total, challenge, lang)
      : null;
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      aria-labelledby="itto-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <span aria-hidden="true" {...stylex.props(styles.seal)}>
          <span>{rank.seal[0]}</span>
          <span>{rank.seal[1]}</span>
        </span>
        <div {...stylex.props(styles.titles)}>
          {record ? (
            <span {...stylex.props(styles.badge)}>{words.result.record}</span>
          ) : null}
          <h2 id="itto-result" {...stylex.props(styles.total)}>
            <span {...stylex.props(styles.totalLabel)}>{words.result.off}</span>
            <span {...stylex.props(styles.totalValue)}>
              {tenths(scored.total)}%
            </span>
          </h2>
          <span {...stylex.props(styles.rank)}>{rank.name[lang]}</span>
        </div>
      </div>
      <p {...stylex.props(styles.line)}>{rank.line[lang]}</p>
      {versus === null ? null : (
        <p
          aria-live="polite"
          {...stylex.props(styles.versus, versus.won && styles.won)}
        >
          {versus.text}
        </p>
      )}
      <ol aria-label={words.result.cuts} {...stylex.props(styles.cuts)}>
        {scored.pieces.map((piece, index) => (
          <li
            key={`${piece.food.kind}-${index}`}
            {...stylex.props(styles.cut, piece === scored.best && styles.best)}
          >
            <span
              aria-hidden="true"
              {...stylex.props(
                styles.mark,
                styles.tint(markOf(piece.split.small))
              )}
            />
            <CutThumb piece={piece} xstyle={styles.thumb} />
            <span {...stylex.props(styles.ratio)}>
              {tenths(piece.split.small)}
              <span {...stylex.props(styles.colon)}>:</span>
              {tenths(1000 - piece.split.small)}
            </span>
            <span {...stylex.props(styles.kind)}>
              {kindTitle(piece.food.kind, lang)}
            </span>
          </li>
        ))}
      </ol>
      <div {...stylex.props(styles.row)}>
        <button
          onClick={onAgain}
          ref={again}
          type="button"
          {...stylex.props(styles.action, styles.primary, styles.grow)}
        >
          {words.result.again}
        </button>
        <button
          onClick={onQuit}
          type="button"
          {...stylex.props(styles.action, styles.secondary)}
        >
          {words.quit}
        </button>
      </div>
      <ShareButton
        fileName="itto.png"
        labels={words.result}
        share={shareOf(result, scored, window.location.origin, lang)}
        {...stylex.props(styles.action, styles.secondary)}
      />
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
