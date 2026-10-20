"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { distanceParts } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Beat, Landing, Phase, Release } from "../_lib/session";
import type { Ending, Event, Grade } from "../_lib/simulate";
import { Hud } from "./hud";
import type { Popup } from "./hud";
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

const releaseCall = ({ tilt, quality }: Release): Omit<Popup, "id"> => {
  if (quality === 100) {
    return { text: "神投げ", tone: "gold" };
  }
  let hint = "";
  if (tilt > 23) {
    hint = " 立てすぎ";
  } else if (tilt < 17) {
    hint = " 寝かせすぎ";
  }
  if (quality >= 90) {
    return { text: `${quality}% 惜しい！${hint}`, tone: "gold" };
  }
  return { text: `${quality}%${hint}`, tone: quality >= 60 ? "white" : "grey" };
};

const eventCalls: Record<Event, Omit<Popup, "id">> = {
  duck: { text: "グワッ！", tone: "white" },
  fish: { text: "鯉ジャンプ！", tone: "green" },
  lotus: { text: "ポンッ", tone: "green" },
  rock: { text: "カーン！", tone: "gold" },
  wall: { text: "カツン", tone: "grey" },
};

const gradeCalls: Record<Grade, Omit<Popup, "id"> | null> = {
  early: { text: "はやい", tone: "grey" },
  good: { text: "ナイス", tone: "white" },
  miss: null,
  perfect: { text: "パーフェクト", tone: "gold" },
};

const beatCall = (beat: Beat) => {
  if (beat.event !== null) {
    return eventCalls[beat.event];
  }
  return beat.grade === null ? null : gradeCalls[beat.grade];
};

const endCalls: Record<Ending, string> = {
  leaf: "ふわっ",
  plop: "ぽちゃん",
  sink: "ちゃぽん",
};

export const Game = ({ challenge }: { challenge: Result | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waterRef = useRef<HTMLCanvasElement>(null);
  const meterValue = useRef<HTMLSpanElement>(null);
  const meterUnit = useRef<HTMLSpanElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const shouts = useRef(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [skips, setSkips] = useState(0);
  const [combo, setCombo] = useState(0);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [landed, setLanded] = useState<Landing | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [thrown, setThrown] = useState(false);
  const [workshop, setWorkshop] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);
  const [banner, setBanner] = useState<{ id: number; name: string } | null>(
    null
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const waterCanvas = waterRef.current;
    const shout = (call: Omit<Popup, "id">) => {
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
                shout({ text: endCalls[ending], tone: "white" });
              },
              land: setLanded,
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
              zone: (name) => {
                shouts.current += 1;
                setBanner({ id: shouts.current, name });
              },
            }
          );
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, []);

  return (
    <>
      <canvas
        aria-hidden="true"
        ref={waterRef}
        {...stylex.props(styles.canvas, styles.water)}
      />
      <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
        川に石を投げて、どこまで跳ねるかを競うゲーム。画面を押したまま上にはじくか、スペースキーを押して離すと投げられる。石が水面に着く瞬間にタップするか、スペースキーを押すと加速する。
      </canvas>
      <Hud
        banner={banner}
        challenge={thrown ? null : challenge}
        onWorkshop={() => {
          setWorkshop(true);
        }}
        opener={opener}
        combo={combo}
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
      {save === null ? null : (
        <Workshop
          onClose={() => {
            setWorkshop(false);
            session.current?.seen();
          }}
          onRespec={() => session.current?.respec()}
          onSettings={(next) => session.current?.settings(next)}
          onTune={(key, step) => session.current?.tune(key, step)}
          onWear={(part, id) => session.current?.wear(part, id)}
          open={workshop}
          opener={opener}
          save={save}
        />
      )}
    </>
  );
};
