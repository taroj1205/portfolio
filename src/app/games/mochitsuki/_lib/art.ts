type Stops = readonly (readonly [number, string])[];

export type Fill =
  | { solid: string }
  | { linear: readonly [number, number, number, number]; stops: Stops }
  | {
      radial: readonly [number, number, number];
      focus?: readonly [number, number];
      stops: Stops;
    };

export interface Layer {
  d: string;
  fill?: Fill;
  stroke?: Fill;
  width?: number;
  alpha?: number;
}

export type Part = readonly Layer[];

export interface Place {
  x: number;
  y: number;
  angle: number;
  sx: number;
  sy: number;
}

interface Point {
  x: number;
  y: number;
}

const n = (value: number) => Number(value.toFixed(4));

const ellipse = (cx: number, cy: number, rx: number, ry: number, turn = 0) => {
  const dx = Math.cos(turn) * rx;
  const dy = Math.sin(turn) * rx;
  const deg = n((turn * 180) / Math.PI);
  return `M${n(cx - dx)} ${n(cy - dy)}A${n(rx)} ${n(ry)} ${deg} 0 1 ${n(cx + dx)} ${n(cy + dy)}A${n(rx)} ${n(ry)} ${deg} 0 1 ${n(cx - dx)} ${n(cy - dy)}Z`;
};

const polygon = (points: readonly Point[]) =>
  `${points.map(({ x, y }, i) => `${i === 0 ? "M" : "L"}${n(x)} ${n(y)}`).join("")}Z`;

const seeded = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 16_807) % 2_147_483_647;
    return state / 2_147_483_647;
  };
};

const ink = {
  outline: "rgb(52 22 8 / 0.6)",
  red: "#d22f3a",
  white: "#fbf3e8",
} as const;

export const USU = {
  base: 0.935,
  bowl: { rx: 0.232, ry: 0.05 },
  cx: 0.5,
  rim: { rx: 0.29, ry: 0.07, y: 0.67 },
} as const;

export const MOCHI = { h: 0.078, rx: 0.2, y: 0.668 } as const;

const ROPE = { drop: 0.052, tall: 0.03, top: 0.742 } as const;

const halfWidth = (y: number) => {
  const { rim, base } = USU;
  const t = (y - rim.y) / (base - rim.y);
  return (
    rim.rx * (1 - t) ** 2 + 0.247 * 2 * t * (1 - t) + rim.rx * 0.94 * t * t
  );
};

const usuBody = () => {
  const { cx, rim, base } = USU;
  const low = rim.rx * 0.94;
  return [
    `M${n(cx - rim.rx)} ${rim.y}`,
    `Q${n(cx - 0.247)} 0.8 ${n(cx - low)} ${base}`,
    `A${n(low)} ${n(rim.ry * 0.8)} 0 0 0 ${n(cx + low)} ${base}`,
    `Q${n(cx + 0.247)} 0.8 ${n(cx + rim.rx)} ${rim.y}`,
    `A${rim.rx} ${rim.ry} 0 0 1 ${n(cx - rim.rx)} ${rim.y}Z`,
  ].join("");
};

const ropeAt = (u: number, depth: number) => {
  const y = ROPE.top + depth * ROPE.tall;
  return {
    x: USU.cx - halfWidth(y) * Math.cos(Math.PI * u),
    y: y + ROPE.drop * Math.sin(Math.PI * u),
  };
};

const ropeBand = () => {
  const { top } = ROPE;
  const low = top + ROPE.tall;
  const a = halfWidth(top);
  const b = halfWidth(low);
  return [
    `M${n(USU.cx - a)} ${top}`,
    `A${n(a)} ${ROPE.drop} 0 0 0 ${n(USU.cx + a)} ${top}`,
    `L${n(USU.cx + b)} ${n(low)}`,
    `A${n(b)} ${ROPE.drop} 0 0 1 ${n(USU.cx - b)} ${n(low)}Z`,
  ].join("");
};

const twists = (): Part =>
  Array.from({ length: 15 }, (_, i) => {
    const u = (i + 0.2) / 15;
    const w = 0.032;
    const lean = 0.026;
    return {
      d: polygon([
        ropeAt(u, 0),
        ropeAt(Math.min(1, u + w), 0),
        ropeAt(Math.min(1, u + w - lean), 1),
        ropeAt(Math.max(0, u - lean), 1),
      ]),
      fill: { solid: ink.red },
    };
  });

