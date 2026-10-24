import assert from "node:assert/strict";

import { describe, it } from "vite-plus/test";

import { seeded } from "../../_lib/svg";
import type { KindId } from "./fish";
import {
  POI,
  STOCK,
  WATER,
  catchable,
  createTank,
  dip,
  drag,
  lift,
  step,
} from "./tank";
import type { Fish } from "./tank";

const DT = 1 / 60;

const still = (kind: KindId, x: number, y: number): Fish => ({
  age: 10,
  fright: 0,
  heading: 0,
  kind,
  phase: 0,
  speed: 0,
  turn: 0,
  under: false,
  x,
  y,
});

const tankWith = (fish: Fish[]) => {
  const tank = createTank(seeded(7));
  tank.fish = fish;

  return tank;
};

const sweep = (seconds: number) => {
  const tank = tankWith([]);
  dip(tank, { x: 300, y: 500 });
  const before = tank.poi.paper;
  const samples = Math.round(seconds * 60);

  for (let i = 1; i <= samples; i += 1) {
    drag(tank, { x: 300 + (200 * i) / samples, y: 500 }, seconds / samples);
  }

  return before - tank.poi.paper;
};

const trembled = (hz: number) => {
  const tank = tankWith([]);
  const random = seeded(5);
  dip(tank, { x: 500, y: 500 });
  const before = tank.poi.paper;

  for (let i = 0; i < hz * 5; i += 1) {
    drag(
      tank,
      { x: 500 + (random() - 0.5) * 6, y: 500 + (random() - 0.5) * 6 },
      1 / hz
    );
  }

  return before - tank.poi.paper;
};

const nearest = (tank: ReturnType<typeof createTank>) =>
  tank.fish.toSorted(
    (a, b) =>
      Math.hypot(a.x - tank.poi.x, a.y - tank.poi.y) -
      Math.hypot(b.x - tank.poi.x, b.y - tank.poi.y)
  )[0];

const wait = (tank: ReturnType<typeof createTank>, seconds: number) => {
  for (let t = 0; t < seconds && !tank.poi.torn; t += DT) {
    step(tank, DT);
  }

  return seconds;
};

const tapping = (seed: number) => {
  const tank = createTank(seeded(seed));
  let time = 0;

  while (!tank.poi.torn && time < 600) {
    time += wait(tank, 0.6);
    const target = nearest(tank);
    dip(tank, target);
    lift(tank);
  }

  return tank.caught.length;
};

const leading = (seed: number) => {
  const tank = createTank(seeded(seed));
  let time = 0;

  while (!tank.poi.torn && time < 600) {
    time += wait(tank, 0.35);
    const target = nearest(tank);
    dip(tank, {
      x: target.x + Math.cos(target.heading) * 130,
      y: target.y + Math.sin(target.heading) * 130,
    });
    let waited = 0;

    while (!tank.poi.torn && waited < 4 && catchable(tank).length === 0) {
      waited += wait(tank, DT);
      const gap = Math.hypot(target.x - tank.poi.x, target.y - tank.poi.y);

      if (gap > 1 && tank.fish.includes(target)) {
        const k = Math.min(1, (45 * DT) / gap);
        drag(
          tank,
          {
            x: tank.poi.x + (target.x - tank.poi.x) * k,
            y: tank.poi.y + (target.y - tank.poi.y) * k,
          },
          DT
        );
      }
    }

    time += waited + wait(tank, 0.1);
    lift(tank);
  }

  return tank.caught.length;
};

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

