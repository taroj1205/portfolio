import { spillageOf } from "../_lib/liquid";
import type { Bottle } from "../_lib/pour";
import {
  LIFT,
  backWall,
  box,
  crestMark,
  domeOutline,
  face,
  grain,
  joints,
  level,
  paint,
  poolOutline,
  project,
  radiusAt,
  rimOf,
  ring,
  sideWalls,
  stamp,
  tumbler,
  vesselScale,
  vessels,
} from "../_lib/scene";
import type { Fill, Point } from "../_lib/scene";

const H = box.height;
const GLASS_TOP = box.floor + tumbler.height;
const TAU = Math.PI * 2;
const SETTLED = 60;

const round = (value: number) => Math.round(value * 100) / 100;

const pathOf = (points: readonly Point[], close = true) =>
  points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${round(point.x)} ${round(point.y)}`
    )
    .join("") + (close ? "Z" : "");

const curveOf = ([from, mid, to]: readonly [Point, Point, Point]) =>
  `M${round(from.x)} ${round(from.y)}Q${round(mid.x)} ${round(mid.y)} ${round(to.x)} ${round(to.y)}`;

export interface Spill {
  seed: number;
  ml: number;
}

interface CupProps {
  id: string;
  fill: Fill;
  spill: Spill | null;
}

const glassSvg = (id: string, fill: Fill) => {
  const { glass } = fill;
  if (glass === null) {
    return null;
  }
  const base = box.floor + tumbler.base;
  const r = radiusAt(glass.level);
  const filled = glass.level > base + 0.2;
  return (
    <>
      <path
        d={pathOf([
          ...ring(GLASS_TOP, tumbler.top, Math.PI, TAU),
          ...ring(box.floor, tumbler.bottom, 0, Math.PI),
        ])}
        fill={`url(#${id}-glass)`}
      />
      {filled ? (
        <>
          <path
            d={pathOf([
              ...ring(glass.level, r, Math.PI, TAU),
              ...ring(base, radiusAt(base), 0, Math.PI),
            ])}
            fill={paint.sakeDeep}
            fillOpacity="0.55"
          />
          <path
            d={pathOf(ring(glass.level + glass.dome * 0.6, r))}
            fill={paint.amber}
            fillOpacity="0.62"
          />
          <path
            d={pathOf(
              ring(glass.level + glass.dome * 0.6, r, 0, Math.PI),
              false
            )}
            fill="none"
            stroke={paint.sheen}
            strokeOpacity="0.85"
            strokeWidth="0.4"
          />
        </>
      ) : null}
      {glass.over ? (
        <path
          d={pathOf([
            ...ring(GLASS_TOP, tumbler.top + 0.5, 0, Math.PI),
            ...ring(
              Math.max(fill.level, box.floor),
              radiusAt(Math.max(fill.level, box.floor)) + 0.5,
              Math.PI,
              0
            ),
          ])}
          fill={paint.sake}
          fillOpacity="0.18"
        />
      ) : null}
      <path
        d={pathOf(ring(GLASS_TOP, tumbler.top))}
        fill="none"
        stroke={paint.glass}
        strokeOpacity="0.7"
        strokeWidth="0.55"
      />
      <path
        d={pathOf(
          [
            project(-(tumbler.top - 2.5), GLASS_TOP - 4, 2),
            project(-(tumbler.bottom - 2), box.floor + 8, 2),
          ],
          false
        )}
        stroke={paint.glass}
        strokeOpacity="0.5"
        strokeWidth="1.4"
      />
    </>
  );
};

const rimSvg = (id: string, side: -1 | 1) => {
  const rim = rimOf(side);
  return (
    <>
      <path
        d={pathOf([...rim.outer, ...rim.inner])}
        fill={`url(#${id}-rim${side < 0 ? "Back" : "Front"})`}
      />
      {rim.ends.map((end) => (
        <path
          d={pathOf(end)}
          fill={paint.endGrain}
          fillOpacity="0.55"
          key={`${end[0]?.x}`}
        />
      ))}
    </>
  );
};

