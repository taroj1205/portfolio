"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import type { Pour } from "../_lib/pour";
import { signed } from "../_lib/result";
import type { Glass, Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Ending, Stage } from "../_lib/session";
import { Hud } from "./hud";
import type { Notice } from "./hud";
import { ResultSheet } from "./result-sheet";

const GOLD = "#ffd27a";

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
  const reading = useRef<HTMLSpanElement>(null);
  const prose = useRef<HTMLDivElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const ids = useRef(0);
  const langRef = useRef<Lang>(hint);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [pour, setPour] = useState<Pour | null>(null);
  const [demo, setDemo] = useState<Glass | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);

  const lang = settings?.lang ?? hint;

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    session.current =
      canvas === null
        ? null
        : startSession(canvas, challenge, {
            demo: setDemo,
            interrupted: () => {
              ids.current += 1;
              setNotice({
                id: ids.current,
                text: copy[langRef.current].interrupted,
              });
            },
            over: setEnding,
            pour: setPour,
            reading: (mm) => {
              const text = signed(mm);
              if (reading.current && reading.current.textContent !== text) {
                reading.current.textContent = text;
                reading.current.style.color = mm > 0 ? GOLD : "";
              }
            },
            save: setSave,
            settings: setSettings,
            stage: (next) => {
              setStage(next);
              if (next === "pouring") {
                setNotice(null);
              }
            },
          });
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, [challenge]);

  useEffect(() => {
    const block = prose.current;
    const measure = () => {
      if (stage !== "idle" || block === null) {
        return;
      }
      const { left, top } = block.getBoundingClientRect();
      const parts = [...block.children].filter(
        (part): part is HTMLElement =>
          part instanceof HTMLElement && part.offsetHeight > 0
      );
      if (parts.length > 0) {
        session.current?.reserve({
          left: left + Math.min(...parts.map((part) => part.offsetLeft)),
          right:
            left +
            Math.max(
              ...parts.map((part) => part.offsetLeft + part.offsetWidth)
            ),
          top: top + Math.min(...parts.map((part) => part.offsetTop)),
        });
      }
    };
    const observer = new ResizeObserver(measure);
    if (block !== null) {
      observer.observe(block);
    }
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [stage]);

  const again = () => {
    setEnding(null);
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
        demo={demo}
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
        pour={pour}
        pours={save?.pours ?? 0}
        prose={prose}
        reading={reading}
        stage={stage}
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
