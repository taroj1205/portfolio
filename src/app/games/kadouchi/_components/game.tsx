"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import { ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import type { Result } from "../_lib/result";
import { foundOf } from "../_lib/save";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Ending, Phase } from "../_lib/session";
import { Hud, Meter, Prompt } from "./hud";
import { ResultSheet } from "./result-sheet";

const WIDE = "@media (min-width: 900px)";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(16px) scale(0.97)" },
  "100%": { opacity: 1, transform: "none" },
});

const styles = stylex.create({
  root: {
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    inset: 0,
    paddingBlock:
      "max(1rem, calc(env(safe-area-inset-top) + 0.6rem)) max(1rem, calc(env(safe-area-inset-bottom) + 0.6rem))",
    paddingInline:
      "max(1rem, calc(env(safe-area-inset-left) + 0.6rem)) max(1rem, calc(env(safe-area-inset-right) + 0.6rem))",
    position: "fixed",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "0.75rem",
    minHeight: 0,
  },
  bodyDone: {
    alignItems: { default: null, [WIDE]: "center" },
    flexDirection: { default: "column", [WIDE]: "row" },
    gap: { default: "0.75rem", [WIDE]: "2.5rem" },
    marginInline: { default: null, [WIDE]: "auto" },
    maxWidth: { default: null, [WIDE]: "68rem" },
    width: "100%",
  },
  stage: {
    alignSelf: "stretch",
    display: "flex",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: "14rem",
    minWidth: 0,
  },
  dock: {
    flexShrink: 0,
    position: "relative",
  },
  hidden: {
    visibility: "hidden",
  },
  meter: {
    inset: 0,
    position: "absolute",
  },
  canvas: {
    animationDuration: "900ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    borderRadius: 28,
    boxShadow: "0 24px 60px rgb(10 2 20 / 0.5)",
    display: "block",
    height: "100%",
    maxWidth: "40rem",
    touchAction: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    width: "100%",
  },
});

const paint = (target: HTMLSpanElement | null, value: number) => {
  if (target) {
    target.textContent = String(value);
  }
};

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const corksRef = useRef<HTMLSpanElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [ending, setEnding] = useState<Ending | null>(null);

  const lang = settings?.lang ?? hint;

  const langRef = useRef(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    langRef.current = lang;
    session.current?.language(lang);
  }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    session.current =
      canvas === null
        ? null
        : startSession(canvas, {
            meter: (score, corks) => {
              paint(scoreRef.current, score);
              paint(corksRef.current, corks);
            },
            over: setEnding,
            phase: setPhase,
            save: setSave,
            settings: setSettings,
          });
    session.current?.language(langRef.current);

    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, []);

  const again = () => {
    setEnding(null);
    session.current?.again();
  };

  return (
    <div {...stylex.props(styles.root)}>
      <Hud
        lang={lang}
        muted={settings?.muted ?? false}
        onLang={() => {
          if (settings !== null) {
            session.current?.settings({
              ...settings,
              lang: lang === "ja" ? "en" : "ja",
            });
          }
        }}
        onMute={(muted) => {
          if (settings !== null) {
            session.current?.settings({ ...settings, muted });
          }
        }}
        playing={phase === "shooting"}
      />
      <main {...stylex.props(styles.body, ending !== null && styles.bodyDone)}>
        <div {...stylex.props(styles.stage)}>
          <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
            {copy[lang].fallback}
          </canvas>
        </div>
        {ending !== null && save !== null ? (
          <ResultSheet
            challenge={challenge}
            ending={ending}
            lang={lang}
            onAgain={again}
            save={save}
          />
        ) : null}
        {ending === null ? (
          <div {...stylex.props(styles.dock)}>
            <div
              aria-hidden={phase !== "ready"}
              {...stylex.props(phase !== "ready" && styles.hidden)}
            >
              <Prompt
                best={save?.best ?? 0}
                challenge={challenge}
                found={save === null ? 0 : foundOf(save).length}
                lang={lang}
                runs={save?.runs ?? 0}
              />
            </div>
            {phase === "shooting" ? (
              <div {...stylex.props(styles.meter)}>
                <Meter corks={corksRef} lang={lang} score={scoreRef} />
              </div>
            ) : null}
          </div>
        ) : null}
      </main>
      <LanguagePicker
        lang={lang}
        onSettings={(next) => session.current?.settings(next)}
        settings={settings}
      />
    </div>
  );
};
