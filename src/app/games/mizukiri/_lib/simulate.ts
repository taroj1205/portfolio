import type { Text } from "../../_lib/i18n";

export const skies = ["dusk", "dawn", "night"] as const;
export type Sky = (typeof skies)[number];

export const boosts = ["duck", "rock", "fish", "lotus", "dragonfly"] as const;
export type Boost = (typeof boosts)[number];
export const events = [...boosts, "wall"] as const;
export type Event = (typeof events)[number];

export const endings = ["plop", "sink", "leaf"] as const;
export type Ending = (typeof endings)[number];

export const grades = ["perfect", "good", "early", "miss"] as const;
export type Grade = (typeof grades)[number];

export type Coast =
  | "village"
  | "bamboo"
  | "sakura"
  | "maple"
  | "ginkgo"
  | "town"
  | "snow"
  | "firefly"
  | "sea"
  | "cloud"
  | "stars";

export interface Zone {
  from: number;
  name: Text;
  coast: Coast;
}

export const zones: Zone[] = [
  { coast: "village", from: 0, name: { en: "Village stream", ja: "里の川" } },
  { coast: "bamboo", from: 300, name: { en: "Bamboo grove", ja: "竹林" } },
  { coast: "sakura", from: 1000, name: { en: "Cherry lane", ja: "桜並木" } },
  { coast: "maple", from: 2500, name: { en: "Maple gorge", ja: "紅葉の渓谷" } },
  {
    coast: "ginkgo",
    from: 6000,
    name: { en: "Ginkgo avenue", ja: "銀杏並木" },
  },
  { coast: "town", from: 12_000, name: { en: "Castle town", ja: "城下町" } },
  { coast: "snow", from: 25_000, name: { en: "Snow village", ja: "雪の里" } },
  {
    coast: "firefly",
    from: 50_000,
    name: { en: "Firefly creek", ja: "蛍の沢" },
  },
  { coast: "sea", from: 100_000, name: { en: "Open sea", ja: "大海原" } },
  { coast: "cloud", from: 250_000, name: { en: "Sea of clouds", ja: "雲海" } },
  { coast: "stars", from: 600_000, name: { en: "Milky Way", ja: "天の川" } },
];

export const areaOf = (coast: Coast) =>
  Math.max(
    0,
    zones.findIndex((zone) => zone.coast === coast)
  );

export const openWater = (coast: Coast | undefined) =>
  coast === "sea" || coast === "cloud" || coast === "stars";

export const zoneIndex = (z: number) =>
  Math.max(
    0,
    zones.findLastIndex((zone) => z >= zone.from)
  );

export const shoreAt = (river: River, z: number) =>
  openWater(zones[zoneIndex(z)]?.coast) ? 40 : river.shore;

export interface Vec {
  x: number;
  y: number;
  z: number;
}
export interface Prop {
  kind: "duck" | "leaf" | "rock" | "lotus" | "dragonfly";
  x: number;
  y: number;
  z: number;
  turn: number;
}
export interface River {
  seed: number;
  sky: Sky;
  shore: number;
}
export interface Gear {
  power: number;
  stone: number;
  lift: number;
  focus: number;
  impact: number;
}
export interface ThrowInput {
  speed: number;
  tilt: number;
  aim: number;
}
export interface Splash {
  time: number;
  x: number;
  y: number;
  z: number;
  big: boolean;
  grade: Grade | null;
  event: Event | null;
  combo: number;
}
interface Bump {
  kind: Event;
  prop: Prop | null;
  time: number;
  at: Vec;
}

interface Hop {
  start: number;
  end: number;
  from: Vec;
  velocity: Vec;
}

export interface Flight {
  river: River;
  tilt: number;
  hops: Hop[];
  splashes: Splash[];
  bumps: Bump[];
  skips: number;
  combo: number;
  bestCombo: number;
  ending: Ending | null;
  duration: number;
  distance: number;
  rest: Vec | null;
  focus: number;
  focusScale: number;
  impact: number;
  keep: number;
  lift: number;
  quality: number;
  top: number;
  roll: number;
  pending: Solid | null;
}

