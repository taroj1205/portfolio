import * as stylex from "@stylexjs/stylex";
import { useEffect, useId, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { errorOf } from "../_lib/cut";
import { isRare } from "../_lib/foods";
import {
  kindTitle,
  pieceOf,
  rankOf,
  ratioText,
  shareOf,
  tenths,
} from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import type { Ending } from "../_lib/session";

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

const land = stylex.keyframes({
  "0%": { filter: "blur(10px)", opacity: 0, transform: "scale(1.25)" },
  "100%": { filter: "blur(0)", opacity: 1, transform: "scale(1)" },
});

const shine = stylex.keyframes({
  "0%": { backgroundPosition: "160% 0" },
  "100%": { backgroundPosition: "-60% 0" },
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
    gap: "0.75rem",
    marginInline: "auto",
    maxHeight: { default: "52svh", [WIDE]: "100%" },
    maxWidth: "27rem",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "1.1rem",
    width: "100%",
  },
  rare: {
    boxShadow:
      "0 0 0 1px rgb(255 210 122 / 0.55), 0 0 40px rgb(255 190 80 / 0.25), 0 24px 60px rgb(0 0 0 / 0.35)",
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
  rareBadge: {
    animationDuration: "2.4s",
    animationIterationCount: "infinite",
    animationName: { default: shine, [media.reduce]: "none" },
    animationTimingFunction: "ease-in-out",
    backgroundImage:
      "linear-gradient(110deg, #d9962a 20%, #fff6cf 45%, #ffd27a 55%, #d9962a 80%)",
    backgroundSize: "250% 100%",
  },
  ratio: {
    animationDuration: "520ms",
    animationName: { default: land, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    fontFamily: font.mincho,
    fontSize: "clamp(2.2rem, 11vw, 3rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1,
    margin: 0,
    whiteSpace: "nowrap",
  },
  even: {
    color: GOLD,
  },
  rank: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  kind: {
    color: ink.soft,
    fontSize: "0.85rem",
    fontWeight: 600,
    letterSpacing: "calc(0.06em * var(--track, 1))",
  },
  line: {
    color: ink.soft,
    fontSize: "0.88rem",
    lineHeight: 1.5,
    margin: 0,
  },
  facts: {
    borderColor: "rgb(255 255 255 / 0.12)",
    borderStyle: "solid",
    borderWidth: "1px 0",
    color: ink.soft,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.8rem",
    fontVariantNumeric: "tabular-nums",
    gap: "0.3rem 1rem",
    margin: 0,
    paddingBlock: "0.6rem",
  },
  fact: {
    color: ink.text,
    fontWeight: 700,
  },
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

const versusOf = (small: number, challenge: Result, lang: Lang) => {
  const theirs = pieceOf(challenge);
  if (theirs === null) {
    return null;
  }
  const words = copy[lang].challenge;
  const gap = errorOf(theirs.split.small) - errorOf(small);
  if (gap > 0) {
    return { text: words.won(tenths(gap)), won: true };
  }
  return { text: gap < 0 ? words.lost(tenths(-gap)) : words.tied, won: false };
};

interface ResultSheetProps {
  lang: Lang;
  ending: Ending;
  save: Save | null;
  challenge: Result | null;
  onAgain: () => void;
  onRetry: () => void;
}

export const ResultSheet = ({
  lang,
  ending,
  save,
  challenge,
  onAgain,
  onRetry,
}: ResultSheetProps) => {
  const words = copy[lang];
  const { piece, result, record, challenged } = ending;
  const { small } = piece.split;
  const rank = rankOf(small);
  const rare = isRare(piece.food.kind);
  const versus =
    challenged && challenge !== null ? versusOf(small, challenge, lang) : null;
  const id = useId();
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      aria-labelledby={`${id}-ratio`}
      {...stylex.props(glass.surface, styles.sheet, rare && styles.rare)}
    >
      <div {...stylex.props(styles.head)}>
        <span aria-hidden="true" {...stylex.props(styles.seal)}>
          <span>{rank.seal[0]}</span>
          <span>{rank.seal[1]}</span>
        </span>
        <div {...stylex.props(styles.titles)}>
          {rare || record ? (
            <span {...stylex.props(styles.badges)}>
              {rare ? (
                <span {...stylex.props(styles.badge, styles.rareBadge)}>
                  ✦ {words.rare}
                </span>
              ) : null}
              {record ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.record}
                </span>
              ) : null}
            </span>
          ) : null}
          <h2
            id={`${id}-ratio`}
            {...stylex.props(styles.ratio, small === 500 && styles.even)}
          >
            {ratioText(small)}
          </h2>
          <span id={`${id}-rank`}>
            <span {...stylex.props(styles.rank)}>{rank.name[lang]}</span>{" "}
            <span {...stylex.props(styles.kind)}>
              · {kindTitle(piece.food.kind, lang)}
            </span>
          </span>
        </div>
      </div>
      <p id={`${id}-line`} {...stylex.props(styles.line)}>
        {rank.line[lang]}
      </p>
      <p {...stylex.props(styles.facts)}>
        <span {...stylex.props(styles.fact)}>
          {words.result.off(tenths(errorOf(small)))}
        </span>
        {save !== null && save.bestCut !== null ? (
          <span>{words.record(tenths(save.bestCut), save.cuts)}</span>
        ) : null}
      </p>
      {versus === null ? null : (
        <p {...stylex.props(styles.versus, versus.won && styles.won)}>
          {versus.text}
        </p>
      )}
      <div {...stylex.props(styles.row)}>
        <button
          aria-describedby={`${id}-ratio ${id}-rank ${id}-line`}
          onClick={onAgain}
          ref={again}
          type="button"
          {...stylex.props(styles.action, styles.primary, styles.grow)}
        >
          {words.result.again}
        </button>
        <ShareButton
          fileName="itto.png"
          labels={words.result}
          share={shareOf(result, piece, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.secondary)}
        />
      </div>
      {challenged ? (
        <button
          onClick={onRetry}
          type="button"
          {...stylex.props(styles.action, styles.secondary)}
        >
          {words.challenge.retry}
        </button>
      ) : null}
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
