"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { font, ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import { rankOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Ending, Phase } from "../_lib/session";
import { Hud, Prompt } from "./hud";
import { ResultSheet } from "./result-sheet";

const WIDE = "@media (min-width: 900px)";
const VERMILION = "#c8352b";

const rise = stylex.keyframes({
  "0%": { opacity: 0, transform: "translateY(16px) scale(0.98)" },
  "100%": { opacity: 1, transform: "none" },
});

const trace = stylex.keyframes({
  "0%": { strokeDashoffset: 1 },
  "100%": { strokeDashoffset: 0 },
});

const stamp = stylex.keyframes({
  "0%": { opacity: 0, transform: "scale(1.7) rotate(-4deg)" },
  "60%": { opacity: 1, transform: "scale(0.94) rotate(-4deg)" },
  "100%": { opacity: 1, transform: "scale(1) rotate(-4deg)" },
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
    gap: "1rem",
    minHeight: 0,
  },
  bodyDone: {
    flexDirection: { default: "column", [WIDE]: "row" },
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
  paper: {
    animationDuration: "900ms",
    animationName: { default: rise, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    aspectRatio: "1",
    borderRadius: 3,
    boxShadow:
      "0 0 0 1px rgb(214 176 92 / 0.75), 0 0 0 5px rgb(255 255 255 / 0.04), 0 30px 80px rgb(0 0 0 / 0.55), 0 0 120px rgb(255 236 200 / 0.12)",
    containerType: "inline-size",
    overflow: "hidden",
    position: "relative",
    width: "min(100cqmin, 36rem)",
  },
  canvas: {
    cursor: "crosshair",
    display: "block",
    height: "100%",
    touchAction: "none",
    userSelect: "none",
    WebkitTouchCallout: "none",
    width: "100%",
  },
  model: {
    color: "rgb(70 56 40 / 0.55)",
    fontFamily: font.mincho,
    fontSize: "max(0.75rem, 3cqw)",
    fontWeight: 700,
    insetBlockStart: "4.5%",
    insetInlineStart: "5%",
    letterSpacing: "calc(0.3em * var(--track, 1))",
    margin: 0,
    pointerEvents: "none",
    position: "absolute",
  },
  guide: {
    height: "100%",
    inset: 0,
    pointerEvents: "none",
    position: "absolute",
    width: "100%",
  },
  guideLine: {
    animationDelay: "120ms",
    animationDuration: "900ms",
    animationFillMode: "backwards",
    animationName: { default: trace, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.65, 0, 0.35, 1)",
  },
  seal: {
    alignItems: "center",
    animationDelay: "800ms",
    animationDuration: "420ms",
    animationFillMode: "backwards",
    animationName: { default: stamp, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
    aspectRatio: "1",
    backgroundColor: VERMILION,
    borderRadius: "0.8cqw",
    bottom: "5%",
    boxShadow: "inset 0 0 0 0.5cqw rgb(255 255 255 / 0.12)",
    color: "#fff1e8",
    display: "flex",
    flexDirection: "column",
    fontFamily: font.mincho,
    fontSize: "4.2cqw",
    fontWeight: 700,
    justifyContent: "center",
    lineHeight: 1.05,
    mixBlendMode: "multiply",
    pointerEvents: "none",
    position: "absolute",
    right: "5%",
    transform: "rotate(-4deg)",
    width: "12%",
  },
});

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [phase, setPhase] = useState<Phase>("demo");
  const [ending, setEnding] = useState<Ending | null>(null);
  const [misses, setMisses] = useState(0);

  const lang = settings?.lang ?? hint;
  const words = copy[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    session.current =
      canvas === null
        ? null
        : startSession(canvas, {
            miss: () => {
              setMisses((count) => count + 1);
            },
            over: setEnding,
            phase: setPhase,
            save: setSave,
            settings: setSettings,
          });
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, []);

  const again = () => {
    setEnding(null);
    setMisses(0);
    session.current?.again();
  };

  const circle = ending?.circle ?? null;
  const seal = ending === null ? null : rankOf(ending.result.score).seal;

  return (
    <div {...stylex.props(styles.root)}>
      <Hud
        best={save?.best ?? 0}
        draws={save?.draws ?? 0}
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
      />
      <main {...stylex.props(styles.body, ending !== null && styles.bodyDone)}>
        <div {...stylex.props(styles.stage)}>
          <div {...stylex.props(styles.paper)}>
            <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
              {words.fallback}
            </canvas>
            {phase === "demo" ? (
              <p aria-hidden="true" {...stylex.props(styles.model)}>
                {words.model}
              </p>
            ) : null}
            {circle === null ? null : (
              <svg
                aria-hidden="true"
                viewBox="0 0 100 100"
                {...stylex.props(styles.guide)}
              >
                <circle
                  cx={circle.x * 100}
                  cy={circle.y * 100}
                  fill="none"
                  pathLength={1}
                  r={circle.r * 100}
                  stroke={VERMILION}
                  strokeDasharray="1"
                  strokeOpacity="0.75"
                  strokeWidth="0.32"
                  transform={`rotate(-90 ${circle.x * 100} ${circle.y * 100})`}
                  {...stylex.props(styles.guideLine)}
                />
              </svg>
            )}
            {seal === null ? null : (
              <span aria-hidden="true" {...stylex.props(styles.seal)}>
                <span>{seal[0]}</span>
                <span>{seal[1]}</span>
              </span>
            )}
          </div>
        </div>
        {ending === null ? (
          <Prompt
            challenge={challenge}
            drawing={phase === "drawing"}
            lang={lang}
            misses={misses}
          />
        ) : (
          <ResultSheet
            challenge={challenge}
            ending={ending}
            lang={lang}
            onAgain={again}
          />
        )}
      </main>
    </div>
  );
};
