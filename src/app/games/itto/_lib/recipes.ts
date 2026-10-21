import type { Art, Kind, Unit } from "./foods";
import type { Point } from "./geometry";
import {
  POINTS,
  TAU,
  bend,
  box,
  clamp,
  lobe,
  maybeBite,
  moved,
  polar,
  profile,
  resample,
  rounded,
  scatter,
  shrink,
  smooth,
  swell,
  turnOf,
  waves,
  wobble,
} from "./outline";
import type { Grain } from "./outline";
import { between, pick } from "./random";
import type { Roll } from "./random";

interface Draft {
  parts: Point[][];
  art: Art;
  tilt?: number;
}

const plain = (w: number, h: number): Art => ({
  bite: null,
  grains: [],
  h,
  phase: 0,
  spot: { x: 0, y: 0 },
  stick: null,
  units: [],
  variant: 0,
  w,
});

const tofu = (roll: Roll): Draft => {
  const w = between(roll, 0.95, 1.25);
  const h = between(roll, 0.62, 0.86);
  const base = wobble(
    box(w, h, between(roll, 0.07, 0.13)),
    waves(roll, 0.012, 2, 5)
  );
  const { bite, points } = maybeBite(
    base,
    roll,
    0.4,
    between(roll, 0.14, 0.22)
  );
  const spot = {
    x: between(roll, -0.35, 0.35) * w,
    y: between(roll, -0.3, 0.3) * h,
  };
  return {
    art: {
      ...plain(w, h),
      bite,
      grains: Array.from({ length: 5 + pick(roll, 4) }, () => ({
        a: roll() * 180,
        r: between(roll, 0.055, 0.08),
        x: spot.x + between(roll, -0.34, 0.34),
        y: spot.y + between(roll, -0.26, 0.26),
      })),
      spot,
      variant: pick(roll, 2),
    },
    parts: [points],
  };
};

const yokan = (roll: Roll): Draft => {
  const w = between(roll, 1.25, 1.55);
  const h = between(roll, 0.42, 0.56);
  const slant = between(roll, -0.28, 0.28);
  const base = box(w, h, between(roll, 0.03, 0.06)).map((p) => ({
    x: p.x + slant * p.y * Math.max(0, p.x / w),
    y: p.y,
  }));
  const variant = pick(roll, 3);
  const points = wobble(base, waves(roll, 0.006, 2, 4));
  return {
    art: {
      ...plain(w, h),
      grains:
        variant === 1
          ? scatter(roll, shrink(points, 0.85), 6, [0.08, 0.13])
          : [],
      variant,
    },
    parts: [points],
  };
};

const castella = (roll: Roll): Draft => {
  const w = between(roll, 0.95, 1.3);
  const h = between(roll, 0.5, 0.7);
  const base = wobble(box(w, h, 0.025), waves(roll, 0.008, 2, 6));
  const { bite, points } = maybeBite(
    base,
    roll,
    0.3,
    between(roll, 0.16, 0.24)
  );
  return {
    art: {
      ...plain(w, h),
      bite,
      grains: scatter(roll, points, 110, [0.006, 0.016]),
    },
    parts: [points],
  };
};

const onigiri = (roll: Roll): Draft => {
  const w = between(roll, 0.85, 1.05);
  const h = between(roll, 0.8, 1);
  const lean = between(roll, -0.12, 0.12);
  const corner = between(roll, 0.32, 0.44);
  const base = rounded(
    [
      { x: lean, y: -h + corner },
      { x: w - corner, y: h * 0.72 - corner },
      { x: -w + corner, y: h * 0.72 - corner },
    ],
    corner
  );
  const grainy = wobble(
    base,
    (a) => 0.011 * Math.sin(a * 41) + 0.007 * Math.sin(a * 59 + 1)
  );
  const { bite, points } = maybeBite(
    wobble(grainy, waves(roll, 0.02, 2, 4)),
    roll,
    0.5,
    between(roll, 0.24, 0.32)
  );
  return {
    art: {
      ...plain(w, h),
      bite,
      grains: scatter(roll, points, 90, [0.045, 0.06]),
      spot: { x: lean * 0.6, y: h * 0.72 },
      variant: pick(roll, 3),
    },
    parts: [points],
  };
};