const GRAVITY = 9.81;
const LAUNCH = 0.12;
const HAND: Vec = { x: 0, y: 1, z: 0 };
const STEP = 1 / 120;
const SEGMENT = 30;
const SINK = 3;
const HOP = 4.5;
const MODULUS = 2_147_483_647;
const BODY = {
  dragonfly: { half: 0.3, radius: 0.5, push: 1.25, rise: 2.5 },
  duck: { half: 0.4, radius: 0.45, push: 1.3, rise: 4 },
  rock: { half: 0.5, radius: 0.6, push: 1.5, rise: 6.5 },
};
type Solid = Prop & { kind: keyof typeof BODY };

const solid = (prop: Prop): prop is Solid => prop.kind in BODY;

export const isBounce = (event: Event | null): event is Solid["kind"] =>
  event !== null && event in BODY;

const seedOf = (seed: number) =>
  (Math.abs(Math.floor(seed)) % (MODULUS - 1)) + 1;

export const randomFrom = (seed: number) => {
  let state = seedOf(seed);
  return () => {
    state = (state * 48_271) % MODULUS;
    return (state - 1) / (MODULUS - 1);
  };
};

const roll = (flight: Flight) => {
  flight.roll = (flight.roll * 48_271) % MODULUS;
  return (flight.roll - 1) / (MODULUS - 1);
};

export const createRiver = (seed: number): River => {
  const random = randomFrom(seed);
  return {
    seed,
    shore: 6 + random() * 2,
    sky: skies[Math.floor(random() * skies.length)] ?? "dusk",
  };
};

const segmentProps = (river: River, index: number): Prop[] => {
  if (index < 0) {
    return [];
  }
  const random = randomFrom(river.seed * 31 + index * 7919 + 17);
  const lane = shoreAt(river, index * SEGMENT) - 1.2;
  const props: Prop[] = [];
  const add = (kind: Prop["kind"], x: number, z: number, y = 0) => {
    if (z > 8) {
      props.push({ kind, turn: random() * Math.PI * 2, x, y, z });
    }
  };
  const spot = (): [number, number] => [
    (random() - 0.5) * 2 * lane,
    index * SEGMENT + random() * SEGMENT,
  ];
  if (random() < 0.35) {
    add("duck", ...spot());
  }
  if (random() < 0.3) {
    add("rock", ...spot());
  }
  if (random() < 0.6) {
    const [cx, cz] = spot();
    const pads = 3 + Math.floor(random() * 4);
    for (let i = 0; i < pads; i += 1) {
      add("lotus", cx + (random() - 0.5) * 3, cz + (random() - 0.5) * 3);
    }
  }
  const leaves = Math.floor(random() * 3);
  for (let i = 0; i < leaves; i += 1) {
    add("leaf", ...spot());
  }
  if (random() < 0.25) {
    add(
      "dragonfly",
      ...spot(),
      random() < 0.7 ? 0.2 + random() * 0.3 : 0.7 + random() * 0.6
    );
  }
  return props;
};

export const propsIn = (river: River, from: number, to: number) => {
  const props: Prop[] = [];
  const last = Math.floor(to / SEGMENT);
  for (let index = Math.floor(from / SEGMENT); index <= last; index += 1) {
    for (const prop of segmentProps(river, index)) {
      if (prop.z >= from && prop.z <= to) {
        props.push(prop);
      }
    }
  }
  return props;
};

export interface Traits {
  speed: number;
  keep: number;
  lift: number;
  focus: number;
  impact: number;
}

export interface Build extends Traits {
  boost: Gear;
}

export const plain: Build = {
  boost: { focus: 1, impact: 1, lift: 1, power: 1, stone: 1 },
  focus: 1,
  impact: 1,
  keep: 0,
  lift: 1,
  speed: 1,
};

const span = (value: number, low: number, high: number) =>
  Math.max(0, (value - low) / (high - low));

const earned = (points: number) =>
  0.6 * (1 - 0.9 ** points) + 2.4 * Math.log1p(points / 40);

const eased = (points: number) => {
  const total = earned(points);
  return total / (total + 1);
};

const worth = (gear: Gear, { boost }: Build): Gear => ({
  focus: gear.focus * boost.focus,
  impact: gear.impact * boost.impact,
  lift: gear.lift * boost.lift,
  power: gear.power * boost.power,
  stone: gear.stone * boost.stone,
});

const leeway = (points: number) => {
  const gained = eased(points);
  return { good: 0.22 + 0.18 * gained, perfect: 0.09 + 0.14 * gained };
};

