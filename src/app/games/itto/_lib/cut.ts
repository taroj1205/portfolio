import {
  along,
  areaOf,
  centreOf,
  clip,
  flip,
  lineThrough,
  onLine,
  pointOn,
  spansOf,
} from "./geometry";
import type { Line, Point } from "./geometry";

export type Parts = readonly (readonly Point[])[];

export interface Cut {
  angle: number;
  offset: number;
}

export interface Face {
  part: number;
  from: Point;
  to: Point;
}

export interface Chunk {
  part: number;
  points: Point[];
}

interface Side {
  chunks: Chunk[];
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
const GAP = 0.09;

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

export const areaOfParts = (parts: Parts) =>
  parts.reduce((sum, points) => sum + areaOf(points), 0);

const facesOf = (parts: Parts, line: Line): Face[] =>
  parts
    .flatMap((points, part) =>
      spansOf(points, line).map(([from, to]) => ({ from, part, to }))
    )
    .toSorted((a, b) => a.from - b.from)
    .map(({ from, part, to }) => ({
      from: pointOn(line, from),
      part,
      to: pointOn(line, to),
    }));

const stretchOf = (parts: Parts, line: Line) => {
  let first = Infinity;
  let last = -Infinity;

  for (const points of parts) {
    for (const [enter, leave] of spansOf(points, line)) {
      first = Math.min(first, enter);
      last = Math.max(last, leave);
    }
  }

  return first <= last ? { first, last } : null;
};

export const judgeSwipe = (parts: Parts, from: Point, to: Point): Swipe => {
  const line = lineThrough(from, to);

  if (line === null || Math.hypot(to.x - from.x, to.y - from.y) < TAP) {
    return { kind: "tap" };
  }

  const stretch = stretchOf(parts, line);

  if (stretch === null) {
    return { kind: "miss" };
  }

  const start = along(line, from) - SLACK;
  const end = along(line, to) + SLACK;

  if (stretch.first >= start && stretch.last <= end) {
    return { cut: cutOf(line), kind: "cut" };
  }

  const touched = parts.some((points) =>
    spansOf(points, line).some(([enter, leave]) => enter < end && leave > start)
  );

  return touched ? { kind: "partial" } : { kind: "miss" };
};

const chunksOf = (parts: Parts, line: Line) =>
  parts.flatMap((points, part) => {
    const kept = clip(points, line);

    return areaOf(kept) > 1e-9 ? [{ part, points: kept }] : [];
  });

const sideOf = (parts: Parts, line: Line, share: number): Side => {
  const chunks = chunksOf(parts, line);

  return {
    centre: centreOf(chunks.map((chunk) => chunk.points)),
    chunks,
    push: { x: line.nx * GAP, y: line.ny * GAP },
    share,
  };
};

const sharesOf = (parts: Parts, line: Line) => {
  let plus = 0;
  let minus = 0;

  for (const points of parts) {
    plus += areaOf(clip(points, line));
    minus += areaOf(clip(points, flip(line)));
  }

  return { minus, plus };
};

export const splitBy = (parts: Parts, cut: Cut): Split | null => {
  const line = lineOf(cut);

  if (stretchOf(parts, line) === null) {
    return null;
  }

  const { plus, minus } = sharesOf(parts, line);

  if (plus <= 0 || minus <= 0) {
    return null;
  }

  const share = Math.round((plus / (plus + minus)) * 1000);

  return {
    faces: facesOf(parts, line),
    line,
    sides: [
      sideOf(parts, line, share),
      sideOf(parts, flip(line), 1000 - share),
    ],
    small: Math.min(share, 1000 - share),
  };
};

export const errorOf = (small: number) => 500 - small;

export const isCutEdge = (line: Line, a: Point, b: Point) =>
  onLine(line, a) && onLine(line, b);

export const halving = (parts: Parts, angle: number) => {
  const { nx, ny } = lineOf({ angle, offset: 0 });
  const reach = parts.flat().map((p) => p.x * nx + p.y * ny);
  let low = Math.min(...reach);
  let high = Math.max(...reach);
  const total = areaOfParts(parts);

  for (let i = 0; i < 48; i += 1) {
    const d = (low + high) / 2;

    if (sharesOf(parts, { d, nx, ny }).plus > total / 2) {
      low = d;
    } else {
      high = d;
    }
  }

  return Math.round(((low + high) / 2) * OFFSET);
};

export const reachOf = (parts: Parts, cut: Cut) => {
  const line = lineOf(cut);
  const stretch = stretchOf(parts, line);
  const first = stretch?.first ?? -1.3;
  const last = stretch?.last ?? 1.3;

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
