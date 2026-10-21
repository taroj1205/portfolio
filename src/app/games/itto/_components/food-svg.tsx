import type { ReactNode } from "react";

import { isCutEdge } from "../_lib/cut";
import type { Face, Split } from "../_lib/cut";
import type { Art, Kind, Food } from "../_lib/foods";
import { signedArea } from "../_lib/geometry";
import type { Line, Point } from "../_lib/geometry";

interface Band {
  to: number;
  colour: string;
}

interface Filling {
  from: number;
  to: number;
  inset: number;
  colour: string;
}

interface Look {
  depth: number;
  top: string;
  sides: Band[];
  inside: Band[];
  fillings: Filling[];
  rim: string;
  round: boolean;
  gloss: number;
}

const paint = {
  anko: "#3a1a20",
  bean: "#2a1621",
  calyx: "#55682c",
  calyxDry: "#7a5a2a",
  castella: "#f3c24c",
  castellaBase: "#b77a32",
  chestnut: "#e8b84a",
  chestnutEdge: "#b98322",
  crack: "#cdbfa4",
  crust: "#7c3c14",
  crustPore: "#5e2a0c",
  daidai: "#f08a1c",
  daidaiDeep: "#d8650f",
  dark: "#000000",
  egg: "#f4cf4a",
  eggDeep: "#e3ae2a",
  ginger: "#f3dc9a",
  gingerFibre: "#d9b862",
  kaki: "#ef861c",
  kakiCore: "#f8b45c",
  kakiDeep: "#d55e14",
  kakiLight: "#f9a845",
  leaf: "#3f7a2c",
  leafVein: "#9cc97e",
  light: "#ffffff",
  maguro: "#c42b3b",
  maguroSinew: "#f7c6cb",
  matcha: "#3d4c1f",
  matchaInside: "#4b5d26",
  mochi: "#fbf8f2",
  mochiShade: "#e8e1d2",
  negi: "#4f9a35",
  negiCore: "#d4ecaf",
  nori: "#1d271c",
  noriSheen: "#3d4a3a",
  pink: "#ec6f8b",
  pinkDeep: "#e3475f",
  rice: "#f8f6ee",
  riceEdge: "#ded7c4",
  salmon: "#f4874f",
  salmonFat: "#ffd8c2",
  scale: "#8f531c",
  sesame: "#1f1a17",
  shoyu: "#3b1c0c",
  steel: "#e9edf0",
  stem: "#5a3a1c",
  strawberry: "#df2f3f",
  taiyaki: "#c98b3d",
  taiyakiCrisp: "#e7bb72",
  taiyakiDeep: "#93561f",
  taiyakiInside: "#e8b469",
  tofu: "#f7f3ea",
  tofuSide: "#e9e2d2",
  ume: "#b8243a",
  white: "#fffdf8",
  yokan: "#3d1416",
  yokanInside: "#4f1d1f",
  yomogi: "#9db474",
  yomogiInside: "#8fa866",
} as const;

const rakuganTints = ["#f4c1cf", "#c6dda9", "#c3d8ee", "#dccdf0"] as const;
const rakuganSides = ["#dc9aad", "#a3c283", "#97b6d8", "#b8a2d8"] as const;
const nerikiriTints = [
  ["#fff6f8", "#f3aec1", "#e993ab"],
  ["#fff0f3", "#ea6d89", "#d94b6b"],
  ["#f6f1ff", "#a88ad8", "#8d6cc6"],
] as const;
const netaTints = [
  [paint.maguro, "#9c1f2d"],
  [paint.salmon, "#dd6a37"],
  [paint.egg, paint.eggDeep],
] as const;
const onigiriFillings = [paint.ume, paint.salmon, paint.nori] as const;

const solid = (colour: string): Band[] => [{ colour, to: 1 }];

const plain = {
  fillings: [],
  gloss: 1,
  inside: [],
  rim: paint.light,
  round: false,
};

const castellaBands: Band[] = [
  { colour: paint.castellaBase, to: 1 },
  { colour: paint.castella, to: 0.88 },
  { colour: paint.crust, to: 0.13 },
];