const daifuku = (roll: Roll): Draft => {
  const stretch = between(roll, 1, 1.14);
  const curve = waves(roll, 0.045, 2, 3);
  const base = polar((a) => 0.95 * (1 + curve(a))).map((p) => ({
    x: p.x * stretch,
    y: p.y,
  }));
  const { bite, points } = maybeBite(
    base,
    roll,
    0.5,
    between(roll, 0.32, 0.42)
  );
  const variant = pick(roll, 3);
  return {
    art: {
      ...plain(stretch, 1),
      bite,
      grains:
        variant === 0
          ? scatter(roll, shrink(points, 0.9), 10, [0.075, 0.1])
          : scatter(roll, points, 70, [0.006, 0.018]),
      variant,
    },
    parts: [points],
  };
};

const kagami = (roll: Roll): Draft => {
  const squash = between(roll, 1.04, 1.18);
  const curve = waves(roll, 0.03, 2, 4);
  const points = polar((a) => 0.95 * (1 + curve(a))).map((p) => ({
    x: p.x * squash,
    y: p.y,
  }));
  const grains = Array.from({ length: 2 + pick(roll, 3) }, () => {
    const a = roll() * TAU;
    const r = between(roll, 0.72, 0.88);
    return {
      a: a + between(roll, -0.5, 0.5),
      r: between(roll, 0.1, 0.2),
      x: Math.cos(a) * r * squash,
      y: Math.sin(a) * r,
    };
  });
  return {
    art: {
      ...plain(squash, between(roll, 0.6, 0.68)),
      grains,
      phase: roll() * TAU,
      spot: { x: between(roll, -0.08, 0.08), y: between(roll, -0.08, 0.08) },
    },
    parts: [points],
  };
};

const taiyaki = (roll: Roll): Draft => {
  const w = between(roll, 0.8, 0.92);
  const h = between(roll, 0.44, 0.54);
  const tail = between(roll, 0.32, 0.46);
  const fork = between(roll, 0.2, 0.26);
  const variant = pick(roll, 2);
  const crisp = variant === 1 ? waves(roll, 0.025, 31, 47) : () => 0;
  const radius = (a: number) => {
    const body = 1 / Math.hypot(Math.cos(a) / w, Math.sin(a) / h);
    const back = turnOf(a, Math.PI);
    const fins = tail * (lobe(back - fork, 0.19) + lobe(back + fork, 0.19));
    const dorsal = 0.08 * lobe(turnOf(a, -Math.PI / 2 - 0.35), 0.55);
    const belly = 0.05 * lobe(turnOf(a, Math.PI / 2 + 0.5), 0.35);
    const mouth = -0.05 * lobe(turnOf(a, 0), 0.08);
    return (body + fins + dorsal + belly + mouth) * (1 + crisp(a));
  };
  const points = polar(radius);
  return {
    art: {
      ...plain(w, h),
      grains: scatter(roll, shrink(points, 0.8), 40, [0.07, 0.09]).filter(
        (grain) => grain.x < w * 0.3 && grain.x > -w * 0.7
      ),
      spot: {
        x: w * between(roll, 0.55, 0.65),
        y: -h * between(roll, 0.15, 0.3),
      },
      variant,
    },
    parts: [points],
  };
};

const kaki = (roll: Roll): Draft => {
  const square = between(roll, 0.03, 0.07);
  const phase = roll() * TAU;
  const curve = waves(roll, 0.02, 2, 3);
  const points = polar(
    (a) => 0.95 * (1 + square * Math.cos(4 * a + phase) + curve(a))
  );
  return {
    art: {
      ...plain(1, 1),
      phase,
      spot: { x: between(roll, -0.07, 0.07), y: between(roll, -0.07, 0.07) },
      variant: pick(roll, 2),
    },
    parts: [points],
  };
};

