import {
  blur,
  docOf,
  ellipse,
  linear,
  n,
  path,
  radial,
  seeded,
} from "../../_lib/svg";
import type { Frame, Sprite } from "../../_lib/svg";
import { kindIds, kinds, pickKind } from "./fish";
import type { KindId } from "./fish";
import { POI } from "./tank";

export const SCENE = 1000;

export const TILT = -0.49;

export const BOWL = { r: 96, x: 872, y: 872 } as const;

const TUB = { inner: 52, r: 84, rim: 16 } as const;

interface Spot {
  x: number;
  y: number;
  rx: number;
  ry: number;
  turn: number;
  color: string;
}

interface Look {
  width: number;
  edge: string;
  spine: string;
  shine: number;
  spots: readonly Spot[];
  scales: boolean;
  bulge: boolean;
  tail: {
    length: number;
    spread: number;
    double: boolean;
    root: string;
    tip: string;
  };
}

const patch = (
  x: number,
  y: number,
  rx: number,
  ry: number,
  color: string,
  turn = 0
): Spot => ({ color, rx, ry, turn, x, y });

const RED = "#e0321c";

const looks: Record<KindId, Look> = {
  demekin: {
    bulge: true,
    edge: "#060407",
    scales: true,
    shine: 0.22,
    spine: "#3b3142",
    spots: [],
    tail: {
      double: true,
      length: 0.5,
      root: "#16111a",
      spread: 0.72,
      tip: "#3a2f44",
    },
    width: 0.42,
  },
  nushi: {
    bulge: false,
    edge: "#e6dcd2",
    scales: true,
    shine: 0.4,
    spine: "#fffaf3",
    spots: [
      patch(0.3, -0.05, 0.17, 0.75, RED, 0.2),
      patch(-0.02, 0.35, 0.16, 0.6, RED, -0.3),
      patch(-0.26, -0.4, 0.12, 0.5, RED, 0.4),
    ],
    tail: {
      double: false,
      length: 0.36,
      root: "#fff7ef",
      spread: 0.55,
      tip: "#ff6a46",
    },
    width: 0.4,
  },
  ogon: {
    bulge: false,
    edge: "#c27a06",
    scales: true,
    shine: 0.8,
    spine: "#ffd94a",
    spots: [],
    tail: {
      double: false,
      length: 0.42,
      root: "#ffc93a",
      spread: 0.5,
      tip: "#fff0a0",
    },
    width: 0.36,
  },
  ryukin: {
    bulge: false,
    edge: "#c4220f",
    scales: false,
    shine: 0.36,
    spine: "#ff8c4c",
    spots: [
      patch(-0.04, 0.2, 0.18, 0.62, "#fff4ea", 0.2),
      patch(0.33, -0.25, 0.08, 0.38, "#fff4ea"),
    ],
    tail: {
      double: true,
      length: 0.62,
      root: "#f2401e",
      spread: 0.8,
      tip: "#ffd2b8",
    },
    width: 0.52,
  },
  sarasa: {
    bulge: false,
    edge: "#e2d6cc",
    scales: false,
    shine: 0.3,
    spine: "#fffaf4",
    spots: [
      patch(0.28, 0, 0.2, 0.75, RED),
      patch(-0.14, -0.32, 0.16, 0.5, RED, 0.3),
      patch(-0.32, 0.36, 0.1, 0.42, RED),
    ],
    tail: {
      double: false,
      length: 0.4,
      root: "#fff6ee",
      spread: 0.5,
      tip: "#ff7a5c",
    },
    width: 0.34,
  },
  shubunkin: {
    bulge: false,
    edge: "#5f7a98",
    scales: false,
    shine: 0.3,
    spine: "#cfdbe6",
    spots: [
      patch(0.3, 0.2, 0.08, 0.4, "#e2482a"),
      patch(0.1, -0.45, 0.07, 0.3, "#141016"),
      patch(-0.05, 0.3, 0.1, 0.36, "#f19a38", 0.4),
      patch(-0.2, -0.2, 0.06, 0.3, "#e2482a"),
      patch(-0.3, 0.3, 0.05, 0.28, "#141016"),
      patch(0.18, -0.1, 0.05, 0.22, "#141016"),
    ],
    tail: {
      double: false,
      length: 0.55,
      root: "#b9c9d8",
      spread: 0.55,
      tip: "#ee6a3c",
    },
    width: 0.32,
  },
  wakin: {
    bulge: false,
    edge: "#b81f12",
    scales: false,
    shine: 0.32,
    spine: "#ff7c38",
    spots: [],
    tail: {
      double: false,
      length: 0.4,
      root: "#f2441f",
      spread: 0.5,
      tip: "#ffb08a",
    },
    width: 0.34,
  },
};

