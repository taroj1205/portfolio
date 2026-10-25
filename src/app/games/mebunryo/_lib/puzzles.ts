import { seeded } from "../../_lib/svg";
import type { Point } from "../../_lib/svg";

export const SIZE = 400;
const MARGIN = 28;
const ARM = 150;
const RAY = SIZE * 2;
const MAX_SEED = 2_147_483_646;

export const kinds = [
  "middle",
  "centre",
  "third",
  "right",
  "parallel",
  "square",
  "apex",
  "centroid",
  "wall",
  "length",
] as const;

export type Kind = (typeof kinds)[number];

export type Unit = "px" | "deg";

export interface Segment {
  from: Point;
  to: Point;
  tone?: "gold" | "guide";
}

interface Circle {
  centre: Point;
  radius: number;
}

export interface Puzzle {
  kind: Kind;
  unit: Unit;
  lines: Segment[];
  circles: Circle[];
  dots: Point[];
  pivot: Point | null;
  answers: Point[];
}

export interface Graded {
  error: number;
  answer: Point;
  points: number;
}

type Random = () => number;

const LIMIT: Record<Unit, number> = { deg: 15, px: 40 };

const add = (a: Point, b: Point): Point => ({ x: a.x + b.x, y: a.y + b.y });

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });

const scale = (a: Point, by: number): Point => ({ x: a.x * by, y: a.y * by });

const unitAt = (angle: number): Point => ({
  x: Math.cos(angle),
  y: Math.sin(angle),
});

const turn = (a: Point): Point => ({ x: -a.y, y: a.x });

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const between = (random: Random, low: number, high: number) =>
  low + random() * (high - low);

const ORIGIN: Point = { x: 0, y: 0 };

interface Draft {
  lines?: Segment[];
  circles?: Circle[];
  dots?: Point[];
  pivot?: Point;
  answers: Point[];
  extent?: Point[];
}

const extentOf = (draft: Draft) => [
  ...(draft.lines ?? []).flatMap((line) =>
    line.tone === "guide" ? [] : [line.from, line.to]
  ),
  ...(draft.circles ?? []).flatMap(({ centre, radius }) => [
    sub(centre, { x: radius, y: radius }),
    add(centre, { x: radius, y: radius }),
  ]),
  ...(draft.dots ?? []),
  ...(draft.extent ?? draft.answers),
];

const offsetAlong = (random: Random, low: number, high: number) => {
  const room = SIZE - 2 * MARGIN - (high - low);

  return room > 0 ? MARGIN - low + random() * room : (SIZE - high - low) / 2;
};

const place = (random: Random, kind: Kind, unit: Unit, draft: Draft) => {
  const points = extentOf(draft);
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);

  const shift = {
    x: offsetAlong(random, Math.min(...xs), Math.max(...xs)),
    y: offsetAlong(random, Math.min(...ys), Math.max(...ys)),
  };

  const move = (point: Point) => add(point, shift);

  return {
    answers: draft.answers.map(move),
    circles: (draft.circles ?? []).map((circle) => ({
      ...circle,
      centre: move(circle.centre),
    })),
    dots: (draft.dots ?? []).map(move),
    kind,
    lines: (draft.lines ?? []).map((line) => ({
      ...line,
      from: move(line.from),
      to: move(line.to),
    })),
    pivot: draft.pivot === undefined ? null : move(draft.pivot),
    unit,
  } satisfies Puzzle;
};

const middle = (random: Random): Draft => {
  const half = scale(
    unitAt(between(random, 0, Math.PI)),
    between(random, 90, 150)
  );

  const from = scale(half, -1);

  return { answers: [ORIGIN], dots: [from, half], lines: [{ from, to: half }] };
};

const centre = (random: Random): Draft => ({
  answers: [ORIGIN],
  circles: [{ centre: ORIGIN, radius: between(random, 60, 140) }],
});

const third = (random: Random): Draft => {
  const to = scale(
    unitAt(between(random, 0, 2 * Math.PI)),
    between(random, 200, 310)
  );

  return {
    answers: [scale(to, 1 / 3)],
    dots: [ORIGIN],
    lines: [{ from: ORIGIN, to }],
  };
};

const right = (random: Random): Draft => {
  const arm = scale(unitAt(between(random, 0, 2 * Math.PI)), ARM);
  const side = turn(arm);

  return {
    answers: [side, scale(side, -1)],
    dots: [ORIGIN],
    lines: [{ from: ORIGIN, to: arm }],
    pivot: ORIGIN,
  };
};

const parallel = (random: Random): Draft => {
  const along = unitAt(between(random, 0, Math.PI));
  const half = scale(along, 110);

  const pivot = add(
    scale(turn(along), between(random, 100, 150)),
    scale(along, between(random, -60, 60))
  );

  const reach = scale(along, 120);

  return {
    answers: [add(pivot, reach), sub(pivot, reach)],
    dots: [pivot],
    lines: [{ from: scale(half, -1), to: half }],
    pivot,
  };
};

const square = (random: Random): Draft => {
  const edge = scale(
    unitAt(between(random, 0, 2 * Math.PI)),
    between(random, 130, 190)
  );

  const other = turn(edge);

  return {
    answers: [add(edge, other)],
    dots: [edge, ORIGIN, other],
    lines: [
      { from: edge, to: ORIGIN },
      { from: ORIGIN, to: other },
    ],
  };
};

