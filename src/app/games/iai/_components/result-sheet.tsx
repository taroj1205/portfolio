import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { glass } from "../../_components/glass";
import { ShareButton } from "../../_components/share-button";
import { SheetLinks } from "../../_components/sheet-links";
import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import {
  formatMs,
  isEarly,
  lineOf,
  rankOf,
  reachText,
  shareOf,
} from "../_lib/result";
import type { Challenge, Result } from "../_lib/result";
import type { Ending, Verdict } from "../_lib/session";
import { verdictTitle } from "./outcome";

const GOLD = "#ffd27a";
const SIDE = "@media (min-aspect-ratio: 1/1) and (min-width: 760px)";
const VERMILION = "#c8352b";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(28px) scale(0.98)" },
  "100%": { opacity: 1, transform: "translateY(0) scale(1)" },
});

const stamp = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(1.7) rotate(-5deg)" },
  "60%": { opacity: 1, transform: "scale(0.94) rotate(-5deg)" },
  "100%": { opacity: 1, transform: "scale(1) rotate(-5deg)" },
});

const styles = stylex.create({
  sheet: {
    animationDuration: "650ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    borderRadius: 26,
    bottom: {
      default: "max(1rem, calc(env(safe-area-inset-bottom) + 0.5rem))",
      [SIDE]: "auto",
    },
    boxShadow: "0 24px 60px rgb(0 0 0 / 0.35)",
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    insetInlineEnd: {
      default: "1rem",
      [SIDE]: "max(2rem, env(safe-area-inset-right))",
    },
    insetInlineStart: { default: "1rem", [SIDE]: "auto" },
    marginInline: { default: "auto", [SIDE]: 0 },
    maxHeight: { default: "min(56svh, 40rem)", [SIDE]: "calc(100svh - 7rem)" },
    top: { default: "auto", [SIDE]: "5.5rem" },
    width: { default: null, [SIDE]: "26rem" },
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
  sealLost: {
    backgroundColor: "#24222e",
    color: "rgb(255 255 255 / 0.85)",
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
  reach: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.6rem, 8.4vw, 2.4rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.06em * var(--track, 1))",
    lineHeight: 1.1,
    margin: 0,
    textWrap: "balance",
  },
  rank: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  line: {
    color: ink.soft,
    fontSize: "0.88rem",
    lineHeight: 1.5,
    margin: 0,
  },
  stats: {
    borderColor: "rgb(255 255 255 / 0.12)",
    borderStyle: "solid",
    borderWidth: "1px 0",
    display: "grid",
    gap: "0.5rem",
    gridTemplateColumns: "1fr 1fr",
    margin: 0,
    paddingBlock: "0.75rem",
  },
  stat: {
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    margin: 0,
    textAlign: "center",
  },
  statLabel: {
    color: ink.soft,
    fontSize: "0.72rem",
    letterSpacing: "calc(0.14em * var(--track, 1))",
  },
  statValue: {
    fontFamily: font.mincho,
    fontSize: "1.6rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    margin: 0,
  },
  steps: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.35rem 0.6rem",
    justifyContent: "center",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  step: {
    color: "rgb(255 255 255 / 0.35)",
    fontFamily: font.mincho,
    fontSize: "0.82rem",
    fontWeight: 700,
  },
  beaten: {
    color: ink.soft,
    textDecorationColor: VERMILION,
    textDecorationLine: "line-through",
    textDecorationThickness: 2,
  },
  stopped: {
    color: GOLD,
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
});

const useFirstFocus = () => {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return ref;
};

const Stat = ({ label, value }: { label: string; value: number | null }) => (
  <p {...stylex.props(styles.stat)}>
    <span {...stylex.props(styles.statLabel)}>{label}</span>
    <span {...stylex.props(styles.statValue)}>
      {value === null ? "—" : formatMs(value)}
    </span>
  </p>
);

interface RunProps {
  lang: Lang;
  result: Result;
  fastest: boolean;
  furthest: boolean;
  onAgain: () => void;
  onSharing: (open: boolean) => void;
}

const Run = ({
  lang,
  result,
  fastest,
  furthest,
  onAgain,
  onSharing,
}: RunProps) => {
  const words = copy[lang];
  const rank = rankOf(result.reach);
  const again = useFirstFocus();
  const fooled = isEarly(result.end);
  return (
    <section
      aria-labelledby="iai-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <span
          aria-hidden="true"
          {...stylex.props(styles.seal, result.reach === 0 && styles.sealLost)}
        >
          <span>{rank.seal[0]}</span>
          <span>{rank.seal[1]}</span>
        </span>
        <div {...stylex.props(styles.titles)}>
          {fastest || furthest ? (
            <div {...stylex.props(styles.badges)}>
              {furthest ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.furthest}
                </span>
              ) : null}
              {fastest ? (
                <span {...stylex.props(styles.badge)}>
                  {words.result.record}
                </span>
              ) : null}
            </div>
          ) : null}
          <h2 id="iai-result" {...stylex.props(styles.reach)}>
            {fooled && result.reach === 0
              ? words.verdict.early
              : reachText(result.reach, lang)}
          </h2>
          <span {...stylex.props(styles.rank)}>{rank.name[lang]}</span>
        </div>
      </div>
      <p {...stylex.props(styles.line)}>{lineOf(result, lang)}</p>
      <div {...stylex.props(styles.stats)}>
        <Stat label={words.result.fastest} value={result.best} />
        <Stat label={words.result.average} value={result.average} />
      </div>
      <ol aria-label={words.ladder} {...stylex.props(styles.steps)}>
        {words.rivals.map((rival, index) => (
          <li
            key={rival.name}
            {...stylex.props(
              styles.step,
              index < result.reach && styles.beaten,
              index === result.reach && styles.stopped
            )}
          >
            {rival.title}
          </li>
        ))}
      </ol>
      <button
        onClick={onAgain}
        ref={again}
        type="button"
        {...stylex.props(styles.action, styles.primary)}
      >
        {words.result.again}
      </button>
      <ShareButton
        fileName="iai.png"
        labels={words.result}
        onOpenChange={onSharing}
        share={shareOf(result, window.location.origin, lang)}
        {...stylex.props(styles.action, styles.secondary)}
      />
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};

