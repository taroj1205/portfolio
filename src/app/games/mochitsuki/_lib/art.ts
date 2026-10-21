export const SCENE = 1000;

export const USU = {
  base: 935,
  bowl: { rx: 232, ry: 50 },
  cx: 500,
  rim: { rx: 290, ry: 70, y: 670 },
} as const;

export const MOCHI = { h: 78, rx: 200, y: 668 } as const;

export const KINE = {
  head: 100,
  pivot: { x: 1007, y: 342 },
  r: 56,
  reach: 560,
  swing: 0.62,
} as const;

export const STRIKE = { x: KINE.reach, y: -KINE.head } as const;

export interface Place {
  x: number;
  y: number;
  angle: number;
  sx: number;
  sy: number;
}

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Frame {
  x: number;
  y: number;
  size: number;
}

export interface Sprite {
  box: Box;
  body: string;
}

interface Point {
  x: number;
  y: number;
}

type Stop = readonly [number, string, number?];

const n = (value: number) => Number(value.toFixed(2));

const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const stopsOf = (stops: readonly Stop[]) =>
  stops
    .map(
      ([offset, color, opacity = 1]) =>
        `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`
    )
    .join("");

const linear = (
  id: string,
  [x1, y1, x2, y2]: readonly [number, number, number, number],
  stops: readonly Stop[]
) =>
  `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stopsOf(stops)}</linearGradient>`;

const shade = (id: string, stops: readonly Stop[], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stopsOf(stops)}</linearGradient>`;

const radial = (
  id: string,
  [cx, cy, r]: readonly [number, number, number],
  stops: readonly Stop[],
  focus: readonly [number, number] = [cx, cy]
) =>
  `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fx="${n(focus[0])}" fy="${n(focus[1])}">${stopsOf(stops)}</radialGradient>`;

const blur = (id: string, deviation: number) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n(deviation)}"/></filter>`;

const grain = (
  id: string,
  box: Box,
  [fx, fy]: readonly [number, number],
  seed: number,
  strength = 1.6
) =>
  `<filter id="${id}" filterUnits="userSpaceOnUse" x="${n(box.x)}" y="${n(box.y)}" width="${n(box.w)}" height="${n(box.h)}"><feTurbulence type="fractalNoise" baseFrequency="${fx} ${fy}" numOctaves="4" seed="${seed}" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.14 0 0 0 0 0.06 0 0 0 0 0.02 ${strength} 0 0 0 ${n(-strength * 0.45)}" result="dark"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 0.86 0 0 0 0 0.64 0 ${n(strength * 0.7)} 0 0 ${n(-strength * 0.7 * 0.58)}" result="light"/><feComposite in="dark" in2="SourceAlpha" operator="in" result="darkIn"/><feComposite in="light" in2="SourceAlpha" operator="in" result="lightIn"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="darkIn"/><feMergeNode in="lightIn"/></feMerge></filter>`;

const weave = (id: string, box: Box, frequency: number, strength: number) =>
  `<filter id="${id}" filterUnits="userSpaceOnUse" x="${n(box.x)}" y="${n(box.y)}" width="${n(box.w)}" height="${n(box.h)}"><feTurbulence type="fractalNoise" baseFrequency="${frequency}" numOctaves="2" seed="5" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 ${strength} 0 ${n(-strength * 0.5)}" result="speck"/><feComposite in="speck" in2="SourceAlpha" operator="in" result="speckIn"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="speckIn"/></feMerge></filter>`;

const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  attributes: string
) =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${attributes}/>`;

const path = (d: string, attributes: string) =>
  `<path d="${d}" ${attributes}/>`;

const transformOf = (place: Place) =>
  `translate(${n(place.x)} ${n(place.y)}) rotate(${n((place.angle * 180) / Math.PI)}) scale(${n(place.sx)} ${n(place.sy)})`;

export const docOf = (box: Box, width: number, height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(box.x)} ${n(box.y)} ${n(box.w)} ${n(box.h)}" width="${Math.round(width)}" height="${Math.round(height)}" preserveAspectRatio="none">${body}</svg>`;

export const spriteDoc = (sprite: Sprite, scale: number) =>
  docOf(sprite.box, sprite.box.w * scale, sprite.box.h * scale, sprite.body);

