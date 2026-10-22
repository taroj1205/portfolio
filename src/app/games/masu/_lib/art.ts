import { affineFrom, pathOf } from "./draw";
import type { Matrix, Op, Paint, Sprite, Stop } from "./draw";
import type { Bottle } from "./pour";
import {
  GLASS_TOP,
  box,
  camera,
  dot,
  frontArc,
  glassBetween,
  heading,
  hull,
  lamps,
  project,
  radiusAt,
  ring,
  seeded,
  shine,
  toward,
  tumbler,
  unit,
  vesselScale,
  vessels,
} from "./scene";
import type { Point, Vec } from "./scene";

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Art {
  box: Box;
  body: string;
  scale: number;
}

export interface Frame {
  cx: number;
  cy: number;
  scale: number;
}

const A = box.outer;
const B = box.inner;
const H = box.height;
const F = box.floor;
const T = A - B;
const BASE = F + tumbler.base;
const TAU = Math.PI * 2;

const n = (value: number) => Number(value.toFixed(2));

const wood = {
  albedo: "#e9cf9f",
  bounce: "#c98f52",
  end: "#c99863",
  ring: "#8f5f30",
  line: "#a8794a",
  seam: "#5b3a1c",
  brand: "#3f1f0c",
  counter: "#3a2416",
  counterFar: "#170d07",
  room: "#0b0604",
  lamp: "#ffcf8a",
  shadow: "#050302",
  glass: "#eef8f4",
  spark: "#ffffff",
  dark: "#1d140c",
} as const;

const rgbOf = (hex: string) =>
  [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));

const hexOf = (rgb: readonly number[]) =>
  `#${rgb
    .map((c) =>
      Math.round(Math.min(255, Math.max(0, c)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;

const toned = (hex: string, light: number, warm = 0) => {
  const [r = 0, g = 0, b = 0] = rgbOf(hex);
  return hexOf([
    r * light * (1 + warm * 0.08),
    g * light,
    b * light * (1 - warm * 0.2),
  ]);
};

const key = unit({ x: lamps.key.x, y: lamps.key.y - H / 2, z: lamps.key.z });

const stopsOf = (stops: readonly Stop[]) =>
  stops
    .map(
      ([offset, colour, opacity]) =>
        `<stop offset="${n(offset)}" stop-color="${colour}" stop-opacity="${n(opacity)}"/>`
    )
    .join("");

const linear = (id: string, from: Point, to: Point, stops: readonly Stop[]) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(from.x)}" y1="${n(from.y)}" x2="${n(to.x)}" y2="${n(to.y)}">${stopsOf(stops)}</linearGradient>`;

const radial = (id: string, at: Point, r: number, stops: readonly Stop[]) =>
  `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(at.x)}" cy="${n(at.y)}" r="${n(r)}">${stopsOf(stops)}</radialGradient>`;

const matrixOf = ({ a, b, c, d, e, f }: Matrix) =>
  `matrix(${n(a)} ${n(b)} ${n(c)} ${n(d)} ${n(e)} ${n(f)})`;

const blur = (id: string, deviation: number) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n(deviation)}"/></filter>`;

const fraction = (hex: string) => rgbOf(hex).map((c) => n(c / 255));

