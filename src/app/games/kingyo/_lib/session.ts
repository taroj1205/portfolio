import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import type { Point } from "../../_lib/svg";
import { GRIP, SCENE } from "./art";
import { createDemo } from "./demo";
import type { Move } from "./demo";
import { kinds } from "./fish";
import type { KindId } from "./fish";
import { createRenderer } from "./render";
import { resultOf } from "./result";
import type { Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";
import { createTank, dip, drag, freshen, hover, lift, step } from "./tank";
import type { Outcome, Tank } from "./tank";

export type Phase = "ready" | "scooping" | "done";

export interface Ending {
  result: Result;
  record: boolean;
  firsts: KindId[];
  biggest: number;
}

interface Listeners {
  phase: (phase: Phase) => void;
  meter: (caught: number, paper: number) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const SETTLE = 800;
const BARE: Point = { x: 0, y: 0 };

const block = (event: Event) => {
  event.preventDefault();
};

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = matchMedia("(pointer: coarse)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let phase: Phase = "ready";
  let tank: Tank = createTank(Math.random);
  let active: number | null = null;
  let ending: { at: number; value: Ending } | null = null;
  let demo = createDemo();
  let showing = false;
  let grip = BARE;
  let last = 0;
  let start = 0;
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

  const meter = () => {
    on.meter(tank.caught.length, tank.poi.paper);
  };

  const finish = (now: number) => {
    active = null;
    const result = resultOf(tank.caught);
    const settled = settle(save, {
      at: Date.now(),
      biggest: tank.biggest,
      result,
      scoops: tank.scoops,
      seconds: Math.max(0, now - start) / 1000,
    });
    keep(settled.save);
    enter("done");
    ending = {
      at: now + SETTLE,
      value: {
        biggest: tank.biggest,
        firsts: settled.firsts,
        record: settled.record,
        result,
      },
    };
  };

  const react = (events: readonly Outcome[], now: number) => {
    for (const event of events) {
      if (event.type === "scoop") {
        render.scoop(event.fish, event.at, now);
        sound.scoop(event.fish.length);
        if (event.fish.some((fish) => kinds[fish.kind].tier !== "common")) {
          sound.rare();
        }
        navigator.vibrate?.([14, 40, 14]);
      } else if (event.type === "under") {
        render.under(event.at, now);
      } else {
        render.tear(event.at, now);
        sound.tear();
        navigator.vibrate?.([40, 30, 90]);
      }
    }
    meter();
    if (events.some((event) => event.type === "tear")) {
      finish(now);
    }
  };

  const quiet = () => {
    demo = createDemo();
    if (showing) {
      showing = false;
      freshen(tank);
      render.reset();
    }
  };

  const show = (move: Move, now: number) => {
    showing = true;
    if (move.type === "dip") {
      render.dip(move.at, now);
      render.guide(
        coarse ? { x: move.at.x + GRIP.x, y: move.at.y + GRIP.y } : move.at
      );
      return;
    }
    render.guide(null);
    for (const outcome of move.outcomes) {
      if (outcome.type === "scoop") {
        render.scoop(outcome.fish, outcome.at, now);
      } else if (outcome.type === "under") {
        render.under(outcome.at, now);
      }
    }
  };

  const pointOf = (event: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    const side = Math.min(rect.width, rect.height) || 1;
    return {
      x:
        ((event.clientX - rect.left - (rect.width - side) / 2) / side) * SCENE -
        grip.x,
      y:
        ((event.clientY - rect.top - (rect.height - side) / 2) / side) * SCENE -
        grip.y,
    };
  };

  const down = (event: PointerEvent) => {
    if (
      active !== null ||
      phase === "done" ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }
    event.preventDefault();
    sound.unlock();
    canvas.setPointerCapture(event.pointerId);
    active = event.pointerId;
    grip = event.pointerType === "touch" ? GRIP : BARE;
    if (phase === "ready") {
      quiet();
      start = event.timeStamp;
      enter("scooping");
    }
    const events = dip(tank, pointOf(event));
    last = event.timeStamp;
    render.dip(tank.poi, event.timeStamp);
    sound.dip();
    navigator.vibrate?.(8);
    react(events, event.timeStamp);
  };

  const move = (event: PointerEvent) => {
    if (event.pointerId !== active) {
      if (
        active === null &&
        event.pointerType === "mouse" &&
        phase !== "done"
      ) {
        if (phase === "ready") {
          quiet();
        }
        grip = BARE;
        hover(tank, pointOf(event));
      }
      return;
    }
    const coalesced = event.getCoalescedEvents?.() ?? [];
    for (const each of coalesced.length > 0 ? coalesced : [event]) {
      if (phase !== "scooping") {
        return;
      }
      const events = drag(
        tank,
        pointOf(each),
        Math.max(0, each.timeStamp - last) / 1000
      );
      last = each.timeStamp;
      react(events, each.timeStamp);
    }
  };

  const release = (now: number) => {
    active = null;
    if (phase === "scooping") {
      react(lift(tank), now);
    }
  };

  const up = (event: PointerEvent) => {
    sound.unlock();
    if (event.pointerId === active) {
      release(event.timeStamp);
    }
  };

  const hide = () => {
    if (document.visibilityState === "hidden" && active !== null) {
      release(performance.now());
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  canvas.addEventListener("contextmenu", block);
  document.addEventListener("visibilitychange", hide);

  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - previous) / 1000);
    previous = now;
    const events = step(tank, dt);
    if (phase === "scooping") {
      react(events, now);
    }
    if (phase === "ready" && active === null) {
      const shown = demo.next(tank, dt);
      if (shown !== null) {
        show(shown, now);
      }
    }
    if (ending !== null && now >= ending.at) {
      on.over(ending.value);
      ending = null;
    }
    render.draw(tank, now);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (phase === "done") {
        tank = createTank(Math.random);
        demo = createDemo();
        showing = false;
        render.reset();
        meter();
        enter("ready");
      }
    },
    language: render.language,
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
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("contextmenu", block);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
  };
};
