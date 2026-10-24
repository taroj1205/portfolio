import type { Point } from "../../_lib/svg";
import { kinds, pickKind } from "./fish";
import type { KindId } from "./fish";

export const WATER = { bottom: 936, left: 64, right: 936, top: 64 } as const;
export const POI = { reach: 70, ring: 92, r: 80 } as const;
export const STOCK = 13;
export const MOST = 999;

const PAPER = {
  capacity: 4,
  dip: 0.008,
  empty: 0.006,
  grace: 0.6,
  lift: 0.014,
  load: 0.024,
  snap: 0.12,
  soak: 0.01,
  wear: 2.4,
  wearFrom: 70,
  wearScale: 700,
};

const STEADY = 0.08;

const SWIM = {
  cruise: 62,
  dash: 330,
  fright: 0.75,
  margin: 96,
  spook: 150,
  splash: 150,
};

export interface Fish {
  kind: KindId;
  x: number;
  y: number;
  heading: number;
  speed: number;
  turn: number;
  phase: number;
  fright: number;
  age: number;
}

interface Poi {
  x: number;
  y: number;
  down: boolean;
  paper: number;
  torn: boolean;
  flow: Point;
}

export interface Tank {
  fish: Fish[];
  poi: Poi;
  caught: KindId[];
  scoops: number;
  biggest: number;
  random: () => number;
}

