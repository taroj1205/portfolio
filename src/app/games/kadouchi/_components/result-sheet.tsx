import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { prizeSprites, prizeUri } from "../_lib/art";
import { copy } from "../_lib/copy";
import { kinds, scoreOf } from "../_lib/prizes";
import { nextOf, pointsText, rankOf, shareOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import type { Ending } from "../_lib/session";

const GOLD = "#ffd27a";
const SIZE = 0.17;

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
  shelf: {
    alignItems: "flex-end",
    backgroundImage:
      "linear-gradient(180deg, rgb(255 255 255 / 0.04), rgb(168 103 58 / 0.35))",
    borderRadius: 14,
    display: "flex",
    flexWrap: "wrap",
    flexShrink: 0,
    gap: "0.3rem",
    justifyContent: "center",
    listStyle: "none",
    margin: 0,
    minHeight: "4.2rem",
    paddingBlock: "0.5rem",
    paddingInline: "0.6rem",
  },
  item: {
    display: "flex",
    position: "relative",
  },
  prize: {
    display: "block",
    flexShrink: 0,
    overflow: "visible",
  },
  hidden: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  empty: {
    alignSelf: "center",
    color: ink.soft,
    fontSize: "0.86rem",
  },
  label: {
    color: ink.soft,
    fontSize: "0.72rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
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
    backgroundImage: "linear-gradient(180deg, #fff1d6, #ffc27a 55%, #e0562a)",
    borderWidth: 0,
    boxShadow: "0 10px 30px rgb(224 86 42 / 0.3)",
    color: "#3a1206",
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

const versus = (score: number, challenge: Result, lang: Lang) => {
  const words = copy[lang].result;
  const theirs = scoreOf(challenge.got);

  if (score > theirs) {
    return { strong: true, text: words.won };
  }

  if (score < theirs) {
    return { strong: false, text: words.lost };
  }

  return { strong: true, text: words.tied };
};

const nextText = (score: number, lang: Lang) => {
  const words = copy[lang].result;
  const next = nextOf(score);

  return next === null
    ? words.top
    : words.more(next.rank.name[lang], pointsText(next.more, lang));
};

const PrizeShelf = ({ got, lang }: { got: Result["got"]; lang: Lang }) => {
  const words = copy[lang].result;

  return (
    <ul aria-label={words.prizes} {...stylex.props(styles.shelf)}>
      {got.length === 0 ? (
        <li {...stylex.props(styles.empty)}>{words.none}</li>
      ) : (
        got.map((id) => {
          const { box } = prizeSprites[id];

          return (
            <li key={id} {...stylex.props(styles.item)}>
              <svg
                aria-hidden="true"
                height={box.h * SIZE}
                viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
                width={box.w * SIZE}
                {...stylex.props(styles.prize)}
              >
                <image
                  height={box.h}
                  href={prizeUri(id)}
                  width={box.w}
                  x={box.x}
                  y={box.y}
                />
              </svg>
              <span {...stylex.props(styles.hidden)}>
                {kinds[id].name[lang]}
              </span>
            </li>
          );
        })
      )}
    </ul>
  );
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
  const { result, record, first } = ending;
  const words = copy[lang];
  const score = scoreOf(result.got);
  const rank = rankOf(score);
  const fresh = save.runs > 1 ? first : [];
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
      aria-labelledby="kadouchi-result"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) {
          focus();
        }
      }}
      {...stylex.props(glass.surface, styles.sheet)}
    >
      {record || fresh.length > 0 ? (
        <div {...stylex.props(styles.badges)}>
          {record ? (
            <span {...stylex.props(styles.badge)}>{words.result.record}</span>
          ) : null}
          {fresh.map((id) => (
            <span key={id} {...stylex.props(styles.badge)}>
              {words.result.first(kinds[id].name[lang])}
            </span>
          ))}
        </div>
      ) : null}
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.titles)}>
          <h2 id="kadouchi-result" {...stylex.props(styles.rank)}>
            {rank.name[lang]}
          </h2>
          <p {...stylex.props(styles.line)}>{rank.line[lang]}</p>
        </div>
        <p {...stylex.props(styles.score, score > 0 && styles.scoreClear)}>
          {pointsText(score, lang)}
        </p>
      </div>
      <p {...stylex.props(styles.label)}>{words.result.prizes}</p>
      <PrizeShelf got={result.got} lang={lang} />
      <ul {...stylex.props(styles.notes)}>
        <li {...stylex.props(styles.note)}>{nextText(score, lang)}</li>
        {against === null ? null : (
          <li {...stylex.props(styles.note, against.strong && styles.strong)}>
            {against.text}
          </li>
        )}
        {save.best === score ? null : (
          <li {...stylex.props(styles.note)}>
            {words.best(pointsText(save.best, lang))}
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
          fileName="kadouchi.png"
          labels={words.result}
          share={shareOf(result, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.share)}
        />
      </div>
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
