"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import type { Result } from "../_lib/result";
import { startSession } from "../_lib/session";
import type { Phase } from "../_lib/session";
import { Hud } from "./hud";
import { ResultSheet } from "./result-sheet";

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
});

export const Game = ({ challenge }: { challenge: Result | null }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const distanceRef = useRef<HTMLSpanElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [skips, setSkips] = useState(0);
  const [landed, setLanded] = useState<{
    result: Result;
    record: boolean;
  } | null>(null);
  const [best, setBest] = useState<number | null>(null);
  const [thrown, setThrown] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    session.current =
      canvas === null
        ? null
        : startSession(canvas, {
            best: setBest,
            distance: (meters) => {
              if (distanceRef.current) {
                distanceRef.current.textContent = `${meters.toFixed(1)} m`;
              }
            },
            land: (result, record) => {
              setLanded({ record, result });
            },
            phase: (next) => {
              setPhase(next);
              if (next === "flying") {
                setThrown(true);
              }
            },
            skip: setSkips,
          });
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, []);

  const toggleMute = () => {
    setMuted(!muted);
    session.current?.mute(!muted);
  };

  return (
    <>
      <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
        川に石を投げて、何回跳ねるかを競うゲーム。画面を押したまま上にはじくか、スペースキーを押して離すと投げられる。
      </canvas>
      <Hud
        best={best}
        challenge={thrown ? null : challenge}
        distanceRef={distanceRef}
        muted={muted}
        onMute={toggleMute}
        phase={phase}
        skips={skips}
      />
      {landed !== null && phase === "done" ? (
        <ResultSheet
          onAgain={() => session.current?.again()}
          record={landed.record}
          result={landed.result}
        />
      ) : null}
    </>
  );
};
