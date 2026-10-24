export interface Point {
  x: number;
  y: number;
}

export interface Thread {
  from: Point;
  to: Point;
  ends: number;
  neck: number;
  bend: number;
  pinch: number;
}

const STEPS = 26;

export const pointAt = (
  { from, to, bend, pinch }: Thread,
  u: number
): Point => {
  const mid = (from.x + to.x) / 2;
  const c1x = from.x + (mid - from.x) * pinch;
  const c2x = to.x + (mid - to.x) * pinch;
  const v = 1 - u;
  return {
    x:
      v ** 3 * from.x +
      3 * v * v * u * c1x +
      3 * v * u * u * c2x +
      u ** 3 * to.x +
      bend * Math.sin(Math.PI * u),
    y: from.y + (to.y - from.y) * u,
  };
};

const footOf = (thread: Thread) => {
  const length = Math.hypot(
    thread.to.x - thread.from.x,
    thread.to.y - thread.from.y
  );
  return Math.max(
    0.03,
    Math.min(0.3, (thread.ends * 1.7) / Math.max(1, length))
  );
};

const widthAt = (thread: Thread, u: number, foot = footOf(thread)) => {
  const t = Math.min(1, Math.min(u, 1 - u) / foot);
  return (
    thread.ends +
    ((thread.neck - thread.ends) * (1 - Math.cos(Math.PI * t))) / 2
  );
};

const spacing = (steps: number) =>
  Array.from(
    { length: steps + 1 },
    (_, i) => (1 - Math.cos((Math.PI * i) / steps)) / 2
  );

export const ribbonOf = (thread: Thread, steps = STEPS): Point[] => {
  const foot = footOf(thread);
  const us = spacing(steps);
  const spine = us.map((u) => pointAt(thread, u));
  const left: Point[] = [];
  const right: Point[] = [];
  for (const [i, point] of spine.entries()) {
    const before = spine[Math.max(0, i - 1)] ?? point;
    const after = spine[Math.min(spine.length - 1, i + 1)] ?? point;
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    const half = widthAt(thread, us[i] ?? 0, foot) / 2;
    left.push({
      x: point.x - (dy / length) * half,
      y: point.y + (dx / length) * half,
    });
    right.push({
      x: point.x + (dy / length) * half,
      y: point.y - (dx / length) * half,
    });
  }
  return [...left, ...right.toReversed()];
};

export const pathOf = (points: readonly Point[]) =>
  `${points
    .map(
      (point, i) =>
        `${i === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    )
    .join("")}Z`;
