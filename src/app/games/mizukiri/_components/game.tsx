"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { guessLang } from "../../_lib/i18n";
import type { Lang, Text } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import type { Copy } from "../_lib/copy";
import { distanceParts, toKmh } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Beat, Landing, Phase, Release } from "../_lib/session";
import { isBounce } from "../_lib/simulate";
import type { Event, Grade } from "../_lib/simulate";
import { Hud } from "./hud";
import type { Popup } from "./hud";
import { LangContext } from "./lang";
import { LanguagePicker } from "./language-picker";
import { ResultSheet } from "./result-sheet";
import { Workshop } from "./workshop";

const styles = stylex.create({
  canvas: {
    cursor: "grab",
    display: "block",
    height: "100%",
    inset: 0,
    position: "fixed",
    touchAction: "none",
    userSelect: "none",
    WebkitTouchCallout: "none",
    width: "100%",
  },
  water: {
    pointerEvents: "none",
  },
});

const TUTORIAL_RUNS = 3;

type Call = Omit<Popup, "id">;

const releaseCall = ({ tilt, quality }: Release): Call => {
  if (quality === 100) {
    return { say: (words) => words.release.divine, tone: "gold" };
  }
  let lean: "steep" | "flat" | null = null;
  if (tilt > 23) {
    lean = "steep";
  } else if (tilt < 17) {
    lean = "flat";
  }
  const hint = (words: Copy) => (lean === null ? "" : words.release[lean]);
  if (quality >= 90) {
    return {
      say: (words) => `${words.release.close(quality)}${hint(words)}`,
      tone: "gold",
    };
  }
  return {
    say: (words) => `${words.release.plain(quality)}${hint(words)}`,
    tone: quality >= 60 ? "white" : "grey",
  };
};

const eventTones: Record<Event, Popup["tone"]> = {
  dragonfly: "gold",
  duck: "white",
  fish: "green",
  lotus: "green",
  rock: "gold",
  wall: "grey",
};

const gradeTones: Record<Grade, Popup["tone"]> = {
  early: "grey",
  good: "white",
  miss: "grey",
  perfect: "gold",
};

const beatCall = ({ event, grade }: Beat): Call | null => {
  if (isBounce(event) && grade !== null) {
    return {
      say: (words) => `${words.events[event]} ${words.grades[grade]}`,
      tone: eventTones[event],
    };
  }
  if (event !== null) {
    return { say: (words) => words.events[event], tone: eventTones[event] };
  }
  if (grade === null) {
    return null;
  }
  return { say: (words) => words.grades[grade], tone: gradeTones[grade] };
};

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang | null;
}) => {
  const duelOnly = challenge !== null && !challenge.journey;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waterRef = useRef<HTMLCanvasElement>(null);
  const meterValue = useRef<HTMLSpanElement>(null);
  const meterUnit = useRef<HTMLSpanElement>(null);
  const paceValue = useRef<HTMLSpanElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const shouts = useRef(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [skips, setSkips] = useState(0);
  const [combo, setCombo] = useState(0);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [landed, setLanded] = useState<Landing | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [thrown, setThrown] = useState(false);
  const [workshop, setWorkshop] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const [banner, setBanner] = useState<{ id: number; name: Text } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const waterCanvas = waterRef.current;
    const shout = (call: Call) => {
      shouts.current += 1;
      setPopup({ ...call, id: shouts.current });
    };
    session.current =
      canvas === null || waterCanvas === null
        ? null
        : startSession(
            { scene: canvas, water: waterCanvas },
            {
              beat: (beat) => {
                setSkips(beat.skips);
                setCombo(beat.combo);
                const call = beatCall(beat);
                if (call) {
                  shout(call);
                }
              },
              distance: (meters) => {
                const [value, unit] = distanceParts(meters);
                if (meterValue.current && meterUnit.current) {
                  meterValue.current.textContent = value;
                  meterUnit.current.textContent = unit;
                }
              },
              end: (ending) => {
                setCombo(0);
                shout({ say: (words) => words.endings[ending], tone: "white" });
              },
              land: setLanded,
              late: () => {
                shout({ say: (words) => words.late, tone: "grey" });
              },
              phase: (next) => {
                setPhase(next);
                if (next === "ready" || next === "flying") {
                  setBanner(null);
                }
                if (next === "ready") {
                  setSkips(0);
                  setCombo(0);
                  setPopup(null);
                }
              },
              release: (release) => {
                setThrown(true);
                shout(releaseCall(release));
              },
              save: setSave,
              settings: setSettings,
              speed: (metersPerSecond) => {
                if (paceValue.current) {
                  paceValue.current.textContent = String(
                    toKmh(metersPerSecond)
                  );
                }
              },
              zone: (name) => {
                shouts.current += 1;
                setBanner({ id: shouts.current, name });
              },
            },
            duelOnly
          );
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, [duelOnly]);

  let lang: Lang = hint ?? "ja";
  if (settings !== null) {
    lang = settings.lang ?? hint ?? guessLang();
  }

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LangContext value={lang}>
      <canvas
        aria-hidden="true"
        ref={waterRef}
        {...stylex.props(styles.canvas, styles.water)}
      />
      <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
        {copy[lang].fallback}
      </canvas>
      <Hud
        banner={banner}
        challenge={
          thrown || (save !== null && save.mode !== "duel") ? null : challenge
        }
        onReset={() => session.current?.again()}
        onWorkshop={() => {
          setWorkshop(true);
        }}
        opener={opener}
        combo={combo}
        paceRef={paceValue}
        unitRef={meterUnit}
        valueRef={meterValue}
        phase={phase}
        popup={popup}
        save={save}
        skips={skips}
        tutorial={(save?.runs ?? 0) < TUTORIAL_RUNS}
      />
      {landed !== null && save !== null && phase === "done" ? (
        <ResultSheet
          landing={landed}
          onAgain={() => session.current?.again()}
          onWear={(part, id) => session.current?.wear(part, id)}
          onWorkshop={() => {
            setWorkshop(true);
          }}
          save={save}
        />
      ) : null}
      {save === null || settings === null ? null : (
        <Workshop
          onClose={() => {
            setWorkshop(false);
            session.current?.seen();
          }}
          onMode={(next) => session.current?.switchMode(next)}
          onRespec={() => session.current?.respec()}
          onSettings={(next) => session.current?.settings(next)}
          onTrain={(key, step) => session.current?.train(key, step)}
          onTune={(key, step) => session.current?.tune(key, step)}
          onWear={(part, id) => session.current?.wear(part, id)}
          onWearCombo={(id) => session.current?.wearCombo(id)}
          open={workshop}
          opener={opener}
          save={save}
          settings={settings}
        />
      )}
      {settings === null ? null : (
        <LanguagePicker
          lang={lang}
          onPick={(next) =>
            session.current?.settings({ ...settings, lang: next })
          }
          open={settings.lang === null}
        />
      )}
    </LangContext>
  );
};
