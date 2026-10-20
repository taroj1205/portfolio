import { TIER, TOP, kindOf } from "./bodies";

type Rgb = [number, number, number];
type Sphere = (x: number, y: number, z: number) => Rgb;

const rgb = (hex: string): Rgb => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

const smooth = (from: number, to: number, t: number) => {
  const u = clamp01((t - from) / (to - from));
  return u * u * (3 - 2 * u);
};

const hash = (x: number, y: number, z: number, seed: number) => {
  const wave =
    Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 53.3) * 43_758.5453;
  return wave - Math.floor(wave);
};

const fade = (t: number) => t * t * (3 - 2 * t);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const noise = (x: number, y: number, z: number, seed: number) => {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const zi = Math.floor(z);
  const u = fade(x - xi);
  const v = fade(y - yi);
  const w = fade(z - zi);
  const corner = (dx: number, dy: number, dz: number) =>
    hash(xi + dx, yi + dy, zi + dz, seed);
  return lerp(
    lerp(
      lerp(corner(0, 0, 0), corner(1, 0, 0), u),
      lerp(corner(0, 1, 0), corner(1, 1, 0), u),
      v
    ),
    lerp(
      lerp(corner(0, 0, 1), corner(1, 0, 1), u),
      lerp(corner(0, 1, 1), corner(1, 1, 1), u),
      v
    ),
    w
  );
};

const fbm = (x: number, y: number, z: number, seed: number, octaves = 4) => {
  let sum = 0;
  let amp = 0.5;
  let scale = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o += 1) {
    sum += amp * noise(x * scale, y * scale, z * scale, seed + o * 31);
    norm += amp;
    amp *= 0.5;
    scale *= 2.03;
  }
  return sum / norm;
};

const pits = (seed: number, count: number, size: number) =>
  Array.from({ length: count }, (_, i) => {
    const a = hash(i, 1, 0, seed) * Math.PI * 2;
    const b = Math.acos(hash(i, 2, 0, seed) * 1.6 - 0.6);
    return {
      r: size * (0.4 + hash(i, 3, 0, seed) * 0.6),
      x: Math.sin(b) * Math.cos(a),
      y: Math.sin(b) * Math.sin(a),
      z: Math.cos(b),
    };
  });

const cratered = (
  color: Rgb,
  x: number,
  y: number,
  z: number,
  list: ReturnType<typeof pits>
) => {
  let out = color;
  for (const pit of list) {
    const d = Math.hypot(x - pit.x, y - pit.y, z - pit.z) / pit.r;
    if (d < 1) {
      out = mix(out, [0, 0, 0], 0.32 * (1 - d * d));
    } else if (d < 1.25) {
      out = mix(out, [255, 255, 255], 0.12 * (1 - (d - 1) / 0.25));
    }
  }
  return out;
};

const ROCK_PITS = pits(7, 8, 0.36);
const MOON_PITS = pits(3, 14, 0.26);

const palette = {
  cloud: rgb("#ffffff"),
  craterDark: rgb("#7f7b75"),
  earthDeep: rgb("#0d3a85"),
  earthDesert: rgb("#c2a46a"),
  earthLand: rgb("#3d7a36"),
  earthShallow: rgb("#2f7ad6"),
  iceDark: rgb("#5d7d96"),
  iceDust: rgb("#3b4652"),
  iceLight: rgb("#eaf7ff"),
  jupiterLight: rgb("#f3e3c8"),
  jupiterDark: rgb("#a8643a"),
  jupiterSpot: rgb("#c4502e"),
  marsDark: rgb("#6b2a17"),
  marsDeep: rgb("#a63e22"),
  marsLight: rgb("#e0835a"),
  moonDark: rgb("#9c988f"),
  moonLight: rgb("#ece8de"),
  neptuneDark: rgb("#2a48b8"),
  neptuneLight: rgb("#6a95f2"),
  neptuneSpot: rgb("#1a2a78"),
  rockDark: rgb("#4a403a"),
  rockLight: rgb("#c3b4a6"),
  saturnDark: rgb("#c09a5e"),
  saturnLight: rgb("#f3e1b6"),
  snow: rgb("#f4f8ff"),
  sunCore: rgb("#fff3b0"),
  sunEdge: rgb("#e04a12"),
  sunMid: rgb("#ff8a1f"),
};

