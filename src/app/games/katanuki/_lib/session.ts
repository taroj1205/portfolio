import { dayOf } from "../../_lib/day";
import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { SAFE, createCarving, percentOf, rest, scratch } from "./carve";
import type { Carving, Snap } from "./carve";
import { NOTCHES, mouldOf } from "./moulds";
import type { Point } from "./moulds";
import { createRenderer } from "./render";
import { LONGEST } from "./result";
import type { Plan, Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";

export type Phase = "demo" | "ready" | "carving" | "done";

export interface Ending {
  result: Result;
  today: boolean;
  official: boolean;
  record: boolean;
}

interface Listeners {
  plan: (today: number) => Plan;
  phase: (phase: Phase) => void;
  today: (today: number) => void;
  meter: (carved: number, stress: number) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const LIFT = 34;
const DEMO = { hold: 1400, share: 0.34, speed: SAFE };

const block = (event: Event) => {
  event.preventDefault();
};

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let phase: Phase = "demo";
  let plan = on.plan(dayOf(Date.now()));
  let carving: Carving = createCarving(mouldOf(plan.day));
  let active: number | null = null;
  let lift = 0;
  let last: { at: Point; t: number } | null = null;
  let start = 0;
  let cracks = 0;
  let demoAt = performance.now();
  let demoAlong = 0;
  let previous = demoAt;
  let dated = demoAt;
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);
  on.today(dayOf(Date.now()));
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

  const fresh = () => {
    plan = on.plan(dayOf(Date.now()));
    carving = createCarving(mouldOf(plan.day));
    cracks = 0;
    render.reset(carving);
    on.meter(0, 0);
  };

  const pointAt = (along: number) => {
    const { outline } = carving.mould;
    const i = Math.floor(along);
    const a = outline[i % NOTCHES];
    const b = outline[(i + 1) % NOTCHES];
    const u = along - i;
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
  };

  const playDemo = (now: number) => {
    const spacing = carving.mould.length / NOTCHES;
    const travel = ((DEMO.share * carving.mould.length) / DEMO.speed) * 1000;
    const elapsed = calm ? travel : now - demoAt;
    const target = Math.min(
      NOTCHES * DEMO.share,
      (elapsed / 1000) * (DEMO.speed / spacing)
    );
    while (demoAlong < target) {
      const next = Math.min(target, demoAlong + 1);
      const from = pointAt(demoAlong);
      const to = pointAt(next);
      scratch(
        carving,
        from,
        to,
        Math.hypot(to.x - from.x, to.y - from.y) / DEMO.speed
      );
      demoAlong = next;
    }
    render.needle(pointAt(demoAlong), true, 0);
    if (!calm && elapsed > travel + DEMO.hold) {
      fresh();
      demoAt = now;
      demoAlong = 0;
    }
  };

  const pointOf = (event: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    const side = Math.min(rect.width, rect.height) || 1;
    return {
      x: (event.clientX - rect.left - (rect.width - side) / 2) / side,
      y: (event.clientY - rect.top - (rect.height - side) / 2 - lift) / side,
    };
  };

  const finish = (result: Result, now: number) => {
    active = null;
    last = null;
    sound.scrape(0);
    render.needle(null, false, 0);
    const settled = settle(save, {
      at: Date.now(),
      cracks,
      notches: carving.count,
      plan,
      result,
      seconds: (now - start) / 1000,
    });
    keep(settled.save);
    enter("done");
    on.over({
      official: settled.official,
      record: settled.record,
      result,
      today: plan.today,
    });
  };

  const react = (snaps: Snap[], now: number) => {
    for (const snap of snaps) {
      if (snap.type === "warn") {
        cracks += 1;
        render.crack(snap.at, snap.level, now);
        sound.crack(snap.level);
        navigator.vibrate?.(12 + snap.level * 8);
      } else if (snap.type === "break") {
        render.shatter(snap.at, now);
        sound.shatter();
        navigator.vibrate?.([40, 30, 90]);
        finish({ carved: percentOf(carving), day: plan.day, time: null }, now);
      } else {
        render.pop(now);
        sound.clear();
        navigator.vibrate?.([20, 50, 20, 50, 60]);
        const time = Math.min(
          LONGEST,
          Math.max(1, Math.floor((now - start) / 100))
        );
        finish({ carved: 100, day: plan.day, time }, now);
      }
    }
  };

  const carve = (at: Point, t: number) => {
    const from = last?.at ?? at;
    const seconds = last === null ? 0 : Math.max(0, (t - last.t) / 1000);
    const before = carving.count;
    const snaps = scratch(carving, from, at, seconds);
    if (carving.count > before) {
      render.dust(at, t);
    }
    sound.scrape(
      seconds > 0 && carving.count > before
        ? Math.hypot(at.x - from.x, at.y - from.y) / seconds
        : 0
    );
    last = { at, t };
    react(snaps, t);
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
    lift = event.pointerType === "touch" ? LIFT : 0;
    if (phase !== "carving") {
      fresh();
      start = event.timeStamp;
      enter("carving");
    }
    last = null;
    const at = pointOf(event);
    render.needle(at, true, carving.tension);
    carve(at, event.timeStamp);
  };

  const move = (event: PointerEvent) => {
    if (phase !== "carving") {
      return;
    }
    if (event.pointerId !== active) {
      if (event.pointerType === "mouse") {
        lift = 0;
        render.needle(pointOf(event), false, 0);
      }
      return;
    }
    const coalesced = event.getCoalescedEvents?.() ?? [];
    for (const each of coalesced.length > 0 ? coalesced : [event]) {
      if (phase !== "carving") {
        return;
      }
      carve(pointOf(each), each.timeStamp);
    }
    if (phase === "carving") {
      render.needle(last?.at ?? pointOf(event), true, carving.tension);
    }
  };

  const up = (event: PointerEvent) => {
    if (event.pointerId !== active) {
      return;
    }
    active = null;
    last = null;
    sound.scrape(0);
    if (phase === "carving") {
      render.needle(
        event.pointerType === "mouse" ? pointOf(event) : null,
        false,
        0
      );
    }
  };

  const hide = () => {
    if (document.visibilityState === "hidden") {
      active = null;
      last = null;
      sound.scrape(0);
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("lostpointercapture", up);
  canvas.addEventListener("contextmenu", block);
  document.addEventListener("visibilitychange", hide);

  render.reset(carving);

  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - previous) / 1000);
    previous = now;
    if (phase === "demo") {
      playDemo(now);
    } else if (phase === "carving") {
      rest(carving, dt);
      on.meter(percentOf(carving), carving.tension);
    }
    if (phase !== "carving" && now - dated > 1000) {
      dated = now;
      const today = dayOf(Date.now());
      on.today(today);
      if (phase !== "done" && on.plan(today).day !== plan.day) {
        fresh();
        demoAt = now;
        demoAlong = 0;
      }
    }
    render.draw(now);
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (phase === "done") {
        fresh();
        render.needle(null, false, 0);
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
