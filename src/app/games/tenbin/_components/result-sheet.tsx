import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";
import type { AnimationEvent, ReactNode, Ref } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { countText, equivalentsOf } from "../_lib/compare";
import { copy } from "../_lib/copy";
import { nextDayIn, outcomeOf } from "../_lib/daily";
import { rowOf, shareOf } from "../_lib/result";
import type { Shared, Solve } from "../_lib/result";
import { streakOn } from "../_lib/save";
import type { Save } from "../_lib/save";
import { isRounded, weightText } from "../_lib/scale";
import { ItemPicture } from "./item-art";

const GOLD = "#ffd27a";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const styles = stylex.create({
  sheet: {
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
    gap: "0.75rem",
    padding: "1.1rem 1.2rem",
    pointerEvents: "auto",
    width: "100%",
  },
  head: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
  },
  title: {
    fontFamily: font.mincho,
    fontSize: "1.4rem",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    margin: 0,
  },
  row: {
    fontSize: "1.1rem",
    letterSpacing: "0.08em",
    margin: 0,
  },
  answer: {
    borderColor: "rgb(255 210 122 / 0.3)",
    borderRadius: 18,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    paddingBlock: "0.7rem",
    paddingInline: "0.9rem",
  },
  answerHead: {
    alignItems: "center",
    display: "flex",
    gap: "0.8rem",
  },
  answerText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
    minWidth: 0,
  },
  same: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    listStyle: "none",
    margin: 0,
    marginBlock: "0.3rem",
    padding: 0,
  },
  sameRow: {
    alignItems: "center",
    display: "flex",
    fontSize: "0.85rem",
    gap: "0.5rem",
  },
  sameCount: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.15rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    marginInlineStart: "auto",
    whiteSpace: "nowrap",
  },
  label: {
    color: GOLD,
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  weight: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.8rem, 8vw, 2.3rem)",
    fontWeight: 700,
    lineHeight: 1.1,
  },
  detail: {
    color: ink.soft,
    fontSize: "0.82rem",
    lineHeight: 1.5,
  },
  source: {
    color: ink.soft,
    fontSize: "0.78rem",
    overflowWrap: "anywhere",
    textDecorationColor: "rgb(255 255 255 / 0.4)",
    textUnderlineOffset: 3,
  },
  stats: {
    display: "grid",
    gap: "0.4rem",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    margin: 0,
    textAlign: "center",
  },
  stat: {
    display: "flex",
    flexDirection: "column-reverse",
    gap: "0.1rem",
  },
  statValue: {
    fontFamily: font.mincho,
    fontSize: "1.4rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    margin: 0,
  },
  statLabel: {
    color: ink.soft,
    fontSize: "0.68rem",
  },
  bars: {
    display: "flex",
    flexDirection: "column",
    gap: 3,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  bar: {
    alignItems: "center",
    display: "flex",
    fontSize: "0.72rem",
    fontVariantNumeric: "tabular-nums",
    gap: "0.5rem",
  },
  barFill: {
    backgroundColor: "rgb(255 255 255 / 0.16)",
    borderRadius: 4,
    minWidth: "1.4rem",
    paddingInline: "0.4rem",
    textAlign: "end",
  },
  barMine: {
    backgroundColor: "#5ee08a",
    color: "#10141f",
    fontWeight: 800,
  },
  width: (width: string) => ({ width }),
  note: {
    color: ink.soft,
    fontSize: "0.8rem",
    margin: 0,
    textAlign: "center",
  },
  actions: {
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
    fontSize: "1rem",
    fontWeight: 700,
    gap: "0.5rem",
    justifyContent: "center",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    minHeight: "3.1rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingInline: "0.6rem",
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
  secondary: {
    backgroundColor: "rgb(255 255 255 / 0.08)",
    borderColor: "rgb(255 255 255 / 0.2)",
    borderStyle: "solid",
    borderWidth: 1,
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
});

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));

  const parts = [
    Math.floor(total / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
  ];

  return parts.map((part) => String(part).padStart(2, "0")).join(":");
};