const looks: Record<Kind, (variant: number) => Look> = {
  castella: () => ({
    ...plain,
    depth: 0.22,
    inside: castellaBands,
    rim: paint.castella,
    sides: castellaBands,
    top: paint.crust,
  }),
  daifuku: (variant) => ({
    ...plain,
    depth: 0.15,
    fillings: [
      { colour: paint.anko, from: 0.12, inset: 0.14, to: 0.88 },
      ...(variant === 1
        ? [{ colour: paint.strawberry, from: 0.22, inset: 0.3, to: 0.78 }]
        : []),
    ],
    inside: solid(variant === 2 ? paint.yomogiInside : paint.mochi),
    round: true,
    sides: solid(variant === 2 ? paint.yomogiInside : paint.mochiShade),
    top: variant === 2 ? paint.yomogi : paint.mochi,
  }),
  kagami: () => ({
    ...plain,
    depth: 0.16,
    inside: solid(paint.mochi),
    round: true,
    sides: solid(paint.mochiShade),
    top: paint.mochi,
  }),
  kaki: () => ({
    ...plain,
    depth: 0.16,
    fillings: [{ colour: paint.kakiCore, from: 0.18, inset: 0.3, to: 0.82 }],
    gloss: 1.5,
    inside: solid(paint.kakiLight),
    round: true,
    sides: solid(paint.kakiDeep),
    top: paint.kaki,
  }),
  kamaboko: () => ({
    ...plain,
    depth: 0.1,
    inside: solid(paint.white),
    sides: solid(paint.mochiShade),
    top: paint.white,
  }),
  nerikiri: (variant) => {
    const tint = nerikiriTints[variant] ?? nerikiriTints[0];
    return {
      ...plain,
      depth: 0.13,
      fillings: [{ colour: paint.mochi, from: 0.2, inset: 0.24, to: 0.85 }],
      inside: solid(tint[1]),
      round: true,
      sides: solid(tint[2]),
      top: tint[1],
    };
  },
  onigiri: (variant) => ({
    ...plain,
    depth: 0.16,
    fillings: [
      {
        colour: onigiriFillings[variant] ?? paint.ume,
        from: 0.25,
        inset: 0.34,
        to: 0.75,
      },
    ],
    inside: solid(paint.rice),
    round: true,
    sides: solid(paint.riceEdge),
    top: paint.rice,
  }),
  rakugan: (variant) => {
    const tint = variant % 4;
    return {
      ...plain,
      depth: 0.09,
      inside: solid(rakuganTints[tint] ?? paint.white),
      sides: solid(rakuganSides[tint] ?? paint.mochiShade),
      top: rakuganTints[tint] ?? paint.white,
    };
  },
  sushi: (variant) => {
    const neta = netaTints[variant] ?? netaTints[0];
    return {
      ...plain,
      depth: 0.17,
      gloss: variant === 2 ? 1 : 1.4,
      inside: [
        { colour: paint.rice, to: 1 },
        { colour: neta[0], to: 0.38 },
      ],
      sides: [
        { colour: paint.riceEdge, to: 1 },
        { colour: neta[1], to: 0.38 },
      ],
      top: paint.rice,
    };
  },
  taiyaki: (variant) => ({
    ...plain,
    depth: 0.11,
    fillings: [{ colour: paint.anko, from: 0.2, inset: 0.12, to: 0.82 }],
    inside: solid(paint.taiyakiInside),
    rim: variant === 1 ? paint.taiyakiCrisp : paint.taiyakiDeep,
    round: true,
    sides: solid(paint.taiyakiDeep),
    top: paint.taiyaki,
  }),
  tofu: () => ({
    ...plain,
    depth: 0.2,
    inside: solid(paint.tofu),
    sides: solid(paint.tofuSide),
    top: paint.tofu,
  }),
  yokan: (variant) => ({
    ...plain,
    depth: 0.17,
    fillings:
      variant === 1
        ? [
            { colour: paint.chestnut, from: 0.25, inset: 0.2, to: 0.6 },
            { colour: paint.chestnut, from: 0.45, inset: 0.62, to: 0.82 },
          ]
        : [],
    gloss: 1.6,
    inside: solid(variant === 2 ? paint.matchaInside : paint.yokanInside),
    sides: solid(variant === 2 ? paint.matcha : paint.yokan),
    top: variant === 2 ? paint.matcha : paint.yokan,
  }),
};

const LEAN = 0.32;

const depthOf = (look: Look) => ({ x: look.depth * LEAN, y: look.depth });

const n = (value: number) => Math.round(value * 10_000) / 10_000;

const ring = (points: readonly Point[]) =>
  points.length === 0
    ? ""
    : `M${points.map((p) => `${n(p.x)} ${n(p.y)}`).join("L")}Z`;

const shift = (points: readonly Point[], by: Point) =>
  points.map((p) => ({ x: p.x + by.x, y: p.y + by.y }));

const facing = (points: readonly Point[]) =>
  signedArea(points) < 0 ? points.toReversed() : points;

const sweep = (points: readonly Point[], by: Point, line: Line | null) => {
  const parts = [ring(shift(points, by))];
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const outward = (b.y - a.y) * by.x - (b.x - a.x) * by.y;
    if (outward > 0 && (line === null || !isCutEdge(line, a, b))) {
      parts.push(
        ring(
          facing([
            a,
            b,
            { x: b.x + by.x, y: b.y + by.y },
            { x: a.x + by.x, y: a.y + by.y },
          ])
        )
      );
    }
  }
  return parts.join("");
};

