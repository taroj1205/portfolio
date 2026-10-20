import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import {
  TICK,
  hundredths,
  createRun,
  createStick,
  phaseAt,
  step,
} from "./burn";
import type { End, Point, Run } from "./burn";
import { createRenderer } from "./render";
import { resultOf } from "./result";
import type { Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";

export type Stage = "idle" | "burning" | "ending" | "result";

export interface Ending {
  result: Result;
  end: End;
  record: boolean;
}

interface Listeners {
  stage: (stage: Stage) => void;
  clock: (time: number) => void;
  sway: (sway: number) => void;
  phase: (phase: number) => void;
  passed: () => void;
  interrupted: () => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const HAND = 70;
const REACH = { x: 1.3, y: 0.8 };
const REVEAL = 1.4;
const REST = 2.5;
const DIM = 0.42;
const DEMOS = [2026, 815, 7777, 1205];
const LEVELS = [0.45, 0.8, 1, 0.75, 0.45];
const still: Point = { x: 0, y: 0 };

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

const interactive = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest("button, a, input, select, textarea, [role='dialog']") !==
    null;

const clamp = (value: number, reach: number) =>
  Math.max(-reach, Math.min(reach, value));

const block = (event: Event) => {
  event.preventDefault();
};

const demoOf = (index: number) => {
  const stick = createStick(DEMOS[index % DEMOS.length] ?? 1);
  return createRun(stick, stick.starts[2]);
};

export const startSession = (
  canvas: HTMLCanvasElement,
  challenge: Result | null,
  on: Listeners
) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let stage: Stage = "idle";
  let demos = 0;
  let demo = demoOf(demos);
  let rested = 0;
  let run: Run | null = null;
  let holder: number | "key" | null = null;
  let origin = still;
  let finger = still;
  let steered = still;
  let rebase = false;
  let pending = 0;
  let shown = -1;
  let phase = -1;
  let passed = false;
  let endedAt = 0;
  let last = performance.now();
  let drawn = last;
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);

  const keep = (next: Save) => {
    save = next;
    storeSave(save);
    on.save(save);
  };

  const enter = (next: Stage) => {
    stage = next;
    on.stage(next);
  };

  const advance = (now: number) => {
    const real = Math.min(0.05, Math.max(0, now - last) / 1000);
    last = now;
    if (run === null || stage !== "burning") {
      return;
    }
    pending += real;
    const steps = Math.floor(pending / TICK);
    pending -= steps * TICK;
    const held = holder !== null;
    for (let i = 1; i <= steps; i += 1) {
      const k = i / steps;
      step(
        run,
        {
          x: steered.x + (finger.x - steered.x) * k,
          y: steered.y + (finger.y - steered.y) * k,
        },
        held
      );
    }
    steered = finger;
  };

  const ignite = () => {
    if (stage !== "idle") {
      return false;
    }
    run = createRun(createStick(challenge?.seed ?? newSeed()));
    finger = still;
    steered = still;
    pending = 0;
    shown = -1;
    phase = -1;
    passed = false;
    last = performance.now();
    sound.unlock();
    sound.ignite();
    navigator.vibrate?.(12);
    enter("burning");
    return true;
  };

  const release = () => {
    advance(performance.now());
    holder = null;
    if (run !== null && stage === "burning") {
      step(run, finger, false);
    }
  };

  const interrupt = () => {
    holder = null;
    if (stage !== "burning") {
      return;
    }
    run = null;
    enter("idle");
    on.interrupted();
  };

  const down = (event: PointerEvent) => {
    if (
      holder !== null ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }
    if (ignite()) {
      canvas.setPointerCapture(event.pointerId);
      holder = event.pointerId;
      origin = { x: event.clientX, y: event.clientY };
    }
  };

  const move = (event: PointerEvent) => {
    if (event.pointerId !== holder) {
      return;
    }
    if (rebase) {
      rebase = false;
      origin = {
        x: event.clientX - finger.x * HAND,
        y: event.clientY - finger.y * HAND,
      };
      return;
    }
    finger = {
      x: clamp((event.clientX - origin.x) / HAND, REACH.x),
      y: clamp((event.clientY - origin.y) / HAND, REACH.y),
    };
  };

  const up = (event: PointerEvent) => {
    if (event.pointerId === holder) {
      release();
    }
  };

  const cancel = (event: PointerEvent) => {
    if (event.pointerId === holder) {
      interrupt();
    }
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
    if (!event.repeat && holder === null && ignite()) {
      holder = "key";
    }
  };

  const keyUp = (event: KeyboardEvent) => {
    if (event.key === " " && holder === "key") {
      release();
    }
  };

  const hide = () => {
    if (document.visibilityState === "hidden") {
      interrupt();
    }
  };

  const resize = () => {
    rebase = holder !== null && holder !== "key";
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("contextmenu", block);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", interrupt);
  window.addEventListener("resize", resize);
  screen.orientation?.addEventListener("change", interrupt);
  document.addEventListener("visibilitychange", hide);

  const finish = (ended: Run, end: End) => {
    const result = resultOf(ended);
    const settled = settle(save, result, Date.now());
    keep(settled.save);
    if (settled.record) {
      sound.record();
    }
    enter("result");
    on.over({ end, record: settled.record, result });
  };

  const watch = (now: number, current: Run) => {
    const time = hundredths(current);
    if (time !== shown) {
      shown = time;
      on.clock(time);
    }
    on.sway(current.end === null ? current.sway : 0);
    const reached = phaseAt(current.stick, current.time);
    if (reached !== phase) {
      if (phase >= 0) {
        sound.phase(reached);
        navigator.vibrate?.(8);
      }
      phase = reached;
      on.phase(reached);
    }
    if (challenge !== null && !passed && time > challenge.time) {
      passed = true;
      sound.passed();
      navigator.vibrate?.(15);
      on.passed();
    }
    if (current.end !== null && stage === "burning") {
      endedAt = now;
      enter("ending");
      if (current.end === "burned") {
        sound.out();
        navigator.vibrate?.([20, 80, 20, 80, 40]);
      } else {
        sound.drop();
        navigator.vibrate?.([30, 40, 60]);
      }
    }
    if (
      current.end !== null &&
      stage === "ending" &&
      now - endedAt > REVEAL * 1000
    ) {
      finish(current, current.end);
    }
  };

  const idle = (dt: number) => {
    if (demo.end === null) {
      const until = demo.time + dt;
      while (demo.end === null && demo.time < until) {
        step(demo, still, true);
      }
      return;
    }
    rested += dt;
    if (rested > REST) {
      rested = 0;
      demos += 1;
      demo = demoOf(demos);
    }
  };

  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - drawn) / 1000);
    drawn = now;
    advance(now);
    if (stage === "idle") {
      idle(dt);
    }
    const shownRun = stage === "idle" || run === null ? demo : run;
    if (stage !== "idle" && run !== null) {
      watch(now, run);
    }
    const lit = shownRun.end === null;
    sound.level(
      lit
        ? (LEVELS[phaseAt(shownRun.stick, shownRun.time)] ?? 0) *
            (stage === "idle" ? 0.3 : 1)
        : 0
    );
    render.draw({
      clock: now / 1000,
      dim: stage === "idle" ? DIM : 0,
      dt,
      run: shownRun,
    });
    sound.crackle(render.heard(), stage === "idle" ? 0.35 : 1);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (stage !== "result") {
        return;
      }
      run = null;
      enter("idle");
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
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", interrupt);
      window.removeEventListener("resize", resize);
      screen.orientation?.removeEventListener("change", interrupt);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
  };
};
