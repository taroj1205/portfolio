"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import type { Side } from "../_lib/duel";
import type { Challenge } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Beat, Ending, Mode, Stage, Verdict } from "../_lib/session";
import { Hud } from "./hud";
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
  challenge: Challenge | null;
  hint: Lang;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stage, setStage] = useState<Stage>("title");
  const [mode, setMode] = useState<Mode>("solo");
  const [rung, setRung] = useState(0);
  const [tally, setTally] = useState<Record<Side, number>>({
    left: 0,
    right: 0,
  });
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [beat, setBeat] = useState<Beat>(null);
  const [duels, setDuels] = useState(0);
  const [interrupted, setInterrupted] = useState(false);
  const [ending, setEnding] = useState<Ending | null>(null);

  const lang = settings?.lang ?? hint;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    session.current =
      canvas === null
        ? null
        : startSession(canvas, challenge, {
            beat: setBeat,
            interrupted: () => {
              setInterrupted(true);
            },
            mode: setMode,
            over: setEnding,
            rung: setRung,
            save: setSave,
            settings: setSettings,
            stage: (next) => {
              setStage(next);
              if (next === "duel") {
                setDuels((count) => count + 1);
                setInterrupted(false);
                setEnding(null);
              }
            },
            tally: setTally,
            verdict: setVerdict,
          });
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, [challenge]);

  return (
    <>
      <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
        {copy[lang].fallback}
      </canvas>
      <Hud
        beat={beat}
        challenge={challenge}
        duels={duels}
        interrupted={interrupted}
        lang={lang}
        mode={mode}
        muted={settings?.muted ?? false}
        onEngage={() => session.current?.engage()}
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
        onQuit={() => session.current?.title()}
        onStart={(next) => session.current?.start(next)}
        rung={rung}
        save={save}
        stage={stage}
        tally={tally}
        verdict={verdict}
      />
      {ending === null || stage !== "result" ? null : (
        <ResultSheet
          challenge={challenge}
          ending={ending}
          lang={lang}
          onAgain={() => session.current?.start(ending.mode)}
          onLadder={() => session.current?.start("solo")}
          onSharing={(open) => session.current?.pause(open)}
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