const scaled = (by: Point, k: number) => ({ x: by.x * k, y: by.y * k });

const faceQuad = (
  face: Face,
  by: Point,
  from: number,
  to: number,
  inset: number
) => {
  const dx = face.to.x - face.from.x;
  const dy = face.to.y - face.from.y;
  const a = { x: face.from.x + dx * inset, y: face.from.y + dy * inset };
  const b = { x: face.to.x - dx * inset, y: face.to.y - dy * inset };
  return ring(
    facing([
      { x: a.x + by.x * from, y: a.y + by.y * from },
      { x: b.x + by.x * from, y: b.y + by.y * from },
      { x: b.x + by.x * to, y: b.y + by.y * to },
      { x: a.x + by.x * to, y: a.y + by.y * to },
    ])
  );
};

const placeOf = (food: Food) =>
  `translate(${n(food.place.x)} ${n(food.place.y)}) scale(${n(food.place.scale)}) rotate(${n(food.place.turn)})`;

const ellipse = (
  grain: { x: number; y: number; r: number; a: number },
  squash: number
) =>
  `translate(${n(grain.x)} ${n(grain.y)}) rotate(${n(grain.a)}) scale(1 ${squash})`;

const riceGrains = (art: Art) =>
  art.grains.map((grain) => (
    <g key={`${grain.x}-${grain.y}`} transform={ellipse(grain, 0.45)}>
      <circle cx={0.006} cy={0.012} fill={paint.riceEdge} r={grain.r} />
      <circle fill={paint.white} r={grain.r} />
    </g>
  ));

const biteMark = (art: Art, colour: string, width: number) =>
  art.bite === null ? null : (
    <circle
      cx={art.bite.x}
      cy={art.bite.y}
      fill="none"
      r={art.bite.r + width / 2}
      stroke={colour}
      strokeWidth={width}
    />
  );

const tofuArt = (art: Art) => (
  <>
    <ellipse
      cx={-art.w * 0.3}
      cy={-art.h * 0.45}
      fill={paint.light}
      opacity={0.5}
      rx={art.w * 0.45}
      ry={art.h * 0.18}
    />
    {art.variant === 1 ? (
      <g
        transform={`translate(${n(art.spot.x + 0.32)} ${n(art.spot.y + 0.12)})`}
      >
        <path
          d="M-0.2 0.01C-0.21-0.08-0.1-0.13 0.02-0.12S0.22-0.06 0.2 0.03 0.08 0.13-0.04 0.12-0.19 0.08-0.2 0.01Z"
          fill={paint.shoyu}
          opacity={0.88}
        />
        <ellipse
          cx={-0.06}
          cy={-0.05}
          fill={paint.light}
          opacity={0.4}
          rx={0.07}
          ry={0.022}
        />
      </g>
    ) : null}
    <g transform={`translate(${n(art.spot.x)} ${n(art.spot.y)})`}>
      <path
        d="M-0.16 0.02c0-0.12 0.08-0.17 0.17-0.16s0.16 0.08 0.14 0.17-0.12 0.11-0.2 0.08-0.11-0.04-0.11-0.09z"
        fill={paint.ginger}
      />
      <path
        d="M-0.1-0.04l0.08 0.06M-0.04-0.08l0.06 0.1M0.03-0.06l0.04 0.1M-0.08 0.04l0.1 0.02"
        stroke={paint.gingerFibre}
        strokeLinecap="round"
        strokeWidth={0.012}
      />
    </g>
    {art.grains.map((grain) => (
      <g key={`${grain.x}-${grain.y}`} transform={ellipse(grain, 0.8)}>
        <circle fill={paint.negi} r={grain.r} />
        <circle fill={paint.negiCore} r={grain.r * 0.62} />
        <circle fill={paint.negi} opacity={0.5} r={grain.r * 0.25} />
      </g>
    ))}
  </>
);

const yokanArt = (art: Art) => (
  <>
    <rect
      fill={paint.light}
      height={art.h * 0.09}
      opacity={0.18}
      rx={art.h * 0.04}
      width={art.w * 1.6}
      x={-art.w * 0.8}
      y={-art.h * 0.62}
    />
    <rect
      fill={paint.light}
      height={art.h * 0.04}
      opacity={0.12}
      rx={art.h * 0.02}
      width={art.w * 1.1}
      x={-art.w * 0.5}
      y={-art.h * 0.4}
    />
    {art.grains.map((grain) => (
      <g key={`${grain.x}-${grain.y}`} transform={ellipse(grain, 0.7)}>
        <circle fill={paint.chestnutEdge} opacity={0.85} r={grain.r * 1.08} />
        <circle fill={paint.chestnut} opacity={0.9} r={grain.r} />
      </g>
    ))}
  </>
);