export const dataUri = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(svg)}`;

const halfWidth = (y: number) => {
  const { rim, base } = USU;
  const t = (y - rim.y) / (base - rim.y);
  return rim.rx * (1 - t) ** 2 + 247 * 2 * t * (1 - t) + rim.rx * 0.94 * t * t;
};

const usuOutline = () => {
  const { cx, rim, base } = USU;
  const low = rim.rx * 0.94;
  return [
    `M${cx - rim.rx} ${rim.y}`,
    `Q${cx - 247} 800 ${n(cx - low)} ${base}`,
    `A${n(low)} ${n(rim.ry * 0.8)} 0 0 0 ${n(cx + low)} ${base}`,
    `Q${cx + 247} 800 ${cx + rim.rx} ${rim.y}`,
    `A${rim.rx} ${rim.ry} 0 0 1 ${cx - rim.rx} ${rim.y}Z`,
  ].join("");
};

const frontArc = (y: number, ry: number) => {
  const half = halfWidth(y);
  return `M${n(USU.cx - half)} ${n(y)}A${n(half)} ${n(ry)} 0 0 0 ${n(USU.cx + half)} ${n(y)}`;
};

const ROPE = { drop: 52, y: 757 } as const;

const ropeAt = (u: number): Point => ({
  x: USU.cx - halfWidth(ROPE.y) * Math.cos(Math.PI * u),
  y: ROPE.y + ROPE.drop * Math.sin(Math.PI * u),
});

const rope = () => {
  const twists = Array.from({ length: 32 }, (_, i) => {
    const u = (i + 0.5) / 32;
    const { x, y } = ropeAt(u);
    const fore = Math.max(0.35, Math.sin(Math.PI * u));
    return ellipse(
      x,
      y,
      5 + 13 * fore,
      13,
      `transform="rotate(-38 ${n(x)} ${n(y)})" fill="url(#${i % 2 === 0 ? "usu-rope-red" : "usu-rope-white"})" stroke="#3a0a0a" stroke-opacity="0.35" stroke-width="1.2"`
    );
  }).join("");
  const knot = ropeAt(0.28);
  const tassel = (dx: number, fill: string) =>
    path(
      `M${n(knot.x + dx - 5)} ${n(knot.y + 6)}C${n(knot.x + dx - 9)} ${n(knot.y + 40)} ${n(knot.x + dx - 13)} ${n(knot.y + 70)} ${n(knot.x + dx - 11)} ${n(knot.y + 90)}L${n(knot.x + dx + 3)} ${n(knot.y + 90)}C${n(knot.x + dx + 3)} ${n(knot.y + 70)} ${n(knot.x + dx + 3)} ${n(knot.y + 40)} ${n(knot.x + dx + 5)} ${n(knot.y + 6)}Z`,
      `fill="url(#${fill})" stroke="#2a0606" stroke-opacity="0.4" stroke-width="1"`
    );
  const fringe = Array.from({ length: 6 }, (_, i) => {
    const x = knot.x - 22 + i * 7;
    return path(
      `M${n(x)} ${n(knot.y + 80)}l${i % 2 === 0 ? -1 : 1} 14`,
      `stroke="${i < 3 ? "#d22f3a" : "#f4ece0"}" stroke-width="2" stroke-linecap="round"`
    );
  }).join("");
  return [
    path(
      frontArc(ROPE.y - 2, ROPE.drop),
      `fill="none" stroke="#000" stroke-opacity="0.5" stroke-width="30" filter="url(#usu-soft)" transform="translate(0 10)"`
    ),
    twists,
    tassel(-14, "usu-rope-red"),
    tassel(4, "usu-rope-white"),
    fringe,
    ellipse(
      knot.x - 24,
      knot.y - 2,
      20,
      11,
      `fill="none" stroke="url(#usu-rope-red)" stroke-width="7" transform="rotate(-20 ${n(knot.x - 24)} ${n(knot.y - 2)})"`
    ),
    ellipse(
      knot.x + 14,
      knot.y - 4,
      20,
      11,
      `fill="none" stroke="url(#usu-rope-white)" stroke-width="7" transform="rotate(18 ${n(knot.x + 14)} ${n(knot.y - 4)})"`
    ),
    ellipse(knot.x - 4, knot.y, 10, 12, `fill="url(#usu-rope-red)"`),
  ].join("");
};

const rings = (count: number, from: number, to: number, seed: number) => {
  const { cx, rim, bowl } = USU;
  const wobble = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 1);
    const rx = bowl.rx + (rim.rx - bowl.rx) * t;
    const ry = bowl.ry + (rim.ry - bowl.ry) * t;
    const dx = (wobble() - 0.5) * 3;
    const start = {
      x: cx + dx + Math.cos(from) * rx,
      y: rim.y + Math.sin(from) * ry,
    };
    const end = {
      x: cx + dx + Math.cos(to) * rx,
      y: rim.y + Math.sin(to) * ry,
    };
    return path(
      `M${n(start.x)} ${n(start.y)}A${n(rx)} ${n(ry)} 0 ${to - from > Math.PI ? 1 : 0} 1 ${n(end.x)} ${n(end.y)}`,
      `fill="none" stroke="#6e3c18" stroke-opacity="${n(0.16 + (i % 3) * 0.08)}" stroke-width="1.4"`
    );
  }).join("");
};

const USU_BOX: Box = { h: 440, w: 640, x: 180, y: 580 };

export const usu: Sprite = {
  body: [
    "<defs>",
    linear(
      "usu-side",
      [210, 0, 790, 0],
      [
        [0, "#1e0e06"],
        [0.1, "#4a2711"],
        [0.27, "#8c582b"],
        [0.4, "#c58d55"],
        [0.5, "#b87d46"],
        [0.68, "#7a4520"],
        [0.88, "#361a0b"],
        [1, "#170a04"],
      ]
    ),
    linear(
      "usu-ao",
      [0, 670, 0, 1000],
      [
        [0, "#000", 0.6],
        [0.12, "#000", 0],
        [0.72, "#000", 0.06],
        [1, "#000", 0.62],
      ]
    ),
    linear(
      "usu-top",
      [0, 600, 0, 740],
      [
        [0, "#efc38c"],
        [0.55, "#cb955b"],
        [1, "#996132"],
      ]
    ),
    linear(
      "usu-bowl",
      [0, 620, 0, 720],
      [
        [0, "#7a4a24"],
        [0.42, "#2c1508"],
        [1, "#100702"],
      ]
    ),
    shade("usu-rope-red", [
      [0, "#ff8a86"],
      [0.45, "#d22f3a"],
      [1, "#5a0a12"],
    ]),
    shade("usu-rope-white", [
      [0, "#ffffff"],
      [0.5, "#efe5d6"],
      [1, "#94877a"],
    ]),
    grain("usu-grain", USU_BOX, [0.07, 0.0028], 7),
    blur("usu-soft", 5),
    "</defs>",
    path(usuOutline(), `fill="url(#usu-side)" filter="url(#usu-grain)"`),
    path(
      frontArc(712, 60),
      `fill="none" stroke="#140802" stroke-opacity="0.55" stroke-width="3"`
    ),
    path(
      frontArc(715, 60),
      `fill="none" stroke="#f0bf86" stroke-opacity="0.22" stroke-width="2"`
    ),
    path(
      frontArc(898, 58),
      `fill="none" stroke="#140802" stroke-opacity="0.55" stroke-width="3"`
    ),
    path(
      frontArc(901, 58),
      `fill="none" stroke="#f0bf86" stroke-opacity="0.18" stroke-width="2"`
    ),
    path(usuOutline(), `fill="url(#usu-ao)"`),
    path(
      "M790 670Q747 800 772.6 935",
      `fill="none" stroke="#9fb4ff" stroke-opacity="0.4" stroke-width="4"`
    ),
    path(
      "M210 670Q253 800 227.4 935",
      `fill="none" stroke="#ffb070" stroke-opacity="0.28" stroke-width="3"`
    ),
    rope(),
    ellipse(500, 670, 290, 70, `fill="url(#usu-top)"`),
    rings(10, 0, Math.PI * 2 - 0.001, 41),
    path(
      "M318 650l26 6M672 700l-22 -9M610 632l-6 12",
      `stroke="#5a2e12" stroke-opacity="0.55" stroke-width="1.6" stroke-linecap="round"`
    ),
    path(
      "M214 667A286 67 0 0 1 786 667",
      `fill="none" stroke="#3a1c0a" stroke-opacity="0.45" stroke-width="2"`
    ),
    ellipse(500, 670, 232, 50, `fill="url(#usu-bowl)"`),
    ellipse(
      500,
      670,
      232,
      50,
      `fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="3"`
    ),
  ].join(""),
  box: USU_BOX,
};

