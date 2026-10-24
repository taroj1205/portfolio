"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import type { Feel } from "../_lib/copy";
import type { DishId } from "../_lib/dishes";
import { lengthText, measure, nextOf } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Ending, Meter, Stage } from "../_lib/session";
import { SWEET } from "../_lib/stretch";
import type { End } from "../_lib/stretch";
import { Hud } from "./hud";
import type { Notice } from "./hud";
import { ResultSheet } from "./result-sheet";

const tint: Record<Feel, string> = {
  loose: "#fffaf3",
  slack: "#fffaf3",
  sweet: "#ffd27a",
  tight: "#ff6b4a",
};

const styles = stylex.create({
  canvas: {
    cursor: "ns-resize",
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

const feelOf = ({ load, loose }: Meter): Feel => {
  if (loose) {
    return "loose";
  }

  if (load > 1) {
    return "tight";
  }

  return load >= SWEET ? "sweet" : "slack";
};

const write = (node: HTMLElement | null, text: string) => {
  if (node !== null && node.textContent !== text) {
    node.textContent = text;
  }
};

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const feelRef = useRef<HTMLSpanElement>(null);
  const heatRef = useRef<HTMLSpanElement>(null);
  const needleRef = useRef<HTMLSpanElement>(null);
  const nextRef = useRef<HTMLSpanElement>(null);
  const unitRef = useRef<HTMLSpanElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const ids = useRef(0);
  const langRef = useRef<Lang>(hint);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [dish, setDish] = useState<DishId | null>(null);
  const [alive, setAlive] = useState(0);
  const [strands, setStrands] = useState(0);

  const [shout, setShout] = useState<{ id: number; index: number } | null>(
    null
  );

  const [notice, setNotice] = useState<Notice | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [end, setEnd] = useState<End | null>(null);

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

    const showLength = (cm: number) => {
      const { unit, value } = measure(cm);
      write(valueRef.current, value);
      write(unitRef.current, unit);
      const next = nextOf(cm);
      write(
        nextRef.current,
        next === null
          ? ""
          : copy[langRef.current].next(
              next.height.name[langRef.current],
              lengthText(next.left, langRef.current)
            )
      );
    };

    const showMeter = (meter: Meter) => {
      const { load, heat } = meter;
      const feel = feelOf(meter);

      if (needleRef.current) {
        needleRef.current.style.left = `${(Math.min(1.5, load) / 1.5) * 100}%`;
      }

      if (heatRef.current) {
        heatRef.current.style.transform = `scaleX(${Math.max(0, heat).toFixed(3)})`;
      }

      if (feelRef.current) {
        feelRef.current.style.color = tint[feel];
      }

      write(feelRef.current, copy[langRef.current].feel[feel]);
    };

    session.current =
      canvas === null
        ? null
        : startSession(canvas, challenge, () => langRef.current, {
            alive: (count, total) => {
              setAlive(count);
              setStrands(total);
            },
            beat: () => {
              tell(copy[langRef.current].record);
            },
            dish: setDish,
            end: setEnd,
            height: (index) => {
              setShout({ id: nextId(), index });
            },
            interrupted: () => {
              tell(copy[langRef.current].interrupted);
            },
            length: showLength,
            meter: showMeter,
            over: setEnding,
            passed: () => {
              tell(copy[langRef.current].challenge.passed);
            },
            save: setSave,
            settings: setSettings,
            stage: (next) => {
              setStage(next);

              if (next === "pulling") {
                setNotice(null);
                setShout(null);
                setEnd(null);
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
        alive={alive}
        best={dish === null || save === null ? 0 : save.dishes[dish]}
        challenge={challenge}
        dish={dish}
        end={end}
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
        feel={feelRef}
        heat={heatRef}
        needle={needleRef}
        next={nextRef}
        unit={unitRef}
        value={valueRef}
        shout={shout}
        stage={stage}
        strands={strands}
      />
      {ending === null ? null : (
        <ResultSheet
          challenge={challenge}
          ending={ending}
          lang={lang}
          onAgain={again}
          save={save}
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
