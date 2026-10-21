import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import {
  POURS,
  beatsBy,
  domeOf,
  holdFor,
  limitOf,
  longestHold,
  outcomeOf,
  pourOf,
  rateAt,
  volumeAt,
} from "./pour";
import type { Outcome, Pour } from "./pour";
import { createRenderer } from "./render";
import type { Frame } from "./render";
import { glassOf, tallyOf } from "./result";
import type { Glass, Result, Tally } from "./result";
import { loadSave, settlePour, settleRun, storeSave } from "./save";
import type { Save } from "./save";
import { aboveRim, fillOf } from "./scene";
import { createSound } from "./sound";

export type Stage = "idle" | "pouring" | "settled" | "ready" | "result";

export interface Ending {
  result: Result;
  tally: Tally;
  record: boolean;
}

interface Listeners {
  stage: (stage: Stage) => void;
  pour: (index: number, pour: Pour) => void;
  reading: (mm: number) => void;
  glass: (index: number, glass: Glass) => void;
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
}

const REVEAL = 1700;
const SPILL_REVEAL = 2600;
const RETURN = 0.45;
const COLLAPSE = 0.5;
const LATE = 0.2;
const DEMO = { lead: 900, rest: 2600 };
const DEMOS = [
  { index: 0, seed: 13, spill: false },
  { index: 0, seed: 7, spill: true },
] as const;

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

const ease = (t: number) => 1 - (1 - Math.min(1, Math.max(0, t))) ** 3;

const demoOf = (turn: number) => {
  const plan = DEMOS[turn % DEMOS.length] ?? DEMOS[0];
  const pour = pourOf(plan.seed, plan.index);
  const hold = holdFor(pour, (outcome) =>
    plan.spill
      ? outcome.spilledAt !== null
      : outcome.spilledAt === null && outcome.tenths >= 970
  );
  const outcome = outcomeOf(pour, hold);
  return { glass: glassOf(pour, outcome), hold, outcome, pour };
};

const frameOf = (
  pour: Pour,
  hold: number | null,
  outcome: Outcome | null,
  t: number
): Omit<Frame, "clock" | "dt"> => {
  const held = hold === null ? Infinity : hold / 1000;
  const released = Math.min(t, held);
  const spilledAt = outcome?.spilledAt ?? null;
  const broke = spilledAt !== null && t >= spilledAt ? t - spilledAt : null;
  const raw = volumeAt(pour, held, t);
  const volume =
    broke === null
      ? raw
      : 1 + (limitOf(pour) - 1) * Math.max(0, 1 - broke / COLLAPSE);
  const tipped = ease(released / pour.lag);
  const after = t - released;
  const stream =
    t <= held
      ? rateAt(pour, t)
      : rateAt(pour, held) * Math.max(0, 1 - after / pour.trickle) ** 2;
  return {
    broke,
    pour,
    strain: broke === null ? domeOf(pour, volume) : 0,
    stream: stream / pour.flow,
    tilt: t <= held ? tipped : tipped * (1 - ease(after / RETURN)),
    volume,
  };
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
  let seed = challenge?.seed ?? newSeed();
  let index = 0;
  let holds: number[] = [];
  let active: Active | null = null;
  let holder: number | "key" | null = null;
  let settledAt = 0;
  let spilled = false;
  let played = 0;
  let beats = 0;
  let turn = 0;
  let demo = demoOf(turn);
  let demoAt = performance.now();
  let caption: Glass | null = null;
  let last = performance.now();
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

  const ready = (next: number) => {
    index = next;
    active = null;
    on.pour(index, pourOf(seed, index));
    enter("ready");
  };

  const begin = () => {
    seed = challenge?.seed ?? newSeed();
    holds = [];
    played = 0;
    ready(0);
  };

  const press = (at: number) => {
    if (stage === "idle") {
      begin();
      tellDemo(null);
    }
    if (stage !== "ready") {
      return false;
    }
    sound.unlock();
    active = { at, hold: null, outcome: null, pour: pourOf(seed, index) };
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

  const settle = (pour: Pour, hold: number, outcome: Outcome, now: number) => {
    const glass = glassOf(pour, outcome);
    holds.push(hold);
    keep(settlePour(save, { at: Date.now(), glass, seconds: played }));
    played = 0;
    spilled = outcome.spilledAt !== null;
    settledAt = now;
    if (spilled) {
      sound.spill();
      navigator.vibrate?.([40, 60, 90]);
    } else {
      sound.settle(outcome.tenths);
      navigator.vibrate?.(12);
    }
    on.glass(index, glass);
    enter("settled");
  };

  const finish = () => {
    const result: Result = { holds: [...holds], seed };
    const tally = tallyOf(result);
    const run = settleRun(save, tally);
    keep(run.save);
    if (run.record) {
      sound.record();
    }
    enter("result");
    on.over({ record: run.record, result, tally });
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

  const advance = (now: number) => {
    if (active === null) {
      return null;
    }
    const t = (now - active.at) / 1000;
    if (active.hold === null && t >= active.pour.brink + LATE) {
      release(active.at + longestHold(active.pour));
    }
    if (stage === "pouring") {
      listen(active, t);
      if (
        active.hold !== null &&
        active.outcome !== null &&
        t >= active.outcome.settledAt
      ) {
        settle(active.pour, active.hold, active.outcome, now);
      }
    }
    return frameOf(active.pour, active.hold, active.outcome, t);
  };

  const demoFrame = (now: number) => {
    if (calm) {
      tellDemo(demo.glass);
      return frameOf(
        demo.pour,
        demo.hold,
        demo.outcome,
        demo.outcome.settledAt + 3
      );
    }
    const t = (now - demoAt - DEMO.lead) / 1000;
    const end = demo.outcome.settledAt;
    if (t > end + DEMO.rest / 1000) {
      turn += 1;
      demo = demoOf(turn);
      demoAt = now;
      tellDemo(null);
      return frameOf(demo.pour, demo.hold, demo.outcome, 0);
    }
    tellDemo(t >= end ? demo.glass : null);
    return frameOf(demo.pour, demo.hold, demo.outcome, Math.max(0, t));
  };

  const progress = (now: number) => {
    const wait = spilled ? SPILL_REVEAL : REVEAL;
    if (stage !== "settled" || now - settledAt < wait) {
      return;
    }
    if (index + 1 < POURS) {
      ready(index + 1);
    } else {
      finish();
    }
  };

  const shownFrame = (now: number): Omit<Frame, "clock" | "dt"> => {
    if (stage === "idle") {
      return demoFrame(now);
    }
    return advance(now) ?? frameOf(pourOf(seed, index), null, null, 0);
  };

  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - last) / 1000);
    last = now;
    if (stage === "pouring" || stage === "settled" || stage === "ready") {
      played += dt;
    }
    const shown = shownFrame(now);
    progress(now);
    if (stage !== "idle" && shown.broke === null) {
      on.reading(aboveRim(fillOf(shown.pour, shown.volume)));
    }
    sound.flow(stage === "idle" ? 0 : shown.stream);
    render.draw({ ...shown, clock: now / 1000, dt });
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (stage === "result") {
        begin();
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
