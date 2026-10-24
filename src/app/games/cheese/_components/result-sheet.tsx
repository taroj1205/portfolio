import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { dataUri, spriteDoc } from "../../_lib/svg";
import { plates } from "../_lib/art";
import { copy } from "../_lib/copy";
import { dishes } from "../_lib/dishes";
import { heights } from "../_lib/heights";
import {
  cmOf,
  isMoon,
  lengthText,
  measure,
  nextOf,
  reachedBy,
  shareOf,
  titleOf,
} from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import type { Ending } from "../_lib/session";

const GOLD = "#ffd27a";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const bob = stylex.keyframes({
  "0%, 100%": { transform: "translateY(0) rotate(-4deg)" },
  "50%": { transform: "translateY(-6px) rotate(3deg)" },
});

const light = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(0.4)" },
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
    gap: "0.85rem",
    insetInline: "1rem",
    marginInline: "auto",
    maxHeight: "min(84vh, 42rem)",
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
    animationDuration: "3.2s",
    animationIterationCount: "infinite",
    animationName: { default: bob, [media.reduce]: "none" },
    flexShrink: 0,
    height: "6.2rem",
    width: "4.6rem",
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
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
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
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "1.3rem",
    fontWeight: 700,
    margin: 0,
  },
  length: {
    alignItems: "baseline",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "clamp(2.4rem, 12vw, 3.3rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
    whiteSpace: "nowrap",
  },
  unit: {
    fontSize: "0.4em",
    marginInlineStart: "0.15em",
  },
  dish: {
    color: ink.soft,
    fontSize: "0.78rem",
    letterSpacing: "calc(0.08em * var(--track, 1))",
  },
  trail: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.05rem",
    justifyContent: "center",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  step: {
    filter: "grayscale(1)",
    fontSize: "1.05rem",
    lineHeight: 1,
    opacity: 0.28,
  },
  reached: {
    animationDuration: "500ms",
    animationFillMode: "backwards",
    animationName: { default: light, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    filter: "none",
    opacity: 1,
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
  delay: (index: number) => ({
    animationDelay: `${0.25 + index * 0.07}s`,
  }),
  share: {
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderColor: "rgb(255 255 255 / 0.2)",
    borderStyle: "solid",
    borderWidth: 1,
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
  const gap = lengthText(Math.abs(cmOf(result) - cmOf(challenge)), lang);
  if (result.mm === challenge.mm) {
    return <span {...stylex.props(styles.won)}>{words.tied}</span>;
  }
  return result.mm > challenge.mm ? (
    <span {...stylex.props(styles.won)}>{words.won(gap)}</span>
  ) : (
    <span>{words.lost(gap)}</span>
  );
};

interface ResultSheetProps {
  lang: Lang;
  ending: Ending;
  challenge: Result | null;
  save: Save | null;
  onAgain: () => void;
}

export const ResultSheet = ({
  lang,
  ending,
  challenge,
  save,
  onAgain,
}: ResultSheetProps) => {
  const { result, record, end, sweet } = ending;
  const words = copy[lang];
  const moon = isMoon(result);
  const reached = reachedBy(result);
  const next = nextOf(cmOf(result));
  const { unit, value } = measure(cmOf(result));
  const { held, crown } = plates[result.dish];
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      aria-labelledby="cheese-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <svg
          aria-hidden="true"
          viewBox={`${held.box.x} ${-crown} ${held.box.w} ${crown + 60}`}
          {...stylex.props(styles.art)}
        >
          <image
            height={held.box.h}
            href={dataUri(spriteDoc(held, 0.4))}
            width={held.box.w}
            x={held.box.x}
            y={held.box.y}
          />
        </svg>
        <div {...stylex.props(styles.titles)}>
          {record || moon ? (
            <div {...stylex.props(styles.badges)}>
              {moon ? (
                <span {...stylex.props(styles.badge)}>{words.result.moon}</span>
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
          <h2 id="cheese-result" {...stylex.props(styles.title)}>
            {titleOf(result, lang)}
          </h2>
          <p {...stylex.props(styles.length)}>
            {value}
            <span {...stylex.props(styles.unit)}>{unit}</span>
          </p>
          <span {...stylex.props(styles.dish)}>
            {challenge === null ? words.today : words.dish}{" "}
            {dishes[result.dish].name[lang]}
          </span>
        </div>
      </div>
      <ol aria-label={titleOf(result, lang)} {...stylex.props(styles.trail)}>
        {heights.map((height, i) => (
          <li
            aria-hidden={i > reached}
            key={height.cm}
            title={height.name[lang]}
            {...stylex.props(
              styles.step,
              i <= reached && styles.reached,
              i <= reached && styles.delay(i)
            )}
          >
            {height.emoji}
          </li>
        ))}
      </ol>
      <p {...stylex.props(styles.notes)}>
        {challenge === null ? null : (
          <Versus challenge={challenge} lang={lang} result={result} />
        )}
        {next === null ? null : (
          <span>
            {words.result.next(
              next.height.name[lang],
              lengthText(next.left, lang)
            )}
          </span>
        )}
        {sweet > 0.5 ? (
          <span>{words.result.sweet(sweet.toFixed(1))}</span>
        ) : null}
        {save !== null && !record && save.dishes[result.dish] > result.mm ? (
          <span>
            {words.best(lengthText(save.dishes[result.dish] / 10, lang))}
          </span>
        ) : null}
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
        fileName="cheese.png"
        labels={words.result}
        share={shareOf(result, window.location.origin, lang)}
        {...stylex.props(styles.action, styles.share)}
      />
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