const NextIn = ({ lang }: { lang: Lang }) => {
  const [left, setLeft] = useState(() => nextDayIn(Date.now()));
  useEffect(() => {
    const timer = setInterval(() => {
      setLeft(nextDayIn(Date.now()));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <p {...stylex.props(styles.note)}>{copy[lang].result.next(clock(left))}</p>
  );
};

const useOpening = () => {
  const first = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLElement>(null);
  useEffect(() => {
    const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
    sheet.current?.scrollIntoView({
      behavior: calm ? "auto" : "smooth",
      block: "nearest",
    });

    if (calm) {
      first.current?.focus({ preventScroll: true });
    }
  }, []);

  return {
    first,
    onAnimationEnd: (event: AnimationEvent<HTMLElement>) => {
      if (event.target === event.currentTarget) {
        first.current?.focus({ preventScroll: true });
      }
    },
    sheet,
  };
};

const Sheet = ({
  label,
  ref,
  onAnimationEnd,
  children,
}: {
  label: string;
  ref: Ref<HTMLElement>;
  onAnimationEnd: (event: AnimationEvent<HTMLElement>) => void;
  children: ReactNode;
}) => (
  <section
    aria-label={label}
    onAnimationEnd={onAnimationEnd}
    ref={ref}
    {...stylex.props(glass.surface, styles.sheet)}
  >
    {children}
  </section>
);

const Stats = ({
  day,
  lang,
  save,
  tries,
}: {
  day: number;
  lang: Lang;
  save: Save;
  tries: number | null;
}) => {
  const words = copy[lang].result;
  const { daily } = save;
  const most = Math.max(1, ...daily.solvedIn);

  const rate =
    daily.played === 0 ? 0 : Math.round((daily.won / daily.played) * 100);

  const cells = [
    [words.played, String(daily.played)],
    [words.rate, `${rate}%`],
    [words.streak, String(streakOn(save, day))],
    [words.longest, String(daily.longest)],
  ] as const;

  return (
    <>
      <dl {...stylex.props(styles.stats)}>
        {cells.map(([name, value]) => (
          <div key={name} {...stylex.props(styles.stat)}>
            <dt {...stylex.props(styles.statLabel)}>{name}</dt>
            <dd {...stylex.props(styles.statValue)}>{value}</dd>
          </div>
        ))}
      </dl>
      <ol aria-label={words.solvedIn} {...stylex.props(styles.bars)}>
        {daily.solvedIn.map((count, i) => (
          <li key={i} {...stylex.props(styles.bar)}>
            <span>{i + 1}</span>
            <span
              {...stylex.props(
                styles.barFill,
                tries === i + 1 && styles.barMine,
                styles.width(`${Math.round((count / most) * 100)}%`)
              )}
            >
              {count}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
};

interface DailySheetProps {
  lang: Lang;
  solve: Solve;
  save: Save;
  onVersus: () => void;
  onToday: () => void;
}

export const DailySheet = ({
  lang,
  solve,
  save,
  onVersus,
  onToday,
}: DailySheetProps) => {
  const words = copy[lang].result;
  const { item, grades } = solve;
  const won = outcomeOf(grades) === "won";
  const { day } = solve;
  const { first, sheet, onAnimationEnd } = useOpening();
  const shared: Shared = { kind: "daily", solve };
  const equivalents = equivalentsOf(item);

  return (
    <Sheet
      label={won ? words.won(grades.length) : words.lost}
      onAnimationEnd={onAnimationEnd}
      ref={sheet}
    >
      <div {...stylex.props(styles.head)}>
        <h3 {...stylex.props(styles.title)}>
          {won ? words.won(grades.length) : words.lost}
        </h3>
        <p aria-hidden="true" {...stylex.props(styles.row)}>
          {rowOf(grades)}
        </p>
      </div>
      <div {...stylex.props(styles.answer)}>
        <div {...stylex.props(styles.answerHead)}>
          <ItemPicture id={item.id} size="4.6rem" />
          <div {...stylex.props(styles.answerText)}>
            <span {...stylex.props(styles.label)}>{words.answer}</span>
            <span {...stylex.props(styles.weight)}>
              {isRounded(item.grams) ? words.about : ""}
              {weightText(item.grams, lang)}
            </span>
          </div>
        </div>
        <span {...stylex.props(styles.detail)}>{item.detail[lang]}</span>
        {equivalents.length > 0 ? (
          <>
            <span {...stylex.props(styles.label)}>{words.same}</span>
            <ul {...stylex.props(styles.same)}>
              {equivalents.map(({ item: unit, count }) => (
                <li key={unit.id} {...stylex.props(styles.sameRow)}>
                  <ItemPicture id={unit.id} size="2.2rem" />
                  <span>{unit.name[lang]}</span>
                  <span {...stylex.props(styles.sameCount)}>
                    {countText(count, lang)}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <a
          href={item.source.url}
          rel="noopener noreferrer"
          target="_blank"
          {...stylex.props(styles.source)}
        >
          {`${words.source}: ${item.source.name}`}
        </a>
      </div>
      {day === null ? (
        <p {...stylex.props(styles.note)}>{words.practiceNote}</p>
      ) : (
        <>
          <Stats
            day={day}
            lang={lang}
            save={save}
            tries={won ? grades.length : null}
          />
          <NextIn lang={lang} />
        </>
      )}
      <div {...stylex.props(styles.actions)}>
        <ShareButton
          fileName="tenbin.png"
          labels={words}
          share={shareOf(shared, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.primary)}
        />
        <button
          onClick={day === null ? onToday : onVersus}
          ref={first}
          type="button"
          {...stylex.props(styles.action, styles.secondary)}
        >
          {day === null ? words.today : words.toVersus}
        </button>
      </div>
      <SheetLinks labels={words} lang={lang} />
    </Sheet>
  );
};

interface VersusSheetProps {
  lang: Lang;
  chain: number;
  best: number;
  record: boolean;
  onAgain: () => void;
  onToday: () => void;
}

export const VersusSheet = ({
  lang,
  chain,
  best,
  record,
  onAgain,
  onToday,
}: VersusSheetProps) => {
  const words = copy[lang];
  const { first, sheet, onAnimationEnd } = useOpening();

  return (
    <Sheet
      label={words.versus.over(chain)}
      onAnimationEnd={onAnimationEnd}
      ref={sheet}
    >
      <div {...stylex.props(styles.head)}>
        <h3 {...stylex.props(styles.title)}>{words.versus.over(chain)}</h3>
        {record ? (
          <span {...stylex.props(styles.badge)}>{words.versus.record}</span>
        ) : null}
      </div>
      {best > 0 ? (
        <p {...stylex.props(styles.note)}>{words.versus.best(best)}</p>
      ) : null}
      <div {...stylex.props(styles.actions)}>
        <button
          onClick={onAgain}
          ref={first}
          type="button"
          {...stylex.props(styles.action, styles.primary)}
        >
          {words.result.again}
        </button>
        {chain > 0 ? (
          <ShareButton
            fileName="tenbin.png"
            labels={words.result}
            share={shareOf(
              { chain, kind: "versus" },
              window.location.origin,
              lang
            )}
            {...stylex.props(styles.action, styles.secondary)}
          />
        ) : (
          <button
            onClick={onToday}
            type="button"
            {...stylex.props(styles.action, styles.secondary)}
          >
            {words.result.today}
          </button>
        )}
      </div>
      <SheetLinks labels={words.result} lang={lang} />
    </Sheet>
  );
};