const grit = (points: number, hold: number) =>
  0.8 + 0.06 * hold + 0.085 * eased(points);

const trained = (gear: Gear, traits: Traits): Traits => ({
  ...traits,
  impact: traits.impact * (1 + 0.6 * earned(gear.impact)),
  lift: traits.lift * (1 + 0.3 * earned(gear.lift)),
});

export const statsOf = (gear: Gear, build: Build) => {
  const points = worth(gear, build);
  const traits = trained(points, build);
  return {
    focus: span(leeway(points.focus).perfect * traits.focus, 0.01, 0.25),
    impact: span(traits.impact, 0.2, 2.2),
    keep: span(grit(points.stone, 1) + traits.keep, 0.8, 0.95),
    lift: span(traits.lift, 0.4, 1.9),
    speed: span((1 + 0.15 * points.power) * traits.speed, 0.2, 2.2),
  };
};

export const qualityOf = (input: ThrowInput) => {
  const angle = Math.exp(-(((input.tilt - 20) / 6) ** 2));
  const arm = Math.min(1, Math.max(0, (input.speed - 5) / 11)) ** 1.5;
  return Math.round(angle * arm * 100);
};

const grip = (tilt: number) => Math.exp(-(((tilt - 20) / 14) ** 2));

const positionIn = (hop: Hop, t: number): Vec => ({
  x: hop.from.x + hop.velocity.x * t,
  y: hop.from.y + hop.velocity.y * t - (GRAVITY / 2) * t * t,
  z: hop.from.z + hop.velocity.z * t,
});

const airtime = (from: Vec, velocity: Vec) =>
  (velocity.y + Math.sqrt(velocity.y ** 2 + 2 * GRAVITY * from.y)) / GRAVITY;

const bumped = (flight: Flight, prop: Prop) =>
  flight.bumps.some(
    (bump) => bump.prop?.x === prop.x && bump.prop.z === prop.z
  );

const contact = (hop: Hop, prop: Solid) => {
  const body = BODY[prop.kind];
  const { x, z } = hop.velocity;
  const along = x * x + z * z;
  const closest =
    along === 0
      ? 0
      : ((prop.x - hop.from.x) * x + (prop.z - hop.from.z) * z) / along;
  const gap = Math.hypot(
    hop.from.x + x * closest - prop.x,
    hop.from.z + z * closest - prop.z
  );
  if (gap >= body.radius) {
    return null;
  }
  const reach =
    along === 0
      ? Number.POSITIVE_INFINITY
      : Math.sqrt(body.radius ** 2 - gap ** 2) / Math.sqrt(along);
  const end = Math.min(hop.end - hop.start, closest + reach);
  const start = Math.max(0, closest - reach);
  const step = Math.min(STEP, (end - start) / 16);
  for (let t = start; t < end; t += step) {
    const p = positionIn(hop, t);
    if (
      Math.abs(p.y - prop.y) < body.half &&
      Math.hypot(p.x - prop.x, p.z - prop.z) < body.radius
    ) {
      return t;
    }
  }
  return null;
};

const near = (flight: Flight, at: Vec, kind: Prop["kind"], radius: number) =>
  propsIn(flight.river, at.z - radius, at.z + radius).find(
    (prop) =>
      prop.kind === kind && Math.hypot(at.x - prop.x, at.z - prop.z) < radius
  );

const finish = (flight: Flight, ending: Ending, at: Vec, rest: Vec | null) => {
  flight.ending = ending;
  flight.rest = rest;
  flight.duration = flight.hops.at(-1)?.end ?? 0;
  flight.distance = Math.max(0, (rest ?? at).z);
};

const WALL = 0.4;

const wallTime = (river: River, from: Vec, velocity: Vec) => {
  if (velocity.x === 0) {
    return null;
  }
  const edge = Math.sign(velocity.x) * (shoreAt(river, from.z) - WALL);
  return Math.max(0, (edge - from.x) / velocity.x);
};

const ricochet = (flight: Flight, hop: Hop, t: number) => {
  hop.end = hop.start + t;
  flight.hops.push(hop);
  const at = positionIn(hop, t);
  flight.bumps.push({ at, kind: "wall", prop: null, time: hop.end });
  flight.splashes.push({
    big: false,
    combo: flight.combo,
    event: "wall",
    grade: null,
    time: hop.end,
    x: at.x,
    y: 0,
    z: at.z,
  });
  const falling = hop.velocity.y - GRAVITY * t;
  return {
    at,
    velocity: {
      x: -hop.velocity.x * 0.6,
      y: Math.max(1.5, Math.abs(falling) * 0.5),
      z: hop.velocity.z * 0.9,
    },
  };
};