export const lip: Sprite = {
  body: [
    "<defs>",
    linear(
      "lip-face",
      [0, 670, 0, 740],
      [
        [0, "#dcaa6c"],
        [1, "#965e30"],
      ]
    ),
    "</defs>",
    path(
      "M210 670A290 70 0 0 0 790 670L732 670A232 50 0 0 1 268 670Z",
      `fill="url(#lip-face)"`
    ),
    rings(3, 0.1, Math.PI - 0.1, 43),
    path(
      "M212 674A288 68 0 0 0 788 674",
      `fill="none" stroke="#ffdcab" stroke-opacity="0.5" stroke-width="2.5"`
    ),
  ].join(""),
  box: USU_BOX,
};

const MOCHI_BOX: Box = { h: 150, w: 460, x: 270, y: 560 };

const dome = () => {
  const { rx, h, y } = MOCHI;
  return `M${USU.cx - rx} ${y}A${rx} ${h} 0 0 1 ${USU.cx + rx} ${y}A${rx} 40 0 0 1 ${USU.cx - rx} ${y}Z`;
};

export const mochiBody: Sprite = {
  body: [
    "<defs>",
    radial(
      "mochi-body",
      [480, 610, 250],
      [
        [0, "#ffffff"],
        [0.4, "#fcf8f1"],
        [0.75, "#ece1cf"],
        [1, "#c7b598"],
      ],
      [440, 596]
    ),
    blur("mochi-soft", 5),
    "</defs>",
    ellipse(
      500,
      678,
      214,
      42,
      `fill="#000" fill-opacity="0.45" filter="url(#mochi-soft)"`
    ),
    path(dome(), `fill="url(#mochi-body)"`),
    path(
      dome(),
      `fill="none" stroke="#d6c4a2" stroke-opacity="0.55" stroke-width="2"`
    ),
  ].join(""),
  box: MOCHI_BOX,
};

const grainRoll = seeded(2026);

export const mochiGrains: Sprite = {
  body: Array.from({ length: 84 }, () => {
    const u = grainRoll() * 1.7 - 0.85;
    const v = 0.1 + grainRoll() * 0.82;
    const lift = Math.sqrt(Math.max(0, 1 - (u / 0.9) ** 2));
    const x = USU.cx + u * MOCHI.rx * 0.92;
    const y = MOCHI.y - MOCHI.h * lift * v;
    const turn = n(grainRoll() * 180);
    return ellipse(
      x,
      y,
      8,
      3.6,
      `transform="rotate(${turn} ${n(x)} ${n(y)})" fill="#efe4cf" stroke="#ad9470" stroke-opacity="0.6" stroke-width="0.9"`
    );
  }).join(""),
  box: MOCHI_BOX,
};

export const mochiGloss: Sprite = {
  body: [
    "<defs>",
    radial(
      "gloss-spot",
      [435, 612, 74],
      [
        [0, "#ffffff", 0.95],
        [1, "#ffffff", 0],
      ]
    ),
    "</defs>",
    ellipse(
      435,
      612,
      74,
      20,
      `fill="url(#gloss-spot)" transform="rotate(-12 435 612)"`
    ),
    ellipse(405, 606, 13, 5, `fill="#fff" transform="rotate(-12 405 606)"`),
    path(
      "M640 622A200 78 0 0 1 698 664",
      `fill="none" stroke="#c8d4ff" stroke-opacity="0.45" stroke-width="3"`
    ),
  ].join(""),
  box: MOCHI_BOX,
};

const KINE_BOX: Box = { h: 260, w: 970, x: -320, y: -130 };