const surfaces = new Map<number, Sphere>([
  [
    TIER.asteroid,
    (x, y, z) =>
      cratered(
        mix(
          palette.rockDark,
          palette.rockLight,
          0.2 + fbm(x * 2.4 + 4, y * 2.4, z * 2.4, 11) * 0.7
        ),
        x,
        y,
        z,
        ROCK_PITS
      ),
  ],
  [
    TIER.comet,
    (x, y, z) => {
      const ice = mix(
        palette.iceDark,
        palette.iceLight,
        fbm(x * 3, y * 3, z * 3, 5) * 1.2
      );
      return mix(
        ice,
        palette.iceDust,
        smooth(0.56, 0.66, fbm(x * 2 + 9, y * 2, z * 2, 6)) * 0.7
      );
    },
  ],
  [
    TIER.moon,
    (x, y, z) => {
      const ground = mix(
        palette.moonDark,
        palette.moonLight,
        0.35 + fbm(x * 3, y * 3, z * 3, 21) * 0.65
      );
      const seas = smooth(0.5, 0.58, fbm(x * 1.3 + 5, y * 1.3, z * 1.3, 22));
      return cratered(
        mix(ground, palette.craterDark, seas * 0.55),
        x,
        y,
        z,
        MOON_PITS
      );
    },
  ],
  [
    TIER.mars,
    (x, y, z) => {
      const f = fbm(x * 2.5, y * 2.5, z * 2.5, 31);
      let color = mix(palette.marsDeep, palette.marsLight, f);
      color = mix(
        color,
        palette.marsDark,
        smooth(0.54, 0.64, fbm(x * 1.6 + 3, y * 1.6, z * 1.6, 32)) * 0.7
      );
      return mix(
        color,
        palette.snow,
        smooth(0.84, 0.9, Math.abs(y) + (f - 0.5) * 0.18) * 0.9
      );
    },
  ],
  [
    TIER.earth,
    (x, y, z) => {
      const land = smooth(0.5, 0.53, fbm(x * 1.5 + 7, y * 1.5, z * 1.5, 41, 5));
      const ocean = mix(
        palette.earthDeep,
        palette.earthShallow,
        0.3 + fbm(x * 3, y * 3, z * 3, 42) * 0.6
      );
      const ground = mix(
        palette.earthLand,
        palette.earthDesert,
        smooth(0.42, 0.66, fbm(x * 4 + 2, y * 4, z * 4, 43))
      );
      let color = mix(ocean, ground, land);
      color = mix(color, palette.snow, smooth(0.86, 0.92, Math.abs(y)));
      const swirl = fbm(x * 1.2, y * 1.2, z * 1.2, 44) * 2;
      const clouds = smooth(
        0.53,
        0.68,
        fbm(x * 2.6 + swirl, y * 5 + swirl, z * 2.6, 45)
      );
      return mix(color, palette.cloud, clouds * 0.85);
    },
  ],
  [
    TIER.neptune,
    (x, y, z) => {
      const wobble = (fbm(x * 2, y * 2, z * 2, 51) - 0.5) * 3;
      const band = 0.5 + 0.5 * Math.sin(y * 10 + wobble);
      let color = mix(
        palette.neptuneDark,
        palette.neptuneLight,
        band * 0.45 + fbm(x * 4, y * 4, z * 4, 52) * 0.35
      );
      const spot = ((x + 0.28) / 0.24) ** 2 + ((y - 0.24) / 0.11) ** 2;
      if (spot < 1) {
        color = mix(color, palette.neptuneSpot, (1 - spot) * 0.8);
      }
      const streak = smooth(0.6, 0.7, fbm(x * 6, y * 18, z * 6, 53));
      return mix(color, palette.snow, streak * 0.35);
    },
  ],
  [
    TIER.saturn,
    (x, y, z) => {
      const t = y * 6 + (fbm(x * 3, y * 3, z * 3, 61) - 0.5) * 0.6;
      const band = 0.5 + 0.5 * Math.sin(t * 2.3);
      const color = mix(palette.saturnDark, palette.saturnLight, band);
      return mix(
        color,
        palette.saturnDark,
        smooth(0, 0.12, 0.12 - Math.abs(y)) * 0.4
      );
    },
  ],
  [
    TIER.jupiter,
    (x, y, z) => {
      const t = y * 7.5 + (fbm(x * 3.5, y * 3.5, z * 3.5, 71) - 0.5) * 1.8;
      const band = 0.5 + 0.5 * Math.sin(t * 1.9);
      let color = mix(palette.jupiterDark, palette.jupiterLight, band);
      color = mix(
        color,
        palette.jupiterDark,
        smooth(0.6, 0.7, fbm(x * 8, y * 20, z * 8, 72)) * 0.35
      );
      const spot = ((x - 0.3) / 0.27) ** 2 + ((y - 0.32) / 0.15) ** 2;
      if (spot < 1) {
        color = mix(color, palette.jupiterSpot, (1 - spot) ** 0.6 * 0.85);
      }
      return color;
    },
  ],
  [
    TIER.sun,
    (x, y, z) => {
      const grain = fbm(x * 8, y * 8, z * 8, 81);
      let color = mix(palette.sunMid, palette.sunCore, grain * 0.7 + z * 0.45);
      color = mix(color, palette.sunEdge, (1 - z) ** 2 * 0.8);
      const spot = fbm(x * 3 + 4, y * 3, z * 3, 82);
      return mix(color, palette.sunEdge, smooth(0.66, 0.72, spot) * 0.7);
    },
  ],
]);