const outlineOf = (length: number, half: number) => {
  const L = length;
  const h = half;

  return [
    `M${n(0.5 * L)} 0`,
    `C${n(0.5 * L)} ${n(-0.55 * h)} ${n(0.36 * L)} ${n(-h)} ${n(0.14 * L)} ${n(-h)}`,
    `C${n(-0.1 * L)} ${n(-h)} ${n(-0.3 * L)} ${n(-0.6 * h)} ${n(-0.44 * L)} ${n(-0.18 * h)}`,
    `L${n(-0.44 * L)} ${n(0.18 * h)}`,
    `C${n(-0.3 * L)} ${n(0.6 * h)} ${n(-0.1 * L)} ${n(h)} ${n(0.14 * L)} ${n(h)}`,
    `C${n(0.36 * L)} ${n(h)} ${n(0.5 * L)} ${n(0.55 * h)} ${n(0.5 * L)} 0Z`,
  ].join("");
};

export const tailJoint = (kind: KindId) => -0.42 * kinds[kind].length;

const eyesOf = (kind: KindId, half: number) => {
  const L = kinds[kind].length;
  const look = looks[kind];

  if (look.bulge) {
    return [-1, 1]
      .map((side) => {
        const y = side * (half + 0.03 * L);

        return [
          ellipse(0.32 * L, y, 0.1 * L, 0.085 * L, `fill="#120c14"`),
          ellipse(0.34 * L, y, 0.055 * L, 0.05 * L, `fill="#000"`),
          ellipse(
            0.3 * L,
            y - side * 0.02 * L,
            0.022 * L,
            0.018 * L,
            `fill="#fff" fill-opacity="0.75"`
          ),
        ].join("");
      })
      .join("");
  }

  return [-1, 1]
    .map((side) => {
      const y = side * 0.62 * half;

      return [
        ellipse(
          0.38 * L,
          y,
          0.042 * L,
          0.036 * L,
          `fill="#f4eee6" fill-opacity="0.8"`
        ),
        ellipse(0.385 * L, y, 0.028 * L, 0.026 * L, `fill="#0c0808"`),
        ellipse(
          0.375 * L,
          y - side * 0.008 * L,
          0.009 * L,
          0.008 * L,
          `fill="#fff"`
        ),
      ].join("");
    })
    .join("");
};

const finsOf = (kind: KindId, half: number) => {
  const L = kinds[kind].length;
  const { tail } = looks[kind];

  return [-1, 1]
    .map((side) =>
      ellipse(
        0,
        0,
        0.11 * L,
        0.04 * L,
        `fill="${tail.root}" fill-opacity="0.55" transform="translate(${n(0.18 * L)} ${n(side * half * 0.95)}) rotate(${side * 32})"`
      )
    )
    .join("");
};