const kamaboko = (roll: Roll): Draft => {
  const w = between(roll, 1, 1.2);
  const h = between(roll, 0.8, 1);
  const base = 0.42;
  const arc = Array.from({ length: 60 }, (_, i) => {
    const a = Math.PI + (i / 59) * Math.PI;
    return { x: Math.cos(a) * w, y: base + Math.sin(a) * h };
  });
  const outline = [
    ...arc,
    { x: w * 0.98, y: base + 0.02 },
    { x: 0, y: base + 0.02 },
    { x: -w * 0.98, y: base + 0.02 },
  ];
  const points = wobble(resample(outline), waves(roll, 0.008, 2, 5));
  return {
    art: {
      ...plain(w, h),
      phase: between(roll, 0.13, 0.2),
      spot: { x: 0, y: base },
      variant: pick(roll, 2),
    },
    parts: [points],
  };
};

const nerikiri = (roll: Roll): Draft => {
  const variant = pick(roll, 3);
  const petals = variant === 2 ? 6 : 5;
  const phase = roll() * TAU;
  const curve = waves(roll, 0.015, 2, 3);
  const radius = (a: number) => {
    const t = (((a + phase) * petals) / TAU) % 1;
    const bulge = Math.sin(t * Math.PI) ** (variant === 2 ? 1.6 : 0.55);
    const notch = variant === 0 ? 0.1 * lobe(t - 0.5, 0.07) : 0;
    return 0.72 + 0.26 * bulge - notch + curve(a);
  };
  return {
    art: { ...plain(1, 1), phase, variant, w: petals },
    parts: [polar(radius)],
  };
};

const nigiriOf = (roll: Roll, w: number, h: number) => {
  const bow = between(roll, -0.12, 0.12);
  const base = box(w, h, h * between(roll, 0.55, 0.8)).map((p) => ({
    x: p.x,
    y: p.y + bow * (p.x / w) ** 2,
  }));
  const rice = wobble(base, (a) => {
    const below = Math.max(0, Math.sin(a));
    return below * below * (0.06 + 0.012 * Math.sin(a * 37));
  });
  return { bow, points: wobble(rice, waves(roll, 0.01, 2, 4)) };
};

const sushi = (roll: Roll): Draft => {
  const w = between(roll, 1.15, 1.35);
  const h = between(roll, 0.46, 0.58);
  const { bow, points } = nigiriOf(roll, w, h);
  return {
    art: {
      ...plain(w, h),
      grains: scatter(roll, points, 80, [0.045, 0.06]),
      phase: bow,
      variant: pick(roll, 3),
    },
    parts: [points],
  };
};

const gourd = (roll: Roll) => {
  const top = { r: between(roll, 0.36, 0.44), y: -between(roll, 0.45, 0.55) };
  const low = { r: between(roll, 0.55, 0.63), y: between(roll, 0.3, 0.38) };
  const gap = low.y - top.y;
  const waist = top.y + (gap * gap + top.r * top.r - low.r * low.r) / (2 * gap);
  const reach = (a: number, circle: { r: number; y: number }) => {
    const y = circle.y - waist;
    const toward = Math.sin(a) * y;
    return toward + Math.sqrt(toward * toward - y * y + circle.r * circle.r);
  };
  const radii = smooth(
    Array.from({ length: POINTS }, (_, i) => {
      const a = (i / POINTS) * TAU;
      return Math.max(reach(a, top), reach(a, low));
    }),
    6
  );
  return {
    points: radii.map((r, i) => {
      const a = (i / POINTS) * TAU;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r + waist };
    }),
    waist,
  };
};

const folding = (roll: Roll) => {
  const spread = between(roll, 1.9, 2.3);
  const hole = between(roll, 0.3, 0.4);
  const from = -Math.PI / 2 - spread / 2;
  const outer = Array.from({ length: 50 }, (_, i) => {
    const a = from + (i / 49) * spread;
    return { x: Math.cos(a), y: Math.sin(a) + 0.5 };
  });
  const inner = Array.from({ length: 16 }, (_, i) => {
    const a = from + spread - (i / 15) * spread;
    return { x: Math.cos(a) * hole, y: Math.sin(a) * hole + 0.5 };
  });
  return { hole, points: resample([...outer, ...inner]), spread };
};

