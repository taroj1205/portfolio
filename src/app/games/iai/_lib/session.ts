import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import {
  CHALLENGE_FAKES,
  VERSUS_FAKES,
  cueAt,
  decide,
  fakeLength,
  fakes,
  ladder,
  other,
  planDuel,
  reactionOf,
  rivalOf,
} from "./duel";
import type { Call, Fake, Plan, Side, Tap } from "./duel";
import { createRenderer } from "./render";
import type { Clash, Frame } from "./render";
import { resultOf } from "./result";
import type { Challenge, Result } from "./result";
import {
  loadSave,
  settleDuel,
  settleRun,
  settleVersus,
  storeSave,
} from "./save";
import type { Save } from "./save";
import { tints } from "./scene";
import { createSound } from "./sound";

export type Mode = "solo" | "challenge" | "versus";

export type Stage = "title" | "ready" | "duel" | "cut" | "result";

export type Beat = "hush" | "fake" | "signal" | "cut" | "calm" | null;

export interface Verdict {
  call: Call;
  mode: Mode;
  rung: number;
  left: number | null;
  right: number | null;
}

export type Ending =
  | { mode: "solo"; result: Result; fastest: boolean; furthest: boolean }
  | { mode: "challenge"; verdict: Verdict; fastest: boolean };