const castellaArt = (art: Art) => (
  <>
    {art.grains.map((grain) => (
      <circle
        cx={grain.x}
        cy={grain.y}
        fill={paint.crustPore}
        key={`${grain.x}-${grain.y}`}
        opacity={0.45}
        r={grain.r}
      />
    ))}
    <rect
      fill={paint.light}
      height={art.h * 0.5}
      opacity={0.08}
      rx={0.2}
      width={art.w * 1.5}
      x={-art.w * 0.75}
      y={-art.h * 0.8}
    />
    {biteMark(art, paint.castella, 0.1)}
  </>
);

const onigiriArt = (art: Art) => {
  const sesame = art.variant === 2;
  return (
    <>
      {riceGrains(art)}
      {sesame ? (
        art.grains
          .slice(0, 22)
          .map((grain) => (
            <ellipse
              cx={grain.x + 0.02}
              cy={grain.y - 0.03}
              fill={paint.sesame}
              key={`s-${grain.x}-${grain.y}`}
              rx={0.022}
              ry={0.011}
              transform={`rotate(${n(grain.a)} ${n(grain.x + 0.02)} ${n(grain.y - 0.03)})`}
            />
          ))
      ) : (
        <circle
          cx={art.spot.x * 0.5}
          cy={-art.h * 0.15}
          fill={onigiriFillings[art.variant] ?? paint.ume}
          r={0.13}
          stroke={paint.dark}
          strokeOpacity={0.12}
          strokeWidth={0.02}
        />
      )}
      <g>
        <rect
          fill={paint.nori}
          height={2}
          rx={0.06}
          width={art.w * 0.9}
          x={art.spot.x - art.w * 0.45}
          y={art.h * 0.1}
        />
        <path
          d={`M${art.spot.x - art.w * 0.4} ${art.h * 0.3}h${art.w * 0.8}M${art.spot.x - art.w * 0.4} ${art.h * 0.5}h${art.w * 0.8}`}
          stroke={paint.noriSheen}
          strokeWidth={0.03}
        />
      </g>
      {biteMark(art, onigiriFillings[art.variant] ?? paint.ume, 0.06)}
    </>
  );
};

const daifukuArt = (art: Art, id: string) => (
  <>
    {art.variant === 1 ? (
      <>
        <defs>
          <radialGradient id={`${id}-blush`}>
            <stop offset="0" stopColor={paint.strawberry} stopOpacity={0.3} />
            <stop offset="1" stopColor={paint.strawberry} stopOpacity={0} />
          </radialGradient>
        </defs>
        <circle fill={`url(#${id}-blush)`} r={0.62} />
      </>
    ) : null}
    {art.variant === 0
      ? art.grains.map((grain) => (
          <g key={`${grain.x}-${grain.y}`} transform={ellipse(grain, 0.7)}>
            <circle fill={paint.bean} r={grain.r} />
            <circle
              cx={-grain.r * 0.3}
              cy={-grain.r * 0.3}
              fill={paint.light}
              opacity={0.25}
              r={grain.r * 0.35}
            />
            <circle
              cx={grain.r * 0.5}
              fill={paint.mochi}
              opacity={0.55}
              r={grain.r * 0.8}
            />
          </g>
        ))
      : art.grains.map((grain) => (
          <circle
            cx={grain.x}
            cy={grain.y}
            fill={paint.light}
            key={`${grain.x}-${grain.y}`}
            opacity={0.75}
            r={grain.r}
          />
        ))}
    {biteMark(art, paint.anko, 0.14)}
    {art.variant === 1 ? biteMark(art, paint.strawberry, 0.07) : null}
  </>
);