const challengeLine = (verdict: Verdict, lang: Lang) => {
  const words = copy[lang].challenge;
  const { call, left, right } = verdict;
  if (call.kind === "early") {
    return { text: words.early, won: false };
  }
  if (call.kind === "draw") {
    return { text: words.tied, won: false };
  }
  if (
    call.kind === "cut" &&
    call.side === "left" &&
    left !== null &&
    right !== null
  ) {
    return { text: words.won(formatMs(right - left)), won: true };
  }
  return {
    text:
      left === null || right === null
        ? words.slow
        : words.lost(formatMs(left - right)),
    won: false,
  };
};

const sealOf = (verdict: Verdict) => {
  if (verdict.call.kind === "draw") {
    return "分";
  }
  return verdict.call.kind === "cut" && verdict.call.side === "left"
    ? "勝"
    : "負";
};

interface DuelProps {
  lang: Lang;
  verdict: Verdict;
  challenge: Challenge;
  fastest: boolean;
  onAgain: () => void;
  onLadder: () => void;
}

const Duel = ({
  lang,
  verdict,
  challenge,
  fastest,
  onAgain,
  onLadder,
}: DuelProps) => {
  const words = copy[lang];
  const again = useFirstFocus();
  const line = challengeLine(verdict, lang);
  const seal = sealOf(verdict);
  return (
    <section
      aria-labelledby="iai-result"
      {...stylex.props(glass.surface, styles.sheet)}
    >
      <div {...stylex.props(styles.head)}>
        <span
          aria-hidden="true"
          {...stylex.props(styles.seal, seal !== "勝" && styles.sealLost)}
        >
          <span>{seal}</span>
        </span>
        <div {...stylex.props(styles.titles)}>
          {fastest ? (
            <div {...stylex.props(styles.badges)}>
              <span {...stylex.props(styles.badge)}>{words.result.record}</span>
            </div>
          ) : null}
          <span {...stylex.props(styles.rank)}>{words.challenge.received}</span>
          <h2 id="iai-result" {...stylex.props(styles.reach)}>
            {verdictTitle(verdict, lang).title}
          </h2>
        </div>
      </div>
      <p
        aria-live="polite"
        {...stylex.props(styles.versus, line.won && styles.won)}
      >
        {line.text}
      </p>
      <div {...stylex.props(styles.stats)}>
        <Stat label={words.you} value={verdict.left} />
        <Stat label={words.challenge.who} value={challenge.best} />
      </div>
      <button
        onClick={onAgain}
        ref={again}
        type="button"
        {...stylex.props(styles.action, styles.primary)}
      >
        {words.challenge.again}
      </button>
      <button
        onClick={onLadder}
        type="button"
        {...stylex.props(styles.action, styles.secondary)}
      >
        {words.challenge.ladder}
      </button>
      <SheetLinks labels={words.result} lang={lang} />
    </section>
  );
};

interface ResultSheetProps {
  lang: Lang;
  ending: Ending;
  challenge: Challenge | null;
  onAgain: () => void;
  onLadder: () => void;
  onSharing: (open: boolean) => void;
}

export const ResultSheet = ({
  lang,
  ending,
  challenge,
  onAgain,
  onLadder,
  onSharing,
}: ResultSheetProps) => {
  if (ending.mode === "solo") {
    return (
      <Run
        fastest={ending.fastest}
        furthest={ending.furthest}
        lang={lang}
        onAgain={onAgain}
        onSharing={onSharing}
        result={ending.result}
      />
    );
  }
  return challenge === null ? null : (
    <Duel
      challenge={challenge}
      fastest={ending.fastest}
      lang={lang}
      onAgain={onAgain}
      onLadder={onLadder}
      verdict={ending.verdict}
    />
  );
};
