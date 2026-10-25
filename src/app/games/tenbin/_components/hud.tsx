import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup } from "@base-ui/react/toggle-group";
import * as stylex from "@stylexjs/stylex";

import { BackToGames } from "../../_components/back-to-games";
import { glass } from "../../_components/glass";
import { LanguageButton } from "../../_components/language-button";
import { ReportMenu } from "../../_components/report-menu";
import { Speaker } from "../../_components/speaker-mark";
import { font, ink, shade } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { copy } from "../_lib/copy";
import type { Mode } from "../_lib/copy";

const GOLD = "#ffd27a";
const modes = ["daily", "versus"] as const satisfies readonly Mode[];

const styles = stylex.create({
  top: {
    alignItems: "flex-start",
    display: "flex",
    gap: "0.5rem",
    justifyContent: "space-between",
  },
  brand: {
    alignItems: "center",
    display: "flex",
    gap: "0.6rem",
    minWidth: 0,
  },
  title: {
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "1.25rem",
    fontWeight: 700,
    gap: "0.3rem",
    letterSpacing: "0.06em",
    lineHeight: 1,
    margin: 0,
    textShadow: shade.small,
    whiteSpace: "nowrap",
  },
  reading: {
    color: GOLD,
    fontSize: "0.46em",
    letterSpacing: "0.14em",
  },
  corner: {
    display: "flex",
    flexShrink: 0,
    gap: "0.4rem",
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
  segments: {
    alignSelf: "center",
    borderRadius: 999,
    display: "flex",
    flexShrink: 0,
    gap: 2,
    padding: 3,
  },
  segment: {
    backgroundColor: "transparent",
    borderRadius: 999,
    borderWidth: 0,
    color: ink.soft,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: "0.82rem",
    fontWeight: 700,
    minHeight: "2.5rem",
    outlineColor: GOLD,
    outlineOffset: 2,
    paddingInline: "1rem",
    transitionDuration: "180ms",
    transitionProperty: "background-color, color",
  },
  segmentOn: {
    backgroundColor: "rgb(255 241 200 / 0.94)",
    color: "#1c1406",
  },
});

interface HudProps {
  lang: Lang;
  muted: boolean;
  onLang: () => void;
  onMute: (muted: boolean) => void;
}

export const Hud = ({ lang, muted, onLang, onMute }: HudProps) => {
  const words = copy[lang];
  const other: Lang = lang === "ja" ? "en" : "ja";

  return (
    <header {...stylex.props(styles.top)}>
      <div {...stylex.props(styles.brand)}>
        <BackToGames label={words.back} />
        <h1 lang="ja" {...stylex.props(styles.title)}>
          <span {...stylex.props(styles.reading)}>いちおくトンてんびん</span>
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
        <LanguageButton lang={other} onClick={onLang} xstyle={styles.button} />
        <ReportMenu iconOnly lang={lang} xstyle={styles.button} />
      </div>
    </header>
  );
};

interface ModeSwitchProps {
  lang: Lang;
  mode: Mode;
  onMode: (mode: Mode) => void;
}

export const ModeSwitch = ({ lang, mode, onMode }: ModeSwitchProps) => {
  const words = copy[lang].modes;

  return (
    <ToggleGroup
      aria-label={words.label}
      onValueChange={([next]) => {
        if (next !== undefined) {
          onMode(next);
        }
      }}
      value={[mode]}
      {...stylex.props(glass.surface, styles.segments)}
    >
      {modes.map((value) => (
        <Toggle
          className={(state) =>
            stylex.props(styles.segment, state.pressed && styles.segmentOn)
              .className
          }
          key={value}
          value={value}
        >
          {words[value]}
        </Toggle>
      ))}
    </ToggleGroup>
  );
};