const fly = (flight: Flight, from: Vec, velocity: Vec, start: number): void => {
  const hop: Hop = {
    end: start + airtime(from, velocity),
    from,
    start,
    velocity,
  };
  const reach = from.z + velocity.z * (hop.end - start);
  const wall = wallTime(flight.river, from, velocity);
  let struck: { prop: Solid; t: number } | null = null;
  for (const prop of propsIn(flight.river, from.z - 1, reach + 1).filter(
    solid
  )) {
    const t = bumped(flight, prop) ? null : contact(hop, prop);
    if (t !== null && (struck === null || t < struck.t)) {
      struck = { prop, t };
    }
  }
  if (
    wall !== null &&
    wall < hop.end - start &&
    (struck === null || wall < struck.t)
  ) {
    const bounce = ricochet(flight, hop, wall);
    fly(flight, bounce.at, bounce.velocity, hop.end);
    return;
  }
  if (struck === null) {
    flight.hops.push(hop);
    return;
  }
  hop.end = start + struck.t;
  flight.hops.push(hop);
  flight.pending = struck.prop;
};

export const launch = (
  river: River,
  input: ThrowInput,
  base: Gear,
  build = plain
): Flight => {
  const gear = worth(base, build);
  const traits = trained(gear, build);
  const hold = grip(input.tilt);
  const quality = qualityOf(input);
  const speed =
    input.speed *
    (1 + 0.15 * gear.power) *
    traits.speed *
    (1 + 4 * (quality / 100) ** 8);
  const flight: Flight = {
    bestCombo: 0,
    bumps: [],
    combo: 0,
    distance: 0,
    duration: 0,
    ending: null,
    focus: gear.focus,
    hops: [],
    focusScale: traits.focus,
    impact: traits.impact,
    keep: grit(gear.stone, hold) + traits.keep,
    lift: (0.04 + 0.0035 * Math.max(0, input.tilt)) * traits.lift,
    pending: null,
    quality,
    rest: null,
    river,
    roll: seedOf(river.seed + 7919),
    skips: 0,
    splashes: [],
    tilt: input.tilt,
    top: 30 * (1 + 0.15 * gear.power),
  };
  fly(
    flight,
    HAND,
    {
      x: speed * Math.cos(LAUNCH) * Math.sin(input.aim),
      y: speed * Math.sin(LAUNCH),
      z: speed * Math.cos(LAUNCH) * Math.cos(input.aim),
    },
    0
  );
  return flight;
};

export const windowFor = (flight: Flight) => {
  const shrink = (1 + flight.skips * 0.06) / flight.focusScale;
  const { good, perfect } = leeway(flight.focus);
  return { good: good / shrink, perfect: perfect / shrink };
};

export const nextContact = (flight: Flight) =>
  flight.ending === null ? (flight.hops.at(-1)?.end ?? null) : null;

export const isLate = (flight: Flight, landedAt: number, time: number) => {
  const since = time - landedAt;
  const next = nextContact(flight);
  return (
    since <= windowFor(flight).good && (next === null || since <= next - time)
  );
};

const gradeFor = (flight: Flight, tapAt: number | null, time: number) => {
  if (tapAt === null) {
    return "miss";
  }
  const early = time - tapAt;
  const window = windowFor(flight);
  if (early >= 0 && early <= window.perfect) {
    return "perfect";
  }
  if (early >= 0 && early <= window.good) {
    return "good";
  }
  return "early";
};

const fade = (flight: Flight, speed: number, factor: number) =>
  factor > 1 ? 1 + (factor - 1) * Math.min(1, flight.top / speed) ** 2 : factor;

const GAIN: Record<Grade, (flight: Flight, speed: number) => number> = {
  early: (flight) => flight.keep,
  good: (flight) => Math.min(0.97, flight.keep + 0.06),
  miss: (flight) => flight.keep,
  perfect: (flight, speed) => fade(flight, speed, 1.05),
};

const rate = (flight: Flight, grade: Grade) => {
  flight.combo = grade === "perfect" || grade === "good" ? flight.combo + 1 : 0;
  flight.bestCombo = Math.max(flight.bestCombo, flight.combo);
};

