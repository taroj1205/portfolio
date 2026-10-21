"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import { ink, media } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import { codeOf, firstDesign } from "../_lib/eraser";
import type { Design } from "../_lib/eraser";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Call, Ending, Phase } from "../_lib/session";
import { Callout, ChallengeChip, Hud, Prompt, ScoreSheet } from "./hud";
import { ResultSheet } from "./result-sheet";
import { Workshop } from "./workshop";

const fadeIn = stylex.keyframes({
  "0%": { opacity: 0 },
  "100%": { opacity: 1 },
});

const styles = stylex.create({
  canvas: {
    animationDuration: "1200ms",
    animationName: { default: fadeIn, [media.reduce]: "none" },
    animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
    cursor: "grab",
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
  aiming: {
    cursor: "grabbing",
  },
  overlay: {
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    inset: 0,
    paddingBlock:
      "max(1rem, calc(env(safe-area-inset-top) + 0.6rem)) max(1rem, calc(env(safe-area-inset-bottom) + 0.6rem))",
    paddingInline:
      "max(1rem, calc(env(safe-area-inset-left) + 0.6rem)) max(1rem, calc(env(safe-area-inset-right) + 0.6rem))",
    pointerEvents: "none",
    position: "fixed",
  },
  spacer: {
    flexGrow: 1,
  },
});

const isBorrowed = (challenge: Result | null, design: Design) =>
  challenge !== null && codeOf(challenge.design) === codeOf(design);

const screenOf = (phase: Phase, rolls: number[], over: boolean) => ({
  playing:
    !over && (phase === "aiming" || phase === "rolling" || rolls.length > 0),
  start: !over && rolls.length === 0 && phase === "ready",
});

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [rolls, setRolls] = useState<number[]>([]);
  const [call, setCall] = useState<Call | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [workshop, setWorkshop] = useState(false);

  const lang = settings?.lang ?? hint;
  const design: Design = save?.design ?? firstDesign;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    session.current =
      canvas === null
        ? null
        : startSession(canvas, {
            call: setCall,
            over: setEnding,
            phase: setPhase,
            rolls: setRolls,
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
    setCall(null);
    session.current?.again();
  };

  const { playing, start } = screenOf(phase, rolls, ending !== null);

  return (
    <>
      <canvas
        ref={canvasRef}
        {...stylex.props(styles.canvas, phase === "aiming" && styles.aiming)}
      >
        {copy[lang].fallback}
      </canvas>
      <div {...stylex.props(styles.overlay)}>
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
          onQuit={() => {
            setCall(null);
            session.current?.quit();
          }}
          playing={playing}
        />
        <ScoreSheet lang={lang} rolls={rolls} />
        {start && challenge !== null ? (
          <ChallengeChip
            borrowed={isBorrowed(challenge, design)}
            challenge={challenge}
            lang={lang}
            onBorrow={() => {
              session.current?.design(challenge.design);
            }}
          />
        ) : null}
        <div {...stylex.props(styles.spacer)} />
        {start ? (
          <Prompt
            best={save?.best ?? 0}
            design={design}
            lang={lang}
            onWorkshop={() => {
              setWorkshop(true);
            }}
            opener={opener}
            runs={save?.runs ?? 0}
          />
        ) : null}
        {ending !== null && save !== null ? (
          <ResultSheet
            challenge={challenge}
            ending={ending}
            lang={lang}
            onAgain={again}
            onWorkshop={() => {
              again();
              setWorkshop(true);
            }}
            save={save}
          />
        ) : null}
      </div>
      <Callout call={call} lang={lang} />
      <Workshop
        design={design}
        lang={lang}
        onClose={() => {
          setWorkshop(false);
        }}
        onDesign={(next) => session.current?.design(next)}
        open={workshop}
        opener={opener}
      />
      <LanguagePicker
        lang={lang}
        onSettings={(next) => session.current?.settings(next)}
        settings={settings}
      />
    </>
  );
};