const grainLines = (): Part =>
  [-0.86, -0.62, -0.38, -0.14, 0.12, 0.36, 0.6, 0.82].map((k, i) => {
    const sway = i % 2 === 0 ? 0.008 : -0.008;
    return {
      d: `M${n(USU.cx + k * halfWidth(0.705))} 0.705Q${n(USU.cx + k * 0.25 + sway)} 0.8 ${n(USU.cx + k * halfWidth(0.925))} 0.925`,
      stroke: { solid: "rgb(50 24 8 / 0.26)" },
      width: 0.0018,
    };
  });

const rings = (count: number, from: number, to: number): Part => {
  const { cx, rim, bowl } = USU;
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 1) / (count + 1);
    const rx = bowl.rx + (rim.rx - bowl.rx) * t;
    const ry = bowl.ry + (rim.ry - bowl.ry) * t;
    const start = {
      x: cx + Math.cos(from) * rx,
      y: rim.y + Math.sin(from) * ry,
    };
    const end = { x: cx + Math.cos(to) * rx, y: rim.y + Math.sin(to) * ry };
    return {
      d: `M${n(start.x)} ${n(start.y)}A${n(rx)} ${n(ry)} 0 ${to - from > Math.PI ? 1 : 0} 1 ${n(end.x)} ${n(end.y)}`,
      stroke: { solid: "rgb(122 72 32 / 0.38)" },
      width: 0.0016,
    };
  });
};

export const floor: Part = [
  {
    d: ellipse(0.5, USU.base + 0.012, 0.4, 0.06),
    fill: {
      radial: [0.5, USU.base + 0.012, 0.4],
      stops: [
        [0, "rgb(4 2 8 / 0.75)"],
        [0.7, "rgb(4 2 8 / 0.4)"],
        [1, "rgb(4 2 8 / 0)"],
      ],
    },
  },
];

export const usu: Part = [
  {
    d: usuBody(),
    fill: {
      linear: [USU.cx - USU.rim.rx, 0, USU.cx + USU.rim.rx, 0],
      stops: [
        [0, "#341a0a"],
        [0.16, "#6e3c1b"],
        [0.36, "#b5793f"],
        [0.47, "#cd9259"],
        [0.66, "#8a5428"],
        [1, "#2e170a"],
      ],
    },
  },
  ...grainLines(),
  {
    d: ellipse(0.36, 0.865, 0.011, 0.02),
    stroke: { solid: "rgb(50 24 8 / 0.3)" },
    width: 0.0018,
  },
  {
    d: ellipse(0.36, 0.865, 0.004, 0.008),
    fill: { solid: "rgb(50 24 8 / 0.3)" },
  },
  {
    d: usuBody(),
    fill: {
      linear: [0, USU.rim.y, 0, USU.base + 0.06],
      stops: [
        [0, "rgb(0 0 0 / 0.42)"],
        [0.14, "rgb(0 0 0 / 0)"],
        [0.75, "rgb(0 0 0 / 0.06)"],
        [1, "rgb(0 0 0 / 0.5)"],
      ],
    },
  },
  { d: ropeBand(), fill: { solid: ink.white } },
  ...twists(),
  {
    d: ropeBand(),
    fill: {
      linear: [USU.cx - USU.rim.rx, 0, USU.cx + USU.rim.rx, 0],
      stops: [
        [0, "rgb(30 6 6 / 0.55)"],
        [0.3, "rgb(30 6 6 / 0)"],
        [0.62, "rgb(30 6 6 / 0)"],
        [1, "rgb(30 6 6 / 0.6)"],
      ],
    },
    stroke: { solid: "rgb(80 14 14 / 0.45)" },
    width: 0.0015,
  },
  {
    d: `M${n(ropeAt(0.3, 1).x)} ${n(ropeAt(0.3, 1).y)}q-0.006 0.03 -0.002 0.062`,
    stroke: { solid: ink.red },
    width: 0.007,
  },
  {
    d: `M${n(ropeAt(0.33, 1).x)} ${n(ropeAt(0.33, 1).y)}q0.004 0.028 0.008 0.052`,
    stroke: { solid: ink.white },
    width: 0.007,
  },
  {
    d: ellipse(USU.cx, USU.rim.y, USU.rim.rx, USU.rim.ry),
    fill: {
      linear: [0, USU.rim.y - USU.rim.ry, 0, USU.rim.y + USU.rim.ry],
      stops: [
        [0, "#e6b67c"],
        [1, "#a8703c"],
      ],
    },
  },
  ...rings(3, 0, Math.PI * 2 - 0.001),
  {
    d: `M0.33 0.636l0.03 0.008M0.66 0.7l-0.024 -0.01`,
    stroke: { solid: "rgb(110 60 24 / 0.45)" },
    width: 0.0016,
  },
  {
    d: ellipse(USU.cx, USU.rim.y, USU.bowl.rx, USU.bowl.ry),
    fill: {
      focus: [USU.cx, USU.rim.y - 0.02],
      radial: [USU.cx, USU.rim.y, USU.bowl.rx],
      stops: [
        [0, "#120802"],
        [0.75, "#2a1608"],
        [1, "#5a341a"],
      ],
    },
  },
];

