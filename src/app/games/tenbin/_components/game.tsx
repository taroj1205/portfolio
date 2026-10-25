"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import { ink } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import type { Mode } from "../_lib/copy";
import { dayOf, gradesOf, itemOfDay, outcomeOf } from "../_lib/daily";
import type { Shared } from "../_lib/result";
import {
  boardOf,
  keepBoard,
  loadSave,
  settleDaily,
  settleVersus,
  storeSave,
} from "../_lib/save";
import type { Save } from "../_lib/save";
import { createSound } from "../_lib/sound";
import { Daily } from "./daily";
import type { Puzzle } from "./daily";
import { Hud, ModeSwitch } from "./hud";
import { DailySheet } from "./result-sheet";
import { Versus } from "./versus";

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
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "0.7rem",
    minHeight: 0,
  },
});

const puzzleOf = (shared: Shared | null, today: number): Puzzle => {
  const item = itemOfDay(today);

  if (shared?.kind === "daily" && shared.solve.item.id !== item.id) {
    return { day: null, item: shared.solve.item };
  }

  return { day: today, item };
};

interface GameProps {
  shared: Shared | null;
  hint: Lang;
}

const Play = ({ shared, hint, today }: GameProps & { today: number }) => {
  const [save, setSave] = useState(loadSave);
  const [settings, setSettings] = useState(loadSettings);

  const [mode, setMode] = useState<Mode>(
    shared?.kind === "versus" ? "versus" : "daily"
  );

  const [linked, setLinked] = useState(shared);
  const [practice, setPractice] = useState<number[]>([]);
  const sound = useRef<ReturnType<typeof createSound> | null>(null);
  const started = useRef(0);

  const lang = settings.lang ?? hint;

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

  const keep = (next: Save) => {
    storeSave(next);
    setSave(next);
  };

  const changeSettings = (next: Settings) => {
    storeSettings(next);
    setSettings(next);
  };

  const puzzle = puzzleOf(linked, today);
  const { item, day } = puzzle;
  const guesses = day === null ? practice : boardOf(save, day, item.id);
  const grades = gradesOf(guesses, item);

  const challenge =
    linked?.kind === "daily" && linked.solve.item.id === item.id
      ? linked.solve
      : null;

  const guess = (step: number) => {
    sound.current?.unlock();
    const next = [...guesses, step];
    const nextGrades = gradesOf(next, item);
    const outcome = outcomeOf(nextGrades);
    const grade = nextGrades.at(-1);
    sound.current?.clunk();

    if (grade !== undefined) {
      sound.current?.grade(grade);
    }

    if (day === null) {
      setPractice(next);
    }

    const boarded = day === null ? save : keepBoard(save, day, item.id, next);

    if (outcome === "playing") {
      if (day !== null) {
        keep(boarded);
      }

      return;
    }

    keep(
      settleDaily(boarded, {
        at: Date.now(),
        day,
        outcome,
        seconds: (performance.now() - started.current) / 1000,
        tries: next.length,
      })
    );
  };

  const toToday = () => {
    setLinked(null);
    setPractice([]);
    setMode("daily");
    started.current = performance.now();
  };

  const toMode = (next: Mode) => {
    sound.current?.unlock();
    setMode(next);
    started.current = performance.now();
  };

  return (
    <div {...stylex.props(styles.root)}>
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
        <ModeSwitch lang={lang} mode={mode} onMode={toMode} />
        {mode === "daily" ? (
          <Daily
            challenge={challenge}
            guesses={guesses}
            key={`${item.id}-${day}`}
            lang={lang}
            onGuess={guess}
            puzzle={puzzle}
          >
            <DailySheet
              lang={lang}
              onToday={toToday}
              onVersus={() => {
                toMode("versus");
              }}
              save={save}
              solve={{ day, grades, item }}
            />
          </Daily>
        ) : (
          <Versus
            best={save.versus.best}
            challenge={linked?.kind === "versus" ? linked.chain : null}
            lang={lang}
            onPick={(right) => {
              sound.current?.unlock();
              sound.current?.verdict(right);
            }}
            onSettle={(chain, seconds) => {
              const settled = settleVersus(save, {
                at: Date.now(),
                chain,
                seconds,
              });

              keep(settled.save);

              return {
                best: settled.save.versus.best,
                chain,
                record: settled.record,
              };
            }}
            onToday={toToday}
          />
        )}
      </main>
      <LanguagePicker
        lang={lang}
        onSettings={changeSettings}
        settings={settings}
      />
    </div>
  );
};

const CLOCK_MS = 30_000;

const watchClock = (notify: () => void) => {
  const timer = setInterval(notify, CLOCK_MS);
  document.addEventListener("visibilitychange", notify);

  return () => {
    clearInterval(timer);
    document.removeEventListener("visibilitychange", notify);
  };
};

const todayNow = () => dayOf(Date.now());

const noDay = () => null;

export const Game = (props: GameProps) => {
  const today = useSyncExternalStore(watchClock, todayNow, noDay);

  return today === null ? null : <Play {...props} today={today} />;
};
