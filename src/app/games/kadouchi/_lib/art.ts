import {
  blur,
  dataUri,
  docOf,
  ellipse,
  linear,
  n,
  path,
  radial,
  seeded,
  shade,
  spriteDoc,
} from "../../_lib/svg";
import type { Frame, Sprite } from "../../_lib/svg";
import { LID, SHELVES, kinds, prizeIds } from "./prizes";
import type { PrizeId } from "./prizes";

export const SCENE = 1000;
export const VIEW = { h: 1150, w: 840, x: 80, y: 0 } as const;
export const STALL = { left: 110, right: 890 } as const;
export const GUN = { x: 500, y: 1190 } as const;
export const BARREL = 300;

const SLAB = 26;
const COUNTER = 960;

const ink = {
  black: "#1b1210",
  cloth: "#7a1020",
  clothDeep: "#3d0610",
  cork: "#c99a5e",
  corkDark: "#8a5f30",
  gold: "#ffd27a",
  lantern: "#ff5a3a",
  night: "#120c2a",
  paper: "#fff8ec",
  pink: "#ff9fb8",
  red: "#d8262e",
  steel: "#3a4048",
  white: "#ffffff",
  wood: "#a8673a",
  woodDark: "#5a321c",
  woodLight: "#e0a868",
} as const;

const lidOf = (id: PrizeId) => {
  const { w, h, d } = kinds[id];
  const rise = d * LID;
  const inset = d * 0.12;

  return `M${n(-w / 2)} ${n(-h)}L${n(w / 2)} ${n(-h)}L${n(w / 2 - inset)} ${n(-h - rise)}L${n(-w / 2 + inset)} ${n(-h - rise)}Z`;
};

const lid = (id: PrizeId) => {
  const { box } = kinds[id];

  return box === null
    ? ""
    : path(
        lidOf(id),
        `fill="${box.top}" stroke="${ink.black}" stroke-opacity="0.25" stroke-width="2"`
      );
};

const rect = (
  x: number,
  y: number,
  w: number,
  h: number,
  attributes: string,
  r = 0
) =>
  `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" ${attributes}/>`;

const circle = (cx: number, cy: number, r: number, attributes: string) =>
  `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" ${attributes}/>`;

const gloss = (w: number, h: number) =>
  rect(
    -w / 2 + 6,
    -h + 6,
    w * 0.16,
    h - 12,
    `fill="#fff" fill-opacity="0.22"`,
    4
  );

const caramel = () => {
  const { w, h } = kinds.caramel;

  return [
    "<defs>",
    linear(
      "pz-car-body",
      [-w / 2, 0, w / 2, 0],
      [
        [0, "#f7c531"],
        [0.5, "#ffe27a"],
        [1, "#d99a12"],
      ]
    ),
    radial(
      "pz-car-cube",
      [-4, -70, 18],
      [
        [0, "#e8a55a"],
        [1, "#8a4a18"],
      ]
    ),
    "</defs>",
    rect(-w / 2, -h, w, h, `fill="url(#pz-car-body)"`, 3),
    rect(-w / 2, -h, w, 26, `fill="${ink.red}"`, 3),
    rect(-w / 2, -14, w, 14, `fill="${ink.red}"`),
    ellipse(0, -64, 24, 32, `fill="${ink.paper}"`),
    rect(-14, -78, 28, 26, `fill="url(#pz-car-cube)"`, 6),
    rect(-10, -76, 10, 6, `fill="#fff" fill-opacity="0.5"`, 3),
    path(
      "M-20 -113L-12 -105L-4 -113L4 -105L12 -113L20 -105",
      `fill="none" stroke="${ink.paper}" stroke-width="3" stroke-linecap="round"`
    ),
    gloss(w, h),
    lid("caramel"),
  ].join("");
};

