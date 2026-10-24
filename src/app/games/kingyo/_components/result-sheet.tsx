import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { kindIds, kinds } from "../_lib/fish";
import {
  barOf,
  countOf,
  countText,
  nextOf,
  rankOf,
  shareOf,
} from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import type { Ending } from "../_lib/session";

const GOLD = "#ffd27a";

const rise = stylex.keyframes({
  "0%": {
    opacity: 0,
    transform: "translateY(28px) scale(0.98)",
    visibility: "hidden",
  },
  "100%": {
    opacity: 1,
    transform: "translateY(0) scale(1)",
    visibility: "visible",
  },
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
    maxHeight: { default: "50svh", "@media (min-width: 900px)": "100%" },
    maxWidth: "26rem",
    outline: "none",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "1.15rem 1.25rem",
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
  rank: {
    fontFamily: font.mincho,
    fontSize: "1.55rem",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    margin: 0,
  },
  line: {
    color: ink.soft,
    fontSize: "0.86rem",
    margin: 0,
  },
  score: {
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "1.9rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
  },
  scoreClear: {
    color: GOLD,
  },
  catches: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem",
    margin: 0,
  },
  catch: {
    alignItems: "baseline",
    backgroundColor: "rgb(255 255 255 / 0.07)",
    borderColor: "rgb(255 255 255 / 0.14)",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    gap: "0.4rem",
    paddingBlock: "0.2rem",
    paddingInline: "0.65rem",
  },
  kind: {
    color: ink.soft,
    fontSize: "0.78rem",
  },
  many: {
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    margin: 0,
  },
  bar: {
    fontSize: "1rem",
    letterSpacing: "0.04em",
    margin: 0,
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
    paddingBlock: "0.7rem 0",
    paddingInline: 0,
  },
  note: {
    color: ink.soft,
    fontSize: "0.85rem",
    lineHeight: 1.5,
  },
  strong: {
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
    minHeight: "3.1rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  primary: {
    backgroundImage: "linear-gradient(180deg, #fff6f8, #fbd3dd 55%, #e99bb0)",
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(246 160 186 / 0.3)",
    color: "#3a1020",
  },
  share: {
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderColor: "rgb(255 255 255 / 0.2)",
    borderStyle: "solid",
    borderWidth: 1,
  },
  row: {
    display: "grid",
    gap: "0.6rem",
    gridTemplateColumns: "1fr 1fr",
  },
});

const versus = (count: number, challenge: Result, lang: Lang) => {
  const words = copy[lang].result;
  const theirs = countOf(challenge);
  if (count > theirs) {
    return { strong: true, text: words.won };
  }
  if (count < theirs) {
    return { strong: false, text: words.lost };
  }
  return { strong: true, text: words.tied };
};

const nextText = (count: number, lang: Lang) => {
  const words = copy[lang].result;
  const next = nextOf(count);
  return next === null
    ? words.top
    : words.more(next.rank.name[lang], next.more);
};

interface ResultSheetProps {
  lang: Lang;
  ending: Ending;
  save: Save;
  challenge: Result | null;
  onAgain: () => void;
}

export const ResultSheet = ({
  lang,
  ending,
  save,
  challenge,
  onAgain,
}: ResultSheetProps) => {
  const { result, record, firsts, biggest } = ending;
  const words = copy[lang];
  const count = countOf(result);
  const rank = rankOf(count);
  const against = challenge === null ? null : versus(count, challenge, lang);
  const caught = kindIds.filter((id) => result.catches[id] > 0);
  const again = useRef<HTMLButtonElement>(null);
  const focus = () => {
    again.current?.focus({ preventScroll: true });
  };
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      again.current?.focus({ preventScroll: true });
    }
  }, []);
  return (
    <section
      aria-labelledby="kingyo-result"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          focus();
        }
      }}
      {...stylex.props(glass.surface, styles.sheet)}
    >
      {record || firsts.length > 0 ? (
        <div {...stylex.props(styles.badges)}>
          {record ? (
            <span {...stylex.props(styles.badge)}>{words.result.record}</span>
          ) : null}
          {firsts.map((id) => (
            <span key={id} {...stylex.props(styles.badge)}>
              {words.result.first(kinds[id].name[lang])}
            </span>
          ))}
        </div>
      ) : null}
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.titles)}>
          <h2 id="kingyo-result" {...stylex.props(styles.rank)}>
            {rank.name[lang]}
          </h2>
          <p {...stylex.props(styles.line)}>{rank.line[lang]}</p>
        </div>
        <p {...stylex.props(styles.score, count > 0 && styles.scoreClear)}>
          {countText(count, lang)}
        </p>
      </div>
      <p aria-hidden="true" {...stylex.props(styles.bar)}>
        {barOf(result)}
      </p>
      {caught.length === 0 ? null : (
        <dl aria-label={words.result.catch} {...stylex.props(styles.catches)}>
          {caught.map((id) => (
            <div key={id} {...stylex.props(styles.catch)}>
              <dt {...stylex.props(styles.kind)}>{kinds[id].name[lang]}</dt>
              <dd {...stylex.props(styles.many)}>{result.catches[id]}</dd>
            </div>
          ))}
        </dl>
      )}
      <ul {...stylex.props(styles.notes)}>
        <li {...stylex.props(styles.note)}>{nextText(count, lang)}</li>
        {against === null ? null : (
          <li {...stylex.props(styles.note, against.strong && styles.strong)}>
            {against.text}
          </li>
        )}
        {biggest > 1 ? (
          <li {...stylex.props(styles.note)}>
            {words.result.biggest(biggest)}
          </li>
        ) : null}
        {save.best === count ? null : (
          <li {...stylex.props(styles.note)}>
            {words.best(countText(save.best, lang))}
          </li>
        )}
      </ul>
      <div {...stylex.props(styles.row)}>
        <button
          onClick={onAgain}
          ref={again}
          type="button"
          {...stylex.props(styles.action, styles.primary)}
        >
          {words.result.again}
        </button>
        <ShareButton
          fileName="kingyo.png"
          labels={words.result}
          share={shareOf(result, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.share)}
        />
      </div>
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
