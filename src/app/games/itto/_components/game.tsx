"use client";

import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "react";

import { LanguagePicker } from "../../_components/language-picker";
import { ink } from "../../_components/theme.stylex";
import type { Lang } from "../../_lib/i18n";
import type { Settings } from "../../_lib/settings";
import { copy } from "../_lib/copy";
import { isRare } from "../_lib/foods";
import { kindTitle } from "../_lib/result";
import type { Result } from "../_lib/result";
import type { Save } from "../_lib/save";
import { startSession } from "../_lib/session";
import type { Ending, Slash, View } from "../_lib/session";
import { Board } from "./board";
import { Header, Panel } from "./hud";
import { ResultSheet } from "./result-sheet";

const WIDE = "@media (min-width: 900px) and (min-aspect-ratio: 1/1)";

const styles = stylex.create({
  root: {
    color: ink.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    inset: 0,
    paddingBlock:
      "max(1rem, calc(env(safe-area-inset-top) + 0.6rem)) max(1rem, calc(env(safe-area-inset-bottom) + 0.6rem))",
    paddingInline:
      "max(1rem, calc(env(safe-area-inset-left) + 0.6rem)) max(1rem, calc(env(safe-area-inset-right) + 0.6rem))",
    position: "fixed",
    userSelect: "none",
    WebkitUserSelect: "none",
  },
  body: {
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "1rem",
    minHeight: 0,
  },
  bodyDone: {
    flexDirection: { default: "column", [WIDE]: "row" },
  },
  stage: {
    display: "flex",
    flexGrow: 1,
    justifyContent: "center",
    minHeight: "11rem",
    minWidth: 0,
    paddingBlockEnd: 12,
  },
  frame: {
    height: "100%",
    maxWidth: "44rem",
    touchAction: "none",
    width: "100%",
    WebkitTapHighlightColor: "transparent",
    WebkitTouchCallout: "none",
  },
  hidden: {
    clipPath: "inset(50%)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    whiteSpace: "nowrap",
    width: 1,
  },
  panel: {
    flexShrink: 0,
    minHeight: "8.5rem",
  },
});

export const Game = ({
  challenge,
  hint,
}: {
  challenge: Result | null;
  hint: Lang;
}) => {
  const boardRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const session = useRef<ReturnType<typeof startSession> | null>(null);
  const [save, setSave] = useState<Save | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [view, setView] = useState<View | null>(null);
  const [trail, setTrail] = useState<Slash | null>(null);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [returning, setReturning] = useState(false);

  const lang = settings?.lang ?? hint;
  const words = copy[lang];
  const stage = view?.stage;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const board = boardRef.current;
    session.current =
      board === null
        ? null
        : startSession(
            board,
            () => boxRef.current?.getBoundingClientRect() ?? null,
            challenge,
            {
              over: setEnding,
              save: setSave,
              settings: setSettings,
              trail: setTrail,
              view: setView,
            }
          );
    return () => {
      session.current?.stop();
      session.current = null;
    };
  }, [challenge]);

  const quit = () => {
    setEnding(null);
    setReturning(true);
    session.current?.title();
  };

  const playing = stage === "play";

  return (
    <div {...stylex.props(styles.root)}>
      <Header
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
        onQuit={quit}
        playing={playing}
      />
      <main
        {...stylex.props(styles.body, stage === "result" && styles.bodyDone)}
      >
        <div {...stylex.props(styles.stage)}>
          <div ref={boardRef} {...stylex.props(styles.frame)}>
            <p {...stylex.props(styles.hidden)}>{words.fallback}</p>
            {view === null ? null : (
              <Board
                boxRef={boxRef}
                rare={
                  view.stage !== "title" && isRare(view.food.kind)
                    ? words.rare
                    : null
                }
                tag={
                  view.stage === "title"
                    ? words.demo
                    : kindTitle(view.food.kind, lang)
                }
                trail={trail}
                view={view}
              />
            )}
          </div>
        </div>
        {stage === "result" && ending !== null ? (
          <ResultSheet
            challenge={challenge}
            ending={ending}
            lang={lang}
            onAgain={() => {
              setEnding(null);
              session.current?.start(false);
            }}
            onRetry={() => {
              setEnding(null);
              session.current?.start(true);
            }}
            save={save}
          />
        ) : (
          <div {...stylex.props(styles.panel)}>
            {view === null ? null : (
              <Panel
                challenge={challenge}
                lang={lang}
                onStart={(challenged) => session.current?.start(challenged)}
                returning={returning}
                save={save}
                view={view}
              />
            )}
          </div>
        )}
      </main>
      <LanguagePicker
        lang={lang}
        onSettings={(next) => session.current?.settings(next)}
        settings={settings}
      />
    </div>
  );
};