const ramune = () => {
  const bottle =
    "M-27 -8Q-27 0 -19 0L19 0Q27 0 27 -8L27 -84Q27 -98 14 -104L14 -108Q20 -112 20 -118Q20 -124 13 -127L13 -138L-13 -138L-13 -127Q-20 -124 -20 -118Q-20 -112 -14 -108L-14 -104Q-27 -98 -27 -84Z";

  return [
    "<defs>",
    linear(
      "pz-ram-glass",
      [-27, 0, 27, 0],
      [
        [0, "#5fc8d8", 0.95],
        [0.35, "#c8f4ff", 0.9],
        [0.7, "#7fd8e8", 0.9],
        [1, "#2e8fa8", 0.95],
      ]
    ),
    radial(
      "pz-ram-marble",
      [-3, -121, 9],
      [
        [0, "#ffffff"],
        [1, "#8fd8ff"],
      ]
    ),
    "</defs>",
    path(bottle, `fill="url(#pz-ram-glass)" stroke="#1f6f84" stroke-width="2"`),
    path(
      "M-27 -60L27 -60L27 -32L-27 -32Z",
      `fill="${ink.paper}" fill-opacity="0.95"`
    ),
    path(
      "M-27 -46Q-18 -54 -9 -46T9 -46T27 -46",
      `fill="none" stroke="#2d6fd0" stroke-width="4"`
    ),
    circle(0, -119, 10, `fill="url(#pz-ram-marble)"`),
    rect(-15, -150, 30, 14, `fill="#2d6fd0"`, 4),
    rect(-18, -92, 7, 70, `fill="#fff" fill-opacity="0.45"`, 3),
  ].join("");
};

const kendama = () =>
  [
    "<defs>",
    linear(
      "pz-ken-wood",
      [-40, 0, 40, 0],
      [
        [0, "#c98a52"],
        [0.5, "#f0c08a"],
        [1, "#a8673a"],
      ]
    ),
    radial(
      "pz-ken-ball",
      [-10, -96, 40],
      [
        [0, "#ff8a7a"],
        [0.6, ink.red],
        [1, "#7a0e14"],
      ]
    ),
    "</defs>",
    ellipse(0, -6, 20, 7, `fill="url(#pz-ken-wood)"`),
    rect(-8, -56, 16, 52, `fill="url(#pz-ken-wood)"`, 4),
    path(
      "M-39 -40Q-39 -60 -27 -62L27 -62Q39 -60 39 -40Q30 -46 18 -48L-18 -48Q-30 -46 -39 -40Z",
      `fill="url(#pz-ken-wood)" stroke="${ink.woodDark}" stroke-width="2"`
    ),
    circle(0, -86, 34, `fill="url(#pz-ken-ball)"`),
    path(
      "M-33 -80Q0 -66 33 -80",
      `fill="none" stroke="${ink.white}" stroke-width="4"`
    ),
    ellipse(-12, -104, 9, 6, `fill="#fff" fill-opacity="0.6"`),
  ].join("");

const choco = () => {
  const { w, h } = kinds.choco;

  const squares = Array.from({ length: 6 }, (_, i) =>
    rect(
      -46 + (i % 3) * 22,
      -66 + Math.floor(i / 3) * 22,
      18,
      18,
      `fill="#7a3a1c" stroke="#3a160a" stroke-width="1.5"`,
      3
    )
  ).join("");

  return [
    "<defs>",
    shade("pz-cho-body", [
      [0, "#6a3018"],
      [1, "#3a160a"],
    ]),
    "</defs>",
    rect(-w / 2, -h, w, h, `fill="url(#pz-cho-body)"`, 3),
    path(
      `M${-w / 2} ${-h + 10}L${w / 2} ${-h + 40}L${w / 2} ${-h + 56}L${-w / 2} ${-h + 26}Z`,
      `fill="${ink.red}"`
    ),
    squares,
    rect(10, -70, 40, 40, `fill="${ink.gold}"`, 20),
    circle(30, -50, 12, `fill="${ink.red}"`),
    gloss(w, h),
    lid("choco"),
  ].join("");
};

