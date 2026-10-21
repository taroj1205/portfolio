import { Toggle } from "@base-ui/react/toggle";
import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { font, ink, media, shade } from "../../_components/theme.stylex";
import { langNames } from "../../_lib/i18n";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { ladder } from "../_lib/duel";
import type { Side } from "../_lib/duel";
import { formatMs, rankOf, reachText } from "../_lib/result";
import type { Challenge } from "../_lib/result";
import type { Save } from "../_lib/save";
import { tints } from "../_lib/scene";
import { DEMO_REACTION } from "../_lib/session";
import type { Beat, Mode, Stage, Verdict } from "../_lib/session";
import { MARK, SignalMark } from "./duel-svg";
import { Outcome } from "./outcome";

const GOLD = "#ffd27a";
const VERMILION = "#c8352b";
const TALL = "@media (orientation: portrait)";
const FINE = "@media (hover: hover) and (pointer: fine)";

const drift = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(12px)" },
  "100%": { opacity: 1, transform: "translateY(0)" },
});

const announce = stylex.keyframes({
  "0%": { filter: "blur(8px)", opacity: 0, transform: "scale(1.06)" },
  "18%": { filter: "blur(0)", opacity: 1, transform: "scale(1)" },
  "78%": { filter: "blur(0)", opacity: 1, transform: "scale(1)" },
  "100%": { filter: "blur(6px)", opacity: 0, transform: "scale(0.98)" },
});

const settle = stylex.keyframes({
  "0%": { opacity: 0 },
  "18%": { opacity: 1 },
  "78%": { opacity: 1 },
  "100%": { opacity: 0 },
});

const breathe = stylex.keyframes({
  "0%, 100%": { opacity: 0.55 },
  "50%": { opacity: 0.9 },
});

