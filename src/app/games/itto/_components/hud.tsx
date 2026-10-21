import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { errorOf } from "../_lib/cut";
import { RUN } from "../_lib/foods";
import {
  gradeOf,
  kindTitle,
  rankOf,
  ratioText,
  scoreOf,
  tenths,
  verdictOf,
} from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import type { View } from "../_lib/session";
import { CutThumb } from "./cut-thumb";

const GOLD = "#ffd27a";
const VERMILION = "#e0503c";
const FINE = "@media (hover: hover) and (pointer: fine)";

const marks = ["#62b86f", "#f2c94c", "#f2994a", "#e5534b"] as const;

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(10px)" },
  "100%": { opacity: 1, transform: "none" },
});

const nudge = stylex.keyframes({
  "0%, 100%": { transform: "translateX(0)" },
  "20%": { transform: "translateX(-6px)" },
  "45%": { transform: "translateX(5px)" },
  "70%": { transform: "translateX(-3px)" },
});

const land = stylex.keyframes({
  "0%": { filter: "blur(10px)", opacity: 0, transform: "scale(1.35)" },
  "100%": { filter: "blur(0)", opacity: 1, transform: "scale(1)" },
});

const styles = stylex.create({
  top: {
    alignItems: "center",
    display: "flex",
    gap: "0.6rem",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "0.7rem",
  },
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.6rem",
    fontWeight: 700,
    letterSpacing: "0.3em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
  },
  lead: {
    color: GOLD,
    fontSize: "0.42em",
    letterSpacing: "0.4em",
    marginBlockEnd: "0.35em",
  },
  corner: {
    display: "flex",
    gap: "0.45rem",
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    height: "2.75rem",
    justifyContent: "center",
    outlineColor: GOLD,
    outlineOffset: 3,
    padding: 0,
    transform: { default: null, ":active": "scale(0.92)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
    width: "2.75rem",
  },
  pill: {
    fontSize: "0.8rem",
    fontWeight: 700,
    letterSpacing: "calc(0.08em * var(--track, 1))",
    paddingInline: "1rem",
    width: "auto",
  },
  progress: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    justifyContent: "center",
    margin: 0,
    minHeight: "1.5rem",
  },
  count: {
    color: ink.soft,
    fontFamily: font.mincho,
    fontSize: "0.9rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    textShadow: shade.small,
  },
  dots: {
    display: "flex",
    gap: "0.4rem",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  dot: {
    backgroundColor: "rgb(255 255 255 / 0.18)",
    borderRadius: 999,
    height: 10,
    transitionDuration: "300ms",
    transitionProperty: "background-color, box-shadow",
    width: 10,
  },
  dotNow: {
    boxShadow: `0 0 0 2px ${GOLD}`,
  },
  tint: (colour: string) => ({ backgroundColor: colour }),
  panel: {
    alignItems: "center",
    animationDuration: "500ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    marginInline: "auto",
    maxWidth: "26rem",
    textAlign: "center",
    width: "100%",
  },
  rule: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    margin: 0,
  },
  ruleLead: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.3rem, 5.6vw, 1.7rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
    textShadow: shade.large,
    textWrap: "balance",
  },
  ruleBody: {
    color: ink.soft,
    fontSize: "0.86rem",
    lineHeight: 1.6,
    textWrap: "balance",
  },
  action: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "1.1rem",
    fontWeight: 700,
    justifyContent: "center",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    minHeight: "3.3rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingInline: "1.2rem",
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
  row: {
    display: "flex",
    gap: "0.6rem",
    width: "100%",
  },
  grow: {
    flexGrow: 1,
  },
  label: {
    color: ink.soft,
    fontSize: "0.75rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    margin: 0,
  },
  keys: {
    color: ink.soft,
    display: { default: "none", [FINE]: "block" },
    fontSize: "0.75rem",
    letterSpacing: "calc(0.08em * var(--track, 1))",
    margin: 0,
  },
  hint: {
    fontFamily: font.mincho,
    fontSize: "1.1rem",
    fontWeight: 700,
    letterSpacing: "calc(0.14em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
    textWrap: "balance",
  },
  miss: {
    animationDuration: "420ms",
    animationName: { default: nudge, [media.reduce]: "none" },
    color: GOLD,
  },
  verdict: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.15rem",
    margin: 0,
  },
  ratio: {
    animationDuration: "520ms",
    animationName: { default: land, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    fontFamily: font.mincho,
    fontSize: "clamp(2.6rem, 13vw, 3.6rem)",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    letterSpacing: "0.02em",
    lineHeight: 1,
    textShadow: shade.large,
    whiteSpace: "nowrap",
  },
  even: {
    color: GOLD,
  },
  call: {
    color: GOLD,
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
    letterSpacing: "calc(0.18em * var(--track, 1))",
  },
  off: {
    color: VERMILION,
  },
  card: {
    alignItems: "center",
    borderRadius: 18,
    display: "flex",
    gap: "0.8rem",
    paddingBlock: "0.55rem",
    paddingInline: "0.6rem 1rem",
    textAlign: "start",
    width: "100%",
  },
  thumb: {
    flexShrink: 0,
    height: "3.6rem",
    width: "3.6rem",
  },
  cardText: {
    display: "flex",
    flexDirection: "column",
    gap: "0.1rem",
    margin: 0,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
  },
});