const daruma = () =>
  [
    "<defs>",
    radial(
      "pz-dar-body",
      [-24, -110, 120],
      [
        [0, "#ff6a5a"],
        [0.55, ink.red],
        [1, "#6a0a10"],
      ]
    ),
    "</defs>",
    path(
      "M0 -160C52 -160 70 -120 70 -76C70 -26 44 0 0 0C-44 0 -70 -26 -70 -76C-70 -120 -52 -160 0 -160Z",
      `fill="url(#pz-dar-body)"`
    ),
    path(
      "M0 -140C32 -140 46 -120 46 -98C46 -76 28 -62 0 -62C-28 -62 -46 -76 -46 -98C-46 -120 -32 -140 0 -140Z",
      `fill="${ink.paper}"`
    ),
    path(
      "M-36 -122Q-24 -132 -10 -124M36 -122Q24 -132 10 -124",
      `fill="none" stroke="${ink.black}" stroke-width="7" stroke-linecap="round"`
    ),
    circle(
      -19,
      -104,
      11,
      `fill="${ink.white}" stroke="${ink.black}" stroke-width="3"`
    ),
    circle(
      19,
      -104,
      11,
      `fill="${ink.white}" stroke="${ink.black}" stroke-width="3"`
    ),
    circle(-19, -104, 5, `fill="${ink.black}"`),
    path(
      "M-22 -78Q-10 -86 0 -78Q10 -86 22 -78",
      `fill="none" stroke="${ink.black}" stroke-width="5" stroke-linecap="round"`
    ),
    path(
      "M-40 -40Q0 -14 40 -40M-30 -24Q0 -4 30 -24",
      `fill="none" stroke="${ink.gold}" stroke-width="6" stroke-linecap="round"`
    ),
    ellipse(-38, -120, 10, 22, `fill="#fff" fill-opacity="0.28"`),
  ].join("");

const burst = (cx: number, cy: number, r: number, color: string) =>
  Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;

    return path(
      `M${n(cx + Math.cos(a) * r * 0.25)} ${n(cy + Math.sin(a) * r * 0.25)}L${n(cx + Math.cos(a) * r)} ${n(cy + Math.sin(a) * r)}`,
      `stroke="${color}" stroke-width="4" stroke-linecap="round"`
    );
  }).join("") + circle(cx, cy, r * 0.14, `fill="${color}"`);

const hanabi = () => {
  const { w, h } = kinds.hanabi;

  return [
    "<defs>",
    shade("pz-han-body", [
      [0, "#1d2f7a"],
      [1, "#0a1440"],
    ]),
    "</defs>",
    rect(-w / 2, -h, w, h, `fill="url(#pz-han-body)"`, 3),
    burst(-18, -150, 30, ink.pink),
    burst(24, -112, 26, "#ffe14d"),
    burst(-14, -78, 22, "#7fe8ff"),
    rect(-w / 2, -40, w, 26, `fill="${ink.red}"`),
    path(
      `M${-w / 2 + 8} -27L${w / 2 - 8} -27`,
      `stroke="${ink.gold}" stroke-width="4" stroke-dasharray="10 8"`
    ),
    gloss(w, h),
    lid("hanabi"),
  ].join("");
};

const neko = () =>
  [
    "<defs>",
    radial(
      "pz-nek-fur",
      [-20, -120, 130],
      [
        [0, "#ffffff"],
        [0.7, "#f4ede2"],
        [1, "#c9bca8"],
      ]
    ),
    "</defs>",
    ellipse(0, -52, 64, 52, `fill="url(#pz-nek-fur)"`),
    path("M-46 -150L-40 -190L-14 -166Z", `fill="url(#pz-nek-fur)"`),
    path("M46 -150L40 -190L14 -166Z", `fill="url(#pz-nek-fur)"`),
    path("M-38 -160L-36 -180L-22 -166Z", `fill="${ink.pink}"`),
    ellipse(
      52,
      -150,
      18,
      30,
      `fill="url(#pz-nek-fur)" stroke="#c9bca8" stroke-width="2"`
    ),
    circle(0, -128, 50, `fill="url(#pz-nek-fur)"`),
    path(
      "M-28 -132Q-20 -124 -12 -132M12 -132Q20 -124 28 -132",
      `fill="none" stroke="${ink.black}" stroke-width="4" stroke-linecap="round"`
    ),
    path("M-5 -116L5 -116L0 -110Z", `fill="${ink.pink}"`),
    path(
      "M-14 -112L-44 -118M-14 -108L-44 -104M14 -112L44 -118M14 -108L44 -104",
      `stroke="${ink.black}" stroke-opacity="0.6" stroke-width="2"`
    ),
    circle(-30, -146, 7, `fill="${ink.red}" fill-opacity="0.55"`),
    rect(-40, -84, 80, 12, `fill="${ink.red}"`, 6),
    circle(0, -70, 10, `fill="${ink.gold}" stroke="#a8761c" stroke-width="2"`),
    ellipse(
      -14,
      -40,
      26,
      18,
      `fill="${ink.gold}" stroke="#a8761c" stroke-width="3"`
    ),
    ellipse(-36, -30, 14, 12, `fill="url(#pz-nek-fur)"`),
  ].join("");