const fishBody = (kind: KindId): Sprite => {
  const L = kinds[kind].length;
  const look = looks[kind];
  const half = (look.width * L) / 2;
  const outline = outlineOf(L, half);
  const id = `k-${kind}`;
  const reach = half + (look.bulge ? 0.16 * L : 0.1 * L);
  const box = { h: reach * 2, w: L + 0.16 * L, x: -0.58 * L, y: -reach };

  const spots = look.spots
    .map((each) =>
      ellipse(
        0,
        0,
        each.rx * L,
        each.ry * half,
        `fill="${each.color}" transform="translate(${n(each.x * L)} ${n(each.y * half)}) rotate(${n((each.turn * 180) / Math.PI)})"`
      )
    )
    .join("");

  const scales = look.scales
    ? `<rect x="${n(-0.5 * L)}" y="${n(-half)}" width="${n(L)}" height="${n(half * 2)}" fill="url(#${id}-scales)"/>`
    : "";

  return {
    body: [
      "<defs>",
      linear(
        `${id}-skin`,
        [0, -half, 0, half],
        [
          [0, look.edge],
          [0.5, look.spine],
          [1, look.edge],
        ]
      ),
      radial(
        `${id}-shine`,
        [0.06 * L, -0.12 * half, 0.32 * L],
        [
          [0, "#fff", look.shine],
          [1, "#fff", 0],
        ]
      ),
      linear(
        `${id}-shade`,
        [0, -half, 0, half],
        [
          [0, "#000", 0.3],
          [0.35, "#000", 0],
          [0.65, "#000", 0],
          [1, "#000", 0.3],
        ]
      ),
      `<clipPath id="${id}-clip"><path d="${outline}"/></clipPath>`,
      `<pattern id="${id}-scales" patternUnits="userSpaceOnUse" width="${n(0.07 * L)}" height="${n(0.06 * L)}"><path d="M0 ${n(0.06 * L)}Q${n(0.035 * L)} 0 ${n(0.07 * L)} ${n(0.06 * L)}" fill="none" stroke="#000" stroke-opacity="0.14" stroke-width="${n(0.008 * L)}"/></pattern>`,
      "</defs>",
      finsOf(kind, half),
      path(outline, `fill="url(#${id}-skin)"`),
      `<g clip-path="url(#${id}-clip)">${spots}${scales}<path d="${outline}" fill="url(#${id}-shade)"/><path d="${outline}" fill="url(#${id}-shine)"/></g>`,
      path(
        `M${n(0.16 * L)} 0L${n(-0.3 * L)} 0`,
        `stroke="${look.tail.tip}" stroke-opacity="0.45" stroke-width="${n(0.035 * L)}" stroke-linecap="round"`
      ),
      eyesOf(kind, half),
    ].join(""),
    box,
  };
};

const lobe = (length: number, spread: number, root: number, side: number) => {
  const s = side * spread;
  const r = side * root;

  return `M0 ${n(r * 0.4)}C${n(-0.35 * length)} ${n(r)} ${n(-0.7 * length)} ${n(s)} ${n(-length)} ${n(s * 1.05)}C${n(-0.86 * length)} ${n(s * 0.45)} ${n(-0.74 * length)} ${n(s * 0.12)} ${n(-0.58 * length)} 0L0 0Z`;
};

const fishTail = (kind: KindId): Sprite => {
  const L = kinds[kind].length;
  const look = looks[kind];
  const length = look.tail.length * L;
  const spread = look.tail.spread * length;
  const root = ((look.width * L) / 2) * 0.2;
  const id = `t-${kind}`;

  const lobes = look.tail.double
    ? [
        lobe(length, spread, root, -1),
        lobe(length, spread, root, 1),
        lobe(length * 0.86, spread * 0.45, root, -1),
        lobe(length * 0.86, spread * 0.45, root, 1),
      ]
    : [lobe(length, spread, root, -1), lobe(length, spread, root, 1)];

  const rays = Array.from({ length: 9 }, (_, i) => {
    const t = (i / 8) * 2 - 1;

    return path(
      `M0 0L${n(-length * (0.9 - Math.abs(t) * 0.05))} ${n(t * spread)}`,
      `stroke="${look.tail.root}" stroke-opacity="0.35" stroke-width="${n(0.008 * L)}"`
    );
  }).join("");

  return {
    body: [
      "<defs>",
      linear(
        `${id}-fin`,
        [0, 0, -length, 0],
        [
          [0, look.tail.root, 0.92],
          [0.7, look.tail.tip, 0.6],
          [1, look.tail.tip, 0.3],
        ]
      ),
      `<clipPath id="${id}-clip">${lobes.map((d) => `<path d="${d}"/>`).join("")}</clipPath>`,
      "</defs>",
      ...lobes.map((d) => path(d, `fill="url(#${id}-fin)"`)),
      `<g clip-path="url(#${id}-clip)">${rays}</g>`,
    ].join(""),
    box: {
      h: spread * 2.2 + 8,
      w: length + 8,
      x: -length - 4,
      y: -spread * 1.1 - 4,
    },
  };
};

