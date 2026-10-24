import type { Lang } from "../../_lib/i18n";
import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { copy } from "./copy";
import { dishOfDay, dishes } from "./dishes";
import type { DishId } from "./dishes";
import { reachedOf } from "./heights";
import { createRenderer, frameOf } from "./render";
import type { Mark } from "./render";
import { cmOf, lengthText, resultOf } from "./result";
import type { Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";
import { TICK, aliveOf, createRun, isSweet, step } from "./stretch";
import type { End, Run } from "./stretch";

export type Stage = "idle" | "pulling" | "ending" | "result";

export interface Ending {
  result: Result;
  end: End;
  record: boolean;
  sweet: number;
}

export interface Meter {
  load: number;
  heat: number;
  strain: number;
  loose: boolean;
}

interface Listeners {
  stage: (stage: Stage) => void;
  dish: (dish: DishId) => void;
  length: (cm: number) => void;
  meter: (meter: Meter) => void;
  height: (index: number) => void;
  end: (end: End) => void;
  alive: (count: number, total: number) => void;
  passed: () => void;
  beat: () => void;
  interrupted: () => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const REVEAL: Record<End, number> = { moon: 3.4, set: 1.7, snapped: 1.5 };

const LOOSE = 600;

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

const interactive = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest(
    "button, a, input, select, textarea, [role='dialog'], [role='menu']"
  ) !== null;

const block = (event: Event) => {
  event.preventDefault();
};

const isPullKey = (event: KeyboardEvent) =>
  (event.key === " " || event.key === "ArrowUp") &&
  !interactive(event.target) &&
  !event.metaKey &&
  !event.ctrlKey &&
  !event.altKey;

export const startSession = (
  canvas: HTMLCanvasElement,
  challenge: Result | null,
  langOf: () => Lang,
  on: Listeners
) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  const dishNow = () => dishes[challenge?.dish ?? dishOfDay(Date.now())];
  let dish = dishNow();
  let save = loadSave();
  let settings = loadSettings();
  let stage: Stage = "idle";
  let demo = createRun(dish, 7);
  let run: Run | null = null;
  let holder: number | "key" | null = null;
  let lastY = 0;
  let letGo = 0;
  let queued = 0;
  let pending = 0;
  let keyRate = 0;
  let lift = frameOf(canvas.clientWidth, canvas.clientHeight).rest;
  let reached = -1;
  let alive = 0;
  let passed = false;
  let beaten = false;
  let endedAt = 0;
  let drawn = performance.now();
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);
  on.dish(dish.id);

  const enter = (next: Stage) => {
    stage = next;
    on.stage(next);
  };

  const begin = () => {
    run = createRun(dish, newSeed());
    lift = frameOf(canvas.clientWidth, canvas.clientHeight).rest;
    queued = 0;
    pending = 0;
    reached = -1;
    alive = run.strands.length;
    passed = false;
    beaten = false;
    sound.unlock();
    on.alive(alive, run.strands.length);
    on.length(run.length);
    enter("pulling");
  };

  const grab = () => {
    if (stage === "idle") {
      begin();
    }

    if (stage !== "pulling") {
      return false;
    }

    sound.grab();
    navigator.vibrate?.(6);

    return true;
  };

  const interrupt = () => {
    holder = null;
    keyRate = 0;

    if (stage !== "pulling") {
      return;
    }

    run = null;
    sound.pull(0, 0, false, false);
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

    if (grab()) {
      canvas.setPointerCapture(event.pointerId);
      holder = event.pointerId;
      lastY = event.clientY;
    }
  };

  const move = (event: PointerEvent) => {
    if (event.pointerId !== holder || run === null) {
      return;
    }

    const frame = frameOf(canvas.clientWidth, canvas.clientHeight);
    const dy = lastY - event.clientY;
    lastY = event.clientY;

    if (dy > 0) {
      queued += dy / frame.stroke;
      lift = Math.min(frame.max, lift + dy);
    }
  };

  const up = (event: PointerEvent) => {
    sound.unlock();

    if (event.pointerId === holder) {
      holder = null;
      letGo = performance.now();
    }
  };

  const keyDown = (event: KeyboardEvent) => {
    if (!isPullKey(event)) {
      return;
    }

    event.preventDefault();

    if (!event.repeat && holder === null && grab()) {
      holder = "key";
      keyRate = 0.35;
    }
  };

  const keyUp = (event: KeyboardEvent) => {
    if (isPullKey(event) && holder === "key") {
      holder = null;
      letGo = performance.now();
      keyRate = 0;
    }
  };

  const hide = () => {
    if (document.visibilityState === "hidden") {
      interrupt();
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("contextmenu", block);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", interrupt);
  document.addEventListener("visibilitychange", hide);

  const advance = (current: Run, dt: number) => {
    const frame = frameOf(canvas.clientWidth, canvas.clientHeight);

    if (holder === "key") {
      keyRate = Math.min(3, keyRate + 0.6 * dt);
      queued += keyRate * dt;
      lift = Math.min(frame.max, lift + keyRate * dt * frame.stroke);
    }

    const moving = queued > 0;
    pending += dt;
    const steps = Math.floor(pending / TICK);
    pending -= steps * TICK;

    if (steps > 0) {
      const each = queued / steps;
      queued = 0;

      for (let i = 0; i < steps; i += 1) {
        step(current, each);
      }
    }

    const ease = holder === null ? 0.35 : 1.4;
    lift += (frame.rest - lift) * (1 - Math.exp(-dt / ease));
    sound.pull(
      current.load,
      current.strain,
      isSweet(current.load),
      moving && current.end === null
    );
  };

  const finish = (ended: Run, end: End) => {
    const result = resultOf(ended);

    const settled = settle(save, {
      at: Date.now(),
      end,
      result,
      seconds: ended.time,
      snaps: ended.strands.length - aliveOf(ended),
      sweet: ended.sweet,
    });

    ({ save } = settled);
    storeSave(save);
    on.save(save);

    if (settled.record) {
      sound.record();
    }

    enter("result");
    on.over({ end, record: settled.record, result, sweet: ended.sweet });
  };

  const watchEnd = (current: Run, now: number) => {
    if (current.end === null) {
      return;
    }

    if (stage === "pulling") {
      endedAt = now;
      holder = null;
      keyRate = 0;
      enter("ending");
      on.end(current.end);
      sound.pull(0, 0, false, false);

      if (current.end === "moon") {
        sound.moon();
        render.flash(1);
        navigator.vibrate?.([30, 60, 30, 60, 120]);
      } else if (current.end === "set") {
        sound.set();
        navigator.vibrate?.([20, 50, 20]);
      }
    }

    if (stage === "ending" && now - endedAt > REVEAL[current.end] * 1000) {
      finish(current, current.end);
    }
  };

  const watch = (current: Run, now: number) => {
    on.length(current.length);
    on.meter({
      heat: current.heat,
      load: current.load,
      loose: current.end === null && holder === null && now - letGo > LOOSE,
      strain: current.strain,
    });
    const height = reachedOf(current.length);

    if (height > reached) {
      reached = height;
      sound.height(height);
      navigator.vibrate?.(10);
      on.height(height);
    }

    const left = aliveOf(current);

    if (left < alive) {
      alive = left;
      sound.snap(left);
      navigator.vibrate?.([25, 30, 40]);
      on.alive(left, current.strands.length);
    }

    if (challenge !== null && !passed && current.length * 10 > challenge.mm) {
      passed = true;
      sound.passed();
      on.passed();
    }

    const best = save.dishes[dish.id];

    if (!beaten && best > 0 && current.length * 10 > best) {
      beaten = true;
      on.beat();
    }

    watchEnd(current, now);
  };

  const marksOf = (): Mark[] => {
    const words = copy[langOf()].marks;
    const marks: Mark[] = [];
    const best = save.dishes[dish.id] / 10;

    if (best > 0) {
      marks.push({
        cm: best,
        gold: false,
        label: `${words.best} ${lengthText(best, langOf())}`,
      });
    }

    if (challenge !== null) {
      marks.push({
        cm: cmOf(challenge),
        gold: true,
        label: `${words.challenge} ${lengthText(cmOf(challenge), langOf())}`,
      });
    }

    return marks;
  };

  const idle = (clock: number) => {
    const today = dishNow();

    if (today !== dish) {
      dish = today;
      demo = createRun(dish, 7);
      on.dish(dish.id);
    }

    const wave = (1 - Math.cos(clock * 1.05)) / 2;
    const { rest } = frameOf(canvas.clientWidth, canvas.clientHeight);
    demo.length = 3 * (1 + 0.6 * wave);
    demo.heat = 1;
    lift = rest * (1 + 0.6 * wave);
  };

  let frame = 0;

  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - drawn) / 1000);
    drawn = now;
    const clock = now / 1000;
    const live = stage === "idle" ? null : run;

    if (live === null) {
      idle(clock);
    } else {
      if (stage === "pulling") {
        advance(live, dt);
      }

      watch(live, now);
    }

    render.draw({
      clock,
      dt,
      idle: stage === "idle",
      lift,
      marks: stage === "idle" ? [] : marksOf(),
      run: live ?? demo,
      since:
        stage === "ending" || stage === "result" ? (now - endedAt) / 1000 : 0,
    });
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (stage !== "result") {
        return;
      }

      run = null;
      demo = createRun(dish, 7);
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
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", interrupt);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
  };
};
