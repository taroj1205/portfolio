import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { formatGap, formatTime, moonsOf, nextOf, rankOf } from "../_lib/judge";
import { gapOf, shareOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import { officialOf } from "../_lib/save";
import type { Save } from "../_lib/save";
import type { Ending } from "../_lib/session";
import { reveal } from "./reveal.stylex";

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
    animationDelay: reveal.sheet,
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
    maxHeight: { default: "48svh", "@media (min-width: 900px)": "100%" },
    maxWidth: "26rem",
    outline: "none",
    overflowY: "auto",
    overscrollBehavior: "contain",
    padding: "1.15rem 1.25rem",
    pointerEvents: "auto",
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
  plain: {
    backgroundColor: "rgb(255 255 255 / 0.12)",
    backgroundImage: "none",
    color: ink.text,
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
  moons: {
    flexShrink: 0,
    fontSize: "1.05rem",
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
    backgroundImage: "linear-gradient(180deg, #ffffff, #dfe6ff 55%, #aab8ee)",
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(170 190 255 / 0.3)",
    color: "#0b1230",
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

const versus = (result: Result, challenge: Result, lang: Lang) => {
  const words = copy[lang].result;
  const mine = Math.abs(gapOf(result));
  const theirs = Math.abs(gapOf(challenge));

  if (mine < theirs) {
    return { strong: true, text: words.won(formatTime(theirs - mine)) };
  }

  if (mine > theirs) {
    return { strong: false, text: words.lost(formatTime(mine - theirs)) };
  }

  return { strong: true, text: words.tied };
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
  const { result, record, official, today } = ending;
  const words = copy[lang];
  const gap = gapOf(result);
  const rank = rankOf(gap);
  const next = nextOf(gap);
  const kept = today && !official ? officialOf(save, result.day) : null;
  const shared = kept ?? result;
  const against = challenge === null ? null : versus(result, challenge, lang);
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
      aria-labelledby="ma-result"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          focus();
        }
      }}
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.titles)}>
          {record || today ? (
            <div {...stylex.props(styles.badges)}>
              {record ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.record}
                </span>
              ) : null}
              {today ? (
                <span
                  {...stylex.props(styles.badge, !official && styles.plain)}
                >
                  {official ? words.result.official : words.result.practice}
                </span>
              ) : null}
            </div>
          ) : null}
          <h2 id="ma-result" {...stylex.props(styles.rank)}>
            {rank.name[lang]}
          </h2>
          <p {...stylex.props(styles.line)}>{rank.line[lang]}</p>
        </div>
        <p aria-hidden="true" {...stylex.props(styles.moons)}>
          {moonsOf(rank.level)}
        </p>
      </div>
      <ul {...stylex.props(styles.notes)}>
        <li {...stylex.props(styles.note)}>
          {next === null
            ? words.result.top
            : words.result.next(next.rank.name[lang], formatTime(next.closer))}
        </li>
        {against === null ? null : (
          <li {...stylex.props(styles.note, against.strong && styles.strong)}>
            {against.text}
          </li>
        )}
        {today && official && save.daily.streak > 1 ? (
          <li {...stylex.props(styles.note)}>
            {words.result.streak(save.daily.streak)}
          </li>
        ) : null}
        {kept === null ? null : (
          <li {...stylex.props(styles.note)}>
            {words.result.practiceNote(formatGap(gapOf(kept)))}
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
          fileName="ma.png"
          labels={words.result}
          share={shareOf(shared, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.share)}
        />
      </div>
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
