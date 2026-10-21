import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import {
  createWave,
  edgeOf,
  pushWave,
  spillageOf,
  stepWave,
  streamOf,
  waveAt,
} from "./liquid";
import type { Jet, Stream, Wave } from "./liquid";

const SPAN = 73;
const SPEED = 420;

const energyOf = (wave: Wave) =>
  wave.height.reduce(
    (sum, value, i) => sum + value ** 2 + ((wave.speed[i] ?? 0) / SPEED) ** 2,
    0
  ) / wave.height.length;

const meanOf = (wave: Wave) =>
  wave.height.reduce((sum, value) => sum + value, 0) / wave.height.length;

const finite = (wave: Wave) =>
  [...wave.height, ...wave.speed].every((value) => Number.isFinite(value));

const stir = () => {
  const wave = createWave();
  pushWave(wave, -0.3, -400);
  pushWave(wave, 0.6, 250, 0.2);
  return wave;
};

describe("the surface", () => {
  test("a splash makes waves that slosh and then settle", () => {
    const wave = stir();
    stepWave(wave, 1 / 60, SPAN);
    const start = energyOf(wave);
    assert.ok(start > 1e-3);
    const crests = new Set<number>();
    for (let i = 0; i < 60; i += 1) {
      stepWave(wave, 1 / 60, SPAN);
      crests.add(Math.sign(waveAt(wave, -0.9)));
    }
    assert.ok(crests.has(1) && crests.has(-1));
    for (let i = 0; i < 60 * 8; i += 1) {
      stepWave(wave, 1 / 60, SPAN);
    }
    assert.ok(energyOf(wave) < start * 1e-3);
  });

  test("waves move sake around but never change how much is in the cup", () => {
    const wave = stir();
    for (let i = 0; i < 200; i += 1) {
      pushWave(wave, Math.sin(i), -30);
      stepWave(wave, 1 / 60, SPAN);
      assert.ok(Math.abs(meanOf(wave)) < 1e-9);
    }
  });

  test("a steady pour keeps the surface moving but smooth, never jagged", () => {
    const wave = createWave();
    for (let i = 0; i < 600; i += 1) {
      stepWave(wave, 1 / 60, SPAN);
      pushWave(wave, -0.2, (-90 * (1 + Math.sin(i * 1.7))) / 2, 0.07);
    }
    const bends = [...wave.height].map((value, i, all) =>
      i === 0 || i === all.length - 1
        ? 0
        : Math.abs((all[i - 1] ?? 0) - 2 * value + (all[i + 1] ?? 0))
    );
    assert.ok(Math.max(...wave.height.map(Math.abs)) < 3);
    assert.ok(Math.max(...bends) < 1);
    assert.ok(energyOf(wave) > 1e-4);
  });

  test("a long frame or a tab coming back from sleep cannot blow it up", () => {
    const wave = stir();
    for (const dt of [0.05, 0.5, 30, 1e9]) {
      stepWave(wave, dt, SPAN);
      assert.ok(finite(wave));
      assert.ok(wave.height.every((value) => Math.abs(value) <= 6));
    }
    for (let i = 0; i < 40; i += 1) {
      pushWave(wave, 0, 1e9);
      stepWave(wave, 0.05, SPAN);
    }
    assert.ok(finite(wave));
    assert.ok(wave.height.every((value) => Math.abs(value) <= 6));
  });

  test("nonsense steps and pushes leave it alone", () => {
    const wave = stir();
    const before = [...wave.height];
    for (const dt of [0, -1, Number.NaN]) {
      stepWave(wave, dt, SPAN);
    }
    stepWave(wave, 1 / 60, 0);
    pushWave(wave, 0, Number.NaN);
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

  test("runs down the front, and the pool grows to the size of what spilled", () => {
    let pool = 0;
    for (let since = 0; since < 4; since += 0.1) {
      const spillage = spillageOf(7, spilt, since, 50, 44);
      assert.ok(spillage.pool >= pool - 1e-9);
      ({ pool } = spillage);
      for (const rivulet of spillage.rivulets) {
        assert.ok(rivulet.front <= 50);
        assert.ok(
          rivulet.path.every((bead) => Math.abs(bead.x) < 60 && bead.r >= 0)
        );
      }
    }
    const settled = spillageOf(7, spilt, 60, 50, 44);
    assert.ok(
      Math.abs(settled.pool - Math.sqrt((ml * 1000) / (Math.PI * 2.6))) < 1e-9
    );
    assert.ok(settled.rivulets.every((rivulet) => rivulet.flux === 0));
    assert.equal(spillageOf(7, spilt, 1e9, 50, 44).pool, settled.pool);
  });
});