const kagamiArt = (art: Art) => {
  const top = art.h;
  const orange = { x: art.spot.x + top * 0.1, y: art.spot.y - top * 0.12 };
  return (
    <>
      {art.grains.map((grain) => (
        <path
          d={`M${n(grain.x)} ${n(grain.y)}l${n(Math.cos(grain.a) * grain.r * 0.5)} ${n(Math.sin(grain.a) * grain.r * 0.5 + 0.02)}l${n(Math.cos(grain.a) * grain.r * 0.5)} ${n(Math.sin(grain.a) * grain.r * 0.5 - 0.03)}`}
          fill="none"
          key={`${grain.x}-${grain.y}`}
          stroke={paint.crack}
          strokeLinecap="round"
          strokeWidth={0.014}
        />
      ))}
      <circle
        cx={art.spot.x + 0.04}
        cy={art.spot.y + 0.07}
        fill={paint.dark}
        opacity={0.1}
        r={top}
      />
      <circle cx={art.spot.x} cy={art.spot.y} fill={paint.mochi} r={top} />
      <circle
        cx={art.spot.x - top * 0.3}
        cy={art.spot.y - top * 0.35}
        fill={paint.light}
        opacity={0.6}
        r={top * 0.4}
      />
      <circle
        cx={orange.x + 0.03}
        cy={orange.y + 0.05}
        fill={paint.dark}
        opacity={0.14}
        r={0.27}
      />
      <circle cx={orange.x} cy={orange.y} fill={paint.daidaiDeep} r={0.27} />
      <circle
        cx={orange.x - 0.02}
        cy={orange.y - 0.02}
        fill={paint.daidai}
        r={0.24}
      />
      <circle
        cx={orange.x - 0.09}
        cy={orange.y - 0.1}
        fill={paint.light}
        opacity={0.35}
        r={0.07}
      />
      <g
        transform={`translate(${n(orange.x)} ${n(orange.y)}) rotate(${n((art.phase * 180) / Math.PI)})`}
      >
        <path
          d="M0.02-0.02c0.12-0.12 0.3-0.14 0.42-0.06-0.1 0.12-0.28 0.16-0.42 0.06z"
          fill={paint.leaf}
        />
        <path
          d="M0.04-0.03c0.12-0.05 0.24-0.06 0.36-0.05"
          fill="none"
          stroke={paint.leafVein}
          strokeWidth={0.012}
        />
        <circle fill={paint.stem} r={0.03} />
      </g>
    </>
  );
};

const taiyakiArt = (art: Art) => {
  const tail = -art.w;
  return (
    <>
      <ellipse
        fill={paint.taiyakiCrisp}
        opacity={0.35}
        rx={art.w * 0.55}
        ry={art.h * 0.45}
      />
      {art.grains.map((grain) => (
        <path
          d={`M${n(grain.x - grain.r)} ${n(grain.y)}a${n(grain.r)} ${n(grain.r)} 0 0 0 ${n(grain.r * 2)} 0`}
          fill="none"
          key={`${grain.x}-${grain.y}`}
          opacity={0.6}
          stroke={paint.scale}
          strokeWidth={0.018}
        />
      ))}
      <path
        d={`M${n(art.w * 0.42)} ${n(-art.h * 0.7)}q${n(-art.w * 0.14)} ${n(art.h * 0.7)} 0 ${n(art.h * 1.4)}`}
        fill="none"
        opacity={0.7}
        stroke={paint.scale}
        strokeWidth={0.024}
      />
      {[-0.5, -0.25, 0, 0.25, 0.5].map((k) => (
        <path
          d={`M${n(tail + 0.02)} ${n(k * art.h * 0.3)}L${n(tail - 0.34)} ${n(k * art.h * 1.3)}`}
          key={k}
          opacity={0.55}
          stroke={paint.scale}
          strokeLinecap="round"
          strokeWidth={0.02}
        />
      ))}
      {[-0.3, -0.1, 0.1, 0.3].map((k) => (
        <path
          d={`M${n(k * art.w)} ${n(-art.h * 0.86)}l${n(-0.06)} ${n(-art.h * 0.18)}`}
          key={`fin-${k}`}
          opacity={0.5}
          stroke={paint.scale}
          strokeLinecap="round"
          strokeWidth={0.018}
        />
      ))}
      <circle
        cx={art.spot.x}
        cy={art.spot.y}
        fill={paint.taiyakiDeep}
        r={0.075}
      />
      <circle
        cx={art.spot.x}
        cy={art.spot.y}
        fill="none"
        r={0.075}
        stroke={paint.scale}
        strokeWidth={0.02}
      />
      <circle
        cx={art.spot.x - 0.02}
        cy={art.spot.y - 0.02}
        fill={paint.taiyakiCrisp}
        r={0.022}
      />
      <path
        d={`M${n(art.w * 0.92)} ${n(art.h * 0.02)}q${n(-0.08)} ${n(0.03)} ${n(-0.14)} ${n(0.09)}`}
        fill="none"
        stroke={paint.scale}
        strokeLinecap="round"
        strokeWidth={0.022}
      />
    </>
  );
};

