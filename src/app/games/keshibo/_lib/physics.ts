import type { Body } from "./eraser";

const G = 981;
export const LANE = { head: 90, length: 120, seam: 60, start: 8, width: 40 };
export const FLOOR = -72;
export const PIN = { d: 1, h: 4, mass: 6, radius: 0.75, w: 1.6 };
export const MAX_ANGLE = 0.32;
const PINS = 10;

const STEP = 1 / 600;
const IMPULSE = 13_500;
const TOP_SPEED = 700;
const SPACING = 4;
const BALANCE = Math.atan(PIN.d / PIN.h);
const DOWN = Math.PI / 2;
const TIP = 0.1;
const SWAY = 300;
const PIN_GRIP = 0.25;
const LYING_GRIP = 0.45;
const PIN_BOUNCE = 0.35;
const LYING = { radius: 1.1, reach: PIN.d / 2 + PIN.h / 2 };
const REST = 0.6;
const LONGEST = 9;
const ROUND = 0.8;
const HOP = { keep: 0.7, least: 6, max: 36, per: 0.12, rebound: 0.3 };
const TUMBLE = { drag: 180, flop: 8, max: 38, per: 0.16, settle: 6 };
const CURL = { force: 400, fade: 60, skid: 520 };

export interface Point {
  x: number;
  y: number;
}

export interface Launch {
  x: number;
  angle: number;
  power: number;
  curl?: number;
}

export interface Ball extends Body {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  angle: number;
  spin: number;
  inertia: number;
  pitch: number;
  pitchRate: number;
  curl: number;
  dropped: boolean;
}

export interface Pin {
  id: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  tilt: number;
  sway: number;
  toward: number;
  dropped: boolean;
  knocked: Set<number>;
}

type Contact =
  | { type: "hit"; at: Point; strength: number; pin: number }
  | { type: "clack"; at: Point; strength: number }
  | { type: "topple"; at: Point; pin: number }
  | { type: "drop"; at: Point; ball: boolean }
  | { type: "land"; at: Point; strength: number };

export interface World {
  ball: Ball;
  pins: Pin[];
  time: number;
  carry: number;
  contacts: Contact[];
  rolling: boolean;
}

const spots: Point[] = Array.from({ length: PINS }, (_, i) => {
  const row = Math.floor((Math.sqrt(8 * i + 1) - 1) / 2);
  const first = (row * (row + 1)) / 2;
  return {
    x: (i - first - row / 2) * SPACING,
    y: LANE.head + row * SPACING * (Math.sqrt(3) / 2),
  };
});

const freshPin = (id: number, at: Point): Pin => ({
  dropped: false,
  id,
  knocked: new Set(),
  sway: 0,
  tilt: 0,
  toward: 0,
  vx: 0,
  vy: 0,
  vz: 0,
  x: at.x,
  y: at.y,
  z: 0,
});

export interface Spot extends Point {
  id: number;
}

export const rack = (standing: readonly Spot[] | null = null) =>
  (standing ?? spots.map((at, id) => ({ ...at, id }))).map((spot) =>
    freshPin(spot.id, spot)
  );

export const limitOf = (body: Body) => LANE.width / 2 - body.w / 2 - 1.5;

