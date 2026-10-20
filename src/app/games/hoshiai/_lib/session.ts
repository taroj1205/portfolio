import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { TOP } from "./bodies";
import { createRenderer } from "./render";
import { resultOf } from "./result";
import type { Result } from "./result";
import { discover, loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";
import { TICK, canDrop, createWorld, drop, step } from "./world";
import type { Merge, Orb, World } from "./world";

export interface Ending {
  result: Result;
  record: boolean;
}

interface Listeners {
  score: (score: number) => void;
  queue: (queue: readonly [number, number]) => void;
  drop: () => void;
  merge: (merge: Merge) => void;
  discover: (tier: number) => void;
  danger: (level: number) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const REVEAL = 1.2;
const TURN = 2.6;
const SLOW = 0.35;
const MAX_STEPS = 12;
const DROP_KEYS = new Set([" ", "Enter", "ArrowDown", "s"]);
const LEFT_KEYS = new Set(["ArrowLeft", "a"]);
const RIGHT_KEYS = new Set(["ArrowRight", "d"]);

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

const interactive = (target: EventTarget | null) =>
  target instanceof Element &&
  target.closest(
    "button, a, input, select, textarea, [role='dialog'], [role='menu']"
  ) !== null;

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let world: World = createWorld(newSeed());
  let known = save.top;
  let aim = -Math.PI / 2;
  let shown = aim;
  let held = false;
  let turning = 0;
  let wanted = false;
  let slow = 0;
  let overAt: number | null = null;
  let ended = false;
  let paused = false;
  let danger = 0;
  let warned = 0;
  let pending = 0;
  let last = performance.now();
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);
  on.score(0);
  on.queue(world.queue);

  const keep = (next: Save) => {
    save = next;
    storeSave(save);
    on.save(save);
  };

  const learn = (tier: number, loud: boolean) => {
    const next = discover(save, tier);
    if (next === null) {
      return;
    }
    known = tier;
    keep(next);
    if (loud) {
      on.discover(tier);
    }
  };

  const aimAt = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    const { cx, cy } = render.layout();
    aim = Math.atan2(
      event.clientY - rect.top - cy,
      event.clientX - rect.left - cx
    );
  };

  const release = () => {
    const orb = drop(world, aim);
    if (orb === null) {
      return;
    }
    shown = aim;
    sound.drop();
    on.queue(world.queue);
    on.drop();
    if (orb.tier > known) {
      learn(orb.tier, false);
    }
  };

  const down = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    sound.unlock();
    canvas.setPointerCapture(event.pointerId);
    held = true;
    aimAt(event);
  };

  const move = (event: PointerEvent) => {
    if (held || event.pointerType === "mouse") {
      aimAt(event);
    }
  };

  const up = (event: PointerEvent) => {
    if (!held) {
      return;
    }
    held = false;
    aimAt(event);
    wanted = true;
  };

  const cancel = () => {
    held = false;
  };

  const keyDown = (event: KeyboardEvent) => {
    if (interactive(event.target) || event.metaKey || event.ctrlKey) {
      return;
    }
    if (LEFT_KEYS.has(event.key)) {
      turning = -1;
    } else if (RIGHT_KEYS.has(event.key)) {
      turning = 1;
    } else if (DROP_KEYS.has(event.key)) {
      event.preventDefault();
      sound.unlock();
      if (!event.repeat) {
        wanted = true;
      }
      return;
    } else {
      return;
    }
    event.preventDefault();
  };

  const keyUp = (event: KeyboardEvent) => {
    if (
      (turning < 0 && LEFT_KEYS.has(event.key)) ||
      (turning > 0 && RIGHT_KEYS.has(event.key))
    ) {
      turning = 0;
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", cancel);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);

  const landed = (orbs: Orb[]) => {
    for (const orb of orbs) {
      sound.land(orb.tier);
    }
  };

  const merged = (merges: Merge[]) => {
    for (const merge of merges) {
      render.burst(merge);
      if (merge.made === null) {
        sound.galaxy();
        navigator.vibrate?.([30, 40, 80]);
      } else {
        sound.merge(merge.made, merge.chain);
        navigator.vibrate?.(Math.min(40, 6 + merge.made * 3));
      }
      if (!calm && (merge.made === null || merge.made === TOP)) {
        slow = 0.8;
      }
      on.merge(merge);
      if (merge.made !== null && merge.made > known) {
        learn(merge.made, true);
      }
    }
    if (merges.length > 0) {
      on.score(world.score);
    }
  };

  const finish = () => {
    ended = true;
    const result = resultOf(world);
    const settled = settle(save, result);
    keep(settled.save);
    if (settled.record) {
      sound.record();
    }
    on.over({ record: settled.record, result });
  };

  const watchDanger = (now: number) => {
    if (
      Math.abs(world.danger - danger) > 0.01 ||
      (world.danger === 0) !== (danger === 0)
    ) {
      ({ danger } = world);
      on.danger(danger);
    }
    if (danger > 0.15 && now - warned > 500) {
      warned = now;
      sound.warn();
    }
  };

  let frame = 0;
  const tick = (now: number) => {
    const real = paused ? 0 : Math.min(0.05, (now - last) / 1000);
    last = now;
    const rate = slow > 0 ? SLOW : 1;
    slow = Math.max(0, slow - real);
    aim += turning * TURN * real;
    if (world.over) {
      wanted = false;
    } else if (wanted && canDrop(world)) {
      wanted = false;
      release();
    }
    pending += real * rate;
    let steps = 0;
    while (pending >= TICK && steps < MAX_STEPS) {
      pending -= TICK;
      steps += 1;
      const ticked = step(world);
      landed(ticked.landed);
      merged(ticked.merges);
    }
    if (steps === MAX_STEPS) {
      pending = 0;
    }
    const swing = Math.atan2(Math.sin(aim - shown), Math.cos(aim - shown));
    shown += swing * Math.min(1, real * 20);
    watchDanger(now);
    if (world.over && overAt === null) {
      overAt = now;
      sound.over();
      navigator.vibrate?.([60, 50, 60]);
    }
    if (overAt !== null && !ended && now - overAt > REVEAL * 1000) {
      finish();
    }
    render.draw({ aim: shown, clock: now / 1000, dt: real * rate, world });
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      if (!ended && world.drops > 0) {
        keep(settle(save, resultOf(world)).save);
      }
      world = createWorld(newSeed());
      render.reset();
      overAt = null;
      ended = false;
      wanted = false;
      slow = 0;
      pending = 0;
      on.score(0);
      on.queue(world.queue);
    },
    pause: (value: boolean) => {
      paused = value;
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
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      sound.close();
    },
  };
};
