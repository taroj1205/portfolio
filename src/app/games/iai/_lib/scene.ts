import type { Side } from "./duel";

export type Pose = "stance" | "strike" | "fallen";

export const INK = "#06060b";
export const RIM = "#f6d48a";
export const VERMILION = "#d8402c";

export const tints: Record<"duel" | "versus", Record<Side, string>> = {
  duel: { left: "#ff5a3c", right: "#e8e1d0" },
  versus: { left: "#6f8bff", right: "#ff5a3c" },
};

export const paint = {
  blade: "#f6f2e8",
  eye: "#ffe27a",
  far: "#343868",
  field: "#0d0d1c",
  fieldLow: "#030305",
  grass: "#020203",
  halo: "#ffe2a0",
  haze: "#7868c8",
  leaf: "#ff8a3a",
  moon: "#fffaf0",
  moonEdge: "#e9c987",
  moonMid: "#fbe9c0",
  near: "#0e0f20",
  skyLow: "#1d1a3a",
  skyMid: "#0b1030",
  skyTop: "#03040b",
  slash: "#fffdf6",
  stem: "#5a140a",
  wind: "#e9ecff",
};

export const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const round = (value: number) => Math.round(value * 1000) / 1000;

const jag = seeded(31);

export const splash = Array.from({ length: 26 }, (_, i) => {
  const a = (i / 26) * Math.PI * 2;
  const r = 1 + (jag() - 0.5) * (i % 3 === 0 ? 0.5 : 0.18);
  return { x: round(Math.cos(a) * r), y: round(Math.sin(a) * r) };
});

export const LIFT = 1.15;
export const CAT_SIZE = 1.9;
export const EARLY_REACH = 0.5;
export const BLADE_Y = 92;
export const SIGNAL_Y = 150;

interface Line {
  d: string;
  width: number;
}

interface Figure {
  body: string[];
  lines: Line[];
  blade: string | null;
  knot: readonly [number, number];
}

const disc = (x: number, y: number, r: number) =>
  `M${x - r} ${y}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

export const figures: Record<Pose, Figure> = {
  fallen: {
    blade: null,
    body: [
      disc(25, -56, 8.5),
      "M20-62C14-69 0-71-10-64C-18-57-21-46-19-36L13-34C19-41 23-50 24-57Z",
      "M17-58C25-48 30-30 31-8L35 0H25L23-8C20-25 15-38 9-46Z",
      "M-20-37L13-35C18-27 21-14 23 0H6C3-6-4-6-8 0H-52C-45-4-31-10-25-17C-23-24-21-31-20-37Z",
      "M21-62C19-67 13-68 8-66C12-64 17-62 21-60Z",
    ],
    knot: [18, -62],
    lines: [{ d: "M10-37L-48-23", width: 4.5 }],
  },
  stance: {
    blade: null,
    body: [
      disc(10, -104, 9),
      "M6-111C2-118-6-119-11-114C-6-112 0-110 6-108Z",
      "M2-97C-8-96-14-90-16-80C-19-70-19-64-18-58H14C18-66 20-76 18-86C16-92 10-97 2-97Z",
      "M8-92C18-92 26-84 31-73L35-67C33-63 29-63 27-65L22-61C16-54 8-56 3-62Z",
      "M-19-60H15C22-50 30-38 36-22C40-12 44-4 46 0H26C22-10 14-24 6-30C-4-24-16-10-24 0H-46C-40-14-30-36-19-60Z",
    ],
    knot: [1, -108],
    lines: [
      { d: "M14-63L-52-45", width: 4.5 },
      { d: "M15-63L37-72", width: 5 },
    ],
  },
  strike: {
    blade: "M47-87Q86-97 126-100Q86-91 47-82Z",
    body: [
      disc(12, -98, 9),
      "M8-105C4-112-4-113-9-108C-4-106 2-104 8-102Z",
      "M4-91C-6-90-12-83-14-73C-16-65-16-59-15-53H15C19-61 20-72 18-80C16-86 12-91 4-91Z",
      "M9-87C21-91 34-91 46-89L49-82C39-80 31-76 25-70C19-64 12-66 7-72Z",
      "M-16-55H16C26-45 36-31 44-17C48-9 52-4 54 0H32C28-10 18-20 6-24C-6-18-20-8-30 0H-54C-46-14-32-34-16-55Z",
    ],
    knot: [3, -102],
    lines: [{ d: "M12-57L-52-41", width: 4.5 }],
  },
};

export const cat = {
  body: [
    "M-13-11.5C-13-15.5-9.5-17-4-17H6C9.5-17 12-15.5 12-12C12-9 9.5-8 7-8H-10C-12-8-13-9.5-13-11.5Z",
    disc(13.5, -19.5, 5),
    "M9.6-22.4L10.6-28.2L14-23.6Z",
    "M14.2-24.2L17.6-28L18.2-21.8Z",
  ],
  eyes: [
    [11.6, -20],
    [15.6, -20],
  ] as const,
  legs: [
    [-10, -9],
    [-6.5, -9],
    [5, -9],
    [8.5, -9],
  ] as const,
  tail: "M-12.5-13C-18-13.5-20.5-18-18.5-24C-17.5-27-15-27.5-14-25.5",
};

export const crow = {
  body: "M-10 0C-4-5 8-5 12-2H18L13 1C6 4-4 4-10 0ZM-10 0L-19-3L-18 3Z",
  down: "M-2 0C-6 10-14 16-22 16C-14 10-8 4 4 0Z",
  up: "M-2-2C-6-14-14-22-22-24C-14-16-8-8 4-2Z",
};

export const leaf =
  "M0 10L1 4L8 7L6 2L12-2L6-3L8-9L3-6L0-12L-3-6L-8-9L-6-3L-12-2L-6 2L-8 7L-1 4Z";

export const mark = {
  dot: disc(0, 21, 5.5),
  stem: "M-6-42C-2-44 4-44 7-41C5-20 3-6 1.5 8H-1.5C-3-8-5-24-6-42Z",
};

export const layoutOf = (w: number, h: number) => {
  const tall = h > w;
  const ground = h * (tall ? 0.63 : 0.73);
  const scale = Math.min(w * 0.0028, h * 0.0024);
  const gap = Math.min(w * 0.24, 150 * scale);
  const r = Math.min(w, h) * (tall ? 0.25 : 0.24);
  return {
    gap,
    ground,
    h,
    mid: w / 2,
    moon: { r, x: w / 2, y: ground - r * 1.1 },
    scale,
    w,
  };
};

export type Layout = ReturnType<typeof layoutOf>;

export const homeOf = (at: Layout, side: Side) =>
  at.mid + (side === "left" ? -at.gap : at.gap);

export const lungeOf = (at: Layout, side: Side) =>
  at.mid + (side === "left" ? -at.gap * 0.08 : at.gap * 0.08);
