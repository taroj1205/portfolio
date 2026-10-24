import { guessLang } from "../../_lib/i18n";
import type { Text } from "../../_lib/i18n";
import { loadSettings, storeSettings } from "../../_lib/settings";
import type { Settings } from "../../_lib/settings";
import { copy } from "./copy";
import type { Part } from "./cosmetics";
import { listenFlick, tiltAt } from "./flick";
import { earn, noGear, spend, traitsOf as journeyTraits } from "./journey";
import type { Gear, Item } from "./journey";
import { createRenderer } from "./render";
import { resultOf } from "./result";
import type { Result } from "./result";
import {
  loadProfiles,
  seen,
  settle,
  storeProfiles,
  viewOf,
  wear,
  wearCombo,
  withView,
} from "./save";
import type { Mode, Save } from "./save";
import {
  createRiver,
  isBounce,
  isLate,
  land,
  launch,
  nextContact,
  ringTipDue,
  speedAt,
  stoneAt,
  topSpeed,
  zoneIndex,
  zones,
} from "./simulate";
import type { Ending, Event, Flight, Grade, Splash } from "./simulate";
import { createSound } from "./sound";
import { flatTuning, traitsOf as duelTraits, tune } from "./tuning";
import type { Axis } from "./tuning";

export type Phase = "ready" | "aiming" | "flying" | "done";

export interface Beat {
  id: number;
  skips: number;
  combo: number;
  grade: Grade | null;
  event: Event | null;
}

interface Gain {
  gained: number;
  climbed: number;
  unlocked: Item[];
}

export interface Landing {
  result: Result;
  record: boolean;
  combo: number;
  topSpeed: number;
  gain: Gain | null;
  ringTip: boolean;
}

export interface Release {
  tilt: number;
  quality: number;
}

interface Listeners {
  phase: (phase: Phase) => void;
  release: (release: Release) => void;
  zone: (name: Text) => void;
  beat: (beat: Beat) => void;
  end: (ending: Ending) => void;
  late: () => void;
  distance: (meters: number) => void;
  speed: (metersPerSecond: number) => void;
  land: (landing: Landing) => void;
  save: (save: Save) => void;
  settings: (settings: Settings) => void;
}

const traitsFor = (save: Save) =>
  save.mode === "duel"
    ? duelTraits(save.tuning)
    : journeyTraits(save.gear, save.look);

const REVEAL = 1.2;
const SLOW = 0.3;

const newSeed = () => crypto.getRandomValues(new Uint32Array(1))[0] ?? 1;

const rateAt = (flight: Flight, time: number) => {
  const first = flight.hops.at(0);
  const opening = first !== undefined && time < Math.min(0.3, first.end - 0.15);

  return flight.quality === 100 && opening ? SLOW : 1;
};