const LIGHT = (() => {
  const [x, y, z] = [-0.5, -0.62, 0.6];
  const n = Math.hypot(x, y, z);
  return { x: x / n, y: y / n, z: z / n };
})();

const canvasOf = (side: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  return canvas;
};

const sphereImage = (
  R: number,
  pixel: (x: number, y: number, z: number) => [number, number, number, number],
  bumpy = false
) => {
  const side = Math.max(2, Math.ceil(R * 2));
  const canvas = canvasOf(side);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return canvas;
  }
  const image = ctx.createImageData(side, side);
  const { data } = image;
  for (let py = 0; py < side; py += 1) {
    for (let px = 0; px < side; px += 1) {
      const x = (px + 0.5 - side / 2) / R;
      const y = (py + 0.5 - side / 2) / R;
      let edge = 1;
      if (bumpy) {
        const angle = Math.atan2(y, x);
        edge =
          0.9 + 0.1 * noise(Math.cos(angle) * 2.2, Math.sin(angle) * 2.2, 0, 9);
      }
      const d = Math.hypot(x, y) / edge;
      const cover = clamp01((1 - d) * R * edge);
      if (cover <= 0) {
        continue;
      }
      const z = Math.sqrt(Math.max(0, 1 - Math.min(1, d) ** 2));
      const [r, g, b, a] = pixel(x / edge, y / edge, z);
      const i = (py * side + px) * 4;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a * cover;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
};

const cache = new Map<string, HTMLCanvasElement>();

const cached = (key: string, make: () => HTMLCanvasElement) => {
  const hit = cache.get(key);
  if (hit) {
    return hit;
  }
  if (cache.size > 160) {
    cache.clear();
  }
  const made = make();
  cache.set(key, made);
  return made;
};

const surfaceOf = (tier: number, R: number) =>
  cached(`surface:${tier}:${R}`, () => {
    const paint = surfaces.get(tier);
    return sphereImage(
      R,
      (x, y, z) => {
        const [r, g, b] = paint ? paint(x, y, z) : [0, 0, 0];
        return [r, g, b, 255];
      },
      tier === TIER.asteroid
    );
  });

const shadeOf = (R: number, bumpy: boolean) =>
  cached(`shade:${R}:${bumpy}`, () =>
    sphereImage(
      R,
      (x, y, z) => {
        const lit = x * LIGHT.x + y * LIGHT.y + z * LIGHT.z;
        const dark = (1 - smooth(-0.3, 0.75, lit)) * 0.88;
        const shine =
          Math.max(0, lit) ** 26 * 0.3 +
          (1 - z) ** 4 * 0.22 * smooth(-0.1, 0.5, lit);
        const alpha = dark + shine - dark * shine;
        const white = alpha > 0 ? (255 * shine) / alpha : 0;
        return [white, white, white, 255 * alpha];
      },
      bumpy
    )
  );

const glowOf = (tier: number, R: number, pad: number, strength: number) =>
  cached(`glow:${tier}:${R}:${pad}:${strength}`, () => {
    const side = Math.ceil(R * pad * 2);
    const canvas = canvasOf(side);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }
    const c = side / 2;
    const [r, g, b] = rgb(kindOf(tier).glow);
    const gradient = ctx.createRadialGradient(c, c, R * 0.6, c, c, c);
    gradient.addColorStop(0, `rgb(${r} ${g} ${b} / ${strength})`);
    gradient.addColorStop(0.35, `rgb(${r} ${g} ${b} / ${strength * 0.35})`);
    gradient.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, side, side);
    return canvas;
  });