const lipD = () => {
  const { cx, rim, bowl } = USU;
  return [
    `M${n(cx - rim.rx)} ${rim.y}`,
    `A${rim.rx} ${rim.ry} 0 0 0 ${n(cx + rim.rx)} ${rim.y}`,
    `L${n(cx + bowl.rx)} ${rim.y}`,
    `A${bowl.rx} ${bowl.ry} 0 0 1 ${n(cx - bowl.rx)} ${rim.y}Z`,
  ].join("");
};

export const lip: Part = [
  {
    d: lipD(),
    fill: {
      linear: [0, USU.rim.y, 0, USU.rim.y + USU.rim.ry],
      stops: [
        [0, "#d9a568"],
        [1, "#9c6434"],
      ],
    },
  },
  ...rings(2, 0.12, Math.PI - 0.12),
  {
    d: `M${n(USU.cx - USU.rim.rx + 0.01)} ${n(USU.rim.y + 0.012)}A${USU.rim.rx} ${USU.rim.ry} 0 0 0 ${n(USU.cx + USU.rim.rx - 0.01)} ${n(USU.rim.y + 0.012)}`,
    stroke: { solid: "rgb(255 226 180 / 0.35)" },
    width: 0.0024,
  },
];

const dome = () => {
  const { rx, h, y } = MOCHI;
  const { cx } = USU;
  return `M${n(cx - rx)} ${y}A${rx} ${h} 0 0 1 ${n(cx + rx)} ${y}A${rx} ${n(USU.bowl.ry * 0.8)} 0 0 1 ${n(cx - rx)} ${y}Z`;
};

export const mochi: Part = [
  {
    d: ellipse(USU.cx, MOCHI.y + 0.006, MOCHI.rx + 0.008, USU.bowl.ry * 0.85),
    fill: { solid: "rgb(0 0 0 / 0.35)" },
  },
  {
    d: dome(),
    fill: {
      focus: [0.43, MOCHI.y - MOCHI.h * 0.95],
      radial: [0.48, MOCHI.y - MOCHI.h * 0.6, 0.24],
      stops: [
        [0, "#ffffff"],
        [0.45, "#f7f2e9"],
        [0.8, "#e4d9c7"],
        [1, "#c9bba4"],
      ],
    },
    stroke: { solid: "rgb(150 128 100 / 0.35)" },
    width: 0.0018,
  },
];

const roll = seeded(2026);

export const grains: Part = Array.from({ length: 70 }, () => {
  const u = roll() * 1.7 - 0.85;
  const v = 0.1 + roll() * 0.82;
  const lift = Math.sqrt(Math.max(0, 1 - (u / 0.9) ** 2));
  return {
    d: ellipse(
      USU.cx + u * MOCHI.rx * 0.92,
      MOCHI.y - MOCHI.h * lift * v,
      0.0078,
      0.0036,
      roll() * Math.PI
    ),
    fill: { solid: "#ede2cc" },
    stroke: { solid: "rgb(168 146 112 / 0.55)" },
    width: 0.0009,
  };
});