const game = () => {
  const { w, h } = kinds.game;

  return [
    "<defs>",
    linear(
      "pz-gam-body",
      [0, -h, 0, 0],
      [
        [0, "#3d4fc4"],
        [0.55, "#202a7a"],
        [1, "#10163f"],
      ]
    ),
    linear(
      "pz-gam-screen",
      [0, -170, 0, -110],
      [
        [0, "#7fd8ff"],
        [1, "#2e8fa8"],
      ]
    ),
    "</defs>",
    rect(-w / 2, -h, w, h, `fill="url(#pz-gam-body)"`, 4),
    rect(
      -92,
      -196,
      184,
      150,
      `fill="#e8ecf2" stroke="#9aa4b4" stroke-width="3"`,
      22
    ),
    rect(
      -58,
      -180,
      116,
      76,
      `fill="url(#pz-gam-screen)" stroke="${ink.black}" stroke-width="4"`,
      6
    ),
    circle(-20, -150, 14, `fill="${ink.gold}"`),
    path(
      "M-58 -120L-20 -142L20 -122L58 -138L58 -104L-58 -104Z",
      `fill="#3fae5a"`
    ),
    rect(-74, -84, 36, 12, `fill="${ink.steel}"`, 3),
    rect(-62, -96, 12, 36, `fill="${ink.steel}"`, 3),
    circle(50, -86, 9, `fill="${ink.red}"`),
    circle(70, -72, 9, `fill="${ink.red}"`),
    path(
      `M${w / 2 - 70} ${-h + 4}L${w / 2 - 4} ${-h + 4}L${w / 2 - 4} ${-h + 70}Z`,
      `fill="${ink.gold}"`
    ),
    rect(-w / 2, -28, w, 14, `fill="${ink.red}"`),
    gloss(w, h),
    lid("game"),
  ].join("");
};

const bear = () =>
  [
    "<defs>",
    radial(
      "pz-bea-fur",
      [-30, -180, 200],
      [
        [0, "#d9a066"],
        [0.6, "#a8673a"],
        [1, "#5a321c"],
      ]
    ),
    "</defs>",
    ellipse(-62, -30, 48, 32, `fill="url(#pz-bea-fur)"`),
    ellipse(62, -30, 48, 32, `fill="url(#pz-bea-fur)"`),
    ellipse(-70, -30, 24, 20, `fill="#f0d0a8"`),
    ellipse(70, -30, 24, 20, `fill="#f0d0a8"`),
    ellipse(0, -96, 86, 80, `fill="url(#pz-bea-fur)"`),
    ellipse(0, -90, 50, 50, `fill="#d9a87a" fill-opacity="0.7"`),
    ellipse(-92, -110, 28, 46, `fill="url(#pz-bea-fur)"`),
    ellipse(92, -110, 28, 46, `fill="url(#pz-bea-fur)"`),
    circle(-56, -258, 26, `fill="url(#pz-bea-fur)"`),
    circle(56, -258, 26, `fill="url(#pz-bea-fur)"`),
    circle(-56, -258, 13, `fill="#f0d0a8"`),
    circle(56, -258, 13, `fill="#f0d0a8"`),
    circle(0, -204, 74, `fill="url(#pz-bea-fur)"`),
    ellipse(0, -180, 34, 26, `fill="#f0d0a8"`),
    ellipse(0, -192, 12, 9, `fill="${ink.black}"`),
    path(
      "M0 -184L0 -172M-12 -166Q0 -160 12 -166",
      `fill="none" stroke="${ink.black}" stroke-width="4" stroke-linecap="round"`
    ),
    circle(-28, -218, 9, `fill="${ink.black}"`),
    circle(28, -218, 9, `fill="${ink.black}"`),
    circle(-31, -221, 3, `fill="${ink.white}"`),
    circle(25, -221, 3, `fill="${ink.white}"`),
    path("M0 -138L-44 -158L-44 -118Z", `fill="${ink.red}"`),
    path("M0 -138L44 -158L44 -118Z", `fill="${ink.red}"`),
    circle(0, -138, 10, `fill="#a8101a"`),
  ].join("");