export const createWorld = (body: Body, pins: Pin[]): World => ({
  ball: {
    ...body,
    angle: 0,
    curl: 0,
    dropped: false,
    inertia: (body.mass * (body.w ** 2 + body.d ** 2)) / 12,
    pitch: 0,
    pitchRate: 0,
    spin: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    x: 0,
    y: LANE.start,
    z: 0,
  },
  carry: 0,
  contacts: [],
  pins,
  rolling: false,
  time: 0,
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const pushOf = (body: Body, power: number) =>
  (clamp(power, 0, 1) * IMPULSE) / body.mass;

export const speedOf = (body: Body, power: number) =>
  Math.min(TOP_SPEED, pushOf(body, power));

export const hopsAt = (body: Body) =>
  Math.min(1, (body.lift * body.mass) / IMPULSE);

export const place = (world: World, x: number, angle: number) => {
  const { ball } = world;
  ball.x = clamp(x, -limitOf(ball), limitOf(ball));
  ball.angle = clamp(angle, -MAX_ANGLE, MAX_ANGLE);
};

export const launch = (world: World, { x, angle, power, curl = 0 }: Launch) => {
  place(world, x, angle);
  const { ball } = world;
  const speed = speedOf(ball, power);
  const excess = Math.max(0, pushOf(ball, power) - ball.lift);
  ball.vx = Math.sin(ball.angle) * speed;
  ball.vy = Math.cos(ball.angle) * speed;
  const lift = Math.min(HOP.max, excess * HOP.per);
  ball.vz = lift < HOP.least ? 0 : lift;
  ball.pitchRate = Math.min(TUMBLE.max, excess * TUMBLE.per);
  ball.curl = clamp(curl, -1, 1);
  world.rolling = true;
  world.time = 0;
};

export const isDown = (pin: Pin) => pin.dropped || pin.tilt > BALANCE;

const offDesk = ({ x, y }: Point) =>
  Math.abs(x) > LANE.width / 2 || y > LANE.length || y < 0;

const slow = (body: { vx: number; vy: number }, decel: number, dt: number) => {
  const speed = Math.hypot(body.vx, body.vy);
  if (speed === 0) {
    return;
  }
  const next = Math.max(0, speed - decel * dt);
  body.vx *= next / speed;
  body.vy *= next / speed;
};

const footOf = (pin: Pin): Point & { radius: number } =>
  pin.tilt >= DOWN - 0.05
    ? {
        radius: LYING.radius,
        x: pin.x + Math.sin(pin.toward) * LYING.reach,
        y: pin.y + Math.cos(pin.toward) * LYING.reach,
      }
    : { radius: PIN.radius, x: pin.x, y: pin.y };

const nudge = (pin: Pin, along: Point, impulse: number, height = 1) => {
  if (pin.tilt >= DOWN - 0.05 || pin.dropped) {
    return;
  }
  if (pin.tilt < 0.08) {
    pin.toward = Math.atan2(along.x, along.y);
  }
  const facing =
    Math.sin(pin.toward) * along.x + Math.cos(pin.toward) * along.y;
  pin.sway += (impulse / PIN.mass) * TIP * height * Math.max(0.2, facing);
};

const ballHits = (world: World) => {
  const { ball } = world;
  const cos = Math.cos(ball.angle);
  const sin = Math.sin(ball.angle);
  for (const pin of world.pins) {
    if (pin.dropped) {
      continue;
    }
    const foot = footOf(pin);
    const dx = foot.x - ball.x;
    const dy = foot.y - ball.y;
    const lx = dx * cos - dy * sin;
    const ly = dx * sin + dy * cos;
    const cx = clamp(lx, -ball.w / 2, ball.w / 2);
    const cy = clamp(ly, -ball.d / 2, ball.d / 2);
    let nx = lx - cx;
    let ny = ly - cy;
    let gap = Math.hypot(nx, ny);
    if (gap >= foot.radius) {
      continue;
    }
    if (gap < 1e-6) {
      const across = ball.w / 2 - Math.abs(lx);
      const along = ball.d / 2 - Math.abs(ly);
      nx = across < along ? Math.sign(lx) || 1 : 0;
      ny = across < along ? 0 : Math.sign(ly) || 1;
      gap = -Math.min(across, along);
    } else {
      nx /= gap;
      ny /= gap;
    }
    const away = Math.hypot(dx, dy) || 1;
    const bentX = nx * cos + ny * sin + (ROUND * dx) / away;
    const bentY = -nx * sin + ny * cos + (ROUND * dy) / away;
    const bent = Math.hypot(bentX, bentY) || 1;
    const wx = bentX / bent;
    const wy = bentY / bent;
    const contact = {
      x: ball.x + cx * cos + cy * sin,
      y: ball.y - cx * sin + cy * cos,
    };
    const rx = contact.x - ball.x;
    const ry = contact.y - ball.y;
    const pointX = ball.vx + ball.spin * ry;
    const pointY = ball.vy - ball.spin * rx;
    const closing = (pin.vx - pointX) * wx + (pin.vy - pointY) * wy;
    const depth = foot.radius - gap;
    const share = ball.mass / (ball.mass + PIN.mass);
    pin.x += wx * depth * share;
    pin.y += wy * depth * share;
    ball.x -= wx * depth * (1 - share);
    ball.y -= wy * depth * (1 - share);
    if (closing >= 0) {
      continue;
    }
    const lever = ry * wx - rx * wy;
    const impulse =
      (-(1 + ball.bounce) * closing) /
      (1 / ball.mass + 1 / PIN.mass + lever ** 2 / ball.inertia);
    ball.vx -= (impulse * wx) / ball.mass;
    ball.vy -= (impulse * wy) / ball.mass;
    ball.spin -= (impulse * lever) / ball.inertia;
    pin.vx += (impulse * wx) / PIN.mass;
    pin.vy += (impulse * wy) / PIN.mass;
    nudge(pin, { x: wx, y: wy }, impulse, (ball.h / 1.2) ** 0.8);
    world.contacts.push({
      at: contact,
      pin: pin.id,
      strength: impulse / PIN.mass,
      type: "hit",
    });
  }
};

const pinHits = (world: World) => {
  const { pins } = world;
  for (let i = 0; i < pins.length; i += 1) {
    const a = pins[i];
    if (a.dropped) {
      continue;
    }
    for (let j = i + 1; j < pins.length; j += 1) {
      const b = pins[j];
      if (b.dropped) {
        continue;
      }
      const fa = footOf(a);
      const fb = footOf(b);
      const dx = fb.x - fa.x;
      const dy = fb.y - fa.y;
      const gap = Math.hypot(dx, dy);
      const reach = fa.radius + fb.radius;
      if (gap >= reach || gap < 1e-6) {
        continue;
      }
      const nx = dx / gap;
      const ny = dy / gap;
      const depth = (reach - gap) / 2;
      a.x -= nx * depth;
      a.y -= ny * depth;
      b.x += nx * depth;
      b.y += ny * depth;
      const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
      if (closing >= 0) {
        continue;
      }
      const impulse = (-(1 + PIN_BOUNCE) * closing * PIN.mass) / 2;
      a.vx -= (impulse * nx) / PIN.mass;
      a.vy -= (impulse * ny) / PIN.mass;
      b.vx += (impulse * nx) / PIN.mass;
      b.vy += (impulse * ny) / PIN.mass;
      nudge(b, { x: nx, y: ny }, impulse);
      nudge(a, { x: -nx, y: -ny }, impulse);
      world.contacts.push({
        at: { x: (fa.x + fb.x) / 2, y: (fa.y + fb.y) / 2 },
        strength: impulse / PIN.mass,
        type: "clack",
      });
    }
  }
};

const topples = (world: World) => {
  for (const pin of world.pins) {
    if (pin.dropped || pin.tilt <= BALANCE || pin.tilt >= DOWN) {
      continue;
    }
    const lean = PIN.d / 2 + PIN.h * Math.sin(pin.tilt);
    const head = {
      x: pin.x + Math.sin(pin.toward) * lean,
      y: pin.y + Math.cos(pin.toward) * lean,
    };
    for (const other of world.pins) {
      if (
        other === pin ||
        other.dropped ||
        other.tilt > BALANCE ||
        pin.knocked.has(other.id) ||
        Math.hypot(head.x - other.x, head.y - other.y) > PIN.radius + 0.35
      ) {
        continue;
      }
      pin.knocked.add(other.id);
      const along = { x: Math.sin(pin.toward), y: Math.cos(pin.toward) };
      if (other.tilt < 0.08) {
        other.toward = pin.toward;
      }
      other.sway += Math.max(0, pin.sway) * 0.75 + 2;
      other.vx += along.x * 18;
      other.vy += along.y * 18;
      world.contacts.push({
        at: head,
        strength: 30 + pin.sway * 4,
        type: "clack",
      });
    }
  }
};

const sway = (world: World, pin: Pin, dt: number) => {
  if (pin.tilt === 0 && pin.sway === 0) {
    return;
  }
  const before = pin.tilt;
  pin.sway += SWAY * Math.sin(pin.tilt - BALANCE) * dt;
  pin.sway *= 1 - 1.2 * dt;
  pin.tilt += pin.sway * dt;
  if (pin.tilt >= DOWN) {
    pin.tilt = DOWN;
    pin.sway = Math.abs(pin.sway) < 3 ? 0 : -pin.sway * 0.15;
  } else if (pin.tilt <= 0) {
    pin.tilt = 0;
    pin.sway = Math.abs(pin.sway) < 0.8 ? 0 : -pin.sway * 0.25;
  }
  if (before <= BALANCE && pin.tilt > BALANCE) {
    world.contacts.push({ at: pin, pin: pin.id, type: "topple" });
  }
};

const fall = (body: { z: number; vz: number }, dt: number) => {
  body.vz -= G * dt;
  body.z = Math.max(FLOOR, body.z + body.vz * dt);
  if (body.z === FLOOR) {
    body.vz = 0;
  }
};

const land = (world: World) => {
  const { ball } = world;
  const impact = -ball.vz;
  const keep = HOP.keep + (1 - HOP.keep) * ball.bounce;
  ball.z = 0;
  ball.vz = impact * HOP.rebound > HOP.least ? impact * HOP.rebound : 0;
  ball.vx *= keep;
  ball.vy *= keep;
  ball.pitchRate *= 0.6;
  world.contacts.push({
    at: { x: ball.x, y: ball.y },
    strength: impact,
    type: "land",
  });
};

const tumble = (ball: Ball, grounded: boolean, dt: number) => {
  ball.pitch += ball.pitchRate * dt;
  if (!grounded) {
    return;
  }
  ball.pitchRate = Math.max(0, ball.pitchRate - TUMBLE.drag * dt);
  if (ball.pitchRate > TUMBLE.flop) {
    return;
  }
  ball.pitchRate = 0;
  const flat = Math.round(ball.pitch / Math.PI) * Math.PI;
  const gap = flat - ball.pitch;
  ball.pitch =
    Math.abs(gap) <= TUMBLE.settle * dt
      ? flat
      : ball.pitch + Math.sign(gap) * TUMBLE.settle * dt;
};

const hook = (ball: Ball, dt: number) => {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (ball.curl === 0 || speed < 1) {
    return;
  }
  const bite =
    clamp(1 - speed / CURL.skid, 0.25, 1) * Math.min(1, speed / CURL.fade);
  const push = CURL.force * ball.curl * (ball.grip / 0.24) * bite * dt;
  const ux = ball.vx / speed;
  const uy = ball.vy / speed;
  ball.vx += uy * push;
  ball.vy -= ux * push;
  ball.angle += ball.curl * 1.5 * dt;
};

const moveBall = (world: World, dt: number) => {
  const { ball } = world;
  if (ball.dropped) {
    fall(ball, dt);
    ball.pitch += ball.pitchRate * dt;
    return;
  }
  const grounded = ball.z <= 0 && ball.vz <= 0;
  if (grounded) {
    slow(ball, ball.grip * G * (ball.pitchRate > 0 ? 1.8 : 1), dt);
    const spinDrag = (ball.grip * G * 4) / (ball.w + ball.d);
    ball.spin =
      Math.sign(ball.spin) * Math.max(0, Math.abs(ball.spin) - spinDrag * dt);
    hook(ball, dt);
  } else {
    ball.vz -= G * dt;
    ball.z += ball.vz * dt;
    if (ball.z <= 0) {
      land(world);
    }
  }
  tumble(ball, grounded, dt);
};

const tick = (world: World, dt: number) => {
  const { ball } = world;
  moveBall(world, dt);
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  ball.angle += ball.spin * dt;
  if (!ball.dropped && offDesk(ball)) {
    ball.dropped = true;
    world.contacts.push({
      at: { x: ball.x, y: ball.y },
      ball: true,
      type: "drop",
    });
  }
  for (const pin of world.pins) {
    if (pin.dropped) {
      fall(pin, dt);
    } else {
      slow(pin, (pin.tilt > BALANCE ? LYING_GRIP : PIN_GRIP) * G, dt);
      sway(world, pin, dt);
    }
    pin.x += pin.vx * dt;
    pin.y += pin.vy * dt;
    if (!pin.dropped && offDesk(footOf(pin))) {
      pin.dropped = true;
      world.contacts.push({
        at: { x: pin.x, y: pin.y },
        ball: false,
        type: "drop",
      });
    }
  }
  if (!ball.dropped) {
    ballHits(world);
  }
  pinHits(world);
  topples(world);
};

const still = (world: World) => {
  const { ball } = world;
  const ballStill = ball.dropped
    ? ball.z === FLOOR
    : Math.hypot(ball.vx, ball.vy) < REST &&
      Math.abs(ball.spin) < 0.05 &&
      ball.z === 0 &&
      ball.vz === 0 &&
      ball.pitchRate === 0 &&
      ball.pitch === Math.round(ball.pitch / Math.PI) * Math.PI;
  return (
    ballStill &&
    world.pins.every((pin) =>
      pin.dropped
        ? pin.z === FLOOR
        : Math.hypot(pin.vx, pin.vy) < REST &&
          pin.sway === 0 &&
          (pin.tilt === 0 || pin.tilt === DOWN)
    )
  );
};

export const advance = (world: World, seconds: number) => {
  if (!world.rolling) {
    return false;
  }
  world.carry += seconds;
  while (world.carry >= STEP && world.rolling) {
    world.carry -= STEP;
    world.time += STEP;
    tick(world, STEP);
    if (still(world) || world.time > LONGEST) {
      world.rolling = false;
    }
  }
  return !world.rolling;
};

export const knockedDown = (world: World) =>
  world.pins.filter((pin) => isDown(pin)).length;

export const standingOf = (world: World): Spot[] =>
  world.pins
    .filter((pin) => !isDown(pin))
    .map((pin) => ({ id: pin.id, x: pin.x, y: pin.y }));

export const simulate = (body: Body, launchWith: Launch, pins = rack()) => {
  const world = createWorld(body, pins);
  launch(world, launchWith);
  while (!advance(world, 0.25)) {
    world.contacts.length = 0;
  }
  return world;
};
