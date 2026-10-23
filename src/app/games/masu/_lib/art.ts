import { affineFrom, flatten, pathOf } from "./draw";
import type { Matrix, Op, Paint, Sprite, Stop } from "./draw";
import type { Bottle } from "./pour";
import {
  GLASS_TOP,
  box,
  camera,
  dot,
  frontArc,
  glassBetween,
  glintOn,
  heading,
  hull,
  lamps,
  poseOf,
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
import type { Point, Vec, View } from "./scene";

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
  end: "#d6b07c",
  ring: "#8f5f30",
  line: "#a8794a",
  seam: "#5b3a1c",
  brand: "#3f1f0c",
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

const detail = (id: string, size: Point, seed: number, fine: number) =>
  `<filter id="${id}-f" filterUnits="userSpaceOnUse" x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.05 ${n(1.7 * fine)}" numOctaves="2" seed="${seed + 3}"/><feColorMatrix type="matrix" values="0 0 0 0 ${fraction(wood.line).join(" 0 0 0 0 ")} 1.6 0 0 0 -0.78"/></filter><filter id="${id}-p" filterUnits="userSpaceOnUse" x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.55 ${n(2.6 * fine)}" numOctaves="1" seed="${seed + 5}"/><feColorMatrix type="matrix" values="0 0 0 0 ${fraction(wood.seam).join(" 0 0 0 0 ")} 9 0 0 0 -6.1"/></filter><filter id="${id}-r" filterUnits="userSpaceOnUse" x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.009 0.035" numOctaves="2" seed="${seed + 9}"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.95 0 0 0 0 0.86 1.1 0 0 0 -0.5"/></filter><rect x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" filter="url(#${id}-f)" opacity="0.55"/><rect x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" filter="url(#${id}-p)" opacity="0.45"/><rect x="-4" y="-4" width="${n(size.x + 8)}" height="${n(size.y + 8)}" filter="url(#${id}-r)" opacity="0.32"/>`;

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
  }<g transform="${local}">${grain(`${id}-g`, size, { x: 0.012, y: across }, plane.seed, wood.line, 1.4)}${grain(`${id}-b`, size, { x: 0.004, y: 0.08 }, plane.seed + 7, wood.bounce, 0.9)}${detail(id, size, plane.seed, plane.fine === true ? 1.6 : 1)}${plane.extra?.(size) ?? ""}</g></g>`;
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
    { length: 30 },
    (_, i) =>
      `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(h * 0.5 + i * 0.55 + roll() * 0.25)}" fill="none" stroke="${wood.ring}" stroke-opacity="${n(0.16 + roll() * 0.26)}" stroke-width="${n(0.1 + roll() * 0.14)}"/>`
  ).join("");
  return `<clipPath id="${id}"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}"/></clipPath><g clip-path="url(#${id})"><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${toned(wood.end, light, 0.4)}"/>${rings}<path d="M${n(cx)} ${n(cy)}L${n(x + w * (0.2 + roll() * 0.6))} ${n(y - 1)}" stroke="${wood.seam}" stroke-opacity="0.35" stroke-width="0.12"/><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h * 0.3)}" fill="${wood.spark}" fill-opacity="0.1"/></g><rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="none" stroke="${wood.seam}" stroke-opacity="0.5" stroke-width="0.2"/>`;
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

const brandMark = (x: number, y: number, scale: number) =>
  `<circle cx="${n(x)}" cy="${n(y)}" r="10.5" stroke-width="${n(1.15 * scale)}"/><path d="M${n(x)} ${n(y - 6)}l6 6l-6 6l-6 -6z" stroke-width="${n(1.4 * scale)}"/>`;

