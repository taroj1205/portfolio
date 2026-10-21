export interface Wave {
  size: number;
  height: Float64Array;
  speed: Float64Array;
}

export interface Bead {
  x: number;
  y: number;
  r: number;
}

export interface Run extends Bead {
  wet: number;
}

export interface Jet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rate: number;
  volume: number;
}

export interface Impact {
  x: number;
  y: number;
  rate: number;
  speed: number;
}

export interface Stream {
  threads: Bead[][];
  beads: Bead[];
  impact: Impact | null;
}

interface Rivulet {
  front: number;
  flux: number;
  share: number;
  x: number;
  path: Run[];
}

const CELLS = 24;
const SPEED = 380;
const DAMPING = 2.4;
const VISCOSITY = 9;
const MOST = 40;
const BOUND = 1.6;
const RUSH = 900;
const GRAVITY = 9810;
const SAMPLES = 40;
const BREAK = 0.42;
const DROP_ML = 0.05;
const DROP_R = 1.3;
const STREAM_R = 2.7;
const WOBBLE = 9;
const FILM = 0.62;
const THICKEST = 1.3;
const RUN_SPEED: readonly [number, number] = [70, 125];
const SHEET_SPEED = 160;
export const POOL_DEPTH = 2.6;
const POOL_SAMPLES = 64;
const WRAP = 0.55;

const finite = (value: number) => (Number.isFinite(value) ? value : 0);

export const createWave = (size = CELLS): Wave => ({
  height: new Float64Array(size * size),
  size,
  speed: new Float64Array(size * size),
});

const centre = (values: Float64Array, bound: number) => {
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) {
    values[i] = finite(values[i] ?? 0);
    sum += values[i] ?? 0;
  }
  const mean = sum / values.length;
  let peak = 0;
  for (let i = 0; i < values.length; i += 1) {
    values[i] = (values[i] ?? 0) - mean;
    peak = Math.max(peak, Math.abs(values[i] ?? 0));
  }
  if (peak > bound) {
    for (let i = 0; i < values.length; i += 1) {
      values[i] = ((values[i] ?? 0) * bound) / peak;
    }
  }
};

export const pushWave = (
  wave: Wave,
  x: number,
  z: number,
  impulse: number,
  spread = 0.12
) => {
  const { size, speed } = wave;
  const last = size - 1;
  const strength = finite(impulse);
  if (strength === 0 || last < 1) {
    return;
  }
  for (let j = 0; j <= last; j += 1) {
    const v = (j / last) * 2 - 1 - z;
    for (let i = 0; i <= last; i += 1) {
      const u = (i / last) * 2 - 1 - x;
      const k = j * size + i;
      speed[k] =
        (speed[k] ?? 0) + strength * Math.exp(-(u * u + v * v) / spread ** 2);
    }
  }
  centre(speed, RUSH);
};

const spreadOf = (values: Float64Array, size: number, k: number) => {
  const i = k % size;
  const middle = values[k] ?? 0;
  const left = values[i > 0 ? k - 1 : k] ?? middle;
  const right = values[i < size - 1 ? k + 1 : k] ?? middle;
  const back = values[k >= size ? k - size : k] ?? middle;
  const front = values[k < values.length - size ? k + size : k] ?? middle;
  return left + right + back + front - 4 * middle;
};

export const stepWave = (wave: Wave, dt: number, span: number) => {
  const { height, size, speed } = wave;
  const last = size - 1;
  if (!(dt > 0) || !(span > 0) || last < 1) {
    return;
  }
  const dx = span / last;
  const step = Math.min(
    1 / 240,
    (0.45 * dx) / SPEED,
    (0.12 * dx * dx) / VISCOSITY
  );
  const count = Math.min(MOST, Math.ceil(dt / step));
  const tension = (SPEED * SPEED) / (dx * dx);
  const smear = VISCOSITY / (dx * dx);
  const pull = new Float64Array(height.length);
  for (let n = 0; n < count; n += 1) {
    for (let k = 0; k < height.length; k += 1) {
      pull[k] =
        tension * spreadOf(height, size, k) +
        smear * spreadOf(speed, size, k) -
        DAMPING * (speed[k] ?? 0);
    }
    for (let k = 0; k < height.length; k += 1) {
      speed[k] = (speed[k] ?? 0) + (pull[k] ?? 0) * step;
      height[k] = (height[k] ?? 0) + (speed[k] ?? 0) * step;
    }
  }
  centre(height, BOUND);
  centre(speed, RUSH);
};

const cellOf = (last: number, u: number) => {
  const at = Math.min(last, Math.max(0, ((u + 1) / 2) * last));
  const low = Math.min(last - 1, Math.floor(at));
  return { low, mix: at - low };
};

