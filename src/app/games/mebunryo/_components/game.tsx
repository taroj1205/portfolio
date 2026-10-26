"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import { ink } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import type { Point } from "../../_lib/svg";
import {
  ROUNDS,
  grade,
  kinds,
  newSeed,
  puzzlesOf,
  totalOf,
} from "../_lib/puzzles";
import type { Graded } from "../_lib/puzzles";
import { verdictOf } from "../_lib/result";
import type { Shared } from "../_lib/result";
import { loadSave, settle, storeSave } from "../_lib/save";
import { createSound } from "../_lib/sound";
import { Hud } from "./hud";
import { Play } from "./play";
import { ResultSheet } from "./result-sheet";

const styles = stylex.create({
  root: {
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    inset: 0,
    overflowY: "auto",
    overscrollBehavior: "contain",
    paddingBlock:
      "max(1rem, calc(env(safe-area-inset-top) + 0.6rem)) max(1rem, calc(env(safe-area-inset-bottom) + 0.6rem))",
    paddingInline:
      "max(1rem, calc(env(safe-area-inset-left) + 0.6rem)) max(1rem, calc(env(safe-area-inset-right) + 0.6rem))",
    position: "fixed",
  },
  main: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "0.7rem",
  },
});

interface Run {
  seed: number;
  rival: number[] | null;
}

interface Finish {
  best: number;
  record: boolean;
}

interface GameProps {
  shared: Shared | null;
  hint: Lang;
}

const Session = ({ shared, hint }: GameProps) => {
  const [save, setSave] = useState(loadSave);
  const [settings, setSettings] = useState(loadSettings);

  const [run, setRun] = useState<Run>(() =>
    shared === null
      ? { rival: null, seed: newSeed() }
      : { rival: shared.marks, seed: shared.seed }
  );

  const [guess, setGuess] = useState<Point | null>(null);
  const [guesses, setGuesses] = useState<Point[]>([]);
  const [graded, setGraded] = useState<Graded[]>([]);
  const [finish, setFinish] = useState<Finish | null>(null);
  const [showing, setShowing] = useState(false);
  const [index, setIndex] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const sound = useRef<ReturnType<typeof createSound> | null>(null);
  const started = useRef(0);
  const lang = settings.lang ?? hint;
  const puzzles = puzzlesOf(run.seed);
  const puzzle = puzzles[index];
  const current = graded[index] ?? null;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    sound.current = createSound();
    started.current = performance.now();

    return () => {
      sound.current?.close();
      sound.current = null;
    };
  }, []);

  useEffect(() => {
    sound.current?.mute(settings.muted);
  }, [settings.muted]);

  const changeSettings = (next: Settings) => {
    storeSettings(next);
    setSettings(next);
  };

  const lock = () => {
    if (guess === null || puzzle === undefined || current !== null) {
      return;
    }

    sound.current?.unlock();
    const result = grade(puzzle, guess);
    const nextGraded = [...graded, result];
    setGraded(nextGraded);
    setGuesses([...guesses, guess]);
    sound.current?.lock();
    sound.current?.reveal(verdictOf(result.points));

    if (nextGraded.length < ROUNDS) {
      return;
    }

    const settled = settle(save, {
      answers: nextGraded.map((one, i) => ({
        error: one.error,
        kind: kinds[i],
        points: one.points,
      })),
      at: Date.now(),
      rival: run.rival === null ? null : totalOf(run.rival),
      seconds: (performance.now() - started.current) / 1000,
    });

    storeSave(settled.save);
    setSave(settled.save);
    setFinish({ best: settled.save.best, record: settled.record });
  };

  const next = () => {
    sound.current?.unlock();

    if (finish !== null) {
      root.current?.scrollTo({ top: 0 });
      setShowing(true);

      return;
    }

    setGuess(null);
    setIndex(index + 1);
  };

  const again = () => {
    window.history.replaceState(null, "", window.location.pathname);
    root.current?.scrollTo({ top: 0 });
    setRun({ rival: null, seed: newSeed() });
    setGuess(null);
    setGuesses([]);
    setGraded([]);
    setFinish(null);
    setShowing(false);
    setIndex(0);
    started.current = performance.now();
  };

  return (
    <div ref={root} {...stylex.props(styles.root)}>
      <Hud
        lang={lang}
        muted={settings.muted}
        onLang={() => {
          changeSettings({ ...settings, lang: lang === "ja" ? "en" : "ja" });
        }}
        onMute={(muted) => {
          changeSettings({ ...settings, muted });
        }}
      />
      <main {...stylex.props(styles.main)}>
        {showing && finish !== null ? (
          <ResultSheet
            best={finish.best}
            graded={graded}
            guesses={guesses}
            lang={lang}
            onAgain={again}
            puzzles={puzzles}
            record={finish.record}
            rival={run.rival}
            seed={run.seed}
          />
        ) : null}
        {!showing && puzzle !== undefined ? (
          <Play
            graded={current}
            guess={guess}
            index={index}
            lang={lang}
            marks={graded.map((one) => one.points)}
            onGuess={setGuess}
            onLock={lock}
            onNext={next}
            puzzle={puzzle}
            rival={run.rival}
          />
        ) : null}
      </main>
      <LanguagePicker
        lang={lang}
        onSettings={changeSettings}
        settings={settings}
      />
    </div>
  );
};

const watchStorage = (notify: () => void) => {
  window.addEventListener("storage", notify);

  return () => {
    window.removeEventListener("storage", notify);
  };
};

const onClient = () => true;

const onServer = () => false;

export const Game = (props: GameProps) => {
  const client = useSyncExternalStore(watchStorage, onClient, onServer);

  return client ? <Session {...props} /> : null;
};