export const gloss: Part = [
  {
    d: ellipse(0.435, MOCHI.y - MOCHI.h * 0.74, 0.07, 0.016, -0.2),
    fill: {
      radial: [0.435, MOCHI.y - MOCHI.h * 0.74, 0.07],
      stops: [
        [0, "rgb(255 255 255 / 0.95)"],
        [1, "rgb(255 255 255 / 0)"],
      ],
    },
  },
  {
    d: ellipse(0.405, MOCHI.y - MOCHI.h * 0.78, 0.012, 0.005, -0.2),
    fill: { solid: "#ffffff" },
  },
];

const TUB = { x: 0.125, y: 0.872 } as const;

export const tub: Part = [
  {
    d: ellipse(TUB.x, TUB.y + 0.068, 0.11, 0.022),
    fill: { solid: "rgb(4 2 8 / 0.55)" },
  },
  {
    d: `M${TUB.x - 0.088} ${TUB.y}L${TUB.x - 0.076} ${TUB.y + 0.064}A0.076 0.018 0 0 0 ${TUB.x + 0.076} ${TUB.y + 0.064}L${TUB.x + 0.088} ${TUB.y}Z`,
    fill: {
      linear: [TUB.x - 0.088, 0, TUB.x + 0.088, 0],
      stops: [
        [0, "#6e4320"],
        [0.4, "#d5a46a"],
        [1, "#5a3418"],
      ],
    },
  },
  ...[-0.05, -0.017, 0.017, 0.05].map((dx) => ({
    d: `M${n(TUB.x + dx)} ${n(TUB.y + 0.018)}L${n(TUB.x + dx * 0.88)} ${n(TUB.y + 0.08)}`,
    stroke: { solid: "rgb(60 30 10 / 0.35)" },
    width: 0.0016,
  })),
  ...[0.02, 0.05].map((dy) => ({
    d: `M${n(TUB.x - 0.088 + dy * 0.19)} ${n(TUB.y + dy)}A${n(0.086 - dy * 0.19)} 0.02 0 0 0 ${n(TUB.x + 0.088 - dy * 0.19)} ${n(TUB.y + dy)}`,
    stroke: { solid: "#3e2a1c" },
    width: 0.006,
  })),
  {
    d: ellipse(TUB.x, TUB.y, 0.088, 0.021),
    fill: { solid: "#c99a62" },
    stroke: { solid: "rgb(60 30 10 / 0.5)" },
    width: 0.0018,
  },
  {
    d: ellipse(TUB.x, TUB.y + 0.003, 0.076, 0.015),
    fill: {
      linear: [0, TUB.y - 0.012, 0, TUB.y + 0.018],
      stops: [
        [0, "#3d6f96"],
        [1, "#9cc6e4"],
      ],
    },
  },
  {
    d: ellipse(TUB.x - 0.025, TUB.y, 0.022, 0.004),
    fill: { solid: "rgb(255 255 255 / 0.55)" },
  },
];

export const KINE = {
  head: 0.1,
  pivot: { x: 1.007, y: 0.342 },
  r: 0.056,
  reach: 0.56,
  swing: 0.62,
} as const;

const KINE_ANGLE = Math.atan2(0.502 - KINE.pivot.y, 0.471 - KINE.pivot.x);

export const kinePose = (lift: number): Place => ({
  angle: KINE_ANGLE + KINE.swing * lift,
  sx: 1,
  sy: 1,
  x: KINE.pivot.x,
  y: KINE.pivot.y,
});

const kineHead = () => {
  const { reach: d, r, head: l } = KINE;
  return {
    body: `M${n(d - r)} ${n(-l + 0.008)}Q${n(d - r)} ${-l} ${n(d - r + 0.008)} ${-l}L${n(d + r - 0.008)} ${-l}Q${n(d + r)} ${-l} ${n(d + r)} ${n(-l + 0.008)}L${n(d + r)} ${l}L${n(d - r)} ${l}Z`,
    cap: ellipse(d, l, r, r * 0.3),
  };
};

