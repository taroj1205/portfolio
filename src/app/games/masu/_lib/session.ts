import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import {
  beatsBy,
  flowAt,
  holdFor,
  insideAt,
  longestHold,
  outcomeOf,
  pourOf,
} from "./pour";
import type { Outcome, Pour } from "./pour";
import { createRenderer } from "./render";
import type { Frame } from "./render";
import { glassOf } from "./result";
import type { Glass, Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { AWAY, aboveRim, fillOf } from "./scene";
import { createSound } from "./sound";

export type Stage = "idle" | "ready" | "pouring" | "result";

export interface Ending {
  result: Result;
  glass: Glass;
  record: boolean;
}

interface Listeners {
  stage: (stage: Stage) => void;
  pour: (pour: Pour) => void;
  reading: (mm: number) => void;
  demo: (glass: Glass | null) => void;
  interrupted: () => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

interface Active {
  pour: Pour;
  at: number;
  hold: number | null;
  outcome: Outcome | null;
  broke: boolean;
}

const LATE = 0.05;
const SPILL_PAUSE = 1.1;
const RISE = 7;
const DEMO = { lead: 900, rest: 2800, seed: 13, tenths: 970 };

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

const interactive = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest("button, a, input, select, textarea, [role='dialog']") !==
    null;

const stampOf = (event: Event) => {
  const now = performance.now();
  return event.timeStamp > 0 && event.timeStamp <= now ? event.timeStamp : now;
};

const isSpace = (event: KeyboardEvent) =>
  event.key === " " || event.code === "Space";

const block = (event: Event) => {
  event.preventDefault();
};

const demoOf = () => {
  const pour = pourOf(DEMO.seed);
  const hold = holdFor(
    pour,
    (outcome) => outcome.spilledAt === null && outcome.tenths >= DEMO.tenths
  );
  const outcome = outcomeOf(pour, hold);
  return { glass: glassOf({ hold, seed: DEMO.seed }), hold, outcome, pour };
};

const shownAt = (outcome: Outcome) =>
  outcome.spilledAt === null
    ? outcome.settledAt + AWAY
    : Math.max(outcome.settledAt + AWAY, outcome.spilledAt + SPILL_PAUSE);

const frameOf = (
  pour: Pour,
  hold: number | null,
  outcome: Outcome | null,
  t: number
): Omit<Frame, "clock" | "dt" | "raise"> => ({
  hold: hold === null ? Infinity : hold / 1000,
  pour,
  spilledAt: outcome?.spilledAt ?? null,
  t,
});

export const startSession = (
  canvas: HTMLCanvasElement,
  challenge: Result | null,
  on: Listeners
) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const demo = demoOf();
  const render = createRenderer(canvas, calm, demo.pour.bottle);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let stage: Stage = "idle";
  let seed = challenge?.seed ?? newSeed();
  let active: Active | null = null;
  let holder: number | "key" | null = null;
  let played = 0;
  let beats = 0;
  let demoAt = performance.now();
  let caption: Glass | null = null;
  let last = performance.now();
  let raise = 0;
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);

  const enter = (next: Stage) => {
    stage = next;
    on.stage(next);
  };

  const keep = (next: Save) => {
    save = next;
    storeSave(save);
    on.save(save);
  };

  const tellDemo = (glass: Glass | null) => {
    if (glass !== caption) {
      caption = glass;
      on.demo(glass);
    }
  };

  const ready = () => {
    seed = challenge?.seed ?? newSeed();
    active = null;
    played = 0;
    on.pour(pourOf(seed));
    enter("ready");
  };

  const press = (at: number) => {
    if (stage === "idle") {
      tellDemo(null);
      ready();
    }
    if (stage !== "ready") {
      return false;
    }
    sound.unlock();
    active = {
      at,
      broke: false,
      hold: null,
      outcome: null,
      pour: pourOf(seed),
    };
    beats = 0;
    navigator.vibrate?.(8);
    enter("pouring");
    return true;
  };

  const release = (at: number) => {
    holder = null;
    if (active === null || active.hold !== null) {
      return false;
    }
    const hold = Math.min(
      longestHold(active.pour),
      Math.max(0, Math.round(at - active.at))
    );
    active.hold = hold;
    active.outcome = outcomeOf(active.pour, hold);
    return true;
  };

  const finish = (hold: number, outcome: Outcome) => {
    const result: Result = { hold, seed };
    const glass = glassOf(result);
    const settled = settle(save, { at: Date.now(), glass, seconds: played });
    keep(settled.save);
    if (outcome.spilledAt === null) {
      sound.settle(outcome.tenths);
      navigator.vibrate?.(12);
    }
    if (settled.record) {
      sound.record();
    }
    enter("result");
    on.over({ glass, record: settled.record, result });
  };

  const interrupt = () => {
    if (holder !== null && release(performance.now())) {
      on.interrupted();
    }
  };

  const down = (event: PointerEvent) => {
    if (
      holder !== null ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }
    if (press(stampOf(event))) {
      holder = event.pointerId;
      canvas.setPointerCapture(event.pointerId);
    }
  };

  const up = (event: PointerEvent) => {
    if (event.pointerId === holder) {
      release(stampOf(event));
    }
  };

  const lost = (event: PointerEvent) => {
    if (event.pointerId === holder) {
      interrupt();
    }
  };

  const keyDown = (event: KeyboardEvent) => {
    if (
      !isSpace(event) ||
      interactive(event.target) ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    ) {
      return;
    }
    event.preventDefault();
    if (!event.repeat && holder === null && press(stampOf(event))) {
      holder = "key";
    }
  };

  const keyUp = (event: KeyboardEvent) => {
    if (isSpace(event) && holder === "key") {
      event.preventDefault();
      release(stampOf(event));
    }
  };

  const hide = () => {
    if (document.visibilityState === "hidden") {
      interrupt();
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", lost);
  canvas.addEventListener("lostpointercapture", lost);
  canvas.addEventListener("contextmenu", block);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", interrupt);
  screen.orientation?.addEventListener("change", interrupt);
  document.addEventListener("visibilitychange", hide);

  const listen = (current: Active, t: number) => {
    const count = beatsBy(current.pour, t);
    const pouring = current.hold === null || t * 1000 <= current.hold;
    if (count > beats && pouring && t >= current.pour.lag) {
      sound.glug(current.pour.bottle, current.pour.swing);
    }
    beats = count;
  };

  const advance = (current: Active, now: number) => {
    const t = (now - current.at) / 1000;
    if (current.hold === null && t >= current.pour.brink + LATE) {
      release(current.at + longestHold(current.pour));
    }
    const { hold, outcome } = current;
    if (stage === "pouring" && hold !== null && outcome !== null) {
      if (
        !current.broke &&
        outcome.spilledAt !== null &&
        t >= outcome.spilledAt
      ) {
        current.broke = true;
        sound.spill();
        navigator.vibrate?.([40, 60, 90]);
      }
      if (t >= shownAt(outcome)) {
        finish(hold, outcome);
      }
    }
    if (stage === "pouring") {
      listen(current, t);
    }
    return frameOf(current.pour, current.hold, current.outcome, t);
  };

  const demoFrame = (now: number) => {
    const end = demo.outcome.settledAt;
    if (calm) {
      tellDemo(demo.glass);
      return frameOf(demo.pour, demo.hold, demo.outcome, end + 3);
    }
    let t = (now - demoAt - DEMO.lead) / 1000;
    if (t > end + DEMO.rest / 1000) {
      demoAt = now;
      t = -DEMO.lead / 1000;
    }
    tellDemo(t >= end ? demo.glass : null);
    return frameOf(demo.pour, demo.hold, demo.outcome, Math.max(0, t));
  };

  const shownFrame = (now: number) => {
    if (stage === "idle") {
      return demoFrame(now);
    }
    return active === null
      ? frameOf(pourOf(seed), 0, null, 0)
      : advance(active, now);
  };

  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
    last = now;
    if (stage === "pouring" || stage === "ready") {
      played += dt;
    }
    const shown = shownFrame(now);
    const flow = flowAt(shown.pour, shown.hold, shown.t) / shown.pour.flow;
    if (
      stage === "pouring" &&
      (shown.spilledAt === null || shown.t < shown.spilledAt)
    ) {
      on.reading(
        aboveRim(
          fillOf(
            shown.pour,
            insideAt(shown.pour, shown.hold, shown.spilledAt, shown.t)
          )
        )
      );
    }
    const raised = stage === "result" ? 1 : 0;
    raise = calm ? raised : raise + (raised - raise) * Math.min(1, dt * RISE);
    sound.flow(stage === "idle" ? 0 : flow);
    render.draw({ ...shown, clock: now / 1000, dt, raise });
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (stage === "result") {
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
      canvas.removeEventListener("pointercancel", lost);
      canvas.removeEventListener("lostpointercapture", lost);
      canvas.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", interrupt);
      screen.orientation?.removeEventListener("change", interrupt);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
  };
};