const kakiArt = (art: Art) => {
  const turn = (art.phase * 180) / Math.PI;
  return (
    <>
      {[0, 1, 2, 3].map((k) => (
        <path
          d="M0.1 0Q0.5 0.04 0.9 0"
          fill="none"
          key={k}
          opacity={0.2}
          stroke={paint.kakiDeep}
          strokeLinecap="round"
          strokeWidth={0.04}
          transform={`rotate(${n(turn / 4 + 45 + k * 90)})`}
        />
      ))}
      <g
        transform={`translate(${n(art.spot.x)} ${n(art.spot.y)}) rotate(${n(turn)})`}
      >
        {[0, 90, 180, 270].map((k) => (
          <path
            d="M0 0C0.08-0.1 0.24-0.1 0.3 0C0.24 0.1 0.08 0.1 0 0Z"
            fill={paint.calyx}
            key={k}
            stroke={paint.calyxDry}
            strokeWidth={0.02}
            transform={`rotate(${k}) scale(${art.variant === 1 ? 0.85 : 1})`}
          />
        ))}
        <circle fill={paint.calyxDry} r={0.08} />
        <circle fill={paint.stem} r={0.045} />
      </g>
    </>
  );
};

const kamabokoArt = (art: Art) => (
  <>
    <path
      d={`M${n(-art.w)} ${n(art.spot.y)}A${n(art.w)} ${n(art.h)} 0 0 1 ${n(art.w)} ${n(art.spot.y)}`}
      fill="none"
      stroke={art.variant === 1 ? paint.pinkDeep : paint.pink}
      strokeWidth={art.phase * 2}
    />
    <ellipse
      cx={-art.w * 0.2}
      cy={art.spot.y - art.h * 0.55}
      fill={paint.light}
      opacity={0.5}
      rx={art.w * 0.4}
      ry={art.h * 0.15}
    />
  </>
);

const nerikiriArt = (art: Art, id: string) => {
  const tint = nerikiriTints[art.variant] ?? nerikiriTints[0];
  const petals = art.w;
  const turn = (art.phase * 180) / Math.PI;
  return (
    <>
      <defs>
        <radialGradient id={`${id}-petal`}>
          <stop offset="0" stopColor={tint[0]} />
          <stop offset="0.55" stopColor={tint[0]} />
          <stop offset="1" stopColor={tint[1]} />
        </radialGradient>
      </defs>
      <circle fill={`url(#${id}-petal)`} r={1.05} />
      {Array.from({ length: petals }, (_, k) => (
        <path
          d="M0.16 0Q0.42 0.05 0.72 0"
          fill="none"
          key={k}
          opacity={0.45}
          stroke={tint[2]}
          strokeLinecap="round"
          strokeWidth={0.02}
          transform={`rotate(${n(-turn + (k * 360) / petals)})`}
        />
      ))}
      {Array.from({ length: 7 }, (_, k) => (
        <circle
          cx={Math.cos((k / 7) * Math.PI * 2) * 0.1}
          cy={Math.sin((k / 7) * Math.PI * 2) * 0.1}
          fill={paint.egg}
          key={k}
          r={0.028}
        />
      ))}
      <circle fill={paint.eggDeep} r={0.04} />
    </>
  );
};

const sushiArt = (art: Art) => {
  const neta = netaTints[art.variant] ?? netaTints[0];
  const top = -art.h * 1.02 + art.phase * 0.5;
  return (
    <>
      {riceGrains(art)}
      <rect
        fill={paint.dark}
        height={art.h * 1.7}
        opacity={0.12}
        rx={art.h * 0.7}
        width={art.w * 1.94}
        x={-art.w * 0.97}
        y={top + 0.05}
      />
      <rect
        fill={neta[0]}
        height={art.h * 1.7}
        rx={art.h * 0.7}
        width={art.w * 1.94}
        x={-art.w * 0.97}
        y={top}
      />
      {art.variant === 0
        ? [-0.5, -0.1, 0.3].map((k) => (
            <path
              d={`M${n(k * art.w - 0.2)} ${n(top + 0.05)}q0.25 ${n(art.h * 0.8)} 0.05 ${n(art.h * 1.6)}`}
              fill="none"
              key={k}
              opacity={0.35}
              stroke={paint.maguroSinew}
              strokeWidth={0.025}
            />
          ))
        : null}
      {art.variant === 1
        ? [-0.7, -0.35, 0, 0.35, 0.7].map((k) => (
            <path
              d={`M${n(k * art.w - 0.12)} ${n(top)}l0.3 ${n(art.h * 1.7)}`}
              key={k}
              opacity={0.85}
              stroke={paint.salmonFat}
              strokeWidth={0.05}
            />
          ))
        : null}
      {art.variant === 2 ? (
        <>
          <circle
            cx={-art.w * 0.4}
            cy={top + art.h * 0.5}
            fill={paint.eggDeep}
            opacity={0.6}
            r={0.09}
          />
          <circle
            cx={art.w * 0.5}
            cy={top + art.h * 1.1}
            fill={paint.eggDeep}
            opacity={0.5}
            r={0.07}
          />
          <rect
            fill={paint.nori}
            height={art.h * 3}
            width={0.3}
            x={-0.15}
            y={-art.h * 1.5}
          />
          <path
            d={`M-0.1 ${n(-art.h * 1.5)}v${n(art.h * 3)}`}
            opacity={0.6}
            stroke={paint.noriSheen}
            strokeWidth={0.03}
          />
        </>
      ) : null}
      <rect
        fill={paint.light}
        height={art.h * 0.18}
        opacity={0.22}
        rx={art.h * 0.09}
        width={art.w * 1.2}
        x={-art.w * 0.6}
        y={top + art.h * 0.18}
      />
    </>
  );
};