const defsSvg = (id: string, top: number) => {
  const back = rimOf(-1).outer;
  const front = rimOf(1).outer;
  const surface = level(box.floor);
  return (
    <defs>
      <radialGradient id={`${id}-shadow`}>
        <stop offset="0" stopColor={paint.shadow} stopOpacity="0.75" />
        <stop offset="0.55" stopColor={paint.shadow} stopOpacity="0.35" />
        <stop offset="1" stopColor={paint.shadow} stopOpacity="0" />
      </radialGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-face`}
        x1="0"
        x2="0"
        y1={face[0]?.y}
        y2={face[3]?.y}
      >
        <stop offset="0" stopColor={paint.woodLight} />
        <stop offset="0.35" stopColor={paint.wood} />
        <stop offset="1" stopColor={paint.woodDark} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-rimBack`}
        x1="0"
        x2="0"
        y1={back[1]?.y}
        y2={back[0]?.y}
      >
        <stop offset="0" stopColor={paint.woodDark} />
        <stop offset="1" stopColor={paint.wood} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-rimFront`}
        x1="0"
        x2="0"
        y1={front[1]?.y}
        y2={front[0]?.y}
      >
        <stop offset="0" stopColor={paint.woodLight} />
        <stop offset="1" stopColor={paint.wood} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-wall`}
        x1="0"
        x2="0"
        y1={backWall[0]?.y}
        y2={surface[0]?.y}
      >
        <stop offset="0" stopColor={paint.inner} />
        <stop offset="1" stopColor={paint.innerDark} />
      </linearGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-sake`}
        x1="0"
        x2="0"
        y1={top}
        y2={project(0, box.floor, box.inner).y}
      >
        <stop offset="0" stopColor={paint.sheen} stopOpacity="0.85" />
        <stop offset="0.04" stopColor={paint.mirror} stopOpacity="0.72" />
        <stop offset="0.3" stopColor={paint.amber} stopOpacity="0.72" />
        <stop offset="0.7" stopColor={paint.sakeDeep} stopOpacity="0.7" />
        <stop offset="1" stopColor={paint.amber} stopOpacity="0.82" />
      </linearGradient>
      <linearGradient id={`${id}-glass`} x1="0" x2="1" y1="0" y2="0">
        <stop offset="0" stopColor={paint.glass} stopOpacity="0.2" />
        <stop offset="0.2" stopColor={paint.glass} stopOpacity="0.05" />
        <stop offset="0.9" stopColor={paint.glass} stopOpacity="0.16" />
        <stop offset="1" stopColor={paint.glass} stopOpacity="0.05" />
      </linearGradient>
      <linearGradient id={`${id}-band`} x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor={paint.sheen} stopOpacity="0.95" />
        <stop offset="0.15" stopColor={paint.straw} stopOpacity="0.6" />
        <stop offset="0.5" stopColor={paint.sake} stopOpacity="0.5" />
        <stop offset="0.88" stopColor={paint.sakeDeep} stopOpacity="0.72" />
        <stop offset="1" stopColor={paint.amber} stopOpacity="0.92" />
      </linearGradient>
      <radialGradient id={`${id}-glint`}>
        <stop offset="0" stopColor={paint.sheen} stopOpacity="0.75" />
        <stop offset="0.5" stopColor={paint.sheen} stopOpacity="0.25" />
        <stop offset="1" stopColor={paint.sheen} stopOpacity="0" />
      </radialGradient>
      <linearGradient
        gradientUnits="userSpaceOnUse"
        id={`${id}-mirror`}
        x1="0"
        x2="0"
        y1={face[3]?.y}
        y2={(face[3]?.y ?? 0) + ((face[3]?.y ?? 0) - (face[0]?.y ?? 0)) * 0.8}
      >
        <stop offset="0" stopColor={paint.woodLight} stopOpacity="0.45" />
        <stop offset="0.45" stopColor={paint.wood} stopOpacity="0.28" />
        <stop offset="1" stopColor={paint.wood} stopOpacity="0" />
      </linearGradient>
    </defs>
  );
};

const liquidSvg = (id: string, fill: Fill) => {
  const domed = fill.dome > 0;
  const dome = domed ? domeOutline(fill.dome) : null;
  const surface = dome === null ? level(fill.level) : dome.outline;
  const glint =
    dome === null
      ? project(-12, fill.level, -16)
      : project(-12, H + fill.dome * LIFT * 0.92, -18);
  return (
    <>
      <clipPath id={`${id}-liquid`}>
        <path d={pathOf(surface)} />
      </clipPath>
      <path d={pathOf(surface)} fill={`url(#${id}-sake)`} />
      <ellipse
        clipPath={`url(#${id}-liquid)`}
        cx={round(glint.x)}
        cy={round(glint.y)}
        fill={`url(#${id}-glint)`}
        rx="26"
        ry="2.6"
      />
      {dome === null ? null : (
        <path
          d={pathOf(dome.upper, false)}
          fill="none"
          stroke={paint.sheen}
          strokeOpacity="0.75"
          strokeWidth="0.4"
        />
      )}
    </>
  );
};

const domeFrontSvg = (id: string, fill: Fill) => {
  if (fill.dome <= 0) {
    return null;
  }
  const dome = domeOutline(fill.dome);
  return (
    <>
      <path
        d={pathOf([...dome.crest, ...dome.lower])}
        fill={`url(#${id}-band)`}
      />
      <path
        d={pathOf(dome.crest, false)}
        fill="none"
        stroke={paint.sheen}
        strokeOpacity="0.95"
        strokeWidth="0.4"
      />
      <path
        d={pathOf(dome.lower, false)}
        fill="none"
        stroke={paint.straw}
        strokeOpacity="0.55"
        strokeWidth="0.9"
      />
    </>
  );
};

