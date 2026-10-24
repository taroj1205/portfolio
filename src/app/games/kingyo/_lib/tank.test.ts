import assert from "node:assert/strict";

import { describe, test } from "vite-plus/test";

import { seeded } from "../../_lib/svg";
import type { KindId } from "./fish";
import { POI, STOCK, WATER, createTank, dip, drag, lift, step } from "./tank";
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
  x,
  y,
});

const tankWith = (fish: Fish[]) => {
  const tank = createTank(seeded(7));
  tank.fish = fish;
  return tank;
};

const play = (seed: number, chase: number) => {
  const tank = createTank(seeded(seed));
  let time = 0;
  const wait = () => {
    step(tank, DT);
    return DT;
  };
  while (!tank.poi.torn && time < 900) {
    const calm = tank.fish.filter((fish) => fish.fright === 0);
    const [target] = (calm.length > 0 ? calm : tank.fish).toSorted(
      (a, b) =>
        Math.hypot(a.x - tank.poi.x, a.y - tank.poi.y) -
        Math.hypot(b.x - tank.poi.x, b.y - tank.poi.y)
    );
    for (let i = 0; i < 20; i += 1) {
      time += wait();
    }
    dip(tank, {
      x: target.x + Math.cos(target.heading) * target.speed * 1.8,
      y: target.y + Math.sin(target.heading) * target.speed * 1.8,
    });
    let waited = 0;
    let seen = -1;
    while (!tank.poi.torn && waited < 4) {
      time += wait();
      waited += DT;
      const gap = Math.hypot(target.x - tank.poi.x, target.y - tank.poi.y);
      if (gap > 1 && tank.fish.includes(target)) {
        const k = Math.min(1, (chase * DT) / gap);
        drag(
          tank,
          {
            x: tank.poi.x + (target.x - tank.poi.x) * k,
            y: tank.poi.y + (target.y - tank.poi.y) * k,
          },
          DT
        );
      }
      const over = tank.fish.some(
        (fish) =>
          Math.hypot(fish.x - tank.poi.x, fish.y - tank.poi.y) < POI.reach * 0.8
      );
      if (over && seen < 0) {
        seen = waited;
      }
      if (seen >= 0 && waited - seen >= 0.12) {
        break;
      }
    }
    lift(tank);
  }
  return tank.caught.length;
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
  for (let i = 0; i < hz * 5; i += 1) {
    drag(
      tank,
      { x: 500 + (random() - 0.5) * 6, y: 500 + (random() - 0.5) * 6 },
      1 / hz
    );
  }
  return 1 - tank.poi.paper;
};

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

describe("scooping", () => {
  test("lifting under a fish puts it in the bowl and the stall tops the tank up", () => {
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

  test("an empty lift catches nothing and costs a little paper", () => {
    const tank = tankWith([still("wakin", 200, 200)]);
    dip(tank, { x: 700, y: 500 });
    assert.deepEqual(lift(tank), []);
    assert.deepEqual(tank.caught, []);
    assert.ok(tank.poi.paper > 0.97);
  });

  test("too heavy a load tears the paper and every fish drops back", () => {
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

  test("a worn poi can no longer hold the old boss", () => {
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

  test("a fish splashed by the dip wriggles off a quick lift, but one that swims in stays", () => {
    const splashed = tankWith([still("wakin", 500, 500)]);
    dip(splashed, { x: 500, y: 500 });
    const [outcome] = lift(splashed);
    assert.equal(outcome.type, "slip");
    assert.deepEqual(splashed.caught, []);
    assert.equal(splashed.poi.down, false);
    const patient = tankWith([still("wakin", 500, 700)]);
    dip(patient, { x: 500, y: 500 });
    patient.fish[0].y = 500;
    assert.equal(lift(patient)[0].type, "scoop");
    assert.deepEqual(patient.caught, ["wakin"]);
  });

  test("a fast sweep through the water wears the paper far more than a slow glide", () => {
    const slow = sweep(2);
    const fast = sweep(0.2);
    assert.ok(fast > slow * 20, `fast ${fast}, slow ${slow}`);
  });

  test("a hand trembling on the spot barely wears the paper, however often the screen samples it", () => {
    const slow = trembled(60);
    const fast = trembled(240);
    assert.ok(slow < 0.02, `60Hz wore ${slow}`);
    assert.ok(fast < 0.02, `240Hz wore ${fast}`);
  });

  test("leaving the poi in the water soaks it through in the end", () => {
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

  test("a torn poi takes no more dips", () => {
    const tank = tankWith([]);
    tank.poi.torn = true;
    assert.deepEqual(dip(tank, { x: 500, y: 500 }), []);
    assert.equal(tank.poi.down, false);
  });
});

describe("the fish", () => {
  test("stay in the water and never bunch up in one spot", () => {
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

  test("careful scooping catches many more than rushing the poi around", () => {
    const seeds = [13, 29, 71, 103, 211, 307];
    const careful = mean(seeds.map((seed) => play(seed, 60)));
    const rushed = mean(seeds.map((seed) => play(seed, 220)));
    assert.ok(careful >= 8, `careful ${careful}`);
    assert.ok(rushed <= 3, `rushed ${rushed}`);
  });
});
