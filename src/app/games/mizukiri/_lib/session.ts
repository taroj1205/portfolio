import { listenFlick, tiltAt } from "./flick";
import { createRenderer } from "./render";
import { resultOf } from "./result";
import type { Result } from "./result";
import { createRiver, simulate, stoneAt } from "./simulate";
import type { Ending, Throw } from "./simulate";
import { createSound } from "./sound";

export type Phase = "ready" | "aiming" | "flying" | "done";

interface Listeners {
  phase: (phase: Phase) => void;
  skip: (count: number) => void;
  distance: (meters: number) => void;
  land: (result: Result, record: boolean) => void;
  best: (best: number) => void;
}

type Cue =
  | { time: number; kind: "splash"; step: number; big: boolean }
  | { time: number; kind: "ending"; ending: Ending };

const BEST = "mizukiri.best";
const REVEAL = 1.1;

const cuesOf = (shot: Throw): Cue[] => {
  let step = 0;
  const cues: Cue[] = shot.splashes.map((splash) => {
    if (!splash.big) {
      step += 1;
    }
    return { big: splash.big, kind: "splash", step, time: splash.time };
  });
  cues.push({
    ending: shot.ending,
    kind: "ending",
    time: shot.hit?.time ?? shot.duration,
  });
  return cues.toSorted((a, b) => a.time - b.time);
};

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const draw = createRenderer(canvas);
  const sound = createSound();
  let river = createRiver(newSeed());
  let shot: Throw | null = null;
  let cues: Cue[] = [];
  let cue = 0;
  let thrownAt = 0;
  let aimFrom: number | null = null;
  let mode: Phase = "ready";
  let best = Number(localStorage.getItem(BEST)) || 0;
  if (best > 0) {
    on.best(best);
  }

  const enter = (next: Phase) => {
    mode = next;
    on.phase(next);
  };

  const stopFlick = listenFlick(canvas, {
    release: (input) => {
      if (mode !== "aiming") {
        return;
      }
      aimFrom = null;
      if (input === null) {
        enter("ready");
        return;
      }
      shot = simulate(river, input);
      cues = cuesOf(shot);
      cue = 0;
      thrownAt = performance.now();
      on.skip(0);
      enter("flying");
    },
    start: () => {
      if (mode !== "ready") {
        return;
      }
      sound.unlock();
      aimFrom = performance.now();
      enter("aiming");
    },
  });

  const land = (done: Throw) => {
    const result = resultOf(done, river);
    const record = result.skips > best;
    if (record) {
      best = result.skips;
      localStorage.setItem(BEST, String(best));
      on.best(best);
    }
    on.land(result, record);
    enter("done");
  };

  const play = (current: Cue) => {
    if (current.kind === "ending") {
      sound.ending(current.ending);
      return;
    }
    sound.splash(current.step, current.big);
    if (!current.big) {
      on.skip(current.step);
    }
  };

  let frame = 0;
  const tick = (now: number) => {
    const time = shot ? (now - thrownAt) / 1000 : 0;
    if (shot) {
      for (
        let next = cues[cue];
        next !== undefined && next.time <= time;
        next = cues[cue]
      ) {
        play(next);
        cue += 1;
      }
      on.distance(
        Math.max(
          0,
          stoneAt(shot, Math.min(time, shot.duration))?.z ?? shot.distance
        )
      );
      if (mode === "flying" && time > shot.duration + REVEAL) {
        land(shot);
      }
    }
    draw({
      clock: now / 1000,
      river,
      shot,
      tilt: aimFrom === null ? null : tiltAt((now - aimFrom) / 1000),
      time,
    });
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      river = createRiver(newSeed());
      shot = null;
      on.skip(0);
      enter("ready");
    },
    mute: sound.mute,
    stop: () => {
      cancelAnimationFrame(frame);
      stopFlick();
      sound.close();
    },
  };
};