const rakugan = (roll: Roll): Draft => {
  const tint = pick(roll, 4);
  if (roll() < 0.5) {
    const { points, waist } = gourd(roll);
    return {
      art: {
        ...plain(1, 1),
        grains: scatter(roll, points, 80, [0.006, 0.014]),
        spot: { x: 0, y: waist },
        variant: tint,
      },
      parts: [wobble(points, waves(roll, 0.005, 2, 4))],
    };
  }
  const { hole, points, spread } = folding(roll);
  return {
    art: {
      ...plain(spread, hole),
      grains: scatter(roll, points, 80, [0.006, 0.014]),
      spot: { x: 0, y: 0.5 },
      variant: 4 + tint,
    },
    parts: [wobble(points, waves(roll, 0.005, 2, 4))],
  };
};

const kashiwa = (roll: Roll): Draft => {
  const r = between(roll, 0.95, 1.08);
  const deep = between(roll, 0.66, 0.78);
  const lobes = 5 + pick(roll, 3);
  const amp = between(roll, 0.04, 0.06);
  const arc = Array.from({ length: 61 }, (_, i) => {
    const a = (i / 60) * Math.PI;
    return { x: Math.cos(a) * r, y: Math.sin(a) * r * deep };
  });
  const points = swell(rounded(arc, 0.08), (p) => {
    const fade = clamp((p.y - 0.1) / 0.25);
    const a = Math.atan2(p.y / deep, p.x);
    return amp * fade * (Math.abs(Math.sin(a * lobes)) ** 0.6 * 1.6 - 0.8);
  });
  return {
    art: {
      ...plain(r, deep),
      phase: lobes,
      variant: pick(roll, 2),
    },
    parts: [points],
  };
};

const pleatsOf = (count: number, t: number) =>
  Math.abs(Math.sin((count * Math.PI * (t + 1)) / 2)) ** 0.5;

const gyoza = (roll: Roll): Draft => {
  const length = between(roll, 0.95, 1.1);
  const h = between(roll, 0.36, 0.44);
  const pleats = 5 + pick(roll, 3);
  const deep = between(roll, 0.06, 0.1);
  const curl = between(roll, 1.25, 1.7);
  const upper = (t: number) =>
    h * (1 - t * t) ** 0.55 * (1 + deep * pleatsOf(pleats, t));
  const ring = profile(length, upper, (t) => h * 0.5 * (1 - t * t) ** 0.7);
  const grains = Array.from({ length: pleats - 1 }, (_, k) => {
    const t = ((k + 1) / pleats) * 2 - 1;
    const [from, to] = bend(
      [
        { x: t * length, y: -upper(t) * 0.96 },
        { x: t * length * 0.86, y: -upper(t) * 0.18 },
      ],
      curl
    );
    return {
      a: Math.atan2(to.y - from.y, to.x - from.x),
      r: Math.hypot(to.x - from.x, to.y - from.y),
      x: from.x,
      y: from.y,
    };
  });
  return {
    art: {
      ...plain(length, h),
      grains,
      phase: curl,
      variant: pick(roll, 2),
    },
    parts: [resample(bend(ring, curl))],
  };
};

const mikan = (roll: Roll): Draft => {
  const length = between(roll, 0.92, 1.05);
  const h = between(roll, 0.34, 0.42);
  const belly = between(roll, 0.28, 0.4);
  const curl = between(roll, 0.78, 0.95);
  const ring = profile(
    length,
    (t) => h * (1 - t * t) ** 0.5,
    (t) => h * belly * (1 - t * t) ** 0.8
  );
  return {
    art: {
      ...plain(length, h),
      grains: Array.from({ length: 5 + pick(roll, 4) }, () => ({
        a: between(roll, 0.15, 0.9),
        r: between(roll, 0.45, 0.9),
        x: between(roll, -0.3, 0.3),
        y: between(roll, 0.016, 0.03),
      })),
      phase: curl,
    },
    parts: [resample(wobble(bend(ring, curl), waves(roll, 0.008, 2, 4)))],
  };
};

const chikuwa = (roll: Roll): Draft => {
  const length = between(roll, 1.05, 1.25);
  const h = between(roll, 0.19, 0.23);
  const curl = between(roll, 3, 7);
  const end = (t: number) => h * (1 - Math.abs(t) ** 14) ** 0.3;
  const ring = profile(length, end, end);
  const grains = Array.from({ length: 34 }, () => {
    const x = between(roll, -0.8, 0.8) * length;
    const [at] = bend([{ x, y: between(roll, -0.7, 0.7) * h }], curl);
    return {
      a: (x / curl) * (180 / Math.PI) + between(roll, -12, 12),
      r: between(roll, 0.05, 0.11),
      x: at.x,
      y: at.y,
    };
  });
  return {
    art: { ...plain(length, h), grains, phase: curl },
    parts: [resample(bend(ring, curl))],
  };
};

