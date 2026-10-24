import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { judgeSwipe, reachOf, splitBy, steer } from "./cut";
import type { Cut, Split } from "./cut";
import { SPAN, dishOf, kindOf } from "./foods";
import type { Food } from "./foods";
import type { Point } from "./geometry";
import { SEED_MAX } from "./random";
import { demoOf } from "./result";
import type { Piece, Result } from "./result";
import { loadSave, settleCut, settleMiss, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";

type Stage = "title" | "play" | "result";

export type Beat = "show" | "slice" | "split" | "clear";

export type Fumble = "tap" | "miss" | "partial";

export interface Slash {
  from: Point;
  to: Point;
}

export interface View {
  stage: Stage;
  food: Food;
  split: Split | null;
  serving: number;
  beat: Beat | null;
  knife: Slash | null;
  aim: Cut | null;
  fumble: { kind: Fumble; slash: Slash | null; count: number } | null;
}

export interface Ending {
  result: Result;
  piece: Piece;
  record: boolean;
  challenged: boolean;
}

interface Listeners {
  view: (view: View) => void;
  trail: (trail: Slash | null) => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const BEATS: Record<Beat, number> = {
  clear: 450,
  show: 900,
  slice: 650,
  split: 2600,
};

const NEXT: Record<Beat, Beat> = {
  clear: "show",
  show: "slice",
  slice: "split",
  split: "clear",
};

const randomSeed = () =>
  1 + ((crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) % SEED_MAX);

const block = (event: Event) => {
  event.preventDefault();
};

export const startSession = (
  board: HTMLElement,
  box: () => DOMRect | null,
  challenge: Result | null,
  on: Listeners
) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let seed = 0;
  let challenged = false;
  let round = 0;
  let demo = demoOf(0);

  let view: View = {
    aim: null,
    beat: null,
    fumble: null,
    food: demo.food,
    knife: null,
    serving: 0,
    split: null,
    stage: "title",
  };

  let active: { id: number; from: Point; to: Point } | null = null;
  let played = 0;
  let since: number | null = null;
  let timer = 0;
  let fumbles = 0;

  const show = (next: Partial<View>) => {
    view = { ...view, ...next };
    on.view(view);
  };

  const keep = (next: Save) => {
    save = next;
    storeSave(save);
    on.save(save);
  };

  const clock = (running: boolean) => {
    const now = performance.now();

    if (since !== null) {
      played += (now - since) / 1000;
    }

    since = running && document.visibilityState === "visible" ? now : null;
  };

  const takeSeconds = () => {
    clock(false);
    const seconds = played;
    played = 0;

    return seconds;
  };

  const beat = (next: Beat) => {
    clearTimeout(timer);

    if (view.stage !== "title") {
      return;
    }

    if (next === "show") {
      round += 1;
      demo = demoOf(round);
    }

    show({
      beat: next,
      food: demo.food,
      knife: next === "show" ? null : reachOf(demo.food.parts, demo.cut),
      serving: round,
      split: next === "split" || next === "clear" ? demo.split : null,
    });
    timer = window.setTimeout(() => {
      beat(NEXT[next]);
    }, BEATS[next]);
  };

  const toTitle = () => {
    clearTimeout(timer);
    clock(false);
    played = 0;
    round = 0;
    demo = demoOf(0);
    show({
      aim: null,
      beat: calm ? "split" : "show",
      food: demo.food,
      fumble: null,
      knife: calm ? reachOf(demo.food.parts, demo.cut) : null,
      serving: 0,
      split: calm ? demo.split : null,
      stage: "title",
    });

    if (!calm) {
      timer = window.setTimeout(() => {
        beat("slice");
      }, BEATS.show);
    }
  };

  const toObject = (event: PointerEvent): Point | null => {
    const rect = box();

    if (rect === null || rect.width === 0 || rect.height === 0) {
      return null;
    }

    return {
      x: ((event.clientX - rect.left) / rect.width) * SPAN - SPAN / 2,
      y: ((event.clientY - rect.top) / rect.height) * SPAN - SPAN / 2,
    };
  };

  const freshSeed = () => {
    const last = view.stage === "title" ? null : view.food.kind;
    let next = randomSeed();

    while (kindOf(next) === last) {
      next = randomSeed();
    }

    return next;
  };

  const start = (fromChallenge: boolean) => {
    clearTimeout(timer);
    sound.unlock();
    challenged = fromChallenge && challenge !== null;
    seed = challenged && challenge !== null ? challenge.seed : freshSeed();
    played = 0;
    show({
      aim: null,
      beat: null,
      food: dishOf(seed),
      fumble: null,
      knife: null,
      serving: view.serving + 1,
      split: null,
      stage: "play",
    });
    clock(true);
  };

  const fumble = (kind: Fumble, slash: Slash | null) => {
    fumbles += 1;
    keep(settleMiss(save));

    if (kind === "partial") {
      sound.nick();
    } else {
      sound.fumble();
    }

    navigator.vibrate?.(kind === "partial" ? [12, 40, 12] : 8);
    show({ fumble: { count: fumbles, kind, slash } });
  };

  const slice = (cut: Cut) => {
    const { food } = view;
    const split = splitBy(food.parts, cut);
    const knife = reachOf(food.parts, cut);

    if (split === null) {
      fumble("miss", knife);

      return;
    }

    const settled = settleCut(save, {
      at: Date.now(),
      challenged,
      kind: food.kind,
      seconds: takeSeconds(),
      small: split.small,
    });

    keep(settled.save);
    sound.cut(split.small);
    navigator.vibrate?.(split.small === 500 ? [16, 50, 16, 50, 40] : 16);
    show({ aim: null, fumble: null, knife, split, stage: "result" });
    on.over({
      challenged,
      piece: { cut, food, split },
      record: settled.record,
      result: { cut, seed },
    });
  };

  const down = (event: PointerEvent) => {
    if (view.stage === "title" && event.isPrimary) {
      event.preventDefault();
      start(challenge !== null);

      return;
    }

    if (
      view.stage !== "play" ||
      active !== null ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }

    const from = toObject(event);

    if (from === null) {
      return;
    }

    event.preventDefault();
    sound.unlock();
    board.setPointerCapture(event.pointerId);
    active = { from, id: event.pointerId, to: from };
    show({ aim: null });
    on.trail({ from, to: from });
  };

  const move = (event: PointerEvent) => {
    if (active === null || event.pointerId !== active.id) {
      return;
    }

    const to = toObject(event);

    if (to !== null) {
      active.to = to;
      on.trail({ from: active.from, to });
    }
  };

  const up = (event: PointerEvent) => {
    if (active === null || event.pointerId !== active.id) {
      return;
    }

    const { from } = active;

    const to =
      event.type === "pointerup" ? (toObject(event) ?? active.to) : active.to;

    active = null;
    on.trail(null);
    const swipe = judgeSwipe(view.food.parts, from, to);

    if (swipe.kind === "cut") {
      slice(swipe.cut);

      return;
    }

    fumble(swipe.kind, swipe.kind === "tap" ? null : { from, to });
  };

  const key = (event: KeyboardEvent) => {
    if (
      view.stage !== "play" ||
      active !== null ||
      (event.target instanceof Element &&
        event.target.closest("button, a, input, [role=menu], [role=dialog]") !==
          null) ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    ) {
      return;
    }

    const aim = view.aim ?? { angle: 0, offset: 0 };
    const steered = steer(aim, event.key, event.shiftKey);

    if (steered !== null) {
      show({ aim: steered, fumble: null });
    } else if (event.key === "Enter" || event.key === " ") {
      if (event.repeat) {
        event.preventDefault();

        return;
      }

      if (view.aim === null) {
        show({ aim, fumble: null });
      } else {
        sound.unlock();
        slice(view.aim);
      }
    } else {
      return;
    }

    event.preventDefault();
  };

  const hide = () => {
    clock(view.stage === "play");
  };

  board.addEventListener("pointerdown", down);
  board.addEventListener("pointermove", move);
  board.addEventListener("pointerup", up);
  board.addEventListener("pointercancel", up);
  board.addEventListener("lostpointercapture", up);
  board.addEventListener("contextmenu", block);
  window.addEventListener("keydown", key);
  document.addEventListener("visibilitychange", hide);
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);
  toTitle();

  return {
    settings: (chosen: Settings) => {
      settings = chosen;
      storeSettings(settings);
      sound.mute(settings.muted);
      on.settings(settings);
    },
    start,
    stop: () => {
      clearTimeout(timer);
      board.removeEventListener("pointerdown", down);
      board.removeEventListener("pointermove", move);
      board.removeEventListener("pointerup", up);
      board.removeEventListener("pointercancel", up);
      board.removeEventListener("lostpointercapture", up);
      board.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", key);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
    title: toTitle,
  };
};