const apex = (random: Random): Draft => {
  const along = unitAt(between(random, 0, 2 * Math.PI));
  const half = scale(along, between(random, 75, 115));
  const top = scale(turn(half), Math.sqrt(3));
  const from = scale(half, -1);

  return {
    answers: [top, scale(top, -1)],
    dots: [from, half],
    extent: [top],
    lines: [{ from, to: half }],
  };
};

const centroid = (random: Random): Draft => {
  const start = between(random, 0, 2 * Math.PI);

  const corners = [0, 1, 2].map((i) =>
    scale(
      unitAt(start + (i * 2 * Math.PI) / 3 + between(random, -0.5, 0.5)),
      between(random, 90, 160)
    )
  );

  const [a, b, c] = corners;
  const middleOf = scale(add(add(a, b), c), 1 / 3);

  return {
    answers: [middleOf],
    lines: [
      { from: a, to: b },
      { from: b, to: c },
      { from: c, to: a },
    ],
  };
};

const wall = (random: Random): Draft => {
  const hit = { x: 0, y: between(random, -100, 100) };

  const start = {
    x: -between(random, 220, 260),
    y: between(random, -120, 120),
  };

  const toward = sub(hit, start);
  const reach = between(random, 70, 100) / Math.hypot(toward.x, toward.y);

  const { x: cos, y: sin } = unitAt(
    (Math.floor(random() * 4) * Math.PI) / 2 + between(random, -0.25, 0.25)
  );

  const rotate = (point: Point) => ({
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  });

  const edge = [
    { x: 0, y: -140 },
    { x: 0, y: 140 },
  ].map(rotate);

  const [top, bottom] = edge;
  const from = rotate(start);

  return {
    answers: [rotate(hit)],
    dots: [from],
    lines: [
      { from: top, to: bottom, tone: "gold" },
      { from, to: rotate(add(start, scale(toward, reach))) },
    ],
  };
};

const length = (random: Random): Draft => {
  const along = unitAt(between(random, 0, Math.PI));
  const size = between(random, 110, 170);
  const half = scale(along, size / 2);
  const start = scale(turn(along), between(random, 70, 110));

  const out = unitAt(
    Math.atan2(along.y, along.x) +
      (random() < 0.5 ? 1 : -1) * between(random, 0.9, 2.2)
  );

  const answer = add(start, scale(out, size));

  return {
    answers: [answer],
    dots: [start],
    extent: [answer, add(start, scale(out, size + 40))],
    lines: [
      { from: scale(half, -1), to: half, tone: "gold" },
      { from: start, to: add(start, scale(out, RAY)), tone: "guide" },
    ],
  };
};

const drafts: Record<Kind, (random: Random) => Draft> = {
  apex,
  centre,
  centroid,
  length,
  middle,
  parallel,
  right,
  square,
  third,
  wall,
};

const units: Record<Kind, Unit> = {
  apex: "px",
  centre: "px",
  centroid: "px",
  length: "px",
  middle: "px",
  parallel: "deg",
  right: "deg",
  square: "px",
  third: "px",
  wall: "px",
};

export const isSeed = (value: number) =>
  Number.isInteger(value) && value >= 1 && value <= MAX_SEED;

export const newSeed = (random: Random = Math.random) =>
  1 + Math.floor(random() * MAX_SEED);

export const puzzlesOf = (seed: number): Puzzle[] => {
  const random = seeded(seed);

  return kinds.map((kind) =>
    place(random, kind, units[kind], drafts[kind](random))
  );
};

const angleBetween = (a: Point, b: Point) => {
  const raw = Math.abs(Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));

  return (Math.min(raw, 2 * Math.PI - raw) * 180) / Math.PI;
};

const errorOf = (puzzle: Puzzle, guess: Point, answer: Point) =>
  puzzle.pivot === null
    ? distance(guess, answer)
    : angleBetween(sub(guess, puzzle.pivot), sub(answer, puzzle.pivot));

export const pointsOf = (error: number, unit: Unit) =>
  Math.max(0, Math.round(100 * (1 - error / LIMIT[unit])));

export const grade = (puzzle: Puzzle, guess: Point): Graded => {
  const [first, ...rest] = puzzle.answers;
  let answer = first;
  let error = errorOf(puzzle, guess, first);

  for (const other of rest) {
    const next = errorOf(puzzle, guess, other);

    if (next < error) {
      answer = other;
      error = next;
    }
  }

  return { answer, error, points: pointsOf(error, puzzle.unit) };
};

const MIN_REACH = 16;

export const canGuess = (puzzle: Puzzle, guess: Point) =>
  puzzle.pivot === null || distance(guess, puzzle.pivot) >= MIN_REACH;

export const rayEnd = (pivot: Point, through: Point) => {
  const toward = sub(through, pivot);
  const size = Math.hypot(toward.x, toward.y);

  return size === 0 ? pivot : add(pivot, scale(toward, RAY / size));
};

export const clampToBoard = (point: Point): Point => ({
  x: Math.min(SIZE, Math.max(0, point.x)),
  y: Math.min(SIZE, Math.max(0, point.y)),
});

export const totalOf = (marks: readonly number[]) =>
  marks.reduce((sum, mark) => sum + mark, 0);

export const ROUNDS = kinds.length;

export const PERFECT = 95;

export const errorText = (error: number, unit: Unit) =>
  unit === "px" ? `${error.toFixed(1)}px` : `${error.toFixed(1)}°`;