const grain = (
  id: string,
  size: Point,
  frequency: Point,
  seed: number,
  ink: string,
  strength: number
) => {
  const [r, g, b] = fraction(ink);
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${frequency.x} ${frequency.y}" numOctaves="3" seed="${seed}"/><feColorMatrix type="matrix" values="0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} ${n(strength)} 0 0 0 ${n(-strength * 0.5)}"/></filter><rect x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" filter="url(#${id})"/>`;
};

interface Plane {
  id: string;
  corners: readonly [Vec, Vec, Vec, Vec];
  normal: Vec;
  seed: number;
  fine?: boolean;
  open?: boolean;
  extra?: (size: Point) => string;
}

const distance = (a: Vec, b: Vec) =>
  Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

const opening: readonly Vec[] = [
  { x: -B, y: H, z: -B },
  { x: B, y: H, z: -B },
  { x: B, y: H, z: B },
  { x: -B, y: H, z: B },
];

const litOn = (plane: Plane) => {
  const level = dot(plane.normal, plane.corners[0]);
  const along = dot(plane.normal, key);
  return opening.map((corner) => {
    const t = (dot(plane.normal, corner) - level) / along;
    return project(
      corner.x - key.x * t,
      corner.y - key.y * t,
      corner.z - key.z * t
    );
  });
};

const planeSvg = (plane: Plane) => {
  const [p0, p1, , p3] = plane.corners;
  const q = plane.corners.map((c) => project(c.x, c.y, c.z));
  const size = {
    x: distance(p1, p0),
    y: distance(p3, p0),
  };
  const local = matrixOf(
    affineFrom(
      [
        { x: 0, y: 0 },
        { x: size.x, y: 0 },
        { x: 0, y: size.y },
      ],
      [q[0] ?? { x: 0, y: 0 }, q[1] ?? { x: 0, y: 0 }, q[3] ?? { x: 0, y: 0 }]
    )
  );
  const facing = dot(plane.normal, key);
  const lit = toned(wood.albedo, 0.5 + 0.62 * Math.max(0, facing));
  const open = plane.open === true;
  const shade = toned(wood.albedo, open ? 0.46 : 0.5, open ? 1 : 0);
  const shaded = open && facing > 0;
  const base = shaded || facing <= 0 ? shade : lit;
  const { id } = plane;
  const across = plane.fine === true ? 0.9 : 0.38;
  return `<clipPath id="${id}-c"><path d="${pathOf(q)}"/></clipPath><g clip-path="url(#${id}-c)"><g transform="${local}"><rect x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" fill="${base}"/></g>${
    shaded
      ? `${blur(`${id}-s`, 0.9)}<path d="${pathOf(litOn(plane))}" fill="${lit}" filter="url(#${id}-s)"/>`
      : ""
  }<g transform="${local}">${grain(`${id}-g`, size, { x: 0.012, y: across }, plane.seed, wood.line, 1.4)}${grain(`${id}-b`, size, { x: 0.004, y: 0.08 }, plane.seed + 7, wood.bounce, 0.9)}${plane.extra?.(size) ?? ""}</g></g>`;
};

const v = (x: number, y: number, z: number): Vec => ({ x, y, z });

const endGrain = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  light: number
) => {
  const roll = seeded(id.length * 97 + Math.round(x * 13 + y * 7));
  const cx = x + (roll() - 0.5) * w * 3;
  const cy = y + h + roll() * h * 2;
  const rings = Array.from(
    { length: 14 },
    (_, i) =>
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(h * 0.6 + i * 1.15 + roll() * 0.4)}" fill="none" stroke="${wood.ring}" stroke-opacity="${n(0.18 + roll() * 0.2)}" stroke-width="${n(0.18 + roll() * 0.2)}"/>`
  ).join("");
  return `<clipPath id="${id}"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"/></clipPath><g clip-path="url(#${id})"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${toned(wood.end, light)}"/>${rings}</g><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${wood.seam}" stroke-opacity="0.45" stroke-width="0.22"/>`;
};

const joints =
  (id: string, from: number, light: number, odd: boolean) => (size: Point) =>
    [0, 1, 2, 3, 4]
      .filter((i) => i % 2 === (odd ? 1 : 0))
      .map((i) =>
        endGrain(
          `${id}${i}`,
          from < 0 ? size.x - T : 0,
          (size.y * i) / 5,
          T,
          size.y / 5,
          light
        )
      )
      .join("");

const brand = (size: Point) =>
  `<filter id="masu-burn" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="0.35"/></filter><g filter="url(#masu-burn)" fill="none" stroke="${wood.brand}" stroke-opacity="0.72" stroke-linejoin="round" style="mix-blend-mode:multiply"><circle cx="${n(size.x * 0.46)}" cy="${n(size.y * 0.52)}" r="10.5" stroke-width="1.15"/><path d="M${n(size.x * 0.46)} ${n(size.y * 0.52 - 6)}l6 6l-6 6l-6 -6z" stroke-width="1.4"/></g>`;

const fade = (
  id: string,
  size: Point,
  stops: readonly Stop[],
  vertical = true
) =>
  `${linear(id, { x: 0, y: 0 }, vertical ? { x: 0, y: size.y } : { x: size.x, y: 0 }, stops)}<rect x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" fill="url(#${id})"/>`;

const edge = (
  points: readonly Point[],
  colour: string,
  alpha: number,
  width: number
) =>
  `<path d="${pathOf(points, false)}" fill="none" stroke="${colour}" stroke-opacity="${n(alpha)}" stroke-width="${n(width)}" stroke-linecap="round"/>`;