const embossed = (d: string, key: string) => (
  <g key={key}>
    <path
      d={d}
      fill="none"
      opacity={0.75}
      stroke={paint.light}
      strokeLinecap="round"
      strokeWidth={0.026}
      transform="translate(-0.012 -0.012)"
    />
    <path
      d={d}
      fill="none"
      opacity={0.3}
      stroke={paint.dark}
      strokeLinecap="round"
      strokeWidth={0.026}
      transform="translate(0.012 0.012)"
    />
  </g>
);

const rakuganArt = (art: Art) => {
  const powder = art.grains.map((grain, i) => (
    <circle
      cx={grain.x}
      cy={grain.y}
      fill={i % 2 === 0 ? paint.light : paint.dark}
      key={`${grain.x}-${grain.y}`}
      opacity={i % 2 === 0 ? 0.6 : 0.07}
      r={grain.r}
    />
  ));
  if (art.variant < 4) {
    const { y } = art.spot;
    return (
      <>
        {powder}
        {embossed(
          `M-0.22 ${n(y - 0.05)}Q0 ${n(y + 0.04)} 0.22 ${n(y - 0.05)}`,
          "tie-a"
        )}
        {embossed(
          `M-0.22 ${n(y + 0.04)}Q0 ${n(y + 0.13)} 0.22 ${n(y + 0.04)}`,
          "tie-b"
        )}
        {embossed(`M0.08 ${n(y + 0.06)}q0.1 0.2 0.04 0.38`, "cord")}
        {embossed("M-0.05-0.9q0.05-0.08 0.12-0.06", "stem")}
        {embossed(`M-0.3 ${n(y + 0.5)}a0.4 0.4 0 0 0 0.2 0.4`, "shine")}
      </>
    );
  }
  const spread = art.w;
  const from = -Math.PI / 2 - spread / 2;
  const ribs = Array.from({ length: 7 }, (_, k) => {
    const a = from + ((k + 1) / 8) * spread;
    return `M${n(Math.cos(a) * art.h * 1.15)} ${n(Math.sin(a) * art.h * 1.15 + 0.5)}L${n(Math.cos(a) * 0.9)} ${n(Math.sin(a) * 0.9 + 0.5)}`;
  });
  return (
    <>
      {powder}
      {ribs.map((d, k) => embossed(d, `rib-${k}`))}
      {embossed(
        `M${n(Math.cos(from) * 0.9)} ${n(Math.sin(from) * 0.9 + 0.5)}A0.9 0.9 0 0 1 ${n(Math.cos(from + spread) * 0.9)} ${n(Math.sin(from + spread) * 0.9 + 0.5)}`,
        "edge"
      )}
    </>
  );
};

const arts: Record<Kind, (art: Art, id: string) => ReactNode> = {
  castella: castellaArt,
  daifuku: daifukuArt,
  kagami: kagamiArt,
  kaki: kakiArt,
  kamaboko: kamabokoArt,
  nerikiri: nerikiriArt,
  onigiri: onigiriArt,
  rakugan: rakuganArt,
  sushi: sushiArt,
  taiyaki: taiyakiArt,
  tofu: tofuArt,
  yokan: yokanArt,
};

const lightDefs = (scene: string) => (
  <defs>
    <radialGradient
      cx={-0.55}
      cy={-0.7}
      gradientUnits="userSpaceOnUse"
      id={`${scene}-light`}
      r={2.2}
    >
      <stop offset="0" stopColor={paint.light} stopOpacity={0.42} />
      <stop offset="0.38" stopColor={paint.light} stopOpacity={0} />
      <stop offset="0.75" stopColor={paint.dark} stopOpacity={0} />
      <stop offset="1" stopColor={paint.dark} stopOpacity={0.2} />
    </radialGradient>
    <radialGradient
      cx={0}
      cy={0}
      gradientUnits="userSpaceOnUse"
      id={`${scene}-dome`}
      r={1.02}
    >
      <stop offset="0.55" stopColor={paint.dark} stopOpacity={0} />
      <stop offset="1" stopColor={paint.dark} stopOpacity={0.2} />
    </radialGradient>
    <radialGradient
      cx={-0.42}
      cy={-0.5}
      gradientUnits="userSpaceOnUse"
      id={`${scene}-gloss`}
      r={0.42}
    >
      <stop offset="0" stopColor={paint.light} stopOpacity={0.55} />
      <stop offset="1" stopColor={paint.light} stopOpacity={0} />
    </radialGradient>
    <filter height="3" id={`${scene}-blur`} width="3" x="-1" y="-1">
      <feGaussianBlur stdDeviation={0.045} />
    </filter>
  </defs>
);

