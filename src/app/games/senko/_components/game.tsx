"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import { formatTime } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Ending, Stage } from "../_lib/session";
import { Hud } from "./hud";
import type { Notice } from "./hud";
import { ResultSheet } from "./result-sheet";

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
});

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const sway = useRef<HTMLSpanElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const ids = useRef(0);
  const langRef = useRef<Lang>(hint);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [phase, setPhase] = useState(0);
  const [shout, setShout] = useState<number | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);

  const lang = settings?.lang ?? hint;

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const nextId = () => {
      ids.current += 1;
      return ids.current;
    };
    const tell = (text: string) => {
      setNotice({ id: nextId(), text });
    };
    session.current =
      canvas === null
        ? null
        : startSession(canvas, challenge, {
            clock: (time) => {
              if (clock.current) {
                clock.current.textContent = formatTime(time);
              }
            },
            interrupted: () => {
              tell(copy[langRef.current].interrupted);
            },
            over: setEnding,
            passed: () => {
              tell(copy[langRef.current].challenge.passed);
            },
            phase: (next) => {
              setPhase(next);
              setShout(next > 0 ? nextId() : null);
            },
            save: setSave,
            settings: setSettings,
            stage: (next) => {
              setStage(next);
              if (next === "burning") {
                setNotice(null);
              }
            },
            sway: (level) => {
              if (sway.current) {
                sway.current.style.clipPath = `inset(0 ${(100 - Math.min(1, level) * 100).toFixed(1)}% 0 0)`;
              }
            },
          });
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, [challenge]);

  const again = () => {
    setEnding(null);
    setShout(null);
    setNotice(null);
    session.current?.again();
  };

  return (
    <>
      <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
        {copy[lang].fallback}
      </canvas>
      <Hud
        best={save?.best ?? 0}
        challenge={challenge}
        clock={clock}
        finishes={save?.finishes ?? 0}
        lang={lang}
        muted={settings?.muted ?? false}
        notice={notice}
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
        phase={phase}
        runs={save?.runs ?? 0}
        shout={shout}
        stage={stage}
        sway={sway}
      />
      {ending === null ? null : (
        <ResultSheet
          challenge={challenge}
          ending={ending}
          lang={lang}
          onAgain={again}
        />
      )}
      <LanguagePicker
        lang={lang}
        onSettings={(next) => session.current?.settings(next)}
        settings={settings}
      />
    </>
  );
};
