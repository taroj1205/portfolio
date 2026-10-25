import { SHELVES, kinds, prizeIds } from "./prizes";
import type { PrizeId } from "./prizes";

export const CORKS = 18;
export const FLIGHT = 0.2;
const RISE = 0.25;
const SHRINK = 0.0012;
const DOWN = Math.PI / 2;
const PUNCH = 8000;
const ROCK = 1.4;
const GRAVITY = 12_000;
const GRIP = 8;
const TWIST = 0.75;
const SLIDE = 40;
const SLIDE_SHARE = 0.5;
const LAND = 0.4;
const TICK = 1 / 240;
const JITTER = 16;
export const CORK = 16;

export interface Prize {
  id: PrizeId;
  x: number;
  z: number;
  yaw: number;
  pitch: number;
  spin: number;
  down: number | null;
}

interface Shot {
  x: number;
  y: number;
  power: number;
  t: number;
}

export interface Stall {
  prizes: Prize[];
  corks: number;
  flying: Shot[];
  got: PrizeId[];
  hits: number;
  time: number;
}

interface Hit {
  budged: boolean;
  corner: boolean;
  force: number;
}

export type Outcome =
  | ({
      type: "hit";
      id: PrizeId;
      x: number;
      y: number;
    } & Hit)
  | { type: "miss"; x: number; y: number }
  | { type: "fall"; id: PrizeId };

export interface Face {
  x: number;
  bottom: number;
  top: number;
  half: number;
  scale: number;
}

const clamp = (value: number, low: number, high: number) =>
  Math.min(high, Math.max(low, value));

export const createStall = (random: () => number): Stall => ({
  corks: CORKS,
  flying: [],
  got: [],
  hits: 0,
  prizes: prizeIds.map((id) => ({
    down: null,
    id,
    pitch: 0,
    spin: 0,
    x: kinds[id].x + (random() - 0.5) * JITTER,
    yaw: 0,
    z: 0,
  })),
  time: 0,
});

const reach = (prize: Prize) => {
  const { w, d } = kinds[prize.id];

  return (
    (d / 2) * Math.abs(Math.cos(prize.yaw)) +
    (w / 2) * Math.abs(Math.sin(prize.yaw))
  );
};

export const faceOf = (prize: Prize): Face => {
  const { w, h, d, row } = kinds[prize.id];
  const scale = 1 - prize.z * SHRINK;
  const bottom = SHELVES[row] - prize.z * RISE;

  return {
    bottom,
    half:
      scale *
      ((w / 2) * Math.abs(Math.cos(prize.yaw)) +
        (d / 2) * Math.abs(Math.sin(prize.yaw))),
    scale,
    top: bottom - scale * h * Math.cos(Math.min(DOWN, Math.abs(prize.pitch))),
    x: prize.x,
  };
};

const rearOf = (prize: Prize) => {
  const { d, gap } = kinds[prize.id];

  return Math.min(reach(prize), d / 2 + gap - prize.z);
};

export const targetOf = (stall: Stall, x: number, y: number) => {
  const standing = stall.prizes
    .filter((prize) => prize.down === null)
    .toSorted((a, b) => kinds[a.id].row - kinds[b.id].row);

  for (const prize of standing) {
    const face = faceOf(prize);

    if (
      Math.abs(x - face.x) <= face.half + CORK &&
      y <= face.bottom &&
      y >= face.top - CORK
    ) {
      return {
        prize,
        u: clamp((x - face.x) / face.half, -1, 1),
        v: clamp((face.bottom - y) / Math.max(1, face.bottom - face.top), 0, 1),
      };
    }
  }

  return null;
};

const turn = (prize: Prize, angle: number) => {
  const { w, d } = kinds[prize.id];
  const side = -Math.sign(angle) * (w / 2);
  const cos = Math.cos(prize.yaw);
  const sin = Math.sin(prize.yaw);
  const ox = side * cos - (d / 2) * sin;
  const oz = side * sin + (d / 2) * cos;
  const pivot = { x: prize.x + ox, z: prize.z + oz };
  const spin = { cos: Math.cos(angle), sin: Math.sin(angle) };
  prize.x = pivot.x + (-ox * spin.cos + oz * spin.sin);
  prize.z = pivot.z + (-ox * spin.sin - oz * spin.cos);
  prize.yaw += angle;
};