export const kine: Part = (() => {
  const { reach: d, r, head: l } = KINE;
  const head = kineHead();
  return [
    {
      d: `M-0.3 -0.0145L${n(d)} -0.0145L${n(d)} 0.0145L-0.3 0.0145Z`,
      fill: {
        linear: [0, -0.0145, 0, 0.0145],
        stops: [
          [0, "#9a6a36"],
          [0.4, "#e4b67c"],
          [1, "#865a2c"],
        ],
      },
      stroke: { solid: ink.outline },
      width: 0.002,
    },
    {
      d: `M0.02 -0.016L0.1 -0.016L0.1 0.016L0.02 0.016Z`,
      fill: { solid: ink.white },
      stroke: { solid: ink.outline },
      width: 0.002,
    },
    ...[0.04, 0.07].map((x) => ({
      d: `M${x} -0.016L${x + 0.012} 0.016`,
      stroke: { solid: ink.red },
      width: 0.006,
    })),
    {
      d: head.body,
      fill: {
        linear: [d - r, 0, d + r, 0],
        stops: [
          [0, "#6a4020"],
          [0.3, "#d29e64"],
          [0.5, "#ebbd84"],
          [1, "#5e3818"],
        ],
      },
      stroke: { solid: ink.outline },
      width: 0.0026,
    },
    ...[-0.55, -0.1, 0.4].map((k) => ({
      d: `M${n(d + k * r)} ${n(-l + 0.01)}Q${n(d + k * r + 0.006)} 0 ${n(d + k * r)} ${n(l - 0.01)}`,
      stroke: { solid: "rgb(70 36 12 / 0.28)" },
      width: 0.0015,
    })),
    {
      d: `M${n(d - r * 0.72)} ${n(-l + 0.012)}L${n(d - r * 0.55)} ${n(-l + 0.012)}L${n(d - r * 0.55)} ${n(l - 0.012)}L${n(d - r * 0.72)} ${n(l - 0.012)}Z`,
      fill: { solid: "rgb(255 240 210 / 0.22)" },
    },
    {
      d: head.cap,
      fill: {
        radial: [d, l, r],
        stops: [
          [0, "#f0c892"],
          [1, "#c48f58"],
        ],
      },
      stroke: { solid: ink.outline },
      width: 0.0022,
    },
    ...[0.35, 0.65].map((t) => ({
      d: ellipse(d, l, r * t, r * 0.3 * t),
      stroke: { solid: "rgb(120 70 30 / 0.4)" },
      width: 0.0014,
    })),
    ...[-0.6, -0.15, 0.3, 0.7].map((k, i) => ({
      d: ellipse(d + k * r, -l - 0.002, 0.008 + (i % 2) * 0.004, 0.006),
      fill: { solid: "rgb(255 252 244 / 0.92)" },
    })),
  ];
})();

const SLEEVE = 0.3;
const FOREARM = 0.2;

export const sleeve: Part = [
  {
    d: `M-0.03 -0.072L${SLEEVE} -0.044Q${SLEEVE + 0.014} 0 ${SLEEVE} 0.047L-0.03 0.078Z`,
    fill: {
      linear: [-0.03, 0, 0.16, 0],
      stops: [
        [0, "rgb(38 54 112 / 0)"],
        [1, "#26386f"],
      ],
    },
    stroke: {
      linear: [-0.03, 0, 0.16, 0],
      stops: [
        [0, "rgb(8 10 30 / 0)"],
        [1, "rgb(8 10 30 / 0.7)"],
      ],
    },
    width: 0.0026,
  },
  {
    d: `M0.1 0.01L${SLEEVE - 0.01} 0.014Q${SLEEVE + 0.004} 0.03 ${SLEEVE - 0.006} 0.046L0.1 0.066Z`,
    fill: { solid: "rgb(8 12 36 / 0.35)" },
  },
  {
    d: `M0.1 -0.058L${SLEEVE - 0.02} -0.04`,
    stroke: { solid: "rgb(150 176 240 / 0.35)" },
    width: 0.004,
  },
  {
    d: `M${SLEEVE - 0.034} -0.046L${SLEEVE - 0.016} -0.045Q${SLEEVE - 0.004} 0 ${SLEEVE - 0.016} 0.047L${SLEEVE - 0.034} 0.049Q${SLEEVE - 0.022} 0 ${SLEEVE - 0.034} -0.046Z`,
    fill: { solid: ink.white },
  },
  {
    d: `M0.04 -0.03Q0.12 -0.02 0.2 -0.028M0.06 0.03Q0.14 0.022 0.22 0.032`,
    stroke: { solid: "rgb(8 10 30 / 0.45)" },
    width: 0.002,
  },
  ...[0.13, 0.19, 0.245].map((x) => ({
    d: ellipse(x, 0.002, 0.012, 0.012),
    stroke: { solid: "rgb(251 243 232 / 0.75)" },
    width: 0.0022,
  })),
];

