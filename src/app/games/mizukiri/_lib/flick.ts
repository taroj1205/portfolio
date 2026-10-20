import type { ThrowInput } from "./simulate";

const SWING = 1.6;
const WINDOW = 100;
const KEYS = new Set(["Space", "Enter"]);

export const tiltAt = (held: number) =>
  20 + 22 * Math.cos((2 * Math.PI * held) / SWING);

interface Handlers {
  start: () => void;
  release: (input: ThrowInput | null) => void;
}

interface Point {
  x: number;
  y: number;
  t: number;
}

const ignored = (event: KeyboardEvent) =>
  !KEYS.has(event.code) ||
  (event.target instanceof Element &&
    event.target.closest("a, button") !== null);

export const listenFlick = (
  target: HTMLElement,
  { start, release }: Handlers
) => {
  let hold: { since: number; byKey: boolean } | null = null;
  let trail: Point[] = [];

  const begin = (since: number, byKey: boolean) => {
    hold = { byKey, since };
    start();
  };

  const letGo = (at: number) => {
    const held = hold ? (at - hold.since) / 1000 : 0;
    hold = null;
    return held;
  };

  const recent = (now: number) =>
    trail.filter((point) => now - point.t <= WINDOW);

  const down = (event: PointerEvent) => {
    if (hold || !event.isPrimary) {
      return;
    }
    target.setPointerCapture(event.pointerId);
    trail = [{ t: event.timeStamp, x: event.clientX, y: event.clientY }];
    begin(event.timeStamp, false);
  };

  const move = (event: PointerEvent) => {
    if (!hold || hold.byKey) {
      return;
    }
    trail.push({ t: event.timeStamp, x: event.clientX, y: event.clientY });
    trail = recent(event.timeStamp);
  };

  const up = (event: PointerEvent) => {
    if (!hold || hold.byKey) {
      return;
    }
    const held = letGo(event.timeStamp);
    const [first] = recent(event.timeStamp);
    if (first === undefined) {
      release(null);
      return;
    }
    const seconds = Math.max((event.timeStamp - first.t) / 1000, 1 / 60);
    const rise = (first.y - event.clientY) / target.clientHeight / seconds;
    const aim = Math.atan2(event.clientX - first.x, first.y - event.clientY);
    release(
      rise < 0.6
        ? null
        : {
            aim: Math.max(-0.18, Math.min(0.18, aim * 0.5)),
            speed: Math.min(16, 4 + rise * 2.6),
            tilt: tiltAt(held),
          }
    );
  };

  const cancel = () => {
    if (hold && !hold.byKey) {
      hold = null;
      release(null);
    }
  };

  const keyDown = (event: KeyboardEvent) => {
    if (ignored(event) || event.repeat || hold) {
      return;
    }
    event.preventDefault();
    begin(event.timeStamp, true);
  };

  const keyUp = (event: KeyboardEvent) => {
    if (ignored(event) || hold?.byKey !== true) {
      return;
    }
    release({ aim: 0, speed: 12.5, tilt: tiltAt(letGo(event.timeStamp)) });
  };

  target.addEventListener("pointerdown", down);
  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", up);
  target.addEventListener("pointercancel", cancel);
  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  return () => {
    target.removeEventListener("pointerdown", down);
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", up);
    target.removeEventListener("pointercancel", cancel);
    window.removeEventListener("keydown", keyDown);
    window.removeEventListener("keyup", keyUp);
  };
};
