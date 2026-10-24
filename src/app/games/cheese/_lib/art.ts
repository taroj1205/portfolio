import { dishes } from "./dishes";
import type { DishId } from "./dishes";
import { pathOf, pointAt, ribbonOf } from "./strand";
import type { Point, Thread } from "./strand";

export const UNIT = 1000;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Sprite {
  box: Box;
  body: string;
}

export interface Plate {
  base: Sprite;
  held: Sprite;
  spread: number;
  reach: number;
  feet: number;
  crown: number;
}

type Stop = readonly [number, string, number?];

export const paint = {
  basil: ["#6aa84f", "#2f5e22"],
  board: ["#a06a35", "#7a4b22", "#50301a"],
  boardSide: "#3a2111",
  bread: ["#f6e2b0", "#ecd09a", "#c9964f"],
  cheese: ["#fff7d6", "#ffe58a", "#f6c54e", "#d99a2b"],
  crust: ["#f7cf86", "#de9a45", "#a8601f"],
  dog: ["#6d3a10", "#c47a2a", "#f3c46e", "#e3a14a", "#8a4d16"],
  flame: ["#fff6c8", "#ffb347", "#ff6a1a"],
  glaze: ["#d9573a", "#a8361f", "#5e170b"],
  ketchup: "#c8261d",
  metal: ["#f4f6fa", "#a9b1c0", "#5d6576"],
  moon: ["#fbf8ec", "#ddd6c0", "#a9a089"],
  mustard: "#f4c430",
  pepperoni: ["#e0614a", "#b3321f", "#6e1b10"],
  plate: ["#ffffff", "#e9e4dc", "#b9b1a5"],
  sauce: "#b8321e",
  shadow: "#000000",
  sleeve: ["#fffaf1", "#d33a2c"],
  stick: ["#f1d9a8", "#c79a5a"],
  wick: "#2a1d14",
} as const;

const n = (value: number) => Number(value.toFixed(2));