const perKind = (make: (kind: KindId) => Sprite): Record<KindId, Sprite> => ({
  demekin: make("demekin"),
  nushi: make("nushi"),
  ogon: make("ogon"),
  ryukin: make("ryukin"),
  sarasa: make("sarasa"),
  shubunkin: make("shubunkin"),
  wakin: make("wakin"),
});

export const bodies = perKind(fishBody);

export const tails = perKind(fishTail);

export const shadow: Sprite = {
  body: `<defs>${blur("fish-shadow-blur", 6)}</defs>${ellipse(0, 0, 46, 15, `fill="#04202e" fill-opacity="0.42" filter="url(#fish-shadow-blur)"`)}`,
  box: { h: 60, w: 130, x: -65, y: -30 },
};

const HANDLE = 180;
const HOLD = POI.ring + HANDLE * 0.35;

export const GRIP = { x: -Math.sin(TILT) * HOLD, y: Math.cos(TILT) * HOLD };

export const poiFrame: Sprite = {
  body: [
    "<defs>",
    linear(
      "poi-plastic",
      [-POI.ring, -POI.ring, POI.ring, POI.ring],
      [
        [0, "#ffb3cf"],
        [0.45, "#f0558f"],
        [1, "#a8205a"],
      ]
    ),
    linear(
      "poi-handle",
      [-14, 0, 14, 0],
      [
        [0, "#a8205a"],
        [0.4, "#ff8ab6"],
        [1, "#b42865"],
      ]
    ),
    "</defs>",
    path(
      `M-13 ${POI.ring - 4}L-10 ${POI.ring + HANDLE}Q0 ${POI.ring + HANDLE + 14} 10 ${POI.ring + HANDLE}L13 ${POI.ring - 4}Z`,
      `fill="url(#poi-handle)"`
    ),
    path(
      `M-3 ${POI.ring + 20}L-2 ${POI.ring + HANDLE - 12}`,
      `stroke="#fff" stroke-opacity="0.45" stroke-width="3" stroke-linecap="round"`
    ),
    `<circle r="${(POI.ring + POI.r) / 2}" fill="none" stroke="url(#poi-plastic)" stroke-width="${POI.ring - POI.r}"/>`,
    `<circle r="${POI.ring - 3}" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="30 220" transform="rotate(200)"/>`,
  ].join(""),
  box: {
    h: POI.ring * 2 + HANDLE + 20,
    w: POI.ring * 2 + 8,
    x: -POI.ring - 4,
    y: -POI.ring - 4,
  },
};

const fibres = (id: string, seed: number) =>
  `<filter id="${id}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.09 0.04" numOctaves="3" seed="${seed}" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 0.86 0 0 0 0 0.84 0 0 0 0 0.8 0 0 0 1.4 -0.55" result="fibre"/><feComposite in="fibre" in2="SourceAlpha" operator="in" result="fibreIn"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="fibreIn"/></feMerge></filter>`;

const HOLE = Array.from({ length: 15 }, (_, i) => {
  const angle = (i / 15) * Math.PI * 2;
  const r = 30 + (i % 2 === 0 ? 14 : 0) + Math.sin(i * 2.3) * 6;

  return { x: 8 + Math.cos(angle) * r, y: -4 + Math.sin(angle) * r * 0.8 };
});

const paperBody = (id: string, torn: boolean) => {
  const circle = `M${-POI.r} 0A${POI.r} ${POI.r} 0 1 0 ${POI.r} 0A${POI.r} ${POI.r} 0 1 0 ${-POI.r} 0Z`;

  const hole = torn
    ? `M${HOLE.map(({ x, y }) => `${n(x)} ${n(y)}`).join("L")}Z`
    : "";

  const flaps = torn
    ? HOLE.filter((_, i) => i % 4 === 0)
        .map(({ x, y }) =>
          path(
            `M${n(x)} ${n(y)}L${n(x * 0.7 + 2)} ${n(y * 0.7 + 3)}L${n(x * 0.82)} ${n(y * 0.82 - 4)}Z`,
            `fill="#ece6da" fill-opacity="0.85"`
          )
        )
        .join("")
    : "";

  return [
    `<defs>${fibres(`${id}-fibre`, torn ? 9 : 4)}${radial(
      `${id}-light`,
      [-20, -30, POI.r * 1.3],
      [
        [0, "#fffdf8", 0.95],
        [1, "#e4ddd0", 0.85],
      ]
    )}</defs>`,
    path(
      `${circle}${hole}`,
      `fill="url(#${id}-light)" fill-rule="evenodd" filter="url(#${id}-fibre)"`
    ),
    flaps,
  ].join("");
};