export const forearm: Part = [
  {
    d: `M0 -0.026L${FOREARM} -0.018Q${FOREARM + 0.008} 0 ${FOREARM} 0.018L0 0.027Q-0.008 0 0 -0.026Z`,
    fill: {
      linear: [0, -0.026, 0, 0.027],
      stops: [
        [0, "#fbe0c7"],
        [0.55, "#f2c6a2"],
        [1, "#d9996f"],
      ],
    },
    stroke: { solid: "rgb(122 62 38 / 0.6)" },
    width: 0.0024,
  },
  {
    d: `M0.03 -0.012Q0.1 -0.016 0.17 -0.009`,
    stroke: { solid: "rgb(255 246 236 / 0.6)" },
    width: 0.003,
  },
];

const FINGERS = [
  { len: 0.046, y: 0.0165 },
  { len: 0.058, y: 0.0055 },
  { len: 0.062, y: -0.0055 },
  { len: 0.056, y: -0.0165 },
] as const;

const fingerD = (len: number, y: number) =>
  `M0.072 ${y}Q${n(0.072 + len * 0.55)} ${n(y - 0.002)} ${n(0.072 + len)} ${n(y + 0.007)}`;

export const hand: Part = [
  {
    d: "M-0.004 -0.022C0.02 -0.031 0.055 -0.032 0.078 -0.024C0.087 -0.012 0.087 0.012 0.078 0.022C0.055 0.03 0.022 0.03 -0.004 0.022Z",
    fill: {
      linear: [0, -0.03, 0, 0.03],
      stops: [
        [0, "#fbe0c7"],
        [1, "#e0a37c"],
      ],
    },
    stroke: { solid: "rgb(122 62 38 / 0.6)" },
    width: 0.0022,
  },
  ...FINGERS.flatMap(({ len, y }) => [
    {
      d: fingerD(len, y),
      stroke: { solid: "rgb(122 62 38 / 0.6)" },
      width: 0.0182,
    },
    { d: fingerD(len, y), stroke: { solid: "#f6cfae" }, width: 0.0138 },
    {
      d: ellipse(0.072 + len - 0.007, y + 0.0055, 0.0055, 0.0038),
      fill: { solid: "#fde6d8" },
    },
  ]),
  {
    d: "M0.02 -0.02Q0.05 -0.045 0.078 -0.041",
    stroke: { solid: "rgb(122 62 38 / 0.6)" },
    width: 0.0196,
  },
  {
    d: "M0.02 -0.02Q0.05 -0.045 0.078 -0.041",
    stroke: { solid: "#f8d6b8" },
    width: 0.0152,
  },
  {
    d: "M0.064 -0.012q0.004 0.004 0 0.008M0.064 0.004q0.004 0.004 0 0.008",
    stroke: { solid: "rgb(176 104 72 / 0.55)" },
    width: 0.0012,
  },
];

export const bruise: Part = [
  {
    d: ellipse(0.075, 0, 0.08, 0.048),
    fill: {
      radial: [0.075, 0, 0.08],
      stops: [
        [0, "rgb(255 60 56 / 0.75)"],
        [1, "rgb(255 60 56 / 0)"],
      ],
    },
  },
];

const SHOULDER = { x: -0.09, y: 0.42 } as const;
const REST = { angle: 1.05, x: 0.128, y: 0.79 } as const;
const PRESS = { angle: 0.1, x: 0.42, y: 0.626 } as const;

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const segment = (from: Point, to: Point, length: number): Place => ({
  angle: Math.atan2(to.y - from.y, to.x - from.x),
  sx: Math.hypot(to.x - from.x, to.y - from.y) / length,
  sy: 1,
  x: from.x,
  y: from.y,
});

