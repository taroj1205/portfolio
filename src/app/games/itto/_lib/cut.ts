import {
  along,
  areaOf,
  centroidOf,
  clip,
  flip,
  lineThrough,
  onLine,
  pointOn,
  spansOf,
} from "./geometry";
import type { Line, Point } from "./geometry";

export interface Cut {
  angle: number;
  offset: number;
}

export interface Face {
  from: Point;
  to: Point;
}

interface Side {
  points: Point[];
  centre: Point;
  share: number;
  push: Point;
}

export interface Split {
  line: Line;
  sides: [Side, Side];
  faces: Face[];
  small: number;
}

export type Swipe =
  | { kind: "tap" }
  | { kind: "miss" }
  | { kind: "partial" }
  | { kind: "cut"; cut: Cut };

export const ANGLES = 18_000;
const OFFSET = 10_000;
export const REACH = 12_000;
const TAP = 0.08;
const SLACK = 0.06;

export const lineOf = (cut: Cut): Line => {
  const angle = (cut.angle / 100) * (Math.PI / 180);
  return { d: cut.offset / OFFSET, nx: Math.cos(angle), ny: Math.sin(angle) };
};

export const cutOf = (line: Line): Cut => {
  let degrees = (Math.atan2(line.ny, line.nx) * 180) / Math.PI;
  let { d } = line;
  if (degrees < 0) {
    degrees += 180;
    d = -d;
  }
  let angle = Math.round(degrees * 100);
  if (angle >= ANGLES) {
    angle -= ANGLES;
    d = -d;
  }
  return { angle, offset: Math.round(d * OFFSET) };
};

export const judgeSwipe = (
  outline: readonly Point[],
  from: Point,
  to: Point
): Swipe => {
  const line = lineThrough(from, to);
  if (line === null || Math.hypot(to.x - from.x, to.y - from.y) < TAP) {
    return { kind: "tap" };
  }
  const spans = spansOf(outline, line);
  const start = along(line, from) - SLACK;
  const end = along(line, to) + SLACK;
  const first = spans[0]?.[0];
  const last = spans.at(-1)?.[1];
  if (first === undefined || last === undefined) {
    return { kind: "miss" };
  }
  if (first >= start && last <= end) {
    return { cut: cutOf(line), kind: "cut" };
  }
  return spans.some(([enter, leave]) => enter < end && leave > start)
    ? { kind: "partial" }
    : { kind: "miss" };
};

const GAP = 0.09;

const sideOf = (outline: readonly Point[], line: Line, share: number): Side => {
  const points = clip(outline, line);
  return {
    centre: centroidOf(points),
    points,
    push: { x: line.nx * GAP, y: line.ny * GAP },
    share,
  };
};

export const splitBy = (outline: readonly Point[], cut: Cut): Split | null => {
  const line = lineOf(cut);
  const plus = areaOf(clip(outline, line));
  const minus = areaOf(clip(outline, flip(line)));
  if (plus <= 0 || minus <= 0) {
    return null;
  }
  const share = Math.round((plus / (plus + minus)) * 1000);
  return {
    faces: spansOf(outline, line).map(([from, to]) => ({
      from: pointOn(line, from),
      to: pointOn(line, to),
    })),
    line,
    sides: [
      sideOf(outline, line, share),
      sideOf(outline, flip(line), 1000 - share),
    ],
    small: Math.min(share, 1000 - share),
  };
};

export const errorOf = (small: number) => 500 - small;

export const isCutEdge = (line: Line, a: Point, b: Point) =>
  onLine(line, a) && onLine(line, b);

export const halving = (outline: readonly Point[], angle: number) => {
  const { nx, ny } = lineOf({ angle, offset: 0 });
  const reach = outline.map((p) => p.x * nx + p.y * ny);
  let low = Math.min(...reach);
  let high = Math.max(...reach);
  const total = areaOf(outline);
  for (let i = 0; i < 48; i += 1) {
    const d = (low + high) / 2;
    if (areaOf(clip(outline, { d, nx, ny })) > total / 2) {
      low = d;
    } else {
      high = d;
    }
  }
  return Math.round(((low + high) / 2) * OFFSET);
};

export const reachOf = (outline: readonly Point[], cut: Cut) => {
  const line = lineOf(cut);
  const spans = spansOf(outline, line);
  const first = spans[0]?.[0] ?? -1.3;
  const last = spans.at(-1)?.[1] ?? 1.3;
  return { from: pointOn(line, first - 0.3), to: pointOn(line, last + 0.3) };
};

const TURN = 200;
const NUDGE = 200;

export const steer = (aim: Cut, key: string, fine: boolean): Cut | null => {
  const step = fine ? 0.1 : 1;
  if (key === "ArrowLeft" || key === "ArrowRight") {
    const angle =
      aim.angle + Math.round((key === "ArrowLeft" ? -TURN : TURN) * step);
    if (angle < 0 || angle >= ANGLES) {
      return {
        angle: angle < 0 ? angle + ANGLES : angle - ANGLES,
        offset: 0 - aim.offset,
      };
    }
    return { angle, offset: aim.offset };
  }
  if (key === "ArrowUp" || key === "ArrowDown") {
    const nudge = Math.round((key === "ArrowUp" ? -NUDGE : NUDGE) * step);
    return {
      angle: aim.angle,
      offset: Math.max(-REACH, Math.min(REACH, aim.offset + nudge)),
    };
  }
  return null;
};