const styles = stylex.create({
  root: {
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.6rem",
    inset: 0,
    paddingBlock:
      "max(1rem, calc(env(safe-area-inset-top) + 0.6rem)) max(1rem, calc(env(safe-area-inset-bottom) + 0.6rem))",
    paddingInline:
      "max(1rem, calc(env(safe-area-inset-left) + 0.6rem)) max(1rem, calc(env(safe-area-inset-right) + 0.6rem))",
    pointerEvents: "none",
    position: "fixed",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  top: {
    alignItems: "center",
    display: "flex",
    gap: "0.6rem",
    justifyContent: "space-between",
    position: "relative",
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
    letterSpacing: "0.5em",
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
    pointerEvents: "auto",
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
  status: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    minHeight: "1.5rem",
  },
  steps: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.45rem",
    justifyContent: "center",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  step: {
    alignItems: "center",
    color: "rgb(255 255 255 / 0.35)",
    display: "flex",
    fontFamily: font.mincho,
    fontSize: "0.8rem",
    fontWeight: 700,
    gap: "0.45rem",
    textShadow: shade.small,
    transitionDuration: "400ms",
    transitionProperty: "color",
  },
  stepDone: {
    color: ink.soft,
    textDecorationColor: VERMILION,
    textDecorationLine: "line-through",
    textDecorationThickness: 2,
  },
  stepNow: {
    color: GOLD,
  },
  dot: {
    backgroundColor: "rgb(255 255 255 / 0.25)",
    borderRadius: 999,
    height: 3,
    width: 3,
  },
  middle: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    justifyContent: "flex-start",
    minHeight: 0,
    paddingBlockStart: { default: "6vh", [TALL]: "8vh" },
    position: "relative",
  },
  caption: {
    animationDuration: "500ms",
    animationName: { default: drift, [media.reduce]: "none" },
    fontFamily: font.mincho,
    fontSize: "clamp(1.05rem, 4.4vw, 1.35rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.18em * var(--track, 1))",
    margin: 0,
    textAlign: "center",
    textShadow: shade.large,
  },
  captionNow: {
    color: GOLD,
    fontSize: "clamp(1.4rem, 6vw, 1.9rem)",
  },
  intro: {
    alignItems: "center",
    animationDuration: "1.3s",
    animationFillMode: "forwards",
    animationName: { default: announce, [media.reduce]: settle },
    animationTimingFunction: "cubic-bezier(0.2, 0.7, 0.2, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    margin: 0,
    textAlign: "center",
    textShadow: shade.large,
  },
  introLabel: {
    color: GOLD,
    fontSize: "0.85rem",
    letterSpacing: "calc(0.3em * var(--track, 1))",
  },
  introName: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.9rem, 8vw, 2.8rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.16em * var(--track, 1))",
  },
  bottom: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    marginInline: "auto",
    maxWidth: "26rem",
    textAlign: "center",
    width: "100%",
  },
  panel: {
    animationDuration: "700ms",
    animationName: { default: drift, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.23, 1, 0.32, 1)",
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    width: "100%",
  },
  rule: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
    margin: 0,
  },
  ruleLead: {
    fontFamily: font.mincho,
    fontSize: "clamp(1.3rem, 5.6vw, 1.7rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.12em * var(--track, 1))",
    textShadow: shade.large,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  ruleBody: {
    color: ink.soft,
    fontSize: "0.86rem",
    lineHeight: 1.7,
    textShadow: shade.small,
    textWrap: "balance",
    wordBreak: "keep-all",
  },
  modes: {
    display: "grid",
    gap: "0.6rem",
    gridTemplateColumns: "1fr 1fr",
    width: "100%",
  },
  action: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.1rem",
    fontWeight: 700,
    justifyContent: "center",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    lineHeight: 1.2,
    minHeight: "3.4rem",
    outlineColor: GOLD,
    outlineOffset: 3,
    paddingBlock: "0.45rem",
    paddingInline: "1rem",
    pointerEvents: "auto",
    transform: { default: null, ":active": "scale(0.97)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  actionSub: {
    fontFamily: "inherit",
    fontSize: "0.68rem",
    fontWeight: 600,
    letterSpacing: "calc(0.1em * var(--track, 1))",
    opacity: 0.78,
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
  wide: {
    width: "100%",
  },
  keys: {
    color: ink.soft,
    display: { default: "none", [FINE]: "block" },
    fontSize: "0.75rem",
    letterSpacing: "calc(0.1em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  label: {
    color: ink.soft,
    fontSize: "0.75rem",
    letterSpacing: "calc(0.12em * var(--track, 1))",
    margin: 0,
    textShadow: shade.small,
  },
  card: {
    alignItems: "center",
    borderRadius: 18,
    display: "flex",
    gap: "0.9rem",
    paddingBlock: "0.6rem",
    paddingInline: "0.7rem 1rem",
    textAlign: "start",
    width: "100%",
  },
  seal: {
    alignItems: "center",
    backgroundColor: VERMILION,
    borderRadius: 5,
    boxShadow: "0 2px 10px rgb(120 20 10 / 0.35)",
    color: "#fff4ec",
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    fontFamily: font.mincho,
    fontSize: "0.95rem",
    fontWeight: 700,
    height: "2.9rem",
    justifyContent: "center",
    lineHeight: 1.05,
    transform: "rotate(-4deg)",
    width: "2.9rem",
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
  note: {
    color: ink.soft,
    fontSize: "0.8rem",
    margin: 0,
    textShadow: shade.small,
  },
  row: {
    display: "flex",
    gap: "0.6rem",
    width: "100%",
  },
  grow: {
    flexGrow: 1,
  },
  hint: {
    animationDuration: "3.2s",
    animationIterationCount: "infinite",
    animationName: { default: breathe, [media.reduce]: "none" },
    fontFamily: font.mincho,
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "calc(0.2em * var(--track, 1))",
    margin: 0,
    opacity: 0.7,
    textShadow: shade.small,
  },
  zones: {
    display: "flex",
    flexDirection: { default: "row", [TALL]: "column" },
    inset: 0,
    pointerEvents: "none",
    position: "fixed",
  },
  zone: {
    alignItems: "flex-end",
    display: "flex",
    flexBasis: 0,
    flexGrow: 1,
    justifyContent: { default: "flex-start", [TALL]: "center" },
    padding: "1.25rem",
    paddingBlockEnd: "max(1.25rem, calc(env(safe-area-inset-bottom) + 1rem))",
  },
  zoneTop: {
    borderColor: "rgb(255 255 255 / 0.1)",
    borderStyle: "dashed",
    borderWidth: { default: "0 1px 0 0", [TALL]: "0 0 1px" },
    paddingBlockEnd: {
      default: "max(1.25rem, calc(env(safe-area-inset-bottom) + 1rem))",
      [TALL]: "calc(env(safe-area-inset-top) + 4.6rem)",
    },
    transform: { default: null, [TALL]: "rotate(180deg)" },
  },
  zoneEnd: {
    justifyContent: { default: "flex-end", [TALL]: "center" },
  },
  room: {
    paddingBlockEnd: { default: null, [TALL]: "3.6rem" },
  },
  zoneLabel: {
    alignItems: "center",
    display: "flex",
    gap: "0.7rem",
    margin: 0,
    textShadow: shade.small,
  },
  zoneName: {
    fontFamily: font.mincho,
    fontSize: "2rem",
    fontWeight: 700,
    lineHeight: 1,
  },
  zoneKey: {
    borderColor: "rgb(255 255 255 / 0.4)",
    borderRadius: 6,
    borderStyle: "solid",
    borderWidth: "1px 1px 3px",
    display: { default: "none", [FINE]: "inline-flex" },
    fontSize: "0.85rem",
    fontWeight: 700,
    justifyContent: "center",
    minWidth: "1.8rem",
    paddingBlock: "0.15rem",
  },
  zoneTouch: {
    color: ink.soft,
    display: { default: "inline", [FINE]: "none" },
    fontSize: "0.75rem",
    letterSpacing: "calc(0.1em * var(--track, 1))",
  },
  hidden: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  mark: {
    display: "inline-flex",
    marginInline: "0.12em",
    verticalAlign: "-0.28em",
  },
  tint: (colour: string) => ({
    color: colour,
  }),
  glow: (colour: string, corner: string) => ({
    backgroundImage: `radial-gradient(120% 90% at ${corner}, ${colour}26, transparent 60%)`,
  }),
  zoneCount: {
    fontFamily: font.mincho,
    fontSize: "1.3rem",
    fontVariantNumeric: "tabular-nums",
    fontWeight: 700,
    opacity: 0.85,
  },
});

const Marked = ({ text }: { text: string }) => {
  const [before, ...rest] = text.split(MARK);
  return (
    <>
      {before}
      {rest.map((after, index) => (
        <span key={`${index}-${after}`}>
          <span {...stylex.props(styles.mark)}>
            <SignalMark size="1.25em" />
          </span>
          <span {...stylex.props(styles.hidden)}>{MARK}</span>
          {after}
        </span>
      ))}
    </>
  );
};

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

const Steps = ({ lang, rung }: { lang: Lang; rung: number }) => {
  const words = copy[lang];
  return (
    <ol aria-label={words.ladder} {...stylex.props(styles.steps)}>
      {words.rivals.map((rival, index) => (
        <li
          aria-current={index === rung ? "step" : undefined}
          key={rival.name}
          {...stylex.props(
            styles.step,
            index < rung && styles.stepDone,
            index === rung && styles.stepNow
          )}
        >
          {index > 0 ? (
            <span aria-hidden="true" {...stylex.props(styles.dot)} />
          ) : null}
          {rival.title}
        </li>
      ))}
    </ol>
  );
};

const Primary = ({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
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

const Zones = ({
  lang,
  tally,
}: {
  lang: Lang;
  tally: Record<Side, number>;
}) => {
  const words = copy[lang];
  return (
    <div aria-hidden="true" {...stylex.props(styles.zones)}>
      {(["left", "right"] as const).map((side) => (
        <div
          key={side}
          {...stylex.props(
            styles.zone,
            side === "left" && styles.zoneTop,
            side === "right" && styles.zoneEnd,
            styles.glow(
              tints.versus[side],
              side === "left" ? "0% 100%" : "100% 100%"
            )
          )}
        >
          <p {...stylex.props(styles.zoneLabel)}>
            <span
              {...stylex.props(
                styles.zoneName,
                styles.tint(tints.versus[side])
              )}
            >
              {words.players[side]}
            </span>
            <span {...stylex.props(styles.zoneCount)}>{tally[side]}</span>
            <span {...stylex.props(styles.zoneKey)}>{words.zone[side]}</span>
            <span {...stylex.props(styles.zoneTouch)}>{words.zone.touch}</span>
          </p>
        </div>
      ))}
    </div>
  );
};

const demoText = (beat: Beat, lang: Lang) => {
  if (beat === null) {
    return null;
  }
  return beat === "cut" ? formatMs(DEMO_REACTION) : copy[lang].demo[beat];
};

const Caption = ({ beat, lang }: { beat: Beat; lang: Lang }) => {
  const text = demoText(beat, lang);
  return text === null ? null : (
    <p
      aria-hidden="true"
      key={beat}
      {...stylex.props(
        styles.caption,
        (beat === "signal" || beat === "cut") && styles.captionNow
      )}
    >
      {text}
    </p>
  );
};

const introOf = (
  mode: Mode,
  rung: number,
  challenge: Challenge | null,
  lang: Lang
) => {
  const words = copy[lang];
  if (mode === "versus") {
    return {
      label: words.ready,
      name: `${words.players.left} × ${words.players.right}`,
    };
  }
  if (mode === "challenge" && challenge !== null) {
    return {
      label: words.challenge.received,
      name: `${words.challenge.who} ${formatMs(challenge.best)}`,
    };
  }
  const rival = words.rivals[Math.min(rung, ladder.length - 1)];
  return { label: words.ordinal(rung), name: `${rival.title} ${rival.name}` };
};

const Intro = ({ label, name }: { label: string; name: string }) => (
  <p aria-live="polite" {...stylex.props(styles.intro)}>
    <span {...stylex.props(styles.introLabel)}>{label}</span>
    <span {...stylex.props(styles.introName)}>{name}</span>
  </p>
);

const ChallengeCard = ({
  challenge,
  lang,
}: {
  challenge: Challenge;
  lang: Lang;
}) => {
  const words = copy[lang];
  const rank = rankOf(challenge.reach);
  return (
    <div {...stylex.props(glass.surface, styles.card)}>
      <span aria-hidden="true" {...stylex.props(styles.seal)}>
        <span>{rank.seal[0]}</span>
        <span>{rank.seal[1]}</span>
      </span>
      <p {...stylex.props(styles.cardText)}>
        <span {...stylex.props(styles.label)}>{words.challenge.received}</span>
        <span {...stylex.props(styles.cardTitle)}>
          {formatMs(challenge.best)} · {rank.name[lang]} ·{" "}
          {reachText(challenge.reach, lang)}
        </span>
        <span {...stylex.props(styles.label)}>{words.challenge.dare}</span>
      </p>
    </div>
  );
};

interface TitleProps {
  lang: Lang;
  challenge: Challenge | null;
  save: Save | null;
  onStart: (mode: Mode) => void;
}

const Title = ({ lang, challenge, save, onStart }: TitleProps) => {
  const words = copy[lang];
  const record =
    save !== null && save.runs > 0
      ? words.record(
          reachText(save.bestReach, lang),
          save.bestReaction === null ? null : formatMs(save.bestReaction)
        )
      : null;
  return (
    <div {...stylex.props(styles.panel)}>
      {challenge === null ? null : (
        <ChallengeCard challenge={challenge} lang={lang} />
      )}
      <p {...stylex.props(styles.rule)}>
        <span {...stylex.props(styles.ruleLead)}>
          <Marked text={words.rule.lead} />
        </span>
        <span {...stylex.props(styles.ruleBody)}>{words.rule.body}</span>
      </p>
      {challenge === null ? null : (
        <button
          onClick={() => {
            onStart("challenge");
          }}
          type="button"
          {...stylex.props(styles.action, styles.primary, styles.wide)}
        >
          {words.challenge.accept}
        </button>
      )}
      <div {...stylex.props(styles.modes)}>
        <button
          onClick={() => {
            onStart("solo");
          }}
          type="button"
          {...stylex.props(
            styles.action,
            challenge === null ? styles.primary : styles.secondary
          )}
        >
          {words.modes.solo}
          <span {...stylex.props(styles.actionSub)}>{words.modes.soloSub}</span>
        </button>
        <button
          onClick={() => {
            onStart("versus");
          }}
          type="button"
          {...stylex.props(styles.action, styles.secondary)}
        >
          {words.modes.versus}
          <span {...stylex.props(styles.actionSub)}>
            {words.modes.versusSub}
          </span>
        </button>
      </div>
      <p {...stylex.props(styles.keys)}>{words.rule.keys}</p>
      {record === null ? null : <p {...stylex.props(styles.label)}>{record}</p>}
    </div>
  );
};

const nextLabel = (mode: Mode, verdict: Verdict | null, lang: Lang) => {
  const words = copy[lang];
  if (mode === "versus") {
    return words.rematch;
  }
  if (verdict === null) {
    return words.ready;
  }
  return verdict.call.kind === "draw" ? words.retry : words.next;
};

interface ReadyProps {
  lang: Lang;
  mode: Mode;
  rung: number;
  tally: Record<Side, number>;
  verdict: Verdict | null;
  interrupted: boolean;
  onEngage: () => void;
  onQuit: () => void;
}

const Ready = ({
  lang,
  mode,
  rung,
  tally,
  verdict,
  interrupted,
  onEngage,
  onQuit,
}: ReadyProps) => {
  const words = copy[lang];
  const rival = words.rivals[Math.min(rung, ladder.length - 1)];
  return (
    <div {...stylex.props(styles.panel)}>
      {verdict === null ? null : <Outcome lang={lang} verdict={verdict} />}
      {interrupted ? (
        <p aria-live="polite" {...stylex.props(styles.note)}>
          {words.interrupted}
        </p>
      ) : null}
      {mode === "solo" ? (
        <p {...stylex.props(styles.label)}>
          {words.ordinal(rung)} · {rival.title} {rival.name}
        </p>
      ) : null}
      {mode === "versus" ? (
        <p {...stylex.props(styles.label)}>
          {words.players.left} {tally.left} – {tally.right}{" "}
          {words.players.right}
        </p>
      ) : null}
      <div {...stylex.props(styles.row)}>
        <Primary label={nextLabel(mode, verdict, lang)} onClick={onEngage} />
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
};

interface HudProps {
  lang: Lang;
  stage: Stage;
  mode: Mode;
  rung: number;
  tally: Record<Side, number>;
  verdict: Verdict | null;
  beat: Beat;
  duels: number;
  interrupted: boolean;
  challenge: Challenge | null;
  save: Save | null;
  muted: boolean;
  onLang: () => void;
  onMute: (muted: boolean) => void;
  onStart: (mode: Mode) => void;
  onEngage: () => void;
  onQuit: () => void;
}

export const Hud = ({
  lang,
  stage,
  mode,
  rung,
  tally,
  verdict,
  beat,
  duels,
  interrupted,
  challenge,
  save,
  muted,
  onLang,
  onMute,
  onStart,
  onEngage,
  onQuit,
}: HudProps) => {
  const words = copy[lang];
  const langOther: Lang = lang === "ja" ? "en" : "ja";
  const playing = stage === "duel" || stage === "cut";
  const versus = mode === "versus" && (playing || stage === "ready");
  const intro = introOf(mode, rung, challenge, lang);

  return (
    <>
      {versus ? <Zones lang={lang} tally={tally} /> : null}
      <div {...stylex.props(styles.root)}>
        <header {...stylex.props(styles.top)}>
          <div {...stylex.props(styles.brand)}>
            <BackToGames label={words.back} />
            <h1 lang="ja" {...stylex.props(styles.title)}>
              <span {...stylex.props(styles.lead)}>いあい</span>
              居合
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
            {stage === "duel" ? (
              <button
                onClick={onQuit}
                type="button"
                {...stylex.props(glass.surface, styles.button, styles.pill)}
              >
                {words.quit}
              </button>
            ) : null}
            {playing ? null : (
              <button
                lang={langOther}
                onClick={onLang}
                type="button"
                {...stylex.props(glass.surface, styles.button, styles.pill)}
              >
                {langNames[langOther]}
              </button>
            )}
          </div>
        </header>

        <div {...stylex.props(styles.status)}>
          {mode === "solo" && (playing || stage === "ready") ? (
            <Steps lang={lang} rung={rung} />
          ) : null}
        </div>

        <div {...stylex.props(styles.middle)}>
          {stage === "title" ? <Caption beat={beat} lang={lang} /> : null}
          {stage === "duel" ? (
            <Intro key={duels} label={intro.label} name={intro.name} />
          ) : null}
        </div>

        <div {...stylex.props(styles.bottom, versus && styles.room)}>
          {stage === "title" ? (
            <Title
              challenge={challenge}
              lang={lang}
              onStart={onStart}
              save={save}
            />
          ) : null}
          {stage === "ready" ? (
            <Ready
              interrupted={interrupted}
              key={duels}
              lang={lang}
              mode={mode}
              onEngage={onEngage}
              onQuit={onQuit}
              rung={rung}
              tally={tally}
              verdict={verdict}
            />
          ) : null}
          {playing && mode !== "versus" ? (
            <p {...stylex.props(styles.hint)}>
              <Marked text={words.hint} />
            </p>
          ) : null}
        </div>
      </div>
    </>
  );
};
