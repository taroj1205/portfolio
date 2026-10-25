import type { Lang } from "../../_lib/i18n";
import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { createDemo } from "./demo";
import {
  BLOCK,
  REACH,
  aim,
  createPile,
  heightOf,
  pour,
  serve,
  shaving,
  step,
} from "./pile";
import type { Outcome, Pile } from "./pile";
import { createRenderer } from "./render";
import { rankOf, resultOf, syrupOf, tenthsOf } from "./result";
import type { Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";
import type { SyrupId } from "./syrups";

export type Phase = "ready" | "piling" | "done";

export interface Ending {
  result: Result;
  record: boolean;
  first: SyrupId | null;
  peak: number;
}

interface Listeners {
  phase: (phase: Phase) => void;
  meter: (tenths: number, ice: number) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const SERVED = 1900;
const FELL = 2600;
const SPILL = 900;
const KEYS = 420;

const block = (event: Event) => {
  event.preventDefault();
};

const typing = (event: KeyboardEvent) =>
  event.target instanceof Element &&
  event.target.closest("button, a, input, [role='menu'], [role='dialog']") !==
    null;

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let phase: Phase = "ready";
  let pile: Pile = createPile(Math.random);
  let demo = createDemo();
  let active: number | null = null;
  let held = { left: false, right: false, space: false };
  let ending: { at: number; value: Ending } | null = null;
  let level = 0;
  let start = 0;
  let shown = "";
  let previous = performance.now();
  sound.mute(settings.muted);
  render.best(save.best);
  on.save(save);
  on.settings(settings);
  on.phase(phase);

  const enter = (next: Phase) => {
    phase = next;
    on.phase(next);
  };

  const meter = () => {
    const tenths = tenthsOf(heightOf(pile.cols));
    const ice = pile.left / BLOCK;
    const key = `${tenths}:${ice.toFixed(3)}`;

    if (key !== shown) {
      shown = key;
      on.meter(tenths, ice);
    }
  };

  const finish = (now: number, delay: number) => {
    active = null;
    const result = resultOf(pile.cols, pile.toppled);
    const peak = tenthsOf(pile.peak);

    const settled = settle(save, {
      at: Date.now(),
      peak,
      poured: pile.poured,
      result,
      seconds: Math.max(0, now - start) / 1000,
      spilled: pile.spilled,
    });

    ({ save } = settled);
    storeSave(save);
    on.save(save);
    render.best(save.best);
    enter("done");
    ending = {
      at: now + delay,
      value: { first: settled.first, peak, record: settled.record, result },
    };

    return result;
  };

  const plate = (now: number) => {
    if (phase !== "piling") {
      return;
    }

    serve(pile);
    const result = finish(now, calm ? 300 : SERVED);
    render.serve(pile, syrupOf(result.tenths), now);
    sound.serve();
    navigator.vibrate?.([10, 60, 10, 60, 30]);
  };

  const climb = (now: number) => {
    const { level: reached, name } = rankOf(tenthsOf(heightOf(pile.cols)));

    if (reached > level) {
      level = reached;
      render.goal(name, now);
      sound.goal(reached);
      navigator.vibrate?.(16);
    }
  };

  const react = (events: readonly Outcome[], now: number) => {
    for (const event of events) {
      if (phase !== "piling") {
        return;
      }

      if (event.type === "slump") {
        render.slump(now);
        sound.wobble();
        navigator.vibrate?.([20, 30, 20]);
      } else if (event.type === "spill") {
        render.spill(event.at, now);
      } else if (event.type === "topple") {
        render.topple(event, pile, now);
        sound.crash();
        navigator.vibrate?.([60, 40, 120]);
        const result = finish(now, calm ? 300 : FELL);
        render.serve(pile, syrupOf(result.tenths), now, calm ? 0 : SPILL);
      } else {
        plate(now);
      }
    }
  };

  const quiet = (now: number) => {
    pile = createPile(Math.random);
    demo = createDemo();
    level = 0;
    render.reset();
    start = now;
    enter("piling");
  };

  const begin = (now: number) => {
    sound.unlock();

    if (phase === "ready") {
      quiet(now);
    }
  };

  const xOf = (event: PointerEvent) =>
    render.worldX(event.clientX - canvas.getBoundingClientRect().left);

  const down = (event: PointerEvent) => {
    if (
      active !== null ||
      phase === "done" ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    event.preventDefault();
    begin(event.timeStamp);
    canvas.setPointerCapture(event.pointerId);
    active = event.pointerId;
    aim(pile, xOf(event));
    pour(pile, true);
  };

  const move = (event: PointerEvent) => {
    if (phase !== "piling") {
      return;
    }

    if (
      event.pointerId === active ||
      (active === null && event.pointerType === "mouse")
    ) {
      aim(pile, xOf(event));
    }
  };

  const release = () => {
    active = null;
    pour(pile, held.space);
  };

  const up = (event: PointerEvent) => {
    sound.unlock();

    if (event.pointerId === active) {
      release();
    }
  };

  const press = (event: KeyboardEvent, pressed: boolean) => {
    if (typing(event) || event.repeat) {
      return;
    }

    if (event.key === " ") {
      event.preventDefault();

      if (pressed) {
        begin(event.timeStamp);
      }

      held = { ...held, space: pressed };
      pour(pile, pressed || active !== null);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      held = { ...held, left: pressed };
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      held = { ...held, right: pressed };
    }
  };

  const keydown = (event: KeyboardEvent) => {
    press(event, true);
  };

  const keyup = (event: KeyboardEvent) => {
    press(event, false);
  };

  const hide = () => {
    if (document.visibilityState === "hidden") {
      held = { left: false, right: false, space: false };
      release();
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  canvas.addEventListener("contextmenu", block);
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  document.addEventListener("visibilitychange", hide);

  const steerKeys = (dt: number) => {
    const way = Number(held.right) - Number(held.left);

    if (way !== 0 && phase === "piling") {
      aim(
        pile,
        Math.max(-REACH, Math.min(REACH, pile.cup.aim + way * KEYS * dt))
      );
    }
  };

  const showDemo = (dt: number) => {
    const next = demo.next(pile, dt);

    if (next.type === "again") {
      pile = createPile(Math.random);
      render.reset();
    }

    if (next.type === "pour") {
      aim(pile, next.at);
      render.guide(pile.cup.x);
    }

    pour(pile, next.type === "pour");
  };

  let frame = 0;

  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - previous) / 1000);
    previous = now;

    if (phase === "ready" && active === null) {
      showDemo(dt);
    }

    steerKeys(dt);
    const events = step(pile, dt);

    if (phase === "piling") {
      react(events, now);
      climb(now);

      if (shaving(pile)) {
        sound.grind(dt);
      }
    }

    meter();

    if (ending !== null && now >= ending.at) {
      on.over(ending.value);
      ending = null;
    }

    render.draw(pile, now);
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (phase === "done") {
        pile = createPile(Math.random);
        demo = createDemo();
        level = 0;
        held = { left: false, right: false, space: false };
        render.reset();
        enter("ready");
      }
    },
    language: (lang: Lang) => {
      render.language(lang);
    },
    serve: () => {
      plate(performance.now());
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
      canvas.removeEventListener("lostpointercapture", up);
      canvas.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
  };
};
