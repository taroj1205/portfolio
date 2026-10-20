"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { TIER, TOP, kindOf } from "../_lib/bodies";
import { copy } from "../_lib/copy";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Ending } from "../_lib/session";
import type { Merge } from "../_lib/world";
import { CareerSheet } from "./career-sheet";
import { Hud } from "./hud";
import type { Shout } from "./hud";
import { ResultSheet } from "./result-sheet";

const styles = stylex.create({
  canvas: {
    cursor: "crosshair",
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

const TUTORIAL_DROPS = 4;
const ALERT = 0.3;

const shoutOf = (merge: Merge, lang: Lang): Omit<Shout, "id"> | null => {
  if (merge.made === null) {
    return { gold: true, text: `${copy[lang].result.galaxy}！` };
  }
  if (merge.chain > 1) {
    return { gold: true, text: copy[lang].chain(merge.chain) };
  }
  if (merge.made >= TIER.saturn) {
    return { gold: merge.made === TOP, text: kindOf(merge.made).name[lang] };
  }
  return null;
};

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const vignette = useRef<HTMLDivElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const shouts = useRef(0);
  const langRef = useRef<Lang>(hint);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [score, setScore] = useState(0);
  const [next, setNext] = useState(0);
  const [drops, setDrops] = useState(0);
  const [alert, setAlert] = useState(false);
  const [shout, setShout] = useState<Shout | null>(null);
  const [banner, setBanner] = useState<{ id: number; tier: number } | null>(
    null
  );
  const [ending, setEnding] = useState<Ending | null>(null);
  const [careerOpen, setCareerOpen] = useState(false);

  const lang = settings?.lang ?? hint;

  useEffect(() => {
    langRef.current = lang;
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const nextId = () => {
      shouts.current += 1;
      return shouts.current;
    };
    session.current =
      canvas === null
        ? null
        : startSession(canvas, {
            danger: (level) => {
              if (vignette.current) {
                vignette.current.style.opacity = String(level);
              }
              setAlert(level > ALERT);
            },
            discover: (tier) => {
              setBanner({ id: nextId(), tier });
            },
            drop: () => {
              setDrops((count) => count + 1);
            },
            merge: (merge) => {
              const call = shoutOf(merge, langRef.current);
              if (call !== null) {
                setShout({ ...call, id: nextId() });
              }
            },
            over: setEnding,
            queue: ([, upcoming]) => {
              setNext(upcoming);
            },
            save: setSave,
            score: setScore,
            settings: setSettings,
          });
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, []);

  useEffect(() => {
    session.current?.pause(careerOpen);
  }, [careerOpen]);

  const again = () => {
    setEnding(null);
    setShout(null);
    setBanner(null);
    session.current?.again();
  };

  return (
    <>
      <canvas ref={canvasRef} {...stylex.props(styles.canvas)}>
        {copy[lang].fallback}
      </canvas>
      <Hud
        alert={alert}
        banner={banner}
        best={save?.best ?? 0}
        challenge={drops === 0 ? challenge : null}
        lang={lang}
        muted={settings?.muted ?? false}
        next={next}
        onLang={() => {
          if (settings !== null) {
            session.current?.settings({
              ...settings,
              lang: lang === "ja" ? "en" : "ja",
            });
          }
        }}
        onMute={() => {
          if (settings !== null) {
            session.current?.settings({
              ...settings,
              muted: !settings.muted,
            });
          }
        }}
        onRestart={again}
        onStats={() => {
          setCareerOpen(true);
        }}
        opener={opener}
        playing={ending === null}
        reached={save?.top ?? -1}
        score={score}
        shout={shout}
        tutorial={save?.runs === 0 && drops < TUTORIAL_DROPS}
        vignette={vignette}
      />
      {ending === null ? null : (
        <ResultSheet ending={ending} lang={lang} onAgain={again} />
      )}
      {save === null || save.runs === 0 || save.top < 0 ? null : (
        <CareerSheet
          lang={lang}
          onClose={() => {
            setCareerOpen(false);
          }}
          open={careerOpen}
          opener={opener}
          save={save}
        />
      )}
    </>
  );
};