export const waveAt = (wave: Wave, x: number, z: number) => {
  const { height, size } = wave;
  const across = cellOf(size - 1, x);
  const along = cellOf(size - 1, z);
  const k = along.low * size + across.low;
  const back =
    (height[k] ?? 0) * (1 - across.mix) + (height[k + 1] ?? 0) * across.mix;
  const front =
    (height[k + size] ?? 0) * (1 - across.mix) +
    (height[k + size + 1] ?? 0) * across.mix;
  return back * (1 - along.mix) + front * along.mix;
};

export const tiltAt = (
  wave: Wave,
  x: number,
  z: number,
  half: number,
  most: number
) => {
  const step = 2 / (wave.size - 1);
  const run = 2 * step * half;
  const cap = (slope: number) => most * Math.tanh(slope / most);
  return {
    x: cap((waveAt(wave, x + step, z) - waveAt(wave, x - step, z)) / run),
    z: cap((waveAt(wave, x, z + step) - waveAt(wave, x, z - step)) / run),
  };
};

export const edgeOf = (inset: number, reach: number) =>
  Math.tanh(Math.max(0, inset) / Math.max(0.5, reach));

const fallTime = (vy: number, drop: number) =>
  (-vy + Math.sqrt(vy * vy + 2 * GRAVITY * Math.max(0, drop))) / GRAVITY;

const interpolate = (from: Bead, to: Bead, mix: number): Bead => ({
  r: from.r + (to.r - from.r) * mix,
  x: from.x + (to.x - from.x) * mix,
  y: from.y + (to.y - from.y) * mix,
});

interface Sample extends Bead {
  live: boolean;
  broken: boolean;
  volume: number;
  rate: number;
  speed: number;
}

const sampleAt = (
  emit: (at: number) => Jet,
  t: number,
  age: number,
  flow: number
): Sample => {
  const jet = emit(t - age);
  const q = jet.rate / flow;
  const vy = jet.vy + GRAVITY * age;
  const speed = Math.hypot(jet.vx, vy);
  const sway =
    WOBBLE * age * (1 - Math.min(1, q)) * Math.sin((t - age) * 23 + age * 9);
  const neck =
    1 +
    0.16 *
      Math.sin((t - age) * 71) *
      Math.min(1, age / (BREAK * q ** 1.5 + 1e-3));
  return {
    broken: age > BREAK * Math.max(0, q) ** 1.5,
    live: jet.rate > 1e-4,
    r: finite(
      STREAM_R *
        Math.sqrt(Math.max(0, q)) *
        Math.sqrt(Math.hypot(jet.vx, jet.vy) / Math.max(1, speed)) *
        neck
    ),
    rate: jet.rate,
    speed,
    volume: jet.volume,
    x: finite(jet.x + jet.vx * age + sway),
    y: finite(jet.y + jet.vy * age + 0.5 * GRAVITY * age * age),
  };
};

export const streamOf = (
  emit: (at: number) => Jet,
  t: number,
  surface: (x: number) => number,
  flow: number
): Stream => {
  const now = emit(t);
  const reach =
    1.5 * fallTime(Math.max(0, now.vy), surface(now.x) - now.y) + 0.02;
  const threads: Bead[][] = [];
  const beads: Bead[] = [];
  let thread: Bead[] = [];
  let previous: Sample | null = null;
  let impact: Impact | null = null;
  for (let i = 0; i <= SAMPLES && impact === null; i += 1) {
    let sample = sampleAt(emit, t, (reach * i) / SAMPLES, flow);
    const floor = surface(sample.x);
    if (sample.y >= floor) {
      if (previous === null) {
        break;
      }
      const above = floor - previous.y;
      const mix = Math.min(
        1,
        Math.max(0, above / Math.max(1e-6, sample.y - previous.y))
      );
      sample = { ...sample, ...interpolate(previous, sample, mix) };
      if (sample.live) {
        impact = {
          rate: sample.rate,
          speed: sample.speed,
          x: sample.x,
          y: sample.y,
        };
      }
    }
    if (sample.live && !sample.broken) {
      thread.push(sample);
    } else if (thread.length > 0) {
      threads.push(thread);
      thread = [];
    }
    if (sample.live && sample.broken && previous !== null) {
      const from = Math.floor(previous.volume / DROP_ML);
      const to = Math.floor(sample.volume / DROP_ML);
      for (let k = to + 1; k <= from && k <= to + 3; k += 1) {
        const mix =
          (previous.volume - k * DROP_ML) /
          Math.max(1e-9, previous.volume - sample.volume);
        const at = interpolate(previous, sample, Math.min(1, Math.max(0, mix)));
        beads.push({
          ...at,
          r: Math.max(DROP_R * 0.7, Math.min(DROP_R * 1.5, sample.r * 1.6)),
        });
      }
    }
    previous = sample;
  }
  if (thread.length > 0) {
    threads.push(thread);
  }
  return { beads, impact, threads: threads.filter((each) => each.length > 1) };
};

const unit = (seed: number, salt: number) => {
  const value = Math.sin(seed * 12.9898 + salt * 78.233) * 43_758.5453;
  return value - Math.floor(value);
};