const atmosphereOf = (tier: number, R: number) =>
  cached(`air:${tier}:${R}`, () => {
    const side = Math.ceil(R * 2.6);
    const canvas = canvasOf(side);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }
    const c = side / 2;
    const [r, g, b] = rgb(kindOf(tier).glow);
    const gradient = ctx.createRadialGradient(c, c, R * 0.9, c, c, R * 1.3);
    gradient.addColorStop(0, `rgb(${r} ${g} ${b} / 0)`);
    gradient.addColorStop(0.22, `rgb(${r} ${g} ${b} / 0.55)`);
    gradient.addColorStop(1, `rgb(${r} ${g} ${b} / 0)`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, side, side);
    return canvas;
  });

const sparkleOf = (R: number) =>
  cached(`sparkle:${R}`, () => {
    const side = Math.ceil(R * 4);
    const canvas = canvasOf(side);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }
    const c = side / 2;
    const star = (arm: number, waist: number, alpha: number) => {
      ctx.beginPath();
      for (let i = 0; i < 4; i += 1) {
        const a = (i * Math.PI) / 2;
        const tipX = c + Math.cos(a) * arm;
        const tipY = c + Math.sin(a) * arm;
        const nextA = a + Math.PI / 4;
        const waistX = c + Math.cos(nextA) * waist;
        const waistY = c + Math.sin(nextA) * waist;
        if (i === 0) {
          ctx.moveTo(tipX, tipY);
        } else {
          ctx.lineTo(tipX, tipY);
        }
        ctx.quadraticCurveTo(c, c, waistX, waistY);
      }
      ctx.closePath();
      const gradient = ctx.createRadialGradient(c, c, 0, c, c, arm);
      gradient.addColorStop(0, `rgb(255 255 255 / ${alpha})`);
      gradient.addColorStop(0.4, `rgb(255 232 170 / ${alpha * 0.9})`);
      gradient.addColorStop(1, "rgb(255 200 110 / 0)");
      ctx.fillStyle = gradient;
      ctx.fill();
    };
    star(R * 1.9, R * 0.16, 0.55);
    star(R * 1.05, R * 0.34, 1);
    const core = ctx.createRadialGradient(c, c, 0, c, c, R * 0.55);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(0.5, "rgb(255 240 200 / 0.95)");
    core.addColorStop(1, "rgb(255 210 130 / 0)");
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, side, side);
    return canvas;
  });

const coronaOf = (R: number) =>
  cached(`corona:${R}`, () => {
    const side = Math.ceil(R * 4);
    const canvas = canvasOf(side);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }
    const c = side / 2;
    ctx.translate(c, c);
    for (let i = 0; i < 22; i += 1) {
      const a = (i / 22) * Math.PI * 2 + hash(i, 0, 0, 3) * 0.2;
      const reach = R * (1.35 + hash(i, 1, 0, 3) * 0.55);
      const width = R * (0.08 + hash(i, 2, 0, 3) * 0.08);
      ctx.save();
      ctx.rotate(a);
      const gradient = ctx.createLinearGradient(R * 0.8, 0, reach, 0);
      gradient.addColorStop(0, "rgb(255 220 140 / 0.55)");
      gradient.addColorStop(1, "rgb(255 140 60 / 0)");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(R * 0.8, -width);
      ctx.quadraticCurveTo(reach * 0.8, 0, reach, 0);
      ctx.quadraticCurveTo(reach * 0.8, 0, R * 0.8, width);
      ctx.fill();
      ctx.restore();
    }
    return canvas;
  });

const RING_SQUASH = 0.32;

const ringOf = (R: number, front: boolean) =>
  cached(`ring:${R}:${front}`, () => {
    const side = Math.ceil(R * 4.2);
    const canvas = canvasOf(side);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }
    const c = side / 2;
    if (front) {
      ctx.beginPath();
      ctx.rect(0, c, side, c);
      ctx.clip();
    }
    ctx.translate(c, c);
    ctx.scale(1, RING_SQUASH);
    const bands: [number, number, string][] = [
      [1.24, 1.36, "rgb(214 190 150 / 0.25)"],
      [1.38, 1.5, "rgb(236 214 170 / 0.75)"],
      [1.5, 1.62, "rgb(248 230 190 / 0.9)"],
      [1.68, 1.84, "rgb(222 196 150 / 0.7)"],
      [1.86, 1.93, "rgb(205 180 140 / 0.45)"],
    ];
    for (const [inner, outer, color] of bands) {
      ctx.beginPath();
      ctx.arc(0, 0, R * outer, 0, Math.PI * 2);
      ctx.arc(0, 0, R * inner, 0, Math.PI * 2, true);
      ctx.fillStyle = color;
      ctx.fill();
    }
    return canvas;
  });