const brand = (size: Point) => {
  const x = size.x * 0.46;
  const y = size.y * 0.52;
  return `<filter id="masu-scorch" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.3"/></filter><filter id="masu-burn" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="noise"/><feDisplacementMap in="SourceGraphic" in2="noise" scale="0.7" xChannelSelector="R" yChannelSelector="G" result="rough"/><feGaussianBlur in="rough" stdDeviation="0.22" result="soft"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -0.6 1.2" result="mottle"/><feComposite in="soft" in2="mottle" operator="in"/></filter><g fill="none" stroke-linejoin="round"><g filter="url(#masu-scorch)" stroke="${wood.ring}" stroke-opacity="0.32" style="mix-blend-mode:multiply">${brandMark(x, y, 2.6)}</g><g stroke="${wood.spark}" stroke-opacity="0.35" transform="translate(0 0.55)">${brandMark(x, y, 0.9)}</g><g filter="url(#masu-burn)" stroke="${wood.brand}" stroke-opacity="0.9" style="mix-blend-mode:multiply">${brandMark(x, y, 1.05)}</g></g>`;
};

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

const handle = (from: Point, to: Point, chord: number) => {
  const x = (to.x - from.x) / 6;
  const y = (to.y - from.y) / 6;
  const k = Math.min(1, chord / 3 / (Math.hypot(x, y) || 1));
  return { x: x * k, y: y * k };
};

const smoothPath = (points: readonly Point[]) => {
  const at = (i: number) =>
    points[(i + points.length) % points.length] ?? { x: 0, y: 0 };
  const curves = points.map((_, i) => {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const chord = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const out = handle(p0, p2, chord);
    const back = handle(p1, p3, chord);
    return `C${n(p1.x + out.x)} ${n(p1.y + out.y)} ${n(p2.x - back.x)} ${n(p2.y - back.y)} ${n(p2.x)} ${n(p2.y)}`;
  });
  return `M${n(at(0).x)} ${n(at(0).y)}${curves.join("")}Z`;
};

const strokes = {
  吟: "M-9 -3V4.5M-9 -3H-4V4.5M-9 3.8H-4M4 -9.5Q1.2 -4.8 -2.4 -1.6M4 -9.5Q6.8 -4.8 10 -1.8M2.6 -2.4L5.4 -0.8M0.2 2.6H8Q5.4 6.6 2.4 9.8",
  酒: "M-8.6 -8.8L-6.2 -7M-9.4 -3.2L-7 -1.6M-9.6 8.8Q-8 4.6 -5.6 1.4M-3.6 -8.6H9.6M-2.6 -4.6V9.4M-2.6 -4.6H8.6V9.4M-2.6 8.9H8.6M1.8 -8.6V0.6Q1.8 2.4 -0.6 3M5.2 -8.6V2.2Q5.2 3 8.6 3M-2.6 5.6H8.6",
} as const;

const upright = (() => {
  const { a, b, c, d } = poseOf(0, 1);
  return Math.sign(a * d - b * c);
})();

const glyph = (
  char: keyof typeof strokes,
  x: number,
  y: number,
  size: number
) =>
  `<path data-glyph="${char}" d="${strokes[char]}" transform="${matrixOf({ a: (upright * size) / 20, b: 0, c: 0, d: size / 20, e: x, f: y })}" fill="none" stroke="#2b1c12" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`;