const bodies: Record<PrizeId, () => string> = {
  bear,
  caramel,
  choco,
  daruma,
  game,
  hanabi,
  kendama,
  neko,
  ramune,
};

const boxOf = (id: PrizeId) => {
  const { w, h, d } = kinds[id];
  const top = h + d * LID + 12;

  return { h: top + 8, w: w + 16, x: -w / 2 - 8, y: -top };
};

export const prizeBody = (id: PrizeId) => bodies[id]();

const spriteOf = (id: PrizeId): Sprite => ({
  body: prizeBody(id),
  box: boxOf(id),
});

export const prizeSprites: Record<PrizeId, Sprite> = {
  bear: spriteOf("bear"),
  caramel: spriteOf("caramel"),
  choco: spriteOf("choco"),
  daruma: spriteOf("daruma"),
  game: spriteOf("game"),
  hanabi: spriteOf("hanabi"),
  kendama: spriteOf("kendama"),
  neko: spriteOf("neko"),
  ramune: spriteOf("ramune"),
};

export const gun: Sprite = {
  body: [
    "<defs>",
    linear(
      "gn-wood",
      [-40, 0, 40, 0],
      [
        [0, ink.woodDark],
        [0.45, ink.woodLight],
        [1, ink.woodDark],
      ]
    ),
    linear(
      "gn-steel",
      [-12, 0, 12, 0],
      [
        [0, "#1c2026"],
        [0.5, "#8a96a4"],
        [1, "#1c2026"],
      ]
    ),
    "</defs>",
    path(
      "M-34 40L-30 -110Q-28 -130 -12 -136L12 -136Q28 -130 30 -110L34 40Z",
      `fill="url(#gn-wood)" stroke="${ink.black}" stroke-width="3"`
    ),
    rect(-12, -BARREL, 24, 180, `fill="url(#gn-steel)"`, 6),
    rect(-16, -BARREL - 4, 32, 18, `fill="${ink.steel}"`, 4),
    rect(-6, -BARREL + 30, 12, 140, `fill="#fff" fill-opacity="0.18"`, 4),
    path("M-30 -60L-46 -40L-46 -20L-30 -30Z", `fill="${ink.steel}"`),
  ].join(""),
  box: { h: BARREL + 50, w: 100, x: -50, y: -BARREL - 10 },
};

export const cork: Sprite = {
  body: [
    "<defs>",
    linear(
      "ck-skin",
      [-16, 0, 16, 0],
      [
        [0, ink.corkDark],
        [0.45, "#e8c08a"],
        [1, ink.corkDark],
      ]
    ),
    "</defs>",
    path("M-16 14L-12 -14L12 -14L16 14Z", `fill="url(#ck-skin)"`),
    ellipse(
      0,
      -14,
      12,
      4,
      `fill="#e8c08a" stroke="${ink.corkDark}" stroke-width="1.5"`
    ),
    circle(-4, 2, 1.8, `fill="${ink.corkDark}"`),
    circle(5, -5, 1.5, `fill="${ink.corkDark}"`),
    circle(3, 8, 1.6, `fill="${ink.corkDark}"`),
  ].join(""),
  box: { h: 36, w: 36, x: -18, y: -18 },
};

export const SPRITES: readonly Sprite[] = [
  ...prizeIds.map((id) => prizeSprites[id]),
  gun,
  cork,
];

const lantern = (x: number, y: number, r: number) =>
  [
    `<g transform="translate(${n(x)} ${n(y)})">`,
    path(
      `M0 ${n(-r * 1.6)}L0 ${n(-r)}`,
      `stroke="${ink.black}" stroke-width="3"`
    ),
    circle(0, 0, r * 2.4, `fill="url(#st-glow)"`),
    ellipse(0, 0, r, r * 1.15, `fill="url(#st-lantern)"`),
    ...[-0.6, -0.2, 0.2, 0.6].map((t) =>
      path(
        `M${n(-r * Math.cos(Math.asin(t)))} ${n(t * r * 1.15)}L${n(r * Math.cos(Math.asin(t)))} ${n(t * r * 1.15)}`,
        `stroke="#8a1a10" stroke-opacity="0.5" stroke-width="1.5"`
      )
    ),
    rect(-r * 0.45, -r * 1.25, r * 0.9, r * 0.2, `fill="${ink.black}"`, 2),
    rect(-r * 0.45, r * 1.05, r * 0.9, r * 0.2, `fill="${ink.black}"`, 2),
    "</g>",
  ].join("");