export const paper: Sprite = {
  body: paperBody("paper", false),
  box: { h: POI.r * 2 + 4, w: POI.r * 2 + 4, x: -POI.r - 2, y: -POI.r - 2 },
};

export const torn: Sprite = {
  body: paperBody("torn", true),
  box: paper.box,
};

export const bowlBase: Sprite = {
  body: [
    "<defs>",
    blur("bowl-drop", 8),
    radial(
      "bowl-water",
      [-20, -24, BOWL.r],
      [
        [0, "#e6f6fb"],
        [0.7, "#a9dcec"],
        [1, "#6fb3cc"],
      ]
    ),
    "</defs>",
    ellipse(
      8,
      12,
      BOWL.r + 4,
      BOWL.r + 4,
      `fill="#03202c" fill-opacity="0.45" filter="url(#bowl-drop)"`
    ),
    ellipse(0, 0, BOWL.r - 10, BOWL.r - 10, `fill="url(#bowl-water)"`),
  ].join(""),
  box: {
    h: BOWL.r * 2 + 50,
    w: BOWL.r * 2 + 50,
    x: -BOWL.r - 25,
    y: -BOWL.r - 25,
  },
};

export const bowlRim: Sprite = {
  body: [
    "<defs>",
    linear(
      "bowl-rim",
      [-BOWL.r, -BOWL.r, BOWL.r, BOWL.r],
      [
        [0, "#ffffff"],
        [0.6, "#eae4dc"],
        [1, "#b9b0a6"],
      ]
    ),
    radial(
      "bowl-glint",
      [-30, -38, 50],
      [
        [0, "#fff", 0.5],
        [1, "#fff", 0],
      ]
    ),
    "</defs>",
    `<circle r="${BOWL.r - 5}" fill="none" stroke="url(#bowl-rim)" stroke-width="12"/>`,
    `<circle r="${BOWL.r - 11}" fill="none" stroke="#d6302a" stroke-width="3"/>`,
    `<circle r="${BOWL.r - 11}" fill="url(#bowl-glint)"/>`,
  ].join(""),
  box: { h: BOWL.r * 2 + 4, w: BOWL.r * 2 + 4, x: -BOWL.r - 2, y: -BOWL.r - 2 },
};

export const caustics: Sprite = {
  body: `<defs><filter id="caustic-net" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.018" numOctaves="2" seed="7" stitchTiles="stitch" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 0.96 -2.4 0 0 0 1.1"/></filter></defs><rect width="400" height="400" filter="url(#caustic-net)"/>`,
  box: { h: 400, w: 400, x: 0, y: 0 },
};

export const SPRITES: readonly Sprite[] = [
  ...kindIds.map((id) => bodies[id]),
  ...kindIds.map((id) => tails[id]),
  shadow,
  poiFrame,
  paper,
  torn,
  bowlBase,
  bowlRim,
  caustics,
];

const LANTERNS = [
  { color: "#ff6a3a", x: 0.08, y: 0.08 },
  { color: "#ffb04a", x: 0.32, y: 0.03 },
  { color: "#ff4a4a", x: 0.6, y: 0.06 },
  { color: "#ffc35a", x: 0.86, y: 0.04 },
] as const;

const tubPath = (inset: number, r: number) => {
  const a = inset;
  const b = SCENE - inset;

  return `M${a + r} ${a}L${b - r} ${a}Q${b} ${a} ${b} ${a + r}L${b} ${b - r}Q${b} ${b} ${b - r} ${b}L${a + r} ${b}Q${a} ${b} ${a} ${b - r}L${a} ${a + r}Q${a} ${a} ${a + r} ${a}Z`;
};