export const startSession = (
  surfaces: { scene: HTMLCanvasElement; water: HTMLCanvasElement },
  on: Listeners,
  challenged: boolean
) => {
  const canvas = surfaces.scene;
  const draw = createRenderer(surfaces);
  const sound = createSound();
  let all = loadProfiles();

  if (challenged && all.mode !== "duel") {
    all = { ...all, mode: "duel" };
    storeProfiles(all);
  }

  let save = viewOf(all);
  let settings = loadSettings();
  let river = createRiver(newSeed());
  let flight: Flight | null = null;
  let time = 0;
  let last = performance.now();
  let tap: number | null = null;
  let landedAt = Number.NEGATIVE_INFINITY;
  let heard = 0;
  let skips = 0;
  let ended = false;
  let reached = 0;
  let aimFrom: number | null = null;
  let mode: Phase = "ready";
  sound.mute(settings.muted);
  on.save(save);
  on.settings(settings);

  const enter = (next: Phase) => {
    mode = next;
    on.phase(next);
  };

  const keep = (next: Save) => {
    save = next;
    all = withView(all, next);
    storeProfiles(all);
    on.save(save);
  };

  const reset = () => {
    river = createRiver(newSeed());
    flight = null;
    time = 0;
    on.speed(0);
    enter("ready");
  };

  const stopFlick = listenFlick(canvas, {
    release: (input) => {
      sound.unlock();

      if (mode !== "aiming") {
        return;
      }

      aimFrom = null;

      if (input === null) {
        enter("ready");

        return;
      }

      flight = launch(river, input, traitsFor(save));
      time = 0;
      tap = null;
      landedAt = Number.NEGATIVE_INFINITY;
      heard = 0;
      skips = 0;
      ended = false;
      reached = 0;
      on.release({ quality: flight.quality, tilt: input.tilt });
      enter("flying");
    },
    start: () => {
      if (mode === "flying") {
        if (flight === null) {
          return;
        }

        if (isLate(flight, landedAt, time)) {
          on.late();
        } else {
          tap ??= time;
        }

        return;
      }

      if (mode !== "ready") {
        return;
      }

      sound.unlock();
      aimFrom = performance.now();
      enter("aiming");
    },
  });

  const play = (splash: Splash) => {
    if (splash.big) {
      sound.splash(skips, null);

      return;
    }

    if (splash.grade !== null && !isBounce(splash.event)) {
      skips += 1;
      sound.splash(skips, splash.grade);
    }

    if (splash.event !== null) {
      sound.event(splash.event);
    }

    if (splash.grade === "perfect" || splash.event !== null) {
      navigator.vibrate?.(splash.event === null ? 12 : 30);
    }

    on.beat({
      event: splash.event,
      combo: splash.combo,
      grade: splash.grade,
      id: heard,
      skips,
    });
  };

  const finish = (done: Flight) => {
    const settled = settle(save, done);
    let next: Save = settled.save;
    let gain: Gain | null = null;

    if (save.mode === "journey" && settled.save.mode === "journey") {
      const earned = earn(save, settled.save, done);
      next = earned.save;
      gain = {
        climbed: earned.climbed,
        gained: earned.gained,
        unlocked: earned.unlocked,
      };
    }

    keep(next);

    if (
      settled.record ||
      (gain !== null && (gain.climbed > 0 || gain.unlocked.length > 0))
    ) {
      sound.fanfare();
    } else {
      sound.reward();
    }

    const top = topSpeed(done);
    const ringTip = ringTipDue(settings.distantRing, settings.ringTipSeen, top);

    if (ringTip) {
      settings = { ...settings, ringTipSeen: true };
      storeSettings(settings);
      on.settings(settings);
    }

    on.land({
      combo: done.bestCombo,
      gain,
      record: settled.record,
      result: resultOf(done, save),
      ringTip,
      topSpeed: top,
    });
    enter("done");
  };

  const advance = (current: Flight, dt: number) => {
    time += dt * rateAt(current, time);

    for (
      let contact = nextContact(current);
      contact !== null && contact <= time;
      contact = nextContact(current)
    ) {
      land(current, tap);
      landedAt = contact;
      tap = null;
    }

    for (
      let next = current.splashes[heard];
      next !== undefined && next.time <= time;
      next = current.splashes[heard]
    ) {
      play(next);
      heard += 1;
    }

    if (current.ending !== null && !ended && time >= current.duration) {
      ended = true;

      if (current.ending === "leaf") {
        sound.leaf();
      }

      on.end(current.ending);
    }

    const z = Math.max(0, stoneAt(current, time)?.z ?? current.distance);
    on.distance(z);
    on.speed(
      current.ending !== null && time >= current.duration
        ? 0
        : speedAt(current, time)
    );
    const zone = zoneIndex(z);

    if (zone > reached) {
      reached = zone;
      on.zone(zones[zone]?.name ?? { en: "", ja: "" });
    }

    if (
      mode === "flying" &&
      current.ending !== null &&
      time > current.duration + REVEAL
    ) {
      finish(current);
    }
  };

  let frame = 0;

  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (flight) {
      advance(flight, dt);
    }

    draw({
      clock: now / 1000,
      river,
      shot: flight,
      tilt: aimFrom === null ? null : tiltAt((now - aimFrom) / 1000),
      time,
      look: save.look,
      surface: copy[settings.lang ?? guessLang()].surface,
      distantRing: settings.distantRing,
    });
    frame = requestAnimationFrame(tick);
  };

  frame = requestAnimationFrame(tick);

  return {
    again: reset,
    wear: (part: Part, id: string) => {
      const next = wear(save, part, id);

      if (next) {
        keep(next);
      }
    },
    wearCombo: (id: string) => {
      const next = save.mode === "journey" ? wearCombo(save, id) : null;

      if (next) {
        keep(next);
      }
    },
    tune: (key: Axis, step: 1 | -1) => {
      if (save.mode !== "duel") {
        return;
      }

      const tuning = tune(save.tuning, key, step);

      if (tuning) {
        keep({ ...save, tuning });
      }
    },
    train: (key: keyof Gear, step: 1 | -1) => {
      if (save.mode !== "journey") {
        return;
      }

      const gear = spend(save, key, step);

      if (gear) {
        keep({ ...save, gear });
      }
    },
    respec: () => {
      keep(
        save.mode === "duel"
          ? { ...save, tuning: flatTuning }
          : { ...save, gear: noGear }
      );
    },
    seen: () => {
      const next = save.mode === "journey" ? seen(save) : null;

      if (next) {
        keep(next);
      }
    },
    switchMode: (next: Mode) => {
      if (next === all.mode) {
        return;
      }

      all = { ...all, mode: next };
      save = viewOf(all);
      storeProfiles(all);
      on.save(save);
      reset();
    },
    settings: (next: Settings) => {
      settings = next;
      storeSettings(settings);
      sound.mute(settings.muted);
      on.settings(settings);
    },
    stop: () => {
      cancelAnimationFrame(frame);
      stopFlick();
      sound.close();
    },
  };
};