const cornerSeam = (x: number, size: Point) =>
  `<rect x="${n(x)}" y="0" width="${n(T)}" height="${n(size.y)}" fill="${wood.end}" fill-opacity="0.32"/><path d="M${n(x === 0 ? T : x)} 0V${n(size.y)}" stroke="${wood.seam}" stroke-opacity="0.5" stroke-width="0.25"/>`;

const insideBody = () =>
  [
    planeSvg({
      corners: [v(-B, F, -B), v(B, F, -B), v(B, F, B), v(-B, F, B)],
      extra: (size) =>
        `${fade("masu-floorAo", size, [
          [0, wood.shadow, 0.35],
          [0.25, wood.shadow, 0],
          [0.8, wood.shadow, 0],
          [1, wood.shadow, 0.3],
        ])}${fade(
          "masu-floorAoX",
          size,
          [
            [0, wood.shadow, 0.3],
            [0.2, wood.shadow, 0],
            [0.85, wood.shadow, 0],
            [1, wood.shadow, 0.25],
          ],
          false
        )}`,
      id: "masu-floor",
      normal: v(0, 1, 0),
      open: true,
      seed: 3,
    }),
    planeSvg({
      corners: [v(-B, H, -B), v(B, H, -B), v(B, F, -B), v(-B, F, -B)],
      extra: (size) =>
        fade("masu-backAo", size, [
          [0, wood.shadow, 0],
          [0.7, wood.shadow, 0.05],
          [1, wood.shadow, 0.38],
        ]),
      id: "masu-back",
      normal: v(0, 0, 1),
      open: true,
      seed: 5,
    }),
    planeSvg({
      corners: [v(-B, H, B), v(-B, H, -B), v(-B, F, -B), v(-B, F, B)],
      extra: (size) =>
        `${fade("masu-leftAo", size, [
          [0, wood.shadow, 0],
          [0.7, wood.shadow, 0.06],
          [1, wood.shadow, 0.35],
        ])}${fade(
          "masu-leftCorner",
          size,
          [
            [0, wood.shadow, 0],
            [0.85, wood.shadow, 0],
            [1, wood.shadow, 0.3],
          ],
          false
        )}`,
      id: "masu-left",
      normal: v(1, 0, 0),
      open: true,
      seed: 9,
    }),
    planeSvg({
      corners: [v(-A, H, -A), v(A, H, -A), v(A, H, -B), v(-A, H, -B)],
      extra: (size) => `${cornerSeam(0, size)}${cornerSeam(size.x - T, size)}`,
      fine: true,
      id: "masu-rimBack",
      normal: v(0, 1, 0),
      seed: 11,
    }),
    planeSvg({
      corners: [v(-A, H, B), v(-A, H, -B), v(-B, H, -B), v(-B, H, B)],
      fine: true,
      id: "masu-rimLeft",
      normal: v(0, 1, 0),
      seed: 13,
    }),
    edge([project(-B, H, -B), project(B, H, -B)], wood.spark, 0.5, 0.35),
    edge([project(-B, H, B), project(-B, H, -B)], wood.spark, 0.32, 0.3),
    edge([project(-A, H, -A), project(A, H, -A)], wood.spark, 0.18, 0.3),
  ].join("");