const poolSvg = (
  id: string,
  spillage: ReturnType<typeof spillageOf>,
  spill: Spill
) => {
  const outline = poolOutline(spillage.pool, spillage.start, spill.seed);
  const shine = project(
    spillage.start * 0.4 - spillage.pool * 0.3,
    0,
    box.outer + spillage.pool * 0.7
  );
  return (
    <>
      <clipPath id={`${id}-pool`}>
        <path d={pathOf(outline)} />
      </clipPath>
      <path d={pathOf(outline)} fill={paint.amber} fillOpacity="0.3" />
      <g clipPath={`url(#${id}-pool)`}>
        <rect
          fill={`url(#${id}-mirror)`}
          height={round(((face[3]?.y ?? 0) - (face[0]?.y ?? 0)) * 0.8)}
          width={round((face[2]?.x ?? 0) - (face[3]?.x ?? 0))}
          x={round(face[3]?.x ?? 0)}
          y={round(face[3]?.y ?? 0)}
        />
        <ellipse
          cx={round(shine.x)}
          cy={round(shine.y)}
          fill={`url(#${id}-glint)`}
          rx={round(spillage.pool * 0.9 + 6)}
          ry={round(spillage.pool * 0.1 + 0.7)}
        />
      </g>
      <path
        d={pathOf(outline.slice(3, 22), false)}
        fill="none"
        stroke={paint.sheen}
        strokeOpacity="0.7"
        strokeWidth="0.45"
      />
    </>
  );
};

export const cupSvg = ({ id, fill, spill }: CupProps) => {
  const shadow = project(0, 0, 4);
  const spillage =
    spill === null
      ? null
      : spillageOf(spill.seed, () => spill.ml, SETTLED, H, box.outer);
  const top =
    fill.dome > 0
      ? Math.min(...domeOutline(fill.dome).upper.map((point) => point.y))
      : (level(fill.level)[0]?.y ?? 0);
  return (
    <>
      {defsSvg(id, top)}
      <ellipse
        cx={shadow.x}
        cy={shadow.y}
        fill={`url(#${id}-shadow)`}
        rx="78"
        ry="33"
      />
      {spillage === null || spill === null
        ? null
        : poolSvg(id, spillage, spill)}
      {rimSvg(id, -1)}
      <path d={pathOf(level(box.floor))} fill={paint.innerDark} />
      {sideWalls.map((wall) => (
        <path d={pathOf(wall)} fill={paint.innerDark} key={`${wall[0]?.x}`} />
      ))}
      <path d={pathOf(backWall)} fill={`url(#${id}-wall)`} />
      {liquidSvg(id, fill)}
      {glassSvg(id, fill)}
      <path d={pathOf(face)} fill={`url(#${id}-face)`} />
      {grain.map((line) => (
        <path
          d={curveOf(line.points)}
          fill="none"
          key={`${line.points[0].y}`}
          stroke={paint.grain}
          strokeOpacity={line.alpha}
          strokeWidth={line.width}
        />
      ))}
      {joints.map((joint) => (
        <path
          d={pathOf(joint)}
          fill={paint.endGrain}
          fillOpacity="0.7"
          key={`${joint[0]?.x}-${joint[0]?.y}`}
        />
      ))}
      <ellipse
        cx={stamp.x}
        cy={stamp.y}
        fill="none"
        rx="11.5"
        ry="11"
        stroke={paint.brand}
        strokeOpacity="0.62"
        strokeWidth="1.1"
      />
      <path
        d={crestMark(6.5)}
        fill="none"
        stroke={paint.brand}
        strokeOpacity="0.62"
        strokeWidth="1.4"
      />
      {rimSvg(id, 1)}
      <path
        d={pathOf(face.slice(0, 2), false)}
        stroke={paint.sheen}
        strokeOpacity="0.55"
        strokeWidth="0.45"
      />
      {domeFrontSvg(id, fill)}
      {spillage === null
        ? null
        : spillage.rivulets.map((rivulet) => (
            <path
              d={pathOf(
                rivulet.path.map((bead) =>
                  project(bead.x, bead.y, box.outer + 0.3)
                ),
                false
              )}
              fill="none"
              key={rivulet.x}
              stroke={paint.woodShade}
              strokeLinecap="round"
              strokeOpacity="0.3"
              strokeWidth={round(1.5 + 3 * rivulet.share)}
            />
          ))}
    </>
  );
};

export const vesselTransform = (bottle: Bottle, at: Point, tilt: number) => {
  const vessel = vessels[bottle];
  const angle =
    ((vessel.rest + (vessel.tip - vessel.rest) * tilt) * 180) / Math.PI;
  return `translate(${round(at.x)} ${round(at.y)}) scale(${-vesselScale} ${vesselScale}) rotate(${round(angle)}) translate(${-vessel.lip.x} ${-vessel.lip.y})`;
};

export const vesselPath = (bottle: Bottle) =>
  pathOf(vessels[bottle].outline.map(([x, y]) => ({ x, y })));