const bottleBody = (bottle: Bottle) => {
  const vessel = vessels[bottle];
  const body = smoothPath(vessel.outline.map(([x, y]) => ({ x, y })));
  const width = Math.max(...vessel.outline.map(([x]) => x));
  const height = Math.max(...vessel.outline.map(([, y]) => y));
  const top = Math.min(...vessel.outline.map(([, y]) => y));
  const id = `bottle-${bottle}`;
  const shift = `translate(${-vessel.lip.x} ${-vessel.lip.y})`;
  const bodies: Record<
    Bottle,
    { stops: readonly Stop[]; marks: string; glyphs: string; paper: string }
  > = {
    isshobin: {
      glyphs: `${glyph("吟", 0, 57, 18)}${glyph("酒", 0, 276, 50)}`,
      paper: `<rect x="-13" y="34" width="26" height="46"/><path d="M-38 150Q0 128 38 150V174Q0 154 -38 174Z"/><rect x="-40" y="214" width="80" height="120"/>`,
      marks: `<rect x="-14" y="2" width="28" height="9" fill="#c9a24a"/><rect x="-13" y="11" width="26" height="7" fill="#b8321f"/><rect x="-13" y="34" width="26" height="46" fill="#f4ead7"/><rect x="-13" y="34" width="26" height="4" fill="#b8321f"/><rect x="-13" y="76" width="26" height="4" fill="#b8321f"/><path d="M-38 150Q0 128 38 150V174Q0 154 -38 174Z" fill="#f4ead7"/><path d="M-38 150Q0 128 38 150" fill="none" stroke="#c9a24a" stroke-width="3"/><rect x="-40" y="214" width="80" height="120" fill="#f4ead7"/><rect x="-40" y="214" width="80" height="8" fill="#b8321f"/>`,
      stops: [
        [0, "#140602", 1],
        [0.2, "#3a1806", 1],
        [0.5, "#6a3211", 1],
        [0.8, "#3a1806", 1],
        [1, "#120602", 1],
      ],
    },
    katakuchi: {
      glyphs: "",
      marks: `<ellipse cx="-1" cy="1" rx="60" ry="5" fill="#b8321f"/>`,
      paper: "",
      stops: [
        [0, "#120706", 1],
        [0.25, "#2c130f", 1],
        [0.5, "#4f2419", 1],
        [0.75, "#2c130f", 1],
        [1, "#100605", 1],
      ],
    },
    tokkuri: {
      glyphs: "",
      marks: `<g stroke="#2c3f8f" fill="none"><path d="M-50 60H50M-50 66H50M-50 126H50" stroke-width="2.4"/><path d="M-43 96a7 7 0 0 1 14 0M-25 96a7 7 0 0 1 14 0M-7 96a7 7 0 0 1 14 0M11 96a7 7 0 0 1 14 0M29 96a7 7 0 0 1 14 0" stroke-width="3"/></g>`,
      paper: "",
      stops: [
        [0, "#8d887b", 1],
        [0.25, "#d9d5ca", 1],
        [0.5, "#f4f1e8", 1],
        [0.75, "#d9d5ca", 1],
        [1, "#7f7a6d", 1],
      ],
    },
  };
  const { stops, marks, glyphs, paper } = bodies[bottle];
  const span = { height: height - top + 8, y: top - 4 };
  const fibres =
    paper === ""
      ? ""
      : `<filter id="${id}-paper" filterUnits="userSpaceOnUse" x="${n(-width)}" y="${n(span.y)}" width="${n(width * 2)}" height="${n(span.height)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.7 0.09" numOctaves="3" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 0.55 0 0 0 0 0.42 0 0 0 0 0.28 0.7 0 0 0 -0.34"/></filter><filter id="${id}-pulp" filterUnits="userSpaceOnUse" x="${n(-width)}" y="${n(span.y)}" width="${n(width * 2)}" height="${n(span.height)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.97 0 0 0 0 0.9 0 0 0 -1.4 0.82"/></filter><clipPath id="${id}-labels">${paper}</clipPath><g clip-path="url(#${id}-labels)"><rect x="${n(-width)}" y="${n(span.y)}" width="${n(width * 2)}" height="${n(span.height)}" filter="url(#${id}-paper)"/><rect x="${n(-width)}" y="${n(span.y)}" width="${n(width * 2)}" height="${n(span.height)}" filter="url(#${id}-pulp)" opacity="0.35"/></g>`;
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
  )}${blur(`${id}-ink`, 0.3)}<clipPath id="${id}-clip"><path d="${body}"/></clipPath><g transform="${shift}"><path d="${body}" fill="url(#${id}-body)"/><g clip-path="url(#${id}-clip)"><g filter="url(#${id}-ink)" opacity="0.88">${marks}</g>${fibres}<g opacity="0.92">${glyphs}</g><rect x="${n(-width)}" y="${n(span.y)}" width="${n(width * 2)}" height="${n(span.height)}" fill="url(#${id}-fall)"/></g><path d="${body}" fill="none" stroke="${wood.shadow}" stroke-opacity="0.35" stroke-width="0.8"/></g>`;
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

const shadowTip = project(-key.x * (H / key.y), 0, -key.z * (H / key.y));

const around = (reach: number) =>
  [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([x = 0, z = 0]) => project(x * (A + reach), 0, z * (A + reach)));

const bar = {
  bottles: ["#0c2215", "#2a1407", "#171a14", "#1f1009", "#0f1d22"],
  counter: ["#4b2d17", "#563419", "#45291a", "#4f3018"],
  far: "#170c06",
  fridge: "#a9dcff",
  glow: "#ffb35c",
  ink: "#000000",
  label: "#efe0bd",
  lantern: "#ff4a1c",
  near: "#24150c",
  paper: "#ffd9a0",
  rib: "#5a0d04",
  shelf: "#7a4c29",
  wall: "#080403",
  warm: "#3a2010",
} as const;

const REFERENCE = 2.4;

const TINTS = ["#ffb45c", "#ff9440", "#ffd391", "#ff5a26"] as const;

const BOKEH = [
  { depth: 0, r: 10, tint: 0, u: 0.08, v: 0.55 },
  { depth: 0, r: 7, tint: 2, u: 0.3, v: 0.85 },
  { depth: 0, r: 12, tint: 1, u: 0.47, v: 0.35 },
  { depth: 0, r: 8, tint: 0, u: 0.66, v: 0.72 },
  { depth: 0, r: 7, tint: 2, u: 0.8, v: 0.95 },
  { depth: 1, r: 26, tint: 1, u: 0.2, v: 0.3 },
  { depth: 1, r: 19, tint: 0, u: 0.58, v: 0.1 },
  { depth: 1, r: 32, tint: 1, u: 0.97, v: 0.5 },
] as const;

const bottleSvg = (
  x: number,
  base: number,
  w: number,
  h: number,
  roll: () => number
) => {
  const left = x - w / 2;
  const right = x + w / 2;
  const neck = w * 0.17;
  const shoulder = base - h * 0.6;
  const collar = base - h * 0.8;
  const glass = bar.bottles[Math.floor(roll() * bar.bottles.length)];
  const label =
    roll() > 0.3
      ? `<rect x="${n(x - w * 0.34)}" y="${n(base - h * 0.48)}" width="${n(w * 0.68)}" height="${n(h * 0.24)}" fill="${bar.label}" fill-opacity="${n(0.28 + roll() * 0.3)}"/><rect x="${n(x - w * 0.05)}" y="${n(base - h * 0.45)}" width="${n(w * 0.1)}" height="${n(h * 0.18)}" fill="${bar.ink}" fill-opacity="0.45"/>`
      : "";
  return `<path d="M${n(left)} ${n(base)}V${n(shoulder)}Q${n(left)} ${n(collar)} ${n(x - neck)} ${n(collar)}V${n(base - h)}H${n(x + neck)}V${n(collar)}Q${n(right)} ${n(collar)} ${n(right)} ${n(shoulder)}V${n(base)}Z" fill="${glass}"/>${label}<path d="M${n(left + w * 0.2)} ${n(base - h * 0.08)}V${n(shoulder + h * 0.04)}" stroke="${bar.paper}" stroke-opacity="${n(0.25 + roll() * 0.3)}" stroke-width="${n(w * 0.07)}" stroke-linecap="round"/><path d="M${n(right - w * 0.1)} ${n(base - h * 0.1)}V${n(shoulder)}" stroke="${bar.glow}" stroke-opacity="0.18" stroke-width="${n(w * 0.04)}"/>`;
};

const backBar = (width: number, back: number, k: number) => {
  if (back <= 0) {
    return "";
  }
  const roll = seeded(4242);
  const shelf = back * 0.66;
  const tall = Math.max(back * 0.5, 70 * k);
  const broad = tall * 0.3;
  const bottles: string[] = [];
  for (let x = -broad * roll(); x < width + broad;) {
    const w = broad * (0.8 + roll() * 0.35);
    bottles.push(
      bottleSvg(x + w / 2, shelf, w, tall * (0.82 + roll() * 0.26), roll)
    );
    x += w * (1.2 + roll() * 0.6);
  }
  const slats = Array.from(
    { length: Math.ceil(width / (16 * k)) + 1 },
    (_, i) =>
      `<path d="M${n(i * 16 * k)} 0V${n(back)}" stroke="${bar.ink}" stroke-opacity="0.4" stroke-width="${n(2.2 * k)}"/>`
  ).join("");
  const lantern = {
    x: width * 0.88,
    y: Math.min(back * 0.2, shelf - tall * 0.9),
  };
  const cabinet = shelf + 5 * k;
  const cell = 15 * k;
  const kumiko = [
    ...Array.from(
      { length: Math.ceil(width / cell) + 1 },
      (_, i) => `M${n(i * cell)} ${n(cabinet)}V${n(back)}`
    ),
    ...Array.from(
      { length: Math.max(0, Math.ceil((back - cabinet) / cell)) },
      (_, i) => `M0 ${n(cabinet + (i + 1) * cell)}H${width}`
    ),
  ].join("");
  const posts = Array.from(
    { length: Math.ceil(width / (cell * 6)) + 1 },
    (_, i) =>
      `<rect x="${n(i * cell * 6 - 2 * k)}" y="${n(cabinet)}" width="${n(4 * k)}" height="${n(Math.max(0, back - cabinet))}" fill="${bar.far}"/>`
  ).join("");
  const ribs = Array.from(
    { length: 7 },
    (_, i) =>
      `<ellipse cx="${n(lantern.x)}" cy="${n(lantern.y + (i - 3) * 13 * k)}" rx="${n(40 * k * Math.cos(((i - 3) / 4.2) * 1.2))}" ry="${n(2.6 * k)}" fill="none" stroke="${bar.rib}" stroke-opacity="0.7" stroke-width="${n(1.8 * k)}"/>`
  ).join("");
  const bokeh = [0, 1]
    .map(
      (depth) =>
        `<g filter="url(#room-bokehSoft${depth})" style="mix-blend-mode:screen">${BOKEH.filter(
          (blob) => blob.depth === depth
        )
          .map((blob) => {
            const x = blob.u * width;
            const tint =
              Math.abs(x - lantern.x) < 70 * k ? TINTS.length - 1 : blob.tint;
            return `<circle cx="${n(x)}" cy="${n(shelf - tall * (0.2 + blob.v * 0.85))}" r="${n(blob.r * Math.max(0.8, k))}" fill="url(#room-bokeh${tint})" opacity="${n(depth === 0 ? 0.95 : 0.6)}"/>`;
          })
          .join("")}</g>`
    )
    .join("");
  return `${linear("room-wall", { x: 0, y: 0 }, { x: 0, y: back }, [
    [0, bar.wall, 1],
    [0.55, bar.warm, 1],
    [0.66, "#5a3216", 1],
    [0.72, bar.far, 1],
    [1, "#100804", 1],
  ])}${radial(
    "room-backlight",
    { x: width * 0.5, y: shelf - tall * 0.45 },
    Math.max(width * 0.7, tall * 2),
    [
      [0, bar.glow, 0.34],
      [0.5, bar.glow, 0.12],
      [1, bar.glow, 0],
    ]
  )}${radial("room-lantern", lantern, 60 * k, [
    [0, bar.paper, 1],
    [0.35, bar.lantern, 0.95],
    [0.85, "#9a1506", 0.9],
    [1, "#9a1506", 0],
  ])}${TINTS.map((tint, i) => `<radialGradient id="room-bokeh${i}"><stop offset="0" stop-color="${tint}" stop-opacity="0.5"/><stop offset="0.7" stop-color="${tint}" stop-opacity="0.58"/><stop offset="0.93" stop-color="${tint}" stop-opacity="0.8"/><stop offset="1" stop-color="${tint}" stop-opacity="0"/></radialGradient>`).join("")}${blur("room-bokehSoft0", Math.max(0.6, 0.9 * k))}${blur("room-bokehSoft1", Math.max(1.6, 3.2 * k))}<g filter="url(#room-far)"><rect width="${width}" height="${n(back)}" fill="url(#room-wall)"/>${slats}<rect width="${width}" height="${n(shelf)}" fill="url(#room-backlight)"/><rect x="${n(width * 0.02)}" y="${n(shelf - tall * 0.95)}" width="${n(tall * 0.5)}" height="${n(tall * 0.9)}" fill="${bar.fridge}" fill-opacity="0.12"/>${bottles.join("")}${linear(
    "room-shoji",
    { x: 0, y: cabinet },
    { x: 0, y: back },
    [
      [0, bar.paper, 0.2],
      [0.45, bar.glow, 0.34],
      [1, bar.glow, 0.12],
    ]
  )}<rect y="${n(cabinet)}" width="${width}" height="${n(Math.max(0, back - cabinet))}" fill="url(#room-shoji)"/><path d="${kumiko}" stroke="${bar.far}" stroke-opacity="0.6" stroke-width="${n(1.2 * k)}"/>${posts}<rect y="${n(shelf)}" width="${width}" height="${n(5 * k)}" fill="${bar.shelf}"/><path d="M0 ${n(shelf)}H${width}" stroke="${bar.paper}" stroke-opacity="0.5" stroke-width="${n(1.2 * k)}"/><ellipse cx="${n(lantern.x)}" cy="${n(lantern.y)}" rx="${n(40 * k)}" ry="${n(52 * k)}" fill="url(#room-lantern)"/>${ribs}${[-1, 1].map((side) => `<rect x="${n(lantern.x - 20 * k)}" y="${n(lantern.y + side * 50 * k - 4 * k)}" width="${n(40 * k)}" height="${n(8 * k)}" rx="${n(2 * k)}" fill="${bar.ink}" fill-opacity="0.85"/>`).join("")}</g><ellipse cx="${n(lantern.x)}" cy="${n(lantern.y)}" rx="${n(120 * k)}" ry="${n(120 * k)}" fill="${bar.lantern}" fill-opacity="0.1" filter="url(#room-haze)"/>${bokeh}`;
};

const plankGrain = (
  id: string,
  y: number,
  w: number,
  h: number,
  along: number,
  across: number,
  seed: number
) =>
  `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="${n(y)}" width="${n(w)}" height="${n(h)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${n(along)} ${n(across)}" numOctaves="3" seed="${seed}"/><feColorMatrix type="matrix" values="0 0 0 0 0.06 0 0 0 0 0.03 0 0 0 0 0.012 1.3 0 0 0 -0.55"/></filter><rect y="${n(y)}" width="${n(w)}" height="${n(h)}" filter="url(#${id})"/>`;

const SEAMS = [-320, -250, -180, -105, -25, 60, 155, 265, 400, 580, 820];
const FOCUS = 90;

const counterSvg = (
  width: number,
  height: number,
  frame: View,
  back: number
) => {
  const s = frame.scale;
  const k = s / REFERENCE;
  const at = (x: number, z: number) => ({
    x: frame.cx + project(x, 0, z).x * s,
    y: frame.cy + project(x, 0, z).y * s,
  });
  const planks = SEAMS.slice(0, -1).map((z, i) => {
    const far = Math.max(back, at(0, z).y);
    const near = at(0, SEAMS[i + 1] ?? z).y;
    if (near <= far || far >= height) {
      return "";
    }
    const middle = (z + (SEAMS[i + 1] ?? z)) / 2;
    const across = at(1, middle).x - at(0, middle).x || 1;
    const deep = (near - at(0, z).y) / ((SEAMS[i + 1] ?? z) - z) || 1;
    const top = Math.min(near, height + 2);
    const soft = Math.min(
      4.5 * k,
      Math.max(0, Math.abs(middle) - FOCUS) * 0.012 * k
    );
    const focus =
      soft > 0.2
        ? `<filter id="room-dof${i}" x="0" y="-20%" width="100%" height="140%"><feGaussianBlur stdDeviation="${n(soft)} ${n(soft * 0.6)}"/></filter>`
        : "";
    return `${focus}<g${soft > 0.2 ? ` filter="url(#room-dof${i})"` : ""}><rect y="${n(far)}" width="${width}" height="${n(top - far)}" fill="${bar.counter[i % bar.counter.length]}"/>${plankGrain(
      `room-plank${i}`,
      far,
      width,
      top - far,
      Math.min(0.08, 1 / (90 * across)),
      Math.min(1.6, 1 / (1.4 * deep)),
      31 + i * 7
    )}<path d="M0 ${n(far)}H${width}" stroke="${bar.ink}" stroke-opacity="0.55" stroke-width="${n(Math.max(0.5, across * 0.8))}"/><path d="M0 ${n(far + Math.max(0.6, across * 0.9))}H${width}" stroke="${bar.paper}" stroke-opacity="0.09" stroke-width="${n(Math.max(0.4, across * 0.5))}"/></g>`;
  });
  return `${linear("room-shade", { x: 0, y: back }, { x: 0, y: height }, [
    [0, bar.far, 0.7],
    [0.3, bar.far, 0.2],
    [0.7, bar.near, 0.1],
    [1, bar.near, 0.55],
  ])}<rect y="${n(back)}" width="${width}" height="${n(height - back)}" fill="${bar.near}"/>${planks.join("")}<filter id="room-figure" filterUnits="userSpaceOnUse" x="0" y="${n(back)}" width="${width}" height="${n(height - back)}" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${n(0.004 / Math.max(0.5, s / REFERENCE))} ${n(0.03 / Math.max(0.5, s / REFERENCE))}" numOctaves="2" seed="17"/><feColorMatrix type="matrix" values="0 0 0 0 0.45 0 0 0 0 0.26 0 0 0 0 0.12 0.9 0 0 0 -0.32"/></filter><rect y="${n(back)}" width="${width}" height="${n(height - back)}" filter="url(#room-figure)"/><rect y="${n(back)}" width="${width}" height="${n(height - back)}" fill="url(#room-shade)"/>`;
};

