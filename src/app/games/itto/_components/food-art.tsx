import type { ReactNode } from "react";

import type { Art, Kind, Stick } from "../_lib/foods";
import type { Point } from "../_lib/geometry";
import { TAU, bend } from "../_lib/outline";
import { CAP_AT } from "../_lib/recipes";
import {
  makiFillings,
  nerikiriTints,
  netaTints,
  onigiriFillings,
  paint,
} from "./food-looks";

export const n = (value: number) => Math.round(value * 10_000) / 10_000;

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

const taiyakiArt = (art: Art, gold: boolean) => {
  const tail = -art.w;
  const scale = gold ? paint.goldDeep : paint.scale;
  const eye = gold ? paint.goldDeep : paint.taiyakiDeep;
  const glow = gold ? paint.goldLight : paint.taiyakiCrisp;
  return (
    <>
      <ellipse fill={glow} opacity={0.35} rx={art.w * 0.55} ry={art.h * 0.45} />
      {art.grains.map((grain) => (
        <path
          d={`M${n(grain.x - grain.r)} ${n(grain.y)}a${n(grain.r)} ${n(grain.r)} 0 0 0 ${n(grain.r * 2)} 0`}
          fill="none"
          key={`${grain.x}-${grain.y}`}
          opacity={0.6}
          stroke={scale}
          strokeWidth={0.018}
        />
      ))}
      <path
        d={`M${n(art.w * 0.42)} ${n(-art.h * 0.7)}q${n(-art.w * 0.14)} ${n(art.h * 0.7)} 0 ${n(art.h * 1.4)}`}
        fill="none"
        opacity={0.7}
        stroke={scale}
        strokeWidth={0.024}
      />
      {[-0.5, -0.25, 0, 0.25, 0.5].map((k) => (
        <path
          d={`M${n(tail + 0.02)} ${n(k * art.h * 0.3)}L${n(tail - 0.34)} ${n(k * art.h * 1.3)}`}
          key={k}
          opacity={0.55}
          stroke={scale}
          strokeLinecap="round"
          strokeWidth={0.02}
        />
      ))}
      {[-0.3, -0.1, 0.1, 0.3].map((k) => (
        <path
          d={`M${n(k * art.w)} ${n(-art.h * 0.86)}l${n(-0.06)} ${n(-art.h * 0.18)}`}
          key={`fin-${k}`}
          opacity={0.5}
          stroke={scale}
          strokeLinecap="round"
          strokeWidth={0.018}
        />
      ))}
      <circle cx={art.spot.x} cy={art.spot.y} fill={eye} r={0.075} />
      <circle
        cx={art.spot.x}
        cy={art.spot.y}
        fill="none"
        r={0.075}
        stroke={scale}
        strokeWidth={0.02}
      />
      <circle
        cx={art.spot.x - 0.02}
        cy={art.spot.y - 0.02}
        fill={glow}
        r={0.022}
      />
      <path
        d={`M${n(art.w * 0.92)} ${n(art.h * 0.02)}q${n(-0.08)} ${n(0.03)} ${n(-0.14)} ${n(0.09)}`}
        fill="none"
        stroke={scale}
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

interface Nigiri {
  w: number;
  h: number;
  bow: number;
  variant: number;
}

const nigiriArt = ({ w, h, bow, variant }: Nigiri) => {
  const neta = netaTints[variant] ?? netaTints[0];
  const top = -h * 1.02 + bow * 0.5;
  return (
    <>
      <rect
        fill={paint.dark}
        height={h * 1.7}
        opacity={0.12}
        rx={h * 0.7}
        width={w * 1.94}
        x={-w * 0.97}
        y={top + 0.05}
      />
      <rect
        fill={neta[0]}
        height={h * 1.7}
        rx={h * 0.7}
        width={w * 1.94}
        x={-w * 0.97}
        y={top}
      />
      {variant === 0
        ? [-0.5, -0.1, 0.3].map((k) => (
            <path
              d={`M${n(k * w - 0.2)} ${n(top + 0.05)}q0.25 ${n(h * 0.8)} 0.05 ${n(h * 1.6)}`}
              fill="none"
              key={k}
              opacity={0.35}
              stroke={paint.maguroSinew}
              strokeWidth={0.025}
            />
          ))
        : null}
      {variant === 1
        ? [-0.7, -0.35, 0, 0.35, 0.7].map((k) => (
            <path
              d={`M${n(k * w - 0.12)} ${n(top)}l0.3 ${n(h * 1.7)}`}
              key={k}
              opacity={0.85}
              stroke={paint.salmonFat}
              strokeWidth={0.05}
            />
          ))
        : null}
      {variant === 2 ? (
        <>
          <circle
            cx={-w * 0.4}
            cy={top + h * 0.5}
            fill={paint.eggDeep}
            opacity={0.6}
            r={0.09}
          />
          <circle
            cx={w * 0.5}
            cy={top + h * 1.1}
            fill={paint.eggDeep}
            opacity={0.5}
            r={0.07}
          />
          <rect
            fill={paint.nori}
            height={h * 3}
            width={0.3}
            x={-0.15}
            y={-h * 1.5}
          />
          <path
            d={`M-0.1 ${n(-h * 1.5)}v${n(h * 3)}`}
            opacity={0.6}
            stroke={paint.noriSheen}
            strokeWidth={0.03}
          />
        </>
      ) : null}
      <rect
        fill={paint.light}
        height={h * 0.18}
        opacity={0.22}
        rx={h * 0.09}
        width={w * 1.2}
        x={-w * 0.6}
        y={top + h * 0.18}
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

const sushiArt = (art: Art) => (
  <>
    {riceGrains(art)}
    {nigiriArt({ bow: art.phase, h: art.h, variant: art.variant, w: art.w })}
  </>
);

const nikanArt = (art: Art) => (
  <>
    {riceGrains(art)}
    {art.units.map((unit) => (
      <g
        key={`${unit.x}-${unit.y}`}
        transform={`translate(${n(unit.x)} ${n(unit.y)})`}
      >
        {nigiriArt({ bow: unit.a, h: art.h, variant: unit.variant, w: art.w })}
      </g>
    ))}
  </>
);

const curved = (curl: number, points: readonly Point[]) =>
  `M${bend(points, curl)
    .map((p) => `${n(p.x)} ${n(p.y)}`)
    .join("L")}`;

const run = (from: number, to: number, y: (x: number) => number, steps = 24) =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const x = from + ((to - from) * i) / steps;
    return { x, y: y(x) };
  });

const at = (curl: number, x: number, y: number) => bend([{ x, y }], curl)[0];

const spin = (curl: number, x: number) => n((x / curl) * (180 / Math.PI));

const sparkle = (x: number, y: number, r: number, key: string) => (
  <path
    d={`M${n(x)} ${n(y - r)}Q${n(x + r * 0.12)} ${n(y - r * 0.12)} ${n(x + r)} ${n(y)}Q${n(x + r * 0.12)} ${n(y + r * 0.12)} ${n(x)} ${n(y + r)}Q${n(x - r * 0.12)} ${n(y + r * 0.12)} ${n(x - r)} ${n(y)}Q${n(x - r * 0.12)} ${n(y - r * 0.12)} ${n(x)} ${n(y - r)}Z`}
    fill={paint.light}
    key={key}
    opacity={0.95}
  />
);

const kintaiArt = (art: Art, id: string) => (
  <>
    <defs>
      <linearGradient id={`${id}-gold`} x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stopColor={paint.goldLight} />
        <stop offset="0.45" stopColor={paint.gold} />
        <stop offset="1" stopColor={paint.goldDeep} />
      </linearGradient>
    </defs>
    <rect
      fill={`url(#${id}-gold)`}
      height={art.h * 4}
      opacity={0.85}
      width={art.w * 3}
      x={-art.w * 1.6}
      y={-art.h * 2}
    />
    {taiyakiArt(art, true)}
    <path
      d={`M${n(-art.w * 0.9)} ${n(-art.h * 0.2)}L${n(art.w * 0.2)} ${n(-art.h * 1.2)}`}
      opacity={0.35}
      stroke={paint.light}
      strokeLinecap="round"
      strokeWidth={0.12}
    />
    {sparkle(-art.w * 0.2, -art.h * 0.35, 0.11, "a")}
    {sparkle(art.w * 0.35, art.h * 0.3, 0.07, "b")}
    {sparkle(-art.w * 0.75, art.h * 0.2, 0.06, "c")}
  </>
);

const kashiwaArt = (art: Art) => {
  const r = art.w;
  const deep = art.h;
  const lobes = art.phase;
  return (
    <>
      <path
        d={`M${n(-r * 1.1)} -0.2H${n(r * 1.1)}V0.02Q0 0.07 ${n(-r * 1.1)} 0.02Z`}
        fill={paint.mochi}
      />
      <path
        d={`M${n(-r * 1.1)} 0.03Q0 0.08 ${n(r * 1.1)} 0.03`}
        fill="none"
        opacity={0.25}
        stroke={paint.oakDeep}
        strokeWidth={0.03}
      />
      <ellipse
        cx={-r * 0.25}
        cy={deep * r * 0.35}
        fill={paint.light}
        opacity={0.1}
        rx={r * 0.55}
        ry={deep * r * 0.22}
      />
      <path
        d={`M${n(-r * 0.95)} 0.075Q0 0.11 ${n(r * 0.95)} 0.075`}
        fill="none"
        opacity={0.8}
        stroke={paint.leafVein}
        strokeLinecap="round"
        strokeWidth={0.026}
      />
      {Array.from({ length: lobes }, (_, k) => {
        const a = ((k + 0.5) / lobes) * Math.PI;
        const tip = {
          x: Math.cos(a) * r * 0.88,
          y: Math.sin(a) * r * deep * 0.88,
        };
        const start = { x: Math.cos(a) * r * 0.3, y: 0.09 };
        return (
          <path
            d={`M${n(start.x)} ${n(start.y)}Q${n((start.x + tip.x) / 2 + Math.cos(a) * 0.08)} ${n((start.y + tip.y) / 2)} ${n(tip.x)} ${n(tip.y)}`}
            fill="none"
            key={k}
            opacity={0.55}
            stroke={paint.leafVein}
            strokeLinecap="round"
            strokeWidth={0.018}
          />
        );
      })}
    </>
  );
};

const gyozaArt = (art: Art, id: string) => {
  const curl = art.phase;
  const toast = at(curl, 0, art.h * 0.15);
  const browned = art.variant === 1;
  return (
    <>
      <defs>
        <radialGradient id={`${id}-toast`}>
          <stop
            offset="0"
            stopColor={paint.gyozaBrown}
            stopOpacity={browned ? 0.95 : 0.35}
          />
          <stop
            offset="0.6"
            stopColor={paint.gyozaBrown}
            stopOpacity={browned ? 0.55 : 0.12}
          />
          <stop offset="1" stopColor={paint.gyozaBrown} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse
        cx={toast.x}
        cy={toast.y}
        fill={`url(#${id}-toast)`}
        rx={art.w * (browned ? 0.95 : 0.8)}
        ry={art.h * (browned ? 0.9 : 0.6)}
        transform={`rotate(${spin(curl, 0)} ${n(toast.x)} ${n(toast.y)})`}
      />
      {art.grains.map((grain) => {
        const end = {
          x: grain.x + Math.cos(grain.a) * grain.r,
          y: grain.y + Math.sin(grain.a) * grain.r,
        };
        const bow = {
          x: (grain.x + end.x) / 2 - Math.sin(grain.a) * 0.04,
          y: (grain.y + end.y) / 2 + Math.cos(grain.a) * 0.04,
        };
        const d = `M${n(grain.x)} ${n(grain.y)}Q${n(bow.x)} ${n(bow.y)} ${n(end.x)} ${n(end.y)}`;
        return (
          <g key={`${grain.x}-${grain.y}`}>
            <path
              d={d}
              fill="none"
              opacity={0.3}
              stroke={browned ? paint.soyDeep : paint.gyozaSide}
              strokeLinecap="round"
              strokeWidth={0.03}
            />
            <path
              d={d}
              fill="none"
              opacity={0.6}
              stroke={paint.light}
              strokeLinecap="round"
              strokeWidth={0.012}
              transform="translate(-0.018 -0.01)"
            />
          </g>
        );
      })}
    </>
  );
};

const mikanArt = (art: Art) => {
  const curl = art.phase;
  const L = art.w;
  const width = (x: number) => art.h * Math.sqrt(Math.max(0, 1 - (x / L) ** 2));
  return (
    <>
      {[0.25, 0.5, 0.75].map((k) => (
        <path
          d={curved(
            curl,
            run(-L * 0.75, L * 0.75, (x) => -width(x) * k)
          )}
          fill="none"
          key={k}
          opacity={0.22}
          stroke={paint.mikanInside}
          strokeLinecap="round"
          strokeWidth={0.07}
        />
      ))}
      <path
        d={curved(
          curl,
          run(-L * 0.6, L * 0.55, (x) => -width(x) * 0.62)
        )}
        fill="none"
        opacity={0.4}
        stroke={paint.light}
        strokeLinecap="round"
        strokeWidth={0.05}
      />
      {art.grains.map((grain) => {
        const from = (grain.x - grain.r / 2) * L;
        const to = (grain.x + grain.r / 2) * L;
        return (
          <path
            d={curved(
              curl,
              run(from, to, (x) => -width(x) * grain.a + Math.sin(x * 9) * 0.02)
            )}
            fill="none"
            key={`${grain.x}-${grain.a}`}
            opacity={0.85}
            stroke={paint.pith}
            strokeLinecap="round"
            strokeWidth={grain.y}
          />
        );
      })}
    </>
  );
};

const chikuwaArt = (art: Art) => {
  const curl = art.phase;
  const L = art.w;
  return (
    <>
      <path
        d={curved(
          curl,
          run(-L * 0.78, L * 0.78, () => 0)
        )}
        fill="none"
        opacity={0.85}
        stroke={paint.chikuwaBrown}
        strokeLinecap="round"
        strokeWidth={art.h * 1.7}
      />
      {art.grains.map((grain, i) => (
        <ellipse
          fill={i % 3 === 0 ? paint.chikuwaDeep : paint.chikuwa}
          key={`${grain.x}-${grain.y}`}
          opacity={i % 3 === 0 ? 0.4 : 0.3}
          rx={grain.r * 1.5}
          ry={grain.r * 0.75}
          transform={`translate(${n(grain.x)} ${n(grain.y)}) rotate(${n(grain.a)})`}
        />
      ))}
      <path
        d={curved(
          curl,
          run(-L * 0.85, L * 0.85, () => -art.h * 0.5)
        )}
        fill="none"
        opacity={0.35}
        stroke={paint.light}
        strokeLinecap="round"
        strokeWidth={0.04}
      />
    </>
  );
};

const ebitenArt = (art: Art) => (
  <>
    {art.grains.map((grain, i) => (
      <g key={`${grain.x}-${grain.y}`}>
        <circle
          cx={grain.x + 0.012}
          cy={grain.y + 0.016}
          fill={paint.batterDeep}
          opacity={0.5}
          r={grain.r}
        />
        <circle
          cx={grain.x}
          cy={grain.y}
          fill={i % 4 === 0 ? paint.batterDeep : paint.batterLight}
          opacity={0.9}
          r={grain.r * 0.85}
        />
      </g>
    ))}
    <g
      transform={`translate(${n(art.spot.x)} ${n(art.spot.y)}) rotate(${n((art.phase * 180) / Math.PI)})`}
    >
      <path
        d="M0.12-0.035L-0.12-0.19Q-0.21-0.1-0.18 0Q-0.21 0.1-0.12 0.19L0.12 0.035Z"
        fill={paint.prawnRed}
      />
      <path
        d="M0.1 0L-0.17 0M0.1-0.012L-0.13-0.13M0.1 0.012L-0.13 0.13"
        opacity={0.5}
        stroke={paint.salmonFat}
        strokeLinecap="round"
        strokeWidth={0.016}
      />
      <path
        d="M-0.12-0.19Q-0.21-0.1-0.18 0Q-0.21 0.1-0.12 0.19"
        fill="none"
        opacity={0.6}
        stroke={paint.ume}
        strokeWidth={0.02}
      />
      <ellipse cx={0.16} fill={paint.batter} rx={0.1} ry={0.09} />
    </g>
  </>
);

const sanmaArt = (art: Art) => {
  const curl = art.phase;
  const L = art.w;
  const fat = art.h;
  const eye = at(curl, L * 0.8, -fat * 0.12);
  return (
    <>
      <path
        d={curved(
          curl,
          run(-L, L * 0.95, (x) => -fat * 0.55 + (x / L) * fat * 0.05)
        )}
        fill="none"
        stroke={paint.back}
        strokeWidth={fat * 1.15}
      />
      <path
        d={curved(
          curl,
          run(-L * 0.85, L * 0.66, () => -fat * 0.02)
        )}
        fill="none"
        opacity={0.55}
        stroke={paint.light}
        strokeWidth={0.02}
      />
      <path
        d={curved(
          curl,
          run(-L * 0.8, L * 0.6, () => fat * 0.4)
        )}
        fill="none"
        opacity={0.35}
        stroke={paint.light}
        strokeLinecap="round"
        strokeWidth={0.05}
      />
      {art.grains.map((grain) => {
        const centre = at(curl, grain.x, 0);
        return (
          <g
            key={grain.x}
            transform={`translate(${n(centre.x)} ${n(centre.y)}) rotate(${n(spin(curl, grain.x) + grain.a)})`}
          >
            <path
              d={`M-0.06 ${n(-fat * 1.2)}L0.06 ${n(fat * 1.2)}`}
              opacity={0.6 * grain.r}
              stroke={paint.char}
              strokeLinecap="round"
              strokeWidth={0.07}
            />
            <path
              d={`M0.04 ${n(-fat * 1.1)}L0.13 ${n(fat * 0.6)}`}
              opacity={0.45 * grain.r}
              stroke={paint.char}
              strokeLinecap="round"
              strokeWidth={0.04}
            />
          </g>
        );
      })}
      <path
        d={curved(
          curl,
          run(L * 0.66, L * 0.7, (x) => (x - L * 0.68) * 6 - fat * 0.1, 6)
        )}
        fill="none"
        opacity={0.5}
        stroke={paint.char}
        strokeWidth={0.02}
      />
      <path
        d={curved(curl, [
          { x: L * 0.69, y: -fat * 0.75 },
          { x: L * 0.64, y: 0 },
          { x: L * 0.69, y: fat * 0.8 },
        ])}
        fill="none"
        opacity={0.55}
        stroke={paint.char}
        strokeLinejoin="round"
        strokeWidth={0.02}
      />
      <circle cx={eye.x} cy={eye.y} fill={paint.light} r={0.05} />
      <circle cx={eye.x + 0.006} cy={eye.y} fill={paint.char} r={0.032} />
      <circle
        cx={eye.x - 0.01}
        cy={eye.y - 0.012}
        fill={paint.light}
        r={0.01}
      />
      <circle
        cx={at(curl, L, 0).x}
        cy={at(curl, L, 0).y}
        fill={paint.beak}
        r={0.04}
      />
      <path
        d={curved(
          curl,
          run(-L * 1.1, -L * 0.86, () => 0, 4)
        )}
        fill="none"
        opacity={0.85}
        stroke={paint.back}
        strokeWidth={fat * 2}
      />
    </>
  );
};

const nasuArt = (art: Art) => {
  const curl = art.phase;
  const L = art.w;
  const fat = art.h;
  return (
    <>
      <path
        d={curved(
          curl,
          run(
            -L * 0.8,
            L * 0.45,
            (x) => -fat * 0.42 * Math.sqrt(Math.max(0, 1 - (x / L) ** 2))
          )
        )}
        fill="none"
        opacity={0.55}
        stroke={paint.nasuSheen}
        strokeLinecap="round"
        strokeWidth={0.055}
      />
      <path
        d={curved(
          curl,
          run(
            -L * 0.55,
            L * 0.1,
            (x) => -fat * 0.2 * Math.sqrt(Math.max(0, 1 - (x / L) ** 2))
          )
        )}
        fill="none"
        opacity={0.25}
        stroke={paint.light}
        strokeLinecap="round"
        strokeWidth={0.03}
      />
      <g
        transform={`translate(${n(art.spot.x)} ${n(art.spot.y)}) rotate(${spin(curl, L * 0.7)})`}
      >
        <path
          d="M0.4-0.05L0.06-0.24L-0.15-0.22L-0.02-0.14L-0.22-0.08L-0.05-0.03L-0.24 0.03L-0.05 0.07L-0.2 0.15L-0.02 0.17L0.06 0.24L0.4 0.05Z"
          fill={paint.calyx}
          stroke={paint.cucumber}
          strokeLinejoin="round"
          strokeOpacity={0.5}
          strokeWidth={0.016}
        />
        <path
          d="M0.32-0.03Q0.1-0.08-0.12-0.17M0.32 0.03Q0.1 0.08-0.12 0.15M0.32 0L-0.15 0.01"
          fill="none"
          opacity={0.5}
          stroke={paint.matcha}
          strokeWidth={0.014}
        />
        <rect
          fill={paint.calyxDry}
          height={0.07}
          rx={0.02}
          width={0.2}
          x={0.3}
          y={-0.035}
        />
      </g>
    </>
  );
};

const takenokoArt = (art: Art) => {
  const curl = art.phase;
  const L = art.w;
  const fat = art.h;
  const sheaths = art.variant;
  return (
    <>
      {Array.from({ length: sheaths }, (_, i) => {
        const k = sheaths - 1 - i;
        const x = -L * 0.95 + (k / sheaths) * L * 1.7;
        const reach = L * 0.5;
        const tip = (k % 2 === 0 ? 1 : -1) * fat * 0.18;
        const edge = (side: number) =>
          run(
            0,
            1,
            (t) => tip + (side * fat * 1.2 - tip) * (1 - t ** 1.5),
            12
          ).map(({ x: t, y }) => ({ x: x + reach * t, y }));
        const d = `${curved(curl, [
          { x: x - 0.6, y: -fat * 1.2 },
          ...edge(-1),
          ...edge(1).toReversed(),
          { x: x - 0.6, y: fat * 1.2 },
        ])}Z`;
        return (
          <g key={k}>
            <path
              d={d}
              fill={k % 2 === 0 ? paint.sheath : paint.batterDeep}
              stroke={paint.sheathDeep}
              strokeLinejoin="round"
              strokeOpacity={0.8}
              strokeWidth={0.03}
            />
            <path
              d={d}
              fill="none"
              opacity={0.4}
              stroke={paint.crisp}
              strokeLinejoin="round"
              strokeWidth={0.012}
              transform="translate(-0.02 0)"
            />
          </g>
        );
      })}
      <path
        d={curved(
          curl,
          run(L * 0.62, L, () => 0, 8)
        )}
        fill="none"
        opacity={0.7}
        stroke={paint.beak}
        strokeWidth={fat * 0.7}
      />
      {art.grains.map((grain) => (
        <ellipse
          cx={grain.x}
          cy={grain.y}
          fill={paint.char}
          key={`${grain.x}-${grain.y}`}
          opacity={0.55}
          rx={grain.r * 1.4}
          ry={grain.r * 0.8}
          transform={`rotate(${n(grain.a)} ${n(grain.x)} ${n(grain.y)})`}
        />
      ))}
      <path
        d={curved(
          curl,
          run(-L * 1.02, -L * 0.9, () => 0, 4)
        )}
        fill="none"
        opacity={0.7}
        stroke={paint.chiai}
        strokeWidth={fat * 2}
      />
    </>
  );
};

const ninjinArt = (art: Art) => {
  const deep = art.h;
  const twist = art.variant === 0;
  return (
    <g transform={`rotate(${n((-art.phase * 180) / Math.PI)})`}>
      {Array.from({ length: 5 }, (_, k) => {
        const notch = (k / 5) * TAU;
        const mid = notch + TAU / 10;
        const edge = 0.95 - deep;
        const from = { x: Math.cos(notch) * edge, y: Math.sin(notch) * edge };
        const bow = {
          x: Math.cos(notch + 0.55) * 0.42,
          y: Math.sin(notch + 0.55) * 0.42,
        };
        const crest = { x: Math.cos(mid) * 0.96, y: Math.sin(mid) * 0.96 };
        return twist ? (
          <g key={k}>
            <path
              d={`M0 0Q${n(bow.x)} ${n(bow.y)} ${n(from.x)} ${n(from.y)}Q${n((from.x + crest.x) * 0.62)} ${n((from.y + crest.y) * 0.62)} ${n(crest.x)} ${n(crest.y)}Z`}
              fill={paint.carrotDeep}
              opacity={0.32}
            />
            <path
              d={`M0 0Q${n(bow.x)} ${n(bow.y)} ${n(from.x)} ${n(from.y)}`}
              fill="none"
              opacity={0.45}
              stroke={paint.carrotCore}
              strokeWidth={0.018}
            />
          </g>
        ) : (
          <path
            d={`M${n(from.x * 0.4)} ${n(from.y * 0.4)}L${n(from.x * 0.95)} ${n(from.y * 0.95)}`}
            key={k}
            opacity={0.35}
            stroke={paint.carrotDeep}
            strokeLinecap="round"
            strokeWidth={0.02}
          />
        );
      })}
      <circle fill={paint.carrotCore} opacity={0.55} r={0.3} />
      <circle fill={paint.carrotCore} opacity={0.45} r={0.16} />
    </g>
  );
};

const dorayakiArt = (art: Art, id: string) => (
  <>
    <defs>
      <radialGradient id={`${id}-dora`}>
        <stop offset="0" stopColor={paint.doraDeep} />
        <stop offset="0.55" stopColor={paint.dora} />
        <stop offset="0.84" stopColor={paint.chikuwaBrown} />
        <stop offset="1" stopColor={paint.doraRim} />
      </radialGradient>
    </defs>
    <ellipse fill={`url(#${id}-dora)`} rx={art.w * 0.98} ry={0.98} />
    {art.grains.map((grain) => (
      <circle
        cx={grain.x}
        cy={grain.y}
        fill={paint.doraDeep}
        key={`${grain.x}-${grain.y}`}
        opacity={0.35}
        r={grain.r}
      />
    ))}
    {art.variant === 1 ? (
      <g opacity={0.6} transform={`rotate(${n((art.phase * 180) / Math.PI)})`}>
        <circle
          fill="none"
          r={0.3}
          stroke={paint.kuriDeep}
          strokeWidth={0.035}
        />
        {Array.from({ length: 5 }, (_, k) => (
          <circle
            cx={Math.cos((k / 5) * TAU) * 0.13}
            cy={Math.sin((k / 5) * TAU) * 0.13}
            fill={paint.kuriDeep}
            key={k}
            r={0.07}
          />
        ))}
      </g>
    ) : null}
    {biteMark(art, paint.cake, 0.2)}
    {biteMark(art, paint.anko, 0.08)}
  </>
);

const edamameArt = (art: Art) => {
  const curl = art.phase;
  const L = art.w;
  const beans = art.units.length;
  return (
    <>
      <path
        d={curved(
          curl,
          run(
            -L * 0.9,
            L * 0.9,
            (x) => art.h * 0.9 * Math.sqrt(Math.max(0, 1 - (x / L) ** 2))
          )
        )}
        fill="none"
        opacity={0.35}
        stroke={paint.podDeep}
        strokeWidth={0.025}
      />
      {art.units.map((unit) => (
        <g
          key={unit.a}
          transform={`translate(${n(unit.x)} ${n(unit.y)}) rotate(${spin(curl, unit.a)})`}
        >
          <ellipse
            fill={paint.podBean}
            opacity={0.3}
            rx={(L / beans) * 0.75}
            ry={unit.r * 0.72}
          />
          <ellipse
            cx={-0.04}
            cy={-unit.r * 0.3}
            fill={paint.light}
            opacity={0.3}
            rx={(L / beans) * 0.4}
            ry={unit.r * 0.18}
          />
        </g>
      ))}
      {art.units.slice(1).map((unit, k) => {
        const x = (unit.a + art.units[k].a) / 2;
        return (
          <path
            d={curved(curl, [
              { x: x - 0.02, y: -art.h * 1.2 },
              { x, y: 0 },
              { x: x - 0.02, y: art.h * 1.2 },
            ])}
            fill="none"
            key={x}
            opacity={0.35}
            stroke={paint.podDeep}
            strokeWidth={0.03}
          />
        );
      })}
      {art.grains.map((grain) => (
        <rect
          fill={paint.light}
          height={grain.r}
          key={`${grain.x}-${grain.y}`}
          opacity={0.9}
          transform={`rotate(${n(grain.a)} ${n(grain.x)} ${n(grain.y)})`}
          width={grain.r}
          x={grain.x - grain.r / 2}
          y={grain.y - grain.r / 2}
        />
      ))}
    </>
  );
};

const narutoArt = (art: Art) => {
  const turns = 2.6;
  const points = Array.from({ length: 120 }, (_, i) => {
    const t = (i / 119) * turns * TAU;
    const r = 0.06 + (t / (turns * TAU)) * 0.66;
    return `${n(Math.cos(t) * r)} ${n(Math.sin(t) * r)}`;
  });
  return (
    <g
      transform={`scale(${n(art.w)} 1) rotate(${n((art.phase * 180) / Math.PI)})`}
    >
      <path
        d={`M${points.join("L")}`}
        fill="none"
        stroke={paint.pink}
        strokeLinecap="round"
        strokeWidth={art.variant === 1 ? 0.12 : 0.09}
      />
      <path
        d={`M${points.join("L")}`}
        fill="none"
        opacity={0.3}
        stroke={paint.pinkDeep}
        strokeLinecap="round"
        strokeWidth={0.03}
        transform="translate(0.01 0.012)"
      />
    </g>
  );
};

const kuriArt = (art: Art) => {
  const curl = art.phase;
  const L = art.w;
  const fat = art.h;
  const seat = [
    ...run(-L * 1.05, -L * 0.62, () => -fat * 1.1, 4),
    ...run(-fat * 1.1, fat * 1.1, (y) => y, 24).map((p) => ({
      x: -L * 0.62 + Math.sin(p.y * 14) * 0.025,
      y: p.y,
    })),
    ...run(-L * 0.62, -L * 1.05, () => fat * 1.1, 4),
  ];
  return (
    <>
      {[-0.55, -0.25, 0.1, 0.4].map((k) => (
        <path
          d={curved(
            curl,
            run(
              -L * 0.55,
              L * 0.85,
              (x) => k * fat * (1 - ((x + L * 0.55) / (L * 1.4)) ** 1.5)
            )
          )}
          fill="none"
          key={k}
          opacity={0.35}
          stroke={paint.scale}
          strokeLinecap="round"
          strokeWidth={0.03}
        />
      ))}
      <path d={`${curved(curl, seat)}Z`} fill={paint.kuriBottom} />
      <path
        d={`${curved(curl, seat)}Z`}
        fill="none"
        opacity={0.35}
        stroke={paint.kuriDeep}
        strokeWidth={0.02}
      />
      <circle
        cx={at(curl, L * 0.96, 0).x}
        cy={at(curl, L * 0.96, 0).y}
        fill={paint.kuriBottom}
        r={0.035}
      />
    </>
  );
};

const dangoArt = (art: Art) =>
  art.units.map((unit) => (
    <g key={unit.x}>
      {unit.variant === 2
        ? [0, 1, 2, 3, 4, 5].map((k) => (
            <circle
              cx={unit.x + Math.cos(unit.a + k * 1.7) * unit.r * 0.55}
              cy={unit.y + Math.sin(unit.a + k * 1.7) * unit.r * 0.5}
              fill={paint.yomogiInside}
              key={k}
              opacity={0.8}
              r={0.018}
            />
          ))
        : null}
      <ellipse
        cx={unit.x - unit.r * 0.3}
        cy={unit.y - unit.r * 0.38}
        fill={paint.light}
        opacity={0.5}
        rx={unit.r * 0.3}
        ry={unit.r * 0.17}
        transform={`rotate(-28 ${n(unit.x - unit.r * 0.3)} ${n(unit.y - unit.r * 0.38)})`}
      />
    </g>
  ));

const yakitoriArt = (art: Art) =>
  art.units.map((unit) =>
    unit.variant === 1 ? (
      <g key={unit.x} transform={`translate(${n(unit.x)} ${n(unit.y)})`}>
        {[-0.08, 0, 0.08].map((k) => (
          <path
            d={`M${n(k)} -0.24V0.24`}
            key={k}
            opacity={0.3}
            stroke={paint.negiWhiteSide}
            strokeWidth={0.02}
          />
        ))}
        <path
          d="M-0.16-0.12L0.16-0.06M-0.16 0.08L0.16 0.14"
          opacity={0.55}
          stroke={paint.char}
          strokeLinecap="round"
          strokeWidth={0.04}
        />
      </g>
    ) : (
      <g
        key={unit.x}
        transform={`translate(${n(unit.x)} ${n(unit.y)}) rotate(${n((unit.a * 180) / Math.PI)})`}
      >
        {[-0.09, 0.07].map((k) => (
          <path
            d={`M-0.3 ${n(k)}Q0 ${n(k - 0.05)} 0.3 ${n(k + 0.02)}`}
            fill="none"
            key={k}
            opacity={0.32}
            stroke={paint.char}
            strokeLinecap="round"
            strokeWidth={0.05}
          />
        ))}
        {art.variant === 1
          ? [0, 1, 2, 3, 4, 5, 6].map((k) => (
              <rect
                fill={paint.light}
                height={0.022}
                key={k}
                opacity={0.9}
                transform={`rotate(${k * 33})`}
                width={0.022}
                x={Math.cos(k * 1.3) * 0.16}
                y={Math.sin(k * 1.3) * 0.13}
              />
            ))
          : null}
      </g>
    )
  );

const senbeiArt = (art: Art, id: string) => (
  <>
    <defs>
      {art.units.map((unit, k) => (
        <clipPath id={`${id}-cracker-${k}`} key={unit.x}>
          <circle cx={unit.x} cy={unit.y} r={unit.r * 1.06} />
        </clipPath>
      ))}
    </defs>
    {art.grains.map((grain) => (
      <g key={`${grain.x}-${grain.y}`}>
        <circle
          cx={grain.x + 0.01}
          cy={grain.y + 0.012}
          fill={paint.soyDeep}
          opacity={0.35}
          r={grain.r}
        />
        <circle
          cx={grain.x}
          cy={grain.y}
          fill={paint.light}
          opacity={0.18}
          r={grain.r * 0.8}
        />
      </g>
    ))}
    {art.units.map((unit, k) => (
      <g clipPath={`url(#${id}-cracker-${k})`} key={unit.x}>
        {unit.variant === 1 ? (
          <g
            transform={`translate(${n(unit.x)} ${n(unit.y)}) rotate(${n((unit.a * 180) / Math.PI)})`}
          >
            <rect
              fill={paint.nori}
              height={unit.r * 0.75}
              width={unit.r * 2.4}
              x={-unit.r * 1.2}
              y={-unit.r * 0.375}
            />
            <path
              d={`M${n(-unit.r)} ${n(-unit.r * 0.1)}H${n(unit.r)}M${n(-unit.r)} ${n(unit.r * 0.15)}H${n(unit.r)}`}
              opacity={0.6}
              stroke={paint.noriSheen}
              strokeWidth={0.025}
            />
          </g>
        ) : null}
        {unit.variant === 2
          ? Array.from({ length: 14 }, (_, i) => (
              <rect
                fill={paint.goldLight}
                height={0.035}
                key={i}
                opacity={0.85}
                transform={`rotate(${n(i * 37)} ${n(unit.x + Math.cos(unit.a + i * 2.4) * unit.r * 0.07 * ((i % 7) + 3))} ${n(unit.y + Math.sin(unit.a + i * 2.4) * unit.r * 0.07 * ((i % 7) + 3))})`}
                width={0.035}
                x={
                  unit.x +
                  Math.cos(unit.a + i * 2.4) * unit.r * 0.07 * ((i % 7) + 3)
                }
                y={
                  unit.y +
                  Math.sin(unit.a + i * 2.4) * unit.r * 0.07 * ((i % 7) + 3)
                }
              />
            ))
          : null}
        {unit.variant === 3
          ? Array.from({ length: 9 }, (_, i) => (
              <ellipse
                cx={
                  unit.x + Math.cos(unit.a + i * 2.2) * unit.r * 0.08 * (i + 1)
                }
                cy={
                  unit.y + Math.sin(unit.a + i * 2.2) * unit.r * 0.08 * (i + 1)
                }
                fill={paint.sesame}
                key={i}
                rx={0.02}
                ry={0.01}
                transform={`rotate(${n(i * 41)} ${n(unit.x + Math.cos(unit.a + i * 2.2) * unit.r * 0.08 * (i + 1))} ${n(unit.y + Math.sin(unit.a + i * 2.2) * unit.r * 0.08 * (i + 1))})`}
              />
            ))
          : null}
      </g>
    ))}
  </>
);

const makiArt = (art: Art) => {
  const filling = makiFillings[art.variant] ?? makiFillings[0];
  return (
    <>
      {riceGrains(art)}
      {art.units.map((unit) => (
        <g
          key={unit.x}
          transform={`translate(${n(unit.x)} ${n(unit.y)}) rotate(${n((unit.a * 180) / Math.PI)})`}
        >
          <circle
            fill="none"
            r={unit.r * 0.97}
            stroke={paint.nori}
            strokeWidth={unit.r * 0.14}
          />
          {art.variant === 2 ? (
            [-1, 0, 1].map((k) => (
              <rect
                fill={filling[0]}
                height={unit.r * 0.16}
                key={k}
                rx={unit.r * 0.05}
                width={unit.r * 0.52}
                x={-unit.r * 0.26}
                y={k * unit.r * 0.18 - unit.r * 0.08}
              />
            ))
          ) : (
            <rect
              fill={filling[0]}
              height={unit.r * 0.6}
              rx={unit.r * (art.variant === 1 ? 0.3 : 0.08)}
              width={unit.r * 0.6}
              x={-unit.r * 0.3}
              y={-unit.r * 0.3}
            />
          )}
          {art.variant === 2 ? null : (
            <rect
              fill={filling[1]}
              height={unit.r * 0.32}
              opacity={art.variant === 1 ? 1 : 0.45}
              rx={unit.r * (art.variant === 1 ? 0.16 : 0.05)}
              width={unit.r * 0.32}
              x={-unit.r * 0.16}
              y={-unit.r * 0.16}
            />
          )}
        </g>
      ))}
    </>
  );
};

const fujiArt = (art: Art, id: string) => {
  const L = art.w;
  const tall = art.h;
  const red = art.variant === 1;
  const snow = 0.6;
  const edge = 1 - (1 - art.phase) * snow ** (2 / 3);
  const teeth = Array.from({ length: 13 }, (_, i) => {
    const t = -edge + (2 * edge * i) / 12;
    const drop = i % 2 === 0 ? 0 : 0.12 + 0.06 * Math.cos(i * 1.7);
    return { x: t * L, y: -tall * snow + drop };
  });
  return (
    <>
      <defs>
        <linearGradient id={`${id}-fuji`} x1="0" x2="0" y1="0" y2="1">
          <stop
            offset="0"
            stopColor={red ? paint.carrotCore : paint.fujiLight}
          />
          <stop offset="0.55" stopColor={red ? paint.carrotDeep : paint.fuji} />
          <stop offset="1" stopColor={red ? paint.ume : paint.fujiDeep} />
        </linearGradient>
      </defs>
      <rect
        fill={`url(#${id}-fuji)`}
        height={tall + 0.4}
        width={L * 2.4}
        x={-L * 1.2}
        y={-tall - 0.1}
      />
      <path
        d={`M${n(-L * edge - 0.1)} ${n(-tall - 0.2)}H${n(L * edge + 0.1)}V${n(-tall * snow)}${teeth
          .toReversed()
          .map((p) => `L${n(p.x)} ${n(p.y)}`)
          .join("")}Z`}
        fill={paint.white}
      />
      <path
        d={`M${n(-L * 1.2)} 0.06Q${n(-L * 0.5)} -0.06 0 0.04T${n(L * 1.2)} 0.02V0.3H${n(-L * 1.2)}Z`}
        fill={paint.light}
        opacity={0.28}
      />
      {art.grains.map((grain) => (
        <rect
          fill={paint.gold}
          height={grain.r}
          key={`${grain.x}-${grain.y}`}
          transform={`rotate(${n(grain.a)} ${n(grain.x)} ${n(grain.y)})`}
          width={grain.r * 1.3}
          x={grain.x}
          y={grain.y}
        />
      ))}
    </>
  );
};

const nekoArt = (art: Art) => {
  const stretch = art.w;
  const black = art.variant === 2;
  const feature = black ? paint.goldLight : paint.char;
  const tip = 0.8 + art.h * 0.62;
  const point = (angle: number, r: number) =>
    `${n(Math.cos(angle) * r * stretch)} ${n(Math.sin(angle) * r)}`;
  const ears = [-1, 1].map((side) => {
    const a = -Math.PI / 2 + side * art.phase;
    return {
      d: `M${point(a, tip)}L${point(a - 0.2, 0.74)}L${point(a + 0.2, 0.74)}Z`,
      side,
    };
  });
  return (
    <>
      {art.variant === 1 ? (
        <>
          <ellipse
            cx={-0.55 * stretch}
            cy={-0.55}
            fill={paint.chestnut}
            rx={0.55}
            ry={0.45}
          />
          <ellipse
            cx={0.6 * stretch + art.spot.x * 0.2}
            cy={-0.6 + art.spot.y * 0.3}
            fill={paint.nekoBlack}
            rx={0.4}
            ry={0.34}
          />
        </>
      ) : null}
      {ears.map((ear) => (
        <path
          d={ear.d}
          fill={black ? paint.pinkDeep : paint.sakura}
          key={ear.side}
          opacity={black ? 0.55 : 0.9}
          stroke={black ? paint.pinkDeep : paint.sakura}
          strokeLinejoin="round"
          strokeWidth={0.05}
        />
      ))}
      {[-1, 1].map((side) =>
        black ? (
          <g key={side}>
            <ellipse
              cx={side * 0.3 * stretch}
              cy={-0.02}
              fill={paint.egg}
              rx={0.1}
              ry={0.12}
            />
            <ellipse
              cx={side * 0.3 * stretch}
              cy={-0.02}
              fill={paint.char}
              rx={0.03}
              ry={0.1}
            />
          </g>
        ) : (
          <path
            d={`M${n(side * 0.3 * stretch - 0.11)} 0.02Q${n(side * 0.3 * stretch)} -0.1 ${n(side * 0.3 * stretch + 0.11)} 0.02`}
            fill="none"
            key={side}
            stroke={feature}
            strokeLinecap="round"
            strokeWidth={0.04}
          />
        )
      )}
      {[-1, 1].map((side) => (
        <ellipse
          cx={side * 0.5 * stretch}
          cy={0.24}
          fill={paint.pink}
          key={`cheek-${side}`}
          opacity={0.3}
          rx={0.12}
          ry={0.07}
        />
      ))}
      <path
        d="M-0.05 0.14Q0 0.13 0.05 0.14Q0.04 0.19 0 0.2Q-0.04 0.19-0.05 0.14Z"
        fill={paint.pinkDeep}
      />
      <path
        d="M0 0.2Q-0.03 0.29-0.1 0.27M0 0.2Q0.03 0.29 0.1 0.27"
        fill="none"
        stroke={feature}
        strokeLinecap="round"
        strokeWidth={0.025}
      />
      {[-1, 1].map((side) => (
        <path
          d={`M${n(side * 0.42 * stretch)} 0.16L${n(side * 0.75 * stretch)} 0.1M${n(side * 0.42 * stretch)} 0.22L${n(side * 0.76 * stretch)} 0.24`}
          fill="none"
          key={`whisker-${side}`}
          opacity={0.45}
          stroke={feature}
          strokeLinecap="round"
          strokeWidth={0.015}
        />
      ))}
    </>
  );
};

const matsutakeArt = (art: Art, id: string) => {
  const curl = art.phase;
  const L = art.w;
  const cap = art.h;
  const margin = at(curl, L * CAP_AT, 0);
  const reach = L * (1 - CAP_AT);
  const dome = (k: number) =>
    `M0 ${n(-cap * k)}A${n(reach * k)} ${n(cap * k)} 0 0 1 0 ${n(cap * k)}`;
  return (
    <>
      <defs>
        <radialGradient cx="0.1" cy="0.4" id={`${id}-cap`} r="0.9">
          <stop offset="0" stopColor={paint.cap} />
          <stop offset="0.6" stopColor={paint.cap} />
          <stop offset="1" stopColor={paint.capDeep} />
        </radialGradient>
      </defs>
      {art.grains.map((grain) => (
        <path
          d={`M${n(grain.x)} ${n(grain.y)}q${n(grain.r * 0.5)} ${n(Math.sin(grain.a) * 0.02)} ${n(grain.r)} 0`}
          fill="none"
          key={`${grain.x}-${grain.y}`}
          opacity={0.6}
          stroke={paint.fibre}
          strokeLinecap="round"
          strokeWidth={0.018}
          transform={`rotate(${spin(curl, grain.x)} ${n(grain.x)} ${n(grain.y)})`}
        />
      ))}
      <g
        transform={`translate(${n(margin.x)} ${n(margin.y)}) rotate(${spin(curl, L * CAP_AT)})`}
      >
        <rect
          fill={paint.capDeep}
          height={cap * 2.2}
          opacity={0.3}
          width={0.12}
          x={-0.14}
          y={-cap * 1.1}
        />
        <path d={`${dome(1.1)}Z`} fill={`url(#${id}-cap)`} />
        {[0.82, 0.62, 0.42].map((k) => (
          <path
            d={dome(k)}
            fill="none"
            key={k}
            opacity={0.35}
            stroke={paint.capDeep}
            strokeDasharray="0.05 0.035"
            strokeLinecap="round"
            strokeWidth={0.024}
          />
        ))}
        <path
          d={`M0.03 ${n(-cap * 0.96)}Q0.09 0 0.03 ${n(cap * 0.96)}`}
          fill="none"
          opacity={0.55}
          stroke={paint.mushroom}
          strokeLinecap="round"
          strokeWidth={0.035}
        />
      </g>
    </>
  );
};

export const stickSvg = (stick: Stick) => {
  const dx = stick.to.x - stick.from.x;
  const dy = stick.to.y - stick.from.y;
  const length = Math.hypot(dx, dy) || 1;
  const side = {
    x: (-dy / length) * (stick.width / 2),
    y: (dx / length) * (stick.width / 2),
  };
  const neck = {
    x: stick.to.x - (dx / length) * stick.width * 2,
    y: stick.to.y - (dy / length) * stick.width * 2,
  };
  const d = `M${n(stick.from.x + side.x)} ${n(stick.from.y + side.y)}L${n(neck.x + side.x)} ${n(neck.y + side.y)}L${n(stick.to.x)} ${n(stick.to.y)}L${n(neck.x - side.x)} ${n(neck.y - side.y)}L${n(stick.from.x - side.x)} ${n(stick.from.y - side.y)}Z`;
  return (
    <>
      <path
        d={d}
        fill={paint.dark}
        opacity={0.22}
        transform="translate(0.03 0.05)"
      />
      <path
        d={d}
        fill={paint.stick}
        stroke={paint.stickDeep}
        strokeWidth={0.008}
      />
      <path
        d={`M${n(stick.from.x + side.x * 0.4)} ${n(stick.from.y + side.y * 0.4)}L${n(neck.x + side.x * 0.4)} ${n(neck.y + side.y * 0.4)}`}
        opacity={0.5}
        stroke={paint.light}
        strokeWidth={stick.width * 0.18}
      />
    </>
  );
};

export const arts: Record<Kind, (art: Art, id: string) => ReactNode> = {
  castella: castellaArt,
  chikuwa: chikuwaArt,
  daifuku: daifukuArt,
  dango: dangoArt,
  dorayaki: dorayakiArt,
  ebiten: ebitenArt,
  edamame: edamameArt,
  fuji: fujiArt,
  gyoza: gyozaArt,
  kagami: kagamiArt,
  kaki: kakiArt,
  kamaboko: kamabokoArt,
  kashiwa: kashiwaArt,
  kintai: kintaiArt,
  kuri: kuriArt,
  maki: makiArt,
  matsutake: matsutakeArt,
  mikan: mikanArt,
  naruto: narutoArt,
  nasu: nasuArt,
  neko: nekoArt,
  nerikiri: nerikiriArt,
  nikan: nikanArt,
  ninjin: ninjinArt,
  onigiri: onigiriArt,
  rakugan: rakuganArt,
  sanma: sanmaArt,
  senbei: senbeiArt,
  sushi: sushiArt,
  taiyaki: (art) => taiyakiArt(art, false),
  takenoko: takenokoArt,
  tofu: tofuArt,
  yakitori: yakitoriArt,
  yokan: yokanArt,
};
