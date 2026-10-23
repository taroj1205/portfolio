import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import {
  brimful,
  glassOf,
  heightOf,
  lineOf,
  percent,
  rankOf,
  scoreOf,
  seconds,
  shareOf,
  signed,
  spillKind,
  spilledOf,
} from "../_lib/result";
import type { Glass, Result } from "../_lib/result";
import type { Ending } from "../_lib/session";

const GOLD = "#ffd27a";
const SPILL = "#ff8a6a";
const WIDE = "@media (min-aspect-ratio: 1/1) and (min-width: 720px)";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const styles = stylex.create({
  sheet: {
    animationDuration: "650ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    borderRadius: 26,
    bottom: {
      default: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
      [WIDE]: "50%",
    },
    boxShadow: "0 24px 60px rgb(0 0 0 / 0.35)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    insetInline: {
      default: "1rem",
      [WIDE]: "auto max(2rem, calc(env(safe-area-inset-right) + 1rem))",
    },
    marginInline: { default: "auto", [WIDE]: 0 },
    maxHeight: { default: "min(60vh, 30rem)", [WIDE]: "calc(100vh - 2rem)" },
    maxWidth: "26rem",
    outline: "none",
    overflowY: "auto",
    overscrollBehavior: "contain",
    paddingBlock: "1.1rem 0.6rem",
    paddingInline: "1.25rem",
    position: "fixed",
    translate: { default: null, [WIDE]: "0 50%" },
    width: { default: null, [WIDE]: "min(26rem, 40vw)" },
  },
  head: {
    alignItems: "flex-end",
    columnGap: "1rem",
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: "0.4rem",
  },
  titles: {
    display: "flex",
    flexDirection: "column",
    gap: "0.3rem",
    minWidth: 0,
  },
  label: {
    alignItems: "center",
    color: ink.soft,
    display: "flex",
    fontSize: "0.75rem",
    gap: "0.5rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
    margin: 0,
    whiteSpace: "nowrap",
  },
  badge: {
    backgroundImage: "linear-gradient(180deg, #fff1b8, #ffd27a 50%, #d9962a)",
    borderRadius: 999,
    color: "#2a1d05",
    fontSize: "0.66rem",
    fontWeight: 800,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    paddingBlock: "0.15rem",
    paddingInline: "0.55rem",
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
  gold: {
    color: GOLD,
  },
  spill: {
    color: SPILL,
    fontSize: "clamp(2.1rem, 10vw, 2.8rem)",
    letterSpacing: "calc(0.08em * var(--track, 1))",
    whiteSpace: "nowrap",
  },
  unit: {
    fontSize: "0.4em",
    marginInlineStart: "0.15em",
  },
  rank: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    gap: "0.45rem",
    margin: 0,
    paddingBottom: "0.3rem",
  },
  seal: {
    alignItems: "center",
    backgroundColor: "#c8352b",
    borderRadius: 4,
    color: "#fff4ec",
    display: "flex",
    fontSize: "0.85rem",
    height: "1.6rem",
    justifyContent: "center",
    transform: "rotate(-4deg)",
    width: "1.6rem",
  },
  line: {
    fontFamily: font.mincho,
    fontSize: "1rem",
    fontWeight: 700,
    lineHeight: 1.6,
    margin: 0,
    textWrap: "balance",
  },
  notes: {
    color: ink.soft,
    display: "flex",
    flexDirection: "column",
    fontSize: "0.82rem",
    fontVariantNumeric: "tabular-nums",
    gap: "0.2rem",
    margin: 0,
  },
  won: {
    color: GOLD,
    fontWeight: 700,
  },
  actions: {
    display: "grid",
    gap: "0.6rem",
    gridTemplateColumns: "1.4fr 1fr",
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

const Versus = ({
  lang,
  poured,
  challenge,
}: {
  lang: Lang;
  poured: Glass;
  challenge: Result;
}) => {
  const words = copy[lang].challenge;
  const theirs = glassOf(challenge);
  const mine = scoreOf(poured);
  const target = scoreOf(theirs);
  const gap = percent(Math.abs(Math.max(0, mine) - Math.max(0, target)));
  if (mine === target) {
    return (
      <span {...stylex.props(styles.won)}>
        {spilledOf(theirs) ? words.bothSpilled : words.tied}
      </span>
    );
  }
  return mine > target ? (
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
  const { result, record, glass: poured } = ending;
  const words = copy[lang];
  const rank = rankOf(poured);
  const spilled = spilledOf(poured);
  const again = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    again.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      aria-labelledby="masu-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <div {...stylex.props(styles.titles)}>
          <h2 id="masu-result" {...stylex.props(styles.label)}>
            {words.tension}
            {record ? (
              <span {...stylex.props(styles.badge)}>{words.result.record}</span>
            ) : null}
          </h2>
          {spilled ? (
            <p {...stylex.props(styles.score, styles.spill)}>{words.spilled}</p>
          ) : (
            <p {...stylex.props(styles.score, brimful(poured) && styles.gold)}>
              {percent(poured.outcome.tenths)}
              <span {...stylex.props(styles.unit)}>%</span>
            </p>
          )}
        </div>
        <p {...stylex.props(styles.rank)}>
          <span aria-hidden="true" {...stylex.props(styles.seal)}>
            {rank.seal}
          </span>
          {rank.name[lang]}
        </p>
      </div>
      <p {...stylex.props(styles.line)}>{lineOf(poured, lang)}</p>
      <p {...stylex.props(styles.notes)}>
        <span>
          {spilled
            ? words.result.lost(poured.spilled)
            : words.result.stopped(signed(heightOf(poured)), poured.kept)}
          {" · "}
          {spilled && spillKind(poured.outcome) === "held"
            ? words.result.overflowed(seconds(result.hold))
            : words.result.released(seconds(result.hold))}
        </span>
        {challenge === null ? null : (
          <Versus challenge={challenge} lang={lang} poured={poured} />
        )}
      </p>
      <div {...stylex.props(styles.actions)}>
        <button
          onClick={onAgain}
          ref={again}
          type="button"
          {...stylex.props(styles.action, styles.primary)}
        >
          {words.result.again}
        </button>
        <ShareButton
          fileName="masu.png"
          labels={words.result}
          share={shareOf(result, window.location.origin, lang)}
          {...stylex.props(styles.action, styles.share)}
        />
      </div>
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};
