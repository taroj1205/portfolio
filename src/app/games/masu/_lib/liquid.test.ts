import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  POOL_DEPTH,
  createWave,
  edgeOf,
  pushWave,
  spillageOf,
  stepWave,
  streamOf,
  tiltAt,
  waveAt,
} from "./liquid";
import type { Jet, Stream, Wave } from "./liquid";

const SPAN = 73;
const SPEED = 380;
const HALF = SPAN / 2;

const energyOf = (wave: Wave) =>
  wave.height.reduce(
    (sum, value, i) => sum + value ** 2 + ((wave.speed[i] ?? 0) / SPEED) ** 2,
    0
  ) / wave.height.length;

const meanOf = (wave: Wave) =>
  wave.height.reduce((sum, value) => sum + value, 0) / wave.height.length;

const finite = (wave: Wave) =>
  [...wave.height, ...wave.speed].every((value) => Number.isFinite(value));

const grid = Array.from({ length: 39 }, (_, i) => -0.95 + i * 0.05);

const steepestOf = (wave: Wave, most: number) =>
  Math.max(
    ...grid.flatMap((x) =>
      grid.map((z) => {
        const tilt = tiltAt(wave, x, z, HALF, most);
        return Math.hypot(tilt.x, tilt.z);
      })
    )
  );

const stir = () => {
  const wave = createWave();
  pushWave(wave, -0.3, 0.1, -60);
  pushWave(wave, 0.6, -0.4, 40, 0.2);
  return wave;
};

const pour = (wave: Wave, frames: number) => {
  for (let i = 0; i < frames; i += 1) {
    stepWave(wave, 1 / 60, SPAN);
    pushWave(wave, -0.35, 0.08, (-90 * (1 + Math.sin(i * 1.7))) / 2, 0.11);
  }
};

describe("the surface", () => {
  test("a splash sends ripples out from where it lands, and they settle", () => {
    const wave = stir();
    stepWave(wave, 1 / 60, SPAN);
    const start = energyOf(wave);
    assert.ok(start > 1e-4);
    const crests = new Set<number>();
    for (let i = 0; i < 60; i += 1) {
      stepWave(wave, 1 / 60, SPAN);
      crests.add(Math.sign(waveAt(wave, 0.9, 0.9)));
    }
    assert.ok(crests.has(1) && crests.has(-1));
    for (let i = 0; i < 60 * 8; i += 1) {
      stepWave(wave, 1 / 60, SPAN);
    }
    assert.ok(energyOf(wave) < start * 1e-3);
  });

  test("ripples spread the same way in every direction", () => {
    const wave = createWave(25);
    pushWave(wave, 0, 0, -60);
    for (let i = 0; i < 6; i += 1) {
      stepWave(wave, 1 / 60, SPAN);
    }
    for (const [x, z] of [
      [0.4, 0],
      [0, 0.4],
      [-0.4, 0],
      [0, -0.4],
    ] as const) {
      assert.ok(Math.abs(waveAt(wave, x, z) - waveAt(wave, 0.4, 0)) < 1e-9);
    }
  });

  test("waves move sake around but never change how much is in the cup", () => {
    const wave = stir();
    for (let i = 0; i < 200; i += 1) {
      pushWave(wave, Math.sin(i), Math.cos(i * 0.7), -30);
      stepWave(wave, 1 / 60, SPAN);
      assert.ok(Math.abs(meanOf(wave)) < 1e-9);
    }
  });

  test("a steady pour keeps the surface moving but smooth, never jagged", () => {
    const wave = createWave();
    pour(wave, 600);
    assert.ok(energyOf(wave) > 1e-4);
    assert.ok(Math.max(...wave.height.map(Math.abs)) <= 1.6);
    assert.ok(steepestOf(wave, 1e9) < 0.2);
  });

  test("the slopes used for highlights are capped and change smoothly across the surface", () => {
    const wave = createWave();
    pour(wave, 240);
    for (let i = 0; i < 40; i += 1) {
      pushWave(wave, 0, 0, 1e6, 0.05);
    }
    assert.ok(steepestOf(wave, 0.3) <= 0.3);
    for (const z of grid) {
      for (const [index, x] of grid.entries()) {
        const next = grid[index + 1];
        if (next !== undefined) {
          const here = tiltAt(wave, x, z, HALF, 0.3);
          const there = tiltAt(wave, next, z, HALF, 0.3);
          assert.ok(Math.abs(here.x - there.x) < 0.15);
        }
      }
    }
  });

  test("a long frame or a tab coming back from sleep cannot blow it up", () => {
    const wave = stir();
    for (const dt of [0.05, 0.5, 30, 1e9]) {
      stepWave(wave, dt, SPAN);
      assert.ok(finite(wave));
      assert.ok(wave.height.every((value) => Math.abs(value) <= 1.6));
    }
    for (let i = 0; i < 40; i += 1) {
      pushWave(wave, 0, 0, 1e9);
      stepWave(wave, 0.05, SPAN);
    }
    assert.ok(finite(wave));
    assert.ok(wave.height.every((value) => Math.abs(value) <= 1.6));
  });

  test("nonsense steps and pushes leave it alone", () => {
    const wave = stir();
    const before = [...wave.height];
    for (const dt of [0, -1, Number.NaN]) {
      stepWave(wave, dt, SPAN);
    }
    stepWave(wave, 1 / 60, 0);
    pushWave(wave, 0, 0, Number.NaN);
    assert.deepEqual([...wave.height], before);
  });

  test("the dome's edge rises from the rim like a meniscus and is flat on top", () => {
    assert.equal(edgeOf(0, 4), 0);
    assert.equal(edgeOf(-3, 4), 0);
    assert.ok(edgeOf(2, 4) > 0.4 && edgeOf(2, 4) < 0.5);
    assert.ok(edgeOf(30, 4) > 0.999);
    assert.ok(edgeOf(2, 2) > edgeOf(2, 4));
  });
});