const kineBody = () => {
  const { reach: d, r, head: l } = KINE;
  const stripes = Array.from({ length: 6 }, (_, k) =>
    path(`M${32 + k * 17} -16l9 0l-14 32l-9 0Z`, `fill="#c8283a"`)
  ).join("");
  const ridges = Array.from({ length: 11 }, (_, k) =>
    path(
      `M${34 + k * 8.5} -16l0 32`,
      `stroke="#000" stroke-opacity="0.12" stroke-width="1"`
    )
  ).join("");
  const band = (y: number) =>
    [
      `<rect x="${d - r - 2}" y="${y}" width="${2 * r + 4}" height="14" rx="3" fill="url(#kine-iron)"/>`,
      ...[-0.6, 0, 0.6].map((k) =>
        ellipse(d + k * r, y + 7, 2.6, 2.6, `fill="#c9cbd4" fill-opacity="0.8"`)
      ),
    ].join("");
  return [
    "<defs>",
    linear(
      "kine-handle",
      [0, -14, 0, 14],
      [
        [0, "#7c4f26"],
        [0.32, "#e8b97e"],
        [0.6, "#c28a50"],
        [1, "#5a3716"],
      ]
    ),
    linear(
      "kine-head",
      [d - r, 0, d + r, 0],
      [
        [0, "#46260f"],
        [0.2, "#a26c3a"],
        [0.42, "#e8b87d"],
        [0.55, "#f3cb92"],
        [0.78, "#9a6333"],
        [1, "#38200b"],
      ]
    ),
    linear(
      "kine-iron",
      [d - r, 0, d + r, 0],
      [
        [0, "#111114"],
        [0.4, "#5d5f68"],
        [0.55, "#a3a6b0"],
        [1, "#0f0f12"],
      ]
    ),
    linear(
      "kine-wet",
      [0, -l, 0, -l + 46],
      [
        [0, "#ffffff", 0.75],
        [1, "#ffffff", 0],
      ]
    ),
    linear(
      "kine-wrap",
      [0, -16, 0, 16],
      [
        [0, "#ffffff", 0.3],
        [0.5, "#ffffff", 0],
        [1, "#000", 0.4],
      ]
    ),
    radial(
      "kine-cap",
      [d, l, r + 4],
      [
        [0, "#f7d6a2"],
        [0.7, "#d49e64"],
        [1, "#a26a38"],
      ]
    ),
    grain("kine-handle-grain", KINE_BOX, [0.004, 0.2], 3, 1.3),
    grain("kine-head-grain", KINE_BOX, [0.16, 0.005], 11),
    `<clipPath id="kine-wrap-clip"><rect x="30" y="-16" width="96" height="32" rx="6"/></clipPath>`,
    "</defs>",
    `<rect x="-300" y="-14" width="${d + 304}" height="28" rx="13" fill="url(#kine-handle)" filter="url(#kine-handle-grain)" stroke="#2a1406" stroke-opacity="0.6" stroke-width="2"/>`,
    `<rect x="30" y="-16" width="96" height="32" rx="6" fill="#f4ece0"/>`,
    `<g clip-path="url(#kine-wrap-clip)">${stripes}${ridges}</g>`,
    `<rect x="30" y="-16" width="96" height="32" rx="6" fill="url(#kine-wrap)" stroke="#2a1406" stroke-opacity="0.5" stroke-width="1.6"/>`,
    `<rect x="${d - r}" y="${-l}" width="${2 * r}" height="${2 * l}" rx="8" fill="url(#kine-head)" filter="url(#kine-head-grain)" stroke="#2a1406" stroke-opacity="0.65" stroke-width="2.4"/>`,
    band(-l + 16),
    band(l - 30),
    `<rect x="${d - r + 2}" y="${-l}" width="${2 * r - 4}" height="46" fill="url(#kine-wet)"/>`,
    ...[
      [-0.7, 10, 6],
      [-0.2, 14, 7],
      [0.32, 9, 5],
      [0.7, 7, 4],
    ].map(([k, rx, ry]) =>
      ellipse(
        d + k * r,
        -l - 1,
        rx,
        ry,
        `fill="#fffdf6" stroke="#d9ccb4" stroke-width="1"`
      )
    ),
    ellipse(
      d,
      l,
      r,
      r * 0.3,
      `fill="url(#kine-cap)" stroke="#2a1406" stroke-opacity="0.6" stroke-width="2"`
    ),
    ...[0.72, 0.45, 0.18].map((t) =>
      ellipse(
        d,
        l,
        r * t,
        r * 0.3 * t,
        `fill="none" stroke="#8a5428" stroke-opacity="0.5" stroke-width="1.2"`
      )
    ),
    path(
      `M${d + 6} ${l - 2}l22 -3`,
      `stroke="#5a2e12" stroke-opacity="0.5" stroke-width="1.4" stroke-linecap="round"`
    ),
  ].join("");
};

export const kine: Sprite = { body: kineBody(), box: KINE_BOX };

const SLEEVE = 300;
const FOREARM = 200;
const SLEEVE_BOX: Box = { h: 200, w: 400, x: -70, y: -100 };

const sleeveOutline = `M-40 -78C80 -74 200 -60 ${SLEEVE} -46Q${SLEEVE + 16} 0 ${SLEEVE} 48C200 62 80 78 -40 84Z`;

const crosses = () => {
  const marks: string[] = [];
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 7; col += 1) {
      const x = -10 + col * 44 + (row % 2) * 22;
      const y = -54 + row * 36;
      marks.push(
        path(
          `M${x - 7} ${y - 3.5}h14M${x - 7} ${y + 3.5}h14M${x - 3.5} ${y - 7}v14M${x + 3.5} ${y - 7}v14`,
          `stroke="#ece8f6" stroke-opacity="0.72" stroke-width="2.2" stroke-linecap="round"`
        )
      );
    }
  }
  return marks.join("");
};

export const sleeve: Sprite = {
  body: [
    "<defs>",
    linear(
      "sleeve-cloth",
      [0, -80, 0, 86],
      [
        [0, "#4c64b4"],
        [0.32, "#2f448c"],
        [0.7, "#1c2a60"],
        [1, "#0d1433"],
      ]
    ),
    linear(
      "sleeve-fade",
      [-50, 0, 120, 0],
      [
        [0, "#fff", 0],
        [1, "#fff", 1],
      ]
    ),
    weave("sleeve-weave", SLEEVE_BOX, 0.9, 0.35),
    `<clipPath id="sleeve-clip"><path d="${sleeveOutline}"/></clipPath>`,
    `<mask id="sleeve-mask" maskUnits="userSpaceOnUse" x="${SLEEVE_BOX.x}" y="${SLEEVE_BOX.y}" width="${SLEEVE_BOX.w}" height="${SLEEVE_BOX.h}"><rect x="${SLEEVE_BOX.x}" y="${SLEEVE_BOX.y}" width="${SLEEVE_BOX.w}" height="${SLEEVE_BOX.h}" fill="url(#sleeve-fade)"/></mask>`,
    "</defs>",
    `<g mask="url(#sleeve-mask)">`,
    path(
      sleeveOutline,
      `fill="url(#sleeve-cloth)" filter="url(#sleeve-weave)"`
    ),
    `<g clip-path="url(#sleeve-clip)">${crosses()}</g>`,
    path(
      "M40 -40Q140 -20 240 -36M70 30Q160 16 262 34",
      `fill="none" stroke="#050818" stroke-opacity="0.5" stroke-width="3.2" stroke-linecap="round"`
    ),
    path(
      "M30 -62Q150 -52 282 -42",
      `fill="none" stroke="#7d93dc" stroke-opacity="0.4" stroke-width="2.4" stroke-linecap="round"`
    ),
    path("M262 -50Q274 0 262 52L284 50Q296 0 284 -48Z", `fill="#f3eee6"`),
    path(
      "M284 -48Q296 0 284 50",
      `fill="none" stroke="#b8b0a4" stroke-width="2"`
    ),
    path(
      sleeveOutline,
      `fill="none" stroke="#04071a" stroke-opacity="0.7" stroke-width="2.4"`
    ),
    "</g>",
  ].join(""),
  box: SLEEVE_BOX,
};

const SKIN = "#7a3e26";