const outsideBody = () =>
  [
    planeSvg({
      corners: [v(-A, H, A), v(A, H, A), v(A, 0, A), v(-A, 0, A)],
      extra: (size) =>
        `${joints("masu-fl", 1, 0.86, true)(size)}${joints("masu-fr", -1, 0.86, true)(size)}${brand(size)}${fade(
          "masu-frontShade",
          size,
          [
            [0, wood.spark, 0.08],
            [0.5, wood.shadow, 0],
            [1, wood.shadow, 0.28],
          ]
        )}`,
      id: "masu-front",
      normal: v(0, 0, 1),
      seed: 17,
    }),
    planeSvg({
      corners: [v(A, H, A), v(A, H, -A), v(A, 0, -A), v(A, 0, A)],
      extra: (size) =>
        `${joints("masu-rf", 1, 0.62, false)(size)}${joints("masu-rb", -1, 0.62, false)(size)}${fade(
          "masu-rightShade",
          size,
          [
            [0, wood.shadow, 0],
            [1, wood.shadow, 0.3],
          ]
        )}`,
      id: "masu-right",
      normal: v(1, 0, 0),
      seed: 19,
    }),
    planeSvg({
      corners: [v(-A, H, B), v(A, H, B), v(A, H, A), v(-A, H, A)],
      extra: (size) => `${cornerSeam(0, size)}${cornerSeam(size.x - T, size)}`,
      fine: true,
      id: "masu-rimFront",
      normal: v(0, 1, 0),
      seed: 23,
    }),
    planeSvg({
      corners: [v(B, H, B), v(B, H, -B), v(A, H, -B), v(A, H, B)],
      fine: true,
      id: "masu-rimRight",
      normal: v(0, 1, 0),
      seed: 29,
    }),
    edge(
      [project(-A, H, A), project(A, H, A), project(A, H, -A)],
      wood.spark,
      0.55,
      0.4
    ),
    edge([project(A, H, A), project(A, 0, A)], wood.spark, 0.3, 0.35),
    edge(
      [project(-B, H, B), project(B, H, B), project(B, H, -B)],
      wood.spark,
      0.28,
      0.3
    ),
    edge(
      [project(-A, 0, A), project(A, 0, A), project(A, 0, -A)],
      wood.shadow,
      0.5,
      0.6
    ),
  ].join("");

const boxOf = (points: readonly Point[], pad: number): Box => {
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const x = Math.floor(Math.min(...xs) - pad);
  const y = Math.floor(Math.min(...ys) - pad);
  return {
    h: Math.ceil(Math.max(...ys) + pad) - y,
    w: Math.ceil(Math.max(...xs) + pad) - x,
    x,
    y,
  };
};

const masuBox = boxOf(
  [-1, 1].flatMap((x) =>
    [-1, 1].flatMap((z) => [project(x * A, 0, z * A), project(x * A, H, z * A)])
  ),
  3
);

const glassBox = boxOf(glassBetween(F, GLASS_TOP + 6), 3);

const silhouette = glassBetween(F, GLASS_TOP);

const STRIPS = 64;
const TAPER = (tumbler.top - tumbler.bottom) / tumbler.height;
const MID = (F + GLASS_TOP) / 2;

const onGlass = (angle: number, y: number) => {
  const r = radiusAt(y);
  return project(Math.cos(angle) * r, y, Math.sin(angle) * r);
};

const facingOf = (angle: number) => {
  const r = radiusAt(MID);
  const at = v(Math.cos(angle) * r, MID, Math.sin(angle) * r);
  const normal = unit(v(Math.cos(angle), -TAPER, Math.sin(angle)));
  return {
    bright: shine(at, normal, 70),
    facing: dot(normal, heading(at, camera)),
  };
};

const strip = (angle: number, width: number, from: number, to: number) =>
  pathOf([
    onGlass(angle - width, to),
    onGlass(angle + width, to),
    onGlass(angle + width, from),
    onGlass(angle - width, from),
  ]);

const wall = (
  id: string,
  from: number,
  to: number,
  strength: number,
  darkness: number
) => {
  const width = (to - from) / STRIPS / 2;
  const strips = Array.from({ length: STRIPS }, (_, i) => {
    const angle = from + (to - from) * ((i + 0.5) / STRIPS);
    const { bright, facing } = facingOf(angle);
    const dark = darkness * Math.min(1, Math.max(0, (0.62 - facing) / 0.42));
    const shade =
      dark > 0.01
        ? `<path d="${strip(angle, width, BASE, GLASS_TOP)}" fill="${wood.dark}" fill-opacity="${n(dark)}"/>`
        : "";
    const light =
      bright * strength > 0.015
        ? `<path d="${strip(angle, width, F, GLASS_TOP)}" fill="url(#${id})" fill-opacity="${n(Math.min(1, bright * strength))}"/>`
        : "";
    return shade + light;
  }).join("");
  return `${blur(`${id}-soft`, 0.22)}${linear(
    id,
    project(0, GLASS_TOP, 0),
    project(0, F, 0),
    [
      [0, wood.spark, 0.95],
      [0.12, wood.spark, 0.7],
      [0.72, wood.spark, 0.45],
      [0.84, wood.spark, 0.8],
      [1, wood.spark, 0.95],
    ]
  )}<g filter="url(#${id}-soft)" shape-rendering="crispEdges">${strips}</g>`;
};