const ebiten = (roll: Roll): Draft => {
  const length = between(roll, 1.05, 1.2);
  const fat = between(roll, 0.25, 0.3);
  const curl = between(roll, 1.9, 2.8);
  const tail = between(roll, 0.17, 0.22);
  const width = (t: number) =>
    Math.max(
      fat * (1 - t * t) ** 0.45 * (0.5 + 0.25 * (t + 1)),
      tail * lobe(t + 0.93, 0.1)
    );
  const crunch = waves(roll, 0.022, 15, 27);
  const ring = profile(length, width, width, 110);
  const rough = swell(ring, (p, i) =>
    p.x > -0.78 * length ? crunch((i / ring.length) * TAU) : 0
  );
  const at = -0.93 * length;
  const [spot] = bend([{ x: at, y: 0 }], curl);
  return {
    art: {
      ...plain(length, fat),
      grains: scatter(roll, bend(rough, curl), 60, [0.025, 0.05]).filter(
        (grain) => grain.x > spot.x + 0.2
      ),
      phase: at / curl,
      spot,
    },
    parts: [resample(bend(rough, curl))],
  };
};

const sanma = (roll: Roll): Draft => {
  const length = between(roll, 1.35, 1.5);
  const fat = between(roll, 0.17, 0.2);
  const curl = between(roll, 3, 6);
  const width = (t: number) =>
    Math.max(
      fat * Math.sin(Math.PI * clamp((t + 0.86) / 1.86)) ** 0.7,
      0.034 * clamp((0.6 - t) / 0.3),
      0.13 * clamp((-0.86 - t) / 0.14)
    );
  const ring = profile(
    length,
    (t) => width(t) * 0.9,
    (t) => width(t) * 1.1
  );
  const notch = { x: -length + 0.1, y: 0 };
  return {
    art: {
      ...plain(length, fat),
      grains: Array.from({ length: 3 + pick(roll, 2) }, (_, k) => ({
        a: between(roll, -25, 25),
        r: between(roll, 0.6, 1),
        x: (between(roll, -0.45, 0.55) + k * 0.02) * length,
        y: 0,
      })),
      phase: curl,
      variant: pick(roll, 2),
    },
    parts: [resample(bend([...ring, notch], curl))],
  };
};

const nasu = (roll: Roll): Draft => {
  const length = between(roll, 0.9, 1.05);
  const fat = between(roll, 0.42, 0.52);
  const neck = between(roll, 0.55, 0.7);
  const curl = between(roll, 1.8, 3.2);
  const width = (t: number) => {
    const body =
      fat *
      Math.sqrt(Math.max(0, 1 - t * t)) *
      (1 - neck * 0.5 * (t + 1) * 0.5);
    return Math.max(
      body * (1 - clamp((t - 0.8) / 0.12)),
      0.045 * (1 - clamp((t - 0.97) / 0.03))
    );
  };
  const ring = profile(length, width, width);
  return {
    art: {
      ...plain(length, fat),
      phase: curl,
      spot: bend([{ x: length * 0.7, y: 0 }], curl)[0],
    },
    parts: [resample(bend(ring, curl))],
  };
};

const takenoko = (roll: Roll): Draft => {
  const length = between(roll, 0.95, 1.1);
  const fat = between(roll, 0.55, 0.65);
  const curl = between(roll, 2.2, 3.6);
  const width = (t: number) =>
    fat * ((1 - t) / 2) ** 1.15 * Math.max(0, 1 - t * t) ** 0.35;
  const points = resample(bend(profile(length, width, width), curl));
  return {
    art: {
      ...plain(length, fat),
      grains: scatter(roll, points, 26, [0.012, 0.024]),
      phase: curl,
      variant: 5 + pick(roll, 3),
    },
    parts: [points],
  };
};