const gloss = (width: number, height: number, frame: View, back: number) => {
  const s = frame.scale;
  const k = s / REFERENCE;
  const spill = Math.max(12, (height - back) * 0.2);
  const pool = {
    x: frame.cx + project(-12, 0, 14).x * s,
    y: frame.cy + project(-12, 0, 14).y * s,
  };
  const sheen = glintOn(0, lamps.key);
  const glint = {
    x: frame.cx + project(sheen.x, 0, sheen.z).x * s,
    y: frame.cy + project(sheen.x, 0, sheen.z).y * s,
  };
  return `${radial(
    "room-falloff",
    pool,
    Math.max(width, height - back) * 0.85,
    [
      [0, wood.shadow, 0],
      [0.4, wood.shadow, 0.12],
      [1, wood.shadow, 0.62],
    ]
  )}<rect y="${n(back)}" width="${width}" height="${n(height - back)}" fill="url(#room-falloff)"/>${linear(
    "room-mirror",
    { x: 0, y: back },
    { x: 0, y: back + spill },
    [
      [0, bar.glow, 0.3],
      [0.25, bar.glow, 0.1],
      [1, bar.glow, 0],
    ]
  )}<radialGradient id="room-pool"><stop offset="0" stop-color="${wood.lamp}" stop-opacity="0.42"/><stop offset="0.45" stop-color="#b06a2e" stop-opacity="0.17"/><stop offset="1" stop-color="#b06a2e" stop-opacity="0"/></radialGradient><radialGradient id="room-sheen"><stop offset="0" stop-color="${bar.paper}" stop-opacity="0.26"/><stop offset="1" stop-color="${bar.paper}" stop-opacity="0"/></radialGradient><rect y="${n(back)}" width="${width}" height="${n(spill)}" fill="url(#room-mirror)"/>${back > 0 ? `<ellipse cx="${n(width * 0.88)}" cy="${n(back + spill * 0.5)}" rx="${n(16 * k)}" ry="${n(spill * 0.55)}" fill="${bar.lantern}" fill-opacity="0.16" filter="url(#room-haze)"/>` : ""}<ellipse cx="${n(pool.x)}" cy="${n(pool.y)}" rx="${n(300 * k)}" ry="${n(135 * k)}" fill="url(#room-pool)"/><ellipse cx="${n(glint.x)}" cy="${n(glint.y)}" rx="${n(150 * k)}" ry="${n(34 * k)}" fill="url(#room-sheen)"/>`;
};

