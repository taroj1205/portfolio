import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { judgeSwipe, reachOf, splitBy, steer } from "./cut";
import type { Cut, Split } from "./cut";
import { RUN, SEED_MAX, SPAN, runOf } from "./foods";
import type { Food } from "./foods";
import type { Point } from "./geometry";
import { demoOf, scoreOf } from "./result";
import type { Piece, Result, Scored } from "./result";
import { loadSave, settleCut, settleMiss, settleRun, storeSave } from "./save";
import type { Save } from "./save";
import { createSound } from "./sound";

type Stage = "title" | "play" | "cut" | "result";

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
  index: number;
  pieces: Piece[];
  beat: Beat | null;
  knife: Slash | null;
  aim: Cut | null;
  fumble: { kind: Fumble; slash: Slash | null; count: number } | null;
}

export interface Ending {
  result: Result;
  scored: Scored;
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

const newSeed = () =>
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
  let seed = newSeed();
  let foods = runOf(seed);
  let cuts: Cut[] = [];
  let pieces: Piece[] = [];
  let challenged = false;
  let round = 0;
  let demo = demoOf(0);
  let view: View = {
    aim: null,
    beat: null,
    fumble: null,
    index: 0,
    knife: null,
    pieces: [],
    food: demo.food,
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
      knife: next === "show" ? null : reachOf(demo.food.outline, demo.cut),
      food: demo.food,
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
      fumble: null,
      index: 0,
      knife: calm ? reachOf(demo.food.outline, demo.cut) : null,
      pieces: [],
      food: demo.food,
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

  const serve = (index: number) => {
    show({
      aim: null,
      beat: null,
      fumble: null,
      index,
      knife: null,
      pieces,
      food: foods[index],
      split: null,
      stage: "play",
    });
    clock(true);
  };

  const start = (fromChallenge: boolean) => {
    clearTimeout(timer);
    sound.unlock();
    challenged = fromChallenge && challenge !== null;
    seed = challenged && challenge !== null ? challenge.seed : newSeed();
    foods = runOf(seed);
    cuts = [];
    pieces = [];
    played = 0;
    serve(0);
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
    const food = foods[view.index];
    const split = splitBy(food.outline, cut);
    const knife = reachOf(food.outline, cut);
    if (split === null) {
      fumble("miss", knife);
      return;
    }
    cuts.push(cut);
    pieces = [...pieces, { cut, food, split }];
    keep(
      settleCut(save, {
        at: Date.now(),
        kind: food.kind,
        seconds: takeSeconds(),
        small: split.small,
      })
    );
    sound.cut(split.small);
    navigator.vibrate?.(split.small === 500 ? [16, 50, 16, 50, 40] : 16);
    show({ aim: null, fumble: null, knife, pieces, split, stage: "cut" });
  };

  const finish = () => {
    const result = { cuts, seed };
    const scored = scoreOf(result);
    if (scored === null) {
      return;
    }
    const run = settleRun(save, scored.total, challenged);
    keep(run.save);
    show({
      knife: null,
      food: scored.best.food,
      split: scored.best.split,
      stage: "result",
    });
    on.over({ challenged, record: run.record, result, scored });
  };

  const next = () => {
    if (view.stage !== "cut") {
      return;
    }
    if (view.index + 1 >= RUN) {
      finish();
      return;
    }
    serve(view.index + 1);
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
    const swipe = judgeSwipe(view.food.outline, from, to);
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
    next,
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