const ninjin = (roll: Roll): Draft => {
  const phase = roll() * TAU;
  const deep = between(roll, 0.22, 0.3);
  const curve = waves(roll, 0.012, 2, 3);
  const radius = (a: number) => {
    const t = (((a + phase) * 5) / TAU) % 1;
    return 0.95 - deep + deep * Math.sin(t * Math.PI) ** 0.45 + curve(a);
  };
  return {
    art: { ...plain(1, deep), phase, variant: pick(roll, 2) },
    parts: [polar(radius)],
  };
};

const dorayaki = (roll: Roll): Draft => {
  const stretch = between(roll, 1, 1.08);
  const curve = waves(roll, 0.02, 2, 4);
  const base = polar((a) => 0.95 * (1 + curve(a))).map((p) => ({
    x: p.x * stretch,
    y: p.y,
  }));
  const { bite, points } = maybeBite(base, roll, 0.45, between(roll, 0.3, 0.4));
  return {
    art: {
      ...plain(stretch, 1),
      bite,
      grains: scatter(roll, shrink(points, 0.92), 40, [0.008, 0.02]),
      phase: roll() * TAU,
      variant: pick(roll, 2),
    },
    parts: [points],
  };
};

const edamame = (roll: Roll): Draft => {
  const beans = 2 + pick(roll, 2);
  const length = 0.55 + beans * between(roll, 0.2, 0.24);
  const fat = between(roll, 0.17, 0.2);
  const curl = between(roll, 1.6, 3);
  const width = (t: number) => {
    let bulge = 0;
    for (let k = 0; k < beans; k += 1) {
      bulge += lobe(t - (-1 + (2 * k + 1) / beans), 1 / beans);
    }
    return (fat + 0.075 * bulge) * Math.max(0, 1 - t * t) ** 0.4;
  };
  const points = resample(
    bend(
      profile(length, width, (t) => width(t) * 0.92),
      curl
    )
  );
  return {
    art: {
      ...plain(length, fat),
      grains: scatter(roll, points, 14, [0.012, 0.022]),
      phase: curl,
      units: Array.from({ length: beans }, (_, k) => {
        const t = -1 + (2 * k + 1) / beans;
        const [at] = bend([{ x: t * length, y: 0 }], curl);
        return { ...at, a: t * length, r: width(t), variant: 0 };
      }),
    },
    parts: [points],
  };
};

const naruto = (roll: Roll): Draft => {
  const stretch = between(roll, 1, 1.1);
  const ridges = 16 + pick(roll, 5);
  const curve = waves(roll, 0.015, 2, 3);
  const points = polar(
    (a) => 0.92 * (1 + 0.035 * Math.tanh(3 * Math.cos(ridges * a)) + curve(a)),
    ridges * 12
  ).map((p) => ({ x: p.x * stretch, y: p.y }));
  return {
    art: { ...plain(stretch, 1), phase: roll() * TAU, variant: pick(roll, 2) },
    parts: [points],
  };
};

const kuri = (roll: Roll): Draft => {
  const length = between(roll, 0.82, 0.92);
  const fat = between(roll, 0.66, 0.74);
  const curl = between(roll, 2.5, 5);
  const width = (t: number) =>
    fat *
    Math.max(0, 1 - Math.abs(t) ** 4) ** 0.45 *
    (1 - 0.75 * ((t + 1) / 2) ** 2.2);
  const ring = profile(length, width, (t) => width(t) * 0.94);
  return {
    art: { ...plain(length, fat), phase: curl },
    parts: [resample(bend(ring, curl))],
  };
};

const blob = (roll: Roll, r: number, rough: number, count: number) =>
  polar((a) => r * (1 + waves(roll, rough, 2, 4)(a)), count);

interface Skewered {
  points: Point[];
  r: number;
  variant: number;
}

const skewer = (
  roll: Roll,
  pieces: readonly Skewered[],
  gap: number,
  width: number
) => {
  let right = 0;
  const placed = pieces.map((piece, k) => {
    const xs = piece.points.map((p) => p.x);
    const x = k === 0 ? 0 : right + gap - Math.min(...xs);
    right = x + Math.max(...xs);
    return { ...piece, x, y: between(roll, -0.025, 0.025) };
  });
  const left = Math.min(...pieces[0].points.map((p) => p.x));
  const middle = (left + right) / 2;
  const units: Unit[] = placed.map((piece) => ({
    a: roll() * TAU,
    r: piece.r,
    variant: piece.variant,
    x: piece.x - middle,
    y: piece.y,
  }));
  return {
    parts: placed.map((piece, k) =>
      moved(piece.points, { x: units[k].x, y: units[k].y })
    ),
    stick: {
      from: { x: left - middle - between(roll, 0.42, 0.58), y: 0 },
      to: { x: right - middle + 0.1, y: 0 },
      width,
    },
    units,
  };
};

