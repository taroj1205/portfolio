import { TOP, kindOf } from "./bodies";

export const LIMIT = 1;
export const TICK = 1 / 120;
export const GRACE = 2;
export const DROPPABLE = 5;
export const COOLDOWN = 0.5;

const GRAVITY = 2.6;
const CORE = 0.18;
const DRAG = 1.1;
const CORE_DRAG = 12;
const CONTACT_DRAG = 3.5;
const MAX_SPEED = 2.4;
const PASSES = 4;
const TOUCH = 0.002;
const DROP_SPEED = 0.5;
const FALL_LIMIT = 1.6;
const CHAIN_WINDOW = 1;

export interface Orb {
  id: number;
  tier: number;
  x: number;
  y: number;
  px: number;
  py: number;
  vx: number;
  vy: number;
  spin: number;
  tilt: number;
  born: number;
  chain: number;
  falling: boolean;
  outside: number;
}

export interface Merge {
  made: number | null;
  from: number;
  chain: number;
  points: number;
  x: number;
  y: number;
}

export interface World {
  orbs: Orb[];
  queue: [number, number];
  rng: number;
  time: number;
  ready: number;
  score: number;
  merges: number;
  chain: number;
  top: number;
  galaxies: number;
  drops: number;
  danger: number;
  over: boolean;
  nextId: number;
}

const MODULUS = 2_147_483_647;

const roll = (world: World) => {
  world.rng = (world.rng * 48_271) % MODULUS;
  return (world.rng - 1) / (MODULUS - 1);
};

const pick = (world: World) => Math.floor(roll(world) * DROPPABLE);

export const launchRadius = (tier: number) =>
  LIMIT + 0.06 + kindOf(tier).radius;

export const pointsFor = (from: number) => ((from + 1) * (from + 2)) / 2;

const mass = (orb: Orb) => kindOf(orb.tier).radius ** 2;

export const createWorld = (seed: number): World => {
  const world: World = {
    chain: 0,
    danger: 0,
    drops: 0,
    galaxies: 0,
    merges: 0,
    nextId: 1,
    orbs: [],
    over: false,
    queue: [0, 0],
    ready: 0,
    rng: (Math.abs(Math.floor(seed)) % (MODULUS - 1)) + 1,
    score: 0,
    time: 0,
    top: -1,
  };
  world.queue = [pick(world), pick(world)];
  return world;
};

const make = (
  world: World,
  tier: number,
  at: { x: number; y: number; vx: number; vy: number }
): Orb => {
  const orb: Orb = {
    ...at,
    born: world.time,
    chain: 0,
    falling: false,
    id: world.nextId,
    outside: 0,
    px: at.x,
    py: at.y,
    spin: roll(world) * Math.PI * 2,
    tier,
    tilt: (roll(world) - 0.5) * 0.9,
  };
  world.nextId += 1;
  world.top = Math.max(world.top, tier);
  return orb;
};

export const canDrop = (world: World) =>
  !world.over && world.time >= world.ready;

export const drop = (world: World, angle: number) => {
  if (!canDrop(world)) {
    return null;
  }
  const [tier, next] = world.queue;
  world.queue = [next, pick(world)];
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const reach = launchRadius(tier);
  const orb = make(world, tier, {
    vx: -dx * DROP_SPEED,
    vy: -dy * DROP_SPEED,
    x: dx * reach,
    y: dy * reach,
  });
  orb.falling = true;
  world.orbs.push(orb);
  world.ready = world.time + COOLDOWN;
  world.drops += 1;
  return orb;
};

const fresh = (world: World, orb: Orb) =>
  orb.chain > 0 && world.time - orb.born < CHAIN_WINDOW;

