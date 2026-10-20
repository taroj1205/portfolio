import { copy } from "./copy";
import { traitsOf } from "./cosmetics";
import type { Item, Part } from "./cosmetics";
import { listenFlick, tiltAt } from "./flick";
import { guessLang } from "./i18n";
import type { Text } from "./i18n";
import { createRenderer } from "./render";
import { resultOf } from "./result";
import type { Result } from "./result";
import {
  loadSave,
  respec,
  seen,
  settle,
  storeSave,
  tune,
  wear,
  wearCombo,
} from "./save";
import type { Save, Settings } from "./save";
import {
  createRiver,
  land,
  launch,
  nextContact,
  stoneAt,
  zoneIndex,
  zones,
} from "./simulate";
import type { Ending, Event, Flight, Gear, Grade, Splash } from "./simulate";
import { createSound } from "./sound";

export type Phase = "ready" | "aiming" | "flying" | "done";

export interface Beat {
  id: number;
  skips: number;
  combo: number;
  grade: Grade | null;
  event: Event | null;
}

export interface Landing {
  result: Result;
  record: boolean;
  gained: number;
  climbed: number;
  combo: number;
  unlocked: Item[];
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
  distance: (meters: number) => void;
  land: (landing: Landing) => void;
  save: (save: Save) => void;
}

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
  on: Listeners
) => {
  const canvas = surfaces.scene;
  const draw = createRenderer(surfaces);
  const sound = createSound();
  let save = loadSave();
  let river = createRiver(newSeed());
  let flight: Flight | null = null;
  let time = 0;
  let last = performance.now();
  let tap: number | null = null;
  let heard = 0;
  let skips = 0;
  let ended = false;
  let reached = 0;
  let aimFrom: number | null = null;
  let mode: Phase = "ready";
  sound.mute(save.settings.muted);
  on.save(save);

  const enter = (next: Phase) => {
    mode = next;
    on.phase(next);
  };

  const keep = (next: Save) => {
    save = next;
    storeSave(save);
    on.save(save);
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
      flight = launch(river, input, save.gear, traitsOf(save.look));
      time = 0;
      tap = null;
      heard = 0;
      skips = 0;
      ended = false;
      reached = 0;
      on.release({ quality: flight.quality, tilt: input.tilt });
      enter("flying");
    },
    start: () => {
      if (mode === "flying") {
        tap ??= time;
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
    if (splash.grade !== null) {
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
    keep(settled.save);
    if (settled.climbed > 0 || settled.unlocked.length > 0) {
      sound.fanfare();
    } else {
      sound.reward();
    }
    on.land({
      combo: done.bestCombo,
      gained: settled.gained,
      climbed: settled.climbed,
      unlocked: settled.unlocked,
      record: settled.record,
      result: resultOf(done, save.look),
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
      surface: copy[save.settings.lang ?? guessLang()].surface,
    });
    frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);

  return {
    again: () => {
      river = createRiver(newSeed());
      flight = null;
      time = 0;
      enter("ready");
    },
    wear: (part: Part, id: string) => {
      const next = wear(save, part, id);
      if (next) {
        keep(next);
      }
    },
    wearCombo: (id: string) => {
      const next = wearCombo(save, id);
      if (next) {
        keep(next);
      }
    },
    tune: (key: keyof Gear, step: 1 | -1) => {
      const next = tune(save, key, step);
      if (next) {
        keep(next);
      }
    },
    respec: () => {
      keep(respec(save));
    },
    seen: () => {
      const next = seen(save);
      if (next) {
        keep(next);
      }
    },
    settings: (next: Settings) => {
      sound.mute(next.muted);
      keep({ ...save, settings: next });
    },
    stop: () => {
      cancelAnimationFrame(frame);
      stopFlick();
      sound.close();
    },
  };
};