const awning = () => {
  const stripes = Array.from({ length: 13 }, (_, i) => {
    const x = STALL.left - 40 + i * 66;

    return path(
      `M${x} 0L${x + 66} 0L${x + 66} 110Q${x + 33} 128 ${x} 110Z`,
      `fill="${i % 2 === 0 ? ink.red : ink.paper}"`
    );
  }).join("");

  return `${stripes}${rect(STALL.left - 40, 0, STALL.right - STALL.left + 80, 14, `fill="#000" fill-opacity="0.25"`)}`;
};

const shelf = (y: number) =>
  [
    rect(
      STALL.left,
      y - 4,
      STALL.right - STALL.left,
      8,
      `fill="${ink.woodLight}"`
    ),
    rect(
      STALL.left,
      y + 4,
      STALL.right - STALL.left,
      SLAB,
      `fill="url(#st-wood)"`
    ),
    rect(
      STALL.left,
      y + 4,
      STALL.right - STALL.left,
      SLAB,
      `fill="#000" fill-opacity="0.2" filter="url(#st-grain)"`
    ),
    rect(
      STALL.left,
      y + 4 + SLAB,
      STALL.right - STALL.left,
      10,
      `fill="#000" fill-opacity="0.35"`
    ),
  ].join("");

const stall = () =>
  [
    rect(
      STALL.left,
      100,
      STALL.right - STALL.left,
      COUNTER - 100,
      `fill="url(#st-cloth)"`
    ),
    rect(
      STALL.left,
      100,
      STALL.right - STALL.left,
      COUNTER - 100,
      `fill="#000" fill-opacity="0.35" filter="url(#st-felt)"`
    ),
    rect(STALL.left - 34, 60, 34, COUNTER + 140, `fill="url(#st-post)"`),
    rect(STALL.right, 60, 34, COUNTER + 140, `fill="url(#st-post)"`),
    ...SHELVES.map(shelf),
    awning(),
    lantern(STALL.left - 17, 190, 30),
    lantern(STALL.right + 17, 190, 30),
    rect(
      STALL.left - 60,
      COUNTER,
      STALL.right - STALL.left + 120,
      260,
      `fill="url(#st-counter)"`
    ),
    rect(
      STALL.left - 60,
      COUNTER,
      STALL.right - STALL.left + 120,
      260,
      `fill="#000" fill-opacity="0.3" filter="url(#st-grain)"`
    ),
    rect(
      STALL.left - 60,
      COUNTER - 6,
      STALL.right - STALL.left + 120,
      14,
      `fill="${ink.woodLight}"`
    ),
    rect(
      STALL.left - 60,
      COUNTER + 8,
      STALL.right - STALL.left + 120,
      8,
      `fill="${ink.red}"`
    ),
  ].join("");

const stallDefs = () =>
  [
    shade("st-cloth", [
      [0, ink.clothDeep],
      [0.3, ink.cloth],
      [1, ink.clothDeep],
    ]),
    `<filter id="st-felt" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.4 1"/><feComposite in2="SourceGraphic" operator="in"/></filter>`,
    `<filter id="st-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.004 0.12" numOctaves="3" seed="11" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -1.6 1.1"/><feComposite in2="SourceGraphic" operator="in"/></filter>`,
    shade("st-wood", [
      [0, ink.wood],
      [1, ink.woodDark],
    ]),
    shade(
      "st-post",
      [
        [0, ink.woodDark],
        [0.5, ink.wood],
        [1, ink.woodDark],
      ],
      false
    ),
    shade("st-counter", [
      [0, "#c98a52"],
      [0.15, ink.wood],
      [1, "#3a1e10"],
    ]),
    radial(
      "st-lantern",
      [-8, -10, 40],
      [
        [0, "#fff2c8"],
        [0.45, "#ff9a5a"],
        [1, "#c8281a"],
      ]
    ),
    radial(
      "st-glow",
      [0, 0, 72],
      [
        [0, "#ffb35a", 0.55],
        [1, "#ffb35a", 0],
      ]
    ),
  ].join("");

