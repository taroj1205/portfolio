"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import { ink } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import { formatTime } from "../_lib/judge";
import { gapOf, planOf } from "../_lib/result";
import type { Mode, Result } from "../_lib/result";
import { officialOf, streakOn } from "../_lib/save";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Ending, Phase } from "../_lib/session";
import { Dial } from "./dial";
import type { Reveal } from "./dial";
import { Hud, Prompt } from "./hud";
import type { Notice } from "./hud";
import { ResultSheet } from "./result-sheet";

const DEMO_MISS = 13;
const WIDE = "@media (min-width: 900px)";

const styles = stylex.create({
  canvas: {
    cursor: "pointer",
    display: "block",
    height: "100%",
    inset: 0,
    position: "fixed",
    touchAction: "none",
    userSelect: "none",
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    width: "100%",
  },
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
    pointerEvents: "none",
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
    alignItems: { default: null, [WIDE]: "center" },
    flexDirection: { default: "column", [WIDE]: "row" },
    gap: { default: "0.75rem", [WIDE]: "2.5rem" },
    marginInline: { default: null, [WIDE]: "auto" },
    maxWidth: { default: null, [WIDE]: "68rem" },
    width: "100%",
  },
});

const paint = (
  clock: HTMLSpanElement | null,
  face: HTMLDivElement | null,
  time: number,
  opacity: number
) => {
  if (clock) {
    clock.textContent = formatTime(time);
  }

  if (face) {
    face.style.opacity = opacity.toFixed(3);
    face.style.filter =
      opacity < 1 ? `blur(${((1 - opacity) * 14).toFixed(1)}px)` : "";
  }
};

const revealOf = (
  ending: Ending | null,
  demo: boolean,
  target: number
): Reveal | null => {
  if (ending !== null) {
    return { demo: false, target: ending.target, time: ending.result.time };
  }

  return demo ? { demo: true, target, time: target - DEMO_MISS } : null;
};

const dailyOf = (save: Save | null, today: number | null) => {
  const official =
    save === null || today === null ? null : officialOf(save, today);

  return save === null || official === null
    ? null
    : { gap: gapOf(official), streak: streakOn(save, official.day) };
};

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const face = useRef<HTMLDivElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const ids = useRef(0);
  const langRef = useRef<Lang>(hint);
  const modeRef = useRef<Mode>("standard");
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [phase, setPhase] = useState<Phase>("demo");
  const [today, setToday] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("standard");
  const [demo, setDemo] = useState(false);
  const [early, setEarly] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);

  const lang = settings?.lang ?? hint;
  const plan = planOf(mode, challenge, today ?? 0);

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    session.current =
      canvas === null
        ? null
        : startSession(canvas, {
            clock: (time, opacity) => {
              paint(clock.current, face.current, time, opacity);
            },
            demo: setDemo,
            early: () => {
              setEarly((count) => count + 1);
            },
            over: setEnding,
            phase: (next) => {
              setPhase(next);

              if (next === "shown") {
                setEarly(0);
                setNotice(null);
              }
            },
            plan: (now) => planOf(modeRef.current, challenge, now),
            save: setSave,
            settings: setSettings,
            today: setToday,
            voided: (reason) => {
              ids.current += 1;
              setNotice({
                id: ids.current,
                text: copy[langRef.current].voided[reason],
              });
            },
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

  const reveal = revealOf(ending, demo, plan.target);
  const daily = dailyOf(save, today);
  const playing = phase === "shown" || phase === "hidden";

  return (
    <>
      <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
        {copy[lang].fallback}
      </canvas>
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
          playing={playing}
        />
        <main
          {...stylex.props(styles.body, ending !== null && styles.bodyDone)}
        >
          <Dial
            clock={clock}
            early={early}
            face={face}
            lang={lang}
            onLand={() => {
              session.current?.land();
            }}
            phase={phase}
            reveal={reveal}
            target={plan.target}
          />
          {ending !== null && save !== null ? (
            <ResultSheet
              challenge={challenge}
              ending={ending}
              lang={lang}
              onAgain={again}
              save={save}
            />
          ) : (
            <Prompt
              challenge={challenge}
              best={
                save?.best[plan.day === null ? "standard" : "daily"] ?? null
              }
              daily={daily}
              idle={phase === "demo" || phase === "ready"}
              lang={lang}
              mode={mode}
              notice={notice}
              onMode={(next) => {
                setMode(next);
                session.current?.wake();
              }}
              plan={plan}
              runs={save?.runs ?? 0}
              today={today}
            />
          )}
        </main>
      </div>
      <LanguagePicker
        lang={lang}
        onSettings={(next) => session.current?.settings(next)}
        settings={settings}
      />
    </>
  );
};
