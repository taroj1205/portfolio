import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { LanguageButton } from "../../_components/language-button";
import { ReportMenu } from "../../_components/report-menu";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { isRare } from "../_lib/foods";
import { pieceOf, kindTitle, ratioText, tenths } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import type { View } from "../_lib/session";
import { buttons } from "./buttons";
import { CutThumb } from "./cut-thumb";
import { brass } from "./itto.stylex";

const FINE = "@media (hover: hover) and (pointer: fine)";

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

const styles = stylex.create({
  top: {
    alignItems: "center",
    display: "flex",
    columnGap: "0.25rem",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: "0.6rem",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "0.55rem",
  },
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: { default: "1.35rem", "@media (max-width: 380px)": "1.15rem" },
    fontWeight: 700,
    letterSpacing: "0.12em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    whiteSpace: "nowrap",
  },
  lead: {
    color: brass.gold,
    fontSize: "0.42em",
    letterSpacing: "0.4em",
    marginBlockEnd: "0.35em",
  },
  corner: {
    display: "flex",
    gap: "0.45rem",
    marginInlineStart: "auto",
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    height: "2.75rem",
    justifyContent: "center",
    outlineColor: brass.gold,
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
    paddingInline: "0.85rem",
    width: "auto",
  },
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
  row: {
    display: "flex",
    gap: "0.6rem",
    width: "100%",
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
    color: brass.gold,
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
  rare: {
    backgroundImage: brass.bar,
    borderRadius: 999,
    color: brass.ink,
    display: "inline-block",
    fontSize: "0.66rem",
    fontWeight: 800,
    marginInlineStart: "0.5rem",
    paddingBlock: "0.15rem",
    paddingInline: "0.5rem",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
  },
  cardTitle: {
    fontFamily: font.mincho,
    fontSize: "1.05rem",
    fontWeight: 700,
  },
});

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
          <span {...stylex.props(styles.lead)}>はんぶんこどうじょう</span>
          {copy.ja.name}
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
          <LanguageButton
            lang={other}
            onClick={onLang}
            xstyle={styles.button}
          />
        )}
        <ReportMenu iconOnly lang={lang} xstyle={styles.button} />
      </div>
    </header>
  );
};

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
      {...stylex.props(buttons.action, buttons.primary)}
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
  const piece = pieceOf(challenge);

  if (piece === null) {
    return null;
  }

  return (
    <div {...stylex.props(glass.surface, styles.card)}>
      <CutThumb piece={piece} xstyle={styles.thumb} />
      <p {...stylex.props(styles.cardText)}>
        <span {...stylex.props(styles.label)}>{words.challenge.received}</span>
        <span {...stylex.props(styles.cardTitle)}>
          {ratioText(piece.split.small)} · {kindTitle(piece.food.kind, lang)}
          {isRare(piece.food.kind) ? (
            <span {...stylex.props(styles.rare)}>✦ {words.rare}</span>
          ) : null}
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
}

export const Panel = ({
  view,
  lang,
  save,
  challenge,
  returning,
  onStart,
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
                {...stylex.props(buttons.action, buttons.secondary)}
              >
                {words.start}
              </button>
            </>
          )}
        </div>
        {save !== null && save.bestCut !== null ? (
          <p {...stylex.props(styles.label)}>
            {words.record(tenths(save.bestCut), save.cuts)}
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

  return null;
};