const silhouetteSide = (sign: -1 | 1) =>
  [GLASS_TOP, F].map((y) => onGlass(toward - (sign * Math.PI) / 2, y));

const backArc = (y: number, r: number) =>
  ring(y, r, toward - Math.PI / 2, toward - (Math.PI * 3) / 2, 32);

const glassBackBody = () =>
  [
    linear("glass-tint", project(0, GLASS_TOP, 0), project(0, F, 0), [
      [0, wood.glass, 0.05],
      [1, wood.glass, 0.02],
    ]),
    `<path d="${pathOf(silhouette)}" fill="url(#glass-tint)"/>`,
    wall(
      "glass-backFall",
      toward + Math.PI / 2,
      toward + (Math.PI * 3) / 2,
      0.1,
      0
    ),
    radial("glass-floor", project(-4, BASE, -4), radiusAt(BASE) * 1.6, [
      [0, wood.spark, 0.22],
      [0.6, wood.spark, 0.08],
      [1, wood.spark, 0.18],
    ]),
    `<path d="${pathOf(ring(BASE, radiusAt(BASE) - tumbler.wall, 0, TAU, 48))}" fill="url(#glass-floor)"/>`,
    edge(backArc(BASE, radiusAt(BASE) - tumbler.wall), wood.spark, 0.4, 0.3),
    edge(backArc(GLASS_TOP, tumbler.top), wood.spark, 0.55, 0.45),
    edge(backArc(GLASS_TOP, tumbler.top - tumbler.wall), wood.spark, 0.3, 0.3),
  ].join("");

const glassFrontBody = () => {
  const foot = [
    ...frontArc(BASE, radiusAt(BASE) + 0.05),
    ...frontArc(F, radiusAt(F) + 0.05).toReversed(),
  ];
  const lip = [
    ...ring(GLASS_TOP, tumbler.top, 0, TAU, 64),
    ...ring(GLASS_TOP, tumbler.top - tumbler.wall, 0, TAU, 64).toReversed(),
  ];
  return [
    linear(
      "glass-foot",
      project(0, BASE, radiusAt(BASE)),
      project(0, F, radiusAt(F)),
      [
        [0, wood.spark, 0.55],
        [0.1, wood.spark, 0.12],
        [0.35, wood.dark, 0.22],
        [0.7, wood.glass, 0.14],
        [0.92, wood.spark, 0.35],
        [1, wood.spark, 0.7],
      ]
    ),
    `<path d="${pathOf(foot)}" fill="url(#glass-foot)"/>`,
    wall("glass-fall", toward - Math.PI / 2, toward + Math.PI / 2, 0.75, 0.42),
    edge(frontArc(BASE, radiusAt(BASE) - tumbler.wall), wood.spark, 0.5, 0.3),
    edge(silhouetteSide(-1), wood.spark, 0.8, 0.32),
    edge(silhouetteSide(1), wood.spark, 0.45, 0.28),
    edge(frontArc(F + 0.25, radiusAt(F)), wood.spark, 0.75, 0.4),
    `<path d="${pathOf(lip)}" fill="${wood.glass}" fill-opacity="0.32" fill-rule="evenodd"/>`,
    edge(frontArc(GLASS_TOP, tumbler.top), wood.spark, 0.95, 0.5),
    edge(frontArc(GLASS_TOP, tumbler.top - tumbler.wall), wood.spark, 0.5, 0.3),
  ].join("");
};

const smoothPath = (points: readonly Point[]) => {
  const at = (i: number) =>
    points[(i + points.length) % points.length] ?? { x: 0, y: 0 };
  const curves = points.map((_, i) => {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    return `C${n(p1.x + (p2.x - p0.x) / 6)} ${n(p1.y + (p2.y - p0.y) / 6)} ${n(p2.x - (p3.x - p1.x) / 6)} ${n(p2.y - (p3.y - p1.y) / 6)} ${n(p2.x)} ${n(p2.y)}`;
  });
  return `M${n(at(0).x)} ${n(at(0).y)}${curves.join("")}Z`;
};

