import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { createBrush } from "./brush";
import type { Sample } from "./brush";
import { modelSamples } from "./model";
import { createRenderer } from "./render";
import type { Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { judge } from "./score";
import type { Circle, Flaw } from "./score";
import { createSound } from "./sound";
import { simplify } from "./stroke";

export type Phase = "demo" | "ready" | "drawing" | "done";

export interface Ending {
  result: Result;
  circle: Circle | null;
  flaw: Flaw | null;
  record: boolean;
}

interface Listeners {
  phase: (phase: Phase) => void;
  over: (ending: Ending) => void;
  miss: () => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const HOLD = 1800;
const FADE = 900;
const REST = 600;
const MISS_FADE = 450;
const PAUSE = 40;
const MODEL_END = modelSamples.at(-1)?.t ?? 0;

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

const sampleAt = (event: PointerEvent, rect: DOMRect): Sample => ({
  t: event.timeStamp,
  x: (event.clientX - rect.left) / (rect.width || 1),
  y: (event.clientY - rect.top) / (rect.height || 1),
});

const hold = (event: Event) => {
  event.preventDefault();
};

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let phase: Phase = "demo";
  let brush = createBrush(newSeed());
  let samples: Sample[] = [];
  let active: number | null = null;
  let demoAt = performance.now();
  let fed = 0;
  let missAt: number | null = null;
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

  const feed = (until: number) => {
    while (fed < modelSamples.length) {
      const model = modelSamples[fed];
      if (model.t > until) {
        return;
      }
      const sample = { ...model, t: demoAt + model.t };
      render.add(fed === 0 ? brush.press(sample) : brush.move(sample));
      fed += 1;
    }
    if (fed === modelSamples.length) {
      render.add(brush.lift());
      fed += 1;
    }
  };

  const playDemo = (now: number) => {
    if (calm) {
      feed(MODEL_END);
      return;
    }
    const elapsed = now - demoAt;
    feed(elapsed);
    const after = elapsed - MODEL_END;
    render.fade(after < HOLD ? 1 : Math.max(0, 1 - (after - HOLD) / FADE));
    if (after > HOLD + FADE + REST) {
      render.clear();
      brush = createBrush(newSeed());
      demoAt = now;
      fed = 0;
    }
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
    missAt = null;
    render.clear();
    brush = createBrush(newSeed());
    const sample = sampleAt(event, canvas.getBoundingClientRect());
    samples = [sample];
    render.add(brush.press(sample));
    enter("drawing");
  };

  const move = (event: PointerEvent) => {
    if (event.pointerId !== active) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const from = samples.at(-1);
    const coalesced = event.getCoalescedEvents?.() ?? [];
    for (const each of coalesced.length > 0 ? coalesced : [event]) {
      const sample = sampleAt(each, rect);
      samples.push(sample);
      render.add(brush.move(sample));
    }
    const to = samples.at(-1);
    if (from && to && to.t > from.t) {
      sound.brush(
        (Math.hypot(to.x - from.x, to.y - from.y) / (to.t - from.t)) * 1000
      );
    }
  };

  const finish = (event: PointerEvent) => {
    if (event.pointerId !== active) {
      return;
    }
    active = null;
    sound.brush(0);
    render.add(brush.lift());
    const verdict = judge(samples);
    if (verdict.flaw === "short") {
      missAt = performance.now();
      sound.tap();
      enter("ready");
      on.miss();
      return;
    }
    const settled = settle(save, {
      at: Date.now(),
      score: verdict.score,
      seconds: ((samples.at(-1)?.t ?? 0) - (samples[0]?.t ?? 0)) / 1000,
    });
    keep(settled.save);
    sound.ring(verdict.score, settled.record);
    navigator.vibrate?.(settled.record ? [20, 60, 30] : 18);
    on.over({
      circle: verdict.circle,
      flaw: verdict.flaw,
      record: settled.record,
      result: { score: verdict.score, trace: simplify(brush.trace()) },
    });
    enter("done");
  };

  const cancel = (event: PointerEvent) => {
    if (event.pointerId !== active) {
      return;
    }
    active = null;
    sound.brush(0);
    render.clear();
    enter("ready");
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", finish);
  canvas.addEventListener("lostpointercapture", finish);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("contextmenu", hold);

  let frame = 0;
  const tick = (now: number) => {
    if (phase === "demo") {
      playDemo(now);
    }
    const held = samples.at(-1);
    if (active !== null && held && now - held.t > PAUSE) {
      render.add(brush.move({ ...held, t: now }));
    }
    if (missAt !== null) {
      const left = calm ? 0 : 1 - (now - missAt) / MISS_FADE;
      if (left > 0) {
        render.fade(left);
      } else {
        missAt = null;
        render.clear();
      }
    }
    render.draw(now);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      missAt = null;
      render.clear();
      enter("ready");
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
      canvas.removeEventListener("pointerup", finish);
      canvas.removeEventListener("lostpointercapture", finish);
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("contextmenu", hold);
      sound.close();
    },
  };
};