export const forearm: Sprite = {
  body: [
    "<defs>",
    linear(
      "arm-skin",
      [0, -28, 0, 28],
      [
        [0, "#ffe7d2"],
        [0.45, "#f6cba8"],
        [1, "#cc875e"],
      ]
    ),
    "</defs>",
    path(
      `M0 -27C70 -26 140 -22 ${FOREARM} -18Q${FOREARM + 10} 0 ${FOREARM} 18C140 22 70 27 0 28Q-10 0 0 -27Z`,
      `fill="url(#arm-skin)" stroke="${SKIN}" stroke-opacity="0.55" stroke-width="2.2"`
    ),
    path(
      "M20 -15Q100 -18 180 -10",
      `fill="none" stroke="#fff4ea" stroke-opacity="0.55" stroke-width="4" stroke-linecap="round"`
    ),
    path(
      "M20 20Q100 24 180 14",
      `fill="none" stroke="#a8684a" stroke-opacity="0.35" stroke-width="3" stroke-linecap="round"`
    ),
  ].join(""),
  box: { h: 84, w: 250, x: -25, y: -42 },
};

const FINGERS = [
  { len: 46, y: 20 },
  { len: 58, y: 7 },
  { len: 63, y: -6 },
  { len: 57, y: -19 },
] as const;

const fingerPath = (len: number, y: number) => {
  const tip = 68 + len;
  return `M68 ${y - 7}C${n(68 + len * 0.5)} ${y - 8} ${tip - 10} ${y - 3} ${tip - 3} ${y + 1}Q${tip + 2} ${y + 5} ${tip - 3} ${y + 10}C${tip - 10} ${y + 12} ${n(68 + len * 0.5)} ${y + 9} 68 ${y + 7}Z`;
};

export const hand: Sprite = {
  body: [
    "<defs>",
    linear(
      "hand-skin",
      [0, -32, 0, 32],
      [
        [0, "#ffe7d2"],
        [0.5, "#f4c7a2"],
        [1, "#cf8c64"],
      ]
    ),
    shade("hand-finger", [
      [0, "#fff0e2"],
      [0.5, "#f6cfae"],
      [1, "#cc8860"],
    ]),
    "</defs>",
    path(
      "M-2 -24C24 -30 50 -32 72 -29C80 -18 80 18 72 28C50 31 24 30 -2 25Q-6 0 -2 -24Z",
      `fill="url(#hand-skin)" stroke="${SKIN}" stroke-opacity="0.55" stroke-width="2.2"`
    ),
    path(
      "M10 -10L58 -14M12 4L60 4",
      `stroke="#fff3e8" stroke-opacity="0.35" stroke-width="2" stroke-linecap="round"`
    ),
    ...FINGERS.map(({ len, y }) =>
      [
        path(
          fingerPath(len, y),
          `fill="url(#hand-finger)" stroke="${SKIN}" stroke-opacity="0.6" stroke-width="2"`
        ),
        ellipse(
          68 + len - 9,
          y + 3.5,
          6,
          4,
          `fill="#fde4d8" stroke="#c9927a" stroke-opacity="0.5" stroke-width="0.8"`
        ),
        path(
          `M64 ${y - 4}q4 4 0 8`,
          `fill="none" stroke="#bf7a56" stroke-opacity="0.5" stroke-width="1.2"`
        ),
      ].join("")
    ),
    path(
      "M18 -24C34 -40 56 -48 78 -45Q86 -42 82 -36C66 -36 46 -30 30 -18Z",
      `fill="url(#hand-finger)" stroke="${SKIN}" stroke-opacity="0.6" stroke-width="2"`
    ),
    ellipse(75, -41, 5, 3.4, `fill="#fde4d8" transform="rotate(-8 75 -41)"`),
  ].join(""),
  box: { h: 112, w: 165, x: -12, y: -62 },
};

export const bruise: Sprite = {
  body: [
    "<defs>",
    radial(
      "bruise-glow",
      [72, 0, 86],
      [
        [0, "#ff3c38", 0.8],
        [1, "#ff3c38", 0],
      ]
    ),
    "</defs>",
    ellipse(72, 0, 86, 52, `fill="url(#bruise-glow)"`),
  ].join(""),
  box: { h: 112, w: 180, x: -18, y: -56 },
};

const TUB = { x: 125, y: 872 } as const;
const TUB_BOX: Box = { h: 170, w: 260, x: -5, y: 830 };

export const tub: Sprite = {
  body: [
    "<defs>",
    linear(
      "tub-wood",
      [TUB.x - 88, 0, TUB.x + 88, 0],
      [
        [0, "#3f220d"],
        [0.32, "#b48150"],
        [0.46, "#d8a66c"],
        [1, "#33190a"],
      ]
    ),
    linear(
      "tub-water",
      [0, TUB.y - 14, 0, TUB.y + 18],
      [
        [0, "#1f4c78"],
        [1, "#8cc2e8"],
      ]
    ),
    linear(
      "tub-hoop",
      [TUB.x - 88, 0, TUB.x + 88, 0],
      [
        [0, "#20140b"],
        [0.45, "#9a7448"],
        [1, "#1a0f08"],
      ]
    ),
    grain("tub-grain", TUB_BOX, [0.09, 0.006], 19),
    blur("tub-soft", 6),
    "</defs>",
    ellipse(
      TUB.x,
      TUB.y + 70,
      112,
      22,
      `fill="#000" fill-opacity="0.6" filter="url(#tub-soft)"`
    ),
    path(
      `M${TUB.x - 88} ${TUB.y}L${TUB.x - 76} ${TUB.y + 64}A76 18 0 0 0 ${TUB.x + 76} ${TUB.y + 64}L${TUB.x + 88} ${TUB.y}Z`,
      `fill="url(#tub-wood)" filter="url(#tub-grain)"`
    ),
    ...[-50, -17, 17, 50].map((dx) =>
      path(
        `M${TUB.x + dx} ${TUB.y + 18}L${n(TUB.x + dx * 0.88)} ${TUB.y + 80}`,
        `stroke="#1e0e04" stroke-opacity="0.45" stroke-width="1.6"`
      )
    ),
    ...[20, 50].map((dy) =>
      path(
        `M${n(TUB.x - 88 + dy * 0.19)} ${TUB.y + dy}A${n(86 - dy * 0.19)} 20 0 0 0 ${n(TUB.x + 88 - dy * 0.19)} ${TUB.y + dy}`,
        `fill="none" stroke="url(#tub-hoop)" stroke-width="7"`
      )
    ),
    ellipse(
      TUB.x,
      TUB.y,
      88,
      21,
      `fill="#caa06a" stroke="#3a1c08" stroke-opacity="0.5" stroke-width="1.8"`
    ),
    ellipse(TUB.x, TUB.y + 3, 76, 15, `fill="url(#tub-water)"`),
    ellipse(TUB.x - 26, TUB.y, 24, 4, `fill="#fff" fill-opacity="0.6"`),
    ellipse(
      TUB.x + 18,
      TUB.y + 5,
      30,
      6,
      `fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="1.2"`
    ),
  ].join(""),
  box: TUB_BOX,
};