export const backdrop = (width: number, height: number, frame: Frame) => {
  const k = frame.size / SCENE;
  const glow = seeded(17);
  const water = tubPath(TUB.inner, TUB.r - 30);

  return [
    "<defs>",
    linear(
      "bd-night",
      [0, 0, 0, height],
      [
        [0, "#0b0a1c"],
        [0.6, "#140d1c"],
        [1, "#1b0f12"],
      ]
    ),
    ...LANTERNS.map((lantern, i) =>
      radial(
        `bd-lantern-${i}`,
        [lantern.x * width, lantern.y * height, Math.max(width, height) * 0.28],
        [
          [0, lantern.color, 0.36],
          [1, lantern.color, 0],
        ]
      )
    ),
    linear(
      "bd-rim",
      [0, 0, SCENE, SCENE],
      [
        [0, "#a9dcff"],
        [0.5, "#4f9fe0"],
        [1, "#2a6eb4"],
      ]
    ),
    radial(
      "bd-floor",
      [500, 470, 640],
      [
        [0, "#8fd2e8"],
        [0.55, "#55a8cc"],
        [1, "#1f6e9a"],
      ]
    ),
    radial(
      "bd-warm",
      [300, 160, 420],
      [
        [0, "#ffb070", 0.35],
        [1, "#ffb070", 0],
      ]
    ),
    radial(
      "bd-warm-2",
      [760, 260, 300],
      [
        [0, "#ff7a5a", 0.22],
        [1, "#ff7a5a", 0],
      ]
    ),
    `<filter id="bd-caustic" x="0" y="0" width="100%" height="100%"><feTurbulence type="turbulence" baseFrequency="0.014" numOctaves="2" seed="3" result="noise"/><feColorMatrix in="noise" type="matrix" values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 0.96 -2.6 0 0 0 1.05"/></filter>`,
    `<filter id="bd-wall" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="22"/></filter>`,
    blur("bd-bokeh", 18),
    `<clipPath id="bd-water"><path d="${water}"/></clipPath>`,
    radial(
      "bd-vignette",
      [width / 2, height / 2, Math.max(width, height) * 0.75],
      [
        [0, "#000", 0],
        [0.7, "#000", 0.12],
        [1, "#000", 0.6],
      ]
    ),
    "</defs>",
    `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-night)"/>`,
    ...LANTERNS.map(
      (_, i) =>
        `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-lantern-${i})"/>`
    ),
    `<g transform="translate(${n(frame.x)} ${n(frame.y)}) scale(${n(k)})">`,
    path(
      tubPath(TUB.rim - 4, TUB.r + 4),
      `fill="#02101a" fill-opacity="0.6" transform="translate(10 18)" filter="url(#bd-bokeh)"`
    ),
    path(tubPath(TUB.rim, TUB.r), `fill="url(#bd-rim)"`),
    path(
      tubPath(TUB.rim + 6, TUB.r - 6),
      `fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="3"`
    ),
    path(water, `fill="url(#bd-floor)"`),
    `<g clip-path="url(#bd-water)">`,
    `<rect width="${SCENE}" height="${SCENE}" filter="url(#bd-caustic)" opacity="0.2"/>`,
    path(
      water,
      `fill="none" stroke="#0a3f5e" stroke-opacity="0.55" stroke-width="60" filter="url(#bd-wall)"`
    ),
    `<rect width="${SCENE}" height="${SCENE}" fill="url(#bd-warm)"/>`,
    `<rect width="${SCENE}" height="${SCENE}" fill="url(#bd-warm-2)"/>`,
    Array.from({ length: 7 }, () =>
      ellipse(
        120 + glow() * 760,
        100 + glow() * 760,
        8 + glow() * 18,
        3 + glow() * 5,
        `fill="#fff1d6" fill-opacity="${n(0.12 + glow() * 0.18)}"`
      )
    ).join(""),
    "</g>",
    path(
      water,
      `fill="none" stroke="#e8f6ff" stroke-opacity="0.5" stroke-width="3"`
    ),
    "</g>",
    `<rect width="${n(width)}" height="${n(height)}" fill="url(#bd-vignette)"/>`,
  ].join("");
};

export interface Swimmer {
  kind: KindId;
  x: number;
  y: number;
  heading: number;
  sway: number;
}

export interface Pose {
  swimmers: readonly Swimmer[];
  bowl: readonly KindId[] | null;
  poi: { x: number; y: number; torn: boolean } | null;
}

const deg = (radians: number) => n((radians * 180) / Math.PI);