const shaft = (frame: View) => {
  const s = frame.scale;
  const toScreen = (p: Point) => ({
    x: frame.cx + p.x * s,
    y: frame.cy + p.y * s,
  });
  const from = toScreen(project(lamps.key.x, lamps.key.y, lamps.key.z));
  const near = toScreen(project(-A * 1.6, 0, A * 1.4));
  const far = toScreen(project(A * 1.8, H, -A * 1.6));
  return `${linear("room-shaft", from, toScreen(project(0, 0, 0)), [
    [0, wood.lamp, 0],
    [0.5, wood.lamp, 0.1],
    [1, wood.lamp, 0.03],
  ])}<path d="${pathOf([from, far, near])}" fill="url(#room-shaft)" filter="url(#room-haze)"/>`;
};

const BAR_Z = -240;

export const horizonOf = (frame: View) =>
  Math.max(-40, frame.cy + project(0, 0, BAR_Z).y * frame.scale);

export const room = (width: number, height: number, frame: View) => {
  const s = frame.scale;
  const k = s / REFERENCE;
  const toScreen = (p: Point) => ({
    x: frame.cx + p.x * s,
    y: frame.cy + p.y * s,
  });
  const back = horizonOf(frame);
  const shadow = hull(castShadow()).map(toScreen);
  return `${blur("room-far", Math.max(1.6, 2.8 * k))}${blur("room-haze", Math.max(6, 22 * k))}<rect width="${width}" height="${height}" fill="${wood.room}"/>${backBar(width, back, k)}${counterSvg(width, height, frame, back)}${gloss(width, height, frame, back)}${shaft(frame)}${linear(
    "room-cast",
    toScreen(project(0, 0, 0)),
    toScreen(shadowTip),
    [
      [0, wood.shadow, 0.78],
      [0.55, wood.shadow, 0.42],
      [1, wood.shadow, 0.1],
    ]
  )}${blur("room-soft", Math.max(2, s * 4))}${blur("room-ao", Math.max(1.5, s * 2.4))}${blur("room-contact", Math.max(0.6, s * 0.6))}<filter id="room-film" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 1 0 0 0 0 0.9 0 0 0 0 0.75 0 0 0 0.12 0"/></filter><path d="${pathOf(shadow)}" fill="url(#room-cast)" filter="url(#room-soft)"/><path d="${pathOf(around(3).map(toScreen))}" fill="${wood.shadow}" fill-opacity="0.5" filter="url(#room-ao)"/><path d="${pathOf(around(0.4).map(toScreen))}" fill="${wood.shadow}" fill-opacity="0.95" filter="url(#room-contact)"/><rect width="${width}" height="${height}" filter="url(#room-film)" opacity="0.5"/>`;
};

export const grade = (width: number, height: number) =>
  `${radial(
    "grade-tone",
    { x: width / 2, y: height * 0.46 },
    Math.hypot(width, height) * 0.6,
    [
      [0, "#fff8ee", 1],
      [0.45, "#ffecd2", 1],
      [0.78, "#c9996c", 1],
      [1, "#6e4a30", 1],
    ]
  )}<rect width="${width}" height="${height}" fill="url(#grade-tone)"/>`;

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
  for (const op of flatten(ops)) {
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
  frame: View,
  ops: readonly Op[],
  scenery = true
) => {
  const { body, defs } = opsSvg(ops, "still-");
  const used = flatten(ops).flatMap((op) =>
    op.kind === "sprite" ? [op.name] : []
  );
  return docOf(
    { h: height, w: width, x: 0, y: 0 },
    width,
    height,
    `${scenery ? room(width, height, frame) : ""}<defs>${spriteDefs(used)}${defs}</defs><g transform="translate(${n(frame.cx)} ${n(frame.cy)}) scale(${n(frame.scale)})">${body}</g><g style="mix-blend-mode:multiply">${grade(width, height)}</g>`
  );
};