const dango = (roll: Roll): Draft => {
  const { parts, stick, units } = skewer(
    roll,
    [0, 1, 2].map((variant) => {
      const r = between(roll, 0.37, 0.42);
      return { points: blob(roll, r, 0.012, 96), r, variant };
    }),
    0.035,
    0.075
  );
  return { art: { ...plain(1, 1), stick, units }, parts };
};

const yakitori = (roll: Roll): Draft => {
  const { parts, stick, units } = skewer(
    roll,
    Array.from({ length: 4 + pick(roll, 2) }, (_, k) => {
      if (k % 2 === 1) {
        const along = between(roll, 0.14, 0.17);
        return {
          points: box(along, between(roll, 0.22, 0.26), 0.07, 72),
          r: along,
          variant: 1,
        };
      }
      const r = between(roll, 0.24, 0.28);
      return {
        points: wobble(
          box(r, r * between(roll, 0.85, 1), r * 0.4, 96),
          waves(roll, 0.05, 2, 4)
        ),
        r,
        variant: 0,
      };
    }),
    0.03,
    0.06
  );
  return {
    art: { ...plain(1, 1), stick, units, variant: pick(roll, 2) },
    parts,
  };
};

const nikan = (roll: Roll): Draft => {
  const w = between(roll, 0.78, 0.9);
  const h = between(roll, 0.32, 0.38);
  const gap = between(roll, 0.06, 0.12);
  const slide = between(roll, -0.25, 0.25);
  const parts: Point[][] = [];
  const grains: Grain[] = [];
  const units: Unit[] = [-1, 1].map((side) => {
    const { bow, points } = nigiriOf(roll, w, h);
    const at = { x: (slide * side) / 2, y: side * (h + 0.05 + gap / 2) };
    const placed = moved(points, at);
    parts.push(placed);
    grains.push(...scatter(roll, placed, 50, [0.035, 0.045]));
    return { ...at, a: bow, r: w, variant: pick(roll, 3) };
  });
  return { art: { ...plain(w, h), grains, units }, parts };
};

const senbei = (roll: Roll): Draft => {
  const sizes = [0, 1, 2].map(() => between(roll, 0.48, 0.6));
  const reach = (Math.max(...sizes) * 2.16 + 0.08) / Math.sqrt(3);
  const turn = roll() * TAU;
  const units: Unit[] = sizes.map((r, k) => {
    const a = turn + (k * TAU) / 3;
    const d = reach + between(roll, 0, 0.06);
    return {
      a: roll() * TAU,
      r,
      variant: pick(roll, 4),
      x: Math.cos(a) * d,
      y: Math.sin(a) * d,
    };
  });
  return {
    art: {
      ...plain(1, 1),
      grains: units.flatMap((unit) =>
        scatter(
          roll,
          moved(
            polar(() => unit.r * 0.86, 48),
            unit
          ),
          14,
          [0.012, 0.03]
        )
      ),
      units,
    },
    parts: units.map((unit) => moved(blob(roll, unit.r, 0.018, 96), unit)),
  };
};

const maki = (roll: Roll): Draft => {
  const count = 3 + pick(roll, 2);
  const r = between(roll, 0.36, 0.4);
  const gap = between(roll, 0.05, 0.09);
  const arc = between(roll, -0.1, 0.1);
  const variant = pick(roll, 3);
  const units: Unit[] = Array.from({ length: count }, (_, k) => {
    const t = k - (count - 1) / 2;
    return {
      a: roll() * TAU,
      r: r * between(roll, 0.96, 1.04),
      variant,
      x: t * (2 * r + gap),
      y: arc * t * t + between(roll, -0.03, 0.03),
    };
  });
  const parts = units.map((unit) => {
    const square = between(roll, 0.03, 0.06);
    return moved(
      polar((a) => unit.r * (1 + square * Math.cos(4 * (a + unit.a))), 96),
      unit
    );
  });
  return {
    art: {
      ...plain(r, r),
      grains: units.flatMap((unit) =>
        scatter(
          roll,
          moved(
            polar(() => unit.r * 0.78, 48),
            unit
          ),
          26,
          [0.03, 0.04]
        )
      ),
      units,
      variant,
    },
    parts,
  };
};