export const markOf = (small: number) => marks[gradeOf(small)];

const Speaker = ({ muted }: { muted: boolean }) => (
  <svg
    aria-hidden="true"
    fill="none"
    height="20"
    viewBox="0 0 24 24"
    width="20"
  >
    <path
      d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeWidth="1.8"
    />
    {muted ? (
      <path
        d="m16 9.5 5 5m0-5-5 5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    ) : (
      <path
        d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    )}
  </svg>
);

interface HeaderProps {
  lang: Lang;
  muted: boolean;
  playing: boolean;
  onLang: () => void;
  onMute: (muted: boolean) => void;
  onQuit: () => void;
}

export const Header = ({
  lang,
  muted,
  playing,
  onLang,
  onMute,
  onQuit,
}: HeaderProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";
  return (
    <header {...stylex.props(styles.top)}>
      <div {...stylex.props(styles.brand)}>
        <BackToGames label={words.back} />
        <h1 lang="ja" {...stylex.props(styles.title)}>
          <span {...stylex.props(styles.lead)}>いっとう</span>
          一刀
        </h1>
      </div>
      <div {...stylex.props(styles.corner)}>
        <Toggle
          aria-label={words.mute}
          onPressedChange={onMute}
          pressed={muted}
          {...stylex.props(glass.surface, styles.button)}
        >
          <Speaker muted={muted} />
        </Toggle>
        {playing ? (
          <button
            onClick={onQuit}
            type="button"
            {...stylex.props(glass.surface, styles.button, styles.pill)}
          >
            {words.quit}
          </button>
        ) : (
          <button
            lang={other}
            onClick={onLang}
            type="button"
            {...stylex.props(glass.surface, styles.button, styles.pill)}
          >
            {langNames[other]}
          </button>
        )}
      </div>
    </header>
  );
};

export const Progress = ({ view, lang }: { view: View; lang: Lang }) => (
  <div {...stylex.props(styles.progress)}>
    <span {...stylex.props(styles.count)}>
      {copy[lang].round(view.index, RUN)} · {kindTitle(view.food.kind, lang)}
    </span>
    <ol aria-hidden="true" {...stylex.props(styles.dots)}>
      {Array.from({ length: RUN }, (_, index) => {
        const done = view.pieces[index];
        return (
          <li
            key={index}
            {...stylex.props(
              styles.dot,
              done !== undefined && styles.tint(markOf(done.split.small)),
              done === undefined && index === view.index && styles.dotNow
            )}
          />
        );
      })}
    </ol>
  </div>
);

const Primary = ({
  label,
  onClick,
  focus,
}: {
  label: string;
  onClick: () => void;
  focus: boolean;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (focus) {
      ref.current?.focus({ preventScroll: true });
    }
  }, [focus]);
  return (
    <button
      onClick={onClick}
      ref={ref}
      type="button"
      {...stylex.props(styles.action, styles.primary, styles.grow)}
    >
      {label}
    </button>
  );
};

