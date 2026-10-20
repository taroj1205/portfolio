export const skies = ["dusk", "dawn", "night"] as const;
export type Sky = (typeof skies)[number];

export const endings = [
  "plop",
  "sink",
  "duck",
  "rock",
  "leaf",
  "bank",
  "fish",
] as const;
export type Ending = (typeof endings)[number];

export interface Vec {
  x: number;
  y: number;
  z: number;
}
export interface Prop {
  kind: "duck" | "leaf" | "rock";
  x: number;
  z: number;
  turn: number;
}
export interface River {
  seed: number;
  sky: Sky;
  bank: number;
  shore: number;
  props: Prop[];
}
export interface ThrowInput {
  speed: number;
  tilt: number;
  aim: number;
}
interface Splash {
  time: number;
  x: number;
  z: number;
  big: boolean;
}

interface Hop {
  start: number;
  end: number;
  from: Vec;
  velocity: Vec;
}

export interface Throw {
  hops: Hop[];
  splashes: Splash[];
  skips: number;
  distance: number;
  ending: Ending;
  duration: number;
  hit: { prop: number | null; time: number; at: Vec } | null;
  rest: Vec | null;
}

const GRAVITY = 9.81;
const LAUNCH = 0.12;
const HAND: Vec = { x: 0, y: 1, z: 0 };
const STEP = 1 / 120;
const BODY = {
  duck: { radius: 0.4, height: 0.35 },
  rock: { radius: 0.55, height: 0.45 },
};

export const randomFrom = (seed: number) => {
  let state = (Math.abs(Math.floor(seed)) % 2_147_483_646) + 1;
  return () => {
    state = (state * 48_271) % 2_147_483_647;
    return (state - 1) / 2_147_483_646;
  };
};

export const createRiver = (seed: number): River => {
  const random = randomFrom(seed);
  const between = (min: number, max: number) => min + random() * (max - min);
  const props: Prop[] = [];
  const place = (kind: Prop["kind"], count: number, near: number) => {
    for (let i = 0; i < count; i += 1) {
      props.push({
        kind,
        turn: random() * Math.PI * 2,
        x: between(-3.5, 3.5),
        z: between(near, near + 26),
      });
    }
  };
  place("duck", random() < 0.7 ? 1 : 2, 9);
  place("leaf", 2 + Math.floor(random() * 3), 8);
  place("rock", random() < 0.55 ? 1 : 0, 12);
  return {
    bank: between(50, 57),
    props,
    seed,
    shore: between(6, 8),
    sky: skies[Math.floor(random() * skies.length)] ?? "dusk",
  };
};

const grip = (tilt: number) => Math.exp(-(((tilt - 20) / 14) ** 2));

const positionIn = (hop: Hop, t: number): Vec => ({
  x: hop.from.x + hop.velocity.x * t,
  y: hop.from.y + hop.velocity.y * t - (GRAVITY / 2) * t * t,
  z: hop.from.z + hop.velocity.z * t,
});

const airtime = (from: Vec, velocity: Vec) =>
  (velocity.y + Math.sqrt(velocity.y ** 2 + 2 * GRAVITY * from.y)) / GRAVITY;

const contact = (hop: Hop, prop: Prop) => {
  if (prop.kind === "leaf") {
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

const leafUnder = (river: River, at: Vec) =>
  river.props.find(
    (prop) =>
      prop.kind === "leaf" && Math.hypot(at.x - prop.x, at.z - prop.z) < 0.45
  );

export const simulate = (river: River, input: ThrowInput): Throw => {
  const random = randomFrom(river.seed + 7919);
  const hold = grip(input.tilt);
  const keep = 0.78 + 0.16 * hold;
  const lift = 0.06 + 0.05 * hold;
  const sinkBelow = 3 + 3 * (1 - hold);
  const hops: Hop[] = [];
  const splashes: Splash[] = [];
  let from = HAND;
  let velocity: Vec = {
    x: input.speed * Math.cos(LAUNCH) * Math.sin(input.aim),
    y: input.speed * Math.sin(LAUNCH),
    z: input.speed * Math.cos(LAUNCH) * Math.cos(input.aim),
  };
  let time = 0;
  let skips = 0;

  const finish = (
    ending: Ending,
    end: Vec,
    hit: Throw["hit"] = null,
    rest: Vec | null = null
  ): Throw => ({
    distance: Math.max(0, (rest ?? end).z),
    duration: time,
    ending,
    hops,
    skips,
    splashes,
    hit,
    rest,
  });

  const fall = (start: Vec, push: Vec, big: boolean) => {
    const hop = { end: 0, from: start, start: time, velocity: push };
    hop.end = time + airtime(start, push);
    hops.push(hop);
    time = hop.end;
    const end = { ...positionIn(hop, hop.end - hop.start), y: 0 };
    splashes.push({ big, time, x: end.x, z: end.z });
    return end;
  };

  for (;;) {
    const flight = airtime(from, velocity);
    const hop: Hop = { end: time + flight, from, start: time, velocity };
    const toBank =
      velocity.z > 0
        ? (river.bank - from.z) / velocity.z
        : Number.POSITIVE_INFINITY;

    let struck: { index: number; t: number } | null = null;
    for (const [index, prop] of river.props.entries()) {
      const t = contact(hop, prop);
      if (t !== null && t < toBank && (struck === null || t < struck.t)) {
        struck = { index, t };
      }
    }

    if (struck) {
      const prop = river.props[struck.index];
      hop.end = time + struck.t;
      hops.push(hop);
      time = hop.end;
      const at = positionIn(hop, struck.t);
      const hit = { at, prop: struck.index, time };
      if (prop?.kind === "rock") {
        const side = at.x >= prop.x ? 1 : -1;
        const end = fall(
          at,
          { x: velocity.x * 0.3 + side * 2.4, y: 3.4, z: -velocity.z * 0.22 },
          true
        );
        return finish("rock", end, hit);
      }
      const end = fall(
        at,
        { x: velocity.x * 0.1, y: 0.6, z: velocity.z * 0.08 },
        true
      );
      return finish("duck", end, hit);
    }

    if (toBank < flight) {
      hop.end = time + toBank;
      hops.push(hop);
      time = hop.end;
      const at = positionIn(hop, toBank);
      return finish("bank", at, null, { x: at.x, y: 0.4, z: river.bank + 0.6 });
    }

    hops.push(hop);
    time = hop.end;
    from = { ...positionIn(hop, flight), y: 0 };
    const speed = Math.hypot(velocity.x, velocity.z);

    const leaf = speed < 5.5 ? leafUnder(river, from) : undefined;
    if (leaf) {
      return finish("leaf", from, null, { x: leaf.x, y: 0.02, z: leaf.z });
    }

    if (speed < sinkBelow) {
      splashes.push({ big: true, time, x: from.x, z: from.z });
      return finish(skips === 0 ? "plop" : "sink", from);
    }

    skips += 1;
    splashes.push({ big: false, time, x: from.x, z: from.z });

    if (skips >= 4 && random() < 0.0006) {
      return finish("fish", from, { at: from, prop: null, time });
    }

    const carry = keep * (1 + (random() - 0.5) * 0.06);
    const forward = speed * carry;
    velocity = {
      x: velocity.x * carry,
      y: forward * lift * (1 + (random() - 0.5) * 0.2),
      z: velocity.z * carry,
    };
  }
};

export const stoneAt = (shot: Throw, time: number): Vec | null => {
  const hop = shot.hops.find((h) => time < h.end);
  if (!hop) {
    return shot.rest;
  }
  return positionIn(hop, Math.max(0, time - hop.start));
};