const bottleBody = (bottle: Bottle) => {
  const vessel = vessels[bottle];
  const body = smoothPath(vessel.outline.map(([x, y]) => ({ x, y })));
  const width = Math.max(...vessel.outline.map(([x]) => x));
  const height = Math.max(...vessel.outline.map(([, y]) => y));
  const top = Math.min(...vessel.outline.map(([, y]) => y));
  const id = `bottle-${bottle}`;
  const shift = `translate(${-vessel.lip.x} ${-vessel.lip.y})`;
  const bodies: Record<Bottle, { stops: readonly Stop[]; marks: string }> = {
    isshobin: {
      marks: `<rect x="-40" y="214" width="80" height="120" fill="#f4ead7"/><rect x="-40" y="214" width="80" height="8" fill="#b8321f"/><text x="0" y="0" transform="translate(0 278) scale(-1 1)" font-family="Hiragino Mincho ProN, Yu Mincho, serif" font-size="46" font-weight="700" text-anchor="middle" dominant-baseline="middle" fill="#2b1c12">酒</text>`,
      stops: [
        [0, "#123a22", 1],
        [0.22, "#5e9b6c", 1],
        [0.36, "#1f4a2c", 1],
        [1, "#06140b", 1],
      ],
    },
    katakuchi: {
      marks: `<ellipse cx="-1" cy="1" rx="60" ry="5" fill="#b8321f"/>`,
      stops: [
        [0, "#1b0d0b", 1],
        [0.28, "#6a3328", 1],
        [0.45, "#2a120e", 1],
        [1, "#120706", 1],
      ],
    },
    tokkuri: {
      marks: `<g stroke="#2c3f8f" fill="none"><path d="M-50 60H50M-50 66H50M-50 126H50" stroke-width="2.4"/><path d="M-43 96a7 7 0 0 1 14 0M-25 96a7 7 0 0 1 14 0M-7 96a7 7 0 0 1 14 0M11 96a7 7 0 0 1 14 0M29 96a7 7 0 0 1 14 0" stroke-width="3"/></g>`,
      stops: [
        [0, "#bdb8aa", 1],
        [0.28, "#f6f3ea", 1],
        [0.5, "#e2ddd0", 1],
        [1, "#7f7a6d", 1],
      ],
    },
  };
  const { stops, marks } = bodies[bottle];
  const span = { height: height - top + 8, y: top - 4 };
  const band = (
    x: number,
    w: number,
    fill: string,
    filter: string,
    opacity: number
  ) =>
    `<rect x="${n(x)}" y="${n(span.y)}" width="${n(w)}" height="${n(span.height)}" fill="${fill}" fill-opacity="${n(opacity)}" filter="url(#${id}-${filter})"/>`;
  return `${linear(`${id}-body`, { x: -width, y: 0 }, { x: width, y: 0 }, stops)}${linear(
    `${id}-fall`,
    { x: 0, y: top },
    { x: 0, y: height },
    [
      [0, wood.spark, 0.16],
      [0.35, wood.shadow, 0],
      [0.85, wood.shadow, 0.22],
      [1, wood.shadow, 0.5],
    ]
  )}${blur(`${id}-ink`, 0.6)}${blur(`${id}-glaze`, width * 0.05)}${blur(`${id}-sheen`, width * 0.015)}<clipPath id="${id}-clip"><path d="${body}"/></clipPath><g transform="${shift}"><path d="${body}" fill="url(#${id}-body)"/><g clip-path="url(#${id}-clip)"><g filter="url(#${id}-ink)" opacity="0.88">${marks}</g><rect x="${n(-width)}" y="${n(span.y)}" width="${n(width * 2)}" height="${n(span.height)}" fill="url(#${id}-fall)"/>${band(-width * 0.58, width * 0.22, wood.spark, "glaze", 0.32)}${band(-width * 0.5, width * 0.06, wood.spark, "sheen", 0.75)}${band(width * 0.8, width * 0.08, wood.lamp, "glaze", 0.3)}</g><path d="${body}" fill="none" stroke="${wood.shadow}" stroke-opacity="0.35" stroke-width="0.8"/></g>`;
};

const bottleBox = (bottle: Bottle): Box =>
  boxOf(
    vessels[bottle].outline.map(([x, y]) => ({
      x: x - vessels[bottle].lip.x,
      y: y - vessels[bottle].lip.y,
    })),
    3
  );

