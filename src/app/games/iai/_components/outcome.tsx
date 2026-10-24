import * as stylex from "@stylexjs/stylex";

import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import { other } from "../_lib/duel";
import type { Side } from "../_lib/duel";
import { formatMs } from "../_lib/result";
import type { Verdict } from "../_lib/session";

const GOLD = "#ffd27a";

const stamp = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(1.8) rotate(-6deg)" },
  "60%": { opacity: 1, transform: "scale(0.94) rotate(-6deg)" },
  "100%": { opacity: 1, transform: "scale(1) rotate(-6deg)" },
});

const styles = stylex.create({
  verdict: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
    margin: 0,
  },
  stamp: {
    animationDuration: "420ms",
    animationName: { default: stamp, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    borderColor: "currentColor",
    borderRadius: 8,
    borderStyle: "solid",
    borderWidth: 3,
    fontFamily: font.mincho,
    fontSize: "clamp(1.5rem, 7vw, 2.1rem)",
    fontWeight: 700,
    letterSpacing: "calc(0.2em * var(--track, 1))",
    paddingBlock: "0.15rem",
    paddingInline: "0.9rem 0.7rem",
    textShadow: "none",
    transform: "rotate(-6deg)",
  },
  stampWon: {
    backgroundColor: "rgb(200 53 43 / 0.92)",
    color: "#fff4ec",
  },
  stampLost: {
    backgroundColor: "rgb(8 8 14 / 0.75)",
    color: "rgb(255 255 255 / 0.82)",
  },
  times: {
    display: "flex",
    fontVariantNumeric: "tabular-nums",
    gap: "1.1rem",
    justifyContent: "center",
    margin: 0,
    textShadow: shade.small,
  },
  time: {
    alignItems: "baseline",
    display: "flex",
    gap: "0.4rem",
  },
  timeValue: {
    fontFamily: font.mincho,
    fontSize: "1.35rem",
    fontWeight: 700,
  },
  timeFast: {
    color: GOLD,
  },
  note: {
    color: ink.soft,
    fontSize: "0.8rem",
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
});

export const verdictTitle = (verdict: Verdict, lang: Lang) => {
  const words = copy[lang].verdict;
  const { call, mode } = verdict;

  if (call.kind === "draw") {
    return { title: words.draw, won: false };
  }

  if (call.kind === "none") {
    return { title: words.none, won: false };
  }

  if (mode === "versus") {
    const winner = call.kind === "cut" ? call.side : other(call.side);

    return {
      title: words.wins(copy[lang].players[winner]),
      won: true,
    };
  }

  if (call.kind === "cut") {
    return call.side === "left"
      ? { title: words.won, won: true }
      : { title: words.lost, won: false };
  }

  return {
    title: call.fake === null ? words.early : words.fooled[call.fake],
    won: false,
  };
};

const verdictNote = (verdict: Verdict, lang: Lang) => {
  const words = copy[lang];
  const { call } = verdict;

  if (call.kind !== "early") {
    return null;
  }

  if (call.reaction !== null) {
    const guess = words.verdict.guess(call.reaction);

    return verdict.mode === "versus"
      ? `${words.players[call.side]} · ${guess}`
      : guess;
  }

  if (verdict.mode !== "versus") {
    return null;
  }

  const reason =
    call.fake === null ? words.verdict.early : words.verdict.fooled[call.fake];

  return `${words.players[call.side]} · ${reason}`;
};

const fasterOf = (verdict: Verdict): Side | null => {
  if (verdict.left === null) {
    return verdict.right === null ? null : "right";
  }

  return verdict.right === null || verdict.left < verdict.right
    ? "left"
    : "right";
};

const Times = ({ verdict, lang }: { verdict: Verdict; lang: Lang }) => {
  const words = copy[lang];

  const names =
    verdict.mode === "versus"
      ? words.players
      : { left: words.you, right: words.rival };

  const faster = fasterOf(verdict);

  return (
    <p {...stylex.props(styles.times)}>
      {(["left", "right"] as const).map((side) => (
        <span key={side} {...stylex.props(styles.time)}>
          <span {...stylex.props(styles.label)}>{names[side]}</span>
          <span
            {...stylex.props(
              styles.timeValue,
              faster === side && styles.timeFast
            )}
          >
            {verdict[side] === null ? "—" : formatMs(verdict[side])}
          </span>
        </span>
      ))}
    </p>
  );
};

export const Outcome = ({
  verdict,
  lang,
}: {
  verdict: Verdict;
  lang: Lang;
}) => {
  const title = verdictTitle(verdict, lang);
  const note = verdictNote(verdict, lang);

  return (
    <div aria-live="polite" {...stylex.props(styles.verdict)}>
      <p
        {...stylex.props(
          styles.stamp,
          title.won ? styles.stampWon : styles.stampLost
        )}
      >
        {title.title}
      </p>
      {note === null ? null : <p {...stylex.props(styles.note)}>{note}</p>}
      <Times lang={lang} verdict={verdict} />
    </div>
  );
};