// ponytail: O(n²) pair scans; fine for the ~100 orbs a full arena holds, add a grid if that grows.
const fuse = (world: World) => {
  const { orbs } = world;
  const gone = new Set<Orb>();
  const born: Orb[] = [];
  const merges: Merge[] = [];
  for (let i = 0; i < orbs.length; i += 1) {
    const a = orbs[i];
    if (a === undefined || gone.has(a)) {
      continue;
    }
    for (let j = i + 1; j < orbs.length; j += 1) {
      const b = orbs[j];
      if (b === undefined || b.tier !== a.tier || gone.has(b)) {
        continue;
      }
      const reach = kindOf(a.tier).radius * 2 + TOUCH;
      if ((b.x - a.x) ** 2 + (b.y - a.y) ** 2 > reach * reach) {
        continue;
      }
      gone.add(a);
      gone.add(b);
      const chain =
        fresh(world, a) || fresh(world, b) ? Math.max(a.chain, b.chain) + 1 : 1;
      const points = pointsFor(a.tier) * chain;
      const x = (a.x + b.x) / 2;
      const y = (a.y + b.y) / 2;
      world.score += points;
      world.merges += 1;
      world.chain = Math.max(world.chain, chain);
      if (a.tier === TOP) {
        world.galaxies += 1;
        merges.push({ chain, from: a.tier, made: null, points, x, y });
        break;
      }
      const orb = make(world, a.tier + 1, {
        vx: (a.vx + b.vx) / 2,
        vy: (a.vy + b.vy) / 2,
        x,
        y,
      });
      orb.chain = chain;
      born.push(orb);
      merges.push({ chain, from: a.tier, made: orb.tier, points, x, y });
      break;
    }
  }
  if (gone.size > 0) {
    world.orbs = [...orbs.filter((orb) => !gone.has(orb)), ...born];
  }
  return merges;
};

const integrate = (world: World) => {
  for (const orb of world.orbs) {
    const d = Math.hypot(orb.x, orb.y);
    const pull = GRAVITY / Math.max(d, CORE);
    const drag = Math.exp(
      -(DRAG + CORE_DRAG * Math.max(0, 1 - d / CORE)) * TICK
    );
    orb.vx = (orb.vx - orb.x * pull * TICK) * drag;
    orb.vy = (orb.vy - orb.y * pull * TICK) * drag;
    orb.px = orb.x;
    orb.py = orb.y;
    orb.x += orb.vx * TICK;
    orb.y += orb.vy * TICK;
  }
};

const separate = (orbs: Orb[], touching: Set<Orb>) => {
  for (let i = 0; i < orbs.length; i += 1) {
    const a = orbs[i];
    if (a === undefined) {
      continue;
    }
    const ra = kindOf(a.tier).radius;
    for (let j = i + 1; j < orbs.length; j += 1) {
      const b = orbs[j];
      if (b === undefined) {
        continue;
      }
      const gap = ra + kindOf(b.tier).radius;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy;
      if (d2 >= gap * gap) {
        continue;
      }
      const d = Math.sqrt(d2);
      const nx = d > 1e-6 ? dx / d : 1;
      const ny = d > 1e-6 ? dy / d : 0;
      const wa = 1 / mass(a);
      const wb = 1 / mass(b);
      const share = (gap - d) / (wa + wb);
      a.x -= nx * share * wa;
      a.y -= ny * share * wa;
      b.x += nx * share * wb;
      b.y += ny * share * wb;
      touching.add(a);
      touching.add(b);
    }
  }
};

const solve = (world: World) => {
  const touching = new Set<Orb>();
  for (let pass = 0; pass < PASSES; pass += 1) {
    separate(world.orbs, touching);
  }
  const grip = Math.exp(-CONTACT_DRAG * TICK);
  const landed: Orb[] = [];
  for (const orb of world.orbs) {
    orb.vx = (orb.x - orb.px) / TICK;
    orb.vy = (orb.y - orb.py) / TICK;
    const speed = Math.hypot(orb.vx, orb.vy);
    if (speed > MAX_SPEED) {
      orb.vx *= MAX_SPEED / speed;
      orb.vy *= MAX_SPEED / speed;
    }
    if (touching.has(orb)) {
      orb.vx *= grip;
      orb.vy *= grip;
      if (orb.falling) {
        orb.falling = false;
        landed.push(orb);
      }
    }
    const d = Math.max(Math.hypot(orb.x, orb.y), 1e-6);
    const around = (orb.x * orb.vy - orb.y * orb.vx) / d;
    orb.spin += (around / kindOf(orb.tier).radius) * 0.8 * TICK;
  }
  return landed;
};

const watch = (world: World) => {
  let worst = 0;
  for (const orb of world.orbs) {
    if (orb.falling && world.time - orb.born > FALL_LIMIT) {
      orb.falling = false;
    }
    const out = Math.hypot(orb.x, orb.y) + kindOf(orb.tier).radius > LIMIT;
    orb.outside = !orb.falling && out ? orb.outside + TICK : 0;
    worst = Math.max(worst, orb.outside);
  }
  world.danger = Math.min(1, worst / GRACE);
  if (worst >= GRACE) {
    world.over = true;
  }
};

export const step = (world: World) => {
  const merges = world.over ? [] : fuse(world);
  integrate(world);
  const landed = solve(world);
  if (!world.over) {
    watch(world);
  }
  world.time += TICK;
  return { landed, merges };
};
