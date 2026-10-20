export const skies = ["dusk", "dawn", "night"] as const;
export type Sky = (typeof skies)[number];

export const boosts = ["duck", "rock", "fish", "lotus"] as const;
export type Boost = (typeof boosts)[number];
export type Event = Boost | "wall";

export const endings = ["plop", "sink", "leaf"] as const;
export type Ending = (typeof endings)[number];

export type Grade = "perfect" | "good" | "early" | "miss";

export type Coast = "village" | "bamboo" | "maple" | "town" | "sea";

export interface Zone {
  from: number;
  name: string;
  coast: Coast;
}

export const zones: Zone[] = [
  { coast: "village", from: 0, name: "里の川" },
  { coast: "bamboo", from: 500, name: "竹林" },
  { coast: "maple", from: 2000, name: "紅葉の渓谷" },
  { coast: "town", from: 8000, name: "城下町" },
  { coast: "sea", from: 30_000, name: "大海原" },
];

export const zoneIndex = (z: number) =>
  Math.max(
    0,
    zones.findLastIndex((zone) => z >= zone.from)
  );

export const shoreAt = (river: River, z: number) =>
  zones[zoneIndex(z)]?.coast === "sea" ? 40 : river.shore;

export interface Vec {
  x: number;
  y: number;
  z: number;
}
export interface Prop {
  kind: "duck" | "leaf" | "rock" | "lotus";
  x: number;
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
  focus: number;
}
export interface ThrowInput {
  speed: number;
  tilt: number;
  aim: number;
}
export interface Splash {
  time: number;
  x: number;
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
}

