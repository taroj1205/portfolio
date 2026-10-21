import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { bodies } from "../_lib/bodies";
import { copy } from "../_lib/copy";
import { formatScore, shareOf, titleOf } from "../_lib/result";
import type { Ending } from "../_lib/session";
import { BodyIcon } from "./body-icon";
import { Ladder } from "./ladder";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const halo = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(0.6) rotate(0deg)" },
  "40%": { opacity: 1 },
  "100%": { opacity: 1, transform: "scale(1) rotate(180deg)" },
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
    gap: "0.9rem",
    insetInline: "1rem",
    marginInline: "auto",
    maxHeight: "min(82vh, 40rem)",
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
    gap: "1rem",
  },
  trophy: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    height: "5.5rem",
    justifyContent: "center",
    position: "relative",
    width: "5.5rem",
  },
  halo: {
    animationDuration: "1.4s",
    animationFillMode: "forwards",
    animationName: { default: halo, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    backgroundImage:
      "conic-gradient(from 0deg, rgb(255 210 122 / 0), rgb(255 210 122 / 0.45), rgb(160 170 255 / 0), rgb(255 160 200 / 0.4), rgb(255 210 122 / 0))",
    borderRadius: 999,
    filter: "blur(6px)",
    inset: "-0.4rem",
    position: "absolute",
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
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
  over: {
    color: ink.soft,
    fontSize: "0.75rem",
    letterSpacing: "calc(0.16em * var(--track, 1))",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "1.3rem",
    fontWeight: 700,
    margin: 0,
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
    fontSize: "0.36em",
    marginInlineStart: "0.2em",
  },
  stats: {
    color: ink.soft,
    fontSize: "0.85rem",
    margin: 0,
    textAlign: "center",
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

interface ResultSheetProps {
  lang: Lang;
  ending: Ending;
  onAgain: () => void;
}

export const ResultSheet = ({ lang, ending, onAgain }: ResultSheetProps) => {
  const { result, record } = ending;
  const words = copy[lang];
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      aria-labelledby="hoshiai-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.trophy)}>
          <span aria-hidden="true" {...stylex.props(styles.halo)} />
          <BodyIcon size="5.5rem" tier={result.top} />
        </div>
        <div {...stylex.props(styles.titles)}>
          {record || result.galaxies > 0 ? (
            <div {...stylex.props(styles.badges)}>
              {record ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.record}
                </span>
              ) : null}
              {result.galaxies > 0 ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.galaxy}
                  {result.galaxies > 1 ? ` ×${result.galaxies}` : ""}
                </span>
              ) : null}
            </div>
          ) : (
            <span {...stylex.props(styles.over)}>{words.over}</span>
          )}
          <h2 id="hoshiai-result" {...stylex.props(styles.title)}>
            {titleOf(result, lang)}
          </h2>
          <p {...stylex.props(styles.score)}>
            {formatScore(result.score, lang)}
            <span {...stylex.props(styles.unit)}>{words.points}</span>
          </p>
        </div>
      </div>
      <Ladder
        label={words.found(result.top + 1, bodies.length)}
        reached={result.top}
        scale={0.9}
      />
      <p {...stylex.props(styles.stats)}>
        {words.result.stats(result.merges, result.chain)}
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
        fileName="hoshiai.png"
        labels={words.result}
        share={shareOf(result, window.location.origin, lang)}
        {...stylex.props(styles.action, styles.share)}
      />
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