const DISK_SQUASH = 0.28;

const diskOf = (R: number, front: boolean) =>
  cached(`disk:${R}:${front}`, () => {
    const side = Math.ceil(R * 4.6);
    const canvas = canvasOf(side);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }
    const c = side / 2;
    if (front) {
      ctx.beginPath();
      ctx.rect(0, c, side, c);
      ctx.clip();
    }
    ctx.translate(c, c);
    ctx.scale(1, DISK_SQUASH);
    const gradient = ctx.createRadialGradient(0, 0, R * 1.08, 0, 0, R * 2.2);
    gradient.addColorStop(0, "rgb(255 250 230 / 0.95)");
    gradient.addColorStop(0.18, "rgb(255 210 140 / 0.9)");
    gradient.addColorStop(0.5, "rgb(240 110 40 / 0.55)");
    gradient.addColorStop(1, "rgb(160 40 20 / 0)");
    ctx.beginPath();
    ctx.arc(0, 0, R * 2.2, 0, Math.PI * 2);
    ctx.arc(0, 0, R * 1.08, 0, Math.PI * 2, true);
    ctx.fillStyle = gradient;
    ctx.fill();
    return canvas;
  });

const lensOf = (R: number) =>
  cached(`lens:${R}`, () => {
    const side = Math.ceil(R * 3.2);
    const canvas = canvasOf(side);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return canvas;
    }
    const c = side / 2;
    const ring = ctx.createRadialGradient(c, c, R * 0.96, c, c, R * 1.4);
    ring.addColorStop(0, "rgb(255 236 200 / 0)");
    ring.addColorStop(0.08, "rgb(255 236 200 / 0.95)");
    ring.addColorStop(0.3, "rgb(255 170 90 / 0.35)");
    ring.addColorStop(1, "rgb(255 120 50 / 0)");
    ctx.fillStyle = ring;
    ctx.fillRect(0, 0, side, side);
    ctx.translate(c, c);
    ctx.scale(1, 0.62);
    ctx.beginPath();
    ctx.arc(0, -R * 0.2, R * 1.32, Math.PI * 1.08, Math.PI * 1.92);
    ctx.lineWidth = R * 0.14;
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgb(255 214 150 / 0.7)";
    ctx.stroke();
    return canvas;
  });

const stamp = (
  ctx: CanvasRenderingContext2D,
  image: HTMLCanvasElement,
  size: number
) => {
  ctx.drawImage(image, -size / 2, -size / 2, size, size);
};

interface Pose {
  x: number;
  y: number;
  r: number;
  grow: number;
  spin: number;
  tilt: number;
  out: { x: number; y: number };
}

const drawTail = (
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  clock: number,
  halo: boolean
) => {
  const { r, out } = pose;
  const reach = halo ? r * (3.4 + Math.sin(clock * 3.1) * 0.25) : r * 1.25;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.rotate(Math.atan2(out.y, out.x));
  const layers: [number, number, string, string][] = [
    [1, 0.95, "rgb(220 240 255 / 0.55)", "rgb(160 210 255 / 0)"],
    [1.35, 0.42, "rgb(140 210 255 / 0.65)", "rgb(80 160 255 / 0)"],
  ];
  for (const [length, width, from, to] of layers) {
    const gradient = ctx.createLinearGradient(0, 0, reach * length, 0);
    gradient.addColorStop(0, from);
    gradient.addColorStop(1, to);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -r * width);
    ctx.quadraticCurveTo(
      reach * length * 0.5,
      -r * width * 0.7,
      reach * length,
      0
    );
    ctx.quadraticCurveTo(reach * length * 0.5, r * width * 0.7, 0, r * width);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
};