const ChallengeCard = ({
  challenge,
  lang,
}: {
  challenge: Result;
  lang: Lang;
}) => {
  const words = copy[lang];
  const scored = scoreOf(challenge);
  if (scored === null) {
    return null;
  }
  return (
    <div {...stylex.props(glass.surface, styles.card)}>
      <CutThumb piece={scored.best} xstyle={styles.thumb} />
      <p {...stylex.props(styles.cardText)}>
        <span {...stylex.props(styles.label)}>{words.challenge.received}</span>
        <span {...stylex.props(styles.cardTitle)}>
          {words.result.off} {tenths(scored.total)}% ·{" "}
          {rankOf(scored.total).name[lang]}
        </span>
        <span {...stylex.props(styles.label)}>{words.challenge.dare}</span>
      </p>
    </div>
  );
};

interface PanelProps {
  view: View;
  lang: Lang;
  save: Save | null;
  challenge: Result | null;
  returning: boolean;
  onStart: (challenged: boolean) => void;
  onNext: () => void;
  onQuit: () => void;
}

export const Panel = ({
  view,
  lang,
  save,
  challenge,
  returning,
  onStart,
  onNext,
  onQuit,
}: PanelProps) => {
  const words = copy[lang];
  if (view.stage === "title") {
    return (
      <div {...stylex.props(styles.panel)}>
        {challenge === null ? null : (
          <ChallengeCard challenge={challenge} lang={lang} />
        )}
        <p {...stylex.props(styles.rule)}>
          <span {...stylex.props(styles.ruleLead)}>{words.rule.lead}</span>
          <span {...stylex.props(styles.ruleBody)}>{words.rule.body}</span>
        </p>
        <div {...stylex.props(styles.row)}>
          {challenge === null ? (
            <Primary
              focus={returning}
              label={words.start}
              onClick={() => {
                onStart(false);
              }}
            />
          ) : (
            <>
              <Primary
                focus={returning}
                label={words.challenge.accept}
                onClick={() => {
                  onStart(true);
                }}
              />
              <button
                onClick={() => {
                  onStart(false);
                }}
                type="button"
                {...stylex.props(styles.action, styles.secondary)}
              >
                {words.start}
              </button>
            </>
          )}
        </div>
        {save !== null && save.bestRun !== null ? (
          <p {...stylex.props(styles.label)}>
            {words.record(tenths(save.bestRun), save.runs)}
          </p>
        ) : null}
      </div>
    );
  }
  if (view.stage === "play") {
    const fumble = view.fumble?.kind;
    return (
      <div {...stylex.props(styles.panel)}>
        <p
          aria-live="polite"
          key={view.fumble?.count ?? 0}
          {...stylex.props(styles.hint, fumble !== undefined && styles.miss)}
        >
          {fumble === undefined ? words.hint : words.fumble[fumble]}
        </p>
        <p {...stylex.props(styles.keys)}>{words.rule.keys}</p>
      </div>
    );
  }
  if (view.stage === "cut" && view.split !== null) {
    const last = view.index + 1 >= RUN;
    const even = view.split.small === 500;
    return (
      <div {...stylex.props(styles.panel)}>
        <p aria-live="polite" {...stylex.props(styles.verdict)}>
          <span {...stylex.props(styles.ratio, even && styles.even)}>
            {ratioText(view.split.small)}
          </span>
          <span
            {...stylex.props(
              styles.call,
              errorOf(view.split.small) > 80 && styles.off
            )}
          >
            {verdictOf(view.split.small, lang)}
          </span>
        </p>
        <div {...stylex.props(styles.row)}>
          <Primary
            focus
            label={last ? words.finish : words.next}
            onClick={onNext}
          />
          <button
            onClick={onQuit}
            type="button"
            {...stylex.props(styles.action, styles.secondary)}
          >
            {words.quit}
          </button>
        </div>
      </div>
    );
  }
  return null;
};
