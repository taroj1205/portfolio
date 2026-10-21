import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import type { Void } from "./copy";
import { dayOf } from "./daily";
import {
  LONGEST,
  PERFECT,
  SHOWN,
  STANDARD,
  hundredthsBetween,
  rankOf,
} from "./judge";
import { createRenderer } from "./render";
import type { Plan, Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";

export type Phase = "demo" | "ready" | "shown" | "hidden" | "done";

export interface Ending {
  result: Result;
  target: number;
  today: boolean;
  official: boolean;
  record: boolean;
}

interface Listeners {
  plan: (today: number) => Plan;
  phase: (phase: Phase) => void;
  today: (today: number) => void;
  clock: (time: number, opacity: number) => void;
  demo: (shown: boolean) => void;
  early: () => void;
  voided: (reason: Void) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const VISIBLE = SHOWN * 10;
const FADE = 600;
const DEMO = { hidden: 2300, hold: 6200, lead: 900, rest: 900 };

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

const shade = (elapsed: number, calm: boolean) => {
  if (calm) {
    return elapsed < VISIBLE ? 1 : 0;
  }
  return Math.max(0, Math.min(1, (VISIBLE - elapsed) / FADE));
};

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let phase: Phase = "demo";
  let plan: Plan = { day: null, target: STANDARD, today: false };
  let start = 0;
  let hushed = false;
  let swallow = false;
  let landed: number | null = null;
  let demoAt = performance.now();
  let demoShown = false;
  let last = demoAt;
  let dated = demoAt;
  const held = new Set<number>();
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);
  on.today(dayOf(Date.now()));
  on.phase(phase);
  if (calm) {
    on.demo(true);
  }

  const enter = (next: Phase) => {
    phase = next;
    on.phase(next);
  };

  const keep = (next: Save) => {
    save = next;
    storeSave(save);
    on.save(save);
  };

  const ready = () => {
    render.still(false);
    render.gild(false);
    on.demo(false);
    on.today(dayOf(Date.now()));
    enter("ready");
  };

  const begin = (stamp: number) => {
    const today = dayOf(Date.now());
    if (phase === "demo") {
      ready();
    }
    plan = on.plan(today);
    start = stamp;
    hushed = false;
    sound.unlock();
    sound.strike();
    navigator.vibrate?.(10);
    on.clock(0, 1);
    enter("shown");
  };

  const cancel = (reason: Void) => {
    if (phase !== "shown" && phase !== "hidden") {
      return;
    }
    ready();
    on.voided(reason);
  };

  const finish = (stamp: number) => {
    const elapsed = stamp - start;
    if (elapsed < VISIBLE) {
      sound.nudge();
      on.early();
      return;
    }
    const time = hundredthsBetween(start, stamp);
    if (time > LONGEST) {
      cancel("long");
      return;
    }
    const settled = settle(save, {
      at: Date.now(),
      plan,
      seconds: elapsed / 1000,
      time,
    });
    keep(settled.save);
    const { level } = rankOf(time - plan.target);
    const perfect = level === PERFECT;
    landed = level;
    sound.clack();
    navigator.vibrate?.(perfect ? [30, 60, 30, 60, 120] : 16);
    render.still(true);
    render.gild(perfect);
    enter("done");
    on.over({
      official: settled.official,
      record: settled.record,
      result: { day: plan.day, time },
      target: plan.target,
      today: plan.today,
    });
  };

  const press = (stamp: number) => {
    if (phase === "demo" || phase === "ready") {
      begin(stamp);
      return true;
    }
    if (phase === "shown" || phase === "hidden") {
      finish(stamp);
      return true;
    }
    return false;
  };

  const down = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    const first = held.size === 0;
    held.add(event.pointerId);
    canvas.setPointerCapture(event.pointerId);
    if (first && press(stampOf(event))) {
      event.preventDefault();
    }
  };

  const up = (event: PointerEvent) => {
    held.delete(event.pointerId);
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

  const hide = () => {
    if (document.visibilityState === "hidden") {
      held.clear();
      cancel("hidden");
    }
  };

  const leave = () => {
    held.clear();
    cancel("hidden");
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  canvas.addEventListener("contextmenu", block);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp, { capture: true });
  window.addEventListener("pagehide", leave);
  document.addEventListener("visibilitychange", hide);

  const playDemo = (now: number) => {
    const at = now - demoAt;
    const counting = at - DEMO.lead;
    const stop = DEMO.lead + VISIBLE + DEMO.hidden;
    if (at < stop) {
      const elapsed = Math.max(0, counting);
      on.clock(Math.floor(elapsed / 10), shade(elapsed, false));
      return;
    }
    if (!demoShown) {
      demoShown = true;
      render.still(true);
      on.demo(true);
    }
    if (at > stop + DEMO.hold) {
      on.demo(false);
      render.still(false);
      on.clock(0, 1);
    }
    if (at > stop + DEMO.hold + DEMO.rest) {
      demoShown = false;
      demoAt = now;
    }
  };

  const watch = (now: number) => {
    const elapsed = Math.max(0, now - start);
    const time = hundredthsBetween(0, elapsed);
    if (time > LONGEST) {
      cancel("long");
      return;
    }
    if (phase !== "shown") {
      return;
    }
    if (!hushed && elapsed > VISIBLE - FADE) {
      hushed = true;
      sound.hush();
    }
    on.clock(time, shade(elapsed, calm));
    if (elapsed >= VISIBLE) {
      enter("hidden");
    }
  };

  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
    last = now;
    if (phase === "demo" && !calm) {
      playDemo(now);
    }
    if (phase === "shown" || phase === "hidden") {
      watch(now);
    } else if (now - dated > 1000) {
      dated = now;
      on.today(dayOf(Date.now()));
    }
    render.draw(dt);
    sound.wind(render.wind() * (phase === "demo" ? 0.5 : 1));
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    wake: () => {
      if (phase === "demo") {
        ready();
      }
    },
    land: () => {
      if (phase !== "done" || landed === null) {
        return;
      }
      sound.reveal(landed);
      if (landed === PERFECT) {
        sound.perfect();
      }
      landed = null;
    },
    again: () => {
      if (phase === "done") {
        ready();
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
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp, { capture: true });
      window.removeEventListener("pagehide", leave);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
  };
};