export const bowlSpots = (count: number) =>
  Array.from({ length: count }, (_, i) => {
    const angle = i * 2.4 + 0.6;
    const r = (BOWL.r - 34) * Math.sqrt((i + 0.5) / Math.max(count, 1));

    return {
      heading: angle + Math.PI / 2,
      x: BOWL.x + Math.cos(angle) * r,
      y: BOWL.y + Math.sin(angle) * r,
    };
  });

const fishOf = (swimmer: Swimmer, scale: number, withShadow: boolean) => {
  const L = kinds[swimmer.kind].length;
  const turn = deg(swimmer.heading);

  const shade = withShadow
    ? `<use href="#use-shadow" transform="translate(${n(swimmer.x + 10)} ${n(swimmer.y + 16)}) rotate(${turn}) scale(${n((L / 100) * scale)})"/>`
    : "";

  return `${shade}<g transform="translate(${n(swimmer.x)} ${n(swimmer.y)}) rotate(${turn}) scale(${n(scale)})"><use href="#use-tail-${swimmer.kind}" transform="translate(${n(tailJoint(swimmer.kind))} 0) rotate(${deg(swimmer.sway)})"/><use href="#use-body-${swimmer.kind}"/></g>`;
};

const defsOf = (pose: Pose, inBowl: readonly KindId[]) => {
  const used = kindIds.filter(
    (id) =>
      inBowl.includes(id) || pose.swimmers.some((each) => each.kind === id)
  );

  return `<defs><g id="use-shadow">${shadow.body}</g>${used
    .map(
      (id) =>
        `<g id="use-tail-${id}">${tails[id].body}</g><g id="use-body-${id}">${bodies[id].body}</g>`
    )
    .join("")}</defs>`;
};

const bowlBody = (inBowl: readonly KindId[]) =>
  [
    `<g transform="translate(${BOWL.x} ${BOWL.y})">${bowlBase.body}</g>`,
    ...bowlSpots(inBowl.length).map((spot, i) =>
      fishOf({ ...spot, kind: inBowl[i], sway: 0.3 }, 0.5, false)
    ),
    `<g transform="translate(${BOWL.x} ${BOWL.y})">${bowlRim.body}</g>`,
  ].join("");

const poseBody = (pose: Pose) => {
  const inBowl = pose.bowl?.slice(0, 8) ?? [];

  const poi =
    pose.poi === null
      ? ""
      : `<g transform="translate(${n(pose.poi.x)} ${n(pose.poi.y)}) rotate(${deg(TILT)})">${(pose.poi.torn ? torn : paper).body}${poiFrame.body}</g>`;

  return [
    defsOf(pose, inBowl),
    ...pose.swimmers.map((swimmer) => fishOf(swimmer, 1, true)),
    pose.bowl === null ? "" : bowlBody(inBowl),
    poi,
  ].join("");
};

export const RESTING = { x: 330, y: 610 } as const;

const CLEAR = [
  { r: 230, x: BOWL.x, y: BOWL.y },
  { r: 150, ...RESTING },
];

export const posed = (seed: number, count: number) => {
  const random = seeded(seed);
  const placed: Swimmer[] = [];

  for (let tries = 0; placed.length < count && tries < 400; tries += 1) {
    const x = 150 + random() * 700;
    const y = 140 + random() * 700;

    const crowded =
      placed.some((other) => Math.hypot(other.x - x, other.y - y) < 150) ||
      CLEAR.some((spot) => Math.hypot(spot.x - x, spot.y - y) < spot.r);

    if (!crowded) {
      placed.push({
        heading: random() * Math.PI * 2,
        kind: pickKind(random, 0, true),
        sway: (random() - 0.5) * 0.6,
        x,
        y,
      });
    }
  }

  return placed;
};

export const sceneDoc = (
  width: number,
  height: number,
  frame: Frame,
  pose: Pose,
  scenery = true
) =>
  docOf(
    { h: height, w: width, x: 0, y: 0 },
    width,
    height,
    `${scenery ? backdrop(width, height, frame) : ""}<g transform="translate(${n(frame.x)} ${n(frame.y)}) scale(${n(frame.size / SCENE)})">${poseBody(pose)}</g>`
  );