const night = (width: number, height: number) => {
  const random = seeded(17);
  const side = Math.max(width, height);

  const bokeh = Array.from({ length: 18 }, () =>
    circle(
      random() * width,
      random() * height * 0.7,
      side * (0.01 + random() * 0.03),
      `fill="${random() > 0.5 ? ink.lantern : ink.gold}" fill-opacity="${n(0.12 + random() * 0.2)}"`
    )
  ).join("");

  return [
    linear(
      "bd-sky",
      [0, 0, 0, height],
      [
        [0, ink.night],
        [0.6, "#2a1240"],
        [1, "#3a1430"],
      ]
    ),
    blur("bd-soft", side * 0.008),
    radial(
      "bd-vignette",
      [width / 2, height * 0.45, side * 0.8],
      [
        [0, "#000", 0],
        [0.7, "#000", 0.1],
        [1, "#000", 0.45],
      ]
    ),
    `</defs><rect width="${n(width)}" height="${n(height)}" fill="url(#bd-sky)"/>`,
    `<g filter="url(#bd-soft)">${bokeh}</g>`,
  ].join("");
};

const placed = (frame: Frame, body: string) => {
  const k = frame.size / SCENE;

  return `<g transform="translate(${n(frame.x)} ${n(frame.y)}) scale(${n(k)})">${body}</g>`;
};

export const backdrop = (width: number, height: number, frame: Frame) =>
  [
    "<defs>",
    stallDefs(),
    night(width, height),
    placed(frame, stall()),
    `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-vignette)" pointer-events="none"/>`,
  ].join("");

const LINE = { y: 1085, scale: 0.5 } as const;

export const counterOf = (got: readonly PrizeId[]) => {
  const scale = Math.min(
    LINE.scale,
    (STALL.right - STALL.left - 40) /
      Math.max(
        1,
        got.reduce((sum, id) => sum + kinds[id].w + 24, 0)
      )
  );

  const width = got.reduce((sum, id) => sum + (kinds[id].w + 24) * scale, 0);
  let x = SCENE / 2 - width / 2;

  return got.map((id) => {
    const step = (kinds[id].w + 24) * scale;
    const spot = { id, scale, x: x + step / 2, y: LINE.y };
    x += step;

    return spot;
  });
};

const uses = (ids: readonly PrizeId[]) =>
  `<defs>${[...new Set(ids)].map((id) => `<g id="pz-${id}">${prizeBody(id)}</g>`).join("")}</defs>`;

const shadow = (x: number, y: number, w: number) =>
  ellipse(x, y + 2, w * 0.55, 8, `fill="#000" fill-opacity="0.35"`);

export interface Pose {
  standing: readonly PrizeId[];
  got: readonly PrizeId[];
  gun: boolean;
}

const poseBody = (pose: Pose) => {
  const shelves = [...pose.standing]
    .toSorted((a, b) => kinds[b].row - kinds[a].row)
    .map((id) => {
      const { x, row, w } = kinds[id];
      const y = SHELVES[row];

      return `${shadow(x, y, w)}<use href="#pz-${id}" transform="translate(${n(x)} ${n(y)})"/>`;
    })
    .join("");

  const line = counterOf(pose.got)
    .map(
      ({ id, x, y, scale }) =>
        `${shadow(x, y, kinds[id].w * scale)}<use href="#pz-${id}" transform="translate(${n(x)} ${n(y)}) scale(${n(scale)})"/>`
    )
    .join("");

  const rifle = pose.gun
    ? `<g transform="translate(${GUN.x + 140} ${GUN.y}) rotate(-12)">${gun.body}</g>`
    : "";

  return `${uses([...pose.standing, ...pose.got])}${shelves}${line}${rifle}`;
};

export const sceneDoc = (
  width: number,
  height: number,
  frame: Frame,
  pose: Pose
) =>
  docOf(
    { h: height, w: width, x: 0, y: 0 },
    width,
    height,
    `${backdrop(width, height, frame)}${placed(frame, poseBody(pose))}`
  );

export const frameFor = (width: number, height: number) => {
  const k = Math.min(width / VIEW.w, height / VIEW.h);

  return {
    size: SCENE * k,
    x: width / 2 - (VIEW.x + VIEW.w / 2) * k,
    y: height / 2 - (VIEW.y + VIEW.h / 2) * k,
  };
};

export const prizeUri = (id: PrizeId) =>
  dataUri(spriteDoc(prizeSprites[id], 1));
