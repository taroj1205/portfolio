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

const mean = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

describe("scooping", () => {
  test("lifting under a fish puts it in the bowl and the stall tops the tank up", () => {
    const tank = tankWith([still("ogon", 500, 500)]);
    assert.deepEqual(dip(tank, { x: 500, y: 500 }), []);
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
    const tank = tankWith(
      Array.from({ length: 6 }, (_, i) => still("wakin", 500 + i, 500))
    );
    dip(tank, { x: 500, y: 500 });
    const [outcome] = lift(tank);
    assert.equal(outcome.type, "tear");
    assert.equal(outcome.fish.length, 6);
    assert.deepEqual(tank.caught, []);
    assert.equal(tank.poi.torn, true);
  });

  test("a worn poi can no longer hold the old boss", () => {
    const fresh = tankWith([still("nushi", 500, 500)]);
    dip(fresh, { x: 500, y: 500 });
    assert.equal(lift(fresh)[0].type, "scoop");
    const worn = tankWith([still("nushi", 500, 500)]);
    worn.poi.paper = 0.5;
    dip(worn, { x: 500, y: 500 });
    assert.equal(lift(worn)[0].type, "tear");
  });

  test("a fast sweep through the water wears the paper far more than a slow glide", () => {
    const slow = tankWith([]);
    dip(slow, { x: 300, y: 500 });
    drag(slow, { x: 400, y: 500 }, 1);
    const fast = tankWith([]);
    dip(fast, { x: 300, y: 500 });
    drag(fast, { x: 400, y: 500 }, 0.1);
    assert.ok(1 - fast.poi.paper > (1 - slow.poi.paper) * 20);
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