interface PieceProps {
  id: string;
  food: Food;
  points: readonly Point[];
  split: Split | null;
  faces: readonly Face[];
}

export const pieceSvg = ({ id, food, points, split, faces }: PieceProps) => {
  const look = looks[food.kind](food.art.variant);
  const by = depthOf(look);
  const line = split?.line ?? null;
  const top = ring(points);
  return (
    <g>
      {lightDefs(id)}
      <defs>
        <clipPath id={`${id}-top`}>
          <path d={top} />
        </clipPath>
      </defs>
      <path
        d={sweep(shift(points, { x: 0.035, y: 0.05 }), by, null)}
        fill={paint.dark}
        filter={`url(#${id}-blur)`}
        opacity={0.3}
      />
      {look.sides.map((band) => (
        <path
          d={sweep(points, scaled(by, band.to), line)}
          fill={band.colour}
          key={band.to}
        />
      ))}
      <path d={sweep(points, by, line)} fill={paint.dark} opacity={0.12} />
      {faces.map((face) => (
        <g key={`${face.from.x}-${face.from.y}`}>
          {look.inside.map((band) => (
            <path
              d={faceQuad(face, by, 0, band.to, 0)}
              fill={band.colour}
              key={band.to}
            />
          ))}
          {look.fillings.map((filling) => (
            <path
              d={faceQuad(face, by, filling.from, filling.to, filling.inset)}
              fill={filling.colour}
              key={`${filling.from}-${filling.inset}`}
              stroke={filling.colour}
              strokeLinejoin="round"
              strokeWidth={0.03}
            />
          ))}
          <path
            d={faceQuad(face, by, 0, 1, 0)}
            fill={paint.dark}
            opacity={0.06}
          />
          <path
            d={faceQuad(face, by, 0.55, 1, 0)}
            fill={paint.dark}
            opacity={0.1}
          />
        </g>
      ))}
      <g clipPath={`url(#${id}-top)`}>
        <path d={top} fill={look.top} />
        <g transform={placeOf(food)}>{arts[food.kind](food.art, id)}</g>
        {look.round ? <path d={top} fill={`url(#${id}-dome)`} /> : null}
        <path
          d={top}
          fill={`url(#${id}-light)`}
          opacity={Math.min(1, look.gloss * 0.8)}
        />
        {look.gloss > 1 ? (
          <path d={top} fill={`url(#${id}-gloss)`} opacity={look.gloss - 0.6} />
        ) : null}
        <path
          d={top}
          fill="none"
          opacity={0.45}
          stroke={look.rim}
          strokeWidth={0.05}
        />
      </g>
      {faces.map((face) => (
        <path
          d={`M${n(face.from.x)} ${n(face.from.y)}L${n(face.to.x)} ${n(face.to.y)}`}
          key={`edge-${face.from.x}-${face.from.y}`}
          opacity={0.7}
          stroke={paint.light}
          strokeLinecap="round"
          strokeWidth={0.012}
        />
      ))}
    </g>
  );
};

export const layersOf = (split: Split) => {
  const [plus, minus] = split.sides;
  const back = split.line.nx * LEAN + split.line.ny < 0;
  return [
    {
      faces: split.faces,
      key: back ? "plus" : "minus",
      side: back ? plus : minus,
      turn: back ? 1 : -1,
    },
    {
      faces: [],
      key: back ? "minus" : "plus",
      side: back ? minus : plus,
      turn: back ? -1 : 1,
    },
  ];
};

export const cutSvg = (
  scene: string,
  food: Food,
  split: Split | null,
  apart: number
) =>
  split === null
    ? pieceSvg({
        faces: [],
        id: scene,
        points: food.outline,
        food,
        split: null,
      })
    : layersOf(split).map(({ faces, key, side }) => (
        <g
          key={key}
          transform={`translate(${n(side.push.x * apart)} ${n(side.push.y * apart)})`}
        >
          {pieceSvg({
            faces,
            id: `${scene}-${key}`,
            points: side.points,
            food,
            split,
          })}
        </g>
      ));