const MAT_BOX: Box = { h: 260, w: 1000, x: 0, y: 800 };

export const mat: Sprite = {
  body: [
    "<defs>",
    radial(
      "mat-pool",
      [500, 930, 460],
      [
        [0, "#ff9a52", 0.34],
        [0.6, "#ff9a52", 0.1],
        [1, "#ff9a52", 0],
      ]
    ),
    radial(
      "mat-straw",
      [470, 930, 400],
      [
        [0, "#b08a4e"],
        [0.7, "#7c5c2e"],
        [1, "#4a3418"],
      ]
    ),
    blur("mat-soft", 12),
    weave("mat-weave", MAT_BOX, 0.08, 0.5),
    `<clipPath id="mat-clip">${ellipse(500, 942, 390, 70, "")}</clipPath>`,
    "</defs>",
    ellipse(500, 930, 470, 120, `fill="url(#mat-pool)"`),
    ellipse(
      500,
      948,
      392,
      74,
      `fill="#000" fill-opacity="0.55" filter="url(#mat-soft)"`
    ),
    ellipse(
      500,
      942,
      390,
      70,
      `fill="url(#mat-straw)" filter="url(#mat-weave)"`
    ),
    `<g clip-path="url(#mat-clip)">${Array.from({ length: 18 }, (_, i) =>
      path(
        `M110 ${872 + i * 8}L890 ${872 + i * 8}`,
        `stroke="#3a2610" stroke-opacity="0.32" stroke-width="1.4"`
      )
    ).join("")}</g>`,
    ellipse(
      500,
      942,
      390,
      70,
      `fill="none" stroke="#2a1a08" stroke-opacity="0.6" stroke-width="3"`
    ),
    ellipse(
      500,
      958,
      360,
      36,
      `fill="#000" fill-opacity="0.5" filter="url(#mat-soft)"`
    ),
  ].join(""),
  box: MAT_BOX,
};

const KINE_ANGLE = Math.atan2(502 - KINE.pivot.y, 471 - KINE.pivot.x);

export const kinePose = (lift: number): Place => ({
  angle: KINE_ANGLE + KINE.swing * lift,
  sx: 1,
  sy: 1,
  x: KINE.pivot.x,
  y: KINE.pivot.y,
});

const SHOULDER = { x: -90, y: 420 } as const;
const REST = { angle: 1.05, x: 128, y: 790 } as const;
const PRESS = { angle: 0.1, x: 420, y: 626 } as const;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const segment = (from: Point, to: Point, length: number): Place => ({
  angle: Math.atan2(to.y - from.y, to.x - from.x),
  sx: Math.hypot(to.x - from.x, to.y - from.y) / length,
  sy: 1,
  x: from.x,
  y: from.y,
});

export const armPose = (reach: number, swell = 1) => {
  const arc = Math.sin(reach * Math.PI) * 90;
  const wrist = {
    x: mix(REST.x, PRESS.x, reach),
    y: mix(REST.y, PRESS.y, reach) - arc,
  };
  const elbow = {
    x: mix(SHOULDER.x, wrist.x, 0.5) - 15,
    y: mix(SHOULDER.y, wrist.y, 0.5) + 50 * (1 - reach) + 12,
  };
  return {
    forearm: segment(elbow, wrist, FOREARM),
    hand: {
      angle: mix(REST.angle, PRESS.angle, reach),
      sx: swell,
      sy: swell,
      x: wrist.x,
      y: wrist.y,
    },
    sleeve: segment(SHOULDER, elbow, SLEEVE),
  };
};

export const toWorld = (place: Place, x: number, y: number): Point => {
  const cos = Math.cos(place.angle);
  const sin = Math.sin(place.angle);
  return {
    x: place.x + cos * x * place.sx - sin * y * place.sy,
    y: place.y + sin * x * place.sx + cos * y * place.sy,
  };
};

interface Stage {
  s: number;
  width: number;
  height: number;
  x: (value: number) => number;
  y: (value: number) => number;
}

const stageOf = (width: number, height: number, frame: Frame): Stage => {
  const s = frame.size / SCENE;
  return {
    height,
    s,
    width,
    x: (value) => frame.x + value * s,
    y: (value) => frame.y + value * s,
  };
};

export const lanternsOf = (width: number, height: number, frame: Frame) => {
  const at = stageOf(width, height, frame);
  const gap = 230 * at.s;
  const first = at.x(500) - Math.ceil(at.x(500) / gap + 1) * gap;
  const spots: { x: number; y: number; size: number }[] = [];
  for (let x = first; x < width + gap; x += gap) {
    const t = (x - frame.x) / frame.size;
    spots.push({
      size: 30 * at.s,
      x,
      y: at.y(176 + 26 * Math.cos((t - 0.5) * Math.PI * 1.2)),
    });
  }
  return spots;
};

const lanternBody = [
  path("M0 -1.4L0 -0.92", `stroke="#120a08" stroke-width="0.05"`),
  path("M-0.3 -0.9L0.3 -0.9L0.34 -0.76L-0.34 -0.76Z", `fill="#140c0a"`),
  path(
    "M-0.34 -0.76C-0.68 -0.5 -0.68 0.5 -0.34 0.76L0.34 0.76C0.68 0.5 0.68 -0.5 0.34 -0.76Z",
    `fill="url(#bd-lantern)"`
  ),
  ...[-0.56, -0.36, -0.16, 0.04, 0.24, 0.44, 0.62].map((y) => {
    const half = 0.34 + 0.24 * Math.cos((y / 0.76) * (Math.PI / 2));
    return path(
      `M${n(-half)} ${y}Q0 ${n(y + 0.05)} ${n(half)} ${y}`,
      `fill="none" stroke="#7a1410" stroke-opacity="0.5" stroke-width="0.024"`
    );
  }),
  path(
    "M-0.2 -0.5C-0.32 -0.2 -0.32 0.2 -0.2 0.5",
    `fill="none" stroke="#fff3c8" stroke-opacity="0.5" stroke-width="0.06" stroke-linecap="round"`
  ),
  path("M-0.34 0.76L0.34 0.76L0.3 0.9L-0.3 0.9Z", `fill="#140c0a"`),
  path("M0 0.9L0 1.16", `stroke="#140c0a" stroke-width="0.04"`),
  path("M-0.07 1.12L0.07 1.12L0.04 1.42L-0.04 1.42Z", `fill="#d22f3a"`),
].join("");