export const strike = (prize: Prize, u: number, v: number, power: number) => {
  const { h, d, mass } = kinds[prize.id];
  const punch = PUNCH * clamp(power, 0, 1);
  prize.spin += (ROCK * punch * v * h * 3) / (mass * (h * h + d * d));
  const shove = punch * (0.25 + 0.75 * v);
  const grip = mass * GRIP;
  const twist = shove * Math.abs(u) - grip;
  const slide = shove * (1 - Math.abs(u)) * SLIDE_SHARE - grip;

  if (twist > 0) {
    turn(prize, Math.sign(u) * TWIST * (twist / PUNCH));
  }

  if (slide > 0) {
    prize.z += SLIDE * (slide / PUNCH);
  }

  return {
    budged: twist > 0 || slide > 0,
    corner: twist > 0,
    force: shove / PUNCH,
  };
};

const rock = (prize: Prize, dt: number) => {
  const { h, d } = kinds[prize.id];
  const rear = rearOf(prize);
  const lift = (3 * GRAVITY) / (4 * Math.hypot(d / 2, h / 2));

  if (rear > 0 && Math.abs(prize.pitch) < 1e-3 && Math.abs(prize.spin) < 0.08) {
    prize.pitch = 0;
    prize.spin = 0;

    return;
  }

  const back = Math.atan2(rear, h / 2);
  const front = Math.atan2(reach(prize), h / 2);

  const pull =
    prize.pitch >= 0
      ? -lift * Math.sin(back - prize.pitch)
      : lift * Math.sin(front + prize.pitch);

  prize.spin += pull * dt;
  const next = prize.pitch + prize.spin * dt;

  if ((prize.pitch > 0 && next <= 0) || (prize.pitch < 0 && next >= 0)) {
    prize.pitch = 0;
    prize.spin *= LAND;
  } else {
    prize.pitch = next;
  }
};

export const shoot = (stall: Stall, x: number, y: number, power: number) => {
  if (stall.corks <= 0) {
    return false;
  }

  stall.corks -= 1;
  stall.flying.push({ power: clamp(power, 0, 1), t: FLIGHT, x, y });

  return true;
};

const land = (stall: Stall, shot: Shot): Outcome => {
  const found = targetOf(stall, shot.x, shot.y);

  if (found === null) {
    return { type: "miss", x: shot.x, y: shot.y };
  }

  stall.hits += 1;

  return {
    id: found.prize.id,
    type: "hit",
    x: shot.x,
    y: shot.y,
    ...strike(found.prize, found.u, found.v, shot.power),
  };
};

export const step = (stall: Stall, dt: number) => {
  const out: Outcome[] = [];
  stall.time += dt;

  for (const shot of stall.flying) {
    shot.t -= dt;

    if (shot.t <= 0) {
      out.push(land(stall, shot));
    }
  }

  stall.flying = stall.flying.filter((shot) => shot.t > 0);
  const steps = Math.max(1, Math.ceil(dt / TICK));

  for (const prize of stall.prizes) {
    for (let i = 0; i < steps && prize.down === null; i += 1) {
      rock(prize, dt / steps);

      if (Math.abs(prize.pitch) >= DOWN) {
        prize.down = stall.time;
        stall.got.push(prize.id);
        out.push({ id: prize.id, type: "fall" });
      }
    }
  }

  return out;
};

export const cleared = (stall: Stall) =>
  stall.prizes.every((prize) => prize.down !== null);

export const still = (stall: Stall) =>
  stall.flying.length === 0 &&
  stall.prizes.every(
    (prize) => prize.down !== null || (prize.pitch === 0 && prize.spin === 0)
  );

export const FULL = 0.8;
const WEAKEST = 0.3;
const STEADY = 6;
const SWAY = 55;
const WIDEST = 70;

export const powerOf = (held: number) =>
  WEAKEST + (1 - WEAKEST) * Math.min(1, Math.max(0, held) / FULL);

export const swayOf = (held: number, time: number) => {
  const size = STEADY + Math.min(WIDEST, Math.max(0, held - FULL) * SWAY);

  return {
    x: size * Math.sin(time * 2.3),
    y: size * 0.75 * Math.sin(time * 3.1 + 1.2),
  };
};
