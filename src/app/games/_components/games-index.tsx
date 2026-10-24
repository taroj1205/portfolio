"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useSyncExternalStore } from "react";

import { media } from "../../../styles/tokens.stylex";
import { langNames } from "../_lib/i18n";
import type { Lang } from "../_lib/i18n";
import { loadSettings, storeSettings } from "../_lib/settings";
import type { Settings } from "../_lib/settings";
import { GameCard } from "./game-card";
import type { Game } from "./game-card";
import { glass } from "./glass";
import { LanguagePicker } from "./language-picker";
import { Sky } from "./sky";
import { StarLink } from "./star-link";
import { ink } from "./theme.stylex";

const words: Record<
  Lang,
  { eyebrow: string; title: string; intro: string; star: string }
> = {
  en: {
    eyebrow: "ゲーム",
    intro: "Small games that play right in your browser.",
    star: "Star on GitHub",
    title: "Games",
  },
  ja: {
    eyebrow: "Games",
    intro: "ブラウザですぐ遊べる、小さなゲーム。",
    star: "GitHubでスター",
    title: "ゲーム",
  },
};

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(18px)" },
  "100%": { opacity: 1, transform: "none" },
});

const styles = stylex.create({
  eyebrow: {
    color: "#ffd27a",
    fontSize: "0.8rem",
    fontWeight: 600,
    letterSpacing: "0.32em",
    margin: 0,
    textTransform: "uppercase",
  },
  header: {
    animationDuration: "900ms",
    animationFillMode: "backwards",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    display: "flex",
    flexDirection: "column",
    gap: "0.9rem",
  },
  inner: {
    display: "flex",
    flexDirection: "column",
    gap: "clamp(2rem, 5vw, 3.5rem)",
    marginInline: "auto",
    maxWidth: "72rem",
    paddingBlock:
      "calc(clamp(2.5rem, 8vw, 5.5rem) + env(safe-area-inset-top)) calc(2.5rem + env(safe-area-inset-bottom))",
    paddingInline: "max(1.25rem, env(safe-area-inset-left))",
  },
  intro: {
    color: ink.soft,
    fontSize: "1.05rem",
    lineHeight: 1.7,
    margin: 0,
    maxWidth: "36rem",
  },
  language: {
    alignItems: "center",
    borderRadius: 999,
    color: ink.text,
    cursor: "pointer",
    display: "flex",
    fontSize: "0.8rem",
    fontWeight: 700,
    height: "2.75rem",
    letterSpacing: "0.08em",
    outlineColor: "#ffd27a",
    outlineOffset: 3,
    paddingInline: "1rem",
    transform: { default: null, ":active": "scale(0.96)" },
    transitionDuration: "160ms",
    transitionProperty: "transform",
  },
  list: {
    animationDelay: "150ms",
    animationDuration: "1000ms",
    animationFillMode: "backwards",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    display: "grid",
    gap: { default: "1.5rem", [media.stack]: "0.75rem" },
    gridTemplateColumns: {
      default: null,
      [media.stack]: "repeat(2, minmax(0, 1fr))",
    },
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  page: {
    backgroundImage:
      "linear-gradient(180deg, #060912 0%, #0d1330 52%, #1b1737 100%)",
    inset: 0,
    overflow: "hidden",
    position: "fixed",
  },
  scroll: {
    inset: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    position: "absolute",
  },
  title: {
    fontFamily: "var(--font-mincho), serif",
    fontSize: "clamp(3.2rem, 11vw, 6.5rem)",
    fontWeight: 700,
    letterSpacing: "0.12em",
    lineHeight: 1.05,
    margin: 0,
    textShadow: "0 4px 40px rgb(255 190 120 / 0.28)",
  },
  top: {
    alignItems: "center",
    display: "flex",
    gap: "1rem",
    justifyContent: "space-between",
  },
});

const listeners = new Set<() => void>();
let last: { raw: string; value: Settings } | null = null;

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

const snapshot = (): Settings => {
  const value = loadSettings();
  const raw = JSON.stringify(value);
  last = last?.raw === raw ? last : { raw, value };

  return last.value;
};

const noSettings = () => null;

const update = (next: Settings) => {
  storeSettings(next);

  for (const listener of listeners) {
    listener();
  }
};

export const GamesIndex = ({ games, hint }: { games: Game[]; hint: Lang }) => {
  const settings = useSyncExternalStore<Settings | null>(
    subscribe,
    snapshot,
    noSettings
  );

  const lang = settings?.lang ?? hint;
  const other: Lang = lang === "ja" ? "en" : "ja";
  const copy = words[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div {...stylex.props(styles.page)}>
      <Sky />
      <main {...stylex.props(styles.scroll)}>
        <div {...stylex.props(styles.inner)}>
          <header {...stylex.props(styles.header)}>
            <div {...stylex.props(styles.top)}>
              <p lang={other} {...stylex.props(styles.eyebrow)}>
                {copy.eyebrow}
              </p>
              <button
                lang={other}
                onClick={() => {
                  if (settings !== null) {
                    update({ ...settings, lang: other });
                  }
                }}
                type="button"
                {...stylex.props(glass.surface, styles.language)}
              >
                {langNames[other]}
              </button>
            </div>
            <h1 {...stylex.props(styles.title)}>{copy.title}</h1>
            <p {...stylex.props(styles.intro)}>{copy.intro}</p>
          </header>
          <ul {...stylex.props(styles.list)}>
            {games.map((game) => (
              <li key={game.href}>
                <GameCard {...game} lang={lang} />
              </li>
            ))}
          </ul>
          <StarLink>{copy.star}</StarLink>
        </div>
      </main>
      <LanguagePicker lang={lang} onSettings={update} settings={settings} />
    </div>
  );
};