const jetOf =
  (rate: (at: number) => number) =>
  (at: number): Jet => ({
    rate: rate(at),
    volume: Math.max(0, at) * 50,
    vx: -300,
    vy: 60,
    x: 14,
    y: -70,
  });

const surface = () => -10;

const pointsOf = (stream: Stream) => [
  ...stream.threads.flat(),
  ...stream.beads,
  ...(stream.impact === null ? [] : [stream.impact]),
];

describe("the stream", () => {
  test("is a pure function of the pour's history", () => {
    const emit = jetOf((at) => (at > 0 ? 0.35 : 0));
    assert.deepEqual(
      streamOf(emit, 2, surface, 0.35),
      streamOf(emit, 2, surface, 0.35)
    );
  });

  test("a full pour is one unbroken thread that lands on the surface and thins as it falls", () => {
    const stream = streamOf(
      jetOf(() => 0.35),
      2,
      surface,
      0.35
    );
    assert.equal(stream.threads.length, 1);
    assert.equal(stream.beads.length, 0);
    assert.ok(stream.impact !== null);
    assert.ok(Math.abs(stream.impact.y - surface()) < 1e-6);
    const thread = stream.threads[0] ?? [];
    assert.ok((thread[0]?.r ?? 0) > (thread.at(-1)?.r ?? 0));
  });

  test("a trickle breaks into drops, and after it stops the last drops fall away", () => {
    const thin = streamOf(
      jetOf(() => 0.02),
      2,
      surface,
      0.35
    );
    assert.ok(thin.beads.length > 0);
    const end = 2;
    const tail = streamOf(
      jetOf((at) => (at < end ? 0.35 : 0)),
      end + 0.04,
      surface,
      0.35
    );
    assert.ok(pointsOf(tail).length > 0);
    assert.ok(pointsOf(tail).every((point) => point.y > -70));
    const gone = streamOf(
      jetOf((at) => (at < end ? 0.35 : 0)),
      end + 1,
      surface,
      0.35
    );
    assert.equal(pointsOf(gone).length, 0);
  });

  test("stays finite for odd inputs", () => {
    for (const rate of [0, 1e-9, 5, 1e6]) {
      const stream = streamOf(
        jetOf(() => rate),
        1,
        surface,
        0.35
      );
      assert.ok(
        pointsOf(stream).every(
          (point) => Number.isFinite(point.x) && Number.isFinite(point.y)
        )
      );
    }
  });
});

describe("the spill", () => {
  const ml = 18;
  const spilt = (since: number) =>
    since <= 0 ? 0 : ml * Math.min(1, since / 0.6);

  test("is laid out by the pour's seed", () => {
    assert.deepEqual(
      spillageOf(7, spilt, 0.8, 50, 44),
      spillageOf(7, spilt, 0.8, 50, 44)
    );
    assert.notDeepEqual(
      spillageOf(7, spilt, 0.8, 50, 44),
      spillageOf(8, spilt, 0.8, 50, 44)
    );
  });

  test("runs down the front in thin films that vary in width", () => {
    for (let since = 0; since < 4; since += 0.1) {
      for (const rivulet of spillageOf(7, spilt, since, 50, 44).rivulets) {
        assert.ok(rivulet.front <= 50);
        assert.ok(
          rivulet.path.every(
            (bead) =>
              Math.abs(bead.x) < 60 &&
              bead.r >= 0 &&
              bead.r <= 1.3 &&
              bead.wet > 0
          )
        );
      }
    }
    const running = spillageOf(7, spilt, 0.5, 50, 44).rivulets[0]?.path ?? [];
    const widths = running.map((bead) => bead.r).filter((r) => r > 0);
    assert.ok(Math.max(...widths) > Math.min(...widths) * 1.3);
  });

  test("the pool grows to cover what spilled at a puddle's depth", () => {
    let area = 0;
    for (let since = 0; since < 4; since += 0.1) {
      const { pool } = spillageOf(7, spilt, since, 50, 44);
      assert.ok(pool.area >= area - 1e-6);
      ({ area } = pool);
    }
    const settled = spillageOf(7, spilt, 60, 50, 44);
    const expected = (ml * 1000) / POOL_DEPTH;
    assert.ok(Math.abs(settled.pool.area - expected) < expected * 1e-3);
    assert.ok(settled.pool.area < 88 * 88);
    assert.ok(settled.pool.outline.every((spot) => spot.z > 0));
    assert.ok(settled.rivulets.every((rivulet) => rivulet.flux === 0));
    assert.deepEqual(spillageOf(7, spilt, 1e9, 50, 44).pool, settled.pool);
  });

  test("there is no pool before anything reaches the counter", () => {
    const { pool } = spillageOf(7, spilt, 0.1, 50, 44);
    assert.equal(pool.area, 0);
    assert.deepEqual(pool.outline, []);
  });
});
