export interface Trace {
  x: number;
  y: number;
  w: number;
}

interface Frame {
  x: number;
  y: number;
  size: number;
}

export const MAX_POINTS = 96;
const WIDTH_RANGE = 0.25;
const TOLERANCE = 0.003;
const SMOOTHING = 2;
const LANES = [-0.8, -0.55, -0.3, -0.04, 0.24, 0.5, 0.76];
const DASHES = [0.11, 0.025, 0.05, 0.04, 0.18, 0.02, 0.07, 0.035];

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const gapTo = (p: Trace, a: Trace, b: Trace) => {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dw = b.w - a.w;
  const span = dx * dx + dy * dy + dw * dw;
  const t =
    span === 0
      ? 0
      : clamp01(
          ((p.x - a.x) * dx + (p.y - a.y) * dy + (p.w - a.w) * dw) / span
        );
  return Math.hypot(p.x - a.x - dx * t, p.y - a.y - dy * t, p.w - a.w - dw * t);
};

const reduce = (points: readonly Trace[], tolerance: number) => {
  const keep = new Set([0, points.length - 1]);
  const spans: [number, number][] = [[0, points.length - 1]];
  for (let span = spans.pop(); span; span = spans.pop()) {
    const [from, to] = span;
    const a = points[from];
    const b = points[to];
    let far = -1;
    let most = tolerance;
    for (let i = from + 1; i < to; i += 1) {
      const gap = gapTo(points[i], a, b);
      if (gap > most) {
        most = gap;
        far = i;
      }
    }
    if (far > 0) {
      keep.add(far);
      spans.push([from, far], [far, to]);
    }
  }
  return [...keep].toSorted((a, b) => a - b).map((i) => points[i]);
};

export const simplify = (trace: readonly Trace[]): Trace[] => {
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const p of trace) {
    left = Math.min(left, p.x);
    top = Math.min(top, p.y);
    right = Math.max(right, p.x);
    bottom = Math.max(bottom, p.y);
  }
  const wide = right - left;
  const tall = bottom - top;
  const size = Math.max(wide, tall, 1e-6);
  const unit = trace.map((p) => ({
    w: Math.min(WIDTH_RANGE, p.w / size),
    x: (p.x - left) / size + (1 - wide / size) / 2,
    y: (p.y - top) / size + (1 - tall / size) / 2,
  }));
  let tolerance = TOLERANCE;
  let kept = reduce(unit, tolerance);
  while (kept.length > MAX_POINTS) {
    tolerance *= 1.5;
    kept = reduce(unit, tolerance);
  }
  return kept;
};

const toBase64 = (bytes: Uint8Array) =>
  btoa(String.fromCodePoint(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/[=]+$/u, "");

const fromBase64 = (text: string) => {
  try {
    const raw = atob(text.replaceAll("-", "+").replaceAll("_", "/"));
    return Uint8Array.from(raw, (char) => char.codePointAt(0) ?? 0);
  } catch {
    return null;
  }
};

const byte = (value: number) => Math.round(clamp01(value) * 255);

export const pack = (trace: readonly Trace[]) =>
  toBase64(
    Uint8Array.from(
      trace.flatMap((p) => [byte(p.x), byte(p.y), byte(p.w / WIDTH_RANGE)])
    )
  );

export const unpack = (text: string): Trace[] | null => {
  if (!/^[\w-]+$/u.test(text) || text.length > MAX_POINTS * 4) {
    return null;
  }
  const bytes = fromBase64(text);
  if (bytes === null || bytes.length % 3 !== 0 || bytes.length < 6) {
    return null;
  }
  const trace: Trace[] = [];
  for (let i = 0; i < bytes.length; i += 3) {
    trace.push({
      w: ((bytes[i + 2] ?? 0) / 255) * WIDTH_RANGE,
      x: (bytes[i] ?? 0) / 255,
      y: (bytes[i + 1] ?? 0) / 255,
    });
  }
  return trace;
};

const mix = (a: Trace, b: Trace, t: number): Trace => ({
  w: a.w + (b.w - a.w) * t,
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

const subdivide = (line: readonly Trace[]) => [
  ...line.slice(0, 1),
  ...line
    .slice(1)
    .flatMap((b, i) => [mix(line[i], b, 0.25), mix(line[i], b, 0.75)]),
  ...line.slice(-1),
];

const smooth = (points: readonly Trace[]) => {
  let line: readonly Trace[] = points;
  for (let pass = 0; pass < SMOOTHING; pass += 1) {
    line = subdivide(line);
  }
  return line;
};

const num = (value: number) => value.toFixed(1);

export const inkPaths = (trace: readonly Trace[], frame: Frame) => {
  const pad = Math.max(...trace.map((p) => p.w)) / 2;
  const scale = frame.size / (1 + pad * 2);
  const line = smooth(trace).map((p) => ({
    w: p.w * scale,
    x: frame.x + (p.x + pad) * scale,
    y: frame.y + (p.y + pad) * scale,
  }));
  let nx = 0;
  let ny = -1;
  const normals = line.map((p, i) => {
    const a = line[Math.max(0, i - 1)] ?? p;
    const b = line[Math.min(line.length - 1, i + 1)] ?? p;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (length > 1e-6) {
      nx = -(b.y - a.y) / length;
      ny = (b.x - a.x) / length;
    }
    return { x: nx, y: ny };
  });
  const offset = (lane: number) =>
    line.map((p, i) => {
      const n = normals[i] ?? { x: 0, y: 0 };
      return `${num(p.x + n.x * lane * (p.w / 2))} ${num(p.y + n.y * lane * (p.w / 2))}`;
    });
  const outer = offset(1);
  const inner = offset(-1).toReversed();
  const cap = (p: Trace | undefined) => {
    const r = num(Math.max(0.1, (p?.w ?? 0) / 2));
    return `${r} ${r} 0 0 0`;
  };
  const body = `M${outer.join("L")}A${cap(line.at(-1))} ${inner.join("L")}A${cap(line[0])} ${outer[0] ?? ""}Z`;
  let travelled = 0;
  const reach = line.map((p, i) => {
    const prev = line[i - 1] ?? p;
    travelled += Math.hypot(p.x - prev.x, p.y - prev.y);
    return travelled;
  });
  const thick = pad * 2 * scale;
  const streaks = LANES.map((lane, k) => {
    const from = 0.4 + (1 - Math.abs(lane)) * 0.32;
    const points = offset(lane).filter(
      (_, i) => (reach[i] ?? 0) >= travelled * from
    );
    const turn = (k * 3) % DASHES.length;
    const dash = [...DASHES.slice(turn), ...DASHES.slice(0, turn)];
    return {
      d: points.length > 1 ? `M${points.join("L")}` : "",
      dash: dash.map((length) => num(length * scale)).join(" "),
      lane,
      opacity: 0.55 + ((k * 3) % 4) * 0.1,
      width: num(Math.max(0.5, (thick / 26) * (0.7 + ((k * 5) % 3) * 0.3))),
    };
  }).filter((streak) => streak.d !== "");
  return { body, spine: `M${offset(0).join("L")}`, streaks };
};