const roof = (cx: number, base: number, width: number, tall: number) => {
  const left = cx - width / 2;
  const right = cx + width / 2;
  const ridge = `M${n(left - width * 0.06)} ${n(base)}C${n(left + width * 0.2)} ${n(base - tall * 0.18)} ${n(cx - width * 0.2)} ${n(base - tall * 0.86)} ${n(cx)} ${n(base - tall)}C${n(cx + width * 0.2)} ${n(base - tall * 0.86)} ${n(right - width * 0.2)} ${n(base - tall * 0.18)} ${n(right + width * 0.06)} ${n(base)}`;
  return [
    path(`${ridge}Z`, `fill="#0a0918"`),
    path(
      ridge,
      `fill="none" stroke="#3c4280" stroke-opacity="0.55" stroke-width="${n(tall * 0.025)}"`
    ),
  ].join("");
};

const curtainOf = (at: Stage) => {
  const top = at.y(290);
  const bottom = at.y(578);
  const stripe = 74 * at.s;
  const sway = 7 * at.s;
  const start = at.x(500) - Math.ceil(at.x(500) / stripe + 1) * stripe;
  const parts: string[] = [];
  const count = Math.ceil((at.width - start) / stripe) + 1;
  for (let i = 0; i < count; i += 1) {
    const x = start + i * stripe;
    const d = `M${n(x)} ${n(top)}L${n(x + stripe)} ${n(top)}L${n(x + stripe)} ${n(bottom + (i % 2 === 0 ? sway : 0))}Q${n(x + stripe / 2)} ${n(bottom + sway * 1.6)} ${n(x)} ${n(bottom + (i % 2 === 0 ? 0 : sway))}Z`;
    parts.push(
      path(d, `fill="${i % 2 === 0 ? "#b8232f" : "#efe6d8"}"`),
      path(d, `fill="url(#bd-fold)"`)
    );
  }
  return [
    `<g filter="url(#bd-depth)">`,
    ...parts,
    `<rect x="0" y="${n(top)}" width="${n(at.width)}" height="${n(bottom - top + 16 * at.s)}" fill="url(#bd-curtain-light)"/>`,
    `<rect x="0" y="${n(top - 12 * at.s)}" width="${n(at.width)}" height="${n(18 * at.s)}" fill="#160c08"/>`,
    `<rect x="0" y="${n(top - 12 * at.s)}" width="${n(at.width)}" height="${n(4 * at.s)}" fill="#6a4a2a" fill-opacity="0.6"/>`,
    "</g>",
  ].join("");
};

const groundOf = (at: Stage) => {
  const horizon = at.y(575);
  const vanishing = { x: at.x(500), y: at.y(380) };
  const rows = [600, 640, 700, 790, 920, 1100, 1350]
    .map((v) => at.y(v))
    .filter((y) => y < at.height);
  const columns = Array.from({ length: 23 }, (_, i) => at.x(-1600 + i * 190));
  const reach = (at.height - vanishing.y) / (horizon - vanishing.y);
  const joints = [
    ...rows.map((y) =>
      path(
        `M0 ${n(y)}L${n(at.width)} ${n(y)}`,
        `stroke="#000" stroke-opacity="0.4" stroke-width="${n(2 * at.s)}"`
      )
    ),
    ...columns.map((x) =>
      path(
        `M${n(vanishing.x + (x - vanishing.x) / reach)} ${n(horizon)}L${n(x)} ${n(at.height)}`,
        `stroke="#000" stroke-opacity="0.35" stroke-width="${n(2 * at.s)}"`
      )
    ),
  ].join("");
  return [
    `<rect x="0" y="${n(horizon)}" width="${n(at.width)}" height="${n(at.height - horizon)}" fill="url(#bd-ground)"/>`,
    `<g clip-path="url(#bd-ground-clip)">${joints}</g>`,
    `<rect x="0" y="${n(horizon - 30 * at.s)}" width="${n(at.width)}" height="${n(80 * at.s)}" fill="url(#bd-haze)"/>`,
    ellipse(
      at.x(500),
      at.y(640),
      300 * at.s,
      120 * at.s,
      `fill="url(#bd-warm)"`
    ),
  ].join("");
};

const snowfall = (width: number, height: number, s: number) => {
  const fall = seeded(91);
  return Array.from({ length: 60 }, () => {
    const near = fall() < 0.18;
    const r = (near ? 5 + fall() * 5 : 1.2 + fall() * 2.2) * s;
    return ellipse(
      fall() * width,
      fall() * height,
      r,
      r,
      `fill="#f2f4fb" fill-opacity="${n(near ? 0.35 : 0.55 + fall() * 0.35)}"${near ? ` filter="url(#bd-snow)"` : ""}`
    );
  }).join("");
};

