import * as stylex from "@stylexjs/stylex";
import Link from "next/link";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { createStick } from "../_lib/burn";
import { copy } from "../_lib/copy";
import {
  finished,
  formatTime,
  reachedOf,
  shareOf,
  titleOf,
} from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Ending } from "../_lib/session";
import { Ladder } from "./ladder";
import { sparklerDefs, sparklerParts } from "./sparkler-svg";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const kindle = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(0.7)" },
  "100%": { opacity: 1, transform: "scale(1)" },
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
  art: {
    animationDuration: "1.2s",
    animationName: { default: kindle, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    flexShrink: 0,
    height: "6rem",
    overflow: "visible",
    width: "5rem",
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
  end: {
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
  time: {
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
    color: "#ffd27a",
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
  links: {
    display: "flex",
    gap: "1.25rem",
    justifyContent: "center",
  },
  link: {
    color: ink.soft,
    fontSize: "0.78rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    paddingBlock: "0.35rem",
    textDecoration: "none",
  },
});

const Versus = ({
  lang,
  result,
  challenge,
}: {
  lang: Lang;
  result: Result;
  challenge: Result;
}) => {
  const words = copy[lang].result;
  const gap = formatTime(Math.abs(result.time - challenge.time));
  if (result.time === challenge.time) {
    return <span {...stylex.props(styles.won)}>{words.tied}</span>;
  }
  return result.time > challenge.time ? (
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
  const { result, record, end } = ending;
  const words = copy[lang];
  const done = finished(result);
  const reached = reachedOf(result);
  const left = createStick(result.seed).length - result.time;
  const art = sparklerParts({
    id: "senko-result",
    phase: reached,
    scale: 0.62,
    top: -150,
    x: 50,
    y: 64,
  });
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      aria-labelledby="senko-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <svg
          aria-hidden="true"
          viewBox="0 0 100 120"
          {...stylex.props(styles.art)}
        >
          {sparklerDefs("senko-result")}
          {art.back}
          {art.sparks}
          {art.front}
        </svg>
        <div {...stylex.props(styles.titles)}>
          {record || done ? (
            <div {...stylex.props(styles.badges)}>
              {done ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.finished}
                </span>
              ) : null}
              {record ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.record}
                </span>
              ) : null}
            </div>
          ) : (
            <span {...stylex.props(styles.end)}>{words.result.ends[end]}</span>
          )}
          <h2 id="senko-result" {...stylex.props(styles.title)}>
            {titleOf(result, lang)}
          </h2>
          <p {...stylex.props(styles.time)}>
            {formatTime(result.time)}
            <span {...stylex.props(styles.unit)}>{words.unit}</span>
          </p>
        </div>
      </div>
      <Ladder label={words.phases} lang={lang} reached={reached} />
      {challenge !== null || !done ? (
        <p {...stylex.props(styles.notes)}>
          {challenge === null ? null : (
            <Versus challenge={challenge} lang={lang} result={result} />
          )}
          {done ? null : <span>{words.result.left(formatTime(left))}</span>}
        </p>
      ) : null}
      <button
        onClick={onAgain}
        ref={again}
        type="button"
        {...stylex.props(styles.action, styles.primary)}
      >
        {words.result.again}
      </button>
      <ShareButton
        fileName="senko.png"
        labels={words.result}
        share={shareOf(result, window.location.origin, lang)}
        {...stylex.props(styles.action, styles.share)}
      />
      <div {...stylex.props(styles.links)}>
        <Link href="/games" {...stylex.props(styles.link)}>
          {words.result.games}
        </Link>
        <Link href={`/${lang}`} {...stylex.props(styles.link)}>
          {words.result.maker}
        </Link>
      </div>
    </section>
  );
};
