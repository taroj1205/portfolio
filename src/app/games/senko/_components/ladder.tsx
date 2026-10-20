import * as stylex from "@stylexjs/stylex";

import { font, ink, media, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { phases } from "../_lib/phases";

const glow = stylex.keyframes({
  "0%, 100%": { textShadow: "0 0 10px rgb(255 190 110 / 0.55)" },
  "50%": { textShadow: "0 0 18px rgb(255 190 110 / 0.95)" },
});

const styles = stylex.create({
  hidden: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  row: {
    alignItems: "center",
    display: "flex",
    fontFamily: font.mincho,
    gap: "0.55rem",
    justifyContent: "center",
    margin: 0,
  },
  step: {
    color: "rgb(255 255 255 / 0.3)",
    fontSize: "0.82rem",
    fontWeight: 700,
    textShadow: shade.small,
    transitionDuration: "500ms",
    transitionProperty: "color",
  },
  done: {
    color: ink.soft,
  },
  now: {
    animationDuration: "1.6s",
    animationIterationCount: "infinite",
    animationName: { default: glow, [media.reduce]: "none" },
    color: "#ffd27a",
  },
  dot: {
    backgroundColor: "rgb(255 255 255 / 0.25)",
    borderRadius: 999,
    height: 3,
    width: 3,
  },
});

interface LadderProps {
  lang: Lang;
  label: string;
  reached: number;
  live?: boolean;
}

export const Ladder = ({ lang, label, reached, live = false }: LadderProps) => (
  <p {...stylex.props(styles.row)}>
    <span {...stylex.props(styles.hidden)}>
      {label}:{" "}
      {phases
        .slice(0, reached + 1)
        .map((phase) => phase.name[lang])
        .join(", ")}
    </span>
    {phases.map((phase, index) => (
      <span
        aria-hidden="true"
        key={phase.reading}
        {...stylex.props(styles.row)}
      >
        {index > 0 ? <span {...stylex.props(styles.dot)} /> : null}
        <span
          lang="ja"
          {...stylex.props(
            styles.step,
            index < reached && styles.done,
            index === reached && (live ? styles.now : styles.done)
          )}
        >
          {phase.name.ja}
        </span>
      </span>
    ))}
  </p>
);