export const sprites: Record<Sprite, Art> = {
  glassBack: { body: glassBackBody(), box: glassBox, scale: 1 },
  glassFront: { body: glassFrontBody(), box: glassBox, scale: 1 },
  inside: { body: insideBody(), box: masuBox, scale: 1 },
  isshobin: {
    body: bottleBody("isshobin"),
    box: bottleBox("isshobin"),
    scale: vesselScale,
  },
  katakuchi: {
    body: bottleBody("katakuchi"),
    box: bottleBox("katakuchi"),
    scale: vesselScale,
  },
  outside: { body: outsideBody(), box: masuBox, scale: 1 },
  tokkuri: {
    body: bottleBody("tokkuri"),
    box: bottleBox("tokkuri"),
    scale: vesselScale,
  },
};

export const docOf = (view: Box, width: number, height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(view.x)} ${n(view.y)} ${n(view.w)} ${n(view.h)}" width="${Math.round(width)}" height="${Math.round(height)}" preserveAspectRatio="none">${body}</svg>`;

export const spriteDoc = (art: Art, scale: number) =>
  docOf(art.box, art.box.w * scale, art.box.h * scale, art.body);

export const dataUri = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const footprint = [
  project(-A, 0, -A),
  project(A, 0, -A),
  project(A, 0, A),
  project(-A, 0, A),
];

const castShadow = () => {
  const drop = H / key.y;
  const top = [v(-A, H, -A), v(A, H, -A), v(A, H, A), v(-A, H, A)].map((c) =>
    project(c.x - key.x * drop, 0, c.z - key.z * drop)
  );
  return [...footprint, ...top];
};

export const room = (width: number, height: number, frame: Frame) => {
  const s = frame.scale;
  const toScreen = (p: Point) => ({
    x: frame.cx + p.x * s,
    y: frame.cy + p.y * s,
  });
  const edgeAt = (z: number) => toScreen(project(0, 0, z)).y;
  const back = Math.max(-40, edgeAt(-320));
  const roll = seeded(4242);
  const tints = ["#ffb055", "#ff8a4a", "#ffd08a", "#e8643a"];
  const bokeh = Array.from({ length: 18 }, () => {
    const x = roll() * width;
    const y = roll() * Math.max(40, back) * 1.05;
    const r = (10 + roll() * 36) * Math.max(1, s / 2.4);
    const tint = Math.floor(roll() * tints.length);
    return `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="url(#room-bokeh${tint})" opacity="${n(0.08 + roll() * 0.2)}"/>`;
  }).join("");
  const seams = [-200, -120, -40, 50, 150, 270, 420]
    .map((z) => edgeAt(z))
    .filter((y) => y > back && y < height + 4)
    .map(
      (y) =>
        `<path d="M0 ${n(y)}H${n(width)}" stroke="#000" stroke-opacity="0.35" stroke-width="${n(Math.max(0.6, s * 0.3))}"/>`
    )
    .join("");
  const lamp = toScreen(project(-10, 0, 10));
  const shadow = hull(castShadow()).map(toScreen);
  const contact = footprint.map(toScreen);
  return `<defs>${linear("room-wall", { x: 0, y: 0 }, { x: 0, y: back }, [
    [0, "#080403", 1],
    [1, "#1a0f08", 1],
  ])}${linear("room-counter", { x: 0, y: back }, { x: 0, y: height }, [
    [0, wood.counterFar, 1],
    [0.35, wood.counter, 1],
    [1, "#1f130b", 1],
  ])}${radial("room-pool", lamp, 210 * s, [
    [0, wood.lamp, 0.26],
    [0.45, "#a0612c", 0.1],
    [1, "#a0612c", 0],
  ])}${tints.map((tint, i) => `<radialGradient id="room-bokeh${i}"><stop offset="0" stop-color="${tint}"/><stop offset="0.75" stop-color="${tint}" stop-opacity="0.55"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient>`).join("")}${radial(
    "room-vignette",
    { x: frame.cx, y: frame.cy },
    Math.max(width, height) * 0.85,
    [
      [0.35, wood.shadow, 0],
      [1, wood.shadow, 0.72],
    ]
  )}${blur("room-soft", Math.max(2, s * 5))}${blur("room-contact", Math.max(1, s * 1.4))}${blur("room-far", 3)}<filter id="room-grain" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${n(0.0035 / Math.max(1, s / 2))} ${n(0.07 / Math.max(1, s / 2))}" numOctaves="3" seed="8"/><feColorMatrix type="matrix" values="0 0 0 0 0.05 0 0 0 0 0.025 0 0 0 0 0.01 1.6 0 0 0 -0.8"/></filter>${linear(
    "room-depth",
    { x: 0, y: back },
    { x: 0, y: height },
    [
      [0, "#000", 0],
      [0.4, "#fff", 1],
      [1, "#fff", 1],
    ]
  )}<mask id="room-near"><rect width="${width}" height="${height}" fill="url(#room-depth)"/></mask></defs><rect width="${width}" height="${height}" fill="${wood.room}"/><rect width="${width}" height="${n(Math.max(0, back))}" fill="url(#room-wall)"/><g filter="url(#room-far)">${bokeh}</g><rect y="${n(back)}" width="${width}" height="${n(height - back)}" fill="url(#room-counter)"/><g mask="url(#room-near)"><rect y="${n(back)}" width="${width}" height="${n(height - back)}" filter="url(#room-grain)"/>${seams}</g><rect y="${n(back)}" width="${width}" height="${n(height - back)}" fill="url(#room-pool)"/><path d="M0 ${n(back)}H${width}" stroke="${wood.lamp}" stroke-opacity="0.12" stroke-width="1.2"/><path d="${pathOf(shadow)}" fill="${wood.shadow}" fill-opacity="0.55" filter="url(#room-soft)"/><path d="${pathOf(contact)}" fill="${wood.shadow}" fill-opacity="0.85" filter="url(#room-contact)"/><rect width="${width}" height="${height}" fill="url(#room-vignette)"/>`;
};

