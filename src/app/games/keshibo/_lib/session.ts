import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { lookOf } from "./box";
import { bodyOf } from "./eraser";
import type { Design } from "./eraser";
import {
  MAX_ANGLE,
  advance,
  createWorld,
  isDown,
  launch,
  limitOf,
  place,
  rack,
  standingOf,
} from "./physics";
import type { Point, World } from "./physics";
import { createRenderer } from "./render";
import type { Aim, Shot } from "./render";
import type { Result } from "./result";
import { loadSave, settle, storeSave } from "./save";
import type { Save } from "./save";
import { lastCall, stateOf } from "./score";
import { createSound } from "./sound";

export type Phase = "ready" | "aiming" | "rolling" | "done";

type CallKind = "strike" | "spare" | "miss" | "gutter" | "count";

export interface Call {
  id: number;
  kind: CallKind;
  pins: number;
  run: number;
}

export interface Ending {
  result: Result;
  record: boolean;
}

interface Listeners {
  phase: (phase: Phase) => void;
  rolls: (rolls: number[]) => void;
  call: (call: Call) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

type Stage = "ready" | "aiming" | "rolling" | "hold" | "clear" | "done";

const HOLD = 1300;
const CLEAR = 520;
const RACK = 900;
const BALL_IN = 520;
const DEAD = 10;
const BEND = { dead: 0.05, full: 0.22, shortest: 40 };
const GHOST = 3200;
const PACE = 0.62;
const IMPACT = { pace: 0.2, span: 420 };

const block = (event: Event) => {
  event.preventDefault();
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const callOf = (rolls: number[], pins: number, gutter: boolean): Call => {
  const id = rolls.length;
  const last = lastCall(rolls);

  if (last === null) {
    return { id, kind: "count", pins, run: 0 };
  }

  if (last.kind === "miss" && gutter) {
    return { id, kind: "gutter", pins, run: 0 };
  }

  return { id, kind: last.kind, pins, run: last.run };
};

const pullOf = (client: Point, origin: Point) => {
  const dx = client.x - origin.x;
  const dy = client.y - origin.y;
  const reach = Math.max(120, Math.min(innerWidth, innerHeight) * 0.34);
  const length = Math.hypot(dx, dy);

  return {
    angle: dy <= 0 ? 0 : clamp(Math.atan2(-dx, dy), -MAX_ANGLE, MAX_ANGLE),
    power: dy <= 0 ? 0 : clamp((length - DEAD) / reach, 0, 1),
  };
};

export const bendOf = (path: readonly Point[]) => {
  const first = path.at(0);
  const last = path.at(-1);

  if (first === undefined || last === undefined) {
    return 0;
  }

  const chordX = last.x - first.x;
  const chordY = last.y - first.y;
  const length = Math.hypot(chordX, chordY);

  if (length < BEND.shortest) {
    return 0;
  }

  let deepest = 0;

  for (const point of path) {
    const side =
      (chordY * (point.x - first.x) - chordX * (point.y - first.y)) / length;

    if (Math.abs(side) > Math.abs(deepest)) {
      deepest = side;
    }
  }

  const bulge = deepest / length;

  if (Math.abs(bulge) <= BEND.dead) {
    return 0;
  }

  return clamp(
    (bulge - Math.sign(bulge) * BEND.dead) / (BEND.full - BEND.dead),
    -1,
    1
  );
};

export const startSession = (canvas: HTMLCanvasElement, on: Listeners) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let design: Design = save.design;
  let look = lookOf(design);
  let rolls: number[] = [];
  let world: World = createWorld(bodyOf(design), rack());
  let stage: Stage = "ready";
  let stageAt = performance.now();
  let lastX = 0;
  let aim: Aim | null = null;

  let pointer: {
    id: number;
    origin: Point;
    x: number;
    path: Point[];
  } | null = null;

  let touched = false;
  let hit = false;
  let slowUntil = 0;
  let fresh = true;
  let playing = 0;
  let previous = performance.now();
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);
  on.phase("ready");
  on.rolls(rolls);

  const enter = (next: Stage, now: number) => {
    stage = next;
    stageAt = now;

    if (
      next === "ready" ||
      next === "aiming" ||
      next === "rolling" ||
      next === "done"
    ) {
      on.phase(next);
    }
  };