export interface Outcome {
  type: "scoop" | "slip" | "tear";
  fish: Fish[];
  at: Point;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

const wrap = (angle: number) => Math.atan2(Math.sin(angle), Math.cos(angle));

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

const inWater = ({ x, y }: Point): Point => ({
  x: clamp(x, WATER.left, WATER.right),
  y: clamp(y, WATER.top, WATER.bottom),
});

const waryOf = (tank: Tank) => Math.min(1, tank.caught.length / 25);

const spawn = (tank: Tank, away: Point | null, age: number): Fish => {
  const { random } = tank;
  const bossAround = tank.fish.some((fish) => fish.kind === "nushi");
  const kind = pickKind(random, tank.caught.length, bossAround);
  let at: Point = { x: 500, y: 500 };
  for (let tries = 0; tries < 40; tries += 1) {
    at = {
      x: WATER.left + 60 + random() * (WATER.right - WATER.left - 120),
      y: WATER.top + 60 + random() * (WATER.bottom - WATER.top - 120),
    };
    if (away === null || distance(at, away) > 260) {
      break;
    }
  }
  return {
    age,
    fright: 0,
    heading: random() * Math.PI * 2,
    kind,
    phase: random() * 10,
    speed: SWIM.cruise * kinds[kind].speed,
    turn: 0,
    x: at.x,
    y: at.y,
  };
};

const restock = (tank: Tank, away: Point | null, age: number) => {
  while (tank.fish.length < STOCK) {
    tank.fish.push(spawn(tank, away, age));
  }
};

export const createTank = (random: () => number): Tank => {
  const tank: Tank = {
    biggest: 0,
    caught: [],
    fish: [],
    poi: {
      down: false,
      flow: { x: 0, y: 0 },
      paper: 1,
      torn: false,
      x: 500,
      y: 640,
    },
    random,
    scoops: 0,
  };
  restock(tank, null, 10);
  return tank;
};

const scare = (tank: Tank, at: Point, radius: number) => {
  for (const fish of tank.fish) {
    const gap = distance(fish, at);
    if (gap < radius) {
      fish.heading =
        Math.atan2(fish.y - at.y, fish.x - at.x) + (tank.random() - 0.5) * 0.8;
      fish.fright = SWIM.fright * (1 - gap / radius / 2);
    }
  }
};

const inside = (tank: Tank) =>
  tank.fish.filter((fish) => distance(fish, tank.poi) < POI.reach);

const tear = (tank: Tank): Outcome => {
  const fish = inside(tank);
  tank.poi.torn = true;
  tank.poi.down = false;
  tank.poi.paper = 0;
  scare(tank, tank.poi, SWIM.splash);
  return { at: { x: tank.poi.x, y: tank.poi.y }, fish, type: "tear" };
};

const wear = (tank: Tank, amount: number): Outcome[] => {
  tank.poi.paper = Math.max(0, tank.poi.paper - amount);
  return tank.poi.paper <= 0 ? [tear(tank)] : [];
};

export const hover = (tank: Tank, at: Point) => {
  if (!tank.poi.down && !tank.poi.torn) {
    Object.assign(tank.poi, inWater(at));
  }
};

export const dip = (tank: Tank, at: Point): Outcome[] => {
  const { poi } = tank;
  if (poi.down || poi.torn) {
    return [];
  }
  Object.assign(poi, inWater(at), { down: true, flow: { x: 0, y: 0 } });
  scare(tank, poi, SWIM.splash * 0.55);
  return wear(tank, PAPER.dip);
};

export const drag = (tank: Tank, at: Point, seconds: number): Outcome[] => {
  const { poi } = tank;
  if (!poi.down || poi.torn) {
    hover(tank, at);
    return [];
  }
  const to = inWater(at);
  if (seconds <= 0) {
    Object.assign(poi, to);
    return [];
  }
  const k = 1 - Math.exp(-seconds / STEADY);
  poi.flow = {
    x: poi.flow.x + ((to.x - poi.x) / seconds - poi.flow.x) * k,
    y: poi.flow.y + ((to.y - poi.y) / seconds - poi.flow.y) * k,
  };
  Object.assign(poi, to);
  const speed = Math.hypot(poi.flow.x, poi.flow.y);
  const spook = SWIM.spook * (1 - waryOf(tank) * 0.5);
  if (speed > spook) {
    scare(tank, poi, POI.ring + Math.min(160, speed * 0.25));
  }
  const over = Math.max(0, speed - PAPER.wearFrom) / PAPER.wearScale;
  return wear(tank, over * over * PAPER.wear * seconds);
};

const capacityOf = (paper: number) => paper * PAPER.capacity + PAPER.grace;

const loadOf = (fish: readonly Fish[]) =>
  fish.reduce((sum, each) => sum + kinds[each.kind].weight, 0);

export const lift = (tank: Tank): Outcome[] => {
  const { poi } = tank;
  if (!poi.down || poi.torn) {
    return [];
  }
  const over = inside(tank);
  const fish = over.filter((each) => each.fright === 0);
  if (fish.length === 0) {
    poi.down = false;
    if (over.length === 0) {
      return wear(tank, PAPER.empty);
    }
    scare(tank, poi, POI.ring);
    const slipped: Outcome = {
      at: { x: poi.x, y: poi.y },
      fish: over,
      type: "slip",
    };
    return [slipped, ...wear(tank, PAPER.empty)];
  }
  const load = loadOf(fish);
  if (load > capacityOf(poi.paper)) {
    return [tear(tank)];
  }
  poi.down = false;
  const room = MOST - tank.caught.length;
  const kept = fish.slice(0, Math.max(0, room));
  tank.fish = tank.fish.filter((each) => !fish.includes(each));
  tank.caught.push(...kept.map((each) => each.kind));
  tank.scoops += 1;
  tank.biggest = Math.max(tank.biggest, kept.length);
  restock(tank, poi, 0);
  const scooped: Outcome = {
    at: { x: poi.x, y: poi.y },
    fish: kept,
    type: "scoop",
  };
  return [scooped, ...wear(tank, PAPER.lift + load * PAPER.load)];
};

export const snap = (tank: Tank, at: Point): Outcome[] => {
  const { poi } = tank;
  if (poi.down || poi.torn) {
    return [];
  }
  Object.assign(poi, inWater(at), { down: true, flow: { x: 0, y: 0 } });
  const torn = wear(tank, PAPER.snap);
  return torn.length > 0 ? torn : lift(tank);
};

const steerOf = (tank: Tank, fish: Fish, wary: number) => {
  const ahead = {
    x: fish.x + Math.cos(fish.heading) * SWIM.margin,
    y: fish.y + Math.sin(fish.heading) * SWIM.margin,
  };
  let steer = fish.turn;
  const outside =
    ahead.x < WATER.left + 30 ||
    ahead.x > WATER.right - 30 ||
    ahead.y < WATER.top + 30 ||
    ahead.y > WATER.bottom - 30;
  if (outside) {
    steer += wrap(Math.atan2(500 - fish.y, 500 - fish.x) - fish.heading) * 3.2;
  }
  const { poi } = tank;
  if (poi.down && wary > 0 && distance(ahead, poi) < POI.ring + 50 * wary) {
    steer +=
      wrap(Math.atan2(fish.y - poi.y, fish.x - poi.x) - fish.heading) *
      2.4 *
      wary;
  }
  for (const other of tank.fish) {
    if (other !== fish && distance(other, fish) < 46) {
      steer +=
        wrap(Math.atan2(fish.y - other.y, fish.x - other.x) - fish.heading) *
        0.8;
    }
  }
  return steer;
};

const swim = (tank: Tank, fish: Fish, dt: number, wary: number) => {
  const kind = kinds[fish.kind];
  fish.turn = clamp(
    fish.turn * (1 - 0.6 * dt) + (tank.random() - 0.5) * 7 * dt,
    -1.6,
    1.6
  );
  fish.heading = wrap(fish.heading + steerOf(tank, fish, wary) * dt);
  const target = (fish.fright > 0 ? SWIM.dash : SWIM.cruise) * kind.speed;
  fish.speed += (target - fish.speed) * Math.min(1, 3 * dt);
  fish.x = clamp(
    fish.x + Math.cos(fish.heading) * fish.speed * dt,
    WATER.left + 18,
    WATER.right - 18
  );
  fish.y = clamp(
    fish.y + Math.sin(fish.heading) * fish.speed * dt,
    WATER.top + 18,
    WATER.bottom - 18
  );
  fish.phase += dt * (5 + fish.speed / 18);
  fish.fright = Math.max(0, fish.fright - dt);
  fish.age += dt;
};

export const step = (tank: Tank, dt: number): Outcome[] => {
  const wary = waryOf(tank);
  for (const fish of tank.fish) {
    swim(tank, fish, dt, wary);
  }
  return tank.poi.down ? wear(tank, PAPER.soak * dt) : [];
};