const paintOf = (paint: Paint, id: string, defs: string[]) => {
  if (paint.kind === "solid") {
    return paint.colour;
  }
  defs.push(
    paint.kind === "linear"
      ? linear(id, paint.from, paint.to, paint.stops)
      : radial(id, { x: 0, y: 0 }, paint.r, paint.stops)
  );
  return `url(#${id})`;
};

export const opsSvg = (ops: readonly Op[], prefix: string) => {
  const defs: string[] = [];
  const clips = new Map<string, string>();
  let count = 0;
  let body = "";
  const fresh = () => {
    count += 1;
    return `${prefix}${count}`;
  };
  const clipOf = (points: readonly Point[]) => {
    const d = pathOf(points);
    const known = clips.get(d);
    if (known !== undefined) {
      return known;
    }
    const id = fresh();
    clips.set(d, id);
    defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
    return id;
  };
  for (const op of ops) {
    let inner = "";
    if (op.kind === "fill") {
      inner = `<path d="${op.d}" fill="${paintOf(op.paint, fresh(), defs)}"${op.matrix ? ` transform="${matrixOf(op.matrix)}"` : ""}/>`;
    } else if (op.kind === "stroke") {
      inner = `<path d="${op.d}" fill="none" stroke="${paintOf(op.paint, fresh(), defs)}" stroke-width="${n(op.width)}" stroke-linecap="round" stroke-linejoin="round"/>`;
    } else if (op.kind === "sprite") {
      inner = `<use href="#sprite-${op.name}"${op.matrix ? ` transform="${matrixOf(op.matrix)}"` : ""}/>`;
    } else {
      const below = fresh();
      body = `<g id="${below}">${body}</g>`;
      inner = `<use href="#${below}" transform="${matrixOf(op.matrix)}"/>`;
    }
    const wrap = [
      op.clip ? `clip-path="url(#${clipOf(op.clip)})"` : "",
      op.alpha === undefined ? "" : `opacity="${n(op.alpha)}"`,
      op.blend ? `style="mix-blend-mode:${op.blend}"` : "",
    ]
      .filter(Boolean)
      .join(" ");
    body += wrap ? `<g ${wrap}>${inner}</g>` : inner;
  }
  return { body, defs: defs.join("") };
};

const spriteDefs = (names: readonly Sprite[]) =>
  [...new Set(names)]
    .map((name) => `<g id="sprite-${name}">${sprites[name].body}</g>`)
    .join("");

export const stillDoc = (
  width: number,
  height: number,
  frame: Frame,
  ops: readonly Op[],
  scenery = true
) => {
  const { body, defs } = opsSvg(ops, "still-");
  const used = ops.flatMap((op) => (op.kind === "sprite" ? [op.name] : []));
  return docOf(
    { h: height, w: width, x: 0, y: 0 },
    width,
    height,
    `${scenery ? room(width, height, frame) : ""}<defs>${spriteDefs(used)}${defs}</defs><g transform="translate(${n(frame.cx)} ${n(frame.cy)}) scale(${n(frame.scale)})">${body}</g>`
  );
};
