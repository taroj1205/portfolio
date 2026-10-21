export interface Point {
  x: number;
  y: number;
}

export interface Line {
  nx: number;
  ny: number;
  d: number;
}

export const signedArea = (points: readonly Point[]) => {
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
};

export const areaOf = (points: readonly Point[]) =>
  Math.abs(signedArea(points));

export const centroidOf = (points: readonly Point[]): Point => {
  let cx = 0;
  let cy = 0;
  let twice = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const cross = a.x * b.y - b.x * a.y;
    twice += cross;
    cx += (a.x + b.x) * cross;
    cy += (a.y + b.y) * cross;
  }
  return twice === 0
    ? { x: 0, y: 0 }
    : { x: cx / (3 * twice), y: cy / (3 * twice) };
};

const sideOf = (line: Line, p: Point) => p.x * line.nx + p.y * line.ny - line.d;

const crossing = (a: Point, b: Point, da: number, db: number): Point => {
  const t = da / (da - db);
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
};

export const clip = (points: readonly Point[], line: Line) => {
  const kept: Point[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const da = sideOf(line, a);
    const db = sideOf(line, b);
    if (da >= 0) {
      kept.push(a);
    }
    if (da >= 0 !== db >= 0) {
      kept.push(crossing(a, b, da, db));
    }
  }
  return kept;
};

export const flip = (line: Line): Line => ({
  d: -line.d,
  nx: -line.nx,
  ny: -line.ny,
});

export const along = (line: Line, p: Point) => p.y * line.nx - p.x * line.ny;

export const pointOn = (line: Line, t: number): Point => ({
  x: line.nx * line.d - line.ny * t,
  y: line.ny * line.d + line.nx * t,
});

export const spansOf = (points: readonly Point[], line: Line) => {
  const hits: number[] = [];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const da = sideOf(line, a);
    const db = sideOf(line, b);
    if (da >= 0 !== db >= 0) {
      hits.push(along(line, crossing(a, b, da, db)));
    }
  }
  hits.sort((p, q) => p - q);
  const spans: [number, number][] = [];
  for (let i = 0; i + 1 < hits.length; i += 2) {
    spans.push([hits[i], hits[i + 1]]);
  }
  return spans;
};

export const onLine = (line: Line, p: Point) =>
  Math.abs(sideOf(line, p)) < 1e-9;

export const lineThrough = (a: Point, b: Point): Line | null => {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length === 0) {
    return null;
  }
  const nx = (b.y - a.y) / length;
  const ny = -(b.x - a.x) / length;
  return { d: a.x * nx + a.y * ny, nx, ny };
};