const fuji = (roll: Roll): Draft => {
  const length = between(roll, 1.05, 1.2);
  const tall = between(roll, 0.95, 1.1);
  const summit = between(roll, 0.16, 0.22);
  const dent = between(roll, 0.03, 0.05);
  const upper = (t: number) =>
    tall * Math.min(1, ((1 - Math.abs(t)) / (1 - summit)) ** 1.5) -
    dent *
      (lobe(t + summit * 0.4, summit * 0.35) +
        lobe(t - summit * 0.5, summit * 0.3));
  const ring = profile(
    length,
    upper,
    (t) => 0.08 * Math.max(0, 1 - t ** 12) ** 0.3
  );
  return {
    art: {
      ...plain(length, tall),
      grains: Array.from({ length: 5 + pick(roll, 4) }, () => ({
        a: roll() * 180,
        r: between(roll, 0.02, 0.045),
        x: between(roll, -0.6, 0.6) * length,
        y: -between(roll, 0.05, 0.7) * tall,
      })),
      phase: summit,
      variant: pick(roll, 2),
    },
    parts: [resample(ring)],
    tilt: 25,
  };
};

const neko = (roll: Roll): Draft => {
  const spread = between(roll, 0.55, 0.68);
  const ear = between(roll, 0.36, 0.44);
  const stretch = between(roll, 1.04, 1.12);
  const curve = waves(roll, 0.012, 2, 3);
  const points = polar((a) => {
    const ears =
      lobe(turnOf(a, -Math.PI / 2 - spread), 0.32) ** 1.4 +
      lobe(turnOf(a, -Math.PI / 2 + spread), 0.32) ** 1.4;
    return 0.8 * (1 + curve(a)) + ear * ears;
  }).map((p) => ({ x: p.x * stretch, y: p.y }));
  return {
    art: {
      ...plain(stretch, ear),
      phase: spread,
      spot: { x: between(roll, -0.25, 0.25), y: between(roll, -0.1, 0.25) },
      variant: pick(roll, 3),
    },
    parts: [points],
    tilt: 30,
  };
};

const matsutake = (roll: Roll): Draft => {
  const length = between(roll, 1, 1.12);
  const stem = between(roll, 0.2, 0.24);
  const cap = stem * between(roll, 1.6, 1.85);
  const curl = between(roll, 2.5, 4.5);
  const width = (t: number) =>
    Math.max(
      stem * (1 + 0.2 * lobe(t + 1, 0.5)) * Math.max(0, 1 - t * t) ** 0.08,
      t < 0.42
        ? cap * clamp(1 - (0.42 - t) / 0.05)
        : cap * Math.max(0, 1 - ((t - 0.42) / 0.58) ** 2) ** 0.5
    );
  const points = resample(
    bend(
      profile(length, width, (t) => width(t) * 0.94, 120),
      curl
    )
  );
  return {
    art: {
      ...plain(length, cap),
      grains: scatter(roll, points, 34, [0.1, 0.22]).filter(
        (grain) => grain.x < length * 0.3
      ),
      phase: curl,
    },
    parts: [points],
  };
};

export const recipes: Record<Kind, (roll: Roll) => Draft> = {
  castella,
  chikuwa,
  daifuku,
  dango,
  dorayaki,
  ebiten,
  edamame,
  fuji,
  gyoza,
  kagami,
  kaki,
  kamaboko,
  kashiwa,
  kintai: taiyaki,
  kuri,
  maki,
  matsutake,
  mikan,
  naruto,
  nasu,
  neko,
  nerikiri,
  nikan,
  ninjin,
  onigiri,
  rakugan,
  sanma,
  senbei,
  sushi,
  taiyaki,
  takenoko,
  tofu,
  yakitori,
  yokan,
};
