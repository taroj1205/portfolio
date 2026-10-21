"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import { ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import { headlineOf, planOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import { officialOf, streakOn } from "../_lib/save";
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
    alignItems: "center",
    containerType: "size",
    display: "flex",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: "12rem",
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
    aspectRatio: "1",
    cursor: "crosshair",
    display: "block",
    touchAction: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    width: "min(100cqmin, 34rem)",
  },
});

const paintMeter = (
  bar: HTMLDivElement | null,
  percent: HTMLSpanElement | null,
  stress: HTMLDivElement | null,
  values: { carved: number; tension: number }
) => {
  if (bar) {
    bar.style.transform = `scaleX(${values.carved / 100})`;
  }
  if (percent) {
    percent.textContent = `${values.carved}%`;
  }
  if (stress) {
    stress.style.transform = `scaleX(${values.tension.toFixed(3)})`;
  }
};

const dailyOf = (save: Save | null, today: number, lang: Lang) => {
  const official = save === null ? null : officialOf(save, today);
  return save === null || official === null
    ? null
    : { score: headlineOf(official, lang), streak: streakOn(save, today) };
};

export const Game = ({
  challenge,
  hint,
  day,
}: {
  challenge: Result | null;
  hint: Lang;
  day: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const carvedBar = useRef<HTMLDivElement>(null);
  const carvedText = useRef<HTMLSpanElement>(null);
  const stressBar = useRef<HTMLDivElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [phase, setPhase] = useState<Phase>("demo");
  const [today, setToday] = useState(day);
  const [ending, setEnding] = useState<Ending | null>(null);

  const lang = settings?.lang ?? hint;
  const plan = planOf(challenge, today);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    session.current =
      canvas === null
        ? null
        : startSession(canvas, {
            meter: (carved, tension) => {
              paintMeter(
                carvedBar.current,
                carvedText.current,
                stressBar.current,
                {
                  carved,
                  tension,
                }
              );
            },
            over: setEnding,
            phase: setPhase,
            plan: (now) => planOf(challenge, now),
            save: setSave,
            settings: setSettings,
            today: setToday,
          });
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, [challenge]);

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
        playing={phase === "carving"}
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
              aria-hidden={phase === "carving"}
              {...stylex.props(phase === "carving" && styles.hidden)}
            >
              <Prompt
                challenge={challenge}
                clears={save?.clears ?? 0}
                daily={dailyOf(save, today, lang)}
                lang={lang}
                plan={plan}
                runs={save?.runs ?? 0}
                today={today}
              />
            </div>
            {phase === "carving" ? (
              <div {...stylex.props(styles.meter)}>
                <Meter
                  carved={carvedBar}
                  lang={lang}
                  percent={carvedText}
                  stress={stressBar}
                />
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