interface Lobe {
  x: number;
  weight: number;
}

const reachOf = (lobes: readonly Lobe[], size: number, x: number) =>
  Math.sqrt(
    lobes.reduce(
      (sum, lobe) =>
        sum + Math.max(0, size * size * lobe.weight - (x - lobe.x) ** 2),
      0
    )
  );

const poolOf = (lobes: readonly Lobe[], area: number, wall: number) => {
  const total = lobes.reduce((sum, lobe) => sum + lobe.weight, 0);
  if (!(area > 0) || !(total > 0)) {
    return { area: 0, outline: [] };
  }
  const puddleOf = (size: number) => {
    const from = Math.min(
      ...lobes.map((lobe) => lobe.x - size * Math.sqrt(lobe.weight))
    );
    const to = Math.max(
      ...lobes.map((lobe) => lobe.x + size * Math.sqrt(lobe.weight))
    );
    const step = (to - from) / POOL_SAMPLES;
    const rows = Array.from({ length: POOL_SAMPLES + 1 }, (_, i) => {
      const x = from + i * step;
      const reach = reachOf(lobes, size, x);
      return { back: Math.abs(x) > wall ? reach * WRAP : 0, reach, x };
    });
    const seen = rows.reduce(
      (sum, row, i) =>
        sum +
        (i === 0 || i === POOL_SAMPLES ? 0.5 : 1) * (row.reach + row.back),
      0
    );
    return { rows, seen: seen * step };
  };
  let low = 0;
  let high = Math.sqrt(area / total) * 4;
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    if (puddleOf(mid).seen < area) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const { rows, seen } = puddleOf((low + high) / 2);
  return {
    area: seen,
    outline: [
      ...rows.map((row) => ({ x: row.x, z: wall + row.reach })),
      ...rows.toReversed().map((row) => ({
        x: row.x,
        z: wall - Math.max(row.back, Math.abs(row.x) > wall ? 0 : wall * 0.2),
      })),
    ],
  };
};

export const spillageOf = (
  seed: number,
  spilt: (since: number) => number,
  since: number,
  height: number,
  span: number
) => {
  const start = (unit(seed, 1) - 0.5) * span * 0.8;
  const count = 4 + Math.floor(unit(seed, 2) * 3);
  const weights = Array.from(
    { length: count },
    (_, i) => 0.4 + unit(seed, 10 + i)
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const flux = (at: number) =>
    Math.max(0, (spilt(at) - spilt(at - 0.04)) / 0.04);
  const lobes: Lobe[] = [];
  const rivulets: Rivulet[] = weights.map((weight, i) => {
    const x = -span + ((i + 0.3 + unit(seed, 20 + i) * 0.4) / count) * span * 2;
    const delay = Math.abs(x - start) / SHEET_SPEED;
    const pace =
      RUN_SPEED[0] + unit(seed, 30 + i) * (RUN_SPEED[1] - RUN_SPEED[0]);
    const swing = 0.4 + unit(seed, 40 + i) * 1.1;
    const turn = 0.06 + unit(seed, 50 + i) * 0.08;
    const phase = unit(seed, 60 + i) * Math.PI * 2;
    const slant = (unit(seed, 70 + i) - 0.5) * 0.12;
    const bend = (d: number) =>
      swing *
      (Math.sin(d * turn + phase) +
        0.45 * Math.sin(d * turn * 2.7 + phase * 1.9));
    const pinch = (d: number) =>
      0.72 +
      0.2 * Math.sin(d * (0.21 + turn) + phase * 2.3) +
      0.12 * Math.sin(d * 0.63 + phase * 0.7);
    const share = weight / total;
    const trail = 0.45 + 1.6 * share;
    const front = Math.min(height, Math.max(0, (since - delay) * pace));
    const path: Run[] = [];
    const gap = Math.min(2, Math.max(0.5, front / 24));
    for (let d = 0; d <= front + 1e-9; d += gap) {
      const film = FILM * Math.cbrt(flux(since - delay - d / pace) * share);
      path.push({
        r: Math.min(THICKEST, film) * pinch(d),
        wet: trail * pinch(d * 0.7 + 3),
        x: x + bend(d) - bend(0) + slant * d,
        y: height - d,
      });
    }
    lobes.push({
      weight: share * Math.max(0, spilt(since - delay - height / pace)),
      x: x + bend(height) - bend(0) + slant * height,
    });
    return {
      flux: flux(since - delay - front / pace) * share,
      front,
      path,
      share,
      x,
    };
  });
  const pooled = lobes.reduce((sum, lobe) => sum + lobe.weight, 0);
  return {
    pool: poolOf(lobes, (pooled * 1000) / POOL_DEPTH, span),
    rivulets,
    sheet: Math.min(span * 2, Math.max(0, since) * SHEET_SPEED),
    start,
  };
};
