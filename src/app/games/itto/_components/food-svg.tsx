import { isCutEdge } from "../_lib/cut";
import type { Chunk, Face, Split } from "../_lib/cut";
import type { Food } from "../_lib/foods";
import { clip, flip, signedArea } from "../_lib/geometry";
import type { Line, Point } from "../_lib/geometry";
import { arts, n, stickSvg } from "./food-art";
import { looks, paint } from "./food-looks";
import type { Look } from "./food-looks";

const LEAN = 0.32;

const depthOf = (look: Look) => ({ x: look.depth * LEAN, y: look.depth });

const ring = (points: readonly Point[]) =>
  points.length === 0
    ? ""
    : `M${points.map((p) => `${n(p.x)} ${n(p.y)}`).join("L")}Z`;

const rings = (chunks: readonly Chunk[]) =>
  chunks.map((chunk) => ring(chunk.points)).join("");

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

const placed = (food: Food, p: Point) => {
  const angle = (food.place.turn * Math.PI) / 180;
  const { scale } = food.place;
  return {
    x: (p.x * Math.cos(angle) - p.y * Math.sin(angle)) * scale + food.place.x,
    y: (p.x * Math.sin(angle) + p.y * Math.cos(angle)) * scale + food.place.y,
  };
};

const spotOf = (food: Food, part: number) => {
  const unit = food.parts.length > 1 ? food.art.units[part] : undefined;
  return unit === undefined
    ? { r: 1, x: 0, y: 0 }
    : { ...placed(food, unit), r: unit.r * food.place.scale };
};

const lightDefs = (scene: string, food: Food, parts: readonly number[]) => (
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
    {parts.map((part) => {
      const spot = spotOf(food, part);
      return (
        <g key={part}>
          <radialGradient
            cx={n(spot.x)}
            cy={n(spot.y)}
            gradientUnits="userSpaceOnUse"
            id={`${scene}-dome-${part}`}
            r={n(spot.r * 1.02)}
          >
            <stop offset="0.55" stopColor={paint.dark} stopOpacity={0} />
            <stop offset="1" stopColor={paint.dark} stopOpacity={0.2} />
          </radialGradient>
          <radialGradient
            cx={n(spot.x - spot.r * 0.42)}
            cy={n(spot.y - spot.r * 0.5)}
            gradientUnits="userSpaceOnUse"
            id={`${scene}-gloss-${part}`}
            r={n(spot.r * 0.42)}
          >
            <stop offset="0" stopColor={paint.light} stopOpacity={0.55} />
            <stop offset="1" stopColor={paint.light} stopOpacity={0} />
          </radialGradient>
        </g>
      );
    })}
    <filter height="3" id={`${scene}-blur`} width="3" x="-1" y="-1">
      <feGaussianBlur stdDeviation={0.045} />
    </filter>
  </defs>
);

const BOUNDS: Point[] = [
  { x: -4, y: -4 },
  { x: 4, y: -4 },
  { x: 4, y: 4 },
  { x: -4, y: 4 },
];

const keyOf = (chunk: Chunk) =>
  `${chunk.part}-${n(chunk.points[0]?.x ?? 0)}-${n(chunk.points[0]?.y ?? 0)}`;

interface PieceProps {
  id: string;
  food: Food;
  chunks: readonly Chunk[];
  split: Split | null;
  faces: readonly Face[];
  half: Line | null;
}

