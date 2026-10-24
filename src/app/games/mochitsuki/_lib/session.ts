import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import {
  COUNT_IN,
  LIVES,
  START_BPM,
  advance,
  counting,
  createRun,
  intervalAt,
  reach,
  resume,
  strike,
  sweep,
  tempoAt,
} from "./beat";
import type { Ending as Finish, Run } from "./beat";
import { createRenderer } from "./render";
import type { View } from "./render";
import { resultOf, smoothness } from "./result";
import type { Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";

export type Phase = "demo" | "ready" | "playing" | "done";

export interface Ending {
  result: Result;
  greats: number;
  record: boolean;
}

export interface Stats {
  pounds: number;
  tempo: number;
  lives: number;
}

interface Listeners {
  phase: (phase: Phase) => void;
  stats: (stats: Stats) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const LOOKAHEAD = 120;
const DEMO_BEATS = 16;
const HEAT_SPAN = 170;

const interactive = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest("button, a, input, select, textarea, [role='dialog']") !==
    null;

const stampOf = (event: Event) => {
  const now = performance.now();

  return event.timeStamp > 0 && event.timeStamp <= now ? event.timeStamp : now;
};

const block = (event: Event) => {
  event.preventDefault();
};

const heatOf = (run: Run) => (tempoAt(run.beat) - START_BPM) / HEAT_SPAN;

const smoothOf = (run: Run | null) =>
  run === null ? 0 : smoothness(run.pounds);

const still = (run: Run | null): View => ({
  count: null,
  heat: run === null ? 0 : heatOf(run),
  interval: intervalAt(0),
  reach: 0,
  smooth: smoothOf(run),
  streak: 0,
  sweep: null,
});

const viewOf = (run: Run, now: number): View => {
  const early = counting(run, now);
  const at = sweep(run, now);

  return {
    count: early ? Math.ceil((run.at - now) / run.gap) - 1 : null,
    heat: heatOf(run),
    interval: intervalAt(run.beat),
    reach: early ? 0 : reach(at),
    smooth: smoothOf(run),
    streak: run.streak,
    sweep: at,
  };
};

export const startSession = (
  canvas: HTMLCanvasElement,
  stage: () => DOMRect | null,
  on: Listeners
) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, stage, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let phase: Phase = "demo";
  let run: Run | null = null;
  let demo: Run | null = null;
  let cued = -Infinity;
  let played = 0;
  let shown = "";
  let tempo = START_BPM;
  let swallow = false;
  let previous = performance.now();
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);
  on.phase(phase);

  const enter = (next: Phase) => {
    phase = next;
    on.phase(next);
  };

  const keep = (next: Save) => {
    save = next;
    storeSave(save);
    on.save(save);
  };

  const report = (current: Run) => {
    const stats: Stats = {
      lives: LIVES - current.misses,
      pounds: current.pounds,
      tempo: tempoAt(current.beat),
    };

    const key = `${stats.pounds}:${stats.tempo}:${stats.lives}`;

    if (key !== shown) {
      shown = key;
      on.stats(stats);
    }
  };

  const finish = (current: Run, ending: Finish) => {
    const result = resultOf(current, ending);

    const settled = settle(save, {
      at: Date.now(),
      greats: current.greats,
      longest: current.longest,
      result,
      seconds: played,
    });

    keep(settled.save);
    enter("done");
    on.over({ greats: current.greats, record: settled.record, result });
  };

  const missed = (current: Run, stamp: number) => {
    const count = advance(current, stamp);

    if (count > 0) {
      render.call("miss", stamp);
      sound.miss();
      navigator.vibrate?.(30);
    }

    if (current.over === "miss") {
      finish(current, "miss");
    }
  };

  const begin = (stamp: number) => {
    sound.unlock();
    render.reset();
    run = createRun(stamp);
    demo = null;
    cued = -Infinity;
    played = 0;
    tempo = START_BPM;
    shown = "";
    report(run);
    enter("playing");
  };

  const hit = (current: Run, stamp: number) => {
    missed(current, stamp);

    if (current.over !== null) {
      return;
    }

    const outcome = strike(current, stamp);

    if (outcome.kind === "great" || outcome.kind === "good") {
      const great = outcome.kind === "great";
      render.pound(stamp, great, heatOf(current));
      render.call(outcome.kind, stamp);
      sound.pound(great);
      navigator.vibrate?.(great ? 14 : 8);
    } else if (outcome.kind === "flub") {
      render.swing(stamp);
      render.call("flub", stamp);
      sound.pound(false);
    } else if (outcome.kind === "hand") {
      render.hand(stamp);
      sound.hand();
      navigator.vibrate?.([60, 40, 120]);
      finish(current, "hand");

      return;
    }

    report(current);
  };

  const press = (stamp: number) => {
    if (phase === "demo" || phase === "ready") {
      begin(stamp);

      return true;
    }

    if (phase === "playing" && run !== null) {
      hit(run, stamp);

      return true;
    }

    return false;
  };

  const down = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    press(stampOf(event));
  };

  const keyDown = (event: KeyboardEvent) => {
    if (
      event.key !== " " ||
      interactive(event.target) ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();

    if (!event.repeat && press(stampOf(event)) && phase === "done") {
      swallow = true;
    }
  };

  const keyUp = (event: KeyboardEvent) => {
    if (event.key === " " && swallow) {
      swallow = false;
      event.preventDefault();
    }
  };

  const wake = () => {
    if (document.visibilityState === "visible" && phase === "playing" && run) {
      const now = performance.now();
      resume(run, now);
      cued = -Infinity;
      previous = now;
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("contextmenu", block);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp, { capture: true });
  document.addEventListener("visibilitychange", wake);

  const cue = (current: Run, now: number) => {
    const marks = [
      ...Array.from({ length: COUNT_IN }, (_, i) => ({
        at: current.at - (COUNT_IN - i) * current.gap,
        play: (delay: number) => {
          sound.count(i === COUNT_IN - 1, delay);
        },
      })),
      { at: current.at - current.gap / 2, play: sound.turn },
      { at: current.at, play: sound.tick },
      { at: current.at + intervalAt(current.beat) / 2, play: sound.turn },
    ];

    for (const mark of marks) {
      if (
        mark.at > cued + 1 &&
        mark.at >= now - 40 &&
        mark.at <= now + LOOKAHEAD
      ) {
        mark.play(Math.max(0, (mark.at - now) / 1000));
        cued = mark.at;
      }
    }
  };

  const playDemo = (now: number) => {
    if (calm) {
      return still(null);
    }

    if (demo === null || demo.beat >= DEMO_BEATS) {
      demo = createRun(now - (COUNT_IN - 1) * intervalAt(0));
      render.reset();
    }

    if (now >= demo.at) {
      const { at } = demo;
      strike(demo, at);
      render.pound(at, true, heatOf(demo));
    }

    return { ...viewOf(demo, now), streak: 0 };
  };

  const step = (current: Run, now: number) => {
    missed(current, now);

    if (current.over !== null) {
      return still(current);
    }

    const next = tempoAt(current.beat);

    if (next > tempo) {
      tempo = next;
      sound.rise();
    }

    cue(current, now);
    report(current);

    return viewOf(current, now);
  };

  const viewNow = (now: number, dt: number) => {
    if (phase === "demo") {
      return playDemo(now);
    }

    if (phase === "playing" && run !== null) {
      played += dt;

      return step(run, now);
    }

    return still(run);
  };

  let frame = 0;

  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - previous) / 1000);
    previous = now;
    render.draw(viewNow(now, dt), now);
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return {
    language: render.language,
    again: () => {
      if (phase === "done") {
        run = null;
        render.reset();
        enter("ready");
      }
    },
    settings: (next: Settings) => {
      settings = next;
      storeSettings(settings);
      sound.mute(settings.muted);
      on.settings(settings);
    },
    stop: () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp, { capture: true });
      document.removeEventListener("visibilitychange", wake);
      sound.close();
    },
  };
};