const GRAVITY = 9.81;
const LAUNCH = 0.12;
const HAND: Vec = { x: 0, y: 1, z: 0 };
const STEP = 1 / 120;
const SEGMENT = 30;
const SINK = 3;
const MODULUS = 2_147_483_647;
const BODY = {
  duck: { height: 0.4, radius: 0.45, push: 1.3, rise: 4 },
  rock: { height: 0.5, radius: 0.6, push: 1.5, rise: 6.5 },
};

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
  const add = (kind: Prop["kind"], x: number, z: number) => {
    if (z > 8) {
      props.push({ kind, turn: random() * Math.PI * 2, x, z });
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

interface Traits {
  speed: number;
  keep: number;
  lift: number;
  focus: number;
  impact: number;
}

const FORMS = new Map<string, Traits>([
  ["oval", { focus: 1, impact: 1, keep: 0, lift: 1, speed: 1 }],
  ["round", { focus: 1.2, impact: 1, keep: -0.02, lift: 1.25, speed: 0.95 }],
  ["flat", { focus: 0.9, impact: 0.85, keep: 0.025, lift: 0.8, speed: 1.08 }],
  ["heart", { focus: 1.1, impact: 1.6, keep: -0.01, lift: 1.05, speed: 0.92 }],
]);

const traitsOf = (form: string): Traits =>
  FORMS.get(form) ?? { focus: 1, impact: 1, keep: 0, lift: 1, speed: 1 };

const span = (value: number, low: number, high: number) =>
  Math.min(1, Math.max(0, (value - low) / (high - low)));

export const statsOf = (gear: Gear, form: string) => {
  const traits = traitsOf(form);
  return {
    focus: span(
      (0.06 + 0.06 * (1 - 0.9 ** gear.focus)) * traits.focus,
      0.04,
      0.15
    ),
    impact: span(traits.impact, 0.6, 1.8),
    keep: span(
      0.86 + 0.06 * (1 - 0.88 ** gear.stone) + traits.keep,
      0.82,
      0.95
    ),
    lift: span(traits.lift, 0.6, 1.4),
    speed: span((1 + 0.15 * gear.power) * traits.speed, 0.8, 3.2),
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

const contact = (hop: Hop, prop: Prop) => {
  if (prop.kind !== "duck" && prop.kind !== "rock") {
    return null;
  }
  const body = BODY[prop.kind];
  for (let t = 0; t < hop.end - hop.start; t += STEP) {
    const p = positionIn(hop, t);
    if (
      p.y < body.height &&
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

const capped = (flight: Flight, speed: number) =>
  Math.min(speed, flight.top * 1.6);

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
  let struck: { prop: Prop; t: number } | null = null;
  for (const prop of propsIn(flight.river, from.z - 1, reach + 1)) {
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
  const { prop, t } = struck;
  const kind = prop.kind === "rock" ? "rock" : "duck";
  const body = BODY[kind];
  hop.end = start + t;
  flight.hops.push(hop);
  const at = positionIn(hop, t);
  flight.bumps.push({ at, kind, prop, time: hop.end });
  flight.splashes.push({
    big: false,
    combo: flight.combo,
    event: kind,
    grade: null,
    time: hop.end,
    x: at.x,
    z: at.z,
  });
  const speed = Math.hypot(velocity.x, velocity.z);
  const push = 1 + (body.push - 1) * flight.impact;
  const scale = capped(flight, speed * push) / speed;
  fly(
    flight,
    at,
    { x: velocity.x * scale, y: body.rise, z: velocity.z * scale },
    hop.end
  );
};

export const launch = (
  river: River,
  input: ThrowInput,
  gear: Gear,
  form = "oval"
): Flight => {
  const traits = traitsOf(form);
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
    keep: 0.8 + 0.06 * hold + 0.06 * (1 - 0.88 ** gear.stone) + traits.keep,
    lift: (0.04 + 0.0035 * Math.max(0, input.tilt)) * traits.lift,
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
  return {
    good: (0.18 + 0.1 * (1 - 0.9 ** flight.focus)) / shrink,
    perfect: (0.06 + 0.06 * (1 - 0.9 ** flight.focus)) / shrink,
  };
};

export const nextContact = (flight: Flight) =>
  flight.ending === null ? (flight.hops.at(-1)?.end ?? null) : null;

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

const GAIN: Record<Grade, (flight: Flight, speed: number) => number> = {
  early: (flight) => flight.keep,
  good: (flight) => Math.min(0.97, flight.keep + 0.06),
  miss: (flight) => flight.keep,
  perfect: (flight, speed) => (speed < flight.top ? 1.05 : 1),
};

export const land = (flight: Flight, tapAt: number | null) => {
  const hop = flight.hops.at(-1);
  if (hop === undefined || flight.ending !== null) {
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
      z: at.z,
    });
    finish(flight, flight.skips === 0 ? "plop" : "sink", at, null);
    return;
  }

  const grade = gradeFor(flight, tapAt, time);
  const carp = !lotus && flight.skips >= 5 && roll(flight) < 0.02;
  flight.skips += 1;
  flight.combo = grade === "perfect" || grade === "good" ? flight.combo + 1 : 0;
  flight.bestCombo = Math.max(flight.bestCombo, flight.combo);
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
    z: at.z,
  });
  if (carp) {
    flight.bumps.push({ at, kind: "fish", prop: null, time });
  }

  let factor = GAIN[grade](flight, speed);
  let rise = 1;
  if (lotus) {
    factor *= 1.2;
    rise = 2.4;
  } else if (carp) {
    factor *= 1.4;
    rise = 3;
  }
  const forward = capped(
    flight,
    speed * factor * (1 + (roll(flight) - 0.5) * 0.04)
  );
  const scale = forward / speed;
  fly(
    flight,
    at,
    {
      x: hop.velocity.x * scale,
      y:
        Math.min(4.5, forward * flight.lift) *
        rise *
        (1 + (roll(flight) - 0.5) * 0.2),
      z: hop.velocity.z * scale,
    },
    time
  );
};

export const speedAt = (flight: Flight, time: number) => {
  const hop = flight.hops.find((h) => time < h.end) ?? flight.hops.at(-1);
  return hop === undefined ? 0 : Math.hypot(hop.velocity.x, hop.velocity.z);
};

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