export const armPose = (reach: number, swell = 1) => {
  const arc = Math.sin(reach * Math.PI) * 0.09;
  const wrist = {
    x: mix(REST.x, PRESS.x, reach),
    y: mix(REST.y, PRESS.y, reach) - arc,
  };
  const elbow = {
    x: mix(SHOULDER.x, wrist.x, 0.5) - 0.015,
    y: mix(SHOULDER.y, wrist.y, 0.5) + 0.05 * (1 - reach) + 0.012,
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

export const STRIKE = { x: KINE.reach, y: -KINE.head } as const;

const STRIPES = 24;

const box = (x: number, y: number, w: number, h: number) =>
  polygon([
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ]);

export const curtain = (width: number, height: number): Part => {
  const w = width / STRIPES;
  return [
    ...Array.from({ length: STRIPES }, (_, i): Part => {
      const x = i * w;
      return [
        {
          d: box(x, 0, w, height),
          fill: { solid: i % 2 === 0 ? ink.red : ink.white },
        },
        {
          d: box(x, 0, w, height),
          fill: {
            linear: [x, 0, x + w, 0],
            stops: [
              [0, "rgb(0 0 0 / 0.38)"],
              [0.35, "rgb(255 255 255 / 0.08)"],
              [0.7, "rgb(0 0 0 / 0)"],
              [1, "rgb(0 0 0 / 0.42)"],
            ],
          },
        },
      ];
    }).flat(),
    {
      d: box(0, 0, width, height),
      fill: {
        linear: [0, 0, 0, height],
        stops: [
          [0, "rgb(10 6 20 / 0.35)"],
          [0.75, "rgb(10 6 20 / 0.5)"],
          [1, "rgb(10 6 20 / 0.8)"],
        ],
      },
    },
    { d: box(0, 0, width, height * 0.09), fill: { solid: "#120b14" } },
  ];
};

export const lantern: Part = [
  {
    d: ellipse(0, 0, 1.9, 1.9),
    fill: {
      radial: [0, 0, 1.9],
      stops: [
        [0, "rgb(255 150 70 / 0.5)"],
        [0.4, "rgb(255 110 50 / 0.18)"],
        [1, "rgb(255 110 50 / 0)"],
      ],
    },
  },
  { d: "M0 -1.4L0 -0.92", stroke: { solid: "#1a0f0a" }, width: 0.05 },
  {
    d: "M-0.3 -0.9L0.3 -0.9L0.34 -0.76L-0.34 -0.76Z",
    fill: { solid: "#1a0f0a" },
  },
  {
    d: "M-0.34 -0.76C-0.66 -0.5 -0.66 0.5 -0.34 0.76L0.34 0.76C0.66 0.5 0.66 -0.5 0.34 -0.76Z",
    fill: {
      focus: [-0.12, -0.2],
      radial: [0, 0, 0.62],
      stops: [
        [0, "#ffd08a"],
        [0.35, "#ff8a4a"],
        [0.8, "#d8382c"],
        [1, "#8e1a1a"],
      ],
    },
  },
  ...[-0.56, -0.34, -0.12, 0.12, 0.34, 0.56].map((y) => {
    const half = 0.34 + 0.22 * Math.cos((y / 0.76) * (Math.PI / 2));
    return {
      d: `M${n(-half)} ${y}Q0 ${n(y + 0.05)} ${n(half)} ${y}`,
      stroke: { solid: "rgb(110 20 16 / 0.45)" },
      width: 0.022,
    };
  }),
  {
    d: "M-0.34 0.76L0.34 0.76L0.3 0.9L-0.3 0.9Z",
    fill: { solid: "#1a0f0a" },
  },
  { d: "M0 0.9L0 1.18", stroke: { solid: "#1a0f0a" }, width: 0.04 },
  { d: "M-0.07 1.12L0.07 1.12L0.04 1.4L-0.04 1.4Z", fill: { solid: ink.red } },
];

export const snow = (width: number, height: number, count: number): Part => {
  const flake = seeded(77);
  return Array.from({ length: count }, () => {
    const r = 0.6 + flake() * 1.6;
    return {
      alpha: 0.25 + flake() * 0.45,
      d: ellipse(flake() * width, flake() * height, r, r),
      fill: { solid: ink.white },
    };
  });
};