  const keep = (next: Save) => {
    save = next;
    storeSave(save);
    on.save(save);
  };

  const reset = (
    now: number,
    standing: ReturnType<typeof standingOf> | null
  ) => {
    world = createWorld(bodyOf(design), rack(standing));
    place(world, lastX, 0);
    fresh = standing === null;
    render.sweep();
    enter("ready", now);
  };

  const localOf = (event: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();

    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const down = (event: PointerEvent) => {
    if (
      stage !== "ready" ||
      pointer !== null ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    event.preventDefault();
    sound.unlock();
    canvas.setPointerCapture(event.pointerId);
    touched = true;
    const lane = render.toLane({ x: event.clientX, y: event.clientY });
    const limit = limitOf(world.ball);
    const x = lane === null ? lastX : clamp(lane.x, -limit, limit);
    lastX = x;
    pointer = {
      id: event.pointerId,
      origin: { x: event.clientX, y: event.clientY },
      path: [{ x: event.clientX, y: event.clientY }],
      x,
    };
    place(world, x, 0);
    aim = { angle: 0, curl: 0, finger: localOf(event), power: 0, x };
    enter("aiming", event.timeStamp);
  };

  const move = (event: PointerEvent) => {
    if (stage !== "aiming" || pointer?.id !== event.pointerId || aim === null) {
      return;
    }

    const at = { x: event.clientX, y: event.clientY };
    pointer.path = [
      ...pointer.path.slice(0, 1),
      ...pointer.path.slice(1).slice(-400),
      at,
    ];
    const pull = pullOf(at, pointer.origin);
    aim = {
      ...aim,
      ...pull,
      curl: bendOf(pointer.path),
      finger: localOf(event),
    };
    place(world, pointer.x, pull.angle);
  };

  const letGo = (now: number) => {
    pointer = null;
    aim = null;
    place(world, lastX, 0);
    enter("ready", now);
  };

  const up = (event: PointerEvent) => {
    if (pointer?.id !== event.pointerId) {
      return;
    }

    const thrown = aim;

    if (stage !== "aiming" || thrown === null || thrown.power < 0.06) {
      letGo(performance.now());

      return;
    }

    pointer = null;
    aim = null;
    hit = false;
    launch(world, {
      angle: thrown.angle,
      curl: thrown.curl,
      power: thrown.power,
      x: thrown.x,
    });
    sound.flick(thrown.power);
    navigator.vibrate?.(10);
    enter("rolling", performance.now());
  };

  const cancel = (event: PointerEvent) => {
    if (pointer?.id === event.pointerId && stage === "aiming") {
      letGo(performance.now());
    }
  };

  const contacts = () => {
    for (const contact of world.contacts) {
      if (contact.type === "hit") {
        if (!hit) {
          slowUntil = performance.now() + IMPACT.span;
        }

        hit = true;
        sound.clack(contact.strength, 0.2);
        render.crumbs(contact.at, contact.strength);
        render.shake(Math.min(7, contact.strength / 50));
        navigator.vibrate?.(Math.min(30, 6 + contact.strength / 12));
      } else if (contact.type === "clack") {
        sound.clack(contact.strength * 0.8, (((contact.at.x * 7) % 1) + 1) % 1);
        render.crumbs(contact.at, contact.strength * 0.6);
      } else if (contact.type === "topple") {
        sound.thud(60);
      } else if (contact.type === "land") {
        sound.thud(40 + contact.strength * 3);
        render.shake(Math.min(3, contact.strength / 12));
        render.crumbs(contact.at, contact.strength * 3);
      } else {
        sound.floor();
      }
    }

    world.contacts.length = 0;
  };

  const settleRoll = (now: number) => {
    const pins = world.pins.filter((pin) => isDown(pin)).length;
    rolls = [...rolls, pins];
    on.rolls(rolls);
    const call = callOf(rolls, pins, world.ball.dropped && !hit);
    on.call(call);

    if (call.kind === "strike") {
      sound.strike(call.run);
      navigator.vibrate?.([20, 40, 20, 40, 60]);
    } else if (call.kind === "spare") {
      sound.spare();
      navigator.vibrate?.([20, 40, 40]);
    } else if (call.kind === "gutter") {
      sound.gutter();
    }

    sound.slide(0);
    enter("hold", now);
  };

  const finish = (now: number) => {
    const settled = settle(save, { at: Date.now(), rolls, seconds: playing });
    keep(settled.save);
    enter("done", now);
    on.over({ record: settled.record, result: { design, rolls } });
  };

  const step = (now: number, dt: number) => {
    const since = now - stageAt;

    if (stage === "rolling") {
      playing += dt;

      const done = advance(
        world,
        dt * (now < slowUntil && !calm ? IMPACT.pace : PACE)
      );

      contacts();
      sound.slide(
        world.ball.dropped ? 0 : Math.hypot(world.ball.vx, world.ball.vy)
      );

      if (done) {
        settleRoll(now);
      }
    } else if (stage === "hold" && since > HOLD) {
      if (stateOf(rolls).over) {
        finish(now);
      } else {
        enter("clear", now);
      }
    } else if (stage === "clear" && since > CLEAR) {
      reset(now, stateOf(rolls).fresh ? null : standingOf(world));
    } else if (stage === "aiming") {
      playing += dt;
    }
  };

  const ghost = (now: number): Aim | null => {
    if (touched || stage !== "ready" || calm) {
      return null;
    }

    const t = (now % GHOST) / GHOST;
    const pull = clamp((t - 0.18) / 0.5, 0, 1);
    const ease = 1 - (1 - pull) ** 3;

    if (t > 0.82) {
      return null;
    }

    const at = render.screenOf(world.ball);
    const arc = Math.floor(now / GHOST) % 2 === 1;

    return {
      angle: arc ? 0 : -0.06 * ease,
      curl: arc ? 0.7 * ease : 0,
      finger: {
        x: at.x + (arc ? 26 * Math.sin(ease * Math.PI) : 12 * ease),
        y: at.y + 28 + 42 * ease,
      },
      power: 0.55 * ease,
      x: lastX,
    };
  };

  const shotOf = (): Shot => {
    if (stage === "rolling") {
      return "follow";
    }

    return stage === "hold" ? "pins" : "aim";
  };

  const hide = () => {
    if (document.visibilityState === "hidden" && stage === "aiming") {
      letGo(performance.now());
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", cancel);
  canvas.addEventListener("lostpointercapture", cancel);
  canvas.addEventListener("contextmenu", block);
  document.addEventListener("visibilitychange", hide);

  let frame = 0;

  const tick = (now: number) => {
    const dt = Math.min(0.05, Math.max(0, now - previous) / 1000);
    previous = now;
    step(now, dt);
    const since = now - stageAt;
    const ghostAim = ghost(now);

    if (ghostAim !== null) {
      place(world, lastX, ghostAim.angle);
    }

    render.draw(now, {
      aim: aim ?? ghostAim,
      ballIn:
        stage === "ready" && since < BALL_IN && rolls.length > 0
          ? since / BALL_IN
          : null,
      fade: stage === "clear" ? 1 - since / CLEAR : 1,
      look,
      rack:
        stage === "ready" && fresh && since < RACK && rolls.length > 0
          ? since / RACK
          : null,
      shot: shotOf(),
      world,
    });
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  const newGame = () => {
    rolls = [];
    playing = 0;
    pointer = null;
    aim = null;
    sound.slide(0);
    on.rolls(rolls);
    reset(performance.now(), null);
  };

  return {
    again: () => {
      if (stage === "done") {
        newGame();
      }
    },
    design: (next: Design) => {
      if (rolls.length > 0 && stage !== "done") {
        return;
      }

      design = next;
      look = lookOf(design);
      keep({ ...save, design });
      world = createWorld(bodyOf(design), rack());
      lastX = 0;
      place(world, lastX, 0);
    },
    quit: () => {
      if (stage !== "done") {
        newGame();
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
      canvas.removeEventListener("pointercancel", cancel);
      canvas.removeEventListener("lostpointercapture", cancel);
      canvas.removeEventListener("contextmenu", block);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
  };
};