export const pieceSvg = ({
  id,
  food,
  chunks,
  split,
  faces,
  half,
}: PieceProps) => {
  const lookOf = (part: number) => looks[food.kind](food.art, part);
  const line = split?.line ?? null;
  const parts = [...new Set(chunks.map((chunk) => chunk.part))];
  const { stick } = food.art;
  return (
    <g>
      {lightDefs(id, food, parts)}
      <defs>
        <clipPath id={`${id}-top`}>
          <path d={rings(chunks)} />
        </clipPath>
        {half === null ? null : (
          <clipPath id={`${id}-half`}>
            <path d={ring(clip(BOUNDS, half))} />
          </clipPath>
        )}
      </defs>
      {chunks.map((chunk) => (
        <path
          d={sweep(
            shift(chunk.points, { x: 0.035, y: 0.05 }),
            depthOf(lookOf(chunk.part)),
            null
          )}
          fill={paint.dark}
          filter={`url(#${id}-blur)`}
          key={`shadow-${keyOf(chunk)}`}
          opacity={0.3}
        />
      ))}
      {stick === null ? null : (
        <g clipPath={half === null ? undefined : `url(#${id}-half)`}>
          <g transform={placeOf(food)}>{stickSvg(stick)}</g>
        </g>
      )}
      {chunks.map((chunk) => {
        const look = lookOf(chunk.part);
        const by = depthOf(look);
        return (
          <g key={`sides-${keyOf(chunk)}`}>
            {look.sides.map((band) => (
              <path
                d={sweep(chunk.points, scaled(by, band.to), line)}
                fill={band.colour}
                key={band.to}
              />
            ))}
            <path
              d={sweep(chunk.points, by, line)}
              fill={paint.dark}
              opacity={0.12}
            />
          </g>
        );
      })}
      {faces.map((face) => {
        const look = lookOf(face.part);
        const by = depthOf(look);
        return (
          <g key={`face-${n(face.from.x)}-${n(face.from.y)}`}>
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
        );
      })}
      <g clipPath={`url(#${id}-top)`}>
        {chunks.map((chunk) => (
          <path
            d={ring(chunk.points)}
            fill={lookOf(chunk.part).top}
            key={`top-${keyOf(chunk)}`}
          />
        ))}
        <g transform={placeOf(food)}>{arts[food.kind](food.art, id)}</g>
        {chunks.map((chunk) => {
          const look = lookOf(chunk.part);
          const top = ring(chunk.points);
          return (
            <g key={`light-${keyOf(chunk)}`}>
              {look.round ? (
                <path d={top} fill={`url(#${id}-dome-${chunk.part})`} />
              ) : null}
              <path
                d={top}
                fill={`url(#${id}-light)`}
                opacity={Math.min(1, look.gloss * 0.8)}
              />
              {look.gloss > 1 ? (
                <path
                  d={top}
                  fill={`url(#${id}-gloss-${chunk.part})`}
                  opacity={look.gloss - 0.6}
                />
              ) : null}
              <path
                d={top}
                fill="none"
                opacity={0.45}
                stroke={look.rim}
                strokeWidth={0.05}
              />
            </g>
          );
        })}
      </g>
      {faces.map((face) => (
        <path
          d={`M${n(face.from.x)} ${n(face.from.y)}L${n(face.to.x)} ${n(face.to.y)}`}
          key={`edge-${n(face.from.x)}-${n(face.from.y)}`}
          opacity={0.7}
          stroke={paint.light}
          strokeLinecap="round"
          strokeWidth={0.012}
        />
      ))}
    </g>
  );
};

export const tagAt = (side: Split["sides"][number], apart: number) => {
  const gap = Math.hypot(side.push.x, side.push.y) || 1;
  const nx = side.push.x / gap;
  const ny = side.push.y / gap;
  let reach = 0;
  for (const { points } of side.chunks) {
    for (const p of points) {
      reach = Math.max(
        reach,
        (p.x - side.centre.x) * nx + (p.y - side.centre.y) * ny
      );
    }
  }
  const out = 0.08 + reach * 0.5;
  return {
    x: side.centre.x + side.push.x * apart + nx * out,
    y: side.centre.y + side.push.y * apart + ny * out,
  };
};

const wholeOf = (food: Food): Chunk[] =>
  food.parts.map((points, part) => ({ part, points }));

export const layersOf = (split: Split) => {
  const [plus, minus] = split.sides;
  const back = split.line.nx * LEAN + split.line.ny < 0;
  return [
    {
      faces: split.faces,
      half: back ? split.line : flip(split.line),
      key: back ? "plus" : "minus",
      side: back ? plus : minus,
      turn: back ? 1 : -1,
    },
    {
      faces: [],
      half: back ? flip(split.line) : split.line,
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
        chunks: wholeOf(food),
        faces: [],
        food,
        half: null,
        id: scene,
        split: null,
      })
    : layersOf(split).map(({ faces, half, key, side }) => (
        <g
          key={key}
          transform={`translate(${n(side.push.x * apart)} ${n(side.push.y * apart)})`}
        >
          {pieceSvg({
            chunks: side.chunks,
            faces,
            food,
            half,
            id: `${scene}-${key}`,
            split,
          })}
        </g>
      ));