const bounce = (
  flight: Flight,
  hop: Hop,
  prop: Solid,
  tapAt: number | null
) => {
  const { kind } = prop;
  const body = BODY[kind];
  const time = hop.end;
  const at = positionIn(hop, time - hop.start);
  const grade = gradeFor(flight, tapAt, time);
  rate(flight, grade);
  flight.pending = null;
  flight.bumps.push({ at, kind, prop, time });
  flight.splashes.push({
    big: false,
    combo: flight.combo,
    event: kind,
    grade,
    time,
    x: at.x,
    y: prop.y,
    z: at.z,
  });
  const speed = Math.hypot(hop.velocity.x, hop.velocity.z);
  const push =
    fade(flight, speed, 1 + (body.push - 1) * flight.impact) *
    GAIN[grade](flight, speed);
  fly(
    flight,
    at,
    { x: hop.velocity.x * push, y: body.rise, z: hop.velocity.z * push },
    time
  );
};

export const land = (flight: Flight, tapAt: number | null) => {
  const hop = flight.hops.at(-1);
  if (hop === undefined || flight.ending !== null) {
    return;
  }
  if (flight.pending !== null) {
    bounce(flight, hop, flight.pending, tapAt);
    return;
  }
  const time = hop.end;
  const at = { ...positionIn(hop, time - hop.start), y: 0 };
  const speed = Math.hypot(hop.velocity.x, hop.velocity.z);
  const lotus = near(flight, at, "lotus", 0.75) !== undefined;
  const leaf = speed < 5 ? near(flight, at, "leaf", 0.45) : undefined;

  if (leaf !== undefined) {
    finish(flight, "leaf", at, { x: leaf.x, y: 0.02, z: leaf.z });
    return;
  }
  if (!lotus && speed < SINK) {
    flight.splashes.push({
      big: true,
      combo: 0,
      event: null,
      grade: null,
      time,
      x: at.x,
      y: 0,
      z: at.z,
    });
    finish(flight, flight.skips === 0 ? "plop" : "sink", at, null);
    return;
  }

  const grade = gradeFor(flight, tapAt, time);
  const carp = !lotus && flight.skips >= 5 && roll(flight) < 0.02;
  flight.skips += 1;
  rate(flight, grade);
  let boost: Boost | null = null;
  if (lotus) {
    boost = "lotus";
  } else if (carp) {
    boost = "fish";
  }
  flight.splashes.push({
    big: false,
    combo: flight.combo,
    event: boost,
    grade,
    time,
    x: at.x,
    y: 0,
    z: at.z,
  });
  if (carp) {
    flight.bumps.push({ at, kind: "fish", prop: null, time });
  }

  let factor = GAIN[grade](flight, speed);
  let rise = 1;
  if (lotus) {
    factor *= fade(flight, speed, 1.2);
    rise = 2.4;
  } else if (carp) {
    factor *= fade(flight, speed, 1.4);
    rise = 3;
  }
  const forward = speed * factor * (1 + (roll(flight) - 0.5) * 0.04);
  const scale = forward / speed;
  fly(
    flight,
    at,
    {
      x: hop.velocity.x * scale,
      y:
        Math.min(HOP * (1 + 0.06 * flight.combo), forward * flight.lift) *
        rise *
        (1 + (roll(flight) - 0.5) * 0.2),
      z: hop.velocity.z * scale,
    },
    time
  );
};

const paceOf = (hop: Hop) => Math.hypot(hop.velocity.x, hop.velocity.z);

export const speedAt = (flight: Flight, time: number) => {
  const hop = flight.hops.find((h) => time < h.end) ?? flight.hops.at(-1);
  return hop === undefined ? 0 : paceOf(hop);
};

export const topSpeed = (flight: Flight) =>
  Math.max(0, ...flight.hops.map(paceOf));

export const stoneAt = (flight: Flight, time: number): Vec | null => {
  const hop = flight.hops.find((h) => time < h.end);
  if (hop !== undefined) {
    return positionIn(hop, Math.max(0, time - hop.start));
  }
  if (flight.ending !== null) {
    return flight.rest;
  }
  const last = flight.hops.at(-1);
  return last === undefined
    ? null
    : { ...positionIn(last, last.end - last.start), y: 0 };
};
