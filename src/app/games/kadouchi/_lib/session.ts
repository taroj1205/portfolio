import type { Lang } from "../../_lib/i18n";
import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import type { Point } from "../../_lib/svg";
import { STALL, VIEW } from "./art";
import { createDemo } from "./demo";
import { kinds, scoreOf } from "./prizes";
import type { PrizeId } from "./prizes";
import { createRenderer } from "./render";
import { PERFECT, rankOf, resultOf } from "./result";
import type { Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";
import {
  CORKS,
  cleared,
  createStall,
  powerOf,
  shoot,
  step,
  still,
  swayOf,
} from "./stall";
import type { Outcome, Stall } from "./stall";

export type Phase = "ready" | "shooting" | "done";

export interface Ending {
  result: Result;
  record: boolean;
  first: PrizeId[];
}

interface Listeners {
  phase: (phase: Phase) => void;
  meter: (score: number, corks: number) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const LIFT = 84;
const KEYS = 520;
const CLEARED = 900;
const SETTLED = 700;
const STUCK = 4000;
const SHOWN = 1700;
const HOME = { x: 500, y: 640 };

const ARROWS = new Map<string, "down" | "left" | "right" | "up">([
  ["ArrowDown", "down"],
  ["ArrowLeft", "left"],
  ["ArrowRight", "right"],
  ["ArrowUp", "up"],
]);

const block = (event: Event) => {
  event.preventDefault();
};

const typing = (event: KeyboardEvent) =>
  event.target instanceof Element &&
  event.target.closest("button, a, input, [role='menu'], [role='dialog']") !==
    null;

const inside = (point: Point): Point => ({
  x: Math.min(STALL.right + 40, Math.max(STALL.left - 40, point.x)),
  y: Math.min(VIEW.y + VIEW.h - 120, Math.max(VIEW.y + 60, point.y)),
});

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let phase: Phase = "ready";
  let stall: Stall = createStall(Math.random);
  let demo = createDemo(Math.random);
  let demoHeld: number | null = null;
  let active: number | null = null;
  let touch = false;
  let aim: Point | null = null;
  let holding: number | null = null;
  let keys = { down: false, left: false, right: false, up: false };
  let ending: { at: number; value: Ending } | null = null;
  let quietSince: number | null = null;
  let lastShot = 0;
  let start = 0;
  let shown = "";
  let previous = performance.now();
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);
  on.phase(phase);

  const enter = (next: Phase) => {
    phase = next;
    on.phase(next);
  };

  const meter = () => {
    const score = scoreOf(stall.got);
    const key = `${score}:${stall.corks}`;

    if (key !== shown) {
      shown = key;
      on.meter(score, stall.corks);
    }
  };

  const finish = (now: number) => {
    active = null;
    holding = null;
    const result = resultOf(stall.got);
    const { level } = rankOf(scoreOf(result.got));

    const settled = settle(save, {
      at: Date.now(),
      fired: CORKS - stall.corks,
      hits: stall.hits,
      result,
      seconds: Math.max(0, now - start) / 1000,
    });

    ({ save } = settled);
    storeSave(save);
    on.save(save);
    enter("done");
    render.finish(stall.got, level === PERFECT, now);
    sound.over(level);
    ending = {
      at: now + (calm ? 300 : SHOWN),
      value: { first: settled.first, record: settled.record, result },
    };
  };

  const react = (events: readonly Outcome[], now: number, loud: boolean) => {
    for (const event of events) {
      render.outcome(event, now);

      if (!loud) {
        continue;
      }

      if (event.type === "hit") {
        sound.hit(event.budged);
        navigator.vibrate?.(event.budged ? 14 : 6);
      } else if (event.type === "miss") {
        sound.miss();
      } else {
        const big = kinds[event.id].size === "big";
        sound.fall(big);
        navigator.vibrate?.(big ? [30, 40, 60] : 20);
      }
    }
  };

  const fire = (held: number, now: number) => {
    if (phase !== "shooting" || aim === null) {
      return;
    }

    const sway = swayOf(held, now / 1000);
    const target = { x: aim.x + sway.x, y: aim.y + sway.y };
    const power = powerOf(held);

    if (shoot(stall, target.x, target.y, power)) {
      lastShot = now;
      render.fire(target, now);
      sound.fire(power);
      navigator.vibrate?.(8);
    }
  };

  const begin = (now: number) => {
    sound.unlock();

    if (phase === "ready") {
      stall = createStall(Math.random);
      render.reset();
      aim = null;
      quietSince = null;
      lastShot = now;
      start = now;
      enter("shooting");
    }
  };

  const release = (now: number) => {
    if (holding !== null) {
      const held = Math.max(0, now - holding) / 1000;
      holding = null;
      fire(held, now);
    }

    active = null;
  };

  const cancel = () => {
    holding = null;
    active = null;
  };

  const pointAt = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();

    return inside(
      render.sceneOf(
        event.clientX - rect.left,
        event.clientY - rect.top - (touch ? LIFT : 0)
      )
    );
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
    begin(event.timeStamp);
    canvas.setPointerCapture(event.pointerId);
    active = event.pointerId;
    touch = event.pointerType !== "mouse";
    aim = pointAt(event);
    holding = event.timeStamp;
  };

  const move = (event: PointerEvent) => {
    if (phase !== "shooting") {
      return;
    }

    if (event.pointerId === active) {
      aim = pointAt(event);
    } else if (active === null && event.pointerType === "mouse") {
      touch = false;
      aim = pointAt(event);
    }
  };

  const up = (event: PointerEvent) => {
    sound.unlock();

    if (event.pointerId === active) {
      release(event.timeStamp);
    }
  };

  const lost = (event: PointerEvent) => {
    if (event.pointerId === active) {
      cancel();
    }
  };

  const press = (event: KeyboardEvent, pressed: boolean) => {
    if (typing(event)) {
      return;
    }

    const way = ARROWS.get(event.key);

    if (way !== undefined) {
      event.preventDefault();
      keys = { ...keys, [way]: pressed };
    } else if (event.key === " ") {
      event.preventDefault();

      if (event.repeat || phase === "done") {
        return;
      }

      if (pressed && active === null) {
        begin(event.timeStamp);
        aim ??= HOME;
        holding = event.timeStamp;
      } else if (!pressed && active === null) {
        release(event.timeStamp);
      }
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
      keys = { down: false, left: false, right: false, up: false };
      cancel();
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", lost);
  canvas.addEventListener("lostpointercapture", lost);
  canvas.addEventListener("contextmenu", block);
  window.addEventListener("keydown", keydown);
  window.addEventListener("keyup", keyup);
  document.addEventListener("visibilitychange", hide);

  const steerKeys = (dt: number) => {
    const x = Number(keys.right) - Number(keys.left);
    const y = Number(keys.down) - Number(keys.up);

    if ((x !== 0 || y !== 0) && phase === "shooting") {
      const from = aim ?? HOME;
      aim = inside({ x: from.x + x * KEYS * dt, y: from.y + y * KEYS * dt });
    }
  };

  const showDemo = (dt: number, now: number) => {
    const next = demo.next(stall, dt);

    if (next.again) {
      stall = createStall(Math.random);
      render.reset();
    }

    ({ aim, held: demoHeld } = next);

    if (
      next.fire &&
      shoot(stall, next.aim.x, next.aim.y, powerOf(next.held ?? 0))
    ) {
      render.fire(next.aim, now);
    }
  };

  const watch = (now: number) => {
    if (cleared(stall)) {
      quietSince ??= now;

      if (now - quietSince >= CLEARED) {
        finish(now);
      }

      return;
    }

    if (stall.corks > 0) {
      return;
    }

    quietSince = still(stall) ? (quietSince ?? now) : null;

    if (
      (quietSince !== null && now - quietSince >= SETTLED) ||
      now - lastShot >= STUCK
    ) {
      finish(now);
    }
  };

  const heldAt = (now: number) =>
    holding === null ? null : Math.max(0, now - holding) / 1000;

  let frame = 0;

  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - previous) / 1000);
    previous = now;
    const watching = phase === "ready" && active === null && holding === null;

    if (watching) {
      showDemo(dt, now);
    }

    steerKeys(dt);
    react(step(stall, dt), now, phase === "shooting");

    if (phase === "shooting") {
      watch(now);
    }

    meter();

    if (ending !== null && now >= ending.at) {
      on.over(ending.value);
      ending = null;
    }

    const held = watching ? demoHeld : heldAt(now);

    render.draw(
      stall,
      {
        aim: phase === "done" ? null : aim,
        held,
        sway: swayOf(held ?? 0, now / 1000),
      },
      now
    );
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (phase === "done") {
        stall = createStall(Math.random);
        demo = createDemo(Math.random);
        keys = { down: false, left: false, right: false, up: false };
        aim = null;
        ending = null;
        render.reset();
        enter("ready");
      }
    },
    language: (lang: Lang) => {
      render.language(lang);
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
      canvas.removeEventListener("pointercancel", lost);
      canvas.removeEventListener("lostpointercapture", lost);
      canvas.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
  };
};