export const seeded = (seed: number) => {
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

export const linear = (
  id: string,
  [x1, y1, x2, y2]: readonly [number, number, number, number],
  stops: readonly Stop[],
  units = "objectBoundingBox"
) =>
  `<linearGradient id="${id}" gradientUnits="${units}" x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}">${stopsOf(stops)}</linearGradient>`;

const radial = (
  id: string,
  [cx, cy, r]: readonly [number, number, number],
  stops: readonly Stop[],
  units = "objectBoundingBox"
) =>
  `<radialGradient id="${id}" gradientUnits="${units}" cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}">${stopsOf(stops)}</radialGradient>`;

const blur = (id: string, deviation: number) =>
  `<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${n(deviation)}"/></filter>`;

export const ellipse = (
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  attributes: string
) =>
  `<ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(rx)}" ry="${n(ry)}" ${attributes}/>`;

const path = (d: string, attributes: string) =>
  `<path d="${d}" ${attributes}/>`;

const points = (list: readonly Point[]) =>
  list
    .map((point, i) => `${i === 0 ? "M" : "L"}${n(point.x)} ${n(point.y)}`)
    .join("");

const docOf = (box: Box, width: number, height: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${n(box.x)} ${n(box.y)} ${n(box.w)} ${n(box.h)}" width="${Math.round(width)}" height="${Math.round(height)}" preserveAspectRatio="none">${body}</svg>`;

export const spriteDoc = (sprite: Sprite, scale: number) =>
  docOf(sprite.box, sprite.box.w * scale, sprite.box.h * scale, sprite.body);

export const dataUri = (svg: string) =>
  `data:image/svg+xml;base64,${btoa(svg)}`;

const pepperoni = (
  id: string,
  x: number,
  y: number,
  r: number,
  squash: number
) =>
  [
    ellipse(
      x + r * 0.08,
      y + r * squash * 0.22,
      r,
      r * squash,
      `fill="#5a1208" fill-opacity="0.35"`
    ),
    ellipse(
      x,
      y,
      r,
      r * squash,
      `fill="url(#${id}-pep)" stroke="${paint.pepperoni[2]}" stroke-width="${n(r * 0.07)}"`
    ),
    ellipse(
      x - r * 0.25,
      y - r * squash * 0.3,
      r * 0.3,
      r * squash * 0.18,
      `fill="#fff" fill-opacity="0.32"`
    ),
    ellipse(
      x + r * 0.3,
      y + r * squash * 0.1,
      r * 0.09,
      r * squash * 0.09,
      `fill="${paint.pepperoni[2]}" fill-opacity="0.6"`
    ),
    ellipse(
      x - r * 0.1,
      y + r * squash * 0.35,
      r * 0.07,
      r * squash * 0.07,
      `fill="${paint.pepperoni[2]}" fill-opacity="0.6"`
    ),
  ].join("");

const basil = (id: string, x: number, y: number, size: number, angle: number) =>
  `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)}) scale(${n(size / 44)})">${path("M0 0C14 -12 34 -10 46 0C34 10 14 12 0 0Z", `fill="url(#${id}-basil)"`)}${path("M2 0L42 0", `stroke="${paint.basil[1]}" stroke-width="1.6" fill="none"`)}</g>`;

const toppingDefs = (id: string) =>
  [
    radial(
      `${id}-pep`,
      [0.42, 0.38, 0.62],
      [
        [0, paint.pepperoni[0]],
        [0.7, paint.pepperoni[1]],
        [1, paint.pepperoni[2]],
      ]
    ),
    linear(
      `${id}-basil`,
      [0, 0, 1, 1],
      [
        [0, paint.basil[0]],
        [1, paint.basil[1]],
      ]
    ),
    radial(
      `${id}-char`,
      [0.5, 0.5, 0.5],
      [
        [0, "#9a5216", 0.55],
        [1, "#9a5216", 0],
      ]
    ),
  ].join("");

const PIE = { cx: 0, cy: -60, rx: 440, ry: 160, side: 34 } as const;
const WEDGE = [62, 118] as const;

const onPie = (degrees: number, k = 1): Point => {
  const a = (degrees * Math.PI) / 180;
  return {
    x: PIE.cx + PIE.rx * k * Math.cos(a),
    y: PIE.cy + PIE.ry * k * Math.sin(a),
  };
};

const face = (a: Point, b: Point, top: number, bottom: number, fill: string) =>
  path(
    `${points([
      { x: a.x, y: a.y + top },
      { x: b.x, y: b.y + top },
      { x: b.x, y: b.y + bottom },
      { x: a.x, y: a.y + bottom },
    ])}Z`,
    `fill="${fill}"`
  );

const rim = (from: number, to: number) => {
  const a = onPie(from);
  const b = onPie(to);
  return path(
    `M${n(a.x)} ${n(a.y)}A${PIE.rx} ${PIE.ry} 0 0 1 ${n(b.x)} ${n(b.y)}L${n(b.x)} ${n(b.y + PIE.side)}A${PIE.rx} ${PIE.ry} 0 0 0 ${n(a.x)} ${n(a.y + PIE.side)}Z`,
    `fill="url(#pz-rim)"`
  );
};

const pizzaBase = (): Sprite => {
  const centre = { x: PIE.cx, y: PIE.cy };
  const [w1, w2] = WEDGE;
  const p1 = onPie(w1);
  const p2 = onPie(w2);
  const inner1 = onPie(w1, 0.955);
  const inner2 = onPie(w2, 0.955);
  const char = seeded(41);
  const spots = Array.from({ length: 16 }, () => {
    const angle = 140 + char() * 260;
    const at = onPie(angle, 0.2 + char() * 0.68);
    const r = 18 + char() * 34;
    return ellipse(at.x, at.y, r, r * 0.38, `fill="url(#pz-char)"`);
  }).join("");
  const toppings: readonly [number, number, number][] = [
    [0.55, 200, 46],
    [0.62, 252, 44],
    [0.5, 300, 46],
    [0.72, 345, 42],
    [0.74, 160, 44],
    [0.28, 230, 40],
    [0.78, 22, 40],
    [0.3, 330, 38],
  ];
  const drips = [0.28, 0.55, 0.8]
    .flatMap((t) => [
      {
        x: centre.x + (p1.x - centre.x) * t,
        y: centre.y + (p1.y - centre.y) * t,
      },
      {
        x: centre.x + (p2.x - centre.x) * t,
        y: centre.y + (p2.y - centre.y) * t,
      },
    ])
    .map((at, i) => {
      const long = 14 + (i % 3) * 7;
      return path(
        `M${n(at.x - 16)} ${n(at.y - 2)}Q${n(at.x - 10)} ${n(at.y + long)} ${n(at.x)} ${n(at.y + long + 6)}Q${n(at.x + 10)} ${n(at.y + long)} ${n(at.x + 16)} ${n(at.y - 2)}Z`,
        `fill="url(#pz-melt)"`
      );
    })
    .join("");
  return {
    body: [
      "<defs>",
      blur("pz-soft", 16),
      radial(
        "pz-board",
        [0.42, 0.38, 0.7],
        [
          [0, paint.board[0]],
          [0.65, paint.board[1]],
          [1, paint.board[2]],
        ]
      ),
      linear(
        "pz-rim",
        [0, 0, 0, 1],
        [
          [0, paint.crust[1]],
          [1, paint.crust[2]],
        ]
      ),
      linear(
        "pz-crust",
        [0, 0, 0, 1],
        [
          [0, paint.crust[0]],
          [0.55, paint.crust[1]],
          [1, paint.crust[2]],
        ]
      ),
      radial(
        "pz-top",
        [0.4, 0.3, 0.75],
        [
          [0, paint.cheese[0]],
          [0.45, paint.cheese[1]],
          [0.85, paint.cheese[2]],
          [1, paint.cheese[3]],
        ]
      ),
      linear(
        "pz-melt",
        [0, 0, 0, 1],
        [
          [0, paint.cheese[1]],
          [1, paint.cheese[2]],
        ]
      ),
      toppingDefs("pz"),
      "</defs>",
      ellipse(
        0,
        190,
        480,
        48,
        `fill="${paint.shadow}" fill-opacity="0.5" filter="url(#pz-soft)"`
      ),
      ellipse(0, 4, 492, 188, `fill="${paint.boardSide}"`),
      ellipse(0, -20, 492, 188, `fill="url(#pz-board)"`),
      ...[0.3, 0.5, 0.7, 0.86].map((k) =>
        ellipse(
          0,
          -20,
          492 * k,
          188 * k,
          `fill="none" stroke="#3a2111" stroke-opacity="0.18" stroke-width="2"`
        )
      ),
      ellipse(0, 70, 120, 26, `fill="${paint.sauce}" fill-opacity="0.35"`),
      ...[
        [-40, 96, 6],
        [30, 110, 5],
        [70, 84, 4],
        [-80, 70, 4],
      ].map(([x = 0, y = 0, r = 0]) =>
        ellipse(x, y, r, r * 0.6, `fill="${paint.crust[1]}"`)
      ),
      rim(0, w1),
      rim(w2, 180),
      face(centre, p1, 0, 11, paint.cheese[2]),
      face(centre, p1, 11, 17, paint.sauce),
      face(centre, p1, 17, PIE.side, paint.bread[1]),
      face(centre, p2, 0, 11, paint.cheese[2]),
      face(centre, p2, 11, 17, paint.sauce),
      face(centre, p2, 17, PIE.side, paint.bread[1]),
      path(
        `M${centre.x} ${centre.y}L${n(p2.x)} ${n(p2.y)}A${PIE.rx} ${PIE.ry} 0 1 1 ${n(p1.x)} ${n(p1.y)}Z`,
        `fill="url(#pz-top)"`
      ),
      spots,
      ...toppings.map(([k, angle, r]) => {
        const at = onPie(angle, k);
        return pepperoni("pz", at.x, at.y, r, 0.4);
      }),
      basil("pz", onPie(215, 0.75).x, onPie(215, 0.75).y, 48, -20),
      basil("pz", onPie(280, 0.35).x, onPie(280, 0.35).y, 40, 30),
      basil("pz", onPie(10, 0.55).x, onPie(10, 0.55).y, 44, 160),
      path(
        `M${n(inner2.x)} ${n(inner2.y)}A${n(PIE.rx * 0.955)} ${n(PIE.ry * 0.955)} 0 1 1 ${n(inner1.x)} ${n(inner1.y)}`,
        `fill="none" stroke="url(#pz-crust)" stroke-width="44" stroke-linecap="round"`
      ),
      path(
        `M${n(inner2.x)} ${n(inner2.y - 12)}A${n(PIE.rx * 0.955)} ${n(PIE.ry * 0.955)} 0 1 1 ${n(inner1.x)} ${n(inner1.y - 12)}`,
        `fill="none" stroke="#fff3d6" stroke-opacity="0.35" stroke-width="7" stroke-linecap="round"`
      ),
      drips,
      ellipse(-150, -150, 70, 16, `fill="#fff" fill-opacity="0.28"`),
      ellipse(110, -100, 40, 9, `fill="#fff" fill-opacity="0.22"`),
    ].join(""),
    box: { h: 470, w: 1040, x: -520, y: -250 },
  };
};

const pizzaSlice = (): Sprite => {
  const left = { x: -195, y: -430 };
  const right = { x: 195, y: -430 };
  const tip = { x: 0, y: -14 };
  return {
    body: [
      "<defs>",
      linear(
        "sl-face",
        [0, 0, 0.3, 1],
        [
          [0, paint.cheese[0]],
          [0.4, paint.cheese[1]],
          [1, paint.cheese[2]],
        ]
      ),
      linear(
        "sl-crust",
        [0, 0, 0, 1],
        [
          [0, paint.crust[0]],
          [0.5, paint.crust[1]],
          [1, paint.crust[2]],
        ]
      ),
      linear(
        "sl-melt",
        [0, 0, 0, 1],
        [
          [0, paint.cheese[1]],
          [1, paint.cheese[2]],
        ]
      ),
      toppingDefs("sl"),
      "</defs>",
      path(
        `M${right.x} ${right.y}L${tip.x} ${tip.y}L${tip.x + 18} ${tip.y + 12}L${right.x + 18} ${right.y + 14}Z`,
        `fill="${paint.bread[2]}"`
      ),
      path(
        `M${left.x} ${left.y}Q0 ${left.y - 24} ${right.x} ${right.y}Q100 -210 ${tip.x + 8} ${tip.y}Q-100 -210 ${left.x} ${left.y}Z`,
        `fill="url(#sl-face)"`
      ),
      ellipse(-60, -300, 34, 18, `fill="url(#sl-char)"`),
      ellipse(50, -180, 40, 20, `fill="url(#sl-char)"`),
      pepperoni("sl", -62, -320, 44, 0.86),
      pepperoni("sl", 64, -300, 40, 0.86),
      pepperoni("sl", 4, -190, 38, 0.86),
      basil("sl", -10, -390, 44, 15),
      basil("sl", -40, -230, 36, -60),
      path(
        `M${left.x - 4} ${left.y + 6}Q0 ${left.y - 30} ${right.x + 4} ${right.y + 6}`,
        `fill="none" stroke="url(#sl-crust)" stroke-width="70" stroke-linecap="round"`
      ),
      path(
        `M${left.x + 10} ${left.y - 14}Q0 ${left.y - 50} ${right.x - 10} ${right.y - 14}`,
        `fill="none" stroke="#fff3d6" stroke-opacity="0.4" stroke-width="9" stroke-linecap="round"`
      ),
      path(
        "M-80 -120Q-60 -40 -30 -24Q-12 -16 -6 10Q0 30 8 8Q16 -20 34 -26Q64 -40 84 -120Q40 -60 0 -70Q-40 -60 -80 -120Z",
        `fill="url(#sl-melt)"`
      ),
      ellipse(-40, -110, 22, 8, `fill="#fff" fill-opacity="0.35"`),
    ].join(""),
    box: { h: 590, w: 520, x: -260, y: -540 },
  };
};

const dogBody = "M-105 -10L-105 -440A105 105 0 0 1 105 -440L105 -10Z";

const zigzag = (offset: number) => {
  const list: Point[] = [];
  for (let i = 0; i <= 10; i += 1) {
    list.push({ x: (i + offset) % 2 === 0 ? -92 : 92, y: -500 + i * 46 });
  }
  return points(list);
};

const crumbs = (
  seed: number,
  area: Box,
  count: number,
  colours: readonly string[]
) => {
  const roll = seeded(seed);
  return Array.from({ length: count }, (_, i) => {
    const r = 2.5 + roll() * 5;
    return ellipse(
      area.x + roll() * area.w,
      area.y + roll() * area.h,
      r,
      r * (0.6 + roll() * 0.4),
      `fill="${colours[i % colours.length] ?? "#000"}" fill-opacity="${n(0.25 + roll() * 0.45)}"`
    );
  }).join("");
};

const dogEnd = (id: string, y: number) =>
  [
    ellipse(0, y, 105, 32, `fill="${paint.dog[3]}"`),
    ellipse(0, y, 90, 26, `fill="${paint.bread[0]}"`),
    ellipse(0, y, 60, 18, `fill="url(#${id}-core)"`),
  ].join("");

const dogDefs = (id: string) =>
  [
    linear(
      `${id}-skin`,
      [0, 0, 1, 0],
      [
        [0, paint.dog[0]],
        [0.22, paint.dog[1]],
        [0.42, paint.dog[2]],
        [0.7, paint.dog[3]],
        [1, paint.dog[4]],
      ]
    ),
    radial(
      `${id}-core`,
      [0.45, 0.4, 0.6],
      [
        [0, paint.cheese[0]],
        [1, paint.cheese[1]],
      ]
    ),
  ].join("");

const corndogHeld = (): Sprite => ({
  body: [
    "<defs>",
    dogDefs("cd"),
    linear(
      "cd-stick",
      [0, 0, 1, 0],
      [
        [0, paint.stick[1]],
        [0.5, paint.stick[0]],
        [1, paint.stick[1]],
      ]
    ),
    `<clipPath id="cd-clip">${path(dogBody, "")}</clipPath>`,
    "</defs>",
    path("M-14 -820L14 -820L14 -500L-14 -500Z", `fill="url(#cd-stick)"`),
    path(dogBody, `fill="url(#cd-skin)"`),
    `<g clip-path="url(#cd-clip)">`,
    crumbs(7, { h: 520, w: 210, x: -105, y: -545 }, 90, [
      "#fbe2a0",
      "#7a4210",
      "#ffd27a",
    ]),
    path(
      zigzag(0),
      `fill="none" stroke="${paint.ketchup}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"`
    ),
    path(
      zigzag(1),
      `fill="none" stroke="${paint.mustard}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"`
    ),
    path(
      "M-70 -520L-70 -40",
      `stroke="#fff" stroke-opacity="0.18" stroke-width="22"`
    ),
    "</g>",
    dogEnd("cd", -10),
  ].join(""),
  box: { h: 870, w: 260, x: -130, y: -830 },
});

const sleevePath = "M-128 80L128 80L108 300L-108 300Z";

const corndogBase = (): Sprite => ({
  body: [
    "<defs>",
    dogDefs("cb"),
    blur("cb-soft", 14),
    radial(
      "cb-plate",
      [0.45, 0.35, 0.7],
      [
        [0, paint.plate[0]],
        [0.75, paint.plate[1]],
        [1, paint.plate[2]],
      ]
    ),
    `<clipPath id="cb-clip">${path(sleevePath, "")}</clipPath>`,
    "</defs>",
    ellipse(
      0,
      350,
      380,
      50,
      `fill="${paint.shadow}" fill-opacity="0.45" filter="url(#cb-soft)"`
    ),
    ellipse(0, 322, 370, 82, `fill="${paint.plate[2]}"`),
    ellipse(0, 312, 370, 82, `fill="url(#cb-plate)"`),
    ellipse(
      0,
      312,
      280,
      56,
      `fill="none" stroke="${paint.plate[2]}" stroke-opacity="0.5" stroke-width="3"`
    ),
    ellipse(-210, 330, 60, 14, `fill="${paint.ketchup}"`),
    ellipse(-150, 340, 34, 9, `fill="${paint.mustard}"`),
    path(
      "M-105 0L-105 250A105 50 0 0 0 105 250L105 0Z",
      `fill="url(#cb-skin)"`
    ),
    path(sleevePath, `fill="${paint.sleeve[0]}"`),
    `<g clip-path="url(#cb-clip)">`,
    Array.from({ length: 30 }, (_, i) => {
      const row = Math.floor(i / 6);
      const col = i % 6;
      return (row + col) % 2 === 0
        ? path(
            `M${-128 + col * 43} ${80 + row * 44}l43 0l0 44l-43 0Z`,
            `fill="${paint.sleeve[1]}"`
          )
        : "";
    }).join(""),
    path(
      "M-128 80L-108 300",
      `stroke="#000" stroke-opacity="0.18" stroke-width="40"`
    ),
    "</g>",
    path(
      "M-132 80L132 80",
      `stroke="#fff" stroke-width="8" stroke-linecap="round"`
    ),
    crumbs(9, { h: 70, w: 200, x: -100, y: 6 }, 18, ["#fbe2a0", "#7a4210"]),
    dogEnd("cb", 0),
  ].join(""),
  box: { h: 470, w: 860, x: -430, y: -60 },
});

const potBody = "M-330 10C-330 170 -240 252 0 252C240 252 330 170 330 10Z";

const fondueBase = (): Sprite => {
  const bubbles = seeded(23);
  return {
    body: [
      "<defs>",
      blur("fb-soft", 16),
      blur("fb-glow", 22),
      linear(
        "fb-glaze",
        [0, 0, 1, 0.4],
        [
          [0, paint.glaze[2]],
          [0.3, paint.glaze[0]],
          [0.6, paint.glaze[1]],
          [1, paint.glaze[2]],
        ]
      ),
      radial(
        "fb-top",
        [0.42, 0.4, 0.7],
        [
          [0, paint.cheese[0]],
          [0.55, paint.cheese[1]],
          [1, paint.cheese[2]],
        ]
      ),
      radial(
        "fb-flame",
        [0.5, 0.6, 0.5],
        [
          [0, paint.flame[0]],
          [0.5, paint.flame[1]],
          [1, paint.flame[2], 0],
        ]
      ),
      linear(
        "fb-metal",
        [0, 0, 1, 0],
        [
          [0, paint.metal[2]],
          [0.5, paint.metal[1]],
          [1, paint.metal[2]],
        ]
      ),
      "</defs>",
      ellipse(
        0,
        345,
        420,
        46,
        `fill="${paint.shadow}" fill-opacity="0.5" filter="url(#fb-soft)"`
      ),
      ellipse(
        0,
        285,
        120,
        60,
        `fill="${paint.flame[1]}" fill-opacity="0.55" filter="url(#fb-glow)"`
      ),
      path(
        "M-250 230L-300 340M250 230L300 340M0 250L0 345",
        `stroke="url(#fb-metal)" stroke-width="14" stroke-linecap="round" fill="none"`
      ),
      ellipse(0, 306, 54, 16, `fill="${paint.metal[1]}"`),
      path("M-22 300Q-24 262 0 236Q24 262 22 300Z", `fill="url(#fb-flame)"`),
      path(potBody, `fill="url(#fb-glaze)"`),
      path(
        "M-320 40L-470 18Q-494 40 -470 62L-318 82Z",
        `fill="url(#fb-glaze)"`
      ),
      path(
        "M-282 70C-270 170 -200 220 -110 236",
        `fill="none" stroke="#fff" stroke-opacity="0.3" stroke-width="18" stroke-linecap="round"`
      ),
      ellipse(0, 10, 330, 80, `fill="${paint.glaze[2]}"`),
      ellipse(0, 14, 304, 66, `fill="url(#fb-top)"`),
      Array.from({ length: 14 }, () => {
        const a = bubbles() * Math.PI * 2;
        const k = Math.sqrt(bubbles()) * 0.85;
        const r = 7 + bubbles() * 14;
        return ellipse(
          Math.cos(a) * 290 * k,
          14 + Math.sin(a) * 60 * k,
          r,
          r * 0.4,
          `fill="#fff9e0" fill-opacity="0.55" stroke="${paint.cheese[3]}" stroke-opacity="0.35" stroke-width="2"`
        );
      }).join(""),
      ellipse(
        0,
        10,
        330,
        80,
        `fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="5"`
      ),
    ].join(""),
    box: { h: 480, w: 1040, x: -520, y: -110 },
  };
};

const fondueHeld = (): Sprite => ({
  body: [
    "<defs>",
    linear(
      "fh-metal",
      [0, 0, 1, 0],
      [
        [0, paint.metal[2]],
        [0.45, paint.metal[0]],
        [1, paint.metal[1]],
      ]
    ),
    linear(
      "fh-grip",
      [0, 0, 1, 0],
      [
        [0, "#4a2a12"],
        [0.5, "#8a5428"],
        [1, "#4a2a12"],
      ]
    ),
    linear(
      "fh-crumb",
      [0, 0, 0, 1],
      [
        [0, paint.bread[0]],
        [1, paint.bread[1]],
      ]
    ),
    linear(
      "fh-top",
      [0, 0, 1, 1],
      [
        [0, paint.crust[0]],
        [1, paint.crust[2]],
      ]
    ),
    linear(
      "fh-melt",
      [0, 0, 0, 1],
      [
        [0, paint.cheese[0]],
        [0.6, paint.cheese[1]],
        [1, paint.cheese[2]],
      ]
    ),
    "</defs>",
    path("M-7 -800L7 -800L5 -200L-5 -200Z", `fill="url(#fh-metal)"`),
    path("M-17 -860L17 -860L15 -690L-15 -690Z", `fill="url(#fh-grip)"`),
    ellipse(0, -864, 18, 10, `fill="#8a5428"`),
    path("M-120 -232L80 -232L104 -206L-96 -206Z", `fill="url(#fh-top)"`),
    path(
      "M-96 -206L104 -206L104 -40Q104 -26 90 -26L-82 -26Q-96 -26 -96 -40Z",
      `fill="url(#fh-crumb)" stroke="${paint.crust[2]}" stroke-width="12" stroke-linejoin="round"`
    ),
    path("M104 -206L80 -232L80 -60L104 -40Z", `fill="${paint.crust[2]}"`),
    crumbs(17, { h: 150, w: 180, x: -86, y: -196 }, 26, ["#c9964f", "#b07a38"]),
    path(
      "M-104 -110Q-104 -44 -64 -32Q-30 -26 -14 -6Q0 16 14 -6Q34 -26 74 -32Q110 -44 110 -110Q70 -86 2 -94Q-62 -86 -104 -110Z",
      `fill="url(#fh-melt)"`
    ),
    ellipse(-46, -78, 26, 8, `fill="#fff" fill-opacity="0.4"`),
  ].join(""),
  box: { h: 920, w: 300, x: -150, y: -880 },
});

export const plates: Record<DishId, Plate> = {
  corndog: {
    base: corndogBase(),
    crown: 600,
    feet: 380,
    held: corndogHeld(),
    reach: 40,
    spread: 52,
  },
  fondue: {
    base: fondueBase(),
    crown: 260,
    feet: 360,
    held: fondueHeld(),
    reach: 60,
    spread: 150,
  },
  pizza: {
    base: pizzaBase(),
    crown: 540,
    feet: 200,
    held: pizzaSlice(),
    reach: 62,
    spread: 120,
  },
};

const moonBody = (id: string, cheese: boolean) => {
  const roll = seeded(cheese ? 77 : 31);
  const holes = Array.from({ length: cheese ? 9 : 11 }, () => {
    const a = roll() * Math.PI * 2;
    const k = Math.sqrt(roll()) * 0.78;
    const r = 7 + roll() * (cheese ? 16 : 13);
    const x = Math.cos(a) * 100 * k;
    const y = Math.sin(a) * 100 * k;
    return cheese
      ? ellipse(x, y, r, r, `fill="#c98a1e" fill-opacity="0.75"`) +
          ellipse(
            x - r * 0.15,
            y - r * 0.2,
            r * 0.82,
            r * 0.82,
            `fill="#a86d10" fill-opacity="0.6"`
          )
      : ellipse(x, y, r, r, `fill="#8f876f" fill-opacity="0.35"`) +
          ellipse(
            x + r * 0.18,
            y + r * 0.2,
            r * 0.8,
            r * 0.8,
            `fill="#fffbef" fill-opacity="0.25"`
          );
  }).join("");
  const colours = cheese ? paint.cheese : paint.moon;
  return [
    "<defs>",
    radial(
      `${id}-face`,
      [0.38, 0.34, 0.72],
      [
        [0, colours[0]],
        [0.6, colours[1]],
        [1, colours[2]],
      ]
    ),
    radial(
      `${id}-halo`,
      [0.5, 0.5, 0.5],
      [
        [0.62, colours[1], 0.4],
        [1, colours[1], 0],
      ]
    ),
    "</defs>",
    ellipse(0, 0, 165, 165, `fill="url(#${id}-halo)"`),
    ellipse(0, 0, 100, 100, `fill="url(#${id}-face)"`),
    holes,
  ].join("");
};

export const moon: Sprite = {
  body: moonBody("mn", false),
  box: { h: 340, w: 340, x: -170, y: -170 },
};

export const cheeseMoon: Sprite = {
  body: moonBody("cm", true),
  box: { h: 340, w: 340, x: -170, y: -170 },
};

export interface Landmark {
  d: string;
  size: number;
  fill: readonly Stop[];
}

export const landmarks = {
  airliner: {
    d: "M-50 0Q-48 -4 -40 -4L38 -4Q50 -3 52 0Q50 3 38 4L-40 4Q-48 4 -50 0ZM-44 -4L-50 -18L-42 -18L-32 -4ZM-6 0L10 0L-12 16L-18 16ZM-4 -2L8 -2L-6 -10L-10 -10Z",
    fill: [
      [0, "#ffffff"],
      [1, "#c9d2e0"],
    ],
    size: 100,
  },
  fuji: {
    d: "M-260 0C-170 -30 -60 -80 -16 -98Q0 -101 16 -98C60 -80 170 -30 260 0Z",
    fill: [
      [0, "#7d8fb8"],
      [0.6, "#4a5e8c"],
      [1, "#33456e"],
    ],
    size: 100,
  },
  iss: {
    d: "M-50 -1L50 -1L50 1L-50 1ZM-48 -15L-33 -15L-33 -2L-48 -2ZM-48 2L-33 2L-33 15L-48 15ZM33 -15L48 -15L48 -2L33 -2ZM33 2L48 2L48 15L33 15ZM-7 -4L7 -4L7 4L-7 4ZM-2 4L2 4L2 12L-2 12ZM-20 -10L-12 -10L-12 -2L-20 -2ZM12 2L20 2L20 10L12 10Z",
    fill: [
      [0, "#e8d9a8"],
      [1, "#7f97c9"],
    ],
    size: 100,
  },
  person: {
    d: "M-7 -92A7 7 0 1 0 7 -92A7 7 0 1 0 -7 -92ZM-12 -83Q0 -87 12 -83L14 -50L10 -49L9 -66L8 -46L9 0L2 0L0 -40L-2 0L-9 0L-8 -46L-9 -66L-10 -49L-14 -50Z",
    fill: [
      [0, "#3a2620"],
      [1, "#22140f"],
    ],
    size: 100,
  },
  satellite: {
    d: "M-8 -8L8 -8L8 8L-8 8ZM-50 -5L-12 -5L-12 5L-50 5ZM12 -5L50 -5L50 5L12 5ZM8 -4Q20 0 8 4Z",
    fill: [
      [0, "#f2e3b0"],
      [1, "#6b86c4"],
    ],
    size: 100,
  },
  skytree: {
    d: "M-6 0L-2.6 -55L-2.2 -70L2.2 -70L2.6 -55L6 0ZM-4.2 -54L4.2 -54L4.6 -57L3.8 -59L-3.8 -59L-4.6 -57ZM-3 -70.5L3 -70.5L3.2 -73L-3.2 -73ZM-1.6 -73L1.6 -73L0.4 -100L-0.4 -100Z",
    fill: [
      [0, "#9fb5d1"],
      [1, "#eef4fb"],
    ],
    size: 100,
  },
  snow: {
    d: "M-42 -86C-34 -90 -24 -95 -16 -98Q0 -101 16 -98C24 -95 34 -90 42 -86L32 -83L24 -87L14 -81L4 -86L-6 -80L-16 -87L-26 -82Z",
    fill: [
      [0, "#dfe7f7"],
      [1, "#ffffff"],
    ],
    size: 100,
  },
  tower: {
    d: "M-17 0C-11 -18 -7 -40 -5 -60L-2.6 -86L2.6 -86L5 -60C7 -40 11 -18 17 0L11 0Q0 -16 -11 0ZM-9.5 -43L9.5 -43L9 -47.5L-9 -47.5ZM-4.5 -74L4.5 -74L4.2 -77.5L-4.2 -77.5ZM-1 -86L1 -86L0.5 -100L-0.5 -100Z",
    fill: [
      [0, "#e8452c"],
      [0.18, "#e8452c"],
      [0.18, "#f4f0ea"],
      [0.3, "#f4f0ea"],
      [0.3, "#e8452c"],
      [0.5, "#e8452c"],
      [0.5, "#f4f0ea"],
      [0.6, "#f4f0ea"],
      [0.6, "#e8452c"],
      [0.82, "#e8452c"],
      [0.82, "#f4f0ea"],
      [1, "#f4f0ea"],
    ],
    size: 100,
  },
} satisfies Record<string, Landmark>;

export interface Look {
  skyTop: string;
  skyLow: string;
  stars: number;
}

const looks: readonly (Look & { at: number })[] = [
  { at: 0, skyLow: "#ffb27a", skyTop: "#5a3a6e", stars: 0 },
  { at: 2.8, skyLow: "#ff9a6a", skyTop: "#3a3f7e", stars: 0 },
  { at: 4.6, skyLow: "#f28a6e", skyTop: "#24346f", stars: 0.1 },
  { at: 5.8, skyLow: "#8fb0e0", skyTop: "#1b2f6b", stars: 0.2 },
  { at: 6.6, skyLow: "#4a6fc0", skyTop: "#0b1336", stars: 0.6 },
  { at: 7.2, skyLow: "#14204a", skyTop: "#03040c", stars: 1 },
  { at: 11, skyLow: "#05060f", skyTop: "#020208", stars: 1 },
];

const hex = (colour: string) =>
  [1, 3, 5].map((i) => Number.parseInt(colour.slice(i, i + 2), 16));

export const mix = (a: string, b: string, t: number) => {
  const from = hex(a);
  const to = hex(b);
  return `#${from
    .map((value, i) =>
      Math.round(value + ((to[i] ?? value) - value) * t)
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
};

export const lookAt = (altitude: number): Look => {
  for (let i = 1; i < looks.length; i += 1) {
    const a = looks[i - 1];
    const b = looks[i];
    if (a !== undefined && b !== undefined && altitude <= b.at) {
      const t = Math.max(0, Math.min(1, (altitude - a.at) / (b.at - a.at)));
      return {
        skyLow: mix(a.skyLow, b.skyLow, t),
        skyTop: mix(a.skyTop, b.skyTop, t),
        stars: a.stars + (b.stars - a.stars) * t,
      };
    }
  }
  return { skyLow: "#05060f", skyTop: "#020208", stars: 1 };
};

export interface Pull {
  dish: DishId;
  base: Point;
  size: number;
  top: number;
}

export interface Twist {
  phase: number;
  thickness: number;
}

export interface Flow {
  clock: number;
  sway: number;
  thin: number;
}

const still: Flow = { clock: 0, sway: 0.4, thin: 1 };

const twistsOf = (count: number): Twist[] =>
  Array.from({ length: count }, (_, i) => ({
    phase: i * 2.1,
    thickness: 0.75 + ((i * 7) % 5) * 0.12,
  }));

export const threadOf = (
  { dish, base, size, top }: Pull,
  twist: Twist,
  side: number,
  { clock, sway, thin }: Flow
): Thread => {
  const plate = plates[dish];
  const k = size / UNIT;
  const height = Math.max(1, base.y - top);
  return {
    bend:
      Math.sin(clock * 1.6 + twist.phase) *
      sway *
      Math.min(40 * k, height * 0.06),
    ends: (40 + twist.thickness * 16) * k,
    from: { x: base.x + side * 2 * plate.spread * k, y: base.y },
    neck: Math.max(1.4, twist.thickness * 16 * k * thin),
    pinch: 0.42,
    to: { x: base.x + side * 2 * plate.reach * k, y: top },
  };
};

export const sideOf = (index: number, count: number) =>
  count === 1 ? 0 : index / (count - 1) - 0.5;

interface Web {
  ea: Point;
  pa: Point;
  mid: Point;
  pb: Point;
  eb: Point;
}

export const websOf = (threads: readonly Thread[]) => {
  const webs: Web[] = [];
  for (let i = 0; i < threads.length - 1; i += 1) {
    const a = threads[i];
    const b = threads[i + 1];
    if (a !== undefined && b !== undefined) {
      for (const [end, reach] of [
        [0, 0.09],
        [1, 0.91],
      ] as const) {
        const ea = end === 0 ? a.from : a.to;
        const eb = end === 0 ? b.from : b.to;
        const pa = pointAt(a, reach);
        const pb = pointAt(b, reach);
        const sag = (end === 0 ? 1 : -1) * Math.abs(pa.y - ea.y) * 0.55;
        webs.push({
          ea,
          eb,
          mid: { x: (pa.x + pb.x) / 2, y: (pa.y + pb.y) / 2 + sag },
          pa,
          pb,
        });
      }
    }
  }
  return webs;
};

const strandsBody = (pull: Pull, id: string) => {
  const twists = twistsOf(dishes[pull.dish].strands);
  const threads = twists.map((twist, i) =>
    threadOf(pull, twist, sideOf(i, twists.length), still)
  );
  return [
    "<defs>",
    linear(
      `${id}-thread`,
      [0, 0, 1, 0],
      [
        [0, paint.cheese[3]],
        [0.3, paint.cheese[1]],
        [0.5, paint.cheese[0]],
        [0.75, paint.cheese[2]],
        [1, paint.cheese[3]],
      ]
    ),
    "</defs>",
    ...websOf(threads).map(({ ea, pa, mid, pb, eb }) =>
      path(
        `M${n(ea.x)} ${n(ea.y)}L${n(pa.x)} ${n(pa.y)}Q${n(mid.x)} ${n(mid.y)} ${n(pb.x)} ${n(pb.y)}L${n(eb.x)} ${n(eb.y)}Z`,
        `fill="${paint.cheese[1]}" fill-opacity="0.55"`
      )
    ),
    ...threads.map((thread) =>
      path(pathOf(ribbonOf(thread)), `fill="url(#${id}-thread)"`)
    ),
    ...threads.flatMap((thread) => [
      ellipse(
        thread.from.x,
        thread.from.y,
        thread.ends * 0.7,
        thread.ends * 0.26,
        `fill="${paint.cheese[1]}"`
      ),
      ellipse(
        thread.to.x,
        thread.to.y,
        thread.ends * 0.6,
        thread.ends * 0.22,
        `fill="${paint.cheese[1]}"`
      ),
    ]),
  ].join("");
};

const place = (sprite: Sprite, at: Point, size: number) =>
  `<g transform="translate(${n(at.x)} ${n(at.y)}) scale(${n(size / UNIT)})">${sprite.body}</g>`;

export type Layer = "back" | "cheese" | "held";

export const pullDoc = (
  width: number,
  height: number,
  pull: Pull,
  layers: readonly Layer[],
  scenery = ""
) => {
  const plate = plates[pull.dish];
  const parts: Record<Layer, string> = {
    back: `${scenery}${place(plate.base, pull.base, pull.size)}`,
    cheese: strandsBody(pull, `st-${pull.dish}`),
    held: place(plate.held, { x: pull.base.x, y: pull.top }, pull.size),
  };
  return docOf(
    { h: height, w: width, x: 0, y: 0 },
    width,
    height,
    layers.map((layer) => parts[layer]).join("")
  );
};

export const landmarkBody = (
  key: keyof typeof landmarks,
  id: string,
  at: Point,
  height: number,
  opacity = 1
) => {
  const mark = landmarks[key];
  return `<defs>${linear(`${id}-mark`, [0, 1, 0, 0], mark.fill)}</defs><g transform="translate(${n(at.x)} ${n(at.y)}) scale(${n(height / mark.size)})" opacity="${n(opacity)}">${path(mark.d, `fill="url(#${id}-mark)"`)}</g>`;
};

export const moonBodyAt = (cheese: boolean, at: Point, radius: number) =>
  `<g transform="translate(${n(at.x)} ${n(at.y)}) scale(${n(radius / 100)})">${(cheese ? cheeseMoon : moon).body}</g>`;