describe("scooping", () => {
  it("lifting under a fish puts it in the bowl and the stall tops the tank up", () => {
    const tank = tankWith([]);
    assert.deepEqual(dip(tank, { x: 500, y: 500 }), []);
    tank.fish = [still("ogon", 500, 500)];
    const [outcome] = lift(tank);
    assert.equal(outcome.type, "scoop");
    assert.deepEqual(tank.caught, ["ogon"]);
    assert.equal(tank.fish.length, STOCK);
    assert.equal(tank.poi.down, false);
    assert.ok(tank.poi.paper < 1);
  });

  it("dipping right on top of a goldfish leaves it under the paper, and the lift says so", () => {
    const tank = tankWith([
      still("wakin", 500, 500),
      still("sarasa", 500, 590),
    ]);

    dip(tank, { x: 500, y: 500 });
    const [under, beside] = tank.fish;
    assert.equal(under.under, true);
    assert.ok(beside.fright > 0);
    assert.deepEqual(catchable(tank), []);
    const [outcome] = lift(tank);
    assert.equal(outcome.type, "under");
    assert.deepEqual(tank.caught, []);
    assert.equal(under.under, false);
  });

  it("a goldfish that swims onto the paper after the dip comes up, even one that was under it before", () => {
    const tank = tankWith([still("wakin", 500, 500)]);
    dip(tank, { x: 500, y: 500 });
    const [fish] = tank.fish;
    fish.x = 700;
    step(tank, DT);
    assert.equal(fish.under, false);
    fish.x = 500;
    assert.deepEqual(catchable(tank), [fish]);
    assert.equal(lift(tank)[0].type, "scoop");
    assert.deepEqual(tank.caught, ["wakin"]);
  });

  it("a fish on the edge of the paper still comes up with it", () => {
    const tank = tankWith([]);
    dip(tank, { x: 500, y: 500 });
    tank.fish = [still("wakin", 500 + POI.r - 2, 500)];
    assert.equal(lift(tank)[0].type, "scoop");
  });

  it("an empty lift catches nothing and costs a little paper", () => {
    const tank = tankWith([still("wakin", 200, 200)]);
    dip(tank, { x: 700, y: 500 });
    const before = tank.poi.paper;
    assert.deepEqual(lift(tank), []);
    assert.deepEqual(tank.caught, []);
    assert.ok(before - tank.poi.paper < 0.01);
  });

  it("too heavy a load tears the paper and every fish drops back", () => {
    const tank = tankWith([]);
    dip(tank, { x: 500, y: 500 });
    tank.fish = Array.from({ length: 6 }, (_, i) =>
      still("wakin", 500 + i, 500)
    );
    const [outcome] = lift(tank);
    assert.equal(outcome.type, "tear");
    assert.equal(outcome.fish.length, 6);
    assert.deepEqual(tank.caught, []);
    assert.equal(tank.poi.torn, true);
  });

  it("a worn poi can no longer hold the old boss", () => {
    const fresh = tankWith([]);
    dip(fresh, { x: 500, y: 500 });
    fresh.fish = [still("nushi", 500, 500)];
    assert.equal(lift(fresh)[0].type, "scoop");
    const worn = tankWith([]);
    worn.poi.paper = 0.5;
    dip(worn, { x: 500, y: 500 });
    worn.fish = [still("nushi", 500, 500)];
    assert.equal(lift(worn)[0].type, "tear");
  });

  it("a fast sweep through the water wears the paper far more than a slow glide", () => {
    const slow = sweep(2);
    const fast = sweep(0.2);
    assert.ok(fast > slow * 20, `fast ${fast}, slow ${slow}`);
  });

  it("a hand trembling on the spot barely wears the paper, however often the screen samples it", () => {
    const slow = trembled(60);
    const fast = trembled(240);
    assert.ok(slow < 0.01, `60Hz wore ${slow}`);
    assert.ok(fast < 0.01, `240Hz wore ${fast}`);
  });

  it("leaving the poi in the water soaks it through in the end", () => {
    const tank = tankWith([]);
    dip(tank, { x: 500, y: 300 });
    let seconds = 0;

    while (!tank.poi.torn && seconds < 300) {
      step(tank, DT);
      seconds += DT;
    }

    assert.equal(tank.poi.torn, true);
    assert.ok(seconds > 60);
  });

  it("a torn poi takes no more dips", () => {
    const tank = tankWith([]);
    tank.poi.torn = true;
    assert.deepEqual(dip(tank, { x: 500, y: 500 }), []);
    assert.equal(tank.poi.down, false);
  });
});

describe("the fish", () => {
  it("stay in the water and never bunch up in one spot", () => {
    const tank = createTank(seeded(11));

    for (let i = 0; i < 60 * 60; i += 1) {
      step(tank, DT);

      for (const fish of tank.fish) {
        assert.ok(fish.x >= WATER.left && fish.x <= WATER.right);
        assert.ok(fish.y >= WATER.top && fish.y <= WATER.bottom);
      }

      const spots = new Set(
        tank.fish.map((fish) => `${Math.round(fish.x)},${Math.round(fish.y)}`)
      );

      assert.equal(spots.size, tank.fish.length);
    }
  });

  it("dipping ahead of a goldfish and following it catches far more than tapping on the fish", () => {
    const seeds = [13, 29, 71, 103, 211, 307];
    const taps = mean(seeds.map((seed) => tapping(seed)));
    const ahead = mean(seeds.map((seed) => leading(seed)));
    assert.ok(taps <= 1, `taps ${taps}`);
    assert.ok(ahead >= 10, `ahead ${ahead}`);
  });
});