interface Listeners {
  stage: (stage: Stage) => void;
  mode: (mode: Mode) => void;
  rung: (rung: number) => void;
  tally: (tally: Record<Side, number>) => void;
  verdict: (verdict: Verdict | null) => void;
  beat: (beat: Beat) => void;
  interrupted: () => void;
  over: (ending: Ending) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

type Scene = Omit<Frame, "raise" | "slide">;

interface Duel {
  plan: Plan;
  startedAt: number;
  drawnAt: number | null;
  signalAt: number | null;
  taps: Tap[];
  call: Call | null;
  calledAt: number;
  heard: Set<Fake>;
  hushed: boolean;
}

const INTRO = 1300;
const HOLD = 950;
export const DEMO_REACTION = 262;
const DEMO = { cue: 700, hold: 2600, intro: 900, wait: 3800 };
const DEMO_LENGTH = DEMO.intro + DEMO.wait + DEMO_REACTION + DEMO.hold;

const random = () =>
  (crypto.getRandomValues(new Uint32Array(1))[0] ?? 0) / 2 ** 32;

const block = (event: Event) => {
  event.preventDefault();
};

export const startSession = (
  canvas: HTMLCanvasElement,
  challenge: Challenge | null,
  on: Listeners
) => {
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const framed = challenge === null ? 0 : 0.08;
  const render = createRenderer(canvas, calm);
  const sound = createSound();
  let save = loadSave();
  let settings = loadSettings();
  let stage: Stage = "title";
  let mode: Mode = "solo";
  let rung = 0;
  let reactions: number[] = [];
  let tally: Record<Side, number> = { left: 0, right: 0 };
  let fastest = false;
  let duel: Duel | null = null;
  let clash: Clash | null = null;
  let held: Frame["cue"] = null;
  let paused = false;
  let played = 0;
  let beat: Beat = null;
  let demoAt = performance.now();
  let demos = 0;
  let last = demoAt;
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

  const tell = (next: Beat) => {
    if (next !== beat) {
      beat = next;
      on.beat(next);
    }
  };

  const takeSeconds = () => {
    const seconds = played;
    played = 0;
    return seconds;
  };

  const planFor = () => {
    if (mode === "versus") {
      return planDuel(random, null, VERSUS_FAKES);
    }
    if (mode === "challenge" && challenge !== null) {
      return planDuel(random, challenge.best, CHALLENGE_FAKES);
    }
    const current = ladder[rung];
    return planDuel(random, rivalOf(current, random), current.fakes);
  };

  const engage = () => {
    if (stage !== "ready" && stage !== "title" && stage !== "result") {
      return;
    }
    sound.unlock();
    sound.still();
    sound.drum();
    duel = {
      call: null,
      calledAt: 0,
      drawnAt: null,
      heard: new Set(),
      hushed: false,
      plan: planFor(),
      signalAt: null,
      startedAt: performance.now() + INTRO,
      taps: [],
    };
    clash = null;
    held = null;
    on.verdict(null);
    enter("duel");
  };

  const start = (next: Mode) => {
    mode = next;
    rung = 0;
    reactions = [];
    fastest = false;
    tally = { left: 0, right: 0 };
    played = 0;
    tell(null);
    on.mode(next);
    on.rung(0);
    on.tally(tally);
    engage();
  };

  const finish = (end: Result["end"]) => {
    const result = resultOf(rung, reactions, end);
    const run = settleRun(save, rung);
    keep(run.save);
    if (end === "clear") {
      sound.clear();
      navigator.vibrate?.([20, 60, 30, 60, 60]);
    }
    enter("result");
    on.over({ fastest, furthest: run.record, mode: "solo", result });
  };

  const conclude = (current: Duel, call: Call) => {
    const { plan, startedAt, signalAt, taps } = current;
    const reaction = (side: Side) =>
      call.kind === "draw" || (call.kind === "cut" && call.side === side)
        ? call.reaction
        : reactionOf(taps, side, startedAt, signalAt);
    const left = reaction("left");
    let right = call.kind === "early" ? null : plan.rival;
    if (mode === "versus" || call.kind === "draw") {
      right = reaction("right");
    }
    const verdict: Verdict = { call, left, mode, right, rung };
    duel = null;

    if (mode === "versus") {
      if (call.kind === "cut") {
        tally = { ...tally, [call.side]: tally[call.side] + 1 };
      }
      if (call.kind === "early") {
        const winner = other(call.side);
        tally = { ...tally, [winner]: tally[winner] + 1 };
      }
      if (call.kind === "cut" || call.kind === "early") {
        keep(settleVersus(save, Date.now(), takeSeconds()));
      }
      on.tally(tally);
      on.verdict(verdict);
      enter("ready");
      return;
    }

    const settled = settleDuel(save, {
      at: Date.now(),
      call,
      reaction: left,
      seconds: takeSeconds(),
    });
    keep(settled.save);
    fastest ||= settled.record;
    if (left !== null) {
      reactions.push(left);
    }
    if (mode === "challenge") {
      enter("result");
      on.over({ fastest, mode: "challenge", verdict });
      return;
    }
    if (call.kind === "draw") {
      on.verdict(verdict);
      enter("ready");
      return;
    }
    if (call.kind === "cut" && call.side === "left") {
      rung += 1;
      if (rung === ladder.length) {
        finish("clear");
        return;
      }
      on.rung(rung);
      on.verdict(verdict);
      enter("ready");
      return;
    }
    finish(call.kind === "early" ? (call.fake ?? "early") : "slow");
  };

  const strike = (current: Duel, call: Call, now: number) => {
    current.call = call;
    current.calledAt = now;
    sound.still();
    if (call.kind === "early") {
      clash = { at: now, kind: "early", side: call.side };
      const cue = current.plan.cues.find((each) => each.kind === call.fake);
      held =
        cue === undefined
          ? null
          : {
              held: true,
              kind: cue.kind,
              t: Math.max(
                0.3,
                Math.min(0.7, (now - current.startedAt - cue.at) / cue.length)
              ),
            };
      sound.early();
      navigator.vibrate?.(70);
    } else if (call.kind === "cut" || call.kind === "draw") {
      clash =
        call.kind === "cut"
          ? { at: now, kind: "cut", side: call.side }
          : { at: now, kind: "draw" };
      sound.strike();
      if (call.kind === "cut") {
        sound.cut();
      }
      const won =
        mode === "versus" || (call.kind === "cut" && call.side === "left");
      navigator.vibrate?.(won ? 18 : [30, 50, 60]);
    }
    enter("cut");
  };

  const advance = (current: Duel, now: number) => {
    if (current.drawnAt !== null && current.signalAt === null) {
      current.signalAt = now;
    }
    if (current.call !== null) {
      if (now - current.calledAt >= HOLD) {
        conclude(current, current.call);
      }
      return;
    }
    if (!current.hushed && now >= current.startedAt) {
      current.hushed = true;
      sound.silence();
    }
    for (const cue of current.plan.cues) {
      if (!current.heard.has(cue.kind) && now >= current.startedAt + cue.at) {
        current.heard.add(cue.kind);
        sound.fake(cue.kind);
      }
    }
    if (
      current.drawnAt === null &&
      now >= current.startedAt + current.plan.wait
    ) {
      current.drawnAt = now;
    }
    const call = decide({
      now,
      plan: current.plan,
      signalAt: current.signalAt,
      startedAt: current.startedAt,
      taps: current.taps,
    });
    if (call !== null) {
      strike(current, call, now);
    }
  };

  const demoFrame = (now: number): Scene => {
    const colours = tints.duel;
    if (calm) {
      tell("calm");
      return { clash: null, colours, cue: null, now, signal: true };
    }
    let t = now - demoAt;
    if (t > DEMO_LENGTH) {
      demoAt = now;
      demos += 1;
      t = 0;
    }
    const kind = fakes[demos % fakes.length];
    const plan: Plan = {
      cues: [{ at: DEMO.cue, kind, length: fakeLength[kind] }],
      rival: null,
      wait: DEMO.wait,
    };
    const startedAt = demoAt + DEMO.intro;
    const signalAt = startedAt + DEMO.wait;
    const cutAt = signalAt + DEMO_REACTION;
    const cue = cueAt(plan, startedAt, now);
    if (now >= cutAt) {
      tell("cut");
    } else if (now >= signalAt) {
      tell("signal");
    } else if (cue === null) {
      tell(now >= startedAt ? "hush" : null);
    } else {
      tell("fake");
    }
    return {
      clash: now >= cutAt ? { at: cutAt, kind: "cut", side: "left" } : null,
      colours,
      cue: cue === null ? null : { ...cue, held: false },
      now,
      signal: now >= signalAt,
    };
  };

  const duelFrame = (now: number): Scene => {
    const colours = mode === "versus" ? tints.versus : tints.duel;
    if (duel === null || duel.call !== null) {
      return {
        clash,
        colours,
        cue: held,
        now,
        signal: duel !== null && duel.drawnAt !== null,
      };
    }
    const live = cueAt(duel.plan, duel.startedAt, now);
    return {
      clash,
      colours,
      cue: live === null ? null : { ...live, held: false },
      now,
      signal: duel.drawnAt !== null,
    };
  };

  const push = (side: Side, at: number) => {
    if (
      duel === null ||
      (stage !== "duel" && stage !== "cut") ||
      at < duel.startedAt ||
      duel.taps.some((tap) => tap.side === side)
    ) {
      return;
    }
    duel.taps.push({ at, side });
  };

  const down = (event: PointerEvent) => {
    if (
      paused ||
      (stage !== "duel" && stage !== "cut") ||
      (event.pointerType === "mouse" && event.button !== 0)
    ) {
      return;
    }
    event.preventDefault();
    push(
      mode === "versus" ? render.side(event.clientX, event.clientY) : "left",
      event.timeStamp
    );
  };

  const keySide = (event: KeyboardEvent): Side | null => {
    if (mode === "versus") {
      if (event.code === "KeyF") {
        return "left";
      }
      return event.code === "KeyJ" ? "right" : null;
    }
    return event.key === " " || event.code === "Space" ? "left" : null;
  };

  const keyDown = (event: KeyboardEvent) => {
    if (
      (stage !== "duel" && stage !== "cut") ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey
    ) {
      return;
    }
    const side = keySide(event);
    if (side === null) {
      return;
    }
    event.preventDefault();
    if (!event.repeat) {
      push(side, event.timeStamp);
    }
  };

  const keyUp = (event: KeyboardEvent) => {
    if ((stage === "duel" || stage === "cut") && keySide(event) !== null) {
      event.preventDefault();
    }
  };

  const abandon = () => {
    if (
      mode === "solo" &&
      rung > 0 &&
      stage !== "title" &&
      stage !== "result"
    ) {
      keep(settleRun(save, rung).save);
      rung = 0;
    }
  };

  const interrupt = () => {
    if (stage !== "duel" || duel === null || duel.call !== null) {
      return;
    }
    duel = null;
    clash = null;
    held = null;
    sound.still();
    enter("ready");
    on.interrupted();
  };

  const hide = () => {
    if (document.visibilityState === "hidden") {
      interrupt();
    }
  };

  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("contextmenu", block);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", interrupt);
  screen.orientation?.addEventListener("change", interrupt);
  document.addEventListener("visibilitychange", hide);

  const raiseFor = () => {
    if (stage === "result") {
      return 1;
    }
    return stage === "title" ? framed : 0;
  };

  let frame = 0;
  const tick = (now: number) => {
    const dt = Math.min(100, Math.max(0, now - last));
    last = now;
    if (!paused) {
      if (stage === "ready" || stage === "duel" || stage === "cut") {
        played += dt / 1000;
      }
      if (duel !== null) {
        advance(duel, now);
      }
      render.draw({
        ...(stage === "title" ? demoFrame(now) : duelFrame(now)),
        raise: raiseFor(),
        slide: stage === "result" ? 1 : 0,
      });
    }
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    engage,
    pause: (value: boolean) => {
      paused = value;
      if (value) {
        sound.silence();
      } else {
        sound.still();
      }
    },
    settings: (next: Settings) => {
      settings = next;
      storeSettings(settings);
      sound.mute(settings.muted);
      on.settings(settings);
    },
    start,
    stop: () => {
      abandon();
      cancelAnimationFrame(frame);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("contextmenu", block);
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", interrupt);
      screen.orientation?.removeEventListener("change", interrupt);
      document.removeEventListener("visibilitychange", hide);
      sound.close();
    },
    title: () => {
      abandon();
      duel = null;
      clash = null;
      held = null;
      demoAt = performance.now();
      enter("title");
    },
  };
};