const drawHole = (
  ctx: CanvasRenderingContext2D,
  pose: Pose,
  R: number,
  clock: number,
  halo: boolean
) => {
  const { r } = pose;
  ctx.save();
  ctx.rotate(pose.tilt);
  ctx.globalCompositeOperation = "lighter";
  if (halo) {
    stamp(ctx, glowOf(TOP, R, 3.2, 0.5), r * 6.4);
  }
  stamp(ctx, diskOf(R, false), r * 4.6);
  ctx.globalCompositeOperation = "source-over";
  const core = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  core.addColorStop(0, "#000000");
  core.addColorStop(0.85, "#030106");
  core.addColorStop(1, "#140a12");
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalCompositeOperation = "lighter";
  stamp(ctx, lensOf(R), r * 3.2);
  stamp(ctx, diskOf(R, true), r * 4.6);
  ctx.fillStyle = "rgb(255 240 210 / 0.9)";
  for (let i = 0; i < 6; i += 1) {
    const a = clock * 1.6 + (i * Math.PI) / 3;
    const reach = r * (1.35 + (i % 3) * 0.22);
    const sx = Math.cos(a) * reach;
    const sy = Math.sin(a) * reach * DISK_SQUASH;
    if (sy > 0 || Math.abs(sx) > r) {
      ctx.beginPath();
      ctx.arc(sx, sy, r * 0.035, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
};

export const drawBody = (
  ctx: CanvasRenderingContext2D,
  tier: number,
  pose: Pose,
  dpr: number,
  clock: number,
  halo = true
) => {
  const { r } = pose;
  const R = Math.max(2, Math.round(r * dpr));
  ctx.save();
  ctx.translate(pose.x, pose.y);
  ctx.scale(pose.grow, pose.grow);
  if (tier === TOP) {
    drawHole(ctx, pose, R, clock, halo);
    ctx.restore();
    return;
  }
  if (tier === TIER.stardust) {
    const twinkle = 1 + Math.sin(clock * 3.2 + pose.spin * 5) * 0.08;
    ctx.globalCompositeOperation = "lighter";
    if (halo) {
      stamp(ctx, glowOf(tier, R, 2.6, 0.55), r * 5.2 * twinkle);
    }
    ctx.rotate(pose.spin * 0.3);
    stamp(ctx, sparkleOf(R), r * 4 * twinkle);
    ctx.restore();
    return;
  }
  if (tier === TIER.comet) {
    drawTail(ctx, pose, clock, halo);
  }
  ctx.globalCompositeOperation = "lighter";
  if (tier === TIER.sun) {
    const breathe = 1 + Math.sin(clock * 1.7) * 0.03;
    if (halo) {
      stamp(ctx, glowOf(tier, R, 3, 0.65), r * 6 * breathe);
    }
    ctx.save();
    ctx.rotate(clock * 0.06);
    stamp(ctx, coronaOf(R), r * 4 * breathe);
    ctx.restore();
  } else if (halo) {
    stamp(ctx, glowOf(tier, R, 1.7, tier === TIER.comet ? 0.5 : 0.2), r * 3.4);
  }
  ctx.globalCompositeOperation = "source-over";
  if (tier === TIER.saturn) {
    ctx.save();
    ctx.rotate(pose.tilt);
    stamp(ctx, ringOf(R, false), r * 4.2);
    ctx.restore();
  }
  ctx.save();
  ctx.rotate(pose.spin);
  stamp(ctx, surfaceOf(tier, R), r * 2);
  ctx.restore();
  if (tier !== TIER.sun) {
    stamp(ctx, shadeOf(R, tier === TIER.asteroid), r * 2);
  }
  if (halo && (tier === TIER.earth || tier === TIER.neptune)) {
    ctx.globalCompositeOperation = "lighter";
    stamp(ctx, atmosphereOf(tier, R), r * 2.6);
    ctx.globalCompositeOperation = "source-over";
  }
  if (tier === TIER.saturn) {
    ctx.rotate(pose.tilt);
    stamp(ctx, ringOf(R, true), r * 4.2);
  }
  ctx.restore();
};

const iconReach = (tier: number) => {
  if (tier === TOP) {
    return 2.25;
  }
  if (tier === TIER.stardust) {
    return 2.1;
  }
  if (tier === TIER.saturn || tier === TIER.sun) {
    return 1.95;
  }
  if (tier === TIER.comet) {
    return 1.35;
  }
  return 1.04;
};

export const paintIcon = (canvas: HTMLCanvasElement, tier: number) => {
  const size = canvas.clientWidth;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx || size === 0) {
    return;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const r = size / 2 / iconReach(tier);
  drawBody(
    ctx,
    tier,
    {
      grow: 1,
      out: { x: 1, y: -0.6 },
      r,
      spin: 0.4,
      tilt: -0.32,
      x: size / 2,
      y: size / 2,
    },
    dpr,
    0,
    false
  );
};
