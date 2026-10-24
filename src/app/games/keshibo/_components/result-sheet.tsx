import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { nextRankOf, pointsText, rankOf, shareOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { scoreOf, tallyOf } from "../_lib/score";
import type { Ending } from "../_lib/session";
import { EraserPicture } from "./eraser-picture";

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
    animationDelay: "500ms",
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
    gap: "0.8rem",
    marginInline: "auto",
    maxHeight: "52svh",
    maxWidth: "26rem",
    outline: "none",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "1.15rem 1.25rem",
    pointerEvents: "auto",
    width: "100%",
  },
  head: {
    alignItems: "center",
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
    fontSize: "1.5rem",
    fontWeight: 700,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    margin: 0,
  },
  line: {
    color: ink.soft,
    fontSize: "0.85rem",
    margin: 0,
  },
  score: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    gap: "0.2rem",
  },
  points: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "2.2rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    lineHeight: 1,
    margin: 0,
  },
  thumb: {
    height: "2.2rem",
    width: "3rem",
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
  row: {
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
    backgroundImage: `linear-gradient(180deg, #fff1b8, ${GOLD} 50%, #d9962a)`,
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(255 190 80 / 0.28)",
    color: "#1c1406",
  },
  quiet: {
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderColor: "rgb(255 255 255 / 0.2)",
    borderStyle: "solid",
    borderWidth: 1,
  },
  change: {
    backgroundColor: "transparent",
    borderWidth: 0,
    color: ink.soft,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.82rem",
    fontWeight: 700,
    justifySelf: "center",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    outlineColor: GOLD,
    paddingBlock: "0.4rem",
    textDecorationLine: "underline",
    textUnderlineOffset: "0.25em",
  },
});

const versus = (score: number, challenge: Result, lang: Lang) => {
  const words = copy[lang].result;
  const theirs = scoreOf(challenge.rolls);

  if (score > theirs) {
    return { strong: true, text: words.won };
  }

  if (score < theirs) {
    return { strong: false, text: words.lost };
  }

  return { strong: true, text: words.tied };
};

interface ResultSheetProps {
  lang: Lang;
  ending: Ending;
  save: Save;
  challenge: Result | null;
  onAgain: () => void;
  onWorkshop: () => void;
}

export const ResultSheet = ({
  lang,
  ending,
  save,
  challenge,
  onAgain,
  onWorkshop,
}: ResultSheetProps) => {
  const { result, record } = ending;
  const words = copy[lang];
  const score = scoreOf(result.rolls);
  const tally = tallyOf(result.rolls);
  const rank = rankOf(score);
  const next = nextRankOf(score);
  const against = challenge === null ? null : versus(score, challenge, lang);
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
      aria-labelledby="keshibo-result"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          focus();
        }
      }}
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.titles)}>
          {record ? (
            <span {...stylex.props(styles.badge)}>{words.result.record}</span>
          ) : null}
          <h2 id="keshibo-result" {...stylex.props(styles.rank)}>
            {rank.name[lang]}
          </h2>
          <p {...stylex.props(styles.line)}>{rank.line[lang]}</p>
        </div>
        <div {...stylex.props(styles.score)}>
          <p {...stylex.props(styles.points)}>{pointsText(score, lang)}</p>
          <span {...stylex.props(styles.thumb)}>
            <EraserPicture design={result.design} />
          </span>
        </div>
      </div>
      <ul {...stylex.props(styles.notes)}>
        <li {...stylex.props(styles.note)}>
          {words.result.marks(tally.strikes, tally.spares)}
        </li>
        <li {...stylex.props(styles.note)}>
          {next === null
            ? words.result.top
            : words.result.next(next.rank.name[lang], next.gap)}
        </li>
        {against === null ? null : (
          <li {...stylex.props(styles.note, against.strong && styles.strong)}>
            {against.text}
          </li>
        )}
        {record || save.best === score ? null : (
          <li {...stylex.props(styles.note)}>{words.best(save.best)}</li>
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
          fileName="keshibo.png"
          labels={words.result}
          share={shareOf(result, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.quiet)}
        />
      </div>
      <button
        onClick={onWorkshop}
        type="button"
        {...stylex.props(styles.change)}
      >
        {words.result.change}
      </button>
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