const backdropDefs = (at: Stage) =>
  [
    "<defs>",
    linear(
      "bd-sky",
      [0, 0, 0, at.y(600)],
      [
        [0, "#060518"],
        [0.5, "#130f30"],
        [0.85, "#2a1631"],
        [1, "#3a1c22"],
      ]
    ),
    radial(
      "bd-moon",
      [at.x(860), at.y(40), 300 * at.s],
      [
        [0, "#d6dcff", 0.32],
        [1, "#d6dcff", 0],
      ]
    ),
    shade(
      "bd-fold",
      [
        [0, "#000", 0.42],
        [0.32, "#fff", 0.1],
        [0.7, "#000", 0],
        [1, "#000", 0.46],
      ],
      false
    ),
    linear(
      "bd-curtain-light",
      [0, at.y(290), 0, at.y(590)],
      [
        [0, "#0b0614", 0.62],
        [0.55, "#0b0614", 0.3],
        [1, "#ff8a40", 0.22],
      ]
    ),
    linear(
      "bd-ground",
      [0, at.y(575), 0, at.height],
      [
        [0, "#2a1c22"],
        [0.25, "#1c141a"],
        [1, "#0b080c"],
      ]
    ),
    linear(
      "bd-haze",
      [0, at.y(545), 0, at.y(655)],
      [
        [0, "#c08aa0", 0],
        [0.5, "#c08aa0", 0.14],
        [1, "#c08aa0", 0],
      ]
    ),
    radial(
      "bd-warm",
      [at.x(500), at.y(640), 300 * at.s],
      [
        [0, "#ff9a52", 0.28],
        [1, "#ff9a52", 0],
      ]
    ),
    radial(
      "bd-lantern",
      [0, -0.1, 0.7],
      [
        [0, "#fff0b8"],
        [0.32, "#ff9a4a"],
        [0.78, "#d8382c"],
        [1, "#7e1616"],
      ],
      [-0.15, -0.3]
    ),
    radial(
      "bd-halo",
      [0, 0, 2.4],
      [
        [0, "#ff9a4a", 0.55],
        [0.35, "#ff6a3a", 0.18],
        [1, "#ff6a3a", 0],
      ]
    ),
    blur("bd-depth", 1.6 * at.s),
    blur("bd-snow", 3 * at.s),
    blur("bd-bokeh", 16 * at.s),
    `<clipPath id="bd-ground-clip"><rect x="0" y="${n(at.y(575))}" width="${n(at.width)}" height="${n(at.height)}"/></clipPath>`,
    radial(
      "bd-vignette",
      [at.width / 2, at.height * 0.55, Math.max(at.width, at.height) * 0.78],
      [
        [0, "#000", 0],
        [0.6, "#000", 0.1],
        [1, "#000", 0.72],
      ]
    ),
    "</defs>",
  ].join("");

export const backdrop = (
  width: number,
  height: number,
  frame: Frame,
  flakes = true
) => {
  const at = stageOf(width, height, frame);
  const stars = seeded(13);
  const lanterns = lanternsOf(width, height, frame);
  const line = lanterns
    .map(
      (spot, i) =>
        `${i === 0 ? "M" : "L"}${n(spot.x)} ${n(spot.y - 1.4 * spot.size)}`
    )
    .join("");
  const corner = 210 * at.s;
  return [
    backdropDefs(at),
    `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-sky)"/>`,
    `<rect width="${n(width)}" height="${n(at.y(600))}" fill="url(#bd-moon)"/>`,
    ellipse(
      at.x(860),
      at.y(40),
      30 * at.s,
      30 * at.s,
      `fill="#f4f2e6" fill-opacity="0.92"`
    ),
    Array.from({ length: 90 }, () => {
      const r = 0.5 + stars() * 1.3;
      return ellipse(
        stars() * width,
        stars() * at.y(320),
        r,
        r,
        `fill="#fff" fill-opacity="${n(0.2 + stars() * 0.7)}"`
      );
    }).join(""),
    roof(at.x(70), at.y(300), 560 * at.s, 140 * at.s),
    roof(at.x(960), at.y(306), 640 * at.s, 160 * at.s),
    curtainOf(at),
    groundOf(at),
    path(line, `fill="none" stroke="#140a08" stroke-width="${n(2.4 * at.s)}"`),
    ...lanterns.map(
      (spot) =>
        `<g transform="translate(${n(spot.x)} ${n(spot.y)}) scale(${n(spot.size)})">${ellipse(0, 0, 2.4, 2.4, `fill="url(#bd-halo)"`)}${lanternBody}</g>`
    ),
    ellipse(
      -corner * 0.2,
      at.y(60),
      corner,
      corner,
      `fill="#ff5a3a" fill-opacity="0.14" filter="url(#bd-bokeh)"`
    ),
    ellipse(
      width + corner * 0.25,
      at.y(110),
      corner * 0.9,
      corner * 0.9,
      `fill="#ffb05a" fill-opacity="0.12" filter="url(#bd-bokeh)"`
    ),
    flakes ? snowfall(width, height, at.s) : "",
    `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-vignette)"/>`,
  ].join("");
};

export interface Pose {
  lift: number;
  reach: number;
  hurt: boolean;
  smooth: number;
}

type Group = "mochi" | "arm" | "kine";

export interface Piece {
  key: string;
  sprite: Sprite;
  place?: Place;
  alpha?: number;
  group?: Group;
}

const piecesOf = ({ lift, reach, hurt, smooth }: Pose): Piece[] => {
  const arm = armPose(reach, hurt ? 1.1 : 1);
  const bruised: Piece[] = hurt
    ? [{ group: "arm", key: "bruise", place: arm.hand, sprite: bruise }]
    : [];
  return [
    { key: "mat", sprite: mat },
    { key: "tub", sprite: tub },
    { key: "usu", sprite: usu },
    { group: "mochi", key: "mochi", sprite: mochiBody },
    { alpha: 1 - smooth, group: "mochi", key: "grains", sprite: mochiGrains },
    {
      alpha: 0.2 + 0.8 * smooth,
      group: "mochi",
      key: "gloss",
      sprite: mochiGloss,
    },
    { key: "lip", sprite: lip },
    { group: "arm", key: "sleeve", place: arm.sleeve, sprite: sleeve },
    { group: "arm", key: "forearm", place: arm.forearm, sprite: forearm },
    { group: "arm", key: "hand", place: arm.hand, sprite: hand },
    ...bruised,
    { group: "kine", key: "kine", place: kinePose(lift), sprite: kine },
  ];
};

const piecesBody = (pieces: readonly Piece[]) =>
  pieces
    .map((piece) => {
      const body =
        piece.alpha === undefined
          ? piece.sprite.body
          : `<g opacity="${n(piece.alpha)}">${piece.sprite.body}</g>`;
      return piece.place === undefined
        ? body
        : `<g transform="${transformOf(piece.place)}">${body}</g>`;
    })
    .join("");

export const sceneDoc = (
  width: number,
  height: number,
  frame: Frame,
  pose: Pose,
  pick: (piece: Piece) => boolean = () => true,
  scenery = true
) =>
  docOf(
    { h: height, w: width, x: 0, y: 0 },
    width,
    height,
    `${scenery ? backdrop(width, height, frame) : ""}<g transform="translate(${n(frame.x)} ${n(frame.y)}) scale(${n(frame.size / SCENE)})">${piecesBody(piecesOf(pose).filter(pick))}</g>`
  );
